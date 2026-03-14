import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
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

window.db = db;
window.auth = auth;

let isLoginMode = true;

// Элементы
const authMainBtn = document.getElementById('auth-main-btn');
const profileBlock = document.getElementById('user-profile-block');
const userNickDisplay = document.getElementById('user-nick-display');
const authConfirmBtn = document.getElementById('auth-confirm-btn');
const switchBtn = document.getElementById('auth-mode-switch');

// Состояние юзера
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (authMainBtn) authMainBtn.style.display = 'none';
        if (profileBlock) profileBlock.style.display = 'block';
        if (userNickDisplay) userNickDisplay.innerText = user.displayName || "User";
        
        // Если мы в account.html, показываем профиль
        const profileView = document.getElementById('profile-view');
        const authForm = document.getElementById('auth-form');
        if (profileView) profileView.style.display = 'block';
        if (authForm) authForm.style.display = 'none';
        if (document.getElementById('user-display-name')) {
            document.getElementById('user-display-name').innerText = user.displayName || "User";
            document.getElementById('user-email-text').innerText = user.email;
        }
    } else {
        if (authMainBtn) authMainBtn.style.display = 'block';
        if (profileBlock) profileBlock.style.display = 'none';
        
        const profileView = document.getElementById('profile-view');
        const authForm = document.getElementById('auth-form');
        if (profileView) profileView.style.display = 'none';
        if (authForm) authForm.style.display = 'block';
    }
});

// Переключение Вход/Регистрация
if (switchBtn) {
    switchBtn.onclick = () => {
        isLoginMode = !isLoginMode;
        const authTitle = document.getElementById('auth-title');
        const authNickInput = document.getElementById('auth-nick');
        if (authTitle) authTitle.innerText = isLoginMode ? "Вход" : "Регистрация";
        if (authNickInput) authNickInput.style.display = isLoginMode ? "none" : "block";
        switchBtn.innerText = isLoginMode ? "Нет аккаунта? Регистрация" : "Есть аккаунт? Вход";
        if (authConfirmBtn) authConfirmBtn.innerText = isLoginMode ? "Войти" : "Создать";
    };
}

// Кнопка подтверждения
if (authConfirmBtn) {
    authConfirmBtn.onclick = async () => {
        const email = document.getElementById('auth-email').value.trim();
        const pass = document.getElementById('auth-pass').value.trim();
        const nickInput = document.getElementById('auth-nick');
        const nick = nickInput ? nickInput.value.trim() : "";

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
            if (window.location.pathname.includes('account.html')) {
                window.location.href = 'index.html';
            } else {
                location.reload();
            }
        } catch (e) {
            alert("Ошибка: " + e.message);
        }
    };
}

// Выход
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.onclick = () => signOut(auth).then(() => location.reload());
}
