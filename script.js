console.log("Rodando versão DEBUG");

const urlCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

document.getElementById("btnAplicar").addEventListener("click", carregarDados);

let charts = {};

function carregarDados() {
    console.log("Iniciando carregamento do CSV...");
    Papa.parse(urlCSV, {
        download: true,
        header: true,
        complete: (results) => {
            console.log("Linhas recebidas:", results.data.length);
            processarDados(results.data);
        }
    });
}

function processarDados(dados) {
    const filtroClube = document.getElementById("filtroClube").value;
    const filtroData = document.getElementById("filtroData").value;

    let filtrados = dados.filter(linha => {
        let ok = true;
        if (filtroClube !== "Todos") ok = linha["Usuário - Nome de usuário"] === filtroClube;
        if (filtroData) ok = ok && linha["DATA"] === filtroData;
        return ok;
    });

    console.log("Clubes carregados no filtro:", filtrados.length);

    atualizarDashboard(filtrados);
    montarGraficos(filtrados);
    montarTabelas(filtrados);
}

function atualizarDashboard(dados) {
    console.log("Atualizando dashboard...");
    const ftd = somaCampo(dados, "Usuário - FTD-Montante");
    const depositos = somaCampo(dados, "Usuário - Depósitos");
    const ggr = somaCampo(dados, "GGR");
    const sports = somaCampo(dados, "Sportsbook - GGR");
    const cassino = somaCampo(dados, "Cassino - GGR");

    document.getElementById("kpi-ftd").textContent = formatar(ftd);
    document.getElementById("kpi-depositos").textContent = formatar(depositos);
    document.getElementById("kpi-ggr").textContent = formatar(ggr);
    document.getElementById("kpi-sportsbook").textContent = formatar(sports);
    document.getElementById("kpi-cassino").textContent = formatar(cassino);
}

function montarGraficos(dados) {
    console.log("Montando gráficos...");

    const labels = [...new Set(dados.map(d => d["DATA"]))].sort();
    const ggrData = labels.map(data => somaCampo(dados.filter(d => d["DATA"] === data), "GGR"));
    const depData = labels.map(data => somaCampo(dados.filter(d => d["DATA"] === data), "Usuário - Depósitos"));
    const ftdData = labels.map(data => somaCampo(dados.filter(d => d["DATA"] === data), "Usuário - FTD-Montante"));
    const sportsData = labels.map(data => somaCampo(dados.filter(d => d["DATA"] === data), "Sportsbook - GGR"));
    const cassinoData = labels.map(data => somaCampo(dados.filter(d => d["DATA"] === data), "Cassino - GGR"));

    criarGrafico("graficoGGR", labels, ggrData, "GGR", "lime");
    criarGrafico("graficoDepositos", labels, depData, "Depósitos", "blue");
    criarGrafico("graficoFTD", labels, ftdData, "FTD", "yellow");
    criarGrafico("graficoSportsbook", labels, sportsData, "Sportsbook GGR", "orange");
    criarGrafico("graficoCassino", labels, cassinoData, "Cassino GGR", "purple");
}

function criarGrafico(id, labels, data, label, cor) {
    if (charts[id]) charts[id].destroy();
    const ctx = document.getElementById(id).getContext("2d");
    charts[id] = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: cor,
                backgroundColor: "transparent",
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: cor
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: "lime" } } },
            scales: { x: { ticks: { color: "lime" } }, y: { ticks: { color: "lime" } } }
        }
    });
}

function montarTabelas(dados) {
    console.log("Montando tabelas...");
    preencherTabela("tabelaDepositos", top10(dados, "Usuário - Depósitos"));
    preencherTabela("tabelaFTD", top10(dados, "Usuário - FTD-Montante"));
    preencherTabela("tabelaGGR", top10(dados, "GGR"));
}

function preencherTabela(id, dados) {
    const tbody = document.getElementById(id).querySelector("tbody");
    tbody.innerHTML = "";
    dados.forEach(linha => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${linha["Usuário - Nome de usuário"]}</td><td>${formatar(linha.valor)}</td>`;
        tbody.appendChild(tr);
    });
}

function top10(dados, campo) {
    const mapa = {};
    dados.forEach(l => {
        const clube = l["Usuário - Nome de usuário"];
        const valor = parseFloat((l[campo] || "0").replace(",", "."));
        mapa[clube] = (mapa[clube] || 0) + valor;
    });
    return Object.keys(mapa)
        .map(clube => ({ "Usuário - Nome de usuário": clube, valor: mapa[clube] }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10);
}

function somaCampo(dados, campo) {
    return dados.reduce((acc, cur) => acc + parseFloat((cur[campo] || "0").replace(",", ".")), 0);
}

function formatar(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

carregarDados();
