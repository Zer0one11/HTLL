function initUserChat(reqId) {
    const { ref, onValue, push, set, remove } = window.dbRefs;
    const chatBox = document.getElementById('chat-messages');

    // Очищаем старый слушатель, если он был (Firebase сделает это сам при новом вызове)
    onValue(ref(window.db, `requests/${reqId}/messages`), (snapshot) => {
        chatBox.innerHTML = '';
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const msg = childSnapshot.val();
                const div = document.createElement('div');
                
                // Цвет сообщения: админ красный, пользователь зеленый
                const isAdmin = msg.role === 'admin';
                div.style.color = isAdmin ? '#ff4444' : '#44ff44';
                div.style.fontWeight = '900';
                div.style.marginBottom = '8px';
                div.style.wordBreak = 'break-word';
                
                const senderName = isAdmin ? 'АДМИНИСТРАТОР' : 'ВЫ';
                div.innerText = `${senderName}: ${msg.text}`;
                
                chatBox.appendChild(div);
            });
            chatBox.scrollTop = chatBox.scrollHeight;
        } else {
            chatBox.innerHTML = '<div style="opacity:0.3; font-size:0.7rem;">Сообщений пока нет...</div>';
        }
    });

    // Отправка сообщения пользователем
    document.getElementById('send-msg').onclick = async () => {
        const input = document.getElementById('user-msg');
        const text = input.value.trim();
        if (!text) return;

        try {
            const msgRef = push(ref(window.db, `requests/${reqId}/messages`));
            await set(msgRef, {
                text: text,
                role: 'user', // Пользователь всегда отправляет как user
                timestamp: Date.now()
            });
            input.value = '';
        } catch (e) {
            alert("Ошибка отправки!");
            console.error(e);
        }
    };

    document.getElementById('delete-chat-user').onclick = async () => {
        if (confirm("УДАЛИТЬ ВАШ ЗАПРОС И ЧАТ?")) {
            await remove(ref(window.db, `requests/${reqId}`));
            localStorage.removeItem('myRequestID');
            location.reload();
        }
    };
}

function showForm(user) {
    document.getElementById('request-form-container').style.display = 'block';
    document.getElementById('chat-section').style.display = 'none';
    const nickInput = document.getElementById('req-nickname');
    if(nickInput) nickInput.value = user.displayName || "";
}

async function handleRequestModal() {
    const user = window.auth ? window.auth.currentUser : null;
    const reqModal = document.getElementById('request-modal');
    
    if (!user || !user.emailVerified) return alert("Войдите и подтвердите почту!");

    let myReqId = localStorage.getItem('myRequestID');
    if (myReqId) {
        const snapshot = await window.dbRefs.get(window.dbRefs.ref(window.db, 'requests/' + myReqId));
        if (snapshot.exists()) {
            document.getElementById('request-form-container').style.display = 'none';
            document.getElementById('chat-section').style.display = 'block';
            initUserChat(myReqId);
        } else {
            localStorage.removeItem('myRequestID');
            showForm(user);
        }
    } else {
        showForm(user);
    }
    reqModal.style.display = 'flex';
}
