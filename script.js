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
    
    // Определяем, какой эффект сейчас активен (по умолчанию сакура, если хочешь)
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

    // 4. ГЕНЕРАЦИЯ ЧАСТИЦ (ТВОЙ СТАРЫЙ РАБОЧИЙ МЕТОД)
    function createParticle() {
        if (!snowToggle.checked) return; // Проверка галочки "СНЕГ" (или эффекты)

        const p = document.createElement('div');
        const startX = Math.random() * 100;
        
        if (activeEffect === 'snow') {
            p.className = 'snowflake';
            const size = (Math.random() * (currentSnowSize / 2) + Number(currentSnowSize)) + 'px';
            p.style.width = size; p.style.height = size;
            p.style.left = startX + 'vw';
            p.style.animationDuration = (Math.random() * 3 + 2) + 's';
        } else {
            p.className = 'sakura-leaf';
            const randomImg = sakuraFiles[Math.floor(Math.random() * sakuraFiles.length)];
            const size = (Math.random() * 15 + 20) + 'px';
            
            p.style.backgroundImage = `url('res/${randomImg}')`;
            p.style.width = size; p.style.height = size;
            p.style.left = startX + 'vw';
            
            // Скорость падения (7-12 секунд)
            const duration = (Math.random() * 5 + 7) + 's';
            p.style.animationDuration = duration;
        }

        snowContainer.appendChild(p);
        
        // Удаление после завершения анимации (через 12 сек макс)
        setTimeout(() => { p.remove(); }, 12000);
    }

    // 5. ИНТЕРВАЛ
    setInterval(createParticle, 300);

    // 6. ОСТАЛЬНАЯ ЛОГИКА (Settings / List)
    if (settingsBtn) {
        settingsBtn.onclick = (e) => {
            e.stopPropagation();
            settingsMenu.classList.toggle('active');
        };
    }
    
    // Кнопки эффектов (если добавил их в HTML)
    document.querySelectorAll('input[name="effect"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            activeEffect = e.target.value;
            localStorage.setItem('activeEffect', activeEffect);
            snowContainer.innerHTML = '';
        });
    });

    // Загрузка списка уровней (упрощенно из твоего скрипта)
    async function loadList(listId) {
        // Твоя логика fetch...
    }
    loadList(currentListId);
});
