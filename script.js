document.addEventListener('DOMContentLoaded', () => {
    const listElement = document.getElementById('levelList');
    const snowToggle = document.getElementById('snow-toggle');
    const snowContainer = document.getElementById('snow-container');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const snowSizeRange = document.getElementById('snowSizeRange');
    const opacityRange = document.getElementById('opacityRange');

    const listMap = {
        'levels': { file: 'levels.json', title: 'TPLL LIST' },
        'ppll': { file: 'ppll.json', title: 'PPLL LIST' },
        'sll': { file: 'sll.json', title: 'SLL LIST' },
        'ill': { file: 'ill.json', title: 'ILL LIST' },
        'inf': { file: 'inf.json', title: 'INF LIST' },
        'scl': { file: 'scl.json', title: 'SCL LIST' },
        'icl': { file: 'icl.json', title: 'ICL LIST' }
    };

    let currentSnowSize = localStorage.getItem('snowSize') || '5';
    let currentOpacity = localStorage.getItem('panelOpacity') || '0.01';
    let currentTheme = localStorage.getItem('siteTheme') || 'dark';
    let currentListId = localStorage.getItem('currentListId') || 'levels';

    function applyOpacity(val) {
        document.documentElement.style.setProperty('--panel-opacity', val);
        if (opacityRange) opacityRange.value = val;
        localStorage.setItem('panelOpacity', val);
    }

    function applySnowSize(val) {
        currentSnowSize = val;
        if (snowSizeRange) snowSizeRange.value = val;
        localStorage.setItem('snowSize', val);
    }

    function applyTheme(themeName) {
        document.body.className = `theme-${themeName}`;
        localStorage.setItem('siteTheme', themeName);
        document.querySelectorAll('.theme-button').forEach(btn => {
            btn.classList.toggle('active-theme', btn.dataset.theme === themeName);
        });
    }

    // Инициализация
    applyTheme(currentTheme);
    applyOpacity(currentOpacity);
    applySnowSize(currentSnowSize);

    // Слушатели настроек
    opacityRange.addEventListener('input', (e) => applyOpacity(e.target.value));
    snowSizeRange.addEventListener('input', (e) => applySnowSize(e.target.value));
    settingsBtn.onclick = (e) => { e.stopPropagation(); settingsMenu.classList.toggle('active'); };
    document.onclick = () => settingsMenu.classList.remove('active');
    settingsMenu.onclick = (e) => e.stopPropagation();

    document.querySelectorAll('.theme-button').forEach(btn => {
        btn.onclick = () => applyTheme(btn.dataset.theme);
    });

    function formatLatex(text) {
        if (typeof text !== 'string' || text === "none") return text;
        const hasLatex = text.includes('\\') || text.includes('^') || text.includes('_');
        if (hasLatex && !text.startsWith('$')) return `$${text}$`;
        return text;
    }

    function loadList(listId) {
        const config = listMap[listId];
        const titleEl = document.querySelector('.main-title');
        if (titleEl) titleEl.textContent = config.title;

        fetch(config.file).then(r => r.json()).then(data => {
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
                        <li><span class="detail-label">FPS:</span> ${formatLatex(level.fps)}</li>
                        <li><span class="detail-label">ID:</span> ${level.id}</li> 
                    </ul>`;
                listElement.appendChild(li);
            });
            if (window.MathJax?.typesetPromise) MathJax.typesetPromise();
        });
    }

    document.querySelectorAll('.list-button').forEach(btn => {
        if (btn.dataset.list === currentListId) btn.classList.add('active-list');
        btn.onclick = function() {
            const lid = this.dataset.list;
            localStorage.setItem('currentListId', lid);
            loadList(lid);
            document.querySelectorAll('.list-button').forEach(b => b.classList.remove('active-list'));
            this.classList.add('active-list');
        };
    });

    // СНЕГ
    function createSnowflake() {
        if (!snowToggle.checked) return;
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        const size = (Math.random() * (currentSnowSize / 2) + Number(currentSnowSize)) + 'px';
        snowflake.style.width = size; snowflake.style.height = size;
        snowflake.style.left = Math.random() * 100 + 'vw';
        snowflake.style.animationDuration = Math.random() * 3 + 4 + 's';
        snowContainer.appendChild(snowflake);
        setTimeout(() => snowflake.remove(), 7000);
    }
    setInterval(createSnowflake, 150);
    loadList(currentListId);

    // --- РЕКВЕСТЫ ---
    const reqModal = document.getElementById('request-modal');
    document.getElementById('open-request-btn').onclick = () => reqModal.style.display = 'flex';
    document.getElementById('close-modal').onclick = () => reqModal.style.display = 'none';

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
            div.className = m.role === 'admin' ? 'msg-admin' : 'msg-user';
            div.innerText = (m.role === 'admin' ? 'MOD: ' : 'YOU: ') + m.text;
            chatBox.appendChild(div);
            chatBox.scrollTop = chatBox.scrollHeight;
        });
        document.getElementById('send-msg').onclick = () => {
            const inp = document.getElementById('user-msg');
            if(!inp.value) return;
            push(ref(window.db, `chats/${reqId}`), { role: 'user', text: inp.value, time: Date.now() });
            inp.value = '';
        };
    }
});
