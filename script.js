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
  }, TYPE_SPEED_TITLE);
}

/* =========================
   TERMINAL BASE
========================= */
function enableTerminal() {
  input.focus();
}

document.body.addEventListener("touchstart", () => {
  input.focus();
});

/* =========================
   IMPRESIÓN ANIMADA
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
  }, TYPE_SPEED_TERMINAL);
}

function print(text) {
  input.value += "\n";
  typeText(text + "\n");
}

function moveCursorToEnd() {
  input.selectionStart = input.selectionEnd = input.value.length;
}

/* =========================
   INPUT
========================= */
input.addEventListener("keydown", async (e) => {
  if (e.key === "Enter" && !isTyping) {
    e.preventDefault();

    const lines = input.value.split("\n");
    const command = lines[lines.length - 1].trim();

    await executeCommand(command);
  }
});

/* =========================
   COMANDOS
========================= */
async function executeCommand(command) {

  /* ---- LOGIN FLOW ---- */

  if (state === "idle" && command.toLowerCase() === "acceder") {
    print("Ingrese usuario:");
    state = "askUser";
    return;
  }

  if (state === "askUser") {
    currentUser = command.toLowerCase();
    print("Ingrese contraseña:");
    state = "askPassword";
    return;
  }

  if (state === "askPassword") {
    const email = `${currentUser}@terminal.app`;

    try {
      await signInWithEmailAndPassword(auth, email, command);
      print("Acceso concedido ✔");
      state = "authenticated";
    } catch {
      print("Acceso denegado ✖");
      state = "idle";
    }
    return;
  }

  /* ---- BLOQUEO SI NO ESTÁ LOGUEADO ---- */

  if (state !== "authenticated") {
    print("Debe iniciar sesión");
    return;
  }

  /* ---- COMANDOS NORMALES ---- */

  switch (command) {
    case "help":
      print(
        "Comandos disponibles:\n" +
        "help\n" +
        "clear\n" +
        "about"
      );
      break;

    case "clear":
      input.value = "";
      break;

    case "about":
      print("Terminal segura para Eytel 🙂");
      break;

    case "":
      break;

    default:
      print(`Comando no reconocido: ${command}`);
  }
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