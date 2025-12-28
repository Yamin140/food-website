import { auth, db } from "../firebase/conf.js";
import {
    onAuthStateChanged,
    signOut,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const nameEl = document.getElementById("accName");
const emailEl = document.getElementById("accEmail");
const uidEl = document.getElementById("accUid");
const emailVerifiedEl = document.getElementById("accEmailVerified");
const createdAtEl = document.getElementById("accCreatedAt");
const lastLoginEl = document.getElementById("accLastLogin");
const isAdminEl = document.getElementById("accIsAdmin");
const adminPanelLink = document.getElementById("adminPanelLink");
const logoutBtn = document.getElementById("logoutBtn");
const errorEl = document.getElementById("authError");

function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.remove("d-none");
}

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    if (nameEl) nameEl.value = user.displayName || "";
    if (emailEl) emailEl.value = user.email || "";
    if (uidEl) uidEl.value = user.uid || "";
    if (emailVerifiedEl) emailVerifiedEl.value = user.emailVerified ? "Yes" : "No";
    if (createdAtEl) createdAtEl.value = user?.metadata?.creationTime || "";
    if (lastLoginEl) lastLoginEl.value = user?.metadata?.lastSignInTime || "";

    if (adminPanelLink) adminPanelLink.classList.add("d-none");
    if (isAdminEl) isAdminEl.value = "No";

    (async () => {
        try {
            const ref = doc(db, "users", user.uid);
            const snap = await getDoc(ref);

            if (!snap.exists()) {
                await setDoc(ref, {
                    name: user.displayName || "",
                    email: user.email || "",
                    isAdmin: false,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                }, { merge: true });
            }

            const data = (snap.exists() ? snap.data() : null) || {};
            const isAdmin = !!data.isAdmin;
            if (isAdminEl) isAdminEl.value = isAdmin ? "Yes" : "No";
            if (adminPanelLink) adminPanelLink.classList.toggle("d-none", !isAdmin);
        } catch {
            if (isAdminEl) isAdminEl.value = "No";
        }
    })();
});

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "login.html";
        } catch (err) {
            showError(err?.message || "Logout failed.");
        }
    });
}
