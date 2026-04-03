/**
 * Produk Main Controller - Simplified
 */

(function() {
    'use strict';
    
    // State
    let produkData = [];
    let kategoriData = [];
    let currentView = 'grid';
    let currentPage = 1;
    const itemsPerPage = 20;
    let filteredData = [];
    
    // DOM Elements cache
    const elements = {};
    
    // ==========================================
    // INIT
    // ==========================================
    function init() {
        console.log('[ProdukMain] Init started');
        
        // Cache DOM elements
        cacheElements();
        
        // Check critical elements
        if (!elements.container) {
            console.error('[ProdukMain] CRITICAL: #produk-main-container not found!');
            return;
        }
        
        // Setup events
        setupEvents();
        
        // Load data
        loadProduk();
        loadKategori();
        
        console.log('[ProdukMain] Init completed');
    }
    
    function cacheElements() {
        elements.container = document.getElementById('produk-main-container');
        elements.pagination = document.getElementById('pagination-container');
        elements.search = document.getElementById('search-produk');
        elements.viewToggle = document.getElementById('view-toggle');
        
        // Toolbar buttons
        elements.btnTambah = document.getElementById('btn-tambah-produk');
        elements.btnImport = document.getElementById('btn-import-excel');
        elements.btnExport = document.getElementById('btn-export-excel');
        elements.btnStok = document.getElementById('btn-stok-masal');
        elements.btnKategori = document.getElementById('btn-kategori');
        
        console.log('[ProdukMain] Elements cached:', {
            container: !!elements.container,
            pagination: !!elements.pagination,
            search: !!elements.search
        });
    }
    
    // ==========================================
    // EVENTS
    // ==========================================
    function setupEvents() {
        // Search
        if (elements.search) {
            elements.search.addEventListener('input', debounce(function() {
                currentPage = 1;
                filterAndRender();
            }, 300));
        }
        
        // View toggle
        if (elements.viewToggle) {
            elements.viewToggle.addEventListener('click', function(e) {
                const btn = e.target.closest('.view-btn');
                if (!btn) return;
                
                currentView = btn.dataset.view;
                
                // Update UI
                elements.viewToggle.querySelectorAll('.view-btn').forEach(b => {
                    b.classList.toggle('active', b === btn);
                });
                
                filterAndRender();
            });
        }
        
        // Toolbar buttons
        if (elements.btnTambah) {
            elements.btnTambah.addEventListener('click', function() {
                openModal('modal-tambah-produk');
            });
        }
        
        if (elements.btnKategori) {
            elements.btnKategori.addEventListener('click', function() {
                openModal('modal-kategori');
            });
        }
        
        if (elements.btnStok) {
            elements.btnStok.addEventListener('click', function() {
                openModal('modal-stok-masal');
            });
        }
        
        if (elements.btnImport) {
            elements.btnImport.addEventListener('click', function() {
                alert('Import: Belum diimplementasikan');
            });
        }
        
        if (elements.btnExport) {
            elements.btnExport.addEventListener('click', function() {
                exportCSV();
            });
        }
    }
    
    // ==========================================
    // DATA LOADING
    // ==========================================
    function loadProduk() {
        console.log('[ProdukMain] Loading produk...');
        
        // Show loading
        elements.container.innerHTML = `
            <div style="text-align: center; padding: 60px;">
                <div style="width: 48px; height: 48px; border: 4px solid var(--border); 
                            border-top-color: var(--accent-indigo); border-radius: 50%; 
                            animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <p>Memuat produk...</p>
            </div>
        `;
        
        // Check Firebase
        if (typeof firebase === 'undefined') {
            console.error('[ProdukMain] Firebase not loaded');
            elements.container.innerHTML = '<p style="text-align: center; color: red;">Error: Firebase tidak tersedia</p>';
            return;
        }
        
        firebase.database().ref('produk').once('value')
            .then(function(snapshot) {
                produkData = [];
                snapshot.forEach(function(child) {
                    produkData.push({
                        id: child.key,
                        ...child.val()
                    });
                });
                
                console.log('[ProdukMain] Loaded', produkData.length, 'produk');
                filterAndRender();
            })
            .catch(function(error) {
                console.error('[ProdukMain] Error:', error);
                elements.container.innerHTML = `
                    <div style="text-align: center; padding: 60px; color: red;">
                        <p>Gagal memuat data</p>
                        <button onclick="location.reload()" class="btn btn-primary">Coba Lagi</button>
                    </div>
                `;
            });
    }
    
    function loadKategori() {
        firebase.database().ref('kategori').once('value')
            .then(function(snapshot) {
                kategoriData = [];
                snapshot.forEach(function(child) {
                    kategoriData.push({
                        id: child.key,
                        ...child.val()
                    });
                });
                
                // Populate selects
                populateKategoriSelects();
            });
    }
    
    function populateKategoriSelects() {
        const selects = ['tambah-kategori', 'edit-kategori'];
        selects.forEach(function(id) {
            const select = document.getElementById(id);
            if (!select) return;
            
            // Keep first option
            const firstOption = select.options[0];
            select.innerHTML = '';
            select.appendChild(firstOption);
            
            kategoriData.forEach(function(k) {
                const option = document.createElement('option');
                option.value = k.id;
                option.textContent = k.nama;
                select.appendChild(option);
            });
        });
    }
    
    // ==========================================
    // FILTER & RENDER
    // ==========================================
    function filterAndRender() {
        const searchTerm = elements.search ? elements.search.value.toLowerCase() : '';
        
        filteredData = produkData.filter(function(p) {
            if (!searchTerm) return true;
            return (p.nama || '').toLowerCase().includes(searchTerm) ||
                   (p.kode || '').toLowerCase().includes(searchTerm);
        });
        
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        const start = (currentPage - 1) * itemsPerPage;
        const pageData = filteredData.slice(start, start + itemsPerPage);
        
        render(pageData);
        renderPagination(totalPages);
    }
    
    function render(data) {
        if (data.length === 0) {
            elements.container.innerHTML = `
                <div style="text-align: center; padding: 60px; color: var(--text-muted);">
                    <i class="fas fa-box-open" style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;"></i>
                    <p>Tidak ada produk</p>
                </div>
            `;
            return;
        }
        
        if (currentView === 'grid') {
            renderGrid(data);
        } else {
            renderList(data);
        }
    }
    
    function renderGrid(data) {
        let html = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px;">`;
        
        data.forEach(function(p) {
            const kategori = kategoriData.find(k => k.id === p.kategori)?.nama || '-';
            
            html += `
                <div style="background: var(--bg-secondary); border: 1px solid var(--border); 
                            border-radius: 16px; overflow: hidden; transition: all 0.3s;">
                    <div style="height: 150px; background: linear-gradient(135deg, var(--accent-indigo), var(--accent-purple)); 
                                display: flex; align-items: center; justify-content: center; color: white; font-size: 48px;">
                        <i class="fas fa-box"></i>
                    </div>
                    <div style="padding: 16px;">
                        <div style="font-size: 12px; color: var(--text-muted);">${p.kode || '-'}</div>
                        <div style="font-weight: 600; margin: 8px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${p.nama}
                        </div>
                        <div style="color: var(--accent-indigo); font-weight: 700; font-size: 18px;">
                            Rp ${formatNumber(p.hargaJual || 0)}
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 13px;">
                            <span>Stok: ${p.stok || 0}</span>
                            <span style="color: var(--text-muted);">${kategori}</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; padding: 12px 16px; background: var(--bg-hover); border-top: 1px solid var(--border);">
                        <button onclick="editProduk('${p.id}')" 
                                style="flex: 1; padding: 8px; background: rgba(99,102,241,0.1); color: var(--accent-indigo); 
                                       border: none; border-radius: 8px; cursor: pointer;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="hapusProduk('${p.id}')" 
                                style="flex: 1; padding: 8px; background: rgba(239,68,68,0.1); color: var(--accent-red); 
                                       border: none; border-radius: 8px; cursor: pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        elements.container.innerHTML = html;
    }
    
    function renderList(data) {
        let html = `<div style="display: flex; flex-direction: column; gap: 12px;">`;
        
        data.forEach(function(p) {
            const kategori = kategoriData.find(k => k.id === p.kategori)?.nama || '-';
            
            html += `
                <div style="display: flex; align-items: center; gap: 16px; padding: 16px; 
                            background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 12px;">
                    <div style="width: 60px; height: 60px; background: linear-gradient(135deg, var(--accent-indigo), var(--accent-purple)); 
                                border-radius: 12px; display: flex; align-items: center; justify-content: center; 
                                color: white; font-size: 24px;">
                        <i class="fas fa-box"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600;">${p.nama}</div>
                        <div style="font-size: 13px; color: var(--text-muted);">${p.kode || '-'} | ${kategori}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: var(--accent-indigo); font-weight: 700;">Rp ${formatNumber(p.hargaJual || 0)}</div>
                        <div style="font-size: 13px;">Stok: ${p.stok || 0}</div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="editProduk('${p.id}')" 
                                style="padding: 10px; background: rgba(99,102,241,0.1); color: var(--accent-indigo); 
                                       border: none; border-radius: 8px; cursor: pointer;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="hapusProduk('${p.id}')" 
                                style="padding: 10px; background: rgba(239,68,68,0.1); color: var(--accent-red); 
                                       border: none; border-radius: 8px; cursor: pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        elements.container.innerHTML = html;
    }
    
    function renderPagination(totalPages) {
        if (!elements.pagination || totalPages <= 1) {
            if (elements.pagination) elements.pagination.innerHTML = '';
            return;
        }
        
        let html = `
            <button class="pagination-btn" onclick="ProdukMain.goToPage(${currentPage - 1})" 
                    ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                html += `
                    <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                            onclick="ProdukMain.goToPage(${i})">${i}</button>
                `;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                html += `<span>...</span>`;
            }
        }
        
        html += `
            <button class="pagination-btn" onclick="ProdukMain.goToPage(${currentPage + 1})" 
                    ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        elements.pagination.innerHTML = html;
    }
    
    // ==========================================
    // ACTIONS
    // ==========================================
    function goToPage(page) {
        currentPage = page;
        filterAndRender();
    }
    
    function refresh() {
        loadProduk();
    }
    
    function exportCSV() {
        const headers = ['Kode', 'Nama', 'Kategori', 'Harga Modal', 'Harga Jual', 'Stok'];
        const rows = produkData.map(function(p) {
            return [
                p.kode || '',
                p.nama || '',
                kategoriData.find(k => k.id === p.kategori)?.nama || '',
                p.hargaModal || 0,
                p.hargaJual || 0,
                p.stok || 0
            ];
        });
        
        let csv = headers.join(',') + '\n';
        rows.forEach(function(row) {
            csv += row.map(function(cell) { return '"' + cell + '"'; }).join(',') + '\n';
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'produk_' + new Date().toISOString().split('T')[0] + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // ==========================================
    // HELPERS
    // ==========================================
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    }
    
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    
    function openModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('active');
    }
    
    // ==========================================
    // GLOBAL EXPORTS
    // ==========================================
    window.ProdukMain = {
        init: init,
        refresh: refresh,
        goToPage: goToPage
    };
    
    window.editProduk = function(id) {
        console.log('Edit:', id);
        openModal('modal-edit-produk');
    };
    
    window.hapusProduk = function(id) {
        if (!confirm('Hapus produk ini?')) return;
        
        firebase.database().ref('produk/' + id).remove()
            .then(function() {
                alert('Produk dihapus');
                loadProduk();
            })
            .catch(function(err) {
                alert('Error: ' + err.message);
            });
    };
    
    // Auto init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
