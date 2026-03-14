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

// Делаем объекты доступными для других скриптов (например, для script.js)
window.db = db;
window.auth = auth;
window.dbRefs = { ref, push, set, onValue, update, remove };

const authMainBtn = document.getElementById('auth-main-btn');
const profileBlock = document.getElementById('user-profile-block');
const userNickDisplay = document.getElementById('user-nick-display');
const authModal = document.getElementById('auth-modal');
const authTitle = document.getElementById('auth-title');
const authNickInput = document.getElementById('auth-nick');
const switchBtn = document.getElementById('auth-mode-switch');

let isLoginMode = true;

// Следим за состоянием юзера
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (authMainBtn) authMainBtn.style.display = 'none';
        if (profileBlock) profileBlock.style.display = 'block';
        if (userNickDisplay) userNickDisplay.innerText = user.displayName || "User";
    } else {
        if (authMainBtn) authMainBtn.style.display = 'block';
        if (profileBlock) profileBlock.style.display = 'none';
    }
});

// Открытие модалки
if (authMainBtn) {
    authMainBtn.onclick = () => {
        isLoginMode = true;
        updateAuthUI();
        authModal.style.display = 'flex';
    };
}

// Закрытие модалки
document.getElementById('close-auth').onclick = () => authModal.style.display = 'none';

// Переключение Вход/Регистрация
switchBtn.onclick = () => {
    isLoginMode = !isLoginMode;
    updateAuthUI();
};

function updateAuthUI() {
    authTitle.innerText = isLoginMode ? "Вход" : "Регистрация";
    authNickInput.style.display = isLoginMode ? "none" : "block";
    switchBtn.innerText = isLoginMode ? "Нет аккаунта? Регистрация" : "Есть аккаунт? Вход";
}

// Кнопка подтверждения
document.getElementById('auth-confirm-btn').onclick = async () => {
    const email = document.getElementById('auth-email').value.trim();
    const pass = document.getElementById('auth-pass').value.trim();
    const nick = document.getElementById('auth-nick').value.trim();

    if (!email || !pass) return alert("Заполните Email и Пароль");

    try {
        if (isLoginMode) {
            await signInWithEmailAndPassword(auth, email, pass);
        } else {
            if (!nick) return alert("Введите никнейм");
            const res = await createUserWithEmailAndPassword(auth, email, pass);
            await updateProfile(res.user, { displayName: nick });
            await set(ref(db, 'users/' + res.user.uid), {
                username: nick,
                email: email,
                role: 'user'
            });
        }
        
        if (authMainBtn) authMainBtn.style.display = 'none';
        authModal.style.display = 'none';
        location.reload(); 
    } catch (e) {
        alert("Ошибка: " + e.message);
    }
};

// Кнопка выхода
document.getElementById('logout-btn').onclick = () => {
    signOut(auth).then(() => location.reload());
};
