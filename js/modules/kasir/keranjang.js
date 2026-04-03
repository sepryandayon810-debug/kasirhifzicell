/**
 * Keranjang Module
 * File: js/modules/kasir/keranjang.js
 * 
 * Mengelola keranjang belanja kasir
 */

const Keranjang = {
    items: [],
    
    /**
     * Inisialisasi modul
     */
    init: function() {
        this.cacheDOM();
        this.bindEvents();
        this.render();
    },
    
    /**
     * Cache elemen DOM
     */
    cacheDOM: function() {
        this.container = document.getElementById('keranjang-items');
        this.emptyState = document.querySelector('.empty-keranjang');
        this.summarySubtotal = document.getElementById('summary-subtotal');
        this.summaryTotal = document.getElementById('summary-total');
        this.badgeCount = document.querySelector('.btn-keranjang-mobile .badge');
        this.btnClear = document.querySelector('.btn-clear');
        this.jenisTransaksi = document.querySelectorAll('.jenis-btn');
    },
    
    /**
     * Bind events
     */
    bindEvents: function() {
        // Clear keranjang
        if (this.btnClear) {
            this.btnClear.addEventListener('click', () => this.clear());
        }
        
        // Event delegation untuk qty button dan hapus
        if (this.container) {
            this.container.addEventListener('click', (e) => {
                const btn = e.target.closest('.qty-btn, .btn-hapus-item');
                if (!btn) return;
                
                const itemEl = btn.closest('.keranjang-item');
                const index = parseInt(itemEl.dataset.index);
                
                if (btn.classList.contains('btn-minus')) {
                    this.ubahQty(index, -1);
                } else if (btn.classList.contains('btn-plus')) {
                    this.ubahQty(index, 1);
                } else if (btn.classList.contains('btn-hapus-item')) {
                    this.hapusItem(index);
                }
            });
        }
        
        // Jenis transaksi
        this.jenisTransaksi.forEach(btn => {
            btn.addEventListener('click', () => {
                this.jenisTransaksi.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    },
    
    /**
     * Tambah item ke keranjang
     * @param {Object} produk 
     */
    tambahItem: function(produk) {
        const existing = this.items.find(item => item.id === produk.id);
        
        if (existing) {
            if (existing.qty < produk.stok) {
                existing.qty++;
                existing.subtotal = existing.qty * existing.harga_jual;
            } else {
                this.showToast('Stok tidak mencukupi', 'warning');
                return;
            }
        } else {
            this.items.push({
                id: produk.id,
                nama: produk.nama,
                harga_jual: produk.harga_jual || produk.hargaJual || 0,
                qty: 1,
                subtotal: produk.harga_jual || produk.hargaJual || 0,
                gambar: produk.gambar
            });
        }
        
        this.render();
        this.saveToStorage();
        this.showToast('Produk ditambahkan ke keranjang', 'success');
    },
    
    /**
     * Ubah qty item
     * @param {number} index 
     * @param {number} delta 
     */
    ubahQty: function(index, delta) {
        const item = this.items[index];
        if (!item) return;
        
        const newQty = item.qty + delta;
        
        if (newQty < 1) {
            this.hapusItem(index);
            return;
        }
        
        item.qty = newQty;
        item.subtotal = item.qty * item.harga_jual;
        
        this.render();
        this.saveToStorage();
    },
    
    /**
     * Hapus item dari keranjang
     * @param {number} index 
     */
    hapusItem: function(index) {
        this.items.splice(index, 1);
        this.render();
        this.saveToStorage();
    },
    
    /**
     * Kosongkan keranjang
     */
    clear: function() {
        if (this.items.length === 0) return;
        if (!confirm('Kosongkan keranjang?')) return;
        
        this.items = [];
        this.render();
        this.saveToStorage();
    },
    
    /**
     * Render keranjang
     */
    render: function() {
        if (!this.container) return;
        
        // Update badge mobile
        const totalItems = this.items.reduce((sum, item) => sum + item.qty, 0);
        if (this.badgeCount) {
            this.badgeCount.textContent = totalItems;
            this.badgeCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
        
        // Show/hide empty state
        if (this.items.length === 0) {
            this.container.innerHTML = '';
            if (this.emptyState) this.emptyState.style.display = 'flex';
            this.updateSummary(0);
            return;
        }
        
        if (this.emptyState) this.emptyState.style.display = 'none';
        
        // Render items
        let html = '';
        let subtotal = 0;
        
        this.items.forEach((item, index) => {
            subtotal += item.subtotal;
            
            const imageHtml = item.gambar 
                ? `<img src="${item.gambar}" alt="${item.nama}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 14px;">`
                : `<i class="fas fa-box"></i>`;
            
            html += `
                <div class="keranjang-item" data-index="${index}">
                    <div class="keranjang-item-img">${imageHtml}</div>
                    <div class="keranjang-item-info">
                        <div class="keranjang-item-nama">${item.nama}</div>
                        <div class="keranjang-item-harga">${formatRupiah(item.harga_jual)} x ${item.qty}</div>
                    </div>
                    <div class="keranjang-item-qty">
                        <button class="qty-btn btn-minus"><i class="fas fa-minus"></i></button>
                        <span class="qty-value">${item.qty}</span>
                        <button class="qty-btn btn-plus"><i class="fas fa-plus"></i></button>
                    </div>
                    <button class="btn-hapus-item"><i class="fas fa-trash"></i></button>
                </div>
            `;
        });
        
        this.container.innerHTML = html;
        this.updateSummary(subtotal);
    },
    
    /**
     * Update summary
     * @param {number} subtotal 
     */
    updateSummary: function(subtotal) {
        if (this.summarySubtotal) {
            this.summarySubtotal.textContent = formatRupiah(subtotal);
        }
        if (this.summaryTotal) {
            this.summaryTotal.textContent = formatRupiah(subtotal);
        }
    },
    
    /**
     * Get semua items
     * @returns {Array}
     */
    getItems: function() {
        return this.items;
    },
    
    /**
     * Simpan ke localStorage
     */
    saveToStorage: function() {
        if (this.items.length > 0) {
            localStorage.setItem('keranjang_draft', JSON.stringify({
                items: this.items,
                timestamp: new Date().toISOString()
            }));
        } else {
            localStorage.removeItem('keranjang_draft');
        }
    },
    
    /**
     * Load dari localStorage
     */
    loadFromStorage: function() {
        const draft = localStorage.getItem('keranjang_draft');
        if (draft) {
            const data = JSON.parse(draft);
            const draftTime = new Date(data.timestamp);
            const now = new Date();
            const diffMinutes = (now - draftTime) / (1000 * 60);
            
            if (diffMinutes < 30) {
                this.items = data.items;
                this.render();
            } else {
                localStorage.removeItem('keranjang_draft');
            }
        }
    },
    
    /**
     * Clear draft
     */
    clearDraft: function() {
        localStorage.removeItem('keranjang_draft');
    },
    
    /**
     * Helper: Show toast
     */
    showToast: function(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }
};

// Export ke window
window.Keranjang = Keranjang;

// Auto init saat DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Keranjang.init();
    
    // Load draft setelah 1 detik
    setTimeout(() => Keranjang.loadFromStorage(), 1000);
});
