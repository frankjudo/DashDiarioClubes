console.log("Rodando versão DEBUG");

const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dados = [];
let charts = {};

$(document).ready(() => {
    carregarDados();

    $("#aplicar").on("click", () => {
        console.log("Filtro aplicado:", $("#clube").val(), $("#data").val());
        atualizarDashboard();
    });
});

async function carregarDados() {
    console.log("Iniciando carregamento do CSV...");
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error("Erro ao carregar CSV");
        const csvData = await response.text();
        processarDados(csvData);
    } catch (err) {
        console.error("Erro ao carregar dados:", err);
        alert("Erro ao carregar dados. Verifique a conexão ou tente novamente.");
    }
}

function processarDados(csvData) {
    console.log("Processando dados...");
    const linhas = csvData.split("\n").map(l => l.split(","));
    const cabecalho = linhas.shift();
    console.log("Cabeçalho:", cabecalho);
    console.log("Total de linhas:", linhas.length);

    dados = linhas.map(l => {
        return {
            data: l[0],
            clube: l[4],
            ftd: parseFloat(l[5] || 0),
            depositos: parseFloat(l[6] || 0),
            ggr: parseFloat(l[21] || 0),
            sportsbookGgr: parseFloat(l[9] || 0),
            cassinoGgr: parseFloat(l[12] || 0)
        };
    });

    popularFiltroClubes();
    atualizarDashboard();
}

function popularFiltroClubes() {
    const clubes = [...new Set(dados.map(d => d.clube))];
    clubes.forEach(clube => {
        $("#clube").append(`<option value="${clube}">${clube}</option>`);
    });
    console.log("Clubes carregados no filtro:", clubes.length);
}

function atualizarDashboard() {
    console.log("Atualizando dashboard...");
    const filtroClube = $("#clube").val();
    let filtrados = filtroClube === "Todos" ? dados : dados.filter(d => d.clube === filtroClube);

    const totalFtd = filtrados.reduce((s, d) => s + d.ftd, 0);
    const totalDepositos = filtrados.reduce((s, d) => s + d.depositos, 0);
    const totalGgr = filtrados.reduce((s, d) => s + d.ggr, 0);
    const totalSportsbook = filtrados.reduce((s, d) => s + d.sportsbookGgr, 0);
    const totalCassino = filtrados.reduce((s, d) => s + d.cassinoGgr, 0);

    $("#valor-ftd").text(totalFtd.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    $("#valor-depositos").text(totalDepositos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    $("#valor-ggr").text(totalGgr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    $("#valor-sportsbook-ggr").text(totalSportsbook.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    $("#valor-cassino-ggr").text(totalCassino.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

    montarGraficos(filtrados);
    montarTabelas(filtrados);
}

function montarGraficos(filtrados) {
    console.log("Montando gráficos...");

    const datas = [...new Set(filtrados.map(d => d.data))];

    criarGrafico("grafico-ggr", "GGR por Dia", datas, filtrados.map(d => d.ggr), "lime");
    criarGrafico("grafico-depositos", "Depósitos por Dia", datas, filtrados.map(d => d.depositos), "blue");
    criarGrafico("grafico-ftd", "FTD por Dia", datas, filtrados.map(d => d.ftd), "yellow");
    criarGrafico("grafico-sportsbook-ggr", "Sportsbook GGR por Dia", datas, filtrados.map(d => d.sportsbookGgr), "orange");
    criarGrafico("grafico-cassino-ggr", "Cassino GGR por Dia", datas, filtrados.map(d => d.cassinoGgr), "purple");
}

function criarGrafico(id, label, labels, data, cor) {
    if (charts[id]) charts[id].destroy();
    const ctx = document.getElementById(id).getContext('2d');
    charts[id] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: cor,
                backgroundColor: "transparent",
                pointBackgroundColor: cor
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#0f0' } } },
            scales: { x: { ticks: { color: '#0f0' } }, y: { ticks: { color: '#0f0' } } }
        }
    });
}

function montarTabelas(filtrados) {
    console.log("Montando tabelas...");
    montarTabela("tabela-depositos", top10(filtrados, "depositos"));
    montarTabela("tabela-ftd", top10(filtrados, "ftd"));
    montarTabela("tabela-ggr", top10(filtrados, "ggr"));
}

function montarTabela(id, dados) {
    let html = "<tr><th>Clube</th><th>Valor</th></tr>";
    dados.forEach(d => {
        html += `<tr><td>${d.clube}</td><td>${d.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>`;
    });
    $(`#${id}`).html(html);
}

function top10(lista, campo) {
    const agrupado = {};
    lista.forEach(d => {
        agrupado[d.clube] = (agrupado[d.clube] || 0) + d[campo];
    });
    return Object.keys(agrupado)
        .map(clube => ({ clube, valor: agrupado[clube] }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10);
}
