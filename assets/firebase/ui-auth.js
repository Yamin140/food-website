import { auth } from "./conf.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const loginBtn = document.getElementById("headerLoginBtn");
const accountBtn = document.getElementById("headerAccountBtn");
const logoutBtn = document.getElementById("headerLogoutBtn");

function setVisible(el, visible) {
    if (!el) return;
    el.classList.toggle("d-none", !visible);
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        setVisible(loginBtn, false);
        setVisible(accountBtn, true);
        setVisible(logoutBtn, true);
    } else {
        setVisible(loginBtn, true);
        setVisible(accountBtn, false);
        setVisible(logoutBtn, false);
    }
});

if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            window.location.href = "index.html";
        } catch {
            window.location.href = "index.html";
        }
    });
}
