// api/update.js
export default async function handler(req, res) {
    // Настройки твоего репозитория
    const OWNER = 'Zer0one11';
    const REPO = 'HTLL';
    const GITHUB_TOKEN = process.env.GH_TOKEN; // Берется из настроек Vercel

    // Проверка наличия токена
    if (!GITHUB_TOKEN) {
        return res.status(500).json({ error: 'GH_TOKEN не настроен в Vercel Settings' });
    }

    // ЛОГИКА ЗАГРУЗКИ ДАННЫХ (GET запрос)
    if (req.method === 'GET') {
        const { fileName } = req.query;
        if (!fileName) return res.status(400).json({ error: 'Не указан файл' });

        try {
            const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${fileName}?t=${Date.now()}`, {
                headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
            });

            if (!response.ok) throw new Error('Файл не найден на GitHub');

            const data = await response.json();
            // Декодируем из Base64 с поддержкой кириллицы
            const content = decodeURIComponent(escape(atob(data.content)));
            
            return res.status(200).json({ content });
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    // ЛОГИКА СОХРАНЕНИЯ ДАННЫХ (POST запрос)
    if (req.method === 'POST') {
        const { login, password, fileName, newData } = req.body;

        // Проверка прав доступа
        if (login !== 'HELFZz' || password !== 'creep000') {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        try {
            // 1. Получаем SHA текущего файла (нужно для обновления в GitHub)
            const getFile = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${fileName}`, {
                headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
            });
            
            if (!getFile.ok) throw new Error('Не удалось получить SHA файла');
            const fileData = await getFile.json();

            // 2. Кодируем новые данные в Base64
            const newContentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2))));

            // 3. Отправляем обновление в GitHub
            const updateResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${fileName}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Admin Update: ${fileName}`,
                    content: newContentBase64,
                    sha: fileData.sha
                })
            });

            if (updateResponse.ok) {
                return res.status(200).json({ success: true });
            } else {
                const errData = await updateResponse.json();
                return res.status(500).json({ error: errData.message });
            }
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Если метод не GET и не POST
    return res.status(405).json({ error: 'Method Not Allowed' });
}

