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

function escapeHtml(input) {
    return String(input ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
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

function normalizeText(input) {
    return String(input ?? "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name) || "";
}

function setQueryParam(name, value) {
    const url = new URL(window.location.href);
    if (value && value.trim()) {
        url.searchParams.set(name, value.trim());
    } else {
        url.searchParams.delete(name);
    }
    window.history.replaceState({}, "", url.toString());
}

let cartUser = null;
let cartItems = [];
let cartUnsub = null;

let userProfileCache = null;

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
        }
    }
    if (window.jQuery && window.jQuery.fn && typeof window.jQuery.fn.modal === "function") {
        window.jQuery(el).modal("hide");
    }
}

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
        try { cartUnsub(); } catch { }
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
            }
        });
    }

    if (cartClearBtn) {
        cartClearBtn.addEventListener("click", async () => {
            try {
                await clearCart();
            } catch {
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
                userProfileCache = null;
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
                try { cartUnsub(); } catch { }
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

function splitTerms(q) {
    return normalizeText(q)
        .split(" ")
        .map((t) => t.trim())
        .filter(Boolean);
}

function matchesAllTerms(haystack, terms) {
    if (!terms.length) return true;
    return terms.every((t) => haystack.includes(t));
}

function scoreMatch(haystack, terms) {
    if (!terms.length) return 0;
    let score = 0;
    for (const t of terms) {
        const idx = haystack.indexOf(t);
        if (idx === -1) return 0;
        score += Math.max(1, 50 - idx);
    }
    return score;
}

async function fetchMenuItems() {
    const snap = await getDocs(query(collection(db, "menuItems"), orderBy("createdAt", "desc")));
    return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() || {}) }))
        .filter((it) => it && it.active !== false);
}

async function fetchBlogPosts() {
    const snap = await getDocs(query(collection(db, "blogPosts"), orderBy("createdAt", "desc")));
    return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() || {}) }))
        .filter((p) => p && p.active !== false);
}

function buildMenuDoc(it) {
    const title = typeof it.title === "string" ? it.title : "";
    const description = typeof it.description === "string" ? it.description : "";
    const type = typeof it.type === "string" ? it.type : "";
    const calories = typeof it.calories === "string" ? it.calories : "";
    const categories = Array.isArray(it.categories) ? it.categories.join(" ") : "";

    const price = Number.isFinite(it.price) ? String(it.price) : (it.price || "");

    const image = typeof it.imageUrl === "string" ? it.imageUrl : (typeof it.image === "string" ? it.image : "");

    const rating = Number.isFinite(it.rating) ? String(it.rating) : (it.rating || "");
    const persons = Number.isFinite(it.persons) ? String(it.persons) : (it.persons || "");

    const text = [title, description, type, calories, categories, price].filter(Boolean).join(" ");

    return {
        kind: "menu",
        id: it.id,
        title,
        excerpt: description,
        image,
        url: "index.html#menu",
        meta: type,
        calories,
        rating,
        persons,
        price,
        text,
    };
}

function buildBlogDoc(p) {
    const title = typeof p.title === "string" ? p.title : "";
    const excerpt = typeof p.excerpt === "string" ? p.excerpt : "";
    const description = typeof p.description === "string" ? p.description : "";
    const date = typeof p.date === "string" ? p.date : "";

    const image = typeof p.imageUrl === "string" ? p.imageUrl : (typeof p.image === "string" ? p.image : "");

    const text = [title, excerpt, description, date].filter(Boolean).join(" ");

    return {
        kind: "blog",
        id: p.id,
        title,
        excerpt: excerpt || description,
        image,
        url: "index.html#blog",
        meta: date,
        text,
    };
}

function renderResults(container, results) {
    container.innerHTML = "";

    const listRow = document.createElement("div");
    listRow.className = "menu-list-row";

    const row = document.createElement("div");
    row.className = "row g-xxl-5 bydefault_show";

    for (const r of results) {
        if (r.kind === "menu") {
            const title = escapeHtml(r.title || "");
            const type = escapeHtml(r.meta || "");
            const calories = escapeHtml(r.calories || "");
            const rating = escapeHtml(r.rating || "");
            const persons = escapeHtml(r.persons || "");
            const price = escapeHtml(r.price || "");
            const description = escapeHtml(r.excerpt || "");

            const imgUrl = normalizeDriveImageUrl(r.image) || "assets/images/dish/1.png";

            const col = document.createElement("div");
            col.className = "col-12 col-sm-6 col-md-4 col-lg-4 dish-box-wp all";
            col.setAttribute("data-item-id", escapeHtml(r.id || ""));
            col.innerHTML = `
                <div class="dish-box text-center">
                    <div class="dist-img">
                        <img src="${escapeHtml(imgUrl)}" alt="${title}">
                    </div>
                    <div class="dish-rating">
                        ${rating}
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
                                <b>${persons}</b>
                            </li>
                        </ul>
                    </div>
                    <div class="dist-bottom-row">
                        <ul>
                            <li>
                                <b>Tk. ${price}</b>
                            </li>
                            <li>
                                <button class="dish-add-btn" type="button" title="${description}" data-action="addToCart">
                                    <i class="uil uil-plus"></i>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            `;
            row.appendChild(col);
            continue;
        }

        const col = document.createElement("div");
        col.className = "col-12 col-md-6 col-lg-4";

        const box = document.createElement("div");
        box.className = "blog-box";

        const img = document.createElement("div");
        img.className = "blog-img back-img";
        const imgUrl = normalizeDriveImageUrl(r.image);
        if (imgUrl) {
            img.style.backgroundImage = `url("${imgUrl}")`;
        }

        const text = document.createElement("div");
        text.className = "blog-text";

        const dateEl = document.createElement("p");
        dateEl.className = "blog-date";
        dateEl.textContent = r.meta || "";

        const titleEl = document.createElement("a");
        titleEl.className = "h4-title";
        titleEl.href = r.url || "index.html#blog";
        titleEl.textContent = r.title || "";

        const excerptEl = document.createElement("p");
        excerptEl.textContent = (r.excerpt || "").slice(0, 140);

        const btn = document.createElement("a");
        btn.className = "sec-btn";
        btn.href = r.url || "index.html#blog";
        btn.textContent = "Read More";

        if (r.meta) text.appendChild(dateEl);
        text.appendChild(titleEl);
        if (r.excerpt) text.appendChild(excerptEl);
        text.appendChild(btn);

        box.appendChild(img);
        box.appendChild(text);
        col.appendChild(box);
        row.appendChild(col);
    }

    listRow.appendChild(row);
    container.appendChild(listRow);
}

async function runSearch(q) {
    const summaryEl = document.getElementById("searchSummary");
    const resultsEl = document.getElementById("searchResults");
    const emptyEl = document.getElementById("searchEmpty");
    const loadingEl = document.getElementById("searchLoading");

    if (!resultsEl || !summaryEl) return;

    const terms = splitTerms(q);

    resultsEl.innerHTML = "";
    if (emptyEl) emptyEl.style.display = "none";
    if (loadingEl) loadingEl.style.display = "";

    try {
        const [menuItems, blogPosts] = await Promise.all([fetchMenuItems(), fetchBlogPosts()]);

        window.__menuItemsById = window.__menuItemsById || {};
        menuItems.forEach((it) => {
            if (it && it.id) window.__menuItemsById[String(it.id)] = it;
        });

        const docs = [
            ...menuItems.map(buildMenuDoc),
            ...blogPosts.map(buildBlogDoc),
        ];

        const scored = docs
            .map((d) => {
                const haystack = normalizeText(d.text);
                if (!matchesAllTerms(haystack, terms)) return null;
                return { ...d, _score: scoreMatch(haystack, terms) };
            })
            .filter(Boolean)
            .sort((a, b) => (b._score || 0) - (a._score || 0));

        const itemId = getQueryParam("item");
        const itemIdStr = String(itemId || "").trim();
        const exactItemMatches = itemIdStr
            ? scored.filter((x) => x && x.kind === "menu" && String(x.id || "") === itemIdStr)
            : [];
        const finalResults = exactItemMatches.length ? exactItemMatches : scored;

        if (loadingEl) loadingEl.style.display = "none";

        const label = exactItemMatches.length
            ? (exactItemMatches[0]?.title || q || "")
            : q;

        summaryEl.textContent = finalResults.length
            ? `Found ${finalResults.length} result(s) for "${label}"`
            : (q ? `No results for "${q}"` : "No results.");

        if (!finalResults.length) {
            if (emptyEl) emptyEl.style.display = "";
            return;
        }

        renderResults(resultsEl, finalResults);
    } catch (err) {
        if (loadingEl) loadingEl.style.display = "none";
        summaryEl.textContent = "Search failed. Please try again.";
        if (emptyEl) {
            emptyEl.style.display = "";
            emptyEl.textContent = "Search failed. Please refresh the page.";
        }
        console.error(err);
    }
}

function init() {
    const q = getQueryParam("q");
    const itemId = getQueryParam("item");
    const input = document.getElementById("searchInput");
    const form = document.getElementById("searchForm");

    if (input) input.value = q;

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const value = (input && input.value) ? input.value : "";
            setQueryParam("q", value);
            setQueryParam("item", "");
            setQueryParam("cat", "");
            runSearch(value);
        });
    }

    const resultsEl = document.getElementById("searchResults");
    if (resultsEl && !resultsEl.dataset.cartBound) {
        resultsEl.dataset.cartBound = "1";
        resultsEl.addEventListener("click", async (e) => {
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

    setupCartSystem();

    if ((q && q.trim()) || (itemId && itemId.trim())) {
        runSearch(q);
    } else {
        const summaryEl = document.getElementById("searchSummary");
        const emptyEl = document.getElementById("searchEmpty");
        const loadingEl = document.getElementById("searchLoading");
        if (loadingEl) loadingEl.style.display = "none";
        if (summaryEl) summaryEl.textContent = "Type something to search menu and blog.";
        if (emptyEl) emptyEl.style.display = "";
    }
}

init();
