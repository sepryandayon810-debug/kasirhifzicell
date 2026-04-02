/**
 * Import Excel Module
 */

let importData = [];

document.addEventListener('DOMContentLoaded', function() {
    // File input
    const fileInput = document.getElementById('file-import');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileImport);
    }
    
    // Drop area
    const dropArea = document.getElementById('drop-area');
    if (dropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false);
        });
        
        dropArea.addEventListener('drop', handleDrop, false);
    }
    
    // Download template
    const btnTemplate = document.getElementById('btn-download-template');
    if (btnTemplate) {
        btnTemplate.addEventListener('click', downloadTemplate);
    }
    
    // Proses import
    const btnProses = document.getElementById('btn-proses-import');
    if (btnProses) {
        btnProses.addEventListener('click', prosesImport);
    }
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFileImport(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Ambil sheet pertama
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        if (jsonData.length === 0) {
            alert('File Excel kosong');
            return;
        }
        
        // Validasi kolom
        const requiredColumns = ['kode', 'nama', 'harga_modal', 'harga_jual', 'stok'];
        const firstRow = jsonData[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));
        
        if (missingColumns.length > 0) {
            alert(`Kolom wajib tidak ditemukan: ${missingColumns.join(', ')}`);
            return;
        }
        
        importData = jsonData.map((row, index) => ({
            row: index + 2, // +2 karena header di baris 1, data mulai baris 2
            kode: String(row.kode || ''),
            barcode: String(row.barcode || ''),
            nama: String(row.nama || ''),
            kategori: String(row.kategori || ''),
            satuan: String(row.satuan || 'pcs'),
            harga_modal: parseInt(row.harga_modal) || 0,
            harga_jual: parseInt(row.harga_jual) || 0,
            stok: parseInt(row.stok) || 0,
            deskripsi: String(row.deskripsi || ''),
            status: row.status || 'aktif'
        }));
        
        renderPreview();
    };
    
    reader.readAsArrayBuffer(file);
}

function renderPreview() {
    const previewDiv = document.getElementById('import-preview');
    const table = document.getElementById('preview-table');
    const status = document.getElementById('import-status');
    const btnProses = document.getElementById('btn-proses-import');
    
    // Render header
    const headers = ['No', 'Kode', 'Nama', 'Kategori', 'Harga Modal', 'Harga Jual', 'Stok', 'Status'];
    table.querySelector('thead').innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    
    // Render body (max 10 rows)
    const displayData = importData.slice(0, 10);
    table.querySelector('tbody').innerHTML = displayData.map((row, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td>${row.kode}</td>
            <td>${row.nama}</td>
            <td>${row.kategori || '-'}</td>
            <td>${formatRupiah(row.harga_modal)}</td>
            <td>${formatRupiah(row.harga_jual)}</td>
            <td>${row.stok}</td>
            <td><span class="badge badge-${row.status === 'aktif' ? 'success' : 'secondary'}">${row.status}</span></td>
        </tr>
    `).join('');
    
    // Status
    const validCount = importData.filter(r => r.kode && r.nama && r.harga_jual > r.harga_modal).length;
    status.innerHTML = `
        Total data: <strong>${importData.length}</strong> baris<br>
        Data valid: <strong style="color: var(--success-color);">${validCount}</strong> baris
        ${importData.length > 10 ? `<br><small>Menampilkan 10 dari ${importData.length} baris</small>` : ''}
    `;
    
    // Show elements
    previewDiv.style.display = 'block';
    btnProses.style.display = 'inline-flex';
}

async function prosesImport() {
    const validData = importData.filter(r => r.kode && r.nama && r.harga_jual > 0);
    
    if (validData.length === 0) {
        alert('Tidak ada data valid untuk diimport');
        return;
    }
    
    const btnProses = document.getElementById('btn-proses-import');
    btnProses.disabled = true;
    btnProses.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengimport...';
    
    try {
        let successCount = 0;
        let updateCount = 0;
        
        for (const item of validData) {
            // Cek apakah kode sudah ada
            const snapshot = await database.ref('products').orderByChild('kode').equalTo(item.kode).once('value');
            
            if (snapshot.exists()) {
                // Update existing
                snapshot.forEach(child => {
                    database.ref(`products/${child.key}`).update({
                        ...item,
                        updated_at: firebase.database.ServerValue.TIMESTAMP
                    });
                });
                updateCount++;
            } else {
                // Insert new
                await database.ref('products').push({
                    ...item,
                    created_at: firebase.database.ServerValue.TIMESTAMP,
                    terjual: 0
                });
                successCount++;
            }
        }
        
        showToast(`Import selesai: ${successCount} baru, ${updateCount} update`, 'success');
        closeModal('modal-import');
        loadProduk();
        
        // Reset
        importData = [];
        document.getElementById('import-preview').style.display = 'none';
        document.getElementById('file-import').value = '';
        
    } catch (error) {
        console.error('Error import:', error);
        alert('Gagal mengimport data: ' + error.message);
    } finally {
        btnProses.disabled = false;
        btnProses.innerHTML = '<i class="fas fa-file-import"></i> Import Data';
    }
}

function downloadTemplate() {
    const template = [
        {
            kode: 'PRD-001',
            barcode: '123456789',
            nama: 'Contoh Produk',
            kategori: 'Elektronik',
            satuan: 'pcs',
            harga_modal: 50000,
            harga_jual: 75000,
            stok: 100,
            deskripsi: 'Deskripsi produk',
            status: 'aktif'
        },
        {
            kode: 'PRD-002',
            barcode: '987654321',
            nama: 'Produk Lain',
            kategori: 'Aksesoris',
            satuan: 'pack',
            harga_modal: 25000,
            harga_jual: 40000,
            stok: 50,
            deskripsi: '',
            status: 'aktif'
        }
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Produk');
    XLSX.writeFile(wb, 'Template_Import_Produk.xlsx');
}

window.handleFileImport = handleFileImport;
window.prosesImport = prosesImport;
window.downloadTemplate = downloadTemplate;
