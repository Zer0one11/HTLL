document.addEventListener('DOMContentLoaded', () => {
    const listElement = document.getElementById('levelList');
    const snowToggle = document.getElementById('snow-toggle');
    const snowContainer = document.getElementById('snow-container');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const snowSizeRange = document.getElementById('snowSizeRange');
    const opacityRange = document.getElementById('opacityRange');

    const listMap = {
        'levels': { file: 'levels.json', title: 'TPLL LIST' },
        'ppll': { file: 'ppll.json', title: 'PPLL LIST' },
        'sll': { file: 'sll.json', title: 'SLL LIST' },
        'ill': { file: 'ill.json', title: 'ILL LIST' },
        'inf': { file: 'inf.json', title: 'INF LIST' },
        'scl': { file: 'scl.json', title: 'SCL LIST' },
        'icl': { file: 'icl.json', title: 'ICL LIST' }
    };

    // Читаем сохраненные значения или ставим дефолты
    let currentSnowSize = localStorage.getItem('snowSize') || '5';
    let currentOpacity = localStorage.getItem('panelOpacity') || '0.01';
    let currentTheme = localStorage.getItem('siteTheme') || 'dark';
    let currentListId = localStorage.getItem('currentListId') || 'levels';

    // 1. Применяем прозрачность панелей
    function applyOpacity(val) {
        document.documentElement.style.setProperty('--panel-opacity', val);
        if (opacityRange) opacityRange.value = val;
        localStorage.setItem('panelOpacity', val);
    }

    // 2. Применяем размер снега
    function applySnowSize(val) {
        currentSnowSize = val;
        if (snowSizeRange) snowSizeRange.value = val;
        localStorage.setItem('snowSize', val);
    }

    // 3. Применяем тему
    function applyTheme(themeName) {
        document.body.className = `theme-${themeName}`;
        localStorage.setItem('siteTheme', themeName);
        document.querySelectorAll('.theme-button').forEach(btn => {
            btn.classList.toggle('active-theme', btn.dataset.theme === themeName);
        });
    }

    // Инициализация при старте
    applyTheme(currentTheme);
    applyOpacity(currentOpacity);
    applySnowSize(currentSnowSize);

    // Слушатели для настроек
    opacityRange.addEventListener('input', (e) => applyOpacity(e.target.value));
    snowSizeRange.addEventListener('input', (e) => applySnowSize(e.target.value));

    // Кнопки тем
    document.querySelectorAll('.theme-button').forEach(btn => {
        btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
    });

    // Управление меню настроек
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsMenu.classList.toggle('active');
    });
    document.addEventListener('click', () => settingsMenu.classList.remove('active'));
    settingsMenu.addEventListener('click', (e) => e.stopPropagation());

    // Форматирование Latex
    function formatLatex(text) {
        if (typeof text !== 'string' || text === "none") return text;
        const hasLatex = text.includes('\\') || text.includes('^') || text.includes('_');
        if (hasLatex && !text.startsWith('$')) {
            let processed = text.replace(/(?<!\\)\b([a-z]{3,})\b/gi, (match) => `\\text{${match}}`);
            return `$${processed}$`;
        }
        return text;
    }

    // Загрузка списков
    function loadList(listId) {
        const config = listMap[listId];
        const titleEl = document.querySelector('.main-title');
        if (titleEl) titleEl.textContent = config.title;

        fetch(config.file).then(r => r.json()).then(data => {
            listElement.innerHTML = '';
            data.forEach(level => {
                const li = document.createElement('li');
                li.className = 'level-item';
                li.innerHTML = `
                    <div class="level-header">
                        <span class="level-number">#${level.number}</span>
                        <div class="level-title-group">
                            <a href="${level.showcase}" target="_blank" class="level-name">${formatLatex(level.name)}</a>
                            <span class="level-creator">by ${level.creator}</span>
                        </div>
                    </div>
                    <ul class="level-details">
                        <li class="detail-line"><span class="detail-label">FPS:</span> ${formatLatex(level.fps)}</li>
                        <li class="detail-line"><span class="detail-label">ID:</span> ${level.id}</li> 
                        <li class="detail-line"><span class="detail-label">FV:</span> ${level.fv}</li> 
                        ${level.type && level.type !== "none" ? `<li class="detail-line"><span class="detail-label">TYPE:</span> ${formatLatex(level.type)}</li>` : ''}
                    </ul>`;
                listElement.appendChild(li);
            });
            if (window.MathJax?.typesetPromise) MathJax.typesetPromise();
        });
    }

    // Переключатель списков
    document.querySelectorAll('.list-button').forEach(btn => {
        if (btn.dataset.list === currentListId) btn.classList.add('active-list');
        btn.addEventListener('click', function() {
            const lid = this.dataset.list;
            localStorage.setItem('currentListId', lid);
            loadList(lid);
            document.querySelectorAll('.list-button').forEach(b => b.classList.remove('active-list'));
            this.classList.add('active-list');
        });
    });

    // Снег
    function createSnowflake() {
        if (!snowToggle.checked) return;
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        const size = (Math.random() * (currentSnowSize / 2) + Number(currentSnowSize)) + 'px';
        snowflake.style.width = size; snowflake.style.height = size;
        snowflake.style.left = Math.random() * 100 + 'vw';
        snowflake.style.animationDuration = Math.random() * 3 + 4 + 's';
        snowflake.style.opacity = Math.random() * 0.6 + 0.4;
        snowContainer.appendChild(snowflake);
        setTimeout(() => snowflake.remove(), 7000);
    }

    setInterval(createSnowflake, 150);
    loadList(currentListId);
});
