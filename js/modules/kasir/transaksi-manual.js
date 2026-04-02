// Transaksi Manual Module

document.addEventListener('DOMContentLoaded', function() {
    const btnSimpan = document.getElementById('btn-simpan-manual');
    if (btnSimpan) {
        btnSimpan.addEventListener('click', simpanTransaksiManual);
    }
    
    // Auto calculate total
    const inputs = ['manual-harga-jual', 'manual-jumlah'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', calculateTotalManual);
        }
    });
});

function calculateTotalManual() {
    const harga = parseInt(document.getElementById('manual-harga-jual').value) || 0;
    const jumlah = parseInt(document.getElementById('manual-jumlah').value) || 1;
    // Total akan dihitung di keranjang
}

function simpanTransaksiManual() {
    const nama = document.getElementById('manual-nama').value.trim();
    const hargaModal = parseInt(document.getElementById('manual-harga-modal').value) || 0;
    const hargaJual = parseInt(document.getElementById('manual-harga-jual').value) || 0;
    const jumlah = parseInt(document.getElementById('manual-jumlah').value) || 1;
    const keterangan = document.getElementById('manual-keterangan').value.trim();
    
    // Validasi
    if (!nama) {
        alert('Nama produk wajib diisi');
        return;
    }
    
    if (hargaJual <= 0) {
        alert('Harga jual harus lebih dari 0');
        return;
    }
    
    // Buat objek produk manual
    const produkManual = {
        id: 'manual_' + Date.now(),
        nama: nama,
        harga_modal: hargaModal,
        harga_jual: hargaJual,
        qty: jumlah,
        keterangan: keterangan,
        stok: 9999 // Unlimited untuk manual
    };
    
    // Tambah ke keranjang
    tambahKeKeranjang(produkManual, {
        nama: nama,
        harga_modal: hargaModal,
        harga_jual: hargaJual,
        qty: jumlah,
        keterangan: keterangan
    });
    
    // Reset form
    document.getElementById('manual-nama').value = '';
    document.getElementById('manual-harga-modal').value = '';
    document.getElementById('manual-harga-jual').value = '';
    document.getElementById('manual-jumlah').value = '1';
    document.getElementById('manual-keterangan').value = '';
    
    // Tutup modal
    closeModal('modal-transaksi-manual');
    
    showToast('Item manual ditambahkan ke keranjang', 'success');
}
