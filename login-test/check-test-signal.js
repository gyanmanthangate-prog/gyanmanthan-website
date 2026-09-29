import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, doc, setDoc, getDoc, collection, query, where, orderBy, getDocs, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

(function () {
  "use strict";

  // 1. Firebase Configuration Object
  const firebaseConfig = {
    apiKey: "AIzaSyBbQ-a33eeKOjUbzn1uV829qMOmJ1hJyCg",
    authDomain: "gyanmanthan-comments.firebaseapp.com",
    projectId: "gyanmanthan-comments",
    storageBucket: "gyanmanthan-comments.firebasestorage.app",
    messagingSenderId: "962442889849",
    appId: "1:962442889849:web:c095a81f051f8e94c062a8"
  };

  // 2. Initialize Firebase App, Firestore & Auth
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  const examApp = document.getElementById("examApp");
  const instructionsBox = document.getElementById("instructionsBox") || document.getElementById("instructions");
  const instructionsContent = document.getElementById("instructionsContent");
const timerBox = document.getElementById("timer");
const timerEl = timerBox;

  const params = new URLSearchParams(window.location.search);
  const testId = params.get("test") || "signal-1";

  let data = { questions: [] };
  let current = 0;
  let answers = {};
  let marked = {};
  let timeLeft = 300;
  let timerInterval = null;
  let currentUser = null;
  let savedAttemptData = null; // Store fetched result for review mode
  let isReviewing = false;     // Track if user is in review mode

  /* ---------------- LEADERBOARD & ATTEMPT CHECK ---------------- */
  async function checkAttemptAndLoadLeaderboard(user) {
    const statusBox = document.getElementById("attemptStatusBox");
    const userUid = user ? user.uid : localStorage.getItem("userUid");

    if (userUid) {
      const docId = `${testId}_${userUid}`;
      try {
        const docSnap = await getDoc(doc(db, "test_results", docId));
        if (docSnap.exists()) {
          savedAttemptData = docSnap.data();

          // Hide timer on initial attempt match
          if (timerEl) timerEl.style.display = "none";

          // Hide inner content box if present
          if (instructionsContent) instructionsContent.style.display = "none";

          if (statusBox) {
            statusBox.innerHTML = `
              <div style="padding:20px; background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; border-radius:12px; margin:15px 0; text-align:center;">
                <div style="font-size:20px; font-weight:700; margin-bottom:6px;">You have already attempted this test!</div>
                <div style="font-size:16px; margin-bottom:15px; color:#0c4a6e;">
                  Your Score: <b>${savedAttemptData.marks} / ${savedAttemptData.maxMarks}</b>
                </div>
                <button id="viewSolutionsBtn" style="background:#0b1a33; color:#fff; padding:12px 24px; font-size:15px; border:none; border-radius:8px; cursor:pointer; font-weight:600; transition:0.2s;">
                  🔍 View Solutions & Review Paper
                </button>
              </div>
            `;

            document.getElementById("viewSolutionsBtn").addEventListener("click", () => {
              isReviewing = true;
              
              // Direct HIDE for main instructions container and timer
              if (instructionsBox) instructionsBox.style.display = "none";
              const instMain = document.getElementById("instructions") || document.getElementById("instructionsBox");
              if (instMain) instMain.style.display = "none";
              if (timerEl) timerEl.style.display = "none";

              if (examApp) examApp.style.display = "block";
              
              submitTest(true); 
            });
          }

          const startBtn = document.getElementById("startTestBtn");
          if (startBtn) startBtn.style.display = "none";
        }
      } catch (e) {
        console.error("Error checking attempt history:", e.message);
      }
    }

    /* ---------------- GAMIFIED LEADERBOARD ---------------- */
    const leaderboardEl = document.getElementById("leaderboardTableContainer");
    if (!leaderboardEl) return;

    try {
      const q = query(
        collection(db, "test_results"),
        where("testId", "==", testId),
        orderBy("marks", "desc")
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        leaderboardEl.innerHTML = `<p style="text-align:center; color:#777; font-style:italic;">No responses submitted yet. Be the first to attempt!</p>`;
        return;
      }

      let tableHtml = `
        <table style="width:100%; border-collapse:collapse; text-align:center; margin-top:10px; font-family:'Poppins',sans-serif; border-radius:8px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background:#0b1a33; color:#fff;">
              <th style="padding:12px;">Rank</th>
              <th style="padding:12px; text-align:left;">Student Name</th>
              <th style="padding:12px;">Marks</th>
            </tr>
          </thead>
          <tbody>
      `;

      let rank = 1;
      querySnapshot.forEach((docSnap) => {
        const row = docSnap.data();
        let rankBadge = `#${rank}`;
        let rowStyle = "border-bottom:1px solid #eee;";
        let topperTag = "";

        if (rank === 1) {
          rankBadge = "👑 🥇";
          rowStyle += "background:#fef9c3; font-weight:600;";
          topperTag = `<span style="background:#ca8a04; color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; margin-left:6px; font-weight:700;">TOPPER</span>`;
        } else if (rank === 2) {
          rankBadge = "🥈";
          rowStyle += "background:#f8fafc;";
        } else if (rank === 3) {
          rankBadge = "🥉";
          rowStyle += "background:#f8fafc;";
        }

        tableHtml += `
          <tr style="${rowStyle}">
            <td style="padding:10px; font-size:16px;">${rankBadge}</td>
            <td style="padding:10px; text-align:left;">
              <b>${sanitizeHTML(row.studentName || "Anonymous")}</b> ${topperTag}
            </td>
            <td style="padding:10px; font-weight:700; color:#16a34a;">${row.marks} / ${row.maxMarks}</td>
          </tr>
        `;
        rank++;
      });

      tableHtml += `</tbody></table>`;
      leaderboardEl.innerHTML = tableHtml;

    } catch (err) {
      console.error("Leaderboard fetch error:", err);
      leaderboardEl.innerHTML = `<p style="text-align:center; color:#888;">Leaderboard will be available after first attempt.</p>`;
    }
  }

  /* ---------------- AUTH STATE LISTENER ---------------- */
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      localStorage.setItem("userUid", user.uid);
      if (user.displayName) localStorage.setItem("userName", user.displayName);
      checkAttemptAndLoadLeaderboard(user);
    } else {
      currentUser = null;
      console.warn("User is not authenticated with Firebase Auth.");
      checkAttemptAndLoadLeaderboard(null);
    }
  });

  /* ---------------- FETCH DATA ---------------- */
  fetch(`test/${testId}.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then((json) => {
      data = json;

      const savedTime = localStorage.getItem("timeLeft");
      timeLeft = savedTime ? parseInt(savedTime, 10) : data.time || 300;

      let instHtml = "";
      if (Array.isArray(data.instructions) && data.instructions.length > 0) {
        instHtml = data.instructions.map((line) => `<li>${line}</li>`).join("");
      } else {
        instHtml = `
          <li>Read each question carefully before answering.</li>
          <li>Each correct answer carries marks specified in the paper.</li>
          <li>Ensure stable internet connection during the examination.</li>
        `;
      }

      if (instructionsContent) {
        instructionsContent.innerHTML = `
          <ul style="line-height:1.6; text-align:left; padding-left:20px;">${instHtml}</ul>
          <div style="text-align:center;margin-top:20px;">
            <button id="startTestBtn" onclick="window.startTest()" style="background:#28a745;color:#fff;padding:12px 28px;font-size:16px;border:none;border-radius:5px;cursor:pointer;font-weight:600;">
              ▶ Start Test
            </button>
          </div>
        `;
      }
      render();
    })
    .catch((err) => {
      console.error("Failed to load test:", err);
      if (instructionsContent) {
        instructionsContent.innerHTML = `
          <div style="color:red;text-align:center;padding:20px;">
            ⚠️ Unable to load test paper (${testId}.json). Please verify test ID or try again.
          </div>
        `;
      }
    });

  function sanitizeHTML(str) {
    if (typeof str !== "string") return str;
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderContent(content) {
    if (!content) return "";
    if (typeof content === "object" && content.type === "image") {
      return `<img src="${encodeURI(content.value)}" style="max-width:100%;border-radius:8px;" alt="Question Image">`;
    }
    return typeof content === "object" ? content.value || "" : content;
  }

  function afterRenderKaTeX() {
    if (typeof renderMathInElement !== "undefined" && examApp) {
      renderMathInElement(examApp, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ]
      });
    }
  }

  function render() {
    if (!data.questions || !data.questions[current]) return;

    const q = data.questions[current];
    let html = `<h3>Q${current + 1}</h3>`;
    html += renderContent(q.q);

    if (q.type === "mcq") {
      q.options.forEach((opt, index) => {
        const optionLabel = String.fromCharCode(97 + index);
        const optionVal = typeof opt === "object" ? opt.value : opt;

        html += `
          <div>
            <label style="cursor:pointer;">
              <input type="radio" name="opt" value="${index}" onchange="window.saveAnswer()" ${answers[current] == index ? "checked" : ""}>
              (${optionLabel}) ${typeof opt === "object" ? renderContent(opt) : optionVal}
            </label>
          </div>
        `;
      });
    } else {
      html += `<input type="number" id="nat" value="${answers[current] ?? ""}" oninput="window.saveAnswer()">`;
    }

    let btns = "";
    if (current > 0) btns += `<button onclick="window.prevQuestion()">Prev</button> `;
    if (current < data.questions.length - 1) btns += `<button onclick="window.nextQuestion()">Next</button> `;
    btns += `<button onclick="window.markQuestion()">Mark</button> `;
    btns += `<button onclick="window.confirmSubmitTest()" style="background:#28a745;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;">Submit Test</button>`;

    html += `<div style="margin-top:15px;display:flex;gap:8px;">${btns}</div>`;

    const qBox = document.getElementById("questionBox");
    if (qBox) qBox.innerHTML = html;

    renderPalette();
    afterRenderKaTeX();
  }

  window.saveAnswer = function () {
    if (isReviewing) return; // Prevent overwriting answers in review mode
    const q = data.questions[current];
    if (!q) return;

    if (q.type === "mcq") {
      const sel = document.querySelector('input[name="opt"]:checked');
      answers[current] = sel ? parseInt(sel.value, 10) : null;
    } else {
      const el = document.getElementById("nat");
      answers[current] = el ? el.value.trim() : null;
    }

    localStorage.setItem("answers", JSON.stringify(answers));
    localStorage.setItem("current", current);
    localStorage.setItem("timeLeft", timeLeft);
    localStorage.setItem("testStarted", "true");
  };

  window.nextQuestion = function () {
    window.saveAnswer();
    if (current < data.questions.length - 1) {
      current++;
      render();
    }
  };

  window.prevQuestion = function () {
    window.saveAnswer();
    if (current > 0) {
      current--;
      render();
    }
  };

  window.jumpToQuestion = function (i) {
    window.saveAnswer();
    current = i;
    render();
  };

  window.markQuestion = function () {
    marked[current] = true;
    renderPalette();
  };

  function renderPalette() {
    let html = "";
    data.questions.forEach((q, i) => {
      let cls = "notvisited";
      if (answers[i] !== undefined && answers[i] !== null && answers[i] !== "") cls = "answered";
      if (marked[i]) cls = "marked";
      if (i === current) cls += " current";

      html += `<button onclick="window.jumpToQuestion(${i})" class="${cls}">${i + 1}</button>`;
    });

    const paletteEl = document.getElementById("palette");
    if (paletteEl) paletteEl.innerHTML = html;
  }

  window.confirmSubmitTest = function () {
    const modal = document.createElement("div");
    modal.id = "submitModal";
    modal.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;">
        <div style="background:#fff;width:100%;max-width:420px;border-radius:14px;padding:25px;text-align:center;">
          <div style="font-size:42px;margin-bottom:10px;">⚠️</div>
          <h3 style="margin:0 0 10px;color:#0b1a33;font-size:22px;">Submit Test?</h3>
          <p style="margin:0;color:#555;line-height:1.6;font-size:15px;">
            Are you sure you want to submit the test?<br>
            <b>You will not be able to change your answers afterwards.</b>
          </p>
          <div style="display:flex;gap:10px;justify-content:center;margin-top:22px;">
            <button id="cancelSubmitBtn" style="padding:10px 20px;border:1px solid #ccc;background:#fff;color:#333;border-radius:7px;cursor:pointer;">Cancel</button>
            <button id="confirmSubmitBtn" style="padding:10px 20px;border:none;background:#28a745;color:#fff;border-radius:7px;cursor:pointer;font-weight:600;">Submit Test</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("cancelSubmitBtn").onclick = () => modal.remove();
    document.getElementById("confirmSubmitBtn").onclick = () => {
      modal.remove();
      submitTest();
    };
  };

  async function saveToFirestore(totalMarks, maxMarks, userAnswersMap) {
    const activeUser = auth.currentUser;
    const userUid = activeUser ? activeUser.uid : localStorage.getItem("userUid");
    const userName = activeUser ? (activeUser.displayName || "Student") : (localStorage.getItem("userName") || "Student");

    if (!userUid) {
      console.warn("User UID absent. Result skipped from Firestore.");
      return;
    }

    const docId = `${testId}_${userUid}`;
    try {
      await setDoc(doc(db, "test_results", docId), {
        testId: testId,
        uid: userUid,
        studentName: userName,
        marks: parseFloat(totalMarks.toFixed(2)),
        maxMarks: maxMarks,
        answers: userAnswersMap || {},
        submittedAt: serverTimestamp()
      });
      console.log("Result saved to Firestore successfully.");
    } catch (e) {
      console.error("Error saving result to Firestore:", e.message);
    }
  }

  async function submitTest(isReviewOnly = false) {
    // Stop & Hide timer on test submit or review load
    if (timerInterval) clearInterval(timerInterval);
    if (timerEl) timerEl.style.display = "none";

    // Hide Instruction Box Completely
    const instMain = document.getElementById("instructionsBox") || document.getElementById("instructions");
    if (instMain) instMain.style.display = "none";

    if (!isReviewOnly) window.saveAnswer();

    const activeAnswers = (isReviewOnly && savedAttemptData && savedAttemptData.answers) 
      ? savedAttemptData.answers 
      : answers;

    let totalMarks = 0;
    const maxMarks = data.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

    let rowsHtml = "";
    data.questions.forEach((q, i) => {
      const user = activeAnswers[i];
      let status = "No Attempt";
      let marks = 0;
      let correctAns;

      if (q.type === "mcq") {
        if (typeof q.answer === "object" && q.answer.type === "text") {
          correctAns = q.options.findIndex((opt) => typeof opt !== "object" && opt === q.answer.value);
        } else {
          correctAns = q.answer;
        }
      } else {
        correctAns = q.answer;
      }

      if (user === null || user === undefined || user === "") {
        status = "No Attempt";
        marks = 0;
      } else if (user == correctAns) {
        marks = Number(q.marks) || 0;
        totalMarks += marks;
        status = "Correct";
      } else {
        marks = -(Number(q.negative) || 0);
        totalMarks += marks;
        status = "Wrong";
      }

      rowsHtml += `
        <tr>
          <td>${i + 1}</td>
          <td>${status}</td>
          <td>${marks}</td>
        </tr>
      `;
    });

    const finalScore = isReviewOnly && savedAttemptData 
      ? savedAttemptData.marks 
      : Number(totalMarks.toFixed(2));

    if (!isReviewOnly) {
      await saveToFirestore(finalScore, maxMarks, answers);

      localStorage.removeItem("answers");
      localStorage.removeItem("current");
      localStorage.removeItem("timeLeft");
      localStorage.removeItem("testStarted");
    }

    // 1. Solution Screen HTML
    let html = `
    <div id="header"></div>

    <h2 style="text-align:center;margin:20px auto;padding:14px;color:#0b1a33;border-bottom:3px solid #0b1a33;max-width:600px;">
      ${isReviewOnly ? "Test Paper & Solutions Review" : "Test Result"}
    </h2>
    <table border="1" style="width: 60%;border-collapse:collapse;text-align:center;margin: 10px auto;">
      <tr style="background:#0b1a33;color:#fff;">
        <th>Q No</th>
        <th>Status</th>
        <th>Marks</th>
      </tr>
      ${rowsHtml}
    </table>
    <div style="text-align:center;margin-top:15px;font-size:18px;font-weight:600;">
      Total Score: ${finalScore} / ${maxMarks}
    </div>
    <h3 class="section-title">Solutions</h3>
  `;

    data.questions.forEach((q, i) => {
      const userAns = activeAnswers[i];
      const userOptText =
        userAns === null || userAns === undefined || userAns === ""
          ? "Not Attempted"
          : q.type === "mcq"
          ? `(${String.fromCharCode(97 + userAns)}) ${typeof q.options[userAns] === "object" ? renderContent(q.options[userAns]) : q.options[userAns]}`
          : userAns;

      const correctText =
        q.type === "mcq"
          ? typeof q.answer === "number"
            ? `(${String.fromCharCode(97 + q.answer)})`
            : q.answer.type === "text"
            ? q.answer.value
            : renderContent(q.answer)
          : q.answer;

      const explanationText =
        typeof q.explanation === "object" && q.explanation.type === "text"
          ? q.explanation.value
          : typeof q.explanation === "object"
          ? renderContent(q.explanation)
          : q.explanation;

      html += `
        <div class="solution-card" style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:15px; margin-bottom:15px; text-align:left;">
          <h4>Q${i + 1}</h4>
          ${renderContent(q.q)}
          <p><b>You opted:</b> ${userOptText}</p>
          <p><b>Correct Answer:</b> ${correctText}</p>
          <p><b>Explanation:</b> ${explanationText}</p>
          ${q.youtube ? `<p><a href="${encodeURI(q.youtube)}" target="_blank" rel="noopener noreferrer" style="color:#ff0000;font-weight:600;">▶ Watch Solution Video</a></p>` : ""}
        </div>
      `;
    });

    html += `
      <div style="text-align:center;margin-top:20px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <button onclick="location.reload()" style="padding:10px 20px; cursor:pointer;">View Leadership Board & Rank</button>
        <button onclick="window.print()" style="padding:10px 20px; cursor:pointer;">📄 Save / Print</button>
        <a href="/gate-articles.html" style="text-decoration:none;">
          <button style="padding:10px 20px; cursor:pointer; background:#0b1a33; color:#fff; border:none; border-radius:4px;">📚 Go to Articles</button>
        </a>
      </div>
    `;

    // 2. DOM update aur Header Load Logic
    if (examApp) {
      examApp.innerHTML = html;
      afterRenderKaTeX();

      setTimeout(() => {
        const headerContainer = document.getElementById("header");
        
        if (typeof loadHeaderModule === "function") {
          loadHeaderModule("header");
        } else if (headerContainer) {
          fetch("/header.html")
            .then(res => {
              if (!res.ok) throw new Error("Header load failed: " + res.status);
              return res.text();
            })
            .then(headerHtml => {
              headerContainer.innerHTML = headerHtml;
              if (typeof window.dispatchEvent === "function") {
                window.dispatchEvent(new Event("scroll"));
              }
            })
            .catch(err => console.error("Error loading header on solution screen:", err));
        }
      }, 0);
    }
  }

  window.startTest = function () {
    isReviewing = false;
    localStorage.setItem("testStarted", "true");
    const instMain = document.getElementById("instructionsBox") || document.getElementById("instructions");
    if (instMain) instMain.style.display = "none";
    if (examApp) examApp.style.display = "block";
    if (timerBox) timerBox.style.display = "block";
    startTimer();
  };

  function startTimer() {
    if (isReviewing) return; // Do not start timer in review mode
    if (timerInterval) clearInterval(timerInterval);

    function updateTimerUI() {
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        submitTest();
        return;
      }
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      if (timerEl) {
        timerEl.innerText = `⏳ ${m}:${s < 10 ? "0" + s : s}`;
      }
      timeLeft--;
    }

    updateTimerUI();
    timerInterval = setInterval(updateTimerUI, 1000);
  }

  document.addEventListener("DOMContentLoaded", function () {
    const started = localStorage.getItem("testStarted");
    if (started === "true" && !savedAttemptData) {
      answers = JSON.parse(localStorage.getItem("answers")) || {};
      current = parseInt(localStorage.getItem("current"), 10) || 0;

      const instMain = document.getElementById("instructionsBox") || document.getElementById("instructions");
      if (instMain) instMain.style.display = "none";
      if (examApp) examApp.style.display = "block";
      if (timerBox) timerBox.style.display = "block";
      startTimer();
    }
  });
})();