// server.js
const express = require('express');
const fs = require('fs/promises'); // Используем fs/promises для асинхронной работы с файлами
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// ===================================
// 1. НАСТРОЙКА MIDDLEWARE
// ===================================

// Обслуживание статических файлов (HTML, CSS, JS, JSON)
app.use(express.static(path.join(__dirname)));

// Используем body-parser для обработки JSON-запросов
app.use(bodyParser.json());


// ===================================
// 2. АВТОРИЗАЦИЯ
// ===================================

const ADMINS_FILE = path.join(__dirname, 'admins.json');

/**
 * Проверяет учетные данные пользователя.
 */
async function checkAuth(login, password) {
    try {
        const data = await fs.readFile(ADMINS_FILE, 'utf-8');
        const admins = JSON.parse(data);
        
        // Находим пользователя с совпадающими логином и паролем
        const user = admins.find(
            a => a.login === login && a.password === password
        );
        
        return !!user; // Возвращаем true, если пользователь найден, иначе false
    } catch (error) {
        console.error('Ошибка при чтении admins.json:', error);
        return false;
    }
}

app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({ success: false, message: 'Отсутствует логин или пароль.' });
    }

    const isAuthenticated = await checkAuth(login, password);

    if (isAuthenticated) {
        // В реальном приложении здесь нужно выдать JWT-токен или сессию. 
        // Для простоты, просто подтверждаем успех.
        res.json({ success: true, message: 'Авторизация успешна.' });
    } else {
        res.status(401).json({ success: false, message: 'Неверный логин или пароль.' });
    }
});


// ===================================
// 3. УТИЛИТЫ ДЛЯ JSON ФАЙЛОВ
// ===================================

/**
 * Читает и парсит JSON-файл.
 */
async function readJsonFile(listName) {
    const filePath = path.join(__dirname, `${listName}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
}

/**
 * Записывает данные обратно в JSON-файл.
 */
async function writeJsonFile(listName, data) {
    const filePath = path.join(__dirname, `${listName}.json`);
    // Используем форматирование для читаемости (null, 2)
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}


// ===================================
// 4. ДОБАВЛЕНИЕ УРОВНЯ
// ===================================

app.post('/api/add', async (req, res) => {
    const { listName, levelData, auth } = req.body;

    // Проверка авторизации (пропускаем для простоты, но должно быть здесь)
    if (!(await checkAuth(auth.login, auth.password))) {
         return res.status(401).json({ success: false, message: 'Ошибка авторизации.' });
    }
    
    // Проверка наличия имени листа
    if (!listName || !levelData) {
        return res.status(400).json({ success: false, message: 'Неверные данные листа или уровня.' });
    }

    try {
        const list = await readJsonFile(listName);

        // Преобразование номера в число (должно быть сделано на клиенте, но проверим тут)
        const newNumber = parseInt(levelData.number);
        if (isNaN(newNumber) || newNumber < 1) {
             return res.status(400).json({ success: false, message: 'Некорректный номер уровня.' });
        }

        // 1. Увеличиваем номера всех уровней, которые будут ниже нового
        list.forEach(level => {
            if (parseInt(level.number) >= newNumber) {
                level.number = parseInt(level.number) + 1;
            }
        });

        // 2. Добавляем новый уровень
        levelData.number = newNumber; // Убедимся, что номер - число для правильной сортировки
        list.splice(newNumber - 1, 0, levelData);
        
        // 3. Пересортировываем и перенумеровываем (для чистоты)
        list.sort((a, b) => parseInt(a.number) - parseInt(b.number));
        list.forEach((level, index) => {
            level.number = index + 1;
        });

        await writeJsonFile(listName, list);

        res.json({ success: true, message: `Уровень "${levelData.name}" успешно добавлен в ${listName.toUpperCase()}.` });

    } catch (error) {
        console.error(`Ошибка добавления в ${listName}.json:`, error);
        res.status(500).json({ success: false, message: 'Ошибка сервера при добавлении уровня.' });
    }
});


// ===================================
// 5. УДАЛЕНИЕ УРОВНЯ
// ===================================

app.post('/api/delete', async (req, res) => {
    const { listName, levelNumber, auth } = req.body;
    
    // Проверка авторизации
    if (!(await checkAuth(auth.login, auth.password))) {
         return res.status(401).json({ success: false, message: 'Ошибка авторизации.' });
    }

    const numberToDelete = parseInt(levelNumber);

    if (!listName || isNaN(numberToDelete) || numberToDelete < 1) {
        return res.status(400).json({ success: false, message: 'Неверные данные для удаления.' });
    }

    try {
        const list = await readJsonFile(listName);
        
        // 1. Удаляем уровень
        const indexToDelete = list.findIndex(level => parseInt(level.number) === numberToDelete);
        
        if (indexToDelete === -1) {
             return res.status(404).json({ success: false, message: `Уровень №${numberToDelete} не найден в списке ${listName.toUpperCase()}.` });
        }
        
        const deletedLevel = list.splice(indexToDelete, 1)[0];

        // 2. Перенумеровываем оставшиеся уровни
        list.forEach((level, index) => {
            level.number = index + 1;
        });

        await writeJsonFile(listName, list);

        res.json({ success: true, message: `Уровень "${deletedLevel.name}" (№${numberToDelete}) успешно удален из ${listName.toUpperCase()}.` });

    } catch (error) {
        console.error(`Ошибка удаления из ${listName}.json:`, error);
        res.status(500).json({ success: false, message: 'Ошибка сервера при удалении уровня.' });
    }
});


// ===================================
// 6. ЗАПУСК СЕРВЕРА
// ===================================

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`Для доступа к сайту используйте эту ссылку.`);
});
