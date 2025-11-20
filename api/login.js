// api/login.js

import { getAdminPassword } from './db_kv_utils';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Метод не разрешен.' });
    }

    try {
        const { login, password } = req.body;

        if (!login || !password) {
            return res.status(400).json({ success: false, message: 'Логин и пароль обязательны.' });
        }
        
        // 1. Приводим логин к нижнему регистру (на всякий случай, если пользователь ввел 'Admin')
        const lowercaseLogin = login.toLowerCase(); 

        // 2. Получаем пароль из Redis
        const storedPassword = await getAdminPassword(lowercaseLogin); 

        // 3. Проверка: Пароль должен быть найден И СОВПАДАТЬ
        // Убедитесь, что пароль в Redis - это СТРОКА "123"
        if (!storedPassword || storedPassword !== password) {
            
            // Если пароль не совпадает или не найден, возвращаем 401
            return res.status(401).json({ success: false, message: 'Неверный логин или пароль.' });
        }
        
        // Успешная авторизация
        return res.status(200).json({ success: true, message: 'Авторизация прошла успешно!' });

    } catch (error) {
        console.error('Ошибка в процессе авторизации:', error);
        return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера.' });

    }
}
