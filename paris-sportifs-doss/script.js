/* CONSTANTES */
const MAX_CAPITAL = 500000;
const MAX_MISE = 500000;
const MAX_MNT = 3;

/* VARIABLES */
let data = [];
let capitalDepart = 0;

/* ELEMENTS DOM */
const tableBody = document.getElementById("tableBody");
const capitalDepartInput = document.getElementById("capitalDepartInput");
const capitalActuelInput = document.getElementById("capitalActuelInput");
const gainGlobaleSpan = document.getElementById("gainGlobale");
const profitGlobaleSpan = document.getElementById("profitGlobale");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

/* FORMATAGE */
function format(n){
    return Number(n).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2});
}
function formatHTG(n){return format(n)+" HTG";}
function today(){
    const d=new Date();
    return d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear().toString().slice(-2);
}

/* CAPITAL */
capitalDepartInput.addEventListener("input",()=>{
    let value=parseFloat(capitalDepartInput.value)||0;
    if(value>MAX_CAPITAL)value=MAX_CAPITAL;
    if(value<0)value=0;
    capitalDepart=value;
    resetProgress();
    renderTable();
});

/* RESET BARRE PROGRESSION */
function resetProgress(){
    progressBar.style.width = "0%";
    progressBar.style.background = "yellow";
    progressText.textContent = "0%";
}

/* RENDER TABLE */
function renderTable(){
    tableBody.innerHTML="";
    let tempCapital=capitalDepart;

    data.forEach((row,index)=>{

        let gain,profit;

        if(row.loss){
            gain=0;
            profit=-row.mise;
        }else{
            gain=row.mise*row.cote;
            profit=gain-row.mise;
        }

        tempCapital+=profit;

        /* Montante automatique */
        if(!row.manualMise && index>0){
            if(data[index-1].loss){
                row.mise=data[index-1].mise*2;
            }else{
                row.mise=capitalDepart;
            }
        }

        const tr=document.createElement("tr");
        if(row.loss) tr.classList.add("loss-animation");

        tr.innerHTML=`
        <td>${index+1}</td>
        <td><input value="${row.date}" onchange="updateCell(${index},'date',this.value)"></td>
        <td><input type="number" value="${row.mise}" onchange="updateMise(${index},this.value)"></td>
        <td><input type="number" value="${row.cote}" onchange="updateCell(${index},'cote',this.value)"></td>
        <td class="profit ${row.loss?'red':'green'}" onclick="toggleLoss(${index})">${format(gain)}</td>
        <td class="profit ${profit>=0?'green':'red'}">${format(profit)}</td>
        <td><input type="number" value="${row.mtc}" onchange="updateCell(${index},'mtc',this.value)"></td>
        <td><input type="number" min="1" max="3" value="${row.mnt}" onchange="updateMnt(${index},this.value)"></td>
        <td onclick="toggleLive(${index})"><div class="live-dot" style="background:${row.live?'red':'gray'}"></div></td>
        <td><button class="delete-btn" onclick="deleteRow(${index})">X</button></td>
        `;

        tableBody.appendChild(tr);
    });

    capitalActuelInput.value=formatHTG(tempCapital);
    updateGlobale();
    updateProgress(tempCapital);
    saveAll();
}

/* BARRE DE PROGRESSION DYNAMIQUE */
function updateProgress(current){
    if(capitalDepart <= 0) {
        resetProgress();
        return;
    }

    // Variation en %
    let percent = ((current - capitalDepart) / capitalDepart) * 100;

    // Détermination couleur
    let color = "yellow"; // neutre
    if(percent > 0) color = "green";
    else if(percent < 0) color = "red";

    // Limites visuelles
    let displayPercent = percent;
    if(displayPercent > 200) displayPercent = 200;
    if(displayPercent < -100) displayPercent = -100;

    // Mise à jour barre
    progressBar.style.width = Math.abs(displayPercent) + "%";
    progressBar.style.background = color;

    // Texte
    progressText.textContent = (percent >= 0 ? "+" : "") + Math.floor(percent) + "%";
}

/* AUTRES FONCTIONS */
function updateMise(i,v){
    let val=parseFloat(v)||0;
    if(val>MAX_MISE) val=MAX_MISE;
    if(val<0) val=0;
    data[i].mise=val;
    data[i].manualMise=true;
    renderTable();
}

function updateMnt(i,v){
    data[i].mnt=parseInt(v)||1;
    renderTable();
}

function updateCell(i,k,v){
    data[i][k]=k==="date"?v:parseFloat(v)||0;
    renderTable();
}

function toggleLoss(i){
    data[i].loss=!data[i].loss;
    renderTable();
}

function toggleLive(i){
    data[i].live=!data[i].live;
    renderTable();
}

function addRow(){
    data.push({
        date:today(),
        mise:capitalDepart,
        cote:1.2,
        mtc:1,
        mnt:1,
        live:true,
        loss:false,
        manualMise:false
    });
    renderTable();
}

function deleteRow(i){
    data.splice(i,1);
    renderTable();
}

function resetAll(){
    if(confirm("Confirmer le reset total ?")){
        data=[];
        capitalDepart=0;
        capitalDepartInput.value=0;
        resetProgress();
        renderTable();
    }
}

function updateGlobale(){
    let totalGain=0;
    let totalProfit=0;
    data.forEach(row=>{
        let gain=row.loss?0:row.mise*row.cote;
        let profit=row.loss?-row.mise:gain-row.mise;
        totalGain+=gain;
        totalProfit+=profit;
    });
    gainGlobaleSpan.textContent=formatHTG(totalGain);
    profitGlobaleSpan.textContent=formatHTG(totalProfit);
    gainGlobaleSpan.className=totalGain>=0?'green':'red';
    profitGlobaleSpan.className=totalProfit>=0?'green':'red';
}

function saveAll(){
    localStorage.setItem("tableData",JSON.stringify(data));
    localStorage.setItem("capitalDepart",capitalDepart);
}

function loadAll(){
    const savedData=localStorage.getItem("tableData");
    const savedCapital=localStorage.getItem("capitalDepart");
    if(savedData) data=JSON.parse(savedData);
    if(savedCapital){
        capitalDepart=parseFloat(savedCapital)||0;
        capitalDepartInput.value=capitalDepart;
    }
    renderTable();
}

function exportPDF(){window.print();}
function exportExcel(){alert("Export Excel prêt.");}
function exportWhatsApp(){alert("Export WhatsApp prêt.");}

/* INITIALISATION */
resetProgress();
loadAll();
