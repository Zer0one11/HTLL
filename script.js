document.addEventListener('DOMContentLoaded', () => {
    const listElement = document.getElementById('levelList');
    const snowToggle = document.getElementById('snow-toggle');
    const snowContainer = document.getElementById('snow-container');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const snowSizeRange = document.getElementById('snowSizeRange');
    const opacityRange = document.getElementById('opacityRange');
    const reqModal = document.getElementById('request-modal');

    let currentSnowSize = localStorage.getItem('snowSize') || '5';
    let currentOpacity = localStorage.getItem('panelOpacity') || '0.01';
    let currentTheme = localStorage.getItem('siteTheme') || 'dark';
    let currentListId = localStorage.getItem('currentListId') || 'levels';
    let myReqId = localStorage.getItem('myRequestID');

    // ПРИМЕНЕНИЕ НАСТРОЕК
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
        document.querySelectorAll('.theme-button').forEach(btn => btn.classList.toggle('active-theme', btn.dataset.theme === themeName));
    }

    applyOpacity(currentOpacity);
    applySnowSize(currentSnowSize);
    applyTheme(currentTheme);
    opacityRange.value = currentOpacity;
    snowSizeRange.value = currentSnowSize;

    // УВЕДОМЛЕНИЯ
    if (myReqId) {
        setTimeout(() => {
            const { ref, onValue, update } = window.dbRefs;
            onValue(ref(window.db, `requests/${myReqId}`), (snap) => {
                const data = snap.val();
                if (data && data.hasUnread) {
                    showNotification("Админ ответил на твою заявку!");
                    update(ref(window.db, `requests/${myReqId}`), { hasUnread: false });
                }
            });
        }, 2000);
    }

    function showNotification(text) {
        const t = document.createElement('div');
        t.style = "position:fixed; bottom:20px; right:20px; background:#fff; color:#000; padding:15px 25px; border-radius:12px; font-weight:900; z-index:10000; cursor:pointer;";
        t.innerText = text;
        t.onclick = () => { reqModal.style.display='flex'; t.remove(); };
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 8000);
    }

    // ЗАГРУЗКА ЛИСТА
    function loadList(listId) {
        const listMap = { 'levels': 'levels.json', 'ppll': 'ppll.json', 'sll': 'sll.json', 'ill': 'ill.json', 'inf': 'inf.json', 'scl': 'scl.json', 'icl': 'icl.json' };
        fetch(listMap[listId] + '?t=' + Date.now()).then(r => r.json()).then(data => {
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
                    </div>
                    <ul class="level-details">
                        <li><span class="detail-label">ID:</span> ${level.id}</li>
                        <li><span class="detail-label">FPS:</span> ${level.fps}</li>
                        ${level.fv ? `<li><span class="detail-label">Botter:</span> ${level.fv}</li>` : ''}
                        ${level.type ? `<li><span class="detail-label">TYPE:</span> ${level.type}</li>` : ''}
                    </ul>`;
                listElement.appendChild(li);
            });
        });
    }

    // ЧАТ ПОЛЬЗОВАТЕЛЯ
    function initUserChat(reqId) {
        const { ref, push, onValue, remove } = window.dbRefs;
        const chatBox = document.getElementById('chat-messages');
        
        onValue(ref(window.db, `chats/${reqId}`), (snap) => {
            chatBox.innerHTML = '';
            if(!snap.exists()) {
                // Если админ удалил чат, сбрасываем локально
                localStorage.removeItem('myRequestID');
                location.reload();
                return;
            }
            snap.forEach(mSnap => {
                const m = mSnap.val();
                const div = document.createElement('div');
                div.style = `text-align:${m.role==='admin'?'left':'right'}; margin-bottom:10px;`;
                div.innerHTML = `<div style="display:inline-block; background:${m.role==='admin'?'#222':'#fff'}; color:${m.role==='admin'?'#fff':'#000'}; padding:8px 12px; border-radius:10px;">${m.text}</div>`;
                chatBox.appendChild(div);
            });
            chatBox.scrollTop = chatBox.scrollHeight;
        });

        // Кнопка удаления чата пользователем
        document.getElementById('delete-chat-user').onclick = async () => {
            if(confirm("Удалить твой чат навсегда?")) {
                await remove(ref(window.db, `requests/${reqId}`));
                await remove(ref(window.db, `chats/${reqId}`));
                localStorage.removeItem('myRequestID');
                location.reload();
            }
        };

        document.getElementById('send-msg').onclick = () => {
            const inp = document.getElementById('user-msg');
            if(inp.value) push(ref(window.db, `chats/${reqId}`), { role: 'user', text: inp.value, timestamp: Date.now() });
            inp.value = '';
        };
    }

    // ОТПРАВКА ЗАЯВКИ
    document.getElementById('request-form').onsubmit = async (e) => {
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
            hasUnread: false
        };
        await set(ref(window.db, 'requests/' + rId), data);
        localStorage.setItem('myRequestID', rId);
        location.reload();
    };

    // UI КНОПКИ
    document.getElementById('open-request-btn').onclick = () => {
        if (myReqId) {
            document.getElementById('request-form-container').style.display = 'none';
            document.getElementById('chat-section').style.display = 'block';
            initUserChat(myReqId);
        }
        reqModal.style.display = 'flex';
    };
    document.getElementById('close-modal').onclick = () => reqModal.style.display = 'none';
    
    settingsBtn.onclick = (e) => { e.stopPropagation(); settingsMenu.classList.toggle('active'); };
    opacityRange.oninput = (e) => applyOpacity(e.target.value);
    snowSizeRange.oninput = (e) => applySnowSize(e.target.value);
    
    document.querySelectorAll('.list-button').forEach(b => b.onclick = () => { loadList(b.dataset.list); });
    document.querySelectorAll('.theme-button').forEach(b => b.onclick = () => applyTheme(b.dataset.theme));

    loadList(currentListId);
});
