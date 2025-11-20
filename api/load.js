// api/load.js

import { loadList } from './db_kv_utils.js'; // <-- ИСПРАВЛЕНО: .js

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Метод не разрешен.' });
    }

    try {
        const listName = req.query.list || 'levels';
        
        const listData = await loadList(listName);

        if (listData === null) {
            return res.status(200).json({ success: true, list: [] });
        }
        
        return res.status(200).json({ success: true, list: listData });

    } catch (error) {
        console.error('Ошибка при загрузке списка:', error);
        return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера.' });
  
    }
}
