document.addEventListener('DOMContentLoaded', () => {
    // 1. ЭЛЕМЕНТЫ UI
    const listElement = document.getElementById('levelList');
    const snowToggle = document.getElementById('snow-toggle');
    const sakuraToggle = document.getElementById('sakura-toggle');
    const snowContainer = document.getElementById('snow-container');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    
    const snowSizeRange = document.getElementById('snowSizeRange');
    const sakuraSizeRange = document.getElementById('sakuraSizeRange');
    const opacityRange = document.getElementById('opacityRange');
    const reqModal = document.getElementById('request-modal');

    // 2. СОСТОЯНИЕ
    let currentSnowSize = localStorage.getItem('snowSize') || '5';
    let currentSakuraSize = localStorage.getItem('sakuraSize') || '25';
    let currentOpacity = localStorage.getItem('panelOpacity') || '0.01';
    let currentTheme = localStorage.getItem('siteTheme') || 'dark';
    let currentListId = localStorage.getItem('currentListId') || 'levels';
    
    // Сохранение состояний ВКЛ/ВЫКЛ
    const isSnowEnabled = localStorage.getItem('snowEnabled') !== 'false'; 
    const isSakuraEnabled = localStorage.getItem('sakuraEnabled') === 'true';

    const sakuraTextures = [
        'res/1000452088-removebg-preview.png', 'res/1000452089-removebg-preview.png',
        'res/1000452090-removebg-preview.png', 'res/1000452091-removebg-preview.png',
        'res/1000452092-removebg-preview.png', 'res/1000452093-removebg-preview.png',
        'res/1000452094-removebg-preview.png', 'res/1000452095-removebg-preview.png',
        'res/1000452096-removebg-preview.png', 'res/1000452097-removebg-preview.png'
    ];

    // 3. ФУНКЦИИ
    function applyOpacity(val) {
        document.documentElement.style.setProperty('--panel-opacity', val);
        localStorage.setItem('panelOpacity', val);
    }
    function applySnowSize(val) {
        currentSnowSize = val;
        localStorage.setItem('snowSize', val);
    }
    function applySakuraSize(val) {
        currentSakuraSize = val;
        localStorage.setItem('sakuraSize', val);
    }
    function applyTheme(themeName) {
        document.body.className = `theme-${themeName}`;
        localStorage.setItem('siteTheme', themeName);
    }

    // Инициализация
    applyOpacity(currentOpacity);
    applySnowSize(currentSnowSize);
    applySakuraSize(currentSakuraSize);
    applyTheme(currentTheme);

    opacityRange.value = currentOpacity;
    snowSizeRange.value = currentSnowSize;
    sakuraSizeRange.value = currentSakuraSize;
    snowToggle.checked = isSnowEnabled;
    sakuraToggle.checked = isSakuraEnabled;

    // Взаимоисключение
    snowToggle.addEventListener('change', () => {
        if (snowToggle.checked) sakuraToggle.checked = false;
        localStorage.setItem('snowEnabled', snowToggle.checked);
        localStorage.setItem('sakuraEnabled', sakuraToggle.checked);
    });

    sakuraToggle.addEventListener('change', () => {
        if (sakuraToggle.checked) snowToggle.checked = false;
        localStorage.setItem('sakuraEnabled', sakuraToggle.checked);
        localStorage.setItem('snowEnabled', snowToggle.checked);
    });

    // 4. ГЕНЕРАЦИЯ ЧАСТИЦ
    function createSnowflake() {
        if (!snowToggle.checked) return;
        const sf = document.createElement('div');
        sf.className = 'snowflake';
        const size = (Math.random() * (currentSnowSize / 2) + Number(currentSnowSize)) + 'px';
        sf.style.width = size; sf.style.height = size;
        sf.style.left = Math.random() * 100 + 'vw';
        sf.style.animationDuration = Math.random() * 3 + 4 + 's';
        snowContainer.appendChild(sf);
        setTimeout(() => sf.remove(), 7000);
    }

    function createSakura() {
        if (!sakuraToggle.checked) return;
        const petal = document.createElement('div');
        petal.className = 'sakura-petal';
        const randomImg = sakuraTextures[Math.floor(Math.random() * sakuraTextures.length)];
        petal.style.backgroundImage = `url('${randomImg}')`;
        
        const sizeBase = Number(currentSakuraSize);
        const size = (Math.random() * (sizeBase / 2) + sizeBase) + 'px';
        
        petal.style.width = size; petal.style.height = size;
        petal.style.left = Math.random() * 100 + 'vw';
        petal.style.animationDuration = Math.random() * 5 + 5 + 's';
        snowContainer.appendChild(petal);
        setTimeout(() => petal.remove(), 10000);
    }

    // Слушатели для ползунков
    opacityRange.oninput = (e) => applyOpacity(e.target.value);
    snowSizeRange.oninput = (e) => applySnowSize(e.target.value);
    sakuraSizeRange.oninput = (e) => applySakuraSize(e.target.value);

    // Открытие меню
    settingsBtn.onclick = (e) => {
        e.stopPropagation();
        settingsMenu.classList.toggle('active');
    };

    setInterval(createSnowflake, 150);
    setInterval(createSakura, 200);

    // Остальной твой код (loadList, Firebase и т.д.) должен идти ниже...
});
