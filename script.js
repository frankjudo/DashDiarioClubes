const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dados = [];
let graficoGGR, graficoFTD, graficoDepositos;

document.addEventListener("DOMContentLoaded", carregarDados);

function carregarDados() {
    Papa.parse(CSV_URL, {
        download: true,
        header: false,
        complete: function(results) {
            console.log("Dados brutos CSV:", results.data);
            dados = normalizarDados(results.data);
            console.log("Dados normalizados:", dados);
            preencherFiltros(dados);
            atualizarDashboard(dados);
        }
    });
}

function normalizarDados(linhas) {
    return linhas.slice(1).map(linha => ({
        data: linha[0],
        clube: linha[2],
        ftd: parseFloat(linha[5] || 0),
        depositos: parseFloat(linha[6] || 0),
        ggr: parseFloat(linha[26] || 0)
    }));
}

function preencherFiltros(data) {
    const clubesUnicos = [...new Set(data.map(d => d.clube))];
    const select = document.getElementById("clubeSelect");
    select.innerHTML = "<option value=''>Todos</option>";
    clubesUnicos.forEach(clube => {
        const option = document.createElement("option");
        option.value = clube;
        option.textContent = clube;
        select.appendChild(option);
    });
}

function aplicarFiltros() {
    const dataFiltro = document.getElementById("dataFiltro").value;
    const clubeFiltro = document.getElementById("clubeSelect").value;
    const filtrado = dados.filter(d =>
        (!dataFiltro || d.data === dataFiltro) &&
        (!clubeFiltro || d.clube === clubeFiltro)
    );
    atualizarDashboard(filtrado);
}

function atualizarDashboard(data) {
    const totalFTD = data.reduce((acc, cur) => acc + cur.ftd, 0);
    const totalDepositos = data.reduce((acc, cur) => acc + cur.depositos, 0);
    const totalGGR = data.reduce((acc, cur) => acc + cur.ggr, 0);

    document.getElementById("totalFTD").innerText = formatarBRL(totalFTD);
    document.getElementById("totalDepositos").innerText = formatarBRL(totalDepositos);
    document.getElementById("totalGGR").innerText = formatarBRL(totalGGR);

    atualizarGraficos(data);
    atualizarRanking(data);
}

function atualizarGraficos(data) {
    const porDia = {};
    data.forEach(d => {
        if (!porDia[d.data]) porDia[d.data] = { ggr: 0, ftd: 0, depositos: 0 };
        porDia[d.data].ggr += d.ggr;
        porDia[d.data].ftd += d.ftd;
        porDia[d.data].depositos += d.depositos;
    });
    const labels = Object.keys(porDia);
    const valoresGGR = labels.map(d => porDia[d].ggr);
    const valoresFTD = labels.map(d => porDia[d].ftd);
    const valoresDepositos = labels.map(d => porDia[d].depositos);

    if (graficoGGR) graficoGGR.destroy();
    if (graficoFTD) graficoFTD.destroy();
    if (graficoDepositos) graficoDepositos.destroy();

    graficoGGR = criarGrafico("graficoGGR", labels, valoresGGR, "GGR Diário", "green");
    graficoFTD = criarGrafico("graficoFTD", labels, valoresFTD, "FTD Diário", "yellow");
    graficoDepositos = criarGrafico("graficoDepositos", labels, valoresDepositos, "Depósitos Diários", "blue");
}

function criarGrafico(canvasId, labels, data, label, cor) {
    return new Chart(document.getElementById(canvasId), {
        type: "line",
        data: {
            labels,
            datasets: [{
                label,
                data,
                borderColor: cor,
                fill: false
            }]
        }
    });
}

function atualizarRanking(data) {
    const agrupados = agruparPorClube(data);

    const topDepositos = [...agrupados].sort((a, b) => b.depositos - a.depositos).slice(0, 10);
    const topFTD = [...agrupados].sort((a, b) => b.ftd - a.ftd).slice(0, 10);
    const topGGR = [...agrupados].sort((a, b) => b.ggr - a.ggr).slice(0, 10);

    preencherTabela("rankingDepositos", topDepositos, ["clube", "depositos"]);
    preencherTabela("rankingFTD", topFTD, ["clube", "ftd"]);
    preencherTabela("rankingGGR", topGGR, ["clube", "ggr"]);
}

function preencherTabela(id, dados, colunas) {
    const tabela = document.getElementById(id);
    tabela.innerHTML = "<tr>" + colunas.map(c => `<th>${c.charAt(0).toUpperCase() + c.slice(1)}</th>`).join("") + "</tr>";
    dados.forEach(d => {
        const linha = "<tr>" + colunas.map(c => `<td>${c === "clube" ? d[c] : formatarBRL(d[c])}</td>`).join("") + "</tr>";
        tabela.innerHTML += linha;
    });
}

function agruparPorClube(data) {
    const mapa = {};
    data.forEach(d => {
        if (!mapa[d.clube]) {
            mapa[d.clube] = { clube: d.clube, ftd: 0, depositos: 0, ggr: 0 };
        }
        mapa[d.clube].ftd += d.ftd;
        mapa[d.clube].depositos += d.depositos;
        mapa[d.clube].ggr += d.ggr;
    });
    return Object.values(mapa);
}

function formatarBRL(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
