// api/db_kv_utils.js

import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// ========================== АДМИН-ФУНКЦИИ ===========================

export async function getAdminPassword(login) {
    try {
        const key = `admins:${login}`;
        const result = await redis.hget(key, 'password'); 
        
        if (result === null) {
             return null;
        }
        return result; 
        
    } catch (error) {
        console.error('Ошибка при получении пароля администратора:', error);
        return null;
    }
}

export async function checkAuth({ login, password }) {
    if (!login || !password) {
        return false;
    }
    // Используем login.toLowerCase() для соответствия ключу admins:admin
    const storedPassword = await getAdminPassword(login.toLowerCase());
    return storedPassword && storedPassword === password;
}

// ========================== ФУНКЦИИ СПИСКОВ =========================

export async function loadList(listName) {
    try {
        const data = await redis.get(listName);
        if (data === null) {
            return null;
        }
        return JSON.parse(data);
    } catch (error) {
        console.error(`Ошибка при загрузке списка ${listName}:`, error);
        return null;
    }
}

export async function saveList(listName, listData) {
    try {
        await redis.set(listName, JSON.stringify(listData));
        return true;
    } catch (error) {
        console.error(`Ошибка при сохранении списка ${listName}:`, error);
        return false;
        
    }
}
