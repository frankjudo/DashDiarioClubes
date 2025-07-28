document.addEventListener("DOMContentLoaded", function () {
    console.log("Iniciando carregamento da dashboard...");

    const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

    const dataFiltro = document.getElementById("dataFiltro");
    const clubeSelect = document.getElementById("clubeSelect");
    const aplicarBtn = document.getElementById("aplicarBtn");

    let dados = [];

    aplicarBtn.addEventListener("click", aplicarFiltros);

    Papa.parse(csvUrl, {
        download: true,
        header: false,
        complete: function (results) {
            console.log("Dados brutos CSV:", results.data);
            dados = normalizarDados(results.data);
            console.log("Dados normalizados:", dados);

            preencherFiltros(dados);
            atualizarDashboard(dados);
        },
        error: function (error) {
            console.error("Erro ao carregar CSV:", error);
        }
    });

    function normalizarDados(data) {
        return data.slice(1).map(row => ({
            data: row[0],
            clube: row[2],
            ftd: parseFloat(row[5] || 0),
            depositos: parseFloat(row[6] || 0),
            ggr: parseFloat(row[26] || 0) // Coluna AA no CSV original
        }));
    }

    function preencherFiltros(dados) {
        if (!clubeSelect) return;
        const clubesUnicos = [...new Set(dados.map(d => d.clube))];
        clubeSelect.innerHTML = `<option value="">Todos</option>`;
        clubesUnicos.forEach(clube => {
            clubeSelect.innerHTML += `<option value="${clube}">${clube}</option>`;
        });
    }

    function aplicarFiltros() {
        const dataSelecionada = dataFiltro.value;
        const clubeSelecionado = clubeSelect.value;
        let filtrados = [...dados];

        if (dataSelecionada) {
            filtrados = filtrados.filter(d => d.data === dataSelecionada);
        }
        if (clubeSelecionado) {
            filtrados = filtrados.filter(d => d.clube === clubeSelecionado);
        }

        atualizarDashboard(filtrados);
    }

    function atualizarDashboard(data) {
        const totalFTD = data.reduce((sum, d) => sum + d.ftd, 0);
        const totalDepositos = data.reduce((sum, d) => sum + d.depositos, 0);
        const totalGGR = data.reduce((sum, d) => sum + d.ggr, 0);

        document.getElementById("totalFTD").innerText = formatarBRL(totalFTD);
        document.getElementById("totalDepositos").innerText = formatarBRL(totalDepositos);
        document.getElementById("totalGGR").innerText = formatarBRL(totalGGR);

        atualizarRanking(data);
        atualizarGraficos(data);
    }

    function atualizarRanking(data) {
        const topDepositos = agruparPorClube(data).sort((a, b) => b.depositos - a.depositos).slice(0, 10);
        const topFTD = agruparPorClube(data).sort((a, b) => b.ftd - a.ftd).slice(0, 10);
        const topGGR = agruparPorClube(data).sort((a, b) => b.ggr - a.ggr).slice(0, 10);

        preencherTabela("rankingDepositos", topDepositos);
        preencherTabela("rankingFTD", topFTD);
        preencherTabela("rankingGGR", topGGR);
    }

    function agruparPorClube(data) {
        const mapa = {};
        data.forEach(d => {
            if (!mapa[d.clube]) {
                mapa[d.clube] = { clube: d.clube, ftd: 0, depositos: 0, ggr: 0 };
            }
            mapa[d.clube].ftd += d.ftd;
            mapa[d.clube].depositos += d.depositos;
            mapa[d.clube].ggr += d.ggr;
        });
        return Object.values(mapa);
    }

    function preencherTabela(id, dados) {
        const tabela = document.getElementById(id);
        if (!tabela) return;

        tabela.innerHTML = `
            <tr>
                <th>Clube</th>
                <th>FTD</th>
                <th>Depósitos</th>
                <th>GGR</th>
            </tr>
        `;

        dados.forEach(item => {
            tabela.innerHTML += `
                <tr>
                    <td>${item.clube}</td>
                    <td>${formatarBRL(item.ftd)}</td>
                    <td>${formatarBRL(item.depositos)}</td>
                    <td>${formatarBRL(item.ggr)}</td>
                </tr>
            `;
        });
    }

    function atualizarGraficos(data) {
        const labels = [...new Set(data.map(d => d.data))];
        const somaPorDia = labels.map(dataLabel => {
            const filtro = data.filter(d => d.data === dataLabel);
            return {
                ftd: filtro.reduce((sum, d) => sum + d.ftd, 0),
                depositos: filtro.reduce((sum, d) => sum + d.depositos, 0),
                ggr: filtro.reduce((sum, d) => sum + d.ggr, 0)
            };
        });

        criarGrafico("graficoGGR", labels, somaPorDia.map(d => d.ggr), "GGR Diário");
        criarGrafico("graficoFTD", labels, somaPorDia.map(d => d.ftd), "FTD Diário");
        criarGrafico("graficoDepositos", labels, somaPorDia.map(d => d.depositos), "Depósitos Diários");
    }

    function criarGrafico(id, labels, data, titulo) {
        const ctx = document.getElementById(id).getContext("2d");
        new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: titulo,
                    data: data,
                    borderColor: "#0f0",
                    backgroundColor: "rgba(0,255,0,0.2)",
                    fill: true
                }]
            }
        });
    }

    function formatarBRL(valor) {
        return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }
});
