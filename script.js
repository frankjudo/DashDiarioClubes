const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";
let dados = [];

console.log("Iniciando carregamento do CSV...");
const startTime = performance.now();

Papa.parse(CSV_URL, {
    download: true,
    header: false,
    complete: function(results) {
        console.log("Linhas recebidas:", results.data.length);
        if (results.data.length > 0) {
            console.log("Primeira linha recebida (estrutura CSV):", results.data[0]);
            if (results.data[0].length !== 27) {
                console.warn(`⚠ Estrutura CSV alterada: ${results.data[0].length} colunas (esperado 27)`);
            }
        }
        processarDados(results.data);
    }
});

function processarDados(data) {
    dados = data.slice(1).map(row => ({
        data: row[0],
        clube: row[2],
        ftd: parseFloat(row[5] || 0),
        depositos: parseFloat(row[6] || 0),
        ggr: parseFloat(row[26] || 0)
    }));
    console.log("Dados normalizados:", dados.length);
    console.log("Primeiras 5 linhas normalizadas:", dados.slice(0, 5));
    atualizarDashboard(dados);
}

function atualizarDashboard(data) {
    const ftdTotal = data.reduce((sum, row) => sum + row.ftd, 0);
    const depositosTotal = data.reduce((sum, row) => sum + row.depositos, 0);
    const ggrTotal = data.reduce((sum, row) => sum + row.ggr, 0);

    console.log(`Totais calculados -> FTD: ${ftdTotal}, Depósitos: ${depositosTotal}, GGR: ${ggrTotal}`);

    document.getElementById("totalFTD").textContent = formatarMoeda(ftdTotal);
    document.getElementById("totalDepositos").textContent = formatarMoeda(depositosTotal);
    document.getElementById("totalGGR").textContent = formatarMoeda(ggrTotal);

    const endTime = performance.now();
    document.getElementById("ultimaAtualizacao").textContent = new Date().toLocaleString();
    document.getElementById("tempoProcessamento").textContent = (endTime - startTime).toFixed(2);
    atualizarGraficos(data);
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function atualizarGraficos(data) {
    console.log("Atualizando gráficos...");
    // (Mantém a implementação existente dos gráficos aqui)
}

function aplicarFiltros() {
    console.log("Aplicando filtros...");
    // (Lógica de filtragem aqui)
}
