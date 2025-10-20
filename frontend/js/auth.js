// Authentication Logic
document.addEventListener('DOMContentLoaded', () => {
    // Check if already authenticated
    if (Utils.isAuthenticated()) {
        const user = Utils.getUser();
        if (user && user.is_superuser) {
            window.location.href = 'pages/admin.html';
        } else {
            window.location.href = 'pages/chat.html';
        }
        return;
    }

    // Tab switching
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    loginTab?.addEventListener('click', () => {
        loginTab.classList.add('bg-white', 'dark:bg-gray-800', 'text-primary-600', 'dark:text-primary-400', 'shadow-sm');
        loginTab.classList.remove('text-gray-600', 'dark:text-gray-400');
        registerTab.classList.remove('bg-white', 'dark:bg-gray-800', 'text-primary-600', 'dark:text-primary-400', 'shadow-sm');
        registerTab.classList.add('text-gray-600', 'dark:text-gray-400');
        
        loginForm?.classList.remove('hidden');
        registerForm?.classList.add('hidden');
    });

    registerTab?.addEventListener('click', () => {
        registerTab.classList.add('bg-white', 'dark:bg-gray-800', 'text-primary-600', 'dark:text-primary-400', 'shadow-sm');
        registerTab.classList.remove('text-gray-600', 'dark:text-gray-400');
        loginTab.classList.remove('bg-white', 'dark:bg-gray-800', 'text-primary-600', 'dark:text-primary-400', 'shadow-sm');
        loginTab.classList.add('text-gray-600', 'dark:text-gray-400');
        
        registerForm?.classList.remove('hidden');
        loginForm?.classList.add('hidden');
    });

    // Login form submission
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        Utils.showLoading();

        try {
            const data = await API.login(username, password);
            
            // Save token
            Utils.saveToken(data.access_token);
            
            // Get user info
            const user = await API.getMe();
            Utils.saveUser(user);

            Utils.hideLoading();
            Utils.showSuccess('登录成功！正在跳转...');

            // Redirect based on role
            setTimeout(() => {
                if (user.is_superuser) {
                    window.location.href = 'pages/admin.html';
                } else {
                    window.location.href = 'pages/chat.html';
                }
            }, 1000);

        } catch (error) {
            Utils.hideLoading();
            Utils.showError(error.message || '登录失败，请检查用户名和密码');
        }
    });

    // Register form submission
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const email = document.getElementById('registerEmail').value;

        Utils.showLoading();

        try {
            await API.register(username, password, email);
            
            Utils.hideLoading();
            Utils.showSuccess('注册成功！请登录');

            // Switch to login tab
            setTimeout(() => {
                loginTab?.click();
                document.getElementById('loginUsername').value = username;
            }, 1500);

        } catch (error) {
            Utils.hideLoading();
            Utils.showError(error.message || '注册失败，用户名可能已存在');
        }
    });

    // Animations
    anime({
        targets: '.animate-fade-in',
        opacity: [0, 1],
        translateY: [-20, 0],
        duration: 800,
        easing: 'easeOutQuad'
    });

    anime({
        targets: '.animate-slide-up',
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 1000,
        delay: 200,
        easing: 'easeOutQuad'
    });
});

