const input = document.getElementById("realInput");
const welcome = document.getElementById("welcome");

const WELCOME_TEXT = "Hola Eytel...";
const TYPE_SPEED = 40;

let isTyping = false;

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

/* Foco inicial (después del título) */
function enableTerminal() {
  input.focus();
}

/* Mantener foco en móvil */
document.body.addEventListener("touchstart", () => {
  input.focus();
});

/* Capturar Enter */
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !isTyping) {
    e.preventDefault();

    const lines = input.value.split("\n");
    const command = lines[lines.length - 1].trim();

    executeCommand(command);
  }
});

/* Ejecutar comando */
function executeCommand(command) {
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
      response = "Terminal demo para Eytel 🙂";
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

/* Animación de tipeo terminal */
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

/* Mantener cursor al final */
function moveCursorToEnd() {
  input.selectionStart = input.selectionEnd = input.value.length;
}

/* =========================
   INICIO
========================= */
window.addEventListener("load", () => {
  input.value = "";
  input.blur(); // evita teclado antes de tiempo

  typeWelcomeText(WELCOME_TEXT, () => {
    enableTerminal();
  });
});