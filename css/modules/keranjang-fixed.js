/**
 * Keranjang Module - FIXED v2.2
 * File: js/modules/kasir/keranjang-fixed.js
 * Fixed: Prevent popup, proper event handling
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
    
    addItem: function(produk, customData) {
        customData = customData || {};
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
                nama: customData.nama || produk.nama,
                harga_jual: customData.harga_jual || produk.harga_jual || 0,
                harga_modal: customData.harga_modal || produk.harga_modal || 0,
                qty: customData.qty || 1,
                subtotal: (customData.harga_jual || produk.harga_jual || 0) * (customData.qty || 1),
                jenis: customData.jenis || 'penjualan',
                keterangan: customData.keterangan || '',
                provider: customData.provider || '',
                nominal: customData.nominal || 0,
                fee: customData.fee || 0,
                stok: produk.stok || 999
            };
            this.items.push(newItem);
        }
        
        this.saveToStorage();
        this.render();
        this.updateMobileCount();
        this.animateCart();
    },
    
    // Alias untuk kompatibilitas dengan kode lama
    add: function(produk) {
        this.addItem(produk);
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
        
        showToast(itemName + ' dihapus dari keranjang', 'info');
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
        const count = this.items.reduce(function(sum, item) { return sum + item.qty; }, 0);
        
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
        badges.forEach(function(badge) {
            badge.style.transform = 'scale(1.3)';
            setTimeout(function() {
                badge.style.transform = 'scale(1)';
            }, 200);
        });
        
        // Animasi keranjang header
        const keranjangTitle = document.querySelector('.keranjang-title i');
        if (keranjangTitle) {
            keranjangTitle.style.transform = 'rotate(15deg) scale(1.1)';
            setTimeout(function() {
                keranjangTitle.style.transform = 'rotate(0) scale(1)';
            }, 200);
        }
    },
    
    bindEvents: function() {
        const self = this;
        
        // Event untuk tombol bayar
        const btnBayar = document.getElementById('btn-bayar');
        if (btnBayar) {
            btnBayar.addEventListener('click', function(e) {
                e.preventDefault();
                self.prosesPembayaran();
            });
        }
        
        // Event untuk input jumlah bayar
        const inputBayar = document.getElementById('jumlah-bayar');
        if (inputBayar) {
            inputBayar.addEventListener('input', function() {
                let value = this.value.replace(/\D/g, '');
                this.value = value;
                self.hitungKembalian();
            });
        }
        
        // Event untuk quick amount buttons - EVENT DELEGATION
        const quickAmounts = document.querySelector('.quick-amounts');
        if (quickAmounts) {
            quickAmounts.addEventListener('click', function(e) {
                const btn = e.target.closest('.quick-btn[data-amount]');
                if (btn) {
                    e.preventDefault();
                    const amount = btn.dataset.amount;
                    if (inputBayar) {
                        inputBayar.value = amount;
                        self.hitungKembalian();
                    }
                }
            });
        }
        
        // Event untuk tombol uang pas
        const btnUangPas = document.getElementById('btn-uang-pas');
        if (btnUangPas) {
            btnUangPas.addEventListener('click', function(e) {
                e.preventDefault();
                const total = self.items.reduce(function(sum, item) { return sum + item.subtotal; }, 0);
                if (inputBayar) {
                    inputBayar.value = total;
                    self.hitungKembalian();
                }
            });
        }
        
        // Event untuk metode pembayaran
        const metodePembayaran = document.getElementById('metode-pembayaran');
        if (metodePembayaran) {
            metodePembayaran.addEventListener('change', function() {
                self.handleMetodeChange(this.value);
            });
        }
        
        // Event delegation untuk keranjang items
        const keranjangItems = document.getElementById('keranjang-items');
        if (keranjangItems) {
            keranjangItems.addEventListener('click', function(e) {
                const qtyBtn = e.target.closest('.qty-btn-modern');
                if (qtyBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    const index = parseInt(qtyBtn.dataset.index);
                    const change = parseInt(qtyBtn.dataset.change);
                    if (!isNaN(index) && !isNaN(change)) {
                        self.updateQty(index, change);
                    }
                    return;
                }
                
                const removeBtn = e.target.closest('.btn-remove-item[data-action="remove"]');
                if (removeBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    const index = parseInt(removeBtn.dataset.index);
                    if (!isNaN(index)) {
                        self.removeItem(index);
                    }
                    return;
                }
                
                const editBtn = e.target.closest('.btn-remove-item[data-action="edit"]');
                if (editBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    const index = parseInt(editBtn.dataset.index);
                    if (!isNaN(index) && window.openEditModal) {
                        window.openEditModal(index);
                    }
                }
            });
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
        
        const total = this.items.reduce(function(sum, item) { return sum + item.subtotal; }, 0);
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
        
        const metode = document.getElementById('metode-pembayaran');
        const metodeValue = metode ? metode.value : 'tunai';
        const total = this.items.reduce(function(sum, item) { return sum + item.subtotal; }, 0);
        
        if (metodeValue === 'hutang') {
            const pelanggan = document.getElementById('select-pelanggan');
            const pelangganValue = pelanggan ? pelanggan.value : '';
            if (!pelangganValue) {
                showToast('Pilih pelanggan untuk transaksi hutang!', 'warning');
                return;
            }
            this.simpanTransaksi(metodeValue, total, 0, pelangganValue);
        } else {
            const inputBayar = document.getElementById('jumlah-bayar');
            const bayar = parseInt(inputBayar ? inputBayar.value : 0) || 0;
            
            if (bayar < total) {
                showToast('Jumlah bayar kurang dari total!', 'error');
                return;
            }
            
            this.simpanTransaksi(metodeValue, total, bayar);
        }
    },
    
    simpanTransaksi: function(metode, total, bayar, pelangganId) {
        const self = this;
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
            pelangganId: pelangganId || null,
            tanggal: Date.now(),
            userId: firebase.auth().currentUser ? firebase.auth().currentUser.uid : 'unknown'
        };
        
        // Simpan ke Firebase
        const transaksiRef = firebase.database().ref('transaksi').push();
        
        transaksiRef.set(transaksiData)
            .then(function() {
                // Update stok produk
                const updates = {};
                self.items.forEach(function(item) {
                    if (item.jenis === 'penjualan' || !item.jenis) {
                        updates['produk/' + item.id + '/stok'] = firebase.database.ServerValue.increment(-item.qty);
                    }
                });
                
                if (Object.keys(updates).length > 0) {
                    return firebase.database().ref().update(updates);
                }
            })
            .then(function() {
                showToast('Transaksi berhasil disimpan!', 'success');
                self.clear();
                
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
            .catch(function(err) {
                console.error('Error saving transaksi:', err);
                showToast('Gagal menyimpan transaksi: ' + err.message, 'error');
            })
            .finally(function() {
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
        const self = this;
        
        this.items.forEach(function(item, index) {
            total += item.subtotal;
            html += self.createItemHTML(item, index);
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
        
        const icon = jenisIcon[item.jenis] || 'fa-box';
        
        return `
            <div class="cart-item-modern" data-index="${index}">
                <div class="cart-item-img">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</div>
                    <div class="cart-item-price">${formatRupiah(item.harga_jual)} x ${item.qty}</div>
                </div>
                <div class="qty-control-modern">
                    <button class="qty-btn-modern" data-index="${index}" data-change="-1" title="Kurangi">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="qty-value-modern">${item.qty}</span>
                    <button class="qty-btn-modern" data-index="${index}" data-change="1" title="Tambah">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="cart-item-total">
                    ${formatRupiah(item.subtotal)}
                </div>
                <div class="cart-item-actions">
                    <button class="btn-remove-item" data-index="${index}" data-action="edit" title="Edit" style="color: var(--accent-indigo);">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-remove-item" data-index="${index}" data-action="remove" title="Hapus">
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

function showToast(message, type) {
    type = type || 'info';
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    
    var iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-circle';
    if (type === 'warning') iconClass = 'fa-exclamation-triangle';
    
    toast.innerHTML = '<i class="fas ' + iconClass + '"></i><span>' + message + '</span>';
    
    container.appendChild(toast);
    
    setTimeout(function() {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() { toast.remove(); }, 300);
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
