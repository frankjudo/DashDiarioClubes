const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dadosCSV = [];

document.addEventListener("DOMContentLoaded", () => {
    console.log("Iniciando carregamento do CSV...");
    carregarCSV();
});

function carregarCSV() {
    fetch(CSV_URL)
        .then(response => response.text())
        .then(csv => {
            console.log("CSV recebido com sucesso");
            Papa.parse(csv, {
                complete: function(result) {
                    console.log("PapaParse finalizado", result.data.length, "linhas");
                    dadosCSV = normalizarDados(result.data);
                    console.log("Dados normalizados:", dadosCSV);
                    preencherFiltros(dadosCSV);
                    atualizarDashboard(dadosCSV);
                    document.getElementById("ultimaAtualizacao").innerText = 
                        "Última atualização: " + new Date().toLocaleString();
                }
            });
        })
        .catch(error => console.error("Erro ao carregar CSV:", error));
}

function normalizarDados(data) {
    let normalizados = [];
    for (let i = 1; i < data.length; i++) {
        let linha = data[i];
        if (linha.length < 27) continue;

        let registro = {
            data: linha[0],
            clube: linha[2],
            ftd: parseFloat(linha[5].replace(/[^\d,-]/g, '').replace(',', '.')) || 0,
            depositos: parseFloat(linha[6].replace(/[^\d,-]/g, '').replace(',', '.')) || 0,
            ggr: parseFloat(linha[26].replace(/[^\d,-]/g, '').replace(',', '.')) || 0
        };
        normalizados.push(registro);
    }
    return normalizados;
}

function preencherFiltros(dados) {
    console.log("Preenchendo filtros de clubes...");
    let clubes = [...new Set(dados.map(x => x.clube))].sort();
    let select = document.getElementById("clubeSelect");
    select.innerHTML = "<option>Todos</option>";
    clubes.forEach(clube => {
        select.innerHTML += `<option value="${clube}">${clube}</option>`;
    });
}

function aplicarFiltros() {
    let dataFiltro = document.getElementById("dataFiltro").value;
    let clubeFiltro = document.getElementById("clubeSelect").value;
    console.log(`Aplicando filtros: Data=${dataFiltro}, Clube=${clubeFiltro}`);
    let filtrados = dadosCSV.filter(x => {
        let dataOk = !dataFiltro || x.data === dataFiltro;
        let clubeOk = clubeFiltro === "Todos" || x.clube === clubeFiltro;
        return dataOk && clubeOk;
    });
    console.log("Dados filtrados:", filtrados);
    atualizarDashboard(filtrados);
}

function atualizarDashboard(dados) {
    console.log("Atualizando dashboard com", dados.length, "linhas");
    let totalFTD = dados.reduce((sum, x) => sum + x.ftd, 0);
    let totalDepositos = dados.reduce((sum, x) => sum + x.depositos, 0);
    let totalGGR = dados.reduce((sum, x) => sum + x.ggr, 0);

    document.getElementById("totalFTD").innerText = formatarMoeda(totalFTD);
    document.getElementById("totalDepositos").innerText = formatarMoeda(totalDepositos);
    document.getElementById("totalGGR").innerText = formatarMoeda(totalGGR);

    atualizarGraficos(dados);
    atualizarRankings(dados);
}

function atualizarGraficos(dados) {
    console.log("Atualizando gráficos...");
    // Implementar gráficos Chart.js (mantidos iguais aos anteriores)
}

function atualizarRankings(dados) {
    console.log("Atualizando rankings...");
    // Implementar ranking (mantidos iguais aos anteriores)
}

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
