const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";
let dadosCompletos = [];
let chartGGR, chartFTD, chartDepositos;
const startTime = performance.now();

document.addEventListener("DOMContentLoaded", () => {
    carregarDados();
    document.getElementById("btnAplicar").addEventListener("click", aplicarFiltros);
});

function carregarDados() {
    console.log("Iniciando carregamento do CSV...");
    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        complete: function(results) {
            if (results.data.length === 0) {
                mostrarErro("Nenhum dado encontrado no CSV. Verifique a fonte de dados.");
                return;
            }
            
            console.log("Linhas recebidas:", results.data.length);
            dadosCompletos = results.data.filter(row => row.DATA);
            
            if (dadosCompletos.length === 0) {
                mostrarErro("Dados não puderam ser processados. Verifique a estrutura do CSV.");
                return;
            }
            
            console.log("Primeira linha:", dadosCompletos[0]);
            
            // Preencher dropdown de clubes
            preencherFiltroClubes(dadosCompletos);
            
            // Atualizar dashboard com todos os dados
            atualizarDashboard(dadosCompletos);
        },
        error: function(error) {
            console.error("Erro ao carregar CSV:", error);
            mostrarErro("Falha ao carregar dados. Verifique sua conexão ou a URL do CSV.");
        }
    });
}

function preencherFiltroClubes(dados) {
    const clubes = [...new Set(dados.map(e => e.CLUBE))].filter(clube => clube);
    const select = document.getElementById("clubeFiltro");
    
    // Limpar opções, mantendo a primeira "Todos"
    select.innerHTML = '<option value="Todos">Todos</option>';
    
    clubes.forEach(clube => {
        const option = document.createElement("option");
        option.value = clube;
        option.textContent = clube;
        select.appendChild(option);
    });
}

function aplicarFiltros() {
    const dataFiltro = document.getElementById("dataFiltro").value;
    const clubeFiltro = document.getElementById("clubeFiltro").value;
    
    let dadosFiltrados = dadosCompletos;
    
    if (dataFiltro) {
        dadosFiltrados = dadosFiltrados.filter(e => e.DATA === dataFiltro);
    }
    
    if (clubeFiltro !== "Todos") {
        dadosFiltrados = dadosFiltrados.filter(e => e.CLUBE === clubeFiltro);
    }
    
    if (dadosFiltrados.length === 0) {
        mostrarErro("Nenhum dado encontrado com os filtros selecionados.");
        return;
    }
    
    atualizarDashboard(dadosFiltrados);
}

function atualizarDashboard(dados) {
    const ftdTotal = dados.reduce((s, e) => s + (parseFloat(e["Usuário - FTD-Montante"]) || 0), 0);
    const depTotal = dados.reduce((s, e) => s + (parseFloat(e["Usuário - Depósitos"]) || 0), 0);
    const ggrTotal = dados.reduce((s, e) => s + (parseFloat(e["GGR"]) || 0), 0);
    
    // Atualizar UI
    document.getElementById("dashboardContent").innerHTML = `
        <div class="cards">
            <div class="card" id="card-ftd">
                <h2>FTD</h2>
                <p id="totalFTD">${formatarMoeda(ftdTotal)}</p>
            </div>
            <div class="card" id="card-depositos">
                <h2>Depósitos</h2>
                <p id="totalDepositos">${formatarMoeda(depTotal)}</p>
            </div>
            <div class="card" id="card-ggr">
                <h2>GGR</h2>
                <p id="totalGGR">${formatarMoeda(ggrTotal)}</p>
            </div>
        </div>
        
        <div class="graficos">
            <div class="chart-container">
                <h3>GGR Diário</h3>
                <canvas id="graficoGGR"></canvas>
            </div>
            <div class="chart-container">
                <h3>FTD Diário</h3>
                <canvas id="graficoFTD"></canvas>
            </div>
            <div class="chart-container">
                <h3>Depósitos Diários</h3>
                <canvas id="graficoDepositos"></canvas>
            </div>
        </div>
        
        <div class="rankings">
            <div class="ranking">
                <h3>Top 10 Clubes - Depósitos</h3>
                <table id="topDepositos"></table>
            </div>
            <div class="ranking">
                <h3>Top 10 Clubes - FTD</h3>
                <table id="topFTD"></table>
            </div>
            <div class="ranking">
                <h3>Top 10 Clubes - GGR</h3>
                <table id="topGGR"></table>
            </div>
        </div>
    `;
    
    // Atualizar gráficos e rankings
    atualizarGraficos(dados);
    atualizarRankings(dados);
    
    // Atualizar informações de performance
    const endTime = performance.now();
    document.getElementById("ultimaAtualizacao").textContent = `Última atualização: ${new Date().toLocaleString()}`;
    document.getElementById("tempoProcessamento").textContent = `Tempo de processamento: ${(endTime - startTime).toFixed(2)}ms`;
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function atualizarGraficos(dados) {
    // Agrupar por data
    const datas = [...new Set(dados.map(e => e.DATA))].sort();
    
    const somaPorData = (campo) => datas.map(d => 
        dados.filter(x => x.DATA === d)
            .reduce((s, v) => s + (parseFloat(v[campo]) || 0), 0)
    );
    
    const ggr = somaPorData("GGR");
    const ftd = somaPorData("Usuário - FTD-Montante");
    const dep = somaPorData("Usuário - Depósitos");
    
    // Calcular o valor máximo para a escala dos gráficos
    const maxVal = Math.max(...ggr, ...ftd, ...dep);
    const maxY = maxVal > 0 ? maxVal * 1.2 : 100;
    
    // Configuração comum
    const config = (ctx, label, data, color) => new Chart(ctx, {
        type: "line",
        data: {
            labels: datas,
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: color + '40',
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: color,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatarMoeda(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: maxY,
                    ticks: {
                        callback: function(value) {
                            return formatarMoeda(value).replace('R$', '').trim();
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Criar os gráficos
    chartGGR = config(document.getElementById("graficoGGR"), "GGR Diário", ggr, "#3498db");
    chartFTD = config(document.getElementById("graficoFTD"), "FTD Diário", ftd, "#f39c12");
    chartDepositos = config(document.getElementById("graficoDepositos"), "Depósitos Diários", dep, "#2ecc71");
}

function atualizarRankings(dados) {
    // Agrupar por clube
    const clubes = [...new Set(dados.map(e => e.CLUBE))].filter(clube => clube);
    
    const dadosPorClube = clubes.map(clube => {
        const dadosClube = dados.filter(e => e.CLUBE === clube);
        return {
            clube: clube,
            ftd: dadosClube.reduce((s, e) => s + (parseFloat(e["Usuário - FTD-Montante"]) || 0), 0),
            depositos: dadosClube.reduce((s, e) => s + (parseFloat(e["Usuário - Depósitos"]) || 0), 0),
            ggr: dadosClube.reduce((s, e) => s + (parseFloat(e["GGR"]) || 0), 0)
        };
    });
    
    // Ordenar e pegar top 10
    const topDepositos = [...dadosPorClube].sort((a, b) => b.depositos - a.depositos).slice(0, 10);
    const topFTD = [...dadosPorClube].sort((a, b) => b.ftd - a.ftd).slice(0, 10);
    const topGGR = [...dadosPorClube].sort((a, b) => b.ggr - a.ggr).slice(0, 10);
    
    // Atualizar tabelas
    preencherTabela("topDepositos", topDepositos, "depositos");
    preencherTabela("topFTD", topFTD, "ftd");
    preencherTabela("topGGR", topGGR, "ggr");
}

function preencherTabela(idElemento, dados, campo) {
    const tabela = document.getElementById(idElemento);
    tabela.innerHTML = `
        <tr>
            <th>Posição</th>
            <th>Clube</th>
            <th>Valor</th>
        </tr>
    `;
    
    dados.forEach((item, index) => {
        const row = document.createElement("tr");
        
        // Estilizar posição
        let positionClass = "";
        if (index === 0) positionClass = "color: #f1c40f; font-weight: bold;";
        else if (index === 1) positionClass = "color: #95a5a6; font-weight: bold;";
        else if (index === 2) positionClass = "color: #cd7f32; font-weight: bold;";
        
        row.innerHTML = `
            <td style="${positionClass}">${index + 1}º</td>
            <td>${item.clube}</td>
            <td style="font-weight: 500;">${formatarMoeda(item[campo])}</td>
        `;
        tabela.appendChild(row);
    });
}

function mostrarErro(mensagem) {
    document.getElementById("dashboardContent").innerHTML = `
        <div class="error">
            <h3>Erro no Carregamento</h3>
            <p>${mensagem}</p>
            <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 15px; background: var(--danger); color: white; border: none; border-radius: 5px; cursor: pointer;">Tentar Novamente</button>
        </div>
    `;
}