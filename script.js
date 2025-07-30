console.log("Rodando versão DEBUG");

// URL do CSV
const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dadosBrutos = [];
let dadosFiltrados = [];

document.addEventListener("DOMContentLoaded", () => carregarDados());

function carregarDados() {
    console.log("Iniciando carregamento do CSV...");
    Papa.parse(URL_CSV, {
        download: true,
        header: true,
        complete: (resultado) => {
            console.log("Linhas recebidas:", resultado.data.length);
            console.log("Primeira linha recebida:", resultado.data[0]);
            dadosBrutos = resultado.data;
            normalizarDados();
        }
    });
}

function normalizarDados() {
    console.log("Normalizando dados...");
    dadosFiltrados = dadosBrutos.map(linha => ({
        data: linha["DATA"],
        clube: linha["Usuário - Nome de usuário do principal"] || "Desconhecido",
        ftd: parseFloat((linha["Usuário - FTD-Montante"] || "0").replace(",", ".")),
        depositos: parseFloat((linha["Usuário - Depósitos"] || "0").replace(",", ".")),
        ggr: parseFloat((linha["GGR"] || linha["Cálculo - GGR"] || "0").replace(",", "."))
    }));
    atualizarDashboard();
}

function atualizarDashboard() {
    console.log("Atualizando dashboard...");
    const totalFTD = somar("ftd");
    const totalDepositos = somar("depositos");
    const totalGGR = somar("ggr");

    document.getElementById("valorFTD").innerText = formatarMoeda(totalFTD);
    document.getElementById("valorDepositos").innerText = formatarMoeda(totalDepositos);
    document.getElementById("valorGGR").innerText = formatarMoeda(totalGGR);

    montarGraficos();
    montarTabelas();
    document.getElementById("ultimaAtualizacao").innerText = `Última atualização: ${new Date().toLocaleString()}`;
}

function montarGraficos() {
    console.log("Montando gráficos...");
    const porData = {};
    dadosFiltrados.forEach(d => {
        if (!porData[d.data]) porData[d.data] = { ftd: 0, depositos: 0, ggr: 0 };
        porData[d.data].ftd += d.ftd;
        porData[d.data].depositos += d.depositos;
        porData[d.data].ggr += d.ggr;
    });

    const labels = Object.keys(porData);
    const valoresGGR = labels.map(l => porData[l].ggr);
    const valoresFTD = labels.map(l => porData[l].ftd);
    const valoresDepositos = labels.map(l => porData[l].depositos);

    criarGrafico("graficoGGR", labels, valoresGGR, "GGR", "green");
    criarGrafico("graficoFTD", labels, valoresFTD, "FTD", "yellow");
    criarGrafico("graficoDepositos", labels, valoresDepositos, "Depósitos", "blue");
}

function criarGrafico(id, labels, valores, label, cor) {
    new Chart(document.getElementById(id), {
        type: "line",
        data: {
            labels,
            datasets: [{ label, data: valores, borderColor: cor, backgroundColor: cor, tension: 0.3, fill: false }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: "#0f0" } } },
            scales: {
                x: { ticks: { color: "#0f0" }, grid: { color: "#333" } },
                y: { ticks: { color: "#0f0" }, grid: { color: "#333" } }
            }
        }
    });
}

function montarTabelas() {
    console.log("Montando tabelas...");
    preencherTabela("tabelaDepositos", ordenar("depositos").slice(0, 10));
    preencherTabela("tabelaFTD", ordenar("ftd").slice(0, 10));
    preencherTabela("tabelaGGR", ordenar("ggr").slice(0, 10));
}

function preencherTabela(id, dados) {
    const tbody = document.querySelector(`#${id} tbody`);
    tbody.innerHTML = "";
    dados.forEach(linha => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${linha.clube}</td><td>${formatarMoeda(linha.valor)}</td>`;
        tbody.appendChild(tr);
    });
}

function ordenar(campo) {
    const mapa = {};
    dadosFiltrados.forEach(d => {
        mapa[d.clube] = (mapa[d.clube] || 0) + d[campo];
    });
    return Object.keys(mapa).map(clube => ({ clube, valor: mapa[clube] }))
        .sort((a, b) => b.valor - a.valor);
}

function somar(campo) {
    return dadosFiltrados.reduce((acc, d) => acc + (d[campo] || 0), 0);
}

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function aplicarFiltro() {
    alert("Filtro ainda não implementado nesta versão");
}
