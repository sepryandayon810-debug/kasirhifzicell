/**
 * Toggle Hide/Show Produk Module
 */

function openToggleModal() {
    const list = document.getElementById('toggle-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    produkData.forEach(produk => {
        const item = document.createElement('div');
        item.className = 'toggle-item';
        item.innerHTML = `
            <input type="checkbox" id="toggle-${produk.id}" value="${produk.id}">
            <div class="toggle-info">
                <strong>${produk.nama}</strong>
                <small style="display: block; color: var(--text-secondary);">${produk.kode}</small>
            </div>
            <span class="toggle-status ${produk.status || 'aktif'}">${produk.status === 'nonaktif' ? 'Nonaktif' : 'Aktif'}</span>
        `;
        list.appendChild(item);
    });
    
    openModal('modal-toggle');
}

async function toggleSelectedProduk(status) {
    const checkboxes = document.querySelectorAll('#toggle-list input[type="checkbox"]:checked');
    const ids = Array.from(checkboxes).map(cb => cb.value);
    
    if (ids.length === 0) {
        alert('Pilih produk terlebih dahulu');
        return;
    }
    
    try {
        const updates = {};
        ids.forEach(id => {
            updates[`products/${id}/status`] = status;
            updates[`products/${id}/updated_at`] = firebase.database.ServerValue.TIMESTAMP;
        });
        
        await database.ref().update(updates);
        
        showToast(`${ids.length} produk di${status === 'aktif' ? 'aktifkan' : 'nonaktifkan'}`, 'success');
        closeModal('modal-toggle');
        loadProduk();
        
    } catch (error) {
        console.error('Error toggle produk:', error);
        alert('Gagal mengubah status produk');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Check all
    const btnCheckAll = document.getElementById('btn-check-all');
    if (btnCheckAll) {
        btnCheckAll.addEventListener('click', () => {
            document.querySelectorAll('#toggle-list input[type="checkbox"]').forEach(cb => cb.checked = true);
        });
    }
    
    // Uncheck all
    const btnUncheckAll = document.getElementById('btn-uncheck-all');
    if (btnUncheckAll) {
        btnUncheckAll.addEventListener('click', () => {
            document.querySelectorAll('#toggle-list input[type="checkbox"]').forEach(cb => cb.checked = false);
        });
    }
    
    // Hide selected
    const btnHide = document.getElementById('btn-toggle-hide');
    if (btnHide) {
        btnHide.addEventListener('click', () => toggleSelectedProduk('nonaktif'));
    }
    
    // Show selected
    const btnShow = document.getElementById('btn-toggle-show');
    if (btnShow) {
        btnShow.addEventListener('click', () => toggleSelectedProduk('aktif'));
    }
});

window.openToggleModal = openToggleModal;
window.toggleSelectedProduk = toggleSelectedProduk;
