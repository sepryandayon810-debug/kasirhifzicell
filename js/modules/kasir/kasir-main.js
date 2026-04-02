/**
 * Kasir Main Controller
 * Controller utama untuk modul kasir
 */

// State global
let keranjang = [];
let currentView = 'grid';
let currentJenis = 'penjualan';
let produkData = [];
let pelangganData = [];

// Inisialisasi saat DOM ready
document.addEventListener('DOMContentLoaded', function() {
    initKasir();
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
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Update datetime
    setInterval(updateDateTime, 1000);
    updateDateTime();
    
    // Cek status kasir
    checkKasirStatus();
    
    // Load draft keranjang jika ada
    setTimeout(loadKeranjangFromStorage, 500);
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
    
    // Tombol clear keranjang
    const btnClear = document.getElementById('btn-clear-keranjang');
    if (btnClear) {
        btnClear.addEventListener('click', clearKeranjang);
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
    
    // Toggle sidebar
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });
    }
    
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
            createOverlay();
        });
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
        
        // Enter untuk bayar (jika di input bayar)
        if (e.key === 'Enter' && document.activeElement?.id === 'jumlah-bayar') {
            prosesPembayaran();
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
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; color: var(--danger-color); margin-bottom: 15px;"></i>
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
    
    // Sesuaikan UI berdasarkan jenis
    const groupBayar = document.getElementById('group-bayar');
    const groupKembalian = document.getElementById('group-kembalian');
    
    if (jenis === 'topup') {
        openModal('modal-topup');
    } else if (jenis === 'tarik') {
        openModal('modal-tarik');
    } else {
        // Penjualan normal
        if (groupBayar) groupBayar.style.display = 'block';
        if (groupKembalian) groupKembalian.style.display = 'block';
    }
}

/**
 * Tambah produk ke keranjang
 * @param {Object} produk 
 * @param {Object} customData 
 */
function tambahKeKeranjang(produk, customData = null) {
    // Cek stok
    if (!customData && produk.stok <= 0) {
        showToast('Stok produk habis', 'warning');
        return;
    }
    
    const existingIndex = keranjang.findIndex(item => 
        item.id === produk.id && item.jenis === currentJenis && !customData
    );
    
    if (existingIndex >= 0 && !customData) {
        // Update qty jika sudah ada
        if (keranjang[existingIndex].qty >= produk.stok) {
            showToast('Stok tidak mencukupi', 'warning');
            return;
        }
        keranjang[existingIndex].qty += 1;
        keranjang[existingIndex].subtotal = keranjang[existingIndex].qty * keranjang[existingIndex].harga;
    } else {
        // Tambah item baru
        const item = {
            id: produk.id || 'manual_' + Date.now(),
            nama: customData ? customData.nama : produk.nama,
            harga: customData ? customData.harga_jual : produk.harga_jual,
            harga_modal: customData ? customData.harga_modal : (produk.harga_modal || 0),
            qty: customData ? customData.qty : 1,
            jenis: currentJenis,
            subtotal: customData ? (customData.harga_jual * customData.qty) : produk.harga_jual,
            keterangan: customData ? customData.keterangan : '',
            stok_tersedia: produk.stok || 0,
            kategori: produk.kategori || ''
        };
        keranjang.push(item);
    }
    
    renderKeranjang();
    saveKeranjangToStorage();
    showToast('Produk ditambahkan ke keranjang', 'success');
}

/**
 * Render keranjang belanja
 */
function renderKeranjang() {
    const container = document.getElementById('keranjang-items');
    if (!container) return;
    
    if (keranjang.length === 0) {
        container.innerHTML = `
            <div class="empty-keranjang">
                <i class="fas fa-cart-plus"></i>
                <p>Keranjang kosong</p>
                <small>Tambahkan produk dari daftar</small>
            </div>
        `;
    } else {
        container.innerHTML = '';
        keranjang.forEach((item, index) => {
            const el = createKeranjangItem(item, index);
            container.appendChild(el);
        });
    }
    
    hitungTotal();
}

/**
 * Buat elemen item keranjang
 * @param {Object} item 
 * @param {Number} index 
 * @returns {HTMLElement}
 */
function createKeranjangItem(item, index) {
    const div = document.createElement('div');
    div.className = 'keranjang-item';
    
    const jenisIcon = {
        'penjualan': 'fa-shopping-bag',
        'topup': 'fa-mobile-alt',
        'tarik': 'fa-money-bill-wave',
        'manual': 'fa-edit'
    };
    
    const jenisLabel = {
        'penjualan': 'Jual',
        'topup': 'Top Up',
        'tarik': 'Tarik',
        'manual': 'Manual'
    };
    
    div.innerHTML = `
        <div class="keranjang-item-header">
            <div class="keranjang-item-nama">
                <i class="fas ${jenisIcon[item.jenis] || 'fa-box'}" title="${jenisLabel[item.jenis] || item.jenis}"></i> 
                ${item.nama}
                ${item.keterangan ? `<small style="display: block; color: var(--text-secondary);">${item.keterangan}</small>` : ''}
            </div>
            <div class="keranjang-item-actions">
                <button class="btn-item-action" onclick="editItem(${index})" title="Edit harga/qty">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-item-action delete" onclick="hapusItem(${index})" title="Hapus">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="keranjang-item-detail">
            <div class="item-qty-control">
                <button class="btn-qty" onclick="updateQty(${index}, -1)">-</button>
                <span class="item-qty">${item.qty}</span>
                <button class="btn-qty" onclick="updateQty(${index}, 1)">+</button>
            </div>
            <div style="color: var(--text-secondary); font-size: var(--font-small);">
                ${formatRupiah(item.harga)} x ${item.qty}
            </div>
            <div style="font-weight: 700; color: var(--primary-color);">
                ${formatRupiah(item.subtotal)}
            </div>
        </div>
    `;
    
    return div;
}

/**
 * Update quantity item
 * @param {Number} index 
 * @param {Number} delta 
 */
function updateQty(index, delta) {
    const item = keranjang[index];
    const newQty = item.qty + delta;
    
    if (newQty <= 0) {
        hapusItem(index);
        return;
    }
    
    // Cek stok untuk penjualan
    if (item.jenis === 'penjualan' && newQty > item.stok_tersedia) {
        showToast('Stok tidak mencukupi', 'warning');
        return;
    }
    
    item.qty = newQty;
    item.subtotal = item.qty * item.harga;
    renderKeranjang();
    saveKeranjangToStorage();
}

/**
 * Edit item keranjang
 * @param {Number} index 
 */
function editItem(index) {
    const item = keranjang[index];
    
    document.getElementById('edit-index').value = index;
    document.getElementById('edit-harga-baru').value = item.harga;
    document.getElementById('edit-jumlah-baru').value = item.qty;
    
    openModal('modal-edit-harga');
}

/**
 * Hapus item dari keranjang
 * @param {Number} index 
 */
function hapusItem(index) {
    if (confirm('Hapus item ini dari keranjang?')) {
        keranjang.splice(index, 1);
        renderKeranjang();
        saveKeranjangToStorage();
    }
}

/**
 * Kosongkan keranjang
 */
function clearKeranjang() {
    if (keranjang.length === 0) return;
    
    if (confirm('Kosongkan semua item di keranjang?')) {
        keranjang = [];
        renderKeranjang();
        saveKeranjangToStorage();
    }
}

/**
 * Hitung total belanja
 */
function hitungTotal() {
    const subtotal = keranjang.reduce((sum, item) => sum + item.subtotal, 0);
    
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total-bayar');
    
    if (subtotalEl) subtotalEl.textContent = formatRupiah(subtotal);
    if (totalEl) totalEl.textContent = formatRupiah(subtotal);
    
    hitungKembalian();
}

/**
 * Hitung kembalian
 */
function hitungKembalian() {
    const total = keranjang.reduce((sum, item) => sum + item.subtotal, 0);
    const bayarInput = document.getElementById('jumlah-bayar');
    const bayar = bayarInput ? (parseRupiah(bayarInput.value) || 0) : 0;
    const kembalian = bayar - total;
    
    const kembalianEl = document.getElementById('kembalian');
    if (!kembalianEl) return;
    
    kembalianEl.textContent = formatRupiah(Math.abs(kembalian));
    
    if (kembalian < 0) {
        kembalianEl.classList.add('negative');
        kembalianEl.textContent = '-' + kembalianEl.textContent;
    } else {
        kembalianEl.classList.remove('negative');
    }
}

/**
 * Handle perubahan metode pembayaran
 */
function handleMetodeChange() {
    const metode = document.getElementById('metode-pembayaran')?.value;
    const groupPelanggan = document.getElementById('group-pelanggan');
    
    if (groupPelanggan) {
        groupPelanggan.style.display = metode === 'hutang' ? 'block' : 'none';
    }
}

/**
 * Proses pembayaran
 */
async function prosesPembayaran() {
    if (keranjang.length === 0) {
        showToast('Keranjang masih kosong', 'warning');
        return;
    }
    
    const total = keranjang.reduce((sum, item) => sum + item.subtotal, 0);
    const metodeSelect = document.getElementById('metode-pembayaran');
    const metode = metodeSelect ? metodeSelect.value : 'tunai';
    const bayar = parseRupiah(document.getElementById('jumlah-bayar')?.value) || 0;
    
    // Validasi
    if (metode === 'tunai' && bayar < total) {
        showToast('Jumlah bayar kurang dari total', 'danger');
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
        const session = JSON.parse(localStorage.getItem('webpos_session') || sessionStorage.getItem('webpos_session'));
        const today = getToday();
        const kodeTransaksi = generateKodeTransaksi('TRX');
        
        // Data transaksi
        const transaksiData = {
            kode: kodeTransaksi,
            tanggal: today,
            waktu: new Date().toISOString(),
            kasir_id: session.uid,
            kasir_nama: session.nama,
            shift: getCurrentShift().id,
            items: keranjang.map(item => ({
                ...item,
                laba: (item.harga - (item.harga_modal || 0)) * item.qty
            })),
            subtotal: total,
            diskon: 0,
            total: total,
            metode_pembayaran: metode,
            bayar: bayar,
            kembalian: metode === 'tunai' ? (bayar - total) : 0,
            pelanggan_id: metode === 'hutang' ? document.getElementById('select-pelanggan').value : null,
            status: 'selesai',
            created_at: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Simpan transaksi
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
                    
                    // Update UI jika produk ditampilkan
                    if (currentView === 'grid' && typeof ProdukGrid !== 'undefined') {
                        ProdukGrid.updateCard(item.id, newStok);
                    } else if (currentView === 'list' && typeof ProdukList !== 'undefined') {
                        ProdukList.updateRow(item.id, newStok);
                    }
                }
            }
        }
        
        // Update daily data
        await updateDailyData(session.uid, session.role, keranjang, total);
        
        // Jika hutang, catat ke hutang piutang
        if (metode === 'hutang') {
            await catatHutang(transaksiData);
        }
        
        // Cetak struk (placeholder)
        console.log('Cetak struk:', kodeTransaksi);
        
        // Reset keranjang
        keranjang = [];
        renderKeranjang();
        clearKeranjangStorage();
        
        const jumlahBayarInput = document.getElementById('jumlah-bayar');
        if (jumlahBayarInput) jumlahBayarInput.value = '';
        
        showToast(`Transaksi ${kodeTransaksi} berhasil`, 'success');
        
        // Reload produk untuk update stok
        setTimeout(loadProduk, 500);
        
    } catch (error) {
        console.error('Error proses pembayaran:', error);
        showToast('Gagal memproses pembayaran: ' + error.message, 'danger');
    } finally {
        // Enable tombol bayar
        if (btnBayar) {
            btnBayar.disabled = false;
            btnBayar.innerHTML = '<i class="fas fa-check-circle"></i> Proses Pembayaran';
        }
    }
}

/**
 * Update data harian
 */
async function updateDailyData(uid, role, items, total) {
    const today = getToday();
    const dailyRef = database.ref(`daily_data/${uid}/${today}`);
    
    const snapshot = await dailyRef.once('value');
    const current = snapshot.val() || {};
    
    let updates = {};
    let penjualan = 0, topup = 0, tarik = 0, laba = 0, topupFee = 0, tarikFee = 0;
    
    items.forEach(item => {
        if (item.jenis === 'penjualan') {
            penjualan += item.subtotal;
            laba += ((item.harga - (item.harga_modal || 0)) * item.qty);
        } else if (item.jenis === 'topup') {
            topup += item.subtotal;
            topupFee += (item.fee || 0);
        } else if (item.jenis === 'tarik') {
            tarik += item.nominal || item.subtotal;
            tarikFee += (item.fee || 0);
        }
    });
    
    updates.total_penjualan = (current.total_penjualan || 0) + penjualan;
    updates.total_topup = (current.total_topup || 0) + topup;
    updates.total_tarik = (current.total_tarik || 0) + tarik;
    updates.topup_fee = (current.topup_fee || 0) + topupFee;
    updates.tarik_fee = (current.tarik_fee || 0) + tarikFee;
    updates.laba = (current.laba || 0) + laba;
    updates.total_transaksi = (current.total_transaksi || 0) + 1;
    updates.last_update = firebase.database.ServerValue.TIMESTAMP;
    
    await dailyRef.update(updates);
    
    // Update summary untuk owner
    if (role === 'kasir') {
        const summaryRef = database.ref(`daily_summary/${today}`);
        const sumSnapshot = await summaryRef.once('value');
        const sumData = sumSnapshot.val() || {};
        
        await summaryRef.update({
            total_penjualan: (sumData.total_penjualan || 0) + penjualan,
            total_topup: (sumData.total_topup || 0) + topup,
            total_tarik: (sumData.total_tarik || 0) + tarik,
            topup_fee: (sumData.topup_fee || 0) + topupFee,
            tarik_fee: (sumData.tarik_fee || 0) + tarikFee,
            laba: (sumData.laba || 0) + laba,
            total_transaksi: (sumData.total_transaksi || 0) + 1,
            last_update: firebase.database.ServerValue.TIMESTAMP
        });
    }
}

/**
 * Catat hutang
 */
async function catatHutang(transaksi) {
    const pelangganId = transaksi.pelanggan_id;
    if (!pelangganId) return;
    
    const hutangRef = database.ref(`hutang/${pelangganId}`).push();
    
    await hutangRef.set({
        transaksi_id: transaksi.kode,
        tanggal: transaksi.tanggal,
        jumlah: transaksi.total,
        sisa: transaksi.total,
        status: 'belum_lunas',
        items: transaksi.items,
        created_at: firebase.database.ServerValue.TIMESTAMP
    });
    
    // Update total hutang pelanggan
    const pelangganRef = database.ref(`pelanggan/${pelangganId}`);
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
    const session = JSON.parse(localStorage.getItem('webpos_session') || sessionStorage.getItem('webpos_session'));
    if (!session || session.role !== 'kasir') return;
    
    const today = getToday();
    const snapshot = await database.ref(`daily_data/${session.uid}/${today}`).once('value');
    const data = snapshot.val();
    
    if (!data || data.status === 'closed') {
        // Auto buka kasir
        await database.ref(`daily_data/${session.uid}/${today}`).update({
            status: 'open',
            opened_at: firebase.database.ServerValue.TIMESTAMP
        });
        
        showToast('Kasir berhasil dibuka', 'success');
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
        dateEl.textContent = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
}

/**
 * Create overlay untuk mobile
 */
function createOverlay() {
    const existing = document.querySelector('.sidebar-overlay');
    if (existing) {
        existing.remove();
        return;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay active';
    overlay.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.remove('active');
        overlay.remove();
    });
    
    document.body.appendChild(overlay);
}

/**
 * Simpan keranjang ke storage (draft)
 */
function saveKeranjangToStorage() {
    if (keranjang.length > 0) {
        localStorage.setItem('keranjang_draft', JSON.stringify({
            items: keranjang,
            timestamp: new Date().toISOString()
        }));
    } else {
        localStorage.removeItem('keranjang_draft');
    }
}

/**
 * Load keranjang dari storage
 */
function loadKeranjangFromStorage() {
    const draft = localStorage.getItem('keranjang_draft');
    if (!draft) return;
    
    try {
        const data = JSON.parse(draft);
        const draftTime = new Date(data.timestamp);
        const now = new Date();
        const diffMinutes = (now - draftTime) / (1000 * 60);
        
        // Hanya recovery jika kurang dari 2 jam
        if (diffMinutes < 120 && confirm('Ada transaksi yang belum selesai. Muat kembali?')) {
            keranjang = data.items || [];
            renderKeranjang();
        } else {
            localStorage.removeItem('keranjang_draft');
        }
    } catch (e) {
        console.error('Error loading draft:', e);
        localStorage.removeItem('keranjang_draft');
    }
}

/**
 * Clear keranjang storage
 */
function clearKeranjangStorage() {
    localStorage.removeItem('keranjang_draft');
}

// Export fungsi ke global scope
window.keranjang = keranjang;
window.currentJenis = currentJenis;
window.tambahKeKeranjang = tambahKeKeranjang;
window.updateQty = updateQty;
window.editItem = editItem;
window.hapusItem = hapusItem;
window.renderKeranjang = renderKeranjang;
window.openModal = openModal;
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;
window.loadProduk = loadProduk;

console.log('Kasir Main Module Loaded');
