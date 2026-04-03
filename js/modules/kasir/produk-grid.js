// Produk Grid View Module - Updated
const ProdukGrid = {
    render: function(produkList, container) {
        container.innerHTML = '';
        container.classList.remove('list-view');
        container.classList.add('grid-view');
        
        if (produkList.length === 0) {
            this.renderEmpty(container);
            return;
        }
        
        // Wrapper untuk grid
        const gridWrapper = document.createElement('div');
        gridWrapper.className = 'produk-grid-wrapper';
        
        produkList.forEach(produk => {
            const card = this.createCard(produk);
            gridWrapper.appendChild(card);
        });
        
        container.appendChild(gridWrapper);
    },
    
    createCard: function(produk) {
        const card = document.createElement('div');
        card.className = 'produk-card-kasir';
        card.dataset.id = produk.id; // Penting untuk update realtime
        
        // Styling berdasarkan stok
        if (produk.stok <= 0) {
            card.classList.add('stok-habis');
        } else if (produk.stok <= 5) {
            card.classList.add('stok-menipis');
        }
        
        // Gambar produk
        const imageHtml = produk.gambar 
            ? `<img src="${produk.gambar}" alt="${produk.nama}" loading="lazy">`
            : `<i class="fas fa-box"></i>`;
        
        // Status stok
        const stokClass = produk.stok <= 0 ? 'habis' : (produk.stok <= 5 ? 'menipis' : 'tersedia');
        const stokText = produk.stok <= 0 ? 'Habis' : `${produk.stok}`;
        
        card.innerHTML = `
            <div class="card-image-kasir">${imageHtml}</div>
            <div class="card-body-kasir">
                <h4 class="card-nama-kasir">${produk.nama}</h4>
                <p class="card-harga-kasir">${formatRupiah(produk.harga_jual)}</p>
                <div class="card-meta-kasir">
                    <span class="badge-stok-kasir ${stokClass}">${stokText}</span>
                    ${produk.kategori ? `<span class="badge-kategori-kasir">${produk.kategori}</span>` : ''}
                </div>
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
        
        return card;
    },
    
    renderEmpty: function(container) {
        container.innerHTML = `
            <div class="empty-state-kasir">
                <i class="fas fa-box-open"></i>
                <p>Tidak ada produk</p>
            </div>
        `;
    },
    
    updateCard: function(produkId, newStok) {
        const card = document.querySelector(`.produk-card-kasir[data-id="${produkId}"]`);
        if (!card) return;
        
        const stokEl = card.querySelector('.badge-stok-kasir');
        if (stokEl) {
            stokEl.textContent = newStok <= 0 ? 'Habis' : `${newStok}`;
            stokEl.className = 'badge-stok-kasir ' + (newStok <= 0 ? 'habis' : (newStok <= 5 ? 'menipis' : 'tersedia'));
        }
        
        // Update class card
        card.classList.remove('stok-habis', 'stok-menipis');
        if (newStok <= 0) {
            card.classList.add('stok-habis');
        } else if (newStok <= 5) {
            card.classList.add('stok-menipis');
        }
    }
};

window.ProdukGrid = ProdukGrid;
