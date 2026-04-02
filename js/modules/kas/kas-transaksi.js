async function simpanTransaksiKas() {
    const tipe = document.querySelector('input[name="tipe-kas"]:checked').value;
    const kategori = document.getElementById('kategori-kas').value;
    const jumlah = parseFloat(document.getElementById('jumlah-kas').value) || 0;
    const keterangan = document.getElementById('keterangan-kas').value.trim();

    if (!kategori) {
        alert('Pilih kategori transaksi');
        return;
    }
    if (jumlah <= 0) {
        alert('Masukkan jumlah yang valid');
        return;
    }

    try {
        const data = {
            tipe: tipe,
            kategori: kategori,
            jumlah: jumlah,
            keterangan: keterangan,
            created_at: firebase.database.ServerValue.TIMESTAMP,
            created_by: auth.currentUser?.uid || 'unknown'
        };

        await database.ref('kas').push(data);
        showToast('Transaksi kas berhasil disimpan', 'success');
        
        document.getElementById('kategori-kas').value = '';
        document.getElementById('jumlah-kas').value = '';
        document.getElementById('keterangan-kas').value = '';
        
        loadKasData();
    } catch (error) {
        console.error('Error saving kas:', error);
        alert('Gagal menyimpan transaksi');
    }
}

window.simpanTransaksiKas = simpanTransaksiKas;
