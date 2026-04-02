// Edit Harga Module

document.addEventListener('DOMContentLoaded', function() {
    const btnSimpan = document.getElementById('btn-simpan-edit');
    if (btnSimpan) {
        btnSimpan.addEventListener('click', simpanEditHarga);
    }
});

function simpanEditHarga() {
    const index = parseInt(document.getElementById('edit-index').value);
    const hargaBaru = parseInt(document.getElementById('edit-harga-baru').value) || 0;
    const jumlahBaru = parseInt(document.getElementById('edit-jumlah-baru').value) || 1;
    
    if (index < 0 || index >= keranjang.length) {
        alert('Item tidak ditemukan');
        return;
    }
    
    if (hargaBaru <= 0) {
        alert('Harga harus lebih dari 0');
        return;
    }
    
    if (jumlahBaru <= 0) {
        alert('Jumlah harus lebih dari 0');
        return;
    }
    
    // Cek stok untuk penjualan
    const item = keranjang[index];
    if (item.jenis === 'penjualan' && jumlahBaru > item.stok_tersedia) {
        alert('Stok tidak mencukupi');
        return;
    }
    
    // Update item
    keranjang[index].harga = hargaBaru;
    keranjang[index].qty = jumlahBaru;
    keranjang[index].subtotal = hargaBaru * jumlahBaru;
    
    // Re-render
    renderKeranjang();
    
    // Tutup modal
    closeModal('modal-edit-harga');
    
    showToast('Item berhasil diupdate', 'success');
}
