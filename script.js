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

    // ЗАГРУЗКА НАСТРОЕК (Снег и Тема)
    const snowSaved = localStorage.getItem('snowEnabled');
    snowToggle.checked = snowSaved !== 'false'; // По умолчанию true

    let currentListId = localStorage.getItem('currentListId') || 'levels';
    setTheme(localStorage.getItem('siteTheme') || 'dark');

    // Сохранение настройки снега при переключении
    snowToggle.addEventListener('change', () => {
        localStorage.setItem('snowEnabled', snowToggle.checked);
    });

    function setTheme(theme) {
        document.body.className = `theme-${theme}`;
        document.querySelectorAll('.theme-button').forEach(btn => {
            btn.classList.toggle('active-theme', btn.dataset.theme === theme);
        });
    }

    document.querySelectorAll('.theme-button').forEach(button => {
        button.addEventListener('click', () => {
            const newTheme = button.dataset.theme;
            setTheme(newTheme);
            localStorage.setItem('siteTheme', newTheme);
        });
    });

    document.querySelectorAll('.list-button').forEach(button => {
        button.addEventListener('click', () => {
            const listId = button.dataset.list;
            currentListId = listId;
            localStorage.setItem('currentListId', listId);
            document.querySelectorAll('.list-button').forEach(btn => btn.classList.remove('active-list'));
            button.classList.add('active-list');
            loadList(listId);
        });
    });

    function loadList(listId) {
        const config = listMap[listId];
        document.querySelector('.main-title').innerText = config.title;
        listElement.innerHTML = '<p style="text-align:center;">Загрузка...</p>';

        fetch(config.file + '?t=' + Date.now())
            .then(response => response.json())
            .then(data => {
                listElement.innerHTML = '';
                data.sort((a, b) => parseInt(a.number) - parseInt(b.number));
                data.forEach(level => {
                    const li = document.createElement('div');
                    li.className = 'level-card';
                    // Тут твоя стандартная разметка карточки...
                    li.innerHTML = `
                        <div class="level-header">
                            <span class="level-number">#${level.number}</span>
                            <span class="level-name">${level.name}</span>
                        </div>
                        <div class="level-creator">by ${level.creator}</div>
                        <ul class="level-details">
                            <li>FPS: ${level.fps}</li>
                            <li>ID: ${level.id}</li>
                        </ul>
                    `;
                    listElement.appendChild(li);
                });
                if (window.MathJax) MathJax.typesetPromise();
            })
            .catch(err => {
                listElement.innerHTML = `<p style="color:red;">Ошибка: ${err.message}</p>`;
            });
    }

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
    loadList(currentListId);
});
