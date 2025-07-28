// =================== MOCKS =====================
const dadosMockDefault = {
    totais: { ftd: 68132.67, depositos: 1503306.21, ggr: 307609.7 },
    graficoGGR: [65000, 70000, 85000, 100000, 130000, 150000],
    graficoFTD: [4000, 8000, 9000, 11000, 13000],
    graficoDepositos: [35000, 50000, 70000, 90000, 120000],
    topGGR: [
        ["usuario1@email.com", 35000],
        ["usuario2@email.com", 28000],
        ["usuario3@email.com", 15000]
    ],
    topFTD: [
        ["usuario5@email.com", 25000],
        ["usuario2@email.com", 12000],
        ["usuario1@email.com", 6000]
    ],
    topDepositos: [
        ["usuario7@email.com", 50000],
        ["usuario8@email.com", 35000],
        ["usuario9@email.com", 22000]
    ]
};

// Dados quando aplicamos filtro (exemplo diferente)
const dadosMockFiltrado = {
    totais: { ftd: 40000.00, depositos: 800000.00, ggr: 150000.00 },
    graficoGGR: [20000, 30000, 50000, 80000, 150000],
    graficoFTD: [2000, 4000, 6000, 10000, 14000],
    graficoDepositos: [10000, 25000, 50000, 70000, 80000],
    topGGR: [
        ["filtro1@email.com", 50000],
        ["filtro2@email.com", 30000],
        ["filtro3@email.com", 25000]
    ],
    topFTD: [
        ["filtro5@email.com", 20000],
        ["filtro2@email.com", 12000],
        ["filtro1@email.com", 8000]
    ],
    topDepositos: [
        ["filtro7@email.com", 45000],
        ["filtro8@email.com", 35000],
        ["filtro9@email.com", 20000]
    ]
};

// =================== ELEMENTOS =====================
const ftdEl = document.getElementById('ftd');
const depositosEl = document.getElementById('depositos');
const ggrEl = document.getElementById('ggr');

// =================== CHARTS =====================
const chartGGR = new Chart(document.getElementById('graficoGGR'), {
    type: 'line',
    data: { labels: ["Dia 1","Dia 2","Dia 3","Dia 4","Dia 5","Dia 6"], datasets: [{label:'GGR', data:[], borderColor:'lime', fill:false}] }
});
const chartFTD = new Chart(document.getElementById('graficoFTD'), {
    type: 'line',
    data: { labels: ["Dia 1","Dia 2","Dia 3","Dia 4","Dia 5"], datasets: [{label:'FTD', data:[], borderColor:'lime', fill:false}] }
});
const chartDepositos = new Chart(document.getElementById('graficoDepositos'), {
    type: 'line',
    data: { labels: ["Dia 1","Dia 2","Dia 3","Dia 4","Dia 5"], datasets: [{label:'Depósitos', data:[], borderColor:'lime', fill:false}] }
});

// =================== FUNÇÕES =====================
function renderTabela(id, dados) {
    let html = "<tr><th>Usuário</th><th>Valor</th></tr>";
    dados.forEach(linha => { html += `<tr><td>${linha[0]}</td><td>R$ ${linha[1].toLocaleString()}</td></tr>`; });
    document.getElementById(id).innerHTML = html;
}

function atualizarDashboard(dados) {
    ftdEl.innerText = `R$ ${dados.totais.ftd.toLocaleString()}`;
    depositosEl.innerText = `R$ ${dados.totais.depositos.toLocaleString()}`;
    ggrEl.innerText = `R$ ${dados.totais.ggr.toLocaleString()}`;

    chartGGR.data.datasets[0].data = dados.graficoGGR;
    chartFTD.data.datasets[0].data = dados.graficoFTD;
    chartDepositos.data.datasets[0].data = dados.graficoDepositos;
    chartGGR.update();
    chartFTD.update();
    chartDepositos.update();

    renderTabela('topGGR', dados.topGGR);
    renderTabela('topFTD', dados.topFTD);
    renderTabela('topDepositos', dados.topDepositos);
}

// Inicializa com mock padrão
atualizarDashboard(dadosMockDefault);

// =================== FILTROS =====================
function aplicarFiltros() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    const email = document.getElementById('emailUsuario').value;

    console.log(`Filtro aplicado: ${dataInicio} até ${dataFim}, usuário: ${email}`);
    atualizarDashboard(dadosMockFiltrado);
}

function limparFiltros() {
    document.getElementById('dataInicio').value = "";
    document.getElementById('dataFim').value = "";
    document.getElementById('emailUsuario').value = "";
    atualizarDashboard(dadosMockDefault);
}
