/**
 * Riwayat Export Module
 * Export to Excel functionality
 */

function exportToExcel() {
    if (filteredData.length === 0) {
        alert('Tidak ada data untuk diexport');
        return;
    }
    
    try {
        // Prepare data for Excel
        const exportData = filteredData.map((t, index) => {
            const items = Object.values(t.items || {});
            const itemNames = items.map(i => i.nama).join(', ');
            const totalQty = items.reduce((sum, i) => sum + (i.jumlah || 0), 0);
            
            return {
                'No': index + 1,
                'Kode Transaksi': t.kode || '-',
                'Tanggal': new Date(t.created_at).toLocaleDateString('id-ID'),
                'Waktu': new Date(t.created_at).toLocaleTimeString('id-ID'),
                'Pelanggan': t.pelanggan?.nama || 'Umum',
                'Telepon': t.pelanggan?.telepon || '-',
                'Jumlah Item': items.length,
                'Total Qty': totalQty,
                'Metode Pembayaran': (t.metode_pembayaran || 'TUNAI').toUpperCase(),
                'Subtotal': t.subtotal || 0,
                'Diskon': t.diskon || 0,
                'Pajak': t.pajak || 0,
                'Total': t.total || 0,
                'Bayar': t.bayar || 0,
                'Kembalian': t.kembalian || 0,
                'Status': (t.status || 'SUKSES').toUpperCase(),
                'Operator': t.created_by || '-',
                'Catatan': t.catatan || '-',
                'Detail Item': itemNames
            };
        });
        
        // Calculate totals
        const totals = {
            'No': '',
            'Kode Transaksi': 'TOTAL',
            'Tanggal': '',
            'Waktu': '',
            'Pelanggan': '',
            'Telepon': '',
            'Jumlah Item': exportData.reduce((sum, d) => sum + d['Jumlah Item'], 0),
            'Total Qty': exportData.reduce((sum, d) => sum + d['Total Qty'], 0),
            'Metode Pembayaran': '',
            'Subtotal': exportData.reduce((sum, d) => sum + d['Subtotal'], 0),
            'Diskon': exportData.reduce((sum, d) => sum + d['Diskon'], 0),
            'Pajak': exportData.reduce((sum, d) => sum + d['Pajak'], 0),
            'Total': exportData.reduce((sum, d) => sum + d['Total'], 0),
            'Bayar': exportData.reduce((sum, d) => sum + d['Bayar'], 0),
            'Kembalian': exportData.reduce((sum, d) => sum + d['Kembalian'], 0),
            'Status': '',
            'Operator': '',
            'Catatan': '',
            'Detail Item': ''
        };
        
        exportData.push(totals);
        
        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // Set column widths
        const colWidths = [
            { wch: 5 },   // No
            { wch: 20 },  // Kode
            { wch: 12 },  // Tanggal
            { wch: 10 },  // Waktu
            { wch: 20 },  // Pelanggan
            { wch: 15 },  // Telepon
            { wch: 12 },  // Jumlah Item
            { wch: 10 },  // Total Qty
            { wch: 15 },  // Metode
            { wch: 15 },  // Subtotal
            { wch: 12 },  // Diskon
            { wch: 12 },  // Pajak
            { wch: 15 },  // Total
            { wch: 15 },  // Bayar
            { wch: 12 },  // Kembalian
            { wch: 12 },  // Status
            { wch: 15 },  // Operator
            { wch: 30 },  // Catatan
            { wch: 50 }   // Detail Item
        ];
        ws['!cols'] = colWidths;
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');
        
        // Generate filename
        const startDate = document.getElementById('filter-start-date')?.value || 'all';
        const endDate = document.getElementById('filter-end-date')?.value || 'all';
        const filename = `Transaksi_${startDate}_sd_${endDate}.xlsx`;
        
        // Save file
        XLSX.writeFile(wb, filename);
        
        showToast('Data berhasil diexport ke Excel', 'success');
        
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('Gagal mengexport data: ' + error.message);
    }
}

// Export detailed items (one row per item)
function exportDetailedExcel() {
    if (filteredData.length === 0) {
        alert('Tidak ada data untuk diexport');
        return;
    }
    
    try {
        const exportData = [];
        
        filteredData.forEach((t, tIndex) => {
            const items = Object.entries(t.items || {});
            
            if (items.length === 0) {
                exportData.push({
                    'No Transaksi': tIndex + 1,
                    'Kode Transaksi': t.kode || '-',
                    'Tanggal': new Date(t.created_at).toLocaleDateString('id-ID'),
                    'Pelanggan': t.pelanggan?.nama || 'Umum',
                    'Kode Produk': '-',
                    'Nama Produk': '-',
                    'Qty': 0,
                    'Harga': 0,
                    'Subtotal': 0,
                    'Total Transaksi': t.total || 0
                });
            } else {
                items.forEach(([key, item], iIndex) => {
                    exportData.push({
                        'No Transaksi': tIndex + 1,
                        'Kode Transaksi': t.kode || '-',
                        'Tanggal': new Date(t.created_at).toLocaleDateString('id-ID'),
                        'Pelanggan': t.pelanggan?.nama || 'Umum',
                        'Kode Produk': item.kode || '-',
                        'Nama Produk': item.nama,
                        'Qty': item.jumlah,
                        'Harga': item.harga_jual,
                        'Subtotal': item.subtotal,
                        'Total Transaksi': iIndex === 0 ? (t.total || 0) : ''
                    });
                });
            }
        });
        
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Detail Transaksi');
        
        const startDate = document.getElementById('filter-start-date')?.value || 'all';
        const endDate = document.getElementById('filter-end-date')?.value || 'all';
        const filename = `Detail_Transaksi_${startDate}_sd_${endDate}.xlsx`;
        
        XLSX.writeFile(wb, filename);
        showToast('Data detail berhasil diexport', 'success');
        
    } catch (error) {
        console.error('Error exporting detailed Excel:', error);
        alert('Gagal mengexport data');
    }
}

window.exportToExcel = exportToExcel;
window.exportDetailedExcel = exportDetailedExcel;
