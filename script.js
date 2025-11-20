document.addEventListener('DOMContentLoaded', () => {
    const listElement = document.getElementById('levelList');
    const body = document.body;
    const mainTitle = document.querySelector('.main-title');
    const themeButtons = document.querySelectorAll('.theme-button');
    const listButtons = document.querySelectorAll('.list-button');
    
    // Элементы Админ-панели
    const adminPanelButton = document.getElementById('adminPanelButton');
    const adminPanelContainer = document.getElementById('adminPanelContainer');
    
    let isAdminLoggedIn = false;
    let currentAdminStep = 0;
    let newLevelData = {};
    let selectedList = '';
    
    // Переменные для хранения учетных данных после входа
    let adminLogin = '';
    let adminPassword = '';

    // Массив шагов ввода данных для добавления
    const inputSteps = [
        { key: 'number', text: "Введите место в топе (номер уровня):" },
        { key: 'name', text: "Введите название уровня:" },
        { key: 'creator', text: "Введите автора уровня:" },
        { key: 'fps', text: "Введите FPS в уровне:" },
        { key: 'fv', text: "Введите, кто выложил уровень на сервер GD:" },
        { key: 'id', text: "Введите ID уровня:" },
        { key: 'type', text: "Введите тип механизма (для ILL, SLL none):" }, 
        { key: 'showcase', text: "Введите ссылку на шоукейс:" }
    ];

    // Карта для сопоставления ID списка с именем файла и названием заголовка
    const listMap = {
        'levels': { file: 'levels.json', title: 'TPLL LIST' },
        'ppll': { file: 'ppll.json', title: 'PPLL LIST' },
        'sll': { file: 'sll.json', title: 'SLL LIST' },
        'ill': { file: 'ill.json', title: 'ILL LIST' },
        'inf': { file: 'inf.json', title: 'INF LIST' }
    };

    let currentListId = localStorage.getItem('currentListId') || 'levels';
    loadList(currentListId); // Загрузка первого списка при старте

    // ====================================
    // 1. Логика Смены Тем (Без изменений)
    // ====================================
    const savedTheme = localStorage.getItem('siteTheme') || 'blue';
    setTheme(savedTheme);

    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const newTheme = button.dataset.theme;
            setTheme(newTheme);
            localStorage.setItem('siteTheme', newTheme);
        });
    });

    function setTheme(theme) {
        body.className = body.className.split(' ').filter(c => !c.startsWith('theme-')).join(' ');
        body.classList.add(`theme-${theme}`);
        themeButtons.forEach(btn => {
            btn.classList.remove('active-theme');
            if (btn.dataset.theme === theme) {
                btn.classList.add('active-theme');
            }
        });
    }

    // ====================================
    // 2. Логика Админ-Панели (Основная навигация)
    // ====================================
    
    adminPanelButton.addEventListener('click', () => {
        listElement.style.display = 'none';
        adminPanelContainer.style.display = 'block';
        
        if (!isAdminLoggedIn) {
            renderLoginScreen();
        } else {
            renderAdminPanelHome();
        }
    });

    function renderLoginScreen(message = '') {
        adminPanelContainer.innerHTML = `
            <h2>Авторизация</h2>
            ${message ? `<p style="color: red;">${message}</p>` : ''}
            <div class="admin-input-group">
                <p>Введите логин и пароль:</p>
                <input type="text" id="inputLogin" placeholder="Логин">
                <input type="password" id="inputPassword" placeholder="Пароль">
                <button id="loginSubmit">Войти</button>
                <button id="loginCancel">Назад к спискам</button>
            </div>
        `;
        document.getElementById('loginSubmit').addEventListener('click', attemptLogin);
        document.getElementById('loginCancel').addEventListener('click', hideAdminPanel);
    }
    
    // НОВАЯ ФУНКЦИЯ: Отправляет запрос на сервер для авторизации
    async function attemptLogin() {
        const login = document.getElementById('inputLogin').value;
        const password = document.getElementById('inputPassword').value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, password })
            });

            const result = await response.json();

            if (result.success) {
                isAdminLoggedIn = true;
                adminLogin = login;
                adminPassword = password;
                renderAdminPanelHome();
            } else {
                renderLoginScreen(result.message || 'Неверный логин или пароль.');
            }
        } catch (error) {
            console.error('Ошибка авторизации:', error);
            renderLoginScreen('Ошибка соединения с сервером.');
        }
    }

    // Главный экран админ-панели (Без изменений)
    function renderAdminPanelHome() {
        adminPanelContainer.innerHTML = `
            <h2>Админ Панель</h2>
            <p>Выберите действие:</p>
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button id="showAddForm">Добавить уровень</button>
                <button id="showDeleteForm">Удалить уровень</button>
            </div>
            <button id="adminLogout">Выход</button>
        `;
        document.getElementById('showAddForm').addEventListener('click', renderAddListSelection);
        document.getElementById('showDeleteForm').addEventListener('click', renderDeleteListSelection);
        document.getElementById('adminLogout').addEventListener('click', () => {
            isAdminLoggedIn = false;
            adminLogin = '';
            adminPassword = '';
            hideAdminPanel();
            renderLoginScreen(); 
        });
    }

    function hideAdminPanel() {
        adminPanelContainer.style.display = 'none';
        listElement.style.display = 'block';
        loadList(currentListId); 
    }

    // ====================================
    // 3. Добавление Уровней (Flow)
    // ====================================

    function renderAddListSelection() {
        adminPanelContainer.innerHTML = `
            <h2>Добавление уровня в лист</h2>
            <p>Выберите лист:</p>
            <div class="list-selection">
                <button data-list="levels">TPLL</button>
                <button data-list="ppll">PPLL</button>
                <button data-list="sll">SLL</button>
                <button data-list="ill">ILL</button>
                <button data-list="inf">INF</button>
            </div>
            <button id="backToAdminHome" style="margin-top: 20px;">Назад</button>
        `;
        document.querySelectorAll('.list-selection button').forEach(button => {
            button.addEventListener('click', (e) => startLevelAddition(e.target.dataset.list));
        });
        document.getElementById('backToAdminHome').addEventListener('click', renderAdminPanelHome);
    }
    
    function startLevelAddition(listId) {
        selectedList = listId;
        newLevelData = {};
        currentAdminStep = 0;
        renderInputStep();
    }
    
    function renderInputStep() {
        if (currentAdminStep >= inputSteps.length) {
            renderSummaryScreen();
            return;
        }

        const step = inputSteps[currentAdminStep];
        const stepText = step.text;

        adminPanelContainer.innerHTML = `
            <h2>Добавление уровня в ${selectedList.toUpperCase()}</h2>
            <div class="admin-input-group">
                <p>${stepText}</p>
                <input type="text" id="stepInput" value="${newLevelData[step.key] || ''}" placeholder="${stepText}">
                <button id="stepBack">Назад</button>
                <button id="stepNext">Продолжить</button>
            </div>
        `;
        
        document.getElementById('stepBack').addEventListener('click', () => {
            if (currentAdminStep === 0) {
                renderAddListSelection(); 
            } else {
                currentAdminStep--;
                renderInputStep();
            }
        });

        document.getElementById('stepNext').addEventListener('click', () => {
            const inputValue = document.getElementById('stepInput').value.trim();
            
            if (inputValue === '' && step.key !== 'type') {
                alert('Поле не может быть пустым!');
                return;
            }
            
            newLevelData[step.key] = inputValue;
            
            currentAdminStep++;
            renderInputStep();
        });
    }

    function renderSummaryScreen() {
        let summaryHTML = '<h3>Проверьте введенные данные:</h3><ul>';
        for (const [key, value] of Object.entries(newLevelData)) {
            summaryHTML += `<li><strong>${key.toUpperCase()}:</strong> ${value}</li>`;
        }
        summaryHTML += '</ul>';

        adminPanelContainer.innerHTML = `
            <h2>Подтверждение добавления в ${selectedList.toUpperCase()}</h2>
            ${summaryHTML}
            <button id="finalizeAdd">Добавить уровень</button>
            <button id="finalizeBack">Назад к редактированию</button>
        `;

        document.getElementById('finalizeBack').addEventListener('click', () => {
            currentAdminStep = inputSteps.length - 1;
            renderInputStep();
        });

        document.getElementById('finalizeAdd').addEventListener('click', attemptAddLevel);
    }
    
    // НОВАЯ ФУНКЦИЯ: Отправляет данные на сервер для добавления уровня
    async function attemptAddLevel() {
        try {
            const response = await fetch('/api/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listName: selectedList,
                    levelData: newLevelData,
                    auth: { login: adminLogin, password: adminPassword }
                })
            });

            const result = await response.json();
            alert(result.message);
            
            if (result.success) {
                renderAdminPanelHome();
            }

        } catch (error) {
            console.error('Ошибка добавления уровня:', error);
            alert('Ошибка: Не удалось соединиться с сервером.');
        }
    }

    // ====================================
    // 4. Удаление Уровней (Flow)
    // ====================================

    function renderDeleteListSelection() {
        adminPanelContainer.innerHTML = `
            <h2>Удаление уровня</h2>
            <p>Выберите лист, из которого хотите удалить уровень:</p>
            <div class="list-selection">
                <button data-list="levels">TPLL</button>
                <button data-list="ppll">PPLL</button>
                <button data-list="sll">SLL</button>
                <button data-list="ill">ILL</button>
                <button data-list="inf">INF</button>
            </div>
            <button id="backToAdminHome" style="margin-top: 20px;">Назад</button>
        `;
        document.querySelectorAll('.list-selection button').forEach(button => {
            button.addEventListener('click', (e) => startLevelDeletion(e.target.dataset.list));
        });
        document.getElementById('backToAdminHome').addEventListener('click', renderAdminPanelHome);
    }

    function startLevelDeletion(listId) {
        selectedList = listId;
        renderDeleteInput();
    }

    function renderDeleteInput(message = '') {
        adminPanelContainer.innerHTML = `
            <h2>Удаление уровня из ${selectedList.toUpperCase()}</h2>
            ${message ? `<p style="color: red;">${message}</p>` : ''}
            <div class="admin-input-group">
                <p>Введите номер уровня (место в топе) для удаления:</p>
                <input type="text" id="deleteNumberInput" placeholder="Например, 5">
                <button id="deleteBack">Назад</button>
                <button id="deleteConfirmCheck">Продолжить</button>
            </div>
        `;

        document.getElementById('deleteBack').addEventListener('click', renderDeleteListSelection);
        document.getElementById('deleteConfirmCheck').addEventListener('click', () => {
            const levelNumber = document.getElementById('deleteNumberInput').value.trim();
            const number = parseInt(levelNumber);
            
            if (!levelNumber || isNaN(number) || number < 1) {
                renderDeleteInput('Пожалуйста, введите корректный номер уровня.');
                return;
            }
            renderDeletionConfirmation(number);
        });
    }

    function renderDeletionConfirmation(levelNumber) {
        adminPanelContainer.innerHTML = `
            <h2>Подтверждение удаления</h2>
            <p style="font-weight: bold; color: orange;">ВНИМАНИЕ! Вы собираетесь удалить уровень №${levelNumber} из списка ${selectedList.toUpperCase()}.</p>
            <p>Вы уверены, что хотите продолжить?</p>
            <button id="finalDelete" style="background-color: #e74c3c;">Удалить</button>
            <button id="finalDeleteBack">Отмена</button>
        `;
        document.getElementById('finalDeleteBack').addEventListener('click', () => renderDeleteInput());
        document.getElementById('finalDelete').addEventListener('click', () => attemptDeleteLevel(levelNumber));
    }

    // НОВАЯ ФУНКЦИЯ: Отправляет запрос на сервер для удаления уровня
    async function attemptDeleteLevel(levelNumber) {
        try {
            const response = await fetch('/api/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listName: selectedList,
                    levelNumber: levelNumber,
                    auth: { login: adminLogin, password: adminPassword }
                })
            });

            const result = await response.json();
            alert(result.message);
            
            if (result.success) {
                renderAdminPanelHome();
            }
            
        } catch (error) {
            console.error('Ошибка удаления уровня:', error);
            alert('Ошибка: Не удалось соединиться с сервером.');
        }
    }


    // ====================================
    // 5. Логика Загрузки Уровней (Без изменений)
    // ====================================
    
    listButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const newListId = e.target.dataset.list;
            if (newListId !== currentListId) {
                currentListId = newListId;
                localStorage.setItem('currentListId', currentListId);
                loadList(currentListId);
            }
        });
    });

    function loadList(listId) {
        if (adminPanelContainer.style.display === 'block') return;

        const listData = listMap[listId];
        const jsonPath = listData.file;
        mainTitle.textContent = listData.title;

        listButtons.forEach(btn => {
            btn.classList.remove('active-list');
            if (btn.dataset.list === listId) {
                btn.classList.add('active-list');
            }
        });
        
        listElement.innerHTML = `<p class="loading-text">Загрузка списка...</p>`;

        fetch(jsonPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Ошибка загрузки данных для ${listId}: Статус ${response.status}`);
                }
                return response.json();
            })
            .then(levels => {
                listElement.innerHTML = '';
                
                if (levels.length === 0) {
                    listElement.innerHTML = `<p style="text-align: center;">Список пуст или не содержит уровней.</p>`;
                    return;
                }
                
                levels.forEach(level => {
                    const li = document.createElement('li');
                    li.className = 'level-item';

                    const levelType = level.type ? `<li><span class="detail-label">Type:</span> ${level.type}</li>` : '';
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
                listElement.innerHTML = `<p style="color: red; text-align: center;">Ошибка загрузки: Проблема с файлом ${jsonPath}.</p>`;
            });
    }
});
