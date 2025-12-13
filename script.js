/* =========================
   FIREBASE
========================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

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

/* =========================
   ELEMENTOS
========================= */
const input = document.getElementById("realInput");
const welcome = document.getElementById("welcome");

/* =========================
   CONFIG
========================= */
const WELCOME_TEXT = "Hola Eytel...";
const TYPE_SPEED_TITLE = 30;
const TYPE_SPEED_TERMINAL = 25;

/* =========================
   ESTADO
========================= */
let isTyping = false;
let state = "idle"; 
// idle | askUser | askPassword | authenticated
let currentUser = "";
let systemText = "";

/* =========================
   ANIMACIÓN TÍTULO
========================= */
function typeWelcomeText(text, callback) {
  let i = 0;
  welcome.textContent = "";

  const interval = setInterval(() => {
    welcome.textContent += text.charAt(i);
    i++;
    if (i >= text.length) {
      clearInterval(interval);
      callback && callback();
    }
  }, TYPE_SPEED_TITLE);
}

/* =========================
   UTILIDADES
========================= */
function moveCursorToEnd() {
  input.selectionStart = input.selectionEnd = input.value.length;
}

function keepInputVisible() {
  requestAnimationFrame(() => {
    input.scrollTop = input.scrollHeight;
  });
}

function enableTerminal() {
  input.focus();
}

document.body.addEventListener("touchstart", enableTerminal);

/* =========================
   BLOQUEO TOTAL USUARIO
========================= */
function blockUserInput(e) {
  if (isTyping) {
    e.preventDefault();
    e.stopPropagation();
    return true;
  }
  return false;
}

/* =========================
   IMPRESIÓN CON TIPEO
========================= */
function typeText(text, callback) {
  isTyping = true;
  let i = 0;

  const interval = setInterval(() => {
    input.value += text.charAt(i);
    moveCursorToEnd();
    keepInputVisible();
    i++;

    if (i >= text.length) {
      clearInterval(interval);
      isTyping = false;
      systemText = input.value;
      keepInputVisible();
      callback && callback();
    }
  }, TYPE_SPEED_TERMINAL);
}

function print(text, callback) {
  input.value += "\n";
  typeText(text + "\n", callback);
}

/* =========================
   PROTECCIÓN TEXTO
========================= */
input.addEventListener("input", () => {

  if (isTyping) {
    input.value = systemText;
    return;
  }

  if (input.value.length < systemText.length) {
    input.value = systemText;
  }

  keepInputVisible();
});

input.addEventListener("paste", e => e.preventDefault());
input.addEventListener("click", moveCursorToEnd);

document.addEventListener("selectionchange", () => {
  if (document.activeElement === input) moveCursorToEnd();
});

/* =========================
   TECLADO
========================= */
input.addEventListener("keydown", async (e) => {

  if (blockUserInput(e)) return;

  if (e.key === "Backspace" && input.selectionStart <= systemText.length) {
    e.preventDefault();
    return;
  }

  if (e.key === "Enter") {
    e.preventDefault();

    const lines = input.value.split("\n");
    const command = lines[lines.length - 1].trim();

    await executeCommand(command);

    setTimeout(() => {
      input.focus();
      moveCursorToEnd();
      keepInputVisible();
    }, 0);
  }
});

/* =========================
   COMANDOS
========================= */
async function executeCommand(command) {

  const cmd = command.toLowerCase();
  const loginCommands = ["acceder", "iniciar", "ingresar", "login", "entrar"];

  if (state === "idle" && loginCommands.includes(cmd)) {
    print("Ingrese usuario:", () => state = "askUser");
    return;
  }

  if (state === "askUser") {
    currentUser = cmd;
    print("Ingrese contraseña:", () => state = "askPassword");
    return;
  }

  if (state === "askPassword") {
    const email = `${currentUser}@terminal.app`;

    try {
      await signInWithEmailAndPassword(auth, email, command);
      print("Acceso concedido ✔", () => state = "authenticated");

    } catch {
      print("Usuario o contraseña incorrectos", () => {
        print("Ingrese usuario:", () => state = "askUser");
      });
    }
    return;
  }

  if (state !== "authenticated") {
    print("Debe iniciar sesión");
    return;
  }

  switch (cmd) {
    case "help":
      print("Comandos:\nhelp\nclear\nabout");
      break;

    case "clear":
      input.value = "";
      systemText = "";
      break;

    case "about":
      print("Terminal segura para Eytel 🙂");
      break;

    default:
      print(`Comando no reconocido: ${command}`);
  }
}

/* =========================
   VIEWPORT MÓVIL
========================= */
if (window.visualViewport) {
  visualViewport.addEventListener("resize", keepInputVisible);
}

/* =========================
   INICIO
========================= */
window.addEventListener("load", () => {
  input.value = "";
  systemText = "";
  typeWelcomeText(WELCOME_TEXT, enableTerminal);
});