// Role Check - Mengatur akses menu berdasarkan role

const ROLE_PERMISSIONS = {
    owner: {
        menus: ['kasir', 'produk', 'pembelian', 'riwayat-transaksi', 'modal-harian', 
                'kas-management', 'hutang-piutang', 'laporan', 'saldo-telegram', 
                'data-pelanggan', 'management-user', 'setting', 'printer-struk', 'reset-data'],
        canDelete: true,
        canEditUser: true,
        canResetData: true,
        canApprove: true
    },
    admin: {
        menus: ['kasir', 'produk', 'pembelian', 'riwayat-transaksi', 'modal-harian', 
                'kas-management', 'hutang-piutang', 'laporan', 'saldo-telegram', 
                'data-pelanggan', 'management-user', 'setting', 'printer-struk'],
        canDelete: true,
        canEditUser: false, // Butuh approval owner
        canResetData: false,
        canApprove: false
    },
    kasir: {
        menus: ['kasir', 'produk', 'riwayat-transaksi', 'modal-harian', 
                'hutang-piutang', 'data-pelanggan', 'printer-struk', 'setting'],
        canDelete: false,
        canEditUser: false,
        canResetData: false,
        canApprove: false,
        settingAccess: ['tampilan', 'printer', 'notifikasi'] // Hanya akses tertentu di setting
    }
};

let currentUserRole = null;
let currentUserData = null;

async function initRoleCheck() {
    const session = localStorage.getItem('webpos_session') || sessionStorage.getItem('webpos_session');
    
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    
    const sessionData = JSON.parse(session);
    currentUserRole = sessionData.role;
    currentUserData = sessionData;
    
    // Update UI user info
    updateUserInfo(sessionData);
    
    // Filter menu berdasarkan role
    filterMenusByRole(currentUserRole);
    
    // Cek akses halaman saat ini
    checkPageAccess(currentUserRole);
    
    // Load data toko
    loadStoreInfo();
    
    // Load data header (kas, penjualan, dll)
    loadHeaderData(sessionData.uid, sessionData.role);
}

function updateUserInfo(sessionData) {
    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');
    const welcomeNameEl = document.getElementById('welcome-name');
    
    if (userNameEl) userNameEl.textContent = sessionData.nama || 'User';
    if (userRoleEl) userRoleEl.textContent = sessionData.role || '-';
    if (welcomeNameEl) welcomeNameEl.textContent = sessionData.nama || 'User';
}

function filterMenusByRole(role) {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return;
    
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        const menuRole = item.getAttribute('data-role');
        if (menuRole) {
            const allowedRoles = menuRole.split(',');
            if (!allowedRoles.includes(role)) {
                item.style.display = 'none';
            }
        }
    });
    
    // Sembunyikan menu reset untuk non-owner
    if (role !== 'owner') {
        const resetMenu = document.getElementById('menu-reset');
        if (resetMenu) resetMenu.style.display = 'none';
    }
}

function checkPageAccess(role) {
    const currentPage = window.location.pathname;
    const pageName = currentPage.split('/').pop().replace('.html', '');
    
    // Mapping halaman ke nama menu
    const pageMapping = {
        'kasir': 'kasir',
        'produk': 'produk',
        'pembelian': 'pembelian',
        'riwayat-transaksi': 'riwayat-transaksi',
        'modal-harian': 'modal-harian',
        'kas-management': 'kas-management',
        'hutang-piutang': 'hutang-piutang',
        'laporan': 'laporan',
        'saldo-telegram': 'saldo-telegram',
        'data-pelanggan': 'data-pelanggan',
        'management-user': 'management-user',
        'setting': 'setting',
        'printer-struk': 'printer-struk',
        'reset-data': 'reset-data'
    };
    
    const menuKey = pageMapping[pageName];
    if (!menuKey) return; // Dashboard atau halaman lain yang tidak terdaftar
    
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions.menus.includes(menuKey)) {
        // Tidak punya akses, redirect ke dashboard
        alert('Anda tidak memiliki akses ke halaman ini');
        window.location.href = '../dashboard.html';
    }
    
    // Khusus untuk setting, cek akses detail
    if (pageName === 'setting' && role === 'kasir') {
        restrictKasirSetting();
    }
}

function restrictKasirSetting() {
    // Sembunyikan menu setting yang tidak boleh diakses kasir
    const restrictedSections = ['info-toko', 'keamanan', 'backup-restore', 'sistem'];
    restrictedSections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

async function loadStoreInfo() {
    try {
        const snapshot = await database.ref('store_info').once('value');
        const storeData = snapshot.val() || {};
        
        const namaTokoEl = document.getElementById('nama-toko');
        const alamatTokoEl = document.getElementById('alamat-toko');
        const sidebarLogoEl = document.getElementById('sidebar-logo');
        const loginLogoEl = document.getElementById('login-logo');
        
        if (namaTokoEl) namaTokoEl.textContent = storeData.nama || 'WebPOS';
        if (alamatTokoEl) alamatTokoEl.textContent = storeData.alamat || 'Sistem POS';
        
        if (storeData.logo && sidebarLogoEl) {
            sidebarLogoEl.src = storeData.logo;
        }
        if (storeData.logo && loginLogoEl) {
            loginLogoEl.src = storeData.logo;
            loginLogoEl.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading store info:', error);
    }
}

async function loadHeaderData(uid, role) {
    try {
        const today = getToday();
        const shift = getCurrentShift();
        
        // Update shift di header
        const shiftEl = document.getElementById('header-shift');
        if (shiftEl) shiftEl.textContent = `${shift.id} (${shift.name})`;
        
        // Load data harian
        let dataRef;
        if (role === 'kasir') {
            dataRef = database.ref(`daily_data/${uid}/${today}`);
        } else {
            // Owner/Admin lihat total semua kasir
            dataRef = database.ref(`daily_summary/${today}`);
        }
        
        const snapshot = await dataRef.once('value');
        const data = snapshot.val() || {
            modal_awal: 0,
            total_penjualan: 0,
            total_topup: 0,
            total_tarik: 0,
            kas_masuk: 0,
            kas_keluar: 0,
            laba: 0,
            total_transaksi: 0,
            topup_fee: 0,
            tarik_fee: 0
        };
        
        // Hitung kas di tangan
        const kasDitangan = parseInt(data.modal_awal || 0) + 
                           parseInt(data.total_penjualan || 0) + 
                           parseInt(data.total_topup || 0) + 
                           parseInt(data.kas_masuk || 0) - 
                           parseInt(data.total_tarik || 0) - 
                           parseInt(data.kas_keluar || 0);
        
        // Update UI
        updateElement('kas-ditangan', formatRupiah(kasDitangan));
        updateElement('modal-awal-display', formatRupiah(data.modal_awal || 0));
        updateElement('total-penjualan', formatRupiah(data.total_penjualan || 0));
        updateElement('total-transaksi', data.total_transaksi || 0);
        updateElement('total-topup', formatRupiah(data.total_topup || 0));
        updateElement('topup-fee', formatRupiah(data.topup_fee || 0));
        updateElement('total-tarik', formatRupiah(data.total_tarik || 0));
        updateElement('tarik-fee', formatRupiah(data.tarik_fee || 0));
        updateElement('kas-masuk', formatRupiah(data.kas_masuk || 0));
        updateElement('kas-keluar', formatRupiah(data.kas_keluar || 0));
        updateElement('total-laba', formatRupiah(data.laba || 0));
        
        // Update status kasir
        const statusEl = document.getElementById('header-status');
        if (statusEl && role === 'kasir') {
            const isOpen = data.status === 'open';
            statusEl.innerHTML = `<span class="badge ${isOpen ? 'badge-success' : 'badge-danger'}">${isOpen ? 'Open' : 'Closed'}</span>`;
        }
        
        // Realtime update untuk owner
        if (role === 'owner') {
            setupRealtimeHeader(uid);
        }
        
    } catch (error) {
        console.error('Error loading header data:', error);
    }
}

function setupRealtimeHeader(ownerId) {
    const today = getToday();
    
    // Listen perubahan data dari semua kasir
    database.ref(`daily_summary/${today}`).on('value', snapshot => {
        const data = snapshot.val();
        if (data) {
            const kasDitangan = parseInt(data.modal_awal || 0) + 
                               parseInt(data.total_penjualan || 0) + 
                               parseInt(data.total_topup || 0) + 
                               parseInt(data.kas_masuk || 0) - 
                               parseInt(data.total_tarik || 0) - 
                               parseInt(data.kas_keluar || 0);
            
            updateElement('kas-ditangan', formatRupiah(kasDitangan));
            updateElement('total-penjualan', formatRupiah(data.total_penjualan || 0));
            updateElement('total-transaksi', data.total_transaksi || 0);
            updateElement('total-topup', formatRupiah(data.total_topup || 0));
            updateElement('total-tarik', formatRupiah(data.total_tarik || 0));
            updateElement('kas-masuk', formatRupiah(data.kas_masuk || 0));
            updateElement('kas-keluar', formatRupiah(data.kas_keluar || 0));
            updateElement('total-laba', formatRupiah(data.laba || 0));
        }
    });
}

function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// Helper untuk cek permission
function hasPermission(permission) {
    if (!currentUserRole) return false;
    return ROLE_PERMISSIONS[currentUserRole][permission] === true;
}

function getCurrentRole() {
    return currentUserRole;
}

function getCurrentUserData() {
    return currentUserData;
}

// Export
window.initRoleCheck = initRoleCheck;
window.hasPermission = hasPermission;
window.getCurrentRole = getCurrentRole;
window.getCurrentUserData = getCurrentUserData;
window.ROLE_PERMISSIONS = ROLE_PERMISSIONS;

// Init saat DOM ready
document.addEventListener('DOMContentLoaded', initRoleCheck);
