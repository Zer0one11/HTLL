// 1. КОНФИГУРАЦИЯ MATHJAX (обязательно до инициализации)
window.MathJax = {
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true
    },
    options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
    },
    startup: {
        pageReady: () => {
            return MathJax.startup.defaultPageReady();
        }
    }
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

    const listMap = {
        'levels': { file: 'levels.json', title: 'TPLL LIST' },
        'ppll': { file: 'ppll.json', title: 'PPLL LIST' },
        'sll': { file: 'sll.json', title: 'SLL LIST' },
        'ill': { file: 'ill.json', title: 'ILL LIST' },
        'inf': { file: 'inf.json', title: 'INF LIST' },
        'scl': { file: 'scl.json', title: 'SCL LIST' },
        'icl': { file: 'icl.json', title: 'ICL LIST' }
    };

    let currentListData = []; // Данные текущего списка
    let globalData = [];      // Все данные для глобального поиска
    let currentListId = localStorage.getItem('currentListId') || 'levels';
    
    setTheme(localStorage.getItem('siteTheme') || 'dark');

    // Предзагрузка ВСЕХ данных для мгновенного поиска по всему сайту
    Object.values(listMap).forEach(item => {
        fetch(item.file + '?t=' + Date.now())
            .then(r => r.json())
            .then(data => {
                globalData = [...globalData, ...data];
            })
            .catch(e => console.error("Ошибка предзагрузки для поиска:", e));
    });

    const snowSaved = localStorage.getItem('snowEnabled');
    if (snowToggle) {
        snowToggle.checked = snowSaved !== 'false'; 
        snowToggle.addEventListener('change', () => localStorage.setItem('snowEnabled', snowToggle.checked));
    }

    function setTheme(themeName) { body.className = `theme-${themeName}`; }

    /**
     * ТВОЙ УЛЬТИМАТИВНЫЙ ФИКС ЛАТЕКСА
     */
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

    /**
     * РЕНДЕР КАРТОЧЕК
     */
    function render(data) {
        if (!listElement) return;

        // Очищаем кэш MathJax перед обновлением DOM, чтобы не было дублей
        if (window.MathJax && window.MathJax.typesetClear) {
            window.MathJax.typesetClear([listElement]);
        }

        listElement.innerHTML = '';
        
        data.forEach(level => {
            const li = document.createElement('li');
            li.className = 'level-item';
            
            let typeHtml = (level.type && level.type !== "none") 
                ? `<li class="detail-line"><span class="detail-label">Type:</span> ${formatLatex(level.type)}</li>` 
                : '';
            
            li.innerHTML = `
                <div class="level-header">
                    <span class="level-number">#${level.number}</span>
                    <div class="level-title-group">
                        <a href="${level.showcase}" target="_blank" class="level-name">${formatLatex(level.name)}</a>
                        <span class="level-creator">by ${level.creator}</span>
                    </div>
                </div>
                <ul class="level-details">
                    <li class="detail-line"><span class="detail-label">FPS:</span> <span>${formatLatex(level.fps)}</span></li>
                    <li class="detail-line"><span class="detail-label">ID:</span> ${level.id}</li> 
                    <li class="detail-line"><span class="detail-label">FV:</span> ${level.fv}</li> 
                    ${typeHtml}
                </ul>
            `;
            listElement.appendChild(li);
        });
        
        // Принудительный рендер после обновления списка
        setTimeout(() => {
            if (window.MathJax && window.MathJax.typesetPromise) {
                window.MathJax.typesetPromise([listElement]).catch(err => console.error(err));
            }
        }, 10);
    }

    /**
     * ЗАГРУЗКА СПИСКА И СТАБИЛЬНАЯ СОРТИРОВКА
     */
    function loadList(listId) {
        const config = listMap[listId];
        if (!config) return;
        if (mainTitle) mainTitle.textContent = config.title;
        
        fetch(config.file + '?t=' + Date.now())
            .then(r => r.json())
            .then(data => {
                // Сортировка по номеру, а если равны — по имени (чтобы ничего не двигалось)
                currentListData = data.sort((a, b) => {
                    const numA = parseInt(a.number) || 0;
                    const numB = parseInt(b.number) || 0;
                    if (numA !== numB) return numA - numB;
                    return (a.name || "").localeCompare(b.name || "");
                });
                render(currentListData);
            });
    }

    /**
     * ГЛОБАЛЬНЫЙ ПОИСК
     */
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            if (val.length === 0) {
                render(currentListData);
                mainTitle.textContent = listMap[currentListId].title;
                return;
            }
            mainTitle.textContent = "SEARCH RESULTS";
            
            // Ищем по всем загруженным уровням
            const filtered = globalData.filter(l => 
                (l.name && l.name.toLowerCase().includes(val)) || 
                (l.id && l.id.toString().includes(val))
            );
            render(filtered);
        });
    }

    /**
     * КНОПКИ ПЕРЕКЛЮЧЕНИЯ
     */
    listButtons.forEach(button => {
        if (button.dataset.list === currentListId) button.classList.add('active-list');
        button.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
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
        if (!snowToggle || !snowToggle.checked || !snowContainer) return;
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        const size = Math.random() * 5 + 4 + 'px'; 
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
