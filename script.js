console.log("Rodando versão DEBUG");

// URL do CSV público
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dados = [];
let charts = {};

document.getElementById('aplicar').addEventListener('click', aplicarFiltro);

// Carrega CSV ao iniciar
Papa.parse(CSV_URL, {
    download: true,
    header: true,
    complete: function(results) {
        console.log("Linhas recebidas:", results.data.length);
        dados = results.data;
        popularFiltroClubes();
        atualizarDashboard();
    }
});

function popularFiltroClubes() {
    const select = document.getElementById('clube');
    const clubes = [...new Set(dados.map(d => d["Usuário - Nome de usuário do principal"]))];
    select.innerHTML = `<option value="Todos">Todos</option>` +
        clubes.map(c => `<option value="${c}">${c}</option>`).join('');
    console.log("Clubes carregados no filtro:", clubes.length);
}

function aplicarFiltro() {
    console.log("Aplicando filtro...");
    atualizarDashboard();
}

function atualizarDashboard() {
    console.log("Atualizando dashboard...");
    const clubeSelecionado = document.getElementById('clube').value;
    let filtrados = dados;

    if (clubeSelecionado !== "Todos") {
        filtrados = filtrados.filter(d => d["Usuário - Nome de usuário do principal"] === clubeSelecionado);
    }

    const soma = (campo) => filtrados.reduce((acc, row) => acc + (parseFloat(row[campo].replace(",", ".") || 0)), 0);

    document.getElementById('ftd').textContent = formatarMoeda(soma("Usuário - FTD-Montante"));
    document.getElementById('depositos').textContent = formatarMoeda(soma("Usuário - Depósitos"));
    document.getElementById('ggr').textContent = formatarMoeda(soma("Cálculo - GGR"));
    document.getElementById('sportsbookGgr').textContent = formatarMoeda(soma("Sportsbook - GGR"));
    document.getElementById('cassinoGgr').textContent = formatarMoeda(soma("Cassino - GGR"));

    montarGraficos(filtrados);
    montarTabelas(filtrados);

    document.getElementById('ultimaAtualizacao').textContent = 
        "Última atualização: " + new Date().toLocaleString();
}

function montarGraficos(dados) {
    console.log("Montando gráficos...");
    const porData = (campo) => {
        const map = {};
        dados.forEach(row => {
            const data = row.DATA;
            const valor = parseFloat(row[campo].replace(",", ".") || 0);
            map[data] = (map[data] || 0) + valor;
        });
        return {labels: Object.keys(map), valores: Object.values(map)};
    };

    const ggr = porData("Cálculo - GGR");
    const ftd = porData("Usuário - FTD-Montante");
    const dep = porData("Usuário - Depósitos");
    const sportsbook = porData("Sportsbook - GGR");
    const cassino = porData("Cassino - GGR");

    criarOuAtualizarGrafico("graficoGGR", ggr.labels, ggr.valores, "GGR", "lime");
    criarOuAtualizarGrafico("graficoFTD", ftd.labels, ftd.valores, "FTD", "yellow");
    criarOuAtualizarGrafico("graficoDepositos", dep.labels, dep.valores, "Depósitos", "blue");
    criarOuAtualizarGrafico("graficoSportsbook", sportsbook.labels, sportsbook.valores, "Sportsbook GGR", "orange");
    criarOuAtualizarGrafico("graficoCassino", cassino.labels, cassino.valores, "Cassino GGR", "purple");
}

function criarOuAtualizarGrafico(id, labels, valores, label, cor) {
    if (charts[id]) {
        charts[id].data.labels = labels;
        charts[id].data.datasets[0].data = valores;
        charts[id].update();
    } else {
        charts[id] = new Chart(document.getElementById(id).getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: valores,
                    borderColor: cor,
                    backgroundColor: "transparent",
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 2
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { labels: { color: "#0f0" } } },
                scales: {
                    x: { ticks: { color: "#0f0" } },
                    y: { ticks: { color: "#0f0" } }
                }
            }
        });
    }
}

function montarTabelas(dados) {
    console.log("Montando tabelas...");
    montarTabela("tabelaDepositos", "Usuário - Depósitos");
    montarTabela("tabelaFTD", "Usuário - FTD-Montante");
    montarTabela("tabelaGGR", "Cálculo - GGR");

    function montarTabela(id, campo) {
        const clubes = {};
        dados.forEach(row => {
            const clube = row["Usuário - Nome de usuário do principal"];
            const valor = parseFloat(row[campo].replace(",", ".") || 0);
            clubes[clube] = (clubes[clube] || 0) + valor;
        });
        const top10 = Object.entries(clubes).sort((a,b) => b[1]-a[1]).slice(0,10);
        document.querySelector(`#${id} tbody`).innerHTML = top10.map(
            c => `<tr><td>${c[0]}</td><td>${formatarMoeda(c[1])}</td></tr>`
        ).join('');
    }
}

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
}
