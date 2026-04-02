function renderCharts(dailyData, kategoriData) {
    const ctx1 = document.getElementById('chart-penjualan').getContext('2d');
    const ctx2 = document.getElementById('chart-kategori').getContext('2d');
    
    const dates = Object.keys(dailyData).sort();
    const penjualanData = dates.map(d => dailyData[d].penjualan);
    
    if (chartPenjualan) chartPenjualan.destroy();
    if (chartKategori) chartKategori.destroy();

    chartPenjualan = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Penjualan',
                data: penjualanData,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { callback: v => formatRupiah(v) } }
            }
        }
    });

    const katLabels = Object.keys(kategoriData);
    const katValues = Object.values(kategoriData);

    chartKategori = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: katLabels,
            datasets: [{
                data: katValues,
                backgroundColor: ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

window.renderCharts = renderCharts;
