/**
 * Edit Harga Module - FIXED
 * File: js/modules/kasir/edit-harga.js
 */

document.addEventListener('DOMContentLoaded', function() {
    // Tombol simpan
    const btnSimpan = document.getElementById('btn-simpan-edit');
    if (btnSimpan) {
        btnSimpan.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            simpanEditHarga();
        });
    }
    
    // Tombol batal
    const btnBatal = document.querySelector('#modal-edit-harga .btn-secondary');
    if (btnBatal) {
        btnBatal.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal('modal-edit-harga');
        });
    }
});

function simpanEditHarga() {
    const index = parseInt(document.getElementById('edit-index')?.value);
    const hargaBaru = parseInt(document.getElementById('edit-harga-baru')?.value) || 0;
    const jumlahBaru = parseInt(document.getElementById('edit-jumlah-baru')?.value) || 1;
    
    if (isNaN(index)) {
        showToast('Item tidak valid', 'error');
        return;
    }
    
    if (hargaBaru <= 0) {
        showToast('Harga harus lebih dari 0', 'warning');
        document.getElementById('edit-harga-baru')?.focus();
        return;
    }
    
    if (jumlahBaru <= 0) {
        showToast('Jumlah harus lebih dari 0', 'warning');
        document.getElementById('edit-jumlah-baru')?.focus();
        return;
    }
    
    // Gunakan Keranjang module untuk edit
    if (typeof window.Keranjang !== 'undefined') {
        const items = window.Keranjang.getItems();
        if (index < 0 || index >= items.length) {
            showToast('Item tidak ditemukan', 'error');
            return;
        }
        
        // Update item langsung
        items[index].harga_jual = hargaBaru;
        items[index].qty = jumlahBaru;
        items[index].subtotal = hargaBaru * jumlahBaru;
        
        // Save dan render ulang
        window.Keranjang.saveToStorage();
        window.Keranjang.render();
        
    } else {
        console.error('Keranjang module not loaded');
        return;
    }
    
    // Tutup modal
    closeModal('modal-edit-harga');
    showToast('Item berhasil diupdate', 'success');
}

// Fungsi untuk membuka modal edit
function openEditModal(index) {
    if (typeof window.Keranjang === 'undefined') {
        console.error('Keranjang not loaded');
        return;
    }
    
    const items = window.Keranjang.getItems();
    if (index < 0 || index >= items.length) {
        console.error('Invalid index');
        return;
    }
    
    const item = items[index];
    
    const inputIndex = document.getElementById('edit-index');
    const inputHarga = document.getElementById('edit-harga-baru');
    const inputJumlah = document.getElementById('edit-jumlah-baru');
    
    if (inputIndex) inputIndex.value = index;
    if (inputHarga) inputHarga.value = item.harga_jual;
    if (inputJumlah) inputJumlah.value = item.qty;
    
    openModal('modal-edit-harga');
}

// Export ke global
window.openEditModal = openEditModal;
window.simpanEditHarga = simpanEditHarga;
