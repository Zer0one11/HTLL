document.addEventListener('DOMContentLoaded', () => {
    const listElement = document.getElementById('levelList');
    const body = document.body;
    const mainTitle = document.querySelector('.main-title');
    const themeButtons = document.querySelectorAll('.theme-button');
    const listButtons = document.querySelectorAll('.list-button');

    // Карта для сопоставления ID списка с именем файла и названием заголовка
    const listMap = {
        'levels': { file: 'levels.json', title: 'TPLL LIST' },
        'ppll': { file: 'ppll.json', title: 'PPLL LIST' },
        'sll': { file: 'sll.json', title: 'SLL LIST' },
        'ill': { file: 'ill.json', title: 'ILL LIST' },  // НОВЫЙ ЛИСТ
        'inf': { file: 'inf.json', title: 'INF LIST' }
    };

    let currentListId = localStorage.getItem('currentListId') || 'levels';

    // ====================================
    // 1. Инициализация и Логика Смены Тем
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
    // 2. Логика Переключения Листов
    // ====================================
    
    listButtons.forEach(button => {
        button.addEventListener('click', () => {
            const newListId = button.dataset.list;
            if (newListId !== currentListId) {
                currentListId = newListId;
                localStorage.setItem('currentListId', currentListId);
                loadList(currentListId);
            }
        });
    });
    
    // Загрузка списка при старте
    loadList(currentListId);


    function loadList(listId) {
        const listData = listMap[listId];
        const jsonPath = listData.file;
        mainTitle.textContent = listData.title;

        // Обновляем активную кнопку
        listButtons.forEach(btn => {
            btn.classList.remove('active-list');
            if (btn.dataset.list === listId) {
                btn.classList.add('active-list');
            }
        });
        
        // Очистка предыдущего списка
        listElement.innerHTML = `<p class="loading-text">Загрузка списка...</p>`;

        fetch(jsonPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Ошибка загрузки данных для ${listId}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(levels => {
                // Очищаем "Загрузка..." и начинаем рендеринг
                listElement.innerHTML = '';
                
                if (levels.length === 0) {
                    listElement.innerHTML = `<p style="text-align: center;">Список пуст или не содержит уровней.</p>`;
                    return;
                }
                
                levels.forEach(level => {
                    const li = document.createElement('li');
                    li.className = 'level-item';

                    // Проверка на наличие поля "type" (новое задание)
                    const levelType = level.type ? `<li><span class="detail-label">Type:</span> ${level.type};</li>` : '';

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
                            
                            <li class="detail-line-full"><span class="detail-label">ID:</span> ${level.id};</li>
                            
                            <li><span class="detail-label">FV:</span> ${level.fv};</li>
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
                listElement.innerHTML = `<p style="color: red; text-align: center;">Ошибка загрузки: Проверьте, существует ли файл ${jsonPath}.</p>`;
            });
    }
});
