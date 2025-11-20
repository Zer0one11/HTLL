// api/load.js
const { sql } = require('./db_utils');

module.exports = async (req, res) => {
    // Получаем имя списка из параметров запроса (req.query)
    const listName = req.query.list; 

    if (!listName) {
        return res.status(400).json({ success: false, message: 'Не указан listName.' });
    }

    try {
        const result = await sql`
            SELECT 
                number, name, creator, fps, fv, gd_id AS id, type, showcase 
            FROM levels
            WHERE list_name = ${listName}
            ORDER BY number ASC;
        `;
        
        // Vercel Postgres возвращает rows (строки)
        res.status(200).json(result.rows); 

    } catch (error) {
        console.error(`Ошибка загрузки списка ${listName} из DB:`, error);
        res.status(500).json({ success: false, message: 'Ошибка сервера при загрузке списка.' });
    
    }
};
