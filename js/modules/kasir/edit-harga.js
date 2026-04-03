/**
 * Edit Harga Module - MOBILE FIXED
 */

document.addEventListener('DOMContentLoaded', function() {
    const btnSimpan = document.getElementById('btn-simpan-edit');
    const btnBatal = document.querySelector('#modal-edit-harga .btn-secondary');
    const modal = document.getElementById('modal-edit-harga');
    
    if (btnSimpan) {
        btnSimpan.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            simpanEditHarga();
        });
    }
    
    if (btnBatal) {
        btnBatal.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal('modal-edit-harga');
        });
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal('modal-edit-harga');
            }
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
    
    if (typeof window.Keranjang !== 'undefined') {
        const items = window.Keranjang.getItems();
        if (index < 0 || index >= items.length) {
            showToast('Item tidak ditemukan', 'error');
            return;
        }
        
        items[index].harga_jual = hargaBaru;
        items[index].qty = jumlahBaru;
        items[index].subtotal = hargaBaru * jumlahBaru;
        
        window.Keranjang.saveToStorage();
        window.Keranjang.render();
    } else {
        console.error('Keranjang not loaded');
        return;
    }
    
    closeModal('modal-edit-harga');
    showToast('Item berhasil diupdate', 'success');
}

function openEditModal(index) {
    if (typeof window.Keranjang === 'undefined') return;
    
    const items = window.Keranjang.getItems();
    if (index < 0 || index >= items.length) return;
    
    const item = items[index];
    
    document.getElementById('edit-index').value = index;
    document.getElementById('edit-harga-baru').value = item.harga_jual;
    document.getElementById('edit-jumlah-baru').value = item.qty;
    
    openModal('modal-edit-harga');
}

window.openEditModal = openEditModal;
window.simpanEditHarga = simpanEditHarga;
