/**
 * Riwayat Detail Module
 * Transaction detail view functionality
 */

async function lihatDetail(transaksiId) {
    currentDetailId = transaksiId;
    
    try {
        const snapshot = await database.ref(`transaksi/${transaksiId}`).once('value');
        const transaksi = snapshot.val();
        
        if (!transaksi) {
            alert('Data transaksi tidak ditemukan');
            return;
        }
        
        renderDetailHeader(transaksi);
        renderDetailItems(transaksi);
        renderDetailSummary(transaksi);
        
        // Show/hide action buttons based on status
        const btnRefund = document.getElementById('btn-refund');
        const btnCancel = document.getElementById('btn-batalkan-transaksi');
        
        if (transaksi.status === 'sukses') {
            btnRefund.style.display = 'inline-flex';
            btnCancel.style.display = 'inline-flex';
        } else {
            btnRefund.style.display = 'none';
            btnCancel.style.display = 'none';
        }
        
        openModal('modal-detail');
        
    } catch (error) {
        console.error('Error loading detail:', error);
        alert('Gagal memuat detail transaksi');
    }
}

function renderDetailHeader(transaksi) {
    const tanggal = new Date(transaksi.created_at).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const statusColors = {
        sukses: 'var(--success-color)',
        pending: 'var(--warning-color)',
        dibatalkan: 'var(--danger-color)',
        refund: '#6b7280'
    };
    
    document.getElementById('detail-header').innerHTML = `
        <div class="detail-header-item">
            <label>Kode Transaksi</label>
            <value class="kode-transaksi">${transaksi.kode || '-'}</value>
        </div>
        <div class="detail-header-item">
            <label>Tanggal & Waktu</label>
            <value>${tanggal}</value>
        </div>
        <div class="detail-header-item">
            <label>Pelanggan</label>
            <value>${transaksi.pelanggan?.nama || 'Umum'}</value>
            ${transaksi.pelanggan?.telepon ? `<small style="color: var(--text-secondary);">${transaksi.pelanggan.telepon}</small>` : ''}
        </div>
        <div class="detail-header-item">
            <label>Status</label>
            <value class="status-value" style="color: ${statusColors[transaksi.status] || 'var(--text-primary)'}">
                <i class="fas fa-circle" style="font-size: 8px;"></i>
                ${(transaksi.status || 'SUKSES').toUpperCase()}
            </value>
        </div>
        <div class="detail-header-item">
            <label>Metode Pembayaran</label>
            <value>${(transaksi.metode_pembayaran || 'TUNAI').toUpperCase()}</value>
        </div>
        <div class="detail-header-item">
            <label>Operator</label>
            <value>${transaksi.created_by || '-'}</value>
        </div>
        ${transaksi.catatan ? `
        <div class="detail-header-item" style="grid-column: span 2;">
            <label>Catatan</label>
            <value style="font-weight: normal; font-style: italic;">${transaksi.catatan}</value>
        </div>
        ` : ''}
    `;
}

function renderDetailItems(transaksi) {
    const items = Object.entries(transaksi.items || {}).map(([key, item]) => ({
        id: key,
        ...item
    }));
    
    if (items.length === 0) {
        document.getElementById('detail-items-body').innerHTML = `
            <tr>
                <td colspan="5" class="text-center">Tidak ada item</td>
            </tr>
        `;
        return;
    }
    
    document.getElementById('detail-items-body').innerHTML = items.map(item => `
        <tr>
            <td>
                <div class="product-info">
                    <span class="product-name">${item.nama}</span>
                    <span class="product-code">${item.kode || '-'}</span>
                </div>
            </td>
            <td class="text-right">${formatRupiah(item.harga_jual || 0)}</td>
            <td class="text-right">${item.jumlah} ${item.satuan || 'pcs'}</td>
            <td class="text-right">${item.diskon > 0 ? '-' + formatRupiah(item.diskon) : '-'}</td>
            <td class="text-right">${formatRupiah(item.subtotal || 0)}</td>
        </tr>
    `).join('');
}

function renderDetailSummary(transaksi) {
    const subtotal = transaksi.subtotal || 0;
    const diskon = transaksi.diskon || 0;
    const pajakPersen = transaksi.pajak_persen || 0;
    const pajak = transaksi.pajak || 0;
    const total = transaksi.total || 0;
    const bayar = transaksi.bayar || 0;
    const kembalian = transaksi.kembalian || 0;
    
    let html = `
        <div class="summary-row">
            <span>Subtotal</span>
            <span>${formatRupiah(subtotal)}</span>
        </div>
    `;
    
    if (diskon > 0) {
        html += `
            <div class="summary-row discount">
                <span>Diskon</span>
                <span>-${formatRupiah(diskon)}</span>
            </div>
        `;
    }
    
    if (pajak > 0) {
        html += `
            <div class="summary-row">
                <span>Pajak (${pajakPersen}%)</span>
                <span>${formatRupiah(pajak)}</span>
            </div>
        `;
    }
    
    html += `
        <div class="summary-row total">
            <span>TOTAL</span>
            <span>${formatRupiah(total)}</span>
        </div>
    `;
    
    if (transaksi.metode_pembayaran === 'tunai') {
        html += `
            <div class="summary-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border-color);">
                <span>Bayar</span>
                <span>${formatRupiah(bayar)}</span>
            </div>
            <div class="summary-row">
                <span>Kembalian</span>
                <span>${formatRupiah(kembalian)}</span>
            </div>
        `;
    }
    
    document.getElementById('detail-summary').innerHTML = html;
}

async function batalkanTransaksi() {
    if (!currentDetailId) return;
    await batalkanTransaksiById(currentDetailId);
    closeModal('modal-detail');
}

async function batalkanTransaksiById(transaksiId) {
    if (!confirm('Yakin ingin membatalkan transaksi ini?\n\nStok produk akan dikembalikan dan transaksi akan ditandai dibatalkan.')) {
        return;
    }
    
    try {
        const snapshot = await database.ref(`transaksi/${transaksiId}`).once('value');
        const transaksi = snapshot.val();
        
        if (!transaksi) {
            alert('Transaksi tidak ditemukan');
            return;
        }
        
        if (transaksi.status === 'dibatalkan') {
            alert('Transaksi sudah dibatalkan sebelumnya');
            return;
        }
        
        // Update transaksi status
        await database.ref(`transaksi/${transaksiId}`).update({
            status: 'dibatalkan',
            cancelled_at: firebase.database.ServerValue.TIMESTAMP,
            cancelled_by: auth.currentUser?.uid || 'unknown'
        });
        
        // Kembalikan stok produk
        const updates = {};
        const items = transaksi.items || {};
        
        Object.entries(items).forEach(([produkId, item]) => {
            updates[`products/${produkId}/stok`] = firebase.database.ServerValue.increment(item.jumlah || 0);
            updates[`products/${produkId}/updated_at`] = firebase.database.ServerValue.TIMESTAMP;
        });
        
        await database.ref().update(updates);
        
        // Jika ada hutang piutang terkait, update status
        if (transaksi.metode_pembayaran === 'hutang' && transaksi.pelanggan?.id) {
            const hutangSnapshot = await database.ref('hutang_piutang')
                .orderByChild('transaksi_id')
                .equalTo(transaksiId)
                .once('value');
            
            hutangSnapshot.forEach(child => {
                database.ref(`hutang_piutang/${child.key}`).update({
                    status: 'dibatalkan',
                    cancelled_at: firebase.database.ServerValue.TIMESTAMP
                });
            });
        }
        
        // Catat di kas jika perlu (pengembalian uang)
        if (transaksi.metode_pembayaran === 'tunai' && transaksi.total > 0) {
            const kasData = {
                tipe: 'keluar',
                kategori: 'pengembalian',
                jumlah: transaksi.total,
                keterangan: `Pembatalan transaksi: ${transaksi.kode}`,
                referensi_id: transaksiId,
                created_at: firebase.database.ServerValue.TIMESTAMP,
                created_by: auth.currentUser?.uid || 'unknown'
            };
            await database.ref('kas').push(kasData);
        }
        
        showToast('Transaksi berhasil dibatalkan', 'success');
        
        // Refresh data
        loadTransaksi();
        updateHeaderCounters();
        
    } catch (error) {
        console.error('Error membatalkan transaksi:', error);
        alert('Gagal membatalkan transaksi: ' + error.message);
    }
}

window.lihatDetail = lihatDetail;
window.renderDetailHeader = renderDetailHeader;
window.renderDetailItems = renderDetailItems;
window.renderDetailSummary = renderDetailSummary;
window.batalkanTransaksi = batalkanTransaksi;
window.batalkanTransaksiById = batalkanTransaksiById;
