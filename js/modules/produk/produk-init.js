/**
 * Produk Module Initializer - WebPOS Modern
 * File: js/modules/produk/produk-init.js
 * 
 * File ini menginisialisasi semua komponen modul Produk
 */

(function() {
    'use strict';
    
    // Config
    const CONFIG = {
        debug: true,
        firebasePath: 'produk',
        itemsPerPage: 20
    };
    
    // Logger
    const Logger = {
        log: (msg, data) => {
            if (CONFIG.debug) console.log(`[ProdukModule] ${msg}`, data || '');
        },
        error: (msg, err) => {
            console.error(`[ProdukModule] ❌ ${msg}`, err || '');
        }
    };
    
    // Module loader
    const ProdukModule = {
        components: [
            'ProdukMain',
            'TambahProduk',
            'EditProduk',
            'DetailProduk',
            'ImportExcel',
            'KategoriManager',
            'StokMasal',
            'ToggleStatus',
            'BarcodeScanner'
        ],
        
        init: function() {
            Logger.log('🚀 Initializing Produk Module...');
            
            // Check dependencies
            if (!this.checkDependencies()) {
                Logger.error('Dependencies not met');
                return;
            }
            
            // Initialize all components
            this.components.forEach(comp => {
                if (window[comp] && typeof window[comp].init === 'function') {
                    try {
                        window[comp].init();
                        Logger.log(`✅ ${comp} initialized`);
                    } catch (err) {
                        Logger.error(`Failed to init ${comp}`, err);
                    }
                }
            });
            
            // Setup global helpers
            this.setupHelpers();
            
            Logger.log('✅ Produk Module ready');
        },
        
        checkDependencies: function() {
            const required = ['firebase', 'XLSX'];
            const missing = required.filter(dep => typeof window[dep] === 'undefined');
            
            if (missing.length > 0) {
                Logger.error(`Missing dependencies: ${missing.join(', ')}`);
                return false;
            }
            
            return true;
        },
        
        setupHelpers: function() {
            // Global toast function if not exists
            if (typeof window.showToast !== 'function') {
                window.showToast = function(message, type = 'info') {
                    // Create toast element
                    const toast = document.createElement('div');
                    toast.className = `toast toast-${type}`;
                    toast.innerHTML = `
                        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i>
                        <span>${message}</span>
                    `;
                    
                    // Add to container or body
                    let container = document.getElementById('toast-container');
                    if (!container) {
                        container = document.createElement('div');
                        container.id = 'toast-container';
                        document.body.appendChild(container);
                    }
                    
                    container.appendChild(toast);
                    
                    // Animate in
                    requestAnimationFrame(() => {
                        toast.classList.add('show');
                    });
                    
                    // Remove after 3s
                    setTimeout(() => {
                        toast.classList.remove('show');
                        setTimeout(() => toast.remove(), 300);
                    }, 3000);
                };
            }
            
            // Global confirm modal if not exists
            if (typeof window.confirmModal !== 'function') {
                window.confirmModal = function(message, onConfirm, onCancel) {
                    if (confirm(message)) {
                        onConfirm?.();
                    } else {
                        onCancel?.();
                    }
                };
            }
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ProdukModule.init());
    } else {
        ProdukModule.init();
    }
    
    // Expose to global
    window.ProdukModule = ProdukModule;
    window.ProdukConfig = CONFIG;
    
})();
