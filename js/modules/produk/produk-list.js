/**
 * Produk List View Module - Manajemen Produk
 */

const ProdukManajemenList = {
    render: function(produkList, container, options = {}) {
        container.innerHTML = '';
        container.classList.remove('grid-view');
        container.classList.add('list-view');
        
        if (produkList.length === 0) {
            this.renderEmpty(container);
            return;
        }
        
        produkList.forEach((produk, index) => {
            const item = this.createItem(produk, index, options);
            container.appendChild(item);
        });
    },
    
    createItem: function(produk, index, options = {}) {
        const item = document.createElement('div');
        item.className = 'produk-list-item-manajemen';
        item.dataset.id = produk.id;
        
        if (produk.status === 'nonaktif') {
            item.classList.add('hidden-produk');
        }
        
        // Gambar
        const imageHtml = produk.gambar 
            ? `<img src="${produk.gambar}" alt="${produk.nama}" class="list-image" loading="lazy">`
            : `<div class="list-image-placeholder"><i class="fas fa-box"></i></div>`;
        
        // Stok class
        let stokClass = '';
        let stokText = `${produk.stok || 0} ${produk.satuan || 'pcs'}`;
        if (produk.stok <= 0) {
            stokClass = 'habis';
            stokText = 'Habis';
        } else if (produk.stok <= 5) {
            stokClass = 'menipis';
        }
        
        // Status badge
        const statusBadge = produk.status === 'nonaktif' 
            ? `<span class="badge badge-secondary">Nonaktif</span>`
            : `<span class="badge badge-success">Aktif</span>`;
        
        item.innerHTML = `
            ${imageHtml}
            <div class="list-info">
                <h4>${produk.nama}</h4>
                <p>${produk.kode || '-'} | ${produk.kategori || 'Umum'}</p>
            </div>
            <div class="list-harga">
                <div class="jual">${formatRupiah(produk.harga_jual || 0)}</div>
                <div class="modal">Modal: ${formatRupiah(produk.harga_modal || 0)}</div>
            </div>
            <div class="list-stok">
                <div class="value ${stokClass}">${stokText}</div>
            </div>
            <div class="list-status">
                ${statusBadge}
            </div>
            <div class="list-actions">
                <button class="btn btn-sm btn-info" onclick="editProduk('${produk.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="hapusProduk('${produk.id}')" title="Hapus">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        item.style.animation = `fadeIn 0.3s ease ${index * 0.03}s both`;
        
        return item;
    },
    
    renderEmpty: function(container) {
        container.innerHTML = `
            <div class="loading-produk" style="padding: 60px; text-align: center;">
                <i class="fas fa-box-open" style="font-size: 64px; color: var(--text-secondary); opacity: 0.5; margin-bottom: 20px;"></i>
                <h3 style="color: var(--text-secondary); margin-bottom: 10px;">Tidak ada produk</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">Silakan tambah produk baru atau import dari Excel</p>
                <button class="btn btn-primary" onclick="document.getElementById('btn-tambah-produk').click()">
                    <i class="fas fa-plus"></i> Tambah Produk
                </button>
            </div>
        `;
    }
};

window.ProdukManajemenList = ProdukManajemenList;
