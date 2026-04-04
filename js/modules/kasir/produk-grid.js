/**
 * Produk Grid Module - Modern Version with Edit
 * File: js/modules/kasir/produk-grid.js
 */

const ProdukGrid = {
    // Cache data produk untuk edit
    produkCache: {},
    
    render: function(produkList, container) {
        container.innerHTML = '';
        
        // Simpan ke cache
        produkList.forEach(p => {
            this.produkCache[p.id] = p;
        });
        
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
                    <button class="btn-card-action edit" onclick="event.stopPropagation(); ProdukGrid.openEditModal('${produk.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-card-action delete" onclick="event.stopPropagation(); ProdukGrid.hapusProduk('${produk.id}')" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-card-action add" onclick="event.stopPropagation(); ProdukGrid.tambahKeKeranjang('${produk.id}')" title="Tambah">
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
    
    // ========== EDIT PRODUK ==========
    
    openEditModal: function(produkId) {
        const produk = this.produkCache[produkId];
        if (!produk) {
            showToast('❌ Produk tidak ditemukan', 'error');
            return;
        }
        
        // Tutup modal yang sudah ada
        this.closeEditModal();
        
        // Buat modal
        const modal = document.createElement('div');
        modal.id = 'modal-edit-produk';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="ProdukGrid.closeEditModal()"></div>
            <div class="modal-content edit-produk-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-edit"></i> Edit Produk</h3>
                    <button class="btn-close" onclick="ProdukGrid.closeEditModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Nama Produk</label>
                        <input type="text" id="edit-nama" class="form-control" value="${this.escapeHtml(produk.nama)}" placeholder="Nama produk">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Harga Beli</label>
                            <input type="number" id="edit-harga-beli" class="form-control" value="${produk.harga_beli || 0}" placeholder="0">
                        </div>
                        <div class="form-group">
                            <label>Harga Jual</label>
                            <input type="number" id="edit-harga-jual" class="form-control" value="${produk.harga_jual || 0}" placeholder="0">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Stok</label>
                            <input type="number" id="edit-stok" class="form-control" value="${produk.stok || 0}" placeholder="0">
                        </div>
                        <div class="form-group">
                            <label>Kategori</label>
                            <select id="edit-kategori" class="form-control">
                                <option value="IPHONE" ${produk.kategori === 'IPHONE' ? 'selected' : ''}>IPHONE</option>
                                <option value="ANDROID" ${produk.kategori === 'ANDROID' ? 'selected' : ''}>ANDROID</option>
                                <option value="AKSESORIS" ${produk.kategori === 'AKSESORIS' ? 'selected' : ''}>AKSESORIS</option>
                                <option value="SERVIS" ${produk.kategori === 'SERVIS' ? 'selected' : ''}>SERVIS</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="ProdukGrid.closeEditModal()">Batal</button>
                    <button class="btn btn-primary" onclick="ProdukGrid.saveEdit('${produk.id}')">
                        <i class="fas fa-save"></i> Simpan Perubahan
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Trigger animation
        setTimeout(() => modal.classList.add('active'), 10);
        
        // Focus ke nama
        setTimeout(() => document.getElementById('edit-nama')?.focus(), 100);
    },
    
    closeEditModal: function() {
        const modal = document.getElementById('modal-edit-produk');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    },
    
    saveEdit: async function(produkId) {
        const nama = document.getElementById('edit-nama')?.value?.trim();
        const hargaBeli = parseInt(document.getElementById('edit-harga-beli')?.value || '0');
        const hargaJual = parseInt(document.getElementById('edit-harga-jual')?.value || '0');
        const stok = parseInt(document.getElementById('edit-stok')?.value || '0');
        const kategori = document.getElementById('edit-kategori')?.value;
        
        // Validasi
        if (!nama) {
            showToast('❌ Nama produk wajib diisi', 'error');
            return;
        }
        if (hargaJual <= 0) {
            showToast('❌ Harga jual harus lebih dari 0', 'error');
            return;
        }
        if (hargaBeli > hargaJual) {
            showToast('⚠️ Harga beli lebih besar dari harga jual', 'warning');
        }
        
        showToast('⏳ Menyimpan perubahan...', 'info');
        
        try {
            // Update ke Firebase
            const updateData = {
                nama: nama,
                harga_beli: hargaBeli,
                harga_jual: hargaJual,
                stok: stok,
                kategori: kategori,
                updatedAt: Date.now(),
                updatedBy: firebase.auth().currentUser?.uid || 'unknown'
            };
            
            await firebase.database().ref(`produk/${produkId}`).update(updateData);
            
            // Update cache
            this.produkCache[produkId] = { ...this.produkCache[produkId], ...updateData };
            
            this.closeEditModal();
            showToast('✅ Produk berhasil diupdate', 'success');
            
            // Refresh tampilan
            this.refreshGrid();
            
        } catch (error) {
            console.error('[ProdukGrid] Error saving:', error);
            showToast('❌ Gagal menyimpan: ' + error.message, 'error');
        }
    },
    
    // ========== HAPUS PRODUK ==========
    
    hapusProduk: async function(produkId) {
        const produk = this.produkCache[produkId];
        const namaProduk = produk ? produk.nama : 'Produk ini';
        
        if (!confirm(`Yakin ingin menghapus "${namaProduk}"?\n\nTindakan ini tidak dapat dibatalkan.`)) {
            return;
        }
        
        showToast('⏳ Menghapus produk...', 'info');
        
        try {
            // Soft delete - update status jadi deleted
            await firebase.database().ref(`produk/${produkId}`).update({
                status: 'deleted',
                deletedAt: Date.now(),
                deletedBy: firebase.auth().currentUser?.uid || 'unknown'
            });
            
            // Hapus dari cache
            delete this.produkCache[produkId];
            
            showToast('✅ Produk dihapus', 'success');
            
            // Refresh
            this.refreshGrid();
            
        } catch (error) {
            console.error('[ProdukGrid] Error deleting:', error);
            showToast('❌ Gagal menghapus: ' + error.message, 'error');
        }
    },
    
    // ========== TAMBAH KE KERANJANG ==========
    
    tambahKeKeranjang: function(produkId) {
        const produk = this.produkCache[produkId];
        if (!produk) {
            showToast('❌ Produk tidak ditemukan', 'error');
            return;
        }
        
        if (produk.stok <= 0) {
            showToast('❌ Stok produk habis', 'error');
            return;
        }
        
        if (window.Keranjang) {
            window.Keranjang.addItem(produk);
        }
    },
    
    // ========== UTILS ==========
    
    refreshGrid: function() {
        // Trigger reload dari firebase
        if (window.loadProduk) {
            window.loadProduk();
        } else if (window.KasirMain && window.KasirMain.loadProduk) {
            window.KasirMain.loadProduk();
        }
    },
    
    formatRupiah: function(angka) {
        return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    },
    
    escapeHtml: function(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
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

// Backward compatibility
window.editProduk = function(id) {
    ProdukGrid.openEditModal(id);
};

window.hapusProduk = function(id) {
    ProdukGrid.hapusProduk(id);
};

window.tambahKeKeranjang = function(id) {
    ProdukGrid.tambahKeKeranjang(id);
};
