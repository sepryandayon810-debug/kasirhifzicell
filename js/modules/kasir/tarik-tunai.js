// Tarik Tunai Module

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
    const nominal = parseInt(document.getElementById('tarik-nominal').value) || 0;
    const fee = parseInt(document.getElementById('tarik-fee-input').value) || 0;
    
    tarikData = {
        nominal: nominal,
        fee: fee,
        total: nominal - fee // Yang diterima customer = nominal - fee
    };
    
    const totalEl = document.getElementById('tarik-total');
    totalEl.textContent = formatRupiah(tarikData.total);
    
    // Warning jika fee > nominal
    if (fee > nominal) {
        totalEl.style.color = 'var(--danger-color)';
    } else {
        totalEl.style.color = 'white';
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
    
    // Buat item tarik
    const itemTarik = {
        id: 'tarik_' + Date.now(),
        nama: `Tarik Tunai - ${formatRupiah(tarikData.nominal)}`,
        harga: tarikData.total, // Yang masuk ke kasir
        harga_modal: tarikData.nominal, // Modal keluar = nominal
        qty: 1,
        jenis: 'tarik',
        keterangan: `Nominal: ${tarikData.nominal}, Fee: ${tarikData.fee}, Diterima: ${tarikData.total}`,
        nominal: tarikData.nominal,
        fee: tarikData.fee
    };
    
    // Tambah ke keranjang global
    keranjang.push(itemTarik);
    renderKeranjang();
    
    // Reset form
    document.getElementById('tarik-nominal').value = '';
    document.getElementById('tarik-fee-input').value = '0';
    document.getElementById('tarik-total').textContent = 'Rp 0';
    tarikData = { nominal: 0, fee: 0, total: 0 };
    
    // Tutup modal
    closeModal('modal-tarik');
    
    // Reset jenis transaksi ke penjualan
    document.querySelectorAll('.jenis-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('[data-jenis="penjualan"]').classList.add('active');
    currentJenis = 'penjualan';
    
    showToast('Tarik tunai ditambahkan ke keranjang', 'success');
}
