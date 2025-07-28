const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dadosProcessados = [];

document.addEventListener("DOMContentLoaded", () => {
    carregarDados();
    document.getElementById("filtroData").addEventListener("change", filtrarDados);
    document.getElementById("filtroClube").addEventListener("change", filtrarDados);
});

function carregarDados() {
    Papa.parse(CSV_URL, {
        download: true,
        header: false,
        complete: function(results) {
            console.log("Dados brutos CSV:", results.data);
            let linhas = results.data.filter(l => l.length > 1);

            // Normalização pelos índices fixos
            dadosProcessados = linhas.slice(1).map(row => ({
                data: row[0],      // Coluna A
                clube: row[2],     // Coluna C
                ftd: parseFloat(row[5] || 0),   // Coluna F
                depositos: parseFloat(row[6] || 0), // Coluna G
                ggr: parseFloat(row[27] || 0)   // Coluna AB
            }));

            console.log("Dados normalizados:", dadosProcessados);
            preencherFiltros();
            atualizarDashboard(dadosProcessados);
        }
    });
}

function preencherFiltros() {
    const clubesUnicos = [...new Set(dadosProcessados.map(d => d.clube))];
    const select = document.getElementById("filtroClube");
    select.innerHTML = `<option value="">Todos</option>` + 
        clubesUnicos.map(clube => `<option value="${clube}">${clube}</option>`).join("");
}

function filtrarDados() {
    const filtroClube = document.getElementById("filtroClube").value;
    const filtroData = document.getElementById("filtroData").value;

    let filtrado = dadosProcessados;

    if (filtroClube) {
        filtrado = filtrado.filter(d => d.clube === filtroClube);
    }
    if (filtroData) {
        filtrado = filtrado.filter(d => d.data === filtroData);
    }

    console.log("Dados filtrados:", filtrado);
    atualizarDashboard(filtrado);
}

function atualizarDashboard(dados) {
    const totalFTD = dados.reduce((sum, d) => sum + d.ftd, 0);
    const totalDepositos = dados.reduce((sum, d) => sum + d.depositos, 0);
    const totalGGR = dados.reduce((sum, d) => sum + d.ggr, 0);

    document.getElementById("totalFTD").textContent = `R$ ${totalFTD.toLocaleString("pt-BR")}`;
    document.getElementById("totalDepositos").textContent = `R$ ${totalDepositos.toLocaleString("pt-BR")}`;
    document.getElementById("totalGGR").textContent = `R$ ${totalGGR.toLocaleString("pt-BR")}`;

    const top10 = [...dados]
        .sort((a, b) => b.depositos - a.depositos)
        .slice(0, 10);

    let html = `
        <tr>
            <th>Clube</th>
            <th>FTD</th>
            <th>Depósitos</th>
            <th>GGR</th>
        </tr>`;
    top10.forEach(row => {
        html += `
        <tr>
            <td>${row.clube}</td>
            <td>R$ ${row.ftd.toLocaleString("pt-BR")}</td>
            <td>R$ ${row.depositos.toLocaleString("pt-BR")}</td>
            <td>R$ ${row.ggr.toLocaleString("pt-BR")}</td>
        </tr>`;
    });
    document.getElementById("ranking").innerHTML = html;

    atualizarGraficos(dados);
}

function atualizarGraficos(dados) {
    const datas = [...new Set(dados.map(d => d.data))].sort();
    const ggrPorDia = datas.map(data => 
        dados.filter(d => d.data === data).reduce((sum, d) => sum + d.ggr, 0)
    );
    const ftdPorDia = datas.map(data => 
        dados.filter(d => d.data === data).reduce((sum, d) => sum + d.ftd, 0)
    );
    const depositosPorDia = datas.map(data => 
        dados.filter(d => d.data === data).reduce((sum, d) => sum + d.depositos, 0)
    );

    criarGrafico("graficoGGR", "GGR Diário", datas, ggrPorDia);
    criarGrafico("graficoFTD", "FTD Diário", datas, ftdPorDia);
    criarGrafico("graficoDepositos", "Depósitos Diários", datas, depositosPorDia);
}

function criarGrafico(elementId, label, labels, data) {
    const ctx = document.getElementById(elementId).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: 'rgba(0,255,0,1)',
                backgroundColor: 'rgba(0,255,0,0.1)',
                fill: true
            }]
        },
        options: { responsive: true }
    });
}
