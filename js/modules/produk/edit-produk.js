/**
 * Edit Produk Module
 */

async function editProduk(produkId) {
    try {
        const snapshot = await database.ref(`products/${produkId}`).once('value');
        const produk = snapshot.val();
        
        if (!produk) {
            alert('Produk tidak ditemukan');
            return;
        }
        
        // Isi form
        document.getElementById('produk-id').value = produkId;
        document.getElementById('produk-kode').value = produk.kode || '';
        document.getElementById('produk-barcode').value = produk.barcode || '';
        document.getElementById('produk-nama').value = produk.nama || '';
        document.getElementById('produk-kategori').value = produk.kategori || '';
        document.getElementById('produk-satuan').value = produk.satuan || 'pcs';
        document.getElementById('produk-harga-modal').value = produk.harga_modal || 0;
        document.getElementById('produk-harga-jual').value = produk.harga_jual || 0;
        document.getElementById('produk-stok').value = produk.stok || 0;
        document.getElementById('produk-deskripsi').value = produk.deskripsi || '';
        document.getElementById('produk-status').value = produk.status || 'aktif';
        
        // Gambar
        const preview = document.getElementById('image-preview');
        if (produk.gambar) {
            preview.innerHTML = `<img src="${produk.gambar}" alt="Preview">`;
            preview.classList.add('has-image');
            document.getElementById('btn-hapus-gambar').style.display = 'block';
            
            // Simpan gambar lama
            selectedImageBase64 = produk.gambar;
        } else {
            preview.innerHTML = '<i class="fas fa-image"></i><span>Preview</span>';
            preview.classList.remove('has-image');
            document.getElementById('btn-hapus-gambar').style.display = 'none';
            selectedImageBase64 = null;
        }
        
        // Update title dan tampilkan modal
        document.getElementById('modal-produk-title').textContent = 'Edit Produk';
        openModal('modal-produk');
        
    } catch (error) {
        console.error('Error load produk:', error);
        alert('Gagal memuat data produk');
    }
}

// Hapus produk
let produkToDelete = null;

function hapusProduk(produkId) {
    produkToDelete = produkId;
    
    // Tampilkan nama produk di modal
    const produk = produkData.find(p => p.id === produkId);
    document.getElementById('hapus-produk-nama').textContent = produk ? produk.nama : '-';
    
    openModal('modal-hapus');
}

document.addEventListener('DOMContentLoaded', function() {
    const btnKonfirmasiHapus = document.getElementById('btn-konfirmasi-hapus');
    if (btnKonfirmasiHapus) {
        btnKonfirmasiHapus.addEventListener('click', async () => {
            if (!produkToDelete) return;
            
            try {
                // Cek apakah produk pernah ada di transaksi
                const transaksiSnapshot = await database.ref('transaksi').orderByChild('items/' + produkToDelete).limitToFirst(1).once('value');
                
                if (transaksiSnapshot.exists()) {
                    // Jika sudah ada transaksi, jangan hapus tapi nonaktifkan
                    await database.ref(`products/${produkToDelete}`).update({
                        status: 'nonaktif',
                        updated_at: firebase.database.ServerValue.TIMESTAMP
                    });
                    showToast('Produk dinonaktifkan (sudah ada riwayat transaksi)', 'warning');
                } else {
                    // Hapus permanen
                    await database.ref(`products/${produkToDelete}`).remove();
                    showToast('Produk berhasil dihapus', 'success');
                }
                
                closeModal('modal-hapus');
                produkToDelete = null;
                loadProduk();
                
            } catch (error) {
                console.error('Error hapus produk:', error);
                alert('Gagal menghapus produk');
            }
        });
    }
});

window.editProduk = editProduk;
window.hapusProduk = hapusProduk;
