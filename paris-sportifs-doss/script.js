/* ===================== Paramètres ===================== */
const JOURS = 30;
const PALIERS = 2;

let data = JSON.parse(localStorage.getItem("montanteData")) || {
  capitalInitial: 0,
  capital: 0,
  mise: 0,
  miseInitiale: 0,
  cote: 1.20,
  pendingCote: null,
  totalGain: 0,
  streak: 0,
  locked: false,
  jours: {},
  winCount: 0,
  loseCount: 0,
  withdrawCount: 0,
  totalWithdraw: 0
};

/* ===================== Sélecteurs ===================== */
const capitalView = document.getElementById("capitalView");
const totalGainView = document.getElementById("totalGain");
const streakView = document.getElementById("streakView");
const tbody = document.getElementById("tbody");
const notifications = document.getElementById("notifications");

const capitalInput = document.getElementById("capitalInput");
const miseInput = document.getElementById("miseInput");
const coteInput = document.getElementById("coteInput");

/* ===================== Notifications ===================== */
function notify(msg, type = "gain") {
  const div = document.createElement("div");
  div.className = `notification ${type}`;
  div.textContent = msg;
  notifications.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

/* ===================== Calcul gain ===================== */
function gainJour() {
  return Math.round(data.mise * Math.pow(data.cote, PALIERS) - data.mise);
}

/* ===================== Règles ===================== */
function updateRules() {
  document.getElementById("rules").innerHTML = `
    <li>Capital initial : ${data.capitalInitial} HTG</li>
    <li>Mise actuelle : ${data.mise} HTG</li>
    <li>${PALIERS} paliers – cote ${data.cote}</li>
    <li>Gain potentiel : +${gainJour()} HTG</li>
    <li>Streak actuel : ${data.streak}</li>
    <li>4 gains consécutifs = retrait</li>
    <li>Blocage si capital = 0</li>
  `;
}

/* ===================== Sauvegarde ===================== */
function save() {
  localStorage.setItem("montanteData", JSON.stringify(data));
}

/* ===================== Progress Bar ===================== */
let currentPercent = 0;
function updateProgressBar() {
  const maxGain = gainJour() * JOURS;
  const target = maxGain ? Math.min(100, (data.totalGain / maxGain) * 100) : 0;
  const bar = document.getElementById("progressBar");

  currentPercent += (target - currentPercent) * 0.1;
  bar.style.width = currentPercent + "%";
  bar.textContent = Math.round(currentPercent) + "%";

  requestAnimationFrame(updateProgressBar);
}

/* ===================== Stats ===================== */
function updateStats() {
  document.getElementById("winCount").textContent = data.winCount;
  document.getElementById("loseCount").textContent = data.loseCount;
  document.getElementById("withdrawCount").textContent = data.withdrawCount;
}

/* ===================== Tableau ===================== */
function renderTable() {
  tbody.innerHTML = "";
  let capTemp = data.capitalInitial;

  for (let i = 1; i <= JOURS; i++) {
    const j = data.jours[i];
    if (j) capTemp = j.cap;

    const color = j
      ? j.res === "g" ? "var(--gain)" : "var(--loss)"
      : "var(--muted)";

    tbody.innerHTML += `
      <tr>
        <td onclick="editDay(${i})">
          <span class="indicator" style="background:${color}"></span>J${i}
        </td>
        <td style="color:${color}">${j ? j.gain : "—"}</td>
        <td>${capTemp}</td>
        <td class="actions">
          <button class="win" onclick="setResult(${i},'g')">✔</button>
          <button class="lose" onclick="setResult(${i},'p')">✖</button>
          <button class="undo" onclick="undo(${i})">↩</button>
        </td>
      </tr>
    `;
  }
}

/* ===================== Modifier jour ===================== */
function editDay(jour) {
  const label = prompt("Modifier le jour", `J${jour}`);
  if (label) {
    tbody.rows[jour - 1].cells[0].lastChild.textContent = label;
  }
}

/* ===================== Appliquer cote ===================== */
function applyPendingCote() {
  if (data.pendingCote !== null) {
    data.cote = data.pendingCote;
    data.pendingCote = null;
  }
}

/* ===================== Gain / Perte ===================== */
function setResult(jour, res) {
  if (data.jours[jour] || data.capital === 0) return;

  applyPendingCote();
  let gain = 0;

  if (res === "g") {
    data.streak++;
    gain = gainJour();
    data.capital += gain;
    data.totalGain += gain;
    data.winCount++;
    notify(`✅ Gain ${gain} HTG`, "gain");

    if (data.streak === 4) {
      const retrait = data.capital - data.capitalInitial;
      data.totalWithdraw += retrait;
      data.capital = data.capitalInitial;
      data.mise = data.miseInitiale;
      data.streak = 0;
      data.withdrawCount++;
      notify(`💸 Retrait ${retrait} HTG`, "withdraw");
    }
  } else {
    data.capital -= data.mise;
    if (data.capital < 0) data.capital = 0;
    data.streak = 0;
    data.loseCount++;
    notify(`❌ Perte ${data.mise} HTG`, "loss");
  }

  data.jours[jour] = {
    res,
    gain,
    cap: data.capital,
    date: new Date().toISOString()
  };

  save();
  renderTable();
  updateDisplay();
}

/* ===================== Undo ===================== */
function undo(jour) {
  const j = data.jours[jour];
  if (!j) return;

  if (j.res === "g") {
    data.capital -= j.gain;
    data.totalGain -= j.gain;
    data.winCount--;
  } else {
    data.capital += data.mise;
    data.loseCount--;
  }

  delete data.jours[jour];
  save();
  renderTable();
  updateDisplay();
}

/* ===================== Réglages ===================== */
function applySettings() {
  data.capitalInitial = +capitalInput.value || 0;
  data.capital = data.capitalInitial;
  data.miseInitiale = data.mise = +miseInput.value || 0;
  data.pendingCote = +coteInput.value || 1.2;

  data.totalGain = 0;
  data.streak = 0;
  data.jours = {};
  data.winCount = data.loseCount = data.withdrawCount = data.totalWithdraw = 0;

  save();
  renderTable();
  updateDisplay();
}

/* ===================== Reset ===================== */
function resetMonth() {
  if (!confirm("Tout réinitialiser ?")) return;
  localStorage.removeItem("montanteData");
  location.reload();
}

/* ===================== Export ===================== */
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Montante Discipline", 14, 16);
  doc.autoTable({ html: "#montanteTable", startY: 20 });
  doc.save("Montante.pdf");
}

function exportExcel() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(document.getElementById("montanteTable"));
  XLSX.utils.book_append_sheet(wb, ws, "Montante");
  XLSX.writeFile(wb, "Montante.xlsx");
}

/* ===================== Affichage ===================== */
function updateDisplay() {
  updateRules();
  capitalView.textContent = data.capital;
  totalGainView.textContent = data.totalGain;
  streakView.textContent = data.streak;
  updateStats();
  updateProgressBar();

  const card = document.getElementById("gameCard");
  data.capital === 0 ? card.classList.add("locked") : card.classList.remove("locked");

  showMonthSummary();
}

/* ===================== Résumé fin mois ===================== */
function showMonthSummary() {
  if (Object.keys(data.jours).length < JOURS) return;

  let gains = 0, pertes = 0;
  for (let i = 1; i <= JOURS; i++) {
    const j = data.jours[i];
    if (!j) continue;
    j.res === "g" ? gains += j.gain : pertes += data.mise;
  }

  const profit = gains - pertes;
  document.getElementById("summaryCapitalInitial").textContent = data.capitalInitial;
  document.getElementById("summaryCapitalFinal").textContent = data.capital;
  document.getElementById("summaryGains").textContent = gains;
  document.getElementById("summaryLosses").textContent = pertes;
  document.getElementById("summaryProfit").textContent = profit;
  document.getElementById("summaryWithdraw").textContent = data.totalWithdraw;
  document.getElementById("summaryVerdict").textContent =
    profit > 0 ? "💰 Résultat positif" : "⚠️ Résultat négatif";

  document.getElementById("monthSummary").style.display = "block";
  notify(`🎉 Fin du mois – Profit ${profit} HTG`, "withdraw");
}

/* ===================== Init ===================== */
renderTable();
updateDisplay();
