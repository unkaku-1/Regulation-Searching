// Theme Management
const ThemeManager = {
    init() {
        // Get saved theme or default to light
        const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
        this.setTheme(savedTheme);

        // Setup toggle button
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleTheme());
        }
    },

    setTheme(theme) {
        const html = document.documentElement;
        const sunIcon = document.getElementById('sunIcon');
        const moonIcon = document.getElementById('moonIcon');

        if (theme === 'dark') {
            html.classList.add('dark');
            if (sunIcon) sunIcon.classList.add('hidden');
            if (moonIcon) moonIcon.classList.remove('hidden');
        } else {
            html.classList.remove('dark');
            if (sunIcon) sunIcon.classList.remove('hidden');
            if (moonIcon) moonIcon.classList.add('hidden');
        }

        localStorage.setItem(STORAGE_KEYS.THEME, theme);
    },

    toggleTheme() {
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);

        // Animate the toggle button
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            anime({
                targets: toggleBtn,
                scale: [1, 1.2, 1],
                rotate: [0, 360],
                duration: 500,
                easing: 'easeInOutQuad'
            });
        }
    },

    getCurrentTheme() {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
};

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
});

