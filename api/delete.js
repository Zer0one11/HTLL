const { redis } = require('./db_kv_utils');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Метод не разрешен.' });
    }

    const { listName, number } = req.body;
    const numberToDelete = parseInt(number);

    if (!listName || !numberToDelete) {
        return res.status(400).json({ success: false, message: 'Отсутствуют обязательные параметры.' });
    }

    try {
        const key = `list:${listName}`;
        const rawData = await redis.get(key);
        let levels = rawData ? JSON.parse(rawData) : [];

        // 1. Фильтруем массив: удаляем уровень с заданным номером
        const initialLength = levels.length;
        levels = levels.filter(level => level.number !== numberToDelete);
        
        if (levels.length === initialLength) {
             return res.status(404).json({ success: false, message: 'Уровень не найден.' });
        }

        // 2. --- Логика сдвига вверх (Redis) ---
        // Уменьшаем номер на 1 для всех уровней, которые были ниже удаленного
        levels = levels.map(level => {
            if (level.number > numberToDelete) {
                return { ...level, number: level.number - 1 };
            }
            return level;
        });
        
        // 3. Сохраняем обратно в Redis
        await redis.set(key, JSON.stringify(levels));

        return res.status(200).json({ success: true, message: 'Уровень успешно удален.' });

    } catch (error) {
        console.error('Ошибка удаления уровня:', error.message);
        return res.status(500).json({ success: false, message: 'Ошибка сервера при удалении уровня.' });

    }
};
