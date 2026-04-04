/**
 * WebPOS Kasir Main Module v2.0
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
        
        loadKategori();
        loadProduk();
        bindEvents();
        setupRealtimeListener();
        
        console.log('KasirMain initialized');
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
                    if (data[key].status !== 'nonaktif') {
                        state.produk.push({
                            id: key,
                            nama: data[key].nama || 'Tanpa Nama',
                            kode: data[key].kode || '',
                            barcode: data[key].barcode || '',
                            hargaJual: parseInt(data[key].hargaJual) || 0,
                            hargaModal: parseInt(data[key].hargaModal) || 0,
                            stok: parseInt(data[key].stok) || 0,
                            kategoriId: data[key].kategoriId || 'umum',
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
        const stokClass = stok <= 0 ? 'empty' : stok <= produk.minStok ? 'low' : stok <= 10 ? 'medium' : 'high';
        const stokText = stok <= 0 ? 'Habis' : stok <= produk.minStok ? 'Kritis' : stok;
        const isDisabled = stok <= 0;
        
        const kategori = state.kategori.find(k => k.id === produk.kategoriId);
        const kategoriNama = kategori ? kategori.nama : 'Umum';
        const kategoriIcon = kategori ? kategori.icon : 'fa-box';
        
        return `
            <div class="produk-card-modern ${isDisabled ? 'disabled' : ''}" 
                 style="animation: fadeIn 0.3s ease ${index * 0.05}s both;">
                <div class="produk-image-modern">
                    ${produk.gambar ? 
                        `<img src="${produk.gambar}" alt="${produk.nama}" loading="lazy">` : 
                        `<i class="fas ${kategoriIcon}"></i>`
                    }
                    <span class="stok-badge ${stokClass}">${stokText}</span>
                </div>
                <div class="produk-info-modern">
                    <h4 class="produk-nama-modern" title="${produk.nama}">${produk.nama}</h4>
                    <p class="produk-kategori-modern">
                        <i class="fas fa-tag"></i> ${kategoriNama}
                    </p>
                    <div class="produk-meta-modern">
                        <span class="produk-kode">${produk.kode || '-'}</span>
                        <span class="produk-satuan">${produk.satuan}</span>
                    </div>
                    <div class="produk-price-modern">
                        <span class="harga-jual">Rp ${formatRupiah(produk.hargaJual)}</span>
                        ${produk.hargaModal > 0 ? `<span class="harga-modal">Rp ${formatRupiah(produk.hargaModal)}</span>` : ''}
                    </div>
                </div>
                <button class="btn-add-cart ${isDisabled ? 'disabled' : ''}" 
                        data-id="${produk.id}" 
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
        
        const kategori = state.kategori.find(k => k.id === produk.kategoriId);
        const kategoriNama = kategori ? kategori.nama : 'Umum';
        
        return `
            <div class="produk-list-item-modern ${isDisabled ? 'disabled' : ''}"
                 style="animation: slideInRight 0.3s ease ${index * 0.03}s both;">
                <div class="list-checkbox">
                    <input type="checkbox" class="select-item" data-id="${produk.id}">
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
                    </p>
                </div>
                <div class="list-price">
                    <span class="price-jual">Rp ${formatRupiah(produk.hargaJual)}</span>
                </div>
                <button class="btn-add-cart ${isDisabled ? 'disabled' : ''}" 
                        data-id="${produk.id}"
                        ${isDisabled ? 'disabled' : ''}>
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
        
        // Card click untuk edit (opsional)
        document.querySelectorAll('.produk-card-modern').forEach(card => {
            card.addEventListener('click', function(e) {
                if (!e.target.closest('.btn-add-cart')) {
                    // Bisa tambah fitur quick view di sini
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
        if (window.Keranjang && window.Keranjang.add) {
            window.Keranjang.add({
                id: produk.id,
                nama: produk.nama,
                hargaJual: produk.hargaJual,
                hargaModal: produk.hargaModal,
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
            
            // Focus search on Ctrl+K
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    elements.searchInput.focus();
                }
            });
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
            // Re-render jika perlu adjust warna
            filterAndRender();
        });
    }
    
    // Set View Mode
    function setView(view) {
        state.filter.view = view;
        
        elements.viewGrid?.classList.toggle('active', view === 'grid');
        elements.viewList?.classList.toggle('active', view === 'list');
        
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
                if (data.status === 'nonaktif') {
                    state.produk.splice(index, 1);
                } else {
                    state.produk[index] = { ...state.produk[index], ...data };
                }
                filterAndRender();
            }
        });
        
        produkRef.on('child_added', (snapshot) => {
            loadProduk(); // Reload untuk simplicity
        });
        
        produkRef.on('child_removed', () => {
            loadProduk();
        });
    }
    
    // Helper: Format Rupiah
    function formatRupiah(angka) {
        if (!angka) return '0';
        return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
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
