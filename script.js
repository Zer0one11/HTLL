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
    let myReqId = localStorage.getItem('myRequestID');

    let isSnowEnabled = localStorage.getItem('snowEnabled') !== 'false'; 
    let isSakuraEnabled = localStorage.getItem('sakuraEnabled') === 'true';

    const sakuraTextures = [
        'res/1000452088-removebg-preview.png', 'res/1000452089-removebg-preview.png',
        'res/1000452090-removebg-preview.png', 'res/1000452091-removebg-preview.png',
        'res/1000452092-removebg-preview.png', 'res/1000452093-removebg-preview.png',
        'res/1000452094-removebg-preview.png', 'res/1000452095-removebg-preview.png',
        'res/1000452096-removebg-preview.png', 'res/1000452097-removebg-preview.png'
    ];

    // 3. ПРИМЕНЕНИЕ НАСТРОЕК
    function applyOpacity(val) {
        document.documentElement.style.setProperty('--panel-opacity', val);
        localStorage.setItem('panelOpacity', val);
        document.querySelectorAll('.level-item').forEach(item => {
            item.style.setProperty('background', `rgba(var(--bg-card-raw), ${val})`, 'important');
        });
    }

    applyOpacity(currentOpacity);
    if(opacityRange) opacityRange.value = currentOpacity;
    if(snowSizeRange) snowSizeRange.value = currentSnowSize;
    if(sakuraSizeRange) sakuraSizeRange.value = currentSakuraSize;
    if(snowToggle) snowToggle.checked = isSnowEnabled;
    if(sakuraToggle) sakuraToggle.checked = isSakuraEnabled;

    // Переключатели эффектов
    if(snowToggle) snowToggle.onchange = () => {
        isSnowEnabled = snowToggle.checked;
        if (isSnowEnabled) {
            isSakuraEnabled = false;
            if(sakuraToggle) sakuraToggle.checked = false;
        }
        localStorage.setItem('snowEnabled', isSnowEnabled);
        localStorage.setItem('sakuraEnabled', isSakuraEnabled);
    };

    if(sakuraToggle) sakuraToggle.onchange = () => {
        isSakuraEnabled = sakuraToggle.checked;
        if (isSakuraEnabled) {
            isSnowEnabled = false;
            if(snowToggle) snowToggle.checked = false;
        }
        localStorage.setItem('sakuraEnabled', isSakuraEnabled);
        localStorage.setItem('snowEnabled', isSnowEnabled);
    };

    // 4. ФУНКЦИИ ЧАСТИЦ (ФИЗИКА)
    function createSnowflake() {
        if (!isSnowEnabled || !snowContainer) return;
        const sf = document.createElement('div');
        sf.className = 'snowflake';
        const size = (Math.random() * 3 + Number(currentSnowSize)) + 'px';
        sf.style.width = size; 
        sf.style.height = size;
        sf.style.left = Math.random() * 100 + 'vw';
        sf.style.opacity = Math.random();
        // Прямое назначение анимации через стиль
        sf.style.animation = `snow-fall ${Math.random() * 3 + 4}s linear forwards`;
        snowContainer.appendChild(sf);
        setTimeout(() => sf.remove(), 7000);
    }

    function createSakura() {
        if (!isSakuraEnabled || !snowContainer) return;
        const petal = document.createElement('div');
        petal.className = 'sakura-petal';
        petal.style.backgroundImage = `url('${sakuraTextures[Math.floor(Math.random() * sakuraTextures.length)]}')`;
        const size = (Math.random() * 10 + Number(currentSakuraSize)) + 'px';
        petal.style.width = size; 
        petal.style.height = size;
        petal.style.left = Math.random() * 100 + 'vw';
        petal.style.animation = `sakura-fall ${Math.random() * 5 + 7}s linear forwards`;
        snowContainer.appendChild(petal);
        setTimeout(() => petal.remove(), 12000);
    }

    // 5. ЛОГИКА СПИСКОВ
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
                
                const botterHtml = (level.fv && level.fv.toLowerCase() !== 'none') 
                    ? `<li><span class="detail-label">Botter:</span> ${level.fv}</li>` : '';
                const typeHtml = (level.type && level.type.toLowerCase() !== 'none') 
                    ? `<li><span class="detail-label">Type:</span> ${level.type}</li>` : '';

                li.innerHTML = `
                    <div class="level-header">
                        <span class="level-number">#${level.number}</span>
                        <div class="level-title-group">
                            <a href="${level.showcase}" target="_blank" class="level-name">${level.name}</a>
                            <span class="level-creator">by ${level.creator}</span>
                        </div>
                    </div>
                    <ul class="level-details">
                        <li><span class="detail-label">ID:</span> ${level.id} <img src="res/copybutton.png" class="copy-icon" onclick="copyToClipboard('${level.id}')"></li>
                        <li><span class="detail-label">FPS:</span> ${level.fps}</li>
                        ${botterHtml}
                        ${typeHtml}
                    </ul>`;
                listElement.appendChild(li);
            });
            localStorage.setItem('currentListId', listId);
            applyOpacity(currentOpacity);
        } catch (e) { console.error(e); }
    }

    // 6. РЕКВЕСТЫ
    const openRequestBtn = document.getElementById('open-request-btn');
    if(openRequestBtn) {
        openRequestBtn.onclick = () => {
            const user = window.auth ? window.auth.currentUser : null;
            if (!user) { alert("Сначала войдите."); return; }
            if (!user.emailVerified) { alert("Подтвердите почту!"); return; }
            reqModal.style.display = 'flex';
        };
    }

    // Интервалы (Запуск физики)
    setInterval(createSnowflake, 150);
    setInterval(createSakura, 300);

    // Первичная загрузка
    loadList(currentListId);
});
