// Firebase setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBbQ-a33eeKOjUbzn1uV829qMOmJ1hJyCg",
  authDomain: "gyanmanthan-comments.firebaseapp.com",
  projectId: "gyanmanthan-comments",
  storageBucket: "gyanmanthan-comments.firebasestorage.app",
  messagingSenderId: "962442889849",
  appId: "1:962442889849:web:c095a81f051f8e94c062a8"
};

// Initialize Firebase (Ek hi baar initialize karna hai)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Local Emulator Connection (Agar local chala rahe hain)
if (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") {
    try {
        connectFirestoreEmulator(db, "127.0.0.1", 8080);
        console.log("Connected to Local Firestore Emulator 🚀");
    } catch (e) {
        console.log("Emulator already connected or error:", e);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const loginButtons = document.getElementById('login-buttons');
    const commentForm = document.getElementById('comment-form');
    const postCommentBtn = document.getElementById('post-comment');
    const commentInput = document.getElementById('comment-input');
    const commentsList = document.getElementById('comments-list');
    const logoutBtn = document.getElementById('logout-btn');

    const pageId = window.location.pathname.replace(/\//g,'_'); // unique page identifier
    const pageCommentsCol = collection(db, 'comments', pageId, 'items');

    // Login events
    const googleLoginBtn = document.getElementById('google-login');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => signInWithPopup(auth, new GoogleAuthProvider()));
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                console.log("Logged out successfully!");
            }).catch(err => {
                console.error("Logout error:", err);
            });
        });
    }

    // Auth state listener
    onAuthStateChanged(auth, user => {
        if (user) { 
            if(loginButtons) loginButtons.style.display = 'none';
            if(commentForm) commentForm.style.display = 'block';
            if(logoutBtn) logoutBtn.style.display = 'inline-block';
        } else { 
            if(loginButtons) loginButtons.style.display = 'flex';
            if(commentForm) commentForm.style.display = 'none';
            if(logoutBtn) logoutBtn.style.display = 'none';
        }
    });

    // Post comment
    if (postCommentBtn) {
        postCommentBtn.addEventListener('click', async () => {
            const text = commentInput.value.trim();
            const user = auth.currentUser;
            if (text && user) {
                await addDoc(pageCommentsCol, {
                    uid: user.uid,
                    name: user.displayName,
                    comment: text,
                    timestamp: serverTimestamp()
                });
                commentInput.value = '';
            }
        });
    }

    // Load comments with date & time
    if (commentsList) {
        const q = query(pageCommentsCol, orderBy('timestamp', 'asc'));
        commentsList.innerHTML = "Be the first to comment 👇";

        setTimeout(() => {
            onSnapshot(q, snapshot => {
                commentsList.innerHTML = '';
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const div = document.createElement('div');
                    div.classList.add('comment-item');

                    let time = '';
                    if (data.timestamp) {
                        const date = data.timestamp.toDate();
                        time = date.toLocaleString();
                    }

                    div.innerHTML = `<strong>${data.name}</strong> <span class="comment-time">(${time})</span><p>${data.comment}</p>`;
                    commentsList.appendChild(div);
                });
            });
        }, 800);
    }

    // Social share links
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    document.querySelectorAll("[data-share]").forEach(link => {
        const type = link.dataset.share;
        if (type === "whatsapp") link.href = `https://wa.me/?text=${url}`;
        if (type === "facebook") link.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        if (type === "twitter") link.href = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        if (type === "linkedin") link.href = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`;
    });
});

// Zoom effect on images
document.querySelectorAll(".zoomable").forEach(img => {
  img.addEventListener("click", () => {
    const overlay = document.createElement("div");
    overlay.classList.add("zoom-overlay");

    const zoomedImg = document.createElement("img");
    zoomedImg.src = img.src;

    overlay.appendChild(zoomedImg);
    document.body.appendChild(overlay);

    setTimeout(() => overlay.classList.add("show"), 10);

    overlay.addEventListener("click", () => {
      overlay.classList.remove("show");
      setTimeout(() => overlay.remove(), 300);
    });
  });
});

// Alert countdown
const countdownEl = document.getElementById("countdown");
const deadline = new Date("2026-04-10T23:59:59").getTime();

if (countdownEl) {
  setInterval(() => {
    const now = new Date().getTime();
    const gap = deadline - now;

    if (gap <= 0) {
      const topAlert = document.getElementById("topAlert");
      if (topAlert) topAlert.style.display = "none";
      const header = document.querySelector("header");
      if (header) header.style.top = "0px";
      return;
    }

    const days = Math.floor(gap / (1000*60*60*24));
    const hours = Math.floor((gap / (1000*60*60)) % 24);
    const minutes = Math.floor((gap / (1000*60)) % 60);

    countdownEl.innerHTML = `⏳ ${days}d ${hours}h ${minutes}m`;
  }, 1000);
}

// Intersection Observer for media blocks
const mediaBlocks = document.querySelectorAll('.media-block');
if (mediaBlocks.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    mediaBlocks.forEach(block => observer.observe(block));
}

// Article progress bar
document.addEventListener("DOMContentLoaded", function () {
    const progressBar = document.getElementById("article-progress-bar");
    const article = document.getElementById("rightContent");

    if (!progressBar || !article) return;

    function updateArticleProgress() {
        const scrollTop = article.scrollTop;
        const scrollableHeight = article.scrollHeight - article.clientHeight;

        if (scrollableHeight <= 0) {
            progressBar.style.width = "0%";
            return;
        }

        const progress = (scrollTop / scrollableHeight) * 100;
        progressBar.style.width = Math.min(100, Math.max(0, progress)) + "%";
    }

    article.addEventListener("scroll", updateArticleProgress, { passive: true });
    window.addEventListener("resize", updateArticleProgress);
    updateArticleProgress();
});