// api/db_utils.js
const { sql } = require('@vercel/postgres');

/**
 * Инициализирует таблицы уровней и админов в базе данных.
 */
async function initializeDB() {
    try {
        // 1. Создание таблицы LEVELS
        await sql`
            CREATE TABLE IF NOT EXISTS levels (
                id SERIAL PRIMARY KEY,
                list_name VARCHAR(50) NOT NULL,
                number INTEGER NOT NULL,
                name VARCHAR(255) NOT NULL,
                creator VARCHAR(255),
                fps VARCHAR(255),
                fv VARCHAR(255),
                gd_id VARCHAR(255),
                type VARCHAR(50),
                showcase VARCHAR(255)
            );
        `;

        // 2. Создание таблицы ADMINS
        await sql`
            CREATE TABLE IF NOT EXISTS admins (
                login VARCHAR(50) PRIMARY KEY,
                password VARCHAR(255) NOT NULL
            );
        `;
        
        // 3. Добавление тестового админа (если его нет)
        const result = await sql`SELECT COUNT(*) FROM admins WHERE login = 'admin';`;
        if (result.rows[0].count === '0') {
             // Используйте свой реальный пароль!
             await sql`
                INSERT INTO admins (login, password)
                VALUES ('admin', '123'); 
            `;
            console.log("Добавлен тестовый админ: admin/123");
        }
        
        console.log("Таблицы базы данных успешно инициализированы.");
        return true;
    } catch (error) {
        console.error("Ошибка инициализации базы данных:", error);
        return false;
    }
}

// Запускаем инициализацию при импорте
initializeDB();

module.exports = {
    sql // Экспортируем sql для выполнения запросов

};
