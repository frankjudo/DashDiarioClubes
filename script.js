const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

document.addEventListener("DOMContentLoaded", carregarDados);

let dados = [];

function carregarDados() {
    Papa.parse(csvUrl, {
        download: true,
        complete: function (results) {
            console.log("Dados brutos CSV:", results.data);
            dados = normalizarDados(results.data);
            console.log("Dados normalizados:", dados);
            preencherFiltros();
            atualizarDashboard();
        }
    });
}

function normalizarDados(data) {
    return data.slice(1).map(row => ({
        data: row[0],
        clube: row[2],
        ftd: parseFloat(row[5].replace(",", ".")) || 0,
        depositos: parseFloat(row[6].replace(",", ".")) || 0,
        ggr: parseFloat(row[26].replace(",", ".")) || 0
    }));
}

function preencherFiltros() {
    const clubes = [...new Set(dados.map(d => d.clube))];
    const select = document.getElementById("clubeSelect");
    select.innerHTML = "<option value='Todos'>Todos</option>";
    clubes.forEach(clube => {
        const opt = document.createElement("option");
        opt.value = clube;
        opt.textContent = clube;
        select.appendChild(opt);
    });
}

function aplicarFiltros() {
    atualizarDashboard();
}

function atualizarDashboard() {
    const clubeSelecionado = document.getElementById("clubeSelect").value;
    const dataFiltro = document.getElementById("dataFiltro").value;

    let filtrados = dados.filter(d => 
        (clubeSelecionado === "Todos" || d.clube === clubeSelecionado) &&
        (!dataFiltro || d.data === dataFiltro)
    );

    const totalFTD = filtrados.reduce((acc, d) => acc + d.ftd, 0);
    const totalDepositos = filtrados.reduce((acc, d) => acc + d.depositos, 0);
    const totalGGR = filtrados.reduce((acc, d) => acc + d.ggr, 0);

    document.getElementById("totalFTD").innerText = formatarMoeda(totalFTD);
    document.getElementById("totalDepositos").innerText = formatarMoeda(totalDepositos);
    document.getElementById("totalGGR").innerText = formatarMoeda(totalGGR);

    atualizarGraficos(filtrados);
    atualizarRankings();
}

function atualizarGraficos(data) {
    criarGrafico("graficoGGR", data.map(d => d.data), data.map(d => d.ggr), "GGR Diário", "green");
    criarGrafico("graficoFTD", data.map(d => d.data), data.map(d => d.ftd), "FTD Diário", "yellow");
    criarGrafico("graficoDepositos", data.map(d => d.data), data.map(d => d.depositos), "Depósitos Diários", "blue");
}

function criarGrafico(id, labels, values, label, color) {
    new Chart(document.getElementById(id), {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: values,
                borderColor: color,
                fill: false
            }]
        },
        options: { responsive: true, plugins: { legend: { display: true } } }
    });
}

function atualizarRankings() {
    atualizarTabela("rankingDepositos", ordenarPor("depositos"), "depositos");
    atualizarTabela("rankingFTD", ordenarPor("ftd"), "ftd");
    atualizarTabela("rankingGGR", ordenarPor("ggr"), "ggr");
}

function ordenarPor(campo) {
    const clubes = {};
    dados.forEach(d => {
        clubes[d.clube] = clubes[d.clube] || { clube: d.clube, ftd: 0, depositos: 0, ggr: 0 };
        clubes[d.clube].ftd += d.ftd;
        clubes[d.clube].depositos += d.depositos;
        clubes[d.clube].ggr += d.ggr;
    });
    return Object.values(clubes).sort((a, b) => b[campo] - a[campo]).slice(0, 10);
}

function atualizarTabela(id, ranking, campo) {
    const tabela = document.getElementById(id);
    let colunas = `<tr><th>Clube</th><th>${campo.toUpperCase()}</th></tr>`;
    let linhas = ranking.map(r => `<tr><td>${r.clube}</td><td>${formatarMoeda(r[campo])}</td></tr>`).join("");
    tabela.innerHTML = colunas + linhas;
}

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
