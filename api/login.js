// api/login.js

import { getAdminPassword } from './db_kv_utils.js'; // <-- ИСПРАВЛЕНО: .js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Метод не разрешен.' });
    }

    try {
        const { login, password } = req.body;

        if (!login || !password) {
            return res.status(400).json({ success: false, message: 'Логин и пароль обязательны.' });
        }
        
        const lowercaseLogin = login.toLowerCase(); 

        const storedPassword = await getAdminPassword(lowercaseLogin); 

        if (!storedPassword || storedPassword !== password) {
            return res.status(401).json({ success: false, message: 'Неверный логин или пароль.' });
        }
        
        return res.status(200).json({ success: true, message: 'Авторизация прошла успешно!' });

    } catch (error) {
        console.error('Ошибка в процессе авторизации:', error);
        return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера.' });

    }
}
