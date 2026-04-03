/**
 * Tarik Tunai Module - FIXED
 * File: js/modules/kasir/tarik-tunai.js
 */

document.addEventListener('DOMContentLoaded', function() {
    // Input listeners
    const nominalInput = document.getElementById('tarik-nominal');
    const feeInput = document.getElementById('tarik-fee-input');
    
    if (nominalInput) {
        nominalInput.addEventListener('input', hitungTotalTarik);
    }
    if (feeInput) {
        feeInput.addEventListener('input', hitungTotalTarik);
    }
    
    // Tombol simpan
    const btnSimpan = document.getElementById('btn-simpan-tarik');
    if (btnSimpan) {
        btnSimpan.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            simpanTarik();
        });
    }
    
    // Tombol batal
    const btnBatal = document.querySelector('#modal-tarik .btn-secondary');
    if (btnBatal) {
        btnBatal.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal('modal-tarik');
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
        console.error('Keranjang module not loaded');
        return;
    }
    
    // Reset dan tutup
    resetFormTarik();
    closeModal('modal-tarik');
    
    // Reset jenis transaksi
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const btnPenjualan = document.querySelector('.type-btn[data-jenis="penjualan"]');
    if (btnPenjualan) btnPenjualan.classList.add('active');
    
    showToast('Tarik tunai ditambahkan ke keranjang', 'success');
}

function resetFormTarik() {
    const nominal = document.getElementById('tarik-nominal');
    const fee = document.getElementById('tarik-fee-input');
    const total = document.getElementById('tarik-total');
    
    if (nominal) nominal.value = '';
    if (fee) fee.value = '0';
    if (total) total.textContent = 'Rp 0';
}

// Export
window.hitungTotalTarik = hitungTotalTarik;
window.simpanTarik = simpanTarik;
window.resetFormTarik = resetFormTarik;
