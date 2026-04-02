/**
 * Produk Grid View Module - Manajemen Produk
 */

const ProdukManajemenGrid = {
    render: function(produkList, container, options = {}) {
        container.innerHTML = '';
        container.classList.remove('list-view');
        container.classList.add('grid-view');
        
        if (produkList.length === 0) {
            this.renderEmpty(container);
            return;
        }
        
        produkList.forEach((produk, index) => {
            const card = this.createCard(produk, index, options);
            container.appendChild(card);
        });
    },
    
    createCard: function(produk, index, options = {}) {
        const card = document.createElement('div');
        card.className = 'produk-card-manajemen';
        card.dataset.id = produk.id;
        
        if (produk.status === 'nonaktif') {
            card.classList.add('hidden-produk');
        }
        
        // Gambar
        const imageHtml = produk.gambar 
            ? `<img src="${produk.gambar}" alt="${produk.nama}" loading="lazy">`
            : `<div class="produk-image-placeholder"><i class="fas fa-box"></i></div>`;
        
        // Status badge
        const statusClass = produk.status || 'aktif';
        const statusText = produk.status === 'nonaktif' ? 'Nonaktif' : 'Aktif';
        
        // Stok class
        let stokClass = '';
        let stokText = `${produk.stok || 0} ${produk.satuan || 'pcs'}`;
        if (produk.stok <= 0) {
            stokClass = 'habis';
            stokText = 'Stok Habis';
        } else if (produk.stok <= 5) {
            stokClass = 'menipis';
        }
        
        card.innerHTML = `
            <div class="produk-image-container">
                ${imageHtml}
                <span class="produk-status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="produk-info">
                <div class="produk-kode">${produk.kode || '-'}</div>
                <div class="produk-nama" title="${produk.nama}">${produk.nama}</div>
                <div class="produk-harga">
                    <span class="harga-jual">${formatRupiah(produk.harga_jual || 0)}</span>
                    <span class="harga-modal">Modal: ${formatRupiah(produk.harga_modal || 0)}</span>
                </div>
                <div class="produk-stok">
                    <span>Stok:</span>
                    <span class="stok-value ${stokClass}">${stokText}</span>
                </div>
            </div>
            <div class="produk-actions">
                <button class="btn-action edit" onclick="editProduk('${produk.id}')" title="Edit">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-action delete" onclick="hapusProduk('${produk.id}')" title="Hapus">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        card.style.animation = `fadeIn 0.3s ease ${index * 0.05}s both`;
        
        return card;
    },
    
    renderEmpty: function(container) {
        container.innerHTML = `
            <div class="loading-produk" style="grid-column: 1/-1; padding: 60px;">
                <i class="fas fa-box-open" style="font-size: 64px; color: var(--text-secondary); opacity: 0.5; margin-bottom: 20px;"></i>
                <h3 style="color: var(--text-secondary); margin-bottom: 10px;">Tidak ada produk</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">Silakan tambah produk baru atau import dari Excel</p>
                <button class="btn btn-primary" onclick="document.getElementById('btn-tambah-produk').click()">
                    <i class="fas fa-plus"></i> Tambah Produk
                </button>
            </div>
        `;
    },
    
    updateCard: function(produkId, data) {
        // Update specific card if needed
        const card = document.querySelector(`.produk-card-manajemen[data-id="${produkId}"]`);
        if (!card) return;
        
        // Re-render the specific card or update fields
        // For simplicity, trigger full refresh
        if (typeof loadProduk === 'function') {
            loadProduk();
        }
    }
};

window.ProdukManajemenGrid = ProdukManajemenGrid;
