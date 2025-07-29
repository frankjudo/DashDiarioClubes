let chartGGR, chartFTD, chartDepositos;
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

document.addEventListener("DOMContentLoaded", carregarCSV);

function carregarCSV() {
    const start = performance.now();
    document.getElementById("statusCarregamento").innerText = "Carregando dados...";

    Papa.parse(CSV_URL, {
        download: true,
        header: false,
        complete: function (results) {
            const data = normalizarDados(results.data);
            preencherFiltros(data);
            atualizarDashboard(data);
            const end = performance.now();
            const tempo = (end - start).toFixed(2);
            document.getElementById("ultimaAtualizacao").innerText = 
                `Última atualização: ${new Date().toLocaleString()} | Tempo de processamento: ${tempo} ms`;
            document.getElementById("statusCarregamento").innerText = "";
        }
    });
}

function normalizarDados(rows) {
    return rows.slice(1).map(row => ({
        data: row[0],
        clube: row[2],
        ftd: parseFloat(row[5]) || 0,
        depositos: parseFloat(row[6]) || 0,
        ggr: parseFloat(row[26]) || 0
    }));
}

function preencherFiltros(dados) {
    const clubes = [...new Set(dados.map(d => d.clube))];
    const select = document.getElementById("clubeSelect");
    select.innerHTML = `<option value="Todos">Todos</option>` + clubes.map(c => `<option value="${c}">${c}</option>`).join('');
}

function aplicarFiltros() { carregarCSV(); }

function atualizarDashboard(dados) {
    const totalFTD = dados.reduce((s, d) => s + d.ftd, 0);
    const totalDep = dados.reduce((s, d) => s + d.depositos, 0);
    const totalGGR = dados.reduce((s, d) => s + d.ggr, 0);

    document.getElementById("totalFTD").innerText = formatarMoeda(totalFTD);
    document.getElementById("totalDepositos").innerText = formatarMoeda(totalDep);
    document.getElementById("totalGGR").innerText = formatarMoeda(totalGGR);

    atualizarGraficos(dados);
    atualizarRankings(dados);
}

function atualizarGraficos(dados) {
    const dias = [...new Set(dados.map(d => d.data))];
    const ggrPorDia = dias.map(d => soma(dados.filter(x => x.data === d), 'ggr'));
    const ftdPorDia = dias.map(d => soma(dados.filter(x => x.data === d), 'ftd'));
    const depPorDia = dias.map(d => soma(dados.filter(x => x.data === d), 'depositos'));

    chartGGR = criarGrafico("graficoGGR", "GGR Diário", dias, ggrPorDia, "green", chartGGR);
    chartFTD = criarGrafico("graficoFTD", "FTD Diário", dias, ftdPorDia, "yellow", chartFTD);
    chartDepositos = criarGrafico("graficoDepositos", "Depósitos Diários", dias, depPorDia, "blue", chartDepositos);
}

function criarGrafico(id, label, labels, data, color, chartRef) {
    if (chartRef) chartRef.destroy();
    const ctx = document.getElementById(id).getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: [{ label: label, data: data, borderColor: color, fill: false, tension: 0.2 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function atualizarRankings(dados) {
    preencherTabela("rankingDepositos", ordenar(dados, 'depositos').slice(0, 10), ['clube', 'depositos']);
    preencherTabela("rankingFTD", ordenar(dados, 'ftd').slice(0, 10), ['clube', 'ftd']);
    preencherTabela("rankingGGR", ordenar(dados, 'ggr').slice(0, 10), ['clube', 'ggr']);
}

function preencherTabela(id, dados, campos) {
    const tabela = document.getElementById(id);
    tabela.innerHTML = `
        <tr>${campos.map(c => `<th>${c.toUpperCase()}</th>`).join('')}</tr>
        ${dados.map(d => `<tr>${campos.map(c => `<td>${c === 'clube' ? d[c] : formatarMoeda(d[c])}</td>`).join('')}</tr>`).join('')}
    `;
}

function ordenar(dados, campo) {
    return [...dados.reduce((map, d) => {
        if (!map.has(d.clube)) map.set(d.clube, { clube: d.clube, ftd: 0, depositos: 0, ggr: 0 });
        map.get(d.clube)[campo] += d[campo];
        return map;
    }, new Map()).values()].sort((a, b) => b[campo] - a[campo]);
}

function soma(arr, campo) { return arr.reduce((s, d) => s + d[campo], 0); }
function formatarMoeda(valor) { return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
