const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dados = [];

document.addEventListener("DOMContentLoaded", () => {
    carregarDados();
    document.getElementById('aplicarFiltro').addEventListener('click', aplicarFiltros);
});

function carregarDados() {
    console.log("Iniciando carregamento do CSV...");
    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        complete: (resultado) => {
            if (!resultado.data || resultado.data.length === 0) {
                console.error("Erro: Nenhum dado carregado do CSV.");
                return;
            }
            dados = resultado.data.map(linha => normalizarDados(linha));
            console.log("Linhas recebidas:", dados.length);
            console.log("Primeira linha recebida:", dados[0]);
            atualizarDashboard(dados);
            preencherFiltroClubes(dados);
        },
        error: (err) => console.error("Erro ao carregar CSV:", err)
    });
}

function normalizarDados(linha) {
    return {
        data: linha["DATA"],
        clube: linha["Usuário - Nome de usuário"],
        ftd: parseFloat((linha["Usuário - FTD-Montante"] || "0").replace(/\./g,"").replace(",", ".")),
        depositos: parseFloat((linha["Usuário - Depósitos"] || "0").replace(/\./g,"").replace(",", ".")),
        ggr: parseFloat((linha["Cálculo - GGR"] || "0").replace(/\./g,"").replace(",", ".")),
        sportsGGR: parseFloat((linha["Sportsbook - GGR"] || "0").replace(/\./g,"").replace(",", ".")),
        cassinoGGR: parseFloat((linha["Cassino - GGR"] || "0").replace(/\./g,"").replace(",", "."))
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
    const dataFiltro = document.getElementById("dataFiltro").value;
    const clubeFiltro = document.getElementById("clubeSelect").value;

    let filtrados = dados;
    if (dataFiltro) filtrados = filtrados.filter(d => d.data === dataFiltro);
    if (clubeFiltro) filtrados = filtrados.filter(d => d.clube === clubeFiltro);

    console.log(`Filtro aplicado - Data: ${dataFiltro || "Todas"}, Clube: ${clubeFiltro || "Todos"}`);
    atualizarDashboard(filtrados);
}

function atualizarDashboard(filtrados) {
    const totalFTD = filtrados.reduce((sum, d) => sum + d.ftd, 0);
    const totalDepositos = filtrados.reduce((sum, d) => sum + d.depositos, 0);
    const totalGGR = filtrados.reduce((sum, d) => sum + d.ggr, 0);

    document.getElementById("totalFTD").textContent = formatarMoeda(totalFTD);
    document.getElementById("totalDepositos").textContent = formatarMoeda(totalDepositos);
    document.getElementById("totalGGR").textContent = formatarMoeda(totalGGR);

    montarGraficos(filtrados);
    montarTabelas(filtrados);

    document.getElementById("ultimaAtualizacao").textContent = "Última atualização: " + new Date().toLocaleString();
}

function montarGraficos(filtrados) {
    const porData = {};
    filtrados.forEach(d => {
        if (!porData[d.data]) porData[d.data] = { ggr: 0, ftd: 0, depositos: 0 };
        porData[d.data].ggr += d.ggr;
        porData[d.data].ftd += d.ftd;
        porData[d.data].depositos += d.depositos;
    });

    const labels = Object.keys(porData).sort();
    const ggr = labels.map(d => porData[d].ggr);
    const ftd = labels.map(d => porData[d].ftd);
    const depositos = labels.map(d => porData[d].depositos);

    new Chart(document.getElementById('graficoGGR').getContext('2d'), { type: 'line', data: { labels, datasets: [{ label: 'GGR', data: ggr, borderColor: '#0f0' }] }});
    new Chart(document.getElementById('graficoFTD').getContext('2d'), { type: 'line', data: { labels, datasets: [{ label: 'FTD', data: ftd, borderColor: '#00f' }] }});
    new Chart(document.getElementById('graficoDepositos').getContext('2d'), { type: 'line', data: { labels, datasets: [{ label: 'Depósitos', data: depositos, borderColor: '#ff0' }] }});
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
