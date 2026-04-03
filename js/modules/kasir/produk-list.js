/**
 * Produk List Module - Modern Version
 * File: js/modules/kasir/produk-list.js
 */

const ProdukList = {
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
        
        // Header
        const header = document.createElement('div');
        header.className = 'produk-list-item';
        header.style.background = 'var(--bg-hover)';
        header.style.fontWeight = '700';
        header.style.fontSize = '12px';
        header.style.textTransform = 'uppercase';
        header.style.letterSpacing = '0.5px';
        header.style.color = 'var(--text-muted)';
        header.innerHTML = `
            <div></div>
            <div>Produk</div>
            <div>Harga</div>
            <div>Stok</div>
            <div>Action</div>
        `;
        container.appendChild(header);
        
        // Items
        produkList.forEach((produk, index) => {
            const item = this.createItem(produk, index);
            container.appendChild(item);
        });
    },
    
    createItem: function(produk, index) {
        const div = document.createElement('div');
        div.className = 'produk-list-item';
        div.style.animation = `fadeIn 0.4s ease ${index * 0.05}s backwards`;
        
        const harga = this.formatRupiah(produk.harga_jual || 0);
        
        // Stok badge
        let stokClass = '';
        let stokText = produk.stok || 0;
        if (produk.stok <= 0) {
            stokClass = 'style="color: var(--accent-rose);"';
            stokText = 'Habis';
        } else if (produk.stok <= 5) {
            stokClass = 'style="color: var(--accent-amber);"';
        }
        
        div.innerHTML = `
            <div class="list-item-img">
                <i class="fas fa-box"></i>
            </div>
            <div class="list-item-info">
                <h4>${produk.nama}</h4>
                <span>${produk.kode || '-'}</span>
            </div>
            <div class="list-item-harga">${harga}</div>
            <div class="list-item-stok" ${stokClass}>${stokText}</div>
            <div class="list-item-actions">
                <button class="btn-card-action edit" onclick="editProduk('${produk.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-card-action delete" onclick="hapusProduk('${produk.id}')" title="Hapus">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="btn-card-action edit" onclick="tambahKeKeranjang('${produk.id}')" title="Tambah" style="background: var(--accent-emerald);">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
        
        return div;
    },
    
    formatRupiah: function(angka) {
        return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    },
    
    updateRow: function(produkId, newStok) {
        // Update stok di row
        const rows = document.querySelectorAll('.produk-list-item');
        rows.forEach(row => {
            const btn = row.querySelector(`button[onclick*="${produkId}"]`);
            if (btn) {
                const stokCell = row.querySelector('.list-item-stok');
                if (stokCell) {
                    if (newStok <= 0) {
                        stokCell.style.color = 'var(--accent-rose)';
                        stokCell.textContent = 'Habis';
                    } else if (newStok <= 5) {
                        stokCell.style.color = 'var(--accent-amber)';
                        stokCell.textContent = newStok;
                    } else {
                        stokCell.style.color = '';
                        stokCell.textContent = newStok;
                    }
                }
            }
        });
    }
};

// Export ke global
window.ProdukList = ProdukList;
