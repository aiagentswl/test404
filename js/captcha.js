// js/captcha.js
window.__captchaPassed = false;
let _ans = null;

function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function generateCaptcha() {
  const ops = ["+", "−", "×"];
  const a = rand(1,9), b = rand(1,9), c = rand(1,9);
  const o1 = ops[rand(0,2)], o2 = ops[rand(0,2)];

  let vals  = [a, b, c];
  let opers = [o1, o2];

  // × first
  for (let i = 0; i < opers.length; ) {
    if (opers[i] === "×") { vals.splice(i, 2, vals[i] * vals[i+1]); opers.splice(i,1); }
    else i++;
  }
  let res = vals[0];
  for (let i = 0; i < opers.length; i++) {
    if (opers[i] === "+") res += vals[i+1];
    else if (opers[i] === "−") res -= vals[i+1];
  }

  _ans = res;
  window.__captchaPassed = false;

  const eq = document.getElementById("captchaEq");
  const ip = document.getElementById("captchaInput");
  const ck = document.getElementById("check7");
  const tk = document.getElementById("task7");

  if (eq) eq.textContent = `${a} ${o1} ${b} ${o2} ${c}`;
  if (ip) ip.value = "";
  if (ck) { ck.textContent = "⬜"; }
  if (tk) tk.classList.remove("done");
  if (typeof window.updateProgressBar === "function") window.updateProgressBar();
}

function checkCaptcha() {
  const ip  = document.getElementById("captchaInput");
  if (!ip) return;
  const val = parseInt(ip.value, 10);
  if (!isNaN(val) && val === _ans) {
    window.__captchaPassed = true;
    if (typeof window.markTaskDone === "function") window.markTaskDone(7);
  } else {
    window.__captchaPassed = false;
    const ck = document.getElementById("check7");
    const tk = document.getElementById("task7");
    if (ck) { ck.textContent = "⬜"; }
    if (tk) tk.classList.remove("done");
    if (typeof window.updateProgressBar === "function") window.updateProgressBar();
  }
}

window.generateCaptcha = generateCaptcha;
window.checkCaptcha    = checkCaptcha;

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("captchaEq")) generateCaptcha();
});
