document.addEventListener('DOMContentLoaded', () => {
    const listElement = document.getElementById('levelList');
    const jsonPath = 'levels.json'; 
    const body = document.body;
    const themeButtons = document.querySelectorAll('.theme-button');

    // ====================================
    // 1. Логика Смены Тем
    // ====================================
    const savedTheme = localStorage.getItem('siteTheme') || 'blue';
    setTheme(savedTheme);

    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const newTheme = button.dataset.theme;
            setTheme(newTheme);
            localStorage.setItem('siteTheme', newTheme);
        });
    });

    function setTheme(theme) {
        // Сначала удаляем все классы тем, чтобы избежать конфликтов
        body.className = body.className.split(' ').filter(c => !c.startsWith('theme-')).join(' ');
        body.classList.add(`theme-${theme}`);

        // Обновляем активный статус кнопок
        themeButtons.forEach(btn => {
            btn.classList.remove('active-theme');
            if (btn.dataset.theme === theme) {
                btn.classList.add('active-theme');
            }
        });
    }

    // ====================================
    // 2. Логика Загрузки Уровней
    // ====================================

    fetch(jsonPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка загрузки данных: ${response.statusText}`);
            }
            return response.json();
        })
        .then(levels => {
            levels.forEach(level => {
                const li = document.createElement('li');
                li.className = 'level-item';

                // Определяем, нужно ли применять специальный стиль для FPS
                const isExtreme = level.fps.length > 15 || level.fps.includes('^') || level.fps.includes('↑') || level.fps === 'idk';
                const fpsClass = isExtreme ? 'extreme-fps-value' : '';
                
                li.innerHTML = `
                    <div class="level-header">
                        <span class="level-number">${level.number}.</span>
                        <a href="${level.showcase}" target="_blank" class="level-name">${level.name}</a>
                        <span class="level-creator">by ${level.creator}</span>
                    </div>
                    <ul class="level-details">
                        <li class="detail-line-full"><span class="detail-label">FPS:</span> <span class="${fpsClass}">${level.fps}</span></li>
                        
                        <li class="detail-line-full"><span class="detail-label">ID:</span> ${level.id};</li>
                        
                        <li><span class="detail-label">FV:</span> ${level.fv};</li>
                        <li>
                            <a href="${level.showcase}" target="_blank" class="showcase-link">
                                Showcase
                            </a>
                        </li>
                    </ul>
                `;

                listElement.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Не удалось загрузить или обработать список уровней:', error);
            listElement.innerHTML = `<p style="color: red; text-align: center;">Ошибка: Не удалось загрузить список уровней. Проверьте файл levels.json и консоль.</p>`;
        });
});
