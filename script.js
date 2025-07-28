const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dados = [];
let chartGGR, chartFTD, chartDepositos;

document.addEventListener("DOMContentLoaded", carregarDados);

function carregarDados() {
    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        complete: function(result) {
            dados = result.data;
            popularClubes();
            aplicarFiltros();
        }
    });
}

function normalizarTexto(txt) {
    return txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function popularClubes() {
    const clubeSelect = document.getElementById("clubeSelect");
    const clubes = [...new Set(dados.map(row => row["Usuário - Nome de usuário do principal"]))].filter(x => x);
    clubeSelect.innerHTML = "<option value='Todos'>Todos</option>" +
        clubes.map(c => `<option value="${c}">${c}</option>`).join('');
}

function aplicarFiltros() {
    const dataIni = document.getElementById("dataInicial").value;
    const dataFim = document.getElementById("dataFinal").value;
    const clube = document.getElementById("clubeSelect").value;

    let filtrado = dados.filter(row => {
        const data = new Date(row["DATA"]);
        const dentroPeriodo = (!dataIni || data >= new Date(dataIni)) && (!dataFim || data <= new Date(dataFim));
        const clubeOk = (clube === "Todos" || row["Usuário - Nome de usuário do principal"] === clube);
        return dentroPeriodo && clubeOk;
    });

    atualizarTotais(filtrado);
    atualizarGraficos(filtrado);
    atualizarTop10(filtrado);
}

function atualizarTotais(filtrado) {
    const ftd = filtrado.reduce((sum, row) => sum + parseFloat(row["Usuário - FTD-Montante"] || 0), 0);
    const depositos = filtrado.reduce((sum, row) => sum + parseFloat(row["Usuário - DepÃ³sitos"] || 0), 0);
    const ggr = filtrado.reduce((sum, row) => sum + parseFloat(row["CÃ¡lculo - GGR"] || 0), 0);
    const clubesAtivos = new Set(filtrado.filter(r => parseFloat(r["CÃ¡lculo - GGR"] || 0) !== 0)
        .map(r => r["Usuário - Nome de usuário do principal"])).size;

    document.getElementById("ftdTotal").innerText = formatarBRL(ftd);
    document.getElementById("depositosTotal").innerText = formatarBRL(depositos);
    document.getElementById("ggrTotal").innerText = formatarBRL(ggr);
    document.getElementById("clubesAtivos").innerText = clubesAtivos;
}

function atualizarGraficos(filtrado) {
    const porData = {};
    filtrado.forEach(row => {
        const data = row["DATA"];
        if (!porData[data]) porData[data] = { ggr: 0, ftd: 0, depositos: 0 };
        porData[data].ggr += parseFloat(row["CÃ¡lculo - GGR"] || 0);
        porData[data].ftd += parseFloat(row["Usuário - FTD-Montante"] || 0);
        porData[data].depositos += parseFloat(row["Usuário - DepÃ³sitos"] || 0);
    });

    const labels = Object.keys(porData).sort();
    const ggrData = labels.map(d => porData[d].ggr);
    const ftdData = labels.map(d => porData[d].ftd);
    const depData = labels.map(d => porData[d].depositos);

    if (chartGGR) chartGGR.destroy();
    if (chartFTD) chartFTD.destroy();
    if (chartDepositos) chartDepositos.destroy();

    chartGGR = criarGrafico("graficoGGR", labels, ggrData, "GGR por Dia", "green");
    chartFTD = criarGrafico("graficoFTD", labels, ftdData, "FTD por Dia", "yellow");
    chartDepositos = criarGrafico("graficoDepositos", labels, depData, "Depósitos por Dia", "blue");
}

function criarGrafico(canvasId, labels, data, label, cor) {
    return new Chart(document.getElementById(canvasId), {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: cor,
                fill: false
            }]
        }
    });
}

function atualizarTop10(filtrado) {
    const clubes = {};
    filtrado.forEach(row => {
        const clube = row["Usuário - Nome de usuário do principal"];
        if (!clubes[clube]) clubes[clube] = 0;
        clubes[clube] += parseFloat(row["CÃ¡lculo - GGR"] || 0);
    });

    const top10 = Object.entries(clubes).sort((a, b) => b[1] - a[1]).slice(0, 10);

    const tbody = document.querySelector("#tabelaTopClubes tbody");
    tbody.innerHTML = top10.map(([clube, ggr]) =>
        `<tr><td>${clube}</td><td>${formatarBRL(ggr)}</td></tr>`).join("");
}

function formatarBRL(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
