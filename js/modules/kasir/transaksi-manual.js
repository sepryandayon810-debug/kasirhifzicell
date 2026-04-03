/**
 * Transaksi Manual Module - MOBILE FIXED
 * File: js/modules/kasir/transaksi-manual.js
 */

document.addEventListener('DOMContentLoaded', function() {
    // Tombol simpan - tambah prevent default
    const btnSimpan = document.getElementById('btn-simpan-manual');
    if (btnSimpan) {
        btnSimpan.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            simpanTransaksiManual();
        });
    }
    
    // Tombol batal
    const btnBatal = document.querySelector('#modal-transaksi-manual .btn-secondary');
    if (btnBatal) {
        btnBatal.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal('modal-transaksi-manual');
        });
    }
    
    // Close saat klik overlay
    const modal = document.getElementById('modal-transaksi-manual');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal('modal-transaksi-manual');
            }
        });
    }
    
    // Auto focus nama saat modal dibuka
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.classList.contains('active')) {
                setTimeout(() => {
                    document.getElementById('manual-nama')?.focus();
                }, 100);
            }
        });
    });
    
    if (modal) {
        observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
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
    
    // Buat objek untuk Keranjang
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
    
    // Tambah ke keranjang
    if (typeof window.Keranjang !== 'undefined') {
        window.Keranjang.tambahItem(produkManual, customData);
    } else {
        console.error('Keranjang module not loaded');
        return;
    }
    
    // Reset form
    resetFormManual();
    
    // Tutup modal - FIX: force close
    const modal = document.getElementById('modal-transaksi-manual');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
    
    // Hide overlay
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
    
    // Reset jenis transaksi
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const btnPenjualan = document.querySelector('.type-btn[data-jenis="penjualan"]');
    if (btnPenjualan) btnPenjualan.classList.add('active');
    
    showToast('Item manual ditambahkan', 'success');
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

// Export
window.simpanTransaksiManual = simpanTransaksiManual;
window.resetFormManual = resetFormManual;
