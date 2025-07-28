function formatarBRL(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function atualizarTotais(ftd, depositos, ggr, clubesAtivos) {
    document.getElementById('ftdTotal').innerText = formatarBRL(ftd);
    document.getElementById('depositosTotal').innerText = formatarBRL(depositos);
    document.getElementById('ggrTotal').innerText = formatarBRL(ggr);
    document.getElementById('clubesAtivos').innerText = clubesAtivos;
}

function criarGrafico(id, label, dados, cor) {
    const ctx = document.getElementById(id).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dados.map(d => d.dia),
            datasets: [{
                label: label,
                data: dados.map(d => d.valor),
                borderColor: cor,
                backgroundColor: cor + "55",
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#0f0' } }
            },
            scales: {
                x: { ticks: { color: '#0f0' } },
                y: { ticks: { color: '#0f0', callback: v => formatarBRL(v) } }
            }
        }
    });
}
