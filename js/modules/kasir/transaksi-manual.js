/**
 * Transaksi Manual Module
 * File: js/modules/kasir/transaksi-manual.js
 */

document.addEventListener('DOMContentLoaded', function() {
    const btnSimpan = document.getElementById('btn-simpan-manual');
    if (btnSimpan) {
        btnSimpan.addEventListener('click', simpanTransaksiManual);
    }
});

function simpanTransaksiManual() {
    const nama = document.getElementById('manual-nama')?.value.trim();
    const hargaModal = parseInt(document.getElementById('manual-harga-modal')?.value) || 0;
    const hargaJual = parseInt(document.getElementById('manual-harga-jual')?.value) || 0;
    const jumlah = parseInt(document.getElementById('manual-jumlah')?.value) || 1;
    const keterangan = document.getElementById('manual-keterangan')?.value.trim();
    
    // Validasi
    if (!nama) {
        alert('Nama produk wajib diisi');
        return;
    }
    
    if (hargaJual <= 0) {
        alert('Harga jual harus lebih dari 0');
        return;
    }
    
    // Buat objek untuk Keranjang module
    const produkManual = {
        id: 'manual_' + Date.now(),
        nama: nama,
        harga_modal: hargaModal,
        harga_jual: hargaJual,
        stok: 9999
    };
    
    const customData = {
        nama: nama,
        harga_modal: hargaModal,
        harga_jual: hargaJual,
        qty: jumlah,
        keterangan: keterangan,
        jenis: 'manual'
    };
    
    // Gunakan Keranjang module
    if (typeof window.Keranjang !== 'undefined') {
        window.Keranjang.tambahItem(produkManual, customData);
    } else {
        console.error('Keranjang module not loaded');
        return;
    }
    
    // Reset form
    document.getElementById('manual-nama').value = '';
    document.getElementById('manual-harga-modal').value = '';
    document.getElementById('manual-harga-jual').value = '';
    document.getElementById('manual-jumlah').value = '1';
    document.getElementById('manual-keterangan').value = '';
    
    // Tutup modal
    if (typeof closeModal === 'function') {
        closeModal('modal-transaksi-manual');
    }
    
    // Reset jenis transaksi ke penjualan
    document.querySelectorAll('.jenis-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const btnPenjualan = document.querySelector('[data-jenis="penjualan"]');
    if (btnPenjualan) btnPenjualan.classList.add('active');
    
    if (typeof showToast === 'function') {
        showToast('Item manual ditambahkan ke keranjang', 'success');
    }
}
