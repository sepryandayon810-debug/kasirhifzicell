// Top Up Module

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
    const nominal = parseInt(document.getElementById('topup-nominal').value) || 0;
    const fee = parseInt(document.getElementById('topup-fee-input').value) || 0;
    
    topupData = {
        nominal: nominal,
        fee: fee,
        total: nominal + fee
    };
    
    document.getElementById('topup-total').textContent = formatRupiah(topupData.total);
}

function simpanTopup() {
    if (topupData.nominal <= 0) {
        alert('Nominal top up harus lebih dari 0');
        return;
    }
    
    const provider = document.getElementById('topup-provider').value;
    const providerName = document.getElementById('topup-provider').options[document.getElementById('topup-provider').selectedIndex].text;
    
    // Buat item topup
    const itemTopup = {
        id: 'topup_' + Date.now(),
        nama: `Top Up ${providerName} - ${formatRupiah(topupData.nominal)}`,
        harga: topupData.total,
        harga_modal: topupData.nominal, // Modal = nominal yang ditransfer
        qty: 1,
        jenis: 'topup',
        keterangan: `Provider: ${providerName}, Nominal: ${topupData.nominal}, Fee: ${topupData.fee}`,
        provider: provider,
        nominal: topupData.nominal,
        fee: topupData.fee
    };
    
    // Tambah ke keranjang global
    keranjang.push(itemTopup);
    renderKeranjang();
    
    // Reset form
    document.getElementById('topup-nominal').value = '';
    document.getElementById('topup-fee-input').value = '0';
    document.getElementById('topup-total').textContent = 'Rp 0';
    topupData = { nominal: 0, fee: 0, total: 0 };
    
    // Tutup modal
    closeModal('modal-topup');
    
    // Reset jenis transaksi ke penjualan
    document.querySelectorAll('.jenis-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('[data-jenis="penjualan"]').classList.add('active');
    currentJenis = 'penjualan';
    
    showToast('Top up ditambahkan ke keranjang', 'success');
}
