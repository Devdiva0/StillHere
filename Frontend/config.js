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


