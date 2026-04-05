/**
 * Keranjang Module - IMPROVED v2.1
 * File: js/modules/kasir/keranjang.js
 * Fixed: Prevent default, no popup issues
 */

const Keranjang = {
    items: [],
    
    init: function() {
        this.loadFromStorage();
        this.render();
        this.bindEvents();
    },
    
    getItems: function() {
        return this.items;
    },
    
    addItem: function(produk, customData = null) {
        const existingIndex = this.items.findIndex(item => item.id === produk.id);
        
        if (existingIndex >= 0) {
            // Cek stok sebelum menambah
            const currentQty = this.items[existingIndex].qty;
            const maxStok = produk.stok || 999;
            
            if (currentQty + 1 > maxStok) {
                showToast('Stok tidak mencukupi!', 'warning');
                return;
            }
            
            this.items[existingIndex].qty += 1;
            this.items[existingIndex].subtotal = this.items[existingIndex].qty * this.items[existingIndex].harga_jual;
        } else {
            const newItem = {
                id: produk.id,
                nama: customData?.nama || produk.nama,
                harga_jual: customData?.harga_jual || produk.harga_jual || 0,
                harga_modal: customData?.harga_modal || produk.harga_modal || 0,
                qty: customData?.qty || 1,
                subtotal: (customData?.harga_jual || produk.harga_jual || 0) * (customData?.qty || 1),
                jenis: customData?.jenis || 'penjualan',
                keterangan: customData?.keterangan || '',
                provider: customData?.provider || '',
                nominal: customData?.nominal || 0,
                fee: customData?.fee || 0,
                stok: produk.stok || 999
            };
            this.items.push(newItem);
        }
        
        this.saveToStorage();
        this.render();
        this.updateMobileCount();
        
        // Animasi keranjang
        this.animateCart();
    },
    
    // Alias untuk kompatibilitas
    tambahItem: function(produk, customData = null) {
        this.addItem(produk, customData);
    },
    
    editItem: function(index, data) {
        if (index < 0 || index >= this.items.length) return;
        
        if (data.harga !== undefined) {
            this.items[index].harga_jual = data.harga;
        }
        if (data.qty !== undefined) {
            this.items[index].qty = data.qty;
        }
        
        this.items[index].subtotal = this.items[index].harga_jual * this.items[index].qty;
        
        this.saveToStorage();
        this.render();
        this.updateMobileCount();
    },
    
    updateQty: function(index, change) {
        if (index < 0 || index >= this.items.length) return;
        
        const item = this.items[index];
        const newQty = item.qty + change;
        
        // Cek stok
        if (change > 0 && newQty > item.stok) {
            showToast('Stok tidak mencukupi!', 'warning');
            return;
        }
        
        if (newQty <= 0) {
            this.removeItem(index);
            return;
        }
        
        item.qty = newQty;
        item.subtotal = item.qty * item.harga_jual;
        
        this.saveToStorage();
        this.render();
        this.updateMobileCount();
    },
    
    removeItem: function(index) {
        if (index < 0 || index >= this.items.length) return;
        
        const itemName = this.items[index].nama;
        this.items.splice(index, 1);
        this.saveToStorage();
        this.render();
        this.updateMobileCount();
        
        showToast(`${itemName} dihapus dari keranjang`, 'info');
    },
    
    clear: function() {
        this.items = [];
        this.saveToStorage();
        this.render();
        this.updateMobileCount();
    },
    
    clearDraft: function() {
        localStorage.removeItem('keranjang_draft');
    },
    
    saveToStorage: function() {
        localStorage.setItem('keranjang_draft', JSON.stringify(this.items));
    },
    
    loadFromStorage: function() {
        const saved = localStorage.getItem('keranjang_draft');
        if (saved) {
            try {
                this.items = JSON.parse(saved);
            } catch (e) {
                this.items = [];
            }
        }
    },
    
    updateMobileCount: function() {
        const count = this.items.reduce((sum, item) => sum + item.qty, 0);
        
        // Update desktop badge
        const badgeCount = document.getElementById('cart-count');
        if (badgeCount) {
            badgeCount.textContent = count;
            badgeCount.style.display = count > 0 ? 'flex' : 'none';
        }
        
        // Update mobile badge
        const mobileCount = document.getElementById('mobile-count');
        if (mobileCount) {
            mobileCount.textContent = count;
            mobileCount.style.display = count > 0 ? 'flex' : 'none';
        }
        
        // Update mobile button visibility
        const mobileBtn = document.getElementById('btn-cart-mobile');
        if (mobileBtn) {
            mobileBtn.style.display = count > 0 ? 'flex' : 'none';
        }
    },
    
    animateCart: function() {
        // Animasi badge
        const badges = document.querySelectorAll('.badge-count, .badge-float');
        badges.forEach(badge => {
            badge.style.transform = 'scale(1.3)';
            setTimeout(() => {
                badge.style.transform = 'scale(1)';
            }, 200);
        });
        
        // Animasi keranjang header
        const keranjangTitle = document.querySelector('.keranjang-title i');
        if (keranjangTitle) {
            keranjangTitle.style.transform = 'rotate(15deg) scale(1.1)';
            setTimeout(() => {
                keranjangTitle.style.transform = 'rotate(0) scale(1)';
            }, 200);
        }
    },
    
    bindEvents: function() {
        // Event untuk tombol bayar
        const btnBayar = document.getElementById('btn-bayar');
        if (btnBayar) {
            btnBayar.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.prosesPembayaran();
            };
        }
        
        // Event untuk input jumlah bayar
        const inputBayar = document.getElementById('jumlah-bayar');
        if (inputBayar) {
            inputBayar.oninput = (e) => {
                let value = e.target.value.replace(/\D/g, '');
                e.target.value = value;
                this.hitungKembalian();
            };
        }
        
        // Event untuk quick amount buttons
        document.querySelectorAll('.quick-btn[data-amount]').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const amount = e.currentTarget.dataset.amount;
                if (inputBayar) {
                    inputBayar.value = amount;
                    this.hitungKembalian();
                }
            };
        });
        
        // Event untuk tombol uang pas
        const btnUangPas = document.getElementById('btn-uang-pas');
        if (btnUangPas) {
            btnUangPas.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const total = this.items.reduce((sum, item) => sum + item.subtotal, 0);
                if (inputBayar) {
                    inputBayar.value = total;
                    this.hitungKembalian();
                }
            };
        }
        
        // Event untuk metode pembayaran
        const metodePembayaran = document.getElementById('metode-pembayaran');
        if (metodePembayaran) {
            metodePembayaran.onchange = (e) => {
                this.handleMetodeChange(e.target.value);
            };
        }
    },
    
    handleMetodeChange: function(metode) {
        const groupBayar = document.getElementById('group-bayar');
        const groupKembalian = document.getElementById('group-kembalian');
        const groupPelanggan = document.getElementById('group-pelanggan');
        
        if (groupBayar) {
            groupBayar.style.display = metode === 'hutang' ? 'none' : 'block';
        }
        if (groupKembalian) {
            groupKembalian.style.display = metode === 'hutang' ? 'none' : 'none';
        }
        if (groupPelanggan) {
            groupPelanggan.style.display = metode === 'hutang' ? 'block' : 'none';
        }
    },
    
    hitungKembalian: function() {
        const inputBayar = document.getElementById('jumlah-bayar');
        const kembalianEl = document.getElementById('kembalian');
        const groupKembalian = document.getElementById('group-kembalian');
        
        if (!inputBayar || !kembalianEl) return;
        
        const total = this.items.reduce((sum, item) => sum + item.subtotal, 0);
        const bayar = parseInt(inputBayar.value) || 0;
        const kembalian = bayar - total;
        
        if (kembalian >= 0 && bayar > 0) {
            kembalianEl.textContent = formatRupiah(kembalian);
            if (groupKembalian) {
                groupKembalian.style.display = 'block';
            }
        } else {
            if (groupKembalian) {
                groupKembalian.style.display = 'none';
            }
        }
    },
    
    prosesPembayaran: function() {
        if (this.items.length === 0) {
            showToast('Keranjang masih kosong!', 'warning');
            return;
        }
        
        const metode = document.getElementById('metode-pembayaran')?.value || 'tunai';
        const total = this.items.reduce((sum, item) => sum + item.subtotal, 0);
        
        if (metode === 'hutang') {
            const pelanggan = document.getElementById('select-pelanggan')?.value;
            if (!pelanggan) {
                showToast('Pilih pelanggan untuk transaksi hutang!', 'warning');
                return;
            }
            this.simpanTransaksi(metode, total, 0, pelanggan);
        } else {
            const inputBayar = document.getElementById('jumlah-bayar');
            const bayar = parseInt(inputBayar?.value) || 0;
            
            if (bayar < total) {
                showToast('Jumlah bayar kurang dari total!', 'error');
                return;
            }
            
            this.simpanTransaksi(metode, total, bayar);
        }
    },
    
    simpanTransaksi: function(metode, total, bayar, pelangganId = null) {
        const btnBayar = document.getElementById('btn-bayar');
        if (btnBayar) {
            btnBayar.disabled = true;
            btnBayar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        }
        
        const transaksiData = {
            items: this.items,
            total: total,
            bayar: bayar,
            kembalian: bayar - total,
            metode: metode,
            pelangganId: pelangganId,
            tanggal: Date.now(),
            userId: firebase.auth().currentUser?.uid || 'unknown'
        };
        
        // Simpan ke Firebase
        const transaksiRef = firebase.database().ref('transaksi').push();
        
        transaksiRef.set(transaksiData)
            .then(() => {
                // Update stok produk
                const updates = {};
                this.items.forEach(item => {
                    if (item.jenis === 'penjualan') {
                        updates[`produk/${item.id}/stok`] = firebase.database.ServerValue.increment(-item.qty);
                    }
                });
                
                if (Object.keys(updates).length > 0) {
                    return firebase.database().ref().update(updates);
                }
            })
            .then(() => {
                showToast('Transaksi berhasil disimpan!', 'success');
                this.clear();
                
                // Reset input
                const inputBayar = document.getElementById('jumlah-bayar');
                if (inputBayar) inputBayar.value = '';
                
                const groupKembalian = document.getElementById('group-kembalian');
                if (groupKembalian) groupKembalian.style.display = 'none';
                
                // Refresh produk
                if (window.KasirMain) {
                    window.KasirMain.refresh();
                }
            })
            .catch(err => {
                console.error('Error saving transaksi:', err);
                showToast('Gagal menyimpan transaksi: ' + err.message, 'error');
            })
            .finally(() => {
                if (btnBayar) {
                    btnBayar.disabled = false;
                    btnBayar.innerHTML = '<i class="fas fa-check-circle"></i> Bayar Sekarang';
                }
            });
    },
    
    render: function() {
        const container = document.getElementById('keranjang-items');
        const subtotalEl = document.getElementById('subtotal');
        const totalEl = document.getElementById('total-bayar');
        
        if (!container) return;
        
        if (this.items.length === 0) {
            container.innerHTML = `
                <div class="empty-cart-modern">
                    <i class="fas fa-shopping-basket"></i>
                    <p>Keranjang Kosong</p>
                    <span>Tambahkan produk untuk memulai</span>
                </div>
            `;
            if (subtotalEl) subtotalEl.textContent = 'Rp 0';
            if (totalEl) totalEl.textContent = 'Rp 0';
            return;
        }
        
        let html = '';
        let total = 0;
        
        this.items.forEach((item, index) => {
            total += item.subtotal;
            html += this.createItemHTML(item, index);
        });
        
        container.innerHTML = html;
        
        if (subtotalEl) subtotalEl.textContent = formatRupiah(total);
        if (totalEl) totalEl.textContent = formatRupiah(total);
        
        // Update kembalian
        this.hitungKembalian();
    },
    
    createItemHTML: function(item, index) {
        const jenisIcon = {
            penjualan: 'fa-box',
            topup: 'fa-mobile-alt',
            tarik: 'fa-hand-holding-usd'
        };
        
        return `
            <div class="cart-item-modern" data-index="${index}">
                <div class="cart-item-img">
                    <i class="fas ${jenisIcon[item.jenis] || 'fa-box'}"></i>
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div>
                    <div class="cart-item-price">${formatRupiah(item.harga_jual)} x ${item.qty}</div>
                </div>
                <div class="qty-control-modern">
                    <button class="qty-btn-modern" onclick="event.preventDefault(); event.stopPropagation(); window.Keranjang.updateQty(${index}, -1)" title="Kurangi">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="qty-value-modern">${item.qty}</span>
                    <button class="qty-btn-modern" onclick="event.preventDefault(); event.stopPropagation(); window.Keranjang.updateQty(${index}, 1)" title="Tambah">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="cart-item-total">
                    ${formatRupiah(item.subtotal)}
                </div>
                <div class="cart-item-actions">
                    <button class="btn-remove-item" onclick="event.preventDefault(); event.stopPropagation(); window.openEditModal(${index})" title="Edit" style="color: var(--accent-indigo);">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-remove-item" onclick="event.preventDefault(); event.stopPropagation(); window.Keranjang.removeItem(${index})" title="Hapus">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }
};

// Helper functions
function formatRupiah(angka) {
    if (!angka) return 'Rp 0';
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${iconMap[type] || iconMap.info}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Inisialisasi
document.addEventListener('DOMContentLoaded', function() {
    Keranjang.init();
});

// Export ke global
window.Keranjang = Keranjang;
window.formatRupiah = formatRupiah;
window.showToast = showToast;
