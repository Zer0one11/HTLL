document.addEventListener('DOMContentLoaded', () => {
    // 1. ЭЛЕМЕНТЫ UI
    const listElement = document.getElementById('levelList');
    const snowToggle = document.getElementById('snow-toggle');
    const snowContainer = document.getElementById('snow-container');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const snowSizeRange = document.getElementById('snowSizeRange');
    const opacityRange = document.getElementById('opacityRange');

    // 2. СОСТОЯНИЕ
    let currentSnowSize = localStorage.getItem('snowSize') || '5';
    let currentOpacity = localStorage.getItem('panelOpacity') || '0.01';
    let currentTheme = localStorage.getItem('siteTheme') || 'dark';
    let currentListId = localStorage.getItem('currentListId') || 'levels';
    
    // По умолчанию ставим сакуру, если не выбрано иное
    let activeEffect = localStorage.getItem('activeEffect') || 'sakura';

    const sakuraFiles = [
        '1000452088-removebg-preview.png', '1000452089-removebg-preview.png',
        '1000452090-removebg-preview.png', '1000452091-removebg-preview.png',
        '1000452092-removebg-preview.png', '1000452093-removebg-preview.png',
        '1000452094-removebg-preview.png', '1000452095-removebg-preview.png',
        '1000452096-removebg-preview.png', '1000452097-removebg-preview.png'
    ];

    // 3. ФУНКЦИИ НАСТРОЕК
    function applyOpacity(val) {
        document.documentElement.style.setProperty('--panel-opacity', val);
        localStorage.setItem('panelOpacity', val);
    }
    function applySnowSize(val) {
        currentSnowSize = val;
        localStorage.setItem('snowSize', val);
    }
    function applyTheme(themeName) {
        document.body.className = `theme-${themeName}`;
        localStorage.setItem('siteTheme', themeName);
    }

    applyOpacity(currentOpacity);
    applySnowSize(currentSnowSize);
    applyTheme(currentTheme);

    // 4. ГЕНЕРАЦИЯ ЧАСТИЦ (ФИНАЛЬНАЯ ЛОГИКА)
    function createParticle() {
        if (!snowToggle.checked) return; 

        const p = document.createElement('div');
        const startX = Math.random() * 100;
        const duration = Math.random() * 5 + 7; // Медленное падение (7-12 сек)

        if (activeEffect === 'snow') {
            p.className = 'snowflake';
            const size = (Math.random() * (currentSnowSize / 2) + Number(currentSnowSize)) + 'px';
            p.style.width = size; 
            p.style.height = size;
            p.style.left = startX + 'vw';
            p.style.animationDuration = (Math.random() * 3 + 2) + 's';
        } else {
            p.className = 'sakura-leaf';
            const randomImg = sakuraFiles[Math.floor(Math.random() * sakuraFiles.length)];
            const size = (Math.random() * 15 + 25) + 'px';
            
            p.style.backgroundImage = `url('res/${randomImg}')`;
            p.style.width = size; 
            p.style.height = size;
            p.style.left = startX + 'vw';
            
            // Задаем только время. Названия анимаций берем из CSS.
            p.style.animationDuration = `${duration}s, 4s`;
        }

        snowContainer.appendChild(p);
        
        // Удаляем строго после того, как частица улетит за экран
        setTimeout(() => { p.remove(); }, duration * 1000 + 1000);
    }

    // 5. ИНТЕРВАЛ (РАЗ В 0.3 СЕКУНДЫ)
    setInterval(createParticle, 300);

    // 6. ОБРАБОТКА ВЫБОРА ЭФФЕКТА
    document.querySelectorAll('input[name="effect"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            activeEffect = e.target.value;
            localStorage.setItem('activeEffect', activeEffect);
            snowContainer.innerHTML = ''; // Очищаем экран при смене
        });
    });

    // 7. ЗАГРУЗКА СПИСКА УРОВНЕЙ
    async function loadList(listId) {
        const listMap = { 
            'levels': 'levels.json', 'ppll': 'ppll.json', 'sll': 'sll.json', 
            'ill': 'ill.json', 'inf': 'inf.json', 'scl': 'scl.json', 'icl': 'icl.json' 
        };
        
        try {
            const response = await fetch(listMap[listId] + '?t=' + Date.now());
            const data = await response.json();
            
            listElement.innerHTML = '';
            data.forEach(level => {
                const li = document.createElement('li');
                li.className = 'level-item';
                li.innerHTML = `
                    <div class="level-header">
                        <span class="level-number">#${level.number}</span>
                        <div class="level-title-group">
                            <a href="${level.showcase}" target="_blank" class="level-name">${level.name}</a>
                            <span class="level-creator">by ${level.creator}</span>
                        </div>
                    </div>`;
                listElement.appendChild(li);
            });
        } catch (e) {
            console.error("Ошибка загрузки списка:", e);
        }
    }

    // 8. СОБЫТИЯ UI
    if (settingsBtn) {
        settingsBtn.onclick = (e) => {
            e.stopPropagation();
            settingsMenu.classList.toggle('active');
        };
    }

    if (opacityRange) opacityRange.oninput = (e) => applyOpacity(e.target.value);
    if (snowSizeRange) snowSizeRange.oninput = (e) => applySnowSize(e.target.value);

    document.querySelectorAll('.list-button').forEach(b => {
        b.onclick = () => {
            document.querySelectorAll('.list-button').forEach(btn => btn.classList.remove('active-list'));
            b.classList.add('active-list');
            loadList(b.dataset.list);
        };
    });

    // Загрузка начального списка
    loadList(currentListId);
});
