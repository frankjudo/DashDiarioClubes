console.log("Rodando versão DEBUG");

const csvURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let rawData = [];
let chartInstances = {};

document.addEventListener("DOMContentLoaded", () => {
    carregarDados();
    document.getElementById("aplicar").addEventListener("click", aplicarFiltro);
});

function carregarDados() {
    console.log("Iniciando carregamento do CSV...");
    Papa.parse(csvURL, {
        download: true,
        header: true,
        dynamicTyping: false,
        complete: function(results) {
            rawData = results.data;
            console.log(`Linhas recebidas: ${rawData.length}`);
            processarDados();
        },
        error: function(error) {
            console.error("Erro ao carregar CSV:", error);
            alert("Erro ao carregar os dados. Verifique a conexão.");
        }
    });
}

function normalizarNumero(valor) {
    if (!valor || valor === "") return 0;
    return parseFloat(valor.toString().replace(/\./g, '').replace(',', '.')) || 0;
}

function processarDados() {
    console.log("Processando dados...");
    if (!rawData || rawData.length === 0) return;

    let ftd = 0, depositos = 0, ggr = 0, sportsbook = 0, cassino = 0;
    rawData.forEach(row => {
        ftd += normalizarNumero(row["Usuário - FTD-Montante"]);
        depositos += normalizarNumero(row["Usuário - Depósitos"]);
        ggr += normalizarNumero(row["Cálculo - GGR"]);
        sportsbook += normalizarNumero(row["Sportsbook - GGR"]);
        cassino += normalizarNumero(row["Cassino - GGR"]);
    });

    document.getElementById("ftdTotal").innerText = ftd.toLocaleString("pt-BR", {style: "currency", currency: "BRL"});
    document.getElementById("depositosTotal").innerText = depositos.toLocaleString("pt-BR", {style: "currency", currency: "BRL"});
    document.getElementById("ggrTotal").innerText = ggr.toLocaleString("pt-BR", {style: "currency", currency: "BRL"});
    document.getElementById("sportsbookGgrTotal").innerText = sportsbook.toLocaleString("pt-BR", {style: "currency", currency: "BRL"});
    document.getElementById("cassinoGgrTotal").innerText = cassino.toLocaleString("pt-BR", {style: "currency", currency: "BRL"});

    montarGraficos();
    montarTabelas();
}

function montarGraficos() {
    console.log("Montando gráficos...");
    const ctx1 = document.getElementById('ggrChart').getContext('2d');
    chartInstances.ggr = new Chart(ctx1, {
        type: 'line',
        data: { labels: rawData.map(r => r.DATA), datasets: [{ label: 'GGR', data: rawData.map(r => normalizarNumero(r["Cálculo - GGR"])), borderColor: 'lime', fill: false }] }
    });

    const ctx2 = document.getElementById('depositosChart').getContext('2d');
    chartInstances.depositos = new Chart(ctx2, {
        type: 'line',
        data: { labels: rawData.map(r => r.DATA), datasets: [{ label: 'Depósitos', data: rawData.map(r => normalizarNumero(r["Usuário - Depósitos"])), borderColor: 'blue', fill: false }] }
    });

    const ctx3 = document.getElementById('ftdChart').getContext('2d');
    chartInstances.ftd = new Chart(ctx3, {
        type: 'line',
        data: { labels: rawData.map(r => r.DATA), datasets: [{ label: 'FTD', data: rawData.map(r => normalizarNumero(r["Usuário - FTD-Montante"])), borderColor: 'yellow', fill: false }] }
    });

    const ctx4 = document.getElementById('sportsbookChart').getContext('2d');
    chartInstances.sportsbook = new Chart(ctx4, {
        type: 'line',
        data: { labels: rawData.map(r => r.DATA), datasets: [{ label: 'Sportsbook GGR', data: rawData.map(r => normalizarNumero(r["Sportsbook - GGR"])), borderColor: 'orange', fill: false }] }
    });

    const ctx5 = document.getElementById('cassinoChart').getContext('2d');
    chartInstances.cassino = new Chart(ctx5, {
        type: 'line',
        data: { labels: rawData.map(r => r.DATA), datasets: [{ label: 'Cassino GGR', data: rawData.map(r => normalizarNumero(r["Cassino - GGR"])), borderColor: 'purple', fill: false }] }
    });
}

function montarTabelas() {
    console.log("Montando tabelas...");
    // Placeholder: ordenar e popular tabelas aqui se necessário
}

function aplicarFiltro() {
    console.log("Filtro aplicado, mas precisa de implementação detalhada");
}
