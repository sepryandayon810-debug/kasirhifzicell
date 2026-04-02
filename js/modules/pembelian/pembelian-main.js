/**
 * Pembelian Main Controller
 */

let pembelianKeranjang = [];
let pembelianData = [];
let selectedProduk = null;

document.addEventListener('DOMContentLoaded', function() {
    initPembelian();
});

function initPembelian() {
    // Load suppliers
    loadSuppliers();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load riwayat
    loadRiwayatPembelian();
    
    // Update datetime
    setInterval(updateDateTime, 1000);
    updateDateTime();
    
    // Update counters
    updateCounters();
}

function setupEventListeners() {
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
        });
    }
    
    // Search produk
    const searchInput = document.getElementById('cari-produk-pembelian');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(cariProdukPembelian, 300));
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.length >= 2) {
                document.getElementById('search-results').classList.add('active');
            }
        });
    }
    
    // Click outside to close search results
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box-pembelian')) {
            document.getElementById('search-results')?.classList.remove('active');
        }
    });
    
    // Tambah item
    const btnTambah = document.getElementById('btn-tambah-item');
    if (btnTambah) {
        btnTambah.addEventListener('click', tambahKeKeranjang);
    }
    
    // Metode pembayaran change
    const metodeSelect = document.getElementById('metode-pembayaran');
    if (metodeSelect) {
        metodeSelect.addEventListener('change', function() {
            const jatuhTempoGroup = document.getElementById('jatuh-tempo-group');
            if (this.value === 'hutang') {
                jatuhTempoGroup.style.display = 'block';
                // Set default jatuh tempo 30 hari dari sekarang
                const date = new Date();
                date.setDate(date.getDate() + 30);
                document.getElementById('jatuh-tempo').value = date.toISOString().split('T')[0];
            } else {
                jatuhTempoGroup.style.display = 'none';
            }
        });
    }
    
    // Simpan pembelian
    const btnSimpan = document.getElementById('btn-simpan-pembelian');
    if (btnSimpan) {
        btnSimpan.addEventListener('click', simpanPembelian);
    }
    
    // Tambah supplier
    const btnTambahSupplier = document.getElementById('btn-tambah-supplier');
    if (btnTambahSupplier) {
        btnTambahSupplier.addEventListener('click', () => {
            openModal('modal-supplier');
        });
    }
    
    // Filter tanggal
    const btnFilter = document.getElementById('btn-filter');
    if (btnFilter) {
        btnFilter.addEventListener('click', loadRiwayatPembelian);
    }
    
    // Diskon dan pajak
    const diskonInput = document.getElementById('diskon-pembelian');
    const pajakInput = document.getElementById('pajak-pembelian');
    
    if (diskonInput) {
        diskonInput.addEventListener('input', hitungTotalPembelian);
    }
    if (pajakInput) {
        pajakInput.addEventListener('input', hitungTotalPembelian);
    }
}

async function cariProdukPembelian() {
    const query = document.getElementById('cari-produk-pembelian').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('search-results');
    
    if (query.length < 2) {
        resultsContainer.classList.remove('active');
        return;
    }
    
    try {
        // Cari di produkData (sudah load saat init)
        const snapshot = await database.ref('products')
            .orderByChild('nama')
            .startAt(query)
            .endAt(query + '\uf8ff')
            .limitToFirst(10)
            .once('value');
        
        const results = [];
        snapshot.forEach(child => {
            const produk = child.val();
            results.push({
                id: child.key,
                ...produk
            });
        });
        
        // Also search by kode
        const snapshotKode = await database.ref('products')
            .orderByChild('kode')
            .startAt(query.toUpperCase())
            .endAt(query.toUpperCase() + '\uf8ff')
            .limitToFirst(5)
            .once('value');
        
        snapshotKode.forEach(child => {
            const produk = child.val();
            const exists = results.find(r => r.id === child.key);
            if (!exists) {
                results.push({
                    id: child.key,
                    ...produk
                });
            }
        });
        
        renderSearchResults(results);
        
    } catch (error) {
        console.error('Error cari produk:', error);
    }
}

function renderSearchResults(results) {
    const container = document.getElementById('search-results');
    
    if (results.length === 0) {
        container.innerHTML = '<div class="search-result-item">Tidak ada produk ditemukan</div>';
    } else {
        container.innerHTML = results.map(p => `
            <div class="search-result-item" onclick="pilihProduk('${p.id}')">
                <div class="nama">${p.nama}</div>
                <div class="info">${p.kode} | Stok: ${p.stok || 0} | ${formatRupiah(p.harga_modal || 0)}</div>
            </div>
        `).join('');
    }
    
    container.classList.add('active');
}

function pilihProduk(produkId) {
    database.ref(`products/${produkId}`).once('value').then(snapshot => {
        const produk = snapshot.val();
        if (produk) {
            selectedProduk = {
                id: produkId,
                ...produk
            };
            
            // Isi harga beli dengan harga modal
            document.getElementById('harga-beli-input').value = produk.harga_modal || 0;
            document.getElementById('cari-produk-pembelian').value = produk.nama;
            document.getElementById('search-results').classList.remove('active');
            
            // Focus ke jumlah
            document.getElementById('jumlah-input').focus();
            document.getElementById('jumlah-input').select();
        }
    });
}

function tambahKeKeranjang() {
    if (!selectedProduk) {
        alert('Pilih produk terlebih dahulu');
        return;
    }
    
    const hargaBeli = parseInt(document.getElementById('harga-beli-input').value) || 0;
    const jumlah = parseInt(document.getElementById('jumlah-input').value) || 1;
    
    if (hargaBeli <= 0) {
        alert('Harga beli harus lebih dari 0');
        return;
    }
    
    // Cek apakah produk sudah ada di keranjang
    const existingIndex = pembelianKeranjang.findIndex(item => item.id === selectedProduk.id);
    
    if (existingIndex >= 0) {
        // Update existing
        pembelianKeranjang[existingIndex].jumlah += jumlah;
        pembelianKeranjang[existingIndex].harga_beli = hargaBeli;
    } else {
        // Add new
        pembelianKeranjang.push({
            id: selectedProduk.id,
            nama: selectedProduk.nama,
            kode: selectedProduk.kode,
            harga_beli: hargaBeli,
            jumlah: jumlah,
            satuan: selectedProduk.satuan || 'pcs'
        });
    }
    
    // Reset input
    selectedProduk = null;
    document.getElementById('cari-produk-pembelian').value = '';
    document.getElementById('harga-beli-input').value = '';
    document.getElementById('jumlah-input').value = '1';
    document.getElementById('cari-produk-pembelian').focus();
    
    // Render keranjang
    renderKeranjang();
    hitungTotalPembelian();
}

function renderKeranjang() {
    const container = document.getElementById('keranjang-list');
    
    if (pembelianKeranjang.length === 0) {
        container.innerHTML = `
            <div class="keranjang-empty">
                <i class="fas fa-shopping-basket"></i>
                <p>Keranjang masih kosong</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = pembelianKeranjang.map((item, index) => `
        <div class="keranjang-item">
            <div class="item-info">
                <div class="item-nama">${item.nama}</div>
                <div class="item-harga">${formatRupiah(item.harga_beli)} / ${item.satuan}</div>
            </div>
            <div class="item-qty">
                <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                <span class="qty-value">${item.jumlah}</span>
                <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
            </div>
            <div class="item-subtotal">${formatRupiah(item.harga_beli * item.jumlah)}</div>
            <button class="btn-remove" onclick="hapusDariKeranjang(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function updateQty(index, change) {
    const newQty = pembelianKeranjang[index].jumlah + change;
    
    if (newQty <= 0) {
        hapusDariKeranjang(index);
        return;
    }
    
    pembelianKeranjang[index].jumlah = newQty;
    renderKeranjang();
    hitungTotalPembelian();
}

function hapusDariKeranjang(index) {
    pembelianKeranjang.splice(index, 1);
    renderKeranjang();
    hitungTotalPembelian();
}

function hitungTotalPembelian() {
    const subtotal = pembelianKeranjang.reduce((sum, item) => sum + (item.harga_beli * item.jumlah), 0);
    const diskon = parseInt(document.getElementById('diskon-pembelian')?.value) || 0;
    const pajakPersen = parseInt(document.getElementById('pajak-pembelian')?.value) || 0;
    
    const setelahDiskon = subtotal - diskon;
    const pajak = Math.round(setelahDiskon * (pajakPersen / 100));
    const total = setelahDiskon + pajak;
    
    document.getElementById('subtotal-pembelian').textContent = formatRupiah(subtotal);
    document.getElementById('total-pembelian').textContent = formatRupiah(total);
    
    return total;
}

async function simpanPembelian() {
    if (pembelianKeranjang.length === 0) {
        alert('Keranjang masih kosong');
        return;
    }
    
    const supplierId = document.getElementById('select-supplier').value;
    if (!supplierId) {
        alert('Pilih supplier terlebih dahulu');
        return;
    }
    
    const metode = document.getElementById('metode-pembayaran').value;
    const total = hitungTotalPembelian();
    
    const btnSimpan = document.getElementById('btn-simpan-pembelian');
    btnSimpan.disabled = true;
    btnSimpan.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    
    try {
        // Generate kode pembelian
        const today = new Date();
        const kodePrefix = 'BL' + today.getFullYear().toString().slice(-2) + 
                          String(today.getMonth() + 1).padStart(2, '0') + 
                          String(today.getDate()).padStart(2, '0');
        
        // Get last number
        const lastSnapshot = await database.ref('pembelian')
            .orderByKey()
            .limitToLast(1)
            .once('value');
        
        let lastNumber = 0;
        lastSnapshot.forEach(child => {
            const kode = child.val().kode || '';
            const match = kode.match(/-(\d+)$/);
            if (match) {
                lastNumber = parseInt(match[1]);
            }
        });
        
        const kodePembelian = `${kodePrefix}-${String(lastNumber + 1).padStart(4, '0')}`;
        
        // Data pembelian
        const pembelianData = {
            kode: kodePembelian,
            supplier_id: supplierId,
            items: {},
            subtotal: parseInt(document.getElementById('subtotal-pembelian').textContent.replace(/\D/g, '')),
            diskon: parseInt(document.getElementById('diskon-pembelian').value) || 0,
            pajak_persen: parseInt(document.getElementById('pajak-pembelian').value) || 0,
            total: total,
            metode_pembayaran: metode,
            status: metode === 'hutang' ? 'hutang' : 'lunas',
            catatan: document.getElementById('catatan-pembelian').value,
            created_at: firebase.database.ServerValue.TIMESTAMP,
            created_by: auth.currentUser?.uid || 'unknown'
        };
        
        if (metode === 'hutang') {
            pembelianData.jatuh_tempo = document.getElementById('jatuh-tempo').value;
        }
        
        // Add items
        pembelianKeranjang.forEach(item => {
            pembelianData.items[item.id] = {
                nama: item.nama,
                kode: item.kode,
                harga_beli: item.harga_beli,
                jumlah: item.jumlah,
                satuan: item.satuan,
                subtotal: item.harga_beli * item.jumlah
            };
        });
        
        // Save pembelian
        const pembelianRef = database.ref('pembelian').push();
        await pembelianRef.set(pembelianData);
        
        // Update stok produk dan harga modal
        const updates = {};
        pembelianKeranjang.forEach(item => {
            // Update stok
            updates[`products/${item.id}/stok`] = firebase.database.ServerValue.increment(item.jumlah);
            // Update harga modal (rata-rata bergerak bisa ditambahkan di sini)
            updates[`products/${item.id}/harga_modal`] = item.harga_beli;
            updates[`products/${item.id}/updated_at`] = firebase.database.ServerValue.TIMESTAMP;
        });
        
        await database.ref().update(updates);
        
        // Jika hutang, catat di hutang
        if (metode === 'hutang') {
            const hutangData = {
                tipe: 'hutang',
                pembelian_id: pembelianRef.key,
                supplier_id: supplierId,
                jumlah: total,
                jumlah_bayar: 0,
                sisa: total,
                jatuh_tempo: document.getElementById('jatuh-tempo').value,
                status: 'belum_lunas',
                created_at: firebase.database.ServerValue.TIMESTAMP
            };
            await database.ref('hutang_piutang').push(hutangData);
        }
        
        // Catat di kas jika tunai/transfer
        if (metode !== 'hutang') {
            const kasData = {
                tipe: 'keluar',
                kategori: 'pembelian',
                jumlah: total,
                keterangan: `Pembelian: ${kodePembelian}`,
                referensi_id: pembelianRef.key,
                created_at: firebase.database.ServerValue.TIMESTAMP,
                created_by: auth.currentUser?.uid || 'unknown'
            };
            await database.ref('kas').push(kasData);
        }
        
        showToast('Pembelian berhasil disimpan', 'success');
        
        // Reset form
        resetPembelianForm();
        
        // Refresh riwayat
        loadRiwayatPembelian();
        updateCounters();
        
    } catch (error) {
        console.error('Error simpan pembelian:', error);
        alert('Gagal menyimpan pembelian: ' + error.message);
    } finally {
        btnSimpan.disabled = false;
        btnSimpan.innerHTML = '<i class="fas fa-save"></i> Simpan Pembelian';
    }
}

function resetPembelianForm() {
    pembelianKeranjang = [];
    selectedProduk = null;
    
    document.getElementById('select-supplier').value = '';
    document.getElementById('cari-produk-pembelian').value = '';
    document.getElementById('harga-beli-input').value = '';
    document.getElementById('jumlah-input').value = '1';
    document.getElementById('diskon-pembelian').value = '0';
    document.getElementById('pajak-pembelian').value = '0';
    document.getElementById('catatan-pembelian').value = '';
    document.getElementById('metode-pembayaran').value = 'tunai';
    document.getElementById('jatuh-tempo-group').style.display = 'none';
    
    renderKeranjang();
    hitungTotalPembelian();
}

function updateDateTime() {
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('current-date');
    const now = new Date();
    
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    if (dateEl) dateEl.textContent = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

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

// Modal functions
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

// Export globals
window.pembelianKeranjang = pembelianKeranjang;
window.selectedProduk = selectedProduk;
window.cariProdukPembelian = cariProdukPembelian;
window.pilihProduk = pilihProduk;
window.tambahKeKeranjang = tambahKeKeranjang;
window.updateQty = updateQty;
window.hapusDariKeranjang = hapusDariKeranjang;
window.simpanPembelian = simpanPembelian;
window.openModal = openModal;
window.closeModal = closeModal;
window.resetPembelianForm = resetPembelianForm;
