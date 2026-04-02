/**
 * Riwayat Print Module
 * Print struk and transaction list
 */

function printStruk() {
    if (!currentDetailId) return;
    printStrukById(currentDetailId);
}

async function printStrukById(transaksiId) {
    try {
        const snapshot = await database.ref(`transaksi/${transaksiId}`).once('value');
        const transaksi = snapshot.val();
        
        if (!transaksi) {
            alert('Data transaksi tidak ditemukan');
            return;
        }
        
        // Get toko settings
        const tokoSnapshot = await database.ref('settings/toko').once('value');
        const toko = tokoSnapshot.val() || {};
        
        // Build print content
        const printContent = buildStrukHTML(transaksi, toko);
        
        // Open print window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Auto print after load
        printWindow.onload = function() {
            setTimeout(() => {
                printWindow.print();
                // printWindow.close();
            }, 500);
        };
        
    } catch (error) {
        console.error('Error printing struk:', error);
        alert('Gagal mencetak struk');
    }
}

function buildStrukHTML(transaksi, toko) {
    const tanggal = new Date(transaksi.created_at).toLocaleString('id-ID');
    const items = Object.values(transaksi.items || {});
    
    let itemsHtml = items.map(item => `
        <tr>
            <td style="text-align: left; padding: 3px 0;">
                ${item.nama}<br>
                <small>${item.jumlah} x ${formatRupiah(item.harga_jual)}</small>
            </td>
            <td style="text-align: right; padding: 3px 0;">
                ${formatRupiah(item.subtotal)}
            </td>
        </tr>
    `).join('');
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Struk ${transaksi.kode}</title>
            <style>
                @page { size: 80mm auto; margin: 0; }
                body {
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    width: 80mm;
                    margin: 0 auto;
                    padding: 10px;
                    color: #000;
                }
                .center { text-align: center; }
                .header { margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                .header h2 { margin: 0; font-size: 16px; }
                .header p { margin: 3px 0; font-size: 10px; }
                .info { margin: 10px 0; font-size: 10px; }
                .info-row { display: flex; justify-content: space-between; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                .total { font-weight: bold; font-size: 14px; }
                .footer { margin-top: 15px; text-align: center; font-size: 10px; }
                @media print {
                    body { width: 80mm; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header center">
                <h2>${toko.nama || 'WebPOS'}</h2>
                <p>${toko.alamat || ''}</p>
                <p>Telp: ${toko.telepon || '-'}</p>
            </div>
            
            <div class="info">
                <div class="info-row">
                    <span>No: ${transaksi.kode}</span>
                    <span>${tanggal}</span>
                </div>
                <div class="info-row">
                    <span>Kasir: ${transaksi.created_by || '-'}</span>
                </div>
                <div class="info-row">
                    <span>Pelanggan: ${transaksi.pelanggan?.nama || 'Umum'}</span>
                </div>
            </div>
            
            <div class="divider"></div>
            
            <table>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            
            <div class="divider"></div>
            
            <table>
                <tr>
                    <td>Subtotal</td>
                    <td style="text-align: right;">${formatRupiah(transaksi.subtotal || 0)}</td>
                </tr>
                ${transaksi.diskon > 0 ? `
                <tr>
                    <td>Diskon</td>
                    <td style="text-align: right;">-${formatRupiah(transaksi.diskon)}</td>
                </tr>
                ` : ''}
                ${transaksi.pajak > 0 ? `
                <tr>
                    <td>Pajak (${transaksi.pajak_persen}%)</td>
                    <td style="text-align: right;">${formatRupiah(transaksi.pajak)}</td>
                </tr>
                ` : ''}
                <tr class="total">
                    <td>TOTAL</td>
                    <td style="text-align: right;">${formatRupiah(transaksi.total || 0)}</td>
                </tr>
                ${transaksi.metode_pembayaran === 'tunai' ? `
                <tr>
                    <td>Bayar</td>
                    <td style="text-align: right;">${formatRupiah(transaksi.bayar || 0)}</td>
                </tr>
                <tr>
                    <td>Kembalian</td>
                    <td style="text-align: right;">${formatRupiah(transaksi.kembalian || 0)}</td>
                </tr>
                ` : `
                <tr>
                    <td>Metode</td>
                    <td style="text-align: right;">${(transaksi.metode_pembayaran || 'TUNAI').toUpperCase()}</td>
                </tr>
                `}
            </table>
            
            <div class="divider"></div>
            
            <div class="footer">
                <p>Terima kasih atas kunjungan Anda</p>
                <p>Barang yang sudah dibeli tidak dapat dikembalikan</p>
                <p style="margin-top: 10px;">---</p>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print()" style="padding: 10px 20px; cursor: pointer;">
                    Print Struk
                </button>
            </div>
        </body>
        </html>
    `;
}

function printTransactionList() {
    const filterSummary = RiwayatFilter.getSummary();
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Daftar Transaksi</title>
            <style>
                @page { size: A4 landscape; margin: 15mm; }
                body {
                    font-family: Arial, sans-serif;
                    font-size: 11px;
                    color: #000;
                }
                .header { text-align: center; margin-bottom: 20px; }
                .header h2 { margin: 0; }
                .header p { margin: 5px 0; color: #666; }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f5f5f5;
                    font-weight: bold;
                }
                .text-right { text-align: right; }
                .footer {
                    margin-top: 20px;
                    text-align: right;
                    font-weight: bold;
                }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>DAFTAR TRANSAKSI</h2>
                <p>Periode: ${filterSummary.dateRange}</p>
                <p>${filterSummary.status} | ${filterSummary.metode}</p>
                <p>Total: ${filterSummary.totalRecords} transaksi</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Kode</th>
                        <th>Tanggal</th>
                        <th>Pelanggan</th>
                        <th>Item</th>
                        <th>Metode</th>
                        <th>Total</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredData.map((t, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${t.kode || '-'}</td>
                            <td>${new Date(t.created_at).toLocaleString('id-ID')}</td>
                            <td>${t.pelanggan?.nama || 'Umum'}</td>
                            <td>${Object.keys(t.items || {}).length}</td>
                            <td>${(t.metode_pembayaran || 'TUNAI').toUpperCase()}</td>
                            <td class="text-right">${formatRupiah(t.total || 0)}</td>
                            <td>${(t.status || 'SUKSES').toUpperCase()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                <p>Total Penjualan: ${formatRupiah(filteredData.reduce((sum, t) => sum + (t.total || 0), 0))}</p>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 30px;">
                <button onclick="window.print()" style="padding: 10px 20px; cursor: pointer;">
                    Print Daftar
                </button>
            </div>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
}

window.printStruk = printStruk;
window.printStrukById = printStrukById;
window.buildStrukHTML = buildStrukHTML;
window.printTransactionList = printTransactionList;
