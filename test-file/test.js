let current = 0;
let answers = {};
let marked = {};

const data = {
  questions: [

{///1
  q: { type: "text", value: "What is the derivative of the unit step function u(t)?" },
  type: "mcq",
  options: ["Ramp", "Impulse", "Constant", "Zero"],
  answer: { type: "text", value: "Impulse" },
  marks: 1,
  negative: 0.33,
  explanation: "The derivative of unit step is the Dirac delta (impulse)."
},

{//2
  q: { type: "text", value: "The signal x(t) = sin(t) is which type of signal?" },
  type: "mcq",
  options: ["Aperiodic", "Periodic", "Even", "Odd"],
  answer: { type: "text", value: "Periodic" },
  marks: 1,
  negative: 0.33,
  explanation: "sin(t) repeats after 2π, hence periodic."
},

{//3
  q: { type: "text", value: "What is the condition for an energy signal?" },
  type: "mcq",
  options: ["Finite energy, zero power", "Infinite energy", "Finite power", "Infinite power"],
  answer: { type: "text", value: "Finite energy, zero power" },
  marks: 1,
  negative: 0.33,
  explanation: "Energy signals have finite energy and zero average power."
},

{//4
  q: { type: "text", value: "What does a causal system depend on?" },
  type: "mcq",
  options: ["Future inputs", "Past and present inputs", "Only future", "Random inputs"],
  answer: { type: "text", value: "Past and present inputs" },
  marks: 1,
  negative: 0.33,
  explanation: "Causal systems depend only on present and past inputs."
},

{//5
  q: { type: "text", value: "The signal x(t) = e^{-t}u(t) is which type?" },
  type: "mcq",
  options: ["Energy signal", "Power signal", "Neither", "Both"],
  answer: { type: "text", value: "Energy signal" },
  marks: 1,
  negative: 0.33,
  explanation: "Exponential decay signals are energy signals."
},

{//6
  q: { type: "text", value: "What is the condition for an even signal?" },
  type: "mcq",
  options: ["x(t) = x(-t)", "x(t) = -x(-t)", "x(t) = 0", "None"],
  answer: { type: "text", value: "x(t) = x(-t)" },
  marks: 1,
  negative: 0.33,
  explanation: "Even signals are symmetric about the y-axis."
},

{//7
  q: { type: "text", value: "The system y(t) = x(t - 2) is:" },
  type: "mcq",
  options: ["Time invariant", "Time variant", "Non-linear", "Unstable"],
  answer: { type: "text", value: "Time invariant" },
  marks: 1,
  negative: 0.33,
  explanation: "Time shift does not change system behavior → time invariant."
},

{//8
  q: { type: "text", value: "What is the condition for stability?" },
  type: "mcq",
  options: ["Bounded input → bounded output", "Only input bounded", "Only output bounded", "None"],
  answer: { type: "text", value: "Bounded input → bounded output" },
  marks: 1,
  negative: 0.33,
  explanation: "BIBO stability condition."
},

{//9
  q: { type: "text", value: "What does impulse response determine?" },
  type: "mcq",
  options: ["System behavior", "Signal type", "Energy", "Frequency"],
  answer: { type: "text", value: "System behavior" },
  marks: 1,
  negative: 0.33,
  explanation: "Impulse response completely defines an LTI system."
},

{//10
  q: { type: "text", value: "Where is convolution used?" },
  type: "mcq",
  options: ["To find system output", "Signal energy", "Sampling", "Quantization"],
  answer: { type: "text", value: "To find system output" },
  marks: 1,
  negative: 0.33,
  explanation: "Output = input * impulse response (convolution)."
}
]
};

/* ---------------- RENDER CONTENT ---------------- */
function renderContent(content){
  if(!content) return "";

  if(content.type === "image"){
    return `<img src="${content.value}" style="max-width:100%;border-radius:8px;">`;
  }

  return content.value;
}

/* ---------------- MAIN RENDER ---------------- */
function render(){

  let q = data.questions[current];

  let html = `<h3>Q${current + 1}</h3>`;
  html += renderContent(q.q);

  if(q.type === "mcq"){
    q.options.forEach(opt=>{
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
    html += `<input type="number" id="nat" value="${answers[current] || ''}" oninput="save()>`;
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
}

/* ---------------- SAVE ANSWER ---------------- */
function save(){

  let q = data.questions[current];

  if(q.type === "mcq"){
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

  if(!user){
    left++;
  }
  else if(user == q.answer.value){
    correct++;
    marks = q.marks;
    total += marks;
    status = "Correct";
  }
  else{
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
    html += `
      <div class="solution-card">
        <h4>Q${i+1}</h4>
        ${renderContent(q.q)}
        <p><b>Answer:</b> ${renderContent(q.answer)}</p>
        <p>${typeof q.explanation === "object" ? renderContent(q.explanation) : q.explanation}</p>
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

    render();
    startTimer();

  } else {
    render(); // normal load
  }

});

let timeLeft = 450;
let timerInterval;

function startTimer(){

  timerInterval = setInterval(()=>{

    let m = Math.floor(timeLeft / 60);
    let s = timeLeft % 60;

    let el = document.getElementById("timer");
    if(el){
      el.innerText = `⏳ ${m}:${s < 10 ? "0"+s : s}`;
    }

    if(timeLeft <= 0){
      clearInterval(timerInterval);
      submitTest();
      return;
    }

    timeLeft--;

  }, 1000);

}