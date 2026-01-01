import { auth, db } from "./conf.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const loginBtn = document.getElementById("headerLoginBtn");
const accountBtn = document.getElementById("headerAccountBtn");
const logoutBtn = document.getElementById("headerLogoutBtn");

function normalizeDriveImageUrl(inputUrl) {
    const raw = (inputUrl || "").trim();
    if (!raw) return null;

    const thumbIdMatch = raw.match(/drive\.google\.com\/thumbnail\?[^#]*[?&]id=([^&]+)/i);
    if (thumbIdMatch && thumbIdMatch[1]) {
        return `https://drive.google.com/thumbnail?id=${thumbIdMatch[1]}&sz=w1000`;
    }

    const driveFileMatch = raw.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
    if (driveFileMatch && driveFileMatch[1]) {
        return `https://drive.google.com/thumbnail?id=${driveFileMatch[1]}&sz=w1000`;
    }

    const driveOpenIdMatch = raw.match(/[?&]id=([^&]+)/i);
    if (raw.includes("drive.google.com") && driveOpenIdMatch && driveOpenIdMatch[1]) {
        return `https://drive.google.com/thumbnail?id=${driveOpenIdMatch[1]}&sz=w1000`;
    }

    const driveUcIdMatch = raw.match(/drive\.google\.com\/uc\?.*?[?&]id=([^&]+)/i);
    if (driveUcIdMatch && driveUcIdMatch[1]) {
        return `https://drive.google.com/thumbnail?id=${driveUcIdMatch[1]}&sz=w1000`;
    }

    const googleUserContentMatch = raw.match(/googleusercontent\.com\/(?:d\/)?([^/?#&]+)/i);
    if (googleUserContentMatch && googleUserContentMatch[1]) {
        return `https://drive.google.com/thumbnail?id=${googleUserContentMatch[1]}&sz=w1000`;
    }

    return raw;
}

function withVersion(url, version) {
    const u = (url || "").trim();
    if (!u) return "";
    if (!version) return u;
    const sep = u.includes("?") ? "&" : "?";
    return `${u}${sep}v=${encodeURIComponent(String(version))}`;
}

function applyBranding(branding) {
    const logoUrlRaw = branding && typeof branding.logoUrl === "string" ? branding.logoUrl.trim() : "";
    const faviconUrlRaw = branding && typeof branding.faviconUrl === "string" ? branding.faviconUrl.trim() : "";
    const updatedAt = branding && (typeof branding.updatedAt === "number" || typeof branding.updatedAt === "string")
        ? branding.updatedAt
        : "";

    const logoUrl = logoUrlRaw ? normalizeDriveImageUrl(logoUrlRaw) : "";
    const faviconUrl = faviconUrlRaw ? normalizeDriveImageUrl(faviconUrlRaw) : "";

    if (logoUrl) {
        const logoImgs = document.querySelectorAll(".header-logo img, .footer-logo img");
        logoImgs.forEach((img) => {
            try {
                img.setAttribute("src", withVersion(logoUrl, updatedAt));
            } catch {
            }
        });
    }

    if (faviconUrl) {
        let link = document.querySelector('link[rel="icon"]');
        if (!link) {
            link = document.createElement("link");
            link.setAttribute("rel", "icon");
            link.setAttribute("type", "image/png");
            document.head.appendChild(link);
        }
        try {
            link.setAttribute("href", withVersion(faviconUrl, updatedAt));
        } catch {
        }
    }
}

try {
    const brandingRef = doc(db, "siteSettings", "branding");
    onSnapshot(brandingRef, (snap) => {
        if (!snap.exists()) return;
        applyBranding(snap.data() || {});
    });
} catch {
}

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
