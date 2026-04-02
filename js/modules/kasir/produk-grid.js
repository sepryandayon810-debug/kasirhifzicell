// Produk Grid View Module
// Menangani tampilan produk dalam bentuk grid/card

const ProdukGrid = {
    // Render produk dalam format grid
    render: function(produkList, container) {
        container.innerHTML = '';
        container.classList.remove('list-view');
        container.classList.add('grid-view');
        
        if (produkList.length === 0) {
            this.renderEmpty(container);
            return;
        }
        
        produkList.forEach(produk => {
            const card = this.createCard(produk);
            container.appendChild(card);
        });
    },
    
    // Buat elemen card produk
    createCard: function(produk) {
        const card = document.createElement('div');
        card.className = 'produk-card';
        
        // Styling berdasarkan stok
        if (produk.stok <= 0) {
            card.classList.add('stok-habis');
        } else if (produk.stok <= 5) {
            card.classList.add('stok-menipis');
        }
        
        // Gambar produk
        const imageHtml = produk.gambar 
            ? `<img src="${produk.gambar}" alt="${produk.nama}" class="produk-image" loading="lazy">`
            : `<div class="produk-image-placeholder"><i class="fas fa-box"></i></div>`;
        
        // Status stok
        const stokClass = produk.stok <= 0 ? 'habis' : (produk.stok <= 5 ? 'menipis' : '');
        const stokText = produk.stok <= 0 ? 'Stok Habis' : `Stok: ${produk.stok}`;
        
        card.innerHTML = `
            ${imageHtml}
            <div class="produk-info">
                <div class="produk-nama" title="${produk.nama}">${produk.nama}</div>
                <div class="produk-harga">${formatRupiah(produk.harga_jual)}</div>
                <div class="produk-stok ${stokClass}">${stokText}</div>
                ${produk.kategori ? `<div class="produk-kategori"><small>${produk.kategori}</small></div>` : ''}
            </div>
        `;
        
        // Event click
        card.addEventListener('click', () => {
            if (produk.stok > 0) {
                window.tambahKeKeranjang(produk);
            } else {
                showToast('Stok produk habis', 'warning');
            }
        });
        
        // Animasi
        card.style.animation = 'fadeIn 0.3s ease';
        
        return card;
    },
    
    // Tampilan kosong
    renderEmpty: function(container) {
        container.innerHTML = `
            <div class="loading-produk" style="grid-column: 1/-1;">
                <i class="fas fa-box-open" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>Tidak ada produk</p>
            </div>
        `;
    },
    
    // Update single card (untuk realtime update stok)
    updateCard: function(produkId, newStok) {
        const cards = document.querySelectorAll('.produk-card');
        cards.forEach(card => {
            // Cari card berdasarkan data attribute (perlu ditambahkan saat create)
            if (card.dataset.id === produkId) {
                const stokEl = card.querySelector('.produk-stok');
                if (stokEl) {
                    stokEl.textContent = `Stok: ${newStok}`;
                    stokEl.className = 'produk-stok ' + (newStok <= 5 ? 'menipis' : '');
                }
            }
        });
    }
};

// Export
window.ProdukGrid = ProdukGrid;
