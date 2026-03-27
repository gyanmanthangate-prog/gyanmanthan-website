const params = new URLSearchParams(window.location.search);
const testId = params.get("test") || "signal-1";

let data; // ✅ sirf ek baar

fetch(`test/${testId}.json`)
  .then(res => res.json())
  .then(json => {
    data = json;

    let savedTime = localStorage.getItem("timeLeft");

    if(savedTime){
      timeLeft = parseInt(savedTime);
    } else {
      timeLeft = data.time || 300;
    }
let instHtml = "";

if(data.instructions){
  data.instructions.forEach(line=>{
    instHtml += `<li>${line}</li>`;
  });
}

document.getElementById("instructionsContent").innerHTML = `
  <ul style="line-height:1.6;">${instHtml}</ul>
  <div style="text-align:center;margin-top:20px;">
    <button onclick="startTest()" style="background:#28a745;padding:10px 20px;font-size:16px;">
      ▶ Start Test
    </button>
  </div>
`;
    render();
  });

let current = 0;
let answers = {};
let marked = {};

/* ---------------- RENDER CONTENT ---------------- */
function renderContent(content){
  if(!content) return "";

  if(content.type === "image"){
    return `<img src="${content.value}" style="max-width:100%;border-radius:8px;">`;
  }

  return content.value;
  
}
function afterRenderKaTeX(){
  if(typeof renderMathInElement !== "undefined"){
    renderMathInElement(document.getElementById("examApp"), {
      delimiters: [
        {left: "$$", right: "$$", display: true},
        {left: "$", right: "$", display: false}
      ]
    });
  }
}

/* ---------------- MAIN RENDER ---------------- */
function render(){

  let q = data.questions[current];

  let html = `<h3>Q${current + 1}</h3>`;
  html += renderContent(q.q);

  if(q.type === "mcq"){
    q.options.forEach((opt, index)=>{

  let val = typeof opt === "object" ? opt.value : opt;

  html += `
    <div>
      <label>
        <input type="radio" name="opt" value="${index}" onchange="save()"
        ${answers[current] == index ? "checked" : ""}>
(${String.fromCharCode(97 + index)}) 
${typeof opt === "object" ? renderContent(opt) : opt}
        
      </label>
    </div>
  `;
});
  } else {
    html += `<input type="number" id="nat" value="${answers[current] || ''}" oninput="save()">`;
  }
  let btns = "";

if(current > 0){
  btns += `<button onclick="prev()">Prev</button>`;
}

if(current < data.questions.length - 1){
  btns += `<button onclick="next()">Next</button>`;
}

btns += `<button onclick="mark()">Mark</button>`;
btns += `<button onclick="submitTest()" style="background:#28a745;">Submit</button>`;

html += `<div style="margin-top:10px;">${btns}</div>`;

  document.getElementById("questionBox").innerHTML = html;

  renderPalette();
  afterRenderKaTeX(); 
}

/* ---------------- SAVE ANSWER ---------------- */
function save(){

  let q = data.questions[current];

  if(q.type === "mcq"){
    let sel = document.querySelector('input[name="opt"]:checked');
    answers[current] = sel ? parseInt(sel.value) : null;
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
function next(){
  save();
  if(current < data.questions.length - 1){
    current++;
    render();
  }
}

function prev(){
  save();
  if(current > 0){
    current--;
    render();
  }
}

function jump(i){
  save();
  current = i;
  render();
}

/* ---------------- MARK ---------------- */
function mark(){
  marked[current] = true;
  renderPalette();
}

/* ---------------- PALETTE ---------------- */
function renderPalette(){

  let html = "";

  data.questions.forEach((q,i)=>{

    let cls = "notvisited";

    if(answers[i] != null && answers[i] !== "") cls = "answered";
    if(marked[i]) cls = "marked";
    if(i === current) cls += " current";

    html += `<button onclick="jump(${i})" class="${cls}">${i+1}</button>`;
  });

  document.getElementById("palette").innerHTML = html;
}

/* ---------------- SUBMIT ---------------- */

function submitTest(){
clearInterval(timerInterval);
  save();
localStorage.removeItem("answers");
localStorage.removeItem("current");
localStorage.removeItem("timeLeft");
localStorage.removeItem("testStarted");
  let html = `
<h2>Result</h2>

<table border="1" style="width: 60%;border-collapse:collapse;text-align:center;margin: 10px auto 0px auto;">
  <tr style="background:#0b1a33;color:#fff;">
    <th>Q No</th>
    <th>Status</th>
    <th>Marks</th>
  </tr>
`;

let correct = 0, wrong = 0, left = 0, total = 0;

data.questions.forEach((q,i)=>{

  let user = answers[i];
  let status = "No Attempt";
  let marks = 0;


  let correctAns;

if(q.type === "mcq"){
    if(typeof q.answer === "object" && q.answer.type === "text"){
        // Text MCQ: find index of option matching answer value
        correctAns = q.options.findIndex(opt => {
            if(typeof opt === "object") return false; // image option, won't match text
            return opt === q.answer.value;
        });
    } else {
        // Index-based answer (image MCQ or numeric index)
        correctAns = q.answer;
    }
} else if(q.type === "nat"){
    correctAns = q.answer; // numeric answer
}

// ------------------ scoring ------------------
if(user === null || user === "" || user === undefined){
    left++;
    status = "No Attempt";
    marks = 0;
} else if(user == correctAns){
    correct++;
    marks = q.marks;
    total += marks;
    status = "Correct";
} else {
    wrong++;
    marks = -(q.negative || 0);
    total += marks;
    status = "Wrong";
}

  html += `
    <tr>
      <td>${i+1}</td>
      <td>${status}</td>
      <td>${marks}</td>
    </tr>
  `;
});

html += `
<div style="text-align:center;margin-top:15px;font-size:18px;font-weight:600;">
  Total Score: ${total} / ${data.questions.length}
</div>
`;

html += `
</table>

<h3 class="section-title">Solutions</h3>
`;

  data.questions.forEach((q,i)=>{
    let userAns = answers[i];  // pranav
    html += `
      <div class="solution-card">
        <h4>Q${i+1}</h4>
        ${renderContent(q.q)}

        <p><b>You opted:</b> ${
  userAns === null || userAns === undefined || userAns === "" 
    ? "Not Attempted" 
    : (q.type === "mcq"
        ? `(${String.fromCharCode(97 + userAns)}) ${
            typeof q.options[userAns] === "object"
              ? renderContent(q.options[userAns])
              : q.options[userAns]
          }`
        : userAns)
}</p>

       <p><b>Answer:</b> ${
  q.type === "mcq"
    ? (
        typeof q.answer === "number"
          ? `(${String.fromCharCode(97 + q.answer)})`
          : (q.answer.type === "text"
              ? q.answer.value
              : renderContent(q.answer))
      )
    : q.answer
}</p>

<p><b>Explanation:</b> ${
    (typeof q.explanation === "object" && q.explanation.type === "text")
        ? q.explanation.value
        : (typeof q.explanation === "object"
            ? renderContent(q.explanation)  // image or other object
            : q.explanation)
}</p>
      </div>
    `;
  });

  html += `
    <button onclick="goToFirst()">🔁 Restart the test again</button>
    <button onclick="window.print()">📄 Print / Save</button>
    <button onclick="window.location.href='/gate-articles.html'">
  📘 Go to Articles
</button>
  `;

  document.getElementById("examApp").innerHTML = html;
  if (typeof renderMathInElement !== "undefined") {
  renderMathInElement(document.getElementById("examApp"), {
    delimiters: [
      {left: "$$", right: "$$", display: true},
      {left: "$", right: "$", display: false}
    ]
  });
}
}

/* ---------------- RESET ---------------- */
function goToFirst(){
  location.reload();
}

function startTest(){
  localStorage.setItem("testStarted", "true");
  document.getElementById("instructionsBox").style.display = "none";
  document.getElementById("examApp").style.display = "block";
  startTimer();
}


/* ---------------- INIT ---------------- */
document.addEventListener("DOMContentLoaded", function(){

  let started = localStorage.getItem("testStarted");

  if(started === "true"){

    // restore data
    answers = JSON.parse(localStorage.getItem("answers")) || {};
    current = parseInt(localStorage.getItem("current")) || 0;

    let savedTime = localStorage.getItem("timeLeft");
    timeLeft = savedTime ? parseInt(savedTime) : 300;

    // show exam directly
    document.getElementById("instructionsBox").style.display = "none";
    document.getElementById("examApp").style.display = "block";


    startTimer();

  } 

});

// let timeLeft = 450;
let timeLeft;
let timerInterval;

function startTimer(){

  if(timerInterval) clearInterval(timerInterval);

  // ✅ show immediately
  let m = Math.floor(timeLeft / 60);
  let s = timeLeft % 60;

  let el = document.getElementById("timer");
  if(el){
    el.innerText = `⏳ ${m}:${s < 10 ? "0"+s : s}`;
  }

  // ✅ keep updating every second
  timerInterval = setInterval(()=>{

    if(timeLeft <= 0){
      clearInterval(timerInterval);
      submitTest();
      return;
    }

    timeLeft--;

    // ✅ UPDATE AGAIN (this was missing)
    let m = Math.floor(timeLeft / 60);
    let s = timeLeft % 60;

    let el = document.getElementById("timer");
    if(el){
      el.innerText = `⏳ ${m}:${s < 10 ? "0"+s : s}`;
    }

  }, 1000);

}