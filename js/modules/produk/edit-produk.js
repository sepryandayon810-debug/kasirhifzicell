/**
 * Edit Produk Modal - WebPOS Modern
 * File: js/modules/produk/edit-produk.js
 */

const EditProduk = {
    elements: {},
    currentId: null,
    imageFile: null,
    originalData: null,
    
    init: function() {
        this.cacheElements();
        this.setupEventListeners();
    },
    
    cacheElements: function() {
        this.elements = {
            modal: document.getElementById('modal-edit-produk'),
            form: document.getElementById('form-edit-produk'),
            btnClose: document.getElementById('close-edit'),
            btnCancel: document.getElementById('cancel-edit'),
            btnSave: document.getElementById('save-edit'),
            
            // Form fields
            inputKode: document.getElementById('edit-kode'),
            inputBarcode: document.getElementById('edit-barcode'),
            inputNama: document.getElementById('edit-nama'),
            selectKategori: document.getElementById('edit-kategori'),
            inputSatuan: document.getElementById('edit-satuan'),
            inputHargaModal: document.getElementById('edit-harga-modal'),
            inputHargaJual: document.getElementById('edit-harga-jual'),
            inputStok: document.getElementById('edit-stok'),
            inputMinStok: document.getElementById('edit-min-stok'),
            inputDeskripsi: document.getElementById('edit-deskripsi'),
            
            // Image
            imageUpload: document.getElementById('edit-image-upload'),
            imagePreview: document.getElementById('edit-image-preview'),
            btnRemoveImage: document.getElementById('edit-remove-image'),
            
            // Profit
            profitDisplay: document.getElementById('edit-profit-display'),
            marginDisplay: document.getElementById('edit-margin-display')
        };
    },
    
    setupEventListeners: function() {
        // Close buttons
        this.elements.btnClose?.addEventListener('click', () => this.close());
        this.elements.btnCancel?.addEventListener('click', () => this.close());
        
        // Form submit
        this.elements.form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.save();
        });
        
        // Profit calculation
        [this.elements.inputHargaModal, this.elements.inputHargaJual].forEach(el => {
            el?.addEventListener('input', () => this.calculateProfit());
        });
        
        // Image upload
        this.elements.imageUpload?.addEventListener('change', (e) => this.handleImageSelect(e));
        this.elements.btnRemoveImage?.addEventListener('click', () => this.removeImage());
    },
    
    open: function(id) {
        this.currentId = id;
        this.loadData(id);
        this.loadKategori();
        ProdukMain.openModal('modal-edit-produk');
    },
    
    loadData: function(id) {
        if (typeof firebase === 'undefined') return;
        
        firebase.database().ref(`produk/${id}`).once('value')
            .then(snapshot => {
                const data = snapshot.val();
                if (!data) {
                    showToast('❌ Produk tidak ditemukan', 'error');
                    this.close();
                    return;
                }
                
                this.originalData = data;
                
                // Fill form
                if (this.elements.inputKode) this.elements.inputKode.value = data.kode || '';
                if (this.elements.inputBarcode) this.elements.inputBarcode.value = data.barcode || '';
                if (this.elements.inputNama) this.elements.inputNama.value = data.nama || '';
                if (this.elements.selectKategori) this.elements.selectKategori.value = data.kategori || '';
                if (this.elements.inputSatuan) this.elements.inputSatuan.value = data.satuan || 'pcs';
                if (this.elements.inputHargaModal) this.elements.inputHargaModal.value = data.harga_modal || data.hargaModal || 0;
                if (this.elements.inputHargaJual) this.elements.inputHargaJual.value = data.harga_jual || data.hargaJual || 0;
                if (this.elements.inputStok) this.elements.inputStok.value = data.stok || 0;
                if (this.elements.inputMinStok) this.elements.inputMinStok.value = data.min_stok || 5;
                if (this.elements.inputDeskripsi) this.elements.inputDeskripsi.value = data.deskripsi || '';
                
                // Image
                if (data.gambar && this.elements.imagePreview) {
                    this.elements.imagePreview.src = data.gambar;
                    this.elements.imagePreview.classList.add('has-image');
                } else {
                    this.removeImage();
                }
                
                this.calculateProfit();
            });
    },
    
    loadKategori: function() {
        const select = this.elements.selectKategori;
        if (!select || typeof firebase === 'undefined') return;
        
        const currentVal = select.value;
        
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
                select.value = currentVal;
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
            return;
        }
        
        const hargaJual = parseInt(this.elements.inputHargaJual?.value) || 0;
        if (hargaJual <= 0) {
            showToast('❌ Harga jual harus lebih dari 0', 'error');
            return;
        }
        
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        }
        
        try {
            let imageUrl = this.originalData?.gambar || null;
            
            // Upload new image if selected
            if (this.imageFile && firebase.storage) {
                const storageRef = firebase.storage().ref(`produk/${Date.now()}_${this.imageFile.name}`);
                const snapshot = await storageRef.put(this.imageFile);
                imageUrl = await snapshot.ref.getDownloadURL();
            }
            
            // Prepare update data
            const updates = {
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
                updated_at: Date.now()
            };
            
            await firebase.database().ref(`produk/${this.currentId}`).update(updates);
            
            showToast('✅ Produk berhasil diupdate', 'success');
            this.close();
            
        } catch (error) {
            console.error('Error updating produk:', error);
            showToast('❌ Gagal mengupdate: ' + error.message, 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }
    },
    
    close: function() {
        this.currentId = null;
        this.originalData = null;
        this.imageFile = null;
        ProdukMain.closeModal('modal-edit-produk');
    },
    
    formatRupiah: function(angka) {
        if (!angka) return 'Rp 0';
        return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => EditProduk.init());
