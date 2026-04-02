document.addEventListener('DOMContentLoaded', function() {
    initTelegram();
});

function initTelegram() {
    loadConfig();
    setupEventListeners();
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

function setupEventListeners() {
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('collapsed'));
    document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('active'));
    document.getElementById('btn-simpan-config')?.addEventListener('click', simpanConfig);
    document.getElementById('btn-test')?.addEventListener('click', testKirim);
}

async function loadConfig() {
    try {
        const snapshot = await database.ref('settings/telegram').once('value');
        const config = snapshot.val();
        if (config) {
            document.getElementById('bot-token').value = config.bot_token || '';
            document.getElementById('chat-id').value = config.chat_id || '';
            document.getElementById('notif-penjualan').checked = config.notif_penjualan || false;
            document.getElementById('notif-stok').checked = config.notif_stok || false;
            document.getElementById('notif-harian').checked = config.notif_harian || false;
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

async function simpanConfig() {
    const config = {
        bot_token: document.getElementById('bot-token').value.trim(),
        chat_id: document.getElementById('chat-id').value.trim(),
        notif_penjualan: document.getElementById('notif-penjualan').checked,
        notif_stok: document.getElementById('notif-stok').checked,
        notif_harian: document.getElementById('notif-harian').checked,
        updated_at: firebase.database.ServerValue.TIMESTAMP
    };

    try {
        await database.ref('settings/telegram').set(config);
        showToast('Konfigurasi berhasil disimpan', 'success');
    } catch (error) {
        console.error('Error saving config:', error);
        alert('Gagal menyimpan konfigurasi');
    }
}

async function testKirim() {
    const token = document.getElementById('bot-token').value.trim();
    const chatId = document.getElementById('chat-id').value.trim();
    
    if (!token || !chatId) {
        alert('Isi Bot Token dan Chat ID terlebih dahulu');
        return;
    }

    const message = '📱 *Test WebPOS*\n\nKoneksi Telegram berhasil!\nWaktu: ' + new Date().toLocaleString('id-ID');
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        
        const result = await response.json();
        if (result.ok) {
            showToast('Test message terkirim!', 'success');
            tambahRiwayat('Test', 'Test koneksi berhasil', 'success');
        } else {
            throw new Error(result.description);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Gagal mengirim: ' + error.message);
        tambahRiwayat('Test', error.message, 'failed');
    }
}

function tambahRiwayat(tipe, pesan, status) {
    const tbody = document.getElementById('notif-list');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${new Date().toLocaleTimeString('id-ID')}</td>
        <td>${tipe}</td>
        <td>${pesan}</td>
        <td class="status-${status}">${status === 'success' ? '✓ Terkirim' : '✗ Gagal'}</td>
    `;
    
    if (tbody.children[0]?.textContent === 'Belum ada riwayat') {
        tbody.innerHTML = '';
    }
    tbody.insertBefore(row, tbody.firstChild);
}

function updateDateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('current-date').textContent = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

window.simpanConfig = simpanConfig;
window.testKirim = testKirim;
