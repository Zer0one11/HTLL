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

    applyTheme(currentTheme);
    applyOpacity(currentOpacity);
    applySnowSize(currentSnowSize);

    opacityRange.addEventListener('input', (e) => applyOpacity(e.target.value));
    snowSizeRange.addEventListener('input', (e) => applySnowSize(e.target.value));
    
    settingsBtn.onclick = (e) => { e.stopPropagation(); settingsMenu.classList.toggle('active'); };
    document.onclick = () => settingsMenu.classList.remove('active');

    function formatLatex(text) {
        if (!text || text === "none" || text === "") return "None";
        const needsMath = text.includes('\\') || text.includes('^') || text.includes('_');
        return (needsMath && !text.startsWith('$')) ? `$${text}$` : text;
    }

    function loadList(listId) {
        const config = listMap[listId];
        document.querySelector('.main-title').textContent = config.title;

        fetch(config.file + '?t=' + Date.now()).then(r => r.json()).then(data => {
            listElement.innerHTML = '';
            data.forEach(level => {
                const li = document.createElement('li');
                li.className = 'level-item';
                // Встраиваем ссылку в название и выводим поля в столбик
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
                        ${level.fv ? `<li><span class="detail-label">FV:</span> ${level.fv}</li>` : ''}
                        ${level.type ? `<li><span class="detail-label">TYPE:</span> ${level.type}</li>` : ''}
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

    // Логика модалки реквестов
    const reqModal = document.getElementById('request-modal');
    const openBtn = document.getElementById('open-request-btn');
    if(openBtn) openBtn.onclick = () => reqModal.style.display = 'flex';
    document.getElementById('close-modal').onclick = () => reqModal.style.display = 'none';

    document.getElementById('request-form').onsubmit = async (e) => {
        e.preventDefault();
        const { ref, push, set } = window.dbRefs;
        const reqId = push(ref(window.db, 'requests')).key;
        
        const data = {
            id: reqId,
            nickname: document.getElementById('req-nickname').value,
            level: document.getElementById('req-level-name').value,
            creator: document.getElementById('req-creator').value,
            lvlId: document.getElementById('req-id').value,
            fps: document.getElementById('req-fps').value,
            fv: document.getElementById('req-fv').value || 'None',
            type: document.getElementById('req-type').value || 'None',
            list: document.getElementById('req-list').value,
            showcase: document.getElementById('req-showcase').value,
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
            div.style.textAlign = m.role === 'admin' ? 'left' : 'right';
            div.style.marginBottom = '10px';
            div.innerHTML = `<div style="font-size:0.7rem; opacity:0.5; color:#888">${m.role === 'admin' ? 'MOD' : 'YOU'}</div>
                             <div style="display:inline-block; background:${m.role === 'admin' ? '#222' : '#333'}; padding:8px 12px; border-radius:10px">${m.text}</div>`;
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
