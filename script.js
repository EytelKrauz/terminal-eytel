/* =====================
IMPORTS FIREBASE
===================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    setPersistence,
    browserLocalPersistence,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* =====================
FIREBASE CONFIG
===================== */
const firebaseConfig = {
    apiKey: "AIzaSyDb2eM06eDAEMloDnfRMPO5MCbMkfSv_vg",
    authDomain: "terminal-eytel.firebaseapp.com",
    projectId: "terminal-eytel",
    storageBucket: "terminal-eytel.firebasestorage.app",
    messagingSenderId: "67925038834",
    appId: "1:67925038834:web:0ca9f944bc965c7fd0e26b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* =====================
PERSISTENCIA DE SESIÓN
===================== */
setPersistence(auth, browserLocalPersistence);

/* =====================
ELEMENTOS DOM
===================== */
const input = document.getElementById("realInput");
const welcome = document.getElementById("welcome");
const appContainer = document.getElementById("appContainer");
const linksContainer = document.getElementById("linksContainer");

/* =====================
CONSTANTES
===================== */
const WELCOME_TEXT = "封鎖区域";
const TYPE_SPEED_TITLE = 30;
const TYPE_SPEED_TERMINAL = 10;

/* =====================
ESTADO GLOBAL
===================== */
let isTyping = false;
let state = "idle";
let currentUser = "";
let systemText = "";

// 🔐 Control de autenticación
let authProcessing = false;
let authInitialized = false;

/* =====================
UTILIDADES
===================== */
function cleanText(text) {
    return text.replace(/[\u200E\u200F\u202A-\u202E]/g, "");
}

function moveCursorToEnd() {
    input.selectionStart = input.selectionEnd = input.value.length;
}

function forceScrollBottom() {
    input.scrollTop = input.scrollHeight;
}

/* =====================
ANIMACIÓN TÍTULO
===================== */
function typeWelcomeText(text, callback) {
    let i = 0;
    welcome.textContent = "";
    const interval = setInterval(() => {
        welcome.textContent += text.charAt(i++);
        if (i >= text.length) {
            clearInterval(interval);
            callback?.();
        }
    }, TYPE_SPEED_TITLE);
}

/* =====================
TYPEWRITER SEGURO
===================== */
function typeText(text) {
    return new Promise(resolve => {
        isTyping = true;
        let i = 0;

        const interval = setInterval(() => {
            input.value += text.charAt(i++);
            moveCursorToEnd();
            forceScrollBottom();

            if (i >= text.length) {
                clearInterval(interval);
                isTyping = false;
                systemText = input.value;
                resolve();
            }
        }, TYPE_SPEED_TERMINAL);
    });
}

function print(text) {
    return typeText(cleanText(text) + "\n");
}

/* =====================
PROTECCIÓN INPUT
===================== */
document.addEventListener("selectionchange", () => {
    if (
        document.activeElement === input &&
        input.selectionStart < systemText.length
    ) {
        moveCursorToEnd();
    }
});

input.addEventListener("keydown", async e => {
    if (isTyping || authProcessing) return e.preventDefault();

    if (
        (e.key === "Backspace" || e.key === "ArrowLeft") &&
        input.selectionStart <= systemText.length
    ) return e.preventDefault();

    if (e.key === "Enter") {
        e.preventDefault();

        const userText = input.value.substring(systemText.length);
        systemText = input.value + "\n";
        input.value = systemText;

        const command = userText.trim();
        await executeCommand(command);
    }
});

input.addEventListener("input", () => {
    if (!input.value.startsWith(systemText)) {
        input.value = systemText;
        moveCursorToEnd();
    }
});

input.addEventListener("paste", e => e.preventDefault());

/* =====================
LINKS
===================== */
function renderLinks(lines) {
    linksContainer.innerHTML = "";

    lines.forEach(line => {
        const match = line.match(/(https?:\/\/\S+)/);
        if (!match) return;

        const url = match[1];
        const label = line.replace(url, "").trim();

        const a = document.createElement("a");
        a.href = url;
        a.textContent = label || url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";

        linksContainer.appendChild(a);
    });
}

/* =====================
CONTENIDO SEGURO
===================== */
async function loadSecureContent() {
    const ref = doc(db, "secureContent", "main");
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        await print("No hay contenido seguro.");
        return;
    }

    const data = snap.data();

    await print(`=== ${data.title} ===`);
    renderLinks(data.lines);

    systemText = input.value;
    moveCursorToEnd();
}

/* =====================
COMANDOS
===================== */
async function executeCommand(command) {
    const cmd = command.toLowerCase();
    const loginCommands = ["login", "acceder", "entrar", "iniciar"];

    if (state === "idle") {
        if (loginCommands.includes(cmd)) {
            await print("Ingrese usuario:");
            state = "askUser";
        } else {
            await print("Debe iniciar sesión.");
        }
        return;
    }

    if (state === "askUser") {
        currentUser = cmd;
        await print("Ingrese contraseña:");
        state = "askPassword";
        return;
    }

    if (state === "askPassword") {
        const email = `${currentUser}@terminal.app`;

        authProcessing = true;
        await print("Verificando...");

        try {
            await signInWithEmailAndPassword(auth, email, command);
            state = "authenticated";
            await print(`[ Acceso concedido ]`);
            await loadSecureContent();
        } catch {
            await print("Credenciales incorrectas.");
            state = "idle";
        }

        authProcessing = false;
        return;
    }

    if (state === "authenticated") {
        switch (cmd) {
            case "logout":
                authProcessing = true;
                await signOut(auth);
                state = "idle";
                currentUser = "";
                linksContainer.innerHTML = "";
                await print("Sesión cerrada.");
                authProcessing = false;
                break;

            case "status":
                await print("Estado: Autenticado.");
                break;

            case "clear":
                input.value = "";
                systemText = "";
                linksContainer.innerHTML = "";
                break;

            default:
                await print("Comando no reconocido.");
        }
    }
}

/* =====================
RESTAURAR SESIÓN
===================== */
onAuthStateChanged(auth, async user => {

    // ⛔ Evitar colisión con login manual
    if (authProcessing) return;

    // ⛔ Primera ejecución
    if (!authInitialized) {
        authInitialized = true;
        if (!user) return;
    }

    if (!user) return;

    currentUser = user.email.split("@")[0];
    state = "authenticated";

    await print(`[ Sesión restaurada ]`);
    await loadSecureContent();
});

/* =====================
FIX TECLADO MÓVIL
===================== */
if (window.visualViewport) {
    visualViewport.addEventListener("resize", () => {
        appContainer.style.height = `${visualViewport.height}px`;
        forceScrollBottom();
    });
}

/* =====================
INICIO
===================== */
window.addEventListener("load", () => {
    input.value = "";
    systemText = "";
    linksContainer.innerHTML = "";

    setTimeout(() => {
        typeWelcomeText(WELCOME_TEXT, () => input.focus());
    }, 500);
});