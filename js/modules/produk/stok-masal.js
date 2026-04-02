/**
 * Update Stok Masal Module
 */

let stokMasalData = [];

function loadStokMasal() {
    // Ambil produk yang aktif
    const activeProduk = produkData.filter(p => p.status !== 'nonaktif');
    stokMasalData = activeProduk.map(p => ({
        id: p.id,
        nama: p.nama,
        kode: p.kode,
        stok_sekarang: p.stok || 0,
        perubahan: 0,
        stok_baru: p.stok || 0,
        keterangan: ''
    }));
    
    renderStokMasalTable();
}

function renderStokMasalTable() {
    const tbody = document.getElementById('stok-masal-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    stokMasalData.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <strong>${item.nama}</strong><br>
                <small style="color: var(--text-secondary);">${item.kode}</small>
            </td>
            <td style="text-align: center; font-weight: 600;">${item.stok_sekarang}</td>
            <td>
                <input type="number" class="perubahan-input" data-index="${index}" 
                       value="${item.perubahan}" placeholder="+/-">
            </td>
            <td style="text-align: center; font-weight: 700; color: var(--primary-color);">
                ${item.stok_baru}
            </td>
            <td>
                <input type="text" class="keterangan-input" data-index="${index}" 
                       value="${item.keterangan}" placeholder="Keterangan perubahan">
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Event listeners
    tbody.querySelectorAll('.perubahan-input').forEach(input => {
        input.addEventListener('input', updatePerubahan);
    });
}

function updatePerubahan(e) {
    const index = parseInt(e.target.dataset.index);
    const perubahan = parseInt(e.target.value) || 0;
    
    stokMasalData[index].perubahan = perubahan;
    stokMasalData[index].stok_baru = stokMasalData[index].stok_sekarang + perubahan;
    
    // Update class styling
    e.target.classList.remove('perubahan-positif', 'perubahan-negatif');
    if (perubahan > 0) {
        e.target.classList.add('perubahan-positif');
    } else if (perubahan < 0) {
        e.target.classList.add('perubahan-negatif');
    }
    
    // Update stok baru display
    const row = e.target.closest('tr');
    row.cells[3].textContent = stokMasalData[index].stok_baru;
    
    // Warning jika stok negatif
    if (stokMasalData[index].stok_baru < 0) {
        row.cells[3].style.color = 'var(--danger-color)';
    } else {
        row.cells[3].style.color = 'var(--primary-color)';
    }
}

async function simpanStokMasal() {
    const updates = stokMasalData.filter(item => item.perubahan !== 0);
    
    if (updates.length === 0) {
        alert('Tidak ada perubahan stok');
        return;
    }
    
    // Cek stok negatif
    const negativeStok = updates.filter(item => item.stok_baru < 0);
    if (negativeStok.length > 0) {
        alert(`${negativeStok.length} produk akan memiliki stok negatif. Periksa kembali.`);
        return;
    }
    
    const btnSimpan = document.getElementById('btn-simpan-stok-masal');
    btnSimpan.disabled = true;
    btnSimpan.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    
    try {
        const today = getToday();
        const batch = {};
        const historyBatch = {};
        
        updates.forEach(item => {
            // Update stok produk
            batch[`products/${item.id}/stok`] = item.stok_baru;
            batch[`products/${item.id}/updated_at`] = firebase.database.ServerValue.TIMESTAMP;
            
            // Catat history
            const historyKey = database.ref().push().key;
            historyBatch[`stok_history/${today}/${historyKey}`] = {
                produk_id: item.id,
                produk_nama: item.nama,
                stok_lama: item.stok_sekarang,
                perubahan: item.perubahan,
                stok_baru: item.stok_baru,
                keterangan: item.keterangan || 'Update stok masal',
                waktu: firebase.database.ServerValue.TIMESTAMP
            };
        });
        
        // Execute updates
        await database.ref().update(batch);
        await database.ref().update(historyBatch);
        
        showToast(`${updates.length} produk berhasil diupdate`, 'success');
        closeModal('modal-stok-masal');
        loadProduk();
        
    } catch (error) {
        console.error('Error update stok masal:', error);
        alert('Gagal mengupdate stok: ' + error.message);
    } finally {
        btnSimpan.disabled = false;
        btnSimpan.innerHTML = 'Simpan Perubahan';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const btnSimpan = document.getElementById('btn-simpan-stok-masal');
    if (btnSimpan) {
        btnSimpan.addEventListener('click', simpanStokMasal);
    }
});

window.loadStokMasal = loadStokMasal;
window.simpanStokMasal = simpanStokMasal;
