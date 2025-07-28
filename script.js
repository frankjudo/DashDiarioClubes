const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

async function carregarDados() {
    Papa.parse(SHEET_CSV_URL, {
        download: true,
        header: true,
        complete: function(results) {
            const data = results.data;
            processarDados(data);
        },
        error: function(err) {
            alert("Erro ao carregar dados do Google Sheets");
            console.error(err);
        }
    });
}

function processarDados(dados) {
    let totalGGR = 0;
    let totalFTD = 0;
    let totalDepositos = 0;
    let ativosPorMes = {};
    let ggrPorMes = {};
    let ftdPorMes = {};
    let depositosPorMes = {};

    dados.forEach(row => {
        const data = new Date(row["DATA"]);
        if (isNaN(data)) return;

        const mesAno = data.toLocaleString("pt-BR", { month: 'long', year: 'numeric' }).toUpperCase();
        const ggr = parseFloat(row["Cálculo - GGR"]) || 0;
        const ftd = parseFloat(row["Usuário - FTD-Montante"]) || 0;
        const deposito = parseFloat(row["Usuário - Depósitos"]) || 0;

        totalGGR += ggr;
        totalFTD += ftd;
        totalDepositos += deposito;

        ggrPorMes[mesAno] = (ggrPorMes[mesAno] || 0) + ggr;
        ftdPorMes[mesAno] = (ftdPorMes[mesAno] || 0) + ftd;
        depositosPorMes[mesAno] = (depositosPorMes[mesAno] || 0) + deposito;

        if (ggr !== 0) {
            ativosPorMes[mesAno] = (ativosPorMes[mesAno] || 0) + 1;
        }
    });

    document.getElementById("ggr-total").innerText = formatarMoeda(totalGGR);
    document.getElementById("ftd-total").innerText = formatarMoeda(totalFTD);
    document.getElementById("depositos-total").innerText = formatarMoeda(totalDepositos);

    const ultimoMes = Object.keys(ativosPorMes).slice(-1)[0] || 0;
    document.getElementById("clubes-ativos").innerText = ativosPorMes[ultimoMes] || 0;

    criarGraficos(ggrPorMes, ftdPorMes, depositosPorMes, ativosPorMes);
}

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function criarGraficos(ggrPorMes, ftdPorMes, depositosPorMes, ativosPorMes) {
    const labels = Object.keys(ggrPorMes);

    new Chart(document.getElementById("ggrChart"), {
        type: 'line',
        data: { labels, datasets: [{ label: "GGR Total", data: Object.values(ggrPorMes), borderColor: "blue", fill: true }] }
    });

    new Chart(document.getElementById("ftdChart"), {
        type: 'line',
        data: { labels, datasets: [{ label: "FTD Total", data: Object.values(ftdPorMes), borderColor: "green", fill: true }] }
    });

    new Chart(document.getElementById("depositosChart"), {
        type: 'line',
        data: { labels, datasets: [{ label: "Depósitos Totais", data: Object.values(depositosPorMes), borderColor: "orange", fill: true }] }
    });

    new Chart(document.getElementById("ativosChart"), {
        type: 'bar',
        data: { labels, datasets: [{ label: "Clubes Ativos", data: Object.values(ativosPorMes), backgroundColor: "cyan" }] }
    });
}

carregarDados();
