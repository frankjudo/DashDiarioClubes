console.log("Rodando versão de desenvolvimento com logs completos");

// URL do CSV
const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dados = [];
let graficoGGR, graficoFTD, graficoDepositos;

// Função para formatar valores monetários
function formatarMoeda(valor) {
    if (valor == null || isNaN(valor)) return "R$ 0,00";
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Carregar CSV
Papa.parse(URL_CSV, {
    download: true,
    header: false,
    complete: function (resultado) {
        console.log("Linhas recebidas:", resultado.data.length);
        dados = resultado.data.filter(linha => linha.length > 1);
        atualizarTudo();
    },
    error: function (erro) {
        console.error("Erro ao carregar CSV:", erro);
    }
});

// Consolidação de dados
function consolidar() {
    let somaFTD = 0, somaDepositos = 0, somaGGR = 0;
    let ranking = { depositos: {}, ftd: {}, ggr: {} };

    dados.forEach(linha => {
        const clube = linha[2] || "Desconhecido";   // COLUNA CORRETA DO CLUBE (C)
        const ftd = parseFloat(linha[5]) || 0;      // COLUNA F
        const depositos = parseFloat(linha[6]) || 0;// COLUNA G
        const ggr = parseFloat(linha[27]) || 0;     // COLUNA AA (27)

        somaFTD += ftd;
        somaDepositos += depositos;
        somaGGR += ggr;

        ranking.depositos[clube] = (ranking.depositos[clube] || 0) + depositos;
        ranking.ftd[clube] = (ranking.ftd[clube] || 0) + ftd;
        ranking.ggr[clube] = (ranking.ggr[clube] || 0) + ggr;
    });

    return { ftd: somaFTD, depositos: somaDepositos, ggr: somaGGR, ranking };
}

// Atualização geral
function atualizarTudo() {
    try {
        const inicio = performance.now();
        const resultado = consolidar();

        // Atualizar cards
        document.getElementById("ftd-valor").innerText = formatarMoeda(resultado.ftd);
        document.getElementById("depositos-valor").innerText = formatarMoeda(resultado.depositos);
        document.getElementById("ggr-valor").innerText = formatarMoeda(resultado.ggr);

        // Atualizar tabelas
        atualizarTabelas(resultado.ranking);

        // Atualizar gráficos
        atualizarGraficos();

        // Logs
        document.getElementById("ultima-atualizacao").innerText =
            "Última atualização: " + new Date().toLocaleString();
        document.getElementById("tempo-processamento").innerText =
            "Tempo de processamento: " + (performance.now() - inicio).toFixed(2) + " ms";
    } catch (e) {
        console.error("Erro em atualizarTudo:", e);
    }
}

// Preencher tabelas
function atualizarTabelas(ranking) {
    preencherTabela("tabela-depositos", ranking.depositos);
    preencherTabela("tabela-ftd", ranking.ftd);
    preencherTabela("tabela-ggr", ranking.ggr);
}

function preencherTabela(id, objeto) {
    const tbody = document.querySelector(`#${id} tbody`);
    tbody.innerHTML = "";
    Object.entries(objeto)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([clube, valor]) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${clube}</td><td>${formatarMoeda(valor)}</td>`;
            tbody.appendChild(tr);
        });
}

// Atualizar gráficos
function atualizarGraficos() {
    const labels = [...new Set(dados.map(linha => linha[0]))];

    const valoresGGR = labels.map(d =>
        dados.filter(l => l[0] === d).reduce((soma, x) => soma + (parseFloat(x[27]) || 0), 0)
    );
    const valoresFTD = labels.map(d =>
        dados.filter(l => l[0] === d).reduce((soma, x) => soma + (parseFloat(x[5]) || 0), 0)
    );
    const valoresDepositos = labels.map(d =>
        dados.filter(l => l[0] === d).reduce((soma, x) => soma + (parseFloat(x[6]) || 0), 0)
    );

    // Destruir gráficos antigos se existirem
    if (graficoGGR) graficoGGR.destroy();
    if (graficoFTD) graficoFTD.destroy();
    if (graficoDepositos) graficoDepositos.destroy();

    // Criar gráficos novos
    graficoGGR = new Chart(document.getElementById("grafico-ggr"), {
        type: "line",
        data: { labels: labels, datasets: [{ label: "GGR", data: valoresGGR, borderColor: "lime", fill: false }] },
        options: { responsive: true }
    });

    graficoFTD = new Chart(document.getElementById("grafico-ftd"), {
        type: "line",
        data: { labels: labels, datasets: [{ label: "FTD", data: valoresFTD, borderColor: "yellow", fill: false }] },
        options: { responsive: true }
    });

    graficoDepositos = new Chart(document.getElementById("grafico-depositos"), {
        type: "line",
        data: { labels: labels, datasets: [{ label: "Depósitos", data: valoresDepositos, borderColor: "blue", fill: false }] },
        options: { responsive: true }
    });
}

// Filtros (ainda básicos)
function aplicarFiltro() {
    console.log("Aplicar filtro ainda não implementado");
}
