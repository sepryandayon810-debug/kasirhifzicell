/**
 * Edit Produk Module - Fixed Version
 * File: js/modules/produk/edit-produk.js
 */

const EditProduk = {
    init: function() {
        console.log('[EditProduk] Initializing...');
        
        this.elements = {
            modal: document.getElementById('modal-edit-produk'),
            form: document.getElementById('form-edit-produk'),
            btnSimpan: document.getElementById('btn-simpan-edit'),
            btnBatal: document.getElementById('btn-batal-edit'),
            
            // Input fields
            id: document.getElementById('edit-produk-id'),
            kode: document.getElementById('edit-kode'),
            barcode: document.getElementById('edit-barcode'),
            nama: document.getElementById('edit-nama'),
            kategori: document.getElementById('edit-kategori'),
            satuan: document.getElementById('edit-satuan'),
            hargaModal: document.getElementById('edit-harga-modal'),
            hargaJual: document.getElementById('edit-harga-jual'),
            stok: document.getElementById('edit-stok'),
            deskripsi: document.getElementById('edit-deskripsi'),
            status: document.getElementById('edit-status')
        };
        
        if (!this.elements.modal) {
            console.error('[EditProduk] Modal tidak ditemukan!');
            return;
        }
        
        this.bindEvents();
        console.log('[EditProduk] Initialized');
    },
    
    bindEvents: function() {
        if (this.elements.btnSimpan) {
            this.elements.btnSimpan.addEventListener('click', (e) => {
                e.preventDefault();
                this.simpan();
            });
        }
        
        if (this.elements.btnBatal) {
            this.elements.btnBatal.addEventListener('click', (e) => {
                e.preventDefault();
                this.close();
            });
        }
    },
    
    open: async function(produkId) {
        console.log('[EditProduk] Opening edit for:', produkId);
        
        if (!this.elements.modal) {
            console.error('[EditProduk] Modal not found');
            return;
        }
        
        showToast('⏳ Memuat data...', 'info');
        
        try {
            const snapshot = await firebase.database().ref(`produk/${produkId}`).once('value');
            const produk = snapshot.val();
            
            if (!produk) {
                showToast('❌ Produk tidak ditemukan', 'error');
                return;
            }
            
            // Fill form
            if (this.elements.id) this.elements.id.value = produkId;
            if (this.elements.kode) this.elements.kode.value = produk.kode || '';
            if (this.elements.barcode) this.elements.barcode.value = produk.barcode || '';
            if (this.elements.nama) this.elements.nama.value = produk.nama || '';
            if (this.elements.kategori) this.elements.kategori.value = produk.kategori || '';
            if (this.elements.satuan) this.elements.satuan.value = produk.satuan || 'pcs';
            if (this.elements.hargaModal) this.elements.hargaModal.value = produk.harga_modal || 0;
            if (this.elements.hargaJual) this.elements.hargaJual.value = produk.harga_jual || 0;
            if (this.elements.stok) this.elements.stok.value = produk.stok || 0;
            if (this.elements.deskripsi) this.elements.deskripsi.value = produk.deskripsi || '';
            if (this.elements.status) this.elements.status.value = produk.status || 'aktif';
            
            // Show modal
            this.elements.modal.classList.add('active');
            
        } catch (error) {
            console.error('[EditProduk] Error loading:', error);
            showToast('❌ Gagal memuat data', 'error');
        }
    },
    
    simpan: async function() {
        const produkId = this.elements.id?.value;
        if (!produkId) {
            showToast('❌ ID produk tidak valid', 'error');
            return;
        }
        
        // Validasi
        const nama = this.elements.nama?.value?.trim();
        const hargaModal = parseInt(this.elements.hargaModal?.value) || 0;
        const hargaJual = parseInt(this.elements.hargaJual?.value) || 0;
        
        if (!nama) {
            showToast('❌ Nama produk wajib diisi', 'error');
            return;
        }
        if (hargaJual <= hargaModal) {
            showToast('❌ Harga jual harus lebih besar dari modal', 'error');
            return;
        }
        
        // Disable button
        if (this.elements.btnSimpan) {
            this.elements.btnSimpan.disabled = true;
            this.elements.btnSimpan.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        }
        
        try {
            const updateData = {
                kode: this.elements.kode?.value?.trim(),
                barcode: this.elements.barcode?.value?.trim() || '',
                nama: nama,
                kategori: this.elements.kategori?.value,
                satuan: this.elements.satuan?.value || 'pcs',
                harga_modal: hargaModal,
                harga_jual: hargaJual,
                stok: parseInt(this.elements.stok?.value) || 0,
                deskripsi: this.elements.deskripsi?.value?.trim() || '',
                status: this.elements.status?.value || 'aktif',
                updated_at: firebase.database.ServerValue.TIMESTAMP
            };
            
            await firebase.database().ref(`produk/${produkId}`).update(updateData);
            
            showToast('✅ Produk berhasil diupdate', 'success');
            this.close();
            
            // Refresh
            if (window.ProdukMain && window.ProdukMain.refresh) {
                window.ProdukMain.refresh();
            }
            
        } catch (error) {
            console.error('[EditProduk] Error saving:', error);
            showToast('❌ Gagal menyimpan: ' + error.message, 'error');
        } finally {
            if (this.elements.btnSimpan) {
                this.elements.btnSimpan.disabled = false;
                this.elements.btnSimpan.innerHTML = 'Simpan Perubahan';
            }
        }
    },
    
    close: function() {
        if (this.elements.modal) {
            this.elements.modal.classList.remove('active');
        }
    }
};

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => EditProduk.init());
} else {
    EditProduk.init();
}

// Global function untuk dipanggil dari HTML
window.editProduk = function(produkId) {
    EditProduk.open(produkId);
};

window.EditProduk = EditProduk;
