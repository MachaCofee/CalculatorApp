// ── STATE ──────────────────────────────────────────────────
let cur = "0";
let prev = "";
let op = null;
let justEval = false;
let mode = "std";
let degMode = true;
let memory = null;
let history = [];

// ── DOM REFERENCES ─────────────────────────────────────────
const mainNum = document.getElementById("mainNum");
const exprLine = document.getElementById("exprLine");
const histLine = document.getElementById("histLine");
const degBtn = document.getElementById("degBtn");
const memStat = document.getElementById("memStatus");

// ── DISPLAY ────────────────────────────────────────────────
function render(flash) {
  let d = cur;

  if (!isNaN(cur) && cur !== "" && !cur.includes("e")) {
    const n = parseFloat(cur);
    if (Math.abs(n) >= 1e12 || (Math.abs(n) < 1e-8 && n !== 0)) {
      d = n.toExponential(5);
    } else if (!cur.includes(".")) {
      d = Number(cur).toLocaleString("en-US");
    }
  }

  mainNum.textContent = d;
  mainNum.className = "main-num" + (flash ? " flash" : "");
  if (flash) setTimeout(() => mainNum.classList.remove("flash"), 200);
}

function setExpr(s) {
  exprLine.textContent = s;
}
function setHist(s) {
  histLine.textContent = s;
}

// ── DIGIT INPUT ────────────────────────────────────────────
function digit(v) {
  if (justEval) {
    cur = v;
    justEval = false;
  } else if (cur === "0") {
    cur = v;
  } else if (cur.replace("-", "").replace(".", "").length < 12) {
    cur += v;
  }
  render();
}

function doDot() {
  if (justEval) {
    cur = "0.";
    justEval = false;
  } else if (!cur.includes(".")) {
    cur += ".";
  }
  render();
}

// ── OPERATORS ──────────────────────────────────────────────
function calc(a, o, b) {
  a = parseFloat(a);
  b = parseFloat(b);
  switch (o) {
    case "+":
      return a + b;
    case "−":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? "ERR:DIV0" : a / b;
    case "xⁿ":
      return Math.pow(a, b);
  }
}

function doOp(o) {
  if (op && !justEval) {
    const r = calc(prev, op, cur);
    if (typeof r === "string" && r.startsWith("ERR")) {
      showErr(r);
      return;
    }
    cur = trim(r);
  } else {
    prev = cur;
  }
  op = o;
  justEval = true;
  setExpr(fmt(prev) + " " + o);
}

function doEquals() {
  if (!op) return;

  const expr = fmt(prev) + " " + op + " " + fmt(cur);
  const r = calc(prev, op, cur);

  if (typeof r === "string" && r.startsWith("ERR")) {
    showErr(r);
    return;
  }

  addHistory(expr, trim(r));
  setHist(expr + " =");
  setExpr("");

  cur = trim(r);
  op = null;
  prev = "";
  justEval = true;
  render(true);
}

// ── FUNCTION KEYS ──────────────────────────────────────────
function doClear() {
  cur = "0";
  prev = "";
  op = null;
  justEval = false;
  setExpr("");
  setHist("");
  render();
}

function doSign() {
  if (cur === "0") return;
  cur = String(parseFloat(cur) * -1);
  render(true);
}

function doPct() {
  cur = String(parseFloat(cur) / 100);
  render(true);
}

// ── SCIENTIFIC FUNCTIONS ───────────────────────────────────
function toRad(deg) {
  return (deg * Math.PI) / 180;
}
function fromRad(r) {
  return (r * 180) / Math.PI;
}

function sciOp(fn) {
  const n = parseFloat(cur);
  let r;

  switch (fn) {
    case "sin":
      r = Math.sin(degMode ? toRad(n) : n);
      break;
    case "cos":
      r = Math.cos(degMode ? toRad(n) : n);
      break;
    case "tan":
      r = Math.tan(degMode ? toRad(n) : n);
      break;
    case "sin⁻¹":
      r = degMode ? fromRad(Math.asin(n)) : Math.asin(n);
      break;
    case "cos⁻¹":
      r = degMode ? fromRad(Math.acos(n)) : Math.acos(n);
      break;
    case "tan⁻¹":
      r = degMode ? fromRad(Math.atan(n)) : Math.atan(n);
      break;
    case "log":
      r = n <= 0 ? "ERR:LOG" : Math.log10(n);
      break;
    case "ln":
      r = n <= 0 ? "ERR:LOG" : Math.log(n);
      break;
    case "√":
      r = n < 0 ? "ERR:SQRT" : Math.sqrt(n);
      break;
    case "x²":
      r = Math.pow(n, 2);
      break;
    case "|x|":
      r = Math.abs(n);
      break;
    case "n!":
      r = factorial(n);
      break;
    case "xⁿ":
      op = "xⁿ";
      prev = cur;
      justEval = true;
      setExpr(fmt(cur) + " ^");
      return;
  }

  if (typeof r === "string" && r.startsWith("ERR")) {
    showErr(r);
    return;
  }

  const expr = fn + "(" + fmt(cur) + ")";
  addHistory(expr, trim(r));
  setHist(expr + " =");
  cur = trim(r);
  justEval = true;
  render(true);
}

function insertConst(c) {
  const v = c === "π" ? String(Math.PI) : String(Math.E);
  cur = v;
  justEval = false;
  render();
}

function factorial(n) {
  if (n < 0 || !Number.isInteger(n) || n > 170) return "ERR:FACT";
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

// ── MEMORY ─────────────────────────────────────────────────
function memRecall() {
  if (memory === null) return;
  cur = String(memory);
  justEval = false;
  render(true);
  updateMemUI();
}

function memClear() {
  memory = null;
  updateMemUI();
}

document.getElementById("mPlus").onclick = () => {
  memory = (memory || 0) + parseFloat(cur);
  updateMemUI();
};

document.getElementById("mMinus").onclick = () => {
  memory = (memory || 0) - parseFloat(cur);
  updateMemUI();
};

function updateMemUI() {
  const on = memory !== null;
  memStat.textContent = on ? "M: " + trim(memory) : "M: —";
  memStat.className = "status-mem" + (on ? " on" : "");
  ["mMinus", "mPlus", "mR", "mC"].forEach((id) => {
    document.getElementById(id).classList.toggle("active", on);
  });
}

// ── MODE TOGGLE ────────────────────────────────────────────
function setMode(m) {
  mode = m;
  document.getElementById("sciGrid").style.display =
    m === "sci" ? "grid" : "none";
  document.getElementById("modeStd").classList.toggle("active", m === "std");
  document.getElementById("modeSci").classList.toggle("active", m === "sci");
}

function toggleDeg() {
  degMode = !degMode;
  degBtn.textContent = degMode ? "DEG" : "RAD";
}

// ── HISTORY ────────────────────────────────────────────────
function addHistory(expr, result) {
  history.unshift({ expr, result });
  if (history.length > 20) history.pop();
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById("histList");
  if (!history.length) {
    list.innerHTML = '<div class="hist-empty">No calculations yet</div>';
    return;
  }
  list.innerHTML = history
    .map(
      (h, i) => `
    <div class="hist-item" onclick="useHistory(${i})">
      <div class="hist-expr">${h.expr}</div>
      <div class="hist-res">${h.result}</div>
    </div>
  `,
    )
    .join("");
}

function useHistory(i) {
  cur = String(history[i].result);
  justEval = false;
  render(true);
}

function clearHistory() {
  history = [];
  renderHistory();
}

// ── HELPERS ────────────────────────────────────────────────
function trim(n) {
  const s = String(parseFloat(parseFloat(n).toFixed(12)));
  return isNaN(parseFloat(s)) ? "0" : s;
}

function fmt(n) {
  const v = parseFloat(n);
  if (isNaN(v)) return n;
  if (Math.abs(v) >= 1e10) return v.toExponential(4);
  return v.toLocaleString("en-US", { maximumFractionDigits: 8 });
}

function showErr(msg) {
  mainNum.textContent = msg.replace("ERR:", "") + " Error";
  mainNum.className = "main-num error";
  setTimeout(doClear, 1400);
}

// ── KEYBOARD SUPPORT ───────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.key >= "0" && e.key <= "9") {
    digit(e.key);
    return;
  }
  if (e.key === ".") {
    doDot();
    return;
  }

  if (e.key === "+") doOp("+");
  else if (e.key === "-") doOp("−");
  else if (e.key === "*") doOp("×");
  else if (e.key === "/") {
    e.preventDefault();
    doOp("÷");
  } else if (e.key === "Enter" || e.key === "=") doEquals();
  else if (e.key === "Backspace") {
    cur = cur.length > 1 ? cur.slice(0, -1) : "0";
    render();
  } else if (e.key === "Escape") doClear();
  else if (e.key === "%") doPct();
});

// ── RIPPLE EFFECT ──────────────────────────────────────────
document.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const ripple = document.createElement("span");
    const rect = btn.getBoundingClientRect();
    const sz = Math.max(rect.width, rect.height);

    ripple.className = "ripple";
    ripple.style.cssText =
      `width:${sz}px; height:${sz}px;` +
      `left:${e.clientX - rect.left - sz / 2}px;` +
      `top:${e.clientY - rect.top - sz / 2}px`;

    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 360);
  });
});
