const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dadosNormalizados = [];
let charts = {};

document.addEventListener("DOMContentLoaded", carregarDados);

function carregarDados() {
    console.log("Iniciando carregamento do CSV...");
    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        complete: (res) => {
            console.log("Linhas recebidas:", res.data.length);
            console.log("Primeira linha recebida:", res.data[0]);
            normalizarDados(res.data);
        }
    });
}

function normalizarDados(data) {
    dadosNormalizados = data.filter(linha => linha["DATA"]).map(linha => ({
        data: linha["DATA"],
        clube: linha["Usuário - Nome de usuário"],
        ftd: parseFloat(linha["Usuário - FTD-Montante"].replace(",", ".")) || 0,
        depositos: parseFloat(linha["Usuário - Depósitos"].replace(",", ".")) || 0,
        ggr: parseFloat(linha["Cálculo - GGR"].replace(",", ".")) || 0,
        contagemDeposito: parseInt(linha["Usuário - Contagem de depósito"]) || 0
    }));

    console.log("Primeiras 5 linhas normalizadas:", dadosNormalizados.slice(0, 5));
    atualizarDashboard();
}

function atualizarDashboard() {
    const dataFiltro = document.getElementById("dataFiltro").value;
    const clubeFiltro = document.getElementById("clubeSelect").value;

    const filtrados = dadosNormalizados.filter(item => {
        return (!dataFiltro || item.data === dataFiltro) && (!clubeFiltro || item.clube === clubeFiltro);
    });

    let totalFTD = filtrados.reduce((sum, r) => sum + r.ftd, 0);
    let totalDepositos = filtrados.reduce((sum, r) => sum + r.depositos, 0);
    let totalGGR = filtrados.reduce((sum, r) => sum + r.ggr, 0);
    let taxaRetencao = calcularTaxaRetencao(filtrados);

    document.getElementById("totalFTD").innerText = `R$ ${totalFTD.toLocaleString("pt-BR")}`;
    document.getElementById("totalDepositos").innerText = `R$ ${totalDepositos.toLocaleString("pt-BR")}`;
    document.getElementById("totalGGR").innerText = `R$ ${totalGGR.toLocaleString("pt-BR")}`;
    document.getElementById("taxaRetencao").innerText = `${taxaRetencao.toFixed(1)}%`;

    montarGraficos(filtrados);
    montarTabelas(filtrados);
    document.getElementById("ultimaAtualizacao").innerText = new Date().toLocaleString();
}

function calcularTaxaRetencao(dados) {
    if (!dados.length) return 0;
    let totalUsuarios = dados.length;
    let retidos = dados.filter(r => r.contagemDeposito > 1).length;
    return (retidos / totalUsuarios) * 100;
}

function montarGraficos(dados) {
    if (charts.ggr) charts.ggr.destroy();
    if (charts.ftd) charts.ftd.destroy();
    if (charts.depositos) charts.depositos.destroy();
    if (charts.retencao) charts.retencao.destroy();

    const dias = [...new Set(dados.map(r => r.data))].sort();
    const ggrPorDia = dias.map(d => dados.filter(r => r.data === d).reduce((s, r) => s + r.ggr, 0));
    const ftdPorDia = dias.map(d => dados.filter(r => r.data === d).reduce((s, r) => s + r.ftd, 0));
    const depPorDia = dias.map(d => dados.filter(r => r.data === d).reduce((s, r) => s + r.depositos, 0));

    charts.ggr = criarGrafico("graficoGGR", "GGR por Dia", dias, ggrPorDia);
    charts.ftd = criarGrafico("graficoFTD", "FTD por Dia", dias, ftdPorDia);
    charts.depositos = criarGrafico("graficoDepositos", "Depósitos por Dia", dias, depPorDia);
    charts.retencao = criarGrafico("graficoRetencao", "Retenção (%)", ["Clube"], [calcularTaxaRetencao(dados)]);
}

function criarGrafico(id, label, labels, valores) {
    return new Chart(document.getElementById(id), {
        type: 'line',
        data: { labels: labels, datasets: [{ label: label, data: valores, borderColor: "#0f0", fill: false }] },
        options: { responsive: true, plugins: { legend: { display: true } } }
    });
}

function montarTabelas(dados) {
    preencherRanking("rankingDepositos", "depositos", dados);
    preencherRanking("rankingFTD", "ftd", dados);
    preencherRanking("rankingGGR", "ggr", dados);
    preencherRankingRetencao("rankingRetencao", dados);
}

function preencherRanking(id, campo, dados) {
    const clubes = {};
    dados.forEach(r => clubes[r.clube] = (clubes[r.clube] || 0) + r[campo]);
    const ranking = Object.entries(clubes).sort((a, b) => b[1] - a[1]).slice(0, 10);
    document.getElementById(id).innerHTML = `<tr><th>Clube</th><th>${campo}</th></tr>` +
        ranking.map(r => `<tr><td>${r[0]}</td><td>${r[1].toLocaleString("pt-BR")}</td></tr>`).join("");
}

function preencherRankingRetencao(id, dados) {
    const clubes = {};
    dados.forEach(r => {
        if (!clubes[r.clube]) clubes[r.clube] = { total: 0, retidos: 0 };
        clubes[r.clube].total++;
        if (r.contagemDeposito > 1) clubes[r.clube].retidos++;
    });
    const ranking = Object.entries(clubes)
        .map(([clube, stats]) => ({ clube, taxa: (stats.retidos / stats.total) * 100 }))
        .sort((a, b) => b.taxa - a.taxa)
        .slice(0, 10);
    document.getElementById(id).innerHTML = `<tr><th>Clube</th><th>Retenção (%)</th></tr>` +
        ranking.map(r => `<tr><td>${r.clube}</td><td>${r.taxa.toFixed(1)}%</td></tr>`).join("");
}

function aplicarFiltros() { atualizarDashboard(); }
