const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";
let dadosOriginais = [];

function carregarDados() {
    Papa.parse(sheetURL, {
        download: true,
        header: true,
        complete: function(results) {
            dadosOriginais = results.data;
            preencherClubes();
            atualizarDashboard(dadosOriginais);
        }
    });
}

function preencherClubes() {
    const clubes = [...new Set(dadosOriginais.map(linha => linha["Usuário - Nome de usuário do principal"]))];
    const select = document.getElementById("clubeSelect");
    select.innerHTML = `<option value="">Todos</option>`;
    clubes.forEach(clube => {
        select.innerHTML += `<option value="${clube}">${clube}</option>`;
    });
}

function aplicarFiltros() {
    const dataInicial = document.getElementById("dataInicial").value;
    const dataFinal = document.getElementById("dataFinal").value;
    const clube = document.getElementById("clubeSelect").value;

    let filtrados = dadosOriginais.filter(linha => {
        let data = new Date(linha["DATA"]);
        let condData = (!dataInicial || data >= new Date(dataInicial)) && (!dataFinal || data <= new Date(dataFinal));
        let condClube = (!clube || linha["Usuário - Nome de usuário do principal"] === clube);
        return condData && condClube;
    });

    atualizarDashboard(filtrados);
}

function atualizarDashboard(dados) {
    let ftd = 0, depositos = 0, ggr = 0;
    let clubesAtivos = new Set();
    let topClubes = {};

    dados.forEach(linha => {
        const f = parseFloat(linha["Usuário - FTD-Montante"]) || 0;
        const d = parseFloat(linha["Usuário - Depósitos"]) || 0;
        const g = parseFloat(linha["Cálculo - GGR"]) || 0;

        ftd += f;
        depositos += d;
        ggr += g;

        if (g !== 0) clubesAtivos.add(linha["Usuário - Nome de usuário do principal"]);

        topClubes[linha["Usuário - Nome de usuário do principal"]] = 
            (topClubes[linha["Usuário - Nome de usuário do principal"]] || 0) + g;
    });

    document.getElementById("ftdTotal").textContent = ftd.toFixed(2);
    document.getElementById("depositosTotal").textContent = depositos.toFixed(2);
    document.getElementById("ggrTotal").textContent = ggr.toFixed(2);
    document.getElementById("clubesAtivos").textContent = clubesAtivos.size;

    atualizarTop10(topClubes);
    atualizarGraficos(dados);
}

function atualizarTop10(topClubes) {
    const sorted = Object.entries(topClubes).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const tbody = document.querySelector("#top10 tbody");
    tbody.innerHTML = "";
    sorted.forEach(([clube, valor]) => {
        tbody.innerHTML += `<tr><td>${clube}</td><td>${valor.toFixed(2)}</td></tr>`;
    });
}

function atualizarGraficos(dados) {
    const porDia = {};
    dados.forEach(linha => {
        const dia = linha["DATA"];
        if (!porDia[dia]) porDia[dia] = { ggr: 0, ftd: 0, depositos: 0 };
        porDia[dia].ggr += parseFloat(linha["Cálculo - GGR"]) || 0;
        porDia[dia].ftd += parseFloat(linha["Usuário - FTD-Montante"]) || 0;
        porDia[dia].depositos += parseFloat(linha["Usuário - Depósitos"]) || 0;
    });

    const dias = Object.keys(porDia).sort();
    const ggr = dias.map(d => porDia[d].ggr);
    const ftd = dias.map(d => porDia[d].ftd);
    const depositos = dias.map(d => porDia[d].depositos);

    renderChart("graficoGGR", "GGR por Dia", dias, ggr, "green");
    renderChart("graficoFTD", "FTD por Dia", dias, ftd, "yellow");
    renderChart("graficoDepositos", "Depósitos por Dia", dias, depositos, "blue");
}

function renderChart(id, label, labels, data, color) {
    new Chart(document.getElementById(id), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label,
                data,
                borderColor: color,
                fill: false
            }]
        }
    });
}

carregarDados();
