import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Tu configuración de Firebase
const firebaseConfig = {
      apiKey: "AIzaSyDtcUBfzdSAmBrFg4hsxt_ITwY9DP7Siyc",
      authDomain: "chatly-1d1be.firebaseapp.com",
      databaseURL: "https://chatly-1d1be-default-rtdb.firebaseio.com",
      projectId: "chatly-1d1be",
      storageBucket: "chatly-1d1be.firebasestorage.app",
      messagingSenderId: "908535725784",
      appId: "1:908535725784:web:086bbf3c2d87e8c3a321ad",
      measurementId: "G-4FD5C2YCLY"
    };

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Elementos del DOM
const loginScreen = document.getElementById("login-screen");
const appScreen = document.getElementById("app-screen");
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const userAvatar = document.getElementById("user-avatar");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const messagesContainer = document.getElementById("messages-container");

let currentUser = null;

// --- Autenticación ---

// Iniciar Sesión con Google
btnLogin.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
  }
});

// Cerrar Sesión
btnLogout.addEventListener("click", () => signOut(auth));

// Escuchar cambios de estado de autenticación
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    userAvatar.src = user.photoURL || "https://ui-avatars.com/api/?name=" + user.displayName;
    loginScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");
    
    // Cargar mensajes en tiempo real
    loadMessages();
  } else {
    currentUser = null;
    loginScreen.classList.remove("hidden");
    appScreen.classList.add("hidden");
  }
});

// --- Base de Datos (Firestore) ---

// Enviar Mensaje
messageForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();

  if (!text || !currentUser) return;

  try {
    await addDoc(collection(db, "messages"), {
      text: text,
      createdAt: serverTimestamp(),
      uid: currentUser.uid,
      displayName: currentUser.displayName
    });
    messageInput.value = "";
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
  }
});

// Cargar Mensajes en Tiempo Real
function loadMessages() {
  const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));

  onSnapshot(q, (snapshot) => {
    messagesContainer.innerHTML = "";
    
    snapshot.forEach((doc) => {
      const msg = doc.data();
      const isSentByMe = msg.uid === currentUser.uid;

      // Crear elemento del mensaje
      const messageElement = document.createElement("div");
      messageElement.classList.add("message-bubble", isSentByMe ? "sent" : "received");

      // Formatear hora
      const timeStr = msg.createdAt 
        ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : "Ahora";

      messageElement.innerHTML = `
        ${!isSentByMe ? `<div class="message-sender">${msg.displayName || "Usuario"}</div>` : ""}
        <div class="message-text">${escapeHTML(msg.text)}</div>
        <span class="message-time">${timeStr}</span>
      `;

      messagesContainer.appendChild(messageElement);
    });

    // Auto-scroll al final
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
}

// Función auxiliar para seguridad de texto
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}