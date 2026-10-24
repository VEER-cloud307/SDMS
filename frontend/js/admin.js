/**
 * Saptashrungi Disposables Management System (SDMS)
 * Admin Portal Shared Controller
 */

function checkAdminAuth() {
    if (!API.isAuthenticated() || !API.isAdmin()) {
        API.clearAuth();
        window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return false;
    }
    return true;
}

function initAdminPage(activeMenuId) {
    if (!checkAdminAuth()) return;

    // Highlight active link
    const links = document.querySelectorAll('.sidebar-link');
    links.forEach(link => {
        if (link.getAttribute('data-menu') === activeMenuId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Populate user profile info
    const user = API.getUser();
    if (user) {
        const nameEl = document.getElementById('admin-profile-name');
        if (nameEl) nameEl.textContent = user.name;
        const avatarEl = document.getElementById('admin-profile-avatar');
        if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();
    }

    // Fetch low stock count for sidebar alert badge
    updateLowStockSidebarBadge();
}

async function updateLowStockSidebarBadge() {
    try {
        const res = await API.get('/stock/low');
        const badge = document.getElementById('sidebar-low-stock-badge');
        if (badge) {
            if (res.count > 0) {
                badge.textContent = res.count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (e) {
        console.warn('Failed to fetch low stock count:', e);
    }
}

function adminLogout() {
    API.clearAuth();
    showToast('Admin logged out successfully.', 'info');
    setTimeout(() => {
        window.location.href = '/login.html';
    }, 400);
}

function getStatusBadge(status) {
    const s = (status || 'Pending').toLowerCase().replace(/\s+/g, '-');
    return `<span class="status-pill status-${s}">${status}</span>`;
}
