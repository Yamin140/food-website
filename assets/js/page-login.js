import { auth } from "../firebase/conf.js";
import {
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const form = document.getElementById("loginForm");
const emailEl = document.getElementById("loginEmail");
const passwordEl = document.getElementById("loginPassword");
const togglePasswordBtn = document.getElementById("toggleLoginPassword");
const rememberEl = form ? form.querySelector("input[name='remember']") : null;
const errorEl = document.getElementById("authError");

function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.remove("d-none");
}

function clearError() {
    if (!errorEl) return;
    errorEl.textContent = "";
    errorEl.classList.add("d-none");
}

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearError();

        const email = emailEl ? emailEl.value.trim() : "";
        const password = passwordEl ? passwordEl.value : "";

        try {
            const persistence = rememberEl && rememberEl.checked
                ? browserLocalPersistence
                : browserSessionPersistence;

            await setPersistence(auth, persistence);
            await signInWithEmailAndPassword(auth, email, password);

            window.location.href = "account.html";
        } catch (err) {
            showError(err?.message || "Login failed. Please try again.");
        }
    });
}

if (togglePasswordBtn && passwordEl) {
    togglePasswordBtn.addEventListener("click", () => {
        const isHidden = passwordEl.type === "password";
        passwordEl.type = isHidden ? "text" : "password";

        const icon = togglePasswordBtn.querySelector("i");
        if (icon) icon.className = isHidden ? "uil uil-eye-slash" : "uil uil-eye";
        togglePasswordBtn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    });
}
