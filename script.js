const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dadosBrutos = [];
let dadosNormalizados = [];

function parseMoney(value) {
    if (!value) return 0;
    return parseFloat(value.toString()
        .replace(/R\$/g, "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim()
    ) || 0;
}

function carregarDados() {
    Papa.parse(CSV_URL, {
        download: true,
        complete: (results) => {
            dadosBrutos = results.data;
            normalizarDados();
            preencherFiltros();
            atualizarDashboard();
        }
    });
}

function normalizarDados() {
    dadosNormalizados = dadosBrutos.slice(1).map(linha => ({
        data: linha[0],
        clube: linha[2],
        ftd: parseMoney(linha[5]),
        depositos: parseMoney(linha[6]),
        ggr: parseMoney(linha[26])
    })).filter(l => l.data && l.clube);
}

function preencherFiltros() {
    const clubes = [...new Set(dadosNormalizados.map(l => l.clube))];
    const select = document.getElementById('clubeSelect');
    select.innerHTML = "<option value='Todos'>Todos</option>";
    clubes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
    });
}

function aplicarFiltros() {
    atualizarDashboard();
}

function atualizarDashboard() {
    const dataFiltro = document.getElementById('dataFiltro').value;
    const clubeFiltro = document.getElementById('clubeSelect').value;

    let filtrados = dadosNormalizados.filter(l => {
        let ok = true;
        if (dataFiltro) ok = ok && (l.data === dataFiltro);
        if (clubeFiltro !== "Todos") ok = ok && (l.clube === clubeFiltro);
        return ok;
    });

    const totalFTD = filtrados.reduce((acc, l) => acc + l.ftd, 0);
    const totalDepositos = filtrados.reduce((acc, l) => acc + l.depositos, 0);
    const totalGGR = filtrados.reduce((acc, l) => acc + l.ggr, 0);

    document.getElementById('totalFTD').textContent = formatarMoeda(totalFTD);
    document.getElementById('totalDepositos').textContent = formatarMoeda(totalDepositos);
    document.getElementById('totalGGR').textContent = formatarMoeda(totalGGR);

    atualizarGraficos(filtrados);
    atualizarTabelas(filtrados);
}

function atualizarGraficos(dados) {
    const porDia = agruparPorData(dados);
    criarGrafico('graficoFTD', porDia.map(d => d.data), porDia.map(d => d.ftd), 'FTD Diário', 'yellow');
    criarGrafico('graficoDepositos', porDia.map(d => d.data), porDia.map(d => d.depositos), 'Depósitos Diários', 'blue');
    criarGrafico('graficoGGR', porDia.map(d => d.data), porDia.map(d => d.ggr), 'GGR Diário', 'green');
}

function criarGrafico(id, labels, valores, label, color) {
    new Chart(document.getElementById(id), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: valores,
                borderColor: color,
                fill: false
            }]
        }
    });
}

function atualizarTabelas(dados) {
    const porClube = agruparPorClube(dados);

    preencherTabela('rankingDepositos', porClube.sort((a, b) => b.depositos - a.depositos).slice(0, 10), ['clube', 'depositos']);
    preencherTabela('rankingFTD', porClube.sort((a, b) => b.ftd - a.ftd).slice(0, 10), ['clube', 'ftd']);
    preencherTabela('rankingGGR', porClube.sort((a, b) => b.ggr - a.ggr).slice(0, 10), ['clube', 'ggr']);
}

function preencherTabela(id, dados, colunas) {
    const tabela = document.getElementById(id);
    tabela.innerHTML = `
        <tr>${colunas.map(c => `<th>${c.toUpperCase()}</th>`).join('')}</tr>
        ${dados.map(l => `<tr>${colunas.map(c => `<td>${c === 'clube' ? l[c] : formatarMoeda(l[c])}</td>`).join('')}</tr>`).join('')}
    `;
}

function agruparPorData(dados) {
    const mapa = {};
    dados.forEach(l => {
        if (!mapa[l.data]) mapa[l.data] = { ftd: 0, depositos: 0, ggr: 0 };
        mapa[l.data].ftd += l.ftd;
        mapa[l.data].depositos += l.depositos;
        mapa[l.data].ggr += l.ggr;
    });
    return Object.keys(mapa).map(d => ({ data: d, ...mapa[d] }));
}

function agruparPorClube(dados) {
    const mapa = {};
    dados.forEach(l => {
        if (!mapa[l.clube]) mapa[l.clube] = { clube: l.clube, ftd: 0, depositos: 0, ggr: 0 };
        mapa[l.clube].ftd += l.ftd;
        mapa[l.clube].depositos += l.depositos;
        mapa[l.clube].ggr += l.ggr;
    });
    return Object.values(mapa);
}

function formatarMoeda(valor) {
    return valor < 0
        ? `-R$ ${Math.abs(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

window.onload = carregarDados;
