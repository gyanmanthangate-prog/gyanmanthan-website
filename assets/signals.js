// Firebase setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBbQ-a33eeKOjUbzn1uV829qMOmJ1hJyCg",
  authDomain: "gyanmanthan-comments.firebaseapp.com",
  projectId: "gyanmanthan-comments",
  storageBucket: "gyanmanthan-comments.firebasestorage.app",
  messagingSenderId: "962442889849",
  appId: "1:962442889849:web:c095a81f051f8e94c062a8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

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
    document.getElementById('google-login').addEventListener('click', ()=> signInWithPopup(auth, new GoogleAuthProvider()));
    // document.getElementById('facebook-login').addEventListener('click', ()=> signInWithPopup(auth, new FacebookAuthProvider()));

    // Logout
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(()=>{
            console.log("Logged out successfully!");
        }).catch(err=>{
            console.error("Logout error:", err);
        });
    });

    // Auth state listener
    onAuthStateChanged(auth, user=>{
        if(user){ 
            loginButtons.style.display = 'none';
            commentForm.style.display = 'block';
            logoutBtn.style.display = 'inline-block';
        } else { 
            loginButtons.style.display = 'flex';
            commentForm.style.display = 'none';
            logoutBtn.style.display = 'none';
        }
    });

    // Post comment
    postCommentBtn.addEventListener('click', async ()=>{
        const text = commentInput.value.trim();
        const user = auth.currentUser;
        if(text && user){
            await addDoc(pageCommentsCol, {
                uid: user.uid,
                name: user.displayName,
                comment: text,
                timestamp: serverTimestamp()
            });
            commentInput.value='';
        }
    });

    // Load comments with date & time
    const q = query(pageCommentsCol, orderBy('timestamp','asc'));
    commentsList.innerHTML = "Be the first to comment 👇";

setTimeout(() => {
  onSnapshot(q, snapshot=>{
    commentsList.innerHTML='';
    snapshot.forEach(doc=>{
      const data = doc.data();
      const div = document.createElement('div');
      div.classList.add('comment-item');

      let time = '';
      if(data.timestamp){
        const date = data.timestamp.toDate();
        time = date.toLocaleString();
      }

      div.innerHTML = `<strong>${data.name}</strong> <span class="comment-time">(${time})</span><p>${data.comment}</p>`;
      commentsList.appendChild(div);
    });
  });
}, 800); // 0.8 sec delay

    // Social share links
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    document.querySelectorAll("[data-share]").forEach(link => {
        const type = link.dataset.share;
        if(type === "whatsapp") link.href = `https://wa.me/?text=${url}`;
        if(type === "facebook") link.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        if(type === "twitter") link.href = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        if(type === "linkedin") link.href = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`;
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

    // trigger animation
    setTimeout(() => overlay.classList.add("show"), 10);

    overlay.addEventListener("click", () => {
      overlay.classList.remove("show");
      setTimeout(() => overlay.remove(), 300);
    });
  });
});

// Alert countdown
const CONFIG = {
  SHOW_ALERT: false,
  SHOW_COUNTDOWN: false,
  DEADLINE: "2026-04-10T23:59:59"
};
const deadline = new Date("2026-04-10T23:59:59").getTime();

const countdownEl = document.getElementById("countdown");

if(countdownEl){
  setInterval(() => {

    const now = new Date().getTime();
    const gap = deadline - now;

    if(gap <= 0){
 document.getElementById("topAlert").style.display = "none";

  document.querySelector("header").style.top = "0px";
  return;
    }

    const days = Math.floor(gap / (1000*60*60*24));
    const hours = Math.floor((gap / (1000*60*60)) % 24);
    const minutes = Math.floor((gap / (1000*60)) % 60);

    countdownEl.innerHTML = `⏳ ${days}d ${hours}h ${minutes}m`;

  }, 1000);
}