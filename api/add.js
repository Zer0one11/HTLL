// api/add.js

import { loadList, saveList, checkAuth } from './db_kv_utils.js'; // <-- ИСПРАВЛЕНО: .js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Метод не разрешен.' });
    }

    try {
        const { listName, number, auth, ...levelData } = req.body;

        if (!await checkAuth(auth)) {
            return res.status(401).json({ success: false, message: 'Неавторизованный доступ.' });
        }

        if (!listName || !number || !levelData.name || !levelData.gd_id) {
            return res.status(400).json({ success: false, message: 'Отсутствуют обязательные поля (listName, number, name, gd_id).' });
        }
        
        const list = await loadList(listName);
        if (list === null) {
            return res.status(404).json({ success: false, message: `Список ${listName} не найден.` });
        }
        
        const newNumber = parseInt(number);
        const newLevel = { number: newNumber, ...levelData };

        list.splice(newNumber - 1, 0, newLevel); 

        for (let i = newNumber; i < list.length; i++) {
            list[i].number = i + 1;
        }

        const success = await saveList(listName, list);

        if (success) {
            return res.status(200).json({ success: true, message: `Уровень ${levelData.name} успешно добавлен в позицию ${newNumber}.` });
        } else {
            return res.status(500).json({ success: false, message: 'Ошибка сохранения в базу данных.' });
        }

    } catch (error) {
        console.error('Ошибка при добавлении уровня:', error);
        return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера.' }
                                   );
    }
}
