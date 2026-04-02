/**
 * Detail Pembelian Module
 */

let currentPembelianId = null;

async function lihatDetailPembelian(pembelianId) {
    try {
        currentPembelianId = pembelianId;
        
        const snapshot = await database.ref(`pembelian/${pembelianId}`).once('value');
        const pembelian = snapshot.val();
        
        if (!pembelian) {
            alert('Data pembelian tidak ditemukan');
            return;
        }
        
        // Render info
        const tanggal = new Date(pembelian.created_at).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        document.getElementById('detail-info').innerHTML = `
            <div class="detail-info-item">
                <label>Kode Pembelian</label>
                <value>${pembelian.kode}</value>
            </div>
            <div class="detail-info-item">
                <label>Tanggal</label>
                <value>${tanggal}</value>
            </div>
            <div class="detail-info-item">
                <label>Supplier</label>
                <value>${getSupplierName(pembelian.supplier_id)}</value>
            </div>
            <div class="detail-info-item">
                <label>Metode Pembayaran</label>
                <value>${pembelian.metode_pembayaran?.toUpperCase() || 'TUNAI'}</value>
            </div>
            <div class="detail-info-item">
                <label>Status</label>
                <value style="color: ${pembelian.status === 'lunas' ? 'var(--success-color)' : 
                              pembelian.status === 'hutang' ? 'var(--warning-color)' : 'var(--danger-color)'}">
                    ${pembelian.status?.toUpperCase() || 'LUNAS'}
                </value>
            </div>
            <div class="detail-info-item">
                <label>Operator</label>
                <value>${pembelian.created_by || '-'}</value>
            </div>
        `;
        
        // Render items
        const items = pembelian.items || {};
        const itemsArray = Object.entries(items).map(([key, value]) => ({
            id: key,
            ...value
        }));
        
        document.getElementById('detail-items-body').innerHTML = itemsArray.map(item => `
            <tr>
                <td>
                    <strong>${item.nama}</strong><br>
                    <small style="color: var(--text-secondary);">${item.kode}</small>
                </td>
                <td class="text-right">${formatRupiah(item.harga_beli)}</td>
                <td class="text-right">${item.jumlah} ${item.satuan}</td>
                <td class="text-right">${formatRupiah(item.subtotal)}</td>
            </tr>
        `).join('') + `
            <tr style="background-color: var(--bg-dark); font-weight: 600;">
                <td colspan="3" class="text-right">Subtotal</td>
                <td class="text-right">${formatRupiah(pembelian.subtotal)}</td>
            </tr>
            ${pembelian.diskon > 0 ? `
            <tr>
                <td colspan="3" class="text-right">Diskon</td>
                <td class="text-right">-${formatRupiah(pembelian.diskon)}</td>
            </tr>
            ` : ''}
            ${pembelian.pajak_persen > 0 ? `
            <tr>
                <td colspan="3" class="text-right">Pajak (${pembelian.pajak_persen}%)</td>
                <td class="text-right">${formatRupiah(Math.round((pembelian.subtotal - pembelian.diskon) * (pembelian.pajak_persen / 100)))}</td>
            </tr>
            ` : ''}
            <tr style="background-color: var(--primary-color); color: white; font-weight: 700; font-size: var(--font-large);">
                <td colspan="3" class="text-right">TOTAL</td>
                <td class="text-right">${formatRupiah(pembelian.total)}</td>
            </tr>
        `;
        
        // Show/hide batalkan button
        const btnBatalkan = document.getElementById('btn-batalkan');
        if (pembelian.status === 'dibatalkan') {
            btnBatalkan.style.display = 'none';
        } else {
            btnBatalkan.style.display = 'inline-flex';
        }
        
        openModal('modal-detail');
        
    } catch (error) {
        console.error('Error loading detail:', error);
        alert('Gagal memuat detail pembelian');
    }
}

async function batalkanPembelian() {
    if (!currentPembelianId) return;
    
    if (!confirm('Yakin ingin membatalkan pembelian ini? Stok produk akan dikurangi kembali.')) {
        return;
    }
    
    try {
        const snapshot = await database.ref(`pembelian/${currentPembelianId}`).once('value');
        const pembelian = snapshot.val();
        
        if (!pembelian || pembelian.status === 'dibatalkan') {
            alert('Pembelian sudah dibatalkan sebelumnya');
            return;
        }
        
        // Update status pembelian
        await database.ref(`pembelian/${currentPembelianId}`).update({
            status: 'dibatalkan',
            cancelled_at: firebase.database.ServerValue.TIMESTAMP,
            cancelled_by: auth.currentUser?.uid || 'unknown'
        });
        
        // Kembalikan stok produk
        const updates = {};
        const items = pembelian.items || {};
        
        Object.entries(items).forEach(([produkId, item]) => {
            updates[`products/${produkId}/stok`] = firebase.database.ServerValue.increment(-item.jumlah);
            updates[`products/${produkId}/updated_at`] = firebase.database.ServerValue.TIMESTAMP;
        });
        
        await database.ref().update(updates);
        
        // Jika ada hutang, batalkan juga
        if (pembelian.status === 'hutang') {
            const hutangSnapshot = await database.ref('hutang_piutang')
                .orderByChild('pembelian_id')
                .equalTo(currentPembelianId)
                .once('value');
            
            hutangSnapshot.forEach(child => {
                database.ref(`hutang_piutang/${child.key}`).update({
                    status: 'dibatalkan',
                    cancelled_at: firebase.database.ServerValue.TIMESTAMP
                });
            });
        }
        
        // Jika pembayaran tunai/transfer, kembalikan kas
        if (pembelian.metode_pembayaran !== 'hutang') {
            const kasData = {
                tipe: 'masuk',
                kategori: 'pembelian_dibatalkan',
                jumlah: pembelian.total,
                keterangan: `Pembatalan pembelian: ${pembelian.kode}`,
                referensi_id: currentPembelianId,
                created_at: firebase.database.ServerValue.TIMESTAMP,
                created_by: auth.currentUser?.uid || 'unknown'
            };
            await database.ref('kas').push(kasData);
        }
        
        showToast('Pembelian berhasil dibatalkan', 'success');
        closeModal('modal-detail');
        loadRiwayatPembelian();
        updateCounters();
        
    } catch (error) {
        console.error('Error batalkan pembelian:', error);
        alert('Gagal membatalkan pembelian: ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const btnBatalkan = document.getElementById('btn-batalkan');
    if (btnBatalkan) {
        btnBatalkan.addEventListener('click', batalkanPem
