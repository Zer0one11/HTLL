const { redis } = require('./db_kv_utils');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Метод не разрешен.' });
    }

    try {
        const { login, password } = req.body;

        if (!login || !password) {
            return res.status(400).json({ success: false, message: 'Отсутствует логин или пароль.' });
        }

        // Ключ администратора: admins:логин
        const adminKey = `admins:${login}`;
        const adminData = await redis.hgetall(adminKey);
        
        if (adminData && adminData.password === password) {
            return res.status(200).json({ success: true, message: 'Вход успешен.' });
        } else {
            return res.status(401).json({ success: false, message: 'Неверный логин или пароль.' });
        }

    } catch (error) {
        console.error('Ошибка входа:', error.message);
        return res.status(500).json({ success: false, message: 'Ошибка сервера при попытке входа.' });
   
    }
};
