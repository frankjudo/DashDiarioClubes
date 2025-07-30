const urlCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dados = [];
let chartGGR, chartFTD, chartDepositos;

document.addEventListener("DOMContentLoaded", carregarDados);

function carregarDados() {
    console.log("Iniciando carregamento do CSV...");
    Papa.parse(urlCSV, {
        download: true,
        header: true,
        complete: (resultado) => {
            dados = resultado.data.filter(linha => linha["DATA"]);
            console.log("Linhas recebidas:", dados.length);
            console.log("Primeira linha recebida:", dados[0]);

            preencherClubes();
            atualizarDashboard();
            document.getElementById('ultimaAtualizacao').innerText =
                "Última atualização: " + new Date().toLocaleString();
        }
    });
}

function preencherClubes() {
    const clubes = [...new Set(dados.map(linha => linha["Usuário - Nome de usuário do principal"]))];
    const select = document.getElementById("clubeSelect");
    select.innerHTML = "<option value=''>Todos</option>";
    clubes.forEach(clube => {
        select.innerHTML += `<option value="${clube}">${clube}</option>`;
    });
}

function aplicarFiltros() {
    atualizarDashboard();
}

function atualizarDashboard() {
    const dataFiltro = document.getElementById("dataFiltro").value;
    const clubeFiltro = document.getElementById("clubeSelect").value;

    let filtrados = dados;
    if (dataFiltro) filtrados = filtrados.filter(l => l["DATA"] === dataFiltro);
    if (clubeFiltro) filtrados = filtrados.filter(l => l["Usuário - Nome de usuário do principal"] === clubeFiltro);

    const totais = {
        ftd: filtrados.reduce((s, l) => s + (parseFloat(l["Usuário - FTD-Montante"]) || 0), 0),
        depositos: filtrados.reduce((s, l) => s + (parseFloat(l["Usuário - Depósitos"]) || 0), 0),
        ggr: filtrados.reduce((s, l) => s + (parseFloat(l["Cálculo - GGR"]) || 0), 0)
    };

    console.log("Totais calculados ->", totais);

    document.getElementById("totalFTD").innerText = formatarMoeda(totais.ftd);
    document.getElementById("totalDepositos").innerText = formatarMoeda(totais.depositos);
    document.getElementById("totalGGR").innerText = formatarMoeda(totais.ggr);

    atualizarGraficos(filtrados);
    atualizarRankings(filtrados);
}

function atualizarGraficos(dados) {
    const porDia = {};
    dados.forEach(l => {
        if (!porDia[l["DATA"]]) porDia[l["DATA"]] = { ggr: 0, ftd: 0, depositos: 0 };
        porDia[l["DATA"]].ggr += parseFloat(l["Cálculo - GGR"]) || 0;
        porDia[l["DATA"]].ftd += parseFloat(l["Usuário - FTD-Montante"]) || 0;
        porDia[l["DATA"]].depositos += parseFloat(l["Usuário - Depósitos"]) || 0;
    });

    const labels = Object.keys(porDia).sort();
    const ggr = labels.map(d => porDia[d].ggr);
    const ftd = labels.map(d => porDia[d].ftd);
    const depositos = labels.map(d => porDia[d].depositos);

    if (chartGGR) chartGGR.destroy();
    if (chartFTD) chartFTD.destroy();
    if (chartDepositos) chartDepositos.destroy();

    chartGGR = criarGrafico("graficoGGR", labels, ggr, "GGR");
    chartFTD = criarGrafico("graficoFTD", labels, ftd, "FTD");
    chartDepositos = criarGrafico("graficoDepositos", labels, depositos, "Depósitos");
}

function criarGrafico(id, labels, dados, label) {
    return new Chart(document.getElementById(id), {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: dados,
                borderColor: "#0f0",
                backgroundColor: "rgba(0,255,0,0.1)",
                tension: 0.2
            }]
        },
        options: { responsive: true, plugins: { legend: { labels: { color: "#fff" } } }, scales: { x: { ticks: { color: "#fff" } }, y: { ticks: { color: "#fff" } } } }
    });
}

function atualizarRankings(dados) {
    const clubes = {};
    dados.forEach(l => {
        const c = l["Usuário - Nome de usuário do principal"];
        if (!clubes[c]) clubes[c] = { ftd: 0, depositos: 0, ggr: 0 };
        clubes[c].ftd += parseFloat(l["Usuário - FTD-Montante"]) || 0;
        clubes[c].depositos += parseFloat(l["Usuário - Depósitos"]) || 0;
        clubes[c].ggr += parseFloat(l["Cálculo - GGR"]) || 0;
    });

    const topDepositos = Object.entries(clubes).sort((a, b) => b[1].depositos - a[1].depositos).slice(0, 10);
    const topFTD = Object.entries(clubes).sort((a, b) => b[1].ftd - a[1].ftd).slice(0, 10);
    const topGGR = Object.entries(clubes).sort((a, b) => b[1].ggr - a[1].ggr).slice(0, 10);

    preencherTabela("rankingDepositos", topDepositos, "depositos");
    preencherTabela("rankingFTD", topFTD, "ftd");
    preencherTabela("rankingGGR", topGGR, "ggr");
}

function preencherTabela(id, dados, campo) {
    const tabela = document.getElementById(id);
    tabela.innerHTML = "<tr><th>Clube</th><th>Valor</th></tr>";
    dados.forEach(([clube, valores]) => {
        tabela.innerHTML += `<tr><td>${clube}</td><td>${formatarMoeda(valores[campo])}</td></tr>`;
    });
}

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
