const CSV_URL = "URL_DO_CSV_AQUI"; // <-- Troque pelo seu CSV publicado

let dadosOriginais = [];
let graficoGGR, graficoFTD, graficoDepositos;

document.addEventListener("DOMContentLoaded", () => {
    carregarCSV();
});

function carregarCSV() {
    console.log("Carregando CSV:", CSV_URL);
    Papa.parse(CSV_URL, {
        download: true,
        header: false,
        complete: function (results) {
            console.log("Linhas carregadas:", results.data.length);
            processarDados(results.data);
        },
        error: function (err) {
            console.error("Erro ao carregar CSV:", err);
        }
    });
}

function processarDados(data) {
    dadosOriginais = data.slice(1).map(linha => ({
        data: linha[0],
        clube: linha[2],
        ftd: parseFloat(linha[5] || 0),
        depositos: parseFloat(linha[6] || 0),
        ggr: parseFloat(linha[27] || 0)
    }));
    preencherClubes();
    atualizarDashboard(dadosOriginais);
}

function preencherClubes() {
    const clubesUnicos = [...new Set(dadosOriginais.map(d => d.clube))];
    const select = document.getElementById("clubeSelect");
    select.innerHTML = `<option value="Todos">Todos</option>`;
    clubesUnicos.forEach(clube => {
        select.innerHTML += `<option value="${clube}">${clube}</option>`;
    });
}

function aplicarFiltros() {
    const dataFiltro = document.getElementById("dataFiltro").value;
    const clube = document.getElementById("clubeSelect").value;

    let filtrados = [...dadosOriginais];
    if (dataFiltro) filtrados = filtrados.filter(d => d.data === dataFiltro);
    if (clube !== "Todos") filtrados = filtrados.filter(d => d.clube === clube);

    console.log(`Filtros aplicados: ${filtrados.length} registros`);
    atualizarDashboard(filtrados);
}

function atualizarDashboard(dados) {
    const totalFTD = dados.reduce((sum, d) => sum + d.ftd, 0);
    const totalDepositos = dados.reduce((sum, d) => sum + d.depositos, 0);
    const totalGGR = dados.reduce((sum, d) => sum + d.ggr, 0);

    document.getElementById("totalFTD").textContent = `R$ ${totalFTD.toLocaleString("pt-BR")}`;
    document.getElementById("totalDepositos").textContent = `R$ ${totalDepositos.toLocaleString("pt-BR")}`;
    document.getElementById("totalGGR").textContent = `R$ ${totalGGR.toLocaleString("pt-BR")}`;

    const clubes = {};
    dados.forEach(row => {
        if (!clubes[row.clube]) clubes[row.clube] = { ftd: 0, depositos: 0, ggr: 0 };
        clubes[row.clube].ftd += row.ftd;
        clubes[row.clube].depositos += row.depositos;
        clubes[row.clube].ggr += row.ggr;
    });

    const clubesArray = Object.keys(clubes).map(clube => ({
        clube,
        ...clubes[clube]
    }));

    gerarTabelaRanking(clubesArray, 'depositos', 'rankingDepositos');
    gerarTabelaRanking(clubesArray, 'ftd', 'rankingFTD');
    gerarTabelaRanking(clubesArray, 'ggr', 'rankingGGR');

    atualizarGraficos(dados);
}

function gerarTabelaRanking(array, campo, tabelaId) {
    const top10 = [...array].sort((a, b) => b[campo] - a[campo]).slice(0, 10);
    let html = `
        <tr><th>Clube</th><th>FTD</th><th>Depósitos</th><th>GGR</th></tr>`;
    top10.forEach(row => {
        html += `<tr>
            <td>${row.clube}</td>
            <td>R$ ${row.ftd.toLocaleString("pt-BR")}</td>
            <td>R$ ${row.depositos.toLocaleString("pt-BR")}</td>
            <td>R$ ${row.ggr.toLocaleString("pt-BR")}</td>
        </tr>`;
    });
    document.getElementById(tabelaId).innerHTML = html;
}

function atualizarGraficos(dados) {
    const dias = [...new Set(dados.map(d => d.data))].sort();
    const somaPorDia = dias.map(dia => {
        const diaDados = dados.filter(d => d.data === dia);
        return {
            dia,
            ftd: diaDados.reduce((s, r) => s + r.ftd, 0),
            depositos: diaDados.reduce((s, r) => s + r.depositos, 0),
            ggr: diaDados.reduce((s, r) => s + r.ggr, 0)
        };
    });

    const ctxGGR = document.getElementById("graficoGGR").getContext("2d");
    const ctxFTD = document.getElementById("graficoFTD").getContext("2d");
    const ctxDepositos = document.getElementById("graficoDepositos").getContext("2d");

    if (graficoGGR) graficoGGR.destroy();
    if (graficoFTD) graficoFTD.destroy();
    if (graficoDepositos) graficoDepositos.destroy();

    graficoGGR = new Chart(ctxGGR, {
        type: "line",
        data: {
            labels: somaPorDia.map(d => d.dia),
            datasets: [{ label: "GGR Diário", borderColor: "lime", data: somaPorDia.map(d => d.ggr) }]
        }
    });

    graficoFTD = new Chart(ctxFTD, {
        type: "line",
        data: {
            labels: somaPorDia.map(d => d.dia),
            datasets: [{ label: "FTD Diário", borderColor: "yellow", data: somaPorDia.map(d => d.ftd) }]
        }
    });

    graficoDepositos = new Chart(ctxDepositos, {
        type: "line",
        data: {
            labels: somaPorDia.map(d => d.dia),
            datasets: [{ label: "Depósitos Diários", borderColor: "cyan", data: somaPorDia.map(d => d.depositos) }]
        }
    });
}
