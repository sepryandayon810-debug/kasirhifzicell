/**
 * Produk Main Controller - WebPOS Modern
 * File: js/modules/produk/produk-main.js
 * 
 * Features:
 * - Realtime Firebase sync
 * - Grid/List view dengan animasi
 * - Search & filter
 * - Export/Import Excel
 * - Soft delete (status based)
 * - Integrasi tema modern
 */

const ProdukMain = {
    // State Management
    state: {
        produkData: [],
        kategoriData: [],
        currentView: 'grid',
        currentPage: 1,
        itemsPerPage: 20,
        filteredData: [],
        isLoading: false,
        searchQuery: '',
        selectedKategori: '',
        selectedStatus: 'all',
        selectedItems: new Set()
    },
    
    // DOM Cache
    elements: {},
    
    // Firebase Listener
    produkListener: null,
    
    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    init: function() {
        console.log('[ProdukMain] 🚀 Initializing...');
        
        this.cacheElements();
        
        if (!this.validateElements()) {
            console.error('[ProdukMain] ❌ Critical elements missing!');
            return;
        }
        
        this.setupEventListeners();
        this.initRealtimeListener();
        this.loadKategori();
        
        // Expose ke global
        window.produkData = this.state.produkData;
        window.ProdukMain = this;
        
        console.log('[ProdukMain] ✅ Ready');
    },
    
    cacheElements: function() {
        this.elements = {
            // Container
            container: document.getElementById('produk-container'),
            pagination: document.getElementById('pagination-container'),
            emptyState: document.getElementById('empty-state'),
            
            // Controls
            searchInput: document.getElementById('search-produk'),
            btnGrid: document.getElementById('view-grid'),
            btnList: document.getElementById('view-list'),
            selectKategori: document.getElementById('filter-kategori'),
            selectStatus: document.getElementById('filter-status'),
            
            // Toolbar Buttons
            btnTambah: document.getElementById('btn-tambah-produk'),
            btnImport: document.getElementById('btn-import-excel'),
            btnExport: document.getElementById('btn-export-excel'),
            btnTemplate: document.getElementById('btn-download-template'),
            btnToggle: document.getElementById('btn-toggle-produk'),
            btnKategori: document.getElementById('btn-kategori-manager'),
            btnStok: document.getElementById('btn-stok-masal'),
            btnDeleteSelected: document.getElementById('btn-delete-selected'),
            
            // Stats
            statTotal: document.getElementById('stat-total'),
            statAktif: document.getElementById('stat-aktif'),
            statNonaktif: document.getElementById('stat-nonaktif'),
            statStokHabis: document.getElementById('stat-stok-habis'),
            
            // Bulk Actions
            bulkActionBar: document.getElementById('bulk-action-bar'),
            selectedCount: document.getElementById('selected-count')
        };
    },
    
    validateElements: function() {
        const critical = ['container'];
        return critical.every(key => {
            const exists = !!this.elements[key];
            if (!exists) console.warn(`[ProdukMain] Missing element: ${key}`);
            return exists;
        });
    },
    
    // ========================================================================
    // EVENT LISTENERS
    // ========================================================================
    setupEventListeners: function() {
        const self = this;
        
        // Search dengan debounce
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', this.debounce(function(e) {
                self.state.searchQuery = e.target.value.toLowerCase().trim();
                self.state.currentPage = 1;
                self.filterAndRender();
            }, 300));
        }
        
        // Filter Kategori
        if (this.elements.selectKategori) {
            this.elements.selectKategori.addEventListener('change', function(e) {
                self.state.selectedKategori = e.target.value;
                self.state.currentPage = 1;
                self.filterAndRender();
            });
        }
        
        // Filter Status
        if (this.elements.selectStatus) {
            this.elements.selectStatus.addEventListener('change', function(e) {
                self.state.selectedStatus = e.target.value;
                self.state.currentPage = 1;
                self.filterAndRender();
            });
        }
        
        // View Toggle
        if (this.elements.btnGrid) {
            this.elements.btnGrid.addEventListener('click', () => this.setView('grid'));
        }
        if (this.elements.btnList) {
            this.elements.btnList.addEventListener('click', () => this.setView('list'));
        }
        
        // Toolbar Actions
        this.bindSafe(this.elements.btnTambah, () => this.openModal('modal-tambah-produk'));
        this.bindSafe(this.elements.btnImport, () => this.openModal('modal-import'));
        this.bindSafe(this.elements.btnToggle, () => this.openModal('modal-toggle'));
        this.bindSafe(this.elements.btnKategori, () => this.openModal('modal-kategori'));
        this.bindSafe(this.elements.btnStok, () => this.openModal('modal-stok'));
        this.bindSafe(this.elements.btnDeleteSelected, () => this.deleteSelected());
        
        this.bindSafe(this.elements.btnExport, () => this.exportToExcel());
        this.bindSafe(this.elements.btnTemplate, () => this.downloadTemplate());
    },
    
    bindSafe: function(element, callback) {
        if (element) {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                callback();
            });
        }
    },
    
    setView: function(view) {
        this.state.currentView = view;
        
        // Update button states dengan animasi
        if (this.elements.btnGrid) {
            this.elements.btnGrid.classList.toggle('active', view === 'grid');
        }
        if (this.elements.btnList) {
            this.elements.btnList.classList.toggle('active', view === 'list');
        }
        
        // Simpan preference
        localStorage.setItem('produk_view_preference', view);
        
        this.filterAndRender();
    },
    
    // ========================================================================
    // REALTIME DATA
    // ========================================================================
    initRealtimeListener: function() {
        const self = this;
        
        if (typeof firebase === 'undefined' || !firebase.database) {
            console.error('[ProdukMain] Firebase not available');
            this.showError('Koneksi database gagal');
            return;
        }
        
        // Cleanup listener lama
        if (this.produkListener) {
            this.produkListener.off();
        }
        
        this.showLoading();
        
        this.produkListener = firebase.database().ref('produk');
        
        this.produkListener.on('value', function(snapshot) {
            const data = [];
            snapshot.forEach(function(child) {
                const val = child.val();
                // Normalize data structure
                data.push({
                    id: child.key,
                    kode: val.kode || '',
                    barcode: val.barcode || '',
                    nama: val.nama || '',
                    kategori: val.kategori || '',
                    satuan: val.satuan || 'pcs',
                    harga_modal: parseInt(val.harga_modal || val.hargaModal || 0),
                    harga_jual: parseInt(val.harga_jual || val.hargaJual || 0),
                    stok: parseInt(val.stok || 0),
                    min_stok: parseInt(val.min_stok || 5),
                    terjual: parseInt(val.terjual || 0),
                    status: val.status || 'aktif',
                    deskripsi: val.deskripsi || '',
                    gambar: val.gambar || null,
                    created_at: val.created_at || Date.now(),
                    updated_at: val.updated_at || Date.now()
                });
            });
            
            self.state.produkData = data;
            window.produkData = data; // Global access
            
            console.log('[ProdukMain] 📊 Realtime update:', data.length, 'produk');
            
            self.updateStats();
            self.filterAndRender();
            
        }, function(error) {
            console.error('[ProdukMain] ❌ Firebase error:', error);
            self.showError('Gagal memuat data produk');
        });
    },
    
    loadKategori: function() {
        const self = this;
        
        if (typeof firebase === 'undefined') return;
        
        firebase.database().ref('kategori').once('value')
            .then(function(snapshot) {
                const data = [];
                snapshot.forEach(function(child) {
                    data.push({
                        id: child.key,
                        ...child.val()
                    });
                });
                self.state.kategoriData = data;
                self.populateKategoriFilter();
            });
    },
    
    populateKategoriFilter: function() {
        const select = this.elements.selectKategori;
        if (!select) return;
        
        const currentValue = select.value;
        
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        this.state.kategoriData.forEach(k => {
            const option = document.createElement('option');
            option.value = k.id || k.nama;
            option.textContent = k.nama;
            select.appendChild(option);
        });
        
        if (currentValue) select.value = currentValue;
    },
    
    // ========================================================================
    // STATS UPDATE
    // ========================================================================
    updateStats: function() {
        const data = this.state.produkData;
        
        const stats = {
            total: data.length,
            aktif: data.filter(p => p.status === 'aktif').length,
            nonaktif: data.filter(p => p.status === 'nonaktif').length,
            stokHabis: data.filter(p => p.stok <= 0 && p.status === 'aktif').length,
            stokMenipis: data.filter(p => p.stok > 0 && p.stok <= p.min_stok && p.status === 'aktif').length
        };
        
        this.updateStatElement(this.elements.statTotal, stats.total);
        this.updateStatElement(this.elements.statAktif, stats.aktif);
        this.updateStatElement(this.elements.statNonaktif, stats.nonaktif);
        this.updateStatElement(this.elements.statStokHabis, stats.stokHabis, stats.stokHabis > 0 ? 'danger' : '');
    },
    
    updateStatElement: function(element, value, type = '') {
        if (!element) return;
        
        const valueEl = element.querySelector('.stat-value') || element;
        const oldValue = parseInt(valueEl.textContent.replace(/\D/g, '')) || 0;
        
        this.animateNumber(valueEl, oldValue, value);
        
        if (type === 'danger') {
            element.classList.add('stat-danger');
        } else {
            element.classList.remove('stat-danger');
        }
    },
    
    animateNumber: function(element, start, end) {
        const duration = 500;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (end - start) * easeProgress);
            
            element.textContent = current.toLocaleString('id-ID');
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    // ========================================================================
    // FILTER & RENDER
    // ========================================================================
    filterAndRender: function() {
        let data = [...this.state.produkData];
        
        // Filter search
        if (this.state.searchQuery) {
            const q = this.state.searchQuery;
            data = data.filter(p => 
                (p.nama || '').toLowerCase().includes(q) ||
                (p.kode || '').toLowerCase().includes(q) ||
                (p.barcode || '').includes(q)
            );
        }
        
        // Filter kategori
        if (this.state.selectedKategori) {
            data = data.filter(p => p.kategori === this.state.selectedKategori);
        }
        
        // Filter status
        if (this.state.selectedStatus !== 'all') {
            data = data.filter(p => p.status === this.state.selectedStatus);
        }
        
        this.state.filteredData = data;
        
        // Pagination
        const totalPages = Math.ceil(data.length / this.state.itemsPerPage);
        const start = (this.state.currentPage - 1) * this.state.itemsPerPage;
        const pageData = data.slice(start, start + this.state.itemsPerPage);
        
        this.render(pageData);
        this.renderPagination(totalPages);
        this.updateBulkActionBar();
    },
    
    render: function(data) {
        if (data.length === 0) {
            this.renderEmpty();
            return;
        }
        
        if (this.state.currentView === 'grid') {
            this.renderGrid(data);
        } else {
            this.renderList(data);
        }
    },
    
    renderEmpty: function() {
        const isSearching = this.state.searchQuery !== '';
        
        this.elements.container.innerHTML = `
            <div class="empty-state-produk">
                <div class="empty-icon">
                    <i class="fas ${isSearching ? 'fa-search' : 'fa-box-open'}"></i>
                </div>
                <h3>${isSearching ? 'Produk tidak ditemukan' : 'Belum ada produk'}</h3>
                <p>${isSearching ? 'Coba kata kunci lain atau reset filter' : 'Mulai tambah produk pertama Anda'}</p>
                ${!isSearching ? `
                    <button class="btn btn-primary btn-lg" onclick="ProdukMain.openModal('modal-tambah-produk')">
                        <i class="fas fa-plus"></i> Tambah Produk
                    </button>
                ` : `
                    <button class="btn btn-secondary" onclick="ProdukMain.resetFilters()">
                        <i class="fas fa-undo"></i> Reset Filter
                    </button>
                `}
            </div>
        `;
        
        if (this.elements.pagination) {
            this.elements.pagination.innerHTML = '';
        }
    },
    
    renderGrid: function(data) {
        const html = data.map((p, index) => this.createGridCard(p, index)).join('');
        
        this.elements.container.innerHTML = `
            <div class="produk-grid-modern">
                ${html}
            </div>
        `;
    },
    
    createGridCard: function(p, index) {
        const kategoriNama = this.getKategoriName(p.kategori);
        const stokClass = this.getStokClass(p.stok, p.min_stok);
        const stokBadge = this.getStokBadge(p.stok, p.satuan, p.min_stok);
        const isInactive = p.status === 'nonaktif';
        const isSelected = this.state.selectedItems.has(p.id);
        
        return `
            <div class="produk-card-modern ${isInactive ? 'inactive' : ''} ${isSelected ? 'selected' : ''}" 
                 data-id="${p.id}" 
                 style="animation: fadeInUp 0.5s ease ${index * 0.05}s both">
                
                <div class="card-checkbox">
                    <input type="checkbox" class="item-checkbox" 
                           ${isSelected ? 'checked' : ''} 
                           onchange="ProdukMain.toggleSelect('${p.id}')"
                           onclick="event.stopPropagation()">
                </div>
                
                <div class="card-image-wrapper" onclick="ProdukMain.quickView('${p.id}')">
                    ${p.gambar ? 
                        `<img src="${p.gambar}" alt="${this.escapeHtml(p.nama)}" loading="lazy">` :
                        `<div class="image-placeholder"><i class="fas fa-box"></i></div>`
                    }
                    <div class="card-badges">
                        ${stokBadge}
                        ${isInactive ? '<span class="badge-status nonaktif">Nonaktif</span>' : ''}
                    </div>
                    <div class="card-overlay">
                        <button class="btn-quick-view" title="Lihat Detail">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                
                <div class="card-content" onclick="ProdukMain.quickView('${p.id}')">
                    <div class="produk-meta-top">
                        <span class="produk-kode">${p.kode || '-'}</span>
                        <span class="produk-kategori">${kategoriNama}</span>
                    </div>
                    
                    <h4 class="produk-nama" title="${this.escapeHtml(p.nama)}">${this.escapeHtml(p.nama)}</h4>
                    
                    <div class="produk-harga-wrapper">
                        <div class="harga-jual">${this.formatRupiah(p.harga_jual)}</div>
                        <div class="harga-modal">Modal: ${this.formatRupiah(p.harga_modal)}</div>
                    </div>
                    
                    <div class="produk-stat">
                        <span class="stat-item ${stokClass}">
                            <i class="fas fa-cubes"></i> ${p.stok} ${p.satuan}
                        </span>
                        <span class="stat-item">
                            <i class="fas fa-shopping-cart"></i> ${p.terjual || 0} terjual
                        </span>
                    </div>
                </div>
                
                <div class="card-actions">
                    <button class="btn-action-card edit" onclick="event.stopPropagation(); EditProduk.open('${p.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action-card toggle ${isInactive ? 'activate' : 'deactivate'}" 
                            onclick="event.stopPropagation(); ProdukMain.toggleStatus('${p.id}', '${isInactive ? 'aktif' : 'nonaktif'}')" 
                            title="${isInactive ? 'Aktifkan' : 'Nonaktifkan'}">
                        <i class="fas ${isInactive ? 'fa-eye' : 'fa-eye-slash'}"></i>
                    </button>
                    <button class="btn-action-card delete" onclick="event.stopPropagation(); ProdukMain.deleteProduk('${p.id}')" title="Hapus">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    },
    
    renderList: function(data) {
        const rows = data.map((p, index) => this.createListRow(p, index)).join('');
        
        this.elements.container.innerHTML = `
            <div class="produk-table-container">
                <table class="produk-data-table">
                    <thead>
                        <tr>
                            <th class="col-checkbox">
                                <input type="checkbox" id="check-all" onchange="ProdukMain.toggleSelectAll(this)">
                            </th>
                            <th class="col-gambar">Gambar</th>
                            <th class="col-info">Produk</th>
                            <th class="col-kategori">Kategori</th>
                            <th class="col-harga">Harga</th>
                            <th class="col-stok">Stok</th>
                            <th class="col-status">Status</th>
                            <th class="col-aksi">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    },
    
    createListRow: function(p, index) {
        const kategoriNama = this.getKategoriName(p.kategori);
        const stokClass = this.getStokClass(p.stok, p.min_stok);
        const isSelected = this.state.selectedItems.has(p.id);
        
        return `
            <tr class="produk-row ${p.status === 'nonaktif' ? 'row-inactive' : ''} ${isSelected ? 'row-selected' : ''}" 
                data-id="${p.id}"
                style="animation: fadeIn 0.3s ease ${index * 0.03}s both">
                
                <td class="col-checkbox">
                    <input type="checkbox" class="row-checkbox" value="${p.id}" 
                           ${isSelected ? 'checked' : ''}
                           onchange="ProdukMain.toggleSelect('${p.id}')">
                </td>
                
                <td class="col-gambar">
                    <div class="table-thumb" onclick="ProdukMain.quickView('${p.id}')">
                        ${p.gambar ? 
                            `<img src="${p.gambar}" alt="">` :
                            `<i class="fas fa-box"></i>`
                        }
                    </div>
                </td>
                
                <td class="col-info">
                    <div class="info-wrapper" onclick="ProdukMain.quickView('${p.id}')">
                        <strong class="info-nama">${this.escapeHtml(p.nama)}</strong>
                        <span class="info-kode">${p.kode || '-'} | ${p.barcode || '-'}</span>
                    </div>
                </td>
                
                <td class="col-kategori">
                    <span class="badge-kategori">${kategoriNama}</span>
                </td>
                
                <td class="col-harga">
                    <div class="harga-wrapper">
                        <span class="harga-jual">${this.formatRupiah(p.harga_jual)}</span>
                        <span class="harga-modal">${this.formatRupiah(p.harga_modal)}</span>
                    </div>
                </td>
                
                <td class="col-stok">
                    <span class="stok-badge-table ${stokClass}">${p.stok} ${p.satuan}</span>
                </td>
                
                <td class="col-status">
                    <span class="status-pill ${p.status}">
                        ${p.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                    </span>
                </td>
                
                <td class="col-aksi">
                    <div class="action-group">
                        <button class="btn-icon-sm edit" onclick="EditProduk.open('${p.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon-sm toggle" onclick="ProdukMain.toggleStatus('${p.id}', '${p.status === 'aktif' ? 'nonaktif' : 'aktif'}')" title="Toggle">
                            <i class="fas ${p.status === 'aktif' ? 'fa-eye-slash' : 'fa-eye'}"></i>
                        </button>
                        <button class="btn-icon-sm delete" onclick="ProdukMain.deleteProduk('${p.id}')" title="Hapus">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },
    
    renderPagination: function(totalPages) {
        if (!this.elements.pagination) return;
        
        if (totalPages <= 1) {
            this.elements.pagination.innerHTML = '';
            return;
        }
        
        let html = '';
        const current = this.state.currentPage;
        
        html += `
            <button class="pagination-btn" onclick="ProdukMain.goToPage(${current - 1})" 
                    ${current === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
                html += `
                    <button class="pagination-btn ${i === current ? 'active' : ''}" 
                            onclick="ProdukMain.goToPage(${i})">${i}</button>
                `;
            } else if (i === current - 2 || i === current + 2) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
        }
        
        html += `
            <button class="pagination-btn" onclick="ProdukMain.goToPage(${current + 1})" 
                    ${current === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        this.elements.pagination.innerHTML = html;
    },
    
    // ========================================================================
    // BULK ACTIONS
    // ========================================================================
    toggleSelect: function(id) {
        if (this.state.selectedItems.has(id)) {
            this.state.selectedItems.delete(id);
        } else {
            this.state.selectedItems.add(id);
        }
        this.updateBulkActionBar();
        this.refreshSelectionUI();
    },
    
    toggleSelectAll: function(checkbox) {
        const checkboxes = document.querySelectorAll('.row-checkbox, .item-checkbox');
        const isChecked = checkbox.checked;
        
        if (isChecked) {
            this.state.filteredData.forEach(p => this.state.selectedItems.add(p.id));
        } else {
            this.state.selectedItems.clear();
        }
        
        checkboxes.forEach(cb => cb.checked = isChecked);
        this.updateBulkActionBar();
        this.refreshSelectionUI();
    },
    
    refreshSelectionUI: function() {
        // Update card/row selection state
        document.querySelectorAll('.produk-card-modern, .produk-row').forEach(el => {
            const id = el.dataset.id;
            el.classList.toggle('selected', this.state.selectedItems.has(id));
        });
    },
    
    updateBulkActionBar: function() {
        if (!this.elements.bulkActionBar) return;
        
        const count = this.state.selectedItems.size;
        if (count > 0) {
            this.elements.bulkActionBar.classList.add('active');
            if (this.elements.selectedCount) {
                this.elements.selectedCount.textContent = `${count} item dipilih`;
            }
        } else {
            this.elements.bulkActionBar.classList.remove('active');
        }
    },
    
    deleteSelected: function() {
        const count = this.state.selectedItems.size;
        if (count === 0) return;
        
        if (!confirm(`Yakin hapus ${count} produk yang dipilih?`)) return;
        
        const promises = [];
        this.state.selectedItems.forEach(id => {
            promises.push(firebase.database().ref(`produk/${id}`).remove());
        });
        
        Promise.all(promises)
            .then(() => {
                showToast(`✅ ${count} produk dihapus`, 'success');
                this.state.selectedItems.clear();
                this.updateBulkActionBar();
            })
            .catch(err => {
                showToast('❌ Gagal menghapus: ' + err.message, 'error');
            });
    },
    
    // ========================================================================
    // ACTIONS
    // ========================================================================
    goToPage: function(page) {
        const totalPages = Math.ceil(this.state.filteredData.length / this.state.itemsPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.state.currentPage = page;
        this.filterAndRender();
        this.elements.container?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    
    resetFilters: function() {
        this.state.searchQuery = '';
        this.state.selectedKategori = '';
        this.state.selectedStatus = 'all';
        this.state.currentPage = 1;
        
        if (this.elements.searchInput) this.elements.searchInput.value = '';
        if (this.elements.selectKategori) this.elements.selectKategori.value = '';
        if (this.elements.selectStatus) this.elements.selectStatus.value = 'all';
        
        this.filterAndRender();
    },
    
    toggleStatus: function(id, newStatus) {
        const produk = this.state.produkData.find(p => p.id === id);
        const nama = produk ? produk.nama : 'Produk';
        
        firebase.database().ref(`produk/${id}`).update({
            status: newStatus,
            updated_at: Date.now()
        }).then(() => {
            showToast(`${nama} di${newStatus === 'aktif' ? 'aktifkan' : 'nonaktifkan'}`, 'success');
        }).catch(err => {
            showToast('Gagal mengubah status: ' + err.message, 'error');
        });
    },
    
    deleteProduk: function(id) {
        const produk = this.state.produkData.find(p => p.id === id);
        if (!produk) return;
        
        if (!confirm(`Yakin hapus "${produk.nama}"?\n\nProduk akan dihapus permanen.`)) {
            return;
        }
        
        showToast('⏳ Menghapus...', 'info');
        
        firebase.database().ref(`produk/${id}`).remove()
            .then(() => {
                showToast('✅ Produk dihapus', 'success');
            })
            .catch(err => {
                showToast('❌ Gagal menghapus: ' + err.message, 'error');
            });
    },
    
    quickView: function(id) {
        const produk = this.state.produkData.find(p => p.id === id);
        if (!produk) return;
        
        // Buka modal detail
        if (window.DetailProduk) {
            window.DetailProduk.open(produk);
        } else {
            console.log('[ProdukMain] DetailProduk not available', produk);
        }
    },
    
    // ========================================================================
    // EXPORT/IMPORT
    // ========================================================================
    exportToExcel: function() {
        const data = this.state.filteredData.length > 0 ? this.state.filteredData : this.state.produkData;
        
        if (data.length === 0) {
            showToast('❌ Tidak ada data untuk diexport', 'error');
            return;
        }
        
        const exportData = data.map(p => ({
            'Kode': p.kode,
            'Barcode': p.barcode,
            'Nama Produk': p.nama,
            'Kategori': this.getKategoriName(p.kategori),
            'Satuan': p.satuan,
            'Harga Modal': p.harga_modal,
            'Harga Jual': p.harga_jual,
            'Stok': p.stok,
            'Min Stok': p.min_stok,
            'Terjual': p.terjual,
            'Status': p.status,
            'Deskripsi': p.deskripsi
        }));
        
        const ws = XLSX.utils.json_to_sheet(exportData);
        ws['!cols'] = [
            {wch:15}, {wch:15}, {wch:35}, {wch:15}, {wch:10},
            {wch:15}, {wch:15}, {wch:10}, {wch:10}, {wch:10}, {wch:12}, {wch:40}
        ];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data Produk');
        
        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Data_Produk_${dateStr}.xlsx`);
        
        showToast(`✅ ${data.length} produk diexport`, 'success');
    },
    
    downloadTemplate: function() {
        const template = [{
            'Kode': 'PRD-001',
            'Barcode': '8991234567890',
            'Nama Produk': 'Contoh Produk',
            'Kategori': 'IPHONE',
            'Satuan': 'pcs',
            'Harga Modal': 50000,
            'Harga Jual': 75000,
            'Stok': 100,
            'Min Stok': 5,
            'Terjual': 0,
            'Status': 'aktif',
            'Deskripsi': 'Deskripsi opsional'
        }];
        
        const ws = XLSX.utils.json_to_sheet(template);
        ws['!cols'] = [
            {wch:15}, {wch:15}, {wch:35}, {wch:15}, {wch:10},
            {wch:15}, {wch:15}, {wch:10}, {wch:10}, {wch:10}, {wch:12}, {wch:40}
        ];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'Template_Import_Produk.xlsx');
        
        showToast('✅ Template diunduh', 'success');
    },
    
    // ========================================================================
    // MODAL HELPERS
    // ========================================================================
    openModal: function(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },
    
    closeModal: function(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },
    
    // ========================================================================
    // UI HELPERS
    // ========================================================================
    showLoading: function() {
        if (!this.elements.container) return;
        this.elements.container.innerHTML = `
            <div class="loading-state-produk">
                <div class="spinner-modern"></div>
                <p>Memuat produk...</p>
            </div>
        `;
    },
    
    showError: function(message) {
        if (!this.elements.container) return;
        this.elements.container.innerHTML = `
            <div class="error-state-produk">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Coba Lagi
                </button>
            </div>
        `;
    },
    
    // ========================================================================
    // UTILITIES
    // ========================================================================
    getKategoriName: function(kategoriId) {
        const k = this.state.kategoriData.find(k => k.id === kategoriId || k.nama === kategoriId);
        return k ? k.nama : (kategoriId || '-');
    },
    
    getStokClass: function(stok, minStok = 5) {
        if (stok <= 0) return 'habis';
        if (stok <= minStok) return 'menipis';
        return 'normal';
    },
    
    getStokBadge: function(stok, satuan, minStok = 5) {
        if (stok <= 0) {
            return '<span class="badge-stok habis">Stok Habis</span>';
        }
        if (stok <= minStok) {
            return `<span class="badge-stok menipis">Sisa ${stok} ${satuan}</span>`;
        }
        return '';
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
    },
    
    debounce: function(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },
    
    // Cleanup
    destroy: function() {
        if (this.produkListener) {
            this.produkListener.off();
        }
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Restore view preference
    const savedView = localStorage.getItem('produk_view_preference') || 'grid';
    ProdukMain.state.currentView = savedView;
    ProdukMain.init();
});
