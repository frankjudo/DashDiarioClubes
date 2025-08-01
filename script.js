console.log("Rodando versão DEBUG");

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dados = [];
let chartGGR, chartFTD, chartDepositos, chartSports, chartCassino;

function formatar(valor) {
    return `R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
}

async function carregarCSV() {
    console.log("Iniciando carregamento do CSV...");
    try {
        const resposta = await fetch(CSV_URL);
        if (!resposta.ok) throw new Error("Falha ao carregar CSV");

        const texto = await resposta.text();
        const linhas = texto.split("\n").map(l => l.split(","));
        const cabecalho = linhas.shift();

        dados = linhas.map(linha => {
            let obj = {};
            cabecalho.forEach((c, i) => obj[c.trim()] = linha[i]?.trim() || "");
            return obj;
        });
        console.log(`Linhas recebidas: ${dados.length}`);
        aplicarFiltros();
    } catch (erro) {
        console.error("Erro ao carregar CSV:", erro);
        alert("Erro ao carregar dados. Verifique a conexão ou se o link está ativo.");
    }
}

function aplicarFiltros() {
    const dataFiltro = document.getElementById("filtroData").value;
    const clubeFiltro = document.getElementById("filtroClube").value;
    console.log(`Filtro aplicado - Data: ${dataFiltro || "todas"} | Clube: ${clubeFiltro || "todos"}`);

    let filtrado = dados;
    if (dataFiltro) filtrado = filtrado.filter(l => l["DATA"] === dataFiltro);
    if (clubeFiltro && clubeFiltro !== "Todos") filtrado = filtrado.filter(l => l["Usuário - Nome de usuário do principal"] === clubeFiltro);

    atualizarDashboard(filtrado);
}

function atualizarDashboard(dadosFiltrados) {
    let ftd = 0, depositos = 0, ggr = 0, sports = 0, cassino = 0;

    dadosFiltrados.forEach(l => {
        ftd += parseFloat(l["Usuário - FTD-Montante"].replace(",", ".") || 0);
        depositos += parseFloat(l["Usuário - Depósitos"].replace(",", ".") || 0);
        ggr += parseFloat(l["Cálculo - GGR"].replace(",", ".") || 0);
        sports += parseFloat(l["Sportsbook - GGR"].replace(",", ".") || 0);
        cassino += parseFloat(l["Cassino - GGR"].replace(",", ".") || 0);
    });

    document.getElementById("ftdTotal").innerText = formatar(ftd);
    document.getElementById("depositosTotal").innerText = formatar(depositos);
    document.getElementById("ggrTotal").innerText = formatar(ggr);
    document.getElementById("sportsGgrTotal").innerText = formatar(sports);
    document.getElementById("cassinoGgrTotal").innerText = formatar(cassino);

    montarGraficos(dadosFiltrados);
    montarTabelas(dadosFiltrados);
}

function montarGraficos(dadosFiltrados) {
    let datas = [...new Set(dadosFiltrados.map(l => l["DATA"]))];
    let valoresGGR = datas.map(d => soma(dadosFiltrados, d, "Cálculo - GGR"));
    let valoresFTD = datas.map(d => soma(dadosFiltrados, d, "Usuário - FTD-Montante"));
    let valoresDepositos = datas.map(d => soma(dadosFiltrados, d, "Usuário - Depósitos"));
    let valoresSports = datas.map(d => soma(dadosFiltrados, d, "Sportsbook - GGR"));
    let valoresCassino = datas.map(d => soma(dadosFiltrados, d, "Cassino - GGR"));

    if (chartGGR) chartGGR.destroy();
    if (chartFTD) chartFTD.destroy();
    if (chartDepositos) chartDepositos.destroy();
    if (chartSports) chartSports.destroy();
    if (chartCassino) chartCassino.destroy();

    chartGGR = novoGrafico("graficoGGR", "GGR por Dia", datas, valoresGGR, "lime");
    chartFTD = novoGrafico("graficoFTD", "FTD por Dia", datas, valoresFTD, "yellow");
    chartDepositos = novoGrafico("graficoDepositos", "Depósitos por Dia", datas, valoresDepositos, "blue");
    chartSports = novoGrafico("graficoSports", "Sportsbook GGR por Dia", datas, valoresSports, "orange");
    chartCassino = novoGrafico("graficoCassino", "Cassino GGR por Dia", datas, valoresCassino, "purple");
}

function montarTabelas(dadosFiltrados) {
    top10(dadosFiltrados, "Usuário - Depósitos", "tabelaDepositos");
    top10(dadosFiltrados, "Usuário - FTD-Montante", "tabelaFTD");
    top10(dadosFiltrados, "Cálculo - GGR", "tabelaGGR");
    top10(dadosFiltrados, "Sportsbook - GGR", "tabelaSports");
    top10(dadosFiltrados, "Cassino - GGR", "tabelaCassino");
}

function top10(dados, campo, tabelaId) {
    const clubes = {};
    dados.forEach(l => {
        const nome = l["Usuário - Nome de usuário do principal"];
        const valor = parseFloat(l[campo].replace(",", ".") || 0);
        clubes[nome] = (clubes[nome] || 0) + valor;
    });

    const top = Object.entries(clubes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const tabela = document.getElementById(tabelaId);
    tabela.innerHTML = "<tr><th>Clube</th><th>Valor</th></tr>" +
        top.map(([nome, valor]) => `<tr><td>${nome}</td><td>${formatar(valor)}</td></tr>`).join("");
}

function soma(dados, data, campo) {
    return dados.filter(l => l["DATA"] === data)
                .reduce((t, l) => t + parseFloat(l[campo].replace(",", ".") || 0), 0);
}

function novoGrafico(id, label, labels, data, cor) {
    return new Chart(document.getElementById(id), {
        type: "line",
        data: { labels, datasets: [{ label, data, borderColor: cor, fill: false }] },
        options: { responsive: true, plugins: { legend: { labels: { color: "lime" } } },
                   scales: { x: { ticks: { color: "lime" } }, y: { ticks: { color: "lime" } } } }
    });
}

carregarCSV();
