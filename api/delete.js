// api/delete.js

import { loadList, saveList, checkAuth } from './db_kv_utils.js'; // <-- ИСПРАВЛЕНО: .js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Метод не разрешен.' });
    }

    try {
        const { listName, number, auth } = req.body;

        if (!await checkAuth(auth)) {
            return res.status(401).json({ success: false, message: 'Неавторизованный доступ.' });
        }

        const deleteNumber = parseInt(number);
        if (!listName || isNaN(deleteNumber) || deleteNumber <= 0) {
            return res.status(400).json({ success: false, message: 'Отсутствует listName или неверный номер уровня.' });
        }
        
        const list = await loadList(listName);
        if (list === null) {
            return res.status(404).json({ success: false, message: `Список ${listName} не найден.` });
        }
        
        if (deleteNumber > list.length) {
            return res.status(404).json({ success: false, message: `Уровень №${deleteNumber} не существует в списке.` });
        }
        
        const deletedLevel = list.splice(deleteNumber - 1, 1); 

        for (let i = deleteNumber - 1; i < list.length; i++) {
            list[i].number = i + 1;
        }

        const success = await saveList(listName, list);

        if (success) {
            const deletedName = deletedLevel[0] ? deletedLevel[0].name : 'Уровень';
            return res.status(200).json({ success: true, message: `${deletedName} (№${deleteNumber}) успешно удален.` });
        } else {
            return res.status(500).json({ success: false, message: 'Ошибка сохранения в базу данных.' });
        }

    } catch (error) {
        console.error('Ошибка при удалении уровня:', error);
        return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера.' })
            ;
    }
}
