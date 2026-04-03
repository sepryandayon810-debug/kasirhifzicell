/**
 * Top Up Module
 * File: js/modules/kasir/topup.js
 */

let topupData = {
    nominal: 0,
    fee: 0,
    total: 0
};

document.addEventListener('DOMContentLoaded', function() {
    const nominalInput = document.getElementById('topup-nominal');
    const feeInput = document.getElementById('topup-fee-input');
    const btnSimpan = document.getElementById('btn-simpan-topup');
    
    if (nominalInput) {
        nominalInput.addEventListener('input', calculateTopup);
    }
    
    if (feeInput) {
        feeInput.addEventListener('input', calculateTopup);
    }
    
    if (btnSimpan) {
        btnSimpan.addEventListener('click', simpanTopup);
    }
});

function calculateTopup() {
    const nominal = parseInt(document.getElementById('topup-nominal')?.value) || 0;
    const fee = parseInt(document.getElementById('topup-fee-input')?.value) || 0;
    
    topupData = {
        nominal: nominal,
        fee: fee,
        total: nominal + fee
    };
    
    const totalEl = document.getElementById('topup-total');
    if (totalEl) {
        totalEl.textContent = typeof formatRupiah === 'function' 
            ? formatRupiah(topupData.total) 
            : 'Rp ' + topupData.total.toLocaleString('id-ID');
    }
}

function simpanTopup() {
    if (topupData.nominal <= 0) {
        alert('Nominal top up harus lebih dari 0');
        return;
    }
    
    const providerSelect = document.getElementById('topup-provider');
    const provider = providerSelect?.value || 'lainnya';
    const providerName = providerSelect?.options[providerSelect.selectedIndex]?.text || 'Lainnya';
    
    const totalTopup = topupData.nominal + topupData.fee;
    
    // Buat objek untuk Keranjang module
    const produkTopup = {
        id: 'topup_' + Date.now(),
        nama: `Top Up ${providerName}`,
        harga_jual: totalTopup,
        harga_modal: topupData.nominal,
        stok: 9999
    };
    
    const customData = {
        nama: `Top Up ${providerName} - ${formatRupiah(topupData.nominal)}`,
        harga_jual: totalTopup,
        harga_modal: topupData.nominal,
        qty: 1,
        keterangan: `Provider: ${providerName}, Nominal: ${topupData.nominal}, Fee: ${topupData.fee}`,
        jenis: 'topup',
        provider: provider,
        nominal: topupData.nominal,
        fee: topupData.fee,
        subtotal: totalTopup // ✅ Pastikan subtotal ada
    };
    
    // Gunakan Keranjang module
    if (typeof window.Keranjang !== 'undefined') {
        window.Keranjang.tambahItem(produkTopup, customData);
    } else {
        console.error('Keranjang module not loaded');
        return;
    }
    
    // Reset form
    document.getElementById('topup-nominal').value = '';
    document.getElementById('topup-fee-input').value = '0';
    document.getElementById('topup-total').textContent = 'Rp 0';
    topupData = { nominal: 0, fee: 0, total: 0 };
    
    // Tutup modal
    if (typeof closeModal === 'function') {
        closeModal('modal-topup');
    }
    
    // Reset jenis transaksi ke penjualan
    document.querySelectorAll('.jenis-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const btnPenjualan = document.querySelector('[data-jenis="penjualan"]');
    if (btnPenjualan) btnPenjualan.classList.add('active');
    
    if (typeof showToast === 'function') {
        showToast('Top up ditambahkan ke keranjang', 'success');
    }
}
