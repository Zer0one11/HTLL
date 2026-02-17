document.addEventListener('DOMContentLoaded', () => {
    const listElement = document.getElementById('levelList');
    const body = document.body;
    const mainTitle = document.querySelector('.main-title');
    const themeButtons = document.querySelectorAll('.theme-button');
    const listButtons = document.querySelectorAll('.list-button');
    const snowToggle = document.getElementById('snow-toggle');
    const snowContainer = document.getElementById('snow-container');
    
    // Новые элементы управления
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

    let currentListId = localStorage.getItem('currentListId') || 'levels';
    let currentSnowSize = localStorage.getItem('snowSize') || '5';
    let currentOpacity = localStorage.getItem('panelOpacity') || '0.03';

    // Применение сохраненных настроек
    setTheme(localStorage.getItem('siteTheme') || 'dark');
    document.documentElement.style.setProperty('--panel-opacity', currentOpacity);
    if(opacityRange) opacityRange.value = currentOpacity;
    if(snowSizeRange) snowSizeRange.value = currentSnowSize;

    // Логика меню настроек
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsMenu.classList.toggle('active');
    });
    document.addEventListener('click', () => settingsMenu.classList.remove('active'));
    settingsMenu.addEventListener('click', (e) => e.stopPropagation());

    opacityRange.addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--panel-opacity', e.target.value);
        localStorage.setItem('panelOpacity', e.target.value);
    });

    snowSizeRange.addEventListener('input', (e) => {
        currentSnowSize = e.target.value;
        localStorage.setItem('snowSize', currentSnowSize);
    });

    function setTheme(themeName) {
        body.className = `theme-${themeName}`;
        themeButtons.forEach(btn => {
            btn.classList.toggle('active-theme', btn.dataset.theme === themeName);
        });
    }

    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const newTheme = button.dataset.theme;
            setTheme(newTheme);
            localStorage.setItem('siteTheme', newTheme);
        });
    });

    listButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentListId = button.dataset.list;
            localStorage.setItem('currentListId', currentListId);
            loadList(currentListId);
            listButtons.forEach(btn => btn.classList.remove('active-list'));
            button.classList.add('active-list');
        });
    });

    function formatLatex(text) {
        if (typeof text !== 'string' || text === "none") return text;
        const hasLatex = text.includes('\\') || text.includes('^') || text.includes('_');
        if (hasLatex && !text.startsWith('$')) {
            let processed = text.replace(/(?<!\\)\b([a-z]{3,})\b/gi, (match) => `\\text{${match}}`);
            return `$${processed}$`;
        }
        return text;
    }

    function loadList(listId) {
        const config = listMap[listId];
        mainTitle.textContent = config.title;
        listElement.innerHTML = '<p style="text-align:center;">Загрузка данных...</p>';

        fetch(config.file)
            .then(r => r.json())
            .then(data => {
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
                            ${level.type && level.type !== "none" ? `<li class="detail-line"><span class="detail-label">Type:</span> ${formatLatex(level.type)}</li>` : ''}
                        </ul>`;
                    listElement.appendChild(li);
                });
                if (window.MathJax?.typesetPromise) MathJax.typesetPromise();
            });
    }

    function createSnowflake() {
        if (!snowToggle.checked) return;
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        const size = (Math.random() * (currentSnowSize / 2) + Number(currentSnowSize)) + 'px';
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
