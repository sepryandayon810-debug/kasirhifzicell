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
        this.startAutoSave();
    },
    
    /**
     * Cache elemen DOM
     */
    cacheDOM: function() {
        this.container = document.getElementById('keranjang-items');
        this.emptyState = document.querySelector('.empty-keranjang');
        this.subtotalEl = document.getElementById('subtotal');
        this.totalEl = document.getElementById('total-bayar');
        this.badgeCount = document.getElementById('mobile-count');
        this.btnClear = document.getElementById('btn-clear-keranjang');
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
    },
    
    /**
     * Tambah item ke keranjang
     * @param {Object} produk 
     * @param {Object} customData - Data tambahan untuk transaksi manual/topup/tarik
     */
    tambahItem: function(produk, customData = null) {
        // Untuk transaksi dengan custom data (manual, topup, tarik)
        if (customData) {
            // Hitung subtotal jika belum ada
            const subtotal = customData.subtotal || (customData.harga_jual * customData.qty);
            
            this.items.push({
                id: produk.id || 'manual_' + Date.now(),
                nama: customData.nama || produk.nama,
                harga_jual: customData.harga_jual || customData.harga || produk.harga_jual,
                harga_modal: customData.harga_modal || produk.harga_modal || 0,
                qty: customData.qty || 1,
                subtotal: subtotal,
                gambar: produk.gambar,
                jenis: customData.jenis || 'penjualan',
                keterangan: customData.keterangan || '',
                stok_tersedia: produk.stok || 9999,
                // Data tambahan untuk topup/tarik
                nominal: customData.nominal || 0,
                fee: customData.fee || 0,
                provider: customData.provider || ''
            });
            
            this.render();
            this.saveToStorage();
            this.showToast('Item ditambahkan ke keranjang', 'success');
            return; // ✅ RETURN di sini untuk customData
        }
        
        // ✅ Kode di bawah ini untuk penjualan normal (tanpa customData)
        // Cek stok untuk penjualan normal
        if (produk.stok <= 0) {
            this.showToast('Stok produk habis', 'warning');
            return;
        }
        
        const existing = this.items.find(item => item.id === produk.id && item.jenis === 'penjualan');
        
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
                harga_modal: produk.harga_modal || 0,
                qty: 1,
                subtotal: produk.harga_jual || produk.hargaJual || 0,
                gambar: produk.gambar,
                jenis: 'penjualan',
                keterangan: '',
                stok_tersedia: produk.stok || 0
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
        
        // Cek stok untuk penjualan
        if (item.jenis === 'penjualan' && newQty > item.stok_tersedia) {
            this.showToast('Stok tidak mencukupi', 'warning');
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
        if (!confirm('Hapus item ini dari keranjang?')) return;
        
        this.items.splice(index, 1);
        this.render();
        this.saveToStorage();
    },
    
    /**
     * Kosongkan keranjang
     */
    clear: function() {
        if (this.items.length === 0) return;
        if (!confirm('Kosongkan semua item di keranjang?')) return;
        
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
            
            // Icon berdasarkan jenis
            const jenisIcon = {
                'penjualan': 'fa-shopping-bag',
                'topup': 'fa-mobile-alt',
                'tarik': 'fa-money-bill-wave',
                'manual': 'fa-edit'
            };
            
            html += `
                <div class="keranjang-item" data-index="${index}">
                    <div class="keranjang-item-img">
                        ${item.jenis !== 'penjualan' ? `<i class="fas ${jenisIcon[item.jenis] || 'fa-box'}"></i>` : imageHtml}
                    </div>
                    <div class="keranjang-item-info">
                        <div class="keranjang-item-nama">${item.nama}</div>
                        <div class="keranjang-item-harga">${formatRupiah(item.harga_jual)} x ${item.qty}</div>
                        ${item.keterangan ? `<small style="color: var(--text-muted);">${item.keterangan}</small>` : ''}
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
        if (this.subtotalEl) {
            this.subtotalEl.textContent = formatRupiah(subtotal);
        }
        if (this.totalEl) {
            this.totalEl.textContent = formatRupiah(subtotal);
        }
        
        // Trigger hitung kembalian di kasir-main
        if (typeof hitungKembalian === 'function') {
            hitungKembalian();
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
     * Edit item (untuk edit harga/qty manual)
     * @param {number} index 
     * @param {Object} newData 
     */
    editItem: function(index, newData) {
        const item = this.items[index];
        if (!item) return;
        
        if (newData.harga !== undefined) item.harga_jual = newData.harga;
        if (newData.qty !== undefined) {
            // Cek stok
            if (item.jenis === 'penjualan' && newData.qty > item.stok_tersedia) {
                this.showToast('Stok tidak mencukupi', 'warning');
                return;
            }
            item.qty = newData.qty;
        }
        
        item.subtotal = item.qty * item.harga_jual;
        this.render();
        this.saveToStorage();
    },
    
    /**
     * Simpan ke localStorage (draft)
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
        if (!draft) return;
        
        try {
            const data = JSON.parse(draft);
            const draftTime = new Date(data.timestamp);
            const now = new Date();
            const diffMinutes = (now - draftTime) / (1000 * 60);
            
            // Hanya recovery jika kurang dari 2 jam
            if (diffMinutes < 120 && confirm('Ada transaksi yang belum selesai. Muat kembali?')) {
                this.items = data.items || [];
                this.render();
            } else {
                localStorage.removeItem('keranjang_draft');
            }
        } catch (e) {
            console.error('Error loading draft:', e);
            localStorage.removeItem('keranjang_draft');
        }
    },
    
    /**
     * Clear draft
     */
    clearDraft: function() {
        localStorage.removeItem('keranjang_draft');
    },
    
    /**
     * Auto save setiap 5 detik
     */
    startAutoSave: function() {
        setInterval(() => this.saveToStorage(), 5000);
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

// ✅ Export ke window SEBELUM event listener
window.Keranjang = Keranjang;

// Auto init saat DOM ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.Keranjang) {
        window.Keranjang.init();
        
        // Load draft setelah 1 detik
        setTimeout(() => {
            if (window.Keranjang.loadFromStorage) {
                window.Keranjang.loadFromStorage();
            }
        }, 1000);
    }
});
