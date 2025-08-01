console.log("Rodando versão DEBUG");

const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ21mvugq-_T80mCuddCnebiH30MWwJvQ58QiS9OqzHJuTXEVPsOFa9_Apzt4e9rlrLEeQtc8p60t80/pub?gid=0&single=true&output=csv";

document.addEventListener("DOMContentLoaded", carregarDados);

function mostrarErro(msg) {
    const el = document.getElementById("error-message");
    el.textContent = msg;
    el.classList.remove("hidden");
}

function carregarDados() {
    console.log("Iniciando carregamento do CSV...");
    const timeout = setTimeout(() => {
        mostrarErro("Erro: tempo de resposta excedido ao carregar os dados.");
        console.error("Timeout ao tentar carregar os dados");
    }, 5000);

    Papa.parse(DATA_URL, {
        download: true,
        header: true,
        complete: (resultado) => {
            clearTimeout(timeout);
            if (!resultado || !resultado.data || resultado.data.length === 0) {
                mostrarErro("Erro: dados não encontrados ou inválidos.");
                console.error("Dados inválidos:", resultado);
                return;
            }
            console.log(`Linhas recebidas: ${resultado.data.length}`);
            processarDados(resultado.data);
        },
        error: (err) => {
            clearTimeout(timeout);
            mostrarErro("Erro ao carregar dados. Verifique sua conexão.");
            console.error("Erro no PapaParse:", err);
        }
    });
}

function processarDados(dados) {
    console.log("Processando dados...");
    // Aqui vai a lógica para calcular totais, popular KPIs, gráficos e tabelas
    // Placeholder
    document.getElementById("ftdValor").textContent = "R$ 123.456,78";
}
