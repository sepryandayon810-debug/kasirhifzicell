// Kasir Main Controller

let keranjang = [];
let currentView = 'grid';
let currentJenis = 'penjualan';
let produkData = [];
let pelangganData = [];

document.addEventListener('DOMContentLoaded', function() {
    initKasir();
});

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
}

function setupEventListeners() {
    // Toggle view
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
    document.getElementById('btn-transaksi-manual').addEventListener('click', () => {
        openModal('modal-transaksi-manual');
    });
    
    // Tombol clear keranjang
    document.getElementById('btn-clear-keranjang').addEventListener('click', clearKeranjang);
    
    // Metode pembayaran
    document.getElementById('metode-pembayaran').addEventListener('change', handleMetodeChange);
    
    // Jumlah bayar
    document.getElementById('jumlah-bayar').addEventListener('input', hitungKembalian);
    
    // Tombol bayar
    document.getElementById('btn-bayar').addEventListener('click', prosesPembayaran);
    
    // Toggle sidebar
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
    });
    
    document.getElementById('mobile-menu-toggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl + K untuk search
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            document.getElementById('search-produk').focus();
        }
        
        // F2 untuk fokus ke jumlah bayar
        if (e.key === 'F2') {
            e.preventDefault();
            document.getElementById('jumlah-bayar').focus();
        }
        
        // F4 untuk transaksi manual
        if (e.key === 'F4') {
            e.preventDefault();
            openModal('modal-transaksi-manual');
        }
        
        // Enter untuk bayar (jika di input bayar)
        if (e.key === 'Enter' && document.activeElement.id === 'jumlah-bayar') {
            prosesPembayaran();
        }
        
        // Escape untuk tutup modal
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

async function loadProduk() {
    try {
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
        showToast('Gagal memuat produk', 'danger');
    }
}

function renderProduk(produkList) {
    const container = document.getElementById('produk-container');
    container.innerHTML = '';
    
    if (produkList.length === 0) {
        container.innerHTML = '<div class="loading-produk"><p>Tidak ada produk</p></div>';
        return;
    }
    
    if (currentView === 'grid') {
        renderGridView(produkList, container);
    } else {
        renderListView(produkList, container);
    }
}

function renderGridView(produkList, container) {
    produkList.forEach(produk => {
        const card = createProdukCard(produk);
        container.appendChild(card);
    });
}

function renderListView(produkList, container) {
    container.classList.remove('grid-view');
    container.classList.add('list-view');
    
    produkList.forEach(produk => {
        const item = createProdukListItem(produk);
        container.appendChild(item);
    });
}

function createProdukCard(produk) {
    const card = document.createElement('div');
    card.className = 'produk-card';
    
    if (produk.stok <= 0) {
        card.classList.add('stok-habis');
    } else if (produk.stok <= 5) {
        card.classList.add('stok-menipis');
    }
    
    const imageHtml = produk.gambar 
        ? `<img src="${produk.gambar}" alt="${produk.nama}" class="produk-image">`
        : `<div class="produk-image-placeholder"><i class="fas fa-box"></i></div>`;
    
    const stokClass = produk.stok <= 0 ? 'habis' : (produk.stok <= 5 ? 'menipis' : '');
    const stokText = produk.stok <= 0 ? 'Stok Habis' : `Stok: ${produk.stok}`;
    
    card.innerHTML = `
        ${imageHtml}
        <div class="produk-info">
            <div class="produk-nama">${produk.nama}</div>
            <div class="produk-harga">${formatRupiah(produk.harga_jual)}</div>
            <div class="produk-stok ${stokClass}">${stokText}</div>
        </div>
    `;
    
    card.addEventListener('click', () => tambahKeKeranjang(produk));
    
    return card;
}

function createProdukListItem(produk) {
    const item = document.createElement('div');
    item.className = 'produk-list-item';
    
    if (produk.stok <= 0) {
        item.style.opacity = '0.5';
    }
    
    const imageHtml = produk.gambar 
        ? `<img src="${produk.gambar}" alt="${produk.nama}">`
        : `<div style="width:60px;height:60px;background:var(--bg-dark);border-radius:8px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-box"></i></div>`;
    
    item.innerHTML = `
        ${imageHtml}
        <div class="produk-list-info">
            <h4>${produk.nama}</h4>
            <p>${produk.kategori || 'Umum'}</p>
        </div>
        <div class="produk-list-harga">
            <div class="harga">${formatRupiah(produk.harga_jual)}</div>
            <div class="stok">Stok: ${produk.stok}</div>
        </div>
    `;
    
    item.addEventListener('click', () => tambahKeKeranjang(produk));
    
    return item;
}

function toggleView(view) {
    currentView = view;
    
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    const container = document.getElementById('produk-container');
    container.className = 'produk-container';
    
    // Filter produk berdasarkan search saat ini
    const searchTerm = document.getElementById('search-produk').value.toLowerCase();
    let filtered = produkData;
    
    if (searchTerm) {
        filtered = produkData.filter(p => p.nama.toLowerCase().includes(searchTerm));
    }
    
    const kategori = document.getElementById('filter-kategori').value;
    if (kategori) {
        filtered = filtered.filter(p => p.kategori === kategori);
    }
    
    renderProduk(filtered);
}

function switchJenisTransaksi(jenis) {
    currentJenis = jenis;
    
    document.querySelectorAll('.jenis-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-jenis="${jenis}"]`).classList.add('active');
    
    // Sesuaikan UI berdasarkan jenis
    const groupBayar = document.getElementById('group-bayar');
    const groupKembalian = document.getElementById('group-kembalian');
    
    if (jenis === 'topup') {
        openModal('modal-topup');
    } else if (jenis === 'tarik') {
        openModal('modal-tarik');
    } else {
        // Penjualan normal
        groupBayar.style.display = 'block';
        groupKembalian.style.display = 'block';
    }
}

function tambahKeKeranjang(produk, customData = null) {
    // Cek stok
    if (!customData && produk.stok <= 0) {
        showToast('Stok produk habis', 'warning');
        return;
    }
    
    const existingIndex = keranjang.findIndex(item => 
        item.id === produk.id && item.jenis === 'penjualan'
    );
    
    if (existingIndex >= 0) {
        // Update qty jika sudah ada
        if (!customData && keranjang[existingIndex].qty >= produk.stok) {
            showToast('Stok tidak mencukupi', 'warning');
            return;
        }
        keranjang[existingIndex].qty += 1;
        keranjang[existingIndex].subtotal = keranjang[existingIndex].qty * keranjang[existingIndex].harga;
    } else {
        // Tambah item baru
        const item = {
            id: produk.id || Date.now(),
            nama: customData ? customData.nama : produk.nama,
            harga: customData ? customData.harga_jual : produk.harga_jual,
            harga_modal: customData ? customData.harga_modal : (produk.harga_modal || 0),
            qty: customData ? customData.qty : 1,
            jenis: currentJenis,
            subtotal: customData ? (customData.harga_jual * customData.qty) : produk.harga_jual,
            keterangan: customData ? customData.keterangan : '',
            stok_tersedia: produk.stok || 0
        };
        keranjang.push(item);
    }
    
    renderKeranjang();
    showToast('Produk ditambahkan ke keranjang', 'success');
}

function renderKeranjang() {
    const container = document.getElementById('keranjang-items');
    
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

function createKeranjangItem(item, index) {
    const div = document.createElement('div');
    div.className = 'keranjang-item';
    
    const jenisIcon = {
        'penjualan': 'fa-shopping-bag',
        'topup': 'fa-mobile-alt',
        'tarik': 'fa-money-bill-wave'
    };
    
    div.innerHTML = `
        <div class="keranjang-item-header">
            <div class="keranjang-item-nama">
                <i class="fas ${jenisIcon[item.jenis] || 'fa-box'}"></i> ${item.nama}
            </div>
            <div class="keranjang-item-actions">
                <button class="btn-item-action" onclick="editItem(${index})" title="Edit">
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
            <div>${formatRupiah(item.harga)} x ${item.qty}</div>
            <div style="font-weight: 700; color: var(--primary-color);">${formatRupiah(item.subtotal)}</div>
        </div>
    `;
    
    return div;
}

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
}

function editItem(index) {
    const item = keranjang[index];
    
    document.getElementById('edit-index').value = index;
    document.getElementById('edit-harga-baru').value = item.harga;
    document.getElementById('edit-jumlah-baru').value = item.qty;
    
    openModal('modal-edit-harga');
}

function hapusItem(index) {
    if (confirm('Hapus item ini dari keranjang?')) {
        keranjang.splice(index, 1);
        renderKeranjang();
    }
}

function clearKeranjang() {
    if (keranjang.length === 0) return;
    
    if (confirm('Kosongkan keranjang?')) {
        keranjang = [];
        renderKeranjang();
    }
}

function hitungTotal() {
    const subtotal = keranjang.reduce((sum, item) => sum + item.subtotal, 0);
    document.getElementById('subtotal').textContent = formatRupiah(subtotal);
    document.getElementById('total-bayar').textContent = formatRupiah(subtotal);
    
    hitungKembalian();
}

function hitungKembalian() {
    const total = keranjang.reduce((sum, item) => sum + item.subtotal, 0);
    const bayar = parseRupiah(document.getElementById('jumlah-bayar').value) || 0;
    const kembalian = bayar - total;
    
    const kembalianEl = document.getElementById('kembalian');
    kembalianEl.textContent = formatRupiah(Math.abs(kembalian));
    
    if (kembalian < 0) {
        kembalianEl.classList.add('negative');
        kembalianEl.textContent = '-' + kembalianEl.textContent;
    } else {
        kembalianEl.classList.remove('negative');
    }
}

function handleMetodeChange() {
    const metode = document.getElementById('metode-pembayaran').value;
    const groupPelanggan = document.getElementById('group-pelanggan');
    
    if (metode === 'hutang') {
        groupPelanggan.style.display = 'block';
    } else {
        groupPelanggan.style.display = 'none';
    }
}

async function prosesPembayaran() {
    if (keranjang.length === 0) {
        showToast('Keranjang masih kosong', 'warning');
        return;
    }
    
    const total = keranjang.reduce((sum, item) => sum + item.subtotal, 0);
    const metode = document.getElementById('metode-pembayaran').value;
    const bayar = parseRupiah(document.getElementById('jumlah-bayar').value) || 0;
    
    // Validasi
    if (metode === 'tunai' && bayar < total) {
        showToast('Jumlah bayar kurang dari total', 'danger');
        return;
    }
    
    if (metode === 'hutang') {
        const pelanggan = document.getElementById('select-pelanggan').value;
        if (!pelanggan) {
            showToast('Pilih pelanggan untuk transaksi hutang', 'warning');
            return;
        }
    }
    
    try {
        const session = JSON.parse(localStorage.getItem('webpos_session') || sessionStorage.getItem('webpos_session'));
        const today = getToday();
        const kodeTransaksi = generateKodeTransaksi();
        
        // Data transaksi
        const transaksiData = {
            kode: kodeTransaksi,
            tanggal: today,
            waktu: new Date().toISOString(),
            kasir_id: session.uid,
            kasir_nama: session.nama,
            shift: getCurrentShift().id,
            items: keranjang,
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
            if (item.jenis === 'penjualan' && item.id) {
                const produkRef = database.ref(`products/${item.id}`);
                const snapshot = await produkRef.once('value');
                const produk = snapshot.val();
                
                if (produk) {
                    await produkRef.update({
                        stok: Math.max(0, (produk.stok || 0) - item.qty),
                        terjual: (produk.terjual || 0) + item.qty
                    });
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
        document.getElementById('jumlah-bayar').value = '';
        
        showToast(`Transaksi ${kodeTransaksi} berhasil`, 'success');
        
        // Reload produk untuk update stok
        loadProduk();
        
    } catch (error) {
        console.error('Error proses pembayaran:', error);
        showToast('Gagal memproses pembayaran', 'danger');
    }
}

async function updateDailyData(uid, role, items, total) {
    const today = getToday();
    const dailyRef = database.ref(`daily_data/${uid}/${today}`);
    
    const snapshot = await dailyRef.once('value');
    const current = snapshot.val() || {};
    
    let updates = {};
    
    // Hitung berdasarkan jenis item
    let penjualan = 0, topup = 0, tarik = 0, laba = 0;
    
    items.forEach(item => {
        if (item.jenis === 'penjualan') {
            penjualan += item.subtotal;
            laba += (item.harga - item.harga_modal) * item.qty;
        } else if (item.jenis === 'topup') {
            topup += item.subtotal;
        } else if (item.jenis === 'tarik') {
            tarik += item.subtotal;
        }
    });
    
    updates.total_penjualan = (current.total_penjualan || 0) + penjualan;
    updates.total_topup = (current.total_topup || 0) + topup;
    updates.total_tarik = (current.total_tarik || 0) + tarik;
    updates.laba = (current.laba || 0) + laba;
    updates.total_transaksi = (current.total_transaksi || 0) + 1;
    
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
            laba: (sumData.laba || 0) + laba,
            total_transaksi: (sumData.total_transaksi || 0) + 1,
            modal_awal: (sumData.modal_awal || 0) // Ambil dari modal harian
        });
    }
}

async function catatHutang(transaksi) {
    const pelangganId = transaksi.pelanggan_id;
    const hutangRef = database.ref(`hutang/${pelangganId}`).push();
    
    await hutangRef.set({
        transaksi_id: transaksi.kode,
        tanggal: transaksi.tanggal,
        jumlah: transaksi.total,
        sisa: transaksi.total,
        status: 'belum_lunas',
        jatuh_tempo: '', // Bisa diisi nanti
        created_at: firebase.database.ServerValue.TIMESTAMP
    });
}

async function loadPelanggan() {
    try {
        const snapshot = await database.ref('pelanggan').once('value');
        const select = document.getElementById('select-pelanggan');
        select.innerHTML = '<option value="">Pilih Pelanggan</option>';
        
        snapshot.forEach(child => {
            const pelanggan = child.val();
            pelangganData.push({ id: child.key, ...pelanggan });
            
            const option = document.createElement('option');
            option.value = child.key;
            option.textContent = pelanggan.nama;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading pelanggan:', error);
    }
}

async function loadKategori() {
    try {
        const snapshot = await database.ref('kategori').once('value');
        const select = document.getElementById('filter-kategori');
        
        snapshot.forEach(child => {
            const option = document.createElement('option');
            option.value = child.key;
            option.textContent = child.val().nama;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading kategori:', error);
    }
}

async function checkKasirStatus() {
    const session = JSON.parse(localStorage.getItem('webpos_session') || sessionStorage.getItem('webpos_session'));
    if (session.role !== 'kasir') return;
    
    const today = getToday();
    const snapshot = await database.ref(`daily_data/${session.uid}/${today}`).once('value');
    const data = snapshot.val();
    
    if (!data || data.status === 'closed') {
        // Auto buka kasir
        await database.ref(`daily_data/${session.uid}/${today}`).update({
            status: 'open',
            opened_at: firebase.database.ServerValue.TIMESTAMP
        });
        
        showToast('Kasir dibuka', 'success');
    }
}

// Modal functions
function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

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

// Export untuk module lain
window.tambahKeKeranjang = tambahKeKeranjang;
window.updateQty = updateQty;
window.editItem = editItem;
window.hapusItem = hapusItem;
window.openModal = openModal;
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;
window.currentJenis = currentJenis;
window.keranjang = keranjang;
