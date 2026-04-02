let resetType = null;

document.addEventListener('DOMContentLoaded', function() {
    initReset();
});

function initReset() {
    setupEventListeners();
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

function setupEventListeners() {
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('collapsed'));
    document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('active'));
    document.getElementById('btn-confirm-reset')?.addEventListener('click', executeReset);
    document.getElementById('btn-backup')?.addEventListener('click', backupData);
}

function confirmReset(type) {
    resetType = type;
    document.getElementById('reset-target').textContent = type === 'all' ? 'SEMUA DATA' : type.toUpperCase();
    document.getElementById('confirm-password').value = '';
    openModal('modal-confirm');
}

async function executeReset() {
    const password = document.getElementById('confirm-password').value;
    
    if (password !== 'RESET123') {
        alert('Password konfirmasi salah! (Hint: RESET123)');
        return;
    }

    try {
        showToast('Menghapus data...', 'warning');
        
        switch(resetType) {
            case 'transaksi':
                await database.ref('transaksi').remove();
                await database.ref('kas').remove();
                await database.ref('modal_harian').remove();
                break;
            case 'produk':
                await database.ref('products').remove();
                await database.ref('categories').remove();
                break;
            case 'pelanggan':
                await database.ref('pelanggan').remove();
                break;
            case 'all':
                await database.ref('transaksi').remove();
                await database.ref('products').remove();
                await database.ref('categories').remove();
                await database.ref('pelanggan').remove();
                await database.ref('kas').remove();
                await database.ref('modal_harian').remove();
                await database.ref('hutang').remove();
                await database.ref('piutang').remove();
                await database.ref('pembelian').remove();
                break;
        }
        
        showToast('Data berhasil direset!', 'success');
        closeModal('modal-confirm');
        
    } catch (error) {
        console.error('Error resetting data:', error);
        alert('Gagal mereset data: ' + error.message);
    }
}

async function backupData() {
    try {
        const data = {};
        
        const transaksi = await database.ref('transaksi').once('value');
        const produk = await database.ref('products').once('value');
        const pelanggan = await database.ref('pelanggan').once('value');
        const kas = await database.ref('kas').once('value');
        
        data.transaksi = transaksi.val() || {};
        data.products = produk.val() || {};
        data.pelanggan = pelanggan.val() || {};
        data.kas = kas.val() || {};
        data.backup_date = new Date().toISOString();
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_webpos_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('Backup berhasil diunduh', 'success');
    } catch (error) {
        console.error('Error backup:', error);
        alert('Gagal membuat backup');
    }
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function updateDateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('current-date').textContent = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

window.confirmReset = confirmReset;
window.closeModal = closeModal;
window.openModal = openModal;
