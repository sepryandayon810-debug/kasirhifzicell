/**
 * Kategori Manager Module
 */

async function loadKategoriList() {
    try {
        const snapshot = await database.ref('kategori').orderByChild('nama').once('value');
        const container = document.getElementById('kategori-list');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!snapshot.exists()) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Belum ada kategori</p>';
            return;
        }
        
        snapshot.forEach(child => {
            const kategori = child.val();
            const item = document.createElement('div');
            item.className = 'kategori-item';
            item.innerHTML = `
                <span class="kategori-nama">${kategori.nama}</span>
                <div class="kategori-actions">
                    <button class="btn btn-sm btn-info" onclick="editKategori('${child.key}', '${kategori.nama}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="hapusKategori('${child.key}')" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(item);
        });
        
    } catch (error) {
        console.error('Error load kategori:', error);
    }
}

async function tambahKategori() {
    const input = document.getElementById('nama-kategori-baru');
    const nama = input.value.trim();
    
    if (!nama) {
        alert('Nama kategori tidak boleh kosong');
        return;
    }
    
    try {
        // Cek duplikat
        const snapshot = await database.ref('kategori').orderByChild('nama').equalTo(nama).once('value');
        if (snapshot.exists()) {
            alert('Kategori dengan nama tersebut sudah ada');
            return;
        }
        
        await database.ref('kategori').push({
            nama: nama,
            created_at: firebase.database.ServerValue.TIMESTAMP
        });
        
        input.value = '';
        loadKategoriList();
        loadKategoriForFilter(); // Refresh filter di toolbar
        
        showToast('Kategori berhasil ditambahkan', 'success');
        
    } catch (error) {
        console.error('Error tambah kategori:', error);
        alert('Gagal menambah kategori');
    }
}

async function editKategori(kategoriId, namaLama) {
    const namaBaru = prompt('Edit nama kategori:', namaLama);
    
    if (!namaBaru || namaBaru === namaLama) return;
    
    try {
        await database.ref(`kategori/${kategoriId}`).update({
            nama: namaBaru.trim(),
            updated_at: firebase.database.ServerValue.TIMESTAMP
        });
        
        loadKategoriList();
        loadKategoriForFilter();
        loadProduk(); // Refresh untuk update nama kategori di produk
        
        showToast('Kategori berhasil diupdate', 'success');
        
    } catch (error) {
        console.error('Error edit kategori:', error);
        alert('Gagal mengupdate kategori');
    }
}

async function hapusKategori(kategoriId) {
    if (!confirm('Hapus kategori ini? Produk dengan kategori ini tidak akan terhapus.')) {
        return;
    }
    
    try {
        // Cek apakah ada produk yang menggunakan kategori ini
        const produkSnapshot = await database.ref('products').orderByChild('kategori').equalTo(kategoriId).once('value');
        
        if (produkSnapshot.exists()) {
            const count = produkSnapshot.numChildren();
            if (!confirm(`Ada ${count} produk yang menggunakan kategori ini. Kategori akan dihapus dari produk tersebut. Lanjutkan?`)) {
                return;
            }
            
            // Update produk yang menggunakan kategori ini menjadi tanpa kategori
            const updates = {};
            produkSnapshot.forEach(child => {
                updates[`products/${child.key}/kategori`] = '';
            });
            await database.ref().update(updates);
        }
        
        await database.ref(`kategori/${kategoriId}`).remove();
        
        loadKategoriList();
        loadKategoriForFilter();
        loadProduk();
        
        showToast('Kategori berhasil dihapus', 'success');
        
    } catch (error) {
        console.error('Error hapus kategori:', error);
        alert('Gagal menghapus kategori');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const btnTambah = document.getElementById('btn-tambah-kategori');
    if (btnTambah) {
        btnTambah.addEventListener('click', tambahKategori);
    }
    
    // Enter untuk tambah
    const input = document.getElementById('nama-kategori-baru');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') tambahKategori();
        });
    }
});

window.loadKategoriList = loadKategoriList;
window.tambahKategori = tambahKategori;
window.editKategori = editKategori;
window.hapusKategori = hapusKategori;
