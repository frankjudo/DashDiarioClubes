console.log("Rodando versão DEBUG");

// Variáveis globais
let dados = [];
let chartGGR, chartFTD, chartDepositos;

// Carrega CSV do Google Sheets
function carregarDados() {
    console.log("Iniciando carregamento do CSV...");
    Papa.parse("https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv", {
        download: true,
        header: true,
        complete: function(result) {
            console.log("Linhas recebidas:", result.data.length);
            dados = result.data;
            atualizarDashboard(dados);
        }
    });
}

// Atualiza cards e gráficos
function atualizarDashboard(dados) {
    console.log("Atualizando dashboard...");
    const ftdTotal = somaColuna(dados, "Usuário - FTD-Montante");
    const depositosTotal = somaColuna(dados, "Usuário - Depósitos");
    const ggrTotal = somaColuna(dados, "Cálculo - GGR");

    document.getElementById("valorFTD").textContent = formatarMoeda(ftdTotal);
    document.getElementById("valorDepositos").textContent = formatarMoeda(depositosTotal);
    document.getElementById("valorGGR").textContent = formatar
