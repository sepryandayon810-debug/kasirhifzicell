/**
 * Uang Pas Module
 * File: js/modules/kasir/uang-pas.js
 */

document.addEventListener('DOMContentLoaded', function() {
    const btnUangPas = document.getElementById('btn-uang-pas');
    if (btnUangPas) {
        btnUangPas.addEventListener('click', setUangPas);
    }
});

function setUangPas() {
    const keranjang = window.Keranjang ? window.Keranjang.getItems() : [];
    const total = keranjang.reduce((sum, item) => sum + item.subtotal, 0);
    
    if (total <= 0) {
        if (typeof showToast === 'function') {
            showToast('Keranjang masih kosong', 'warning');
        }
        return;
    }
    
    // Set jumlah bayar = total
    const jumlahBayarInput = document.getElementById('jumlah-bayar');
    if (jumlahBayarInput) {
        jumlahBayarInput.value = total;
    }
    
    if (typeof hitungKembalian === 'function') {
        hitungKembalian();
    }
    
    // Visual feedback
    const btn = document.getElementById('btn-uang-pas');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Uang Pas';
    btn.style.background = 'var(--accent-emerald)';
    btn.style.color = 'white';
    btn.style.borderColor = 'var(--accent-emerald)';
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
        btn.style.color = '';
        btn.style.borderColor = '';
    }, 1000);
    
    if (typeof showToast === 'function') {
        showToast('Uang pas diterapkan', 'success');
    }
}
