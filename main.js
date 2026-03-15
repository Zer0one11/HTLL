document.addEventListener('DOMContentLoaded', () => {
    // Инициализация состояний
    let currentSnowSize = localStorage.getItem('snowSize') || '5';
    let currentSakuraSize = localStorage.getItem('sakuraSize') || '25';
    let isSnowEnabled = localStorage.getItem('snowEnabled') !== 'false'; 
    let isSakuraEnabled = localStorage.getItem('sakuraEnabled') === 'true';

    // Используем функции из ui.js
    if (typeof applyTheme === 'function') {
        applyTheme(localStorage.getItem('siteTheme') || 'dark');
    }
    if (typeof applyOpacity === 'function') {
        applyOpacity(localStorage.getItem('panelOpacity') || '0.01');
    }

    const openBtn = document.getElementById('open-request-btn');
    if(openBtn) openBtn.onclick = handleRequestModal;

    const reqForm = document.getElementById('request-form');
    if(reqForm) {
        reqForm.onsubmit = async (e) => {
            e.preventDefault();
            const { ref, push, set } = window.dbRefs;
            const newId = push(ref(window.db, 'requests')).key;
            
            // КЛЮЧИ ИСПРАВЛЕНЫ (соответствуют админ-панели)
            const data = {
                id: newId, 
                uid: window.auth.currentUser.uid,
                nickname: document.getElementById('req-nickname').value,
                levelName: document.getElementById('req-level-name').value,
                creator: document.getElementById('req-creator').value,
                levelId: document.getElementById('req-id').value,
                fps: document.getElementById('req-fps').value,
                fv: document.getElementById('req-fv').value || "None",
                type: document.getElementById('req-type').value || "None",
                list: document.getElementById('req-list').value,
                showcase: document.getElementById('req-showcase').value,
                status: 'pending', 
                timestamp: Date.now(),
                hasUnread: false
            };

            await set(ref(window.db, 'requests/' + newId), data);
            localStorage.setItem('myRequestID', newId);
            
            document.getElementById('request-form-container').style.display = 'none';
            document.getElementById('chat-section').style.display = 'block';
            initUserChat(newId);
        };
    }

    // ФИЗИКА СНЕГА И САКУРЫ
    const snowContainer = document.getElementById('snow-container');
    const sakuraTextures = [
        'res/1000452088-removebg-preview.png', 'res/1000452089-removebg-preview.png', 
        'res/1000452090-removebg-preview.png', 'res/1000452091-removebg-preview.png', 
        'res/1000452092-removebg-preview.png', 'res/1000452093-removebg-preview.png', 
        'res/1000452094-removebg-preview.png', 'res/1000452095-removebg-preview.png', 
        'res/1000452096-removebg-preview.png', 'res/1000452097-removebg-preview.png'
    ];

    function createSnowflake() {
        // Перепроверяем включение прямо в цикле
        isSnowEnabled = localStorage.getItem('snowEnabled') !== 'false';
        if (!isSnowEnabled || !snowContainer) return;
        
        const sf = document.createElement('div');
        sf.className = 'snowflake';
        currentSnowSize = localStorage.getItem('snowSize') || '5';
        
        const size = (Math.random() * 3 + Number(currentSnowSize)) + 'px';
        sf.style.width = size; 
        sf.style.height = size;
        sf.style.left = Math.random() * 100 + 'vw';
        sf.style.position = 'fixed';
        sf.style.top = '-10px';
        sf.style.backgroundColor = 'white';
        sf.style.borderRadius = '50%';
        sf.style.pointerEvents = 'none';
        sf.style.zIndex = '9998';
        sf.style.opacity = Math.random();
        
        // Анимация падения
        const duration = Math.random() * 3 + 4;
        sf.style.animation = `snow-fall ${duration}s linear forwards`;
        
        snowContainer.appendChild(sf);
        setTimeout(() => sf.remove(), duration * 1000);
    }

    function createSakura() {
        isSakuraEnabled = localStorage.getItem('sakuraEnabled') === 'true';
        if (!isSakuraEnabled || !snowContainer) return;

        const petal = document.createElement('div');
        petal.className = 'sakura-petal';
        petal.style.position = 'fixed';
        petal.style.top = '-20px';
        petal.style.zIndex = '9998';
        petal.style.pointerEvents = 'none';
        petal.style.backgroundImage = `url('${sakuraTextures[Math.floor(Math.random() * sakuraTextures.length)]}')`;
        petal.style.backgroundSize = 'cover';
        
        currentSakuraSize = localStorage.getItem('sakuraSize') || '25';
        const size = (Math.random() * 10 + Number(currentSakuraSize)) + 'px';
        petal.style.width = size; 
        petal.style.height = size;
        petal.style.left = Math.random() * 100 + 'vw';
        
        const duration = Math.random() * 5 + 7;
        petal.style.animation = `sakura-fall ${duration}s linear forwards`;
        
        snowContainer.appendChild(petal);
        setTimeout(() => petal.remove(), duration * 1000);
    }

    // Настройки
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    if(settingsBtn) {
        settingsBtn.onclick = (e) => { 
            e.stopPropagation(); 
            settingsMenu.classList.toggle('active'); 
        };
    }

    document.addEventListener('click', () => {
        if(settingsMenu) settingsMenu.classList.remove('active');
    });

    if(settingsMenu) {
        settingsMenu.onclick = (e) => e.stopPropagation();
    }

    // Обработчики кнопок
    document.querySelectorAll('.list-button').forEach(b => {
        b.onclick = () => {
            if (typeof loadList === 'function') loadList(b.dataset.list);
        };
    });
    
    document.querySelectorAll('.theme-button').forEach(b => {
        b.onclick = () => {
            if (typeof applyTheme === 'function') applyTheme(b.dataset.theme);
        };
    });

    if(document.getElementById('close-modal')) {
        document.getElementById('close-modal').onclick = () => {
            document.getElementById('request-modal').style.display = 'none';
        };
    }

    // Запуск циклов эффектов
    setInterval(createSnowflake, 200);
    setInterval(createSakura, 350);

    // Загрузка начального списка
    if (typeof loadList === 'function') {
        const lastList = localStorage.getItem('currentListId') || 'levels';
        loadList(lastList);
    }
});
