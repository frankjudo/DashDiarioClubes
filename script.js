const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let chartGGR, chartFTD, chartDepositos;

document.addEventListener("DOMContentLoaded", () => {
    carregarDados();
});

function carregarDados() {
    console.log("Iniciando carregamento do CSV...");
    document.getElementById('loading').style.display = 'block';
    const startTime = performance.now();

    Papa.parse(CSV_URL, {
        download: true,
        complete: function (results) {
            console.log("CSV recebido com sucesso");
            const dados = normalizarDados(results.data);
            console.log("Dados normalizados:", dados);

            preencherFiltros(dados);
            atualizarDashboard(dados);

            const endTime = performance.now();
            const processTime = (endTime - startTime).toFixed(2);
            document.getElementById('processTime').innerText = `Tempo de processamento: ${processTime} ms`;
            document.getElementById('lastUpdate').innerText = `Última atualização: ${new Date().toLocaleString()}`;
            document.getElementById('loading').style.display = 'none';
        }
    });
}

function normalizarDados(data) {
    // Implementação normalizando colunas específicas (exemplo)
    return data.slice(1).map(row => ({
        data: row[0],
        clube: row[2],
        ftd: parseFloat(row[5]) || 0,
        depositos: parseFloat(row[6]) || 0,
        ggr: parseFloat(row[26]) || 0
    }));
}

function preencherFiltros(dados) {
    console.log("Preenchendo filtros de clubes...");
    const select = document.getElementById("clubeSelect");
    const clubes = [...new Set(dados.map(d => d.clube))];
    select.innerHTML = `<option value="Todos">Todos</option>` +
        clubes.map(c => `<option value="${c}">${c}</option>`).join("");
}

function aplicarFiltros() {
    console.log("Aplicando filtros...");
    carregarDados();
}

function atualizarDashboard(dados) {
    console.log(`Atualizando dashboard com ${dados.length} linhas`);
    const totalFTD = dados.reduce((acc, val) => acc + val.ftd, 0);
    const totalDepositos = dados.reduce((acc, val) => acc + val.depositos, 0);
    const totalGGR = dados.reduce((acc, val) => acc + val.ggr, 0);

    document.getElementById('totalFTD').innerText = formatarMoeda(totalFTD);
    document.getElementById('totalDepositos').innerText = formatarMoeda(totalDepositos);
    document.getElementById('totalGGR').innerText = formatarMoeda(totalGGR);

    atualizarGraficos(dados);
    atualizarRankings(dados);
}

function atualizarGraficos(dados) {
    console.log("Atualizando gráficos...");
    const dias = [...new Set(dados.map(d => d.data))].sort();
    const ggrPorDia = dias.map(d => somaPorDia(dados, d, "ggr"));
    const ftdPorDia = dias.map(d => somaPorDia(dados, d, "ftd"));
    const depPorDia = dias.map(d => somaPorDia(dados, d, "depositos"));

    criarGrafico("graficoGGR", "GGR Diário", dias, ggrPorDia, "green", chart => chartGGR = chart);
    criarGrafico("graficoFTD", "FTD Diário", dias, ftdPorDia, "yellow", chart => chartFTD = chart);
    criarGrafico("graficoDepositos", "Depósitos Diários", dias, depPorDia, "blue", chart => chartDepositos = chart);
}

function atualizarRankings(dados) {
    console.log("Atualizando rankings...");
    atualizarTabela("rankingDepositos", top10(dados, "depositos"), ["clube", "depositos"]);
    atualizarTabela("rankingFTD", top10(dados, "ftd"), ["clube", "ftd"]);
    atualizarTabela("rankingGGR", top10(dados, "ggr"), ["clube", "ggr"]);
}

function top10(dados, campo) {
    const somaPorClube = {};
    dados.forEach(d => somaPorClube[d.clube] = (somaPorClube[d.clube] || 0) + d[campo]);
    return Object.entries(somaPorClube)
        .map(([clube, valor]) => ({ clube, valor }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10);
}

function somaPorDia(dados, dia, campo) {
    return dados.filter(d => d.data === dia).reduce((acc, val) => acc + val[campo], 0);
}

function criarGrafico(id, label, labels, data, color, refSetter) {
    const ctx = document.getElementById(id).getContext('2d');
    if (refSetter() instanceof Chart) refSetter().destroy();

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                fill: false
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
    refSetter(chart);
}

function atualizarTabela(id, dados, colunas) {
    const tabela = document.getElementById(id);
    tabela.innerHTML = `<tr>${colunas.map(c => `<th>${c.toUpperCase()}</th>`).join("")}</tr>` +
        dados.map(d => `<tr><td>${d.clube}</td><td>${formatarMoeda(d.valor)}</td></tr>`).join("");
}

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
