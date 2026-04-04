/**
 * Stok Masal - WebPOS Modern
 * File: js/modules/produk/stok-masal.js
 */

const StokMasal = {
    elements: {},
    selectedProduk: [],
    
    init: function() {
        this.cacheElements();
        this.setupEventListeners();
    },
    
    cacheElements: function() {
        this.elements = {
            modal: document.getElementById('modal-stok'),
            btnClose: document.getElementById('close-stok'),
            btnCancel: document.getElementById('cancel-stok'),
            btnSave: document.getElementById('save-stok'),
            
            // Search & select
            searchInput: document.getElementById('stok-search'),
            produkList: document.getElementById('stok-produk-list'),
            selectedContainer: document.getElementById('stok-selected'),
            
            // Operation
            operationType: document.getElementById('stok-operation'),
            inputJumlah: document.getElementById('stok-jumlah'),
            inputKeterangan: document.getElementById('stok-keterangan'),
            
            // Summary
            summaryContainer: document.getElementById('stok-summary')
        };
    },
    
    setupEventListeners: function() {
        this.elements.btnClose?.addEventListener('click', () => this.close());
        this.elements.btnCancel?.addEventListener('click', () => this.close());
        this.elements.btnSave?.addEventListener('click', () => this.save());
        
        this.elements.searchInput?.addEventListener('input', this.debounce(() => {
            this.searchProduk(this.elements.searchInput.value);
        }, 300));
        
        this.elements.operationType?.addEventListener('change', () => this.updateSummary());
        this.elements.inputJumlah?.addEventListener('input', () => this.updateSummary());
        
        // Load when modal opens
        document.addEventListener('click', (e) => {
            if (e.target.closest('#btn-stok-masal')) {
                this.reset();
                this.loadProduk();
            }
        });
    },
    
    loadProduk: function() {
        if (typeof firebase === 'undefined') return;
        
        firebase.database().ref('produk').once('value')
            .then(snapshot => {
                const produk = [];
                snapshot.forEach(child => {
                    const val = child.val();
                    produk.push({
                        id: child.key,
                        nama: val.nama,
                        kode: val.kode,
                        stok: val.stok || 0,
                        satuan: val.satuan || 'pcs'
                    });
                });
                this.allProduk = produk;
                this.renderProdukList(produk);
            });
    },
    
    searchProduk: function(query) {
        if (!query) {
            this.renderProdukList(this.allProduk);
            return;
        }
        
        const filtered = this.allProduk.filter(p => 
            p.nama.toLowerCase().includes(query.toLowerCase()) ||
            (p.kode && p.kode.toLowerCase().includes(query.toLowerCase()))
        );
        this.renderProdukList(filtered);
    },
    
    renderProdukList: function(produk) {
        const container = this.elements.produkList;
        if (!container) return;
        
        if (produk.length === 0) {
            container.innerHTML = '<div class="empty-search">Tidak ada produk ditemukan</div>';
            return;
        }
        
        container.innerHTML = produk.map(p => {
            const isSelected = this.selectedProduk.find(s => s.id === p.id);
            return `
                <div class="stok-produk-item ${isSelected ? 'selected' : ''}" 
                     onclick="StokMasal.toggleProduk('${p.id}')"
                     data-id="${p.id}">
                    <div class="produk-info">
                        <strong>${this.escapeHtml(p.nama)}</strong>
                        <span>${p.kode || '-'} • Stok: ${p.stok} ${p.satuan}</span>
                    </div>
                    <i class="fas ${isSelected ? 'fa-check-circle' : 'fa-circle'}"></i>
                </div>
            `;
        }).join('');
    },
    
    toggleProduk: function(id) {
        const produk = this.allProduk.find(p => p.id === id);
        if (!produk) return;
        
        const index = this.selectedProduk.findIndex(p => p.id === id);
        if (index >= 0) {
            this.selectedProduk.splice(index, 1);
        } else {
            this.selectedProduk.push({...produk});
        }
        
        this.renderSelected();
        this.renderProdukList(this.allProduk);
        this.updateSummary();
    },
    
    renderSelected: function() {
        const container = this.elements.selectedContainer;
        if (!container) return;
        
        if (this.selectedProduk.length === 0) {
            container.innerHTML = '<div class="empty-selected">Belum ada produk dipilih</div>';
            return;
        }
        
        container.innerHTML = this.selectedProduk.map(p => `
            <div class="selected-item">
                <span>${this.escapeHtml(p.nama)}</span>
                <button onclick="StokMasal.toggleProduk('${p.id}')" title="Hapus">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    },
    
    updateSummary: function() {
        const container = this.elements.summaryContainer;
        if (!container) return;
        
        const operation = this.elements.operationType?.value || 'tambah';
        const jumlah = parseInt(this.elements.inputJumlah?.value) || 0;
        const count = this.selectedProduk.length;
        
        if (count === 0 || jumlah <= 0) {
            container.innerHTML = '';
            return;
        }
        
        const operationText = {
            'tambah': 'Ditambah',
            'kurang': 'Dikurang',
            'set': 'Diubah menjadi'
        };
        
        container.innerHTML = `
            <div class="stok-summary-box">
                <h4>Ringkasan Perubahan</h4>
                <p><strong>${count}</strong> produk akan diupdate</p>
                <p>Operasi: <strong>${operationText[operation]} ${jumlah}</strong></p>
            </div>
        `;
    },
    
    save: async function() {
        const operation = this.elements.operationType?.value;
        const jumlah = parseInt(this.elements.inputJumlah?.value) || 0;
        const keterangan = this.elements.inputKeterangan?.value || '';
        
        if (this.selectedProduk.length === 0) {
            showToast('❌ Pilih minimal 1 produk', 'error');
            return;
        }
        
        if (jumlah <= 0) {
            showToast('❌ Jumlah harus lebih dari 0', 'error');
            return;
        }
        
        const btn = this.elements.btnSave;
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        
        try {
            const updates = [];
            const historyEntries = [];
            
            for (const p of this.selectedProduk) {
                let newStok;
                const currentStok = p.stok;
                
                switch(operation) {
                    case 'tambah':
                        newStok = currentStok + jumlah;
                        break;
                    case 'kurang':
                        newStok = Math.max(0, currentStok - jumlah);
                        break;
                    case 'set':
                        newStok = jumlah;
                        break;
                }
                
                updates.push(
                    firebase.database().ref(`produk/${p.id}`).update({
                        stok: newStok,
                        updated_at: Date.now()
                    })
                );
                
                // Add history
                historyEntries.push({
                    produk_id: p.id,
                    produk_nama: p.nama,
                    tipe: operation === 'tambah' ? 'masuk' : (operation === 'kurang' ? 'keluar' : 'penyesuaian'),
                    jumlah: Math.abs(newStok - currentStok),
                    stok_sebelum: currentStok,
                    stok_sesudah: newStok,
                    keterangan: keterangan || 'Update stok masal',
                    created_at: Date.now()
                });
            }
            
            await Promise.all(updates);
            
            // Save history
            const historyRef = firebase.database().ref('stok_history');
            for (const entry of historyEntries) {
                await historyRef.push(entry);
            }
            
            showToast(`✅ ${this.selectedProduk.length} produk berhasil diupdate`, 'success');
            this.close();
            
        } catch (error) {
            console.error('Error updating stok:', error);
            showToast('❌ Gagal mengupdate stok', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    },
    
    reset: function() {
        this.selectedProduk = [];
        this.allProduk = [];
        if (this.elements.searchInput) this.elements.searchInput.value = '';
        if (this.elements.inputJumlah) this.elements.inputJumlah.value = '';
        if (this.elements.inputKeterangan) this.elements.inputKeterangan.value = '';
        if (this.elements.operationType) this.elements.operationType.value = 'tambah';
        this.renderSelected();
        this.updateSummary();
    },
    
    close: function() {
        ProdukMain.closeModal('modal-stok');
    },
    
    debounce: function(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },
    
    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => StokMasal.init());
