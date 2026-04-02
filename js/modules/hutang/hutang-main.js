let currentBayarId = null;
let currentBayarType = null;

document.addEventListener('DOMContentLoaded', function() {
    initHutangPiutang();
});

function initHutangPiutang() {
    setupTabs();
    setupEventListeners();
    loadHutang();
    loadPiutang();
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        });
    });
}

function setupEventListeners() {
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('collapsed'));
    document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('active'));
    document.getElementById('btn-tambah-hutang')?.addEventListener('click', () => openModal('modal-tambah-hutang'));
    document.getElementById('btn-simpan-hutang')?.addEventListener('click', simpanHutangBaru);
    document.getElementById('btn-proses-bayar')?.addEventListener('click', prosesBayar);
}

async function loadHutang() {
    try {
        const snapshot = await database.ref('hutang').orderByChild('created_at').once('value');
        let totalHutang = 0;
        const data = [];
        
        snapshot.forEach(child => {
            const val = child.val();
            const sisa = (val.jumlah || 0) - (val.dibayar || 0);
            if (sisa > 0) totalHutang += sisa;
            data.push({ id: child.key, ...val, sisa });
        });

        document.getElementById('total-hutang').textContent = formatRupiah(totalHutang);
        
        const tbody = document.getElementById('hutang-list');
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">Tidak ada data hutang</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(h => {
            const status = h.sisa <= 0 ? 'lunas' : 'belum';
            const statusClass = `status-${status}`;
            return `
                <tr>
                    <td>${new Date(h.tanggal || h.created_at).toLocaleDateString('id-ID')}</td>
                    <td><strong>${h.supplier || '-'}</strong></td>
                    <td>${h.keterangan || '-'}</td>
                    <td>${formatRupiah(h.jumlah)}</td>
                    <td>${formatRupiah(h.dibayar || 0)}</td>
                    <td><strong>${formatRupiah(h.sisa)}</strong></td>
                    <td><span class="status-badge ${statusClass}">${status.toUpperCase()}</span></td>
                    <td>${h.sisa > 0 ? `<button class="btn-action btn-bayar" onclick="bukaModalBayar('${h.id}', 'hutang')">Bayar</button>` : '-'}</td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading hutang:', error);
    }
}

async function loadPiutang() {
    try {
        const snapshot = await database.ref('piutang').orderByChild('created_at').once('value');
        let totalPiutang = 0;
        const data = [];

        snapshot.forEach(child => {
            const val = child.val();
            const sisa = (val.jumlah || 0) - (val.dibayar || 0);
            if (sisa > 0) totalPiutang += sisa;
            data.push({ id: child.key, ...val, sisa });
        });

        document.getElementById('total-piutang').textContent = formatRupiah(totalPiutang);

        const tbody = document.getElementById('piutang-list');
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">Tidak ada data piutang</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(p => {
            const status = p.sisa <= 0 ? 'lunas' : 'belum';
            const statusClass = `status-${status}`;
            const jatuhTempo = p.jatuh_tempo ? new Date(p.jatuh_tempo).toLocaleDateString('id-ID') : '-';
            return `
                <tr>
                    <td>${new Date(p.tanggal || p.created_at).toLocaleDateString('id-ID')}</td>
                    <td><strong>${p.pelanggan?.nama || 'Umum'}</strong></td>
                    <td>${p.transaksi_kode || '-'}</td>
                    <td>${formatRupiah(p.jumlah)}</td>
                    <td>${formatRupiah(p.dibayar || 0)}</td>
                    <td><strong>${formatRupiah(p.sisa)}</strong></td>
                    <td>${jatuhTempo}</td>
                    <td><span class="status-badge ${statusClass}">${status.toUpperCase()}</span></td>
                    <td>${p.sisa > 0 ? `<button class="btn-action btn-bayar" onclick="bukaModalBayar('${p.id}', 'piutang')">Bayar</button>` : '-'}</td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading piutang:', error);
    }
}

async function simpanHutangBaru() {
    const supplier = document.getElementById('hutang-supplier').value.trim();
    const jumlah = parseFloat(document.getElementById('hutang-jumlah').value) || 0;
    const keterangan = document.getElementById('hutang-keterangan').value.trim();

    if (!supplier || jumlah <= 0) {
        alert('Lengkapi data supplier dan jumlah');
        return;
    }

    try {
        await database.ref('hutang').push({
            supplier: supplier,
            jumlah: jumlah,
            dibayar: 0,
            keterangan: keterangan,
            tanggal: Date.now(),
            created_at: firebase.database.ServerValue.TIMESTAMP,
            created_by: auth.currentUser?.uid || 'unknown'
        });

        showToast('Hutang berhasil ditambahkan', 'success');
        closeModal('modal-tambah-hutang');
        document.getElementById('hutang-supplier').value = '';
        document.getElementById('hutang-jumlah').value = '';
        document.getElementById('hutang-keterangan').value = '';
        loadHutang();
    } catch (error) {
        console.error('Error saving hutang:', error);
        alert('Gagal menyimpan hutang');
    }
}

function bukaModalBayar(id, type) {
    currentBayarId = id;
    currentBayarType = type;
    
    database.ref(`${type}/${id}`).once('value').then(snapshot => {
        const data = snapshot.val();
        const sisa = (data.jumlah || 0) - (data.dibayar || 0);
        
        document.getElementById('bayar-total').textContent = formatRupiah(data.jumlah);
        document.getElementById('bayar-dibayar').textContent = formatRupiah(data.dibayar || 0);
        document.getElementById('bayar-sisa').textContent = formatRupiah(sisa);
        document.getElementById('jumlah-bayar').value = sisa;
        document.getElementById('keterangan-bayar').value = '';
        
        openModal('modal-bayar');
    });
}

async function prosesBayar() {
    const jumlah = parseFloat(document.getElementById('jumlah-bayar').value) || 0;
    const keterangan = document.getElementById('keterangan-bayar').value.trim();

    if (jumlah <= 0 || !currentBayarId) return;

    try {
        const snapshot = await database.ref(`${currentBayarType}/${currentBayarId}`).once('value');
        const data = snapshot.val();
        const sisa = (data.jumlah || 0) - (data.dibayar || 0);
        
        if (jumlah > sisa) {
            alert('Jumlah pembayaran melebihi sisa hutang/piutang');
            return;
        }

        const newDibayar = (data.dibayar || 0) + jumlah;
        
        await database.ref(`${currentBayarType}/${currentBayarId}`).update({
            dibayar: newDibayar,
            status: newDibayar >= data.jumlah ? 'lunas' : 'belum',
            updated_at: firebase.database.ServerValue.TIMESTAMP
        });

        // Catat di kas
        const kasTipe = currentBayarType === 'hutang' ? 'keluar' : 'masuk';
        await database.ref('kas').push({
            tipe: kasTipe,
            kategori: currentBayarType === 'hutang' ? 'pelunasan_hutang' : 'pelunasan_piutang',
            jumlah: jumlah,
            keterangan: `Pelunasan ${currentBayarType}: ${keterangan}`,
            referensi_id: currentBayarId,
            created_at: firebase.database.ServerValue.TIMESTAMP,
            created_by: auth.currentUser?.uid || 'unknown'
        });

        showToast('Pembayaran berhasil diproses', 'success');
        closeModal('modal-bayar');
        
        if (currentBayarType === 'hutang') loadHutang();
        else loadPiutang();
        
    } catch (error) {
        console.error('Error processing payment:', error);
        alert('Gagal memproses pembayaran');
    }
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function updateDateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('current-date').textContent = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

window.bukaModalBayar = bukaModalBayar;
window.closeModal = closeModal;
window.openModal = openModal;
