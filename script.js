// script.js

// --- Глобальные переменные ---
const levelListElement = document.getElementById('levelList');
const listButtons = document.querySelectorAll('.list-button');
const themeButtons = document.querySelectorAll('.theme-button');
const mainContainer = document.querySelector('main'); 
const adminPanelContainer = document.getElementById('adminPanelContainer'); // Остается, но не используется

let currentList = 'levels'; // Список по умолчанию

// --- Вспомогательные функции ---

/**
 * Загружает список уровней с сервера (Vercel API).
 */
async function fetchLevelList(listName) {
    try {
        const response = await fetch(`/api/load?list=${listName}`);
        
        // Если API-функция не работает, возвращаем пустой список и выводим ошибку
        if (!response.ok) {
            console.error(`Ошибка API: ${response.status}`);
            return [];
        }
        
        const data = await response.json();
        
        if (data.success && data.list) {
            return data.list;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        // Специальное сообщение, если произошел сбой сети или сервера
        return { error: true };
    }
}

/**
 * Рендерит список уровней на страницу.
 */
function renderLevelList(list) {
    levelListElement.innerHTML = ''; // Очистка
    
    // Если произошла ошибка сети/сервера
    if (list.error) {
        levelListElement.innerHTML = '<div class="empty-list-message error-message">Ошибка загрузки: Проблема с DB или API.</div>';
        return;
    }

    if (list.length === 0) {
        levelListElement.innerHTML = '<div class="empty-list-message">Список пуст.</div>';
        return;
    }

    list.forEach(level => {
        const item = document.createElement('li');
        item.className = 'level-item';
        item.innerHTML = `
            <span class="level-number">${level.number}</span>
            <div class="level-info">
                <h3>${level.name}</h3>
                <p>Creator: ${level.creator}</p>
                <p>Verifier: ${level.verifier}</p>
            </div>
            <a href="https://gdbrowser.com/${level.gd_id}" target="_blank" class="level-link">Смотреть GD</a>
        `;
        levelListElement.appendChild(item);
    });
}

/**
 * Основная функция для обновления и отображения списка.
 */
async function updateLevelList(listName) {
    // 1. Установка активной кнопки
    listButtons.forEach(btn => {
        if (btn.dataset.list === listName) {
            btn.classList.add('active-list');
        } else {
            btn.classList.remove('active-list');
        }
    });

    // 2. Загрузка данных
    const listData = await fetchLevelList(listName);
    
    // 3. Отображение
    renderLevelList(listData);
}

// --- Обработчики событий ---

// 1. Переключение списка (TPLL, PPLL, SLL, ...)
listButtons.forEach(button => {
    button.addEventListener('click', () => {
        currentList = button.dataset.list;
        updateLevelList(currentList);
    });
});

// 2. Смена темы
themeButtons.forEach(button => {
    button.addEventListener('click', () => {
        const newTheme = button.dataset.theme;
        document.body.className = `theme-${newTheme}`;
        
        // Сохранение в Local Storage
        localStorage.setItem('theme', newTheme);

        // Обновление активной кнопки темы
        themeButtons.forEach(btn => {
            if (btn.dataset.theme === newTheme) {
                btn.classList.add('active-theme');
            } else {
                btn.classList.remove('active-theme');
            }
        });
    });
});

// 3. Загрузка темы из Local Storage
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        // Устанавливаем тему
        document.body.className = `theme-${savedTheme}`;
        
        // Обновляем активную кнопку
        themeButtons.forEach(btn => {
            btn.classList.remove('active-theme');
            if (btn.dataset.theme === savedTheme) {
                btn.classList.add('active-theme');
            }
        });
    }
}

// --- Инициализация ---

// Загрузка темы при старте
loadTheme(); 

// Первоначальная загрузка списка
updateLevelList(currentList);

// --- Функции, связанные с админ-панелью, удалены ---
/* function showAdminPanel() {...}
function generateLoginFormHTML() {...}
async function handleLoginSubmit(e) {...}
function showAdminTools() {...}
function handleToolSubmit() {...} 
*/
