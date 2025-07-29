const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dados = [];
let graficoGGR, graficoFTD, graficoDepositos;

function normalizarValor(valor) {
    if (!valor) return 0;
    valor = valor.toString().replace(/[R$\s.]/g, "").replace(",", ".");
    return parseFloat(valor) || 0;
}

function carregarCSV() {
    Papa.parse(csvUrl, {
        download: true,
        complete: function (resultado) {
            dados = resultado.data.slice(1).map(linha => ({
                data: linha[0],
                clube: linha[2],
                ftd: normalizarValor(linha[5]),
                depositos: normalizarValor(linha[6]),
                ggr: normalizarValor(linha[26]) // índice do GGR
            }));
            preencherClubes();
            aplicarFiltros();
        }
    });
}

function preencherClubes() {
    const select = document.getElementById("clubeSelect");
    select.innerHTML = `<option value="Todos">Todos</option>`;
    [...new Set(dados.map(l => l.clube))].forEach(clube => {
        const opt = document.createElement("option");
        opt.value = clube;
        opt.textContent = clube;
        select.appendChild(opt);
    });
}

function aplicarFiltros() {
    const dataFiltro = document.getElementById("dataFiltro").value;
    const clubeFiltro = document.getElementById("clubeSelect").value;

    let filtrado = dados;

    if (dataFiltro) {
        filtrado = filtrado.filter(l => l.data === dataFiltro);
    }
    if (clubeFiltro !== "Todos") {
        filtrado = filtrado.filter(l => l.clube === clubeFiltro);
    }

    atualizarResumo(filtrado);
    atualizarGraficos(filtrado);
    atualizarRankings(filtrado);
}

function atualizarResumo(filtrado) {
    const totalFTD = filtrado.reduce((sum, l) => sum + l.ftd, 0);
    const totalDepositos = filtrado.reduce((sum, l) => sum + l.depositos, 0);
    const totalGGR = filtrado.reduce((sum, l) => sum + l.ggr, 0);

    document.getElementById("totalFTD").textContent = formatarMoeda(totalFTD);
    document.getElementById("totalDepositos").textContent = formatarMoeda(totalDepositos);
    document.getElementById("totalGGR").textContent = formatarMoeda(totalGGR);
}

function atualizarGraficos(filtrado) {
    const agrupado = {};

    filtrado.forEach(l => {
        if (!agrupado[l.data]) agrupado[l.data] = { ggr: 0, ftd: 0, depositos: 0 };
        agrupado[l.data].ggr += l.ggr;
        agrupado[l.data].ftd += l.ftd;
        agrupado[l.data].depositos += l.depositos;
    });

    const labels = Object.keys(agrupado);
    const valoresGGR = labels.map(d => agrupado[d].ggr);
    const valoresFTD = labels.map(d => agrupado[d].ftd);
    const valoresDepositos = labels.map(d => agrupado[d].depositos);

    if (graficoGGR) graficoGGR.destroy();
    if (graficoFTD) graficoFTD.destroy();
    if (graficoDepositos) graficoDepositos.destroy();

    graficoGGR = new Chart(document.getElementById("graficoGGR"), {
        type: "line",
        data: { labels, datasets: [{ label: "GGR Diário", data: valoresGGR, borderColor: "#00ff66", fill: false }] },
        options: { responsive: true, plugins: { legend: { labels: { color: "white" } } }, scales: { x: { ticks: { color: "white" } }, y: { ticks: { color: "white" } } } }
    });

    graficoFTD = new Chart(document.getElementById("graficoFTD"), {
        type: "line",
        data: { labels, datasets: [{ label: "FTD Diário", data: valoresFTD, borderColor: "#ffff33", fill: false }] },
        options: { responsive: true, plugins: { legend: { labels: { color: "white" } } }, scales: { x: { ticks: { color: "white" } }, y: { ticks: { color: "white" } } } }
    });

    graficoDepositos = new Chart(document.getElementById("graficoDepositos"), {
        type: "line",
        data: { labels, datasets: [{ label: "Depósitos Diários", data: valoresDepositos, borderColor: "#3399ff", fill: false }] },
        options: { responsive: true, plugins: { legend: { labels: { color: "white" } } }, scales: { x: { ticks: { color: "white" } }, y: { ticks: { color: "white" } } } }
    });
}

function atualizarRankings(filtrado) {
    const porDeposito = agruparPorClube(filtrado).sort((a, b) => b.depositos - a.depositos).slice(0, 10);
    const porFTD = agruparPorClube(filtrado).sort((a, b) => b.ftd - a.ftd).slice(0, 10);
    const porGGR = agruparPorClube(filtrado).sort((a, b) => b.ggr - a.ggr).slice(0, 10);

    preencherTabela("rankingDepositos", porDeposito, ["clube", "depositos"]);
    preencherTabela("rankingFTD", porFTD, ["clube", "ftd"]);
    preencherTabela("rankingGGR", porGGR, ["clube", "ggr"]);
}

function agruparPorClube(lista) {
    const grupos = {};
    lista.forEach(l => {
        if (!grupos[l.clube]) grupos[l.clube] = { clube: l.clube, ftd: 0, depositos: 0, ggr: 0 };
        grupos[l.clube].ftd += l.ftd;
        grupos[l.clube].depositos += l.depositos;
        grupos[l.clube].ggr += l.ggr;
    });
    return Object.values(grupos);
}

function preencherTabela(id, dados, colunas) {
    const tabela = document.getElementById(id);
    let html = `<tr>${colunas.map(c => `<th>${c.toUpperCase()}</th>`).join("")}</tr>`;
    html += dados.map(l => `<tr>${colunas.map(c => `<td>${c === "clube" ? l[c] : formatarMoeda(l[c])}</td>`).join("")}</tr>`).join("");
    tabela.innerHTML = html;
}

function formatarMoeda(valor) {
    return valor < 0
        ? `-R$ ${Math.abs(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        : `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

document.addEventListener("DOMContentLoaded", carregarCSV);
