let dadosOriginais = [];
let chartGGR, chartFTD, chartDepositos, chartAtivos;

const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

document.addEventListener("DOMContentLoaded", () => {
    carregarDados();
    document.getElementById("aplicarFiltros").addEventListener("click", aplicarFiltros);
});

function carregarDados() {
    Papa.parse(URL_CSV, {
        download: true,
        header: true,
        complete: (res) => {
            dadosOriginais = res.data.filter(l => l["DATA"]);
            preencherFiltroClubes();
            aplicarFiltros();
        }
    });
}

function preencherFiltroClubes() {
    const clubes = [...new Set(dadosOriginais.map(l => l["Usuário - Nome de usuário do principal"]))].sort();
    const select = document.getElementById("clubeFiltro");
    select.innerHTML = "<option value=''>Todos</option>";
    clubes.forEach(c => {
        select.innerHTML += `<option value="${c}">${c}</option>`;
    });
}

function aplicarFiltros() {
    const inicio = document.getElementById("dataInicio").value;
    const fim = document.getElementById("dataFim").value;
    const clube = document.getElementById("clubeFiltro").value;

    let dados = dadosOriginais.filter(l => {
        let data = new Date(l["DATA"]);
        return (!inicio || data >= new Date(inicio)) &&
               (!fim || data <= new Date(fim)) &&
               (!clube || l["Usuário - Nome de usuário do principal"] === clube);
    });

    atualizarResumo(dados);
    atualizarRanking(dados);
    atualizarGraficos(dados);
}

function somar(dados, coluna) {
    return dados.reduce((acc, l) => acc + (parseFloat(l[coluna]) || 0), 0);
}

function atualizarResumo(dados) {
    document.getElementById("totalFTD").innerText = somar(dados, "Usuário - FTD-Montante").toFixed(2);
    document.getElementById("totalDepositos").innerText = somar(dados, "Usuário - Depósitos").toFixed(2);
    document.getElementById("totalGGR").innerText = somar(dados, "Cálculo - GGR").toFixed(2);
}

function atualizarRanking(dados) {
    const ranking = {};
    dados.forEach(l => {
        const clube = l["Usuário - Nome de usuário do principal"];
        ranking[clube] = (ranking[clube] || 0) + (parseFloat(l["Usuário - Depósitos"]) || 0);
    });

    const top = Object.entries(ranking)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const tbody = document.querySelector("#rankingTabela tbody");
    tbody.innerHTML = "";
    top.forEach(([clube, valor]) => {
        tbody.innerHTML += `<tr><td>${clube}</td><td>${valor.toFixed(2)}</td></tr>`;
    });
}

function atualizarGraficos(dados) {
    const dias = [...new Set(dados.map(l => l["DATA"]))].sort();
    const porDia = dias.map(dia => ({
        dia,
        ggr: somar(dados.filter(l => l["DATA"] === dia), "Cálculo - GGR"),
        ftd: somar(dados.filter(l => l["DATA"] === dia), "Usuário - FTD-Montante"),
        deposito: somar(dados.filter(l => l["DATA"] === dia), "Usuário - Depósitos"),
        ativos: new Set(dados.filter(l => l["DATA"] === dia && parseFloat(l["Cálculo - GGR"]) !== 0)
                               .map(l => l["Usuário - Nome de usuário do principal"])).size
    }));

    const labels = porDia.map(l => l.dia);
    const ggrData = porDia.map(l => l.ggr);
    const ftdData = porDia.map(l => l.ftd);
    const depData = porDia.map(l => l.deposito);
    const ativosData = porDia.map(l => l.ativos);

    if (chartGGR) chartGGR.destroy();
    chartGGR = new Chart(document.getElementById("graficoGGR"), {
        type: 'line',
        data: { labels, datasets: [{ label: "GGR Diário", data: ggrData, borderColor: "lime", fill: true }] },
        options: { responsive: true, maintainAspectRatio: false }
    });

    if (chartFTD) chartFTD.destroy();
    chartFTD = new Chart(document.getElementById("graficoFTD"), {
        type: 'line',
        data: { labels, datasets: [{ label: "FTD Diário", data: ftdData, borderColor: "yellow", fill: true }] },
        options: { responsive: true, maintainAspectRatio: false }
    });

    if (chartDepositos) chartDepositos.destroy();
    chartDepositos = new Chart(document.getElementById("graficoDepositos"), {
        type: 'line',
        data: { labels, datasets: [{ label: "Depósitos Diário", data: depData, borderColor: "aqua", fill: true }] },
        options: { responsive: true, maintainAspectRatio: false }
    });

    if (chartAtivos) chartAtivos.destroy();
    chartAtivos = new Chart(document.getElementById("graficoAtivos"), {
        type: 'bar',
        data: { labels, datasets: [{ label: "Clubes Ativos", data: ativosData, backgroundColor: "cyan" }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}
