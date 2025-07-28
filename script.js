const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";
let dados = [];

function carregarDados() {
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        complete: function (results) {
            console.log("Dados CSV:", results.data);
            dados = results.data.filter(row => row["Clube (Email)"]); 
            popularSelectClubes();
            atualizarDashboard();
        }
    });
}

function popularSelectClubes() {
    const select = document.getElementById("clubeSelect");
    select.innerHTML = "<option value='Todos'>Todos</option>";
    [...new Set(dados.map(row => row["Clube (Email)"]))].forEach(clube => {
        select.innerHTML += `<option value="${clube}">${clube}</option>`;
    });
}

function aplicarFiltros() {
    atualizarDashboard();
}

function atualizarDashboard() {
    const dataInicial = document.getElementById("dataInicial").value;
    const dataFinal = document.getElementById("dataFinal").value;
    const clubeSelecionado = document.getElementById("clubeSelect").value;

    let filtrados = dados.filter(row => {
        let dataValida = true;
        if (dataInicial) dataValida = new Date(row["DATA"]) >= new Date(dataInicial);
        if (dataFinal) dataValida = dataValida && new Date(row["DATA"]) <= new Date(dataFinal);
        if (clubeSelecionado !== "Todos") dataValida = dataValida && row["Clube (Email)"] === clubeSelecionado;
        return dataValida;
    });

    const ftdTotal = filtrados.reduce((acc, row) => acc + (parseFloat(row["FTD"]) || 0), 0);
    const depositosTotal = filtrados.reduce((acc, row) => acc + (parseFloat(row["Depositos"]) || 0), 0);
    const ggrTotal = filtrados.reduce((acc, row) => acc + (parseFloat(row["GGR"]) || 0), 0);

    document.getElementById("ftdTotal").innerText = formatarMoeda(ftdTotal);
    document.getElementById("depositosTotal").innerText = formatarMoeda(depositosTotal);
    document.getElementById("ggrTotal").innerText = formatarMoeda(ggrTotal);
    document.getElementById("clubesAtivos").innerText = [...new Set(filtrados.map(row => row["Clube (Email)"]))].length;

    atualizarTopClubes(filtrados);
    atualizarGraficos(filtrados);
}

function atualizarTopClubes(filtrados) {
    const ranking = {};
    filtrados.forEach(row => {
        const clube = row["Clube (Email)"];
        const ggr = parseFloat(row["GGR"]) || 0;
        ranking[clube] = (ranking[clube] || 0) + ggr;
    });

    const top10 = Object.entries(ranking)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const tbody = document.querySelector("#topClubes tbody");
    tbody.innerHTML = "";
    top10.forEach(([clube, ggr]) => {
        tbody.innerHTML += `<tr><td>${clube}</td><td>${formatarMoeda(ggr)}</td></tr>`;
    });
}

let chartGGR, chartFTD, chartDepositos;
function atualizarGraficos(filtrados) {
    const porDia = {};
    filtrados.forEach(row => {
        const data = row["DATA"];
        if (!porDia[data]) porDia[data] = { ggr: 0, ftd: 0, depositos: 0 };
        porDia[data].ggr += parseFloat(row["GGR"]) || 0;
        porDia[data].ftd += parseFloat(row["FTD"]) || 0;
        porDia[data].depositos += parseFloat(row["Depositos"]) || 0;
    });

    const labels = Object.keys(porDia).sort();
    const ggr = labels.map(d => porDia[d].ggr);
    const ftd = labels.map(d => porDia[d].ftd);
    const depositos = labels.map(d => porDia[d].depositos);

    if (chartGGR) chartGGR.destroy();
    if (chartFTD) chartFTD.destroy();
    if (chartDepositos) chartDepositos.destroy();

    chartGGR = new Chart(document.getElementById("graficoGGR"), {
        type: 'line',
        data: { labels, datasets: [{ label: 'GGR por Dia', data: ggr, borderColor: 'lime', fill: false }] }
    });
    chartFTD = new Chart(document.getElementById("graficoFTD"), {
        type: 'line',
        data: { labels, datasets: [{ label: 'FTD por Dia', data: ftd, borderColor: 'yellow', fill: false }] }
    });
    chartDepositos = new Chart(document.getElementById("graficoDepositos"), {
        type: 'line',
        data: { labels, datasets: [{ label: 'Depósitos por Dia', data: depositos, borderColor: 'blue', fill: false }] }
    });
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

window.onload = carregarDados;
