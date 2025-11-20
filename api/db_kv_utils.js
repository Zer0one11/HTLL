// api/db_kv_utils.js

import { Redis } from '@upstash/redis';

// Инициализация клиента Redis с использованием переменных окружения Vercel
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// ====================================================================
// ========================== АДМИН-ФУНКЦИИ ===========================
// ====================================================================

/**
 * Получает пароль для данного администратора из базы данных.
 * Использует HGET для чтения поля 'password' из хэша 'admins:login'.
 * @param {string} login - Логин администратора (например, 'admin').
 * @returns {Promise<string|null>} Пароль в виде строки или null, если не найден.
 */
export async function getAdminPassword(login) {
    try {
        const key = `admins:${login}`;
        
        // Читаем поле 'password' из хэша 'admins:admin'
        const result = await redis.hget(key, 'password'); 
        
        if (result === null) {
             console.log(`Администратор ${login} не найден.`);
             return null;
        }
        
        console.log(`Успешно получен пароль для ${login}.`);
        return result; 
        
    } catch (error) {
        console.error('Ошибка при получении пароля администратора:', error);
        return null;
    }
}


// ====================================================================
// ========================== ФУНКЦИИ СПИСКОВ =========================
// ====================================================================

/**
 * Загружает весь список уровней по его имени.
 * @param {string} listName - Имя списка (например, 'levels', 'ppll').
 * @returns {Promise<object|null>} Объект списка или null.
 */
export async function loadList(listName) {
    try {
        const data = await redis.get(listName);
        if (data === null) {
            console.log(`Список ${listName} не найден.`);
            return null;
        }
        return JSON.parse(data);
    } catch (error) {
        console.error(`Ошибка при загрузке списка ${listName}:`, error);
        return null;
    }
}

// Добавьте сюда функции saveList, addLevel, deleteLevel после того, как убедитесь,
// что авторизация р
аботает.
