/**
 * WebPOS Kasir Main Module v3.0 - IMPROVED
 * Features: Product loading, category filtering, search, grid/list view
 */

const KasirMain = (function() {
    'use strict';
    
    // State
    const state = {
        produk: [],
        kategori: [],
        keranjang: [],
        filter: {
            kategori: '',
            search: '',
            view: 'grid'
        },
        isLoading: false
    };
    
    // DOM Elements Cache
    let elements = {};
    
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
        
        console.log('KasirMain v3.0 initialized');
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
            
            // Add "Umum" as default if no categories
            if (state.kategori.length === 0) {
                state.kategori.push({ id: 'umum', nama: 'Umum', icon: 'fa-box' });
            }
            
            renderKategoriOptions();
            renderKategoriChips();
        }).catch(err => {
            console.error('Error loading kategori:', err);
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
        
        // Bind click events
        elements.kategoriChips.querySelectorAll('.kategori-chip').forEach(chip => {
            chip.addEventListener('click', function() {
                const kategoriId = this.dataset.kategori;
                setKategoriFilter(kategoriId);
            });
        });
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
        
        // Apply filter dengan animasi
        filterAndRender();
        
        // Scroll ke container produk
        elements.container?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
                        state.produk.push({
                            id: key,
                            nama: data[key].nama || 'Tanpa Nama',
                            kode: data[key].kode || '',
                            barcode: data[key].barcode || '',
                            hargaJual: parseInt(data[key].hargaJual) || parseInt(data[key].harga_jual) || 0,
                            hargaModal: parseInt(data[key].hargaModal) || parseInt(data[key].harga_modal) || parseInt(data[key].harga_beli) || 0,
                            stok: parseInt(data[key].stok) || 0,
                            kategoriId: data[key].kategoriId || data[key].kategori || 'umum',
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
    
    // Filter dan Render
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
        
        renderProduk(filtered);
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
    
    // Render Produk Grid/List
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
        
        // Bind events dengan delay untuk animasi
        setTimeout(() => {
            bindProdukEvents();
        }, 50);
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
                 style="animation-delay: ${index * 0.05}s">
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
                        data-id="${produk.id}" 
                        ${isDisabled ? 'disabled' : ''}
                        title="${isDisabled ? 'Stok habis' : 'Tambah ke keranjang'}">
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
                 style="animation-delay: ${index * 0.03}s">
                <div class="list-checkbox">
                    <input type="checkbox" class="select-item" data-id="${produk.id}">
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
                        data-id="${produk.id}"
                        ${isDisabled ? 'disabled' : ''}
                        title="${isDisabled ? 'Stok habis' : 'Tambah ke keranjang'}">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
    }
    
    // Bind events untuk produk items
    function bindProdukEvents() {
        // Add to cart buttons
        document.querySelectorAll('.btn-add-cart:not(.disabled)').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const produkId = this.dataset.id;
                addToCart(produkId);
                
                // Visual feedback
                this.classList.add('clicked');
                setTimeout(() => this.classList.remove('clicked'), 200);
            });
        });
        
        // Card click untuk tambah ke keranjang (hanya untuk grid view)
        document.querySelectorAll('.produk-card-modern:not(.disabled)').forEach(card => {
            card.addEventListener('click', function(e) {
                if (!e.target.closest('.btn-add-cart')) {
                    const btn = this.querySelector('.btn-add-cart');
                    if (btn && !btn.disabled) {
                        btn.click();
                    }
                }
            });
        });
    }
    
    // Add to Cart
    function addToCart(produkId) {
        const produk = state.produk.find(p => p.id === produkId);
        if (!produk) return;
        
        // Cek stok
        if (produk.stok <= 0) {
            showToast('Stok produk habis!', 'error');
            return;
        }
        
        // Tambah ke keranjang via global Keranjang module
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
    
    // Bind Events
    function bindEvents() {
        // Search input dengan debounce
        if (elements.searchInput) {
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
        
        // View Toggle
        if (elements.viewGrid) {
            elements.viewGrid.addEventListener('click', () => setView('grid'));
        }
        if (elements.viewList) {
            elements.viewList.addEventListener('click', () => setView('list'));
        }
        
        // Listen for theme changes
        window.addEventListener('themechange', () => {
            filterAndRender();
        });
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
            
            // Update local data
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
                        gambar: data.gambar || state.produk[index].gambar
                    };
                }
                filterAndRender();
            }
        });
        
        produkRef.on('child_added', (snapshot) => {
            const id = snapshot.key;
            const data = snapshot.val();
            
            // Cek apakah produk sudah ada
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
                    kategoriId: data.kategoriId || 'umum',
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
        getState: () => state,
        filterAndRender
    };
})();

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    // Delay untuk memastikan Firebase siap
    setTimeout(() => KasirMain.init(), 100);
});

// Expose to global
window.KasirMain = KasirMain;
