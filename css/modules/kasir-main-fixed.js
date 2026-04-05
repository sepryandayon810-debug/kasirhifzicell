/**
 * WebPOS Kasir Main Module v3.2 - FIXED
 * Features: Product loading, category filtering, search, grid/list view
 * Fixed: Double click bug, category grouping, event delegation
 */

const KasirMain = (function() {
    'use strict';
    
    // State
    const state = {
        produk: [],
        kategori: [],
        filter: {
            kategori: '',
            search: '',
            view: 'grid'
        },
        isLoading: false,
        lastClickTime: 0, // Prevent double click
        clickProdukId: null
    };
    
    // DOM Elements Cache
    let elements = {};
    let eventDelegated = false; // Flag untuk event delegation
    
    // Initialize
    function init() {
        cacheElements();
        if (!elements.container) {
            console.warn('KasirMain: Container not found');
            return;
        }
        
        // Load view preference
        const savedView = localStorage.getItem('kasir-view-mode');
        if (savedView) {
            state.filter.view = savedView;
            updateViewButtons();
        }
        
        loadKategori();
        loadProduk();
        bindEvents();
        setupRealtimeListener();
        
        console.log('KasirMain v3.2 initialized');
    }
    
    // Cache DOM elements
    function cacheElements() {
        elements = {
            container: document.getElementById('produk-container'),
            searchInput: document.getElementById('search-produk'),
            kategoriSelect: document.getElementById('filter-kategori'),
            kategoriChips: document.getElementById('kategori-scroll'),
            viewGrid: document.getElementById('view-grid'),
            viewList: document.getElementById('view-list'),
            lastUpdate: document.getElementById('last-update')
        };
    }
    
    // Update view buttons state
    function updateViewButtons() {
        if (elements.viewGrid && elements.viewList) {
            elements.viewGrid.classList.toggle('active', state.filter.view === 'grid');
            elements.viewList.classList.toggle('active', state.filter.view === 'list');
        }
    }
    
    // Load Kategori dari Firebase
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
            
            // Add default categories if none exist
            if (state.kategori.length === 0) {
                state.kategori = [
                    { id: 'umum', nama: 'Umum', icon: 'fa-box' }
                ];
            }
            
            renderKategoriOptions();
            renderKategoriChips();
        }).catch(err => {
            console.error('Error loading kategori:', err);
            state.kategori = [{ id: 'umum', nama: 'Umum', icon: 'fa-box' }];
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
    
    // Render Kategori Chips (Filter Cepat)
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
                        data-kategori="${kat.id}" title="${kat.nama}">
                    <i class="fas ${kat.icon}"></i>
                    <span>${kat.nama}</span>
                </button>
            `;
        });
        
        elements.kategoriChips.innerHTML = html;
    }
    
    // Set Filter Kategori
    function setKategoriFilter(kategoriId) {
        state.filter.kategori = kategoriId;
        
        // Update select dropdown
        if (elements.kategoriSelect) {
            elements.kategoriSelect.value = kategoriId;
        }
        
        // Update chips UI
        document.querySelectorAll('.kategori-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.kategori === kategoriId);
        });
        
        // Apply filter
        filterAndRender();
    }
    
    // Load Produk dari Firebase
    function loadProduk() {
        state.isLoading = true;
        showLoading();
        
        const produkRef = firebase.database().ref('produk');
        
        produkRef.once('value', (snapshot) => {
            state.produk = [];
            const data = snapshot.val();
            
            if (data) {
                Object.keys(data).forEach(key => {
                    // Hanya tampilkan produk aktif
                    if (data[key].status !== 'nonaktif' && data[key].status !== 'deleted') {
                        // Normalisasi kategori ID
                        let kategoriId = data[key].kategoriId || data[key].kategori || 'umum';
                        kategoriId = kategoriId.toString().toLowerCase().trim();
                        
                        state.produk.push({
                            id: key,
                            nama: data[key].nama || 'Tanpa Nama',
                            kode: data[key].kode || '',
                            barcode: data[key].barcode || '',
                            hargaJual: parseInt(data[key].hargaJual) || parseInt(data[key].harga_jual) || 0,
                            hargaModal: parseInt(data[key].hargaModal) || parseInt(data[key].harga_modal) || parseInt(data[key].harga_beli) || 0,
                            stok: parseInt(data[key].stok) || 0,
                            kategoriId: kategoriId,
                            gambar: data[key].gambar || null,
                            satuan: data[key].satuan || 'pcs',
                            minStok: parseInt(data[key].minStok) || 5
                        });
                    }
                });
            }
            
            state.isLoading = false;
            filterAndRender();
            updateLastUpdate();
            
        }).catch(err => {
            console.error('Error loading produk:', err);
            state.isLoading = false;
            showError('Gagal memuat produk');
        });
    }
    
    // Filter dan Render - KELOMPOKKAN PER KATEGORI
    function filterAndRender() {
        let filtered = [...state.produk];
        
        // Filter by kategori
        if (state.filter.kategori) {
            filtered = filtered.filter(p => p.kategoriId === state.filter.kategori);
        }
        
        // Filter by search
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
        
        // Jika tidak ada filter kategori dan tidak ada search, kelompokkan per kategori
        if (!state.filter.kategori && !state.filter.search) {
            renderProdukByKategori(filtered);
        } else {
            renderProduk(filtered);
        }
    }
    
    // Render Produk dikelompokkan per Kategori
    function renderProdukByKategori(produkList) {
        if (!elements.container) return;
        
        if (produkList.length === 0) {
            elements.container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>Tidak ada produk</p>
                    <span>Tambahkan produk baru</span>
                </div>
            `;
            return;
        }
        
        const isGrid = state.filter.view === 'grid';
        elements.container.className = `produk-container-modern ${isGrid ? 'grid-view' : 'list-view'}`;
        
        // Kelompokkan produk per kategori
        const grouped = {};
        produkList.forEach(p => {
            if (!grouped[p.kategoriId]) {
                grouped[p.kategoriId] = [];
            }
            grouped[p.kategoriId].push(p);
        });
        
        let html = '';
        let delayIndex = 0;
        
        // Render per kategori sesuai urutan di state.kategori
        state.kategori.forEach(kat => {
            const produkInKategori = grouped[kat.id] || [];
            if (produkInKategori.length === 0) return;
            
            // Header kategori
            html += `
                <div class="kategori-group" style="grid-column: 1 / -1;">
                    <div class="kategori-group-header">
                        <i class="fas ${kat.icon}"></i>
                        <span>${kat.nama}</span>
                        <span>${produkInKategori.length} produk</span>
                    </div>
                </div>
            `;
            
            // Render produk dalam kategori
            produkInKategori.forEach((produk) => {
                if (isGrid) {
                    html += renderGridItem(produk, delayIndex++);
                } else {
                    html += renderListItem(produk, delayIndex++);
                }
            });
        });
        
        // Produk tanpa kategori yang cocok
        const otherKategoriIds = Object.keys(grouped).filter(id => !state.kategori.some(k => k.id === id));
        if (otherKategoriIds.length > 0) {
            otherKategoriIds.forEach(katId => {
                const produkInKategori = grouped[katId];
                if (produkInKategori.length === 0) return;
                
                html += `
                    <div class="kategori-group" style="grid-column: 1 / -1;">
                        <div class="kategori-group-header" style="background: var(--bg-hover);">
                            <i class="fas fa-box"></i>
                            <span>Lainnya</span>
                            <span>${produkInKategori.length} produk</span>
                        </div>
                    </div>
                `;
                
                produkInKategori.forEach((produk) => {
                    if (isGrid) {
                        html += renderGridItem(produk, delayIndex++);
                    } else {
                        html += renderListItem(produk, delayIndex++);
                    }
                });
            });
        }
        
        elements.container.innerHTML = html;
    }
    
    // Render Loading State
    function showLoading() {
        if (!elements.container) return;
        elements.container.innerHTML = `
            <div class="loading-produk">
                <div class="spinner"></div>
                <p>Memuat produk...</p>
            </div>
        `;
    }
    
    // Render Error State
    function showError(message) {
        if (!elements.container) return;
        elements.container.innerHTML = `
            <div class="empty-state error">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
                <button onclick="KasirMain.refresh()" class="btn-retry">
                    <i class="fas fa-redo"></i> Coba Lagi
                </button>
            </div>
        `;
    }
    
    // Render Produk Grid/List (tanpa grouping)
    function renderProduk(produkList) {
        if (!elements.container) return;
        
        if (produkList.length === 0) {
            elements.container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>Tidak ada produk</p>
                    <span>${state.filter.search ? 'Coba kata kunci lain' : 'Tambahkan produk baru'}</span>
                </div>
            `;
            return;
        }
        
        const isGrid = state.filter.view === 'grid';
        elements.container.className = `produk-container-modern ${isGrid ? 'grid-view' : 'list-view'}`;
        
        let html = '';
        
        produkList.forEach((produk, index) => {
            if (isGrid) {
                html += renderGridItem(produk, index);
            } else {
                html += renderListItem(produk, index);
            }
        });
        
        elements.container.innerHTML = html;
    }
    
    // Render Grid Item
    function renderGridItem(produk, index) {
        const stok = produk.stok || 0;
        let stokClass = 'high';
        let stokText = stok.toString();
        
        if (stok <= 0) {
            stokClass = 'empty';
            stokText = 'Habis';
        } else if (stok <= produk.minStok) {
            stokClass = 'low';
        } else if (stok <= 10) {
            stokClass = 'medium';
        }
        
        const isDisabled = stok <= 0;
        
        const kategori = state.kategori.find(k => k.id === produk.kategoriId);
        const kategoriNama = kategori ? kategori.nama : 'Umum';
        const kategoriIcon = kategori ? kategori.icon : 'fa-box';
        
        return `
            <div class="produk-card-modern ${isDisabled ? 'disabled' : ''}" 
                 style="animation-delay: ${index * 0.03}s"
                 data-produk-id="${produk.id}">
                <div class="produk-image-modern">
                    ${produk.gambar ? 
                        `<img src="${produk.gambar}" alt="${escapeHtml(produk.nama)}" loading="lazy">` : 
                        `<i class="fas ${kategoriIcon}"></i>`
                    }
                    <span class="stok-badge ${stokClass}">${stokText}</span>
                </div>
                <div class="produk-info-modern">
                    <h4 class="produk-nama-modern" title="${escapeHtml(produk.nama)}">${escapeHtml(produk.nama)}</h4>
                    <p class="produk-kategori-modern">
                        <i class="fas fa-tag"></i> ${kategoriNama}
                    </p>
                    <div class="produk-meta-modern">
                        <span class="produk-kode">${produk.kode || '-'}</span>
                        <span class="produk-satuan">${produk.satuan}</span>
                    </div>
                    <div class="produk-price-modern">
                        <span class="harga-jual">${formatRupiah(produk.hargaJual)}</span>
                        ${produk.hargaModal > 0 ? `<span class="harga-modal">${formatRupiah(produk.hargaModal)}</span>` : ''}
                    </div>
                </div>
                <button class="btn-add-cart ${isDisabled ? 'disabled' : ''}" 
                        data-produk-id="${produk.id}" 
                        ${isDisabled ? 'disabled' : ''}>
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
    }
    
    // Render List Item
    function renderListItem(produk, index) {
        const stok = produk.stok || 0;
        const isDisabled = stok <= 0;
        
        let stokClass = 'success';
        if (stok <= 0) stokClass = 'danger';
        else if (stok <= produk.minStok) stokClass = 'warning';
        
        const kategori = state.kategori.find(k => k.id === produk.kategoriId);
        const kategoriNama = kategori ? kategori.nama : 'Umum';
        
        return `
            <div class="produk-list-item-modern ${isDisabled ? 'disabled' : ''}"
                 style="animation-delay: ${index * 0.02}s"
                 data-produk-id="${produk.id}">
                <div class="list-checkbox">
                    <input type="checkbox" class="select-item" data-produk-id="${produk.id}">
                </div>
                <div class="list-image">
                    ${produk.gambar ? 
                        `<img src="${produk.gambar}" alt="${escapeHtml(produk.nama)}" loading="lazy">` : 
                        `<i class="fas fa-box"></i>`
                    }
                </div>
                <div class="list-info">
                    <h4>${escapeHtml(produk.nama)}</h4>
                    <p>
                        <span class="badge-kategori">${kategoriNama}</span>
                        <span class="badge-stok ${stokClass}">
                            Stok: ${stok}
                        </span>
                    </p>
                </div>
                <div class="list-price">
                    <span class="price-jual">${formatRupiah(produk.hargaJual)}</span>
                </div>
                <button class="btn-add-cart ${isDisabled ? 'disabled' : ''}" 
                        data-produk-id="${produk.id}"
                        ${isDisabled ? 'disabled' : ''}>
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
    }
    
    // Bind Events - EVENT DELEGATION untuk mencegah multiple listeners
    function bindEvents() {
        // Event delegation untuk container produk - HANYA SEKALI
        if (!eventDelegated && elements.container) {
            elements.container.addEventListener('click', function(e) {
                // Cegah double click dengan timestamp
                const now = Date.now();
                if (now - state.lastClickTime < 300) {
                    return; // Abaikan klik dalam 300ms
                }
                state.lastClickTime = now;
                
                // Cari tombol add cart yang diklik
                const btn = e.target.closest('.btn-add-cart');
                if (btn && !btn.disabled) {
                    e.stopPropagation();
                    const produkId = btn.dataset.produkId;
                    if (produkId) {
                        addToCart(produkId);
                        
                        // Visual feedback
                        btn.classList.add('clicked');
                        setTimeout(() => btn.classList.remove('clicked'), 200);
                    }
                    return;
                }
                
                // Cari card yang diklik (tapi bukan tombol)
                const card = e.target.closest('.produk-card-modern');
                if (card && !e.target.closest('.btn-add-cart') && !card.classList.contains('disabled')) {
                    const btn = card.querySelector('.btn-add-cart');
                    if (btn && !btn.disabled) {
                        btn.click();
                    }
                }
            });
            
            eventDelegated = true;
        }
        
        // Search input dengan debounce
        if (elements.searchInput) {
            let searchTimeout;
            elements.searchInput.addEventListener('input', debounce(function() {
                state.filter.search = this.value;
                filterAndRender();
            }, 300));
        }
        
        // Kategori Select
        if (elements.kategoriSelect) {
            elements.kategoriSelect.addEventListener('change', function() {
                setKategoriFilter(this.value);
            });
        }
        
        // Kategori Chips - Event delegation
        if (elements.kategoriChips) {
            elements.kategoriChips.addEventListener('click', function(e) {
                const chip = e.target.closest('.kategori-chip');
                if (chip) {
                    setKategoriFilter(chip.dataset.kategori);
                }
            });
        }
        
        // View Toggle
        if (elements.viewGrid) {
            elements.viewGrid.addEventListener('click', () => setView('grid'));
        }
        if (elements.viewList) {
            elements.viewList.addEventListener('click', () => setView('list'));
        }
    }
    
    // Add to Cart
    function addToCart(produkId) {
        // Cegah klik produk yang sama berulang kali
        if (state.clickProdukId === produkId) {
            return;
        }
        state.clickProdukId = produkId;
        setTimeout(() => { state.clickProdukId = null; }, 300);
        
        const produk = state.produk.find(p => p.id === produkId);
        if (!produk) return;
        
        // Cek stok
        if (produk.stok <= 0) {
            showToast('Stok produk habis!', 'error');
            return;
        }
        
        // Tambah ke keranjang
        if (window.Keranjang && window.Keranjang.addItem) {
            window.Keranjang.addItem({
                id: produk.id,
                nama: produk.nama,
                harga_jual: produk.hargaJual,
                harga_modal: produk.hargaModal,
                stok: produk.stok,
                gambar: produk.gambar
            });
            
            showToast(`${produk.nama} ditambahkan`, 'success');
        } else {
            console.warn('Keranjang module not found');
        }
    }
    
    // Set View Mode
    function setView(view) {
        state.filter.view = view;
        
        updateViewButtons();
        
        // Save preference
        localStorage.setItem('kasir-view-mode', view);
        
        filterAndRender();
    }
    
    // Setup Realtime Listener
    function setupRealtimeListener() {
        const produkRef = firebase.database().ref('produk');
        
        produkRef.on('child_changed', (snapshot) => {
            const id = snapshot.key;
            const data = snapshot.val();
            
            const index = state.produk.findIndex(p => p.id === id);
            if (index !== -1) {
                if (data.status === 'nonaktif' || data.status === 'deleted') {
                    state.produk.splice(index, 1);
                } else {
                    state.produk[index] = { 
                        ...state.produk[index], 
                        nama: data.nama || state.produk[index].nama,
                        hargaJual: parseInt(data.hargaJual) || parseInt(data.harga_jual) || state.produk[index].hargaJual,
                        hargaModal: parseInt(data.hargaModal) || parseInt(data.harga_modal) || state.produk[index].hargaModal,
                        stok: parseInt(data.stok) || state.produk[index].stok,
                        gambar: data.gambar || state.produk[index].gambar,
                        kategoriId: (data.kategoriId || data.kategori || 'umum').toString().toLowerCase().trim()
                    };
                }
                filterAndRender();
            }
        });
        
        produkRef.on('child_added', (snapshot) => {
            const id = snapshot.key;
            const data = snapshot.val();
            
            const existingIndex = state.produk.findIndex(p => p.id === id);
            
            if (existingIndex === -1 && data.status !== 'nonaktif' && data.status !== 'deleted') {
                state.produk.push({
                    id: id,
                    nama: data.nama || 'Tanpa Nama',
                    kode: data.kode || '',
                    barcode: data.barcode || '',
                    hargaJual: parseInt(data.hargaJual) || parseInt(data.harga_jual) || 0,
                    hargaModal: parseInt(data.hargaModal) || parseInt(data.harga_modal) || 0,
                    stok: parseInt(data.stok) || 0,
                    kategoriId: (data.kategoriId || data.kategori || 'umum').toString().toLowerCase().trim(),
                    gambar: data.gambar || null,
                    satuan: data.satuan || 'pcs',
                    minStok: parseInt(data.minStok) || 5
                });
                filterAndRender();
            }
        });
        
        produkRef.on('child_removed', (snapshot) => {
            const id = snapshot.key;
            const index = state.produk.findIndex(p => p.id === id);
            if (index !== -1) {
                state.produk.splice(index, 1);
                filterAndRender();
            }
        });
    }
    
    // Helper: Format Rupiah
    function formatRupiah(angka) {
        if (!angka) return 'Rp 0';
        return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    
    // Helper: Escape HTML
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Helper: Debounce
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Helper: Show Toast
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const iconMap = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${iconMap[type] || iconMap.info}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // Update last update time
    function updateLastUpdate() {
        if (elements.lastUpdate) {
            const now = new Date();
            elements.lastUpdate.textContent = `Terakhir update: ${now.toLocaleTimeString('id-ID')}`;
        }
    }
    
    // Public API
    return {
        init,
        refresh: loadProduk,
        setKategoriFilter,
        addToCart,
        getState: () => state,
        filterAndRender
    };
})();

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => KasirMain.init(), 100);
});

// Expose to global
window.KasirMain = KasirMain;
