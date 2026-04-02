/**
 * Riwayat Pembelian Module
 */

async function loadRiwayatPembelian() {
    try {
        const container = document.getElementById('history-list');
        container.innerHTML = `
            <div class="loading-history">
                <div class="spinner"></div>
                <p>Memuat data...</p>
            </div>
        `;
        
        const filterTanggal = document.getElementById('filter-tanggal')?.value;
        
        let query = database.ref('pembelian').orderByChild('created_at');
        
        if (filterTanggal) {
            // Filter by date range
            const startOfDay = new Date(filterTanggal);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(filterTanggal);
            endOfDay.setHours(23, 59, 59, 999);
            
            query = query.startAt(startOfDay.getTime()).endAt(endOfDay.getTime());
        } else {
            // Default: last 30 days
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            query = query.startAt(thirtyDaysAgo);
        }
        
        const snapshot = await query.once('value');
        pembelianData = [];
        
        snapshot.forEach(child => {
            pembelianData.push({
                id: child.key,
                ...child.val()
            });
        });
        
        // Sort by date desc
        pembelianData.sort((a, b) => b.created_at - a.created_at);
        
        renderRiwayatPembelian();
        updateCounters();
        
    } catch (error) {
        console.error('Error loading riwayat:', error);
        document.getElementById('history-list').innerHTML = `
            <div class="loading-history">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: var(--danger-color);"></i>
                <p>Gagal memuat data</p>
            </div>
        `;
    }
}

function renderRiwayatPembelian() {
    const container = document.getElementById('history-list');
    
    if (pembelianData.length === 0) {
        container.innerHTML = `
            <div class="loading-history">
                <i class="fas fa-inbox" style="font-size: 48px; opacity: 0.5;"></i>
                <p>Belum ada data pembelian</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = pembelianData.map(p => {
        const tanggal = new Date(p.created_at).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const statusClass = p.status === 'lunas' ? 'status-lunas' : 
                           p.status === 'hutang' ? 'status-hutang' : 'status-dibatalkan';
        const statusText = p.status === 'lunas' ? 'Lunas' : 
                          p.status === 'hutang' ? 'Hutang' : 'Dibatalkan';
        
        const itemCount = Object.keys(p.items || {}).length;
        
        return `
            <div class="pembelian-card" onclick="lihatDetailPembelian('${p.id}')">
                <div class="card-header">
                    <span class="kode-pembelian">${p.kode}</span>
                    <span class="tanggal">${tanggal}</span>
                </div>
                <div class="supplier-info">
                    <div class="supplier-nama">${getSupplierName(p.supplier_id)}</div>
                    <div class="supplier-detail">${itemCount} item • ${p.metode_pembayaran?.toUpperCase() || 'TUNAI'}</div>
                </div>
                <div class="card-footer">
                    <span class="total-belanja">${formatRupiah(p.total)}</span>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
            </div>
        `;
    }).join('');
}

async function updateCounters() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const snapshot = await database.ref('pembelian')
            .orderByChild('created_at')
            .startAt(today.getTime())
            .endAt(tomorrow.getTime())
            .once('value');
        
        let totalPembelian = 0;
        let totalBelanja = 0;
        
        snapshot.forEach(child => {
            const data = child.val();
            if (data.status !== 'dibatalkan') {
                totalPembelian++;
                totalBelanja += data.total || 0;
            }
        });
        
        document.getElementById('total-pembelian-hari').textContent = totalPembelian;
        document.getElementById('total-belanja-hari').textContent = formatRupiah(totalBelanja);
        
    } catch (error) {
        console.error('Error updating counters:', error);
    }
}

window.loadRiwayatPembelian = loadRiwayatPembelian;
window.renderRiwayatPembelian = renderRiwayatPembelian;
window.updateCounters = updateCounters;
