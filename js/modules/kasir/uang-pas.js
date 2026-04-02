// Uang Pas Module

document.addEventListener('DOMContentLoaded', function() {
    const btnUangPas = document.getElementById('btn-uang-pas');
    if (btnUangPas) {
        btnUangPas.addEventListener('click', setUangPas);
    }
});

function setUangPas() {
    const total = keranjang.reduce((sum, item) => sum + item.subtotal, 0);
    
    if (total <= 0) {
        showToast('Keranjang masih kosong', 'warning');
        return;
    }
    
    // Set jumlah bayar = total
    document.getElementById('jumlah-bayar').value = total;
    hitungKembalian();
    
    // Visual feedback
    const btn = document.getElementById('btn-uang-pas');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Uang Pas';
    btn.style.backgroundColor = 'var(--success-color)';
    btn.style.color = 'white';
    btn.style.borderColor = 'var(--success-color)';
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.backgroundColor = '';
        btn.style.color = '';
        btn.style.borderColor = '';
    }, 1000);
}
