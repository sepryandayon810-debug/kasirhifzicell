/**
 * Edit Harga Module
 * File: js/modules/kasir/edit-harga.js
 */

document.addEventListener('DOMContentLoaded', function() {
    const btnSimpan = document.getElementById('btn-simpan-edit');
    if (btnSimpan) {
        btnSimpan.addEventListener('click', simpanEditHarga);
    }
});

function simpanEditHarga() {
    const index = parseInt(document.getElementById('edit-index')?.value);
    const hargaBaru = parseInt(document.getElementById('edit-harga-baru')?.value) || 0;
    const jumlahBaru = parseInt(document.getElementById('edit-jumlah-baru')?.value) || 1;
    
    if (isNaN(index)) {
        alert('Item tidak valid');
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
    
    // Gunakan Keranjang module untuk edit
    if (typeof window.Keranjang !== 'undefined') {
        const items = window.Keranjang.getItems();
        if (index < 0 || index >= items.length) {
            alert('Item tidak ditemukan');
            return;
        }
        
        const item = items[index];
        
        // Cek stok untuk penjualan
        if (item.jenis === 'penjualan' && jumlahBaru > item.stok_tersedia) {
            alert('Stok tidak mencukupi');
            return;
        }
        
        window.Keranjang.editItem(index, {
            harga: hargaBaru,
            qty: jumlahBaru
        });
    } else {
        console.error('Keranjang module not loaded');
        return;
    }
    
    // Tutup modal
    if (typeof closeModal === 'function') {
        closeModal('modal-edit-harga');
    }
    
    if (typeof showToast === 'function') {
        showToast('Item berhasil diupdate', 'success');
    }
}

// Fungsi untuk membuka modal edit dari kasir-main
function openEditModal(index) {
    if (typeof window.Keranjang === 'undefined') return;
    
    const items = window.Keranjang.getItems();
    if (index < 0 || index >= items.length) return;
    
    const item = items[index];
    
    document.getElementById('edit-index').value = index;
    document.getElementById('edit-harga-baru').value = item.harga_jual;
    document.getElementById('edit-jumlah-baru').value = item.qty;
    
    if (typeof openModal === 'function') {
        openModal('modal-edit-harga');
    }
}

// Export ke global
window.openEditModal = openEditModal;
