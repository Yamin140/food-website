import { auth, db } from "../firebase/conf.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    writeBatch,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

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

function escapeHtml(input) {
    return String(input || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

let cartUser = null;
let cartItems = [];
let cartUnsub = null;

let userProfileCache = null;

async function ensureUserProfileDoc(user) {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) return;

    await setDoc(ref, {
        userId: user.uid,
        name: user.displayName || "",
        email: user.email || "",
        phone: "",
        address: "",
        note: "",
        isAdmin: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

async function loadUserProfile(uid) {
    if (!uid) return null;
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    return snap.data() || null;
}

function autofillCheckoutFromProfile(profile) {
    if (!profile) return;
    if (checkoutNameEl) checkoutNameEl.value = (profile.name || "").toString();
    if (checkoutPhoneEl) checkoutPhoneEl.value = (profile.phone || "").toString();
    if (checkoutAddressEl) checkoutAddressEl.value = (profile.address || "").toString();
    if (checkoutNoteEl) checkoutNoteEl.value = (profile.note || "").toString();
}

let authReadyResolved = false;
let resolveAuthReady = null;
const authReady = new Promise((resolve) => {
    resolveAuthReady = resolve;
});

const headerCartBtn = document.getElementById("headerCartBtn");
const headerCartCountEl = document.getElementById("headerCartCount");

const cartOverlayEl = document.getElementById("cartOverlay");
const cartDrawerEl = document.getElementById("cartDrawer");
const cartDrawerCloseEl = document.getElementById("cartDrawerClose");
const cartItemsListEl = document.getElementById("cartItemsList");
const cartEmptyStateEl = document.getElementById("cartEmptyState");
const cartTotalEl = document.getElementById("cartTotal");
const cartClearBtn = document.getElementById("cartClearBtn");
const cartCheckoutBtn = document.getElementById("cartCheckoutBtn");

const checkoutForm = document.getElementById("checkoutForm");
const checkoutNameEl = document.getElementById("checkoutName");
const checkoutPhoneEl = document.getElementById("checkoutPhone");
const checkoutAddressEl = document.getElementById("checkoutAddress");
const checkoutNoteEl = document.getElementById("checkoutNote");
const checkoutConfirmBtn = document.getElementById("checkoutConfirmBtn");

function parsePrice(input) {
    const n = typeof input === "number" ? input : Number(String(input || "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
}

function getCartQtyTotal() {
    return cartItems.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
}

function getCartTotal() {
    return cartItems.reduce((sum, it) => sum + parsePrice(it.price) * (Number(it.qty) || 0), 0);
}

function setCartCount(n) {
    if (!headerCartCountEl) return;
    headerCartCountEl.textContent = String(Math.max(0, n || 0));
}

function openCartDrawer() {
    document.body.classList.add("cart-open");
    if (cartOverlayEl) cartOverlayEl.setAttribute("aria-hidden", "false");
    if (cartDrawerEl) cartDrawerEl.setAttribute("aria-hidden", "false");
}

function closeCartDrawer() {
    document.body.classList.remove("cart-open");
    if (cartOverlayEl) cartOverlayEl.setAttribute("aria-hidden", "true");
    if (cartDrawerEl) cartDrawerEl.setAttribute("aria-hidden", "true");
}

function showModalById(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (window.bootstrap && window.bootstrap.Modal) {
        if (typeof window.bootstrap.Modal.getOrCreateInstance === "function") {
            window.bootstrap.Modal.getOrCreateInstance(el).show();
        } else {
            new window.bootstrap.Modal(el).show();
        }
        return;
    }
    if (window.jQuery && window.jQuery.fn && typeof window.jQuery.fn.modal === "function") {
        window.jQuery(el).modal("show");
    }
}

function hideModalById(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (window.bootstrap && window.bootstrap.Modal) {
        try {
            if (typeof window.bootstrap.Modal.getInstance === "function") {
                const inst = window.bootstrap.Modal.getInstance(el);
                if (inst && typeof inst.hide === "function") {
                    inst.hide();
                    return;
                }
            }
            const instLegacy = new window.bootstrap.Modal(el);
            if (instLegacy && typeof instLegacy.hide === "function") {
                instLegacy.hide();
                return;
            }
        } catch {
            // ignore
        }
    }
    if (window.jQuery && window.jQuery.fn && typeof window.jQuery.fn.modal === "function") {
        window.jQuery(el).modal("hide");
    }
}

function renderCart() {
    setCartCount(getCartQtyTotal());

    if (!cartItemsListEl || !cartTotalEl || !cartEmptyStateEl) return;

    const total = getCartTotal();
    cartTotalEl.textContent = String(total);

    if (!cartItems.length) {
        cartItemsListEl.innerHTML = "";
        cartEmptyStateEl.style.display = "block";
        return;
    }

    cartEmptyStateEl.style.display = "none";

    cartItemsListEl.innerHTML = cartItems.map((it) => {
        const title = escapeHtml(it.title || "");
        const price = parsePrice(it.price);
        const qty = Number(it.qty) || 0;
        const img = typeof it.imageUrl === "string" ? it.imageUrl : "";
        const imgHtml = img ? `<img src="${escapeHtml(img)}" alt="">` : "";

        return `
            <div class="cart-item" data-id="${escapeHtml(it.id || it.itemId || "")}">
                <div class="cart-item-img">${imgHtml}</div>
                <div class="cart-item-info">
                    <p class="cart-item-title">${title}</p>
                    <div class="cart-item-meta">
                        <span class="cart-item-price">Tk. ${escapeHtml(price)}</span>
                        <div class="cart-qty">
                            <button type="button" class="cart-qty-btn" data-action="dec">-</button>
                            <span class="cart-qty-value">${escapeHtml(qty)}</span>
                            <button type="button" class="cart-qty-btn" data-action="inc">+</button>
                        </div>
                    </div>
                </div>
                <button type="button" class="cart-item-remove" data-action="remove">×</button>
            </div>
        `;
    }).join("");
}

function listenCart(uid) {
    if (cartUnsub) {
        try { cartUnsub(); } catch { /* ignore */ }
        cartUnsub = null;
    }

    cartItems = [];
    renderCart();

    const col = collection(db, "carts", uid, "items");
    const q = query(col, orderBy("createdAt", "desc"));
    cartUnsub = onSnapshot(q, (snap) => {
        cartItems = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        renderCart();
    });
}

async function addToCartByItem(item) {
    await authReady;
    if (!cartUser) {
        window.alert("Please login first to add items to cart.");
        window.location.href = "login.html";
        return;
    }

    const id = item && item.id ? String(item.id) : "";
    if (!id) return;

    const docRef = doc(db, "carts", cartUser.uid, "items", id);
    const snap = await getDoc(docRef);
    const prevQty = snap.exists() ? (Number(snap.data()?.qty) || 0) : 0;
    const nextQty = prevQty + 1;

    const imageUrl = typeof item.imageUrl === "string" ? normalizeDriveImageUrl(item.imageUrl) : "";
    const title = typeof item.title === "string" ? item.title : "";
    const price = parsePrice(item.price);

    if (snap.exists()) {
        await updateDoc(docRef, { qty: nextQty, updatedAt: Date.now() });
    } else {
        await setDoc(docRef, {
            itemId: id,
            title,
            price,
            imageUrl: imageUrl || "",
            qty: nextQty,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    }

    openCartDrawer();
}

async function updateCartQty(itemId, delta) {
    if (!cartUser) return;
    const id = String(itemId || "");
    if (!id) return;
    const docRef = doc(db, "carts", cartUser.uid, "items", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;
    const current = Number(snap.data()?.qty) || 0;
    const next = current + (Number(delta) || 0);
    if (next <= 0) {
        await deleteDoc(docRef);
        return;
    }
    await updateDoc(docRef, { qty: next, updatedAt: Date.now() });
}

async function removeCartItem(itemId) {
    if (!cartUser) return;
    const id = String(itemId || "");
    if (!id) return;
    await deleteDoc(doc(db, "carts", cartUser.uid, "items", id));
}

async function clearCart() {
    if (!cartUser) return;
    const col = collection(db, "carts", cartUser.uid, "items");
    const snap = await getDocs(col);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
}

async function submitOrder(payload) {
    if (!cartUser) {
        window.location.href = "login.html";
        return;
    }

    const items = cartItems.map((it) => ({
        itemId: it.itemId || it.id,
        title: it.title || "",
        price: parsePrice(it.price),
        qty: Number(it.qty) || 0,
        imageUrl: it.imageUrl || "",
    })).filter((x) => x.itemId && x.qty > 0);

    if (!items.length) return;

    const total = items.reduce((sum, it) => sum + parsePrice(it.price) * (Number(it.qty) || 0), 0);

    await addDoc(collection(db, "orders"), {
        userId: cartUser.uid,
        userEmail: cartUser.email || "",
        name: payload.name,
        phone: payload.phone,
        address: payload.address,
        note: payload.note || "",
        items,
        total,
        status: "pending",
        cancelReason: "",
        cancelledAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });

    try {
        await ensureUserProfileDoc(cartUser);
        await setDoc(doc(db, "users", cartUser.uid), {
            userId: cartUser.uid,
            name: payload.name,
            email: cartUser.email || "",
            phone: payload.phone,
            address: payload.address,
            note: payload.note || "",
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } catch {
        // ignore
    }

    await clearCart();
}

function setupCartSystem() {
    if (document.body && document.body.dataset && document.body.dataset.cartSystemBound === "1") return;
    if (document.body && document.body.dataset) document.body.dataset.cartSystemBound = "1";

    if (headerCartBtn) {
        headerCartBtn.addEventListener("click", (e) => {
            e.preventDefault();
            openCartDrawer();
        });
    }

    if (cartDrawerCloseEl) {
        cartDrawerCloseEl.addEventListener("click", () => closeCartDrawer());
    }

    if (cartOverlayEl) {
        cartOverlayEl.addEventListener("click", () => closeCartDrawer());
    }

    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeCartDrawer();
        }
    });

    if (cartItemsListEl) {
        cartItemsListEl.addEventListener("click", async (e) => {
            const itemEl = e.target.closest(".cart-item");
            if (!itemEl) return;
            const id = itemEl.getAttribute("data-id") || "";
            const actionBtn = e.target.closest("[data-action]");
            const action = actionBtn ? (actionBtn.getAttribute("data-action") || "") : "";
            if (!id || !action) return;
            try {
                if (action === "inc") await updateCartQty(id, 1);
                if (action === "dec") await updateCartQty(id, -1);
                if (action === "remove") await removeCartItem(id);
            } catch {
                // ignore
            }
        });
    }

    if (cartClearBtn) {
        cartClearBtn.addEventListener("click", async () => {
            try {
                await clearCart();
            } catch {
                // ignore
            }
        });
    }

    if (cartCheckoutBtn) {
        cartCheckoutBtn.addEventListener("click", async () => {
            if (!cartUser) {
                window.location.href = "login.html";
                return;
            }
            try {
                await ensureUserProfileDoc(cartUser);
                userProfileCache = await loadUserProfile(cartUser.uid);
                autofillCheckoutFromProfile(userProfileCache);
            } catch {
                // ignore
            }
            showModalById("checkoutModal");
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!cartUser) {
                window.location.href = "login.html";
                return;
            }

            const name = (checkoutNameEl ? checkoutNameEl.value : "").toString().trim();
            const phone = (checkoutPhoneEl ? checkoutPhoneEl.value : "").toString().trim();
            const address = (checkoutAddressEl ? checkoutAddressEl.value : "").toString().trim();
            const note = (checkoutNoteEl ? checkoutNoteEl.value : "").toString().trim();

            if (!name || !phone || !address) return;
            if (checkoutConfirmBtn) checkoutConfirmBtn.disabled = true;

            try {
                await submitOrder({ name, phone, address, note });
                if (checkoutNameEl) checkoutNameEl.value = "";
                if (checkoutPhoneEl) checkoutPhoneEl.value = "";
                if (checkoutAddressEl) checkoutAddressEl.value = "";
                if (checkoutNoteEl) checkoutNoteEl.value = "";
                hideModalById("checkoutModal");
                closeCartDrawer();
                showModalById("orderSuccessModal");
            } catch {
                // ignore
            } finally {
                if (checkoutConfirmBtn) checkoutConfirmBtn.disabled = false;
            }
        });
    }

    onAuthStateChanged(auth, (user) => {
        cartUser = user || null;

        if (!authReadyResolved) {
            authReadyResolved = true;
            if (typeof resolveAuthReady === "function") {
                resolveAuthReady();
            }
        }

        if (!cartUser) {
            if (cartUnsub) {
                try { cartUnsub(); } catch { /* ignore */ }
                cartUnsub = null;
            }
            cartItems = [];
            renderCart();
            userProfileCache = null;
            return;
        }

        (async () => {
            try {
                await ensureUserProfileDoc(cartUser);
                userProfileCache = await loadUserProfile(cartUser.uid);
            } catch {
                userProfileCache = null;
            }
        })();

        listenCart(cartUser.uid);
    });
}

async function submitNewsletterEmail(email) {
    await addDoc(collection(db, "newsletterSubscribers"), {
        email: (email || "").toString().trim().toLowerCase(),
        createdAt: Date.now(),
    });
}

function showNewsletterSuccessModal() {
    const modalEl = document.getElementById("newsletterSuccessModal");
    if (!modalEl) return;

    if (window.bootstrap && window.bootstrap.Modal) {
        if (typeof window.bootstrap.Modal.getOrCreateInstance === "function") {
            window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
        } else {
            new window.bootstrap.Modal(modalEl).show();
        }
        return;
    }

    if (window.jQuery && window.jQuery.fn && typeof window.jQuery.fn.modal === "function") {
        window.jQuery(modalEl).modal("show");
    }
}

function setupNewsletterForm() {
    const form = document.getElementById("newsletterForm") || document.querySelector(".newsletter-form");
    if (!form) return;

    const emailInput = document.getElementById("newsletterEmail") || form.querySelector("input[type='email']");
    if (!emailInput) return;

    const submitBtn = document.getElementById("newsletterSubmitBtn") || form.querySelector("button[type='submit']");

    function isValidEmail(value) {
        const v = (value || "").toString().trim();
        if (!v) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = (emailInput.value || "").toString().trim();
        if (!isValidEmail(email)) return;

        if (submitBtn) submitBtn.disabled = true;
        try {
            await submitNewsletterEmail(email);
            emailInput.value = "";
            showNewsletterSuccessModal();
        } catch {
            // ignore
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}

async function applyChefsSettings() {
    const wrapperEl = document.getElementById("teamSliderWrapper");
    if (!wrapperEl) return;

    try {
        const chefsSnap = await getDocs(query(collection(db, "chefs"), orderBy("order", "asc")));
        const chefs = chefsSnap.docs
            .map((d) => ({ id: d.id, ...(d.data() || {}) }))
            .filter((c) => c && c.active !== false);

        if (!chefs.length) return;

        async function canLoadImage(url) {
            return await new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = url;
            });
        }

        const fragment = document.createDocumentFragment();
        let addedCount = 0;

        for (const chef of chefs) {
            const name = typeof chef.name === "string" ? chef.name.trim() : "";
            const role = typeof chef.role === "string" ? chef.role.trim() : "";
            const imageUrlRaw = typeof chef.imageUrl === "string" ? chef.imageUrl.trim() : "";
            const imgUrl = imageUrlRaw ? normalizeDriveImageUrl(imageUrlRaw) : null;
            if (!name || !imgUrl) continue;

            const ok = await canLoadImage(imgUrl);
            if (!ok) continue;

            const facebookUrl = typeof chef.facebookUrl === "string" ? chef.facebookUrl.trim() : "";
            const instagramUrl = typeof chef.instagramUrl === "string" ? chef.instagramUrl.trim() : "";
            const youtubeUrl = typeof chef.youtubeUrl === "string" ? chef.youtubeUrl.trim() : "";

            const socials = [
                facebookUrl
                    ? `<li><a href="${escapeHtml(facebookUrl)}" target="_blank" rel="noopener noreferrer"><i class="uil uil-facebook-f"></i></a></li>`
                    : "",
                instagramUrl
                    ? `<li><a href="${escapeHtml(instagramUrl)}" target="_blank" rel="noopener noreferrer"><i class="uil uil-instagram"></i></a></li>`
                    : "",
                youtubeUrl
                    ? `<li><a href="${escapeHtml(youtubeUrl)}" target="_blank" rel="noopener noreferrer"><i class="uil uil-youtube"></i></a></li>`
                    : "",
            ].filter(Boolean);

            const socialHtml = socials.length
                ? `
                    <div class="social-icon">
                        <ul>
                            ${socials.join("\n")}
                        </ul>
                    </div>
                `
                : "";

            const roleHtml = role ? `\n                                            <span>${escapeHtml(role)}</span>` : "";

            const slide = document.createElement("div");
            slide.className = "col-lg-4 swiper-slide";
            slide.innerHTML = `
                <div class="team-box text-center">
                    <div style="background-image: url(${escapeHtml(imgUrl)});" class="team-img back-img"></div>
                    <h3 class="h3-title">${escapeHtml(name)}${roleHtml}</h3>
                    ${socialHtml}
                </div>
            `;

            fragment.appendChild(slide);
            addedCount += 1;
        }

        if (!addedCount) return;

        wrapperEl.innerHTML = "";
        wrapperEl.appendChild(fragment);

        if (typeof window.__refreshTeamSwiper === "function") {
            window.__refreshTeamSwiper();
        } else {
            window.__teamSwiperRefreshPending = true;
        }
    } catch {
        // ignore
    }
}

async function applyBlogPostsSettings() {
    const cardsEl = document.getElementById("blog-cards");
    if (!cardsEl) return;

    try {
        const snap = await getDocs(query(collection(db, "blogPosts"), orderBy("createdAt", "desc")));
        const posts = snap.docs
            .map((d) => ({ id: d.id, ...(d.data() || {}) }))
            .filter((p) => p && p.active !== false);

        if (!posts.length) return;

        const mapped = posts.map((p) => ({
            id: p.id,
            date: typeof p.date === "string" ? p.date : "",
            title: typeof p.title === "string" ? p.title : "",
            excerpt: typeof p.excerpt === "string" ? p.excerpt : "",
            description: typeof p.description === "string" ? p.description : "",
            image: typeof p.imageUrl === "string" ? p.imageUrl : (typeof p.image === "string" ? p.image : ""),
            url: typeof p.url === "string" && p.url.trim() ? p.url.trim() : "#",
            cta: "Read More",
        }));

        window.blogPosts = mapped;

        if (typeof window.__renderBlogCards === "function") {
            window.__renderBlogCards(mapped);
        }
    } catch {
        // ignore
    }
}

async function applyGallerySliderSettings() {
    const wrapperEl = document.getElementById("gallerySliderWrapper");
    if (!wrapperEl) return;

    try {
        const snap = await getDoc(doc(db, "siteSettings", "gallerySlider"));
        if (!snap.exists()) return;

        const data = snap.data() || {};
        const images = Array.isArray(data.images)
            ? data.images.filter((x) => typeof x === "string" && x.trim())
            : [];

        if (!images.length) return;

        const fragment = document.createDocumentFragment();
        let addedCount = 0;

        async function canLoadImage(url) {
            return await new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = url;
            });
        }

        for (const rawUrl of images) {
            const finalUrl = normalizeDriveImageUrl(rawUrl);
            if (!finalUrl) continue;
            const ok = await canLoadImage(finalUrl);
            if (!ok) continue;

            const link = document.createElement("a");
            link.className = "book-table-img back-img swiper-slide";
            link.setAttribute("data-fancybox", "table-slider");
            link.href = finalUrl;
            link.style.backgroundImage = `url(${finalUrl})`;
            fragment.appendChild(link);
            addedCount += 1;
        }

        if (!addedCount) return;

        wrapperEl.innerHTML = "";
        wrapperEl.appendChild(fragment);

        if (typeof window.__refreshBookTableSwiper === "function") {
            window.__refreshBookTableSwiper();
        } else {
            window.__bookTableSwiperRefreshPending = true;
        }
    } catch {
        // ignore
    }
}

async function applyMenuSettings() {
    const menuSectionEl = document.getElementById("menu");
    const filtersEl = document.querySelector(".menu-tab .filters");
    const dishRowEl = document.getElementById("menu-dish");

    if (!filtersEl || !dishRowEl) return;

    try {
        const categoriesSnap = await getDocs(query(collection(db, "menuCategories"), orderBy("order", "asc")));
        const categories = categoriesSnap.docs
            .map((d) => ({ id: d.id, ...(d.data() || {}) }))
            .filter((c) => c && c.active && typeof c.slug === "string" && c.slug.trim() && typeof c.name === "string" && c.name.trim());

        const itemsSnap = await getDocs(query(collection(db, "menuItems"), orderBy("createdAt", "desc")));
        const items = itemsSnap.docs
            .map((d) => ({ id: d.id, ...(d.data() || {}) }))
            .filter((it) => it && it.active !== false);

        const hasMenuData = categories.length > 0 && items.length > 0;
        if (!hasMenuData) {
            if (menuSectionEl) menuSectionEl.style.display = "none";
            filtersEl.innerHTML = "";
            dishRowEl.innerHTML = "";
            return;
        }

        if (menuSectionEl) menuSectionEl.style.display = "";

        const iconFallbacks = [
            "assets/images/menu-1.png",
            "assets/images/menu-2.png",
            "assets/images/menu-3.png",
            "assets/images/menu-4.png",
        ];

        const allFilter = ".all";

        filtersEl.innerHTML = [
            '<div class="filter-active"></div>',
            `
                <li class="filter" data-filter="${allFilter}">
                    All
                </li>
            `,
            ...categories.map((c, idx) => {
                const icon = typeof c.imageUrl === "string" && c.imageUrl.trim()
                    ? normalizeDriveImageUrl(c.imageUrl)
                    : null;
                const iconHtml = icon
                    ? `<img src="${icon}" alt="not found">`
                    : "";
                return `
                    <li class="filter" data-filter=".${escapeHtml(c.slug)}">
                        ${iconHtml}
                        ${escapeHtml(c.name)}
                    </li>
                `;
            }),
        ].join("");

        dishRowEl.innerHTML = items.map((it) => {
                const title = escapeHtml(it.title);
                const calories = escapeHtml(it.calories);
                const type = escapeHtml(it.type);
                const description = escapeHtml(it.description);
                const itemId = escapeHtml(it.id);

                const rating = Number.isFinite(it.rating) ? it.rating : (it.rating || "");
                const persons = Number.isFinite(it.persons) ? it.persons : (it.persons || "");
                const price = Number.isFinite(it.price) ? it.price : (it.price || "");

                const image = typeof it.imageUrl === "string" ? normalizeDriveImageUrl(it.imageUrl) : null;
                const cats = Array.isArray(it.categories) ? it.categories.filter((x) => typeof x === "string" && x.trim()) : [];
                const catClasses = cats.map((s) => escapeHtml(s)).join(" ");

                return `
                    <div class="col-12 col-sm-6 col-md-4 col-lg-4 dish-box-wp all ${catClasses}" data-cat="${escapeHtml(cats[0] || "all")}" data-item-id="${itemId}">
                        <div class="dish-box text-center">
                            <div class="dist-img">
                                <img src="${image || "assets/images/dish/1.png"}" alt="not found">
                            </div>
                            <div class="dish-rating">
                                ${escapeHtml(rating)}
                                <i class="uil uil-star"></i>
                            </div>
                            <div class="dish-title">
                                <h3 class="h3-title">${title}</h3>
                                <p>${calories}</p>
                            </div>
                            <div class="dish-info">
                                <ul>
                                    <li>
                                        <p>Type</p>
                                        <b>${type}</b>
                                    </li>
                                    <li>
                                        <p>Persons</p>
                                        <b>${escapeHtml(persons)}</b>
                                    </li>
                                </ul>
                            </div>
                            <div class="dist-bottom-row">
                                <ul>
                                    <li>
                                        <b>Tk. ${escapeHtml(price)}</b>
                                    </li>
                                    <li>
                                        <button class="dish-add-btn" type="button" title="${description}" data-action="addToCart">
                                            <i class="uil uil-plus"></i>
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
            }).join("");

        window.__menuItemsById = window.__menuItemsById || {};
        items.forEach((it) => {
            if (it && it.id) window.__menuItemsById[String(it.id)] = it;
        });

        if (dishRowEl && !dishRowEl.dataset.cartBound) {
            dishRowEl.dataset.cartBound = "1";
            dishRowEl.addEventListener("click", async (e) => {
                const btn = e.target.closest(".dish-add-btn");
                if (!btn) return;
                const box = btn.closest(".dish-box-wp");
                const id = box ? box.getAttribute("data-item-id") : "";
                if (!id) return;
                const item = window.__menuItemsById ? window.__menuItemsById[String(id)] : null;
                if (!item) return;
                try {
                    await addToCartByItem(item);
                } catch (err) {
                    console.error("Add to cart failed", err);
                    window.alert("Add to cart failed. Please try again.");
                }
            });
        }

        if (typeof window.__initMenuFiltering === "function") {
            window.__initMenuFiltering();
        } else {
            window.__menuInitPending = true;
        }

        if (typeof window.__setupMenuFilterActiveBar === "function") {
            window.__setupMenuFilterActiveBar();
        } else {
            window.__menuBarInitPending = true;
        }
    } catch {
        if (menuSectionEl) menuSectionEl.style.display = "none";
    }
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

async function applyOpeningTableSettings() {
    const subTitleEl = document.getElementById("openingTableSubTitle");
    const titleEl = document.getElementById("openingTableTitle");
    const slot1TitleEl = document.getElementById("openingSlot1Title");
    const slot1TimeEl = document.getElementById("openingSlot1Time");
    const slot2TitleEl = document.getElementById("openingSlot2Title");
    const slot2TimeEl = document.getElementById("openingSlot2Time");
    const phoneLinkEl = document.getElementById("openingPhoneLink");

    if (!subTitleEl && !titleEl && !slot1TitleEl && !slot1TimeEl && !slot2TitleEl && !slot2TimeEl && !phoneLinkEl) {
        return;
    }

    try {
        const snap = await getDoc(doc(db, "siteSettings", "openingTable"));
        if (!snap.exists()) return;

        const data = snap.data() || {};

        if (subTitleEl && typeof data.subTitle === "string" && data.subTitle.trim()) subTitleEl.textContent = data.subTitle.trim();
        if (titleEl && typeof data.title === "string" && data.title.trim()) titleEl.textContent = data.title.trim();

        if (slot1TitleEl && typeof data.slot1Title === "string" && data.slot1Title.trim()) slot1TitleEl.textContent = data.slot1Title.trim();
        if (slot1TimeEl && typeof data.slot1Time === "string" && data.slot1Time.trim()) slot1TimeEl.textContent = data.slot1Time.trim();

        if (slot2TitleEl && typeof data.slot2Title === "string" && data.slot2Title.trim()) slot2TitleEl.textContent = data.slot2Title.trim();
        if (slot2TimeEl && typeof data.slot2Time === "string" && data.slot2Time.trim()) slot2TimeEl.textContent = data.slot2Time.trim();

        const phoneTel = typeof data.phoneTel === "string" ? data.phoneTel.trim() : "";
        const phoneLabel = typeof data.phoneLabel === "string" ? data.phoneLabel.trim() : "";

        if (phoneLinkEl) {
            if (phoneLabel) phoneLinkEl.textContent = phoneLabel;
            if (phoneTel) {
                phoneLinkEl.setAttribute("href", `tel:${phoneTel}`);
                if (!phoneLabel) phoneLinkEl.textContent = phoneTel;
            }
        }
    } catch {
        // ignore
    }
}

async function applyAboutSectionSettings() {
    const subTitleEl = document.getElementById("aboutSubTitle");
    const titlePrefixEl = document.getElementById("aboutTitlePrefix");
    const titleHighlightEl = document.getElementById("aboutTitleHighlight");
    const textEl = document.getElementById("aboutText");
    const imageEl = document.getElementById("aboutImage");
    const videoLinkEl = document.getElementById("recipeVideoLink");

    if (!subTitleEl && !titlePrefixEl && !titleHighlightEl && !textEl && !imageEl && !videoLinkEl) {
        return { handledVideo: false };
    }

    let handledVideo = false;

    try {
        const snap = await getDoc(doc(db, "siteSettings", "aboutSection"));
        if (!snap.exists()) return { handledVideo: false };

        const data = snap.data() || {};

        if (subTitleEl && typeof data.subTitle === "string" && data.subTitle.trim()) {
            subTitleEl.textContent = data.subTitle.trim();
        }

        if (titlePrefixEl && typeof data.titlePrefix === "string") {
            titlePrefixEl.textContent = data.titlePrefix;
        }

        if (titleHighlightEl && typeof data.titleHighlight === "string" && data.titleHighlight.trim()) {
            titleHighlightEl.textContent = data.titleHighlight.trim();
        }

        if (textEl && typeof data.text === "string" && data.text.trim()) {
            textEl.textContent = data.text.trim();
        }

        if (imageEl && typeof data.imageUrl === "string" && data.imageUrl.trim()) {
            const finalUrl = normalizeDriveImageUrl(data.imageUrl);
            if (finalUrl) {
                imageEl.style.backgroundImage = `url(${finalUrl})`;
            }
        }

        if (videoLinkEl && typeof data.videoUrl === "string" && data.videoUrl.trim()) {
            const normalized = normalizeRecipeVideoUrl(data.videoUrl);
            if (normalized) {
                videoLinkEl.setAttribute("href", normalized.url);
                if (normalized.type === "iframe") {
                    videoLinkEl.setAttribute("data-type", "iframe");
                } else {
                    videoLinkEl.removeAttribute("data-type");
                }
                handledVideo = true;
            }
        }
    } catch {
        // ignore
    }

    return { handledVideo };
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
applyAboutSectionSettings().then((res) => {
    if (!res?.handledVideo) {
        applyRecipeVideoSettings();
    }
});
applyBrandsSettings();
applyOpeningTableSettings();
applyMenuSettings();
applyGallerySliderSettings();
applyChefsSettings();
applyBlogPostsSettings();
setupNewsletterForm();
setupCartSystem();
