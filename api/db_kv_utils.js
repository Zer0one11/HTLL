const { Redis } = require('@upstash/redis');

// Используем переменные окружения Vercel (Upstash/Redis)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function initializeData() {
    try {
        // Проверяем, существует ли администратор
        const adminKey = 'admins:admin';
        const adminData = await redis.hgetall(adminKey);
        
        if (!adminData || Object.keys(adminData).length === 0) {
            // Добавляем тестового администратора (admin:123)
            await redis.hset(adminKey, { password: '123' });
            console.log('Тестовый администратор добавлен: admin/123');
        } else {
            console.log('Администратор уже существует.');
        }
        
    } catch (error) {
        // Лог ошибки, но не блокируем, если Redis временно недоступен
        console.error('Ошибка инициализации Redis:', error.message);
    }
}

// Запускаем инициализацию при загрузке API-функций
initializeData();

module.exports = { redis
                 };
