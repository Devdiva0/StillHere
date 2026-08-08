// Global Client-Side Error Logger
window.onerror = function (message, source, lineno, colno, error) {
    const errorBox = document.createElement('div');
    errorBox.style.position = 'fixed';
    errorBox.style.bottom = '10px';
    errorBox.style.left = '10px';
    errorBox.style.background = 'rgba(255, 0, 0, 0.9)';
    errorBox.style.color = 'white';
    errorBox.style.padding = '10px';
    errorBox.style.borderRadius = '5px';
    errorBox.style.zIndex = '999999';
    errorBox.style.fontSize = '12px';
    errorBox.style.fontFamily = 'monospace';
    errorBox.style.maxWidth = '90%';
    errorBox.style.wordBreak = 'break-all';
    errorBox.textContent = `JS Error: ${message} at ${source}:${lineno}`;
    document.body.appendChild(errorBox);
    return false;
};

window.onunhandledrejection = function (event) {
    const errorBox = document.createElement('div');
    errorBox.style.position = 'fixed';
    errorBox.style.bottom = '50px';
    errorBox.style.left = '10px';
    errorBox.style.background = 'rgba(255, 68, 68, 0.9)';
    errorBox.style.color = 'white';
    errorBox.style.padding = '10px';
    errorBox.style.borderRadius = '5px';
    errorBox.style.zIndex = '999999';
    errorBox.style.fontSize = '12px';
    errorBox.style.fontFamily = 'monospace';
    errorBox.style.maxWidth = '90%';
    errorBox.style.wordBreak = 'break-all';
    errorBox.textContent = `Promise Error: ${event.reason}`;
    document.body.appendChild(errorBox);
};

// Check authentication
const localStorage = window.safeStorage || window.localStorage;
const token = localStorage.getItem('stillhere_token');
const user = JSON.parse(localStorage.getItem('stillhere_user') || 'null');
const isAuthPage = window.location.pathname.includes('auth');

if (!token && !isAuthPage) {
    window.location.href = 'auth.html';
}

if (token && isAuthPage) {
    window.location.href = 'index.html';
}

// Update UI with user data
if (user) {
    const avatarEls = document.querySelectorAll('.nav-avatar');
    avatarEls.forEach(el => {
        el.textContent = user.avatar;
        el.style.background = user.color;
    });

    // Profile Page Population
    const profileName = document.getElementById('user-profile-name');
    const profileUsername = document.getElementById('user-profile-username');
    const profileAvatar = document.getElementById('user-profile-avatar');
    const profileEmoji = document.getElementById('user-profile-emoji');

    if (profileName) {
        profileName.textContent = user.username;
        profileUsername.textContent = `@${user.username.toLowerCase().replace(/\s+/g, '_')}`;
        profileAvatar.style.background = user.color;
        profileEmoji.textContent = user.avatar;

        // Load user's moments
        const loadUserMoments = async () => {
            const feed = document.getElementById('user-moments-feed');
            if (!feed) return;

            try {
                const response = await fetch(`${CONFIG.API_URL}/api/posts/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const posts = await response.json();

                if (posts.length === 0) {
                    feed.innerHTML = '<p style="color: var(--text-secondary); text-align: center; margin-top: 20px;">You haven\'t shared any moments yet.</p>';
                    return;
                }

                posts.forEach(post => {
                    feed.appendChild(window.createPostElement(post));
                });
            } catch (err) {
                console.error("Failed to load your moments", err);
            }
        };
        loadUserMoments();
    }
}

window.logout = () => {
    localStorage.removeItem('stillhere_token');
    localStorage.removeItem('stillhere_user');
    window.location.href = 'auth.html';
};

// Inject logout button if not present
const navBottom = document.querySelector('.nav-bottom');
if (navBottom && !document.querySelector('[onclick="logout()"]')) {
    const logoutBtn = document.createElement('a');
    logoutBtn.href = '#';
    logoutBtn.className = 'nav-item';
    logoutBtn.onclick = (e) => { e.preventDefault(); logout(); };
    logoutBtn.innerHTML = '<span class="material-symbols-outlined">logout</span> <span class="nav-label">Logout</span>';
    navBottom.appendChild(logoutBtn);
}

// "Join Waitlist" secondary button in hero goes to join page
const joinBtn = document.getElementById("join-btn");
if (joinBtn) {
    joinBtn.addEventListener("click", () => {
        window.location.href = "join.html";
    });
}

// Waitlist form submission
const form = document.getElementById("waitlist-form");
if (form) {
    const emailInput = document.getElementById("email-input");
    const formMessage = document.getElementById("form-message");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();

        if (email === "") {
            formMessage.textContent = "Please enter a valid email address.";
            formMessage.style.color = "#ff9999";
            formMessage.classList.remove("hidden");
        } else {
            try {
                const response = await fetch(`${CONFIG.API_URL}/api/waitlist`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                if (response.ok) {
                    formMessage.textContent = "Thank you. We are still here with you.";
                    formMessage.style.color = "#a0d2ab";
                    emailInput.value = "";
                } else {
                    const data = await response.json();
                    formMessage.textContent = data.error || "Something went wrong.";
                    formMessage.style.color = "#ff9999";
                }
            } catch (err) {
                formMessage.textContent = "Cannot connect to server.";
                formMessage.style.color = "#ff9999";
            }
            formMessage.classList.remove("hidden");

            // Hide message after a few seconds
            setTimeout(() => {
                formMessage.classList.add("hidden");
            }, 5000);
        }
    });
}

// Soft page transition for primary button
const primaryBtn = document.querySelector(".primary-btn");
if (primaryBtn) {
    primaryBtn.addEventListener("click", () => {
        document.body.style.opacity = "0";
        document.body.style.transition = "opacity 0.6s ease";

        setTimeout(() => {
            alert("This would transition to the app space.");
            document.body.style.opacity = "1";
        }, 600);
    });
}

/* ====================================
   SHARE MODAL LOGIC (Instagram-style)
==================================== */
let modalMediaData = null;

window.openShareModal = (e) => {
    if (e) e.preventDefault();
    const overlay = document.getElementById('share-modal-overlay');
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scroll
    }
};

window.closeShareModal = (e) => {
    if (e) e.stopPropagation();
    const overlay = document.getElementById('share-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        resetModal();
    }
};

function resetModal() {
    document.getElementById('modal-moment-input').value = '';
    const previewContainer = document.getElementById('modal-media-preview');
    previewContainer.style.display = 'none';
    document.getElementById('modal-preview-img').src = '';
    document.getElementById('modal-preview-video').src = '';
    document.getElementById('modal-media-upload').value = '';
    modalMediaData = null;
}

window.handleModalMedia = (input) => {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            const previewContainer = document.getElementById('modal-media-preview');
            const previewImg = document.getElementById('modal-preview-img');
            const previewVid = document.getElementById('modal-preview-video');

            modalMediaData = {
                url: e.target.result,
                type: file.type.startsWith('video/') ? 'video' : 'image'
            };

            previewContainer.style.display = 'block';
            if (modalMediaData.type === 'image') {
                previewImg.src = modalMediaData.url;
                previewImg.style.display = 'block';
                previewVid.style.display = 'none';
            } else {
                previewVid.src = modalMediaData.url;
                previewVid.style.display = 'block';
                previewImg.style.display = 'none';
            }
        };
        reader.readAsDataURL(file);
    }
};

window.submitModalPost = async () => {
    const input = document.getElementById('modal-moment-input');
    const text = input.value.trim();
    if (!text && !modalMediaData) return;

    const newPostData = {
        text: text,
        media: modalMediaData ? modalMediaData.url : null,
        mediaType: modalMediaData ? modalMediaData.type : null
    };

    try {
        const response = await fetch(`${CONFIG.API_URL}/api/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('stillhere_token')}`
            },
            body: JSON.stringify(newPostData)
        });

        if (response.ok) {
            const savedPost = await response.json();
            const homeFeed = document.getElementById('home-moments-feed');
            if (homeFeed && typeof createPostElement === 'function') {
                homeFeed.insertBefore(createPostElement(savedPost), homeFeed.firstChild);
            }
            closeShareModal();
            alert("Moment shared to the quiet.");
        } else {
            alert("Failed to share moment. Please log in again.");
            localStorage.removeItem('stillhere_token');
            window.location.href = 'auth.html';
        }
    } catch (err) {
        alert("Failed to share moment. Server offline?");
    }
};

window.createPostElement = (postData) => {
    const post = document.createElement('div');
    post.className = 'post-card reveal active';

    let mediaHtml = '';
    if (postData.media) {
        if (postData.mediaType === 'video') {
            mediaHtml = `
                <div class="post-media-container">
                    <video class="post-media-content" src="${postData.media}" controls></video>
                </div>
            `;
        } else {
            mediaHtml = `
                <div class="post-media-container">
                    <img class="post-media-content" src="${postData.media}" alt="Serene moment">
                </div>
            `;
        }
    }

    const formatTime = (dateInput) => {
        if (!dateInput) return 'Just now';
        const date = new Date(dateInput);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    const isOwner = user && postData.name === user.username;

    post.innerHTML = `
        <div class="post-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="post-avatar" style="background: ${postData.color};">${postData.avatar}</div>
                <div class="post-info">
                    <span class="post-name">${postData.name}</span>
                    <span class="post-time">${formatTime(postData.createdAt || postData.time)}</span>
                </div>
            </div>
            ${isOwner ? `
                <button class="delete-post-btn" onclick="deletePost(event, '${postData._id || postData.id}', this)" title="Delete Moment" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; transition: color 0.3s;" onmouseover="this.style.color='#ea4335'" onmouseout="this.style.color='var(--text-secondary)'">
                    <span class="material-symbols-outlined" style="font-size: 20px;">delete</span>
                </button>
            ` : ''}
        </div>
        <div class="post-content">
            <p class="post-text">${postData.text}</p>
            ${mediaHtml}
        </div>
        <div class="post-actions">
            <button class="support-btn" onclick="toggleSupport(this, ${postData.count || 0})">
                <span class="icon">👍</span>
                <span class="support-text">Support</span>
                <span class="support-count">・ ${postData.count || 0}</span>
            </button>
        </div>
    `;
    return post;
};


// Toggle Support (Flower/Thumbs up)
window.toggleSupport = (btn, initialCount) => {
    const isSupported = btn.classList.toggle('supported');
    const countSpan = btn.querySelector('.support-count');
    const textSpan = btn.querySelector('.support-text');

    let currentCount = parseInt(countSpan.textContent.replace('・ ', '')) || initialCount;

    if (isSupported) {
        currentCount++;
        textSpan.textContent = 'Supported';
    } else {
        currentCount--;
        textSpan.textContent = 'Support';
    }

    countSpan.textContent = `・ ${currentCount}`;
};

// Delete moment post
window.deletePost = async (event, postId, btnElement) => {
    if (event) event.stopPropagation();
    if (!confirm("Are you sure you want to delete this moment?")) return;

    try {
        const response = await fetch(`${CONFIG.API_URL}/api/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('stillhere_token')}`
            }
        });

        if (response.ok) {
            // Find and remove the post element
            const postCard = btnElement.closest('.post-card');
            if (postCard) {
                postCard.style.opacity = '0';
                postCard.style.transform = 'translateY(20px)';
                postCard.style.transition = 'all 0.4s ease';
                setTimeout(() => {
                    postCard.remove();
                }, 400);
            }
            alert("Moment deleted successfully.");
        } else {
            const data = await response.json();
            alert(data.error || "Failed to delete post.");
        }
    } catch (err) {
        console.error("Error deleting post", err);
        alert("Failed to connect to backend server.");
    }
};

// Infinite Scroll for Home Feed
const homeFeed = document.getElementById('home-moments-feed');
const sentinel = document.getElementById('infinite-scroll-sentinel');

if (homeFeed && sentinel) {
    let postPageIndex = 0;
    const mockPosts = [
        { name: "Leo", time: "2h ago", avatar: "🦁", color: "#f5a88c", text: "Found a quiet spot by the lake today. No noise, just the sound of water.", count: 12, media: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=800" },
        { name: "Cyan", time: "4h ago", avatar: "🌊", color: "#85c1e2", text: "The internet feels heavy today. Glad this space exists to just... breathe.", count: 8 },
        { name: "Amber", time: "6h ago", avatar: "🕯️", color: "#f5d38c", text: "Midnight tea and a good book. Sometimes the simplest moments are the most profound.", count: 24, media: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800" },
        { name: "Jade", time: "1d ago", avatar: "🌿", color: "#85e2a6", text: "Started a small garden on my balcony. Watching things grow slowly is soul-healing.", count: 15 },
        { name: "Luna", time: "1d ago", avatar: "🌙", color: "#a685e2", text: "The moon is beautiful tonight. Staring at the stars makes all the digital noise feel so small.", count: 42, media: "https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&q=80&w=800" }
    ];

    // Load posts from backend
    const loadInitialPosts = async () => {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/posts`);
            const posts = await response.json();
            posts.forEach(postData => {
                homeFeed.appendChild(window.createPostElement(postData));
            });
        } catch (err) {
            console.error("Failed to load posts", err);
        }
    };
    loadInitialPosts();

    const loadMorePosts = () => {
        // Simulate loading state
        const loader = document.createElement('div');
        loader.className = 'post-card reveal active';
        loader.style.textAlign = 'center';
        loader.style.padding = '20px';
        loader.innerHTML = `<p style="color: var(--text-secondary); opacity: 0.5;">Finding more quiet moments...</p>`;
        homeFeed.appendChild(loader);

        setTimeout(() => {
            if (homeFeed.contains(loader)) homeFeed.removeChild(loader);

            // Add 2 random posts from mock data
            for (let i = 0; i < 2; i++) {
                const postData = mockPosts[Math.floor(Math.random() * mockPosts.length)];
                homeFeed.appendChild(window.createPostElement(postData));
            }
        }, 800);
    };

    const scrollObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            loadMorePosts();
        }
    }, { threshold: 0.1 });

    scrollObserver.observe(sentinel);
}

// Share page moments feed logic
const momentsFeed = document.getElementById('moments-feed');
if (momentsFeed) {
    // Clear static mock posts
    momentsFeed.innerHTML = '';

    // Load initial posts from backend
    const loadSharePagePosts = async () => {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/posts`);
            if (response.ok) {
                const posts = await response.json();
                posts.forEach(postData => {
                    momentsFeed.appendChild(window.createPostElement(postData));
                });
            }
        } catch (err) {
            console.error("Failed to load posts in share feed", err);
        }
    };
    loadSharePagePosts();

    // Hook composer media preview
    const mediaInput = document.getElementById('media-upload');
    const previewContainer = document.getElementById('media-preview-container');
    const previewImage = document.getElementById('media-preview-image');
    let sharePageMedia = null;

    if (mediaInput) {
        mediaInput.onchange = (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    sharePageMedia = {
                        url: event.target.result,
                        type: file.type.startsWith('video/') ? 'video' : 'image'
                    };
                    if (previewImage) {
                        if (sharePageMedia.type === 'image') {
                            previewImage.src = sharePageMedia.url;
                        } else {
                            previewImage.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" fill="%231a1618"><rect width="200" height="150"/><text x="20" y="80" fill="%23a6959c" font-family="sans-serif">Video Attached</text></svg>';
                        }
                    }
                    if (previewContainer) previewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        };
    }

    window.removeMedia = () => {
        if (mediaInput) mediaInput.value = '';
        if (previewContainer) previewContainer.style.display = 'none';
        if (previewImage) previewImage.src = '';
        sharePageMedia = null;
    };

    // Override postMoment to use real backend API
    window.postMoment = async () => {
        const input = document.getElementById('moment-input');
        if (!input) return;
        const text = input.value.trim();
        if (!text && !sharePageMedia) return;

        const token = safeStorage.getItem('stillhere_token');
        if (!token) {
            alert("Please log in to share a moment.");
            window.location.href = 'auth.html';
            return;
        }

        const postData = {
            text: text,
            media: sharePageMedia ? sharePageMedia.url : null,
            mediaType: sharePageMedia ? sharePageMedia.type : null
        };

        try {
            const response = await fetch(`${CONFIG.API_URL}/api/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(postData)
            });

            if (response.ok) {
                const savedPost = await response.json();
                // Prepend to feed
                momentsFeed.insertBefore(window.createPostElement(savedPost), momentsFeed.firstChild);
                
                // Reset composer
                input.value = '';
                window.removeMedia();
                showToast("Moment shared to the quiet.");
            } else {
                alert("Failed to share moment. Please log in again.");
                safeStorage.removeItem('stillhere_token');
                window.location.href = 'auth.html';
            }
        } catch (err) {
            console.error("Error creating post", err);
            alert("Network error. Please try again.");
        }
    };
}

// Scroll Reveal Animations
const revealElements = document.querySelectorAll(".reveal, .reveal-stagger");

const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("active");
            observer.unobserve(entry.target);
        }
    });
};

const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
};

const revealObserver = new IntersectionObserver(revealCallback, revealOptions);

revealElements.forEach((el, index) => {
    if (el.classList.contains("reveal-stagger")) {
        el.style.transitionDelay = `${index * 0.1}s`;
    }
    revealObserver.observe(el);
});

/* ====================================
   TABLES & VOICE ROOM LOGIC
==================================== */
// Socket.io initialization
let socket;
if (typeof io !== 'undefined') {
    socket = io(CONFIG.API_URL);

    // Socket Connection Status Logger
    socket.on('connect', () => {
        console.log('Socket connected successfully');
        const statusBox = document.getElementById('socket-status-box') || document.createElement('div');
        statusBox.id = 'socket-status-box';
        statusBox.style.position = 'fixed';
        statusBox.style.top = '10px';
        statusBox.style.left = '10px';
        statusBox.style.background = 'rgba(0, 200, 0, 0.8)';
        statusBox.style.color = 'white';
        statusBox.style.padding = '5px 10px';
        statusBox.style.borderRadius = '3px';
        statusBox.style.zIndex = '999998';
        statusBox.style.fontSize = '12px';
        statusBox.textContent = `Socket: Connected (${socket.id})`;
        if (!document.getElementById('socket-status-box')) {
            document.body.appendChild(statusBox);
        }
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        const statusBox = document.getElementById('socket-error-box') || document.createElement('div');
        statusBox.id = 'socket-error-box';
        statusBox.style.position = 'fixed';
        statusBox.style.top = '40px';
        statusBox.style.left = '10px';
        statusBox.style.background = 'rgba(200, 0, 0, 0.8)';
        statusBox.style.color = 'white';
        statusBox.style.padding = '5px 10px';
        statusBox.style.borderRadius = '3px';
        statusBox.style.zIndex = '999998';
        statusBox.style.fontSize = '12px';
        statusBox.textContent = `Socket Error: ${error.message}`;
        if (!document.getElementById('socket-error-box')) {
            document.body.appendChild(statusBox);
        }
    });

    // Message receiver
    socket.on('receive-message', (data) => {
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            const messageDiv = document.createElement('div');
            
            const currentUser = JSON.parse(localStorage.getItem('stillhere_user'));
            messageDiv.className = currentUser && data.user === currentUser.username ? 'message user-message' : 'message other-message';

            messageDiv.innerHTML = `
                <span class="msg-author">${data.user || 'Someone'}</span>
                <span class="msg-text">${data.message}</span>
            `;

            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    });

    // Room closed by host notification
    socket.on('room-ended', () => {
        window.location.href = 'tables.html';
    });

    // Speak request permitted notification
    socket.on('chair-permitted', (data) => {
        const currentUser = JSON.parse(localStorage.getItem('stillhere_user'));
        if (currentUser && data.username === currentUser.username) {
            showToast("The host has permitted you to speak! You are now seated.");
        }
    });

    // Admin promotion notification
    socket.on('user-promoted-to-admin', (data) => {
        const currentUser = JSON.parse(localStorage.getItem('stillhere_user'));
        if (currentUser && data.username === currentUser.username) {
            showToast("You have been promoted to Host! You now have administrative privileges.");
        }
    });

    // Socket error messages
    socket.on('error-msg', (data) => {
        showToast(data.message);
    });

    // Real-time participant chair request (Only admins act on this)
    socket.on('chair-requested', (data) => {
        const currentUser = JSON.parse(localStorage.getItem('stillhere_user'));
        if (isAdminUser && currentUser && data.user.username !== currentUser.username) {
            showPermissionModal(data.user);
        }
    });

    // Active participants visible list updater
    socket.on('update-participants', (participants) => {
        renderParticipants(participants);
    });

    // Real-time audio stream chunk receiver
    socket.on('audio-chunk', (data) => {
        const currentUser = JSON.parse(localStorage.getItem('stillhere_user'));
        if (currentUser && data.username === currentUser.username) return;

        const floatArray = int16ToFloat(new Int16Array(data.chunk));
        const volume = calculateVolume(floatArray);
        markUserAsSpeaking(data.username, volume);

        playAudioChunk(floatArray, data.sampleRate);
    });

    // Real-time stage speak invitation receiver
    socket.on('speak-invitation-received', (data) => {
        const currentUser = JSON.parse(localStorage.getItem('stillhere_user'));
        if (currentUser && data.username === currentUser.username) {
            // Create a custom overlay modal for speak invitation accept/decline
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay active';
            overlay.id = 'speak-invite-modal';
            overlay.onclick = () => overlay.remove();

            const content = document.createElement('div');
            content.className = 'share-modal';
            content.onclick = (e) => e.stopPropagation();
            content.style.maxWidth = '350px';
            content.style.padding = '30px';
            content.style.textAlign = 'center';

            content.innerHTML = `
                <h3 style="font-size: 18px; margin-bottom: 20px; font-family: 'Inter', sans-serif; font-weight: 600;">Invite to Speak</h3>
                <p style="color: var(--text-secondary); margin-bottom: 25px; font-size: 14px;">The host has invited you to take a chair and speak. Do you want to go up?</p>
                <div style="display: flex; gap: 12px; width: 100%;">
                    <button class="modal-post-btn" id="accept-speak-btn" style="flex: 1; background: #39b59e; color: #fff;">Join Stage</button>
                    <button class="modal-post-btn" id="decline-speak-btn" style="flex: 1; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1);">Decline</button>
                </div>
            `;

            overlay.appendChild(content);
            document.body.appendChild(overlay);

            document.getElementById('accept-speak-btn').onclick = () => {
                socket.emit('accept-speak-invitation', {
                    roomId: currentRoomId,
                    username: currentUser.username
                });
                overlay.remove();
            };

            document.getElementById('decline-speak-btn').onclick = () => {
                socket.emit('decline-speak-invitation', {
                    roomId: currentRoomId,
                    username: currentUser.username
                });
                overlay.remove();
            };
        }
    });

    // Speak invitation declined notification to Host
    socket.on('speak-invitation-declined', (data) => {
        if (isAdminUser) {
            showToast(`${data.username} declined your invitation to speak.`);
        }
    });

    // Speaker demoted notification
    socket.on('speaker-demoted', (data) => {
        const currentUser = JSON.parse(localStorage.getItem('stillhere_user'));
        if (currentUser && data.username === currentUser.username) {
            showToast("You have been demoted to listener.");
            // Stop hardware microphone recording
            isMuted = true;
            stopMicCapture();
            updateMicBtnUI();
        }
    });
}

// Load tables list on tables.html
const loadActiveTables = async () => {
    const voiceGrid = document.getElementById('voice-rooms-grid');
    const chatGrid = document.getElementById('chat-rooms-grid');
    if (!voiceGrid && !chatGrid) return; // not on tables page

    try {
        const response = await fetch(`${CONFIG.API_URL}/api/tables?t=${Date.now()}`, {
            cache: 'no-store'
        });
        if (!response.ok) throw new Error("Failed to fetch rooms");
        const tables = await response.json();

        // Clear containers
        voiceGrid.innerHTML = '';
        chatGrid.innerHTML = '';

        const voiceTables = tables.filter(t => t.type === 'voice');
        const chatTables = tables.filter(t => t.type === 'chat');

        if (voiceTables.length === 0) {
            voiceGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary); background: var(--card-bg); border-radius: 20px; border: 1px dashed rgba(255, 255, 255, 0.1);">
                    <span class="material-symbols-outlined" style="font-size: 48px; margin-bottom: 10px; color: var(--accent); opacity: 0.7;">hearing</span>
                    <p>No active voice rooms right now. Start one to connect!</p>
                </div>
            `;
        } else {
            voiceTables.forEach(table => {
                const card = document.createElement('div');
                card.className = 'card table-card';
                card.onclick = () => { window.location.href = `room?id=${table._id}`; };
                card.innerHTML = `
                    <div class="table-card-header">
                        <h3>${escapeHTML(table.title)}</h3>
                        <span class="live-badge">Live</span>
                    </div>
                    <div class="table-host" style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 20px; background: ${table.hostColor || 'var(--accent)'}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1);">${table.hostAvatar || '👤'}</span>
                        <span>Hosted by <strong>${escapeHTML(table.hostName)}</strong></span>
                    </div>
                    <div class="table-stats">
                        <span>Dynamic room</span>
                        <span>Active</span>
                    </div>
                    <button class="join-room-btn">Join Room</button>
                `;
                voiceGrid.appendChild(card);
            });
        }

        if (chatTables.length === 0) {
            chatGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary); background: var(--card-bg); border-radius: 20px; border: 1px dashed rgba(255, 255, 255, 0.1);">
                    <span class="material-symbols-outlined" style="font-size: 48px; margin-bottom: 10px; color: var(--accent); opacity: 0.7;">chat_bubble</span>
                    <p>No active text rooms right now. Start one to reflect silently.</p>
                </div>
            `;
        } else {
            chatTables.forEach(table => {
                const card = document.createElement('div');
                card.className = 'card table-card';
                card.onclick = () => { window.location.href = `chat-room?id=${table._id}`; };
                card.innerHTML = `
                    <div class="table-card-header">
                        <h3>${escapeHTML(table.title)}</h3>
                        <span class="live-badge">Chat</span>
                    </div>
                    <div class="table-host" style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 20px; background: ${table.hostColor || 'var(--accent)'}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1);">${table.hostAvatar || '👤'}</span>
                        <span>Hosted by <strong>${escapeHTML(table.hostName)}</strong></span>
                    </div>
                    <div class="table-stats">
                        <span>Shared Silence</span>
                        <span>Active</span>
                    </div>
                    <button class="join-room-btn">Join Room</button>
                `;
                chatGrid.appendChild(card);
            });
        }
    } catch (err) {
        console.error("Failed to load active tables", err);
    }
};

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Modal control functions
window.openCreateRoomModal = (type) => {
    const modal = document.getElementById('create-room-modal-overlay');
    const typeInput = document.getElementById('room-type-input');
    const titleHeader = document.getElementById('create-room-modal-title');
    
    if (modal && typeInput && titleHeader) {
        typeInput.value = type;
        titleHeader.textContent = type === 'voice' ? 'Start a new Voice Room' : 'Start a Text-Only Room';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

window.closeCreateRoomModal = (e) => {
    if (e) e.stopPropagation();
    const modal = document.getElementById('create-room-modal-overlay');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        document.getElementById('room-title-input').value = '';
    }
};

window.submitCreateRoom = async () => {
    const titleInput = document.getElementById('room-title-input');
    const typeInput = document.getElementById('room-type-input');
    const title = titleInput.value.trim();
    const type = typeInput.value;

    if (!title) {
        alert("Please enter a room title.");
        return;
    }

    try {
        const response = await fetch(`${CONFIG.API_URL}/api/tables`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('stillhere_token')}`
            },
            body: JSON.stringify({ title, type })
        });

        if (response.ok) {
            const table = await response.json();
            closeCreateRoomModal();
            const targetPage = type === 'voice' ? 'room' : 'chat-room';
            window.location.href = `${targetPage}?id=${table._id}`;
        } else {
            const data = await response.json();
            alert(data.error || "Failed to create room. Make sure you are logged in.");
        }
    } catch (err) {
        console.error("Failed to create room", err);
        alert("Error connecting to backend server.");
    }
};

// Dynamic Room Details & Leave/End Action
let currentRoomId = null;
let currentRoomHostId = null;
let isAdminUser = false; // Reliable global flag for admin checks

const loadRoomDetails = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('id');
    
    // Redirect if direct navigation to room page without ID parameter
    const isRoomPage = !!document.getElementById('modal-table-title');
    if (!roomId && isRoomPage) {
        window.location.href = 'tables.html';
        return;
    }
    if (!roomId) return;

    currentRoomId = roomId;

    try {
        const response = await fetch(`${CONFIG.API_URL}/api/tables/${roomId}`);
        if (!response.ok) {
            alert("This room does not exist or has been ended.");
            window.location.href = 'tables.html';
            return;
        }

        const room = await response.json();
        currentRoomHostId = room.hostId;

        const roomTitleEl = document.getElementById('modal-table-title');
        const roomHostEl = document.getElementById('modal-table-host');

        if (roomTitleEl) roomTitleEl.textContent = room.title;
        document.title = `${room.title} — StillHere`;
        if (roomHostEl) {
            if (window.location.pathname.includes('chat-room')) {
                roomHostEl.textContent = `Text-only space for shared silence. Hosted by ${room.hostName}.`;
            } else {
                roomHostEl.textContent = room.hostName;
            }
        }

        const currentUser = JSON.parse(localStorage.getItem('stillhere_user'));
        const leaveBtn = document.getElementById('leave-room-action-btn');
        const isHost = currentUser && room.hostName === currentUser.username;
        
        let userIsSpeaker = isHost;
        let userIsAdmin = isHost;

        // Retrieve persisted role for this room
        const storedRole = safeStorage.getItem(`stillhere_role_${roomId}`);
        if (storedRole === 'host') {
            userIsAdmin = true;
            userIsSpeaker = true;
        } else if (storedRole === 'speaker') {
            userIsSpeaker = true;
        }

        // Connect socket and register in the room
        if (socket) {
            socket.emit('join-room', {
                roomId,
                user: {
                    username: currentUser ? currentUser.username : 'Guest',
                    avatar: currentUser ? currentUser.avatar : '👤',
                    color: currentUser ? currentUser.color : '#ccc',
                    isSpeaker: userIsSpeaker,
                    isAdmin: userIsAdmin
                }
            });
        }

    } catch (err) {
        console.error("Error loading room details", err);
    }
};

const renderParticipants = (participants) => {
    const currentUser = JSON.parse(localStorage.getItem('stillhere_user'));
    
    // Find current participant data
    const currentParticipant = participants.find(u => u.username === currentUser?.username);
    const currentUserIsAdmin = currentParticipant?.isAdmin || false;
    isAdminUser = currentUserIsAdmin;

    // Persist current user's role to safeStorage
    if (currentUser && currentRoomId && currentParticipant) {
        if (currentParticipant.isAdmin) {
            safeStorage.setItem(`stillhere_role_${currentRoomId}`, 'host');
        } else if (currentParticipant.isSpeaker) {
            safeStorage.setItem(`stillhere_role_${currentRoomId}`, 'speaker');
        } else {
            safeStorage.removeItem(`stillhere_role_${currentRoomId}`);
        }
    }

    // Toggle mic button based on speaker/admin status
    const micBtn = document.getElementById('mic-toggle-btn');
    if (micBtn) {
        const isSpeakerOrAdmin = currentParticipant?.isSpeaker || currentParticipant?.isAdmin;
        micBtn.style.display = isSpeakerOrAdmin ? 'flex' : 'none';
        if (isSpeakerOrAdmin) {
            updateMicBtnUI();
        }
    }

    // Update leave room button label (always displays Leave)
    const leaveBtn = document.getElementById('leave-room-action-btn');
    if (leaveBtn) {
        leaveBtn.innerHTML = '<span class="material-symbols-outlined ctrl-icon">call_end</span> Leave';
        leaveBtn.title = "Leave Room";
    }

    // Update speaker grid dynamically
    const speakerGrid = document.querySelector('.speaker-grid');
    if (speakerGrid) {
        speakerGrid.innerHTML = '';
        
        // Find speakers (either marked speaker or host/admin) and sort by original join order
        const speakers = participants
            .filter(u => u.isSpeaker || u.isAdmin)
            .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
        speakers.forEach(sp => {
            const isCurrentUser = currentUser && sp.username === currentUser.username;
            const activeSpeakingClass = isCurrentUser ? 'active-speaker' : '';
            
            let onClickStr = '';
            // If current user is host/admin, they can click on non-admin speakers to open actions
            if (currentUserIsAdmin && sp.username !== currentUser?.username) {
                onClickStr = `onclick="showParticipantActions(event, '${sp.username}', true, ${sp.isAdmin})"`;
            }

            speakerGrid.innerHTML += `
                <div class="speaker-item ${activeSpeakingClass}" data-username="${sp.username}" ${onClickStr} style="cursor: ${onClickStr ? 'pointer' : 'default'}">
                    <div class="crown ${sp.isAdmin ? '' : 'hidden'}">👑</div>
                    <div class="speaker-avatar" style="background: ${sp.color || '#39b59e'};">
                        <span class="avatar-emoji">${sp.avatar || '🦊'}</span>
                    </div>
                    <div class="speaker-name">${escapeHTML(sp.username === currentUser?.username ? 'You' : sp.username)}</div>
                    <div class="speaker-lang">${sp.isAdmin ? 'Host' : 'Speaker'}</div>
                </div>
            `;
        });

    }

    // Update listeners scroll area dynamically
    const listenerScroll = document.querySelector('.listener-scroll');
    if (listenerScroll) {
        const isSpeakerOrAdmin = currentParticipant?.isSpeaker || currentParticipant?.isAdmin;
        let listenerInnerHTML = `
            <div class="listener-item invite-btn" style="cursor: pointer;" onclick="inviteOthers()">
                <div class="listener-avatar invite-avatar">
                    +
                </div>
                <div class="listener-name">Invite</div>
                <div class="listener-lang" style="opacity:0">-</div>
            </div>
        `;

        // Render "Ask Chair" button beside invite button for listeners in voice rooms
        if (!isSpeakerOrAdmin && !window.location.pathname.includes('chat-room')) {
            listenerInnerHTML += `
                <div class="listener-item chair-btn" style="cursor: pointer;" onclick="requestChair(this)">
                    <div class="listener-avatar chair-avatar" style="background: rgba(255,255,255,0.05); border: 1px dashed rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center;">
                        🪑
                    </div>
                    <div class="listener-name">Ask Chair</div>
                    <div class="listener-lang" style="opacity:0">-</div>
                </div>
            `;
        }
        listenerScroll.innerHTML = listenerInnerHTML;

        // Get listener list sorted by original join order
        const listeners = participants
            .filter(u => !u.isSpeaker && !u.isAdmin)
            .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
        listeners.forEach(li => {
            let onClickStr = '';
            // If current user is host/admin, clicking on listener profile opens participant options
            if (currentUserIsAdmin && li.username !== currentUser?.username) {
                onClickStr = `onclick="showParticipantActions(event, '${li.username}', false, ${li.isAdmin})"`;
            }

            listenerScroll.innerHTML += `
                <div class="listener-item" ${onClickStr} style="cursor: ${onClickStr ? 'pointer' : 'default'}">
                    <div class="listener-avatar" style="background: ${li.color || '#f8dfb1'};">
                        <span class="avatar-emoji">${li.avatar || '👱‍♀️'}</span>
                    </div>
                    <div class="listener-name">${escapeHTML(li.username === currentUser?.username ? 'You' : li.username)}</div>
                    <div class="listener-lang">Listener</div>
                </div>
            `;
        });
    }

    // Update online header count
    const chatCount = document.querySelector('.chat-count');
    if (chatCount) {
        const isChatOnly = window.location.pathname.includes('chat-room');
        if (isChatOnly) {
            chatCount.textContent = `${participants.length} member${participants.length !== 1 ? 's' : ''}`;
        } else {
            chatCount.textContent = `${participants.length} online`;
        }
    }
};

window.leaveOrEndRoom = () => {
    if (socket && socket.connected && currentRoomId) {
        socket.emit('leave-room', { roomId: currentRoomId });
    }
    window.location.href = 'tables.html';
};

// Custom non-blocking Toast notification helper
const showToast = (message) => {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.background = 'rgba(57, 181, 158, 0.95)';
    toast.style.color = '#fff';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '30px';
    toast.style.zIndex = '1000000';
    toast.style.fontSize = '14px';
    toast.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
    toast.style.fontFamily = "'Inter', sans-serif";
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
    toast.textContent = message;

    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 10);

    // Animate out and remove
    setTimeout(() => {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Request speaker chair seating
window.requestChair = (chairElement) => {
    const currentUser = JSON.parse(localStorage.getItem('stillhere_user'));
    if (!currentUser) return;

    // Create a beautiful custom confirmation modal
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'chair-confirm-modal';
    overlay.onclick = () => overlay.remove();

    const content = document.createElement('div');
    content.className = 'share-modal';
    content.onclick = (e) => e.stopPropagation();
    content.style.maxWidth = '350px';
    content.style.padding = '30px';
    content.style.textAlign = 'center';

    content.innerHTML = `
        <h3 style="font-size: 18px; margin-bottom: 20px; font-family: 'Inter', sans-serif; font-weight: 600;">Request to Speak?</h3>
        <p style="color: var(--text-secondary); margin-bottom: 25px; font-size: 14px;">Would you like to ask the host for permission to take a chair and speak?</p>
        <div style="display: flex; gap: 12px; width: 100%;">
            <button class="modal-post-btn" id="confirm-chair-btn" style="flex: 1; background: #39b59e; color: #fff;">Request</button>
            <button class="modal-post-btn" id="cancel-chair-btn" style="flex: 1; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1);">Cancel</button>
        </div>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    document.getElementById('confirm-chair-btn').onclick = () => {
        socket.emit('request-chair', {
            roomId: currentRoomId,
            user: currentUser
        });
        overlay.remove();
        
        // Show success toast
        showToast("Request sent to host. Please wait for approval...");
    };

    document.getElementById('cancel-chair-btn').onclick = () => {
        overlay.remove();
    };
};

// Render admin permission overlay for speaking requests
const showPermissionModal = (user) => {
    if (document.getElementById('request-permission-modal')) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'request-permission-modal';
    overlay.onclick = () => overlay.remove();
    
    const content = document.createElement('div');
    content.className = 'share-modal';
    content.onclick = (e) => e.stopPropagation();
    content.style.maxWidth = '350px';
    content.style.padding = '30px';
    content.style.textAlign = 'center';
    
    content.innerHTML = `
        <h3 style="font-size: 18px; margin-bottom: 20px; font-family: 'Inter', sans-serif; font-weight: 600;">Speaker Request</h3>
        <p style="color: var(--text-secondary); margin-bottom: 25px; font-size: 14px;"><strong>${escapeHTML(user.username)}</strong> wants permission to sit in a chair and speak.</p>
        <div style="display: flex; gap: 12px; width: 100%;">
            <button class="modal-post-btn" id="permit-request-btn" style="flex: 1; background: #39b59e; color: #fff;">Permit</button>
            <button class="modal-post-btn" id="deny-request-btn" style="flex: 1; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1);">Deny</button>
        </div>
    `;
    
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    document.getElementById('permit-request-btn').onclick = () => {
        socket.emit('permit-chair', { roomId: currentRoomId, username: user.username });
        overlay.remove();
    };
    
    document.getElementById('deny-request-btn').onclick = () => {
        overlay.remove();
    };
};

// Render custom action menu for hosts/admins to manage participants
window.showParticipantActions = (event, username, isAlreadySpeaker, isAdmin) => {
    if (event) event.stopPropagation();
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'actions-modal';
    overlay.onclick = () => overlay.remove();
    
    const content = document.createElement('div');
    content.className = 'share-modal';
    content.onclick = (e) => e.stopPropagation();
    content.style.maxWidth = '350px';
    content.style.padding = '30px';
    content.style.textAlign = 'center';
    
    let demoteButtonHtml = '';
    if (isAlreadySpeaker && !isAdmin) {
        demoteButtonHtml = `<button class="modal-post-btn" id="demote-speaker-action" style="width: 100%; background: #ff5252; color: #fff; border: 1px solid rgba(255,82,82,0.2);">Move to Listen Only ⬇️</button>`;
    }

    content.innerHTML = `
        <h3 style="font-size: 18px; margin-bottom: 20px; font-family: 'Inter', sans-serif; font-weight: 600;">Manage ${escapeHTML(username)}</h3>
        <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
            ${!isAdmin ? `<button class="modal-post-btn" id="promote-admin-action" style="width: 100%;">Make Host 👑</button>` : ''}
            ${!isAlreadySpeaker ? `
                <button class="modal-post-btn" id="give-chair-action" style="width: 100%; background: #39b59e; color: #fff;">Invite to Speak 🪑</button>
            ` : ''}
            ${demoteButtonHtml}
            <button class="modal-post-btn" id="cancel-action" style="width: 100%; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1);">Cancel</button>
        </div>
    `;
    
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    if (document.getElementById('promote-admin-action')) {
        document.getElementById('promote-admin-action').onclick = () => {
            socket.emit('make-admin', { roomId: currentRoomId, username });
            overlay.remove();
        };
    }
    
    if (document.getElementById('give-chair-action')) {
        document.getElementById('give-chair-action').onclick = () => {
            socket.emit('invite-to-speak', { roomId: currentRoomId, username });
            showToast(`Invitation sent to ${username}`);
            overlay.remove();
        };
    }

    if (document.getElementById('demote-speaker-action')) {
        document.getElementById('demote-speaker-action').onclick = () => {
            socket.emit('demote-speaker', { roomId: currentRoomId, username });
            overlay.remove();
        };
    }
    
    document.getElementById('cancel-action').onclick = () => {
        overlay.remove();
    };
};

// Clipboard-copy link sharing for invitations
window.inviteOthers = () => {
    const roomUrl = window.location.href;
    navigator.clipboard.writeText(roomUrl).then(() => {
        showToast("Invite link copied to clipboard!");
    }).catch(err => {
        console.error("Could not copy invite link", err);
        alert("Failed to copy link automatically. Please copy the URL from your address bar: " + roomUrl);
    });
};

// Chat Logic
window.sendChatMessage = () => {
    const input = document.getElementById('chat-input');
    const messageText = input.value.trim();

    if (messageText === '' || !socket) return;

    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('id') || window.location.pathname.split('/').pop() || 'lobby';

    const currentUser = JSON.parse(localStorage.getItem('stillhere_user'));

    socket.emit('send-message', {
        roomId,
        message: messageText,
        user: currentUser ? currentUser.username : 'Someone'
    });

    input.value = '';
};

// Chat Toggle Logic
window.toggleChat = () => {
    const chatPanel = document.getElementById('chat-panel');
    chatPanel.classList.toggle('active');
};

// Microphone Toggle & Voice Streaming Logic
let isMuted = true; // Start muted by default
let micStream = null;
let audioSource = null;
let audioProcessor = null;
let audioContext = null;

let playAudioContext = null;
let nextPlayTime = 0;

// Speaking active volume indicators & helpers
const calculateVolume = (floatArray) => {
    let sumSquares = 0;
    for (let i = 0; i < floatArray.length; i++) {
        sumSquares += floatArray[i] * floatArray[i];
    }
    return Math.sqrt(sumSquares / floatArray.length);
};

const speakingTimeoutMap = new Map();

const highlightSpeakerActive = (username, isSpeaking) => {
    const speakerEl = document.querySelector(`.speaker-item[data-username="${username}"]`);
    if (speakerEl) {
        if (isSpeaking) {
            speakerEl.classList.add('speaking-active');
        } else {
            speakerEl.classList.remove('speaking-active');
        }
    }
};

const markUserAsSpeaking = (username, volume) => {
    const threshold = 0.015; // Noise threshold
    if (volume < threshold) return;

    highlightSpeakerActive(username, true);

    if (speakingTimeoutMap.has(username)) {
        clearTimeout(speakingTimeoutMap.get(username));
    }

    const timeoutId = setTimeout(() => {
        highlightSpeakerActive(username, false);
        speakingTimeoutMap.delete(username);
    }, 400); // Glow decay window of 400ms

    speakingTimeoutMap.set(username, timeoutId);
};

// Conversion helpers
const floatArrayToInt16 = (floatArray) => {
    const int16Array = new Int16Array(floatArray.length);
    for (let i = 0; i < floatArray.length; i++) {
        const s = Math.max(-1, Math.min(1, floatArray[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
};

const int16ToFloat = (int16Array) => {
    const floatArray = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
        floatArray[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7FFF);
    }
    return floatArray;
};

const playAudioChunk = (floatArray, sampleRate) => {
    try {
        if (!playAudioContext) {
            playAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (playAudioContext.state === 'suspended') {
            playAudioContext.resume();
        }

        const audioBuffer = playAudioContext.createBuffer(1, floatArray.length, sampleRate);
        audioBuffer.getChannelData(0).set(floatArray);

        const source = playAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(playAudioContext.destination);

        const currentTime = playAudioContext.currentTime;
        if (nextPlayTime < currentTime) {
            nextPlayTime = currentTime;
        }
        source.start(nextPlayTime);
        nextPlayTime += audioBuffer.duration;
    } catch (err) {
        console.error("Error playing audio chunk", err);
    }
};

const startMicCapture = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream = stream;

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioSource = audioContext.createMediaStreamSource(stream);
        
        // 2048 samples, 1 input channel, 1 output channel
        audioProcessor = audioContext.createScriptProcessor(2048, 1, 1);
        
        audioProcessor.onaudioprocess = (event) => {
            if (isMuted) return;

            const inputData = event.inputBuffer.getChannelData(0);
            const volume = calculateVolume(inputData);
            
            const currentUser = JSON.parse(localStorage.getItem('stillhere_user'));
            if (currentUser) {
                markUserAsSpeaking(currentUser.username, volume);
            }

            const int16Array = floatArrayToInt16(inputData);
            
            if (socket && socket.connected) {
                socket.emit('audio-chunk', {
                    roomId: currentRoomId,
                    username: currentUser ? currentUser.username : 'Guest',
                    chunk: int16Array.buffer,
                    sampleRate: audioContext.sampleRate
                });
            }
        };

        audioSource.connect(audioProcessor);
        audioProcessor.connect(audioContext.destination);
        console.log("Microphone capture started");
        showToast("Microphone turned on");
    } catch (err) {
        console.error("Error accessing microphone:", err);
        showToast("Error: Could not access microphone.");
        isMuted = true;
        updateMicBtnUI();
    }
};

const stopMicCapture = () => {
    if (audioProcessor) {
        audioProcessor.disconnect();
        audioProcessor = null;
    }
    if (audioSource) {
        audioSource.disconnect();
        audioSource = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
        micStream = null;
    }
    console.log("Microphone capture stopped");
    showToast("Microphone muted");
};

const updateMicBtnUI = () => {
    const micBtn = document.getElementById('mic-toggle-btn');
    if (micBtn) {
        if (isMuted) {
            micBtn.classList.add('muted');
            micBtn.innerHTML = '<span class="material-symbols-outlined ctrl-icon">mic_off</span>';
            micBtn.title = "Turn on microphone";
        } else {
            micBtn.classList.remove('muted');
            micBtn.innerHTML = '<span class="material-symbols-outlined ctrl-icon">mic</span>';
            micBtn.title = "Turn off microphone";
        }
    }
};

window.toggleMic = () => {
    isMuted = !isMuted;
    updateMicBtnUI();
    if (isMuted) {
        stopMicCapture();
    } else {
        startMicCapture();
    }
};

// Initialization on DOM load
document.addEventListener('DOMContentLoaded', () => {
    loadActiveTables();
    loadRoomDetails();
});
