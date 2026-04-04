/**
 * Kategori Manager - WebPOS Modern
 * File: js/modules/produk/kategori-manager.js
 */

const KategoriManager = {
    elements: {},
    kategoriData: [],
    editingId: null,
    
    init: function() {
        this.cacheElements();
        this.setupEventListeners();
    },
    
    cacheElements: function() {
        this.elements = {
            modal: document.getElementById('modal-kategori'),
            btnClose: document.getElementById('close-kategori'),
            btnCancel: document.getElementById('cancel-kategori'),
            form: document.getElementById('form-kategori'),
            inputNama: document.getElementById('kategori-nama'),
            inputDeskripsi: document.getElementById('kategori-deskripsi'),
            btnSave: document.getElementById('save-kategori'),
            listContainer: document.getElementById('kategori-list'),
            emptyState: document.getElementById('kategori-empty')
        };
    },
    
    setupEventListeners: function() {
        this.elements.btnClose?.addEventListener('click', () => this.close());
        this.elements.btnCancel?.addEventListener('click', () => this.close());
        this.elements.form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.save();
        });
        
        // Load data when modal opens
        document.addEventListener('click', (e) => {
            if (e.target.closest('#btn-kategori-manager')) {
                this.loadKategori();
            }
        });
    },
    
    loadKategori: function() {
        if (typeof firebase === 'undefined') return;
        
        firebase.database().ref('kategori').on('value', (snapshot) => {
            this.kategoriData = [];
            snapshot.forEach(child => {
                this.kategoriData.push({
                    id: child.key,
                    ...child.val()
                });
            });
            this.renderList();
        });
    },
    
    renderList: function() {
        const container = this.elements.listContainer;
        const empty = this.elements.emptyState;
        
        if (!container) return;
        
        if (this.kategoriData.length === 0) {
            container.innerHTML = '';
            if (empty) empty.style.display = 'block';
            return;
        }
        
        if (empty) empty.style.display = 'none';
        
        container.innerHTML = this.kategoriData.map((k, index) => `
            <div class="kategori-item" style="animation: slideIn 0.3s ease ${index * 0.05}s both">
                <div class="kategori-info">
                    <h4>${this.escapeHtml(k.nama)}</h4>
                    <p>${this.escapeHtml(k.deskripsi || 'Tidak ada deskripsi')}</p>
                    <span class="kategori-count">${k.count || 0} produk</span>
                </div>
                <div class="kategori-actions">
                    <button class="btn-icon-sm edit" onclick="KategoriManager.edit('${k.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon-sm delete" onclick="KategoriManager.delete('${k.id}')" title="Hapus">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    save: function() {
        const nama = this.elements.inputNama?.value.trim();
        if (!nama) {
            showToast('❌ Nama kategori wajib diisi', 'error');
            return;
        }
        
        const data = {
            nama: nama,
            deskripsi: this.elements.inputDeskripsi?.value || '',
            updated_at: Date.now()
        };
        
        const btn = this.elements.btnSave;
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        
        const promise = this.editingId 
            ? firebase.database().ref(`kategori/${this.editingId}`).update(data)
            : firebase.database().ref('kategori').push({...data, created_at: Date.now(), count: 0});
        
        promise
            .then(() => {
                showToast(this.editingId ? '✅ Kategori diupdate' : '✅ Kategori ditambahkan', 'success');
                this.resetForm();
            })
            .catch(err => {
                showToast('❌ Gagal menyimpan: ' + err.message, 'error');
            })
            .finally(() => {
                btn.disabled = false;
                btn.innerHTML = originalText;
            });
    },
    
    edit: function(id) {
        const kategori = this.kategoriData.find(k => k.id === id);
        if (!kategori) return;
        
        this.editingId = id;
        this.elements.inputNama.value = kategori.nama;
        this.elements.inputDeskripsi.value = kategori.deskripsi || '';
        this.elements.btnSave.innerHTML = '<i class="fas fa-save"></i> Update Kategori';
    },
    
    delete: function(id) {
        const kategori = this.kategoriData.find(k => k.id === id);
        if (!kategori) return;
        
        if (!confirm(`Yakin hapus kategori "${kategori.nama}"?\n\nProduk dengan kategori ini tidak akan terhapus.`)) {
            return;
        }
        
        firebase.database().ref(`kategori/${id}`).remove()
            .then(() => {
                showToast('✅ Kategori dihapus', 'success');
            })
            .catch(err => {
                showToast('❌ Gagal menghapus: ' + err.message, 'error');
            });
    },
    
    resetForm: function() {
        this.editingId = null;
        this.elements.form.reset();
        this.elements.btnSave.innerHTML = '<i class="fas fa-plus"></i> Tambah Kategori';
    },
    
    close: function() {
        this.resetForm();
        // Unsubscribe listener
        if (typeof firebase !== 'undefined') {
            firebase.database().ref('kategori').off();
        }
        ProdukMain.closeModal('modal-kategori');
    },
    
    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
