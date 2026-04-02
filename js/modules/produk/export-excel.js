/**
 * Export Excel Module
 */

function exportProdukToExcel() {
    if (produkData.length === 0) {
        alert('Tidak ada data untuk diexport');
        return;
    }
    
    // Prepare data
    const exportData = produkData.map(p => ({
        'Kode': p.kode || '',
        'Barcode': p.barcode || '',
        'Nama Produk': p.nama || '',
        'Kategori': p.kategori || '',
        'Satuan': p.satuan || 'pcs',
        'Harga Modal': p.harga_modal || 0,
        'Harga Jual': p.harga_jual || 0,
        'Stok': p.stok || 0,
        'Terjual': p.terjual || 0,
        'Status': p.status || 'aktif',
        'Deskripsi': p.deskripsi || ''
    }));
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    ws['!cols'] = [
        { wch: 15 }, // Kode
        { wch: 15 }, // Barcode
        { wch: 30 }, // Nama
        { wch: 15 }, // Kategori
        { wch: 10 }, // Satuan
        { wch: 15 }, // Harga Modal
        { wch: 15 }, // Harga Jual
        { wch: 10 }, // Stok
        { wch: 10 }, // Terjual
        { wch: 10 }, // Status
        { wch: 40 }  // Deskripsi
    ];
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Produk');
    
    // Generate filename dengan tanggal
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Data_Produk_${dateStr}.xlsx`;
    
    // Download
    XLSX.writeFile(wb, filename);
    
    showToast(`Data berhasil diexport (${exportData.length} produk)`, 'success');
}

window.exportProdukToExcel = exportProdukToExcel;
