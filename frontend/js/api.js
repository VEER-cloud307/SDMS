/**
 * Saptashrungi Disposables Management System (SDMS)
 * Unified API Client & State Management
 */

const API_BASE = '/api';

const API = {
    getToken() {
        return localStorage.getItem('sdms_token');
    },

    setAuth(token, user) {
        localStorage.setItem('sdms_token', token);
        localStorage.setItem('sdms_user', JSON.stringify(user));
    },

    getUser() {
        try {
            const raw = localStorage.getItem('sdms_user');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    clearAuth() {
        localStorage.removeItem('sdms_token');
        localStorage.removeItem('sdms_user');
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },

    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // If body is FormData, don't set Content-Type header so browser sets multipart boundary
        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        }

        try {
            const res = await fetch(url, {
                ...options,
                headers
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                // If 401 and on admin page, redirect to login
                if (res.status === 401 && window.location.pathname.includes('/admin/')) {
                    this.clearAuth();
                    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
                }
                const errorMsg = data.message || `Request failed with status ${res.status}`;
                throw new Error(errorMsg);
            }

            return data;
        } catch (err) {
            console.error(`API Error on ${endpoint}:`, err);
            throw err;
        }
    },

    get(endpoint, params = {}) {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
                query.append(k, v);
            }
        });
        const qs = query.toString();
        return this.request(qs ? `${endpoint}?${qs}` : endpoint, { method: 'GET' });
    },

    post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body)
        });
    },

    put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: body instanceof FormData ? body : JSON.stringify(body)
        });
    },

    patch(endpoint, body) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });
    },

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};

/**
 * Toast Notification System
 */
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-check-circle';
    if (type === 'danger') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-triangle-exclamation';
    if (type === 'info') icon = 'fa-info-circle';

    toast.innerHTML = `
        <i class="fa-solid ${icon}" style="font-size: 1.1rem; margin-top: 2px;"></i>
        <div style="flex: 1;">
            <div style="font-weight: 600;">${type.toUpperCase()}</div>
            <div style="color: #475569; font-size: 0.85rem; margin-top: 2px;">${message}</div>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(30px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/**
 * Currency Formatter (INR ₹)
 */
function formatCurrency(amount) {
    const val = Number(amount) || 0;
    return '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
