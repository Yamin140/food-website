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

const adminSidebarNavEl = document.getElementById("adminSidebarNav");

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

const openingTableForm = document.getElementById("openingTableForm");
const otSubTitleEl = document.getElementById("otSubTitle");
const otTitleEl = document.getElementById("otTitle");
const otSlot1TitleEl = document.getElementById("otSlot1Title");
const otSlot1TimeEl = document.getElementById("otSlot1Time");
const otSlot2TitleEl = document.getElementById("otSlot2Title");
const otSlot2TimeEl = document.getElementById("otSlot2Time");
const otPhoneLabelEl = document.getElementById("otPhoneLabel");
const otPhoneTelEl = document.getElementById("otPhoneTel");
const otReloadBtn = document.getElementById("otReloadBtn");

const gallerySliderForm = document.getElementById("gallerySliderForm");
const galleryImageUrlInputEl = document.getElementById("galleryImageUrlInput");
const galleryAddImageBtn = document.getElementById("galleryAddImageBtn");
const gallerySliderBodyEl = document.getElementById("gallerySliderBody");
const galleryReloadBtn = document.getElementById("galleryReloadBtn");

const chefForm = document.getElementById("chefForm");
const chefIdEl = document.getElementById("chefId");
const chefNameEl = document.getElementById("chefName");
const chefRoleEl = document.getElementById("chefRole");
const chefImageUrlEl = document.getElementById("chefImageUrl");
const chefFacebookEl = document.getElementById("chefFacebook");
const chefInstagramEl = document.getElementById("chefInstagram");
const chefYoutubeEl = document.getElementById("chefYoutube");
const chefActiveEl = document.getElementById("chefActive");
const chefResetBtn = document.getElementById("chefResetBtn");
const chefReloadBtn = document.getElementById("chefReloadBtn");
const chefsBodyEl = document.getElementById("chefsBody");

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

const blogPostForm = document.getElementById("blogPostForm");
const blogPostIdEl = document.getElementById("blogPostId");
const blogPostTitleEl = document.getElementById("blogPostTitle");
const blogPostDateEl = document.getElementById("blogPostDate");
const blogPostImageUrlEl = document.getElementById("blogPostImageUrl");
const blogPostExcerptEl = document.getElementById("blogPostExcerpt");
const blogPostDescriptionEl = document.getElementById("blogPostDescription");
const blogPostActiveEl = document.getElementById("blogPostActive");
const blogPostResetBtn = document.getElementById("blogPostResetBtn");
const blogPostReloadBtn = document.getElementById("blogPostReloadBtn");
const blogPostsBodyEl = document.getElementById("blogPostsBody");

const homeBannerRef = doc(db, "siteSettings", "homeBanner");
const aboutSectionRef = doc(db, "siteSettings", "aboutSection");
const aboutVideoRef = doc(db, "siteSettings", "aboutVideo");
const brandsRef = doc(db, "siteSettings", "brands");
const openingTableRef = doc(db, "siteSettings", "openingTable");
const gallerySliderRef = doc(db, "siteSettings", "gallerySlider");

const menuCategoriesCol = collection(db, "menuCategories");
const menuItemsCol = collection(db, "menuItems");
const chefsCol = collection(db, "chefs");
const blogPostsCol = collection(db, "blogPosts");

let brandsLogos = [];
let menuCategories = [];
let menuItems = [];
let gallerySliderImages = [];
let chefs = [];
let blogPosts = [];

function resetBlogPostForm() {
    if (blogPostIdEl) blogPostIdEl.value = "";
    if (blogPostTitleEl) blogPostTitleEl.value = "";
    if (blogPostDateEl) blogPostDateEl.value = "";
    if (blogPostImageUrlEl) blogPostImageUrlEl.value = "";
    if (blogPostExcerptEl) blogPostExcerptEl.value = "";
    if (blogPostDescriptionEl) blogPostDescriptionEl.value = "";
    if (blogPostActiveEl) blogPostActiveEl.value = "true";
}

function renderBlogPostsTable() {
    if (!blogPostsBodyEl) return;

    if (!Array.isArray(blogPosts) || blogPosts.length === 0) {
        blogPostsBodyEl.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No blog posts yet.</td></tr>';
        return;
    }

    blogPostsBodyEl.innerHTML = blogPosts.map((p) => {
        const safeTitle = (p.title || "").toString().replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const safeDate = (p.date || "").toString().replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const activeText = p.active !== false ? "Yes" : "No";

        return `
            <tr>
                <td style="word-break:break-word;">${safeTitle}</td>
                <td style="word-break:break-word;">${safeDate}</td>
                <td>${activeText}</td>
                <td>
                    <div class="d-flex" style="gap:8px; flex-wrap:wrap;">
                        <button type="button" class="sec-btn" data-action="blogEdit" data-id="${p.id}">Edit</button>
                        <button type="button" class="sec-btn" data-action="blogDelete" data-id="${p.id}">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

async function loadBlogPosts() {
    try {
        const snap = await getDocs(query(blogPostsCol, orderBy("createdAt", "desc")));
        blogPosts = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        renderBlogPostsTable();
    } catch {
        // ignore
    }
}

async function saveBlogPost() {
    const id = blogPostIdEl ? blogPostIdEl.value.trim() : "";
    const title = blogPostTitleEl ? blogPostTitleEl.value.trim() : "";
    const date = blogPostDateEl ? blogPostDateEl.value.trim() : "";
    const imageUrlRaw = blogPostImageUrlEl ? blogPostImageUrlEl.value.trim() : "";
    const imageUrl = imageUrlRaw ? (normalizeDriveImageUrl(imageUrlRaw) || imageUrlRaw) : "";
    const excerpt = blogPostExcerptEl ? blogPostExcerptEl.value.trim() : "";
    const description = blogPostDescriptionEl ? blogPostDescriptionEl.value.trim() : "";
    const active = (blogPostActiveEl ? blogPostActiveEl.value : "true") === "true";

    if (!title) throw new Error("Post title is required.");
    if (!imageUrl) throw new Error("Post image link is required.");

    const payload = {
        title,
        date,
        imageUrl,
        excerpt,
        description,
        active,
        updatedAt: Date.now(),
    };

    if (id) {
        await updateDoc(doc(db, "blogPosts", id), payload);
        showSuccess("Blog post updated.");
        return;
    }

    await addDoc(blogPostsCol, {
        ...payload,
        createdAt: Date.now(),
    });
    showSuccess("Blog post added.");
}

async function deleteBlogPostById(id) {
    await deleteDoc(doc(db, "blogPosts", id));
    showSuccess("Blog post deleted.");
}

function setupAdminSidebarNav() {
    if (!adminSidebarNavEl) return;

    const links = Array.from(adminSidebarNavEl.querySelectorAll(".admin-nav-link"));
    if (!links.length) return;

    function getTargetId(link) {
        const fromData = (link.getAttribute("data-target") || "").trim();
        if (fromData) return fromData;
        const href = (link.getAttribute("href") || "").trim();
        if (href.startsWith("#")) return href.slice(1);
        return "";
    }

    function setActive(targetId) {
        for (const link of links) {
            const id = getTargetId(link);
            link.classList.toggle("active", !!targetId && id === targetId);
        }
    }

    try {
        const sections = Array.from(document.querySelectorAll(".admin-section[id]"));
        if (sections.length) {
            const linkById = new Map();
            for (const link of links) {
                const id = getTargetId(link);
                if (id) linkById.set(id, link);
            }

            const ordered = [];
            for (const sec of sections) {
                const id = sec.getAttribute("id");
                const link = id ? linkById.get(id) : null;
                if (link) ordered.push(link);
            }

            for (const link of links) {
                if (!ordered.includes(link)) ordered.push(link);
            }

            for (const link of ordered) {
                adminSidebarNavEl.appendChild(link);
            }
        }
    } catch {
        // ignore
    }

    for (const link of links) {
        link.addEventListener("click", (e) => {
            const targetId = getTargetId(link);
            if (!targetId) return;
            const targetEl = document.getElementById(targetId);
            if (!targetEl) return;

            e.preventDefault();
            setActive(targetId);

            try {
                targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
            } catch {
                targetEl.scrollIntoView();
            }

            if (window.history && typeof window.history.replaceState === "function") {
                window.history.replaceState(null, "", `#${targetId}`);
            }
        });
    }

    const hashId = (window.location.hash || "").replace(/^#/, "").trim();
    if (hashId) {
        setActive(hashId);
    }

    (function setupScrollSpy() {
        const sections = Array.from(document.querySelectorAll(".admin-section[id]"));
        if (!sections.length) return;

        function computeTopOffset() {
            const header = document.querySelector(".site-header");
            const topbar = document.querySelector(".auth-topbar");
            const h1 = header ? header.getBoundingClientRect().height : 0;
            const h2 = topbar ? topbar.getBoundingClientRect().height : 0;
            return Math.max(10, Math.round((h1 || h2 || 0) + 12));
        }

        let currentActive = "";
        function setActiveSafe(id) {
            if (!id || id === currentActive) return;
            currentActive = id;
            setActive(id);
            if (window.history && typeof window.history.replaceState === "function") {
                window.history.replaceState(null, "", `#${id}`);
            }
        }

        let ticking = false;
        function update() {
            ticking = false;
            const topOffset = computeTopOffset();

            const viewportTop = window.scrollY + topOffset;
            const viewportHeight = Math.max(0, window.innerHeight - topOffset);
            const viewportCenter = viewportTop + viewportHeight / 2;

            let candidate = "";
            let bestDist = Infinity;

            for (const sec of sections) {
                const rect = sec.getBoundingClientRect();
                const height = rect.height || 0;
                const topAbs = rect.top + window.scrollY;
                const centerAbs = topAbs + height / 2;
                const dist = Math.abs(centerAbs - viewportCenter);
                if (dist < bestDist) {
                    bestDist = dist;
                    candidate = sec.id;
                }
            }

            if (!candidate && sections[0]) candidate = sections[0].id;
            if (candidate) setActiveSafe(candidate);
        }

        function requestUpdate() {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(update);
        }

        update();
        window.addEventListener("scroll", requestUpdate, { passive: true });
        window.addEventListener("resize", requestUpdate);
    })();
}

function setupAdminSidebarFixed() {
    const sidebar = document.querySelector(".admin-sidebar");
    if (!sidebar) return;

    const parent = sidebar.parentElement;
    if (!parent) return;

    const placeholder = document.createElement("div");
    placeholder.style.display = "none";
    parent.insertBefore(placeholder, sidebar);

    let isFixed = false;
    let sidebarTopAbs = 0;
    let ticking = false;

    function computeTopOffset() {
        const header = document.querySelector(".site-header");
        const h = header ? header.getBoundingClientRect().height : 0;
        return Math.max(10, Math.round(h + 12));
    }

    function computeAnchorTopAbs() {
        const rect = sidebar.getBoundingClientRect();
        sidebarTopAbs = rect.top + window.scrollY;
    }

    function applyFixedStyles() {
        const topOffset = computeTopOffset();
        const refRect = placeholder.getBoundingClientRect();
        sidebar.style.top = topOffset + "px";
        sidebar.style.left = refRect.left + "px";
        sidebar.style.width = refRect.width + "px";
    }

    function setFixed(nextFixed) {
        if (nextFixed === isFixed) return;
        isFixed = nextFixed;

        if (isFixed) {
            const currentRect = sidebar.getBoundingClientRect();
            placeholder.style.height = currentRect.height + "px";
            placeholder.style.width = currentRect.width + "px";
            placeholder.style.display = "block";
            sidebar.classList.add("admin-sidebar-fixed");
            applyFixedStyles();
            return;
        }

        sidebar.classList.remove("admin-sidebar-fixed");
        sidebar.style.left = "";
        sidebar.style.width = "";
        sidebar.style.top = "";
        placeholder.style.display = "none";
    }

    function update() {
        ticking = false;
        if (!sidebarTopAbs) computeAnchorTopAbs();
        const topOffset = computeTopOffset();
        const shouldFix = window.scrollY + topOffset >= sidebarTopAbs;
        setFixed(shouldFix);
        if (isFixed) applyFixedStyles();
    }

    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
    }

    computeAnchorTopAbs();
    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", () => {
        computeAnchorTopAbs();
        requestUpdate();
    });
}

function renderChefsTable() {
    if (!chefsBodyEl) return;

    if (!chefs || chefs.length === 0) {
        chefsBodyEl.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No chefs yet.</td></tr>';
        return;
    }

    chefsBodyEl.innerHTML = chefs.map((c, idx) => {
        const name = (c.name || "").toString();
        const active = c.active !== false;
        const order = Number.isFinite(c.order) ? c.order : idx + 1;
        const safeName = name.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        return `
            <tr>
                <td>
                    <div class="d-flex" style="gap:8px; flex-wrap:wrap;">
                        <button type="button" class="sec-btn" data-action="chefUp" data-id="${c.id}">Up</button>
                        <button type="button" class="sec-btn" data-action="chefDown" data-id="${c.id}">Down</button>
                        <span class="text-muted" style="padding-left:6px;">${order}</span>
                    </div>
                </td>
                <td style="word-break:break-word;">${safeName}</td>
                <td>${active ? "Yes" : "No"}</td>
                <td>
                    <div class="d-flex" style="gap:8px; flex-wrap:wrap;">
                        <button type="button" class="sec-btn" data-action="chefEdit" data-id="${c.id}">Edit</button>
                        <button type="button" class="sec-btn" data-action="chefDelete" data-id="${c.id}">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function resetChefForm() {
    if (chefIdEl) chefIdEl.value = "";
    if (chefNameEl) chefNameEl.value = "";
    if (chefRoleEl) chefRoleEl.value = "";
    if (chefImageUrlEl) chefImageUrlEl.value = "";
    if (chefFacebookEl) chefFacebookEl.value = "";
    if (chefInstagramEl) chefInstagramEl.value = "";
    if (chefYoutubeEl) chefYoutubeEl.value = "";
    if (chefActiveEl) chefActiveEl.value = "true";
}

async function loadChefs() {
    try {
        const snap = await getDocs(query(chefsCol, orderBy("order", "asc")));
        chefs = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        renderChefsTable();
    } catch {
        // ignore
    }
}

async function saveChef() {
    const id = chefIdEl ? chefIdEl.value.trim() : "";
    const name = chefNameEl ? chefNameEl.value.trim() : "";
    const role = chefRoleEl ? chefRoleEl.value.trim() : "";
    const imageUrl = chefImageUrlEl ? chefImageUrlEl.value.trim() : "";
    const facebookUrl = chefFacebookEl ? chefFacebookEl.value.trim() : "";
    const instagramUrl = chefInstagramEl ? chefInstagramEl.value.trim() : "";
    const youtubeUrl = chefYoutubeEl ? chefYoutubeEl.value.trim() : "";
    const active = (chefActiveEl ? chefActiveEl.value : "true") === "true";

    if (!name) throw new Error("Chef name is required.");
    if (!imageUrl) throw new Error("Chef image link is required.");

    const payload = {
        name,
        role,
        imageUrl,
        facebookUrl,
        instagramUrl,
        youtubeUrl,
        active,
        updatedAt: Date.now(),
    };

    if (id) {
        await updateDoc(doc(db, "chefs", id), payload);
        showSuccess("Chef updated.");
        return;
    }

    const nextOrder = (chefs || []).reduce((max, c, idx) => {
        const o = Number.isFinite(c.order) ? c.order : idx + 1;
        return Math.max(max, o);
    }, 0) + 1;

    await addDoc(chefsCol, {
        ...payload,
        order: nextOrder,
        createdAt: Date.now(),
    });

    showSuccess("Chef added.");
}

async function deleteChefById(id) {
    await deleteDoc(doc(db, "chefs", id));
    showSuccess("Chef deleted.");
}

async function moveChef(id, dir) {
    const idx = (chefs || []).findIndex((c) => c.id === id);
    if (idx < 0) return;
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= chefs.length) return;

    const a = chefs[idx];
    const b = chefs[swapIdx];

    const aOrder = Number.isFinite(a.order) ? a.order : idx + 1;
    const bOrder = Number.isFinite(b.order) ? b.order : swapIdx + 1;

    await Promise.all([
        updateDoc(doc(db, "chefs", a.id), { order: bOrder, updatedAt: Date.now() }),
        updateDoc(doc(db, "chefs", b.id), { order: aOrder, updatedAt: Date.now() }),
    ]);

    showSuccess("Chef order updated.");
}

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

function renderGallerySliderImages() {
    if (!gallerySliderBodyEl) return;

    if (!gallerySliderImages || gallerySliderImages.length === 0) {
        gallerySliderBodyEl.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No gallery images yet.</td></tr>';
        return;
    }

    gallerySliderBodyEl.innerHTML = gallerySliderImages.map((url, idx) => {
        const finalUrl = normalizeDriveImageUrl(url);
        const safeUrl = (url || "").replace(/"/g, "&quot;");
        const imgHtml = finalUrl
            ? `<img src="${finalUrl}" alt="" data-gallery-img="1" style="max-height:50px; max-width:140px; object-fit:cover; border-radius:8px;">`
            : "";

        return `
            <tr>
                <td style="word-break:break-all;">${safeUrl}</td>
                <td>${imgHtml}</td>
                <td><button type="button" class="sec-btn" data-action="removeGallery" data-index="${idx}">Remove</button></td>
            </tr>
        `;
    }).join("");

    gallerySliderBodyEl.querySelectorAll("img[data-gallery-img]").forEach((img) => {
        img.addEventListener("error", () => {
            img.style.display = "none";
        });
    });
}

if (blogPostForm) {
    blogPostForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearError();
        clearSuccess();

        try {
            await saveBlogPost();
            resetBlogPostForm();
            await loadBlogPosts();
        } catch (err) {
            showError(err?.message || "Failed to save blog post.");
        }
    });
}

if (chefForm) {
    chefForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearError();
        clearSuccess();

        try {
            await saveChef();
            resetChefForm();
            await loadChefs();
        } catch (err) {
            showError(err?.message || "Failed to save chef.");
        }
    });
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

if (gallerySliderForm) {
    gallerySliderForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearError();
        clearSuccess();

        try {
            await setDoc(gallerySliderRef, {
                images: Array.isArray(gallerySliderImages) ? gallerySliderImages : [],
                updatedAt: Date.now(),
            }, { merge: true });
            showSuccess("Gallery slider updated.");
        } catch (err) {
            showError(err?.message || "Failed to save gallery slider.");
        }
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

async function loadGallerySliderSettings() {
    try {
        const snap = await getDoc(gallerySliderRef);
        const data = snap.exists() ? (snap.data() || {}) : {};
        gallerySliderImages = Array.isArray(data.images) ? data.images.filter((x) => typeof x === "string" && x.trim()) : [];
        renderGallerySliderImages();
    } catch {
        // ignore
    }
}

async function loadOpeningTableSettings() {
    try {
        const snap = await getDoc(openingTableRef);
        const data = snap.exists() ? (snap.data() || {}) : {};

        if (otSubTitleEl) otSubTitleEl.value = typeof data.subTitle === "string" ? data.subTitle : "";
        if (otTitleEl) otTitleEl.value = typeof data.title === "string" ? data.title : "";

        if (otSlot1TitleEl) otSlot1TitleEl.value = typeof data.slot1Title === "string" ? data.slot1Title : "";
        if (otSlot1TimeEl) otSlot1TimeEl.value = typeof data.slot1Time === "string" ? data.slot1Time : "";

        if (otSlot2TitleEl) otSlot2TitleEl.value = typeof data.slot2Title === "string" ? data.slot2Title : "";
        if (otSlot2TimeEl) otSlot2TimeEl.value = typeof data.slot2Time === "string" ? data.slot2Time : "";

        if (otPhoneLabelEl) otPhoneLabelEl.value = typeof data.phoneLabel === "string" ? data.phoneLabel : "";
        if (otPhoneTelEl) otPhoneTelEl.value = typeof data.phoneTel === "string" ? data.phoneTel : "";
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

if (openingTableForm) {
    openingTableForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearError();
        clearSuccess();

        const payload = {
            subTitle: otSubTitleEl ? otSubTitleEl.value : "",
            title: otTitleEl ? otTitleEl.value : "",
            slot1Title: otSlot1TitleEl ? otSlot1TitleEl.value : "",
            slot1Time: otSlot1TimeEl ? otSlot1TimeEl.value : "",
            slot2Title: otSlot2TitleEl ? otSlot2TitleEl.value : "",
            slot2Time: otSlot2TimeEl ? otSlot2TimeEl.value : "",
            phoneLabel: otPhoneLabelEl ? otPhoneLabelEl.value : "",
            phoneTel: otPhoneTelEl ? otPhoneTelEl.value : "",
            updatedAt: Date.now(),
        };

        try {
            await setDoc(openingTableRef, payload, { merge: true });
            showSuccess("Opening table updated.");
        } catch (err) {
            showError(err?.message || "Failed to save Opening table settings.");
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

if (galleryAddImageBtn) {
    galleryAddImageBtn.addEventListener("click", () => {
        clearError();
        clearSuccess();

        const url = galleryImageUrlInputEl ? galleryImageUrlInputEl.value.trim() : "";
        if (!url) return;
        gallerySliderImages = Array.isArray(gallerySliderImages) ? gallerySliderImages : [];
        gallerySliderImages.push(url);
        if (galleryImageUrlInputEl) galleryImageUrlInputEl.value = "";
        renderGallerySliderImages();
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

if (gallerySliderBodyEl) {
    gallerySliderBodyEl.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const action = btn.getAttribute("data-action");
        if (action !== "removeGallery") return;
        const idx = Number(btn.getAttribute("data-index"));
        if (!Number.isFinite(idx) || idx < 0 || idx >= gallerySliderImages.length) return;
        gallerySliderImages.splice(idx, 1);
        renderGallerySliderImages();
    });
}

if (chefsBodyEl) {
    chefsBodyEl.addEventListener("click", async (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const action = btn.getAttribute("data-action");
        const id = btn.getAttribute("data-id");
        if (!action || !id) return;

        clearError();
        clearSuccess();

        try {
            if (action === "chefEdit") {
                const c = (chefs || []).find((x) => x.id === id);
                if (!c) return;
                if (chefIdEl) chefIdEl.value = c.id;
                if (chefNameEl) chefNameEl.value = c.name || "";
                if (chefRoleEl) chefRoleEl.value = c.role || "";
                if (chefImageUrlEl) chefImageUrlEl.value = c.imageUrl || "";
                if (chefFacebookEl) chefFacebookEl.value = c.facebookUrl || "";
                if (chefInstagramEl) chefInstagramEl.value = c.instagramUrl || "";
                if (chefYoutubeEl) chefYoutubeEl.value = c.youtubeUrl || "";
                if (chefActiveEl) chefActiveEl.value = c.active === false ? "false" : "true";
                return;
            }

            if (action === "chefDelete") {
                await deleteChefById(id);
                resetChefForm();
                await loadChefs();
                return;
            }

            if (action === "chefUp") {
                await moveChef(id, "up");
                await loadChefs();
                return;
            }

            if (action === "chefDown") {
                await moveChef(id, "down");
                await loadChefs();
            }
        } catch (err) {
            showError(err?.message || "Chef action failed.");
        }
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

if (galleryReloadBtn) {
    galleryReloadBtn.addEventListener("click", async () => {
        clearError();
        clearSuccess();
        await loadGallerySliderSettings();
        showSuccess("Gallery slider settings loaded.");
    });
}

if (chefResetBtn) {
    chefResetBtn.addEventListener("click", () => {
        clearError();
        clearSuccess();
        resetChefForm();
    });
}

if (chefReloadBtn) {
    chefReloadBtn.addEventListener("click", async () => {
        clearError();
        clearSuccess();
        await loadChefs();
        showSuccess("Chefs loaded.");
    });
}

if (otReloadBtn) {
    otReloadBtn.addEventListener("click", async () => {
        clearError();
        clearSuccess();
        await loadOpeningTableSettings();
        showSuccess("Opening table settings loaded.");
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

if (blogPostReloadBtn) {
    blogPostReloadBtn.addEventListener("click", async () => {
        clearError();
        clearSuccess();
        await loadBlogPosts();
        showSuccess("Blog posts loaded.");
    });
}

if (blogPostResetBtn) {
    blogPostResetBtn.addEventListener("click", () => {
        clearError();
        clearSuccess();
        resetBlogPostForm();
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

if (blogPostsBodyEl) {
    blogPostsBodyEl.addEventListener("click", async (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const action = btn.getAttribute("data-action");
        const id = btn.getAttribute("data-id");
        if (!action || !id) return;

        clearError();
        clearSuccess();

        try {
            if (action === "blogEdit") {
                const p = (blogPosts || []).find((x) => x.id === id);
                if (!p) return;
                if (blogPostIdEl) blogPostIdEl.value = p.id;
                if (blogPostTitleEl) blogPostTitleEl.value = p.title || "";
                if (blogPostDateEl) blogPostDateEl.value = p.date || "";
                if (blogPostImageUrlEl) blogPostImageUrlEl.value = p.imageUrl || "";
                if (blogPostExcerptEl) blogPostExcerptEl.value = p.excerpt || "";
                if (blogPostDescriptionEl) blogPostDescriptionEl.value = p.description || "";
                if (blogPostActiveEl) blogPostActiveEl.value = p.active !== false ? "true" : "false";
                return;
            }

            if (action === "blogDelete") {
                await deleteBlogPostById(id);
                resetBlogPostForm();
                await loadBlogPosts();
            }
        } catch (err) {
            showError(err?.message || "Blog post action failed.");
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
            await loadOpeningTableSettings();
            await loadGallerySliderSettings();
            await loadChefs();
            await loadBlogPosts();
            await loadMenuCategories();
            await loadMenuItems();
        } catch {
            window.location.href = "account.html";
        }
    })();
});

setupAdminSidebarNav();
setupAdminSidebarFixed();
