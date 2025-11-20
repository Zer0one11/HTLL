// api/delete.js
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

    const { listName, levelNumber, auth } = req.body;
    const numberToDelete = parseInt(levelNumber);

    // 1. Проверка авторизации
    try {
        if (!(await checkAuth(auth.login, auth.password))) {
             return res.status(401).json({ success: false, message: 'Ошибка авторизации.' });
        }
    } catch (error) {
         return res.status(500).json({ success: false, message: 'Ошибка проверки авторизации.' });
    }
    
    if (!listName || isNaN(numberToDelete) || numberToDelete < 1) {
        return res.status(400).json({ success: false, message: 'Неверные данные для удаления.' });
    }

    try {
        // 2. Удаляем уровень, возвращая его имя
        const deletedResult = await sql`
            DELETE FROM levels
            WHERE list_name = ${listName} AND number = ${numberToDelete}
            RETURNING name;
        `;
        
        if (deletedResult.rows.length === 0) {
             return res.status(404).json({ success: false, message: `Уровень №${numberToDelete} не найден в списке ${listName.toUpperCase()}.` });
        }
        
        const deletedLevelName = deletedResult.rows[0].name;

        // 3. Перенумеровываем оставшиеся уровни (уменьшаем номер у всех, кто был ниже)
        await sql`
            UPDATE levels
            SET number = number - 1
            WHERE list_name = ${listName} AND number > ${numberToDelete};
        `;

        res.status(200).json({ success: true, message: `Уровень "${deletedLevelName}" (№${numberToDelete}) успешно удален из ${listName.toUpperCase()}.` });

    } catch (error) {
        console.error(`Ошибка удаления из DB:`, error);
        res.status(500).json({ success: false, message: 'Ошибка сервера при удалении уровня.' });

}
};
