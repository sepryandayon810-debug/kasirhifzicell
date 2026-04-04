/**
 * Tambah Produk Module - Fixed Version
 * File: js/modules/produk/tambah-produk.js
 */

const TambahProduk = {
    init: function() {
        console.log('[TambahProduk] Initializing...');
        
        // Cache elements dengan pengecekan null
        this.elements = {
            form: document.getElementById('form-tambah-produk'),
            modal: document.getElementById('modal-tambah-produk'),
            btnSimpan: document.getElementById('btn-simpan-produk'),
            btnBatal: document.getElementById('btn-batal-produk'),
            
            // Input fields
            kode: document.getElementById('produk-kode'),
            barcode: document.getElementById('produk-barcode'),
            nama: document.getElementById('produk-nama'),
            kategori: document.getElementById('produk-kategori'),
            satuan: document.getElementById('produk-satuan'),
            hargaModal: document.getElementById('produk-harga-modal'),
            hargaJual: document.getElementById('produk-harga-jual'),
            stok: document.getElementById('produk-stok'),
            deskripsi: document.getElementById('produk-deskripsi'),
            status: document.getElementById('produk-status'),
            
            // Image
            gambar: document.getElementById('produk-gambar'),
            preview: document.getElementById('image-preview'),
            btnHapusGambar: document.getElementById('btn-hapus-gambar')
        };
        
        // Cek elemen kritis
        if (!this.elements.modal) {
            console.error('[TambahProduk] Modal tidak ditemukan!');
            return;
        }
        
        // Bind events
        this.bindEvents();
        
        // Generate kode awal
        this.generateKode();
        
        console.log('[TambahProduk] Initialized');
    },
    
    bindEvents: function() {
        // Tombol simpan
        if (this.elements.btnSimpan) {
            this.elements.btnSimpan.addEventListener('click', (e) => {
                e.preventDefault();
                this.simpan();
            });
        }
        
        // Tombol batal
        if (this.elements.btnBatal) {
            this.elements.btnBatal.addEventListener('click', (e) => {
                e.preventDefault();
                this.close();
            });
        }
        
        // Image upload
        if (this.elements.gambar) {
            this.elements.gambar.addEventListener('change', (e) => this.handleImage(e));
        }
        
        // Hapus gambar
        if (this.elements.btnHapusGambar) {
            this.elements.btnHapusGambar.addEventListener('click', (e) => {
                e.preventDefault();
                this.hapusGambar();
            });
        }
        
        // Auto calculate harga jual dari modal (optional 20% markup)
        if (this.elements.hargaModal && this.elements.hargaJual) {
            this.elements.hargaModal.addEventListener('blur', () => {
                const modal = parseInt(this.elements.hargaModal.value) || 0;
                if (modal > 0 && !this.elements.hargaJual.value) {
                    this.elements.hargaJual.value = Math.round(modal * 1.2);
                }
            });
        }
    },
    
    generateKode: function() {
        if (!this.elements.kode) return;
        
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        this.elements.kode.value = `PRD-${timestamp}${random}`;
    },
    
    handleImage: function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validasi ukuran (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showToast('Ukuran gambar maksimal 2MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            this.selectedImage = event.target.result;
            
            if (this.elements.preview) {
                this.elements.preview.innerHTML = `<img src="${this.selectedImage}" alt="Preview">`;
                this.elements.preview.classList.add('has-image');
            }
            
            if (this.elements.btnHapusGambar) {
                this.elements.btnHapusGambar.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    },
    
    hapusGambar: function() {
        this.selectedImage = null;
        
        if (this.elements.preview) {
            this.elements.preview.innerHTML = '<i class="fas fa-image"></i><span>Preview</span>';
            this.elements.preview.classList.remove('has-image');
        }
        
        if (this.elements.gambar) {
            this.elements.gambar.value = '';
        }
        
        if (this.elements.btnHapusGambar) {
            this.elements.btnHapusGambar.style.display = 'none';
        }
    },
    
    validate: function() {
        const errors = [];
        
        // Cek elemen exists sebelum ambil value
        const nama = this.elements.nama?.value?.trim();
        const kategori = this.elements.kategori?.value;
        const hargaModal = parseInt(this.elements.hargaModal?.value) || 0;
        const hargaJual = parseInt(this.elements.hargaJual?.value) || 0;
        
        if (!nama) errors.push('Nama produk wajib diisi');
        if (!kategori) errors.push('Kategori wajib dipilih');
        if (hargaModal <= 0) errors.push('Harga modal harus lebih dari 0');
        if (hargaJual <= 0) errors.push('Harga jual harus lebih dari 0');
        if (hargaJual <= hargaModal) errors.push('Harga jual harus lebih besar dari harga modal');
        
        return errors;
    },
    
    simpan: async function() {
        const errors = this.validate();
        if (errors.length > 0) {
            showToast(errors[0], 'error');
            return;
        }
        
        // Disable button
        if (this.elements.btnSimpan) {
            this.elements.btnSimpan.disabled = true;
            this.elements.btnSimpan.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        }
        
        try {
            // Prepare data
            const data = {
                kode: this.elements.kode?.value?.trim() || this.generateKode(),
                barcode: this.elements.barcode?.value?.trim() || '',
                nama: this.elements.nama?.value?.trim(),
                kategori: this.elements.kategori?.value,
                satuan: this.elements.satuan?.value || 'pcs',
                harga_modal: parseInt(this.elements.hargaModal?.value) || 0,
                harga_jual: parseInt(this.elements.hargaJual?.value) || 0,
                stok: parseInt(this.elements.stok?.value) || 0,
                deskripsi: this.elements.deskripsi?.value?.trim() || '',
                status: this.elements.status?.value || 'aktif',
                gambar: this.selectedImage || null,
                created_at: firebase.database.ServerValue.TIMESTAMP,
                updated_at: firebase.database.ServerValue.TIMESTAMP,
                terjual: 0
            };
            
            // Save to Firebase
            const newRef = firebase.database().ref('produk').push();
            await newRef.set(data);
            
            showToast('✅ Produk berhasil ditambahkan', 'success');
            this.reset();
            this.close();
            
            // Refresh produk list
            if (window.ProdukMain && window.ProdukMain.refresh) {
                window.ProdukMain.refresh();
            }
            
        } catch (error) {
            console.error('[TambahProduk] Error:', error);
            showToast('❌ Gagal menyimpan: ' + error.message, 'error');
        } finally {
            if (this.elements.btnSimpan) {
                this.elements.btnSimpan.disabled = false;
                this.elements.btnSimpan.innerHTML = 'Simpan Produk';
            }
        }
    },
    
    reset: function() {
        if (this.elements.form) {
            this.elements.form.reset();
        }
        this.hapusGambar();
        this.generateKode();
    },
    
    open: function() {
        if (this.elements.modal) {
            this.elements.modal.classList.add('active');
            this.reset();
        }
    },
    
    close: function() {
        if (this.elements.modal) {
            this.elements.modal.classList.remove('active');
        }
    }
};

// Initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TambahProduk.init());
} else {
    TambahProduk.init();
}

window.TambahProduk = TambahProduk;
