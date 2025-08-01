console.log("Rodando versão DEBUG");

// === CONFIGURAÇÃO ===
const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

// === CARREGAMENTO DO CSV ===
console.log("Iniciando carregamento do CSV...");

Papa.parse(DATA_URL, {
    download: true,
    header: true,
    complete: function (results) {
        console.log(`Linhas recebidas: ${results.data.length}`);
        processarDados(results.data);
    },
    error: function (error) {
        console.error("Erro ao carregar CSV:", error);
        alert("Erro ao carregar dados: verifique a conexão ou o link.");
    }
});

// === PROCESSAR DADOS ===
function processarDados(dados) {
    console.log("Processando dados...");

    dados.forEach(row => {
        // Converter campos monetários
        let ggrRaw = row["GGR"] && row["GGR"].trim() !== "" ? row["GGR"] : row["Cálculo - GGR"];
        if (!row["GGR"] || row["GGR"].trim() === "") {
            console.warn("GGR vazio, usando Cálculo - GGR:", ggrRaw);
        }
        row["GGR"] = parseFloat((ggrRaw || "0").replace(/\./g, '').replace(',', '.')) || 0;
        row["Usuário - FTD-Montante"] = parseFloat((row["Usuário - FTD-Montante"] || "0").replace(/\./g, '').replace(',', '.')) || 0;
        row["Usuário - Depósitos"] = parseFloat((row["Usuário - Depósitos"] || "0").replace(/\./g, '').replace(',', '.')) || 0;
        row["Sportsbook - GGR"] = parseFloat((row["Sportsbook - GGR"] || "0").replace(/\./g, '').replace(',', '.')) || 0;
        row["Cassino - GGR"] = parseFloat((row["Cassino - GGR"] || "0").replace(/\./g, '').replace(',', '.')) || 0;
    });

    atualizarDashboard(dados);
    montarGraficos(dados);
    montarTabelas(dados);
}

// === ATUALIZA KPIs ===
function atualizarDashboard(dados) {
    console.log("Atualizando dashboard...");
    const totalFTD = dados.reduce((sum, r) => sum + r["Usuário - FTD-Montante"], 0);
    const totalDepositos = dados.reduce((sum, r) => sum + r["Usuário - Depósitos"], 0);
    const totalGGR = dados.reduce((sum, r) => sum + r["GGR"], 0);
    const totalSportsGGR = dados.reduce((sum, r) => sum + r["Sportsbook - GGR"], 0);
    const totalCassinoGGR = dados.reduce((sum, r) => sum + r["Cassino - GGR"], 0);

    document.getElementById("ftdTotal").textContent = formatarMoeda(totalFTD);
    document.getElementById("depositosTotal").textContent = formatarMoeda(totalDepositos);
    document.getElementById("ggrTotal").textContent = formatarMoeda(totalGGR);
    document.getElementById("sportsGgrTotal").textContent = formatarMoeda(totalSportsGGR);
    document.getElementById("cassinoGgrTotal").textContent = formatarMoeda(totalCassinoGGR);
}

// === FORMATA MOEDA ===
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// === GRÁFICOS ===
function montarGraficos(dados) {
    console.log("Montando gráficos...");
    const porData = {};

    dados.forEach(row => {
        const data = row["DATA"];
        if (!porData[data]) porData[data] = { GGR: 0, FTD: 0, Depositos: 0, Sports: 0, Cassino: 0 };
        porData[data].GGR += row["GGR"];
        porData[data].FTD += row["Usuário - FTD-Montante"];
        porData[data].Depositos += row["Usuário - Depósitos"];
        porData[data].Sports += row["Sportsbook - GGR"];
        porData[data].Cassino += row["Cassino - GGR"];
    });

    const labels = Object.keys(porData).sort();
    const ggrData = labels.map(l => porData[l].GGR);
    const ftdData = labels.map(l => porData[l].FTD);
    const depData = labels.map(l => porData[l].Depositos);
    const sportsData = labels.map(l => porData[l].Sports);
    const cassinoData = labels.map(l => porData[l].Cassino);

    criarGrafico("graficoGGR", labels, ggrData, "GGR", "lime");
    criarGrafico("graficoDepositos", labels, depData, "Depósitos", "blue");
    criarGrafico("graficoFTD", labels, ftdData, "FTD", "yellow");
    criarGrafico("graficoSportsGGR", labels, sportsData, "Sportsbook GGR", "orange");
    criarGrafico("graficoCassinoGGR", labels, cassinoData, "Cassino GGR", "purple");
}

function criarGrafico(canvasId, labels, data, label, color) {
    new Chart(document.getElementById(canvasId).getContext("2d"), {
        type: 'line',
        data: { labels: labels, datasets: [{ label, data, borderColor: color, fill: false }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#0f0' } } },
            scales: {
                x: { ticks: { color: '#0f0' } },
                y: { ticks: { color: '#0f0' } }
            }
        }
    });
}

// === TABELAS ===
function montarTabelas(dados) {
    console.log("Montando tabelas...");
    montarTabelaTop10(dados, "Usuário - Depósitos", "tabelaDepositos");
    montarTabelaTop10(dados, "Usuário - FTD-Montante", "tabelaFTD");
    montarTabelaTop10(dados, "GGR", "tabelaGGR");
}

function montarTabelaTop10(dados, coluna, tabelaId) {
    const somaPorClube = {};
    dados.forEach(row => {
        const clube = row["Usuário - Nome de usuário"];
        somaPorClube[clube] = (somaPorClube[clube] || 0) + row[coluna];
    });
    const top10 = Object.entries(somaPorClube).sort((a, b) => b[1] - a[1]).slice(0, 10);

    let html = "<tr><th>Clube</th><th>Valor</th></tr>";
    top10.forEach(([clube, valor]) => {
        html += `<tr><td>${clube}</td><td>${formatarMoeda(valor)}</td></tr>`;
    });

    document.getElementById(tabelaId).innerHTML = html;
}
