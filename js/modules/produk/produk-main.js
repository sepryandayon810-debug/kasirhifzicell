/**
 * WebPOS Produk Main Module v2.0
 * Features: CRUD, category filter, search, bulk actions, import/export
 */

const ProdukMain = (function() {
    'use strict';
    
    // State
    const state = {
        produk: [],
        kategori: [],
        selectedIds: new Set(),
        filter: {
            kategori: '',
            status: 'all',
            search: '',
            view: 'grid'
        },
        pagination: {
            currentPage: 1,
            itemsPerPage: 20,
            totalPages: 1
        },
        isLoading: false
    };
    
    // DOM Elements
    let elements = {};
    
    // Initialize
    function init() {
        cacheElements();
        if (!elements.container) {
            console.warn('ProdukMain: Container not found');
            return;
        }
        
        loadKategori();
        loadProduk();
        bindEvents();
        setupRealtimeListener();
        
        // Restore view preference
        const savedView = localStorage.getItem('produk-view-mode') || 'grid';
        setView(savedView);
        
        console.log('ProdukMain initialized');
    }
    
    // Cache DOM elements
    function cacheElements() {
        elements = {
            container: document.getElementById('produk-container'),
            searchInput: document.getElementById('search-produk'),
            kategoriSelect: document.getElementById('filter-kategori'),
            kategoriChips: document.getElementById('kategori-chips'),
            statusSelect: document.getElementById('filter-status'),
            viewGrid: document.getElementById('view-grid'),
            viewList: document.getElementById('view-list'),
            btnTambah: document.getElementById('btn-tambah-produk'),
            bulkBar: document.getElementById('bulk-action-bar'),
            selectedCount: document.getElementById('selected-count'),
            pagination: document.getElementById('pagination-container'),
            stats: {
                total: document.getElementById('stat-total'),
                aktif: document.getElementById('stat-aktif'),
                nonaktif: document.getElementById('stat-nonaktif'),
                stokHabis: document.getElementById('stat-stok-habis')
            }
        };
    }
    
    // Load Kategori
    function loadKategori() {
        const kategoriRef = firebase.database().ref('kategori');
        
        kategoriRef.once('value', (snapshot) => {
            state.kategori = [];
            const data = snapshot.val();
            
            if (data) {
                Object.keys(data).forEach(key => {
                    state.kategori.push({
                        id: key,
                        nama: data[key].nama || 'Tanpa Nama',
                        icon: data[key].icon || 'fa-tag'
                    });
                });
            }
            
            renderKategoriOptions();
            renderKategoriChips();
        });
    }
    
    // Render Dropdown Kategori
    function renderKategoriOptions() {
        if (!elements.kategoriSelect) return;
        
        let html = '<option value="">Semua Kategori</option>';
        state.kategori.forEach(kat => {
            html += `<option value="${kat.id}">${kat.nama}</option>`;
        });
        
        elements.kategoriSelect.innerHTML = html;
    }
    
    // Render Kategori Chips
    function renderKategoriChips() {
        if (!elements.kategoriChips) return;
        
        let html = `
            <button class="kategori-chip ${state.filter.kategori === '' ? 'active' : ''}" data-kategori="">
                <i class="fas fa-th-large"></i>
                <span>Semua</span>
            </button>
        `;
        
        state.kategori.forEach(kat => {
            html += `
                <button class="kategori-chip ${state.filter.kategori === kat.id ? 'active' : ''}" 
                        data-kategori="${kat.id}">
                    <i class="fas ${kat.icon}"></i>
                    <span>${kat.nama}</span>
                </button>
            `;
        });
        
        elements.kategoriChips.innerHTML = html;
        
        // Bind events
        elements.kategoriChips.querySelectorAll('.kategori-chip').forEach(chip => {
            chip.addEventListener('click', function() {
                setKategoriFilter(this.dataset.kategori);
            });
        });
    }
    
    // Set Kategori Filter
    function setKategoriFilter(kategoriId) {
        state.filter.kategori = kategoriId;
        state.pagination.currentPage = 1;
        
        if (elements.kategoriSelect) {
            elements.kategoriSelect.value = kategoriId;
        }
        
        document.querySelectorAll('.kategori-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.kategori === kategoriId);
        });
        
        filterAndRender();
    }
    
    // Load Produk
    function loadProduk() {
        state.isLoading = true;
        showLoading();
        
        const produkRef = firebase.database().ref('produk');
        
        produkRef.once('value', (snapshot) => {
            state.produk = [];
            const data = snapshot.val();
            
            if (data) {
                Object.keys(data).forEach(key => {
                    state.produk.push({
                        id: key,
                        nama: data[key].nama || 'Tanpa Nama',
                        kode: data[key].kode || '',
                        barcode: data[key].barcode || '',
                        hargaJual: parseInt(data[key].hargaJual) || 0,
                        hargaModal: parseInt(data[key].hargaModal) || 0,
                        stok: parseInt(data[key].stok) || 0,
                        kategoriId: data[key].kategoriId || 'umum',
                        status: data[key].status || 'aktif',
                        gambar: data[key].gambar || null,
                        satuan: data[key].satuan || 'pcs',
                        minStok: parseInt(data[key].minStok) || 5,
                        createdAt: data[key].createdAt || Date.now()
                    });
                });
            }
            
            state.isLoading = false;
            updateStats();
            filterAndRender();
            
        }).catch(err => {
            console.error('Error loading produk:', err);
            showError('Gagal memuat produk');
        });
    }
    
    // Update Statistics
    function updateStats() {
        const total = state.produk.length;
        const aktif = state.produk.filter(p => p.status === 'aktif').length;
        const nonaktif = state.produk.filter(p => p.status === 'nonaktif').length;
        const stokHabis = state.produk.filter(p => p.stok <= 0 && p.status === 'aktif').length;
        
        if (elements.stats.total) elements.stats.total.textContent = total;
        if (elements.stats.aktif) elements.stats.aktif.textContent = aktif;
        if (elements.stats.nonaktif) elements.stats.nonaktif.textContent = nonaktif;
        if (elements.stats.stokHabis) elements.stats.stokHabis.textContent = stokHabis;
    }
    
    // Filter dan Render
    function filterAndRender() {
        let filtered = [...state.produk];
        
        // Filter kategori
        if (state.filter.kategori) {
            filtered = filtered.filter(p => p.kategoriId === state.filter.kategori);
        }
        
        // Filter status
        if (state.filter.status !== 'all') {
            filtered = filtered.filter(p => p.status === state.filter.status);
        }
        
        // Filter search
        if (state.filter.search) {
            const searchLower = state.filter.search.toLowerCase().trim();
            filtered = filtered.filter(p => 
                p.nama.toLowerCase().includes(searchLower) ||
                p.kode.toLowerCase().includes(searchLower) ||
                p.barcode.toLowerCase().includes(searchLower)
            );
        }
        
        // Sort by nama
        filtered.sort((a, b) => a.nama.localeCompare(b.nama));
        
        // Pagination
        state.pagination.totalPages = Math.ceil(filtered.length / state.pagination.itemsPerPage) || 1;
        
        const start = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
        const paginated = filtered.slice(start, start + state.pagination.itemsPerPage);
        
        renderProduk(paginated);
        renderPagination(filtered.length);
        updateBulkBar();
    }
    
    // Show Loading
    function showLoading() {
        if (!elements.container) return;
        elements.container.innerHTML = `
            <div class="loading-produk">
                <div class="spinner"></div>
                <p>Memuat produk...</p>
            </div>
        `;
    }
    
    // Show Error
    function showError(message) {
        if (!elements.container) return;
        elements.container.innerHTML = `
            <div class="empty-state error">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
                <button onclick="ProdukMain.refresh()" class="btn-retry">
                    <i class="fas fa-redo"></i> Coba Lagi
                </button>
            </div>
        `;
    }
    
    // Render Produk
    function renderProduk(produkList) {
        if (!elements.container) return;
        
        if (produkList.length === 0) {
            elements.container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>Tidak ada produk</p>
                    <span>${state.filter.search ? 'Coba kata kunci lain' : 'Belum ada produk'}</span>
                </div>
            `;
            return;
        }
        
        const isGrid = state.filter.view === 'grid';
        elements.container.className = `produk-grid-container ${isGrid ? 'grid-view' : 'list-view'}`;
        
        let html = '';
        
        produkList.forEach((produk, index) => {
            if (isGrid) {
                html += renderGridItem(produk, index);
            } else {
                html += renderListItem(produk, index);
            }
        });
        
        elements.container.innerHTML = html;
        bindProdukEvents();
    }
    
    // Render Grid Item
    function renderGridItem(produk, index) {
        const stok = produk.stok || 0;
        const stokClass = stok <= 0 ? 'empty' : stok <= produk.minStok ? 'low' : 'high';
        const isSelected = state.selectedIds.has(produk.id);
        const isNonaktif = produk.status === 'nonaktif';
        
        const kategori = state.kategori.find(k => k.id === produk.kategoriId);
        const kategoriNama = kategori ? kategori.nama : 'Umum';
        
        return `
            <div class="produk-card-modern ${isNonaktif ? 'nonaktif' : ''} ${isSelected ? 'selected' : ''}" 
                 data-id="${produk.id}"
                 style="animation: fadeIn 0.3s ease ${index * 0.05}s both;">
                <div class="card-checkbox">
                    <input type="checkbox" class="select-item" data-id="${produk.id}" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="produk-image-modern">
                    ${produk.gambar ? 
                        `<img src="${produk.gambar}" alt="${produk.nama}" loading="lazy">` : 
                        `<i class="fas fa-box"></i>`
                    }
                    <span class="stok-badge ${stokClass}">${stok}</span>
                    ${isNonaktif ? '<span class="status-badge">Nonaktif</span>' : ''}
                </div>
                <div class="produk-info-modern">
                    <h4 class="produk-nama-modern">${produk.nama}</h4>
                    <p class="produk-kategori-modern">${kategoriNama}</p>
                    <div class="produk-price-modern">
                        <span class="harga-jual">Rp ${formatRupiah(produk.hargaJual)}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-action edit" data-id="${produk.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" data-id="${produk.id}" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    // Render List Item
    function renderListItem(produk, index) {
        const stok = produk.stok || 0;
        const isSelected = state.selectedIds.has(produk.id);
        const isNonaktif = produk.status === 'nonaktif';
        
        const kategori = state.kategori.find(k => k.id === produk.kategoriId);
        const kategoriNama = kategori ? kategori.nama : 'Umum';
        
        return `
            <div class="produk-list-item-modern ${isNonaktif ? 'nonaktif' : ''} ${isSelected ? 'selected' : ''}"
                 data-id="${produk.id}"
                 style="animation: slideInRight 0.3s ease ${index * 0.03}s both;">
                <div class="list-checkbox">
                    <input type="checkbox" class="select-item" data-id="${produk.id}" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="list-image">
                    ${produk.gambar ? 
                        `<img src="${produk.gambar}" alt="${produk.nama}" loading="lazy">` : 
                        `<i class="fas fa-box"></i>`
                    }
                </div>
                <div class="list-info">
                    <h4>${produk.nama}</h4>
                    <p>
                        <span class="badge-kategori">${kategoriNama}</span>
                        <span class="badge-stok ${stok <= 0 ? 'danger' : stok <= 5 ? 'warning' : 'success'}">
                            Stok: ${stok}
                        </span>
                        ${isNonaktif ? '<span class="badge-status">Nonaktif</span>' : ''}
                    </p>
                </div>
                <div class="list-price">
                    <span class="price-jual">Rp ${formatRupiah(produk.hargaJual)}</span>
                    <span class="price-modal">Rp ${formatRupiah(produk.hargaModal)}</span>
                </div>
                <div class="list-actions">
                    <button class="btn-icon-action edit" data-id="${produk.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon-action delete" data-id="${produk.id}" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    // Render Pagination
    function renderPagination(totalItems) {
        if (!elements.pagination) return;
        
        const totalPages = state.pagination.totalPages;
        const current = state.pagination.currentPage;
        
        if (totalPages <= 1) {
            elements.pagination.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // Prev
        html += `<button class="page-btn ${current === 1 ? 'disabled' : ''}" onclick="ProdukMain.goToPage(${current - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>`;
        
        // Pages
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
                html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="ProdukMain.goToPage(${i})">${i}</button>`;
            } else if (i === current - 2 || i === current + 2) {
                html += `<span class="page-dots">...</span>`;
            }
        }
        
        // Next
        html += `<button class="page-btn ${current === totalPages ? 'disabled' : ''}" onclick="ProdukMain.goToPage(${current + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>`;
        
        elements.pagination.innerHTML = html;
    }
    
    // Bind Events
    function bindEvents() {
        // Search
        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', debounce(function() {
                state.filter.search = this.value;
                state.pagination.currentPage = 1;
                filterAndRender();
            }, 300));
        }
        
        // Kategori Select
        if (elements.kategoriSelect) {
            elements.kategoriSelect.addEventListener('change', function() {
                setKategoriFilter(this.value);
            });
        }
        
        // Status Select
        if (elements.statusSelect) {
            elements.statusSelect.addEventListener('change', function() {
                state.filter.status = this.value;
                state.pagination.currentPage = 1;
                filterAndRender();
            });
        }
        
        // View Toggle
        if (elements.viewGrid) {
            elements.viewGrid.addEventListener('click', () => setView('grid'));
        }
        if (elements.viewList) {
            elements.viewList.addEventListener('click', () => setView('list'));
        }
        
        // Form Tambah Produk
        const formTambah = document.getElementById('form-tambah-produk');
        if (formTambah) {
            formTambah.addEventListener('submit', handleTambahProduk);
        }
        
        // Bulk Actions
        document.getElementById('btn-delete-selected')?.addEventListener('click', deleteSelected);
    }
    
    // Bind Produk Item Events
    function bindProdukEvents() {
        // Checkbox selection
        document.querySelectorAll('.select-item').forEach(cb => {
            cb.addEventListener('change', function() {
                const id = this.dataset.id;
                if (this.checked) {
                    state.selectedIds.add(id);
                } else {
                    state.selectedIds.delete(id);
                }
                updateBulkBar();
            });
        });
        
        // Edit buttons
        document.querySelectorAll('.btn-action.edit, .btn-icon-action.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                editProduk(btn.dataset.id);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.btn-action.delete, .btn-icon-action.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteProduk(btn.dataset.id);
            });
        });
        
        // Card click untuk select
        document.querySelectorAll('.produk-card-modern, .produk-list-item-modern').forEach(card => {
            card.addEventListener('click', function(e) {
                if (e.target.closest('.btn-action') || e.target.closest('.btn-icon-action') || e.target.closest('.select-item')) {
                    return;
                }
                
                const checkbox = this.querySelector('.select-item');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });
        });
    }
    
    // Update Bulk Action Bar
    function updateBulkBar() {
        const count = state.selectedIds.size;
        
        if (elements.bulkBar) {
            elements.bulkBar.style.display = count > 0 ? 'flex' : 'none';
        }
        if (elements.selectedCount) {
            elements.selectedCount.textContent = `${count} item dipilih`;
        }
    }
    
    // Set View Mode
    function setView(view) {
        state.filter.view = view;
        
        elements.viewGrid?.classList.toggle('active', view === 'grid');
        elements.viewList?.classList.toggle('active', view === 'list');
        
        localStorage.setItem('produk-view-mode', view);
        filterAndRender();
    }
    
    // Go to Page
    function goToPage(page) {
        if (page < 1 || page > state.pagination.totalPages) return;
        state.pagination.currentPage = page;
        filterAndRender();
        elements.container?.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Handle Tambah Produk
    function handleTambahProduk(e) {
        e.preventDefault();
        
        const data = {
            nama: document.getElementById('input-nama')?.value,
            kode: document.get
