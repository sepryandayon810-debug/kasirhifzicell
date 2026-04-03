/**
 * Tarik Tunai Module - MOBILE FIXED
 */

document.addEventListener('DOMContentLoaded', function() {
    const nominalInput = document.getElementById('tarik-nominal');
    const feeInput = document.getElementById('tarik-fee-input');
    const btnSimpan = document.getElementById('btn-simpan-tarik');
    const btnBatal = document.querySelector('#modal-tarik .btn-secondary');
    const modal = document.getElementById('modal-tarik');
    
    if (nominalInput) nominalInput.addEventListener('input', hitungTotalTarik);
    if (feeInput) feeInput.addEventListener('input', hitungTotalTarik);
    
    if (btnSimpan) {
        btnSimpan.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            simpanTarik();
        });
    }
    
    if (btnBatal) {
        btnBatal.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal('modal-tarik');
        });
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal('modal-tarik');
            }
        });
    }
});

function hitungTotalTarik() {
    const nominal = parseInt(document.getElementById('tarik-nominal')?.value) || 0;
    const fee = parseInt(document.getElementById('tarik-fee-input')?.value) || 0;
    const total = nominal - fee;
    
    const totalEl = document.getElementById('tarik-total');
    if (totalEl) {
        totalEl.textContent = formatRupiah(total);
    }
}

function simpanTarik() {
    const nominal = parseInt(document.getElementById('tarik-nominal')?.value) || 0;
    const fee = parseInt(document.getElementById('tarik-fee-input')?.value) || 0;
    
    if (nominal <= 0) {
        showToast('Nominal tarik harus lebih dari 0', 'warning');
        return;
    }
    
    if (fee >= nominal) {
        showToast('Fee tidak boleh lebih besar dari nominal', 'warning');
        return;
    }
    
    const itemTarik = {
        id: 'tarik_' + Date.now(),
        nama: `Tarik Tunai`,
        harga_modal: nominal,
        harga_jual: nominal - fee,
        stok: 9999
    };
    
    const customData = {
        nama: `Tarik Tunai`,
        harga_modal: nominal,
        harga_jual: nominal - fee,
        qty: 1,
        nominal: nominal,
        fee: fee,
        jenis: 'tarik'
    };
    
    if (typeof window.Keranjang !== 'undefined') {
        window.Keranjang.tambahItem(itemTarik, customData);
    } else {
        console.error('Keranjang not loaded');
        return;
    }
    
    resetFormTarik();
    closeModal('modal-tarik');
    
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('.type-btn[data-jenis="penjualan"]')?.classList.add('active');
    
    showToast('Tarik tunai ditambahkan', 'success');
}

function resetFormTarik() {
    const nominal = document.getElementById('tarik-nominal');
    const fee = document.getElementById('tarik-fee-input');
    const total = document.getElementById('tarik-total');
    
    if (nominal) nominal.value = '';
    if (fee) fee.value = '0';
    if (total) total.textContent = 'Rp 0';
}

window.hitungTotalTarik = hitungTotalTarik;
window.simpanTarik = simpanTarik;
window.resetFormTarik = resetFormTarik;
