document.addEventListener('DOMContentLoaded', () => {
    const listElement = document.getElementById('levelList');
    const snowToggle = document.getElementById('snow-toggle');
    const snowContainer = document.getElementById('snow-container');

    const listMap = {
        'levels': { file: 'levels.json', title: 'TPLL LIST' },
        'ppll': { file: 'ppll.json', title: 'PPLL LIST' },
        'sll': { file: 'sll.json', title: 'SLL LIST' },
        'ill': { file: 'ill.json', title: 'ILL LIST' },
        'inf': { file: 'inf.json', title: 'INF LIST' },
        'scl': { file: 'scl.json', title: 'SCL LIST' },
        'icl': { file: 'icl.json', title: 'ICL LIST' }
    };

    // --- ЛОГИКА СНЕГА (СОХРАНЕНИЕ) ---
    const savedSnow = localStorage.getItem('snowEnabled');
    const isSnowEnabled = savedSnow !== null ? savedSnow === 'true' : true;
    snowToggle.checked = isSnowEnabled;

    snowToggle.addEventListener('change', () => {
        localStorage.setItem('snowEnabled', snowToggle.checked);
    });

    function createSnowflake() {
        if (!snowToggle.checked) return;
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        const size = Math.random() * 5 + 4 + 'px';
        snowflake.style.width = size;
        snowflake.style.height = size;
        snowflake.style.left = Math.random() * 100 + 'vw';
        snowflake.style.animationDuration = Math.random() * 3 + 4 + 's';
        snowflake.style.opacity = Math.random() * 0.6 + 0.4;
        snowContainer.appendChild(snowflake);
        setTimeout(() => snowflake.remove(), 7000);
    }
    setInterval(createSnowflake, 150);

    // --- ЗАГРУЗКА СПИСКОВ ---
    let currentListId = localStorage.getItem('currentListId') || 'levels';

    function loadList(listId) {
        const config = listMap[listId];
        document.querySelector('.main-title').innerText = config.title;
        
        // Очищаем контейнер полностью перед загрузкой
        listElement.innerHTML = ''; 

        fetch(config.file + '?t=' + Date.now())
            .then(response => response.json())
            .then(data => {
                // Сортировка по номеру
                data.sort((a, b) => parseInt(a.number) - parseInt(b.number));

                data.forEach(level => {
                    const levelCard = document.createElement('div');
                    levelCard.className = 'level-card';
                    
                    // ВОЗВРАЩАЕМ ОРИГИНАЛЬНУЮ СТРУКТУРУ КЛАССОВ ДЛЯ ТВОЕГО CSS
                    levelCard.innerHTML = `
                        <div class="level-info">
                            <div class="level-title">
                                <span class="level-number">#${level.number}</span> 
                                ${level.name}
                            </div>
                            <div class="level-creator">by ${level.creator}</div>
                            <div class="level-details">
                                <div>FPS: ${level.fps}</div>
                                <div>ID: ${level.id}</div>
                                <div>FV: ${level.fv}</div>
                                <div>TYPE: ${level.type}</div>
                            </div>
                        </div>
                        ${level.showcase ? `
                            <div class="level-showcase">
                                <a href="${level.showcase}" target="_blank" class="showcase-link">Смотреть Showcase</a>
                            </div>
                        ` : ''}
                    `;
                    listElement.appendChild(levelCard);
                });

                if (window.MathJax) {
                    MathJax.typesetPromise();
                }
            })
            .catch(err => {
                listElement.innerHTML = `<p style="color:red; text-align:center;">Ошибка загрузки: ${err.message}</p>`;
            });
    }

    // --- ТЕМЫ И КНОПКИ ---
    function setTheme(theme) {
        document.body.className = `theme-${theme}`;
        document.querySelectorAll('.theme-button').forEach(btn => {
            btn.classList.toggle('active-theme', btn.dataset.theme === theme);
        });
    }

    document.querySelectorAll('.theme-button').forEach(button => {
        button.addEventListener('click', () => {
            const theme = button.dataset.theme;
            setTheme(theme);
            localStorage.setItem('siteTheme', theme);
        });
    });

    document.querySelectorAll('.list-button').forEach(button => {
        if (button.dataset.list === currentListId) button.classList.add('active-list');
        button.addEventListener('click', () => {
            currentListId = button.dataset.list;
            localStorage.setItem('currentListId', currentListId);
            document.querySelectorAll('.list-button').forEach(btn => btn.classList.remove('active-list'));
            button.classList.add('active-list');
            loadList(currentListId);
        });
    });

    setTheme(localStorage.getItem('siteTheme') || 'dark');
    loadList(currentListId);
});
