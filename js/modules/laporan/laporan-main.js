let chartPenjualan = null;
let chartKategori = null;

document.addEventListener('DOMContentLoaded', function() {
    initLaporan();
});

function initLaporan() {
    setupEventListeners();
    generateReport();
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

function setupEventListeners() {
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('collapsed'));
    document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('active'));
    document.getElementById('report-period')?.addEventListener('change', handlePeriodChange);
    document.getElementById('btn-generate')?.addEventListener('click', generateReport);
    document.getElementById('btn-export')?.addEventListener('click', exportReport);
}

function handlePeriodChange() {
    const isCustom = document.getElementById('report-period').value === 'custom';
    document.querySelectorAll('.custom-date').forEach(el => el.style.display = isCustom ? 'flex' : 'none');
}

function getDateRange() {
    const period = document.getElementById('report-period').value;
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch(period) {
        case 'today':
            start.setHours(0,0,0,0);
            end.setHours(23,59,59,999);
            break;
        case 'week':
            start.setDate(now.getDate() - now.getDay());
            start.setHours(0,0,0,0);
            end.setHours(23,59,59,999);
            break;
        case 'month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
        case 'custom':
            start = new Date(document.getElementById('date-from').value);
            end = new Date(document.getElementById('date-to').value);
            end.setHours(23,59,59,999);
            break;
    }

    return { start: start.getTime(), end: end.getTime() };
}

async function generateReport() {
    const { start, end } = getDateRange();
    
    try {
        // Get transaksi
        const transSnapshot = await database.ref('transaksi')
            .orderByChild('created_at')
            .startAt(start)
            .endAt(end)
            .once('value');

        let totalPenjualan = 0;
        let totalTransaksi = 0;
        const dailyData = {};
        const kategoriData = {};

        transSnapshot.forEach(child => {
            const t = child.val();
            if (t.status !== 'dibatalkan') {
                totalPenjualan += t.total || 0;
                totalTransaksi++;
                
                const date = new Date(t.created_at).toLocaleDateString('id-ID');
                if (!dailyData[date]) dailyData[date] = { penjualan: 0, pembelian: 0, transaksi: 0 };
                dailyData[date].penjualan += t.total || 0;
                dailyData[date].transaksi++;

                // Kategori
                Object.values(t.items || {}).forEach(item => {
                    const kat = item.kategori || 'Lainnya';
                    if (!kategoriData[kat]) kategoriData[kat] = 0;
                    kategoriData[kat] += item.subtotal || 0;
                });
            }
        });

        // Get pembelian
        const beliSnapshot = await database.ref('pembelian')
            .orderByChild('tanggal')
            .startAt(start)
            .endAt(end)
            .once('value');

        let totalPembelian = 0;
        beliSnapshot.forEach(child => {
            const p = child.val();
            totalPembelian += p.total || 0;
            
            const date = new Date(p.tanggal).toLocaleDateString('id-ID');
            if (!dailyData[date]) dailyData[date] = { penjualan: 0, pembelian: 0, transaksi: 0 };
            dailyData[date].pembelian += p.total || 0;
        });

        const profit = totalPenjualan - totalPembelian;

        // Update UI
        document.getElementById('rpt-penjualan').textContent = formatRupiah(totalPenjualan);
        document.getElementById('rpt-pembelian').textContent = formatRupiah(totalPembelian);
        document.getElementById('rpt-profit').textContent = formatRupiah(profit);
        document.getElementById('rpt-transaksi').textContent = totalTransaksi.toLocaleString('id-ID');

        renderCharts(dailyData, kategoriData);
        renderDetailTable(dailyData);

    } catch (error) {
        console.error('Error generating report:', error);
    }
}

function renderDetailTable(dailyData) {
    const tbody = document.getElementById('detail-list');
    const dates = Object.keys(dailyData).sort((a,b) => new Date(a) - new Date(b));
    
    tbody.innerHTML = dates.map(date => {
        const d = dailyData[date];
        const profit = d.penjualan - d.pembelian;
        return `
            <tr>
                <td>${date}</td>
                <td>${d.transaksi}</td>
                <td>${formatRupiah(d.penjualan)}</td>
                <td>${formatRupiah(d.pembelian)}</td>
                <td class="${profit >= 0 ? 'text-success' : 'text-danger'}">${formatRupiah(profit)}</td>
            </tr>
        `;
    }).join('');
}

function exportReport() {
    // Export to Excel implementation
    alert('Fitur export sedang dikembangkan');
}

function updateDateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('current-date').textContent = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

window.generateReport = generateReport;
window.exportReport = exportReport;
