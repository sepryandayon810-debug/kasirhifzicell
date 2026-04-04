/**
 * Barcode Scanner - WebPOS Modern
 * File: js/modules/produk/scanner-barcode.js
 */

const BarcodeScanner = {
    elements: {},
    isScanning: false,
    
    init: function() {
        this.cacheElements();
        this.setupEventListeners();
    },
    
    cacheElements: function() {
        this.elements = {
            modal: document.getElementById('modal-scanner'),
            btnClose: document.getElementById('close-scanner'),
            video: document.getElementById('scanner-video'),
            canvas: document.getElementById('scanner-canvas'),
            result: document.getElementById('scanner-result'),
            status: document.getElementById('scanner-status'),
            btnManual: document.getElementById('scanner-manual'),
            inputManual: document.getElementById('scanner-manual-input')
        };
    },
    
    setupEventListeners: function() {
        this.elements.btnClose?.addEventListener('click', () => this.close());
        this.elements.btnManual?.addEventListener('click', () => this.manualInput());
        
        // Auto-start when modal opens
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.classList.contains('active')) {
                    this.start();
                } else {
                    this.stop();
                }
            });
        });
        
        if (this.elements.modal) {
            observer.observe(this.elements.modal, { attributes: true, attributeFilter: ['class'] });
        }
    },
    
    start: function() {
        if (this.isScanning) return;
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.showStatus('Kamera tidak didukung di browser ini', 'error');
            return;
        }
        
        this.isScanning = true;
        this.showStatus('Meminta akses kamera...', 'info');
        
        navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        })
        .then(stream => {
            this.stream = stream;
            if (this.elements.video) {
                this.elements.video.srcObject = stream;
                this.elements.video.play();
            }
            this.showStatus('Arahkan kamera ke barcode', 'success');
            this.scan();
        })
        .catch(err => {
            console.error('Camera error:', err);
            this.showStatus('Tidak dapat mengakses kamera', 'error');
            this.isScanning = false;
        });
    },
    
    stop: function() {
        this.isScanning = false;
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.elements.video) {
            this.elements.video.srcObject = null;
        }
    },
    
    scan: function() {
        if (!this.isScanning) return;
        
        const video = this.elements.video;
        const canvas = this.elements.canvas;
        
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
            requestAnimationFrame(() => this.scan());
            return;
        }
        
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Try to decode barcode using jsQR if available
        if (typeof jsQR !== 'undefined') {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                this.handleBarcode(code.data);
                return;
            }
        }
        
        requestAnimationFrame(() => this.scan());
    },
    
    handleBarcode: function(barcode) {
        this.showStatus(`Barcode terdeteksi: ${barcode}`, 'success');
        
        // Search produk
        const produk = window.produkData?.find(p => p.barcode === barcode || p.kode === barcode);
        
        if (produk) {
            this.showResult(produk);
        } else {
            this.showNotFound(barcode);
        }
    },
    
    showResult: function(produk) {
        if (this.elements.result) {
            this.elements.result.innerHTML = `
                <div class="scanner-produk-found">
                    <div class="produk-thumb">
                        ${produk.gambar ? `<img src="${produk.gambar}" alt="">` : '<i class="fas fa-box"></i>'}
                    </div>
                    <div class="produk-info">
                        <h4>${produk.nama}</h4>
                        <p>${produk.kode || '-'} | ${this.formatRupiah(produk.harga_jual)}</p>
                        <span class="stok-badge ${produk.stok > 0 ? 'success' : 'danger'}">
                            Stok: ${produk.stok} ${produk.satuan}
                        </span>
                    </div>
                    <button class="btn btn-primary" onclick="BarcodeScanner.selectProduk('${produk.id}')">
                        <i class="fas fa-check"></i> Pilih
                    </button>
                </div>
            `;
        }
        
        // Auto-select after 2 seconds
        setTimeout(() => {
            if (this.isScanning) {
                this.selectProduk(produk.id);
            }
        }, 2000);
    },
    
    showNotFound: function(barcode) {
        if (this.elements.result) {
            this.elements.result.innerHTML = `
                <div class="scanner-not-found">
                    <i class="fas fa-exclamation-circle"></i>
                    <h4>Produk tidak ditemukan</h4>
                    <p>Barcode: ${barcode}</p>
                    <button class="btn btn-primary" onclick="BarcodeScanner.addNew('${barcode}')">
                        <i class="fas fa-plus"></i> Tambah Produk Baru
                    </button>
                </div>
            `;
        }
    },
    
    selectProduk: function(id) {
        this.close();
        // Open detail or edit
        if (window.DetailProduk) {
            const produk = window.produkData?.find(p => p.id === id);
            if (produk) window.DetailProduk.open(produk);
        }
    },
    
    addNew: function(barcode) {
        this.close();
        ProdukMain.openModal('modal-tambah-produk');
        // Pre-fill barcode
        setTimeout(() => {
            const input = document.getElementById('input-barcode');
            if (input) input.value = barcode;
        }, 100);
    },
    
    manualInput: function() {
        const barcode = this.elements.inputManual?.value.trim();
        if (barcode) {
            this.handleBarcode(barcode);
        }
    },
    
    showStatus: function(message, type) {
        if (this.elements.status) {
            this.elements.status.textContent = message;
            this.elements.status.className = `scanner-status ${type}`;
        }
    },
    
    close: function() {
        this.stop();
        ProdukMain.closeModal('modal-scanner');
        if (this.elements.result) this.elements.result.innerHTML = '';
        if (this.elements.inputManual) this.elements.inputManual.value = '';
    },
    
    formatRupiah: function(angka) {
        if (!angka) return 'Rp 0';
        return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => BarcodeScanner.init());
