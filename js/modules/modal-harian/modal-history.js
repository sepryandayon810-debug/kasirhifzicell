document.addEventListener('DOMContentLoaded', function() {
    loadModalHistory();
    loadRingkasanModal();
});

async function loadModalHistory() {
    const tbody = document.getElementById('modal-history-list');
    tbody.innerHTML = '<tr class="loading-row"><td colspan="5" class="text-center"><div class="spinner"></div></td></tr>';

    try {
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const snapshot = await database.ref('modal_harian')
            .orderByChild('tanggal')
            .startAt(sevenDaysAgo)
            .once('value');

        const data = [];
        snapshot.forEach(child => {
            data.push({ id: child.key, ...child.val() });
        });

        data.sort((a, b) => b.tanggal - a.tanggal);

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada data modal</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(m => {
            const tanggal = new Date(m.tanggal).toLocaleDateString('id-ID');
            const statusClass = m.status === 'aktif' ? 'status-aktif' : 'status-closed';
            return `
                <tr>
                    <td>${tanggal}</td>
                    <td><strong>${formatRupiah(m.jumlah)}</strong></td>
                    <td>${m.catatan || '-'}</td>
                    <td>${m.created_by || '-'}</td>
                    <td><span class="status-badge ${statusClass}">${(m.status || 'aktif').toUpperCase()}</span></td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading history:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Gagal memuat data</td></tr>';
    }
}

async function loadRingkasanModal() {
    try {
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const snapshot = await database.ref('modal_harian')
            .orderByChild('tanggal')
            .startAt(sevenDaysAgo)
            .once('value');

        const modals = [];
        snapshot.forEach(child => {
            modals.push(child.val().jumlah || 0);
        });

        if (modals.length > 0) {
            const total = modals.reduce((a, b) => a + b, 0);
            const rata = total / modals.length;
            const max = Math.max(...modals);
            const min = Math.min(...modals);

            document.getElementById('total-modal-minggu').textContent = formatRupiah(total);
            document.getElementById('rata-modal').textContent = formatRupiah(rata);
            document.getElementById('modal-tertinggi').textContent = formatRupiah(max);
            document.getElementById('modal-terendah').textContent = formatRupiah(min);
        }
    } catch (error) {
        console.error('Error loading ringkasan:', error);
    }
}

window.loadModalHistory = loadModalHistory;
window.loadRingkasanModal = loadRingkasanModal;
