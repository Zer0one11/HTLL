document.addEventListener('DOMContentLoaded', () => {
    const listElement = document.getElementById('levelList');
    const body = document.body;
    const mainTitle = document.querySelector('.main-title');
    const themeButtons = document.querySelectorAll('.theme-button');
    const listButtons = document.querySelectorAll('.list-button');
    const snowToggle = document.getElementById('snow-toggle');
    const snowContainer = document.getElementById('snow-container');
    
    // Создаем контейнер для поиска (стиль как у кнопки снега)
    const controlsContainer = document.querySelector('.controls') || document.body;
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'search-wrapper';
    searchWrapper.innerHTML = `
        <input type="text" id="levelSearch" placeholder="Поиск уровня по названию или ID..." autocomplete="off">
    `;
    // Вставляем поиск перед списком или в блок управления
    const topSection = document.querySelector('.top-section') || body;
    topSection.appendChild(searchWrapper);

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

    let allData = []; // Хранилище для всех уровней текущего списка
    let currentListId = localStorage.getItem('currentListId') || 'levels';
    setTheme(localStorage.getItem('siteTheme') || 'dark');

    // СОХРАНЕНИЕ СНЕГА
    const snowSaved = localStorage.getItem('snowEnabled');
    snowToggle.checked = snowSaved !== 'false'; 
    snowToggle.addEventListener('change', () => localStorage.setItem('snowEnabled', snowToggle.checked));

    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const newTheme = button.dataset.theme;
            setTheme(newTheme);
            localStorage.setItem('siteTheme', newTheme);
            themeButtons.forEach(btn => btn.classList.remove('active-theme'));
            button.classList.add('active-theme');
        });
    });

    listButtons.forEach(button => {
        if (button.dataset.list === currentListId) button.classList.add('active-list');
        button.addEventListener('click', () => {
            currentListId = button.dataset.list;
            localStorage.setItem('currentListId', currentListId);
            loadList(currentListId);
            listButtons.forEach(btn => btn.classList.remove('active-list'));
            button.classList.add('active-list');
            searchInput.value = ''; // Сброс поиска при смене списка
        });
    });

    function setTheme(themeName) { body.className = `theme-${themeName}`; }

    function formatLatex(text) {
        if (typeof text !== 'string' || text === "none") return text;
        const hasLatex = text.includes('\\') || text.includes('^') || text.includes('_');
        if (hasLatex && !text.startsWith('$')) {
            let processed = text;
            processed = processed.replace(/(?<!\\)\b([a-z]{3,})\b/gi, (match) => `\\text{${match}}`);
            return `$${processed}$`;
        }
        return text;
    }

    function renderList(data) {
        listElement.innerHTML = '';
        data.forEach((level, index) => {
            const li = document.createElement('li');
            li.className = 'level-item';
            li.style.animationDelay = `${index * 0.05}s`; // Плавное каскадное появление
            
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

        if (window.MathJax && window.MathJax.typesetPromise) {
            MathJax.typesetPromise();
        }
    }

    function loadList(listId) {
        const listConfig = listMap[listId];
        mainTitle.textContent = listConfig.title;
        listElement.innerHTML = ''; 

        fetch(listConfig.file + '?t=' + Date.now())
            .then(r => r.json())
            .then(data => {
                allData = data.sort((a, b) => parseInt(a.number) - parseInt(b.number));
                renderList(allData);
            })
            .catch(err => console.error("Ошибка:", err));
    }

    // ЛОГИКА ПОИСКА
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allData.filter(level => 
            level.name.toLowerCase().includes(term) || 
            level.id.toString().includes(term) ||
            level.creator.toLowerCase().includes(term)
        );
        renderList(filtered);
    });

    function createSnowflake() {
        if (!snowToggle.checked) return;
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
