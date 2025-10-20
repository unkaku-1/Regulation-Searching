// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:8000',  // Backend API URL
    ENDPOINTS: {
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        ME: '/api/auth/me',
        LOGOUT: '/api/auth/logout',
        CHAT: '/api/chat',
        CONVERSATIONS: '/api/conversations',
        KNOWLEDGE: '/api/knowledge',
    }
};

// Storage Keys
const STORAGE_KEYS = {
    TOKEN: 'regulation_token',
    USER: 'regulation_user',
    THEME: 'regulation_theme',
};

// Helper Functions
const API = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async login(username, password) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Login failed');
        }

        return data;
    },

    async register(username, password, email = '') {
        return this.request(API_CONFIG.ENDPOINTS.REGISTER, {
            method: 'POST',
            body: JSON.stringify({ username, password, email }),
        });
    },

    async getMe() {
        return this.request(API_CONFIG.ENDPOINTS.ME);
    },

    async logout() {
        return this.request(API_CONFIG.ENDPOINTS.LOGOUT, {
            method: 'POST',
        });
    },

    async chat(message, conversationId = null) {
        return this.request(API_CONFIG.ENDPOINTS.CHAT, {
            method: 'POST',
            body: JSON.stringify({
                message,
                conversation_id: conversationId,
            }),
        });
    },

    async getConversations() {
        return this.request(API_CONFIG.ENDPOINTS.CONVERSATIONS);
    },

    async getConversation(id) {
        return this.request(`${API_CONFIG.ENDPOINTS.CONVERSATIONS}/${id}`);
    },

    async getMessages(conversationId) {
        return this.request(`${API_CONFIG.ENDPOINTS.CONVERSATIONS}/${conversationId}/messages`);
    },

    async deleteConversation(id) {
        return this.request(`${API_CONFIG.ENDPOINTS.CONVERSATIONS}/${id}`, {
            method: 'DELETE',
        });
    },

    async uploadDocument(file) {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.KNOWLEDGE}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Upload failed');
        }

        return data;
    },

    async getDocuments() {
        return this.request(`${API_CONFIG.ENDPOINTS.KNOWLEDGE}/documents`);
    },

    async getKnowledgeStats() {
        return this.request(`${API_CONFIG.ENDPOINTS.KNOWLEDGE}/stats`);
    },
};

// Utility Functions
const Utils = {
    showLoading() {
        document.getElementById('loadingOverlay')?.classList.remove('hidden');
    },

    hideLoading() {
        document.getElementById('loadingOverlay')?.classList.add('hidden');
    },

    showError(message, elementId = 'errorMessage') {
        const errorEl = document.getElementById(elementId);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
            setTimeout(() => {
                errorEl.classList.add('hidden');
            }, 5000);
        }
    },

    showSuccess(message, elementId = 'successMessage') {
        const successEl = document.getElementById(elementId);
        if (successEl) {
            successEl.textContent = message;
            successEl.classList.remove('hidden');
            setTimeout(() => {
                successEl.classList.add('hidden');
            }, 5000);
        }
    },

    saveUser(user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    },

    getUser() {
        const user = localStorage.getItem(STORAGE_KEYS.USER);
        return user ? JSON.parse(user) : null;
    },

    saveToken(token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    },

    getToken() {
        return localStorage.getItem(STORAGE_KEYS.TOKEN);
    },

    clearAuth() {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    isAdmin() {
        const user = this.getUser();
        return user && user.is_superuser === true;
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    },
};

