const localStorage = window.safeStorage || window.localStorage;
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    const authSubtitle = document.getElementById('auth-subtitle');
    const authMessage = document.getElementById('auth-message');

    // Toggle Forms
    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        document.getElementById('signup-step-1').classList.remove('hidden');
        document.getElementById('signup-step-2').classList.add('hidden');
        authSubtitle.textContent = 'Join the quiet internet.';
        authMessage.classList.add('hidden');
    });

    const switchToLogin = (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        authSubtitle.textContent = 'Welcome back to the quiet.';
        authMessage.classList.add('hidden');
    };

    showLogin.addEventListener('click', switchToLogin);

    // Signup Onboarding Step Transitions
    const signupNextBtn = document.getElementById('signup-next-btn');
    const signupBackBtn = document.getElementById('signup-back-btn');
    const signupStep1 = document.getElementById('signup-step-1');
    const signupStep2 = document.getElementById('signup-step-2');

    if (signupNextBtn) {
        signupNextBtn.addEventListener('click', () => {
            const usernameInput = document.getElementById('signup-username');
            const emailInput = document.getElementById('signup-email');
            const passwordInput = document.getElementById('signup-password');

            // Validate Step 1 fields
            if (!usernameInput.checkValidity()) {
                usernameInput.reportValidity();
                return;
            }
            if (!emailInput.checkValidity()) {
                emailInput.reportValidity();
                return;
            }
            if (!passwordInput.checkValidity()) {
                passwordInput.reportValidity();
                return;
            }

            signupStep1.classList.add('hidden');
            signupStep2.classList.remove('hidden');
            authSubtitle.textContent = 'Customize your quiet presence.';
        });
    }

    if (signupBackBtn) {
        signupBackBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signupStep2.classList.add('hidden');
            signupStep1.classList.remove('hidden');
            authSubtitle.textContent = 'Join the quiet internet.';
        });
    }

    const displayMessage = (text, type) => {
        authMessage.textContent = text;
        authMessage.className = `auth-message ${type}`;
        authMessage.classList.remove('hidden');
    };

    // Signup Logic
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('signup-username').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value.trim();
        const languages = document.getElementById('signup-languages').value.trim();
        const avatar = document.getElementById('signup-avatar').value;
        const color = document.getElementById('signup-color').value;

        try {
            const response = await fetch(`${CONFIG.API_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, languages, avatar, color })
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('stillhere_token', data.token);
                localStorage.setItem('stillhere_user', JSON.stringify(data.user));
                displayMessage('Welcome to StillHere. Redirecting...', 'success');
                setTimeout(() => window.location.href = 'index.html', 1500);
            } else {
                displayMessage(data.error || 'Signup failed', 'error');
            }
        } catch (err) {
            displayMessage('Cannot connect to server.', 'error');
        }
    });

    // Login Logic
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${CONFIG.API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('stillhere_token', data.token);
                localStorage.setItem('stillhere_user', JSON.stringify(data.user));
                displayMessage('Welcome back. Redirecting...', 'success');
                setTimeout(() => window.location.href = 'index.html', 1500);
            } else {
                displayMessage(data.error || 'Login failed', 'error');
            }
        } catch (err) {
            displayMessage('Cannot connect to server.', 'error');
        }
    });
});
