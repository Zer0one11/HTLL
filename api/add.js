// api/add.js
const { sql } = require('./db_utils');

// Вспомогательная функция для проверки авторизации
async function checkAuth(login, password) {
    const result = await sql`
        SELECT login FROM admins
        WHERE login = ${login} AND password = ${password}
    `;
    return result.rows.length > 0;
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Метод не разрешен.' });
    }
    
    const { listName, levelData, auth } = req.body;

    // 1. Проверка авторизации
    try {
        if (!(await checkAuth(auth.login, auth.password))) {
             return res.status(401).json({ success: false, message: 'Ошибка авторизации.' });
        }
    } catch (error) {
         return res.status(500).json({ success: false, message: 'Ошибка проверки авторизации.' });
    }

    // 2. Валидация
    const newNumber = parseInt(levelData.number);
    if (!listName || isNaN(newNumber) || newNumber < 1) {
        return res.status(400).json({ success: false, message: 'Некорректные данные.' });
    }

    try {
        // 3. Сдвигаем все уровни ниже, увеличивая их номер на 1
        await sql`
            UPDATE levels
            SET number = number + 1
            WHERE list_name = ${listName} AND number >= ${newNumber};
        `;

        // 4. Добавляем новый уровень
        await sql`
            INSERT INTO levels 
            (list_name, number, name, creator, fps, fv, gd_id, type, showcase)
            VALUES (
                ${listName}, 
                ${newNumber}, 
                ${levelData.name}, 
                ${levelData.creator}, 
                ${levelData.fps}, 
                ${levelData.fv}, 
                ${levelData.id}, 
                ${levelData.type}, 
                ${levelData.showcase}
            );
        `;

        res.status(200).json({ success: true, message: `Уровень "${levelData.name}" успешно добавлен в ${listName.toUpperCase()}.` });

    } catch (error) {
        console.error(`Ошибка добавления в DB:`, error);
        res.status(500).json({ success: false, message: 'Ошибка сервера при добавлении уровня.' });

    }
};
