// ui.js — Управление интерфейсом, темами и частицами

// 1. КОПИРОВАНИЕ ID В БУФЕР
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

// 2. ФОРМАТИРОВАНИЕ LATEX (Для красивых формул в тексте)
function formatLatex(text) {
    if (!text || text.toString().toLowerCase() === "none" || text === "") return "None";
    let str = text.toString();
    if (str.includes('\\') || str.includes('^') || str.includes('_')) {
        if (!str.startsWith('$')) return `$${str}$`;
    }
    return str;
}

// 3. ПРОЗРАЧНОСТЬ ПАНЕЛЕЙ (Ползунок)
window.applyOpacity = function(val) {
    document.documentElement.style.setProperty('--panel-opacity', val);
    localStorage.setItem('panelOpacity', val);
    
    // Принудительно обновляем все карточки, если они уже на странице
    document.querySelectorAll('.level-item').forEach(item => {
        item.style.setProperty('background', `rgba(var(--bg-card-raw), ${val})`, 'important');
    });
};

// 4. СМЕНА ТЕМЫ
window.applyTheme = function(themeName) {
    document.body.className = `theme-${themeName}`;
    localStorage.setItem('siteTheme', themeName);
};

// 5. УПРАВЛЕНИЕ ЧАСТИЦАМИ (Ползунки и Переключатели)
window.updateSnowSize = function(val) {
    localStorage.setItem('snowSize', val);
    const indicator = document.getElementById('snow-size-val');
    if(indicator) indicator.innerText = val + 'px';
};

window.updateSakuraSize = function(val) {
    localStorage.setItem('sakuraSize', val);
    const indicator = document.getElementById('sakura-size-val');
    if(indicator) indicator.innerText = val + 'px';
};

window.toggleEffect = function(type, checked) {
    localStorage.setItem(type + 'Enabled', checked);
};

// 6. ЗАГРУЗКА СПИСКА УРОВНЕЙ ИЗ JSON
window.loadList = async function(listId) {
    try {
        const response = await fetch(`${listId}.json`);
        const data = await response.json();
        const listElement = document.getElementById('level-list');
        if (!listElement) return;

        listElement.innerHTML = '';
        
        // Сортировка по номеру
        data.sort((a, b) => parseInt(a.number) - parseInt(b.number));

        data.forEach(level => {
            const li = document.createElement('li');
            li.className = 'level-item';
            
            // Проверка наличия опциональных полей (Botter, Type)
            const botterHtml = (level.fv && level.fv.toLowerCase() !== 'none') ? 
                `<li><span class="detail-label">Botter:</span> ${formatLatex(level.fv)}</li>` : '';
            const typeHtml = (level.type && level.type.toLowerCase() !== 'none') ? 
                `<li><span class="detail-label">Type:</span> ${formatLatex(level.type)}</li>` : '';

            li.innerHTML = `
                <div class="level-header">
                    <span class="level-number">#${level.number}</span>
                    <div class="level-title-group">
                        <a href="${level.showcase}" target="_blank" class="level-name">${formatLatex(level.name)}</a>
                        <span class="level-creator">by ${level.creator}</span>
                    </div>
                </div>
                <ul class="level-details">
                    <li><span class="detail-label">ID:</span> ${level.id} 
                        <img src="res/copybutton.png" class="copy-icon" onclick="copyToClipboard('${level.id}')">
                    </li>
                    <li><span class="detail-label">FPS:</span> ${formatLatex(level.fps)}</li>
                    ${botterHtml}
                    ${typeHtml}
                </ul>`;
            listElement.appendChild(li);
        });

        // Сохраняем последний выбранный список
        localStorage.setItem('currentListId', listId);
        
        // Визуальное переключение кнопок меню
        document.querySelectorAll('.list-button').forEach(btn => {
            btn.classList.toggle('active-list', btn.dataset.list === listId);
        });

        // Применяем текущую прозрачность к новым элементам
        const savedOpacity = localStorage.getItem('panelOpacity') || '0.01';
        applyOpacity(savedOpacity);

        // Перерисовка формул MathJax, если он подключен
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise();
        }
        
    } catch (e) {
        console.error("Ошибка при загрузке JSON:", e);
    }
};
