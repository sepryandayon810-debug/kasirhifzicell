/**
 * Detail Produk Modal - WebPOS Modern
 * File: js/modules/produk/detail-produk.js
 */

const DetailProduk = {
    elements: {},
    
    init: function() {
        this.cacheElements();
        this.setupEventListeners();
    },
    
    cacheElements: function() {
        this.elements = {
            modal: document.getElementById('modal-detail-produk'),
            btnClose: document.getElementById('close-detail'),
            
            // Content
            imageContainer: document.getElementById('detail-image'),
            nama: document.getElementById('detail-nama'),
            kode: document.getElementById('detail-kode'),
            kategori: document.getElementById('detail-kategori'),
            status: document.getElementById('detail-status'),
            
            // Pricing
            hargaJual: document.getElementById('detail-harga-jual'),
            hargaModal: document.getElementById('detail-harga-modal'),
            profit: document.getElementById('detail-profit'),
            margin: document.getElementById('detail-margin'),
            
            // Stock
            stok: document.getElementById('detail-stok'),
            terjual: document.getElementById('detail-terjual'),
            minStok: document.getElementById('detail-min-stok'),
            
            // History
            historyList: document.getElementById('detail-history'),
            
            // Actions
            btnEdit: document.getElementById('detail-btn-edit'),
            btnToggle: document.getElementById('detail-btn-toggle')
        };
    },
    
    setupEventListeners: function() {
        this.elements.btnClose?.addEventListener('click', () => this.close());
        
        // Close on backdrop click
        this.elements.modal?.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) this.close();
        });
    },
    
    open: function(produk) {
        this.currentProduk = produk;
        this.render(produk);
        this.loadHistory(produk.id);
        ProdukMain.openModal('modal-detail-produk');
    },
    
    render: function(p) {
        // Image
        if (this.elements.imageContainer) {
            if (p.gambar) {
                this.elements.imageContainer.innerHTML = `<img src="${p.gambar}" alt="${p.nama}">`;
            } else {
                this.elements.imageContainer.innerHTML = `<div class="no-image"><i class="fas fa-box"></i></div>`;
            }
        }
        
        // Basic info
        if (this.elements.nama) this.elements.nama.textContent = p.nama;
        if (this.elements.kode) this.elements.kode.textContent = p.kode || '-';
        if (this.elements.kategori) this.elements.kategori.textContent = p.kategori || '-';
        
        // Status badge
        if (this.elements.status) {
            this.elements.status.innerHTML = `
                <span class="status-badge ${p.status}">
                    ${p.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                </span>
            `;
        }
        
        // Pricing
        if (this.elements.hargaJual) this.elements.hargaJual.textContent = this.formatRupiah(p.harga_jual);
        if (this.elements.hargaModal) this.elements.hargaModal.textContent = this.formatRupiah(p.harga_modal);
        
        const profit = p.harga_jual - p.harga_modal;
        const margin = p.harga_modal > 0 ? ((profit / p.harga_modal) * 100).toFixed(1) : 0;
        
        if (this.elements.profit) {
            this.elements.profit.textContent = this.formatRupiah(profit);
            this.elements.profit.className = profit >= 0 ? 'profit-positive' : 'profit-negative';
        }
        if (this.elements.margin) this.elements.margin.textContent = `${margin}%`;
        
        // Stock
        if (this.elements.stok) this.elements.stok.textContent = `${p.stok} ${p.satuan}`;
        if (this.elements.terjual) this.elements.terjual.textContent = p.terjual || 0;
        if (this.elements.minStok) this.elements.minStok.textContent = p.min_stok || 5;
        
        // Stok indicator
        const stokEl = this.elements.stok?.parentElement;
        if (stokEl) {
            stokEl.className = 'stat-box';
            if (p.stok <= 0) stokEl.classList.add('danger');
            else if (p.stok <= (p.min_stok || 5)) stokEl.classList.add('warning');
            else stokEl.classList.add('success');
        }
        
        // Setup action buttons
        if (this.elements.btnEdit) {
            this.elements.btnEdit.onclick = () => {
                this.close();
                EditProduk.open(p.id);
            };
        }
        
        if (this.elements.btnToggle) {
            const newStatus = p.status === 'aktif' ? 'nonaktif' : 'aktif';
            this.elements.btnToggle.innerHTML = `
                <i class="fas ${p.status === 'aktif' ? 'fa-eye-slash' : 'fa-eye'}"></i>
                ${p.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
            `;
            this.elements.btnToggle.className = `btn ${p.status === 'aktif' ? 'btn-warning' : 'btn-success'}`;
            this.elements.btnToggle.onclick = () => {
                ProdukMain.toggleStatus(p.id, newStatus);
                this.close();
            };
        }
    },
    
    loadHistory: function(produkId) {
        if (!this.elements.historyList || typeof firebase === 'undefined') return;
        
        this.elements.historyList.innerHTML = '<div class="loading-small">Memuat riwayat...</div>';
        
        firebase.database().ref('stok_history')
            .orderByChild('produk_id')
            .equalTo(produkId)
            .limitToLast(10)
            .once('value')
            .then(snapshot => {
                const history = [];
                snapshot.forEach(child => {
                    history.push({
                        id: child.key,
                        ...child.val()
                    });
                });
                
                history.reverse(); // Newest first
                
                if (history.length === 0) {
                    this.elements.historyList.innerHTML = '<div class="empty-history">Belum ada riwayat perubahan</div>';
                    return;
                }
                
                this.elements.historyList.innerHTML = history.map(h => `
                    <div class="history-item">
                        <div class="history-icon ${h.tipe}">
                            <i class="fas ${this.getHistoryIcon(h.tipe)}"></i>
                        </div>
                        <div class="history-info">
                            <strong>${this.getHistoryText(h.tipe)}</strong>
                            <span>${h.jumlah} ${h.satuan || 'pcs'}</span>
                            <small>${new Date(h.created_at).toLocaleString('id-ID')}</small>
                        </div>
                        <div class="history-stok">
                            <span>${h.stok_sebelum} → ${h.stok_sesudah}</span>
                        </div>
                    </div>
                `).join('');
            });
    },
    
    getHistoryIcon: function(tipe) {
        const icons = {
            'masuk': 'fa-arrow-down',
            'keluar': 'fa-arrow-up',
            'penyesuaian': 'fa-exchange-alt',
            'penjualan': 'fa-shopping-cart'
        };
        return icons[tipe] || 'fa-circle';
    },
    
    getHistoryText: function(tipe) {
        const texts = {
            'masuk': 'Stok Masuk',
            'keluar': 'Stok Keluar',
            'penyesuaian': 'Penyesuaian',
            'penjualan': 'Penjualan'
        };
        return texts[tipe] || tipe;
    },
    
    close: function() {
        ProdukMain.closeModal('modal-detail-produk');
    },
    
    formatRupiah: function(angka) {
        if (!angka) return 'Rp 0';
        return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => DetailProduk.init());
