// Инициализация живого чата
function initUserChat(reqId) {
    const { ref, onValue, push, set, remove } = window.dbRefs;
    const chatBox = document.getElementById('chat-messages');

    // Слушатель новых сообщений
    onValue(ref(window.db, `requests/${reqId}/messages`), (snapshot) => {
        chatBox.innerHTML = '';
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const msg = child.val();
                const div = document.createElement('div');
                div.style.color = msg.role === 'admin' ? '#ff4444' : '#44ff44';
                div.style.fontWeight = '900';
                div.style.marginBottom = '8px';
                div.innerText = `${msg.role === 'admin' ? 'АДМИН' : 'ВЫ'}: ${msg.text}`;
                chatBox.appendChild(div);
            });
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    });

    // Кнопка отправки сообщения
    document.getElementById('send-msg').onclick = async () => {
        const input = document.getElementById('user-msg');
        const text = input.value.trim();
        if (!text) return;
        const msgRef = push(ref(window.db, `requests/${reqId}/messages`));
        await set(msgRef, { text, role: 'user', timestamp: Date.now() });
        input.value = '';
    };

    // Удаление своего реквеста
    document.getElementById('delete-chat-user').onclick = async () => {
        if (confirm("УДАЛИТЬ РЕКВЕСТ?")) {
            await remove(ref(window.db, `requests/${reqId}`));
            localStorage.removeItem('myRequestID');
            location.reload();
        }
    };
}

// Отображение формы
function showForm(user) {
    document.getElementById('request-form-container').style.display = 'block';
    document.getElementById('chat-section').style.display = 'none';
    const nickInput = document.getElementById('req-nickname');
    if(nickInput) nickInput.value = user.displayName || "";
}

// Логика открытия модального окна реквеста
async function handleRequestModal() {
    const user = window.auth ? window.auth.currentUser : null;
    const reqModal = document.getElementById('request-modal');
    
    if (!user || !user.emailVerified) return alert("Войдите в аккаунт и подтвердите почту!");

    let myReqId = localStorage.getItem('myRequestID');
    if (myReqId) {
        try {
            const snapshot = await window.dbRefs.get(window.dbRefs.ref(window.db, 'requests/' + myReqId));
            if (snapshot.exists()) {
                document.getElementById('request-form-container').style.display = 'none';
                document.getElementById('chat-section').style.display = 'block';
                initUserChat(myReqId);
            } else {
                localStorage.removeItem('myRequestID');
                showForm(user);
            }
        } catch(e) { showForm(user); }
    } else {
        showForm(user);
    }
    reqModal.style.display = 'flex';
}
