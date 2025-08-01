console.log("Rodando versão DEBUG");

const urlCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dadosOriginais = [];
let charts = {};

document.addEventListener("DOMContentLoaded", () => {
    carregarDados();
    document.getElementById("btnFiltrar").addEventListener("click", aplicarFiltro);
});

function carregarDados() {
    console.log("Iniciando carregamento do CSV...");
    Papa.parse(urlCSV, {
        download: true,
        header: true,
        complete: function (resultado) {
            dadosOriginais = resultado.data;
            console.log(`Linhas recebidas: ${dadosOriginais.length}`);
            popularFiltroClubes();
            processarDados(dadosOriginais);
        },
        error: function (err) {
            console.error("Erro ao carregar CSV: ", err);
            alert("Erro ao carregar dados!");
        }
    });
}

function popularFiltroClubes() {
    const select = document.getElementById("filtroClube");
    let clubes = [...new Set(dadosOriginais.map(d => d["Usuário - Nome de usuário do principal"]).filter(c => c))];
    clubes.sort();
    clubes.forEach(clube => {
        let option = document.createElement("option");
        option.value = clube;
        option.textContent = clube;
        select.appendChild(option);
    });
}

function aplicarFiltro() {
    const dataFiltro = document.getElementById("filtroData").value;
    const clubeFiltro = document.getElementById("filtroClube").value;

    let dadosFiltrados = dadosOriginais.filter(d => {
        let condData = dataFiltro ? d.DATA === dataFiltro : true;
        let condClube = clubeFiltro !== "Todos" ? d["Usuário - Nome de usuário do principal"] === clubeFiltro : true;
        return condData && condClube;
    });

    console.log(`Dados filtrados: ${dadosFiltrados.length}`);
    processarDados(dadosFiltrados);
}

function processarDados(dados) {
    console.log("Processando dados...");
    let totalFTD = 0, totalDepositos = 0, totalGGR = 0, totalSports = 0, totalCassino = 0;

    dados.forEach(linha => {
        totalFTD += parseFloat(linha["Usuário - FTD-Montante"] || 0);
        totalDepositos += parseFloat(linha["Usuário - Depósitos"] || 0);
        totalGGR += parseFloat(linha["Cálculo - GGR"] || 0);
        totalSports += parseFloat(linha["Sportsbook - GGR"] || 0);
        totalCassino += parseFloat(linha["Cassino - GGR"] || 0);
    });

    document.getElementById("valor-ftd").innerText = formatarMoeda(totalFTD);
    document.getElementById("valor-depositos").innerText = formatarMoeda(totalDepositos);
    document.getElementById("valor-ggr").innerText = formatarMoeda(totalGGR);
    document.getElementById("valor-sportsbook").innerText = formatarMoeda(totalSports);
    document.getElementById("valor-cassino").innerText = formatarMoeda(totalCassino);

    montarGraficos(dados);
    montarTabelas(dados);
    document.getElementById("ultimaAtualizacao").innerText = new Date().toLocaleString();
}

function montarGraficos(dados) {
    const dadosPorData = {};
    dados.forEach(linha => {
        const data = linha.DATA;
        if (!dadosPorData[data]) {
            dadosPorData[data] = { ggr: 0, depositos: 0, ftd: 0, sports: 0, cassino: 0 };
        }
        dadosPorData[data].ggr += parseFloat(linha["Cálculo - GGR"] || 0);
        dadosPorData[data].depositos += parseFloat(linha["Usuário - Depósitos"] || 0);
        dadosPorData[data].ftd += parseFloat(linha["Usuário - FTD-Montante"] || 0);
        dadosPorData[data].sports += parseFloat(linha["Sportsbook - GGR"] || 0);
        dadosPorData[data].cassino += parseFloat(linha["Cassino - GGR"] || 0);
    });

    const labels = Object.keys(dadosPorData).sort();
    const valoresGGR = labels.map(d => dadosPorData[d].ggr);
    const valoresDepositos = labels.map(d => dadosPorData[d].depositos);
    const valoresFTD = labels.map(d => dadosPorData[d].ftd);
    const valoresSports = labels.map(d => dadosPorData[d].sports);
    const valoresCassino = labels.map(d => dadosPorData[d].cassino);

    criarOuAtualizarGrafico("graficoGGR", labels, valoresGGR, "GGR", "lime");
    criarOuAtualizarGrafico("graficoDepositos", labels, valoresDepositos, "Depósitos", "blue");
    criarOuAtualizarGrafico("graficoFTD", labels, valoresFTD, "FTD", "yellow");
    criarOuAtualizarGrafico("graficoSportsbook", labels, valoresSports, "Sportsbook GGR", "orange");
    criarOuAtualizarGrafico("graficoCassino", labels, valoresCassino, "Cassino GGR", "purple");
}

function criarOuAtualizarGrafico(id, labels, data, label, color) {
    if (charts[id]) charts[id].destroy();
    const ctx = document.getElementById(id).getContext("2d");
    charts[id] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: color,
                fill: false
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function montarTabelas(dados) {
    montarTabela("tabelaDepositos", agruparTop(dados, "Usuário - Depósitos"));
    montarTabela("tabelaFTD", agruparTop(dados, "Usuário - FTD-Montante"));
    montarTabela("tabelaGGR", agruparTop(dados, "Cálculo - GGR"));
}

function agruparTop(dados, campo) {
    const mapa = {};
    dados.forEach(linha => {
        const clube = linha["Usuário - Nome de usuário do principal"];
        const valor = parseFloat(linha[campo] || 0);
        mapa[clube] = (mapa[clube] || 0) + valor;
    });
    return Object.entries(mapa).sort((a, b) => b[1] - a[1]).slice(0, 10);
}

function montarTabela(id, dados) {
    const tabela = document.getElementById(id);
    tabela.innerHTML = "<tr><th>Clube</th><th>Valor</th></tr>";
    dados.forEach(([clube, valor]) => {
        tabela.innerHTML += `<tr><td>${clube}</td><td>${formatarMoeda(valor)}</td></tr>`;
    });
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
