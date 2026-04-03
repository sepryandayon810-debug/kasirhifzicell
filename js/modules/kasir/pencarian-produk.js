/**
 * Pencarian Produk Module
 * File: js/modules/kasir/pencarian-produk.js
 */

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-produk');
    const kategoriSelect = document.getElementById('filter-kategori');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(cariProduk, 300));
    }
    
    if (kategoriSelect) {
        kategoriSelect.addEventListener('change', cariProduk);
    }
});

function cariProduk() {
    const searchTerm = document.getElementById('search-produk')?.value.toLowerCase().trim() || '';
    const kategori = document.getElementById('filter-kategori')?.value || '';
    
    // Ambil data dari global scope
    const produkData = window.produkData || [];
    
    let filtered = [...produkData];
    
    // Filter berdasarkan nama/kode/barcode
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.nama?.toLowerCase().includes(searchTerm) ||
            (p.kode && p.kode.toLowerCase().includes(searchTerm)) ||
            (p.barcode && p.barcode.includes(searchTerm))
        );
    }
    
    // Filter berdasarkan kategori
    if (kategori) {
        filtered = filtered.filter(p => p.kategori === kategori);
    }
    
    // Render hasil menggunakan module yang aktif
    const container = document.getElementById('produk-container');
    if (!container) return;
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="loading-produk" style="grid-column: 1/-1;">
                <i class="fas fa-search" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>Produk tidak ditemukan</p>
                <button class="btn btn-primary" onclick="document.getElementById('btn-transaksi-manual').click()" style="margin-top: 15px;">
                    <i class="fas fa-plus"></i> Tambah Manual
                </button>
            </div>
        `;
        return;
    }
    
    // Gunakan view yang sedang aktif
    const currentView = window.currentView || 'grid';
    
    if (currentView === 'grid' && typeof ProdukGrid !== 'undefined') {
        ProdukGrid.render(filtered, container);
    } else if (currentView === 'list' && typeof ProdukList !== 'undefined') {
        ProdukList.render(filtered, container);
    }
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export
window.cariProduk = cariProduk;
