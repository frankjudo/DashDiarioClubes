const urlCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

let dados = [];

function carregarDados() {
    Papa.parse(urlCSV, {
        download: true,
        header: true,
        complete: function (results) {
            dados = results.data;
            atualizarDashboard();
            atualizarUltimaAtualizacao();
        }
    });
}

function atualizarUltimaAtualizacao() {
    const agora = new Date();
    const data = agora.toLocaleDateString();
    const hora = agora.toLocaleTimeString();
    document.getElementById('ultimaAtualizacao').innerText = `Última atualização: ${data} ${hora}`;
}

function atualizarDashboard() {
    // ... (lógica existente de cálculos, gráficos e tabelas)
}

function aplicarFiltros() {
    atualizarDashboard();
}

window.onload = carregarDados;
