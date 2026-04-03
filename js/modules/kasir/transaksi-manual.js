/**
 * Transaksi Manual Module - FIXED
 * File: js/modules/kasir/transaksi-manual.js
 */

document.addEventListener('DOMContentLoaded', function() {
    // FIX: Gunakan event delegation dan cek elemen ada
    const btnSimpan = document.getElementById('btn-simpan-manual');
    if (btnSimpan) {
        btnSimpan.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            simpanTransaksiManual();
        });
    }
    
    // FIX: Tambah listener untuk tombol batal di modal
    const btnBatal = document.querySelector('#modal-transaksi-manual .btn-secondary');
    if (btnBatal) {
        btnBatal.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal('modal-transaksi-manual');
        });
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
        showToast('Nama produk wajib diisi', 'warning');
        document.getElementById('manual-nama')?.focus();
        return;
    }
    
    if (hargaJual <= 0) {
        showToast('Harga jual harus lebih dari 0', 'warning');
        document.getElementById('manual-harga-jual')?.focus();
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
    resetFormManual();
    
    // Tutup modal - FIX: Pastikan modal tertutup
    closeModal('modal-transaksi-manual');
    
    // Reset jenis transaksi ke penjualan - FIX: Gunakan class modern
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const btnPenjualan = document.querySelector('.type-btn[data-jenis="penjualan"]');
    if (btnPenjualan) btnPenjualan.classList.add('active');
    
    showToast('Item manual ditambahkan ke keranjang', 'success');
}

function resetFormManual() {
    const nama = document.getElementById('manual-nama');
    const hargaModal = document.getElementById('manual-harga-modal');
    const hargaJual = document.getElementById('manual-harga-jual');
    const jumlah = document.getElementById('manual-jumlah');
    const keterangan = document.getElementById('manual-keterangan');
    
    if (nama) nama.value = '';
    if (hargaModal) hargaModal.value = '';
    if (hargaJual) hargaJual.value = '';
    if (jumlah) jumlah.value = '1';
    if (keterangan) keterangan.value = '';
}

// Export ke global
window.simpanTransaksiManual = simpanTransaksiManual;
window.resetFormManual = resetFormManual;
