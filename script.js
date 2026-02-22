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
