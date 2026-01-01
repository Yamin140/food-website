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

function normalizeText(input) {
    return String(input ?? "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
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

function matchesAnyTerm(haystack, terms) {
    if (!terms.length) return true;
    return terms.some((t) => haystack.includes(t));
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

function scoreAnyMatch(haystack, terms) {
    if (!terms.length) return 0;
    let score = 0;
    for (const t of terms) {
        const idx = haystack.indexOf(t);
        if (idx === -1) continue;
        score += Math.max(1, 50 - idx);
    }
    return score;
}

const CACHE_KEY = "ajaxSearchCacheV1";
const CACHE_TTL_MS = 30 * 60 * 1000;
let memoryCache = null;

function getCachedIndex() {
    if (memoryCache && Array.isArray(memoryCache.items)) {
        return memoryCache.items;
    }

    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.items) || !Number.isFinite(parsed.ts)) return null;
        if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
        memoryCache = parsed;
        return parsed.items;
    } catch {
        return null;
    }
}

function setCachedIndex(items) {
    const payload = { ts: Date.now(), items };
    memoryCache = payload;
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {
    }
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

    const id = it && it.id ? String(it.id) : "";
    const catSlug = Array.isArray(it.categories) && typeof it.categories[0] === "string" && it.categories[0].trim()
        ? it.categories[0].trim()
        : "";

    const url = id
        ? `index.html?${catSlug ? `cat=${encodeURIComponent(catSlug)}&` : ""}item=${encodeURIComponent(id)}#menu`
        : "index.html#menu";

    const text = [title, description, type, calories, categories, price].filter(Boolean).join(" ");

    return {
        kind: "menu",
        title,
        excerpt: description,
        url,
        meta: type,
        text,
    };
}

function buildBlogDoc(p) {
    const title = typeof p.title === "string" ? p.title : "";
    const excerpt = typeof p.excerpt === "string" ? p.excerpt : "";
    const description = typeof p.description === "string" ? p.description : "";
    const date = typeof p.date === "string" ? p.date : "";

    const text = [title, excerpt, description, date].filter(Boolean).join(" ");

    return {
        kind: "blog",
        title,
        excerpt: excerpt || description,
        url: "index.html#blog",
        meta: date,
        text,
    };
}

async function loadIndex() {
    const cached = getCachedIndex();
    if (cached) return cached;

    const [menuItems, blogPosts] = await Promise.all([fetchMenuItems(), fetchBlogPosts()]);

    const items = [
        ...menuItems.map(buildMenuDoc),
        ...blogPosts.map(buildBlogDoc),
    ];

    setCachedIndex(items);
    return items;
}

function ensureDropdown(formEl) {
    let dropdown = formEl.querySelector(":scope > .ajax-search-dropdown");
    if (dropdown) return dropdown;

    dropdown = document.createElement("div");
    dropdown.className = "ajax-search-dropdown";
    dropdown.style.position = "absolute";
    dropdown.style.left = "0";
    dropdown.style.right = "0";
    dropdown.style.top = "100%";
    dropdown.style.marginTop = "8px";
    dropdown.style.background = "#ffffff";
    dropdown.style.border = "1px solid rgba(0,0,0,0.08)";
    dropdown.style.borderRadius = "10px";
    dropdown.style.boxShadow = "0 12px 40px rgba(0,0,0,0.12)";
    dropdown.style.zIndex = "9999";
    dropdown.style.display = "none";
    dropdown.style.maxHeight = "360px";
    dropdown.style.overflow = "auto";

    formEl.appendChild(dropdown);
    return dropdown;
}

function hideDropdown(dropdown) {
    dropdown.style.display = "none";
    dropdown.innerHTML = "";
}

function showDropdown(dropdown) {
    dropdown.style.display = "block";
}

function renderDropdown(dropdown, q, results) {
    dropdown.innerHTML = "";

    const header = document.createElement("div");
    header.style.padding = "10px 12px";
    header.style.borderBottom = "1px solid rgba(0,0,0,0.06)";
    header.style.fontSize = "13px";
    header.style.color = "rgba(0,0,0,0.65)";
    header.textContent = results.length ? `Results for "${q}"` : `No results for "${q}"`;
    dropdown.appendChild(header);

    if (results.length) {
        for (const r of results) {
            const a = document.createElement("a");
            a.href = r.url;
            a.style.display = "block";
            a.style.padding = "10px 12px";
            a.style.textDecoration = "none";
            a.style.color = "#0d0d25";
            a.style.borderBottom = "1px solid rgba(0,0,0,0.04)";

            const badgeColor = r.kind === "menu" ? "#ff8243" : "#2d7ff9";

            a.innerHTML = `
                <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
                    <div style="min-width:0;">
                        <div style="font-weight:600; white-space:normal; overflow:visible; text-overflow:clip; word-break:break-word;">${escapeHtml(r.title || "Untitled")}</div>
                        <div style="font-size:12px; opacity:0.7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml((r.excerpt || "").slice(0, 80))}</div>
                    </div>
                    <div style="flex:0 0 auto;">
                        <span style="display:inline-block; font-size:11px; padding:3px 8px; border-radius:999px; background:${badgeColor}; color:#fff;">${r.kind === "menu" ? "Menu" : "Blog"}</span>
                    </div>
                </div>
            `;

            a.addEventListener("mouseenter", () => {
                a.style.background = "rgba(0,0,0,0.03)";
            });
            a.addEventListener("mouseleave", () => {
                a.style.background = "transparent";
            });

            dropdown.appendChild(a);
        }
    }

    const footer = document.createElement("a");
    footer.href = `search.html?q=${encodeURIComponent(q)}`;
    footer.style.display = "block";
    footer.style.padding = "10px 12px";
    footer.style.textDecoration = "none";
    footer.style.fontWeight = "600";
    footer.style.color = "#ff8243";
    footer.textContent = "View all results";
    dropdown.appendChild(footer);
}

function searchInIndex(index, q, limit) {
    const terms = splitTerms(q);
    const strict = index
        .map((d) => {
            const hay = normalizeText(d.text);
            if (!matchesAllTerms(hay, terms)) return null;
            return { ...d, _score: scoreMatch(hay, terms) };
        })
        .filter(Boolean)
        .sort((a, b) => (b._score || 0) - (a._score || 0));

    const broad = strict.length >= limit
        ? []
        : index
            .map((d) => {
                const hay = normalizeText(d.text);
                if (!matchesAnyTerm(hay, terms)) return null;
                return { ...d, _score: scoreAnyMatch(hay, terms) };
            })
            .filter(Boolean)
            .sort((a, b) => (b._score || 0) - (a._score || 0));

    const seen = new Set();
    const out = [];

    function keyOf(x) {
        return `${x.kind}|${x.url}|${x.title}`;
    }

    function pushUnique(list) {
        for (const x of list) {
            const k = keyOf(x);
            if (seen.has(k)) continue;
            seen.add(k);
            out.push(x);
            if (out.length >= limit) return true;
        }
        return false;
    }

    const strictMenus = strict.filter((x) => x.kind === "menu");
    const strictBlogs = strict.filter((x) => x.kind !== "menu");
    const broadMenus = broad.filter((x) => x.kind === "menu");
    const broadBlogs = broad.filter((x) => x.kind !== "menu");

    if (pushUnique(strictMenus)) return out;
    if (pushUnique(broadMenus)) return out;
    if (pushUnique(strictBlogs)) return out;
    pushUnique(broadBlogs);

    if (out.length < limit) {
        const fallbackMenus = index.filter((x) => x && x.kind === "menu");
        pushUnique(fallbackMenus);
    }
    return out;
}

function debounce(fn, waitMs) {
    let t;
    return (...args) => {
        if (t) window.clearTimeout(t);
        t = window.setTimeout(() => fn(...args), waitMs);
    };
}

function initForm(formEl) {
    const input = formEl.querySelector("input[type='search']");
    if (!input) return;

    const dropdown = ensureDropdown(formEl);

    const run = debounce(async () => {
        const q = (input.value || "").trim();
        if (q.length < 2) {
            hideDropdown(dropdown);
            return;
        }

        showDropdown(dropdown);
        dropdown.innerHTML = "<div style=\"padding:10px 12px; font-size:13px; color:rgba(0,0,0,0.65);\">Searching...</div>";

        try {
            const index = await loadIndex();
            const results = searchInIndex(index, q, 5);
            renderDropdown(dropdown, q, results);
        } catch {
            dropdown.innerHTML = "<div style=\"padding:10px 12px; font-size:13px; color:rgba(0,0,0,0.65);\">Search failed.</div>";
        }
    }, 250);

    input.addEventListener("input", run);
    input.addEventListener("focus", run);

    document.addEventListener("click", (e) => {
        if (!formEl.contains(e.target)) {
            hideDropdown(dropdown);
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            hideDropdown(dropdown);
        }
    });
}

function init() {
    const forms = document.querySelectorAll("form.header-search-form");
    if (!forms.length) return;
    forms.forEach(initForm);
}

init();
