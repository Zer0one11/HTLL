const { redis } = require('./db_kv_utils');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Метод не разрешен.' });
    }

    const { list: listName } = req.query;

    if (!listName) {
        return res.status(400).json({ success: false, message: 'Отсутствует параметр list.' });
    }

    try {
        const key = `list:${listName}`;
        
        // Получаем весь список (хранится как JSON-строка)
        const rawData = await redis.get(key);
        
        let levels = [];

        if (rawData) {
            // Парсим JSON-строку обратно в массив объектов
            levels = JSON.parse(rawData);
        } else {
            // Возвращаем пустой массив, если список не найден
            console.log(`Список ${listName} не найден в Redis. Возвращаем пустой массив.`);
        }

        return res.status(200).json({ success: true, list: levels });

    } catch (error) {
        console.error('Ошибка загрузки списка:', error.message);
        return res.status(500).json({ success: false, message: 'Ошибка сервера при загрузке списка.' });
 
    }
};
