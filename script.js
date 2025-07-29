const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dadosCSV = [];
let graficoGGR, graficoFTD, graficoDepositos;

document.addEventListener("DOMContentLoaded", () => {
    console.log("Iniciando carregamento do CSV...");
    document.getElementById("statusCarregando").textContent = "Carregando dados...";
    carregarDados();

    document.getElementById("aplicarBtn").addEventListener("click", aplicarFiltros);
});

// ------------------ CARREGAR CSV --------------------
function carregarDados() {
    const inicio = performance.now();

    Papa.parse(CSV_URL, {
        download: true,
        delimiter: ",",
        complete: (result) => {
            console.log("CSV recebido com sucesso");
            console.log(`PapaParse finalizado ${result.data.length} linhas`);

            dadosCSV = normalizarDados(result.data);
            console.log("Dados normalizados:", dadosCSV);

            preencherFiltros(dadosCSV);
            atualizarDashboard(dadosCSV);

            const fim = performance.now();
            document.getElementById("ultimaAtualizacao").textContent =
                `Última atualização: ${new Date().toLocaleString()} | Tempo de processamento: ${(fim - inicio).toFixed(2)} ms`;

            document.getElementById("statusCarregando").textContent = "";
        }
    });
}

// ------------------ NORMALIZAÇÃO --------------------
function normalizarDados(linhas) {
    let dados = [];
    for (let i = 1; i < linhas.length; i++) {
        const row = linhas[i];
        if (!row || row.length < 27) continue;

        let data = row[0];
        let clube = row[2];
        let ftd = parseFloat(row[5].replace(/[^\d.-]/g, "")) || 0;
        let depositos = parseFloat(row[6].replace(/[^\d.-]/g, "")) || 0;
        let ggr = parseFloat(row[26].replace(/[^\d.-]/g, "")) || 0;

        dados.push({ data, clube, ftd, depositos, ggr });
    }
    return dados;
}

// ------------------ FILTROS --------------------
function preencherFiltros(dados) {
    console.log("Preenchendo filtros de clubes...");
    const select = document.getElementById("clubeSelect");
    select.innerHTML = `<option value="Todos">Todos</option>`;

    const clubesUnicos = [...new Set(dados.map(d => d.clube).filter(c => c))];
    clubesUnicos.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
    });
}

// ------------------ APLICAR FILTROS --------------------
function aplicarFiltros() {
    console.log("Aplicando filtros...");
    const dataFiltro = document.getElementById("dataFiltro").value;
    const clubeFiltro = document.getElementById("clubeSelect").value;

    let filtrados = [...dadosCSV];
    if (dataFiltro) {
        filtrados = filtrados.filter(d => formatarDataISO(d.data) === dataFiltro);
    }
    if (clubeFiltro && clubeFiltro !== "Todos") {
        filtrados = filtrados.filter(d => d.clube === clubeFiltro);
    }

    console.log(`Atualizando dashboard com ${filtrados.length} linhas`);
    atualizarDashboard(filtrados);
}

// ------------------ ATUALIZAR DASHBOARD --------------------
function atualizarDashboard(dados) {
    if (!dados.length) {
        document.getElementById("totalFTD").textContent = "R$ 0,00";
        document.getElementById("totalDepositos").textContent = "R$ 0,00";
        document.getElementById("totalGGR").textContent = "R$ 0,00";
        return;
    }

    const totalFTD = dados.reduce((a, b) => a + b.ftd, 0);
    const totalDepositos = dados.reduce((a, b) => a + b.depositos, 0);
    const totalGGR = dados.reduce((a, b) => a + b.ggr, 0);

    document.getElementById("totalFTD").textContent = formatarMoeda(totalFTD);
    document.getElementById("totalDepositos").textContent = formatarMoeda(totalDepositos);
    document.getElementById("totalGGR").textContent = formatarMoeda(totalGGR);

    atualizarGraficos(dados);
    atualizarRankings(dados);
}

// ------------------ ATUALIZAR GRÁFICOS --------------------
function atualizarGraficos(dados) {
    console.log("Atualizando gráficos...");

    const agrupado = agruparPorData(dados);
    const labels = Object.keys(agrupado);
    const valoresGGR = labels.map(l => agrupado[l].ggr);
    const valoresFTD = labels.map(l => agrupado[l].ftd);
    const valoresDepositos = labels.map(l => agrupado[l].depositos);

    if (graficoGGR) graficoGGR.destroy();
    if (graficoFTD) graficoFTD.destroy();
    if (graficoDepositos) graficoDepositos.destroy();

    graficoGGR = criarGrafico("graficoGGR", labels, valoresGGR, "GGR Diário", "green");
    graficoFTD = criarGrafico("graficoFTD", labels, valoresFTD, "FTD Diário", "yellow");
    graficoDepositos = criarGrafico("graficoDepositos", labels, valoresDepositos, "Depósitos Diários", "blue");
}

// ------------------ ATUALIZAR RANKINGS --------------------
function atualizarRankings(dados) {
    console.log("Atualizando rankings...");
    const rankingDepositos = agruparPorClube(dados).sort((a, b) => b.depositos - a.depositos).slice(0, 10);
    const rankingFTD = agruparPorClube(dados).sort((a, b) => b.ftd - a.ftd).slice(0, 10);
    const rankingGGR = agruparPorClube(dados).sort((a, b) => b.ggr - a.ggr).slice(0, 10);

    preencherTabela("rankingDepositos", rankingDepositos, ["clube", "depositos"]);
    preencherTabela("rankingFTD", rankingFTD, ["clube", "ftd"]);
    preencherTabela("rankingGGR", rankingGGR, ["clube", "ggr"]);
}

// ------------------ FUNÇÕES AUXILIARES --------------------
function agruparPorData(dados) {
    const agrupado = {};
    dados.forEach(d => {
        if (!agrupado[d.data]) agrupado[d.data] = { ggr: 0, ftd: 0, depositos: 0 };
        agrupado[d.data].ggr += d.ggr;
        agrupado[d.data].ftd += d.ftd;
        agrupado[d.data].depositos += d.depositos;
    });
    return agrupado;
}

function agruparPorClube(dados) {
    const map = {};
    dados.forEach(d => {
        if (!map[d.clube]) map[d.clube] = { clube: d.clube, ggr: 0, ftd: 0, depositos: 0 };
        map[d.clube].ggr += d.ggr;
        map[d.clube].ftd += d.ftd;
        map[d.clube].depositos += d.depositos;
    });
    return Object.values(map);
}

function criarGrafico(canvasId, labels, data, label, cor) {
    return new Chart(document.getElementById(canvasId), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: cor,
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: "#fff" } } },
            scales: {
                x: { ticks: { color: "#fff" } },
                y: { ticks: { color: "#fff" } }
            }
        }
    });
}

function preencherTabela(id, dados, colunas) {
    const tabela = document.getElementById(id);
    tabela.innerHTML = `<tr>${colunas.map(c => `<th>${c.toUpperCase()}</th>`).join("")}</tr>` +
        dados.map(d => `<tr>${colunas.map(c => `<td>${c === "clube" ? d[c] : formatarMoeda(d[c])}</td>`).join("")}</tr>`).join("");
}

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarDataISO(data) {
    // Converte data "27/07/2025" ou "2025-07-27" para ISO yyyy-mm-dd
    const partes = data.split("/");
    if (partes.length === 3) {
        return `${partes[2]}-${partes[1].padStart(2, "0")}-${partes[0].padStart(2, "0")}`;
    }
    return data;
}
