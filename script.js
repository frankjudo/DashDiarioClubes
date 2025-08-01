const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";
let dadosNormalizados = [];
let charts = {};

document.addEventListener("DOMContentLoaded", carregarDados);

function carregarDados() {
    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        complete: res => {
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
        sportsGGR: parseFloat(linha["Sportsbook - GGR"].replace(",", ".")) || 0,
        casinoGGR: parseFloat(linha["Cassino - GGR"].replace(",", ".")) || 0
    }));
    atualizarDashboard();
}

function atualizarDashboard() {
    const dataFiltro = document.getElementById("dataFiltro").value;
    const clubeFiltro = document.getElementById("clubeSelect").value;

    const filtrados = dadosNormalizados.filter(item =>
        (!dataFiltro || item.data === dataFiltro) &&
        (!clubeFiltro || item.clube === clubeFiltro)
    );

    document.getElementById("totalFTD").innerText = `R$ ${soma(filtrados, "ftd")}`;
    document.getElementById("totalDepositos").innerText = `R$ ${soma(filtrados, "depositos")}`;
    document.getElementById("totalGGR").innerText = `R$ ${soma(filtrados, "ggr")}`;
    document.getElementById("totalSportsGGR").innerText = `R$ ${soma(filtrados, "sportsGGR")}`;
    document.getElementById("totalCasinoGGR").innerText = `R$ ${soma(filtrados, "casinoGGR")}`;

    montarGraficos(filtrados);
    montarTabelas(filtrados);

    document.getElementById("ultimaAtualizacao").innerText = new Date().toLocaleString();
}

function soma(dados, campo) {
    return dados.reduce((acc, r) => acc + r[campo], 0).toLocaleString("pt-BR");
}

function montarGraficos(dados) {
    for (let c in charts) charts[c].destroy();

    const dias = [...new Set(dados.map(r => r.data))].sort();
    const porDia = (campo) => dias.map(d => dados.filter(r => r.data === d).reduce((s, r) => s + r[campo], 0));

    charts.ggr = criarGrafico("graficoGGR", "GGR por Dia", dias, porDia("ggr"));
    charts.ftd = criarGrafico("graficoFTD", "FTD por Dia", dias, porDia("ftd"));
    charts.depositos = criarGrafico("graficoDepositos", "Depósitos por Dia", dias, porDia("depositos"));
    charts.sports = criarGrafico("graficoSportsGGR", "Sportsbook GGR por Dia", dias, porDia("sportsGGR"));
    charts.casino = criarGrafico("graficoCasinoGGR", "Cassino GGR por Dia", dias, porDia("casinoGGR"));
}

function criarGrafico(id, label, labels, valores) {
    return new Chart(document.getElementById(id), {
        type: 'line',
        data: { labels, datasets: [{ label, data: valores, borderColor: "#0f0", fill: false }] },
        options: { responsive: true }
    });
}

function montarTabelas(dados) {
    preencherRanking("rankingDepositos", "depositos", dados);
    preencherRanking("rankingFTD", "ftd", dados);
    preencherRanking("rankingGGR", "ggr", dados);
    preencherRanking("rankingSportsGGR", "sportsGGR", dados);
    preencherRanking("rankingCasinoGGR", "casinoGGR", dados);
}

function preencherRanking(id, campo, dados) {
    const clubes = {};
    dados.forEach(r => clubes[r.clube] = (clubes[r.clube] || 0) + r[campo]);
    const ranking = Object.entries(clubes).sort((a, b) => b[1] - a[1]).slice(0, 10);
    document.getElementById(id).innerHTML = `<tr><th>Clube</th><th>${campo}</th></tr>` +
        ranking.map(r => `<tr><td>${r[0]}</td><td>${r[1].toLocaleString("pt-BR")}</td></tr>`).join("");
}

function aplicarFiltros() { atualizarDashboard(); }
