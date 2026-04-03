/**
 * Top Up Module - FIXED
 * File: js/modules/kasir/topup.js
 */

document.addEventListener('DOMContentLoaded', function() {
    // Input listeners
    const nominalInput = document.getElementById('topup-nominal');
    const feeInput = document.getElementById('topup-fee-input');
    
    if (nominalInput) {
        nominalInput.addEventListener('input', hitungTotalTopup);
    }
    if (feeInput) {
        feeInput.addEventListener('input', hitungTotalTopup);
    }
    
    // Tombol simpan
    const btnSimpan = document.getElementById('btn-simpan-topup');
    if (btnSimpan) {
        btnSimpan.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            simpanTopup();
        });
    }
    
    // Tombol batal
    const btnBatal = document.querySelector('#modal-topup .btn-secondary');
    if (btnBatal) {
        btnBatal.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal('modal-topup');
        });
    }
});

function hitungTotalTopup() {
    const nominal = parseInt(document.getElementById('topup-nominal')?.value) || 0;
    const fee = parseInt(document.getElementById('topup-fee-input')?.value) || 0;
    const total = nominal + fee;
    
    const totalEl = document.getElementById('topup-total');
    if (totalEl) {
        totalEl.textContent = formatRupiah(total);
    }
}

function simpanTopup() {
    const nominal = parseInt(document.getElementById('topup-nominal')?.value) || 0;
    const fee = parseInt(document.getElementById('topup-fee-input')?.value) || 0;
    const provider = document.getElementById('topup-provider')?.value || 'lainnya';
    
    if (nominal <= 0) {
        showToast('Nominal top up harus lebih dari 0', 'warning');
        return;
    }
    
    const itemTopup = {
        id: 'topup_' + Date.now(),
        nama: `Top Up ${provider.toUpperCase()}`,
        harga_modal: nominal,
        harga_jual: nominal + fee,
        stok: 9999
    };
    
    const customData = {
        nama: `Top Up ${provider.toUpperCase()}`,
        harga_modal: nominal,
        harga_jual: nominal + fee,
        qty: 1,
        nominal: nominal,
        fee: fee,
        provider: provider,
        jenis: 'topup'
    };
    
    if (typeof window.Keranjang !== 'undefined') {
        window.Keranjang.tambahItem(itemTopup, customData);
    } else {
        console.error('Keranjang module not loaded');
        return;
    }
    
    // Reset dan tutup
    resetFormTopup();
    closeModal('modal-topup');
    
    // Reset jenis transaksi
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const btnPenjualan = document.querySelector('.type-btn[data-jenis="penjualan"]');
    if (btnPenjualan) btnPenjualan.classList.add('active');
    
    showToast('Top up ditambahkan ke keranjang', 'success');
}

function resetFormTopup() {
    const nominal = document.getElementById('topup-nominal');
    const fee = document.getElementById('topup-fee-input');
    const provider = document.getElementById('topup-provider');
    const total = document.getElementById('topup-total');
    
    if (nominal) nominal.value = '';
    if (fee) fee.value = '0';
    if (provider) provider.value = 'ovo';
    if (total) total.textContent = 'Rp 0';
}

// Export
window.hitungTotalTopup = hitungTotalTopup;
window.simpanTopup = simpanTopup;
window.resetFormTopup = resetFormTopup;
