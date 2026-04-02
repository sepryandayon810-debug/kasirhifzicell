let pelangganData = [];

document.addEventListener('DOMContentLoaded', function() {
    initPelanggan();
});

function initPelanggan() {
    setupEventListeners();
    loadPelanggan();
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

function setupEventListeners() {
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('collapsed'));
    document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('active'));
    document.getElementById('btn-tambah')?.addEventListener('click', () => bukaModal());
    document.getElementById('btn-simpan')?.addEventListener('click', simpanPelanggan);
    document.getElementById('search-pelanggan')?.addEventListener('input', filterPelanggan);
}

async function loadPelanggan() {
    try {
        const snapshot = await database.ref('pelanggan').once('value');
        pelangganData = [];
        
        snapshot.forEach(child => {
            pelangganData.push({ id: child.key, ...child.val() });
        });

        document.getElementById('total-pelanggan').textContent = pelangganData.length;
        renderPelanggan(pelangganData);
    } catch (error) {
        console.error('Error loading pelanggan:', error);
    }
}

function renderPelanggan(data) {
    const tbody = document.getElementById('pelanggan-list');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data pelanggan</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(p => `
        <tr>
            <td><strong>${p.nama}</strong></td>
            <td>${p.telepon || '-'}</td>
            <td>${p.email || '-'}</td>
            <td>${p.alamat || '-'}</td>
            <td>${p.total_transaksi || 0}</td>
            <td>${formatRupiah(p.total_belanja || 0)}</td>
            <td>
                <button class="btn-action btn-edit" onclick="editPelanggan('${p.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-action btn-delete" onclick="hapusPelanggan('${p.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function filterPelanggan() {
    const search = document.getElementById('search-pelanggan').value.toLowerCase();
    const filtered = pelangganData.filter(p => 
        (p.nama || '').toLowerCase().includes(search) ||
        (p.telepon || '').includes(search) ||
        (p.email || '').toLowerCase().includes(search)
    );
    renderPelanggan(filtered);
}

function bukaModal(id = null) {
    document.getElementById('pelanggan-id').value = id || '';
    document.getElementById('modal-title').innerHTML = id ? '<i class="fas fa-edit"></i> Edit Pelanggan' : '<i class="fas fa-user-plus"></i> Tambah Pelanggan';
    
    if (id) {
        const p = pelangganData.find(x => x.id === id);
        document.getElementById('pelanggan-nama').value = p.nama || '';
        document.getElementById('pelanggan-telepon').value = p.telepon || '';
        document.getElementById('pelanggan-email').value = p.email || '';
        document.getElementById('pelanggan-alamat').value = p.alamat || '';
    } else {
        document.getElementById('pelanggan-nama').value = '';
        document.getElementById('pelanggan-telepon').value = '';
        document.getElementById('pelanggan-email').value = '';
        document.getElementById('pelanggan-alamat').value = '';
    }
    
    openModal('modal-pelanggan');
}

async function simpanPelanggan() {
    const id = document.getElementById('pelanggan-id').value;
    const data = {
        nama: document.getElementById('pelanggan-nama').value.trim(),
        telepon: document.getElementById('pelanggan-telepon').value.trim(),
        email: document.getElementById('pelanggan-email').value.trim(),
        alamat: document.getElementById('pelanggan-alamat').value.trim(),
        updated_at: firebase.database.ServerValue.TIMESTAMP
    };

    if (!data.nama) {
        alert('Nama pelanggan wajib diisi');
        return;
    }

    try {
        if (id) {
            await database.ref(`pelanggan/${id}`).update(data);
            showToast('Pelanggan berhasil diupdate', 'success');
        } else {
            data.created_at = firebase.database.ServerValue.TIMESTAMP;
            await database.ref('pelanggan').push(data);
            showToast('Pelanggan berhasil ditambahkan', 'success');
        }
        closeModal('modal-pelanggan');
        loadPelanggan();
    } catch (error) {
        console.error('Error saving pelanggan:', error);
        alert('Gagal menyimpan data');
    }
}

function editPelanggan(id) {
    bukaModal(id);
}

async function hapusPelanggan(id) {
    if (!confirm('Yakin ingin menghapus pelanggan ini?')) return;
    
    try {
        await database.ref(`pelanggan/${id}`).remove();
        showToast('Pelanggan berhasil dihapus', 'success');
        loadPelanggan();
    } catch (error) {
        console.error('Error deleting pelanggan:', error);
        alert('Gagal menghapus data');
    }
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function updateDateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('current-date').textContent = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

window.bukaModal = bukaModal;
window.closeModal = closeModal;
window.openModal = openModal;
window.editPelanggan = editPelanggan;
window.hapusPelanggan = hapusPelanggan;
