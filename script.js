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

    // 2. СОСТОЯНИЕ (Загрузка сохранений)
    let currentSnowSize = localStorage.getItem('snowSize') || '5';
    let currentSakuraSize = localStorage.getItem('sakuraSize') || '25';
    let currentOpacity = localStorage.getItem('panelOpacity') || '0.01';
    let currentTheme = localStorage.getItem('siteTheme') || 'dark';
    let currentListId = localStorage.getItem('currentListId') || 'levels';
    let myReqId = localStorage.getItem('myRequestID');

    const isSnowEnabled = localStorage.getItem('snowEnabled') !== 'false'; 
    const isSakuraEnabled = localStorage.getItem('sakuraEnabled') === 'true';

    const sakuraTextures = [
        'res/1000452088-removebg-preview.png', 'res/1000452089-removebg-preview.png',
        'res/1000452090-removebg-preview.png', 'res/1000452091-removebg-preview.png',
        'res/1000452092-removebg-preview.png', 'res/1000452093-removebg-preview.png',
        'res/1000452094-removebg-preview.png', 'res/1000452095-removebg-preview.png',
        'res/1000452096-removebg-preview.png', 'res/1000452097-removebg-preview.png'
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
    function applySakuraSize(val) {
        currentSakuraSize = val;
        localStorage.setItem('sakuraSize', val);
    }
    function applyTheme(themeName) {
        document.body.className = `theme-${themeName}`;
        localStorage.setItem('siteTheme', themeName);
        document.querySelectorAll('.theme-button').forEach(btn => {
            btn.classList.toggle('active-theme', btn.dataset.theme === themeName);
        });
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

    // 4. ФОРМАТИРОВАНИЕ LATEX
    function formatLatex(text) {
        if (!text || text === "none" || text === "") return "None";
        if (text.toString().includes('\\') || text.toString().includes('^')) {
            if (!text.toString().startsWith('$')) return `$${text}$`;
        }
        return text;
    }

    // 5. ЗАГРУЗКА СПИСКА (ВОССТАНОВЛЕНО)
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
                            <a href="${level.showcase}" target="_blank" class="level-name">${formatLatex(level.name)}</a>
                            <span class="level-creator">by ${level.creator}</span>
                        </div>
                    </div>
                    <ul class="level-details">
                        <li><span class="detail-label">ID:</span> ${level.id}</li>
                        <li><span class="detail-label">FPS:</span> ${formatLatex(level.fps)}</li>
                        ${level.fv ? `<li><span class="detail-label">Botter:</span> ${formatLatex(level.fv)}</li>` : ''}
                        ${level.type ? `<li><span class="detail-label">TYPE:</span> ${level.type}</li>` : ''}
                    </ul>`;
                listElement.appendChild(li);
            });
            localStorage.setItem('currentListId', listId);
            if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise();
        } catch (e) { console.error("Ошибка загрузки:", e); }
    }

    // 6. ЧАТ И УВЕДОМЛЕНИЯ (ВОССТАНОВЛЕНО)
    function initUserChat(reqId) {
        const { ref, push, onValue, remove } = window.dbRefs;
        const chatBox = document.getElementById('chat-messages');
        onValue(ref(window.db, `chats/${reqId}`), (snap) => {
            chatBox.innerHTML = '';
            snap.forEach(mSnap => {
                const m = mSnap.val();
                const div = document.createElement('div');
                div.style = `text-align:${m.role==='admin'?'left':'right'}; margin-bottom:12px;`;
                div.innerHTML = `<div style="display:inline-block; background:${m.role==='admin'?'#222':'#fff'}; color:${m.role==='admin'?'#fff':'#000'}; padding:10px 15px; border-radius:12px; font-size:0.9rem; max-width:80%;">${m.text}</div>`;
                chatBox.appendChild(div);
            });
            chatBox.scrollTop = chatBox.scrollHeight;
        });
        document.getElementById('send-msg').onclick = () => {
            const inp = document.getElementById('user-msg');
            if(inp.value.trim()) {
                push(ref(window.db, `chats/${reqId}`), { role: 'user', text: inp.value, timestamp: Date.now() });
                inp.value = '';
            }
        };
    }

    // 7. ЧАСТИЦЫ
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

    // 8. СОБЫТИЯ
    settingsBtn.onclick = (e) => { e.stopPropagation(); settingsMenu.classList.toggle('active'); };
    opacityRange.oninput = (e) => applyOpacity(e.target.value);
    snowSizeRange.oninput = (e) => applySnowSize(e.target.value);
    sakuraSizeRange.oninput = (e) => applySakuraSize(e.target.value);

    document.querySelectorAll('.list-button').forEach(b => {
        b.onclick = () => {
            document.querySelectorAll('.list-button').forEach(btn => btn.classList.remove('active-list'));
            b.classList.add('active-list');
            loadList(b.dataset.list);
        };
    });

    document.querySelectorAll('.theme-button').forEach(b => {
        b.onclick = () => applyTheme(b.dataset.theme);
    });

    document.getElementById('open-request-btn').onclick = () => {
        if (myReqId) {
            document.getElementById('request-form-container').style.display = 'none';
            document.getElementById('chat-section').style.display = 'block';
            initUserChat(myReqId);
        }
        reqModal.style.display = 'flex';
    };
    document.getElementById('close-modal').onclick = () => reqModal.style.display = 'none';

    // Форма реквеста
    document.getElementById('request-form').onsubmit = async (e) => {
        e.preventDefault();
        const { ref, push, set } = window.dbRefs;
        const rId = push(ref(window.db, 'requests')).key;
        const data = {
            id: rId, nickname: document.getElementById('req-nickname').value,
            level: document.getElementById('req-level-name').value, creator: document.getElementById('req-creator').value,
            lvlId: document.getElementById('req-id').value, fps: document.getElementById('req-fps').value,
            fv: document.getElementById('req-fv').value || 'None', type: document.getElementById('req-type').value || 'None',
            list: document.getElementById('req-list').value, showcase: document.getElementById('req-showcase').value,
            hasUnread: false, timestamp: Date.now()
        };
        await set(ref(window.db, 'requests/' + rId), data);
        localStorage.setItem('myRequestID', rId);
        myReqId = rId;
        location.reload();
    };

    // Запуск
    setInterval(createSnowflake, 150);
    setInterval(createSakura, 200);
    loadList(currentListId);
});
