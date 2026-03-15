document.addEventListener('DOMContentLoaded', () => {
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

    // --- УТИЛИТЫ ---
    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(() => {
            const oldNotif = document.querySelector('.copy-notification');
            if (oldNotif) oldNotif.remove();
            const notif = document.createElement('div');
            notif.className = 'copy-notification';
            notif.innerText = `ID ${text} СКОПИРОВАН!`;
            document.body.appendChild(notif);
            setTimeout(() => {
                notif.style.opacity = '0';
                setTimeout(() => notif.remove(), 500);
            }, 2000);
        });
    };

    function formatLatex(text) {
        if (!text || text.toString().toLowerCase() === "none" || text === "") return "None";
        let str = text.toString();
        if (str.includes('\\') || str.includes('^') || str.includes('_')) {
            if (!str.startsWith('$')) return `$${str}$`;
        }
        return str;
    }

    // --- ВИЗУАЛ ---
    function applyOpacity(val) {
        document.documentElement.style.setProperty('--panel-opacity', val);
        localStorage.setItem('panelOpacity', val);
        document.querySelectorAll('.level-item').forEach(item => {
            item.style.setProperty('background', `rgba(var(--bg-card-raw), ${val})`, 'important');
        });
    }

    function applyTheme(themeName) {
        document.body.className = `theme-${themeName}`;
        localStorage.setItem('siteTheme', themeName);
        document.querySelectorAll('.theme-button').forEach(btn => {
            btn.classList.toggle('active-theme', btn.dataset.theme === themeName);
        });
    }

    applyOpacity(currentOpacity);
    applyTheme(currentTheme);

    // --- ЧАТ (ОТОБРАЖЕНИЕ СООБЩЕНИЙ) ---
    function initUserChat(reqId) {
        const { ref, onValue, push, set, remove } = window.dbRefs;
        const chatMessages = document.getElementById('chat-messages');

        // СЛУШАЕМ СООБЩЕНИЯ В РЕАЛЬНОМ ВРЕМЕНИ
        onValue(ref(window.db, `requests/${reqId}/messages`), (snapshot) => {
            chatMessages.innerHTML = '';
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const msg = childSnapshot.val();
                    const msgDiv = document.createElement('div');
                    msgDiv.className = msg.role === 'admin' ? 'msg-admin' : 'msg-user';
                    // Стили для текста
                    msgDiv.style.color = msg.role === 'admin' ? '#ff4444' : '#44ff44';
                    msgDiv.style.marginBottom = '5px';
                    msgDiv.style.fontWeight = '900';
                    msgDiv.innerText = `${msg.role === 'admin' ? 'Админ' : 'Вы'}: ${msg.text}`;
                    chatMessages.appendChild(msgDiv);
                });
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        });

        // ОТПРАВКА СООБЩЕНИЯ
        document.getElementById('send-msg').onclick = async () => {
            const input = document.getElementById('user-msg');
            const text = input.value.trim();
            if (!text) return;

            const msgRef = push(ref(window.db, `requests/${reqId}/messages`));
            await set(msgRef, {
                text: text,
                role: 'user',
                timestamp: Date.now()
            });
            input.value = '';
        };

        // УДАЛЕНИЕ ЧАТА
        document.getElementById('delete-chat-user').onclick = async () => {
            if(confirm("Удалить реквест и чат?")) {
                await remove(ref(window.db, `requests/${reqId}`));
                localStorage.removeItem('myRequestID');
                location.reload();
            }
        };
    }

    // --- РЕКВЕСТЫ (ФОРМА) ---
    const openRequestBtn = document.getElementById('open-request-btn');
    if(openRequestBtn) {
        openRequestBtn.onclick = async () => {
            const user = window.auth ? window.auth.currentUser : null;
            if (!user) { alert("Войдите в аккаунт."); return; }
            if (!user.emailVerified) { alert("Подтвердите почту!"); return; }

            myReqId = localStorage.getItem('myRequestID');
            if (myReqId) {
                const { get, ref } = window.dbRefs;
                const snapshot = await get(ref(window.db, 'requests/' + myReqId));
                if (snapshot.exists()) {
                    document.getElementById('request-form-container').style.display = 'none';
                    document.getElementById('chat-section').style.display = 'block';
                    initUserChat(myReqId);
                } else {
                    localStorage.removeItem('myRequestID');
                    myReqId = null;
                    showForm(user);
                }
            } else { showForm(user); }
            reqModal.style.display = 'flex';
        };
    }

    function showForm(user) {
        document.getElementById('request-form-container').style.display = 'block';
        document.getElementById('chat-section').style.display = 'none';
        if(document.getElementById('req-nickname')) document.getElementById('req-nickname').value = user.displayName || "";
    }

    // ИСПРАВЛЕННАЯ ОТПРАВКА (БЕЗ UNDEFINED)
    const reqForm = document.getElementById('request-form');
    if(reqForm) {
        reqForm.onsubmit = async (e) => {
            e.preventDefault();
            const user = window.auth.currentUser;
            const { ref, push, set } = window.dbRefs;

            const requestId = push(ref(window.db, 'requests')).key;
            const requestData = {
                id: requestId,
                uid: user.uid,
                nickname: document.getElementById('req-nickname').value,
                levelName: document.getElementById('req-level-name').value, // Имя уровня
                creator: document.getElementById('req-creator').value,
                levelId: document.getElementById('req-id').value,           // ID уровня
                fps: document.getElementById('req-fps').value,
                fv: document.getElementById('req-fv').value || "None",
                type: document.getElementById('req-type').value || "None",
                list: document.getElementById('req-list').value,
                showcase: document.getElementById('req-showcase').value,
                status: 'pending',
                timestamp: Date.now()
            };

            try {
                await set(ref(window.db, 'requests/' + requestId), requestData);
                localStorage.setItem('myRequestID', requestId);
                alert("Отправлено!");
                document.getElementById('request-form-container').style.display = 'none';
                document.getElementById('chat-section').style.display = 'block';
                initUserChat(requestId);
            } catch (err) { alert("Ошибка!"); }
        };
    }

    // --- ОСТАЛЬНОЕ (СПИСКИ, СНЕГ) ---
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
                        <li><span class="detail-label">ID:</span> ${level.id} <img src="res/copybutton.png" class="copy-icon" onclick="copyToClipboard('${level.id}')"></li>
                        <li><span class="detail-label">FPS:</span> ${formatLatex(level.fps)}</li>
                    </ul>`;
                listElement.appendChild(li);
            });
            localStorage.setItem('currentListId', listId);
            document.querySelectorAll('.list-button').forEach(btn => btn.classList.toggle('active-list', btn.dataset.list === listId));
            applyOpacity(currentOpacity);
        } catch (e) { console.error(e); }
    }

    setInterval(() => { if(isSnowEnabled) createSnowflake(); }, 200);
    setInterval(() => { if(isSakuraEnabled) createSakura(); }, 350);
    
    function createSnowflake() {
        const sf = document.createElement('div');
        sf.className = 'snowflake';
        const size = (Math.random() * 3 + Number(currentSnowSize)) + 'px';
        sf.style.width = size; sf.style.height = size;
        sf.style.left = Math.random() * 100 + 'vw';
        sf.style.animation = `snow-fall ${Math.random() * 3 + 4}s linear forwards`;
        snowContainer.appendChild(sf);
        setTimeout(() => sf.remove(), 7000);
    }

    function createSakura() {
        const petal = document.createElement('div');
        petal.className = 'sakura-petal';
        petal.style.backgroundImage = `url('${sakuraTextures[Math.floor(Math.random() * 10)]}')`;
        const size = (Math.random() * 10 + Number(currentSakuraSize)) + 'px';
        petal.style.width = size; petal.style.height = size;
        petal.style.left = Math.random() * 100 + 'vw';
        petal.style.animation = `sakura-fall ${Math.random() * 5 + 7}s linear forwards`;
        snowContainer.appendChild(petal);
        setTimeout(() => petal.remove(), 12000);
    }

    if(settingsBtn) settingsBtn.onclick = (e) => { e.stopPropagation(); settingsMenu.classList.toggle('active'); };
    document.querySelectorAll('.list-button').forEach(b => b.onclick = () => loadList(b.dataset.list));
    if(document.getElementById('close-modal')) document.getElementById('close-modal').onclick = () => reqModal.style.display = 'none';

    loadList(currentListId);
});
