export default async function handler(req, res) {
    const OWNER = 'Zer0one11';
    const REPO = 'HTLL';
    const GITHUB_TOKEN = process.env.GH_TOKEN;

    if (!GITHUB_TOKEN) return res.status(500).json({ error: 'GH_TOKEN not found' });

    // Парсим пользователей из Vercel, либо используем жестко прописанный массив ниже
    let allowedUsers = [];
    if (process.env.ADMIN_USERS) {
        allowedUsers = process.env.ADMIN_USERS.split(',').map(s => {
            const [u, p] = s.split(':');
            return { u, p };
        });
    } else {
        // Оставлены только два нужных аккаунта
        allowedUsers = [
            { u: 'helfz', p: 'creep000eer' },
            { u: 'Xeniss', p: '09.11.2001Zz' }
        ];
    }

    if (req.method === 'GET') {
        const { fileName } = req.query;
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

        const isValid = allowedUsers.some(user => user.u === login && user.p === password);
        if (!isValid) return res.status(401).json({ error: 'Access Denied' });

        if (action === 'verify') {
            return res.status(200).json({ success: true });
        }

        try {
            const getFile = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${fileName}`, {
                headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
            });
            const fileData = await getFile.json();

            const jsonString = JSON.stringify(newData, null, 2);
            const newContentBase64 = btoa(unescape(encodeURIComponent(jsonString)));

            const updateResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${fileName}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Update by ${login}`,
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
