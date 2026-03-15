import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
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

window.db = db;
window.auth = auth;

const authMainBtn = document.getElementById('auth-main-btn');
const profileBlock = document.getElementById('user-profile-block');
const userNameDisplay = document.getElementById('user-name-display');
const authModal = document.getElementById('auth-modal');
const switchBtn = document.getElementById('auth-mode-switch');
const authTitle = document.getElementById('auth-title');
const authNickInput = document.getElementById('auth-nick');

let isLoginMode = true;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (!user.emailVerified) {
            authMainBtn.style.display = 'block';
            profileBlock.style.display = 'none';
            return;
        }

        // Пытаемся взять ник из профиля
        let name = user.displayName;

        // Если в профиле пусто, тянем из БД
        if (!name) {
            const { get, ref, child } = window.dbRefs; // убедись, что dbRefs доступны
            const snapshot = await get(child(ref(window.db), `users/${user.uid}`));
            if (snapshot.exists()) {
                name = snapshot.val().username;
            }
        }

        authMainBtn.style.display = 'none';
        profileBlock.style.display = 'flex';
        userNameDisplay.innerText = name || "User";
    } else {
        authMainBtn.style.display = 'block';
        profileBlock.style.display = 'none';
    }
});

if(authMainBtn) authMainBtn.onclick = () => authModal.style.display = 'flex';
if(document.getElementById('close-auth')) document.getElementById('close-auth').onclick = () => authModal.style.display = 'none';

switchBtn.onclick = () => {
    isLoginMode = !isLoginMode;
    authTitle.innerText = isLoginMode ? "Вход" : "Регистрация";
    authNickInput.style.display = isLoginMode ? "none" : "block";
    switchBtn.innerText = isLoginMode ? "Нет аккаунта? Регистрация" : "Есть аккаунт? Вход";
};

document.getElementById('auth-confirm-btn').onclick = async () => {
    const email = document.getElementById('auth-email').value.trim();
    const pass = document.getElementById('auth-pass').value.trim();
    const nick = document.getElementById('auth-nick').value.trim();

    if (!email || !pass) return alert("Заполните Email и Пароль");

    try {
        if (isLoginMode) {
            const res = await signInWithEmailAndPassword(auth, email, pass);
            
            if (!res.user.emailVerified) {
                if (confirm("Ваша почта не подтверждена. Отправить письмо с ссылкой еще раз?")) {
                    await sendEmailVerification(auth.currentUser);
                    alert("Письмо отправлено! Проверьте почту (входящие и спам).");
                }
                await signOut(auth);
                return;
            }
        } else {
            if (!nick) return alert("Введите никнейм");
            const res = await createUserWithEmailAndPassword(auth, email, pass);
            
            await updateProfile(res.user, { displayName: nick });
            await res.user.reload();
            
            try {
                await sendEmailVerification(auth.currentUser);
            } catch (sendError) {
                console.error("Ошибка отправки:", sendError);
            }
            
            await set(ref(db, 'users/' + res.user.uid), {
                username: nick,
                email: email,
                role: 'user'
            });

            alert("Аккаунт создан! Подтвердите почту перед входом.");
            await signOut(auth);
        }
        
        authModal.style.display = 'none';
        location.reload(); 
    } catch (e) {
        alert("Ошибка: " + e.message);
    }
};

document.getElementById('logout-btn').onclick = () => {
    signOut(auth).then(() => location.reload());
};
