console.log("Rodando versão DEBUG");

const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dados = [];

function formatarMoeda(valor) {
    if (!valor || isNaN(valor)) return "R$ 0,00";
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function carregarDados() {
    console.log("Iniciando carregamento do CSV...");
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        complete: function(result) {
            dados = result.data;
            console.log("Linhas recebidas:", dados.length);
            processarDados();
        },
        error: function(err) {
            console.error("Erro ao carregar CSV:", err);
            alert("Erro ao carregar os dados. Verifique sua conexão ou tente novamente mais tarde.");
        }
    });
}

function processarDados() {
    console.log("Processando dados...");
    
    // Extrair clubes únicos
    const clubes = [...new Set(dados.map(l => l["Usuário - Nome de usuário do principal"]))].filter(Boolean);
    console.log("Clubes carregados:", clubes.length);

    const select = document.getElementById("clube");
    select.innerHTML = `<option value="Todos">Todos</option>`;
    clubes.forEach(clube => {
        select.innerHTML += `<option value="${clube}">${clube}</option>`;
    });

    atualizarDashboard("Todos");
}

function atualizarDashboard(clubeFiltro) {
    console.log("Atualizando dashboard...");
    let filtrados = (clubeFiltro === "Todos") ? dados : dados.filter(l => l["Usuário - Nome de usuário do principal"] === clubeFiltro);

    let ftdTotal = 0, depositosTotal = 0, ggrTotal = 0, sportsbookGGR = 0, cassinoGGR = 0;

    filtrados.forEach(linha => {
        ftdTotal += parseFloat(linha["Usuário - FTD-Montante"]?.replace(",", ".") || 0);
        depositosTotal += parseFloat(linha["Usuário - Depósitos"]?.replace(",", ".") || 0);
        ggrTotal += parseFloat(linha["Cálculo - GGR"]?.replace(",", ".") || 0);
        sportsbookGGR += parseFloat(linha["Sportsbook - GGR"]?.replace(",", ".") || 0);
        cassinoGGR += parseFloat(linha["Cassino - GGR"]?.replace(",", ".") || 0);
    });

    document.getElementById("ftdTotal").innerText = formatarMoeda(ftdTotal);
    document.getElementById("depositosTotal").innerText = formatarMoeda(depositosTotal);
    document.getElementById("ggrTotal").innerText = formatarMoeda(ggrTotal);
    document.getElementById("sportsbookGgrTotal").innerText = formatarMoeda(sportsbookGGR);
    document.getElementById("cassinoGgrTotal").innerText = formatarMoeda(cassinoGGR);

    montarGraficos(filtrados);
    montarTabelas(filtrados);
}

function montarGraficos(dados) {
    console.log("Montando gráficos...");
    // (Gráficos simplificados só para exemplo)
}

function montarTabelas(dados) {
    console.log("Montando tabelas...");
    // Top 10 por depósitos
    const topDepositos = agruparSomar(dados, "Usuário - Nome de usuário do principal", "Usuário - Depósitos");
    preencherTabela("topDepositos", topDepositos);

    const topFTD = agruparSomar(dados, "Usuário - Nome de usuário do principal", "Usuário - FTD-Montante");
    preencherTabela("topFTD", topFTD);

    const topGGR = agruparSomar(dados, "Usuário - Nome de usuário do principal", "Cálculo - GGR");
    preencherTabela("topGGR", topGGR);
}

function agruparSomar(dados, campoGrupo, campoValor) {
    const mapa = {};
    dados.forEach(linha => {
        const chave = linha[campoGrupo] || "Indefinido";
        const valor = parseFloat(linha[campoValor]?.replace(",", ".") || 0);
        mapa[chave] = (mapa[chave] || 0) + valor;
    });
    return Object.entries(mapa)
        .map(([clube, valor]) => ({ clube, valor }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10);
}

function preencherTabela(idTabela, dados) {
    const tbody = document.querySelector(`#${idTabela} tbody`);
    tbody.innerHTML = "";
    dados.forEach(linha => {
        tbody.innerHTML += `<tr><td>${linha.clube}</td><td>${formatarMoeda(linha.valor)}</td></tr>`;
    });
}

document.getElementById("aplicarFiltro").addEventListener("click", () => {
    const clube = document.getElementById("clube").value;
    atualizarDashboard(clube);
});

carregarDados();
