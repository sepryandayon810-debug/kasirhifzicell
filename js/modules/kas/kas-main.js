document.addEventListener('DOMContentLoaded', function() {
    initKasManagement();
});

function initKasManagement() {
    document.getElementById('filter-tanggal').value = new Date().toISOString().split('T')[0];
    setupEventListeners();
    loadKasData();
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

function setupEventListeners() {
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('collapsed'));
    document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('active'));
    document.getElementById('btn-simpan-kas')?.addEventListener('click', simpanTransaksiKas);
    document.getElementById('btn-filter')?.addEventListener('click', loadKasData);
    
    document.querySelectorAll('input[name="tipe-kas"]').forEach(radio => {
        radio.addEventListener('change', updateKategoriOptions);
    });
}

function updateKategoriOptions() {
    const tipe = document.querySelector('input[name="tipe-kas"]:checked').value;
    const select = document.getElementById('kategori-kas');
    select.value = '';
    
    const options = select.querySelectorAll('optgroup option');
    options.forEach(opt => {
        if (tipe === 'masuk') {
            opt.style.display = opt.value.includes('masuk') || ['penjualan', 'pelunasan_hutang', 'modal_tambahan'].includes(opt.value) ? 'block' : 'none';
        } else {
            opt.style.display = opt.value.includes('keluar') || ['pembelian', 'operasional', 'gaji', 'pengembalian'].includes(opt.value) ? 'block' : 'none';
        }
    });
}

async function loadKasData() {
    const tanggalFilter = document.getElementById('filter-tanggal').value;
    const tipeFilter = document.getElementById('filter-tipe').value;
    
    try {
        let query = database.ref('kas').orderByChild('created_at');
        
        if (tanggalFilter) {
            const start = new Date(tanggalFilter);
            start.setHours(0, 0, 0, 0);
            const end = new Date(tanggalFilter);
            end.setHours(23, 59, 59, 999);
            query = query.startAt(start.getTime()).endAt(end.getTime());
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            query = query.startAt(today.getTime());
        }

        const snapshot = await query.once('value');
        let totalMasuk = 0, totalKeluar = 0;
        const data = [];

        snapshot.forEach(child => {
            const val = child.val();
            if (!tipeFilter || val.tipe === tipeFilter) {
                data.push({ id: child.key, ...val });
                if (val.tipe === 'masuk') totalMasuk += val.jumlah || 0;
                else totalKeluar += val.jumlah || 0;
            }
        });

        data.sort((a, b) => b.created_at - a.created_at);

        renderKasList(data);
        document.getElementById('total-masuk').textContent = formatRupiah(totalMasuk);
        document.getElementById('total-keluar').textContent = formatRupiah(totalKeluar);
        document.getElementById('saldo-akhir').textContent = formatRupiah(totalMasuk - totalKeluar);
        
        updateSaldoKas();

    } catch (error) {
        console.error('Error loading kas:', error);
    }
}

function renderKasList(data) {
    const tbody = document.getElementById('kas-list');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada data</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(d => {
        const waktu = new Date(d.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const tipeClass = d.tipe === 'masuk' ? 'tipe-masuk' : 'tipe-keluar';
        return `
            <tr>
                <td>${waktu}</td>
                <td><span class="tipe-badge ${tipeClass}">${d.tipe.toUpperCase()}</span></td>
                <td>${d.kategori || '-'}</td>
                <td>${d.keterangan || '-'}</td>
                <td class="${d.tipe === 'masuk' ? 'text-success' : 'text-danger'}"><strong>${formatRupiah(d.jumlah)}</strong></td>
                <td>${d.created_by || '-'}</td>
            </tr>
        `;
    }).join('');
}

async function updateSaldoKas() {
    try {
        const snapshot = await database.ref('kas').once('value');
        let saldo = 0;
        snapshot.forEach(child => {
            const val = child.val();
            saldo += val.tipe === 'masuk' ? (val.jumlah || 0) : -(val.jumlah || 0);
        });
        document.getElementById('saldo-kas').textContent = formatRupiah(saldo);
    } catch (error) {
        console.error('Error updating saldo:', error);
    }
}

function updateDateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('current-date').textContent = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

window.loadKasData = loadKasData;
window.updateSaldoKas = updateSaldoKas;
