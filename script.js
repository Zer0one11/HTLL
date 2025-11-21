// script.js (НОВАЯ ВЕРСИЯ БЕЗ API)

// --- Глобальные переменные (без изменений) ---
const levelListElement = document.getElementById('levelList');
const listButtons = document.querySelectorAll('.list-button');
const themeButtons = document.querySelectorAll('.theme-button');

let currentList = 'levels'; // Список по умолчанию

// --- Вспомогательные функции ---

/**
 * Загружает список уровней из СТАТИЧЕСКОГО JSON-файла.
 */
async function fetchLevelList(listName) {
    try {
        // Мы пытаемся загрузить файл: data/levels.json, data/ppll.json и т.д.
        const response = await fetch(`./data/${listName}.json`); 
        
        if (!response.ok) {
            // Если файл не существует (404), возвращаем пустой список
            if (response.status === 404) {
                 return [];
            }
            console.error(`Ошибка загрузки JSON: ${response.status}`);
            return { error: true };
        }
        
        const data = await response.json();
        return data.list || data; // Ожидаем, что файл содержит массив или объект с полем 'list'
    } catch (error) {
        console.error('Ошибка при обработке JSON-файла:', error);
        return { error: true };
    }
}

// Рендеринг списка (остальные функции остаются прежними)

function renderLevelList(list) {
    levelListElement.innerHTML = '';
    
    if (list.error) {
        levelListElement.innerHTML = '<div class="empty-list-message error-message">Ошибка загрузки: Проверьте файлы data/*.json.</div>';
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

// ... (остальные функции: updateLevelList, обработчики кнопок, loadTheme - БЕЗ ИЗМЕНЕНИЙ) ...

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

// ... (обработчики кнопок темы и списка) ...
listButtons.forEach(button => {
    button.addEventListener('click', () => {
        currentList = button.dataset.list;
        updateLevelList(currentList);
    });
});
// ... (loadTheme и инициализация) ...

// Инициализация
loadTheme(); 
updateLevelList(
    currentList);
