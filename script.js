console.log("Rodando versão DEBUG");

const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dadosCSV = [];

async function carregarDados() {
    console.log("Iniciando carregamento do CSV...");
    try {
        const resposta = await fetch(URL_CSV);
        if (!resposta.ok) throw new Error("Falha ao carregar CSV: " + resposta.statusText);
        const texto = await resposta.text();
        dadosCSV = Papa.parse(texto, { header: true, skipEmptyLines: true }).data;
        console.log("Linhas recebidas:", dadosCSV.length);
        processarDados();
    } catch (erro) {
        console.error("Erro ao carregar CSV:", erro);
    }
}

function processarDados() {
    console.log("Processando dados...");
    preencherFiltroClubes();
    aplicarFiltros();
}

function preencherFiltroClubes() {
    const clubes = [...new Set(dadosCSV.map(l => l["Usuário - Nome de usuário"]))];
    const select = document.getElementById("clubeFiltro");
    clubes.forEach(c => {
        const option = document.createElement("option");
        option.value = c;
        option.textContent = c;
        select.appendChild(option);
    });
    console.log("Clubes carregados:", clubes.length);
}

function aplicarFiltros() {
    const dataFiltro = document.getElementById("dataFiltro").value;
    const clubeFiltro = document.getElementById("clubeFiltro").value;
    let filtrados = dadosCSV;

    if (dataFiltro) {
        filtrados = filtrados.filter(l => l["DATA"] === dataFiltro);
    }
    if (clubeFiltro !== "Todos") {
        filtrados = filtrados.filter(l => l["Usuário - Nome de usuário"] === clubeFiltro);
    }
    console.log(`Filtro aplicado - Data: ${dataFiltro || "Todas"}, Clube: ${clubeFiltro}`);
    console.log(`Linhas filtradas: ${filtrados.length}`);

    montarKPIs(filtrados);
    montarGraficos(filtrados);
    montarTabelas(filtrados);
}

function montarKPIs(dados) {
    const soma = (campo) => dados.reduce((acc, l) => acc + parseFloat(l[campo] || 0), 0);
    document.querySelector("#kpi-ftd span").textContent = formatar(soma("Usuário - FTD-Montante"));
    document.querySelector("#kpi-depositos span").textContent = formatar(soma("Usuário - Depósitos"));
    document.querySelector("#kpi-ggr span").textContent = formatar(soma("Cálculo - GGR"));
    document.querySelector("#kpi-sportsbook span").textContent = formatar(soma("Sportsbook - GGR"));
    document.querySelector("#kpi-cassino span").textContent = formatar(soma("Cassino - GGR"));
}

function montarGraficos(dados) {
    console.log("Montando gráficos...");
    // Aqui você cria os gráficos usando Chart.js como antes (GGR, FTD, Depósitos, Sportsbook GGR e Cassino GGR)
}

function montarTabelas(dados) {
    console.log("Montando tabelas...");
    montarTop10(dados, "Usuário - Depósitos", "#tabelaTopDepositos");
    montarTop10(dados, "Usuário - FTD-Montante", "#tabelaTopFTD");
    montarTop10(dados, "Cálculo - GGR", "#tabelaTopGGR");
    montarTop10(dados, "Sportsbook - GGR", "#tabelaTopSportsbook");
    montarTop10(dados, "Cassino - GGR", "#tabelaTopCassino");
}

function montarTop10(dados, campo, seletor) {
    const agrupado = {};
    dados.forEach(l => {
        const clube = l["Usuário - Nome de usuário"];
        agrupado[clube] = (agrupado[clube] || 0) + parseFloat(l[campo] || 0);
    });
    const top10 = Object.entries(agrupado)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const tbody = document.querySelector(`${seletor} tbody`);
    tbody.innerHTML = "";
    top10.forEach(([clube, valor]) => {
        tbody.innerHTML += `<tr><td>${clube}</td><td>${formatar(valor)}</td></tr>`;
    });
}

function formatar(valor) {
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

document.getElementById("btnAplicar").addEventListener("click", aplicarFiltros);

carregarDados();
