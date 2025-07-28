const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dados = [];
let graficoGGR, graficoFTD, graficoDepositos;

function carregarDados() {
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        complete: function(results) {
            dados = results.data;
            preencherFiltros();
            atualizarDashboard();
        }
    });
}

function preencherFiltros() {
    const clubes = [...new Set(dados.map(d => d["Usuário - Nome de usuário do principal"]))].sort();
    const select = document.getElementById('clubeSelect');
    select.innerHTML = "<option>Todos</option>" + clubes.map(c => `<option>${c}</option>`).join('');
}

function aplicarFiltros() {
    atualizarDashboard();
}

function atualizarDashboard() {
    const dataFiltro = document.getElementById('dataFiltro').value;
    const clubeFiltro = document.getElementById('clubeSelect').value;

    const filtrados = dados.filter(d => {
        const dataValida = !dataFiltro || d.DATA === dataFiltro;
        const clubeValido = clubeFiltro === "Todos" || d["Usuário - Nome de usuário do principal"] === clubeFiltro;
        return dataValida && clubeValido;
    });

    const ftdTotal = filtrados.reduce((acc, cur) => acc + (parseFloat(cur["Usuário - FTD-Montante"] || 0)), 0);
    const depTotal = filtrados.reduce((acc, cur) => acc + (parseFloat(cur["Usuário - Depósitos"] || 0)), 0);
    const ggrTotal = filtrados.reduce((acc, cur) => acc + (parseFloat(cur["Cálculo - GGR"] || 0)), 0);

    document.getElementById('totalFTD').innerText = formatarMoeda(ftdTotal);
    document.getElementById('totalDepositos').innerText = formatarMoeda(depTotal);
    document.getElementById('totalGGR').innerText = formatarMoeda(ggrTotal);

    atualizarGraficos(filtrados);
    atualizarTabelas(filtrados);
}

function atualizarGraficos(filtrados) {
    const porData = {};
    filtrados.forEach(d => {
        const data = d.DATA;
        if (!porData[data]) porData[data] = { ftd: 0, deposito: 0, ggr: 0 };
        porData[data].ftd += parseFloat(d["Usuário - FTD-Montante"] || 0);
        porData[data].deposito += parseFloat(d["Usuário - Depósitos"] || 0);
        porData[data].ggr += parseFloat(d["Cálculo - GGR"] || 0);
    });

    const labels = Object.keys(porData).sort();
    const ftdData = labels.map(l => porData[l].ftd);
    const depositoData = labels.map(l => porData[l].deposito);
    const ggrData = labels.map(l => porData[l].ggr);

    if (graficoGGR) graficoGGR.destroy();
    graficoGGR = criarGrafico('graficoGGR', 'GGR Diário', labels, ggrData, '#00cc66');

    if (graficoFTD) graficoFTD.destroy();
    graficoFTD = criarGrafico('graficoFTD', 'FTD Diário', labels, ftdData, '#ffff00');

    if (graficoDepositos) graficoDepositos.destroy();
    graficoDepositos = criarGrafico('graficoDepositos', 'Depósitos Diários', labels, depositoData, '#0099ff');
}

function criarGrafico(id, label, labels, data, cor) {
    return new Chart(document.getElementById(id).getContext('2d'), {
        type: 'line',
        data: { labels: labels, datasets: [{ label: label, data: data, borderColor: cor, fill: false, tension: 0.1, pointBackgroundColor: '#fff' }] },
        options: {
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: {
                x: { ticks: { color: '#fff' } },
                y: { ticks: { color: '#fff' } }
            }
        }
    });
}

function atualizarTabelas(filtrados) {
    atualizarTabelaRanking(filtrados, 'rankingDepositos', 'Usuário - Depósitos', 'DEPOSITOS');
    atualizarTabelaRanking(filtrados, 'rankingFTD', 'Usuário - FTD-Montante', 'FTD');
    atualizarTabelaRanking(filtrados, 'rankingGGR', 'Cálculo - GGR', 'GGR');
}

function atualizarTabelaRanking(filtrados, idTabela, campo, titulo) {
    const ranking = {};
    filtrados.forEach(d => {
        const clube = d["Usuário - Nome de usuário do principal"];
        if (!ranking[clube]) ranking[clube] = 0;
        ranking[clube] += parseFloat(d[campo] || 0);
    });

    const top10 = Object.entries(ranking).sort((a, b) => b[1] - a[1]).slice(0, 10);
    document.getElementById(idTabela).innerHTML = `
        <tr><th>Clube</th><th>${titulo}</th></tr>
        ${top10.map(c => `<tr><td>${c[0]}</td><td>${formatarMoeda(c[1])}</td></tr>`).join('')}
    `;
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

carregarDados();
