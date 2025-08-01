console.log("Rodando versão DEBUG");

const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

document.addEventListener("DOMContentLoaded", () => {
    carregarDados();

    document.getElementById("aplicarFiltro").addEventListener("click", () => {
        carregarDados();
    });
});

function carregarDados() {
    console.log("Iniciando carregamento do CSV...");

    Papa.parse(DATA_URL, {
        download: true,
        header: true,
        complete: (result) => {
            console.log(`Linhas recebidas: ${result.data.length}`);
            processarDados(result.data);
        },
        error: (err) => {
            console.error("Erro ao carregar os dados CSV: ", err);
            alert("Erro ao carregar dados. Verifique sua conexão ou o link da planilha.");
        }
    });
}

function processarDados(data) {
    console.log("Processando dados...");

    const clubesUnicos = [...new Set(data.map(row => row["Usuário - Nome de usuário do principal"]))];
    const select = document.getElementById("clubeFiltro");
    select.innerHTML = `<option value="Todos">Todos</option>` + clubesUnicos.map(c => `<option value="${c}">${c}</option>`).join("");

    atualizarDashboard(data);
}

function atualizarDashboard(data) {
    console.log("Atualizando dashboard...");

    const ftd = somaColuna(data, "Usuário - FTD-Montante");
    const depositos = somaColuna(data, "Usuário - Depósitos");
    const ggr = somaColuna(data, "Cálculo - GGR");
    const sportsbookGgr = somaColuna(data, "Sportsbook - GGR");
    const cassinoGgr = somaColuna(data, "Cassino - GGR");

    document.getElementById("ftdValor").innerText = formatarMoeda(ftd);
    document.getElementById("depositosValor").innerText = formatarMoeda(depositos);
    document.getElementById("ggrValor").innerText = formatarMoeda(ggr);
    document.getElementById("sportsGgrValor").innerText = formatarMoeda(sportsbookGgr);
    document.getElementById("cassinoGgrValor").innerText = formatarMoeda(cassinoGgr);

    montarGraficos(data);
    montarTabelas(data);
}

function somaColuna(data, coluna) {
    return data.reduce((acc, row) => acc + parseFloat((row[coluna] || "0").replace(",", ".")), 0);
}

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function montarGraficos(data) {
    console.log("Montando gráficos...");
    // Exemplo de gráfico simples
    new Chart(document.getElementById("ggrChart"), {
        type: 'line',
        data: {
            labels: [...new Set(data.map(r => r["DATA"]))],
            datasets: [{ label: 'GGR por Dia', data: data.map(r => parseFloat((r["Cálculo - GGR"] || "0").replace(",", "."))), borderColor: "#0f0" }]
        }
    });
    // Os outros gráficos seguem o mesmo padrão...
}

function montarTabelas(data) {
    console.log("Montando tabelas...");
    preencherTabela("tabelaDepositos", ordenarPorColuna(data, "Usuário - Depósitos"), "Usuário - Nome de usuário do principal", "Usuário - Depósitos");
    preencherTabela("tabelaFtd", ordenarPorColuna(data, "Usuário - FTD-Montante"), "Usuário - Nome de usuário do principal", "Usuário - FTD-Montante");
    preencherTabela("tabelaGgr", ordenarPorColuna(data, "Cálculo - GGR"), "Usuário - Nome de usuário do principal", "Cálculo - GGR");
}

function ordenarPorColuna(data, coluna) {
    return [...data].sort((a, b) => parseFloat((b[coluna] || "0").replace(",", ".")) - parseFloat((a[coluna] || "0").replace(",", "."));
}

function preencherTabela(idTabela, dados, colunaNome, colunaValor) {
    const tbody = document.querySelector(`#${idTabela} tbody`);
    tbody.innerHTML = "";
    dados.slice(0, 10).forEach(row => {
        tbody.innerHTML += `<tr><td>${row[colunaNome]}</td><td>${formatarMoeda(parseFloat((row[colunaValor] || "0").replace(",", ".")))}</td></tr>`;
    });
}
