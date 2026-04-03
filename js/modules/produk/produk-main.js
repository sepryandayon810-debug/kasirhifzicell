/**
 * Produk Main Controller - FIXED VERSION
 */

let produkData = [];
let kategoriData = [];
let currentView = 'grid';
let currentPage = 1;
const itemsPerPage = 20;
let filteredData = [];

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // Tunggu Firebase siap
    if (typeof firebase === 'undefined') {
        console.error('[ProdukMain] Firebase not loaded!');
        showToast('Error: Firebase tidak tersedia', 'danger');
        return;
    }
    
    initProduk();
});

function initProduk() {
    console.log('[ProdukMain] Initializing...');
    
    // Cek elemen penting ada
    if (!document.getElementById('produk-main-container')) {
        console.error('[ProdukMain] #produk-main-container not found!');
    }
    
    // Load data
    loadProduk();
    loadKategoriForFilter();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update datetime
    setInterval(updateDateTime, 1000);
    updateDateTime();
    
    console.log('[ProdukMain] Initialized');
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    // Toggle view
    document.querySelectorAll('.view-toggle .view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.dataset.view;
            toggleView(view);
        });
    });
    
    // Search
    const searchInput = document.getElementById('search-produk');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(cariProduk, 300));
    }
    
    // Filter kategori - PERBAIKAN ID
    const filterKategori = document.getElementById('filter-kategori');  // ← bukan 'filter-kategori-toolbar'
    if (filterKategori) {
        filterKategori.addEventListener('change', filterByKategori);
    }
    
    // Tombol tambah produk
    const btnTambah = document.getElementById('btn-tambah-produk');
    if (btnTambah) {
        btnTambah.addEventListener('click', () => {
            resetFormProduk();
            const titleEl = document.getElementById('modal-produk-title');
            if (titleEl) titleEl.textContent = 'Tambah Produk';
            openModal('modal-tambah-produk');  // ← ID modal yang benar
        });
    }
    
    // Tombol kategori
    const btnKategori = document.getElementById('btn-kategori');
    if (btnKategori) {
        btnTambah.addEventListener('click', () => {
            if (window.KategoriManager && window.KategoriManager.loadList) {
                window.KategoriManager.loadList();
            }
            openModal('modal-kategori');
        });
    }
    
    // Tombol stok masal
    const btnStokMasal = document.getElementById('btn-stok-masal');
    if (btnStokMasal) {
        btnStokMasal.addEventListener('click', () => {
            if (window.StokMasal && window.StokMasal.load) {
                window.StokMasal.load();
            }
            openModal('modal-stok-masal');
        });
    }
    
    // Tombol import - PERBAIKAN ID
    const btnImport = document.getElementById('btn-import-excel');  // ← bukan 'btn-import'
    if (btnImport) {
        btnImport.addEventListener('click', () => {
            openModal('modal-import');
        });
    }
    
    // Tombol export - PERBAIKAN ID
    const btnExport = document.getElementById('btn-export-excel');  // ← bukan 'btn-export'
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            if (window.ExportExcel && window.ExportExcel.export) {
                window.ExportExcel.export(produkData);
            } else {
                exportProdukToCSV();  // fallback
            }
        });
    }
}

// ==========================================
// LOAD DATA - PERBAIKAN FIREBASE
// ==========================================
async function loadProduk() {
    try {
        // PERBAIKAN: Gunakan firebase.database()
        const db = firebase.database();
        
        // PERBAIKAN: ID container yang benar
        const container = document.getElementById('produk-main-container');
        
        if (container) {
            container.innerHTML = `
                <div class="loading-produk" style="text-align: center; padding: 60px;">
                    <div class="spinner" style="width: 48px; height: 48px; border: 4px solid var(--border); border-top-color: var(--accent-indigo); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                    <p>Memuat produk...</p>
                </div>
            `;
        }
        
        // PERBAIKAN: 'produk' bukan 'products'
        const snapshot = await db.ref('produk').once('value');
        produkData = [];
        
        snapshot.forEach(child => {
            produkData.push({
                id: child.key,
                ...child.val()
            });
        });
        
        console.log('[ProdukMain] Loaded', produkData.length, 'products');
        
        // Update counters
        updateCounters();
        
        // Apply filters and render
        filterAndRender();
        
    } catch (error) {
        console.error('[ProdukMain] Error loading produk:', error);
        showToast('Gagal memuat produk: ' + error.message, 'danger');
        
        // Tampilkan error di container
        const container = document.getElementById('produk-main-container');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px; color: var(--accent-red);">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 20px;"></i>
                    <p>Gagal memuat data</p>
                    <button onclick="loadProduk()" class="btn btn-primary" style="margin-top: 20px;">
                        <i class="fas fa-sync-alt"></i> Coba Lagi
                    </button>
                </div>
            `;
        }
    }
}

function updateCounters() {
    const totalEl = document.getElementById('total-produk');
    const menipisEl = document.getElementById('stok-menipis');
    
    if (totalEl) totalEl.textContent = produkData.length;
    
    const stokMenipis = produkData.filter(p => p.stok > 0 && p.stok <= 5).length;
    if (menipisEl) menipisEl.textContent = stokMenipis;
}

// ==========================================
// FILTER & RENDER
// ==========================================
function filterAndRender() {
    // PERBAIKAN: ID yang benar
    const searchTerm = document.getElementById('search-produk')?.value.toLowerCase() || '';
    const kategoriFilter = document.getElementById('filter-kategori')?.value || '';
    
    filteredData = produkData.filter(p => {
        const matchSearch = !searchTerm || 
            p.nama?.toLowerCase().includes(searchTerm) ||
            p.kode?.toLowerCase().includes(searchTerm) ||
            p.barcode?.includes(searchTerm);
        
        const matchKategori = !kategoriFilter || p.kategori === kategoriFilter;
        
        return matchSearch && matchKategori;
    });
    
    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);
    
    // Render
    renderProduk(pageData);
    renderPagination(totalPages);
}

function renderProduk(data) {
    // PERBAIKAN: ID container yang benar
    const container = document.getElementById('produk-main-container');
    
    if (!container) {
        console.error('[ProdukMain] Container not found!');
        return;
    }
    
    if (data.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--text-muted);">
                <i class="fas fa-box-open" style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;"></i>
                <p style="font-size: 18px; font-weight: 600;">Tidak ada produk</p>
                <p>Tambahkan produk baru atau ubah filter pencarian</p>
            </div>
        `;
        return;
    }
    
    if (currentView === 'grid') {
        // Cek module ProdukGrid
        if (window.ProdukGrid && window.ProdukGrid.render) {
            window.ProdukGrid.render(data, container);
        } else {
            renderGridFallback(data, container);
        }
    } else {
        // Cek module ProdukList
        if (window.ProdukList && window.ProdukList.render) {
            window.ProdukList.render(data, container);
        } else {
            renderListFallback(data, container);
        }
    }
}

// Fallback render kalau module belum load
function renderGridFallback(data, container) {
    let html = '<div class="produk-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px;">';
    
    data.forEach(p => {
        const kategori = kategoriData.find(c => c.id === p.kategori)?.nama || '-';
        
        html += `
            <div class="produk-card-manajemen" style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 16px; overflow: hidden;">
                <div style="height: 150px; background: linear-gradient(135deg, var(--accent-indigo), var(--accent-purple)); display: flex; align-items: center; justify-content: center; color: white; font-size: 48px;">
                    <i class="fas fa-box"></i>
                </div>
                <div style="padding: 16px;">
                    <div style="font-size: 12px; color: var(--text-muted);">${p.kode || '-'}</div>
                    <div style="font-weight: 600; margin: 8px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.nama}</div>
                    <div style="color: var(--accent-indigo); font-weight: 700; font-size: 18px;">Rp ${formatNumber(p.hargaJual)}</div>
                    <div style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 13px;">
                        <span>Stok: ${p.stok || 0}</span>
                        <span style="color: var(--text-muted);">${kategori}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; padding: 12px 16px; background: var(--bg-hover); border-top: 1px solid var(--border);">
                    <button onclick="editProduk('${p.id}')" style="flex: 1; padding: 8px; background: rgba(99,102,241,0.1); color: var(--accent-indigo); border: none; border-radius: 8px; cursor: pointer;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="hapusProduk('${p.id}')" style="flex: 1; padding: 8px; background: rgba(239,68,68,0.1); color: var(--accent-red); border: none; border-radius: 8px; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function renderListFallback(data, container) {
    let html = '<div class="produk-list">';
    
    data.forEach(p => {
        const kategori = kategoriData.find(c => c.id === p.kategori)?.nama || '-';
        
        html += `
            <div style="display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 12px;">
                <div style="width: 60px; height: 60px; background: linear-gradient(135deg, var(--accent-indigo), var(--accent-purple)); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px;">
                    <i class="fas fa-box"></i>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600;">${p.nama}</div>
                    <div style="font-size: 13px; color: var(--text-muted);">${p.kode} | ${kategori}</div>
                </div>
                <div style="text-align: right;">
                    <div style="color: var(--accent-indigo); font-weight: 700;">Rp ${formatNumber(p.hargaJual)}</div>
                    <div style="font-size: 13px;">Stok: ${p.stok || 0}</div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="editProduk('${p.id}')" style="padding: 10px; background: rgba(99,102,241,0.1); color: var(--accent-indigo); border: none; border-radius: 8px; cursor: pointer;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="hapusProduk('${p.id}')" style="padding: 10px; background: rgba(239,68,68,0.1); color: var(--accent-red); border: none; border-radius: 8px; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function renderPagination(totalPages) {
    // PERBAIKAN: ID yang benar
    const container = document.getElementById('pagination-container');
    if (!container) return;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Prev button
    html += `<button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i>
    </button>`;
    
    // Page buttons
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<span style="padding: 0 10px;">...</span>`;
        }
    }
    
    // Next button
    html += `<button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-chevron-right"></i>
    </button>`;
    
    container.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    filterAndRender();
}

function toggleView(view) {
    currentView = view;
    
    document.querySelectorAll('.view-toggle .view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`.view-toggle [data-view="${view}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    filterAndRender();
}

function cariProduk() {
    currentPage = 1;
    filterAndRender();
}

function filterByKategori() {
    currentPage = 1;
    filterAndRender();
}

// ==========================================
// LOAD KATEGORI
// ==========================================
async function loadKategoriForFilter() {
    try {
        const db = firebase.database();
        const snapshot = await db.ref('kategori').orderByChild('nama').once('value');
        
        const select = document.getElementById('filter-kategori');
        const selectProduk = document.getElementById('produk-kategori');
        
        kategoriData = [];
        
        // Simpan opsi pertama
        const firstOption = select?.options[0];
        
        if (select) {
            select.innerHTML = '';
            if (firstOption) select.appendChild(firstOption);
        }
        
        snapshot.forEach(child => {
            const kategori = child.val();
            kategoriData.push({ id: child.key, ...kategori });
            
            if (select) {
                const option = document.createElement('option');
                option.value = child.key;
                option.textContent = kategori.nama;
                select.appendChild(option);
            }
            
            if (selectProduk) {
                const option = document.createElement('option');
                option.value = child.key;
                option.textContent = kategori.nama;
                selectProduk.appendChild(option);
            }
        });
        
    } catch (error) {
        console.error('[ProdukMain] Error loading kategori:', error);
    }
}

// ==========================================
// FORM & MODAL
// ==========================================
function resetFormProduk() {
    const form = document.getElementById('form-produk');
    if (form) form.reset();
    
    const idEl = document.getElementById('produk-id');
    if (idEl) idEl.value = '';
    
    const preview = document.getElementById('image-preview');
    if (preview) {
        preview.innerHTML = '<i class="fas fa-image"></i><span>Preview</span>';
        preview.classList.remove('has-image');
    }
    
    const btnHapus = document.getElementById('btn-hapus-gambar');
    if (btnHapus) btnHapus.style.display = 'none';
}

function updateDateTime() {
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('current-date');
    const now = new Date();
    
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    if (dateEl) dateEl.textContent = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

// ==========================================
// HELPERS
// ==========================================
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

function formatNumber(num) {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') || '0';
}

function showToast(message, type) {
    // Implementasi toast sederhana
    console.log(`[${type}] ${message}`);
}

function exportProdukToCSV() {
    const headers = ['Kode', 'Nama', 'Kategori', 'Harga Modal', 'Harga Jual', 'Stok'];
    const rows = produkData.map(p => [
        p.kode || '',
        p.nama || '',
        kategoriData.find(c => c.id === p.kategori)?.nama || '',
        p.hargaModal || 0,
        p.hargaJual || 0,
        p.stok || 0
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `produk_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// ==========================================
// GLOBAL EXPORTS
// ==========================================
window.produkData = produkData;
window.kategoriData = kategoriData;
window.currentView = currentView;
window.loadProduk = loadProduk;
window.filterAndRender = filterAndRender;
window.toggleView = toggleView;
window.changePage = changePage;
window.cariProduk = cariProduk;
window.openModal = openModal;
window.closeModal = closeModal;
window.resetFormProduk = resetFormProduk;
window.loadKategoriForFilter = loadKategoriForFilter;
window.editProduk = function(id) {
    console.log('Edit produk:', id);
    // Implementasi edit
};
window.hapusProduk = function(id) {
    if (confirm('Hapus produk ini?')) {
        firebase.database().ref(`produk/${id}`).remove()
            .then(() => {
                showToast('Produk dihapus', 'success');
                loadProduk();
            });
    }
};
