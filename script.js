document.addEventListener('DOMContentLoaded', () => {
    // ... (старый код управления списком и снегом остается) ...
    const listElement = document.getElementById('levelList');
    const snowToggle = document.getElementById('snow-toggle');
    const snowContainer = document.getElementById('snow-container');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const snowSizeRange = document.getElementById('snowSizeRange');
    const opacityRange = document.getElementById('opacityRange');

    let currentSnowSize = localStorage.getItem('snowSize') || '5';
    let currentOpacity = localStorage.getItem('panelOpacity') || '0.01';
    let currentTheme = localStorage.getItem('siteTheme') || 'dark';

    function applyTheme(themeName) {
        document.body.className = `theme-${themeName}`;
        localStorage.setItem('siteTheme', themeName);
        document.querySelectorAll('.theme-button').forEach(btn => {
            btn.classList.toggle('active-theme', btn.dataset.theme === themeName);
        });
    }

    applyTheme(currentTheme);
    document.documentElement.style.setProperty('--panel-opacity', currentOpacity);

    // --- ЛОГИКА РЕКВЕСТОВ ---
    const reqModal = document.getElementById('request-modal');
    const openReqBtn = document.getElementById('open-request-btn');
    const closeReqBtn = document.getElementById('close-modal');

    openReqBtn.onclick = () => reqModal.style.display = 'flex';
    closeReqBtn.onclick = () => reqModal.style.display = 'none';

    document.getElementById('request-form').onsubmit = async (e) => {
        e.preventDefault();
        const { ref, push, set } = window.dbRefs;
        
        const reqId = push(ref(window.db, 'requests')).key;
        const data = {
            id: reqId,
            nickname: document.getElementById('req-nickname').value,
            level: document.getElementById('req-level-name').value,
            list: document.getElementById('req-list').value,
            info: document.getElementById('req-info').value,
            status: 'pending',
            timestamp: Date.now()
        };

        await set(ref(window.db, 'requests/' + reqId), data);
        
        document.getElementById('request-form-container').style.display = 'none';
        document.getElementById('chat-section').style.display = 'block';
        initUserChat(reqId);
    };

    function initUserChat(reqId) {
        const { ref, push, onChildAdded } = window.dbRefs;
        const chatBox = document.getElementById('chat-messages');

        onChildAdded(ref(window.db, `chats/${reqId}`), (snap) => {
            const m = snap.val();
            const div = document.createElement('div');
            div.style.marginBottom = "8px";
            div.style.color = m.role === 'admin' ? '#aaa' : '#fff';
            div.innerHTML = `<strong>${m.role === 'admin' ? 'MOD' : 'YOU'}:</strong> ${m.text}`;
            chatBox.appendChild(div);
            chatBox.scrollTop = chatBox.scrollHeight;
        });

        document.getElementById('send-msg').onclick = () => {
            const inp = document.getElementById('user-msg');
            if(!inp.value) return;
            push(ref(window.db, `chats/${reqId}`), {
                role: 'user',
                text: inp.value,
                time: Date.now()
            });
            inp.value = '';
        };
    }
    // ... (остальные функции loadList и т.д. остаются как были) ...
});
