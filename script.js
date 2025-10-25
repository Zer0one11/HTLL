document.addEventListener('DOMContentLoaded', () => {
    const listElement = document.getElementById('levelList');
    const jsonPath = 'levels.json'; // Путь к вашему файлу данных

    fetch(jsonPath)
        .then(response => {
            // Проверка, что файл найден и доступен
            if (!response.ok) {
                throw new Error(`Ошибка загрузки данных: ${response.statusText}`);
            }
            return response.json();
        })
        .then(levels => {
            // Создание HTML для каждого уровня
            levels.forEach(level => {
                const li = document.createElement('li');
                li.className = 'level-item';

                // Создание содержимого карточки
                li.innerHTML = `
                    <div class="level-header">
                        <span class="level-number">${level.number}.</span>
                        <a href="${level.showcase}" class="level-name">${level.name}</a>
                        <span class="level-creator">by ${level.creator}</span>
                    </div>
                    <ul class="level-details">
                        <li><span class="detail-label">FPS:</span> ${level.fps};</li>
                        <li><span class="detail-label">ID:</span> ${level.id};</li>
                        <li><span class="detail-label">FV:</span> ${level.fv};</li>
                        <li>
                            <a href="${level.showcase}" target="_blank" class="showcase-link">
                                Showcase
                            </a>
                        </li>
                    </ul>
                `;

                // Добавление карточки в основной список
                listElement.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Не удалось загрузить или обработать список уровней:', error);
            listElement.innerHTML = `<p style="color: red;">Ошибка: Не удалось загрузить список уровней. Проверьте файл levels.json и консоль.</p>`;
        });
});
