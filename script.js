const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";
let dados = [];

document.addEventListener("DOMContentLoaded", () => {
    carregarDados();
    document.getElementById('aplicarFiltro').addEventListener('click', aplicarFiltros);
});

function carregarDados() {
    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        complete: (resultado) => {
            dados = resultado.data.map(normalizarDados);
            preencherFiltroClubes(dados);
            atualizarDashboard(dados);
        },
        error: err => console.error("Erro ao carregar CSV:", err)
    });
}

function normalizarDados(linha) {
    return {
        data: linha["DATA"],
        clube: linha["Usuário - Nome de usuário"],
        ftd: parseFloat((linha["Usuário - FTD-Montante"] || "0").replace(/\./g, "").replace(",", ".")),
        depositos: parseFloat((linha["Usuário - Depósitos"] || "0").replace(/\./g, "").replace(",", ".")),
        ggr: parseFloat((linha["Cálculo - GGR"] || "0").replace(/\./g, "").replace(",", ".")),
        sportsGGR: parseFloat((linha["Sportsbook - GGR"] || "0").replace(/\./g, "").replace(",", ".")),
        cassinoGGR: parseFloat((linha["Cassino - GGR"] || "0").replace(/\./g, "").replace(",", "."))
    };
}

function preencherFiltroClubes(dados) {
    const clubes = [...new Set(dados.map(d => d.clube))].sort();
    const select = document.getElementById("clubeSelect");
    select.innerHTML = "<option value=''>Todos</option>";
    clubes.forEach(clube => {
        const opt = document.createElement("option");
        opt.value = clube;
        opt.textContent = clube;
        select.appendChild(opt);
    });
}

function aplicarFiltros() {
    const inicio = document.getElementById("dataInicio").value;
    const fim = document.getElementById("dataFim").value;
    const clube = document.getElementById("clubeSelect").value;

    let filtrados = dados;

    if (inicio) filtrados = filtrados.filter(d => d.data >= inicio);
    if (fim) filtrados = filtrados.filter(d => d.data <= fim);
    if (clube) filtrados = filtrados.filter(d => d.clube === clube);

    atualizarDashboard(filtrados);
}

function atualizarDashboard(filtrados) {
    const totalFTD = filtrados.reduce((s, d) => s + d.ftd, 0);
    const totalDepositos = filtrados.reduce((s, d) => s + d.depositos, 0);
    const totalGGR = filtrados.reduce((s, d) => s + d.ggr, 0);
    const totalSports = filtrados.reduce((s, d) => s + d.sportsGGR, 0);
    const totalCassino = filtrados.reduce((s, d) => s + d.cassinoGGR, 0);

    document.getElementById("totalFTD").textContent = formatarMoeda(totalFTD);
    document.getElementById("totalDepositos").textContent = formatarMoeda(totalDepositos);
    document.getElementById("totalGGR").textContent = formatarMoeda(totalGGR);
    document.getElementById("totalSportsGGR").textContent = formatarMoeda(totalSports);
    document.getElementById("totalCassinoGGR").textContent = formatarMoeda(totalCassino);

    montarGraficos(filtrados);
    montarTabelas(filtrados);
    document.getElementById("ultimaAtualizacao").textContent = "Última atualização: " + new Date().toLocaleString();
}

function montarGraficos(filtrados) {
    const porData = {};
    filtrados.forEach(d => {
        if (!porData[d.data]) porData[d.data] = { ggr: 0, ftd: 0, depositos: 0, sports: 0, cassino: 0 };
        porData[d.data].ggr += d.ggr;
        porData[d.data].ftd += d.ftd;
        porData[d.data].depositos += d.depositos;
        porData[d.data].sports += d.sportsGGR;
        porData[d.data].cassino += d.cassinoGGR;
    });

    const labels = Object.keys(porData).sort();
    const dadosGGR = labels.map(d => porData[d].ggr);
    const dadosFTD = labels.map(d => porData[d].ftd);
    const dadosDepositos = labels.map(d => porData[d].depositos);
    const dadosSports = labels.map(d => porData[d].sports);
    const dadosCassino = labels.map(d => porData[d].cassino);

    criarGrafico('graficoGGR', labels, dadosGGR, 'GGR', '#0f0');
    criarGrafico('graficoFTD', labels, dadosFTD, 'FTD', '#00f');
    criarGrafico('graficoDepositos', labels, dadosDepositos, 'Depósitos', '#ff0');
    criarGrafico('graficoSportsGGR', labels, dadosSports, 'Sportsbook GGR', '#0ff');
    criarGrafico('graficoCassinoGGR', labels, dadosCassino, 'Cassino GGR', '#f0f');
}

function criarGrafico(id, labels, data, label, cor) {
    new Chart(document.getElementById(id).getContext('2d'), {
        type: 'line',
        data: { labels, datasets: [{ label, data, borderColor: cor, fill: false }] },
        options: { responsive: true, plugins: { legend: { labels: { color: '#fff' } } } }
    });
}

function montarTabelas(filtrados) {
    montarRanking(filtrados, "depositos", "rankingDepositos");
    montarRanking(filtrados, "ftd", "rankingFTD");
    montarRanking(filtrados, "ggr", "rankingGGR");
}

function montarRanking(dados, campo, idTabela) {
    const ranking = {};
    dados.forEach(d => ranking[d.clube] = (ranking[d.clube] || 0) + d[campo]);
    const top = Object.entries(ranking).sort((a, b) => b[1] - a[1]).slice(0, 10);

    let html = "<tr><th>Clube</th><th>Valor</th></tr>";
    top.forEach(([clube, valor]) => html += `<tr><td>${clube}</td><td>${formatarMoeda(valor)}</td></tr>`);
    document.getElementById(idTabela).innerHTML = html;
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
