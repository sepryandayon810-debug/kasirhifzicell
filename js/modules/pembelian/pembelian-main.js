/**
 * Pembelian Main Controller
 */

(function() {
    'use strict';
    
    // State
    const state = {
        keranjang: [],
        supplier: null,
        subtotal: 0,
        diskon: 0,
        pajak: 0,
        total: 0,
        metodeBayar: 'tunai',
        produkList: []
    };
    
    // DOM Elements
    const elements = {};
    
    // ==========================================
    // INIT
    // ==========================================
    function init() {
        console.log('[PembelianMain] Initializing...');
        
        cacheElements();
        setupEvents();
        loadProduk();
        
        // Set default tanggal jatuh tempo
        const jatuhTempo = document.getElementById('jatuh-tempo');
        if (jatuhTempo) {
            const today = new Date();
            today.setDate(today.getDate() + 30);
            jatuhTempo.value = today.toISOString().split('T')[0];
        }
        
        console.log('[PembelianMain] Initialized');
    }
    
    function cacheElements() {
        // Supplier
        elements.supplierInfo = document.getElementById('supplier-info');
        elements.btnPilihSupplier = document.getElementById('btn-pilih-supplier');
        
        // Produk
        elements.cariProduk = document.getElementById('cari-produk-pembelian');
        elements.hasilPencarian = document.getElementById('hasil-pencarian');
        
        // Keranjang
        elements.keranjangList = document.getElementById('keranjang-list');
        elements.btnClearKeranjang = document.getElementById('btn-clear-keranjang');
        
        // Ringkasan
        elements.subtotal = document.getElementById('subtotal-pembelian');
        elements.diskon = document.getElementById('diskon-pembelian');
        elements.pajak = document.getElementById('pajak-pembelian');
        elements.total = document.getElementById('total-pembelian');
        
        // Pembayaran
        elements.metodeBayar = document.getElementById('metode-bayar');
        elements.jumlahBayar = document.getElementById('jumlah-bayar');
        elements.kembalian = document.getElementById('kembalian-pembelian');
        elements.btnProses = document.getElementById('btn-proses-pembelian');
        elements.btnUangPas = document.getElementById('btn-uang-pas-pembelian');
    }
    
    // ==========================================
    // EVENTS
    // ==========================================
    function setupEvents() {
        // Pilih supplier
        elements.btnPilihSupplier?.addEventListener('click', () => {
            openModal('modal-pilih-supplier');
            loadSupplierList();
        });
        
        // Cari produk
        elements.cariProduk?.addEventListener('input', debounce(cariProduk, 300));
        
        // Clear keranjang
        elements.btnClearKeranjang?.addEventListener('click', () => {
            if (state.keranjang.length === 0) return;
            if (confirm('Kosongkan keranjang?')) {
                state.keranjang = [];
                renderKeranjang();
                hitungTotal();
            }
        });
        
        // Diskon & pajak
        elements.diskon?.addEventListener('input', hitungTotal);
        elements.pajak?.addEventListener('input', hitungTotal);
        
        // Jumlah bayar
        elements.jumlahBayar?.addEventListener('input', hitungKembalian);
        
        // Uang pas
        elements.btnUangPas?.addEventListener('click', () => {
            elements.jumlahBayar.value = state.total;
            hitungKembalian();
        });
        
        // Proses pembelian
        elements.btnProses?.addEventListener('click', prosesPembelian);
    }
    
    // ==========================================
    // SUPPLIER
    // ==========================================
    function loadSupplierList() {
        const container = document.getElementById('supplier-list-modal');
        if (!container) return;
        
        container.innerHTML = '<p style="text-align: center; padding: 40px;">Memuat...</p>';
        
        firebase.database().ref('supplier').once('value')
            .then(snapshot => {
                const suppliers = [];
                snapshot.forEach(child => {
                    suppliers.push({ id: child.key, ...child.val() });
                });
                
                renderSupplierList(suppliers);
            });
    }
    
    function renderSupplierList(suppliers) {
        const container = document.getElementById('supplier-list-modal');
        if (!container) return;
        
        if (suppliers.length === 0) {
            container.innerHTML = `
                <div class="empty-supplier">
                    <i class="fas fa-truck"></i>
                    <p>Belum ada supplier</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        suppliers.forEach(s => {
            html += `
                <div class="supplier-list-item" onclick="pilihSupplier('${s.id}', '${s.nama}', '${s.telepon || ''}')">
                    <div class="avatar"><i class="fas fa-truck"></i></div>
                    <div class="info">
                        <h4>${s.nama}</h4>
                        <p>${s.telepon || '-'} • ${s.alamat || '-'}</p>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    window.pilihSupplier = function(id, nama, telepon) {
        state.supplier = { id, nama, telepon };
        
        elements.supplierInfo.innerHTML = `
            <div class="supplier-selected">
                <div class="supplier-avatar"><i class="fas fa-truck"></i></div>
                <div class="supplier-details">
                    <h4>${nama}</h4>
                    <p><i class="fas fa-phone"></i> ${telepon || '-'}</p>
                    <button class="btn btn-sm btn-secondary" onclick="document.getElementById('btn-pilih-supplier').click()">
                        Ganti Supplier
                    </button>
                </div>
            </div>
        `;
        
        closeModal('modal-pilih-supplier');
    };
    
    // ==========================================
    // PRODUK
    // ==========================================
    function loadProduk() {
        firebase.database().ref('produk').once('value')
            .then(snapshot => {
                state.produkList = [];
                snapshot.forEach(child => {
                    state.produkList.push({ id: child.key, ...child.val() });
                });
            });
    }
    
    function cariProduk() {
        const query = elements.cariProduk.value.trim().toLowerCase();
        
        if (!query) {
            elements.hasilPencarian.innerHTML = '';
            return;
        }
        
        const hasil = state.produkList.filter(p => 
            p.nama?.toLowerCase().includes(query) ||
            p.kode?.toLowerCase().includes(query) ||
            p.barcode?.includes(query)
        ).slice(0, 5);
        
        renderHasilPencarian(hasil);
    }
    
    function renderHasilPencarian(hasil) {
        if (hasil.length === 0) {
            elements.hasilPencarian.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                    <p>Produk tidak ditemukan</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        hasil.forEach(p => {
            html += `
                <div class="hasil-item" onclick="tambahKeKeranjang('${p.id}')">
                    <div class="item-icon"><i class="fas fa-box"></i></div>
                    <div class="item-info">
                        <h4>${p.nama}</h4>
                        <p>${p.kode || '-'} • Stok: ${p.stok || 0}</p>
                    </div>
                    <div class="item-harga">Rp ${formatNumber(p.hargaModal || 0)}</div>
                </div>
            `;
        });
        
        elements.hasilPencarian.innerHTML = html;
    }
    
    window.tambahKeKeranjang = function(produkId) {
        const produk = state.produkList.find(p => p.id === produkId);
        if (!produk) return;
        
        const existing = state.keranjang.find(item => item.id === produkId);
        
        if (existing) {
            existing.qty++;
            existing.subtotal = existing.qty * existing.harga;
        } else {
            state.keranjang.push({
                id: produkId,
                nama: produk.nama,
                kode: produk.kode,
                harga: produk.hargaModal || 0,
                qty: 1,
                subtotal: produk.hargaModal || 0
            });
        }
        
        elements.cariProduk.value = '';
        elements.hasilPencarian.innerHTML = '';
        renderKeranjang();
        hitungTotal();
    };
    
    // ==========================================
    // KERANJANG
    // ==========================================
    function renderKeranjang() {
        if (state.keranjang.length === 0) {
            elements.keranjangList.innerHTML = `
                <div class="empty-keranjang">
                    <i class="fas fa-cart-plus"></i>
                    <p>Keranjang masih kosong</p>
                    <small>Scan atau cari produk untuk menambahkan</small>
                </div>
            `;
            return;
        }
        
        let html = '';
        state.keranjang.forEach((item, index) => {
            html += `
                <div class="keranjang-item">
                    <div class="item-img"><i class="fas fa-box"></i></div>
                    <div class="item-info">
                        <h4>${item.nama}</h4>
                        <p>${item.kode || '-'} • Rp ${formatNumber(item.harga)}</p>
                    </div>
                    <div class="item-qty">
                        <button onclick="ubahQty(${index}, -1)"><i class="fas fa-minus"></i></button>
                        <input type="number" value="${item.qty}" onchange="setQty(${index}, this.value)">
                        <button onclick="ubahQty(${index}, 1)"><i class="fas fa-plus"></i></button>
                    </div>
                    <div class="item-harga">Rp ${formatNumber(item.subtotal)}</div>
                    <button class="item-delete" onclick="hapusDariKeranjang(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
        
        elements.keranjangList.innerHTML = html;
    }
    
    window.ubahQty = function(index, delta) {
        const item = state.keranjang[index];
        item.qty = Math.max(1, item.qty + delta);
        item.subtotal = item.qty * item.harga;
        renderKeranjang();
        hitungTotal();
    };
    
    window.setQty = function(index, value) {
        const qty = parseInt(value) || 1;
        const item = state.keranjang[index];
        item.qty = Math.max(1, qty);
        item.subtotal = item.qty * item.harga;
        renderKeranjang();
        hitungTotal();
    };
    
    window.hapusDariKeranjang = function(index) {
        state.keranjang.splice(index, 1);
        renderKeranjang();
        hitungTotal();
    };
    
    // ==========================================
    // PERHITUNGAN
    // ==========================================
    function hitungTotal() {
        state.subtotal = state.keranjang.reduce((sum, item) => sum + item.subtotal, 0);
        
        const diskonPersen = parseFloat(elements.diskon?.value) || 0;
        const pajakPersen = parseFloat(elements.pajak?.value) || 0;
        
        const diskonNominal = state.subtotal * (diskonPersen / 100);
        const setelahDiskon = state.subtotal - diskonNominal;
        const pajakNominal = setelahDiskon * (pajakPersen / 100);
        
        state.total = setelahDiskon + pajakNominal;
        state.diskon = diskonNominal;
        state.pajak = pajakNominal;
        
        // Update UI
        elements.subtotal.textContent = 'Rp ' + formatNumber(state.subtotal);
        elements.total.textContent = 'Rp ' + formatNumber(state.total);
        
        hitungKembalian();
    }
    
    function hitungKembalian() {
        const bayar = parseFloat(elements.jumlahBayar?.value.replace(/\./g, '')) || 0;
        const selisih = bayar - state.total;
        
        elements.kembalian.textContent = 'Rp ' + formatNumber(Math.abs(selisih));
        elements.kembalian.className = 'kembalian-display ' + (selisih >= 0 ? 'lebih' : 'kurang');
    }
    
    // ==========================================
    // PROSES PEMBELIAN
    // ==========================================
    function prosesPembelian() {
        // Validasi
        if (!state.supplier) {
            alert('Pilih supplier terlebih dahulu!');
            return;
        }
        
        if (state.keranjang.length === 0) {
            alert('Keranjang masih kosong!');
            return;
        }
        
        const jumlahBayar = parseFloat(elements.jumlahBayar?.value.replace(/\./g, '')) || 0;
        
        if (jumlahBayar < state.total && elements.metodeBayar?.value !== 'hutang') {
            alert('Jumlah bayar kurang dari total!');
            return;
        }
        
        // Generate invoice number
        const invoice = 'PB-' + Date.now();
        
        // Data transaksi
        const transaksi = {
            invoice: invoice,
            tanggal: new Date().toISOString(),
            supplier: state.supplier,
            items: state.keranjang,
            subtotal: state.subtotal,
            diskon: state.diskon,
            pajak: state.pajak,
            total: state.total,
            metodeBayar: elements.metodeBayar?.value || 'tunai',
            jumlahBayar: jumlahBayar,
            kembalian: jumlahBayar - state.total,
            catatan: document.getElementById('catatan-pembelian')?.value || '',
            status: elements.metodeBayar?.value === 'hutang' ? 'hutang' : 'lunas'
        };
        
        if (elements.metodeBayar?.value === 'hutang') {
            transaksi.jatuhTempo = document.getElementById('jatuh-tempo')?.value;
        }
        
        // Simpan ke Firebase
        const db = firebase.database();
        
        Promise.all([
            // Simpan transaksi
            db.ref('pembelian/' + invoice).set(transaksi),
            
            // Update stok produk
            ...state.keranjang.map(item => {
                return db.ref('produk/' + item.id + '/stok').transaction(stok => {
                    return (stok || 0) + item.qty;
                });
            })
        ])
        .then(() => {
            alert('Pembelian berhasil disimpan!\nInvoice: ' + invoice);
            
            // Reset
            state.keranjang = [];
            state.supplier = null;
            elements.jumlahBayar.value = '';
            document.getElementById('catatan-pembelian').value = '';
            
            renderKeranjang();
            hitungTotal();
            
            elements.supplierInfo.innerHTML = `
                <div class="empty-supplier">
                    <i class="fas fa-user-tie"></i>
                    <p>Belum memilih supplier</p>
                    <button class="btn btn-primary" onclick="document.getElementById('btn-pilih-supplier').click()">
                        Pilih Supplier
                    </button>
                </div>
            `;
        })
        .catch(err => {
            alert('Error: ' + err.message);
        });
    }
    
    // ==========================================
    // UTILITY
    // ==========================================
    function debounce(func, wait) {
        let timeout;
        return function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, arguments), wait);
        };
    }
    
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    
    function openModal(id) {
        document.getElementById(id)?.classList.add('active');
    }
    
    function closeModal(id) {
        document.getElementById(id)?.classList.remove('active');
    }
    
    // ==========================================
    // PUBLIC API
    // ==========================================
    window.PembelianMain = {
        init: init,
        refresh: () => {
            loadProduk();
            state.keranjang = [];
            renderKeranjang();
            hitungTotal();
        }
    };
    
    // Auto init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
