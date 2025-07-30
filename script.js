console.log("Rodando versão DEBUG");

const urlCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

document.getElementById("aplicarFiltro").addEventListener("click", carregarDados);

function carregarDados() {
    console.log("Iniciando carregamento do CSV...");
    Papa.parse(urlCSV, {
        download: true,
        header: true,
        complete: function (results) {
            console.log("Linhas recebidas:", results.data.length);
            console.log("Primeira linha recebida:", results.data[0]);

            const dados = normalizarDados(results.data);
            atualizarDashboard(dados);
        }
    });
}

function normalizarDados(data) {
    console.log("Normalizando dados...");
    return data.map(linha => ({
        data: linha["DATA"] || "",
        clube: linha["Usuário - Nome de usuário"] || "",
        ftd: parseFloat(linha["Usuário - FTD-Montante"] || 0),
        depositos: parseFloat(linha["Usuário - Depósitos"] || 0),
        ggr: parseFloat(linha["GGR"] || 0)
    }));
}

function atualizarDashboard(dados) {
    console.log("Atualizando dashboard...");
    const totalFTD = dados.reduce((acc, l) => acc + l.ftd, 0);
    const totalDepositos = dados.reduce((acc, l) => acc + l.depositos, 0);
    const totalGGR = dados.reduce((acc, l) => acc + l.ggr, 0);

    document.getElementById("valor-ftd").textContent = formatarMoeda(totalFTD);
    document.getElementById("valor-depositos").textContent = formatarMoeda(totalDepositos);
    document.getElementById("valor-ggr").textContent = formatarMoeda(totalGGR);

    montarGraficos(dados);
    montarTabelas(dados);
}

function montarGraficos(dados) {
    console.log("Montando gráficos...");
    const datas = [...new Set(dados.map(l => l.data))];
    const somaPorData = (campo) =>
        datas.map(d => dados.filter(l => l.data === d)
            .reduce((acc, l) => acc + l[campo], 0));

    criarGrafico("graficoGGR", "GGR", datas, somaPorData("ggr"), "lime");
    criarGrafico("graficoFTD", "FTD", datas, somaPorData("ftd"), "yellow");
    criarGrafico("graficoDepositos", "Depósitos", datas, somaPorData("depositos"), "blue");
}

function criarGrafico(id, label, labels, data, color) {
    new Chart(document.getElementById(id).getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label,
                data,
                borderColor: color,
                backgroundColor: "transparent",
                borderWidth: 2,
                tension: 0.2
            }]
        },
        options: { responsive: true, plugins: { legend: { labels: { color: "#fff" } } }, scales: { x: { ticks: { color: "#fff" } }, y: { ticks: { color: "#fff" } } } }
    });
}

function montarTabelas(dados) {
    console.log("Montando tabelas...");
    preencherTabela("tabelaDepositos", top10(dados, "depositos"));
    preencherTabela("tabelaFTD", top10(dados, "ftd"));
    preencherTabela("tabelaGGR", top10(dados, "ggr"));
}

function top10(dados, campo) {
    const map = {};
    dados.forEach(l => { map[l.clube] = (map[l.clube] || 0) + l[campo]; });
    return Object.entries(map).map(([clube, valor]) => ({ clube, valor }))
        .sort((a, b) => b.valor - a.valor).slice(0, 10);
}

function preencherTabela(id, lista) {
    const tbody = document.querySelector(`#${id} tbody`);
    tbody.innerHTML = "";
    lista.forEach(l => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${l.clube}</td><td>${formatarMoeda(l.valor)}</td>`;
        tbody.appendChild(tr);
    });
}

function formatarMoeda(v) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Carrega ao iniciar
carregarDados();
