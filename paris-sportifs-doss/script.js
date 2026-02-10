/* ===================== 1️⃣ Paramètres et données ===================== */
const JOURS = 30, PALIERS = 2;

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

/* ===================== 2️⃣ Sélecteurs DOM ===================== */
const capitalView = document.getElementById("capitalView");
const totalGainView = document.getElementById("totalGain");
const streakView = document.getElementById("streakView");
const tbody = document.getElementById("tbody");
const notifications = document.getElementById("notifications");
const capitalInput = document.getElementById("capitalInput");
const miseInput = document.getElementById("miseInput");
const coteInput = document.getElementById("coteInput");

/* ===================== 3️⃣ Notifications ===================== */
function notify(msg, type = 'gain') {
  const div = document.createElement('div');
  div.className = `notification ${type}`;
  div.textContent = msg;
  notifications.appendChild(div);
  setTimeout(() => { notifications.removeChild(div); }, 4000);
}

/* ===================== 4️⃣ Calcul du gain par jour ===================== */
function gainJour() {
  return Math.round(data.mise * Math.pow(data.cote, PALIERS) - data.mise);
}

/* ===================== 5️⃣ Mise à jour des règles ===================== */
function updateRules() {
  document.getElementById("rules").innerHTML = `
    <li>Capital initial : ${data.capitalInitial} HTG</li>
    <li>Mise actuelle : ${data.mise} HTG</li>
    <li>${PALIERS} paliers – cote ${data.cote}</li>
    <li>Gain potentiel : +${gainJour()} HTG</li>
    <li>Streak actuel : ${data.streak}</li>
    <li>4 gains consécutifs = retrait du bénéfice</li>
    <li>Blocage uniquement si capital = 0</li>
  `;
}

/* ===================== 6️⃣ Sauvegarde ===================== */
function save() {
  localStorage.setItem("montanteData", JSON.stringify(data));
}

/* ===================== 7️⃣ Barre de progression fluide ===================== */
let currentPercent = 0;

function updateProgressBar() {
  const maxGain = gainJour() * JOURS;
  const targetPercent = maxGain !== 0 ? Math.min(100, Math.round((data.totalGain / maxGain) * 100)) : 0;
  const bar = document.getElementById("progressBar");

  function animate() {
    if (Math.abs(currentPercent - targetPercent) < 1) {
      currentPercent = targetPercent;
      bar.style.width = currentPercent + "%";
      bar.textContent = currentPercent + "%";
      let green = Math.min(255, Math.max(0, Math.floor((data.totalGain / maxGain) * 255)));
      let red = 255 - green;
      bar.style.backgroundColor = `rgb(${red},${green},0)`;
      return;
    }
    currentPercent += (targetPercent - currentPercent) * 0.1;
    bar.style.width = currentPercent + "%";
    bar.textContent = Math.round(currentPercent) + "%";
    let green = Math.min(255, Math.max(0, Math.floor((data.totalGain / maxGain) * 255)));
    let red = 255 - green;
    bar.style.backgroundColor = `rgb(${red},${green},0)`;
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

/* ===================== 8️⃣ Statistiques ===================== */
function updateStats() {
  document.getElementById("winCount").textContent = data.winCount;
  document.getElementById("loseCount").textContent = data.loseCount;
  document.getElementById("withdrawCount").textContent = data.withdrawCount;
}

/* ===================== 9️⃣ Tableau des jours ===================== */
function renderTable() {
  tbody.innerHTML = '';
  let capTemp = data.capitalInitial;
  for (let i = 1; i <= JOURS; i++) {
    const j = data.jours[i];
    if (j) capTemp = j.cap;
    let indicatorColor = j ? (j.res === 'g' ? 'var(--gain)' : 'var(--loss)') : 'var(--muted)';
    let dayLabel = j ? new Date(j.date).toLocaleDateString() : `J${i}`;
    let resultText = j ? j.gain : '—';
    tbody.innerHTML += `
      <tr>
        <td class="day-editable" onclick="editDay(${i})">
          <span class="indicator" style="background-color:${indicatorColor}"></span>${dayLabel}
        </td>
        <td class="result" style="color:${indicatorColor}">${resultText}</td>
        <td class="capital">${capTemp}</td>
        <td class="actions">
          <button class="win" onclick="setResult(${i},'g')">✔</button>
          <button class="lose" onclick="setResult(${i},'p')">✖</button>
          <button class="undo" onclick="undo(${i})">↩</button>
        </td>
      </tr>`;
  }
}

/* ===================== 10️⃣ Modifier jour et date ===================== */
function editDay(jour) {
  const j = data.jours[jour] || {};

  const newLabel = prompt("Modifier le jour (ex: J1, Lundi…)", `J${jour}`);
  if (newLabel) {
    const cellLabel = tbody.rows[jour-1].cells[0];
    const indicator = cellLabel.querySelector('.indicator');
    cellLabel.textContent = newLabel;
    if (indicator) cellLabel.prepend(indicator);
  }

  const oldDate = j.date ? new Date(j.date).toISOString().split('T')[0] : '';
  const newDate = prompt("Modifier la date (YYYY-MM-DD)", oldDate);
  if (newDate) {
    const parsedDate = new Date(newDate);
    if (!isNaN(parsedDate)) {
      if (!data.jours[jour]) data.jours[jour] = { res: null, gain: 0, cap: data.capitalInitial, date: newDate };
      data.jours[jour].date = parsedDate.toISOString();
      save();
      renderTable();
      updateDisplay();
    } else {
      alert("Date invalide ! Format attendu : YYYY-MM-DD");
    }
  }
}

/* ===================== 11️⃣ Appliquer cote et calcul gain/perte ===================== */
function applyPendingCote() { 
  if (data.pendingCote !== null) { 
    data.cote = data.pendingCote; 
    data.pendingCote = null; 
  }
}

function setResult(jour, res) {
  if (data.jours[jour] || data.capital === 0) return;
  applyPendingCote();
  let gain = 0;
  const today = new Date().toISOString();

  if (res === 'g') {
    data.streak++; 
    gain = gainJour(); 
    data.capital += gain; 
    data.totalGain += gain; 
    data.winCount++;
    notify(`✅ Gain de ${gain} HTG enregistré`, 'gain');
    if (data.streak === 4) {
      const retrait = data.capital - data.capitalInitial;
      data.totalWithdraw += retrait;
      notify(`💸 4 paliers gagnés – Retrait ${retrait} HTG`, 'withdraw');
      data.capital = data.capitalInitial; 
      data.mise = data.miseInitiale; 
      data.streak = 0; 
      data.withdrawCount++;
    }
  } else {
    data.capital -= data.mise; 
    data.streak = 0; 
    data.loseCount++;
    if (data.capital < 0) data.capital = 0;
    notify(`❌ Perte de ${data.mise} HTG`, 'loss');
  }

  data.jours[jour] = { res, gain, cap: data.capital, date: today };
  save(); 
  renderTable(); 
  updateDisplay();
}

/* ===================== 12️⃣ Undo ===================== */
function undo(jour) {
  const j = data.jours[jour]; 
  if (!j) return;
  if (j.res === 'g') {
    data.capital -= j.gain; 
    data.totalGain -= j.gain; 
    data.streak = Math.max(0, data.streak - 1); 
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

/* ===================== 13️⃣ Réglages / reset / export ===================== */
function applySettings() {
  data.capitalInitial = +capitalInput.value || 0; 
  data.capital = data.capitalInitial;
  data.miseInitiale = data.mise = +miseInput.value || 0;
  data.pendingCote = +coteInput.value || 1.20;
  data.totalGain = 0; 
  data.streak = 0; 
  data.locked = false;
  data.jours = {}; 
  data.winCount = 0; 
  data.loseCount = 0; 
  data.withdrawCount = 0; 
  data.totalWithdraw = 0;
  save(); 
  renderTable(); 
  updateDisplay();
  document.getElementById("gameCard").classList.remove("locked");
}

function resetMonth() {
  if (confirm("Tout réinitialiser ?")) {
    localStorage.removeItem("montanteData");
    data = {
      capitalInitial: 0, capital: 0, mise: 0, miseInitiale: 0, cote: 1.20, pendingCote: null,
      totalGain: 0, streak: 0, locked: false, jours: {}, winCount: 0, loseCount: 0, withdrawCount: 0, totalWithdraw: 0
    };
    renderTable(); 
    updateDisplay(); 
    document.getElementById("gameCard").classList.remove("locked");
  }
}

function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Montante Discipline", 14, 16);
  doc.autoTable({ html: document.getElementById("montanteTable"), startY: 20 });
  doc.save("Montante.pdf");
}

function exportExcel() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(document.getElementById("montanteTable"));
  XLSX.utils.book_append_sheet(wb, ws, "Montante");
  XLSX.writeFile(wb, "Montante.xlsx");
}

/* ===================== 14️⃣ Affichage + résumé du mois ===================== */
function updateDisplay() {
  updateRules(); 
  capitalView.textContent = data.capital; 
  totalGainView.textContent = data.totalGain;
  streakView.textContent = data.streak; 
  updateProgressBar(); 
  updateStats();
  if (data.capital === 0) {
    document.getElementById("gameCard").classList.add("locked");
  } else {
    document.getElementById("gameCard").classList.remove("locked");
  }
  showMonthSummary();
}

function showMonthSummary() {
  if (Object.keys(data.jours).length < JOURS) return;

  let gains = 0, pertes = 0;
  for (let i = 1; i <= JOURS; i++) {
    const j = data.jours[i];
    if (!j) continue;
    if (j.res === 'g') gains += j.gain;
    else pertes += data.mise;
  }
  const profit = gains - pertes;
  const capitalFinal = data.capital;
  const verdict = profit > 0 
    ? (profit > data.capitalInitial ? "💰 Résultat Value !" : "💰 Résultat positif") 
    : "⚠️ Résultat négatif";

  document.getElementById("summaryCapitalInitial").textContent = data.capitalInitial;
  document.getElementById("summaryCapitalFinal").textContent = capitalFinal;
  document.getElementById("summaryGains").textContent = gains;
  document.getElementById("summaryLosses").textContent = pertes;
  document.getElementById("summaryProfit").textContent = profit;
  document.getElementById("summaryWithdraw").textContent = data.totalWithdraw;
  document.getElementById("summaryVerdict").textContent = verdict;

  document.getElementById("monthSummary").style.display = "block";
  notify(`🎉 Fin du mois ! Profit net : ${profit} HTG | Verdict : ${verdict}`, 'withdraw');
}

/* ===================== 15️⃣ Initialisation ===================== */
renderTable();
updateDisplay();
