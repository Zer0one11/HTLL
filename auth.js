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
window.dbRefs = { ref, push, set, onValue, update, remove };

let isLoginMode = true;

// Элементы UI
const authMainBtn = document.getElementById('auth-main-btn');
const profileBlock = document.getElementById('user-profile-block');
const userNickDisplay = document.getElementById('user-nick-display');
const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const profileView = document.getElementById('profile-view');

// Следим за состоянием юзера
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (authMainBtn) authMainBtn.style.display = 'none';
        if (profileBlock) profileBlock.style.display = 'block';
        if (userNickDisplay) userNickDisplay.innerText = user.displayName || "User";
        
        // Для страницы аккаунта
        if (authForm) authForm.style.display = 'none';
        if (profileView) profileView.style.display = 'block';
        if (document.getElementById('user-display-name')) {
            document.getElementById('user-display-name').innerText = user.displayName || "User";
            document.getElementById('user-email-text').innerText = user.email;
        }
    } else {
        if (authMainBtn) authMainBtn.style.display = 'block';
        if (profileBlock) profileBlock.style.display = 'none';
        
        // Для страницы аккаунта
        if (authForm) authForm.style.display = 'block';
        if (profileView) profileView.style.display = 'none';
    }
});

// Кнопка подтверждения (универсальная для модалки и страницы)
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
                if (!nick) return alert("Введи никнейм");
                const res = await createUserWithEmailAndPassword(auth, email, pass);
                await updateProfile(res.user, { displayName: nick });
                await set(ref(db, 'users/' + res.user.uid), { username: nick, email: email, role: 'user' });
            }
            if (authModal) authModal.style.display = 'none';
            // Если мы на странице аккаунта — перекидываем на главную
            if (window.location.pathname.includes('account.html')) {
                window.location.href = 'index.html';
            } else {
                location.reload();
            }
        } catch (e) { alert("Ошибка: " + e.message); }
    };
}

// Переключение режимов
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

// Выход (поддержка обеих кнопок выхода)
const logoutHandler = () => signOut(auth).then(() => {
    if (window.location.pathname.includes('account.html')) {
        window.location.href = 'index.html';
    } else {
        location.reload();
    }
});

if (document.getElementById('logout-btn')) document.getElementById('logout-btn').onclick = logoutHandler;
if (document.getElementById('logout-btn-account')) document.getElementById('logout-btn-account').onclick = logoutHandler;

// Открытие/закрытие модалки на главной
if (authMainBtn) authMainBtn.onclick = () => { authModal.style.display = 'flex'; isLoginMode = true; };
const closeAuth = document.getElementById('close-auth');
if (closeAuth) closeAuth.onclick = () => authModal.style.display = 'none';
