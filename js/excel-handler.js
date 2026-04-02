// Excel Handler for Firebase Data
class ExcelHandler {
    constructor() {
        this.workbook = null;
    }

    // Export data to Excel
    exportToExcel(data, headers, filename, sheetName = 'Data') {
        // Format data with headers
        const formattedData = data.map(item => {
            const row = {};
            headers.forEach(header => {
                row[header.label] = item[header.key] || '';
            });
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        
        // Auto-width columns
        const colWidths = headers.map(h => ({ wch: h.width || 15 }));
        ws['!cols'] = colWidths;

        XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
        showNotification('Data berhasil diexport!', 'success');
    }

    // Import data from Excel
    async importFromExcel(file, expectedHeaders) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    
                    // Validate headers
                    if (jsonData.length > 0) {
                        const fileHeaders = Object.keys(jsonData[0]);
                        const missingHeaders = expectedHeaders.filter(h => !fileHeaders.includes(h));
                        
                        if (missingHeaders.length > 0) {
                            reject(new Error(`Header tidak lengkap: ${missingHeaders.join(', ')}`));
                            return;
                        }
                    }
                    
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }

    // Export Laporan Harian
    async exportLaporanHarian(date = getToday()) {
        try {
            const snapshot = await database.ref(`/transactions/${date}`).once('value');
            const transactions = snapshot.val() || {};
            
            const data = Object.values(transactions).map(t => ({
                id: t.id,
                tanggal: formatDate(t.timestamp),
                tipe: t.type,
                total: t.total,
                metode: t.paymentMethod,
                kasir: t.cashierName
            }));

            const headers = [
                { key: 'id', label: 'ID Transaksi', width: 20 },
                { key: 'tanggal', label: 'Tanggal', width: 15 },
                { key: 'tipe', label: 'Tipe', width: 10 },
                { key: 'total', label: 'Total', width: 15 },
                { key: 'metode', label: 'Metode', width: 10 },
                { key: 'kasir', label: 'Kasir', width: 15 }
            ];

            this.exportToExcel(data, headers, `Laporan_Harian_${date}`, 'Laporan');
        } catch (error) {
            showNotification('Gagal export laporan: ' + error.message, 'error');
        }
    }

    // Export Produk
    async exportProduk() {
        try {
            const snapshot = await database.ref('/products').once('value');
            const products = snapshot.val() || {};
            
            const data = Object.values(products).map(p => ({
                id: p.id,
                nama: p.name,
                kategori: p.category,
                hargaModal: p.capitalPrice,
                hargaJual: p.sellingPrice,
                stok: p.stock,
                barcode: p.barcode || ''
            }));

            const headers = [
                { key: 'id', label: 'ID Produk', width: 20 },
                { key: 'nama', label: 'Nama Produk', width: 25 },
                { key: 'kategori', label: 'Kategori', width: 15 },
                { key: 'hargaModal', label: 'Harga Modal', width: 15 },
                { key: 'hargaJual', label: 'Harga Jual', width: 15 },
                { key: 'stok', label: 'Stok', width: 10 },
                { key: 'barcode', label: 'Barcode', width: 15 }
            ];

            this.exportToExcel(data, headers, 'Data_Produk', 'Produk');
        } catch (error) {
            showNotification('Gagal export produk: ' + error.message, 'error');
        }
    }

    // Import Produk
    async importProduk(file) {
        try {
            const expectedHeaders = ['Nama Produk', 'Kategori', 'Harga Modal', 'Harga Jual', 'Stok', 'Barcode'];
            const data = await this.importFromExcel(file, expectedHeaders);
            
            const products = data.map(row => ({
                id: generateId('PRD'),
                name: row['Nama Produk'],
                category: row['Kategori'],
                capitalPrice: parseInt(row['Harga Modal']) || 0,
                sellingPrice: parseInt(row['Harga Jual']) || 0,
                stock: parseInt(row['Stok']) || 0,
                barcode: row['Barcode'] || '',
                createdAt: firebase.database.ServerValue.TIMESTAMP
            }));

            // Save to Firebase
            const updates = {};
            products.forEach(p => {
                updates[`/products/${p.id}`] = p;
            });

            await database.ref().update(updates);
            showNotification(`${products.length} produk berhasil diimport!`, 'success');
            return products;
        } catch (error) {
            showNotification('Gagal import produk: ' + error.message, 'error');
            throw error;
        }
    }

    // Export Pembelian
    async exportPembelian(startDate, endDate) {
        try {
            const snapshot = await database.ref('/purchases').once('value');
            const purchases = snapshot.val() || {};
            
            const filtered = Object.values(purchases).filter(p => {
                const pDate = new Date(p.date).toISOString().split('T')[0];
                return pDate >= startDate && pDate <= endDate;
            });

            const data = filtered.map(p => ({
                id: p.id,
                tanggal: formatDate(p.date),
                supplier: p.supplierName,
                produk: p.productName,
                jumlah: p.quantity,
                harga: p.price,
                total: p.total
            }));

            const headers = [
                { key: 'id', label: 'ID Pembelian', width: 20 },
                { key: 'tanggal', label: 'Tanggal', width: 15 },
                { key: 'supplier', label: 'Supplier', width: 20 },
                { key: 'produk', label: 'Produk', width: 25 },
                { key: 'jumlah', label: 'Jumlah', width: 10 },
                { key: 'harga', label: 'Harga', width: 15 },
                { key: 'total', label: 'Total', width: 15 }
            ];

            this.exportToExcel(data, headers, `Pembelian_${startDate}_${endDate}`, 'Pembelian');
        } catch (error) {
            showNotification('Gagal export pembelian: ' + error.message, 'error');
        }
    }

    // Template untuk import
    downloadTemplate(type) {
        let data = [];
        let headers = [];

        if (type === 'produk') {
            headers = [
                { key: 'nama', label: 'Nama Produk', width: 25 },
                { key: 'kategori', label: 'Kategori', width: 15 },
                { key: 'hargaModal', label: 'Harga Modal', width: 15 },
                { key: 'hargaJual', label: 'Harga Jual', width: 15 },
                { key: 'stok', label: 'Stok', width: 10 },
                { key: 'barcode', label: 'Barcode', width: 15 }
            ];
            data = [
                { nama: 'Contoh Produk', kategori: 'Umum', hargaModal: 10000, hargaJual: 15000, stok: 10, barcode: '123456789' }
            ];
        }

        this.exportToExcel(data, headers, `Template_${type}`, 'Template');
    }
}

// Initialize
const excelHandler = new ExcelHandler();
