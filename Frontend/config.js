const CONFIG = {
    // If you deploy your backend to Render, enter your Render service URL here (e.g. 'https://stillhere.onrender.com')
    RENDER_URL: '', 

    get API_URL() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://127.0.0.1:6005';
        }
        return this.RENDER_URL || window.location.origin;
    }
};

// Safe localStorage wrapper to prevent crashes and preserve sessions in private browsing/strict privacy modes
const safeStorage = {
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            // Fallback to first-party cookie parsing
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const parts = cookies[i].split('=');
                const name = parts[0].trim();
                if (name === key) {
                    return decodeURIComponent(parts.slice(1).join('='));
                }
            }
            return null;
        }
    },
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            // Fallback to setting first-party cookie (expires in 1 day)
            document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=86400; SameSite=Lax`;
        }
    },
    removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            // Fallback to deleting cookie
            document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`;
        }
    }
};

window.safeStorage = safeStorage;


