const { redis } = require('./db_kv_utils');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Метод не разрешен.' });
    }

    const { listName, number, name, creator, fps, fv, gd_id, type, showcase } = req.body;

    if (!listName || !number || !name || !creator) {
        return res.status(400).json({ success: false, message: 'Отсутствуют обязательные поля.' });
    }

    try {
        const key = `list:${listName}`;
        const rawData = await redis.get(key);
        let levels = rawData ? JSON.parse(rawData) : [];

        const newLevel = {
            listName,
            number: parseInt(number),
            name,
            creator,
            fps: fps || '',
            fv: fv || '',
            gd_id: gd_id || '',
            type: type || '',
            showcase: showcase || ''
        };

        // --- Логика сдвига уровней (Redis) ---
        // 1. Увеличиваем номер на 1 для всех уровней с номером >= newLevel.number
        levels = levels.map(level => {
            if (level.number >= newLevel.number) {
                return { ...level, number: level.number + 1 };
            }
            return level;
        });

        // 2. Вставляем новый уровень
        levels.push(newLevel);
        
        // 3. Сортируем массив по номеру (чтобы новый уровень занял свое место)
        levels.sort((a, b) => a.number - b.number);
        
        // 4. Сохраняем обратно в Redis
        await redis.set(key, JSON.stringify(levels));

        return res.status(200).json({ success: true, message: 'Уровень успешно добавлен.' });

    } catch (error) {
        console.error('Ошибка добавления уровня:', error.message);
        return res.status(500).json({ success: false, message: 'Ошибка сервера при добавлении уровня.' });
        
    }
};
