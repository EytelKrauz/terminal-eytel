import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

/* =====================
   FIREBASE
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

/* =====================
   ELEMENTOS
===================== */
const input = document.getElementById("realInput");
const welcome = document.getElementById("welcome");
const appContainer = document.getElementById("appContainer");

/* =====================
   CONSTANTES
===================== */
const WELCOME_TEXT = "封鎖区域";
const TYPE_SPEED_TITLE = 30;
const TYPE_SPEED_TERMINAL = 10;

/* =====================
   ESTADO
===================== */
let isTyping = false;
let state = "idle";
let currentUser = "";
let systemText = "";

/* =====================
   ANIMACIÓN INICIAL
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
   SCROLL / CURSOR
===================== */
function moveCursorToEnd() {
    input.selectionStart = input.selectionEnd = input.value.length;
}

function forceScrollBottom() {
    input.scrollTop = input.scrollHeight;
    if (document.activeElement !== input) input.focus();
}

function keepInputVisible() {
    requestAnimationFrame(() => {
        forceScrollBottom();
        window.scrollTo(0, 0);
    });
}

function enableTerminal() {
    input.focus();
    keepInputVisible();
}

/* =====================
   VIEWPORT MÓVIL
===================== */
if (window.visualViewport) {
    visualViewport.addEventListener("resize", () => {
        appContainer.style.height = `${visualViewport.height}px`;
        forceScrollBottom();
    });

    visualViewport.addEventListener("scroll", forceScrollBottom);

    window.addEventListener("load", () => {
        appContainer.style.height = `${visualViewport.height}px`;
    });
}

document.body.addEventListener("touchstart", e => {
    if (e.target !== input) enableTerminal();
});

/* =====================
   TYPEWRITER
===================== */
function typeText(text, callback) {
    isTyping = true;
    let i = 0;
    const interval = setInterval(() => {
        input.value += text.charAt(i++);
        moveCursorToEnd();
        input.scrollTop = input.scrollHeight;

        if (i >= text.length) {
            clearInterval(interval);
            isTyping = false;
            systemText = input.value;
            requestAnimationFrame(forceScrollBottom);
            callback?.();
        }
    }, TYPE_SPEED_TERMINAL);
}

function print(text, callback) {
    input.value += "\n";
    input.scrollTop = input.scrollHeight;
    typeText(text + "\n", callback);
}

/* =====================
   PROTECCIÓN DE CURSOR
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
    if (isTyping) return e.preventDefault();

    if (e.key === "Backspace" && input.selectionStart <= systemText.length)
        return e.preventDefault();

    if (e.key === "ArrowLeft" && input.selectionStart <= systemText.length)
        return e.preventDefault();

    if (e.key === "Enter") {
        e.preventDefault();
        const command = input.value.substring(systemText.length).trim();
        systemText = input.value + "\n";
        input.value = systemText;
        forceScrollBottom();
        await executeCommand(command);
    }
});

input.addEventListener("input", () => {
    if (isTyping) {
        input.value = systemText;
        return;
    }

    if (!input.value.startsWith(systemText)) {
        input.value = systemText;
    }

    forceScrollBottom();
});

input.addEventListener("paste", e => e.preventDefault());

/* =====================
   COMANDOS
===================== */
async function executeCommand(command) {
    const cmd = command.toLowerCase();
    const loginCommands = ["acceder", "iniciar", "ingresar", "login", "entrar"];

    if (state === "idle") {
        if (loginCommands.includes(cmd)) {
            print("Ingrese usuario:", () => state = "askUser");
        } else if (cmd === "help") {
            print("Comandos disponibles:\n- login\n- help\n- clear\n- about");
        } else if (cmd === "clear") {
            input.value = "";
            systemText = "";
            print("");
        } else if (cmd === "about") {
            print("Terminal segura v1.0.");
        } else if (cmd) {
            print(`Comando no reconocido: [ ${command} ]. Debe iniciar sesión`);
        } else {
            print("");
        }
        return;
    }

    if (state === "askUser") {
        if (cmd) {
            currentUser = cmd;
            print("Ingrese contraseña:", () => state = "askPassword");
        } else {
            print("Usuario inválido.");
            state = "idle";
        }
        return;
    }

    if (state === "askPassword") {
        const email = `${currentUser}@terminal.app`;
        print("Verificando...", async () => {
            try {
                await signInWithEmailAndPassword(auth, email, command);
                print(
                    `Acceso concedido. Bienvenido ${currentUser}`,
                    () => state = "authenticated"
                );
            } catch {
                print("Error de credenciales.", () => {
                    state = "idle";
                    print("Intente 'login' nuevamente.");
                });
            }
        });
        return;
    }

    if (state === "authenticated") {
        switch (cmd) {
            case "help":
                print("Comandos:\n- logout\n- clear\n- status");
                break;
            case "clear":
                input.value = "";
                systemText = "";
                break;
            case "logout":
                state = "idle";
                currentUser = "";
                print("Desconectado.");
                break;
            case "status":
                print("Estado: Conectado y Seguro.");
                break;
            default:
                print(cmd ? "Comando desconocido." : "");
        }
    }
}

/* =====================
   INICIO
===================== */
window.addEventListener("load", () => {
    input.value = "";
    systemText = "";
    setTimeout(() => {
        typeWelcomeText(WELCOME_TEXT, enableTerminal);
    }, 500);
});