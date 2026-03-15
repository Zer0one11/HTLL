document.addEventListener('DOMContentLoaded', () => {
    // 1. ЭЛЕМЕНТЫ UI И КОНТЕЙНЕРЫ
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

    // 2. ГЛОБАЛЬНОЕ СОСТОЯНИЕ (LOCALSTORAGE)
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

    // 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (КОПИРОВАНИЕ И LATEX)
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

    // 4. ПРИМЕНЕНИЕ ВИЗУАЛЬНЫХ НАСТРОЕК
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

    // Инициализация визуалов
    applyOpacity(currentOpacity);
    applyTheme(currentTheme);
    if(opacityRange) opacityRange.value = currentOpacity;
    if(snowSizeRange) snowSizeRange.value = currentSnowSize;
    if(sakuraSizeRange) sakuraSizeRange.value = currentSakuraSize;
    if(snowToggle) snowToggle.checked = isSnowEnabled;
    if(sakuraToggle) sakuraToggle.checked = isSakuraEnabled;

    // 5. ЛОГИКА РЕКВЕСТОВ И ЧАТА
    const openRequestBtn = document.getElementById('open-request-btn');
    if(openRequestBtn) {
        openRequestBtn.onclick = async () => {
            const user = window.auth ? window.auth.currentUser : null;
            if (!user) { alert("Сначала войдите в аккаунт."); return; }
            if (!user.emailVerified) { alert("Подтвердите почту для подачи реквестов!"); return; }

            myReqId = localStorage.getItem('myRequestID');
            if (myReqId) {
                const { get, ref } = window.dbRefs;
                try {
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
                } catch (err) {
                    console.error("Ошибка проверки реквеста:", err);
                    showForm(user);
                }
            } else {
                showForm(user);
            }
            reqModal.style.display = 'flex';
        };
    }

    function showForm(user) {
        document.getElementById('request-form-container').style.display = 'block';
        document.getElementById('chat-section').style.display = 'none';
        const nickField = document.getElementById('req-nickname');
        if(nickField) nickField.value = user.displayName || "";
    }

    // Обработка отправки формы реквеста
    const reqForm = document.getElementById('request-form');
    if (reqForm) {
        reqForm.onsubmit = async function(e) {
            e.preventDefault();
            const user = window.auth.currentUser;
            const { ref, push, set } = window.dbRefs;

            try {
                const newRequestRef = push(ref(window.db, 'requests'));
                const requestId = newRequestRef.key;

                // Собираем данные (ID исправлены под твой index.html)
                const requestData = {
                    id: requestId,
                    uid: user.uid,
                    nickname: document.getElementById('req-nickname').value,
                    levelName: document.getElementById('req-level-name').value, // Название уровня
                    creator: document.getElementById('req-creator').value,
                    levelId: document.getElementById('req-id').value,           // ID уровня
                    fps: document.getElementById('req-fps').value,
                    fv: document.getElementById('req-fv').value || "None",
                    type: document.getElementById('req-type').value || "None",
                    list: document.getElementById('req-list').value,           // Теперь тут будет TPLL и т.д.
                    showcase: document.getElementById('req-showcase').value,
                    status: 'pending',
                    timestamp: Date.now()
                };

                await set(newRequestRef, requestData);
                localStorage.setItem('myRequestID', requestId);
                
                alert("Реквест успешно отправлен!");
                document.getElementById('request-form-container').style.display = 'none';
                document.getElementById('chat-section').style.display = 'block';
                initUserChat(requestId);
            } catch (error) {
                console.error("Ошибка отправки реквеста:", error);
                alert("Ошибка при записи в базу данных!");
            }
        };
    }

    // Инициализация функций чата
    function initUserChat(reqId) {
        const { ref, onValue, push, set, remove } = window.dbRefs;
        const chatContainer = document.getElementById('chat-messages');
        const sendBtn = document.getElementById('send-msg');
        const deleteBtn = document.getElementById('delete-chat-user');

        // Слушаем новые сообщения (от админа и от себя)
        onValue(ref(window.db, `requests/${reqId}/messages`), (snapshot) => {
            chatContainer.innerHTML = '';
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    const msg = child.val();
                    const div = document.createElement('div');
                    div.className = msg.role === 'admin' ? 'msg-admin' : 'msg-user';
                    div.innerText = `${msg.role === 'admin' ? 'Модератор' : 'Вы'}: ${msg.text}`;
                    chatContainer.appendChild(div);
                });
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        });

        // Отправка сообщения пользователем
        sendBtn.onclick = async () => {
            const input = document.getElementById('user-msg');
            const text = input.value.trim();
            if (!text) return;

            try {
                const msgRef = push(ref(window.db, `requests/${reqId}/messages`));
                await set(msgRef, {
                    text: text,
                    role: 'user',
                    timestamp: Date.now()
                });
                input.value = '';
            } catch (e) {
                console.error("Ошибка отправки сообщения:", e);
            }
        };

        // Удаление чата (отмена реквеста)
        deleteBtn.onclick = async () => {
            if (confirm("Вы действительно хотите удалить свой реквест?")) {
                try {
                    await remove(ref(window.db, `requests/${reqId}`));
                    localStorage.removeItem('myRequestID');
                    location.reload();
                } catch (e) {
                    alert("Ошибка при удалении!");
                }
            }
        };
    }

    // 6. ЗАГРУЗКА И ОТОБРАЖЕНИЕ СПИСКОВ (JSON)
    async function loadList(listId) {
        const listMap = { 
            'levels': 'levels.json', 'ppll': 'ppll.json', 'sll': 'sll.json', 
            'ill': 'ill.json', 'inf': 'inf.json', 'scl': 'scl.json', 'icl': 'icl.json' 
        };
        try {
            const response = await fetch(listMap[listId] + '?t=' + Date.now());
            if (!response.ok) throw new Error("Файл списка не найден");
            const data = await response.json();
            
            listElement.innerHTML = '';
            data.forEach(level => {
                const li = document.createElement('li');
                li.className = 'level-item';
                const botterHtml = (level.fv && level.fv.toLowerCase() !== 'none') ? `<li><span class="detail-label">Botter:</span> ${formatLatex(level.fv)}</li>` : '';
                const typeHtml = (level.type && level.type.toLowerCase() !== 'none') ? `<li><span class="detail-label">Type:</span> ${formatLatex(level.type)}</li>` : '';
                
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
                        ${botterHtml}${typeHtml}
                    </ul>`;
                listElement.appendChild(li);
            });

            localStorage.setItem('currentListId', listId);
            document.querySelectorAll('.list-button').forEach(btn => btn.classList.toggle('active-list', btn.dataset.list === listId));
            applyOpacity(currentOpacity);
            
            if (window.MathJax) {
                window.MathJax.typesetPromise().catch((err) => console.log('MathJax error:', err));
            }
        } catch (e) { 
            console.error("Ошибка загрузки JSON:", e);
            listElement.innerHTML = `<p style="color:red; text-align:center;">Ошибка загрузки списка ${listId}</p>`;
        }
    }

    // 7. СИСТЕМА ЧАСТИЦ (СНЕГ И САКУРА)
    function createSnowflake() {
        if (!isSnowEnabled || !snowContainer) return;
        const sf = document.createElement('div');
        sf.className = 'snowflake';
        const size = (Math.random() * 3 + Number(currentSnowSize)) + 'px';
        sf.style.width = size; 
        sf.style.height = size;
        sf.style.left = Math.random() * 100 + 'vw';
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

    // 8. СЛУШАТЕЛИ СОБЫТИЙ (SETTINGS & UI)
    if(settingsBtn) {
        settingsBtn.onclick = (e) => { 
            e.stopPropagation(); 
            settingsMenu.classList.toggle('active'); 
        };
    }

    document.addEventListener('click', (e) => { 
        if (settingsMenu && !settingsMenu.contains(e.target) && e.target !== settingsBtn) {
            settingsMenu.classList.remove('active'); 
        }
    });

    if(opacityRange) opacityRange.oninput = (e) => applyOpacity(e.target.value);
    
    if(snowSizeRange) {
        snowSizeRange.oninput = (e) => { 
            currentSnowSize = e.target.value; 
            localStorage.setItem('snowSize', e.target.value); 
        };
    }

    if(sakuraSizeRange) {
        sakuraSizeRange.oninput = (e) => { 
            currentSakuraSize = e.target.value; 
            localStorage.setItem('sakuraSize', e.target.value); 
        };
    }
    
    if(snowToggle) {
        snowToggle.onchange = () => {
            isSnowEnabled = snowToggle.checked;
            if (isSnowEnabled) { 
                isSakuraEnabled = false; 
                if(sakuraToggle) sakuraToggle.checked = false; 
            }
            localStorage.setItem('snowEnabled', isSnowEnabled);
            localStorage.setItem('sakuraEnabled', isSakuraEnabled);
        };
    }

    if(sakuraToggle) {
        sakuraToggle.onchange = () => {
            isSakuraEnabled = sakuraToggle.checked;
            if (isSakuraEnabled) { 
                isSnowEnabled = false; 
                if(snowToggle) snowToggle.checked = false; 
            }
            localStorage.setItem('sakuraEnabled', isSakuraEnabled);
            localStorage.setItem('snowEnabled', isSnowEnabled);
        };
    }

    // Переключение списков (кнопки)
    document.querySelectorAll('.list-button').forEach(b => {
        b.onclick = () => loadList(b.dataset.list);
    });

    // Переключение тем
    document.querySelectorAll('.theme-button').forEach(b => {
        b.onclick = () => applyTheme(b.dataset.theme);
    });

    // Закрытие модалки
    if(document.getElementById('close-modal')) {
        document.getElementById('close-modal').onclick = () => {
            reqModal.style.display = 'none';
        };
    }

    // 9. ЗАПУСК ЦИКЛОВ И ПЕРВИЧНАЯ ЗАГРУЗКА
    setInterval(createSnowflake, 200);
    setInterval(createSakura, 350);
    loadList(currentListId);
});
