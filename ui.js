// Функции копирования и форматирования
window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        const oldNotif = document.querySelector('.copy-notification');
        if (oldNotif) oldNotif.remove();
        const notif = document.createElement('div');
        notif.className = 'copy-notification';
        notif.innerText = `ID ${text} СКОПИРОВАН!`;
        document.body.appendChild(notif);
        setTimeout(() => {
            if(notif) notif.style.opacity = '0';
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

// Управление внешним видом
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

// Загрузка JSON списков
async function loadList(listId) {
    const listElement = document.getElementById('levelList');
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
        applyOpacity(localStorage.getItem('panelOpacity') || '0.01');
        if (window.MathJax) window.MathJax.typesetPromise();
    } catch (e) { console.error("Ошибка загрузки списка:", e); }
}
