/**
 * Keranjang Pembelian Module
 * Additional helper functions for keranjang management
 */

const KeranjangPembelian = {
    // Get current keranjang data
    getData: function() {
        return pembelianKeranjang;
    },
    
    // Clear keranjang
    clear: function() {
        pembelianKeranjang = [];
        renderKeranjang();
        hitungTotalPembelian();
    },
    
    // Get total items count
    getItemCount: function() {
        return pembelianKeranjang.reduce((sum, item) => sum + item.jumlah, 0);
    },
    
    // Get total unique products
    getProductCount: function() {
        return pembelianKeranjang.length;
    },
    
    // Check if keranjang is empty
    isEmpty: function() {
        return pembelianKeranjang.length === 0;
    },
    
    // Update harga beli item
    updateHarga: function(index, hargaBaru) {
        if (index >= 0 && index < pembelianKeranjang.length) {
            pembelianKeranjang[index].harga_beli = parseInt(hargaBaru) || 0;
            renderKeranjang();
            hitungTotalPembelian();
        }
    },
    
    // Get summary data
    getSummary: function() {
        const subtotal = pembelianKeranjang.reduce((sum, item) => 
            sum + (item.harga_beli * item.jumlah), 0);
        const diskon = parseInt(document.getElementById('diskon-pembelian')?.value) || 0;
        const pajakPersen = parseInt(document.getElementById('pajak-pembelian')?.value) || 0;
        const pajak = Math.round((subtotal - diskon) * (pajakPersen / 100));
        const total = subtotal - diskon + pajak;
        
        return {
            subtotal,
            diskon,
            pajak_persen: pajakPersen,
            pajak,
            total
        };
    },
    
    // Validate before save
    validate: function() {
        if (this.isEmpty()) {
            return { valid: false, message: 'Keranjang masih kosong' };
        }
        
        const supplierId = document.getElementById('select-supplier')?.value;
        if (!supplierId) {
            return { valid: false, message: 'Pilih supplier terlebih dahulu' };
        }
        
        // Check for zero or negative prices
        const invalidItems = pembelianKeranjang.filter(item => item.harga_beli <= 0);
        if (invalidItems.length > 0) {
            return { 
                valid: false, 
                message: `${invalidItems.length} item memiliki harga beli tidak valid` 
            };
        }
        
        return { valid: true };
    }
};

window.KeranjangPembelian = KeranjangPembelian;
