/**
 * Produk Grid View Module
 * File: js/modules/kasir/produk-grid.js
 * 
 * Menangani tampilan produk dalam bentuk grid/card
 */

const ProdukGrid = {
    /**
     * Render produk dalam format grid
     * @param {Array} produkList - Array data produk
     * @param {HTMLElement} container - Container untuk render
     */
    render: function(produkList, container) {
        if (!container) {
            console.error('[ProdukGrid] Container tidak ditemukan');
            return;
        }
        
        container.innerHTML = '';
        container.classList.remove('list-view');
        container.classList.add('grid-view');
        
        if (!produkList || produkList.length === 0) {
            this.renderEmpty(container);
            return;
        }
        
        produkList.forEach(produk => {
            const card = this.createCard(produk);
            container.appendChild(card);
        });
    },
    
    /**
     * Buat elemen card produk
     * @param {Object} produk - Data produk
     * @returns {HTMLElement} Card element
     */
    createCard: function(produk) {
        const card = document.createElement('div');
        card.className = 'produk-card';
        card.dataset.id = produk.id || produk.key;
        
        // Stok styling sesuai CSS
        if (produk.stok <= 0) {
            card.classList.add('stok-habis');
        } else if (produk.stok <= 5) {
            card.classList.add('stok-menipis');
        }
        
        // Gambar produk - sesuai CSS .produk-img
        const imageHtml = produk.gambar 
            ? `<img src="${produk.gambar}" alt="${produk.nama}" loading="lazy">`
            : `<i class="fas fa-box"></i>`;
        
        // Stok text
        const stokText = produk.stok <= 0 ? 'Stok Habis' : `Stok: ${produk.stok}`;
        
        card.innerHTML = `
            <div class="produk-img">${imageHtml}</div>
            <div class="produk-nama" title="${produk.nama}">${produk.nama}</div>
            <div class="produk-harga">${formatRupiah(produk.harga_jual || produk.hargaJual || 0)}</div>
            <div class="produk-stok">${stokText}</div>
        `;
        
        // Event click untuk tambah ke keranjang
        card.addEventListener('click', () => {
            if (produk.stok > 0) {
                // Panggil fungsi global dari kasir-main.js
                if (typeof window.Keranjang !== 'undefined' && window.Keranjang.tambahItem) {
                    window.Keranjang.tambahItem(produk);
                } else if (typeof window.tambahKeKeranjang === 'function') {
                    window.tambahKeKeranjang(produk);
                } else {
                    console.error('[ProdukGrid] Keranjang tidak ditemukan');
                }
            } else {
                this.showToast('Stok produk habis', 'warning');
            }
        });
        
        return card;
    },
    
    /**
     * Tampilan kosong
     * @param {HTMLElement} container 
     */
    renderEmpty: function(container) {
        container.innerHTML = `
            <div class="loading-produk">
                <i class="fas fa-box-open" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>Tidak ada produk</p>
            </div>
        `;
    },
    
    /**
     * Update card secara realtime (setelah transaksi)
     * @param {string} produkId - ID produk
     * @param {number} newStok - Stok baru
     */
    updateCard: function(produkId, newStok) {
        const card = document.querySelector(`.produk-card[data-id="${produkId}"]`);
        if (!card) return;
        
        const stokEl = card.querySelector('.produk-stok');
        if (stokEl) {
            stokEl.textContent = newStok <= 0 ? 'Stok Habis' : `Stok: ${newStok}`;
        }
        
        // Update class stok
        card.classList.remove('stok-habis', 'stok-menipis');
        if (newStok <= 0) {
            card.classList.add('stok-habis');
        } else if (newStok <= 5) {
            card.classList.add('stok-menipis');
        }
    },
    
    /**
     * Helper: Format rupiah
     * @param {number} angka 
     * @returns {string}
     */
    formatRupiah: function(angka) {
        if (typeof formatRupiah === 'function') {
            return formatRupiah(angka);
        }
        return 'Rp ' + (angka || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    },
    
    /**
     * Helper: Show toast
     * @param {string} message 
     * @param {string} type 
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
window.ProdukGrid = ProdukGrid;
