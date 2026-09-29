let current = 0;
let answers = {};
let marked = {};
let data = { questions: [] }; // Initially empty array

let timeLeft = 450;
let timerInterval;

/* ---------------- FETCH QUESTIONS FROM JSON ---------------- */
async function loadQuestions() {
  const params = new URLSearchParams(window.location.search);
  const testId = params.get("test") || "default-test"; // Default fallback JSON name

  try {
    // Dynamic JSON fetch based on query parameter (e.g., tests/signals1.json)
    const response = await fetch(`/tests/${testId}.json`);
    if (!response.ok) throw new Error("Question set missing");
    
    data = await response.json();
    render();
  } catch (err) {
    console.error("Error loading test JSON:", err);
    document.getElementById("questionBox").innerHTML = 
      `<p style="color:red;">Error loading question paper. Please try again later.</p>`;
  }
}

/* ---------------- RENDER CONTENT ---------------- */
function renderContent(content) {
  if (!content) return "";
  if (content.type === "image") {
    return `<img src="${content.value}" style="max-width:100%;border-radius:8px;">`;
  }
  return content.value;
}

/* ---------------- MAIN RENDER ---------------- */
function render() {
  if (!data.questions || data.questions.length === 0) return;

  let q = data.questions[current];

  let html = `<h3>Q${current + 1}</h3>`;
  html += renderContent(q.q);

  if (q.type === "mcq") {
    q.options.forEach(opt => {
      html += `
        <div>
          <label>
            <input type="radio" name="opt" value="${opt}" onchange="save()"
            ${answers[current] == opt ? "checked" : ""}>
            ${opt}
          </label>
        </div>
      `;
    });
  } else {
    html += `<input type="number" id="nat" value="${answers[current] || ''}" oninput="save()">`;
  }

  let btns = "";
  if (current > 0) {
    btns += `<button onclick="prev()">Prev</button>`;
  }
  if (current < data.questions.length - 1) {
    btns += `<button onclick="next()">Next</button>`;
  }

  btns += `<button onclick="mark()">Mark</button>`;
  btns += `<button onclick="submitTest()" style="background:#28a745; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Submit</button>`;

  html += `<div style="margin-top:10px;">${btns}</div>`;

  document.getElementById("questionBox").innerHTML = html;
  renderPalette();
}

/* ---------------- SAVE ANSWER ---------------- */
function save() {
  if (!data.questions || data.questions.length === 0) return;
  let q = data.questions[current];

  if (q.type === "mcq") {
    let sel = document.querySelector('input[name="opt"]:checked');
    answers[current] = sel ? sel.value : null;
  } else {
    let el = document.getElementById("nat");
    answers[current] = el ? el.value : null;
  }

  localStorage.setItem("answers", JSON.stringify(answers));
  localStorage.setItem("current", current);
  localStorage.setItem("timeLeft", timeLeft);
  localStorage.setItem("testStarted", "true");
}

/* ---------------- NAVIGATION ---------------- */
function next() {
  save();
  if (current < data.questions.length - 1) {
    current++;
    render();
  }
}

function prev() {
  save();
  if (current > 0) {
    current--;
    render();
  }
}

function jump(i) {
  save();
  current = i;
  render();
}

/* ---------------- MARK ---------------- */
function mark() {
  marked[current] = true;
  renderPalette();
}

/* ---------------- PALETTE ---------------- */
function renderPalette() {
  let html = "";

  data.questions.forEach((q, i) => {
    let cls = "notvisited";

    if (answers[i] != null && answers[i] !== "") cls = "answered";
    if (marked[i]) cls = "marked";
    if (i === current) cls += " current";

    html += `<button onclick="jump(${i})" class="${cls}">${i + 1}</button>`;
  });

  document.getElementById("palette").innerHTML = html;
}

/* ---------------- SUBMIT TEST FUNCTION ---------------- */
function submitTest() {
  if (timerInterval) clearInterval(timerInterval);
  save();

  let correct = 0, wrong = 0, left = 0, totalMarks = 0;

  data.questions.forEach((q, i) => {
    let user = answers[i];
    if (!user) {
      left++;
    } else if (user == q.answer.value) {
      correct++;
      totalMarks += q.marks;
    } else {
      wrong++;
      totalMarks -= (q.negative || 0);
    }
  });

  totalMarks = parseFloat(totalMarks.toFixed(2));

  let html = `
    <h2>Test Performance & Results</h2>

    <table border="1" style="width: 70%; border-collapse: collapse; text-align: center; margin: 15px auto;">
      <tr style="background: #0b1a33; color: #fff;">
        <th>Q No</th>
        <th>Status</th>
        <th>Marks</th>
      </tr>
  `;

  data.questions.forEach((q, i) => {
    let user = answers[i];
    let status = "No Attempt";
    let marks = 0;

    if (!user) {
      status = "No Attempt";
    } else if (user == q.answer.value) {
      marks = q.marks;
      status = "Correct";
    } else {
      marks = -(q.negative || 0);
      status = "Wrong";
    }

    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${status}</td>
        <td>${marks}</td>
      </tr>
    `;
  });

  html += `
    </table>

    <div style="text-align: center; margin: 20px 0; font-size: 18px; font-weight: 600;">
      Total Score: ${totalMarks} / ${data.questions.length}
    </div>

    <h3 class="section-title">Detailed Solutions</h3>
  `;

  data.questions.forEach((q, i) => {
    html += `
      <div class="solution-card" style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
        <h4>Q${i + 1}</h4>
        ${renderContent(q.q)}
        <p><b>Correct Answer:</b> ${renderContent(q.answer)}</p>
        <p><b>Explanation:</b> ${typeof q.explanation === "object" ? renderContent(q.explanation) : q.explanation}</p>
      </div>
    `;
  });

  html += `
    <div style="text-align: center; margin-top: 25px;">
      <button onclick="goToFirst()" style="padding: 10px 15px; margin-right: 10px;">🔁 Restart Test</button>
      <button onclick="window.print()" style="padding: 10px 15px; margin-right: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">📄 Print / Save PDF</button>
      <button onclick="window.location.href='/gate-articles.html'" style="padding: 10px 15px;">📘 Go to Articles</button>
    </div>
  `;

  const examAppContainer = document.getElementById("examApp");
  if (examAppContainer) {
    examAppContainer.innerHTML = html;
  }

  localStorage.removeItem("answers");
  localStorage.removeItem("current");
  localStorage.removeItem("timeLeft");
  localStorage.removeItem("testStarted");
}

/* ---------------- RESET ---------------- */
function goToFirst() {
  localStorage.removeItem("answers");
  localStorage.removeItem("current");
  localStorage.removeItem("timeLeft");
  localStorage.removeItem("testStarted");
  location.reload();
}

function startTest() {
  localStorage.setItem("testStarted", "true");
  document.getElementById("instructionsBox").style.display = "none";
  document.getElementById("examApp").style.display = "block";
  startTimer();
}

/* ---------------- INIT ---------------- */
document.addEventListener("DOMContentLoaded", function() {
  let started = localStorage.getItem("testStarted");

  if (started === "true") {
    answers = JSON.parse(localStorage.getItem("answers")) || {};
    current = parseInt(localStorage.getItem("current")) || 0;

    let savedTime = localStorage.getItem("timeLeft");
    timeLeft = savedTime ? parseInt(savedTime) : 450;

    document.getElementById("instructionsBox").style.display = "none";
    document.getElementById("examApp").style.display = "block";

    loadQuestions();
    startTimer();
  } else {
    loadQuestions();
  }
});

function startTimer() {
  timerInterval = setInterval(() => {
    let m = Math.floor(timeLeft / 60);
    let s = timeLeft % 60;

    let el = document.getElementById("timer");
    if (el) {
      el.innerText = `⏳ ${m}:${s < 10 ? "0" + s : s}`;
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitTest();
      return;
    }

    timeLeft--;
  }, 1000);
}