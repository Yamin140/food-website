import { auth, db } from "../firebase/conf.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
    addDoc,
    collection,
    deleteDoc,
    getDoc,
    getDocs,
    orderBy,
    query,
    setDoc,
    doc,
    updateDoc,
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
const hbReloadBtn = document.getElementById("hbReloadBtn");

const aboutForm = document.getElementById("aboutSectionForm");
const aboutSubTitleInputEl = document.getElementById("aboutSubTitleInput");
const aboutTitlePrefixInputEl = document.getElementById("aboutTitlePrefixInput");
const aboutTitleHighlightInputEl = document.getElementById("aboutTitleHighlightInput");
const aboutImageUrlInputEl = document.getElementById("aboutImageUrlInput");
const aboutTextInputEl = document.getElementById("aboutTextInput");
const aboutVideoUrlInputEl = document.getElementById("aboutVideoUrlInput");
const aboutReloadBtn = document.getElementById("aboutReloadBtn");

const brandsForm = document.getElementById("brandsForm");
const brandsTitleInputEl = document.getElementById("brandsTitleInput");
const brandLogoUrlInputEl = document.getElementById("brandLogoUrlInput");
const brandAddLogoBtn = document.getElementById("brandAddLogoBtn");
const brandsBodyEl = document.getElementById("brandsBody");
const brandsReloadBtn = document.getElementById("brandsReloadBtn");

const menuCategoryForm = document.getElementById("menuCategoryForm");
const menuCategoryIdEl = document.getElementById("menuCategoryId");
const menuCategoryNameEl = document.getElementById("menuCategoryName");
const menuCategoryImageUrlEl = document.getElementById("menuCategoryImageUrl");
const menuCategoryActiveEl = document.getElementById("menuCategoryActive");
const menuCategoryResetBtn = document.getElementById("menuCategoryResetBtn");
const menuCategoryReloadBtn = document.getElementById("menuCategoryReloadBtn");
const menuCategoriesBodyEl = document.getElementById("menuCategoriesBody");

const menuItemForm = document.getElementById("menuItemForm");
const menuItemIdEl = document.getElementById("menuItemId");
const menuItemTitleEl = document.getElementById("menuItemTitle");
const menuItemPriceEl = document.getElementById("menuItemPrice");
const menuItemRatingEl = document.getElementById("menuItemRating");
const menuItemCaloriesEl = document.getElementById("menuItemCalories");
const menuItemTypeEl = document.getElementById("menuItemType");
const menuItemPersonsEl = document.getElementById("menuItemPersons");
const menuItemImageUrlEl = document.getElementById("menuItemImageUrl");
const menuItemCategoriesEl = document.getElementById("menuItemCategories");
const menuItemDescriptionEl = document.getElementById("menuItemDescription");
const menuItemActiveEl = document.getElementById("menuItemActive");
const menuItemResetBtn = document.getElementById("menuItemResetBtn");
const menuItemReloadBtn = document.getElementById("menuItemReloadBtn");
const menuItemsBodyEl = document.getElementById("menuItemsBody");

const homeBannerRef = doc(db, "siteSettings", "homeBanner");
const aboutSectionRef = doc(db, "siteSettings", "aboutSection");
const aboutVideoRef = doc(db, "siteSettings", "aboutVideo");
const brandsRef = doc(db, "siteSettings", "brands");

const menuCategoriesCol = collection(db, "menuCategories");
const menuItemsCol = collection(db, "menuItems");

let brandsLogos = [];
let menuCategories = [];
let menuItems = [];

function slugify(input) {
    return (input || "")
        .toString()
        .trim()
        .toLowerCase()
        .replace(/['"`]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
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

async function loadAboutSectionSettings() {
    try {
        const snap = await getDoc(aboutSectionRef);
        const data = snap.exists() ? (snap.data() || {}) : {};

        if (aboutSubTitleInputEl) aboutSubTitleInputEl.value = typeof data.subTitle === "string" ? data.subTitle : "";
        if (aboutTitlePrefixInputEl) aboutTitlePrefixInputEl.value = typeof data.titlePrefix === "string" ? data.titlePrefix : "";
        if (aboutTitleHighlightInputEl) aboutTitleHighlightInputEl.value = typeof data.titleHighlight === "string" ? data.titleHighlight : "";
        if (aboutTextInputEl) aboutTextInputEl.value = typeof data.text === "string" ? data.text : "";
        if (aboutImageUrlInputEl) aboutImageUrlInputEl.value = typeof data.imageUrl === "string" ? data.imageUrl : "";
        if (aboutVideoUrlInputEl) aboutVideoUrlInputEl.value = typeof data.videoUrl === "string" ? data.videoUrl : "";

        if (aboutVideoUrlInputEl && !aboutVideoUrlInputEl.value.trim()) {
            try {
                const legacySnap = await getDoc(aboutVideoRef);
                const legacyData = legacySnap.exists() ? (legacySnap.data() || {}) : {};
                if (typeof legacyData.recipeVideoUrl === "string" && legacyData.recipeVideoUrl.trim()) {
                    aboutVideoUrlInputEl.value = legacyData.recipeVideoUrl;
                }
            } catch {
                // ignore
            }
        }
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

function resetMenuCategoryForm() {
    if (menuCategoryIdEl) menuCategoryIdEl.value = "";
    if (menuCategoryNameEl) menuCategoryNameEl.value = "";
    if (menuCategoryImageUrlEl) menuCategoryImageUrlEl.value = "";
    if (menuCategoryActiveEl) menuCategoryActiveEl.value = "true";
}

function renderMenuCategories() {
    if (!menuCategoriesBodyEl) return;

    if (!Array.isArray(menuCategories) || menuCategories.length === 0) {
        menuCategoriesBodyEl.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No categories yet.</td></tr>';
        return;
    }

    menuCategoriesBodyEl.innerHTML = menuCategories.map((c, idx) => {
        const safeName = (c.name || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const activeText = c.active ? "Yes" : "No";

        return `
            <tr>
                <td>${idx + 1}</td>
                <td style="word-break:break-word;">${safeName}</td>
                <td>${activeText}</td>
                <td>
                    <div class="d-flex" style="gap:8px; flex-wrap:wrap;">
                        <button type="button" class="sec-btn" data-action="catUp" data-id="${c.id}" ${idx === 0 ? "disabled" : ""}>Up</button>
                        <button type="button" class="sec-btn" data-action="catDown" data-id="${c.id}" ${idx === menuCategories.length - 1 ? "disabled" : ""}>Down</button>
                        <button type="button" class="sec-btn" data-action="catEdit" data-id="${c.id}">Edit</button>
                        <button type="button" class="sec-btn" data-action="catDelete" data-id="${c.id}">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function renderMenuItemCategoryOptions(selectedSlugs = []) {
    if (!menuItemCategoriesEl) return;

    const activeCategories = Array.isArray(menuCategories)
        ? menuCategories.filter((c) => c && c.active && typeof c.slug === "string" && c.slug.trim())
        : [];

    if (activeCategories.length === 0) {
        menuItemCategoriesEl.innerHTML = '<span class="text-muted">No categories yet.</span>';
        return;
    }

    const selectedSet = new Set(Array.isArray(selectedSlugs) ? selectedSlugs : []);

    menuItemCategoriesEl.innerHTML = activeCategories.map((c) => {
        const id = `cat_${c.id}`;
        const checked = selectedSet.has(c.slug) ? "checked" : "";
        const safeName = (c.name || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `
            <label for="${id}" style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" id="${id}" data-cat-slug="${c.slug}" ${checked}>
                <span>${safeName}</span>
            </label>
        `;
    }).join("");
}

function getSelectedMenuItemCategorySlugs() {
    if (!menuItemCategoriesEl) return [];
    const inputs = Array.from(menuItemCategoriesEl.querySelectorAll('input[type="checkbox"][data-cat-slug]'));
    return inputs
        .filter((i) => i.checked)
        .map((i) => i.getAttribute("data-cat-slug"))
        .filter((x) => typeof x === "string" && x.trim());
}

async function loadMenuCategories() {
    try {
        const q = query(menuCategoriesCol, orderBy("order", "asc"));
        const snap = await getDocs(q);
        menuCategories = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        renderMenuCategories();
        renderMenuItemCategoryOptions(getSelectedMenuItemCategorySlugs());
    } catch (err) {
        showError(err?.message || "Failed to load menu categories.");
    }
}

function resetMenuItemForm() {
    if (menuItemIdEl) menuItemIdEl.value = "";
    if (menuItemTitleEl) menuItemTitleEl.value = "";
    if (menuItemPriceEl) menuItemPriceEl.value = "";
    if (menuItemRatingEl) menuItemRatingEl.value = "";
    if (menuItemCaloriesEl) menuItemCaloriesEl.value = "";
    if (menuItemTypeEl) menuItemTypeEl.value = "";
    if (menuItemPersonsEl) menuItemPersonsEl.value = "";
    if (menuItemImageUrlEl) menuItemImageUrlEl.value = "";
    if (menuItemDescriptionEl) menuItemDescriptionEl.value = "";
    if (menuItemActiveEl) menuItemActiveEl.value = "true";
    renderMenuItemCategoryOptions([]);
}

function renderMenuItems() {
    if (!menuItemsBodyEl) return;

    if (!Array.isArray(menuItems) || menuItems.length === 0) {
        menuItemsBodyEl.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No menu items yet.</td></tr>';
        return;
    }

    menuItemsBodyEl.innerHTML = menuItems.map((it) => {
        const safeTitle = (it.title || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const price = Number.isFinite(it.price) ? it.price : (typeof it.price === "string" ? it.price : "");
        const activeText = it.active ? "Yes" : "No";

        return `
            <tr>
                <td style="word-break:break-word;">${safeTitle}</td>
                <td>${price}</td>
                <td>${activeText}</td>
                <td>
                    <div class="d-flex" style="gap:8px; flex-wrap:wrap;">
                        <button type="button" class="sec-btn" data-action="itemEdit" data-id="${it.id}">Edit</button>
                        <button type="button" class="sec-btn" data-action="itemDelete" data-id="${it.id}">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

async function loadMenuItems() {
    try {
        const q = query(menuItemsCol, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        menuItems = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        renderMenuItems();
    } catch (err) {
        showError(err?.message || "Failed to load menu items.");
    }
}

async function saveMenuItem() {
    const id = menuItemIdEl ? menuItemIdEl.value.trim() : "";
    const title = menuItemTitleEl ? menuItemTitleEl.value.trim() : "";
    const imageUrl = menuItemImageUrlEl ? menuItemImageUrlEl.value.trim() : "";
    const categories = getSelectedMenuItemCategorySlugs();
    const active = menuItemActiveEl ? menuItemActiveEl.value === "true" : true;

    const priceRaw = menuItemPriceEl ? menuItemPriceEl.value : "";
    const price = priceRaw === "" ? null : Number(priceRaw);
    const ratingRaw = menuItemRatingEl ? menuItemRatingEl.value : "";
    const rating = ratingRaw === "" ? null : Number(ratingRaw);
    const personsRaw = menuItemPersonsEl ? menuItemPersonsEl.value : "";
    const persons = personsRaw === "" ? null : Number(personsRaw);

    const calories = menuItemCaloriesEl ? menuItemCaloriesEl.value.trim() : "";
    const type = menuItemTypeEl ? menuItemTypeEl.value : "";
    const description = menuItemDescriptionEl ? menuItemDescriptionEl.value.trim() : "";

    if (!title) {
        showError("Item title is required.");
        return;
    }

    if (price === null || Number.isNaN(price)) {
        showError("Valid price is required.");
        return;
    }

    if (!imageUrl) {
        showError("Image URL is required.");
        return;
    }

    if (!categories.length) {
        showError("Select at least one category.");
        return;
    }

    const payload = {
        title,
        price,
        imageUrl,
        categories,
        rating: rating === null || Number.isNaN(rating) ? null : rating,
        calories,
        type,
        persons: persons === null || Number.isNaN(persons) ? null : persons,
        description,
        active,
        updatedAt: Date.now(),
    };

    if (id) {
        await updateDoc(doc(db, "menuItems", id), payload);
        showSuccess("Item updated.");
        return;
    }

    await addDoc(menuItemsCol, {
        ...payload,
        createdAt: Date.now(),
    });
    showSuccess("Item added.");
}

async function deleteMenuItemById(id) {
    await deleteDoc(doc(db, "menuItems", id));
    showSuccess("Item deleted.");
}

async function saveMenuCategory() {
    const name = menuCategoryNameEl ? menuCategoryNameEl.value.trim() : "";
    const imageUrl = menuCategoryImageUrlEl ? menuCategoryImageUrlEl.value.trim() : "";
    const active = menuCategoryActiveEl ? menuCategoryActiveEl.value === "true" : true;
    const id = menuCategoryIdEl ? menuCategoryIdEl.value.trim() : "";

    if (!name) {
        showError("Category name is required.");
        return;
    }

    if (id) {
        await updateDoc(doc(db, "menuCategories", id), {
            name,
            imageUrl: imageUrl || "",
            active,
            updatedAt: Date.now(),
        });
        showSuccess("Category updated.");
        return;
    }

    const maxOrder = menuCategories.reduce((m, c) => Math.max(m, Number.isFinite(c.order) ? c.order : 0), 0);
    const slug = slugify(name) || `cat-${Date.now()}`;

    await addDoc(menuCategoriesCol, {
        name,
        slug,
        imageUrl: imageUrl || "",
        active,
        order: maxOrder + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });
    showSuccess("Category added.");
}

async function deleteMenuCategoryById(id) {
    await deleteDoc(doc(db, "menuCategories", id));
    showSuccess("Category deleted.");
}

async function moveMenuCategory(id, dir) {
    const idx = menuCategories.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= menuCategories.length) return;

    const a = menuCategories[idx];
    const b = menuCategories[swapIdx];

    const aOrder = Number.isFinite(a.order) ? a.order : idx + 1;
    const bOrder = Number.isFinite(b.order) ? b.order : swapIdx + 1;

    await Promise.all([
        updateDoc(doc(db, "menuCategories", a.id), { order: bOrder, updatedAt: Date.now() }),
        updateDoc(doc(db, "menuCategories", b.id), { order: aOrder, updatedAt: Date.now() }),
    ]);
    showSuccess("Category order updated.");
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
            showSuccess("Home banner updated.");
        } catch (err) {
            showError(err?.message || "Failed to save banner settings.");
        }
    });
}

if (aboutForm) {
    aboutForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearError();
        clearSuccess();

        const payload = {
            subTitle: aboutSubTitleInputEl ? aboutSubTitleInputEl.value : "",
            titlePrefix: aboutTitlePrefixInputEl ? aboutTitlePrefixInputEl.value : "",
            titleHighlight: aboutTitleHighlightInputEl ? aboutTitleHighlightInputEl.value : "",
            text: aboutTextInputEl ? aboutTextInputEl.value : "",
            imageUrl: aboutImageUrlInputEl ? aboutImageUrlInputEl.value : "",
            videoUrl: aboutVideoUrlInputEl ? aboutVideoUrlInputEl.value : "",
            updatedAt: Date.now(),
        };

        try {
            await setDoc(aboutSectionRef, payload, { merge: true });
            showSuccess("About section updated.");
        } catch (err) {
            showError(err?.message || "Failed to save About section.");
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

if (menuCategoryForm) {
    menuCategoryForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearError();
        clearSuccess();

        try {
            await saveMenuCategory();
            resetMenuCategoryForm();
            await loadMenuCategories();
        } catch (err) {
            showError(err?.message || "Failed to save category.");
        }
    });
}

if (menuCategoryResetBtn) {
    menuCategoryResetBtn.addEventListener("click", () => {
        clearError();
        clearSuccess();
        resetMenuCategoryForm();
    });
}

if (menuCategoryReloadBtn) {
    menuCategoryReloadBtn.addEventListener("click", async () => {
        clearError();
        clearSuccess();
        await loadMenuCategories();
        showSuccess("Categories loaded.");
    });
}

if (menuItemForm) {
    menuItemForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearError();
        clearSuccess();

        try {
            await saveMenuItem();
            resetMenuItemForm();
            await loadMenuItems();
        } catch (err) {
            showError(err?.message || "Failed to save item.");
        }
    });
}

if (menuItemResetBtn) {
    menuItemResetBtn.addEventListener("click", () => {
        clearError();
        clearSuccess();
        resetMenuItemForm();
    });
}

if (menuItemReloadBtn) {
    menuItemReloadBtn.addEventListener("click", async () => {
        clearError();
        clearSuccess();
        await loadMenuItems();
        showSuccess("Items loaded.");
    });
}

if (menuItemsBodyEl) {
    menuItemsBodyEl.addEventListener("click", async (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const action = btn.getAttribute("data-action");
        const id = btn.getAttribute("data-id");
        if (!action || !id) return;

        clearError();
        clearSuccess();

        try {
            if (action === "itemEdit") {
                const it = menuItems.find((x) => x.id === id);
                if (!it) return;

                if (menuItemIdEl) menuItemIdEl.value = it.id;
                if (menuItemTitleEl) menuItemTitleEl.value = it.title || "";
                if (menuItemPriceEl) menuItemPriceEl.value = Number.isFinite(it.price) ? String(it.price) : (it.price || "");
                if (menuItemRatingEl) menuItemRatingEl.value = Number.isFinite(it.rating) ? String(it.rating) : (it.rating || "");
                if (menuItemCaloriesEl) menuItemCaloriesEl.value = it.calories || "";
                if (menuItemTypeEl) menuItemTypeEl.value = it.type || "";
                if (menuItemPersonsEl) menuItemPersonsEl.value = Number.isFinite(it.persons) ? String(it.persons) : (it.persons || "");
                if (menuItemImageUrlEl) menuItemImageUrlEl.value = it.imageUrl || "";
                if (menuItemDescriptionEl) menuItemDescriptionEl.value = it.description || "";
                if (menuItemActiveEl) menuItemActiveEl.value = it.active ? "true" : "false";
                renderMenuItemCategoryOptions(Array.isArray(it.categories) ? it.categories : []);
                return;
            }

            if (action === "itemDelete") {
                await deleteMenuItemById(id);
                resetMenuItemForm();
                await loadMenuItems();
            }
        } catch (err) {
            showError(err?.message || "Item action failed.");
        }
    });
}

if (menuCategoriesBodyEl) {
    menuCategoriesBodyEl.addEventListener("click", async (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const action = btn.getAttribute("data-action");
        const id = btn.getAttribute("data-id");
        if (!action || !id) return;

        clearError();
        clearSuccess();

        try {
            if (action === "catEdit") {
                const c = menuCategories.find((x) => x.id === id);
                if (!c) return;
                if (menuCategoryIdEl) menuCategoryIdEl.value = c.id;
                if (menuCategoryNameEl) menuCategoryNameEl.value = c.name || "";
                if (menuCategoryImageUrlEl) menuCategoryImageUrlEl.value = c.imageUrl || "";
                if (menuCategoryActiveEl) menuCategoryActiveEl.value = c.active ? "true" : "false";
                return;
            }

            if (action === "catDelete") {
                await deleteMenuCategoryById(id);
                resetMenuCategoryForm();
                await loadMenuCategories();
                return;
            }

            if (action === "catUp") {
                await moveMenuCategory(id, "up");
                await loadMenuCategories();
                return;
            }

            if (action === "catDown") {
                await moveMenuCategory(id, "down");
                await loadMenuCategories();
            }
        } catch (err) {
            showError(err?.message || "Category action failed.");
        }
    });
}

if (hbReloadBtn) {
    hbReloadBtn.addEventListener("click", async () => {
        clearError();
        clearSuccess();
        await loadHomeBannerSettings();
        showSuccess("Banner settings loaded.");
    });
}

if (aboutReloadBtn) {
    aboutReloadBtn.addEventListener("click", async () => {
        clearError();
        clearSuccess();
        await loadAboutSectionSettings();
        showSuccess("About settings loaded.");
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
            await loadAboutSectionSettings();
            await loadBrandsSettings();
            await loadMenuCategories();
            await loadMenuItems();
        } catch {
            window.location.href = "account.html";
        }
    })();
});
