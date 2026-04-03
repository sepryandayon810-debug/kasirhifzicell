/**
 * Pembelian Main Controller - Koordinator untuk 4 Module
 * 
 * Module yang dimuat:
 * - keranjang-pembelian.js  → Mengelola keranjang belanja
 * - detail-pembelian.js     → Menampilkan detail invoice
 * - riwayat-pembelian.js    → Menampilkan riwayat transaksi
 * - supplier-manager.js     → Mengelola data supplier
 */

(function() {
    'use strict';
    
    // ==========================================
    // STATE GLOBAL (Dibagikan ke semua module)
    // ==========================================
    window.PembelianState = {
        keranjang: [],
        supplier: null,
        subtotal: 0,
        diskon: 0,
        pajak: 0,
        total: 0,
        metodeBayar: 'tunai',
        produkList: [],
        suppliers: [],
        currentTab: 'transaksi'
    };
    
    // ==========================================
    // DOM CACHE
    // ==========================================
    const DOM = {};
    
    // ==========================================
    // INIT
    // ==========================================
    function init() {
        console.log('[PembelianMain] Initializing...');
        
        // Tunggu semua module siap
        setTimeout(() => {
            cacheDOM();
            setupEvents();
            loadInitialData();
            console.log('[PembelianMain] Ready');
        }, 100);
    }
    
    function cacheDOM() {
        // Container utama
        DOM.container = document.getElementById('pembelian-container');
        
        // Tabs
        DOM.tabs = document.querySelectorAll('.tab-btn');
        DOM.tabContents = document.querySelectorAll('.tab-content');
        
        // Supplier section
        DOM.supplierInfo = document.getElementById('supplier-info');
        DOM.btnPilihSupplier = document.getElementById('btn-pilih-supplier');
        
        // Produk section
        DOM.cariProduk = document.getElementById('cari-produk-pembelian');
        DOM.hasilPencarian = document.getElementById('hasil-pencarian');
        
        // Keranjang section
        DOM.keranjangList = document.getElementById('keranjang-list');
        DOM.btnClearKeranjang = document.getElementById('btn-clear-keranjang');
        
        // Ringkasan
        DOM.subtotal = document.getElementById('subtotal-pembelian');
        DOM.diskon = document.getElementById('diskon-pembelian');
        DOM.pajak = document.getElementById('pajak-pembelian');
        DOM.total = document.getElementById('total-pembelian');
        
        // Pembayaran
        DOM.metodeBayar = document.getElementById('metode-bayar');
        DOM.jumlahBayar = document.getElementById('jumlah-bayar');
        DOM.kembalian = document.getElementById('kembalian-pembelian');
        DOM.btnProses = document.getElementById('btn-proses-pembelian');
        DOM.btnUangPas = document.getElementById('btn-uang-pas-pembelian');
        DOM.groupJatuhTempo = document.getElementById('group-jatuh-tempo');
        DOM.jatuhTempo = document.getElementById('jatuh-tempo');
        
        // Riwayat
        DOM.riwayatList = document.getElementById('riwayat-list');
        DOM.searchRiwayat = document.getElementById('search-riwayat');
        DOM.filterDari = document.getElementById('filter-tanggal-dari');
        DOM.filterSampai = document.getElementById('filter-tanggal-sampai');
        DOM.btnFilterRiwayat = document.getElementById('btn-filter-riwayat');
        
        // Supplier
        DOM.supplierGrid = document.getElementById('supplier-grid');
        DOM.searchSupplier = document.getElementById('search-supplier');
        DOM.btnTambahSupplier = document.getElementById('btn-tambah-supplier');
        
        // Modal
        DOM.modalPilihSupplier = document.getElementById('modal-pilih-supplier');
        DOM.supplierListModal = document.getElementById('supplier-list-modal');
        DOM.cariSupplierModal = document.getElementById('cari-supplier-modal');
    }
    
    // ==========================================
    // EVENTS
    // ==========================================
    function setupEvents() {
        // Tab switching
        DOM.tabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });
        
        // Supplier
        DOM.btnPilihSupplier?.addEventListener('click', () => {
            openModal('modal-pilih-supplier');
            loadSupplierModal();
        });
        
        // Produk search
        DOM.cariProduk?.addEventListener('input', debounce(cariProdukHandler, 300));
        
        // Clear keranjang
        DOM.btnClearKeranjang?.addEventListener('click', clearKeranjang);
        
        // Perhitungan
        DOM.diskon?.addEventListener('input', hitungTotal);
        DOM.pajak?.addEventListener('input', hitungTotal);
        DOM.jumlahBayar?.addEventListener('input', hitungKembalian);
        
        // Uang pas
        DOM.btnUangPas?.addEventListener('click', () => {
            DOM.jumlahBayar.value = window.PembelianState.total;
            hitungKembalian();
        });
        
        // Metode bayar
        DOM.metodeBayar?.addEventListener('change', (e) => {
            DOM.groupJatuhTempo.style.display = e.target.value === 'hutang' ? 'block' : 'none';
        });
        
        // Proses pembelian
        DOM.btnProses?.addEventListener('click', prosesPembelian);
        
        // Riwayat filter
        DOM.btnFilterRiwayat?.addEventListener('click', () => {
            if (window.RiwayatPembelian?.loadFiltered) {
                window.RiwayatPembelian.loadFiltered({
                    dari: DOM.filterDari?.value,
                    sampai: DOM.filterSampai?.value,
                    search: DOM.searchRiwayat?.value
                });
            }
        });
        
        // Search riwayat realtime
        DOM.searchRiwayat?.addEventListener('input', debounce(() => {
            if (window.RiwayatPembelian?.search) {
                window.RiwayatPembelian.search(DOM.searchRiwayat.value);
            }
        }, 300));
        
        // Search supplier
        DOM.searchSupplier?.addEventListener('input', debounce(() => {
            if (window.SupplierManager?.search) {
                window.SupplierManager.search(DOM.searchSupplier.value);
            }
        }, 300));
        
        // Tambah supplier
        DOM.btnTambahSupplier?.addEventListener('click', () => {
            openModal('modal-tambah-supplier');
        });
        
        // Simpan supplier
        document.getElementById('btn-simpan-supplier')?.addEventListener('click', simpanSupplier);
        
        // Search supplier di modal
        DOM.cariSupplierModal?.addEventListener('input', debounce(() => {
            filterSupplierModal(DOM.cariSupplierModal.value);
        }, 300));
    }
    
    // ==========================================
    // TAB SWITCHING
    // ==========================================
    function switchTab(tabName) {
        window.PembelianState.currentTab = tabName;
        
        // Update buttons
        DOM.tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
        
        // Update content
        DOM.tabContents.forEach(c => c.classList.toggle('active', c.id === `tab-${tabName}`));
        
        // Trigger load untuk tab tertentu
        if (tabName === 'riwayat' && window.RiwayatPembelian?.load) {
            window.RiwayatPembelian.load();
        } else if (tabName === 'supplier' && window.SupplierManager?.load) {
            window.SupplierManager.load();
        }
    }
    
    // ==========================================
    // DATA LOADING
    // ==========================================
    function loadInitialData() {
        // Load produk untuk pencarian
        loadProduk();
        
        // Load supplier
        loadSuppliers();
        
        // Set default tanggal
        if (DOM.jatuhTempo) {
            const today = new Date();
            today.setDate(today.getDate() + 30);
            DOM.jatuhTempo.value = today.toISOString().split('T')[0];
        }
        
        // Set default filter tanggal riwayat
        if (DOM.filterDari && DOM.filterSampai) {
            const today = new Date();
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            
            DOM.filterDari.value = lastMonth.toISOString().split('T')[0];
            DOM.filterSampai.value = today.toISOString().split('T')[0];
        }
    }
    
    function loadProduk() {
        firebase.database().ref('produk').once('value')
            .then(snapshot => {
                window.PembelianState.produkList = [];
                snapshot.forEach(child => {
                    window.PembelianState.produkList.push({
                        id: child.key,
                        ...child.val()
                    });
                });
                console.log('[PembelianMain] Loaded', window.PembelianState.produkList.length, 'produk');
            });
    }
    
    function loadSuppliers() {
        firebase.database().ref('supplier').once('value')
            .then(snapshot => {
                window.PembelianState.suppliers = [];
                snapshot.forEach(child => {
                    window.PembelianState.suppliers.push({
                        id: child.key,
                        ...child.val()
                    });
                });
            });
    }
    
    // ==========================================
    // SUPPLIER FUNCTIONS
    // ==========================================
    function loadSupplierModal() {
        if (!DOM.supplierListModal) return;
        
        renderSupplierListModal(window.PembelianState.suppliers);
    }
    
    function renderSupplierListModal(suppliers) {
        if (suppliers.length === 0) {
            DOM.supplierListModal.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fas fa-truck" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p>Belum ada supplier</p>
                    <button class="btn btn-primary" style="margin-top: 16px;" onclick="document.getElementById('btn-tambah-supplier').click()">
                        Tambah Supplier
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '';
        suppliers.forEach(s => {
            html += `
                <div class="supplier-list-item" onclick="PembelianMain.pilihSupplier('${s.id}')">
                    <div class="avatar"><i class="fas fa-truck"></i></div>
                    <div class="info">
                        <h4>${s.nama}</h4>
                        <p><i class="fas fa-phone"></i> ${s.telepon || '-'} &bull; ${s.alamat || '-'}</p>
                    </div>
                </div>
            `;
        });
        
        DOM.supplierListModal.innerHTML = html;
    }
    
    function filterSupplierModal(query) {
        const filtered = window.PembelianState.suppliers.filter(s => 
            s.nama?.toLowerCase().includes(query.toLowerCase()) ||
            s.telepon?.includes(query)
        );
        renderSupplierListModal(filtered);
    }
    
    function pilihSupplier(supplierId) {
        const supplier = window.PembelianState.suppliers.find(s => s.id === supplierId);
        if (!supplier) return;
        
        window.PembelianState.supplier = supplier;
        
        DOM.supplierInfo.innerHTML = `
            <div class="supplier-selected">
                <div class="supplier-avatar"><i class="fas fa-truck"></i></div>
                <div class="supplier-details">
                    <h4>${supplier.nama}</h4>
                    <p><i class="fas fa-phone"></i> ${supplier.telepon || '-'}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${supplier.alamat || '-'}</p>
                    <button class="btn btn-sm btn-secondary" onclick="document.getElementById('btn-pilih-supplier').click()" style="margin-top: 10px;">
                        <i class="fas fa-exchange-alt"></i> Ganti Supplier
                    </button>
                </div>
            </div>
        `;
        
        closeModal('modal-pilih-supplier');
    }
    
    function simpanSupplier() {
        const nama = document.getElementById('supplier-nama')?.value.trim();
        const telepon = document.getElementById('supplier-telepon')?.value.trim();
        const email = document.getElementById('supplier-email')?.value.trim();
        const alamat = document.getElementById('supplier-alamat')?.value.trim();
        
        if (!nama) {
            alert('Nama supplier wajib diisi!');
            return;
        }
        
        const supplierData = {
            nama,
            telepon,
            email,
            alamat,
            createdAt: new Date().toISOString()
        };
        
        firebase.database().ref('supplier').push(supplierData)
            .then(() => {
                alert('Supplier berhasil disimpan!');
                closeModal('modal-tambah-supplier');
                
                // Reset form
                document.getElementById('supplier-nama').value = '';
                document.getElementById('supplier-telepon').value = '';
                document.getElementById('supplier-email').value = '';
                document.getElementById('supplier-alamat').value = '';
                
                // Reload
                loadSuppliers();
            })
            .catch(err => {
                alert('Error: ' + err.message);
            });
    }
    
    // ==========================================
    // PRODUK & KERANJANG
    // ==========================================
    function cariProdukHandler() {
        const query = DOM.cariProduk.value.trim().toLowerCase();
        
        if (!query) {
            DOM.hasilPencarian.innerHTML = '';
            return;
        }
        
        // Cek kalau ada module KeranjangPembelian dengan fungsi search
        if (window.KeranjangPembelian?.searchProduk) {
            window.KeranjangPembelian.searchProduk(query, renderHasilPencarian);
            return;
        }
        
        // Fallback: search manual
        const hasil = window.PembelianState.produkList.filter(p => 
            p.nama?.toLowerCase().includes(query) ||
            p.kode?.toLowerCase().includes(query) ||
            p.barcode?.includes(query)
        ).slice(0, 5);
        
        renderHasilPencarian(hasil);
    }
    
    function renderHasilPencarian(hasil) {
        if (hasil.length === 0) {
            DOM.hasilPencarian.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                    <p>Produk tidak ditemukan</p>
                    <button class="btn btn-primary" style="margin-top: 10px;" onclick="document.getElementById('btn-tambah-produk-baru').click()">
                        <i class="fas fa-plus"></i> Tambah Produk Baru
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '';
        hasil.forEach(p => {
            html += `
                <div class="hasil-item" onclick="PembelianMain.tambahKeKeranjang('${p.id}')">
                    <div class="item-icon"><i class="fas fa-box"></i></div>
                    <div class="item-info">
                        <h4>${p.nama}</h4>
                        <p>${p.kode || '-'} &bull; Stok: ${p.stok || 0}</p>
                    </div>
                    <div class="item-harga">Rp ${formatNumber(p.hargaModal || 0)}</div>
                </div>
            `;
        });
        
        DOM.hasilPencarian.innerHTML = html;
    }
    
    function tambahKeKeranjang(produkId) {
        const produk = window.PembelianState.produkList.find(p => p.id === produkId);
        if (!produk) return;
        
        // Cek kalau ada module KeranjangPembelian
        if (window.KeranjangPembelian?.tambahItem) {
            window.KeranjangPembelian.tambahItem(produk);
            renderKeranjangFromModule();
            return;
        }
        
        // Fallback: tambah manual
        const existing = window.PembelianState.keranjang.find(item => item.id === produkId);
        
        if (existing) {
            existing.qty++;
            existing.subtotal = existing.qty * existing.harga;
        } else {
            window.PembelianState.keranjang.push({
                id: produkId,
                nama: produk.nama,
                kode: produk.kode,
                harga: produk.hargaModal || 0,
                qty: 1,
                subtotal: produk.hargaModal || 0
            });
        }
        
        DOM.cariProduk.value = '';
        DOM.hasilPencarian.innerHTML = '';
        renderKeranjang();
        hitungTotal();
    }
    
    function renderKeranjang() {
        // Cek kalau ada module KeranjangPembelian
        if (window.KeranjangPembelian?.render) {
            window.KeranjangPembelian.render(DOM.keranjangList);
            return;
        }
        
        // Fallback render
        const keranjang = window.PembelianState.keranjang;
        
        if (keranjang.length === 0) {
            DOM.keranjangList.innerHTML = `
                <div class="empty-keranjang">
                    <i class="fas fa-cart-plus"></i>
                    <p>Keranjang masih kosong</p>
                    <small>Scan atau cari produk untuk menambahkan</small>
                </div>
            `;
            return;
        }
        
        let html = '';
        keranjang.forEach((item, index) => {
            html += `
                <div class="keranjang-item">
                    <div class="item-img"><i class="fas fa-box"></i></div>
                    <div class="item-info">
                        <h4>${item.nama}</h4>
                        <p>${item.kode || '-'} &bull; Rp ${formatNumber(item.harga)}</p>
                    </div>
                    <div class="item-qty">
                        <button onclick="PembelianMain.ubahQty(${index}, -1)"><i class="fas fa-minus"></i></button>
                        <input type="number" value="${item.qty}" onchange="PembelianMain.setQty(${index}, this.value)">
                        <button onclick="PembelianMain.ubahQty(${index}, 1)"><i class="fas fa-plus"></i></button>
                    </div>
                    <div class="item-harga">Rp ${formatNumber(item.subtotal)}</div>
                    <button class="item-delete" onclick="PembelianMain.hapusItem(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
        
        DOM.keranjangList.innerHTML = html;
    }
    
    function renderKeranjangFromModule() {
        if (window.KeranjangPembelian?.getItems) {
            window.PembelianState.keranjang = window.KeranjangPembelian.getItems();
        }
        renderKeranjang();
        hitungTotal();
    }
    
    function ubahQty(index, delta) {
        // Cek module
        if (window.KeranjangPembelian?.ubahQty) {
            window.KeranjangPembelian.ubahQty(index, delta);
            renderKeranjangFromModule();
            return;
        }
        
        // Fallback
        const item = window.PembelianState.keranjang[index];
        item.qty = Math.max(1, item.qty + delta);
        item.subtotal = item.qty * item.harga;
        renderKeranjang();
        hitungTotal();
    }
    
    function setQty(index, value) {
        const qty = parseInt(value) || 1;
        
        if (window.KeranjangPembelian?.setQty) {
            window.KeranjangPembelian.setQty(index, qty);
            renderKeranjangFromModule();
            return;
        }
        
        const item = window.PembelianState.keranjang[index];
        item.qty = Math.max(1, qty);
        item.subtotal = item.qty * item.harga;
        renderKeranjang();
        hitungTotal();
    }
    
    function hapusItem(index) {
        if (window.KeranjangPembelian?.hapusItem) {
            window.KeranjangPembelian.hapusItem(index);
            renderKeranjangFromModule();
            return;
        }
        
        window.PembelianState.keranjang.splice(index, 1);
        renderKeranjang();
        hitungTotal();
    }
    
    function clearKeranjang() {
        if (window.PembelianState.keranjang.length === 0) return;
        
        if (!confirm('Kosongkan keranjang?')) return;
        
        if (window.KeranjangPembelian?.clear) {
            window.KeranjangPembelian.clear();
        }
        
        window.PembelianState.keranjang = [];
        renderKeranjang();
        hitungTotal();
    }
    
    // ==========================================
    // PERHITUNGAN
    // ==========================================
    function hitungTotal() {
        const state = window.PembelianState;
        
        state.subtotal = state.keranjang.reduce((sum, item) => sum + item.subtotal, 0);
        
        const diskonPersen = parseFloat(DOM.diskon?.value) || 0;
        const pajakPersen = parseFloat(DOM.pajak?.value) || 0;
        
        const diskonNominal = state.subtotal * (diskonPersen / 100);
        const setelahDiskon = state.subtotal - diskonNominal;
        const pajakNominal = setelahDiskon * (pajakPersen / 100);
        
        state.total = setelahDiskon + pajakNominal;
        state.diskon = diskonNominal;
        state.pajak = pajakNominal;
        
        // Update UI
        if (DOM.subtotal) DOM.subtotal.textContent = 'Rp ' + formatNumber(state.subtotal);
        if (DOM.total) DOM.total.textContent = 'Rp ' + formatNumber(state.total);
        
        hitungKembalian();
    }
    
    function hitungKembalian() {
        const bayar = parseFloat(DOM.jumlahBayar?.value.replace(/\./g, '')) || 0;
        const selisih = bayar - window.PembelianState.total;
        
        if (DOM.kembalian) {
            DOM.kembalian.textContent = 'Rp ' + formatNumber(Math.abs(selisih));
            DOM.kembalian.className = 'kembalian-display ' + (selisih >= 0 ? 'lebih' : 'kurang');
        }
    }
    
    // ==========================================
    // PROSES PEMBELIAN
    // ==========================================
    function prosesPembelian() {
        const state = window.PembelianState;
        
        // Validasi
        if (!state.supplier) {
            alert('Pilih supplier terlebih dahulu!');
            DOM.btnPilihSupplier?.focus();
            return;
        }
        
        if (state.keranjang.length === 0) {
            alert('Keranjang masih kosong!');
            DOM.cariProduk?.focus();
            return;
        }
        
        const jumlahBayar = parseFloat(DOM.jumlahBayar?.value.replace(/\./g, '')) || 0;
        
        if (jumlahBayar < state.total && DOM.metodeBayar?.value !== 'hutang') {
            alert('Jumlah bayar kurang dari total!');
            DOM.jumlahBayar?.focus();
            return;
        }
        
        // Generate invoice
        const invoice = 'PB-' + Date.now();
        const now = new Date();
        
        // Data transaksi
        const transaksi = {
            invoice: invoice,
            tanggal: now.toISOString(),
            supplier: {
                id: state.supplier.id,
                nama: state.supplier.nama,
                telepon: state.supplier.telepon
            },
            items: state.keranjang.map(item => ({...item})), // Copy
            subtotal: state.subtotal,
            diskon: state.diskon,
            pajak: state.pajak,
            total: state.total,
            metodeBayar: DOM.metodeBayar?.value || 'tunai',
            jumlahBayar: jumlahBayar,
            kembalian: jumlahBayar - state.total,
            catatan: document.getElementById('catatan-pembelian')?.value || '',
            status: DOM.metodeBayar?.value === 'hutang' ? 'hutang' : 'lunas',
            createdAt: now.toISOString(),
            createdBy: firebase.auth().currentUser?.uid || 'unknown'
        };
        
        if (DOM.metodeBayar?.value === 'hutang' && DOM.jatuhTempo?.value) {
            transaksi.jatuhTempo = DOM.jatuhTempo.value;
        }
        
        // Simpan ke Firebase
        const db = firebase.database();
        const updates = {};
        
        // 1. Simpan transaksi pembelian
        updates['pembelian/' + invoice] = transaksi;
        
        // 2. Update stok produk
        state.keranjang.forEach(item => {
            updates['produk/' + item.id + '/stok'] = firebase.database.ServerValue.increment(item.qty);
            updates['produk/' + item.id + '/lastPurchase'] = now.toISOString();
            updates['produk/' + item.id + '/lastPurchasePrice'] = item.harga;
        });
        
        // 3. Update hutang supplier kalau hutang
        if (DOM.metodeBayar?.value === 'hutang') {
            updates['supplier/' + state.supplier.id + '/hutang'] = firebase.database.ServerValue.increment(state.total);
        }
        
        db.ref().update(updates)
            .then(() => {
                alert('✅ Pembelian berhasil!\n\nInvoice: ' + invoice + '\nTotal: Rp ' + formatNumber(state.total));
                
                // Cek kalau ada module DetailPembelian untuk show detail
                if (window.DetailPembelian?.show) {
                    window.DetailPembelian.show(invoice);
                }
                
                // Reset form
                resetForm();
            })
            .catch(err => {
                alert('❌ Error: ' + err.message);
                console.error(err);
            });
    }
    
    function resetForm() {
        window.PembelianState.keranjang = [];
        window.PembelianState.supplier = null;
        
        if (window.KeranjangPembelian?.clear) {
            window.KeranjangPembelian.clear();
        }
        
        DOM.jumlahBayar.value = '';
        DOM.diskon.value = '0';
        DOM.pajak.value = '0';
        document.getElementById('catatan-pembelian').value = '';
        
        DOM.supplierInfo.innerHTML = `
            <div class="empty-supplier">
                <i class="fas fa-user-tie"></i>
                <p>Belum memilih supplier</p>
                <button class="btn btn-primary" onclick="document.getElementById('btn-pilih-supplier').click()">
                    Pilih Supplier
                </button>
            </div>
        `;
        
        renderKeranjang();
        hitungTotal();
    }
    
    // ==========================================
    // UTILITY
    // ==========================================
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
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
            loadSuppliers();
            resetForm();
        },
        pilihSupplier: pilihSupplier,
        tambahKeKeranjang: tambahKeKeranjang,
        ubahQty: ubahQty,
        setQty: setQty,
        hapusItem: hapusItem,
        getState: () => window.PembelianState
    };
    
    // Auto init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
