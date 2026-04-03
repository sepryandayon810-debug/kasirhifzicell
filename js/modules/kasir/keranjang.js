/**
 * Keranjang Module - FIXED
 * File: js/modules/kasir/keranjang.js
 */

const Keranjang = {
    items: [],
    
    init: function() {
        this.loadFromStorage();
        this.render();
    },
    
    getItems: function() {
        return this.items;
    },
    
    addItem: function(produk, customData = null) {
        const existingIndex = this.items.findIndex(item => item.id === produk.id);
        
        if (existingIndex >= 0) {
            this.items[existingIndex].qty += 1;
            this.items[existingIndex].subtotal = this.items[existingIndex].qty * this.items[existingIndex].harga_jual;
        } else {
            const newItem = {
                id: produk.id,
                nama: customData?.nama || produk.nama,
                harga_jual: customData?.harga_jual || produk.harga_jual,
                harga_modal: customData?.harga_modal || produk.harga_modal || 0,
                qty: customData?.qty || 1,
                subtotal: (customData?.harga_jual || produk.harga_jual) * (customData?.qty || 1),
                jenis: customData?.jenis || 'penjualan',
                keterangan: customData?.keterangan || '',
                provider: customData?.provider || '',
                nominal: customData?.nominal || 0,
                fee: customData?.fee || 0
            };
            this.items.push(newItem);
        }
        
        this.saveToStorage();
        this.render();
        this.updateMobileCount();
    },
    
    // Alias untuk kompatibilitas
    tambahItem: function(produk, customData = null) {
        this.addItem(produk, customData);
    },
    
    updateQty: function(index, change) {
        if (index < 0 || index >= this.items.length) return;
        
        this.items[index].qty += change;
        
        if (this.items[index].qty <= 0) {
            this.removeItem(index);
            return;
        }
        
        this.items[index].subtotal = this.items[index].qty * this.items[index].harga_jual;
        this.saveToStorage();
        this.render();
        this.updateMobileCount();
    },
    
    removeItem: function(index) {
        if (index < 0 || index >= this.items.length) return;
        this.items.splice(index, 1);
        this.saveToStorage();
        this.render();
        this.updateMobileCount();
    },
    
    clear: function() {
        this.items = [];
        this.saveToStorage();
        this.render();
        this.updateMobileCount();
    },
    
    clearDraft: function() {
        localStorage.removeItem('keranjang_draft');
    },
    
    saveToStorage: function() {
        localStorage.setItem('keranjang_draft', JSON.stringify(this.items));
    },
    
    loadFromStorage: function() {
        const saved = localStorage.getItem('keranjang_draft');
        if (saved) {
            try {
                this.items = JSON.parse(saved);
            } catch (e) {
                this.items = [];
            }
        }
    },
    
    updateMobileCount: function() {
        const count = this.items.reduce((sum, item) => sum + item.qty, 0);
        
        // Update desktop badge
        const badgeCount = document.getElementById('cart-count');
        if (badgeCount) {
            badgeCount.textContent = count;
        }
        
        // Update mobile badge
        const mobileCount = document.getElementById('mobile-count');
        if (mobileCount) {
            mobileCount.textContent = count;
            mobileCount.style.display = count > 0 ? 'flex' : 'none';
        }
        
        // Panggil fungsi global jika ada
        if (typeof updateMobileCount === 'function') {
            updateMobileCount(count);
        }
    },
    
    render: function() {
        const container = document.getElementById('keranjang-items');
        const subtotalEl = document.getElementById('subtotal');
        const totalEl = document.getElementById('total-bayar');
        
        if (!container) return;
        
        if (this.items.length === 0) {
            container.innerHTML = `
                <div class="empty-cart-modern">
                    <i class="fas fa-shopping-basket"></i>
                    <p>Keranjang Kosong</p>
                    <span>Tambahkan produk untuk memulai</span>
                </div>
            `;
            if (subtotalEl) subtotalEl.textContent = 'Rp 0';
            if (totalEl) totalEl.textContent = 'Rp 0';
            return;
        }
        
        let html = '';
        let total = 0;
        
        this.items.forEach((item, index) => {
            total += item.subtotal;
            html += this.createItemHTML(item, index);
        });
        
        container.innerHTML = html;
        
        if (subtotalEl) subtotalEl.textContent = formatRupiah(total);
        if (totalEl) totalEl.textContent = formatRupiah(total);
        
        // Update kembalian jika ada input bayar
        if (typeof hitungKembalian === 'function') {
            hitungKembalian();
        }
    },
    
    createItemHTML: function(item, index) {
        return `
            <div class="cart-item-modern" data-index="${index}">
                <div class="cart-item-img">
                    <i class="fas fa-box"></i>
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.nama}</div>
                    <div class="cart-item-price">${formatRupiah(item.harga_jual)} x ${item.qty}</div>
                </div>
                <div class="qty-control-modern">
                    <button class="qty-btn-modern" onclick="window.Keranjang.updateQty(${index}, -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="qty-value-modern">${item.qty}</span>
                    <button class="qty-btn-modern" onclick="window.Keranjang.updateQty(${index}, 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="cart-item-total">
                    ${formatRupiah(item.subtotal)}
                </div>
                <button class="btn-remove-item" onclick="window.Keranjang.removeItem(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
};

// Inisialisasi
document.addEventListener('DOMContentLoaded', function() {
    Keranjang.init();
});

// Export ke global
window.Keranjang = Keranjang;
