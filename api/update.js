export default async function handler(req, res) {
    const OWNER = 'Zer0one11';
    const REPO = 'HTLL';
    const GITHUB_TOKEN = process.env.GH_TOKEN;

    if (!GITHUB_TOKEN) return res.status(500).json({ error: 'GH_TOKEN not found' });

    // Список разрешенных файлов (Защита от перезаписи других файлов репозитория)
    const ALLOWED_FILES = ['levels.json', 'ppll.json', 'sll.json', 'ill.json', 'inf.json', 'scl.json', 'icl.json'];

    let allowedUsers = [];
    if (process.env.ADMIN_USERS) {
        allowedUsers = process.env.ADMIN_USERS.split(',').map(s => {
            const [u, p] = s.split(':');
            return { u, p };
        });
    } else {
        allowedUsers = [
            { u: 'helfz', p: 'creep000eer' },
            { u: 'Xeniss', p: '09.11.2001Zz' }
        ];
    }

    // Хелпер для очистки строк от опасных HTML тегов (Защита от XSS инъекций)
    const sanitizeStr = (val) => {
        if (typeof val !== 'string') return '';
        return val.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
    };

    if (req.method === 'GET') {
        const { fileName } = req.query;
        
        // Проверка имени файла
        if (!fileName || !ALLOWED_FILES.includes(fileName)) {
            return res.status(400).json({ error: 'Invalid or disallowed file name' });
        }

        try {
            const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${fileName}?t=${Date.now()}`, {
                headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
            });
            const data = await response.json();
            const content = decodeURIComponent(escape(atob(data.content)));
            return res.status(200).json({ content });
        } catch (e) { return res.status(500).json({ error: e.message }); }
    }

    if (req.method === 'POST') {
        const { action, login, password, fileName, newData } = req.body;

        // Защита от подмены типов данных
        if (typeof login !== 'string' || typeof password !== 'string' || typeof fileName !== 'string') {
            return res.status(400).json({ error: 'Bad Request: Invalid data types' });
        }

        // Авторизация
        const isValid = allowedUsers.some(user => user.u === login && user.p === password);
        if (!isValid) return res.status(401).json({ error: 'Access Denied' });

        if (action === 'verify') {
            return res.status(200).json({ success: true });
        }

        // Строгая проверка файла перед записью
        if (!ALLOWED_FILES.includes(fileName)) {
            return res.status(403).json({ error: 'Action forbidden for this file' });
        }

        // Проверка и фильтрация структуры входящего JSON (newData)
        if (!Array.isArray(newData)) {
            return res.status(400).json({ error: 'newData must be an array' });
        }

        const sanitizedData = [];
        
        for (const item of newData) {
            if (!item || typeof item !== 'object') {
                return res.status(400).json({ error: 'Invalid level structure detected' });
            }

            // Собираем объект заново, фильтруя только разрешенные поля и очищая текст
            sanitizedData.push({
                number: sanitizeStr(item.number),
                name: sanitizeStr(item.name),
                creator: sanitizeStr(item.creator),
                fps: sanitizeStr(item.fps),
                id: sanitizeStr(item.id),
                fv: sanitizeStr(item.fv),
                type: sanitizeStr(item.type),
                showcase: sanitizeStr(item.showcase)
            });
        }

        try {
            const getFile = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${fileName}`, {
                headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
            });
            const fileData = await getFile.json();

            // Сохраняем уже очищенные и проверенные данные
            const jsonString = JSON.stringify(sanitizedData, null, 2);
            const newContentBase64 = btoa(unescape(encodeURIComponent(jsonString)));

            const updateResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${fileName}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Secure update by ${login}`,
                    content: newContentBase64,
                    sha: fileData.sha
                })
            });

            if (updateResponse.ok) return res.status(200).json({ success: true });
            else {
                const err = await updateResponse.json();
                return res.status(500).json({ error: err.message });
            }
        } catch (error) { return res.status(500).json({ error: error.message }); }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}
