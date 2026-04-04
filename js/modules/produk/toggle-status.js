/**
 * Toggle Status Masal - WebPOS Modern
 * File: js/modules/produk/toggle-status.js
 */

const ToggleStatus = {
    elements: {},
    selectedProduk: [],
    
    init: function() {
        this.cacheElements();
        this.setupEventListeners();
    },
    
    cacheElements: function() {
        this.elements = {
            modal: document.getElementById('modal-toggle'),
            btnClose: document.getElementById('close-toggle'),
            btnCancel: document.getElementById('cancel-toggle'),
            btnApply: document.getElementById('apply-toggle'),
            
            // Filter
            filterStatus: document.getElementById('toggle-filter-status'),
            
            // Lists
            aktifList: document.getElementById('list-aktif'),
            nonaktifList: document.getElementById('list-nonaktif'),
            
            // Stats
            statAktif: document.getElementById('toggle-stat-aktif'),
            statNonaktif: document.getElementById('toggle-stat-nonaktif')
        };
    },
    
    setupEventListeners: function() {
        this.elements.btnClose?.addEventListener('click', () => this.close());
        this.elements.btnCancel?.addEventListener('click', () => this.close());
        this.elements.btnApply?.addEventListener('click', () => this.applyChanges());
        
        this.elements.filterStatus?.addEventListener('change', () => this.loadProduk());
        
        // Load when modal opens
        document.addEventListener('click', (e) => {
            if (e.target.closest('#btn-toggle-produk')) {
                this.loadProduk();
            }
        });
    },
    
    loadProduk: function() {
        if (typeof firebase === 'undefined') return;
        
        const filter = this.elements.filterStatus?.value || 'all';
        
        firebase.database().ref('produk').once('value')
            .then(snapshot => {
                const aktif = [];
                const nonaktif = [];
                
                snapshot.forEach(child => {
                    const val = child.val();
                    const produk = {
                        id: child.key,
                        nama: val.nama,
                        kode: val.kode,
                        status: val.status || 'aktif'
                    };
                    
                    if (produk.status === 'aktif') {
                        aktif.push(produk);
                    } else {
                        nonaktif.push(produk);
                    }
                });
                
                this.renderLists(aktif, nonaktif);
            });
    },
    
    renderLists: function(aktif, nonaktif) {
        // Update stats
        if (this.elements.statAktif) {
            this.elements.statAktif.textContent = `${aktif.length} Aktif`;
        }
        if (this.elements.statNonaktif) {
            this.elements.statNonaktif.textContent = `${nonaktif.length} Nonaktif`;
        }
        
        // Render aktif list
        if (this.elements.aktifList) {
            this.elements.aktifList.innerHTML = aktif.map(p => `
                <div class="toggle-item" data-id="${p.id}" data-status="aktif">
                    <div class="item-info">
                        <strong>${this.escapeHtml(p.nama)}</strong>
                        <span>${p.kode || '-'}</span>
                    </div>
                    <button class="btn-toggle-status" onclick="ToggleStatus.moveItem('${p.id}', 'nonaktif')" title="Nonaktifkan">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            `).join('') || '<div class="empty-list">Tidak ada produk aktif</div>';
        }
        
        // Render nonaktif list
        if (this.elements.nonaktifList) {
            this.elements.nonaktifList.innerHTML = nonaktif.map(p => `
                <div class="toggle-item" data-id="${p.id}" data-status="nonaktif">
                    <button class="btn-toggle-status" onclick="ToggleStatus.moveItem('${p.id}', 'aktif')" title="Aktifkan">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <div class="item-info">
                        <strong>${this.escapeHtml(p.nama)}</strong>
                        <span>${p.kode || '-'}</span>
                    </div>
                </div>
            `).join('') || '<div class="empty-list">Tidak ada produk nonaktif</div>';
        }
    },
    
    moveItem: function(id, newStatus) {
        const item = document.querySelector(`[data-id="${id}"]`);
        if (!item) return;
        
        // Animate move
        item.style.transition = 'all 0.3s ease';
        item.style.opacity = '0';
        item.style.transform = newStatus === 'aktif' ? 'translateX(50px)' : 'translateX(-50px)';
        
        setTimeout(() => {
            // Update in Firebase
            firebase.database().ref(`produk/${id}`).update({
                status: newStatus,
                updated_at: Date.now()
            }).then(() => {
                showToast(`Produk di${newStatus === 'aktif' ? 'aktifkan' : 'nonaktifkan'}`, 'success');
                this.loadProduk(); // Refresh lists
            }).catch(err => {
                showToast('Gagal mengubah status', 'error');
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            });
        }, 300);
    },
    
    applyChanges: function() {
        this.close();
        showToast('✅ Perubahan status diterapkan', 'success');
    },
    
    close: function() {
        ProdukMain.closeModal('modal-toggle');
    },
    
    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => ToggleStatus.init());
