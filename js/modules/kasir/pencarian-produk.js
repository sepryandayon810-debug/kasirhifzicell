// Pencarian Produk Module

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-produk');
    const kategoriSelect = document.getElementById('filter-kategori');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(cariProduk, 300));
    }
    
    if (kategoriSelect) {
        kategoriSelect.addEventListener('change', cariProduk);
    }
});

function cariProduk() {
    const searchTerm = document.getElementById('search-produk').value.toLowerCase().trim();
    const kategori = document.getElementById('filter-kategori').value;
    
    let filtered = [...produkData];
    
    // Filter berdasarkan nama
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.nama.toLowerCase().includes(searchTerm) ||
            (p.kode && p.kode.toLowerCase().includes(searchTerm)) ||
            (p.barcode && p.barcode.includes(searchTerm))
        );
    }
    
    // Filter berdasarkan kategori
    if (kategori) {
        filtered = filtered.filter(p => p.kategori === kategori);
    }
    
    // Render hasil
    const container = document.getElementById('produk-container');
    container.innerHTML = '';
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="loading-produk">
                <i class="fas fa-search" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>Produk tidak ditemukan</p>
                <button class="btn btn-primary" onclick="document.getElementById('btn-transaksi-manual').click()" style="margin-top: 15px;">
                    <i class="fas fa-plus"></i> Tambah Manual
                </button>
            </div>
        `;
        return;
    }
    
    if (currentView === 'grid') {
        filtered.forEach(produk => {
            container.appendChild(createProdukCard(produk));
        });
    } else {
        container.classList.remove('grid-view');
        container.classList.add('list-view');
        filtered.forEach(produk => {
            container.appendChild(createProdukListItem(produk));
        });
    }
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Fungsi helper untuk create card (duplicate dari kasir-main untuk scope)
function createProdukCard(produk) {
    const card = document.createElement('div');
    card.className = 'produk-card';
    
    if (produk.stok <= 0) {
        card.classList.add('stok-habis');
    } else if (produk.stok <= 5) {
        card.classList.add('stok-menipis');
    }
    
    const imageHtml = produk.gambar 
        ? `<img src="${produk.gambar}" alt="${produk.nama}" class="produk-image">`
        : `<div class="produk-image-placeholder"><i class="fas fa-box"></i></div>`;
    
    const stokClass = produk.stok <= 0 ? 'habis' : (produk.stok <= 5 ? 'menipis' : '');
    const stokText = produk.stok <= 0 ? 'Stok Habis' : `Stok: ${produk.stok}`;
    
    card.innerHTML = `
        ${imageHtml}
        <div class="produk-info">
            <div class="produk-nama">${produk.nama}</div>
            <div class="produk-harga">${formatRupiah(produk.harga_jual)}</div>
            <div class="produk-stok ${stokClass}">${stokText}</div>
        </div>
    `;
    
    card.addEventListener('click', () => tambahKeKeranjang(produk));
    
    return card;
}

function createProdukListItem(produk) {
    const item = document.createElement('div');
    item.className = 'produk-list-item';
    
    if (produk.stok <= 0) {
        item.style.opacity = '0.5';
    }
    
    const imageHtml = produk.gambar 
        ? `<img src="${produk.gambar}" alt="${produk.nama}">`
        : `<div style="width:60px;height:60px;background:var(--bg-dark);border-radius:8px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-box"></i></div>`;
    
    item.innerHTML = `
        ${imageHtml}
        <div class="produk-list-info">
            <h4>${produk.nama}</h4>
            <p>${produk.kategori || 'Umum'}</p>
        </div>
        <div class="produk-list-harga">
            <div class="harga">${formatRupiah(produk.harga_jual)}</div>
            <div class="stok">Stok: ${produk.stok}</div>
        </div>
    `;
    
    item.addEventListener('click', () => tambahKeKeranjang(produk));
    
    return item;
}
