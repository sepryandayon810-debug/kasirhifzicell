/**
 * Supplier Manager Module
 */

let supplierData = [];

async function loadSuppliers() {
    try {
        const snapshot = await database.ref('suppliers').orderByChild('nama').once('value');
        const select = document.getElementById('select-supplier');
        
        // Simpan opsi pertama
        const firstOption = select?.options[0];
        
        if (select) {
            select.innerHTML = '';
            if (firstOption) select.appendChild(firstOption);
        }
        
        supplierData = [];
        
        snapshot.forEach(child => {
            const supplier = {
                id: child.key,
                ...child.val()
            };
            supplierData.push(supplier);
            
            if (select) {
                const option = document.createElement('option');
                option.value = child.key;
                option.textContent = supplier.nama;
                select.appendChild(option);
            }
        });
        
    } catch (error) {
        console.error('Error loading suppliers:', error);
    }
}

async function simpanSupplier() {
    const nama = document.getElementById('supplier-nama').value.trim();
    const telepon = document.getElementById('supplier-telepon').value.trim();
    const email = document.getElementById('supplier-email').value.trim();
    const alamat = document.getElementById('supplier-alamat').value.trim();
    
    if (!nama) {
        alert('Nama supplier wajib diisi');
        return;
    }
    
    try {
        // Cek duplikat
        const snapshot = await database.ref('suppliers')
            .orderByChild('nama')
            .equalTo(nama)
            .once('value');
        
        if (snapshot.exists()) {
            alert('Supplier dengan nama tersebut sudah ada');
            return;
        }
        
        const supplierData = {
            nama: nama,
            telepon: telepon,
            email: email,
            alamat: alamat,
            created_at: firebase.database.ServerValue.TIMESTAMP
        };
        
        const newRef = await database.ref('suppliers').push(supplierData);
        
        showToast('Supplier berhasil ditambahkan', 'success');
        
        // Reset form dan tutup modal
        document.getElementById('supplier-nama').value = '';
        document.getElementById('supplier-telepon').value = '';
        document.getElementById('supplier-email').value = '';
        document.getElementById('supplier-alamat').value = '';
        closeModal('modal-supplier');
        
        // Refresh supplier list dan pilih yang baru
        await loadSuppliers();
        document.getElementById('select-supplier').value = newRef.key;
        
    } catch (error) {
        console.error('Error simpan supplier:', error);
        alert('Gagal menyimpan supplier: ' + error.message);
    }
}

async function editSupplier(supplierId) {
    const supplier = supplierData.find(s => s.id === supplierId);
    if (!supplier) return;
    
    const namaBaru = prompt('Edit nama supplier:', supplier.nama);
    if (!namaBaru || namaBaru === supplier.nama) return;
    
    try {
        await database.ref(`suppliers/${supplierId}`).update({
            nama: namaBaru.trim(),
            updated_at: firebase.database.ServerValue.TIMESTAMP
        });
        
        loadSuppliers();
        showToast('Supplier berhasil diupdate', 'success');
        
    } catch (error) {
        console.error('Error edit supplier:', error);
        alert('Gagal mengupdate supplier');
    }
}

async function hapusSupplier(supplierId) {
    if (!confirm('Hapus supplier ini?')) return;
    
    try {
        // Cek apakah supplier punya riwayat pembelian
        const pembelianSnapshot = await database.ref('pembelian')
            .orderByChild('supplier_id')
            .equalTo(supplierId)
            .limitToFirst(1)
            .once('value');
        
        if (pebelianSnapshot.exists()) {
            alert('Supplier tidak dapat dihapus karena memiliki riwayat pembelian');
            return;
        }
        
        await database.ref(`suppliers/${supplierId}`).remove();
        
        loadSuppliers();
        showToast('Supplier berhasil dihapus', 'success');
        
    } catch (error) {
        console.error('Error hapus supplier:', error);
        alert('Gagal menghapus supplier');
    }
}

// Get supplier name by ID
function getSupplierName(supplierId) {
    const supplier = supplierData.find(s => s.id === supplierId);
    return supplier ? supplier.nama : '-';
}

document.addEventListener('DOMContentLoaded', function() {
    const btnSimpan = document.getElementById('btn-simpan-supplier');
    if (btnSimpan) {
        btnSimpan.addEventListener('click', simpanSupplier);
    }
    
    // Enter key di nama supplier
    const namaInput = document.getElementById('supplier-nama');
    if (namaInput) {
        namaInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') simpanSupplier();
        });
    }
});

window.loadSuppliers = loadSuppliers;
window.simpanSupplier = simpanSupplier;
window.editSupplier = editSupplier;
window.hapusSupplier = hapusSupplier;
window.getSupplierName = getSupplierName;
window.supplierData = supplierData;
