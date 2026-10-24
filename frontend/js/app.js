/**
 * Saptashrungi Disposables Management System (SDMS)
 * Customer App & Shopping Cart Controller
 */

const Cart = {
    KEY: 'sdms_cart',

    get() {
        try {
            const raw = localStorage.getItem(this.KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    save(items) {
        localStorage.setItem(this.KEY, JSON.stringify(items));
        this.updateBadge();
        window.dispatchEvent(new CustomEvent('cart_updated', { detail: { items } }));
    },

    add(product, qty = 1) {
        const quantity = parseInt(qty, 10) || 1;
        const currentStock = parseInt(product.current_stock, 10) || 0;
        const maxLimit = parseInt(product.max_order_quantity, 10) || 100;

        // Validation 1: Out of stock
        if (currentStock <= 0) {
            showToast(`"${product.name}" is currently OUT OF STOCK.`, 'danger');
            return false;
        }

        const items = this.get();
        const existingIndex = items.findIndex(it => it.id === product.id);
        const existingQty = existingIndex > -1 ? items[existingIndex].quantity : 0;
        const targetQty = existingQty + quantity;

        // Validation 2: Exceeds stock
        if (targetQty > currentStock) {
            showToast(`Cannot add ${quantity} more. Only ${currentStock} units available in stock.`, 'warning');
            return false;
        }

        // Validation 3: Exceeds max order quantity limit
        if (targetQty > maxLimit) {
            showToast(`Order limit reached! Maximum allowed is ${maxLimit} units per order.`, 'warning');
            return false;
        }

        if (existingIndex > -1) {
            items[existingIndex].quantity = targetQty;
        } else {
            items.push({
                id: product.id,
                name: product.name,
                price: Number(product.price),
                image_url: product.image_url,
                current_stock: currentStock,
                max_order_quantity: maxLimit,
                quantity: targetQty
            });
        }

        this.save(items);
        showToast(`Added ${quantity}x "${product.name}" to cart!`, 'success');
        return true;
    },

    update(productId, newQty) {
        const qty = parseInt(newQty, 10);
        const items = this.get();
        const item = items.find(it => it.id === productId);

        if (!item) return false;

        if (qty <= 0) {
            return this.remove(productId);
        }

        // Check stock
        if (qty > item.current_stock) {
            showToast(`Quantity exceeds available stock (${item.current_stock} left).`, 'warning');
            return false;
        }

        // Check order limit
        if (qty > item.max_order_quantity) {
            showToast(`Maximum order limit for this item is ${item.max_order_quantity} units.`, 'warning');
            return false;
        }

        item.quantity = qty;
        this.save(items);
        return true;
    },

    remove(productId) {
        let items = this.get();
        items = items.filter(it => it.id !== productId);
        this.save(items);
        showToast('Item removed from cart.', 'info');
        return true;
    },

    clear() {
        localStorage.removeItem(this.KEY);
        this.updateBadge();
        window.dispatchEvent(new CustomEvent('cart_updated', { detail: { items: [] } }));
    },

    count() {
        return this.get().reduce((sum, it) => sum + (it.quantity || 1), 0);
    },

    total() {
        return this.get().reduce((sum, it) => sum + (it.price * (it.quantity || 1)), 0);
    },

    updateBadge() {
        const badge = document.getElementById('nav-cart-count');
        if (badge) {
            const count = this.count();
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }
};

/**
 * WhatsApp Direct Order Link Builder
 */
async function triggerWhatsAppOrder(customerInfo = {}) {
    const cart = Cart.get();
    if (cart.length === 0) {
        showToast('Your cart is empty! Add products first.', 'warning');
        return;
    }

    let shopPhone = '9082545483';
    try {
        const biz = await API.get('/business');
        if (biz && biz.business && biz.business.whatsapp_number) {
            shopPhone = biz.business.whatsapp_number.replace(/\D/g, '');
        }
    } catch (e) {
        console.warn('Using default shop phone for WhatsApp', e);
    }

    const user = API.getUser() || {};
    const name = customerInfo.name || user.name || 'Valued Customer';
    const phone = customerInfo.phone || user.phone || 'N/A';
    const address = customerInfo.address || user.address || 'Surat, Gujarat';

    let message = `*📦 NEW ORDER REQUEST - SAPTASHRUNGI DISPOSABLES*\n`;
    message += `-------------------------------------------\n`;
    message += `*Customer:* ${name}\n`;
    message += `*Phone:* ${phone}\n`;
    message += `*Delivery Address:* ${address}\n`;
    message += `-------------------------------------------\n`;
    message += `*ITEMS ORDERED:*\n`;

    cart.forEach((it, idx) => {
        const lineTotal = (it.price * it.quantity).toFixed(2);
        message += `${idx + 1}. *${it.name}*\n   Qty: ${it.quantity} | Rate: ₹${it.price} | Subtotal: ₹${lineTotal}\n`;
    });

    const grandTotal = Cart.total().toFixed(2);
    message += `-------------------------------------------\n`;
    message += `*TOTAL AMOUNT:* ₹${grandTotal}\n`;
    message += `_Please confirm availability and dispatch schedule. Thank you!_`;

    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/91${shopPhone}?text=${encoded}`;
    window.open(waUrl, '_blank');
}

/**
 * Navbar Auth State Sync
 */
function syncNavbarAuth() {
    const authContainer = document.getElementById('nav-auth-container');
    if (!authContainer) return;

    const user = API.getUser();

    if (user) {
        let adminBadge = user.role === 'admin'
            ? `<a href="/admin/index.html" class="btn btn-sm btn-accent" style="margin-right: 6px;"><i class="fa-solid fa-gauge"></i> Admin Portal</a>`
            : '';

        authContainer.innerHTML = `
            ${adminBadge}
            <div style="display: flex; align-items: center; gap: 8px;">
                <a href="/my-orders.html" class="btn btn-sm btn-outline"><i class="fa-solid fa-box"></i> My Orders</a>
                <span style="font-size: 0.85rem; font-weight: 600; color: #0f172a;">${user.name.split(' ')[0]}</span>
                <button onclick="logoutCustomer()" class="btn btn-sm btn-outline" title="Sign Out" style="color: #ef4444; border-color: #fecaca;">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
            </div>
        `;
    } else {
        authContainer.innerHTML = `
            <a href="/login.html" class="btn btn-sm btn-outline"><i class="fa-solid fa-user"></i> Sign In</a>
            <a href="/login.html?tab=register" class="btn btn-sm btn-primary">Register</a>
        `;
    }
}

function logoutCustomer() {
    API.clearAuth();
    showToast('Signed out successfully.', 'info');
    setTimeout(() => {
        window.location.reload();
    }, 500);
}

// Global page initializer
document.addEventListener('DOMContentLoaded', () => {
    Cart.updateBadge();
    syncNavbarAuth();
});
