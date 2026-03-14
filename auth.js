import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
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

// 1. ПРОВЕРКА АВТОРИЗАЦИИ ДЛЯ РЕКВЕСТОВ
const openRequestBtn = document.getElementById('open-request-btn');
if (openRequestBtn) {
    const originalCallback = openRequestBtn.onclick;
    openRequestBtn.onclick = (e) => {
        if (!auth.currentUser) {
            alert("Войдите в аккаунт, чтобы подать реквест!");
            window.location.href = 'account.html';
        } else if (originalCallback) {
            originalCallback(e);
        }
    };
}

// 2. ОБНОВЛЕНИЕ UI ПРИ СМЕНЕ СОСТОЯНИЯ
onAuthStateChanged(auth, (user) => {
    const authMainBtn = document.getElementById('auth-main-btn');
    const profileBlock = document.getElementById('user-profile-block');
    const userNickDisplay = document.getElementById('user-nick-display');
    const authForm = document.getElementById('auth-form');
    const profileView = document.getElementById('profile-view');

    if (user) {
        if (authMainBtn) authMainBtn.style.display = 'none';
        if (profileBlock) profileBlock.style.display = 'block';
        if (userNickDisplay) userNickDisplay.innerText = user.displayName || "User";
        
        // Для страницы account.html
        if (authForm) authForm.style.display = 'none';
        if (profileView) profileView.style.display = 'block';
        if (document.getElementById('user-display-name')) {
            document.getElementById('user-display-name').innerText = user.displayName || "User";
            document.getElementById('user-email-text').innerText = user.email;
        }
    } else {
        if (authMainBtn) authMainBtn.style.display = 'block';
        if (profileBlock) profileBlock.style.display = 'none';
        
        // Для страницы account.html
        if (authForm) authForm.style.display = 'block';
        if (profileView) profileView.style.display = 'none';
    }
});

// 3. ПЕРЕКЛЮЧЕНИЕ РЕЖИМА (Вход/Регистрация)
const switchBtn = document.getElementById('auth-mode-switch');
if (switchBtn) {
    switchBtn.onclick = () => {
        isLoginMode = !isLoginMode;
        const authTitle = document.getElementById('auth-title');
        const authNickInput = document.getElementById('auth-nick');
        const confirmBtn = document.getElementById('auth-confirm-btn');

        if (authTitle) authTitle.innerText = isLoginMode ? "Вход" : "Регистрация";
        if (authNickInput) authNickInput.style.display = isLoginMode ? "none" : "block";
        if (confirmBtn) confirmBtn.innerText = isLoginMode ? "Войти" : "Создать";
        switchBtn.innerText = isLoginMode ? "Нет аккаунта? Регистрация" : "Есть аккаунт? Вход";
    };
}

// 4. КНОПКА ПОДТВЕРЖДЕНИЯ
const authConfirmBtn = document.getElementById('auth-confirm-btn');
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
            window.location.href = 'index.html';
        } catch (e) {
            alert("Ошибка: " + e.message);
        }
    };
}

// 5. КНОПКА ВЫХОДА
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.onclick = () => signOut(auth).then(() => location.reload());
}
