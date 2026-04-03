/**
 * Top Up Module - MOBILE FIXED
 */

document.addEventListener('DOMContentLoaded', function() {
    const nominalInput = document.getElementById('topup-nominal');
    const feeInput = document.getElementById('topup-fee-input');
    const btnSimpan = document.getElementById('btn-simpan-topup');
    const btnBatal = document.querySelector('#modal-topup .btn-secondary');
    const modal = document.getElementById('modal-topup');
    
    if (nominalInput) nominalInput.addEventListener('input', hitungTotalTopup);
    if (feeInput) feeInput.addEventListener('input', hitungTotalTopup);
    
    if (btnSimpan) {
        btnSimpan.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            simpanTopup();
        });
    }
    
    if (btnBatal) {
        btnBatal.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal('modal-topup');
        });
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal('modal-topup');
            }
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
        console.error('Keranjang not loaded');
        return;
    }
    
    resetFormTopup();
    closeModal('modal-topup');
    
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('.type-btn[data-jenis="penjualan"]')?.classList.add('active');
    
    showToast('Top up ditambahkan', 'success');
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

window.hitungTotalTopup = hitungTotalTopup;
window.simpanTopup = simpanTopup;
window.resetFormTopup = resetFormTopup;
