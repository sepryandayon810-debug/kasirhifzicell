/**
 * Produk Main Controller - Fixed & Enhanced Version
 * File: js/modules/produk/produk-main.js
 */

const ProdukMain = {
    // State
    produkData: [],
    kategoriData: [],
    currentView: 'grid',
    currentPage: 1,
    itemsPerPage: 20,
    filteredData: [],
    isLoading: false,
    
    // DOM Elements cache
    elements: {},
    
    // ==========================================
    // INIT
    // ==========================================
    init: function() {
        console.log('[ProdukMain] Initializing...');
        
        this.cacheElements();
        
        if (!this.elements.container) {
            console.error('[ProdukMain] CRITICAL: Container not found!');
            return;
        }
        
        this.setupEvents();
        this.loadProduk();
        this.loadKategori();
        
        // Expose data ke global untuk module lain
        window.produkData = this.produkData;
        
        console.log('[ProdukMain] Initialized');
    },
    
    cacheElements: function() {
        this.elements = {
            container: document.getElementById('produk-main-container'),
            pagination: document.getElementById('pagination-container'),
            search: document.getElementById('search-produk'),
            viewToggle: document.getElementById('view-toggle'),
            btnTambah: document.getElementById('btn-tambah-produk'),
            btnImport: document.getElementById('btn-import-excel'),
            btnExport: document.getElementById('btn-export-excel'),
            btnStok: document.getElementById('btn-stok-masal'),
            btnKategori: document.getElementById('btn-kategori'),
            btnToggle: document.getElementById('btn-toggle-hide')
        };
        
        console.log('[ProdukMain] Elements cached:', {
            container: !!this.elements.container,
            search: !!this.elements.search
        });
    },
    
    // ==========================================
    // EVENTS
    // ==========================================
    setupEvents: function() {
        const self = this;
        
        // Search dengan debounce
        if (this.elements.search) {
            this.elements.search.addEventListener('input', this.debounce(function() {
                self.currentPage = 1;
                self.filterAndRender();
            }, 300));
        }
        
        // View toggle
        if (this.elements.viewToggle) {
            this.elements.viewToggle.addEventListener('click', function(e) {
                const btn = e.target.closest('.view-btn');
                if (!btn) return;
                
                self.currentView = btn.dataset.view;
                
                // Update active state
                self.elements.viewToggle.querySelectorAll('.view-btn').forEach(b => {
                    b.classList.toggle('active', b === btn);
                });
                
                self.filterAndRender();
            });
        }
        
        // Toolbar buttons
        this.bindButton(this.elements.btnTambah, () => this.openModal('modal-tambah-produk'));
        this.bindButton(this.elements.btnKategori, () => this.openModal('modal-kategori'));
        this.bindButton(this.elements.btnStok, () => this.openModal('modal-stok-masal'));
        this.bindButton(this.elements.btnToggle, () => this.openModal('modal-toggle'));
        
        this.bindButton(this.elements.btnImport, () => {
            this.openModal('modal-import');
        });
        
        this.bindButton(this.elements.btnExport, () => {
            this.exportToExcel();
        });
    },
    
    bindButton: function(element, callback) {
        if (element) {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                callback();
            });
        }
    },
    
    // ==========================================
    // DATA LOADING
    // ==========================================
    loadProduk: function() {
        const self = this;
        
        if (this.isLoading) return;
        this.isLoading = true;
        
        console.log('[ProdukMain] Loading produk...');
        this.showLoading();
        
        // Cek Firebase
        if (typeof firebase === 'undefined' || !firebase.database) {
            console.error('[ProdukMain] Firebase not available');
            this.showError('Firebase tidak tersedia. Cek koneksi internet.');
            this.isLoading = false;
            return;
        }
        
        firebase.database().ref('produk').once('value')
            .then(function(snapshot) {
                self.produkData = [];
                snapshot.forEach(function(child) {
                    const data = child.val();
                    // Normalize field names
                    self.produkData.push({
                        id: child.key,
                        kode: data.kode || '',
                        barcode: data.barcode || '',
                        nama: data.nama || '',
                        kategori: data.kategori || '',
                        satuan: data.satuan || 'pcs',
                        harga_modal: data.harga_modal || data.hargaModal || 0,
                        harga_jual: data.harga_jual || data.hargaJual || 0,
                        stok: data.stok || 0,
                        terjual: data.terjual || 0,
                        status: data.status || 'aktif',
                        deskripsi: data.deskripsi || '',
                        gambar: data.gambar || null,
                        ...data
                    });
                });
                
                // Update global reference
                window.produkData = self.produkData;
                
                console.log('[ProdukMain] Loaded', self.produkData.length, 'produk');
                self.filterAndRender();
                self.isLoading = false;
            })
            .catch(function(error) {
                console.error('[ProdukMain] Error loading:', error);
                self.showError('Gagal memuat data: ' + error.message);
                self.isLoading = false;
            });
    },
    
    loadKategori: function() {
        const self = this;
        
        if (typeof firebase === 'undefined') return;
        
        firebase.database().ref('kategori').once('value')
            .then(function(snapshot) {
                self.kategoriData = [];
                snapshot.forEach(function(child) {
                    self.kategoriData.push({
                        id: child.key,
                        ...child.val()
                    });
                });
                
                self.populateKategoriSelects();
            })
            .catch(function(error) {
                console.error('[ProdukMain] Error loading kategori:', error);
            });
    },
    
    populateKategoriSelects: function() {
        const selectIds = ['tambah-kategori', 'edit-kategori', 'produk-kategori', 'edit-produk-kategori'];
        
        selectIds.forEach(id => {
            const select = document.getElementById(id);
            if (!select) return;
            
            // Simpan value yang dipilih
            const currentValue = select.value;
            
            // Clear kecuali option pertama
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Tambah kategori
            this.kategoriData.forEach(k => {
                const option = document.createElement('option');
                option.value = k.id || k.nama;
                option.textContent = k.nama;
                select.appendChild(option);
            });
            
            // Restore value
            if (currentValue) select.value = currentValue;
        });
    },
    
    // ==========================================
    // UI HELPERS
    // ==========================================
    showLoading: function() {
        if (!this.elements.container) return;
        
        this.elements.container.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Memuat produk...</p>
            </div>
        `;
    },
    
    showError: function(message) {
        if (!this.elements.container) return;
        
        this.elements.container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Coba Lagi
                </button>
            </div>
        `;
    },
    
    // ==========================================
    // FILTER & RENDER
    // ==========================================
    filterAndRender: function() {
        const searchTerm = this.elements.search ? 
            this.elements.search.value.toLowerCase().trim() : '';
        
        // Filter
        this.filteredData = this.produkData.filter(p => {
            if (!searchTerm) return true;
            const nama = (p.nama || '').toLowerCase();
            const kode = (p.kode || '').toLowerCase();
            const barcode = (p.barcode || '').toLowerCase();
            return nama.includes(searchTerm) || 
                   kode.includes(searchTerm) || 
                   barcode.includes(searchTerm);
        });
        
        // Pagination
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const pageData = this.filteredData.slice(start, start + this.itemsPerPage);
        
        this.render(pageData);
        this.renderPagination(totalPages);
    },
    
    render: function(data) {
        if (data.length === 0) {
            this.renderEmpty();
            return;
        }
        
        if (this.currentView === 'grid') {
            this.renderGrid(data);
        } else {
            this.renderList(data);
        }
    },
    
    renderEmpty: function() {
        if (!this.elements.container) return;
        
        const isSearching = this.elements.search && this.elements.search.value;
        
        this.elements.container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>${isSearching ? 'Produk tidak ditemukan' : 'Tidak ada produk'}</h3>
                <p>${isSearching ? 'Coba kata kunci lain' : 'Silakan tambah produk baru'}</p>
                ${!isSearching ? `
                    <button class="btn btn-primary" onclick="TambahProduk.open()">
                        <i class="fas fa-plus"></i> Tambah Produk
                    </button>
                ` : ''}
            </div>
        `;
    },
    
    renderGrid: function(data) {
        const html = data.map((p, index) => this.createGridCard(p, index)).join('');
        
        this.elements.container.innerHTML = `
            <div class="produk-grid-container">
                ${html}
            </div>
        `;
    },
    
    createGridCard: function(p, index) {
        const kategoriNama = this.kategoriData.find(k => 
            k.id === p.kategori || k.nama === p.kategori
        )?.nama || p.kategori || '-';
        
        const stokClass = p.stok <= 0 ? 'habis' : p.stok <= 5 ? 'menipis' : '';
        const stokText = p.stok <= 0 ? 'Habis' : p.stok;
        
        const statusClass = p.status === 'nonaktif' ? 'nonaktif' : 'aktif';
        
        return `
            <div class="produk-card" data-id="${p.id}" style="animation-delay: ${index * 0.05}s">
                <div class="card-image">
                    ${p.gambar ? 
                        `<img src="${p.gambar}" alt="${this.escapeHtml(p.nama)}" loading="lazy">` :
                        `<i class="fas fa-box"></i>`
                    }
                    <span class="status-badge ${statusClass}">${p.status === 'nonaktif' ? 'Nonaktif' : 'Aktif'}</span>
                </div>
                <div class="card-content">
                    <div class="produk-kode">${p.kode || '-'}</div>
                    <div class="produk-nama" title="${this.escapeHtml(p.nama)}">${this.escapeHtml(p.nama)}</div>
                    <div class="produk-harga">${this.formatRupiah(p.harga_jual)}</div>
                    <div class="produk-meta">
                        <span class="stok ${stokClass}">Stok: ${stokText}</span>
                        <span class="kategori">${kategoriNama}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-action edit" onclick="event.stopPropagation(); EditProduk.open('${p.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="event.stopPropagation(); ProdukMain.hapusProduk('${p.id}')" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    },
    
    renderList: function(data) {
        const html = data.map((p, index) => this.createListItem(p, index)).join('');
        
        this.elements.container.innerHTML = `
            <div class="produk-list-container">
                ${html}
            </div>
        `;
    },
    
    createListItem: function(p, index) {
        const kategoriNama = this.kategoriData.find(k => 
            k.id === p.kategori || k.nama === p.kategori
        )?.nama || p.kategori || '-';
        
        const stokClass = p.stok <= 0 ? 'habis' : p.stok <= 5 ? 'menipis' : '';
        
        return `
            <div class="produk-list-item" data-id="${p.id}" style="animation-delay: ${index * 0.03}s">
                <div class="list-image">
                    ${p.gambar ? 
                        `<img src="${p.gambar}" alt="${this.escapeHtml(p.nama)}">` :
                        `<i class="fas fa-box"></i>`
                    }
                </div>
                <div class="list-info">
                    <h4>${this.escapeHtml(p.nama)}</h4>
                    <p>${p.kode || '-'} | ${kategoriNama}</p>
                </div>
                <div class="list-harga">
                    <div class="harga-jual">${this.formatRupiah(p.harga_jual)}</div>
                    <div class="harga-modal">Modal: ${this.formatRupiah(p.harga_modal)}</div>
                </div>
                <div class="list-stok">
                    <span class="badge ${stokClass}">${p.stok || 0}</span>
                </div>
                <div class="list-status">
                    <span class="badge ${p.status === 'aktif' ? 'badge-success' : 'badge-secondary'}">
                        ${p.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                    </span>
                </div>
                <div class="list-actions">
                    <button class="btn btn-sm btn-info" onclick="EditProduk.open('${p.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="ProdukMain.hapusProduk('${p.id}')" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    },
    
    renderPagination: function(totalPages) {
        if (!this.elements.pagination || totalPages <= 1) {
            if (this.elements.pagination) this.elements.pagination.innerHTML = '';
            return;
        }
        
        let html = `
            <button class="pagination-btn" onclick="ProdukMain.goToPage(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                html += `
                    <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                            onclick="ProdukMain.goToPage(${i})">${i}</button>
                `;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
        }
        
        html += `
            <button class="pagination-btn" onclick="ProdukMain.goToPage(${this.currentPage + 1})" 
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        this.elements.pagination.innerHTML = html;
    },
    
    // ==========================================
    // ACTIONS
    // ==========================================
    goToPage: function(page) {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.filterAndRender();
        
        // Scroll to top
        this.elements.container?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    
    refresh: function() {
        this.loadProduk();
    },
    
    hapusProduk: function(id) {
        const produk = this.produkData.find(p => p.id === id);
        const nama = produk ? produk.nama : 'Produk ini';
        
        if (!confirm(`Yakin ingin menghapus "${nama}"?\n\nTindakan ini tidak dapat dibatalkan.`)) {
            return;
        }
        
        showToast('⏳ Menghapus...', 'info');
        
        firebase.database().ref(`produk/${id}`).remove()
            .then(() => {
                showToast('✅ Produk berhasil dihapus', 'success');
                this.refresh();
            })
            .catch(error => {
                console.error('[ProdukMain] Error deleting:', error);
                showToast('❌ Gagal menghapus: ' + error.message, 'error');
            });
    },
    
    // ==========================================
    // EXPORT EXCEL
    // ==========================================
    exportToExcel: function() {
        if (this.produkData.length === 0) {
            showToast('❌ Tidak ada data untuk diexport', 'error');
            return;
        }
        
        console.log('[ProdukMain] Exporting', this.produkData.length, 'produk');
        
        const exportData = this.produkData.map(p => ({
            'Kode Produk': p.kode || '',
            'Barcode': p.barcode || '',
            'Nama Produk': p.nama || '',
            'Kategori': p.kategori || '',
            'Satuan': p.satuan || 'pcs',
            'Harga Modal': p.harga_modal || 0,
            'Harga Jual': p.harga_jual || 0,
            'Stok': p.stok || 0,
            'Terjual': p.terjual || 0,
            'Status': p.status || 'aktif',
            'Deskripsi': p.deskripsi || ''
        }));
        
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // Column widths
        ws['!cols'] = [
            { wch: 15 }, { wch: 15 }, { wch: 35 }, { wch: 15 },
            { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 10 },
            { wch: 10 }, { wch: 12 }, { wch: 40 }
        ];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data Produk');
        
        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Data_Produk_${dateStr}.xlsx`);
        
        showToast(`✅ ${this.produkData.length} produk berhasil diexport`, 'success');
    },
    
    // ==========================================
    // MODAL HELPERS
    // ==========================================
    openModal: function(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('active');
            document.getElementById('overlay')?.classList.add('active');
        } else {
            console.warn('[ProdukMain] Modal not found:', id);
        }
    },
    
    closeModal: function(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('active');
            document.getElementById('overlay')?.classList.remove('active');
        }
    },
    
    // ==========================================
    // UTILITIES
    // ==========================================
    debounce: function(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },
    
    formatRupiah: function(angka) {
        if (!angka) return 'Rp 0';
        return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    },
    
    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ==========================================
// GLOBAL EXPORTS
// ==========================================
window.ProdukMain = ProdukMain;

// Legacy compatibility
window.loadProduk = () => ProdukMain.loadProduk();
window.refreshProduk = () => ProdukMain.refresh();
window.exportProdukToExcel = () => ProdukMain.exportToExcel();

// Initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ProdukMain.init());
} else {
    ProdukMain.init();
}
