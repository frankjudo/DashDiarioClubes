console.log("Rodando versão DEBUG");
const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dados = [];

document.addEventListener("DOMContentLoaded", () => {
    carregarDados();
});

function carregarDados() {
    console.log("Iniciando carregamento do CSV...");
    Papa.parse(URL_CSV, {
        download: true,
        header: true,
        complete: function(results) {
            dados = results.data;
            console.log("Linhas recebidas:", dados.length);
            atualizarDashboard(dados);
        }
    });
}

function atualizarDashboard(dados) {
    console.log("Normalizando dados...");
    let totalFTD = 0, totalDepositos = 0, totalGGR = 0;

    dados.forEach(linha => {
        totalFTD += parseFloat(linha["Usuário - FTD-Montante"] || 0);
        totalDepositos += parseFloat(linha["Usuário - Depósitos"] || 0);
        totalGGR += parseFloat(linha["Cálculo - GGR"] || 0);
    });

    document.getElementById("ftdValor").innerText = formatarMoeda(totalFTD);
    document.getElementById("depositosValor").innerText = formatarMoeda(totalDepositos);
    document.getElementById("ggrValor").innerText = formatarMoeda(totalGGR);

    montarGraficos(dados);
    montarTabelas(dados);
}

function montarGraficos(dados) {
    console.log("Montando gráficos...");
    let datas = [...new Set(dados.map(l => l.DATA))];

    let ggrDiario = datas.map(d => somaCampo(dados, "Cálculo - GGR", d));
    let ftdDiario = datas.map(d => somaCampo(dados, "Usuário - FTD-Montante", d));
    let depDiario = datas.map(d => somaCampo(dados, "Usuário - Depósitos", d));

    criarGrafico("graficoGGR", datas, ggrDiario, "GGR", "green");
    criarGrafico("graficoFTD", datas, ftdDiario, "FTD", "yellow");
    criarGrafico("graficoDepositos", datas, depDiario, "Depósitos", "blue");
}

function criarGrafico(id, labels, dados, label, cor) {
    new Chart(document.getElementById(id), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: dados,
                borderColor: cor,
                fill: false,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: cor } }
            },
            scales: {
                x: { ticks: { color: '#0f0' } },
                y: { ticks: { color: '#0f0' } }
            }
        }
    });
}

function montarTabelas(dados) {
    console.log("Montando tabelas...");
    montarTabela("tabelaDepositos", agrupar("Usuário - Nome de usuário", "Usuário - Depósitos", dados));
    montarTabela("tabelaFTD", agrupar("Usuário - Nome de usuário", "Usuário - FTD-Montante", dados));
    montarTabela("tabelaGGR", agrupar("Usuário - Nome de usuário", "Cálculo - GGR", dados));
}

function agrupar(campoChave, campoValor, dados) {
    const mapa = {};
    dados.forEach(l => {
        const chave = l[campoChave];
        const valor = parseFloat(l[campoValor] || 0);
        mapa[chave] = (mapa[chave] || 0) + valor;
    });
    return Object.entries(mapa)
        .map(([clube, valor]) => ({ clube, valor }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10);
}

function montarTabela(id, dados) {
    const tabela = document.getElementById(id);
    tabela.innerHTML = "<tr><th>Clube</th><th>Valor</th></tr>";
    dados.forEach(linha => {
        tabela.innerHTML += `<tr><td>${linha.clube}</td><td>${formatarMoeda(linha.valor)}</td></tr>`;
    });
}

function somaCampo(dados, campo, data) {
    return dados.filter(l => l.DATA === data).reduce((soma, l) => soma + parseFloat(l[campo] || 0), 0);
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function aplicarFiltro() {
    console.log("Filtro aplicado (demo).");
}
