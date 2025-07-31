let dadosOriginais = [];
let chartGGR, chartFTD, chartDepositos;

document.addEventListener("DOMContentLoaded", () => {
    carregarCSV();
    document.getElementById('aplicarFiltro').addEventListener('click', aplicarFiltro);
});

function carregarCSV() {
    console.log("Carregando CSV...");
    Papa.parse("https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv", {
        download: true,
        header: true,
        complete: (results) => {
            dadosOriginais = normalizarDados(results.data);
            atualizarDashboard(dadosOriginais);
            atualizarGraficos(dadosOriginais);
            atualizarTabelas(dadosOriginais);
            popularFiltroClubes(dadosOriginais);
        }
    });
}

function normalizarDados(dados) {
    return dados.map(linha => ({
        data: linha["DATA"],
        clube: linha["Usuário - Nome de usuário"],
        ftd: parseFloat(linha["Usuário - FTD-Montante"].replace(",", ".")) || 0,
        depositos: parseFloat(linha["Usuário - Depósitos"].replace(",", ".")) || 0,
        ggr: parseFloat(linha["Cálculo - GGR"].replace(",", ".")) || 0
    }));
}

function popularFiltroClubes(dados) {
    const clubes = [...new Set(dados.map(d => d.clube))];
    const select = document.getElementById('filtroClube');
    clubes.forEach(clube => {
        let opt = document.createElement('option');
        opt.value = clube;
        opt.textContent = clube;
        select.appendChild(opt);
    });
}

function aplicarFiltro() {
    const data = document.getElementById('filtroData').value;
    const clube = document.getElementById('filtroClube').value;

    let filtrados = dadosOriginais;

    if (data) filtrados = filtrados.filter(d => d.data === data);
    if (clube !== "Todos") filtrados = filtrados.filter(d => d.clube === clube);

    atualizarDashboard(filtrados);
    atualizarGraficos(filtrados);
    atualizarTabelas(filtrados);
}

function atualizarDashboard(dados) {
    const ftdTotal = dados.reduce((a, b) => a + b.ftd, 0);
    const depTotal = dados.reduce((a, b) => a + b.depositos, 0);
    const ggrTotal = dados.reduce((a, b) => a + b.ggr, 0);

    document.getElementById("ftdValor").textContent = formatarMoeda(ftdTotal);
    document.getElementById("depositosValor").textContent = formatarMoeda(depTotal);
    document.getElementById("ggrValor").textContent = formatarMoeda(ggrTotal);
}

function atualizarGraficos(dados) {
    const labels = [...new Set(dados.map(d => d.data))];
    const ggr = labels.map(data => somaDia(dados, data, "ggr"));
    const ftd = labels.map(data => somaDia(dados, data, "ftd"));
    const depositos = labels.map(data => somaDia(dados, data, "depositos"));

    if (chartGGR) chartGGR.destroy();
    if (chartFTD) chartFTD.destroy();
    if (chartDepositos) chartDepositos.destroy();

    chartGGR = criarGrafico('graficoGGR', 'GGR', labels, ggr, 'lime');
    chartFTD = criarGrafico('graficoFTD', 'FTD', labels, ftd, 'yellow');
    chartDepositos = criarGrafico('graficoDepositos', 'Depósitos', labels, depositos, 'blue');
}

function criarGrafico(canvasId, label, labels, data, color) {
    return new Chart(document.getElementById(canvasId).getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [{ label, data, borderColor: color, fill: false }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function somaDia(dados, data, campo) {
    return dados.filter(d => d.data === data).reduce((a, b) => a + b[campo], 0);
}

function atualizarTabelas(dados) {
    montarTabela(dados, 'depositos', 'tabelaDepositos');
    montarTabela(dados, 'ftd', 'tabelaFTD');
    montarTabela(dados, 'ggr', 'tabelaGGR');
}

function montarTabela(dados, campo, tabelaId) {
    const top = Object.values(dados.reduce((acc, d) => {
        acc[d.clube] = acc[d.clube] || { clube: d.clube, valor: 0 };
        acc[d.clube].valor += d[campo];
        return acc;
    }, {}))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

    let html = "<tr><th>Clube</th><th>Valor</th></tr>";
    top.forEach(l => html += `<tr><td>${l.clube}</td><td>${formatarMoeda(l.valor)}</td></tr>`);
    document.getElementById(tabelaId).innerHTML = html;
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
