import { auth, db } from "../firebase/conf.js";
import {
    onAuthStateChanged,
    signOut,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
    doc,
    getDoc,
    getDocs,
    collection,
    query,
    where,
    orderBy,
    setDoc,
    updateDoc,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const nameEl = document.getElementById("accName");
const emailEl = document.getElementById("accEmail");
const phoneEl = document.getElementById("accPhone");
const addressEl = document.getElementById("accAddress");
const noteEl = document.getElementById("accNote");
const isAdminEl = document.getElementById("accIsAdmin");
const adminPanelLink = document.getElementById("adminPanelLink");
const logoutBtn = document.getElementById("logoutBtn");
const errorEl = document.getElementById("authError");
const successEl = document.getElementById("authSuccess");
const profileForm = document.getElementById("accountProfileForm");

const accountOrdersReloadBtn = document.getElementById("accountOrdersReloadBtn");
const accountOrdersBodyEl = document.getElementById("accountOrdersBody");
const accountOrderDetailsTitleEl = document.getElementById("accountOrderDetailsTitle");
const accountOrderDetailsMetaEl = document.getElementById("accountOrderDetailsMeta");
const accountOrderDetailsItemsEl = document.getElementById("accountOrderDetailsItems");

let accountOrders = [];

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

function escapeInline(input) {
    return String(input || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

function getOrderDisplayStatus(order) {
    const raw = (order?.status || "pending").toString();
    if (raw === "cancelled_customer") return "Cancelled by Customer";
    if (raw === "cancelled_restaurant") return "Cancelled by Restaurant";
    if (raw === "processing") return "Processing";
    if (raw === "delivery") return "Delivery";
    return "Pending";
}

function computeOrderTotal(order) {
    const items = Array.isArray(order?.items) ? order.items : [];
    const computed = items.reduce((sum, it) => {
        const price = Number(it?.price) || 0;
        const qty = Number(it?.qty) || 0;
        return sum + price * qty;
    }, 0);
    const raw = Number(order?.total);
    return Number.isFinite(raw) ? raw : computed;
}

function renderAccountOrdersTable() {
    if (!accountOrdersBodyEl) return;
    if (!Array.isArray(accountOrders) || accountOrders.length === 0) {
        accountOrdersBodyEl.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No orders yet.</td></tr>';
        return;
    }

    accountOrdersBodyEl.innerHTML = accountOrders.map((o) => {
        const ts = typeof o.createdAt === "number" ? o.createdAt : 0;
        const created = ts ? escapeInline(new Date(ts).toLocaleString()) : "";
        const total = computeOrderTotal(o);
        const statusText = escapeInline(getOrderDisplayStatus(o));

        const isPending = (o.status || "pending") === "pending";
        const canCancel = isPending;

        const actions = [
            `<button type="button" class="sec-btn" data-action="orderView" data-id="${escapeInline(o.id)}">View</button>`,
        ];
        if (canCancel) {
            actions.push(`<button type="button" class="sec-btn" data-action="orderCancel" data-id="${escapeInline(o.id)}">Cancel</button>`);
        }

        return `
            <tr>
                <td style="word-break:break-word;">${created}</td>
                <td>Rs. ${escapeInline(total)}</td>
                <td style="word-break:break-word;">${statusText}</td>
                <td>
                    <div class="d-flex" style="gap:10px; flex-wrap:wrap;">${actions.join("")}</div>
                </td>
            </tr>
        `;
    }).join("");
}

function openAccountOrderDetails(order) {
    if (!order) return;
    if (accountOrderDetailsTitleEl) accountOrderDetailsTitleEl.textContent = "Order Details";

    const metaParts = [];
    metaParts.push(`Status: ${getOrderDisplayStatus(order)}`);
    metaParts.push(`Total: Rs. ${computeOrderTotal(order)}`);
    if (order.status === "cancelled_restaurant" && order.cancelReason) {
        metaParts.push(`Cancel Reason: ${order.cancelReason}`);
    }
    if (accountOrderDetailsMetaEl) accountOrderDetailsMetaEl.textContent = metaParts.join(" | ");

    const items = Array.isArray(order.items) ? order.items : [];
    if (accountOrderDetailsItemsEl) {
        if (!items.length) {
            accountOrderDetailsItemsEl.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No items</td></tr>';
        } else {
            const rows = items.map((it) => {
                const title = escapeInline(it.title || "");
                const price = Number(it?.price) || 0;
                const qty = Number(it?.qty) || 0;
                const subtotal = price * qty;
                return `
                    <tr>
                        <td style="word-break:break-word;">${title}</td>
                        <td>Rs. ${escapeInline(price)}</td>
                        <td>${escapeInline(qty)}</td>
                        <td>Rs. ${escapeInline(subtotal)}</td>
                    </tr>
                `;
            }).join("");

            const totalRow = `
                <tr>
                    <td colspan="3" class="text-end"><strong>Total</strong></td>
                    <td><strong>Rs. ${escapeInline(computeOrderTotal(order))}</strong></td>
                </tr>
            `;
            accountOrderDetailsItemsEl.innerHTML = `${rows}${totalRow}`;
        }
    }

    showModalById("accountOrderDetailsModal");
}

async function loadAccountOrders(userId) {
    const snap = await getDocs(query(
        collection(db, "orders"),
        where("userId", "==", userId)
    ));
    accountOrders = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }))
        .sort((a, b) => (Number(b?.createdAt) || 0) - (Number(a?.createdAt) || 0));
    renderAccountOrdersTable();
}

async function cancelOrderAsCustomer(orderId) {
    const user = auth.currentUser;
    if (!user) return;
    await updateDoc(doc(db, "orders", orderId), {
        status: "cancelled_customer",
        cancelledAt: Date.now(),
        updatedAt: Date.now(),
    });
}

async function ensureUserDocExists(user) {
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

async function loadProfileIntoForm(user) {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    const data = (snap.exists() ? snap.data() : null) || {};

    if (nameEl) nameEl.value = (typeof data.name === "string" ? data.name : (user.displayName || ""));
    if (emailEl) emailEl.value = user.email || (typeof data.email === "string" ? data.email : "");
    if (phoneEl) phoneEl.value = typeof data.phone === "string" ? data.phone : "";
    if (addressEl) addressEl.value = typeof data.address === "string" ? data.address : "";
    if (noteEl) noteEl.value = typeof data.note === "string" ? data.note : "";

    const isAdmin = !!data.isAdmin;
    if (isAdminEl) isAdminEl.value = isAdmin ? "Yes" : "No";
    if (adminPanelLink) adminPanelLink.classList.toggle("d-none", !isAdmin);
}

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    if (adminPanelLink) adminPanelLink.classList.add("d-none");
    if (isAdminEl) isAdminEl.value = "No";

    (async () => {
        clearError();
        clearSuccess();
        try {
            await ensureUserDocExists(user);
            await loadProfileIntoForm(user);

            try {
                await loadAccountOrders(user.uid);
            } catch {
                // ignore
            }
        } catch (err) {
            showError(err?.message || "Failed to load profile.");
        }
    })();
});

if (accountOrdersReloadBtn) {
    accountOrdersReloadBtn.addEventListener("click", async () => {
        clearError();
        clearSuccess();
        const user = auth.currentUser;
        if (!user) {
            window.location.href = "login.html";
            return;
        }
        try {
            await loadAccountOrders(user.uid);
            showSuccess("Orders reloaded.");
        } catch (err) {
            showError(err?.message || "Failed to load orders.");
        }
    });
}

if (accountOrdersBodyEl) {
    accountOrdersBodyEl.addEventListener("click", async (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const action = btn.getAttribute("data-action");
        const id = btn.getAttribute("data-id");
        if (!action || !id) return;

        const o = Array.isArray(accountOrders) ? accountOrders.find((x) => x.id === id) : null;

        if (action === "orderView") {
            openAccountOrderDetails(o);
            return;
        }

        if (action === "orderCancel") {
            clearError();
            clearSuccess();
            if (!o) return;
            if ((o.status || "pending") !== "pending") {
                showError("শুধু pending অর্ডার ক্যানসেল করা যাবে।");
                return;
            }
            if (!window.confirm("আপনি কি নিশ্চিতভাবে এই অর্ডারটি ক্যানসেল করতে চান?") ) {
                return;
            }
            try {
                await cancelOrderAsCustomer(id);
                await loadAccountOrders(auth.currentUser.uid);
                showSuccess("অর্ডার ক্যানসেল করা হয়েছে।");
            } catch (err) {
                showError(err?.message || "অর্ডার ক্যানসেল করা যায়নি।");
            }
        }
    });
}

if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearError();
        clearSuccess();

        const user = auth.currentUser;
        if (!user) {
            window.location.href = "login.html";
            return;
        }

        const nextName = (nameEl ? nameEl.value : "").toString().trim();
        const nextPhone = (phoneEl ? phoneEl.value : "").toString().trim();
        const nextAddress = (addressEl ? addressEl.value : "").toString().trim();
        const nextNote = (noteEl ? noteEl.value : "").toString().trim();

        try {
            await ensureUserDocExists(user);
            await setDoc(doc(db, "users", user.uid), {
                userId: user.uid,
                name: nextName,
                email: user.email || "",
                phone: nextPhone,
                address: nextAddress,
                note: nextNote,
                updatedAt: serverTimestamp(),
            }, { merge: true });

            showSuccess("Profile saved.");
        } catch (err) {
            showError(err?.message || "Failed to save profile.");
        }
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
