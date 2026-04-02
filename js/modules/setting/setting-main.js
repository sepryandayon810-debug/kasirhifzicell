document.addEventListener('DOMContentLoaded', function() {
    initSetting();
});

function initSetting() {
    loadSettings();
    setupEventListeners();
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

function setupEventListeners() {
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('collapsed'));
    document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('active'));
    document.getElementById('btn-simpan-setting')?.addEventListener('click', simpanSetting);
    document.getElementById('btn-reset-setting')?.addEventListener('click', resetSetting);
    document.getElementById('theme-select')?.addEventListener('change', (e) => {
        document.documentElement.setAttribute('data-theme', e.target.value);
    });
}

async function loadSettings() {
    try {
        const snapshot = await database.ref('settings/toko').once('value');
        const settings = snapshot.val() || {};
        
        document.getElementById('toko-nama').value = settings.nama || '';
        document.getElementById('toko-alamat').value = settings.alamat || '';
        document.getElementById('toko-telepon').value = settings.telepon || '';
        document.getElementById('toko-email').value = settings.email || '';
        document.getElementById('struk-header').value = settings.struk_header || '';
        document.getElementById('struk-footer').value = settings.struk_footer || '';
        document.getElementById('struk-logo').checked = settings.struk_logo || false;
        document.getElementById('pajak-default').value = settings.pajak_default || 0;
        document.getElementById('pajak-aktif').checked = settings.pajak_aktif || false;
        
        const theme = settings.theme || 'dark';
        document.getElementById('theme-select').value = theme;
        document.documentElement.setAttribute('data-theme', theme);
        
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function simpanSetting() {
    const settings = {
        nama: document.getElementById('toko-nama').value.trim(),
        alamat: document.getElementById('toko-alamat').value.trim(),
        telepon: document.getElementById('toko-telepon').value.trim(),
        email: document.getElementById('toko-email').value.trim(),
        struk_header: document.getElementById('struk-header').value.trim(),
        struk_footer: document.getElementById('struk-footer').value.trim(),
        struk_logo: document.getElementById('struk-logo').checked,
        pajak_default: parseFloat(document.getElementById('pajak-default').value) || 0,
        pajak_aktif: document.getElementById('pajak-aktif').checked,
        theme: document.getElementById('theme-select').value,
        updated_at: firebase.database.ServerValue.TIMESTAMP
    };

    try {
        await database.ref('settings/toko').set(settings);
        showToast('Pengaturan berhasil disimpan', 'success');
        
        // Update sidebar
        document.getElementById('nama-toko').textContent = settings.nama || 'WebPOS';
        document.getElementById('alamat-toko').textContent = settings.alamat || 'Sistem POS';
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Gagal menyimpan pengaturan');
    }
}

function resetSetting() {
    if (confirm('Reset semua pengaturan ke default?')) {
        document.getElementById('toko-nama').value = 'WebPOS';
        document.getElementById('toko-alamat').value = '';
        document.getElementById('toko-telepon').value = '';
        document.getElementById('toko-email').value = '';
        document.getElementById('struk-header').value = 'Terima kasih telah berbelanja';
        document.getElementById('struk-footer').value = 'Barang yang sudah dibeli tidak dapat dikembalikan';
        document.getElementById('struk-logo').checked = true;
        document.getElementById('pajak-default').value = 0;
        document.getElementById('pajak-aktif').checked = false;
        document.getElementById('theme-select').value = 'dark';
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

function updateDateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('current-date').textContent = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

window.simpanSetting = simpanSetting;
window.resetSetting = resetSetting;
