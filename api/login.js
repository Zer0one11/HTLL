// api/login.js

const fs = require('fs/promises');
const path = require('path');

// Указываем путь к файлу admins.json относительно корня проекта
const ADMINS_FILE = path.join(process.cwd(), 'admins.json');

/**
 * Проверяет учетные данные пользователя.
 */
async function checkAuth(login, password) {
    try {
        const data = await fs.readFile(ADMINS_FILE, 'utf-8');
        const admins = JSON.parse(data);
        
        const user = admins.find(
            a => a.login === login && a.password === password
        );
        
        return !!user;
    } catch (error) {
        console.error('Ошибка при чтении admins.json:', error);
        return false;
    }
}

// Главная функция-обработчик для Vercel
module.exports = async (req, res) => {
    // Vercel автоматически разбирает тело запроса, если Content-Type: application/json
    const { login, password } = req.body; 

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Метод не разрешен.' });
    }

    if (!login || !password) {
        return res.status(400).json({ success: false, message: 'Отсутствует логин или пароль.' });
    }

    const isAuthenticated = await checkAuth(login, password);

    if (isAuthenticated) {
        res.status(200).json({ success: true, message: 'Авторизация успешна.' });
    } else {
        res.status(401).json({ success: false, message: 'Неверный логин или пароль.' });

    }
};
