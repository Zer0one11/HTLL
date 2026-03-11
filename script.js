document.addEventListener('DOMContentLoaded', () => {
    // 1. ЭЛЕМЕНТЫ UI
    const listElement = document.getElementById('levelList');
    const snowContainer = document.getElementById('snow-container');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const snowSizeRange = document.getElementById('snowSizeRange');
    const opacityRange = document.getElementById('opacityRange');
    const reqModal = document.getElementById('request-modal');

    // 2. СОСТОЯНИЕ
    let currentSnowSize = localStorage.getItem('snowSize') || '5';
    let currentOpacity = localStorage.getItem('panelOpacity') || '0.01';
    let currentTheme = localStorage.getItem('siteTheme') || 'dark';
    let currentListId = localStorage.getItem('currentListId') || 'levels';
    let activeEffect = localStorage.getItem('activeEffect') || 'snow';
    let myReqId = localStorage.getItem('myRequestID');

    // Твои названия файлов из папки res
    const sakuraFiles = [
        '1000452088-removebg-preview.png', '1000452089-removebg-preview.png',
        '1000452090-removebg-preview.png', '1000452091-removebg-preview.png',
        '1000452092-removebg-preview.png', '1000452093-removebg-preview.png',
        '1000452094-removebg-preview.png', '1000452095-removebg-preview.png',
        '1000452096-removebg-preview.png', '1000452097-removebg-preview.png'
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
    applyTheme(currentTheme);
    if (opacityRange) opacityRange.value = currentOpacity;
    if (snowSizeRange) snowSizeRange.value = currentSnowSize;

    // 4. ФОРМАТИРОВАНИЕ ТЕКСТА
    function formatLatex(text) {
        if (!text || text === "none" || text === "") return "None";
        let str = text.toString();
        if (str.includes('\\') || str.includes('^')) {
            return str.startsWith('$') ? str : `$${str}$`;
        }
        return str;
    }

    // 5. ЗАГРУЗКА СПИСКА УРОВНЕЙ
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

            if (window.MathJax && window.MathJax.typesetPromise) {
                window.MathJax.typesetPromise();
            }
        } catch (e) {
            console.error("Ошибка загрузки:", e);
        }
    }

    // 6. СИСТЕМА ЧАТА (FIREBASE)
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

    // 7. ОБРАБОТКА ЭФФЕКТОВ (СНЕГ / САКУРА)
    function createParticle() {
        if (activeEffect === 'none') return;
        
        const p = document.createElement('div');
        const startX = Math.random() * 100;
        
        if (activeEffect === 'snow') {
            p.className = 'snowflake';
            const size = (Math.random() * (currentSnowSize / 2) + Number(currentSnowSize));
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            const duration = Math.random() * 3 + 2; 
            p.style.animationDuration = duration + 's';
            p.style.left = startX + 'vw';
            setTimeout(() => p.remove(), duration * 1000);
        } else if (activeEffect === 'sakura') {
            p.className = 'sakura-leaf';
            const randomImg = sakuraFiles[Math.floor(Math.random() * sakuraFiles.length)];
            const size = (Math.random() * 15 + 20); // Листья покрупнее
            
            p.style.backgroundImage = `url('res/${randomImg}')`;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.left = startX + 'vw';
            
            // Медленное падение: от 7 до 12 секунд
            const fallDuration = Math.random() * 5 + 7;
            // Рандомная задержка покачивания, чтобы не все сразу
            const swayDelay = Math.random() * -5; 
            
            p.style.animationDuration = `${fallDuration}s, 4s`; 
            p.style.animationDelay = `0s, ${swayDelay}s`;
            
            setTimeout(() => p.remove(), fallDuration * 1000);
        }
        
        snowContainer.appendChild(p);
    }

    // 8. СОБЫТИЯ И ИНИЦИАЛИЗАЦИЯ
    if (settingsBtn) {
        settingsBtn.onclick = (e) => { 
            e.stopPropagation(); 
            settingsMenu.classList.toggle('active'); 
        };
    }

    if (opacityRange) opacityRange.oninput = (e) => applyOpacity(e.target.value);
    if (snowSizeRange) snowSizeRange.oninput = (e) => applySnowSize(e.target.value);

    // Слушатель радио-кнопок эффектов
    document.querySelectorAll('input[name="effect"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            activeEffect = e.target.value;
            localStorage.setItem('activeEffect', activeEffect);
            snowContainer.innerHTML = ''; 
        });
    });

    // Восстанавливаем выбранный эффект
    const savedEffect = localStorage.getItem('activeEffect') || 'snow';
    const activeRadio = document.querySelector(`input[name="effect"][value="${savedEffect}"]`);
    if (activeRadio) {
        activeRadio.checked = true;
        activeEffect = savedEffect;
    }

    // Переключение листов
    document.querySelectorAll('.list-button').forEach(b => {
        b.onclick = () => {
            document.querySelectorAll('.list-button').forEach(btn => btn.classList.remove('active-list'));
            b.classList.add('active-list');
            currentListId = b.dataset.list;
            localStorage.setItem('currentListId', currentListId);
            loadList(currentListId);
        };
    });

    // Запуск циклов
    setInterval(createParticle, 400); // Создаем частицу каждые 0.4 сек
    loadList(currentListId);
});

