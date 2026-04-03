/**
 * Produk Grid Module - Modern Version
 * File: js/modules/kasir/produk-grid.js
 */

const ProdukGrid = {
    render: function(produkList, container) {
        container.innerHTML = '';
        
        if (produkList.length === 0) {
            container.innerHTML = `
                <div class="loading-produk">
                    <i class="fas fa-box-open" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>Tidak ada produk</p>
                </div>
            `;
            return;
        }
        
        produkList.forEach((produk, index) => {
            const card = this.createCard(produk, index);
            container.appendChild(card);
        });
    },
    
    createCard: function(produk, index) {
        const div = document.createElement('div');
        div.className = 'produk-card-modern';
        div.style.animationDelay = `${index * 0.05}s`;
        
        // Tentukan badge stok
        let stockBadge = '';
        if (produk.stok <= 0) {
            stockBadge = '<span class="stock-badge empty">Habis</span>';
        } else if (produk.stok <= 5) {
            stockBadge = '<span class="stock-badge low">' + produk.stok + '</span>';
        } else {
            stockBadge = '<span class="stock-badge">' + produk.stok + '</span>';
        }
        
        // Format harga
        const harga = this.formatRupiah(produk.harga_jual || 0);
        
        div.innerHTML = `
            <div class="card-content">
                <div class="produk-img-container">
                    <div class="produk-img-modern">
                        <i class="fas fa-box"></i>
                    </div>
                    ${stockBadge}
                </div>
                <div class="produk-nama-modern" title="${produk.nama}">${produk.nama}</div>
                <div class="produk-harga-modern">${harga}</div>
                
                <!-- TOMBOL ACTION -->
                <div class="card-actions">
                    <button class="btn-card-action edit" onclick="event.stopPropagation(); editProduk('${produk.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-card-action delete" onclick="event.stopPropagation(); hapusProduk('${produk.id}')" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-card-action edit" onclick="event.stopPropagation(); tambahKeKeranjang('${produk.id}')" title="Tambah" style="background: var(--accent-emerald);">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Click card untuk tambah ke keranjang
        div.addEventListener('click', () => {
            if (window.Keranjang) {
                window.Keranjang.addItem(produk);
            }
        });
        
        return div;
    },
    
    formatRupiah: function(angka) {
        return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    },
    
    updateCard: function(produkId, newStok) {
        // Update stok badge di card
        const cards = document.querySelectorAll('.produk-card-modern');
        cards.forEach(card => {
            const btn = card.querySelector(`button[onclick*="${produkId}"]`);
            if (btn) {
                const badge = card.querySelector('.stock-badge');
                if (badge) {
                    if (newStok <= 0) {
                        badge.className = 'stock-badge empty';
                        badge.textContent = 'Habis';
                    } else if (newStok <= 5) {
                        badge.className = 'stock-badge low';
                        badge.textContent = newStok;
                    } else {
                        badge.className = 'stock-badge';
                        badge.textContent = newStok;
                    }
                }
            }
        });
    }
};

// Export ke global
window.ProdukGrid = ProdukGrid;

// Fungsi global untuk tombol action
window.editProduk = function(id) {
    console.log('Edit produk:', id);
    // Implementasi edit
    if (window.showToast) {
        window.showToast('Fitur edit segera hadir', 'info');
    }
};

window.hapusProduk = function(id) {
    if (confirm('Yakin ingin menghapus produk ini?')) {
        console.log('Hapus produk:', id);
        if (window.showToast) {
            window.showToast('Produk dihapus', 'success');
        }
    }
};

window.tambahKeKeranjang = function(id) {
    // Cari produk di data
    if (window.produkData) {
        const produk = window.produkData.find(p => p.id === id);
        if (produk && window.Keranjang) {
            window.Keranjang.addItem(produk);
        }
    }
};
