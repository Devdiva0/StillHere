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

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();

        if (email === "") {
            formMessage.textContent = "Please enter a valid email address.";
            formMessage.style.color = "#ff9999";
            formMessage.classList.remove("hidden");
        } else {
            formMessage.textContent = "Thank you. We are still here with you.";
            formMessage.style.color = "#a0d2ab";
            formMessage.classList.remove("hidden");
            emailInput.value = "";

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

window.submitModalPost = () => {
    const input = document.getElementById('modal-moment-input');
    const text = input.value.trim();
    if (!text && !modalMediaData) return;

    const newPostData = {
        name: "Fox",
        avatar: "🦊",
        color: "#39b59e",
        time: "Just now",
        text: text,
        media: modalMediaData ? modalMediaData.url : null,
        mediaType: modalMediaData ? modalMediaData.type : null,
        count: 0
    };

    // Save to localStorage
    const savedPosts = JSON.parse(localStorage.getItem('stillhere_posts') || '[]');
    savedPosts.unshift(newPostData);
    localStorage.setItem('stillhere_posts', JSON.stringify(savedPosts));

    // If on home page, update feed immediately
    const homeFeed = document.getElementById('home-moments-feed');
    if (homeFeed) {
        // Find createPostElement if it's already defined or accessible
        // In script.js it is currently inside a conditional block. I should move it to global scope.
        if (typeof createPostElement === 'function') {
            homeFeed.insertBefore(createPostElement(newPostData), homeFeed.firstChild);
        } else {
            // Reload page or manually prepend if function not found
            location.reload();
        }
    }

    closeShareModal();
    alert("Moment shared to the quiet.");
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

    post.innerHTML = `
        <div class="post-header">
            <div class="post-avatar" style="background: ${postData.color};">${postData.avatar}</div>
            <div class="post-info">
                <span class="post-name">${postData.name}</span>
                <span class="post-time">${postData.time}</span>
            </div>
        </div>
        <div class="post-content">
            <p class="post-text">${postData.text}</p>
            ${mediaHtml}
        </div>
        <div class="post-actions">
            <button class="support-btn" onclick="toggleSupport(this, ${postData.count})">
                <span class="icon">👍</span>
                <span class="support-text">Support</span>
                <span class="support-count">・ ${postData.count}</span>
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

    // Load saved posts from localStorage first
    const savedPosts = JSON.parse(localStorage.getItem('stillhere_posts') || '[]');
    savedPosts.forEach(postData => {
        homeFeed.insertBefore(window.createPostElement(postData), homeFeed.firstChild);
    });

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

// Scroll Reveal Animations
const revealElements = document.querySelectorAll(".reveal, .reveal-stagger");

const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("active");
            // Optional: stop observing once revealed
            observer.unobserve(entry.target);
        }
    });
};

const revealOptions = {
    threshold: 0.15, // Trigger when 15% visible
    rootMargin: "0px 0px -50px 0px" // Trigger slightly before it comes fully into view
};

const revealObserver = new IntersectionObserver(revealCallback, revealOptions);

revealElements.forEach((el, index) => {
    // Add staggered delay for child elements
    if (el.classList.contains("reveal-stagger")) {
        el.style.transitionDelay = `${index * 0.1}s`;
    }
    revealObserver.observe(el);
});

/* ====================================
   TABLES & VOICE ROOM LOGIC
==================================== */
// Requesting to sit in an empty chair
window.requestChair = (chairElement) => {
    // You would normally check permissions / fire a request to host here
    const confirmed = confirm("Request permission from the Host to speak at this table?");
    if (confirmed) {
        // Simulate being accepted into the seat
        chairElement.classList.remove("empty");
        chairElement.classList.add("occupied");
        chairElement.textContent = "";
        chairElement.setAttribute("data-tooltip", "You");
        chairElement.onclick = null; // Can't request it again
        alert("The host allowed you to join the table! You are now speaking.");
    }
};
// Chat Logic
window.sendChatMessage = () => {
    const input = document.getElementById('chat-input');
    const messageText = input.value.trim();

    if (messageText === '') return;

    const messagesContainer = document.getElementById('chat-messages');

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';

    // Defaulting to "You" for the currently active user
    messageDiv.innerHTML = `
        <span class="msg-author">You</span>
        <span class="msg-text">${messageText}</span>
    `;

    messagesContainer.appendChild(messageDiv);

    // Clear input
    input.value = '';

    // Auto-scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
};

// Chat Toggle Logic
window.toggleChat = () => {
    const chatPanel = document.getElementById('chat-panel');
    chatPanel.classList.toggle('active');
};

// Microphone Toggle Logic
let isMuted = false;
window.toggleMic = () => {
    isMuted = !isMuted;
    const micBtn = document.getElementById('mic-toggle-btn');
    if (isMuted) {
        micBtn.classList.add('muted');
        micBtn.innerHTML = '<span class="material-symbols-outlined ctrl-icon">mic_off</span>';
    } else {
        micBtn.classList.remove('muted');
        micBtn.innerHTML = '<span class="material-symbols-outlined ctrl-icon">mic</span>';
    }
};
