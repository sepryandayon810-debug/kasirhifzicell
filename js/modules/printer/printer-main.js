document.addEventListener('DOMContentLoaded', function() {
    initPrinter();
});

function initPrinter() {
    loadPrinterSettings();
    setupEventListeners();
    updatePreview();
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

function setupEventListeners() {
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('collapsed'));
    document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('active'));
    document.getElementById('printer-type')?.addEventListener('change', togglePrinterSettings);
    document.getElementById('btn-simpan-printer')?.addEventListener('click', simpanPrinter);
    document.getElementById('btn-test-print')?.addEventListener('click', testPrint);
    document.getElementById('btn-connect-usb')?.addEventListener('click', connectUSB);
}

function togglePrinterSettings() {
    const type = document.getElementById('printer-type').value;
    document.querySelectorAll('.printer-settings').forEach(el => el.style.display = 'none');
    
    if (type === 'usb') document.getElementById('usb-settings').style.display = 'block';
    if (type === 'network') document.getElementById('network-settings').style.display = 'block';
}

async function loadPrinterSettings() {
    try {
        const snapshot = await database.ref('settings/printer').once('value');
        const settings = snapshot.val() || {};
        
        document.getElementById('printer-type').value = settings.type || 'browser';
        document.getElementById('paper-width').value = settings.paper_width || '80';
        document.getElementById('printer-ip').value = settings.ip || '';
        document.getElementById('printer-port').value = settings.port || '9100';
        
        togglePrinterSettings();
    } catch (error) {
        console.error('Error loading printer settings:', error);
    }
}

async function simpanPrinter() {
    const settings = {
        type: document.getElementById('printer-type').value,
        paper_width: document.getElementById('paper-width').value,
        ip: document.getElementById('printer-ip').value,
        port: parseInt(document.getElementById('printer-port').value) || 9100,
        updated_at: firebase.database.ServerValue.TIMESTAMP
    };

    try {
        await database.ref('settings/printer').set(settings);
        showToast('Konfigurasi printer disimpan', 'success');
    } catch (error) {
        console.error('Error saving printer settings:', error);
        alert('Gagal menyimpan konfigurasi');
    }
}

async function connectUSB() {
    try {
        const device = await navigator.usb.requestDevice({ filters: [] });
        showToast(`USB Device connected: ${device.productName}`, 'success');
    } catch (error) {
        console.error('USB Error:', error);
        alert('Gagal connect USB printer');
    }
}

function testPrint() {
    const printContent = document.getElementById('struk-preview').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head><title>Test Print</title>
        <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0 auto; padding: 10px; }
            @media print { body { width: 80mm; } }
        </style>
        </head>
        <body>${printContent}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

async function updatePreview() {
    try {
        const snapshot = await database.ref('settings/toko').once('value');
        const toko = snapshot.val() || {};
        
        document.getElementById('preview-nama-toko').textContent = toko.nama || 'NAMA TOKO';
        document.getElementById('preview-alamat').textContent = toko.alamat || 'Alamat Toko';
        document.getElementById('preview-telepon').textContent = 'Telp: ' + (toko.telepon || '-');
    } catch (error) {
        console.error('Error updating preview:', error);
    }
}

function updateDateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('current-date').textContent = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

window.simpanPrinter = simpanPrinter;
window.testPrint = testPrint;
window.connectUSB = connectUSB;
