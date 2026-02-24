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
        authSubtitle.textContent = 'Join the quiet internet.';
        authMessage.classList.add('hidden');
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        authSubtitle.textContent = 'Welcome back to the quiet.';
        authMessage.classList.add('hidden');
    });

    const displayMessage = (text, type) => {
        authMessage.textContent = text;
        authMessage.className = `auth-message ${type}`;
        authMessage.classList.remove('hidden');
    };

    // Signup Logic
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        try {
            const response = await fetch(`${CONFIG.API_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
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
