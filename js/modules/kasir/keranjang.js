// Keranjang Module - Additional Functions

// Fungsi-fungsi keranjang sudah diimplementasikan di kasir-main.js
// File ini untuk ekstensi fitur keranjang di masa depan

// Contoh: Simpan keranjang ke localStorage untuk recovery
function saveKeranjangToStorage() {
    if (keranjang.length > 0) {
        localStorage.setItem('keranjang_draft', JSON.stringify({
            items: keranjang,
            timestamp: new Date().toISOString()
        }));
    } else {
        localStorage.removeItem('keranjang_draft');
    }
}

// Recovery keranjang dari storage
function loadKeranjangFromStorage() {
    const draft = localStorage.getItem('keranjang_draft');
    if (draft) {
        const data = JSON.parse(draft);
        const draftTime = new Date(data.timestamp);
        const now = new Date();
        const diffMinutes = (now - draftTime) / (1000 * 60);
        
        // Hanya recovery jika kurang dari 30 menit
        if (diffMinutes < 30 && confirm('Ada keranjang yang belum selesai. Muat kembali?')) {
            keranjang = data.items;
            renderKeranjang();
        } else {
            localStorage.removeItem('keranjang_draft');
        }
    }
}

// Auto save setiap perubahan
let autoSaveInterval;
function startAutoSave() {
    autoSaveInterval = setInterval(saveKeranjangToStorage, 5000); // Setiap 5 detik
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Load draft jika ada
    setTimeout(loadKeranjangFromStorage, 1000);
    
    // Start auto save
    startAutoSave();
});

// Clear draft setelah pembayaran sukses
function clearDraft() {
    localStorage.removeItem('keranjang_draft');
}

// Override prosesPembayaran untuk clear draft
const originalProsesPembayaran = window.prosesPembayaran;
window.prosesPembayaran = async function() {
    await originalProsesPembayaran();
    clearDraft();
};
