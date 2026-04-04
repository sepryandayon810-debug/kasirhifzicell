/**
 * Import Excel - WebPOS Modern
 * File: js/modules/produk/import-excel.js
 */

const ImportExcel = {
    elements: {},
    parsedData: [],
    
    init: function() {
        this.cacheElements();
        this.setupEventListeners();
    },
    
    cacheElements: function() {
        this.elements = {
            modal: document.getElementById('modal-import'),
            form: document.getElementById('form-import'),
            fileInput: document.getElementById('import-file'),
            btnClose: document.getElementById('close-import'),
            btnCancel: document.getElementById('cancel-import'),
            btnImport: document.getElementById('start-import'),
            previewContainer: document.getElementById('import-preview'),
            progressContainer: document.getElementById('import-progress'),
            progressBar: document.getElementById('import-progress-bar'),
            progressText: document.getElementById('import-progress-text'),
            statsContainer: document.getElementById('import-stats')
        };
    },
    
    setupEventListeners: function() {
        this.elements.btnClose?.addEventListener('click', () => this.close());
        this.elements.btnCancel?.addEventListener('click', () => this.close());
        this.elements.btnImport?.addEventListener('click', () => this.startImport());
        
        this.elements.fileInput?.addEventListener('change', (e) => this.handleFileSelect(e));
    },
    
    handleFileSelect: function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            showToast('❌ File harus Excel (.xlsx atau .xls)', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                
                this.parsedData = this.validateData(jsonData);
                this.renderPreview(this.parsedData);
                
            } catch (err) {
                console.error('Error parsing Excel:', err);
                showToast('❌ Gagal membaca file Excel', 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    },
    
    validateData: function(data) {
        return data.map((row, index) => ({
            row: index + 2, // Excel row number (1-based + header)
            kode: row['Kode'] || row['kode'] || '',
            barcode: row['Barcode'] || row['barcode'] || '',
            nama: row['Nama Produk'] || row['nama'] || row['Nama'] || '',
            kategori: row['Kategori'] || row['kategori'] || '',
            satuan: row['Satuan'] || row['satuan'] || 'pcs',
            harga_modal: parseInt(row['Harga Modal'] || row['harga_modal'] || 0),
            harga_jual: parseInt(row['Harga Jual'] || row['harga_jual'] || 0),
            stok: parseInt(row['Stok'] || row['stok'] || 0),
            min_stok: parseInt(row['Min Stok'] || row['min_stok'] || 5),
            status: row['Status'] || row['status'] || 'aktif',
            deskripsi: row['Deskripsi'] || row['deskripsi'] || '',
            valid: !!(row['Nama Produk'] || row['nama'] || row['Nama']),
            error: !(row['Nama Produk'] || row['nama'] || row['Nama']) ? 'Nama produk wajib diisi' : null
        }));
    },
    
    renderPreview: function(data) {
        const valid = data.filter(d => d.valid);
        const invalid = data.filter(d => !d.valid);
        
        let html = `
            <div class="import-summary">
                <div class="summary-item success">
                    <span class="count">${valid.length}</span>
                    <span class="label">Valid</span>
                </div>
                <div class="summary-item error">
                    <span class="count">${invalid.length}</span>
                    <span class="label">Error</span>
                </div>
                <div class="summary-item total">
                    <span class="count">${data.length}</span>
                    <span class="label">Total</span>
                </div>
            </div>
        `;
        
        if (invalid.length > 0) {
            html += `
                <div class="invalid-rows">
                    <h4>Baris dengan Error:</h4>
                    <ul>
                        ${invalid.map(d => `<li>Baris ${d.row}: ${d.error}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        if (valid.length > 0) {
            html += `
                <div class="preview-table-container">
                    <table class="preview-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Kode</th>
                                <th>Nama</th>
                                <th>Kategori</th>
                                <th>Harga Jual</th>
                                <th>Stok</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${valid.slice(0, 5).map((d, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td>${d.kode || '-'}</td>
                                    <td>${d.nama}</td>
                                    <td>${d.kategori || '-'}</td>
                                    <td>${this.formatRupiah(d.harga_jual)}</td>
                                    <td>${d.stok}</td>
                                </tr>
                            `).join('')}
                            ${valid.length > 5 ? `<tr><td colspan="6" class="more-rows">... dan ${valid.length - 5} produk lainnya</td></tr>` : ''}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        this.elements.previewContainer.innerHTML = html;
        this.elements.btnImport.disabled = valid.length === 0;
        this.elements.btnImport.style.display = valid.length > 0 ? 'block' : 'none';
    },
    
    async startImport() {
        const validData = this.parsedData.filter(d => d.valid);
        if (validData.length === 0) return;
        
        this.elements.progressContainer.style.display = 'block';
        this.elements.btnImport.disabled = true;
        
        let success = 0;
        let failed = 0;
        const errors = [];
        
        for (let i = 0; i < validData.length; i++) {
            const item = validData[i];
            const progress = ((i + 1) / validData.length) * 100;
            
            this.elements.progressBar.style.width = `${progress}%`;
            this.elements.progressText.textContent = `Memproses ${i + 1} dari ${validData.length}...`;
            
            try {
                // Generate kode if empty
                if (!item.kode) {
                    const timestamp = Date.now().toString(36).toUpperCase();
                    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
                    item.kode = `PRD-${timestamp}${random}`;
                }
                
                // Prepare data
                const data = {
                    kode: item.kode,
                    barcode: item.barcode,
                    nama: item.nama,
                    kategori: item.kategori,
                    satuan: item.satuan,
                    harga_modal: item.harga_modal,
                    harga_jual: item.harga_jual,
                    stok: item.stok,
                    min_stok: item.min_stok,
                    status: item.status,
                    deskripsi: item.deskripsi,
                    terjual: 0,
                    created_at: Date.now(),
                    updated_at: Date.now()
                };
                
                await firebase.database().ref('produk').push(data);
                success++;
                
            } catch (err) {
                failed++;
                errors.push(`Baris ${item.row}: ${err.message}`);
                console.error('Import error:', err);
            }
            
            // Small delay to prevent blocking
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Show results
        this.elements.statsContainer.innerHTML = `
            <div class="import-results">
                <div class="result-item success">
                    <i class="fas fa-check-circle"></i>
                    <span>${success} berhasil diimport</span>
                </div>
                ${failed > 0 ? `
                    <div class="result-item error">
                        <i class="fas fa-times-circle"></i>
                        <span>${failed} gagal diimport</span>
                    </div>
                    <div class="error-details">
                        ${errors.map(e => `<p>${e}</p>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        this.elements.progressText.textContent = 'Import selesai!';
        this.elements.btnImport.innerHTML = '<i class="fas fa-check"></i> Selesai';
        this.elements.btnImport.disabled = false;
        
        showToast(`✅ ${success} produk berhasil diimport`, 'success');
        
        if (failed > 0) {
            showToast(`❌ ${failed} produk gagal diimport`, 'error');
        }
    },
    
    close: function() {
        this.reset();
        ProdukMain.closeModal('modal-import');
    },
    
    reset: function() {
        this.parsedData = [];
        this.elements.fileInput.value = '';
        this.elements.previewContainer.innerHTML = '';
        this.elements.progressContainer.style.display = 'none';
        this.elements.progressBar.style.width = '0%';
        this.elements.progressText.textContent = '';
        this.elements.statsContainer.innerHTML = '';
        this.elements.btnImport.disabled = true;
        this.elements.btnImport.innerHTML = '<i class="fas fa-file-import"></i> Import Data';
        this.elements.btnImport.style.display = 'block';
    },
    
    formatRupiah: function(angka) {
        if (!angka) return 'Rp 0';
        return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => ImportExcel.init());
