import { auth, db } from "../firebase/conf.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
    getDoc,
    setDoc,
    doc,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const adminUserEl = document.getElementById("adminUser");
const errorEl = document.getElementById("adminError");
const successEl = document.getElementById("adminSuccess");

const logoutBtn = document.getElementById("logoutBtn");

const hbForm = document.getElementById("homeBannerForm");
const hbLine1El = document.getElementById("hbLine1");
const hbLine2PrefixEl = document.getElementById("hbLine2Prefix");
const hbHighlightEl = document.getElementById("hbHighlight");
const hbLine3El = document.getElementById("hbLine3");
const hbTextEl = document.getElementById("hbText");
const hbCtaTextEl = document.getElementById("hbCtaText");
const hbCtaHrefEl = document.getElementById("hbCtaHref");
const hbSushiTitleEl = document.getElementById("hbSushiTitle");
const hbSushiTextEl = document.getElementById("hbSushiText");
const recipeVideoUrlEl = document.getElementById("recipeVideoUrl");
const hbReloadBtn = document.getElementById("hbReloadBtn");

const brandsForm = document.getElementById("brandsForm");
const brandsTitleInputEl = document.getElementById("brandsTitleInput");
const brandLogoUrlInputEl = document.getElementById("brandLogoUrlInput");
const brandAddLogoBtn = document.getElementById("brandAddLogoBtn");
const brandsBodyEl = document.getElementById("brandsBody");
const brandsReloadBtn = document.getElementById("brandsReloadBtn");

const homeBannerRef = doc(db, "siteSettings", "homeBanner");
const aboutVideoRef = doc(db, "siteSettings", "aboutVideo");
const brandsRef = doc(db, "siteSettings", "brands");

let brandsLogos = [];

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

function renderBrandsLogos() {
    if (!brandsBodyEl) return;

    if (!brandsLogos || brandsLogos.length === 0) {
        brandsBodyEl.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No brand logos yet.</td></tr>';
        return;
    }

    brandsBodyEl.innerHTML = brandsLogos.map((url, idx) => {
        const finalUrl = normalizeDriveImageUrl(url);
        const safeUrl = (url || "").replace(/"/g, "&quot;");
        const imgHtml = finalUrl
            ? `<img src="${finalUrl}" alt="" data-brand-img="1" style="max-height:40px; max-width:120px; object-fit:contain;">`
            : "";

        return `
            <tr>
                <td style="word-break:break-all;">${safeUrl}</td>
                <td>${imgHtml}</td>
                <td><button type="button" class="sec-btn" data-action="removeBrand" data-index="${idx}">Remove</button></td>
            </tr>
        `;
    }).join("");

    brandsBodyEl.querySelectorAll("img[data-brand-img]").forEach((img) => {
        img.addEventListener("error", () => {
            img.style.display = "none";
        });
    });
}

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

function showSuccess(message) {
    if (!successEl) return;
    successEl.textContent = message;
    successEl.classList.remove("d-none");
}

function clearSuccess() {
    if (!successEl) return;
    successEl.textContent = "";
    successEl.classList.add("d-none");
}

async function loadHomeBannerSettings() {
    try {
        const snap = await getDoc(homeBannerRef);
        const data = snap.exists() ? (snap.data() || {}) : {};

        if (hbLine1El) hbLine1El.value = typeof data.line1 === "string" ? data.line1 : "";
        if (hbLine2PrefixEl) hbLine2PrefixEl.value = typeof data.line2Prefix === "string" ? data.line2Prefix : "";
        if (hbHighlightEl) hbHighlightEl.value = typeof data.highlight === "string" ? data.highlight : "";
        if (hbLine3El) hbLine3El.value = typeof data.line3 === "string" ? data.line3 : "";
        if (hbTextEl) hbTextEl.value = typeof data.text === "string" ? data.text : "";
        if (hbCtaTextEl) hbCtaTextEl.value = typeof data.ctaText === "string" ? data.ctaText : "";
        if (hbCtaHrefEl) hbCtaHrefEl.value = typeof data.ctaHref === "string" ? data.ctaHref : "";
        if (hbSushiTitleEl) hbSushiTitleEl.value = typeof data.sushiTitle === "string" ? data.sushiTitle : "";
        if (hbSushiTextEl) hbSushiTextEl.value = typeof data.sushiText === "string" ? data.sushiText : "";
    } catch {
        // ignore
    }
}

async function loadRecipeVideoSettings() {
    try {
        const snap = await getDoc(aboutVideoRef);
        const data = snap.exists() ? (snap.data() || {}) : {};
        if (recipeVideoUrlEl) recipeVideoUrlEl.value = typeof data.recipeVideoUrl === "string" ? data.recipeVideoUrl : "";
    } catch {
        // ignore
    }
}

async function loadBrandsSettings() {
    try {
        const snap = await getDoc(brandsRef);
        const data = snap.exists() ? (snap.data() || {}) : {};
        if (brandsTitleInputEl) brandsTitleInputEl.value = typeof data.title === "string" ? data.title : "";
        brandsLogos = Array.isArray(data.logos) ? data.logos.filter((x) => typeof x === "string" && x.trim()) : [];
        renderBrandsLogos();
    } catch {
        // ignore
    }
}

if (hbForm) {
    hbForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearError();
        clearSuccess();

        const payload = {
            line1: hbLine1El ? hbLine1El.value : "",
            line2Prefix: hbLine2PrefixEl ? hbLine2PrefixEl.value : "",
            highlight: hbHighlightEl ? hbHighlightEl.value : "",
            line3: hbLine3El ? hbLine3El.value : "",
            text: hbTextEl ? hbTextEl.value : "",
            ctaText: hbCtaTextEl ? hbCtaTextEl.value : "",
            ctaHref: hbCtaHrefEl ? hbCtaHrefEl.value : "",
            sushiTitle: hbSushiTitleEl ? hbSushiTitleEl.value : "",
            sushiText: hbSushiTextEl ? hbSushiTextEl.value : "",
            updatedAt: Date.now(),
        };

        try {
            await setDoc(homeBannerRef, payload, { merge: true });
            await setDoc(aboutVideoRef, { recipeVideoUrl: recipeVideoUrlEl ? recipeVideoUrlEl.value : "", updatedAt: Date.now() }, { merge: true });
            showSuccess("Home banner updated.");
        } catch (err) {
            showError(err?.message || "Failed to save banner settings.");
        }
    });
}

if (brandsForm) {
    brandsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearError();
        clearSuccess();

        try {
            await setDoc(brandsRef, {
                title: brandsTitleInputEl ? brandsTitleInputEl.value : "",
                logos: brandsLogos,
                updatedAt: Date.now(),
            }, { merge: true });
            showSuccess("Brands updated.");
        } catch (err) {
            showError(err?.message || "Failed to save brands.");
        }
    });
}

if (brandAddLogoBtn) {
    brandAddLogoBtn.addEventListener("click", () => {
        clearError();
        clearSuccess();

        const url = brandLogoUrlInputEl ? brandLogoUrlInputEl.value.trim() : "";
        if (!url) return;
        brandsLogos = Array.isArray(brandsLogos) ? brandsLogos : [];
        brandsLogos.push(url);
        if (brandLogoUrlInputEl) brandLogoUrlInputEl.value = "";
        renderBrandsLogos();
    });
}

if (brandsBodyEl) {
    brandsBodyEl.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const action = btn.getAttribute("data-action");
        if (action !== "removeBrand") return;
        const idx = Number(btn.getAttribute("data-index"));
        if (!Number.isFinite(idx) || idx < 0 || idx >= brandsLogos.length) return;
        brandsLogos.splice(idx, 1);
        renderBrandsLogos();
    });
}

if (brandsReloadBtn) {
    brandsReloadBtn.addEventListener("click", async () => {
        clearError();
        clearSuccess();
        await loadBrandsSettings();
        showSuccess("Brands settings loaded.");
    });
}

if (hbReloadBtn) {
    hbReloadBtn.addEventListener("click", async () => {
        clearError();
        clearSuccess();
        await loadHomeBannerSettings();
        await loadRecipeVideoSettings();
        showSuccess("Banner settings loaded.");
    });
}

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

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    (async () => {
        try {
            const profileSnap = await getDoc(doc(db, "users", user.uid));
            const isAdmin = !!profileSnap.data()?.isAdmin;

            if (!isAdmin) {
                window.location.href = "account.html";
                return;
            }

            if (adminUserEl) adminUserEl.textContent = `Logged in as: ${user.email || ""}`;
            await loadHomeBannerSettings();
            await loadRecipeVideoSettings();
            await loadBrandsSettings();
        } catch {
            window.location.href = "account.html";
        }
    })();
});
