/**
 * Produk List View Module
 * File: js/modules/kasir/produk-list.js
 * 
 * Menangani tampilan produk dalam bentuk list/row
 */

const ProdukList = {
    /**
     * Render produk dalam format list
     * @param {Array} produkList - Array data produk
     * @param {HTMLElement} container - Container untuk render
     */
    render: function(produkList, container) {
        if (!container) {
            console.error('[ProdukList] Container tidak ditemukan');
            return;
        }
        
        container.innerHTML = '';
        container.classList.remove('grid-view');
        container.classList.add('list-view');
        
        if (!produkList || produkList.length === 0) {
            this.renderEmpty(container);
            return;
        }
        
        // Buat table structure sesuai CSS yang ada
        const table = document.createElement('div');
        table.className = 'produk-table';
        
        // Header
        const header = document.createElement('div');
        header.className = 'produk-table-header';
        header.innerHTML = `
            <div class="col-produk">Produk</div>
            <div class="col-kategori">Kategori</div>
            <div class="col-harga">Harga</div>
            <div class="col-stok">Stok</div>
            <div class="col-aksi">Aksi</div>
        `;
        table.appendChild(header);
        
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
    
    /**
     * Buat row produk
     * @param {Object} produk - Data produk
     * @returns {HTMLElement} Row element
     */
    createRow: function(produk) {
        const row = document.createElement('div');
        row.className = 'produk-table-row';
        row.dataset.id = produk.id || produk.key;
        
        // Stok styling
        if (produk.stok <= 0) {
            row.classList.add('stok-habis');
        } else if (produk.stok <= 5) {
            row.classList.add('stok-menipis');
        }
        
        // Gambar
        const imageHtml = produk.gambar 
            ? `<img src="${produk.gambar}" alt="${produk.nama}" class="row-image" loading="lazy">`
            : `<div class="row-image-placeholder"><i class="fas fa-box"></i></div>`;
        
        // Stok badge
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
                <span class="row-harga">${this.formatRupiah(produk.harga_jual || produk.hargaJual || 0)}</span>
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
                this.tambahKeKeranjang(produk);
            }
        });
        
        // Event click tombol tambah
        const btnTambah = row.querySelector('.btn-tambah');
        if (btnTambah && produk.stok > 0) {
            btnTambah.addEventListener('click', (e) => {
                e.stopPropagation();
                this.tambahKeKeranjang(produk);
            });
        }
        
        return row;
    },
    
    /**
     * Tambah produk ke keranjang
     * @param {Object} produk 
     */
    tambahKeKeranjang: function(produk) {
        if (typeof window.Keranjang !== 'undefined' && window.Keranjang.tambahItem) {
            window.Keranjang.tambahItem(produk);
        } else if (typeof window.tambahKeKeranjang === 'function') {
            window.tambahKeKeranjang(produk);
        } else {
            console.error('[ProdukList] Keranjang tidak ditemukan');
        }
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
     * Update row secara realtime
     * @param {string} produkId 
     * @param {number} newStok 
     */
    updateRow: function(produkId, newStok) {
        const row = document.querySelector(`.produk-table-row[data-id="${produkId}"]`);
        if (!row) return;
        
        const stokEl = row.querySelector('.badge-stok');
        const btnEl = row.querySelector('.btn-tambah');
        
        if (stokEl) {
            stokEl.textContent = newStok;
            stokEl.className = 'badge-stok ' + (newStok <= 0 ? 'habis' : (newStok <= 5 ? 'menipis' : 'tersedia'));
        }
        
        if (btnEl) {
            btnEl.disabled = newStok <= 0;
            btnEl.classList.toggle('disabled', newStok <= 0);
        }
        
        // Update class row
        row.classList.remove('stok-habis', 'stok-menipis');
        if (newStok <= 0) row.classList.add('stok-habis');
        else if (newStok <= 5) row.classList.add('stok-menipis');
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
    }
};

// Export ke window
window.ProdukList = ProdukList;
