// api/add.js

const fs = require('fs/promises');
const path = require('path');

// Утилиты для работы с файлами
async function readJsonFile(listName) {
    const filePath = path.join(process.cwd(), `${listName}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
}

async function writeJsonFile(listName, data) {
    const filePath = path.join(process.cwd(), `${listName}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Вспомогательная функция для проверки авторизации (для API Functions)
async function checkAuth(login, password) {
    const ADMINS_FILE = path.join(process.cwd(), 'admins.json');
    try {
        const data = await fs.readFile(ADMINS_FILE, 'utf-8');
        const admins = JSON.parse(data);
        const user = admins.find(a => a.login === login && a.password === password);
        return !!user;
    } catch (error) {
        return false;
    }
}


module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Метод не разрешен.' });
    }
    
    const { listName, levelData, auth } = req.body;

    // 1. Проверка авторизации
    if (!(await checkAuth(auth.login, auth.password))) {
         return res.status(401).json({ success: false, message: 'Ошибка авторизации.' });
    }
    
    if (!listName || !levelData) {
        return res.status(400).json({ success: false, message: 'Неверные данные листа или уровня.' });
    }

    try {
        const list = await readJsonFile(listName);

        const newNumber = parseInt(levelData.number);
        if (isNaN(newNumber) || newNumber < 1) {
             return res.status(400).json({ success: false, message: 'Некорректный номер уровня.' });
        }

        // 2. Увеличиваем номера и добавляем уровень
        list.forEach(level => {
            if (parseInt(level.number) >= newNumber) {
                level.number = parseInt(level.number) + 1;
            }
        });

        levelData.number = newNumber;
        list.splice(newNumber - 1, 0, levelData);
        
        // 3. Пересортировываем и перенумеровываем (для чистоты)
        list.sort((a, b) => parseInt(a.number) - parseInt(b.number));
        list.forEach((level, index) => {
            level.number = index + 1;
        });

        await writeJsonFile(listName, list);

        res.status(200).json({ success: true, message: `Уровень "${levelData.name}" успешно добавлен в ${listName.toUpperCase()}.` });

    } catch (error) {
        // Логирование в консоль Vercel
        console.error(`Ошибка добавления в ${listName}.json:`, error); 
        res.status(500).json({ success: false, message: 'Ошибка сервера при добавлении уровня.'
                             });
    }
};
