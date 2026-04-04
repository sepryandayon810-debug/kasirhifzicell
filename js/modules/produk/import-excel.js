/**
 * Import Excel - WebPOS Modern
 * File: js/modules/produk/import-excel.js
 */

const ImportExcel = {
    elements: {},
    parsedData: [],
    
    init: function() {
        console.log('[ImportExcel] Initializing...');
        this.cacheElements();
        this.setupEventListeners();
        console.log('[ImportExcel] Ready');
    },
    
    cacheElements: function() {
        this.elements = {
            modal: document.getElementById('modal-import'),
            form: document.getElementById('form-import'),
            fileInput: document.getElementById('import-file'),
            dropzone: document.getElementById('import-dropzone'),
            btnClose: document.getElementById('close-import'),
            btnCancel: document.getElementById('cancel-import'),
            btnImport: document.getElementById('start-import'),
            previewContainer: document.getElementById('import-preview'),
            progressContainer: document.getElementById('import-progress'),
            progressBar: document.getElementById('import-progress-bar'),
            progressText: document.getElementById('import-progress-text'),
            statsContainer: document.getElementById('import-stats')
        };
        
        console.log('[ImportExcel] Elements cached:', Object.keys(this.elements));
    },
    
    setupEventListeners: function() {
        const self = this;
        
        // Tombol batal dan tutup
        this.elements.btnClose?.addEventListener('click', () => this.close());
        this.elements.btnCancel?.addEventListener('click', () => this.close());
        
        // Tombol import - PENTING: bind ke this
        this.elements.btnImport?.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[ImportExcel] Import button clicked');
            self.startImport();
        });
        
        // File input change
        this.elements.fileInput?.addEventListener('change', function(e) {
            console.log('[ImportExcel] File selected:', e.target.files);
            self.handleFileSelect(e);
        });
        
        // Dropzone click - trigger file input
        this.elements.dropzone?.addEventListener('click', function(e) {
            // Jangan trigger jika klik tombol import
            if (e.target.closest('#start-import')) return;
            console.log('[ImportExcel] Dropzone clicked');
            self.elements.fileInput?.click();
        });
        
        // Drag and drop events
        this.elements.dropzone?.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('dragover');
        });
        
        this.elements.dropzone?.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('dragover');
        });
        
        this.elements.dropzone?.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('dragover');
            console.log('[ImportExcel] File dropped:', e.dataTransfer.files);
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                self.handleFile(files[0]);
            }
        });
        
        // Reset saat modal dibuka
        document.addEventListener('click', function(e) {
            if (e.target.closest('#btn-import-excel')) {
                console.log('[ImportExcel] Opening modal, resetting...');
                self.reset();
            }
        });
    },
    
    handleFileSelect: function(e) {
        const file = e.target.files[0];
        if (!file) {
            console.log('[ImportExcel] No file selected');
            return;
        }
        this.handleFile(file);
    },
    
    handleFile: function(file) {
        console.log('[ImportExcel] Handling file:', file.name, file.type, file.size);
        
        // Validasi ekstensi
        const validExtensions = ['.xlsx', '.xls'];
        const fileName = file.name.toLowerCase();
        const isValid = validExtensions.some(ext => fileName.endsWith(ext));
        
        if (!isValid) {
            showToast('❌ File harus Excel (.xlsx atau .xls)', 'error');
            console.error('[ImportExcel] Invalid file type:', file.type);
            return;
        }
        
        // Validasi size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('❌ File terlalu besar (max 5MB)', 'error');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                console.log('[ImportExcel] File loaded, parsing...');
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                console.log('[ImportExcel] Sheets found:', workbook.SheetNames);
                
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                
                console.log('[ImportExcel] Parsed rows:', jsonData.length);
                console.log('[ImportExcel] First row sample:', jsonData[0]);
                
                this.parsedData = this.validateData(jsonData);
                this.renderPreview(this.parsedData);
                
            } catch (err) {
                console.error('[ImportExcel] Error parsing Excel:', err);
                showToast('❌ Gagal membaca file Excel: ' + err.message, 'error');
            }
        };
        
        reader.onerror = (err) => {
            console.error('[ImportExcel] FileReader error:', err);
            showToast('❌ Gagal membaca file', 'error');
        };
        
        reader.readAsArrayBuffer(file);
    },
    
    validateData: function(data) {
        console.log('[ImportExcel] Validating data...');
        
        return data.map((row, index) => {
            // Deteksi kolom dengan berbagai nama
            const nama = row['Nama Produk'] || row['nama'] || row['Nama'] || '';
            const kode = row['Kode'] || row['kode'] || '';
            const barcode = row['Barcode'] || row['barcode'] || '';
            const kategori = row['Kategori'] || row['kategori'] || '';
            const satuan = row['Satuan'] || row['satuan'] || 'pcs';
            const hargaModal = parseInt(row['Harga Modal'] || row['harga_modal'] || row['hargaModal'] || 0);
            const hargaJual = parseInt(row['Harga Jual'] || row['harga_jual'] || row['hargaJual'] || 0);
            const stok = parseInt(row['Stok'] || row['stok'] || 0);
            const minStok = parseInt(row['Min Stok'] || row['min_stok'] || row['minStok'] || 5);
            const status = row['Status'] || row['status'] || 'aktif';
            const deskripsi = row['Deskripsi'] || row['deskripsi'] || '';
            
            const isValid = nama.trim() !== '';
            const error = !isValid ? 'Nama produk wajib diisi' : null;
            
            if (index < 3) {
                console.log(`[ImportExcel] Row ${index + 2}:`, { nama, kode, isValid });
            }
            
            return {
                row: index + 2,
                kode: kode,
                barcode: barcode,
                nama: nama,
                kategori: kategori,
                satuan: satuan,
                harga_modal: hargaModal,
                harga_jual: hargaJual,
                stok: stok,
                min_stok: minStok,
                status: status,
                deskripsi: deskripsi,
                valid: isValid,
                error: error
            };
        });
    },
    
    renderPreview: function(data) {
        console.log('[ImportExcel] Rendering preview:', data.length, 'rows');
        
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
                    <h4><i class="fas fa-exclamation-triangle"></i> Baris dengan Error:</h4>
                    <ul>
                        ${invalid.map(d => `<li>Baris ${d.row}: ${d.error}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        if (valid.length > 0) {
            const displayData = valid.slice(0, 5);
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
                            ${displayData.map((d, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td>${d.kode || '-'}</td>
                                    <td>${d.nama}</td>
                                    <td>${d.kategori || '-'}</td>
                                    <td>${this.formatRupiah(d.harga_jual)}</td>
                                    <td>${d.stok}</td>
                                </tr>
                            `).join('')}
                            ${valid.length > 5 ? `
                                <tr>
                                    <td colspan="6" class="more-rows">
                                        ... dan ${valid.length - 5} produk lainnya
                                    </td>
                                </tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        this.elements.previewContainer.innerHTML = html;
        this.elements.previewContainer.style.display = 'block';
        
        // Enable/disable tombol import
        if (this.elements.btnImport) {
            this.elements.btnImport.disabled = valid.length === 0;
            console.log('[ImportExcel] Import button disabled:', valid.length === 0);
        }
    },
    
    startImport: async function() {
        console.log('[ImportExcel] Starting import...');
        
        const validData = this.parsedData.filter(d => d.valid);
        if (validData.length === 0) {
            showToast('❌ Tidak ada data valid untuk diimport', 'error');
            return;
        }
        
        // Tampilkan progress
        this.elements.progressContainer.style.display = 'block';
        this.elements.btnImport.disabled = true;
        this.elements.btnImport.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';
        
        let success = 0;
        let failed = 0;
        const errors = [];
        
        for (let i = 0; i < validData.length; i++) {
            const item = validData[i];
            const progress = Math.round(((i + 1) / validData.length) * 100);
            
            // Update progress UI
            if (this.elements.progressBar) {
                this.elements.progressBar.style.width = `${progress}%`;
            }
            if (this.elements.progressText) {
                this.elements.progressText.textContent = `Memproses ${i + 1} dari ${validData.length}... (${progress}%)`;
            }
            
            try {
                // Generate kode jika kosong
                if (!item.kode) {
                    const timestamp = Date.now().toString(36).toUpperCase();
                    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
                    item.kode = `PRD-${timestamp}${random}`;
                }
                
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
                console.log(`[ImportExcel] Success: ${item.nama}`);
                
            } catch (err) {
                failed++;
                errors.push(`Baris ${item.row}: ${err.message}`);
                console.error(`[ImportExcel] Failed row ${item.row}:`, err);
            }
            
            // Delay kecil untuk UI tidak freeze
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Tampilkan hasil
        this.renderResults(success, failed, errors);
        
        // Notifikasi
        if (success > 0) {
            showToast(`✅ ${success} produk berhasil diimport`, 'success');
        }
        if (failed > 0) {
            showToast(`❌ ${failed} produk gagal diimport`, 'error');
        }
        
        // Reset button
        this.elements.btnImport.innerHTML = '<i class="fas fa-check"></i> Selesai';
        this.elements.btnImport.disabled = false;
        
        // Refresh data produk
        if (window.ProdukMain) {
            window.ProdukMain.initRealtimeListener();
        }
    },
    
    renderResults: function(success, failed, errors) {
        let html = `
            <div class="import-results">
                <div class="result-item ${failed === 0 ? 'success' : 'warning'}">
                    <i class="fas ${failed === 0 ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                    <span>${success} berhasil, ${failed} gagal</span>
                </div>
        `;
        
        if (failed > 0 && errors.length > 0) {
            html += `
                <div class="error-details">
                    <p><strong>Error detail:</strong></p>
                    ${errors.slice(0, 5).map(e => `<p>• ${e}</p>`).join('')}
                    ${errors.length > 5 ? `<p>... dan ${errors.length - 5} error lainnya</p>` : ''}
                </div>
            `;
        }
        
        html += '</div>';
        
        this.elements.statsContainer.innerHTML = html;
    },
    
    close: function() {
        console.log('[ImportExcel] Closing modal');
        this.reset();
        
        const modal = document.getElementById('modal-import');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
        document.getElementById('overlay')?.classList.remove('active');
    },
    
    reset: function() {
        console.log('[ImportExcel] Resetting...');
        this.parsedData = [];
        
        if (this.elements.fileInput) {
            this.elements.fileInput.value = '';
        }
        if (this.elements.previewContainer) {
            this.elements.previewContainer.innerHTML = '';
            this.elements.previewContainer.style.display = 'none';
        }
        if (this.elements.progressContainer) {
            this.elements.progressContainer.style.display = 'none';
        }
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = '0%';
        }
        if (this.elements.progressText) {
            this.elements.progressText.textContent = '';
        }
        if (this.elements.statsContainer) {
            this.elements.statsContainer.innerHTML = '';
        }
        if (this.elements.btnImport) {
            this.elements.btnImport.disabled = true;
            this.elements.btnImport.innerHTML = '<i class="fas fa-file-import"></i> Import Data';
        }
    },
    
    formatRupiah: function(angka) {
        if (!angka) return 'Rp 0';
        return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('[ImportExcel] DOM ready, waiting for init...');
    // Delay sedikit untuk memastikan elemen sudah ada
    setTimeout(() => ImportExcel.init(), 100);
});
