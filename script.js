const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dadosFiltrados = [];

document.getElementById("btnFiltrar").addEventListener("click", aplicarFiltros);

Papa.parse(CSV_URL, {
    download: true,
    header: false,
    complete: function(results) {
        processarDados(results.data);
    }
});

function processarDados(data) {
    let clubesSet = new Set();

    dadosFiltrados = data.slice(1).map(linha => {
        const dataStr = linha[0]; // Coluna A
        const clube = linha[2]; // Coluna C
        const ftd = parseFloat(linha[5]) || 0; // Coluna F
        const depositos = parseFloat(linha[6]) || 0; // Coluna G
        const ggr = parseFloat(linha[27]) || 0; // Coluna AB (27)

        clubesSet.add(clube);
        return { dataStr, clube, ftd, depositos, ggr };
    });

    popularFiltroClubes([...clubesSet]);
    atualizarDashboard(dadosFiltrados);
}

function popularFiltroClubes(clubes) {
    const select = document.getElementById("filtroClube");
    select.innerHTML = "<option value=''>Todos</option>";
    clubes.forEach(clube => {
        select.innerHTML += `<option value="${clube}">${clube}</option>`;
    });
}

function aplicarFiltros() {
    const inicio = document.getElementById("dataInicio").value;
    const fim = document.getElementById("dataFim").value;
    const clubeSelecionado = document.getElementById("filtroClube").value;

    let filtrados = dadosFiltrados.filter(item => {
        let ok = true;
        if (inicio && item.dataStr < inicio) ok = false;
        if (fim && item.dataStr > fim) ok = false;
        if (clubeSelecionado && item.clube !== clubeSelecionado) ok = false;
        return ok;
    });

    atualizarDashboard(filtrados);
}

function atualizarDashboard(dados) {
    let totalFTD = 0, totalDepositos = 0, totalGGR = 0;
    let porClube = {};

    dados.forEach(d => {
        totalFTD += d.ftd;
        totalDepositos += d.depositos;
        totalGGR += d.ggr;

        if (!porClube[d.clube]) porClube[d.clube] = 0;
        porClube[d.clube] += d.depositos;
    });

    document.getElementById("cardFTD").innerText = `FTD: R$ ${totalFTD.toLocaleString("pt-BR", {minimumFractionDigits:2})}`;
    document.getElementById("cardDepositos").innerText = `Depósitos: R$ ${totalDepositos.toLocaleString("pt-BR", {minimumFractionDigits:2})}`;
    document.getElementById("cardGGR").innerText = `GGR: R$ ${totalGGR.toLocaleString("pt-BR", {minimumFractionDigits:2})}`;

    atualizarTop10(porClube);
    atualizarGraficos(dados);
}

function atualizarTop10(porClube) {
    let top10 = Object.entries(porClube).sort((a,b) => b[1]-a[1]).slice(0,10);
    let tbody = document.querySelector("#tabelaTop10 tbody");
    tbody.innerHTML = "";
    top10.forEach(([clube, valor]) => {
        tbody.innerHTML += `<tr><td>${clube}</td><td>R$ ${valor.toLocaleString("pt-BR",{minimumFractionDigits:2})}</td></tr>`;
    });
}

let chartFTD, chartDepositos, chartGGR;

function atualizarGraficos(dados) {
    let porData = {};
    dados.forEach(d => {
        if (!porData[d.dataStr]) porData[d.dataStr] = { ftd:0, depositos:0, ggr:0 };
        porData[d.dataStr].ftd += d.ftd;
        porData[d.dataStr].depositos += d.depositos;
        porData[d.dataStr].ggr += d.ggr;
    });

    let labels = Object.keys(porData).sort();
    let ftd = labels.map(l => porData[l].ftd);
    let depositos = labels.map(l => porData[l].depositos);
    let ggr = labels.map(l => porData[l].ggr);

    const cfg = (ctx, label, data) => ({
        type: 'line',
        data: { labels, datasets: [{ label, data, borderColor: '#0f0', backgroundColor: '#0f0', fill: false }] },
        options: { responsive: true, plugins: { legend: { labels: { color: "#0f0" } } }, scales: { x: { ticks: { color: "#0f0" } }, y: { ticks: { color: "#0f0" } } } }
    });

    if (chartFTD) chartFTD.destroy();
    if (chartDepositos) chartDepositos.destroy();
    if (chartGGR) chartGGR.destroy();

    chartFTD = new Chart(document.getElementById("graficoFTD"), cfg("graficoFTD", "FTD", ftd));
    chartDepositos = new Chart(document.getElementById("graficoDepositos"), cfg("graficoDepositos", "Depósitos", depositos));
    chartGGR = new Chart(document.getElementById("graficoGGR"), cfg("graficoGGR", "GGR", ggr));
}
