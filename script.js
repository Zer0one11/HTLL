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

    // 3. ФУНКЦИЯ КОПИРОВАНИЯ
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

    // 4. ПРИМЕНЕНИЕ НАСТРОЕК
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

    // Инициализация UI
    applyOpacity(currentOpacity);
    applyTheme(currentTheme);
    if(opacityRange) opacityRange.value = currentOpacity;
    if(snowSizeRange) snowSizeRange.value = currentSnowSize;
    if(sakuraSizeRange) sakuraSizeRange.value = currentSakuraSize;
    if(snowToggle) snowToggle.checked = isSnowEnabled;
    if(sakuraToggle) sakuraToggle.checked = isSakuraEnabled;

    if(snowToggle) snowToggle.onchange = () => {
        if (snowToggle.checked) sakuraToggle.checked = false;
        localStorage.setItem('snowEnabled', snowToggle.checked);
        localStorage.setItem('sakuraEnabled', sakuraToggle.checked);
    };
    if(sakuraToggle) sakuraToggle.onchange = () => {
        if (sakuraToggle.checked) snowToggle.checked = false;
        localStorage.setItem('sakuraEnabled', sakuraToggle.checked);
        localStorage.setItem('snowEnabled', snowToggle.checked);
    };

    // 5. ФОРМАТИРОВАНИЕ LATEX
    function formatLatex(text) {
        if (!text || text === "none" || text === "") return "None";
        let str = text.toString();
        if (str.includes('\\') || str.includes('^') || str.includes('_')) {
            if (!str.startsWith('$')) return `$${str}$`;
        }
        return str;
    }

    // 6. ЗАГРУЗКА УРОВНЕЙ
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
                        <li>
                            <span class="detail-label">ID:</span> ${level.id} 
                            <img src="res/copybutton.png" class="copy-icon" onclick="copyToClipboard('${level.id}')">
                        </li>
                        <li><span class="detail-label">FPS:</span> ${formatLatex(level.fps)}</li>
                        ${level.fv ? `<li><span class="detail-label">Botter:</span> ${formatLatex(level.fv)}</li>` : ''}
                        ${level.type ? `<li><span class="detail-label">Type:</span> ${level.type}</li>` : ''}
                    </ul>
                `;
                listElement.appendChild(li);
            });

            localStorage.setItem('currentListId', listId);
            document.querySelectorAll('.list-button').forEach(btn => {
                btn.classList.toggle('active-list', btn.dataset.list === listId);
            });

            if (window.MathJax && window.MathJax.typesetPromise) {
                window.MathJax.typesetPromise();
            }
        } catch (e) { console.error(e); }
    }

    // 7. ЧАТ С ИСПОЛЬЗОВАНИЕМ AUTH НИКНЕЙМА
    function initUserChat(reqId) {
        const { ref, onValue, push } = window.dbRefs;
        const chatMessages = document.getElementById('chat-messages');
        const sendBtn = document.getElementById('send-msg');
        const userInput = document.getElementById('user-msg');

        onValue(ref(window.db, `chats/${reqId}`), (snapshot) => {
            chatMessages.innerHTML = '';
            snapshot.forEach((child) => {
                const msg = child.val();
                const div = document.createElement('div');
                div.style.marginBottom = '15px';
                div.style.textAlign = msg.role === 'admin' ? 'left' : 'right';

                div.innerHTML = `
                    <div style="font-size: 0.65rem; opacity: 0.5; margin-bottom: 4px; font-weight: 900; text-transform: uppercase;">
                        ${msg.sender || (msg.role === 'admin' ? 'ADMIN' : 'USER')}
                    </div>
                    <div style="display:inline-block; padding:10px 15px; border-radius:15px; 
                         background:${msg.role === 'admin' ? '#1a1a1c' : '#ffffff'}; 
                         color:${msg.role === 'admin' ? '#ffffff' : '#000000'}; 
                         border: 1px solid rgba(255,255,255,0.1);
                         font-size:0.9rem; max-width:85%; word-wrap:break-word;">
                        ${msg.text}
                    </div>
                `;
                chatMessages.appendChild(div);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });

        sendBtn.onclick = () => {
            const text = userInput.value.trim();
            const user = window.auth.currentUser;

            if (text) {
                push(ref(window.db, `chats/${reqId}`), {
                    role: 'user',
                    sender: user ? user.displayName : "Аноним",
                    text: text,
                    timestamp: Date.now()
                });
                userInput.value = '';
            }
        };
    }

    // 8. ЧАСТИЦЫ
    function createSnowflake() {
        if (!snowToggle || !snowToggle.checked) return;
        const sf = document.createElement('div');
        sf.className = 'snowflake';
        const size = (Math.random() * (currentSnowSize / 2) + Number(currentSnowSize)) + 'px';
        sf.style.width = size; sf.style.height = size;
        sf.style.left = Math.random() * 100 + 'vw';
        sf.style.animationDuration = (Math.random() * 3 + 4) + 's';
        sf.style.opacity = Math.random();
        snowContainer.appendChild(sf);
        setTimeout(() => sf.remove(), 7000);
    }

    function createSakura() {
        if (!sakuraToggle || !sakuraToggle.checked) return;
        const petal = document.createElement('div');
        petal.className = 'sakura-petal';
        const img = sakuraTextures[Math.floor(Math.random() * sakuraTextures.length)];
        petal.style.backgroundImage = `url('${img}')`;
        const size = (Math.random() * (currentSakuraSize / 2) + Number(currentSakuraSize)) + 'px';
        petal.style.width = size; petal.style.height = size;
        petal.style.left = Math.random() * 100 + 'vw';
        petal.style.animationDuration = (Math.random() * 5 + 5) + 's';
        snowContainer.appendChild(petal);
        setTimeout(() => petal.remove(), 10000);
    }

    // 9. СОБЫТИЯ
    if(settingsBtn) settingsBtn.onclick = (e) => { e.stopPropagation(); settingsMenu.classList.toggle('active'); };
    document.addEventListener('click', (e) => {
        if (settingsMenu && !settingsMenu.contains(e.target) && e.target !== settingsBtn) settingsMenu.classList.remove('active');
    });

    if(opacityRange) opacityRange.oninput = (e) => applyOpacity(e.target.value);
    if(snowSizeRange) snowSizeRange.oninput = (e) => applySnowSize(e.target.value);
    if(sakuraSizeRange) sakuraSizeRange.oninput = (e) => applySakuraSize(e.target.value);

    document.querySelectorAll('.list-button').forEach(b => {
        b.onclick = () => loadList(b.dataset.list);
    });

    document.querySelectorAll('.theme-button').forEach(b => {
        b.onclick = () => applyTheme(b.dataset.theme);
    });

    // ИСПРАВЛЕННЫЙ БЛОК ОТКРЫТИЯ РЕКВЕСТА
    const openRequestBtn = document.getElementById('open-request-btn');
    if(openRequestBtn) {
        openRequestBtn.onclick = () => {
            // Проверка авторизации
            const user = window.auth ? window.auth.currentUser : null;
            
            if (!user) {
                alert("Чтобы подать реквест, необходимо войти в аккаунт!");
                window.location.href = 'account.html';
                return;
            }

            if (myReqId) {
                document.getElementById('request-form-container').style.display = 'none';
                document.getElementById('chat-section').style.display = 'block';
                initUserChat(myReqId);
            } else {
                document.getElementById('request-form-container').style.display = 'block';
                document.getElementById('chat-section').style.display = 'none';
                
                // Автозаполнение ника из аккаунта
                const nickInput = document.getElementById('req-nickname');
                if(nickInput) nickInput.value = user.displayName || "";
            }
            reqModal.style.display = 'flex';
        };
    }

    if(document.getElementById('close-modal')) {
        document.getElementById('close-modal').onclick = () => reqModal.style.display = 'none';
    }

    const deleteChatBtn = document.getElementById('delete-chat-user');
    if(deleteChatBtn) {
        deleteChatBtn.onclick = async () => {
            if (confirm('Удалить переписку?')) {
                const { ref, remove } = window.dbRefs;
                await remove(ref(window.db, `chats/${myReqId}`));
                localStorage.removeItem('myRequestID');
                location.reload();
            }
        };
    }

    const requestForm = document.getElementById('request-form');
    if(requestForm) {
        requestForm.onsubmit = async (e) => {
            e.preventDefault();
            const { ref, push, set } = window.dbRefs;
            const rId = push(ref(window.db, 'requests')).key;

            const data = {
                id: rId,
                nickname: document.getElementById('req-nickname').value,
                level: document.getElementById('req-level-name').value,
                creator: document.getElementById('req-creator').value,
                lvlId: document.getElementById('req-id').value,
                fps: document.getElementById('req-fps').value,
                fv: document.getElementById('req-fv').value || 'None',
                type: document.getElementById('req-type').value || 'None',
                list: document.getElementById('req-list').value,
                showcase: document.getElementById('req-showcase').value,
                hasUnread: false,
                timestamp: Date.now()
            };

            await set(ref(window.db, 'requests/' + rId), data);
            localStorage.setItem('myRequestID', rId);
            myReqId = rId;
            location.reload();
        };
    }

    // 10. ЗАПУСК
    setInterval(createSnowflake, 150);
    setInterval(createSakura, 200);
    loadList(currentListId);
});
