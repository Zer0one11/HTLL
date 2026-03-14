// ПРОВЕРКА ЗАГРУЗКИ
alert("СКРИПТ РАБОТАЕТ");
console.log("Auth module loaded");

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCuO6xuP2AP61bTbiqjho_jzXiDsCzxTCY",
    authDomain: "htll-request.firebaseapp.com",
    databaseURL: "https://htll-request-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "htll-request",
    appId: "1:400821777799:web:88da4772f63810f67e4f22"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

let isLoginMode = true;

// ЗАЩИТА РЕКВЕСТОВ
const requestBtn = document.querySelector('.request-main-btn');
if (requestBtn) {
    requestBtn.addEventListener('click', (e) => {
        if (!auth.currentUser) {
            e.preventDefault();
            e.stopImmediatePropagation();
            alert("Войдите в аккаунт, чтобы подавать реквесты!");
            window.location.href = 'account.html';
        }
    });
}

// СОСТОЯНИЕ ЮЗЕРА
onAuthStateChanged(auth, (user) => {
    const profileView = document.getElementById('profile-view');
    const authForm = document.getElementById('auth-form');
    if (user) {
        if (profileView) profileView.style.display = 'block';
        if (authForm) authForm.style.display = 'none';
        if (document.getElementById('user-display-name')) {
            document.getElementById('user-display-name').innerText = user.displayName || "User";
            document.getElementById('user-email-text').innerText = user.email;
        }
    } else {
        if (profileView) profileView.style.display = 'none';
        if (authForm) authForm.style.display = 'block';
    }
});

// ПЕРЕКЛЮЧЕНИЕ РЕЖИМА
const switchBtn = document.getElementById('auth-mode-switch');
if (switchBtn) {
    switchBtn.onclick = () => {
        isLoginMode = !isLoginMode;
        document.getElementById('auth-title').innerText = isLoginMode ? "Вход" : "Регистрация";
        document.getElementById('auth-nick').style.display = isLoginMode ? "none" : "block";
        document.getElementById('auth-confirm-btn').innerText = isLoginMode ? "Войти" : "Создать";
        switchBtn.innerText = isLoginMode ? "Нет аккаунта? Регистрация" : "Есть аккаунт? Вход";
    };
}

// КНОПКА ПОДТВЕРЖДЕНИЯ
const confirmBtn = document.getElementById('auth-confirm-btn');
if (confirmBtn) {
    confirmBtn.onclick = async () => {
        const email = document.getElementById('auth-email').value.trim();
        const pass = document.getElementById('auth-pass').value.trim();
        const nick = document.getElementById('auth-nick').value.trim();

        if (!email || !pass) return alert("Заполни поля!");

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, pass);
            } else {
                if (!nick) return alert("Введи ник!");
                const res = await createUserWithEmailAndPassword(auth, email, pass);
                await updateProfile(res.user, { displayName: nick });
                await set(ref(db, 'users/' + res.user.uid), { username: nick, email: email, role: 'user' });
            }
            window.location.href = 'index.html';
        } catch (e) {
            alert("Ошибка: " + e.message);
        }
    };
}

// ВЫХОД
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.onclick = () => signOut(auth).then(() => location.reload());
}
