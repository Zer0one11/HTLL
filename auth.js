import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    set, 
    push, 
    get, 
    child, 
    onValue, 
    remove 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut, 
    updateProfile,
    sendEmailVerification 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

// Глобальные ссылки для script.js
window.db = db;
window.auth = auth;
window.dbRefs = { ref, set, push, get, child, onValue, remove };

const authMainBtn = document.getElementById('auth-main-btn');
const profileBlock = document.getElementById('user-profile-block');
const userNameDisplay = document.getElementById('user-nick-display');
const authModal = document.getElementById('auth-modal');
const switchBtn = document.getElementById('auth-mode-switch');
const authTitle = document.getElementById('auth-title');
const authNickInput = document.getElementById('auth-nick');

let isLoginMode = true;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (!user.emailVerified) {
            if (authMainBtn) authMainBtn.style.display = 'block';
            if (profileBlock) profileBlock.style.display = 'none';
            return;
        }

        let name = user.displayName;
        if (!name) {
            try {
                const snapshot = await get(child(ref(db), `users/${user.uid}`));
                if (snapshot.exists()) {
                    name = snapshot.val().username;
                }
            } catch (e) {
                console.error("Ошибка загрузки ника:", e);
            }
        }

        if (authMainBtn) authMainBtn.style.display = 'none';
        if (profileBlock) profileBlock.style.display = 'flex';
        if (userNameDisplay) userNameDisplay.innerText = name || "User";
    } else {
        if (authMainBtn) authMainBtn.style.display = 'block';
        if (profileBlock) profileBlock.style.display = 'none';
    }
});

if(authMainBtn) authMainBtn.onclick = () => authModal.style.display = 'flex';
if(document.getElementById('close-auth')) {
    document.getElementById('close-auth').onclick = () => authModal.style.display = 'none';
}

if(switchBtn) {
    switchBtn.onclick = () => {
        isLoginMode = !isLoginMode;
        authTitle.innerText = isLoginMode ? "Вход" : "Регистрация";
        authNickInput.style.display = isLoginMode ? "none" : "block";
        switchBtn.innerText = isLoginMode ? "Нет аккаунта? Регистрация" : "Есть аккаунт? Вход";
    };
}

const confirmBtn = document.getElementById('auth-confirm-btn');
if(confirmBtn) {
    confirmBtn.onclick = async () => {
        const email = document.getElementById('auth-email').value.trim();
        const pass = document.getElementById('auth-pass').value.trim();
        const nick = document.getElementById('auth-nick').value.trim();

        if (!email || !pass) return alert("Заполните поля!");

        try {
            if (isLoginMode) {
                const res = await signInWithEmailAndPassword(auth, email, pass);
                if (!res.user.emailVerified) {
                    if (confirm("Почта не подтверждена. Отправить письмо еще раз?")) {
                        await sendEmailVerification(auth.currentUser);
                        alert("Проверьте почту!");
                    }
                    await signOut(auth);
                    return;
                }
            } else {
                if (!nick) return alert("Введите никнейм");
                const res = await createUserWithEmailAndPassword(auth, email, pass);
                await updateProfile(res.user, { displayName: nick });
                await set(ref(db, 'users/' + res.user.uid), {
                    username: nick,
                    email: email,
                    role: 'user'
                });
                await sendEmailVerification(res.user);
                alert("Аккаунт создан! Подтвердите почту перед входом.");
                await signOut(auth);
            }
            authModal.style.display = 'none';
            location.reload(); 
        } catch (e) {
            alert("Ошибка: " + e.message);
        }
    };
}

const logoutBtn = document.getElementById('logout-btn');
if(logoutBtn) {
    logoutBtn.onclick = () => {
        signOut(auth).then(() => location.reload());
    };
}
