window.MathJax = {
    tex: { inlineMath: [['$', '$'], ['\\(', '\\)']], processEscapes: true },
    options: { skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'] },
    startup: { pageReady: () => MathJax.startup.defaultPageReady() }
};

document.addEventListener('DOMContentLoaded', () => {
    const listElement = document.getElementById('levelList');
    const body = document.body;
    const mainTitle = document.querySelector('.main-title');
    const themeButtons = document.querySelectorAll('.theme-button');
    const listButtons = document.querySelectorAll('.list-button');
    const snowToggle = document.getElementById('snow-toggle');
    const snowContainer = document.getElementById('snow-container');
    const searchInput = document.getElementById('levelSearch');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsMenu = document.getElementById('settingsMenu');
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

    let currentListData = []; 
    let globalData = [];      
    let currentListId = localStorage.getItem('currentListId') || 'levels';
    let currentTheme = localStorage.getItem('siteTheme') || 'dark';
    let currentSnowSize = localStorage.getItem('snowSize') || '5';
    let currentOpacity = localStorage.getItem('panelOpacity') || '0.9';

    // Инициализация
    setTheme(currentTheme);
    document.documentElement.style.setProperty('--panel-opacity', currentOpacity);
    if (opacityRange) opacityRange.value = currentOpacity;
    if (snowSizeRange) snowSizeRange.value = currentSnowSize;

    listButtons.forEach(btn => btn.classList.toggle('active-list', btn.dataset.list === currentListId));
    themeButtons.forEach(btn => btn.classList.toggle('active-theme', btn.dataset.theme === currentTheme));

    // УПРАВЛЕНИЕ НАСТРОЙКАМИ
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsMenu.classList.toggle('active');
    });

    document.addEventListener('click', () => settingsMenu.classList.remove('active'));
    settingsMenu.addEventListener('click', (e) => e.stopPropagation());

    opacityRange.addEventListener('input', (e) => {
        const val = e.target.value;
        document.documentElement.style.setProperty('--panel-opacity', val);
        localStorage.setItem('panelOpacity', val);
    });

    snowSizeRange.addEventListener('input', (e) => {
        currentSnowSize = e.target.value;
        localStorage.setItem('snowSize', currentSnowSize);
    });

    function setTheme(themeName) { body.className = `theme-${themeName}`; }

    function formatLatex(text) {
        if (typeof text !== 'string' || text === "none" || text.trim() === "") return text;
        let processed = text;
        const keywords = ['text', 'frac', 'sqrt', 'cdot', 'times'];
        keywords.forEach(word => {
            const regex = new RegExp(`(?<!\\\\)${word}`, 'g');
            processed = processed.replace(regex, `\\${word}`);
        });
        processed = processed.replace(/\\+/g, '\\');
        const latexPattern = /[\^\\_{}]/;
        if (latexPattern.test(processed) && !processed.includes('$')) {
            processed = `$${processed}$`;
        }
        return processed;
    }

    function render(data) {
        if (!listElement) return;
        if (window.MathJax?.typesetClear) window.MathJax.typesetClear([listElement]);
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
        
        setTimeout(() => {
            if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise([listElement]);
        }, 10);
    }

    function loadList(listId) {
        const config = listMap[listId];
        if (!config) return;
        mainTitle.textContent = config.title;
        fetch(config.file + '?t=' + Date.now())
            .then(r => r.json())
            .then(data => {
                currentListData = data.sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0));
                render(currentListData);
            });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            if (!val) { render(currentListData); mainTitle.textContent = listMap[currentListId].title; return; }
            mainTitle.textContent = "SEARCH RESULTS";
            render(globalData.filter(l => 
                l.name?.toLowerCase().includes(val) || 
                l.id?.toString().includes(val) || 
                l.creator?.toLowerCase().includes(val)
            ));
        });
    }

    listButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentListId = button.dataset.list;
            localStorage.setItem('currentListId', currentListId);
            loadList(currentListId);
            listButtons.forEach(btn => btn.classList.remove('active-list'));
            button.classList.add('active-list');
        });
    });

    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const newTheme = button.dataset.theme;
            setTheme(newTheme);
            localStorage.setItem('siteTheme', newTheme);
            themeButtons.forEach(btn => btn.classList.remove('active-theme'));
            button.classList.add('active-theme');
        });
    });

    function createSnowflake() {
        if (!snowToggle?.checked) return;
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

    Object.values(listMap).forEach(item => {
        fetch(item.file).then(r => r.json()).then(data => globalData = [...globalData, ...data]);
    });

    loadList(currentListId);
});
