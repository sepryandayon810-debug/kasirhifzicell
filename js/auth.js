// Authentication & Role Management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.sessionTimeout = 30 * 60 * 1000; // 30 menit
        this.lastActivity = Date.now();
        this.init();
    }

    init() {
        // Monitor activity
        document.addEventListener('mousemove', () => this.resetTimer());
        document.addEventListener('keypress', () => this.resetTimer());
        
        // Check session every minute
        setInterval(() => this.checkSession(), 60000);
        
        // Check day change
        setInterval(() => this.checkDayChange(), 60000);
    }

    resetTimer() {
        this.lastActivity = Date.now();
    }

    checkSession() {
        const inactive = Date.now() - this.lastActivity;
        if (inactive > this.sessionTimeout) {
            this.logout('Sesi berakhir karena tidak aktif selama 30 menit');
        }
    }

    async checkDayChange() {
        const lastLogin = localStorage.getItem('lastLoginDate');
        const today = new Date().toDateString();
        
        if (lastLogin && lastLogin !== today) {
            // Reset semua transaksi harian
            await this.resetDailyData();
            // Auto close kasir
            await this.closeAllCashier();
            localStorage.setItem('lastLoginDate', today);
        }
    }

    async resetDailyData() {
        const today = new Date().toISOString().split('T')[0];
        const updates = {};
        updates[`/dailyReset/${today}`] = {
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            resetBy: 'system'
        };
        await database.ref().update(updates);
    }

    async closeAllCashier() {
        await database.ref('/cashierStatus').set({
            status: 'closed',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }

    async login(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Get user role from database
            const snapshot = await database.ref(`/users/${user.uid}`).once('value');
            const userData = snapshot.val();
            
            if (!userData) {
                throw new Error('Data user tidak ditemukan');
            }

            this.currentUser = {
                uid: user.uid,
                email: user.email,
                role: userData.role,
                name: userData.name,
                device: this.getDeviceInfo()
            };
            
            this.userRole = userData.role;
            
            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            localStorage.setItem('lastLoginDate', new Date().toDateString());
            
            // Log device
            await this.logDeviceLogin();
            
            return { success: true, user: this.currentUser };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screen: `${screen.width}x${screen.height}`,
            timestamp: new Date().toISOString()
        };
    }

    async logDeviceLogin() {
        if (!this.currentUser) return;
        
        const deviceData = {
            ...this.currentUser.device,
            uid: this.currentUser.uid,
            name: this.currentUser.name,
            role: this.currentUser.role
        };
        
        await database.ref(`/deviceLogs/${this.currentUser.uid}`).push(deviceData);
    }

    logout(message = 'Anda telah logout') {
        auth.signOut();
        localStorage.removeItem('currentUser');
        localStorage.removeItem('lastLoginDate');
        alert(message);
        window.location.href = 'index.html';
    }

    checkRoleAccess(requiredRole) {
        if (!this.currentUser) return false;
        
        const roleHierarchy = {
            'owner': 3,
            'admin': 2,
            'kasir': 1
        };
        
        const userLevel = roleHierarchy[this.currentUser.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;
        
        return userLevel >= requiredLevel;
    }

    canAccessMenu(menuName) {
        if (!this.currentUser) return false;
        
        const permissions = {
            'owner': ['kasir', 'produk', 'pembelian', 'riwayat-transaksi', 'modal-harian', 
                     'kas-management', 'hutang-piutang', 'laporan', 'saldo-telegram', 
                     'data-pelanggan', 'setting', 'user-management', 'printer', 'reset-data'],
            'admin': ['kasir', 'produk', 'pembelian', 'riwayat-transaksi', 'modal-harian', 
                     'kas-management', 'hutang-piutang', 'laporan', 'saldo-telegram', 
                     'data-pelanggan', 'setting', 'user-management', 'printer'],
            'kasir': ['kasir', 'produk', 'riwayat-transaksi', 'modal-harian', 
                     'hutang-piutang', 'data-pelanggan', 'printer']
        };
        
        const allowedMenus = permissions[this.currentUser.role] || [];
        return allowedMenus.includes(menuName);
    }

    getCurrentUser() {
        if (!this.currentUser) {
            const saved = localStorage.getItem('currentUser');
            if (saved) {
                this.currentUser = JSON.parse(saved);
                this.userRole = this.currentUser.role;
            }
        }
        return this.currentUser;
    }
}

// Initialize
const authManager = new AuthManager();

// Route guard
function checkAuth() {
    const user = authManager.getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

function checkPageAccess(menuName) {
    if (!checkAuth()) return false;
    if (!authManager.canAccessMenu(menuName)) {
        alert('Anda tidak memiliki akses ke menu ini');
        window.location.href = 'dashboard.html';
        return false;
    }
    return true;
}
