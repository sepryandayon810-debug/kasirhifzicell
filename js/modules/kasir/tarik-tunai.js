/**
 * Tarik Tunai Module
 * File: js/modules/kasir/tarik-tunai.js
 */

let tarikData = {
    nominal: 0,
    fee: 0,
    total: 0
};

document.addEventListener('DOMContentLoaded', function() {
    const nominalInput = document.getElementById('tarik-nominal');
    const feeInput = document.getElementById('tarik-fee-input');
    const btnSimpan = document.getElementById('btn-simpan-tarik');
    
    if (nominalInput) {
        nominalInput.addEventListener('input', calculateTarik);
    }
    
    if (feeInput) {
        feeInput.addEventListener('input', calculateTarik);
    }
    
    if (btnSimpan) {
        btnSimpan.addEventListener('click', simpanTarik);
    }
});

function calculateTarik() {
    const nominal = parseInt(document.getElementById('tarik-nominal')?.value) || 0;
    const fee = parseInt(document.getElementById('tarik-fee-input')?.value) || 0;
    
    tarikData = {
        nominal: nominal,
        fee: fee,
        total: nominal - fee // Yang diterima customer
    };
    
    const totalEl = document.getElementById('tarik-total');
    if (totalEl) {
        totalEl.textContent = typeof formatRupiah === 'function' 
            ? formatRupiah(tarikData.total) 
            : 'Rp ' + tarikData.total.toLocaleString('id-ID');
        
        // Warning jika fee > nominal
        if (fee > nominal) {
            totalEl.style.color = 'var(--accent-rose)';
        } else {
            totalEl.style.color = 'var(--accent-indigo)';
        }
    }
}

function simpanTarik() {
    if (tarikData.nominal <= 0) {
        alert('Nominal tarik harus lebih dari 0');
        return;
    }
    
    if (tarikData.fee > tarikData.nominal) {
        alert('Fee tidak boleh lebih besar dari nominal');
        return;
    }
    
    const diterima = tarikData.nominal - tarikData.fee;
    
    // Buat objek untuk Keranjang module
    const produkTarik = {
        id: 'tarik_' + Date.now(),
        nama: 'Tarik Tunai',
        harga_jual: diterima, // Fee yang masuk ke kasir
        harga_modal: tarikData.nominal, // Modal keluar
        stok: 9999
    };
    
    const customData = {
        nama: `Tarik Tunai - ${formatRupiah(tarikData.nominal)}`,
        harga_jual: diterima,
        harga_modal: tarikData.nominal,
        qty: 1,
        keterangan: `Nominal: ${tarikData.nominal}, Fee: ${tarikData.fee}, Diterima: ${diterima}`,
        jenis: 'tarik',
        nominal: tarikData.nominal,
        fee: tarikData.fee,
        subtotal: diterima // ✅ Pastikan subtotal ada
    };
    
    // Gunakan Keranjang module
    if (typeof window.Keranjang !== 'undefined') {
        window.Keranjang.tambahItem(produkTarik, customData);
    } else {
        console.error('Keranjang module not loaded');
        return;
    }
    
    // Reset form
    document.getElementById('tarik-nominal').value = '';
    document.getElementById('tarik-fee-input').value = '0';
    document.getElementById('tarik-total').textContent = 'Rp 0';
    tarikData = { nominal: 0, fee: 0, total: 0 };
    
    // Tutup modal
    if (typeof closeModal === 'function') {
        closeModal('modal-tarik');
    }
    
    // Reset jenis transaksi ke penjualan
    document.querySelectorAll('.jenis-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const btnPenjualan = document.querySelector('[data-jenis="penjualan"]');
    if (btnPenjualan) btnPenjualan.classList.add('active');
    
    if (typeof showToast === 'function') {
        showToast('Tarik tunai ditambahkan ke keranjang', 'success');
    }
}
