// Produk List View Module
// Menangani tampilan produk dalam bentuk list/row

const ProdukList = {
    // Render produk dalam format list
    render: function(produkList, container) {
        container.innerHTML = '';
        container.classList.remove('grid-view');
        container.classList.add('list-view');
        
        if (produkList.length === 0) {
            this.renderEmpty(container);
            return;
        }
        
        // Buat table header
        const table = document.createElement('div');
        table.className = 'produk-table';
        
        // Header
        table.innerHTML = `
            <div class="produk-table-header">
                <div class="col-produk">Produk</div>
                <div class="col-kategori">Kategori</div>
                <div class="col-harga">Harga</div>
                <div class="col-stok">Stok</div>
                <div class="col-aksi">Aksi</div>
            </div>
        `;
        
        // Body
        const body = document.createElement('div');
        body.className = 'produk-table-body';
        
        produkList.forEach(produk => {
            const row = this.createRow(produk);
            body.appendChild(row);
        });
        
        table.appendChild(body);
        container.appendChild(table);
    },
    
    // Buat row produk
    createRow: function(produk) {
        const row = document.createElement('div');
        row.className = 'produk-table-row';
        
        if (produk.stok <= 0) {
            row.classList.add('stok-habis');
        } else if (produk.stok <= 5) {
            row.classList.add('stok-menipis');
        }
        
        const imageHtml = produk.gambar 
            ? `<img src="${produk.gambar}" alt="${produk.nama}" class="row-image">`
            : `<div class="row-image-placeholder"><i class="fas fa-box"></i></div>`;
        
        const stokClass = produk.stok <= 0 ? 'habis' : (produk.stok <= 5 ? 'menipis' : 'tersedia');
        
        row.innerHTML = `
            <div class="col-produk">
                ${imageHtml}
                <div class="row-info">
                    <div class="row-nama">${produk.nama}</div>
                    ${produk.kode ? `<small class="row-kode">Kode: ${produk.kode}</small>` : ''}
                </div>
            </div>
            <div class="col-kategori">
                <span class="badge-kategori">${produk.kategori || 'Umum'}</span>
            </div>
            <div class="col-harga">
                <span class="row-harga">${formatRupiah(produk.harga_jual)}</span>
            </div>
            <div class="col-stok">
                <span class="badge-stok ${stokClass}">${produk.stok}</span>
            </div>
            <div class="col-aksi">
                <button class="btn-tambah ${produk.stok <= 0 ? 'disabled' : ''}" 
                        ${produk.stok <= 0 ? 'disabled' : ''}>
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
        
        // Event click pada row (kecuali tombol)
        row.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-tambah') && produk.stok > 0) {
                window.tambahKeKeranjang(produk);
            }
        });
        
        // Event click tombol tambah
        const btnTambah = row.querySelector('.btn-tambah');
        if (btnTambah && produk.stok > 0) {
            btnTambah.addEventListener('click', (e) => {
                e.stopPropagation();
                window.tambahKeKeranjang(produk);
            });
        }
        
        return row;
    },
    
    // Tampilan kosong
    renderEmpty: function(container) {
        container.innerHTML = `
            <div class="loading-produk">
                <i class="fas fa-box-open" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>Tidak ada produk</p>
            </div>
        `;
    }
};

// Export
window.ProdukList = ProdukList;
