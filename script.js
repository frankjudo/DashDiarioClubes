const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugg-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?output=csv";
let dados = [];
let chart;

document.addEventListener("DOMContentLoaded", () => {
    carregarDados();
});

function carregarDados() {
    Papa.parse(URL_CSV, {
        download: true,
        header: true,
        complete: function(results) {
            dados = results.data;
            preencherSelectClubes();
            atualizarDashboard(dados);
        }
    });
}

function preencherSelectClubes() {
    const clubes = [...new Set(dados.map(linha => linha["Usuário - Nome de usuário do principal"]))];
    const select = document.getElementById("clubeSelect");
    select.innerHTML = "<option value=''>Todos</option>";
    clubes.forEach(clube => {
        if (clube) {
            const opt = document.createElement("option");
            opt.value = clube;
            opt.textContent = clube;
            select.appendChild(opt);
        }
    });
}

function aplicarFiltros() {
    const dataInicio = document.getElementById("dataInicio").value;
    const dataFim = document.getElementById("dataFim").value;
    const clube = document.getElementById("clubeSelect").value;

    let filtrado = dados.filter(linha => {
        let passa = true;
        if (dataInicio) passa = passa && (new Date(linha["DATA"]) >= new Date(dataInicio));
        if (dataFim) passa = passa && (new Date(linha["DATA"]) <= new Date(dataFim));
        if (clube) passa = passa && (linha["Usuário - Nome de usuário do principal"] === clube);
        return passa;
    });

    atualizarDashboard(filtrado);
}

function atualizarDashboard(dadosFiltrados) {
    const totalFTD = dadosFiltrados.reduce((sum, l) => sum + parseFloat(l["Usuário - FTD-Montante"] || 0), 0);
    const totalDepositos = dadosFiltrados.reduce((sum, l) => sum + parseFloat(l["Usuário - Depósitos"] || 0), 0);
    const totalGGR = dadosFiltrados.reduce((sum, l) => sum + parseFloat(l["Cálculo - GGR"] || 0), 0);

    document.getElementById("ftdTotal").textContent = totalFTD.toFixed(2);
    document.getElementById("depositosTotal").textContent = totalDepositos.toFixed(2);
    document.getElementById("ggrTotal").textContent = totalGGR.toFixed(2);

    atualizarGraficoDiario(dadosFiltrados);
    atualizarTop10Clubes(dadosFiltrados);
}

function atualizarGraficoDiario(dadosFiltrados) {
    const agrupadoPorDia = {};
    dadosFiltrados.forEach(l => {
        const dia = l["DATA"];
        if (!agrupadoPorDia[dia]) agrupadoPorDia[dia] = { ggr: 0 };
        agrupadoPorDia[dia].ggr += parseFloat(l["Cálculo - GGR"] || 0);
    });

    const labels = Object.keys(agrupadoPorDia).sort();
    const valores = labels.map(dia => agrupadoPorDia[dia].ggr);

    const ctx = document.getElementById("graficoDiario").getContext("2d");
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "GGR por Dia",
                data: valores,
                borderColor: "#0f0",
                backgroundColor: "rgba(0,255,0,0.2)",
                tension: 0.3
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

function atualizarTop10Clubes(dadosFiltrados) {
    const clubesMap = {};
    dadosFiltrados.forEach(linha => {
        const clube = linha["Usuário - Nome de usuário do principal"];
        const ggr = parseFloat(linha["Cálculo - GGR"] || 0);
        if (!clubesMap[clube]) clubesMap[clube] = 0;
        clubesMap[clube] += ggr;
    });

    const top10 = Object.entries(clubesMap)
        .map(([clube, ggr]) => ({ clube, ggr }))
        .sort((a, b) => b.ggr - a.ggr)
        .slice(0, 10);

    const tbody = document.querySelector("#top10Table tbody");
    tbody.innerHTML = "";
    top10.forEach(item => {
        const row = `<tr><td>${item.clube}</td><td>${item.ggr.toFixed(2)}</td></tr>`;
        tbody.insertAdjacentHTML("beforeend", row);
    });
}
