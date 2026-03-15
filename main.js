// main.js — Основная логика и эффекты

document.addEventListener('DOMContentLoaded', () => {
    // 1. ИНИЦИАЛИЗАЦИЯ ИНТЕРФЕЙСА
    // Применяем сохраненные настройки темы и прозрачности сразу
    if (typeof applyTheme === 'function') {
        applyTheme(localStorage.getItem('siteTheme') || 'dark');
    }
    if (typeof applyOpacity === 'function') {
        applyOpacity(localStorage.getItem('panelOpacity') || '0.01');
    }

    // 2. УПРАВЛЕНИЕ МОДАЛКАМИ
    const openBtn = document.getElementById('open-request-btn');
    if (openBtn) openBtn.onclick = handleRequestModal;

    const closeReqBtn = document.getElementById('close-modal');
    if (closeReqBtn) {
        closeReqBtn.onclick = () => {
            document.getElementById('request-modal').style.display = 'none';
        };
    }

    // 3. ОБРАБОТКА ФОРМЫ РЕКВЕСТА
    const reqForm = document.getElementById('request-form');
    if (reqForm) {
        reqForm.onsubmit = async (e) => {
            e.preventDefault();
            const { ref, push, set } = window.dbRefs;
            
            // Генерируем новый ID в Firebase
            const newId = push(ref(window.db, 'requests')).key;
            
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

            try {
                await set(ref(window.db, 'requests/' + newId), data);
                localStorage.setItem('myRequestID', newId);
                
                // Переключаем интерфейс на чат
                document.getElementById('request-form-container').style.display = 'none';
                document.getElementById('chat-section').style.display = 'block';
                if (typeof initUserChat === 'function') initUserChat(newId);
            } catch (err) {
                alert("Ошибка при отправке: " + err.message);
            }
        };
    }

    // 4. ЭФФЕКТЫ ЧАСТИЦ (СНЕГ И САКУРА)
    const snowContainer = document.getElementById('snow-container');
    const sakuraTextures = [
        'res/1000452088-removebg-preview.png', 'res/1000452089-removebg-preview.png', 
        'res/1000452090-removebg-preview.png', 'res/1000452091-removebg-preview.png', 
        'res/1000452092-removebg-preview.png', 'res/1000452093-removebg-preview.png', 
        'res/1000452094-removebg-preview.png', 'res/1000452095-removebg-preview.png', 
        'res/1000452096-removebg-preview.png', 'res/1000452097-removebg-preview.png'
    ];

    function createSnowflake() {
        // Проверка включения в реальном времени
        const isSnowEnabled = localStorage.getItem('snowEnabled') !== 'false';
        if (!isSnowEnabled || !snowContainer) return;
        
        const sf = document.createElement('div');
        sf.className = 'snowflake';
        
        const currentSnowSize = Number(localStorage.getItem('snowSize')) || 5;
        const size = (Math.random() * 3 + currentSnowSize) + 'px';
        
        sf.style.width = size; 
        sf.style.height = size;
        sf.style.left = Math.random() * 100 + 'vw';
        sf.style.opacity = Math.random() * 0.7 + 0.3;
        
        const duration = Math.random() * 3 + 4;
        sf.style.animation = `snow-fall ${duration}s linear forwards`;
        
        snowContainer.appendChild(sf);
        setTimeout(() => sf.remove(), duration * 1000);
    }

    function createSakura() {
        // Проверка включения в реальном времени
        const isSakuraEnabled = localStorage.getItem('sakuraEnabled') === 'true';
        if (!isSakuraEnabled || !snowContainer) return;

        const petal = document.createElement('div');
        petal.className = 'sakura-petal';
        
        // Рандомная текстура из списка
        const texIndex = Math.floor(Math.random() * sakuraTextures.length);
        petal.style.backgroundImage = `url('${sakuraTextures[texIndex]}')`;
        
        const currentSakuraSize = Number(localStorage.getItem('sakuraSize')) || 25;
        const size = (Math.random() * 10 + currentSakuraSize) + 'px';
        
        petal.style.width = size; 
        petal.style.height = size;
        petal.style.left = Math.random() * 100 + 'vw';
        
        const duration = Math.random() * 5 + 7;
        petal.style.animation = `sakura-fall ${duration}s linear forwards`;
        
        snowContainer.appendChild(petal);
        setTimeout(() => petal.remove(), duration * 1000);
    }

    // Запускаем интервалы (они работают всегда, но функции внутри «молчат», если выключено)
    setInterval(createSnowflake, 200);
    setInterval(createSakura, 350);

    // 5. МЕНЮ НАСТРОЕК
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');

    if (settingsBtn && settingsMenu) {
        settingsBtn.onclick = (e) => {
            e.stopPropagation();
            settingsMenu.classList.toggle('active');

            // При открытии обновляем значения ползунков под актуальные данные из LS
            const snowRange = document.getElementById('snow-range');
            const sakuraRange = document.getElementById('sakura-range');
            const snowToggle = document.getElementById('snow-toggle');
            const sakuraToggle = document.getElementById('sakura-toggle');

            if (snowRange) snowRange.value = localStorage.getItem('snowSize') || 5;
            if (sakuraRange) sakuraRange.value = localStorage.getItem('sakuraSize') || 25;
            if (snowToggle) snowToggle.checked = localStorage.getItem('snowEnabled') !== 'false';
            if (sakuraToggle) sakuraToggle.checked = localStorage.getItem('sakuraEnabled') === 'true';
        };

        // Закрытие меню при клике вне его
        document.addEventListener('click', () => {
            settingsMenu.classList.remove('active');
        });
        settingsMenu.onclick = (e) => e.stopPropagation();
    }

    // 6. КНОПКИ ПЕРЕКЛЮЧЕНИЯ СПИСКОВ И ТЕМ
    document.querySelectorAll('.list-button').forEach(btn => {
        btn.onclick = () => {
            if (typeof loadList === 'function') loadList(btn.dataset.list);
        };
    });

    document.querySelectorAll('.theme-button').forEach(btn => {
        btn.onclick = () => {
            if (typeof applyTheme === 'function') applyTheme(btn.dataset.theme);
        };
    });

    // Загружаем список по умолчанию при старте
    if (typeof loadList === 'function') {
        const lastList = localStorage.getItem('currentListId') || 'levels';
        loadList(lastList);
    }
});
