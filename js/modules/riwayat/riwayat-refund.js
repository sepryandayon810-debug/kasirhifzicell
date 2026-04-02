/**
 * Riwayat Refund Module
 * Partial or full refund functionality
 */

let refundItems = [];
let currentRefundTransaksi = null;

async function showRefundModal() {
    if (!currentDetailId) return;
    
    try {
        const snapshot = await database.ref(`transaksi/${currentDetailId}`).once('value');
        const transaksi = snapshot.val();
        
        if (!transaksi || transaksi.status !== 'sukses') {
            alert('Transaksi tidak dapat direfund');
            return;
        }
        
        currentRefundTransaksi = transaksi;
        refundItems = [];
        
        // Prepare refund items
        const items = Object.entries(transaksi.items || {}).map(([key, item]) => ({
            produk_id: key,
            ...item,
            refund_qty: 0,
            refund_subtotal: 0,
            selected: false
        }));
        
        renderRefundItems(items);
        closeModal('modal-detail');
        openModal('modal-refund');
        
    } catch (error) {
        console.error('Error preparing refund:', error);
        alert('Gagal memuat data refund');
    }
}

function renderRefundItems(items) {
    const container = document.getElementById('refund-items');
    
    if (items.length === 0) {
        container.innerHTML = '<p class="text-center">Tidak ada item</p>';
        return;
    }
    
    container.innerHTML = items.map((item, index) => `
        <div class="refund-item" data-index="${index}">
            <input type="checkbox" id="refund-check-${index}" onchange="toggleRefundItem(${index})">
            <div class="item-info">
                <div class="item-name">${item.nama}</div>
                <div class="item-price">${formatRupiah(item.harga_jual)} / ${item.satuan || 'pcs'}</div>
            </div>
            <div class="item-qty">
                <span>Qty: ${item.jumlah}</span>
                <input type="number" 
                       id="refund-qty-${index}" 
                       class="qty-input form-control" 
                       value="1" 
                       min="1" 
                       max="${item.jumlah}" 
                       disabled
                       onchange="updateRefundQty(${index}, this.value)">
            </div>
            <div class="item-subtotal" id="refund-subtotal-${index}">Rp 0</div>
        </div>
    `).join('');
    
    refundItems = items;
    updateRefundTotal();
}

function toggleRefundItem(index) {
    const checkbox = document.getElementById(`refund-check-${index}`);
    const qtyInput = document.getElementById(`refund-qty-${index}`);
    
    refundItems[index].selected = checkbox.checked;
    qtyInput.disabled = !checkbox.checked;
    
    if (checkbox.checked) {
        refundItems[index].refund_qty = parseInt(qtyInput.value) || 1;
        updateRefundSubtotal(index);
    } else {
        refundItems[index].refund_qty = 0;
        refundItems[index].refund_subtotal = 0;
        document.getElementById(`refund-subtotal-${index}`).textContent = 'Rp 0';
    }
    
    updateRefundTotal();
}

function updateRefundQty(index, value) {
    const qty = parseInt(value) || 0;
    const maxQty = refundItems[index].jumlah;
    
    if (qty > maxQty) {
        alert(`Maksimal refund ${maxQty} item`);
        document.getElementById(`refund-qty-${index}`).value = maxQty;
        refundItems[index].refund_qty = maxQty;
    } else if (qty < 1) {
        document.getElementById(`refund-qty-${index}`).value = 1;
        refundItems[index].refund_qty = 1;
    } else {
        refundItems[index].refund_qty = qty;
    }
    
    updateRefundSubtotal(index);
    updateRefundTotal();
}

function updateRefundSubtotal(index) {
    const item = refundItems[index];
    const subtotal = item.harga_jual * item.refund_qty;
    item.refund_subtotal = subtotal;
    
    document.getElementById(`refund-subtotal-${index}`).textContent = formatRupiah(subtotal);
}

function updateRefundTotal() {
    const total = refundItems
        .filter(item => item.selected)
        .reduce((sum, item) => sum + item.refund_subtotal, 0);
    
    document.getElementById('refund-total-amount').textContent = formatRupiah(total);
}

async function prosesRefund() {
    const selectedItems = refundItems.filter(item => item.selected && item.refund_qty > 0);
    
    if (selectedItems.length === 0) {
        alert('Pilih minimal 1 item untuk direfund');
        return;
    }
    
    const alasan = document.getElementById('refund-alasan').value.trim();
    if (!alasan) {
        alert('Isi alasan refund');
        return;
    }
    
    const totalRefund = selectedItems.reduce((sum, item) => sum + item.refund_subtotal, 0);
    
    if (!confirm(`Proses refund sebesar ${formatRupiah(totalRefund)}?\n\n${selectedItems.length} item akan direfund.`)) {
        return;
    }
    
    try {
        const batch = {};
        const timestamp = firebase.database.ServerValue.TIMESTAMP;
        
        // 1. Create refund record
        const refundData = {
            transaksi_id: currentDetailId,
            transaksi_kode: currentRefundTransaksi.kode,
            items: {},
            total_refund: totalRefund,
            alasan: alasan,
            created_at: timestamp,
            created_by: auth.currentUser?.uid || 'unknown'
        };
        
        selectedItems.forEach(item => {
            refundData.items[item.produk_id] = {
                nama: item.nama,
                kode: item.kode,
                harga_jual: item.harga_jual,
                jumlah_refund: item.refund_qty,
                subtotal: item.refund_subtotal
            };
        });
        
        const refundRef = database.ref('refund').push();
        await refundRef.set(refundData);
        
        // 2. Update original transaction
        const currentItems = { ...currentRefundTransaksi.items };
        
        selectedItems.forEach(item => {
            if (currentItems[item.produk_id]) {
                currentItems[item.produk_id].jumlah -= item.refund_qty;
                currentItems[item.produk_id].subtotal -= item.refund_subtotal;
                
                // Remove item if qty becomes 0
                if (currentItems[item.produk_id].jumlah <= 0) {
                    delete currentItems[item.produk_id];
                }
            }
        });
        
        // Calculate new totals
        const newSubtotal = Object.values(currentItems).reduce((sum, item) => sum + (item.subtotal || 0), 0);
        const newTotal = newSubtotal - (currentRefundTransaksi.diskon || 0) + (currentRefundTransaksi.pajak || 0);
        
        await database.ref(`transaksi/${currentDetailId}`).update({
            items: currentItems,
            subtotal: newSubtotal,
            total: newTotal,
            status: newTotal <= 0 ? 'refund' : 'sukses',
            refund_id: refundRef.key,
            refund_amount: totalRefund,
            updated_at: timestamp
        });
        
        // 3. Return stock
        const updates = {};
        selectedItems.forEach(item => {
            updates[`products/${item.produk_id}/stok`] = firebase.database.ServerValue.increment(item.refund_qty);
            updates[`products/${item.produk_id}/updated_at`] = timestamp;
        });
        
        await database.ref().update(updates);
        
        // 4. Record in kas (pengeluaran)
        const kasData = {
            tipe: 'keluar',
            kategori: 'refund',
            jumlah: totalRefund,
            keterangan: `Refund transaksi: ${currentRefundTransaksi.kode}`,
            referensi_id: refundRef.key,
            created_at: timestamp,
            created_by: auth.currentUser?.uid || 'unknown'
        };
        await database.ref('kas').push(kasData);
        
        showToast('Refund berhasil diproses', 'success');
        closeModal('modal-refund');
        
        // Reset form
        document.getElementById('refund-alasan').value = '';
        
        // Refresh data
        loadTransaksi();
        updateHeaderCounters();
        
    } catch (error) {
        console.error('Error processing refund:', error);
        alert('Gagal memproses refund: ' + error.message);
    }
}

window.showRefundModal = showRefundModal;
window.renderRefundItems = renderRefundItems;
window.toggleRefundItem = toggleRefundItem;
window.updateRefundQty = updateRefundQty;
window.updateRefundSubtotal = updateRefundSubtotal;
window.updateRefundTotal = updateRefundTotal;
window.prosesRefund = prosesRefund;
