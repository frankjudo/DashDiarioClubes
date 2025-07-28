const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dadosCSV = [];
let chartGGR, chartFTD, chartDepositos;

// ---- Normaliza nomes das colunas ----
function normalizarChave(chave) {
    return chave.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove acentos
        .replace(/[^a-zA-Z0-9]/g, "_")   // troca espaços e símbolos por _
        .toLowerCase();
}

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ---- Carrega dados do CSV ----
function carregarDados() {
    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        complete: function(result) {
            dadosCSV = result.data.map(row => {
                const obj = {};
                Object.keys(row).forEach(k => {
                    obj[normalizarChave(k)] = row[k];
                });
                return obj;
            });
            preencherClubes();
            aplicarFiltros();
        }
    });
}

// ---- Popula dropdown de clubes ----
function preencherClubes() {
    const clubes = [...new Set(dadosCSV.map(r => r["usuario_nome_de_usuario_do_principal"] || "Sem Clube"))];
    const select = document.getElementById("clubeSelect");
    select.innerHTML = "<option value='Todos'>Todos</option>";
    clubes.forEach(c => {
        select.innerHTML += `<option value="${c}">${c}</option>`;
    });
}

// ---- Aplica filtros e atualiza tela ----
function aplicarFiltros() {
    const dataIni = document.getElementById("dataInicial").value;
    const dataFim = document.getElementById("dataFinal").value;
    const clube = document.getElementById("clubeSelect").value;

    let filtrados = dadosCSV;

    if (dataIni) filtrados = filtrados.filter(r => r["data"] >= dataIni);
    if (dataFim) filtrados = filtrados.filter(r => r["data"] <= dataFim);
    if (clube !== "Todos") filtrados = filtrados.filter(r => r["usuario_nome_de_usuario_do_principal"] === clube);

    const totalFTD = filtrados.reduce((acc, r) => acc + parseFloat(r["usuario_ftd_montante"] || 0), 0);
    const totalDepositos = filtrados.reduce((acc, r) => acc + parseFloat(r["usuario_depositos"] || 0), 0);
    const totalGGR = filtrados.reduce((acc, r) => acc + parseFloat(r["calculo_ggr"] || 0), 0);

    document.getElementById("ftdTotal").textContent = formatarMoeda(totalFTD);
    document.getElementById("depositosTotal").textContent = formatarMoeda(totalDepositos);
    document.getElementById("ggrTotal").textContent = formatarMoeda(totalGGR);

    const clubesAtivos = new Set(filtrados.filter(r => parseFloat(r["calculo_ggr"] || 0) !== 0)
        .map(r => r["usuario_nome_de_usuario_do_principal"] || "Sem Clube")).size;
    document.getElementById("clubesAtivos").textContent = clubesAtivos;

    atualizarGraficos(filtrados);
    atualizarTop10(filtrados);
}

// ---- Gráficos ----
function atualizarGraficos(dados) {
    const porDia = {};
    dados.forEach(r => {
        const dia = r["data"];
        if (!porDia[dia]) porDia[dia] = { ggr: 0, ftd: 0, depositos: 0 };
        porDia[dia].ggr += parseFloat(r["calculo_ggr"] || 0);
        porDia[dia].ftd += parseFloat(r["usuario_ftd_montante"] || 0);
        porDia[dia].depositos += parseFloat(r["usuario_depositos"] || 0);
    });

    const labels = Object.keys(porDia).sort();
    const ggrData = labels.map(l => porDia[l].ggr);
    const ftdData = labels.map(l => porDia[l].ftd);
    const depData = labels.map(l => porDia[l].depositos);

    if (chartGGR) chartGGR.destroy();
    if (chartFTD) chartFTD.destroy();
    if (chartDepositos) chartDepositos.destroy();

    chartGGR = new Chart(document.getElementById("graficoGGR"), {
        type: "line",
        data: { labels, datasets: [{ label: "GGR por Dia", data: ggrData, borderColor: "green" }] },
        options: { responsive: true }
    });

    chartFTD = new Chart(document.getElementById("graficoFTD"), {
        type: "line",
        data: { labels, datasets: [{ label: "FTD por Dia", data: ftdData, borderColor: "yellow" }] },
        options: { responsive: true }
    });

    chartDepositos = new Chart(document.getElementById("graficoDepositos"), {
        type: "line",
        data: { labels, datasets: [{ label: "Depósitos por Dia", data: depData, borderColor: "blue" }] },
        options: { responsive: true }
    });
}

// ---- Top 10 Clubes Ativos ----
function atualizarTop10(dados) {
    const clubesMap = {};
    dados.forEach(r => {
        const clube = r["usuario_nome_de_usuario_do_principal"] || "Sem Clube";
        if (!clubesMap[clube]) clubesMap[clube] = 0;
        clubesMap[clube] += parseFloat(r["calculo_ggr"] || 0);
    });

    const top10 = Object.entries(clubesMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const tbody = document.querySelector("#tabelaTopClubes tbody");
    tbody.innerHTML = "";
    top10.forEach(([clube, ggr]) => {
        const row = `<tr><td>${clube}</td><td>${formatarMoeda(ggr)}</td></tr>`;
        tbody.innerHTML += row;
    });
}

document.addEventListener("DOMContentLoaded", carregarDados);
