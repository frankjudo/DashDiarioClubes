console.log("Rodando versão DEBUG");

const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let rawData = [];
let charts = {};

function formatCurrency(value) {
    return "R$ " + (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function carregarDados() {
    console.log("Iniciando carregamento do CSV...");
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        complete: function(results) {
            if (!results.data || results.data.length === 0) {
                console.error("Nenhum dado recebido do CSV.");
                return;
            }
            console.log(`Linhas recebidas: ${results.data.length}`);
            rawData = results.data;
            processarDados();
        },
        error: function(err) {
            console.error("Erro ao carregar CSV: ", err);
        }
    });
}

function processarDados() {
    console.log("Processando dados...");
    // Normaliza valores numéricos
    rawData.forEach(row => {
        row["Usuário - Depósitos"] = parseFloat((row["Usuário - Depósitos"] || "0").replace(/\./g, '').replace(',', '.')) || 0;
        row["Usuário - FTD-Montante"] = parseFloat((row["Usuário - FTD-Montante"] || "0").replace(/\./g, '').replace(',', '.')) || 0;
        row["GGR"] = parseFloat((row["GGR"] || "0").replace(/\./g, '').replace(',', '.')) || 0;
        row["Sportsbook - GGR"] = parseFloat((row["Sportsbook - GGR"] || "0").replace(/\./g, '').replace(',', '.')) || 0;
        row["Cassino - GGR"] = parseFloat((row["Cassino - GGR"] || "0").replace(/\./g, '').replace(',', '.')) || 0;
    });

    atualizarDashboard();
}

function atualizarDashboard() {
    console.log("Atualizando dashboard...");
    let totalFTD = 0, totalDepositos = 0, totalGGR = 0, totalSportsGGR = 0, totalCassinoGGR = 0;

    rawData.forEach(r => {
        totalFTD += r["Usuário - FTD-Montante"];
        totalDepositos += r["Usuário - Depósitos"];
        totalGGR += r["GGR"];
        totalSportsGGR += r["Sportsbook - GGR"];
        totalCassinoGGR += r["Cassino - GGR"];
    });

    document.getElementById("ftdValue").innerText = formatCurrency(totalFTD);
    document.getElementById("depositosValue").innerText = formatCurrency(totalDepositos);
    document.getElementById("ggrValue").innerText = formatCurrency(totalGGR);
    document.getElementById("sportsGgrValue").innerText = formatCurrency(totalSportsGGR);
    document.getElementById("cassinoGgrValue").innerText = formatCurrency(totalCassinoGGR);

    montarGraficos();
    montarTabelas();
}

function montarGraficos() {
    console.log("Montando gráficos...");
    const labels = [...new Set(rawData.map(r => r["DATA"]))];

    const valoresPorDia = (campo) => labels.map(d => {
        return rawData.filter(r => r["DATA"] === d).reduce((s, r) => s + (r[campo] || 0), 0);
    });

    criarGrafico("chartGGR", "GGR", labels, valoresPorDia("GGR"), "green");
    criarGrafico("chartDepositos", "Depósitos", labels, valoresPorDia("Usuário - Depósitos"), "blue");
    criarGrafico("chartFTD", "FTD", labels, valoresPorDia("Usuário - FTD-Montante"), "yellow");
    criarGrafico("chartSportsGGR", "Sportsbook GGR", labels, valoresPorDia("Sportsbook - GGR"), "orange");
    criarGrafico("chartCassinoGGR", "Cassino GGR", labels, valoresPorDia("Cassino - GGR"), "purple");
}

function criarGrafico(id, label, labels, data, color) {
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(document.getElementById(id), {
        type: 'line',
        data: { labels, datasets: [{ label, data, borderColor: color, fill: false, tension: 0.3 }] },
        options: { responsive: true, plugins: { legend: { labels: { color: '#0f0' } } }, scales: { x: { ticks: { color: '#0f0' } }, y: { ticks: { color: '#0f0' } } } }
    });
}

function montarTabelas() {
    console.log("Montando tabelas...");
    const clubes = {};

    rawData.forEach(r => {
        const clube = r["Usuário - Nome de usuário"] || "Desconhecido";
        if (!clubes[clube]) clubes[clube] = { Depositos: 0, FTD: 0, GGR: 0 };
        clubes[clube].Depositos += r["Usuário - Depósitos"];
        clubes[clube].FTD += r["Usuário - FTD-Montante"];
        clubes[clube].GGR += r["GGR"];
    });

    const topDepositos = Object.entries(clubes).sort((a, b) => b[1].Depositos - a[1].Depositos).slice(0, 10);
    const topFTD = Object.entries(clubes).sort((a, b) => b[1].FTD - a[1].FTD).slice(0, 10);
    const topGGR = Object.entries(clubes).sort((a, b) => b[1].GGR - a[1].GGR).slice(0, 10);

    preencherTabela("topDepositos", topDepositos, "Depositos");
    preencherTabela("topFTD", topFTD, "FTD");
    preencherTabela("topGGR", topGGR, "GGR");
}

function preencherTabela(id, data, campo) {
    const tbody = document.querySelector(`#${id} tbody`);
    tbody.innerHTML = "";
    data.forEach(([clube, valores]) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${clube}</td><td>${formatCurrency(valores[campo])}</td>`;
        tbody.appendChild(tr);
    });
}

carregarDados();
