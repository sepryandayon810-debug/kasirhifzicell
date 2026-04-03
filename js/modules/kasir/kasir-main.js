/**
 * Kasir Main Controller
 * File: js/modules/kasir/kasir-main.js
 * 
 * Controller utama untuk koordinasi antar modul
 */

// State global
let currentView = 'grid';
let currentJenis = 'penjualan';
let produkData = [];
let pelangganData = [];

// Inisialisasi saat DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Tunggu auth siap
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(function(user) {
            if (user) {
                initKasir();
            } else {
                if (!window.location.pathname.includes('login.html')) {
                    window.location.replace('../login.html');
                }
            }
        });
    } else {
        initKasir();
    }
});

/**
 * Inisialisasi modul kasir
 */
function initKasir() {
    // Load data
    loadProduk();
    loadPelanggan();
    loadKategori();
    
    // Setup event listeners
    setupEventListeners();
    setupKeyboardShortcuts();
    
    // Update datetime
    setInterval(updateDateTime, 1000);
    updateDateTime();
    
    // Cek status kasir
    checkKasirStatus();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Toggle view (grid/list)
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            toggleView(view);
        });
    });
    
    // Jenis transaksi
    document.querySelectorAll('.jenis-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const jenis = this.getAttribute('data-jenis');
            switchJenisTransaksi(jenis);
        });
    });
    
    // Tombol transaksi manual
    const btnManual = document.getElementById('btn-transaksi-manual');
    if (btnManual) {
        btnManual.addEventListener('click', () => {
            openModal('modal-transaksi-manual');
        });
    }
    
    // Metode pembayaran
    const metodeSelect = document.getElementById('metode-pembayaran');
    if (metodeSelect) {
        metodeSelect.addEventListener('change', handleMetodeChange);
    }
    
    // Jumlah bayar
    const jumlahBayar = document.getElementById('jumlah-bayar');
    if (jumlahBayar) {
        jumlahBayar.addEventListener('input', hitungKembalian);
    }
    
    // Tombol bayar
    const btnBayar = document.getElementById('btn-bayar');
    if (btnBayar) {
        btnBayar.addEventListener('click', prosesPembayaran);
    }
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl + K untuk search
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('search-produk');
            if (searchInput) searchInput.focus();
        }
        
        // F2 untuk fokus ke jumlah bayar
        if (e.key === 'F2') {
            e.preventDefault();
            const jumlahBayar = document.getElementById('jumlah-bayar');
            if (jumlahBayar) jumlahBayar.focus();
        }
        
        // F4 untuk transaksi manual
        if (e.key === 'F4') {
            e.preventDefault();
            openModal('modal-transaksi-manual');
        }
        
        // Escape untuk tutup modal
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

/**
 * Load data produk dari Firebase
 */
async function loadProduk() {
    try {
        const container = document.getElementById('produk-container');
        if (container) {
            container.innerHTML = `
                <div class="loading-produk" style="grid-column: 1/-1;">
                    <div class="spinner"></div>
                    <p>Memuat produk...</p>
                </div>
            `;
        }
        
        if (typeof database === 'undefined') {
            throw new Error('Database not initialized');
        }
        
        const snapshot = await database.ref('products').orderByChild('status').equalTo('aktif').once('value');
        produkData = [];
        
        snapshot.forEach(child => {
            produkData.push({
                id: child.key,
                ...child.val()
            });
        });
        
        renderProduk(produkData);
        
    } catch (error) {
        console.error('Error loading produk:', error);
        const container = document.getElementById('produk-container');
        if (container) {
            container.innerHTML = `
                <div class="loading-produk" style="grid-column: 1/-1;">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; color: var(--accent-rose); margin-bottom: 15px;"></i>
                    <p>Gagal memuat produk</p>
                    <button class="btn btn-primary" onclick="loadProduk()" style="margin-top: 15px;">
                        <i class="fas fa-sync"></i> Coba Lagi
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Render produk berdasarkan view yang aktif
 * @param {Array} produkList 
 */
function renderProduk(produkList) {
    const container = document.getElementById('produk-container');
    if (!container) return;
    
    if (produkList.length === 0) {
        container.innerHTML = `
            <div class="loading-produk" style="grid-column: 1/-1;">
                <i class="fas fa-box-open" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>Tidak ada produk</p>
            </div>
        `;
        return;
    }
    
    // Gunakan module yang sesuai
    if (currentView === 'grid') {
        if (typeof ProdukGrid !== 'undefined') {
            ProdukGrid.render(produkList, container);
        } else {
            console.error('ProdukGrid module not loaded');
        }
    } else {
        if (typeof ProdukList !== 'undefined') {
            ProdukList.render(produkList, container);
        } else {
            console.error('ProdukList module not loaded');
        }
    }
}

/**
 * Toggle antara grid dan list view
 * @param {String} view 
 */
function toggleView(view) {
    currentView = view;
    
    // Update button state
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-view="${view}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Filter produk berdasarkan search saat ini
    const searchTerm = document.getElementById('search-produk')?.value.toLowerCase() || '';
    let filtered = [...produkData];
    
    if (searchTerm) {
        filtered = produkData.filter(p => 
            p.nama.toLowerCase().includes(searchTerm) ||
            (p.kode && p.kode.toLowerCase().includes(searchTerm)) ||
            (p.barcode && p.barcode.includes(searchTerm))
        );
    }
    
    const kategori = document.getElementById('filter-kategori')?.value || '';
    if (kategori) {
        filtered = filtered.filter(p => p.kategori === kategori);
    }
    
    renderProduk(filtered);
}

/**
 * Switch jenis transaksi
 * @param {String} jenis 
 */
function switchJenisTransaksi(jenis) {
    currentJenis = jenis;
    
    // Update button state
    document.querySelectorAll('.jenis-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-jenis="${jenis}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Buka modal untuk topup/tarik
    if (jenis === 'topup') {
        openModal('modal-topup');
    } else if (jenis === 'tarik') {
        openModal('modal-tarik');
    }
}

/**
 * Handle perubahan metode pembayaran
 */
function handleMetodeChange() {
    const metode = document.getElementById('metode-pembayaran')?.value;
    const groupPelanggan = document.getElementById('group-pelanggan');
    const groupBayar = document.getElementById('group-bayar');
    const groupKembalian = document.getElementById('group-kembalian');
    
    if (groupPelanggan) {
        groupPelanggan.style.display = metode === 'hutang' ? 'block' : 'none';
    }
    
    // Untuk hutang, sembunyikan input bayar dan kembalian
    if (groupBayar) {
        groupBayar.style.display = metode === 'hutang' ? 'none' : 'block';
    }
    if (groupKembalian) {
        groupKembalian.style.display = metode === 'hutang' ? 'none' : 'block';
    }
}

/**
 * Hitung kembalian
 */
function hitungKembalian() {
    const keranjang = window.Keranjang ? window.Keranjang.getItems() : [];
    const total = keranjang.reduce((sum, item) => sum + item.subtotal, 0);
    const bayarInput = document.getElementById('jumlah-bayar');
    const bayar = bayarInput ? (parseRupiah(bayarInput.value) || 0) : 0;
    const kembalian = bayar - total;
    
    const kembalianEl = document.getElementById('kembalian');
    if (!kembalianEl) return;
    
    kembalianEl.textContent = formatRupiah(Math.abs(kembalian));
    
    if (kembalian < 0) {
        kembalianEl.style.color = 'var(--accent-rose)';
        kembalianEl.textContent = '-' + kembalianEl.textContent;
    } else {
        kembalianEl.style.color = 'var(--accent-indigo)';
    }
}

/**
 * Bersihkan item untuk disimpan ke Firebase (hapus undefined/null)
 * @param {Array} items 
 * @returns {Array}
 */
function cleanItemsForFirebase(items) {
    return items.map(item => {
        const cleanItem = {
            id: item.id || '',
            nama: item.nama || '',
            harga_jual: item.harga_jual || 0,
            harga_modal: item.harga_modal || 0,
            qty: item.qty || 1,
            subtotal: item.subtotal || 0,
            jenis: item.jenis || 'penjualan',
            keterangan: item.keterangan || '',
            laba: ((item.harga_jual || 0) - (item.harga_modal || 0)) * (item.qty || 1)
        };
        
        // Hanya tambahkan gambar jika ada
        if (item.gambar && item.gambar !== undefined && item.gambar !== null) {
            cleanItem.gambar = item.gambar;
        }
        
        // Tambahkan field khusus untuk topup/tarik
        if (item.jenis === 'topup') {
            cleanItem.provider = item.provider || '';
            cleanItem.nominal = item.nominal || 0;
            cleanItem.fee = item.fee || 0;
        } else if (item.jenis === 'tarik') {
            cleanItem.nominal = item.nominal || 0;
            cleanItem.fee = item.fee || 0;
        }
        
        return cleanItem;
    });
}

/**
 * Proses pembayaran
 */
async function prosesPembayaran() {
    const keranjang = window.Keranjang ? window.Keranjang.getItems() : [];
    
    // Cek keranjang
    if (keranjang.length === 0) {
        showToast('Keranjang masih kosong', 'warning');
        return;
    }

    const total = keranjang.reduce((sum, item) => sum + item.subtotal, 0);
    const metodeSelect = document.getElementById('metode-pembayaran');
    const metode = metodeSelect ? metodeSelect.value : 'tunai';
    const bayar = parseRupiah(document.getElementById('jumlah-bayar')?.value) || 0;
    
    // Validasi untuk tunai
    if (metode === 'tunai' && bayar < total) {
        showToast('Jumlah bayar kurang dari total', 'error');
        return;
    }
    
    if (metode === 'hutang') {
        const pelanggan = document.getElementById('select-pelanggan')?.value;
        if (!pelanggan) {
            showToast('Pilih pelanggan untuk transaksi hutang', 'warning');
            return;
        }
    }
    
    // Disable tombol bayar
    const btnBayar = document.getElementById('btn-bayar');
    if (btnBayar) {
        btnBayar.disabled = true;
        btnBayar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    }
    
    try {
        // Ambil session
        let session = null;
        const sessionData = localStorage.getItem('webpos_session') || sessionStorage.getItem('webpos_session');
        if (sessionData) {
            try {
                session = JSON.parse(sessionData);
            } catch (e) {
                console.error('Error parsing session:', e);
            }
        }
        
        // Fallback session
        if (!session || !session.uid) {
            const user = auth?.currentUser;
            if (!user) throw new Error('Sesi habis, silakan login ulang');
            
            session = {
                uid: user.uid,
                nama: user.displayName || user.email?.split('@')[0] || 'Kasir',
                role: 'kasir',
                shift: 'shift-1'
            };
        }
        
        const today = getToday();
        const kodeTransaksi = generateKodeTransaksi();
        
        // Bersihkan items sebelum disimpan
        const cleanItems = cleanItemsForFirebase(keranjang);
        
        // Data transaksi
        const transaksiData = {
            kode: kodeTransaksi,
            tanggal: today,
            waktu: new Date().toISOString(),
            kasir_id: session.uid,
            kasir_nama: session.nama,
            shift: session.shift || 'shift-1',
            items: cleanItems,
            subtotal: total,
            diskon: 0,
            total: total,
            metode_pembayaran: metode,
            bayar: metode === 'hutang' ? 0 : bayar,
            kembalian: metode === 'tunai' ? (bayar - total) : 0,
            pelanggan_id: metode === 'hutang' ? document.getElementById('select-pelanggan').value : null,
            status: 'selesai',
            created_at: firebase.database.ServerValue?.TIMESTAMP || Date.now()
        };
        
        // Simpan transaksi
        if (typeof database !== 'undefined') {
            await database.ref(`transaksi/${today}/${kodeTransaksi}`).set(transaksiData);
            
            // Update stok produk
            for (const item of keranjang) {
                if (item.jenis === 'penjualan' && item.id && !item.id.startsWith('manual_')) {
                    const produkRef = database.ref(`products/${item.id}`);
                    const snapshot = await produkRef.once('value');
                    const produk = snapshot.val();
                    
                    if (produk) {
                        const newStok = Math.max(0, (produk.stok || 0) - item.qty);
                        await produkRef.update({
                            stok: newStok,
                            terjual: (produk.terjual || 0) + item.qty
                        });
                        
                        // Update UI
                        if (currentView === 'grid' && typeof ProdukGrid !== 'undefined') {
                            ProdukGrid.updateCard(item.id, newStok);
                        } else if (currentView === 'list' && typeof ProdukList !== 'undefined') {
                            ProdukList.updateRow(item.id, newStok);
                        }
                    }
                }
            }
            
            // Update daily data
            await updateDailyData(session.uid, keranjang, total);
            
            // Jika hutang, catat
            if (metode === 'hutang') {
                await catatHutang(transaksiData);
            }
        }
        
        // Reset
        window.Keranjang.clear();
        window.Keranjang.clearDraft();
        
        const jumlahBayarInput = document.getElementById('jumlah-bayar');
        if (jumlahBayarInput) jumlahBayarInput.value = '';
        
        showToast(`Transaksi ${kodeTransaksi} berhasil`, 'success');
        
        // Reload produk
        setTimeout(loadProduk, 500);
        
    } catch (error) {
        console.error('Error proses pembayaran:', error);
        showToast('Gagal memproses pembayaran: ' + error.message, 'error');
    } finally {
        if (btnBayar) {
            btnBayar.disabled = false;
            btnBayar.innerHTML = '<i class="fas fa-check-circle"></i> Proses Pembayaran';
        }
    }
}

/**
 * Update data harian
 */
async function updateDailyData(uid, items, total) {
    if (typeof database === 'undefined') return;
    
    const today = getToday();
    const dailyRef = database.ref(`daily_data/${uid}/${today}`);
    
    const snapshot = await dailyRef.once('value');
    const current = snapshot.val() || {};
    
    let penjualan = 0, topup = 0, tarik = 0, laba = 0;
    
    items.forEach(item => {
        if (item.jenis === 'penjualan') {
            penjualan += item.subtotal;
            laba += ((item.harga_jual - (item.harga_modal || 0)) * item.qty);
        } else if (item.jenis === 'topup') {
            topup += item.subtotal;
        } else if (item.jenis === 'tarik') {
            tarik += item.nominal || item.subtotal;
        }
    });
    
    await dailyRef.update({
        total_penjualan: (current.total_penjualan || 0) + penjualan,
        total_topup: (current.total_topup || 0) + topup,
        total_tarik: (current.total_tarik || 0) + tarik,
        laba: (current.laba || 0) + laba,
        total_transaksi: (current.total_transaksi || 0) + 1,
        last_update: firebase.database.ServerValue?.TIMESTAMP || Date.now()
    });
}

/**
 * Catat hutang
 */
async function catatHutang(transaksi) {
    if (!transaksi.pelanggan_id || typeof database === 'undefined') return;
    
    const hutangRef = database.ref(`hutang/${transaksi.pelanggan_id}`).push();
    
    await hutangRef.set({
        transaksi_id: transaksi.kode,
        tanggal: transaksi.tanggal,
        jumlah: transaksi.total,
        sisa: transaksi.total,
        status: 'belum_lunas',
        items: transaksi.items,
        created_at: firebase.database.ServerValue?.TIMESTAMP || Date.now()
    });
    
    // Update total hutang pelanggan
    const pelangganRef = database.ref(`pelanggan/${transaksi.pelanggan_id}`);
    const snapshot = await pelangganRef.once('value');
    const pelanggan = snapshot.val() || {};
    
    await pelangganRef.update({
        total_hutang: (pelanggan.total_hutang || 0) + transaksi.total
    });
}

/**
 * Load data pelanggan
 */
async function loadPelanggan() {
    try {
        if (typeof database === 'undefined') return;
        
        const snapshot = await database.ref('pelanggan').orderByChild('nama').once('value');
        const select = document.getElementById('select-pelanggan');
        if (!select) return;
        
        pelangganData = [];
        select.innerHTML = '<option value="">Pilih Pelanggan</option>';
        
        snapshot.forEach(child => {
            const pelanggan = child.val();
            pelangganData.push({ id: child.key, ...pelanggan });
            
            const option = document.createElement('option');
            option.value = child.key;
            option.textContent = `${pelanggan.nama} ${pelanggan.telepon ? '(' + pelanggan.telepon + ')' : ''}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading pelanggan:', error);
    }
}

/**
 * Load kategori
 */
async function loadKategori() {
    try {
        if (typeof database === 'undefined') return;
        
        const snapshot = await database.ref('kategori').orderByChild('nama').once('value');
        const select = document.getElementById('filter-kategori');
        if (!select) return;
        
        // Simpan opsi pertama (Semua Kategori)
        const firstOption = select.options[0];
        select.innerHTML = '';
        select.appendChild(firstOption);
        
        snapshot.forEach(child => {
            const kategori = child.val();
            const option = document.createElement('option');
            option.value = child.key;
            option.textContent = kategori.nama;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading kategori:', error);
    }
}

/**
 * Cek status kasir
 */
async function checkKasirStatus() {
    try {
        const session = JSON.parse(localStorage.getItem('webpos_session') || sessionStorage.getItem('webpos_session') || '{}');
        if (!session || session.role !== 'kasir' || typeof database === 'undefined') return;
        
        const today = getToday();
        const snapshot = await database.ref(`daily_data/${session.uid}/${today}`).once('value');
        const data = snapshot.val();
        
        if (!data || data.status === 'closed') {
            await database.ref(`daily_data/${session.uid}/${today}`).update({
                status: 'open',
                opened_at: firebase.database.ServerValue?.TIMESTAMP || Date.now()
            });
            showToast('Kasir berhasil dibuka', 'success');
        }
    } catch (error) {
        console.error('Error checking kasir status:', error);
    }
}

/**
 * Update datetime display
 */
function updateDateTime() {
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('current-date');
    
    const now = new Date();
    
    if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
    
    if (dateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = now.toLocaleDateString('id-ID', options);
    }
}

/**
 * Modal functions
 */
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

/**
 * Helper functions
 */
function getToday() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function generateKodeTransaksi() {
    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TRX${date}${random}`;
}

function formatRupiah(angka) {
    if (typeof angka !== 'number') angka = parseInt(angka) || 0;
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseRupiah(str) {
    if (!str) return 0;
    return parseInt(str.toString().replace(/[^0-9]/g, '')) || 0;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#6366f1'};
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Export fungsi ke global scope
window.currentView = currentView;
window.currentJenis = currentJenis;
window.produkData = produkData;
window.toggleView = toggleView;
window.switchJenisTransaksi = switchJenisTransaksi;
window.loadProduk = loadProduk;
window.openModal = openModal;
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;
window.formatRupiah = formatRupiah;
window.parseRupiah = parseRupiah;
window.showToast = showToast;
window.getToday = getToday;
window.generateKodeTransaksi = generateKodeTransaksi;
window.hitungKembalian = hitungKembalian;
window.cleanItemsForFirebase = cleanItemsForFirebase;

console.log('Kasir Main Module Loaded');
