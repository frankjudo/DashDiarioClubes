console.log("Rodando versão DEBUG");

let dadosCSV = [];

Papa.parse("dados.csv", {
    download: true,
    header: true,
    complete: function(results) {
        console.log("Linhas recebidas:", results.data.length);
        dadosCSV = results.data;
        preencherFiltroClubes(dadosCSV);
        atualizarDashboard(dadosCSV);
        montarGraficos(dadosCSV);
        montarTabelas(dadosCSV);
    }
});

function preencherFiltroClubes(dados) {
    const clubes = [...new Set(dados.map(d => d["Usuário - Nome de usuário do principal"]))];
    const select = document.getElementById("clubeFiltro");
    select.innerHTML = `<option value="Todos">Todos</option>` + clubes.map(c => `<option value="${c}">${c}</option>`).join("");
    console.log("Clubes carregados no filtro:", clubes.length);
}

function aplicarFiltro() {
    const data = document.getElementById("dataFiltro").value;
    const clube = document.getElementById("clubeFiltro").value;

    let filtrado = dadosCSV;

    if (data) filtrado = filtrado.filter(d => d["DATA"] === data);
    if (clube !== "Todos") filtrado = filtrado.filter(d => d["Usuário - Nome de usuário do principal"] === clube);

    atualizarDashboard(filtrado);
    montarGraficos(filtrado);
    montarTabelas(filtrado);
}

function somaCampo(dados, campo) {
    return dados.reduce((acc, d) => acc + (parseFloat((d[campo] || "0").replace(",", ".")) || 0), 0);
}

function formatar(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function atualizarDashboard(dados) {
    console.log("Atualizando dashboard...");
    document.getElementById("kpi-ftd").textContent = formatar(somaCampo(dados, "Usuário - FTD-Montante"));
    document.getElementById("kpi-depositos").textContent = formatar(somaCampo(dados, "Usuário - Depósitos"));
    document.getElementById("kpi-ggr").textContent = formatar(somaCampo(dados, "Cálculo - GGR"));
    document.getElementById("kpi-sportsbook").textContent = formatar(somaCampo(dados, "Sportsbook - GGR"));
    document.getElementById("kpi-cassino").textContent = formatar(somaCampo(dados, "Cassino - GGR"));
}

function montarGraficos(dados) {
    console.log("Montando gráficos...");
    const labels = [...new Set(dados.map(d => d["DATA"]))].sort();

    criarGrafico("graficoGGR", labels, labels.map(d => somaCampo(dados.filter(x => x["DATA"] === d), "Cálculo - GGR")), "GGR", "lime");
    criarGrafico("graficoDepositos", labels, labels.map(d => somaCampo(dados.filter(x => x["DATA"] === d), "Usuário - Depósitos")), "Depósitos", "blue");
    criarGrafico("graficoFTD", labels, labels.map(d => somaCampo(dados.filter(x => x["DATA"] === d), "Usuário - FTD-Montante")), "FTD", "yellow");
    criarGrafico("graficoSportsbook", labels, labels.map(d => somaCampo(dados.filter(x => x["DATA"] === d), "Sportsbook - GGR")), "Sportsbook GGR", "orange");
    criarGrafico("graficoCassino", labels, labels.map(d => somaCampo(dados.filter(x => x["DATA"] === d), "Cassino - GGR")), "Cassino GGR", "purple");
}

function criarGrafico(id, labels, data, label, color) {
    const ctx = document.getElementById(id).getContext("2d");
    if (window[id]) window[id].destroy();
    window[id] = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: color,
                fill: false,
                tension: 0.3
            }]
        },
        options: {
            plugins: { legend: { labels: { color: "lime" } } },
            scales: {
                x: { ticks: { color: "lime" } },
                y: { ticks: { color: "lime" } }
            }
        }
    });
}

function montarTabelas(dados) {
    console.log("Montando tabelas...");
    montarTop10(dados, "Usuário - Depósitos", "tabelaDepositos");
    montarTop10(dados, "Usuário - FTD-Montante", "tabelaFTD");
    montarTop10(dados, "Cálculo - GGR", "tabelaGGR");
}

function montarTop10(dados, campo, tabelaId) {
    const resumo = {};
    dados.forEach(d => {
        const clube = d["Usuário - Nome de usuário do principal"];
        resumo[clube] = (resumo[clube] || 0) + (parseFloat((d[campo] || "0").replace(",", ".")) || 0);
    });

    const top10 = Object.entries(resumo).sort((a, b) => b[1] - a[1]).slice(0, 10);

    const tbody = document.querySelector(`#${tabelaId} tbody`);
    tbody.innerHTML = top10.map(([clube, valor]) => `<tr><td>${clube}</td><td>${valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td></tr>`).join("");
}
