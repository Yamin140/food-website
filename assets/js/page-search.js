import { db } from "../firebase/conf.js";
import {
    collection,
    getDocs,
    orderBy,
    query,
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
                                <a class="dish-add-btn" href="${escapeHtml(r.url || "index.html#menu")}" title="${description}" role="button">
                                    <i class="uil uil-plus"></i>
                                </a>
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
