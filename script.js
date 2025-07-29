const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

document.getElementById("aplicarFiltro").addEventListener("click", () => carregarDados());

function parseNumber(value) {
    if (!value) return 0;
    return Number(value.toString().replace(/R\$\s?/g, "").replace(/\./g, "").replace(",", "."));
}

function carregarDados() {
    const inicio = performance.now();
    document.getElementById("statusCarregamento").innerText = "Carregando dados...";
    Papa.parse(csvUrl, {
        download: true,
        complete: function(results) {
            const rawData = results.data;
            console.log("Linhas recebidas:", rawData.length);
            const dataset = normalizarDados(rawData);
            atualizarDashboard(dataset);
            const fim = performance.now();
            document.getElementById("tempoProcessamento").innerText = `Tempo de processamento: ${(fim - inicio).toFixed(2)} ms`;
            document.getElementById("statusCarregamento").innerText = "";
        }
    });
}

function normalizarDados(data) {
    const unique = new Map();
    const result = [];
    data.forEach(row => {
        const key = `${row[0]}-${row[2]}`;
        if (!unique.has(key)) {
            unique.set(key, true);
            result.push({
                data: row[0],
                clube: row[2],
                ftd: parseNumber(row[5]),
                depositos: parseNumber(row[6]),
                ggr: parseNumber(row[26])
            });
        }
    });
    console.log("Dados normalizados:", result.length);
    return result;
}

function atualizarDashboard(data) {
    let totalFTD = 0, totalDepositos = 0, totalGGR = 0;
    data.forEach(item => {
        totalFTD += item.ftd;
        totalDepositos += item.depositos;
        totalGGR += item.ggr;
    });

    console.log(`Totais calculados -> FTD: ${totalFTD}, Depósitos: ${totalDepositos}, GGR: ${totalGGR}`);

    document.getElementById("totalFTD").innerText = `R$ ${totalFTD.toLocaleString('pt-BR')}`;
    document.getElementById("totalDepositos").innerText = `R$ ${totalDepositos.toLocaleString('pt-BR')}`;
    document.getElementById("totalGGR").innerText = `R$ ${totalGGR.toLocaleString('pt-BR')}`;

    document.getElementById("ultimaAtualizacao").innerText =
        `Última atualização: ${new Date().toLocaleString()}`;
}

carregarDados();
