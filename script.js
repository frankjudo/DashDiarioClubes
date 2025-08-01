console.log("Rodando versão DEBUG");

// URL CSV
const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dadosNormalizados = [];

// === Carregar CSV ===
Papa.parse(URL_CSV, {
    download: true,
    header: true,
    complete: function(results) {
        console.log("Linhas recebidas:", results.data.length);
        dadosNormalizados = results.data.map(item => normalizar(item));
        console.log("Primeira linha normalizada:", dadosNormalizados[0]);
        preencherFiltroClubes();
        atualizarDashboard();
    }
});

// === Normalização ===
function normalizar(item) {
    return {
        data: item["DATA"],
        clube: item["Usuário - Nome de usuário"] || "",
        ftd: parseFloat((item["Usuário - FTD-Montante"] || "0").replace(",", ".")) || 0,
        depositos: parseFloat((item["Usuário - Depósitos"] || "0").replace(",", ".")) || 0,
        ggr: parseFloat((item["Cálculo - GGR"] || "0").replace(",", ".")) || 0,
        sportsbook: parseFloat((item["Sportsbook - GGR"] || "0").replace(",", ".")) || 0,
        cassino: parseFloat((item["Cassino - GGR"] || "0").replace(",", ".")) || 0
    };
}

// === Filtros ===
function preencherFiltroClubes() {
    const clubes = [...new Set(dadosNormalizados.map(d => d.clube))].sort();
    const select = document.getElementById("clubeSelect");
    select.innerHTML = `<option value="Todos">Todos</option>` + 
        clubes.map(c => `<option value="${c}">${c}</option>`).join("");
}

document.getElementById("btnAplicar").addEventListener("click", atualizarDashboard);

function atualizarDashboard() {
    const filtroData = document.getElementById("dataFiltro").value;
    const filtroClube = document.getElementById("clubeSelect").value;

    let filtrados = dadosNormalizados.filter(d =>
        (!filtroData || d.data === filtroData) &&
        (!filtroClube || filtroClube === "Todos" || d.clube === filtroClube)
    );

    console.log("Dados filtrados:", filtrados.length);

    // === KPI ===
    const somaFTD = filtrados.reduce((acc, x) => acc + x.ftd, 0);
    const somaDep = filtrados.reduce((acc, x) => acc + x.depositos, 0);
    const somaGGR = filtrados.reduce((acc, x) => acc + x.ggr, 0);
    const somaSport = filtrados.reduce((acc, x) => acc + x.sportsbook, 0);
    const somaCassino = filtrados.reduce((acc, x) => acc + x.cassino, 0);

    document.querySelector("#kpiFTD .valor").textContent = formatarMoeda(somaFTD);
    document.querySelector("#kpiDepositos .valor").textContent = formatarMoeda(somaDep);
    document.querySelector("#kpiGGR .valor").textContent = formatarMoeda(somaGGR);
    document.querySelector("#kpiSportsbookGGR .valor").textContent = formatarMoeda(somaSport);
    document.querySelector("#kpiCassinoGGR .valor").textContent = formatarMoeda(somaCassino);

    montarGraficos(filtrados);
    montarTabelas(filtrados);
}

// === Moeda ===
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// === Gráficos ===
let chartGGR, chartDep, chartFTD, chartSport, chartCassino;

function montarGraficos(dados) {
    const porData = agruparPorData(dados);

    const datas = Object.keys(porData);
    const ggr = datas.map(d => porData[d].ggr);
    const dep = datas.map(d => porData[d].depositos);
    const ftd = datas.map(d => porData[d].ftd);
    const sport = datas.map(d => porData[d].sportsbook);
    const cassino = datas.map(d => porData[d].cassino);

    if(chartGGR) chartGGR.destroy();
    if(chartDep) chartDep.destroy();
    if(chartFTD) chartFTD.destroy();
    if(chartSport) chartSport.destroy();
    if(chartCassino) chartCassino.destroy();

    chartGGR = criarGrafico("graficoGGR", datas, ggr, "GGR", "lime");
    chartDep = criarGrafico("graficoDepositos", datas, dep, "Depósitos", "blue");
    chartFTD = criarGrafico("graficoFTD", datas, ftd, "FTD", "yellow");
    chartSport = criarGrafico("graficoSportsbookGGR", datas, sport, "Sportsbook GGR", "orange");
    chartCassino = criarGrafico("graficoCassinoGGR", datas, cassino, "Cassino GGR", "purple");
}

function criarGrafico(id, labels, data, label, cor) {
    const ctx = document.getElementById(id).getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label,
                data,
                borderColor: cor,
                backgroundColor: cor,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#0f0' } }
            },
            scales: {
                x: { ticks: { color: '#0f0' } },
                y: { ticks: { color: '#0f0' } }
            }
        }
    });
}

function agruparPorData(dados) {
    const agrupado = {};
    dados.forEach(d => {
        if(!agrupado[d.data]) agrupado[d.data] = { ftd:0, depositos:0, ggr:0, sportsbook:0, cassino:0 };
        agrupado[d.data].ftd += d.ftd;
        agrupado[d.data].depositos += d.depositos;
        agrupado[d.data].ggr += d.ggr;
        agrupado[d.data].sportsbook += d.sportsbook;
        agrupado[d.data].cassino += d.cassino;
    });
    return agrupado;
}

// === Tabelas ===
function montarTabelas(dados) {
    montarRanking(dados, "topDepositos", "depositos");
    montarRanking(dados, "topFTD", "ftd");
    montarRanking(dados, "topGGR", "ggr");
}

function montarRanking(dados, tabelaId, campo) {
    const agrupado = {};
    dados.forEach(d => agrupado[d.clube] = (agrupado[d.clube] || 0) + d[campo]);
    const top10 = Object.entries(agrupado).sort((a,b) => b[1]-a[1]).slice(0,10);

    const tbody = document.querySelector(`#${tabelaId} tbody`);
    tbody.innerHTML = top10.map(([clube, valor]) => 
        `<tr><td>${clube}</td><td>${formatarMoeda(valor)}</td></tr>`
    ).join("");
}
