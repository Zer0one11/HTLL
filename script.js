// ====================================================================
// ========================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
// ====================================================================

const listElement = document.getElementById('level-list');
const mainTitle = document.getElementById('main-title');
const listButtons = document.querySelectorAll('.list-button');
const listContainer = document.getElementById('list-container');
const adminPanelContainer = document.getElementById('admin-panel-container');
const authContainer = document.getElementById('auth-container');
const loginForm = document.getElementById('login-form');
const addLevelForm = document.getElementById('add-level-form');
const deleteLevelForm = document.getElementById('delete-level-form');
const adminMessage = document.getElementById('admin-message');
const adminCurrentListTitle = document.getElementById('admin-current-list-title');

// Хранит текущие учетные данные администратора после успешного входа
let adminAuth = {
    login: '',
    password: ''
};

// Хранит текущий список, который редактируется в админ-панели
let currentAdminList = '';

// Карта для сопоставления ID списка с названием заголовка
const listMap = {
    'levels': { title: 'TPLL LIST' },
    'ppll': { title: 'PPLL LIST' },
    'sll': { title: 'SLL LIST' },
    'ill': { title: 'ILL LIST' },
    'inf': { title: 'INF LIST' }
};

// ====================================================================
// ======================== УПРАВЛЕНИЕ СПИСКАМИ =======================
// ====================================================================

// Инициализация: Загрузка списка по умолчанию
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, есть ли сохраненный логин в сессии
    const savedLogin = sessionStorage.getItem('admin_login');
    const savedPassword = sessionStorage.getItem('admin_password');

    if (savedLogin && savedPassword) {
        adminAuth.login = savedLogin;
        adminAuth.password = savedPassword;
        showAdminPanel();
    } else {
        loadList('levels'); // Загружаем список по умолчанию
    }
});


/**
 * Загружает и отображает данные списка из API.
 * @param {string} listId - Идентификатор списка ('levels', 'ppll', и т.д.).
 */
function loadList(listId) {
    // Предотвращаем загрузку, если открыта админ-панель
    if (adminPanelContainer.style.display === 'block') return;

    const listData = listMap[listId];
    mainTitle.textContent = listData.title;

    // Обновление активной кнопки
    listButtons.forEach(btn => {
        btn.classList.remove('active-list');
        if (btn.dataset.list === listId) {
            btn.classList.add('active-list');
        }
    });
    
    listElement.innerHTML = `<p class="loading-text">Загрузка списка...</p>`;

    // --- Новый API-маршрут для загрузки из DB ---
    fetch(`/api/load?list=${listId}`) 
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка загрузки данных для ${listId}: Статус ${response.status}`);
            }
            return response.json(); 
        })
        .then(levels => {
            listElement.innerHTML = '';
            
            if (levels.length === 0) {
                listElement.innerHTML = `<p style="text-align: center;">Список пуст.</p>`;
                return;
            }
            
            levels.forEach(level => {
                const li = document.createElement('li');
                li.className = 'level-item';

                // gd_id из базы данных мы выбираем как ID
                
                const levelType = level.type ? `<li><span class="detail-label">Type:</span> ${level.type}</li>` : '';
                // Проверка на "экстремальный" FPS (например, формулы или очень длинная строка)
                const isExtreme = level.fps.length > 15 || level.fps.includes('^') || level.fps.includes('↑') || level.fps === 'idk';
                const fpsClass = isExtreme ? 'extreme-fps-value' : '';
                
                li.innerHTML = `
                    <div class="level-header">
                        <span class="level-number">${level.number}.</span>
                        <a href="${level.showcase}" target="_blank" class="level-name">${level.name}</a>
                        <span class="level-creator">by ${level.creator}</span>
                    </div>
                    <ul class="level-details">
                        <li class="detail-line-full"><span class="detail-label">FPS:</span> <span class="${fpsClass}">${level.fps}</span></li>
                        <li class="detail-line-full"><span class="detail-label">ID:</span> ${level.id}</li>
                        <li><span class="detail-label">FV:</span> ${level.fv}</li>
                        ${levelType}
                        <li>
                            <a href="${level.showcase}" target="_blank" class="showcase-link">
                                Showcase
                            </a>
                        </li>
                    </ul>
                `;

                listElement.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Ошибка при загрузке списка:', error);
            listElement.innerHTML = `<p style="color: red; text-align: center;">Ошибка загрузки: Проблема с DB или API.</p>`;
        });
}

// Назначаем обработчик для всех кнопок списка
listButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        loadList(e.target.dataset.list);
    });
});

// ====================================================================
// ======================= АДМИН-АВТОРИЗАЦИЯ ==========================
// ====================================================================

/**
 * Переключает отображение между списком и панелью администратора.
 */
function showAdminPanel() {
    // Скрываем список, показываем админ-панель
    listContainer.style.display = 'none';
    adminPanelContainer.style.display = 'block';

    // Скрываем/показываем формы входа
    if (adminAuth.login) {
        authContainer.style.display = 'none';
        document.getElementById('admin-tools').style.display = 'block';
        adminMessage.textContent = `Добро пожаловать, ${adminAuth.login}!`;
        // Запускаем режим редактирования для списка по умолчанию
        startAdminEdit('levels'); 
    } else {
        authContainer.style.display = 'block';
        document.getElementById('admin-tools').style.display = 'none';
    }
}

/**
 * Обрабатывает отправку формы входа.
 */
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const login = e.target.login.value;
    const password = e.target.password.value;
    
    adminMessage.textContent = 'Попытка входа...';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ login, password })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            adminMessage.textContent = `Успешный вход!`;
            adminAuth.login = login;
            adminAuth.password = password;
            // Сохраняем в сессии, чтобы не вводить пароль при перезагрузке
            sessionStorage.setItem('admin_login', login);
            sessionStorage.setItem('admin_password', password); 
            showAdminPanel();
        } else {
            adminMessage.textContent = `Ошибка: ${result.message || 'Неверный логин или пароль.'}`;
        }
    } catch (error) {
        console.error('Ошибка сети/сервера:', error);
        adminMessage.textContent = 'Ошибка сервера при входе.';
    }
});

// Нажатие на кнопку "Админ Панель"
document.getElementById('admin-btn').addEventListener('click', () => {
    showAdminPanel();
});

// Нажатие на кнопку "Назад к списку"
document.getElementById('back-to-list-btn').addEventListener('click', () => {
    adminPanelContainer.style.display = 'none';
    listContainer.style.display = 'block';
    loadList('levels'); 
});

// ====================================================================
// ======================= АДМИН-ФУНКЦИИ ==============================
// ====================================================================

/**
 * Запускает режим редактирования для выбранного списка.
 * @param {string} listId - Идентификатор списка.
 */
function startAdminEdit(listId) {
    currentAdminList = listId;
    const listTitle = listMap[listId] ? listMap[listId].title : listId.toUpperCase();
    adminCurrentListTitle.textContent = `Редактирование списка: ${listTitle}`;
    adminMessage.textContent = `Выбран список для редактирования: ${listId.toUpperCase()}`;
}

// Назначаем обработчик для кнопок редактирования списка в админ-панели
document.querySelectorAll('.admin-edit-button').forEach(button => {
    button.addEventListener('click', (e) => {
        startAdminEdit(e.target.dataset.list);
    });
});

/**
 * Обрабатывает отправку формы добавления уровня.
 */
addLevelForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentAdminList) {
        adminMessage.textContent = 'Ошибка: Сначала выберите список для редактирования!';
        return;
    }

    const levelData = {
        number: e.target.add_number.value,
        name: e.target.add_name.value,
        creator: e.target.add_creator.value,
        fps: e.target.add_fps.value,
        fv: e.target.add_fv.value,
        id: e.target.add_id.value,
        type: e.target.add_type.value || '', // Может быть пустым
        showcase: e.target.add_showcase.value
    };
    
    adminMessage.textContent = `Попытка добавить уровень ${levelData.number}. ${levelData.name} в ${currentAdminList.toUpperCase()}...`;

    try {
        const response = await fetch('/api/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                listName: currentAdminList, 
                levelData, 
                auth: adminAuth 
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            adminMessage.textContent = result.message;
            addLevelForm.reset(); 
        } else {
            // Отображаем сообщение об ошибке, полученное от сервера (например, "Ошибка авторизации")
            adminMessage.textContent = `Ошибка сервера: ${result.message || 'Неизвестная ошибка.'}`;
        }
    } catch (error) {
        console.error('Ошибка сети/сервера:', error);
        adminMessage.textContent = 'Ошибка сети или внутренней службы при добавлении уровня.';
    }
});

/**
 * Обрабатывает отправку формы удаления уровня.
 */
deleteLevelForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentAdminList) {
        adminMessage.textContent = 'Ошибка: Сначала выберите список для редактирования!';
        return;
    }

    const levelNumber = e.target.delete_number.value;
    
    adminMessage.textContent = `Попытка удалить уровень №${levelNumber} из ${currentAdminList.toUpperCase()}...`;

    try {
        const response = await fetch('/api/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                listName: currentAdminList, 
                levelNumber, 
                auth: adminAuth 
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            adminMessage.textContent = result.message;
            deleteLevelForm.reset(); 
        } else {
            adminMessage.textContent = `Ошибка удаления: ${result.message || 'Неизвестная ошибка.'}`;
        }
    } catch (error) {
        console.error('Ошибка сети/сервера:', error);
        adminMessage.textContent = 'Ошибка сети или внутренней службы при удалении уровня.';
    }
});

