let currentModalId = null;

document.addEventListener('DOMContentLoaded', function() {
    initModalHarian();
});

function initModalHarian() {
    const today = new Date();
    document.getElementById('current-date-display').textContent = today.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    checkExistingModal();
    setupEventListeners();
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

function setupEventListeners() {
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('collapsed'));
    document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('active'));
    document.getElementById('btn-simpan-modal')?.addEventListener('click', simpanModal);
    document.getElementById('btn-reset-modal')?.addEventListener('click', () => {
        document.getElementById('input-modal').value = '';
        document.getElementById('catatan-modal').value = '';
    });
}

async function checkExistingModal() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
        const snapshot = await database.ref('modal_harian')
            .orderByChild('tanggal')
            .startAt(today.getTime())
            .endAt(tomorrow.getTime())
            .once('value');

        if (snapshot.exists()) {
            snapshot.forEach(child => {
                currentModalId = child.key;
                const data = child.val();
                document.getElementById('input-modal').value = data.jumlah || 0;
                document.getElementById('catatan-modal').value = data.catatan || '';
                document.getElementById('btn-simpan-modal').innerHTML = '<i class="fas fa-edit"></i> Update Modal';
            });
        }
        updateKasDisplay();
    } catch (error) {
        console.error('Error checking modal:', error);
    }
}

async function simpanModal() {
    const jumlah = parseFloat(document.getElementById('input-modal').value) || 0;
    const catatan = document.getElementById('catatan-modal').value.trim();

    if (jumlah <= 0) {
        alert('Masukkan jumlah modal yang valid');
        return;
    }

    try {
        const data = {
            jumlah: jumlah,
            catatan: catatan,
            tanggal: Date.now(),
            created_by: auth.currentUser?.uid || 'unknown',
            created_at: firebase.database.ServerValue.TIMESTAMP,
            status: 'aktif'
        };

        if (currentModalId) {
            await database.ref(`modal_harian/${currentModalId}`).update({
                jumlah: jumlah,
                catatan: catatan,
                updated_at: firebase.database.ServerValue.TIMESTAMP
            });
            showToast('Modal berhasil diupdate', 'success');
        } else {
            const newRef = await database.ref('modal_harian').push(data);
            currentModalId = newRef.key;
            showToast('Modal berhasil disimpan', 'success');
            document.getElementById('btn-simpan-modal').innerHTML = '<i class="fas fa-edit"></i> Update Modal';
        }

        loadModalHistory();
        updateKasDisplay();
    } catch (error) {
        console.error('Error saving modal:', error);
        alert('Gagal menyimpan modal');
    }
}

async function updateKasDisplay() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let modalAwal = 0;
        let totalMasuk = 0;
        let totalKeluar = 0;

        const modalSnapshot = await database.ref('modal_harian')
            .orderByChild('tanggal')
            .startAt(today.getTime())
            .endAt(tomorrow.getTime())
            .once('value');

        modalSnapshot.forEach(child => {
            modalAwal = child.val().jumlah || 0;
        });

        const kasSnapshot = await database.ref('kas')
            .orderByChild('created_at')
            .startAt(today.getTime())
            .endAt(tomorrow.getTime())
            .once('value');

        kasSnapshot.forEach(child => {
            const data = child.val();
            if (data.tipe === 'masuk') totalMasuk += data.jumlah || 0;
            else totalKeluar += data.jumlah || 0;
        });

        const kasSaatIni = modalAwal + totalMasuk - totalKeluar;
        document.getElementById('modal-hari-ini').textContent = formatRupiah(modalAwal);
        document.getElementById('kas-saat-ini').textContent = formatRupiah(kasSaatIni);
    } catch (error) {
        console.error('Error updating kas:', error);
    }
}

function updateDateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('current-date').textContent = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

window.simpanModal = simpanModal;
window.updateKasDisplay = updateKasDisplay;
