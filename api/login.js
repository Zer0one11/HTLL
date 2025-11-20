// api/login.js
const { sql } = require('./db_utils');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Метод не разрешен.' });
    }

    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({ success: false, message: 'Отсутствует логин или пароль.' });
    }

    try {
        // Запрос к таблице admins
        const result = await sql`
            SELECT login FROM admins
            WHERE login = ${login} AND password = ${password}
        `;

        if (result.rows.length > 0) {
            res.status(200).json({ success: true, message: 'Авторизация успешна.' });
        } else {
            res.status(401).json({ success: false, message: 'Неверный логин или пароль.' });
        }
    } catch (error) {
        console.error('Ошибка авторизации DB:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера при авторизации.' });
   
    }
};
