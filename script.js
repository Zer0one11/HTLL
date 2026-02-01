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

    // --- 1. ЛОГИКА СНЕГА (СОХРАНЕНИЕ) ---
    const snowSaved = localStorage.getItem('snowEnabled');
    // Если в памяти 'false', выключаем. По умолчанию включен.
    snowToggle.checked = snowSaved !== 'false'; 

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

    // --- 2. ЗАГРУЗКА СПИСКА ---
    let currentListId = localStorage.getItem('currentListId') || 'levels';

    function loadList(listId) {
        const config = listMap[listId];
        document.querySelector('.main-title').innerText = config.title;
        
        // Очистка перед загрузкой (исправляет наслоение)
        listElement.innerHTML = '';

        fetch(config.file + '?t=' + Date.now())
            .then(response => response.json())
            .then(data => {
                data.sort((a, b) => parseInt(a.number) - parseInt(b.number));

                data.forEach(level => {
                    const section = document.createElement('section');
                    section.className = 'level-card'; // Возвращаем оригинальный класс
                    
                    // ТОЧНАЯ СТРУКТУРА ТВОЕГО ОРИГИНАЛЬНОГО ДИЗАЙНА
                    section.innerHTML = `
                        <div class="level-info">
                            <h2 class="level-title">#${level.number} ${level.name}</h2>
                            <p class="level-creator">by ${level.creator}</p>
                            <p class="level-details">FPS: ${level.fps} | ID: ${level.id}</p>
                            <p class="level-details">FV: ${level.fv} | Type: ${level.type}</p>
                        </div>
                        ${level.showcase ? `
                        <div class="level-showcase">
                            <iframe src="${level.showcase.replace('watch?v=', 'embed/')}" frameborder="0" allowfullscreen></iframe>
                        </div>` : ''}
                    `;
                    listElement.appendChild(section);
                });

                if (window.MathJax) MathJax.typesetPromise();
            })
            .catch(err => console.error("Ошибка:", err));
    }

    // --- 3. КНОПКИ И ТЕМЫ ---
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

    setTheme(localStorage.getItem('siteTheme') || 'dark');
    loadList(currentListId);
});
