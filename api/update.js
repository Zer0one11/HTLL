export default async function handler(req, res) {
    const OWNER = 'Zer0one11';
    const REPO = 'HTLL';
    const GITHUB_TOKEN = process.env.GH_TOKEN;

    if (!GITHUB_TOKEN) return res.status(500).json({ error: 'GH_TOKEN not found' });

    const ALLOWED_FILES = ['levels.json', 'ppll.json', 'sll.json', 'ill.json', 'inf.json', 'scl.json', 'icl.json'];

    // Читаем пользователей из Vercel ADMIN_USERS
    let allowedUsers = [];
    if (process.env.ADMIN_USERS) {
        allowedUsers = process.env.ADMIN_USERS.split(',').map(s => {
            const [u, p] = s.split(':');
            return { u, p };
        });
    } else {
        return res.status(500).json({ error: 'ADMIN_USERS variable is empty in Vercel' });
    }

    const sanitizeStr = (val) => {
        if (typeof val !== 'string') return '';
        return val.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
    };

    if (req.method === 'GET') {
        const { fileName } = req.query;
        if (!fileName || !ALLOWED_FILES.includes(fileName)) {
            return res.status(400).json({ error: 'Invalid file name' });
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

        if (typeof login !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ error: 'Invalid data types' });
        }

        const isValid = allowedUsers.some(user => user.u === login && user.p === password);
        if (!isValid) return res.status(401).json({ error: 'Access Denied' });

        if (action === 'verify') {
            return res.status(200).json({ success: true });
        }

        if (!fileName || !ALLOWED_FILES.includes(fileName) || !Array.isArray(newData)) {
            return res.status(400).json({ error: 'Invalid request data' });
        }

        const sanitizedData = newData.map(item => ({
            number: sanitizeStr(item.number),
            name: sanitizeStr(item.name),
            creator: sanitizeStr(item.creator),
            fps: sanitizeStr(item.fps),
            id: sanitizeStr(item.id),
            fv: sanitizeStr(item.fv),
            type: sanitizeStr(item.type),
            showcase: sanitizeStr(item.showcase)
        }));

        try {
            const getFile = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${fileName}`, {
                headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
            });
            const fileData = await getFile.json();

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
}
