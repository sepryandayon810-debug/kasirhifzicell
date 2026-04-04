/**
 * Tambah Produk Modal - WebPOS Modern
 * File: js/modules/produk/tambah-produk.js
 */

const TambahProduk = {
    elements: {},
    imageFile: null,
    
    init: function() {
        this.cacheElements();
        this.setupEventListeners();
    },
    
    cacheElements: function() {
        this.elements = {
            modal: document.getElementById('modal-tambah-produk'),
            form: document.getElementById('form-tambah-produk'),
            btnClose: document.getElementById('close-tambah'),
            btnCancel: document.getElementById('cancel-tambah'),
            btnSave: document.getElementById('save-tambah'),
            
            // Form fields
            inputKode: document.getElementById('input-kode'),
            inputBarcode: document.getElementById('input-barcode'),
            inputNama: document.getElementById('input-nama'),
            selectKategori: document.getElementById('input-kategori'),
            inputSatuan: document.getElementById('input-satuan'),
            inputHargaModal: document.getElementById('input-harga-modal'),
            inputHargaJual: document.getElementById('input-harga-jual'),
            inputStok: document.getElementById('input-stok'),
            inputMinStok: document.getElementById('input-min-stok'),
            inputDeskripsi: document.getElementById('input-deskripsi'),
            
            // Image upload
            imageUpload: document.getElementById('image-upload'),
            imagePreview: document.getElementById('image-preview'),
            btnRemoveImage: document.getElementById('remove-image'),
            
            // Profit calc
            profitDisplay: document.getElementById('profit-display'),
            marginDisplay: document.getElementById('margin-display')
        };
    },
    
    setupEventListeners: function() {
        const self = this;
        
        // Close buttons
        this.elements.btnClose?.addEventListener('click', () => this.close());
        this.elements.btnCancel?.addEventListener('click', () => this.close());
        
        // Form submit
        this.elements.form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.save();
        });
        
        // Auto generate kode
        this.elements.inputKode?.addEventListener('focus', () => {
            if (!this.elements.inputKode.value) {
                this.generateKode();
            }
        });
        
        // Profit calculation
        [this.elements.inputHargaModal, this.elements.inputHargaJual].forEach(el => {
            el?.addEventListener('input', () => this.calculateProfit());
        });
        
        // Image upload
        this.elements.imageUpload?.addEventListener('change', (e) => this.handleImageSelect(e));
        this.elements.btnRemoveImage?.addEventListener('click', () => this.removeImage());
        
        // Load kategori when modal opens
        document.addEventListener('click', (e) => {
            if (e.target.closest('#btn-tambah-produk')) {
                this.loadKategori();
                this.generateKode();
            }
        });
    },
    
    generateKode: function() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        if (this.elements.inputKode) {
            this.elements.inputKode.value = `PRD-${timestamp}${random}`;
        }
    },
    
    loadKategori: function() {
        const select = this.elements.selectKategori;
        if (!select || typeof firebase === 'undefined') return;
        
        firebase.database().ref('kategori').once('value')
            .then(snapshot => {
                select.innerHTML = '<option value="">Pilih Kategori</option>';
                snapshot.forEach(child => {
                    const k = child.val();
                    const option = document.createElement('option');
                    option.value = child.key;
                    option.textContent = k.nama;
                    select.appendChild(option);
                });
            });
    },
    
    calculateProfit: function() {
        const modal = parseInt(this.elements.inputHargaModal?.value) || 0;
        const jual = parseInt(this.elements.inputHargaJual?.value) || 0;
        const profit = jual - modal;
        const margin = modal > 0 ? ((profit / modal) * 100).toFixed(1) : 0;
        
        if (this.elements.profitDisplay) {
            this.elements.profitDisplay.textContent = this.formatRupiah(profit);
            this.elements.profitDisplay.className = profit >= 0 ? 'profit-positive' : 'profit-negative';
        }
        if (this.elements.marginDisplay) {
            this.elements.marginDisplay.textContent = `${margin}%`;
        }
    },
    
    handleImageSelect: function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 2 * 1024 * 1024) {
            showToast('❌ Gambar max 2MB', 'error');
            return;
        }
        
        this.imageFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (this.elements.imagePreview) {
                this.elements.imagePreview.src = e.target.result;
                this.elements.imagePreview.classList.add('has-image');
            }
        };
        reader.readAsDataURL(file);
    },
    
    removeImage: function() {
        this.imageFile = null;
        if (this.elements.imagePreview) {
            this.elements.imagePreview.src = '';
            this.elements.imagePreview.classList.remove('has-image');
        }
        if (this.elements.imageUpload) {
            this.elements.imageUpload.value = '';
        }
    },
    
    save: async function() {
        const btn = this.elements.btnSave;
        const originalText = btn?.innerHTML;
        
        // Validasi
        const nama = this.elements.inputNama?.value.trim();
        if (!nama) {
            showToast('❌ Nama produk wajib diisi', 'error');
            this.elements.inputNama?.focus();
            return;
        }
        
        const hargaJual = parseInt(this.elements.inputHargaJual?.value) || 0;
        if (hargaJual <= 0) {
            showToast('❌ Harga jual harus lebih dari 0', 'error');
            this.elements.inputHargaJual?.focus();
            return;
        }
        
        // Loading state
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        }
        
        try {
            let imageUrl = null;
            
            // Upload image if exists
            if (this.imageFile && firebase.storage) {
                const storageRef = firebase.storage().ref(`produk/${Date.now()}_${this.imageFile.name}`);
                const snapshot = await storageRef.put(this.imageFile);
                imageUrl = await snapshot.ref.getDownloadURL();
            }
            
            // Prepare data
            const data = {
                kode: this.elements.inputKode?.value || '',
                barcode: this.elements.inputBarcode?.value || '',
                nama: nama,
                kategori: this.elements.selectKategori?.value || '',
                satuan: this.elements.inputSatuan?.value || 'pcs',
                harga_modal: parseInt(this.elements.inputHargaModal?.value) || 0,
                harga_jual: hargaJual,
                stok: parseInt(this.elements.inputStok?.value) || 0,
                min_stok: parseInt(this.elements.inputMinStok?.value) || 5,
                deskripsi: this.elements.inputDeskripsi?.value || '',
                gambar: imageUrl,
                status: 'aktif',
                terjual: 0,
                created_at: Date.now(),
                updated_at: Date.now()
            };
            
            // Save to Firebase
            await firebase.database().ref('produk').push(data);
            
            showToast('✅ Produk berhasil ditambahkan', 'success');
            this.close();
            this.resetForm();
            
        } catch (error) {
            console.error('Error saving produk:', error);
            showToast('❌ Gagal menyimpan: ' + error.message, 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }
    },
    
    resetForm: function() {
        this.elements.form?.reset();
        this.removeImage();
        if (this.elements.profitDisplay) {
            this.elements.profitDisplay.textContent = 'Rp 0';
            this.elements.profitDisplay.className = '';
        }
        if (this.elements.marginDisplay) {
            this.elements.marginDisplay.textContent = '0%';
        }
    },
    
    close: function() {
        ProdukMain.closeModal('modal-tambah-produk');
    },
    
    formatRupiah: function(angka) {
        if (!angka) return 'Rp 0';
        return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => TambahProduk.init());
