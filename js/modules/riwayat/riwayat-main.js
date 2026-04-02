/**
 * Riwayat Transaksi Main Controller
 */

let transaksiData = [];
let filteredData = [];
let currentPage = 1;
let itemsPerPage = 20;
let currentDetailId = null;

document.addEventListener('DOMContentLoaded', function() {
    initRiwayat();
});

function initRiwayat() {
    // Set default date range (today)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('filter-start-date').value = today;
    document.getElementById('filter-end-date').value = today;
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    loadTransaksi();
    
    // Update datetime
    setInterval(updateDateTime, 1000);
    updateDateTime();
    
    // Update header counters
    updateHeaderCounters();
}

function setupEventListeners() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });
    }
    
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
        });
    }
    
    // Filter buttons
    document.getElementById('btn-apply-filter')?.addEventListener('click', applyFilter);
    document.getElementById('btn-reset-filter')?.addEventListener('click', resetFilter);
    document.getElementById('btn-export-excel')?.addEventListener('click', exportToExcel);
    document.getElementById('btn-print-list')?.addEventListener('click', printTransactionList);
    
    // Pagination
    document.getElementById('btn-prev')?.addEventListener('click', () => changePage(-1));
    document.getElementById('btn-next')?.addEventListener('click', () => changePage(1));
    
    // Enter key on search
    document.getElementById('filter-search')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') applyFilter();
    });
    
    // Modal buttons
    document.getElementById('btn-print-struk')?.addEventListener('click', printStruk);
    document.getElementById('btn-refund')?.addEventListener('click', showRefundModal);
    document.getElementById('btn-batalkan-transaksi')?.addEventListener('click', batalkanTransaksi);
    document.getElementById('btn-proses-refund')?.addEventListener('click', prosesRefund);
}

async function loadTransaksi() {
    const tbody = document.getElementById('transaction-list');
    tbody.innerHTML = `
        <tr class="loading-row">
            <td colspan="10" class="text-center">
                <div class="spinner"></div>
                <p>Memuat data transaksi...</p>
            </td>
        </tr>
    `;
    
    try {
        const startDate = document.getElementById('filter-start-date').value;
        const endDate = document.getElementById('filter-end-date').value;
        
        let query = database.ref('transaksi').orderByChild('created_at');
        
        // Apply date filter
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            
            query = query.startAt(start.getTime()).endAt(end.getTime());
        } else {
            // Default: last 30 days
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            query = query.startAt(thirtyDaysAgo);
        }
        
        const snapshot = await query.once('value');
        transaksiData = [];
        
        snapshot.forEach(child => {
            const data = child.val();
            transaksiData.push({
                id: child.key,
                ...data
            });
        });
        
        // Sort by date desc
        transaksiData.sort((a, b) => b.created_at - a.created_at);
        
        // Apply filters
        applyFilter(false);
        
    } catch (error) {
        console.error('Error loading transaksi:', error);
        tbody.innerHTML = `
            <tr class="loading-row">
                <td colspan="10" class="text-center">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; color: var(--danger-color); margin-bottom: 15px;"></i>
                    <p>Gagal memuat data transaksi</p>
                    <small style="color: var(--text-secondary);">${error.message}</small>
                </td>
            </tr>
        `;
    }
}

function applyFilter(render = true) {
    const statusFilter = document.getElementById('filter-status').value;
    const metodeFilter = document.getElementById('filter-metode').value;
    const searchFilter = document.getElementById('filter-search').value.toLowerCase().trim();
    
    filteredData = transaksiData.filter(t => {
        // Status filter
        if (statusFilter && t.status !== statusFilter) return false;
        
        // Metode filter
        if (metodeFilter && t.metode_pembayaran !== metodeFilter) return false;
        
        // Search filter
        if (searchFilter) {
            const matchKode = (t.kode || '').toLowerCase().includes(searchFilter);
            const matchPelanggan = (t.pelanggan?.nama || '').toLowerCase().includes(searchFilter);
            const matchOperator = (t.created_by || '').toLowerCase().includes(searchFilter);
            
            if (!matchKode && !matchPelanggan && !matchOperator) return false;
        }
        
        return true;
    });
    
    // Reset to first page
    currentPage = 1;
    
    if (render) {
        renderTransaksi();
        updateStats();
    }
}

function resetFilter() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('filter-start-date').value = today;
    document.getElementById('filter-end-date').value = today;
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-metode').value = '';
    document.getElementById('filter-search').value = '';
    
    loadTransaksi();
}

function renderTransaksi() {
    const tbody = document.getElementById('transaction-list');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);
    
    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr class="loading-row">
                <td colspan="10" class="text-center">
                    <i class="fas fa-inbox" style="font-size: 48px; opacity: 0.5; margin-bottom: 15px;"></i>
                    <p>Tidak ada data transaksi</p>
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = pageData.map((t, index) => {
            const tanggal = new Date(t.created_at).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            const waktu = new Date(t.created_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const itemCount = Object.keys(t.items || {}).length;
            const statusClass = `status-${t.status || 'sukses'}`;
            const metodeClass = `metode-${t.metode_pembayaran || 'tunai'}`;
            
            return `
                <tr>
                    <td>${start + index + 1}</td>
                    <td><span class="kode-transaksi">${t.kode || '-'}</span></td>
                    <td>
                        <span class="waktu-transaksi">${tanggal}</span>
                        <small style="display: block; color: var(--text-secondary);">${waktu}</small>
                    </td>
                    <td>
                        <div class="pelanggan-info">
                            <span class="pelanggan-nama">${t.pelanggan?.nama || 'Umum'}</span>
                            ${t.pelanggan?.telepon ? `<span class="pelanggan-telp">${t.pelanggan.telepon}</span>` : ''}
                        </div>
                    </td>
                    <td><span class="item-count">${itemCount} item</span></td>
                    <td><span class="metode-badge ${metodeClass}">${t.metode_pembayaran || 'TUNAI'}</span></td>
                    <td class="total-transaksi">${formatRupiah(t.total || 0)}</td>
                    <td><span class="status-badge ${statusClass}">${(t.status || 'sukses').toUpperCase()}</span></td>
                    <td>${t.created_by || '-'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action btn-view" onclick="lihatDetail('${t.id}')" title="Detail">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-action btn-print" onclick="printStrukById('${t.id}')" title="Print">
                                <i class="fas fa-print"></i>
                            </button>
                            ${t.status === 'sukses' ? `
                            <button class="btn-action btn-cancel" onclick="batalkanTransaksiById('${t.id}')" title="Batalkan">
                                <i class="fas fa-times"></i>
                            </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, filteredData.length);
    
    document.getElementById('showing-start').textContent = filteredData.length > 0 ? start : 0;
    document.getElementById('showing-end').textContent = end;
    document.getElementById('total-records').textContent = filteredData.length;
    
    document.getElementById('btn-prev').disabled = currentPage === 1;
    document.getElementById('btn-next').disabled = currentPage === totalPages || totalPages === 0;
    
    // Render page numbers
    const pageContainer = document.getElementById('page-numbers');
    let pageHtml = '';
    
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pageHtml += `<span class="page-number ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</span>`;
    }
    
    pageContainer.innerHTML = pageHtml;
}

function changePage(direction) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderTransaksi();
    }
}

function goToPage(page) {
    currentPage = page;
    renderTransaksi();
}

function updateStats() {
    const totalTransaksi = filteredData.length;
    const totalPenjualan = filteredData.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalItem = filteredData.reduce((sum, t) => {
        const items = Object.values(t.items || {});
        return sum + items.reduce((itemSum, item) => itemSum + (item.jumlah || 0), 0);
    }, 0);
    const rataRata = totalTransaksi > 0 ? Math.round(totalPenjualan / totalTransaksi) : 0;
    
    document.getElementById('stat-total-transaksi').textContent = totalTransaksi.toLocaleString('id-ID');
    document.getElementById('stat-total-penjualan').textContent = formatRupiah(totalPenjualan);
    document.getElementById('stat-total-item').textContent = totalItem.toLocaleString('id-ID');
    document.getElementById('stat-rata-rata').textContent = formatRupiah(rataRata);
}

async function updateHeaderCounters() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const snapshot = await database.ref('transaksi')
            .orderByChild('created_at')
            .startAt(today.getTime())
            .endAt(tomorrow.getTime())
            .once('value');
        
        let totalTransaksi = 0;
        let totalOmzet = 0;
        
        snapshot.forEach(child => {
            const data = child.val();
            if (data.status === 'sukses' || data.status === 'refund') {
                totalTransaksi++;
                totalOmzet += data.total || 0;
            }
        });
        
        document.getElementById('total-transaksi-hari').textContent = totalTransaksi;
        document.getElementById('total-omzet-hari').textContent = formatRupiah(totalOmzet);
        
    } catch (error) {
        console.error('Error updating counters:', error);
    }
}

function updateDateTime() {
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('current-date');
    const now = new Date();
    
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    if (dateEl) dateEl.textContent = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Modal functions
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

// Export globals
window.transaksiData = transaksiData;
window.filteredData = filteredData;
window.currentPage = currentPage;
window.currentDetailId = currentDetailId;
window.loadTransaksi = loadTransaksi;
window.applyFilter = applyFilter;
window.resetFilter = resetFilter;
window.renderTransaksi = renderTransaksi;
window.changePage = changePage;
window.goToPage = goToPage;
window.openModal = openModal;
window.closeModal = closeModal;
window.updateHeaderCounters = updateHeaderCounters;
