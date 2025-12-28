import { db } from "../firebase/conf.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

function normalizeRecipeVideoUrl(inputUrl) {
    const raw = (inputUrl || "").trim();
    if (!raw) return null;

    const driveFileMatch = raw.match(/drive\.google\.com\/file\/d\/([^/]+)\//i);
    if (driveFileMatch && driveFileMatch[1]) {
        return { url: `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`, type: "iframe" };
    }

    const driveOpenIdMatch = raw.match(/[?&]id=([^&]+)/i);
    if (raw.includes("drive.google.com") && driveOpenIdMatch && driveOpenIdMatch[1]) {
        return { url: `https://drive.google.com/file/d/${driveOpenIdMatch[1]}/preview`, type: "iframe" };
    }

    return { url: raw, type: "auto" };
}

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

async function applyHomeBannerSettings() {
    const line1El = document.getElementById("homeBannerLine1");
    const line2PrefixEl = document.getElementById("homeBannerLine2Prefix");
    const highlightEl = document.getElementById("homeBannerHighlight");
    const line3El = document.getElementById("homeBannerLine3");
    const textEl = document.getElementById("homeBannerText");
    const ctaEl = document.getElementById("homeBannerCta");
    const sushiTitleEl = document.getElementById("homeBannerSushiTitle");
    const sushiTextEl = document.getElementById("homeBannerSushiText");

    if (!line1El || !line2PrefixEl || !highlightEl || !line3El || !textEl || !ctaEl) return;

    try {
        const snap = await getDoc(doc(db, "siteSettings", "homeBanner"));
        if (!snap.exists()) return;

        const data = snap.data() || {};

        if (typeof data.line1 === "string" && data.line1.trim()) line1El.textContent = data.line1.trim();
        if (typeof data.line2Prefix === "string") line2PrefixEl.textContent = data.line2Prefix;
        if (typeof data.highlight === "string" && data.highlight.trim()) highlightEl.textContent = data.highlight.trim();
        if (typeof data.line3 === "string" && data.line3.trim()) line3El.textContent = data.line3.trim();

        if (typeof data.text === "string" && data.text.trim()) textEl.textContent = data.text.trim();

        if (typeof data.ctaText === "string" && data.ctaText.trim()) ctaEl.textContent = data.ctaText.trim();
        if (typeof data.ctaHref === "string" && data.ctaHref.trim()) ctaEl.setAttribute("href", data.ctaHref.trim());

        if (sushiTitleEl && typeof data.sushiTitle === "string" && data.sushiTitle.trim()) sushiTitleEl.textContent = data.sushiTitle.trim();
        if (sushiTextEl && typeof data.sushiText === "string" && data.sushiText.trim()) sushiTextEl.textContent = data.sushiText.trim();
    } catch {
        // ignore
    }
}

async function applyRecipeVideoSettings() {
    const linkEl = document.getElementById("recipeVideoLink");
    if (!linkEl) return;

    try {
        const snap = await getDoc(doc(db, "siteSettings", "aboutVideo"));
        if (!snap.exists()) return;

        const data = snap.data() || {};
        if (typeof data.recipeVideoUrl !== "string" || !data.recipeVideoUrl.trim()) return;

        const normalized = normalizeRecipeVideoUrl(data.recipeVideoUrl);
        if (!normalized) return;

        linkEl.setAttribute("href", normalized.url);
        if (normalized.type === "iframe") {
            linkEl.setAttribute("data-type", "iframe");
        } else {
            linkEl.removeAttribute("data-type");
        }
    } catch {
        // ignore
    }
}

async function applyBrandsSettings() {
    const titleEl = document.getElementById("brandsTitle");
    const rowEl = document.getElementById("brandsRow");
    if (!titleEl || !rowEl) return;

    try {
        const snap = await getDoc(doc(db, "siteSettings", "brands"));
        if (!snap.exists()) return;

        const data = snap.data() || {};
        if (typeof data.title === "string" && data.title.trim()) {
            titleEl.textContent = data.title.trim();
        }

        const logos = Array.isArray(data.logos) ? data.logos : [];
        if (!logos.length) return;

        rowEl.innerHTML = "";
        logos.forEach((url) => {
            const finalUrl = normalizeDriveImageUrl(url);
            if (!finalUrl) return;

            const box = document.createElement("div");
            box.className = "brands-box";

            const img = document.createElement("img");
            img.src = finalUrl;
            img.alt = "";
            img.addEventListener("error", () => {
                box.remove();
            });

            box.appendChild(img);
            rowEl.appendChild(box);
        });
    } catch {
        // ignore
    }
}

applyHomeBannerSettings();
applyRecipeVideoSettings();
applyBrandsSettings();
