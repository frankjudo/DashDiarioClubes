console.log("Rodando versão DEBUG");

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dados = [];

document.addEventListener("DOMContentLoaded", carregarDados);

function carregarDados() {
    console.log("Iniciando carregamento do CSV...");
    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(result) {
            console.log(`Linhas recebidas: ${result.data.length}`);
            dados = normalizarDados(result.data);
            console.log("Processando dados...");
            atualizarDashboard();
            montarGraficos();
            montarTabelas();
        },
        error: function(error) {
            console.error("Erro ao carregar CSV: ", error);
            alert("Erro ao carregar os dados. Verifique sua conexão ou se o link está ativo.");
        }
    });
}

function normalizarDados(linhas) {
    return linhas.map(linha => {
        return {
            data: linha["DATA"] || "",
            clube: linha["Usuário - Nome de usuário do principal"] || "",
            ftd: parseFloat((linha["Usuário - FTD-Montante"] || "0").replace(/\./g, "").replace(",", ".")),
            depositos: parseFloat((linha["Usuário - Depósitos"] || "0").replace(/\./g, "").replace(",", ".")),
            ggr: parseFloat((linha["GGR"] || linha["Cálculo - GGR"] || "0").replace(/\./g, "").replace(",", ".")),
            sportsGgr: parseFloat((linha["Sportsbook - GGR"] || "0").replace(/\./g, "").replace(",", ".")),
            cassinoGgr: parseFloat((linha["Cassino - GGR"] || "0").replace(/\./g, "").replace(",", "."))
        };
    });
}

function atualizarDashboard() {
    console.log("Atualizando dashboard...");
    const totalFTD = soma(dados.map(d => d.ftd));
    const totalDepositos = soma(dados.map(d => d.depositos));
    const totalGGR = soma(dados.map(d => d.ggr));
    const totalSports = soma(dados.map(d => d.sportsGgr));
    const totalCassino = soma(dados.map(d => d.cassinoGgr));

    document.getElementById("ftdValor").innerText = formatarMoeda(totalFTD);
    document.getElementById("depositosValor").innerText = formatarMoeda(totalDepositos);
    document.getElementById("ggrValor").innerText = formatarMoeda(totalGGR);
    document.getElementById("sportsGgrValor").innerText = formatarMoeda(totalSports);
    document.getElementById("cassinoGgrValor").innerText = formatarMoeda(totalCassino);
}

function montarGraficos() {
    console.log("Montando gráficos...");
    // Implementação básica de gráfico usando Chart.js
    // Você pode adicionar as configurações de datasets aqui conforme necessário
}

function montarTabelas() {
    console.log("Montando tabelas...");
    // Lógica para montar as tabelas Top 10
}

function soma(array) {
    return array.reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0);
}

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
