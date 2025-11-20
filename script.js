// ====================================================================
// ========================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
// ====================================================================

// --- ЭЛЕМЕНТЫ DOM (из index.html) ---
const listElement = document.getElementById('levelList'); 
const mainTitle = document.querySelector('.main-title');
const listButtons = document.querySelectorAll('.list-button');
const adminPanelButton = document.getElementById('adminPanelButton'); // Кнопка "Админ Панель"
const adminPanelContainer = document.getElementById('adminPanelContainer'); 

// --- ГЛОБАЛЬНОЕ СОСТОЯНИЕ ---
let adminAuth = {
    login: '',
    password: ''
};
let currentAdminList = 'levels'; // Список по умолчанию для редактирования

const listMap = {
    'levels': { title: 'TPLL LIST' },
    'ppll': { title: 'PPLL LIST' },
    'sll': { title: 'SLL LIST' },
    'ill': { title: 'ILL LIST' },
    'inf': { title: 'INF LIST' }
};

// ====================================================================
// ======================== ИНИЦИАЛИЗАЦИЯ И ПРИВЯЗКИ =====================
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Проверяем сохраненный логин и сразу открываем инструменты, если есть
    const savedLogin = sessionStorage.getItem('admin_login');
    const savedPassword = sessionStorage.getItem('admin_password');

    if (savedLogin && savedPassword) {
        adminAuth.login = savedLogin;
        adminAuth.password = savedPassword;
        showAdminPanel(true); 
    } else {
        loadList('levels'); 
    }
    
    // 2. ПРИВЯЗКА: Кнопка "Админ Панель"
    if (adminPanelButton) {
        adminPanelButton.addEventListener('click', () => {
            showAdminPanel();
        });
    }
    
    // 3. ПРИВЯЗКА: Кнопки переключения списков
    listButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            loadList(e.target.dataset.list);
        });
    });
    
    // 4. ПРИВЯЗКА: Кнопки переключения тем
    document.querySelectorAll('.theme-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const theme = e.target.dataset.theme;
            document.body.className = `theme-${theme}`;
            
            document.querySelectorAll('.theme-button').forEach(btn => btn.classList.remove('active-theme'));
            e.target.classList.add('active-theme');
        });
    });
});

// ====================================================================
// ======================== УПРАВЛЕНИЕ СПИСКАМИ (ФРОНТ) =================
// ====================================================================

/**
 * Загружает и отображает данные списка из API.
 */
function loadList(listId) {
    if (adminPanelContainer && adminPanelContainer.style.display === 'block') return;

    const listData = listMap[listId];
    if (mainTitle) mainTitle.textContent = listData.title;

    listButtons.forEach(btn => {
        btn.classList.remove('active-list');
        if (btn.dataset.list === listId) {
            btn.classList.add('active-list');
        }
    });
    
    if (listElement) listElement.innerHTML = `<p class="loading-text">Загрузка списка...</p>`;

    fetch(`/api/load?list=${listId}`) 
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка загрузки данных: Статус ${response.status}`);
            }
            return response.json(); 
        })
        .then(data => {
            const levels = data.list || []; 
            if (listElement) listElement.innerHTML = '';
            
            if (levels.length === 0 && listElement) {
                listElement.innerHTML = `<p style="text-align: center;">Список пуст.</p>`;
                return;
            }
            
            levels.forEach(level => {
                const li = document.createElement('li');
                li.className = 'level-item';
                
                const levelID = level.gd_id || 'N/A';
                const levelType = level.type ? `<li><span class="detail-label">Type:</span> ${level.type}</li>` : '';
                const isExtreme = level.fps && (level.fps.length > 15 || level.fps.includes('^') || level.fps.includes('↑') || level.fps === 'idk');
                const fpsClass = isExtreme ? 'extreme-fps-value' : '';
                
                li.innerHTML = `
                    <div class="level-header">
                        <span class="level-number">${level.number}.</span>
                        <a href="${level.showcase}" target="_blank" class="level-name">${level.name}</a>
                        <span class="level-creator">by ${level.creator}</span>
                    </div>
                    <ul class="level-details">
                        <li class="detail-line-full"><span class="detail-label">FPS:</span> <span class="${fpsClass}">${level.fps}</span></li>
                        <li class="detail-line-full"><span class="detail-label">ID:</span> ${levelID}</li>
                        <li><span class="detail-label">FV:</span> ${level.fv}</li>
                        ${levelType}
                        <li>
                            <a href="${level.showcase}" target="_blank" class="showcase-link">
                                Showcase
                            </a>
                        </li>
                    </ul>
                `;

                if (listElement) listElement.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Ошибка при загрузке списка:', error);
            if (listElement) listElement.innerHTML = `<p style="color: red; text-align: center;">Ошибка загрузки: Проблема с DB или API.</p>`;
        });
}

// ====================================================================
// ======================== ГЕНЕРАЦИЯ HTML АДМИН-ПАНЕЛИ ================
// ====================================================================

function generateLoginFormHTML(message = '') {
    return `
        <div id="authContainer" class="auth-container">
            <h2>Вход в Админ-панель</h2>
            <p id="adminMessage" style="color: ${message.includes('Ошибка') ? 'red' : 'green'};">${message || 'Введите учетные данные.'}</p>
            <form id="loginForm">
                <input type="text" name="login" placeholder="Логин" required>
                <input type="password" name="password" placeholder="Пароль" required>
                <button type="submit" class="admin-button">Войти</button>
            </form>
            <button id="backToListBtn" class="admin-button">← Назад к списку</button>
        </div>
    `;
}

function generateAdminToolsHTML() {
    const listTitle = listMap[currentAdminList] ? listMap[currentAdminList].title : currentAdminList.toUpperCase();
    
    return `
        <div id="adminTools" class="admin-tools">
            <h2 id="adminCurrentListTitle">Редактирование списка: ${listTitle}</h2>
            <p id="adminMessage" class="admin-status">Добро пожаловать, ${adminAuth.login}!</p>
            
            <div class="admin-controls">
                <button data-list="levels" class="admin-edit-button">TPLL</button>
                <button data-list="ppll" class="admin-edit-button">PPLL</button>
                <button data-list="sll" class="admin-edit-button">SLL</button>
            </div>
            
            <button id="backToListBtn" class="admin-button">← Назад к списку</button>
            <button id="logoutBtn" class="admin-button logout-button">Выйти</button>
            
            <h3>Добавить уровень</h3>
            <form id="addLevelForm" class="admin-form">
                <input type="number" name="add_number" placeholder="Номер (сдвинет последующие)" required>
                <input type="text" name="add_name" placeholder="Название" required>
                <input type="text" name="add_creator" placeholder="Создатель" required>
                <input type="text" name="add_fps" placeholder="FPS (720, idk, etc.)">
                <input type="text" name="add_fv" placeholder="FV (Final Victor)">
                <input type="text" name="add_id" placeholder="GD ID" required>
                <input type="text" name="add_type" placeholder="Type (2p, Old Version, etc.)">
                <input type="text" name="add_showcase" placeholder="Ссылка на Showcase" required>
                <button type="submit" class="add-button">Добавить уровень</button>
            </form>

            <h3>Удалить уровень</h3>
            <form id="deleteLevelForm" class="admin-form">
                <input type="number" name="delete_number" placeholder="Номер уровня для удаления" required>
                <button type="submit" class="delete-button">Удалить уровень</button>
            </form>
        </div>
    `;
}

// ====================================================================
// ======================= АДМИН-АВТОРИЗАЦИЯ И УПРАВЛЕНИЕ =================
// ====================================================================

/**
 * Переключает отображение между списком и панелью администратора.
 */
function showAdminPanel(forceTools = false, message = '') {
    // Скрываем список, показываем контейнер админ-панели
    const mainContainer = document.querySelector('main');
    if (mainContainer) mainContainer.style.display = 'none';
    if (adminPanelContainer) adminPanelContainer.style.display = 'block';

    if (adminAuth.login || forceTools) {
        // --- РЕЖИМ ИНСТРУМЕНТОВ ---
        adminPanelContainer.innerHTML = generateAdminToolsHTML();
        
        // **ПРИВЯЗКА ОБРАБОТЧИКОВ ИНСТРУМЕНТОВ** (после генерации HTML!)
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
        document.getElementById('backToListBtn').addEventListener('click', handleBackToList);
        document.getElementById('addLevelForm').addEventListener('submit', handleAddLevelSubmit);
        document.getElementById('deleteLevelForm').addEventListener('submit', handleDeleteLevelSubmit);
        
        document.querySelectorAll('.admin-edit-button').forEach(button => {
            button.addEventListener('click', (e) => {
                startAdminEdit(e.target.dataset.list);
            });
        });

    } else {
        // --- РЕЖИМ ВХОДА ---
        adminPanelContainer.innerHTML = generateLoginFormHTML(message);

        // **ПРИВЯЗКА ОБРАБОТЧИКОВ ВХОДА** (после генерации HTML!)
        document.getElementById('loginForm').addEventListener('submit', handleLoginSubmit);
        document.getElementById('backToListBtn').addEventListener('click', handleBackToList);
    }
}

function startAdminEdit(listId) {
    currentAdminList = listId;
    const listTitle = listMap[listId] ? listMap[listId].title : listId.toUpperCase();
    const adminCurrentListTitle = document.getElementById('adminCurrentListTitle');
    const adminMessage = document.getElementById('adminMessage');
    
    if (adminCurrentListTitle) adminCurrentListTitle.textContent = `Редактирование списка: ${listTitle}`;
    if (adminMessage) adminMessage.textContent = `Выбран список для редактирования: ${listId.toUpperCase()}`;
}

function handleBackToList() {
    if (adminPanelContainer) adminPanelContainer.style.display = 'none';
    const mainContainer = document.querySelector('main');
    if (mainContainer) mainContainer.style.display = 'block';
    loadList('levels'); 
}

function handleLogout() {
    adminAuth = { login: '', password: '' };
    sessionStorage.removeItem('admin_login');
    sessionStorage.removeItem('admin_password');
    showAdminPanel(); // Переходим в режим входа
}

// ====================================================================
// ======================= АДМИН-ФУНКЦИИ (ОБРАБОТЧИКИ) =================
// ====================================================================

/**
 * Обрабатывает отправку формы входа.
 */
async function handleLoginSubmit(e) {
    e.preventDefault();
    const login = e.target.login.value;
    const password = e.target.password.value;
    
    const adminMessage = document.getElementById('adminMessage');
    if (adminMessage) adminMessage.textContent = 'Попытка входа...';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            adminAuth.login = login;
            adminAuth.password = password;
            sessionStorage.setItem('admin_login', login);
            sessionStorage.setItem('admin_password', password); 
            showAdminPanel(true); // Успех, показываем инструменты
        } else {
            const errorMessage = result.message || 'Неверный логин или пароль.';
            showAdminPanel(false, `Ошибка: ${errorMessage}`); // Повторная генерация с ошибкой
        }
    } catch (error) {
        console.error('Ошибка сети/сервера при входе:', error);
        showAdminPanel(false, 'Ошибка сервера при входе. Проверьте логи Vercel.');
    }
}

/**
 * Обрабатывает отправку формы добавления уровня.
 */
async function handleAddLevelSubmit(e) {
    e.preventDefault();
    const adminMessage = document.getElementById('adminMessage');

    if (!currentAdminList) {
        if (adminMessage) adminMessage.textContent = 'Ошибка: Сначала выберите список для редактирования!';
        return;
    }

    const levelData = {
        number: e.target.add_number.value,
        name: e.target.add_name.value,
        creator: e.target.add_creator.value,
        fps: e.target.add_fps.value,
        fv: e.target.add_fv.value,
        gd_id: e.target.add_id.value, 
        type: e.target.add_type.value || '',
        showcase: e.target.add_showcase.value
    };
    
    if (adminMessage) adminMessage.textContent = `Попытка добавить уровень ${levelData.number}. ${levelData.name}...`;

    try {
        const response = await fetch('/api/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                listName: currentAdminList, 
                ...levelData, 
                auth: adminAuth 
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            if (adminMessage) adminMessage.textContent = result.message;
            e.target.reset();
        } else {
            if (adminMessage) adminMessage.textContent = `Ошибка сервера: ${result.message || 'Неизвестная ошибка.'}`;
        }
    } catch (error) {
        console.error('Ошибка сети/сервера при добавлении:', error);
        if (adminMessage) adminMessage.textContent = 'Ошибка сети или внутренней службы при добавлении уровня.';
    }
}

/**
 * Обрабатывает отправку формы удаления уровня.
 */
async function handleDeleteLevelSubmit(e) {
    e.preventDefault();
    const adminMessage = document.getElementById('adminMessage');
    
    if (!currentAdminList) {
        if (adminMessage) adminMessage.textContent = 'Ошибка: Сначала выберите список для редактирования!';
        return;
    }

    const number = e.target.delete_number.value; 
    
    if (adminMessage) adminMessage.textContent = `Попытка удалить уровень №${number}...`;

    try {
        const response = await fetch('/api/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                listName: currentAdminList, 
                number: parseInt(number), 
                auth: adminAuth 
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            if (adminMessage) adminMessage.textContent = result.message;
            e.target.reset(); 
        } else {
            if (adminMessage) adminMessage.textContent = `Ошибка удаления: ${result.message || 'Неизвестная ошибка.'}`;
        }
    } catch (error) {
        console.error('Ошибка сети/сервера при удалении:', error);
        if (adminMessage) adminMessage.textContent = 'Ошибка сети или внутренней службы при удалении уровня.';
    }
}
