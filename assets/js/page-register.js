import { auth, db } from "../firebase/conf.js";
import {
    createUserWithEmailAndPassword,
    updateProfile,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
    doc,
    setDoc,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const form = document.getElementById("registerForm");
const firstNameEl = document.getElementById("regFirstName");
const lastNameEl = document.getElementById("regLastName");
const emailEl = document.getElementById("regEmail");
const passwordEl = document.getElementById("regPassword");
const confirmPasswordEl = document.getElementById("regConfirmPassword");
const togglePasswordBtn = document.getElementById("toggleRegPassword");
const toggleConfirmPasswordBtn = document.getElementById("toggleRegConfirmPassword");
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

        const firstName = firstNameEl ? firstNameEl.value.trim() : "";
        const lastName = lastNameEl ? lastNameEl.value.trim() : "";
        const displayName = `${firstName} ${lastName}`.trim();
        const email = emailEl ? emailEl.value.trim() : "";
        const password = passwordEl ? passwordEl.value : "";
        const confirmPassword = confirmPasswordEl ? confirmPasswordEl.value : "";

        if (password !== confirmPassword) {
            showError("Password and Confirm Password do not match.");
            return;
        }

        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            if (displayName) {
                await updateProfile(cred.user, { displayName });
            }

            await setDoc(doc(db, "users", cred.user.uid), {
                userId: cred.user.uid,
                name: displayName,
                email,
                isAdmin: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            }, { merge: true });

            window.location.href = "account.html";
        } catch (err) {
            showError(err?.message || "Registration failed. Please try again.");
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

if (toggleConfirmPasswordBtn && confirmPasswordEl) {
    toggleConfirmPasswordBtn.addEventListener("click", () => {
        const isHidden = confirmPasswordEl.type === "password";
        confirmPasswordEl.type = isHidden ? "text" : "password";

        const icon = toggleConfirmPasswordBtn.querySelector("i");
        if (icon) icon.className = isHidden ? "uil uil-eye-slash" : "uil uil-eye";
        toggleConfirmPasswordBtn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    });
}
