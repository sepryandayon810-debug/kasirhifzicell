/**
 * Produk Main Controller
 */

let produkData = [];
let kategoriData = [];
let currentView = 'grid';
let currentPage = 1;
const itemsPerPage = 20;
let filteredData = [];

document.addEventListener('DOMContentLoaded', function() {
    initProduk();
});

function initProduk() {
    // Load data
    loadProduk();
    loadKategoriForFilter();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update datetime
    setInterval(updateDateTime, 1000);
    updateDateTime();
}

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
    
    // Filter kategori
    const filterKategori = document.getElementById('filter-kategori-toolbar');
    if (filterKategori) {
        filterKategori.addEventListener('change', filterByKategori);
    }
    
    // Tombol tambah produk
    const btnTambah = document.getElementById('btn-tambah-produk');
    if (btnTambah) {
        btnTambah.addEventListener('click', () => {
            resetFormProduk();
            document.getElementById('modal-produk-title').textContent = 'Tambah Produk';
            openModal('modal-produk');
        });
    }
    
    // Tombol kategori
    const btnKategori = document.getElementById('btn-kategori');
    if (btnKategori) {
        btnKategori.addEventListener('click', () => {
            loadKategoriList();
            openModal('modal-kategori');
        });
    }
    
    // Tombol stok masal
    const btnStokMasal = document.getElementById('btn-stok-masal');
    if (btnStokMasal) {
        btnStokMasal.addEventListener('click', () => {
            loadStokMasal();
            openModal('modal-stok-masal');
        });
    }
    
    // Tombol import
    const btnImport = document.getElementById('btn-import');
    if (btnImport) {
        btnImport.addEventListener('click', () => {
            openModal('modal-import');
        });
    }
    
    // Tombol export
    const btnExport = document.getElementById('btn-export');
    if (btnExport) {
        btnExport.addEventListener('click', exportProdukToExcel);
    }
    
    // Toggle sidebar
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
}

async function loadProduk() {
    try {
        const container = document.getElementById('produk-container');
        container.innerHTML = `
            <div class="loading-produk" style="grid-column: 1/-1;">
                <div class="spinner"></div>
                <p>Memuat produk...</p>
            </div>
        `;
        
        const snapshot = await database.ref('products').once('value');
        produkData = [];
        
        snapshot.forEach(child => {
            produkData.push({
                id: child.key,
                ...child.val()
            });
        });
        
        // Update counters
        updateCounters();
        
        // Apply filters and render
        filterAndRender();
        
    } catch (error) {
        console.error('Error loading produk:', error);
        showToast('Gagal memuat produk', 'danger');
    }
}

function updateCounters() {
    const totalEl = document.getElementById('total-produk');
    const menipisEl = document.getElementById('stok-menipis');
    
    if (totalEl) totalEl.textContent = produkData.length;
    
    const stokMenipis = produkData.filter(p => p.stok > 0 && p.stok <= 5).length;
    if (menipisEl) menipisEl.textContent = stokMenipis;
}

function filterAndRender() {
    const searchTerm = document.getElementById('search-produk')?.value.toLowerCase() || '';
    const kategoriFilter = document.getElementById('filter-kategori-toolbar')?.value || '';
    
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
    const container = document.getElementById('produk-container');
    
    if (currentView === 'grid') {
        ProdukManajemenGrid.render(data, container);
    } else {
        ProdukManajemenList.render(data, container);
    }
}

function renderPagination(totalPages) {
    const container = document.getElementById('pagination');
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
    document.querySelector(`.view-toggle [data-view="${view}"]`).classList.add('active');
    
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

async function loadKategoriForFilter() {
    try {
        const snapshot = await database.ref('kategori').orderByChild('nama').once('value');
        const select = document.getElementById('filter-kategori-toolbar');
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
        console.error('Error loading kategori:', error);
    }
}

function resetFormProduk() {
    document.getElementById('form-produk').reset();
    document.getElementById('produk-id').value = '';
    document.getElementById('image-preview').innerHTML = '<i class="fas fa-image"></i><span>Preview</span>';
    document.getElementById('image-preview').classList.remove('has-image');
    document.getElementById('btn-hapus-gambar').style.display = 'none';
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

// Export globals
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
