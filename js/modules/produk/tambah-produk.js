/**
 * Tambah Produk Module
 */

let selectedImageFile = null;
let selectedImageBase64 = null;

document.addEventListener('DOMContentLoaded', function() {
    // Image upload
    const fileInput = document.getElementById('produk-gambar');
    if (fileInput) {
        fileInput.addEventListener('change', handleImageSelect);
    }
    
    // Hapus gambar
    const btnHapusGambar = document.getElementById('btn-hapus-gambar');
    if (btnHapusGambar) {
        btnHapusGambar.addEventListener('click', hapusGambar);
    }
    
    // Simpan produk
    const btnSimpan = document.getElementById('btn-simpan-produk');
    if (btnSimpan) {
        btnSimpan.addEventListener('click', simpanProduk);
    }
    
    // Auto generate kode
    const kodeInput = document.getElementById('produk-kode');
    if (kodeInput && !kodeInput.value) {
        generateKodeProduk();
    }
});

function generateKodeProduk() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const kodeInput = document.getElementById('produk-kode');
    if (kodeInput) {
        kodeInput.value = `PRD-${timestamp}${random}`;
    }
}

function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validasi ukuran (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran gambar maksimal 2MB');
        return;
    }
    
    selectedImageFile = file;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        selectedImageBase64 = event.target.result;
        
        const preview = document.getElementById('image-preview');
        preview.innerHTML = `<img src="${selectedImageBase64}" alt="Preview">`;
        preview.classList.add('has-image');
        
        document.getElementById('btn-hapus-gambar').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function hapusGambar() {
    selectedImageFile = null;
    selectedImageBase64 = null;
    
    const preview = document.getElementById('image-preview');
    preview.innerHTML = '<i class="fas fa-image"></i><span>Preview</span>';
    preview.classList.remove('has-image');
    
    document.getElementById('produk-gambar').value = '';
    document.getElementById('btn-hapus-gambar').style.display = 'none';
}

async function simpanProduk() {
    // Validasi
    const kode = document.getElementById('produk-kode').value.trim();
    const nama = document.getElementById('produk-nama').value.trim();
    const kategori = document.getElementById('produk-kategori').value;
    const hargaModal = parseInt(document.getElementById('produk-harga-modal').value) || 0;
    const hargaJual = parseInt(document.getElementById('produk-harga-jual').value) || 0;
    const stok = parseInt(document.getElementById('produk-stok').value) || 0;
    
    if (!kode || !nama || !kategori) {
        alert('Kode, nama, dan kategori wajib diisi');
        return;
    }
    
    if (hargaJual <= hargaModal) {
        alert('Harga jual harus lebih besar dari harga modal');
        return;
    }
    
    const btnSimpan = document.getElementById('btn-simpan-produk');
    btnSimpan.disabled = true;
    btnSimpan.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    
    try {
        const produkId = document.getElementById('produk-id').value;
        const isEdit = !!produkId;
        
        // Upload gambar jika ada
        let gambarUrl = null;
        if (selectedImageBase64) {
            gambarUrl = await uploadGambar(selectedImageBase64, kode);
        }
        
        // Data produk
        const produkData = {
            kode: kode,
            barcode: document.getElementById('produk-barcode').value.trim(),
            nama: nama,
            kategori: kategori,
            satuan: document.getElementById('produk-satuan').value,
            harga_modal: hargaModal,
            harga_jual: hargaJual,
            stok: stok,
            deskripsi: document.getElementById('produk-deskripsi').value.trim(),
            status: document.getElementById('produk-status').value,
            updated_at: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Tambah gambar jika ada
        if (gambarUrl) {
            produkData.gambar = gambarUrl;
        } else if (isEdit) {
            // Jika edit dan tidak upload gambar baru, biarkan gambar lama
            // (akan dihandle di edit-produk.js)
        }
        
        if (!isEdit) {
            // Tambah produk baru
            produkData.created_at = firebase.database.ServerValue.TIMESTAMP;
            produkData.terjual = 0;
            
            const newRef = database.ref('products').push();
            await newRef.set(produkData);
            
            showToast('Produk berhasil ditambahkan', 'success');
        } else {
            // Update produk existing
            await database.ref(`products/${produkId}`).update(produkData);
            showToast('Produk berhasil diupdate', 'success');
        }
        
        // Reset dan tutup modal
        resetFormProduk();
        closeModal('modal-produk');
        
        // Refresh data
        loadProduk();
        
    } catch (error) {
        console.error('Error simpan produk:', error);
        alert('Gagal menyimpan produk: ' + error.message);
    } finally {
        btnSimpan.disabled = false;
        btnSimpan.innerHTML = 'Simpan Produk';
    }
}

async function uploadGambar(base64, kodeProduk) {
    try {
        // Convert base64 to blob
        const response = await fetch(base64);
        const blob = await response.blob();
        
        // Upload ke Firebase Storage
        const filename = `produk/${kodeProduk}_${Date.now()}.jpg`;
        const ref = storage.ref(filename);
        
        await ref.put(blob);
        const url = await ref.getDownloadURL();
        
        return url;
    } catch (error) {
        console.error('Error upload gambar:', error);
        throw error;
    }
}

window.handleImageSelect = handleImageSelect;
window.hapusGambar = hapusGambar;
window.simpanProduk = simpanProduk;
