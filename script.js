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

const WELCOME_TEXT = "Hola Eytel...";
const TYPE_SPEED = 30;

let isTyping = false;

/* =========================
   ESTADOS LOGIN
========================= */
let state = "idle"; 
// idle | askUser | askPassword | authenticated
let currentUser = "";

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
      if (callback) callback();
    }
  }, TYPE_SPEED);
}

/* =========================
   TERMINAL
========================= */
function enableTerminal() {
  input.focus();
}

document.body.addEventListener("touchstart", () => {
  input.focus();
});

input.addEventListener("keydown", async (e) => {
  if (e.key === "Enter" && !isTyping) {
    e.preventDefault();

    const lines = input.value.split("\n");
    const command = lines[lines.length - 1].trim();

    await executeCommand(command);
  }
});

/* =========================
   EJECUTAR COMANDO
========================= */
async function executeCommand(command) {

  /* ---- LOGIN FLOW ---- */

  if (state === "idle" && command.toLowerCase() === "acceder") {
    input.value += "\nIngrese usuario:\n";
    state = "askUser";
    return;
  }

  if (state === "askUser") {
    currentUser = command.toLowerCase();
    input.value += "\nIngrese contraseña:\n";
    state = "askPassword";
    return;
  }

  if (state === "askPassword") {
    const email = `${currentUser}@terminal.app`;

    try {
      await signInWithEmailAndPassword(auth, email, command);
      input.value += "\nAcceso concedido ✔\n";
      state = "authenticated";
    } catch {
      input.value += "\nAcceso denegado ✖\n";
      state = "idle";
    }
    return;
  }

  /* ---- COMANDOS NORMALES (POST LOGIN) ---- */

  if (state !== "authenticated") {
    input.value += "\nDebe iniciar sesión\n";
    return;
  }

  let response = "";

  switch (command) {
    case "help":
      response =
        "Comandos disponibles:\n" +
        "help\n" +
        "clear\n" +
        "about";
      break;

    case "clear":
      input.value = "";
      return;

    case "about":
      response = "Terminal segura para Eytel 🙂";
      break;

    case "":
      response = "";
      break;

    default:
      response = `Comando no reconocido: ${command}`;
  }

  input.value += "\n";
  typeText(response + "\n");
}

/* =========================
   ANIMACIÓN TIPEO
========================= */
function typeText(text) {
  isTyping = true;
  let i = 0;

  const interval = setInterval(() => {
    input.value += text.charAt(i);
    moveCursorToEnd();
    i++;

    if (i >= text.length) {
      clearInterval(interval);
      isTyping = false;
    }
  }, 25);
}

function moveCursorToEnd() {
  input.selectionStart = input.selectionEnd = input.value.length;
}

/* =========================
   INICIO
========================= */
window.addEventListener("load", () => {
  input.value = "";
  input.blur();

  typeWelcomeText(WELCOME_TEXT, () => {
    enableTerminal();
    
  });
});