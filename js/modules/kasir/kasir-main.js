/**
 * Kasir Main Controller - FIXED VERSION
 * File: js/modules/kasir/kasir-main.js
 */

// State global
let currentView = 'grid';
let currentJenis = 'penjualan';
let produkData = [];
let pelangganData = [];

// Inisialisasi saat DOM ready
document.addEventListener('DOMContentLoaded', function() {
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

function initKasir() {
    loadProduk();
    loadPelanggan();
    loadKategori();
    setupEventListeners();
    setupKeyboardShortcuts();
    setInterval(updateDateTime, 1000);
    updateDateTime();
    checkKasirStatus();
}

function setupEventListeners() {
    // Toggle view
    document.querySelectorAll('.view-btn-modern').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const view = this.getAttribute('data-view');
            toggleView(view);
        });
    });
    
    // Jenis transaksi - FIX: prevent default untuk mobile
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const jenis = this.getAttribute('data-jenis');
            switchJenisTransaksi(jenis);
        });
    });
    
    // Tombol manual - FIX: tambah touch event untuk mobile
    const btnManual = document.getElementById('btn-transaksi-manual');
    if (btnManual) {
        // Click untuk desktop
        btnManual.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openModal('modal-transaksi-manual');
        });
        
        // Touch untuk mobile
        btnManual.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openModal('modal-transaksi-manual');
        });
    }
    
    // Quick amount buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const amount = this.getAttribute('data-amount');
            const input = document.getElementById('jumlah-bayar');
            if (amount) {
                input.value = amount;
            } else if (this.classList.contains('uang-pas')) {
                const totalText = document.getElementById('total-bayar')?.textContent || '0';
                const total = parseRupiah(totalText);
                input.value = total;
            }
            hitungKembalian();
        });
    });
    
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
        btnBayar.addEventListener('click', function(e) {
            e.preventDefault();
            prosesPembayaran();
        });
    }
    
    // Search input
    const searchInput = document.getElementById('search-produk');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const activeChip = document.querySelector('.kategori-chip.active');
            const kategori = activeChip ? activeChip.dataset.kategori : '';
            filterProduk(kategori);
        });
    }
    
    // Mobile cart button
    const btnCartMobile = document.getElementById('btn-cart-mobile');
    if (btnCartMobile) {
        btnCartMobile.addEventListener('click', function(e) {
            e.preventDefault();
            toggleKeranjangMobile();
        });
    }
    
    // Close keranjang mobile saat klik outside
    document.addEventListener('click', function(e) {
        const keranjang = document.getElementById('keranjang-section');
        const btnCart = document.getElementById('btn-cart-mobile');
        
        if (keranjang && keranjang.classList.contains('open')) {
            if (!keranjang.contains(e.target) && !btnCart.contains(e.target)) {
                keranjang.classList.remove('open');
            }
        }
    });
}
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('search-produk');
            if (searchInput) searchInput.focus();
        }
        
        if (e.key === 'F2') {
            e.preventDefault();
            const jumlahBayar = document.getElementById('jumlah-bayar');
            if (jumlahBayar) jumlahBayar.focus();
        }
        
        if (e.key === 'F4') {
            e.preventDefault();
            openModal('modal-transaksi-manual');
        }
        
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

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
        
        // PERBAIKAN: Load dari cache dulu untuk tampilkan sementara
        const cached = localStorage.getItem('produk_data_cache');
        if (cached) {
            try {
                const cachedData = JSON.parse(cached);
                if (cachedData && cachedData.length > 0) {
                    console.log('[Kasir] Loading from cache:', cachedData.length, 'produk');
                    produkData = cachedData;
                    renderProduk(produkData);
                    
                    // Clear loading setelah render cache
                    if (container) {
                        container.innerHTML = '';
                    }
                }
            } catch (e) {
                console.error('[Kasir] Error parsing cache:', e);
            }
        }
        
        // Load fresh data dari Firebase
        const snapshot = await database.ref('produk').orderByChild('status').equalTo('aktif').once('value');
        const freshData = [];
        
        snapshot.forEach(child => {
            freshData.push({
                id: child.key,
                ...child.val()
            });
        });
        
        // Update cache dan render ulang jika ada perubahan
        if (freshData.length > 0) {
            produkData = freshData;
            localStorage.setItem('produk_data_cache', JSON.stringify(freshData));
            localStorage.setItem('produk_last_update', Date.now());
            console.log('[Kasir] Fresh data loaded:', freshData.length, 'produk');
            renderProduk(produkData);
        } else if (!cached) {
            // Jika tidak ada cache dan tidak ada data
            if (container) {
                container.innerHTML = `
                    <div class="loading-produk" style="grid-column: 1/-1;">
                        <i class="fas fa-box-open" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                        <p>Belum ada produk</p>
                    </div>
                `;
            }
        }
        
    } catch (error) {
        console.error('Error loading produk:', error);
        
        // Fallback ke cache jika error
        const cached = localStorage.getItem('produk_data_cache');
        if (cached) {
            try {
                produkData = JSON.parse(cached);
                renderProduk(produkData);
                showToast('Menggunakan data cache', 'warning');
                return;
            } catch (e) {
                console.error('Error parsing cache:', e);
            }
        }
        
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
// FIX: Render produk dengan class modern
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
    
    // Set class modern
    container.className = `produk-container-modern ${currentView}-view`;
    
    // Gunakan module yang sudah ada (ProdukGrid & ProdukList)
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

// FIX: Toggle view dengan selector modern
function toggleView(view) {
    currentView = view;
    
    document.querySelectorAll('.view-btn-modern').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`.view-btn-modern[data-view="${view}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    const searchTerm = document.getElementById('search-produk')?.value.toLowerCase() || '';
    let filtered = [...produkData];
    
    if (searchTerm) {
        filtered = produkData.filter(p => 
            p.nama.toLowerCase().includes(searchTerm) ||
            (p.kode && p.kode.toLowerCase().includes(searchTerm))
        );
    }
    
    const activeChip = document.querySelector('.kategori-chip.active');
    const kategori = activeChip ? activeChip.dataset.kategori : '';
    
    if (kategori) {
        filtered = filtered.filter(p => p.kategori === kategori);
    }
    
    renderProduk(filtered);
}

function switchJenisTransaksi(jenis) {
    currentJenis = jenis;
    
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`.type-btn[data-jenis="${jenis}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    if (jenis === 'topup') {
        openModal('modal-topup');
    } else if (jenis === 'tarik') {
        openModal('modal-tarik');
    }
}

function handleMetodeChange() {
    const metode = document.getElementById('metode-pembayaran')?.value;
    const groupPelanggan = document.getElementById('group-pelanggan');
    const groupBayar = document.getElementById('group-bayar');
    const groupKembalian = document.getElementById('group-kembalian');
    
    if (groupPelanggan) {
        groupPelanggan.style.display = metode === 'hutang' ? 'block' : 'none';
    }
    if (groupBayar) {
        groupBayar.style.display = metode === 'hutang' ? 'none' : 'block';
    }
    if (groupKembalian) {
        groupKembalian.style.display = metode === 'hutang' ? 'none' : 'block';
    }
}

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

async function loadKategori() {
    try {
        if (typeof database === 'undefined') return;
        
        const snapshot = await database.ref('kategori').orderByChild('nama').once('value');
        const scrollContainer = document.getElementById('kategori-scroll');
        if (!scrollContainer) return;
        
        const semuaBtn = scrollContainer.querySelector('.kategori-chip');
        if (!semuaBtn) return;
        
        const newSemuaBtn = semuaBtn.cloneNode(true);
        scrollContainer.innerHTML = '';
        scrollContainer.appendChild(newSemuaBtn);
        
        newSemuaBtn.addEventListener('click', function() {
            document.querySelectorAll('.kategori-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            filterProduk('');
        });
        
        snapshot.forEach(child => {
            const kategori = child.val();
            const btn = document.createElement('button');
            btn.className = 'kategori-chip';
            btn.dataset.kategori = child.key;
            btn.innerHTML = `<span>${kategori.nama}</span>`;
            scrollContainer.appendChild(btn);
        });
        
        // Event delegation
        scrollContainer.addEventListener('click', function(e) {
            const chip = e.target.closest('.kategori-chip');
            if (!chip) return;
            
            document.querySelectorAll('.kategori-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            
            filterProduk(chip.dataset.kategori);
        });
        
    } catch (error) {
        console.error('Error loading kategori:', error);
    }
}

function filterProduk(kategori) {
    const searchTerm = document.getElementById('search-produk')?.value.toLowerCase() || '';
    let filtered = [...produkData];
    
    if (kategori) {
        filtered = filtered.filter(p => p.kategori === kategori);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.nama?.toLowerCase().includes(searchTerm) ||
            (p.kode && p.kode.toLowerCase().includes(searchTerm))
        );
    }
    
    renderProduk(filtered);
}

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
        
        if (item.gambar && item.gambar !== undefined && item.gambar !== null) {
            cleanItem.gambar = item.gambar;
        }
        
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

async function prosesPembayaran() {
    const keranjang = window.Keranjang ? window.Keranjang.getItems() : [];
    
    if (keranjang.length === 0) {
        showToast('Keranjang masih kosong', 'warning');
        return;
    }

    const total = keranjang.reduce((sum, item) => sum + item.subtotal, 0);
    const metode = document.getElementById('metode-pembayaran')?.value || 'tunai';
    const bayar = parseRupiah(document.getElementById('jumlah-bayar')?.value) || 0;
    
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
    
    const btnBayar = document.getElementById('btn-bayar');
    if (btnBayar) {
        btnBayar.disabled = true;
        btnBayar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    }
    
    try {
        let session = null;
        const sessionData = localStorage.getItem('webpos_session') || sessionStorage.getItem('webpos_session');
        if (sessionData) {
            try {
                session = JSON.parse(sessionData);
            } catch (e) {
                console.error('Error parsing session:', e);
            }
        }
        
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
        const cleanItems = cleanItemsForFirebase(keranjang);
        
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
        
        if (typeof database !== 'undefined') {
            await database.ref(`transaksi/${today}/${kodeTransaksi}`).set(transaksiData);
            
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
                    }
                }
            }
            
            await updateDailyData(session.uid, keranjang, total);
            
            if (metode === 'hutang') {
                await catatHutang(transaksiData);
            }
        }
        
        window.Keranjang.clear();
        window.Keranjang.clearDraft();
        
        const jumlahBayarInput = document.getElementById('jumlah-bayar');
        if (jumlahBayarInput) jumlahBayarInput.value = '';
        
        showToast(`Transaksi ${kodeTransaksi} berhasil`, 'success');
        setTimeout(loadProduk, 500);
        
    } catch (error) {
        console.error('Error proses pembayaran:', error);
        showToast('Gagal memproses pembayaran: ' + error.message, 'error');
    } finally {
        if (btnBayar) {
            btnBayar.disabled = false;
            btnBayar.innerHTML = '<i class="fas fa-check-circle"></i> Bayar Sekarang';
        }
    }
}

async function updateDailyData(uid, items, total) {
    if (typeof database === 'undefined') return;
    
    const today = getToday();
    const dailyRef = database.ref(`daily_data/${uid}/${today}`);
    const snapshot = await dailyRef.once('value');
    const current = snapshot.val() || {};
    
    let penjualanProduk = 0;
    let topup = 0;
    let tarikTunai = 0;
    let laba = 0;
    let uangMasuk = 0;
    let uangKeluar = 0;
    
    items.forEach(item => {
        if (item.jenis === 'penjualan') {
            const itemLaba = (item.harga_jual - (item.harga_modal || 0)) * item.qty;
            penjualanProduk += item.subtotal;
            laba += itemLaba;
            uangMasuk += item.subtotal;
        } else if (item.jenis === 'topup') {
            const nominal = item.nominal || 0;
            const fee = item.fee || 0;
            const totalTopup = item.subtotal || (nominal + fee);
            topup += totalTopup;
            uangMasuk += totalTopup;
            laba += fee;
        } else if (item.jenis === 'tarik') {
            const nominal = item.nominal || 0;
            const fee = item.fee || 0;
            tarikTunai += nominal;
            uangKeluar += nominal;
            uangMasuk += fee;
            laba += fee;
        } else if (item.jenis === 'manual') {
            const itemLaba = (item.harga_jual - (item.harga_modal || 0)) * item.qty;
            penjualanProduk += item.subtotal;
            laba += itemLaba;
            uangMasuk += item.subtotal;
        }
    });
    
    await dailyRef.update({
        penjualan_produk: (current.penjualan_produk || 0) + penjualanProduk,
        laba: (current.laba || 0) + laba,
        total_transaksi: (current.total_transaksi || 0) + 1,
        modal_awal: current.modal_awal || 0,
        uang_masuk: (current.uang_masuk || 0) + uangMasuk,
        uang_keluar: (current.uang_keluar || 0) + uangKeluar,
        topup: (current.topup || 0) + topup,
        tarik_tunai: (current.tarik_tunai || 0) + tarikTunai,
        hutang_masuk: current.hutang_masuk || 0,
        last_update: firebase.database.ServerValue?.TIMESTAMP || Date.now()
    });
}

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
    
    const pelangganRef = database.ref(`pelanggan/${transaksi.pelanggan_id}`);
    const snapshot = await pelangganRef.once('value');
    const pelanggan = snapshot.val() || {};
    
    await pelangganRef.update({
        total_hutang: (pelanggan.total_hutang || 0) + transaksi.total
    });
}

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

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));
}

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

// Global exports
window.currentView = currentView;
window.currentJenis = currentJenis;
window.produkData = produkData;
window.toggleView = toggleView;
window.switchJenisTransaksi = switchJenisTransaksi;
window.loadProduk = loadProduk;
window.loadKategori = loadKategori;
window.filterProduk = filterProduk;
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
