// Session Manager - Auto logout setelah 30 menit tidak aktif

let inactivityTimer;
let warningTimer;
const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 menit
const WARNING_BEFORE = 60 * 1000; // Warning 1 menit sebelum logout
let countdownInterval;

function initSessionManager() {
    // Reset timer saat ada aktivitas
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
        document.addEventListener(event, resetTimer, true);
    });
    
    // Mulai timer
    resetTimer();
    
    // Cek session setiap menit
    setInterval(checkSessionValidity, 60000);
}

function resetTimer() {
    clearTimeout(inactivityTimer);
    clearTimeout(warningTimer);
    clearInterval(countdownInterval);
    
    // Sembunyikan modal warning jika ada
    const modal = document.getElementById('session-modal');
    if (modal) {
        modal.classList.remove('active');
    }
    
    // Set timer untuk warning
    warningTimer = setTimeout(showWarning, INACTIVITY_LIMIT - WARNING_BEFORE);
    
    // Set timer untuk logout
    inactivityTimer = setTimeout(logoutUser, INACTIVITY_LIMIT);
}

function showWarning() {
    const modal = document.getElementById('session-modal');
    const countdownEl = document.getElementById('countdown');
    
    if (modal && countdownEl) {
        modal.classList.add('active');
        let seconds = 60;
        countdownEl.textContent = seconds;
        
        countdownInterval = setInterval(() => {
            seconds--;
            countdownEl.textContent = seconds;
            
            if (seconds <= 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);
        
        // Tombol perpanjang sesi
        document.getElementById('extend-session').onclick = () => {
            resetTimer();
            modal.classList.remove('active');
        };
        
        // Tombol logout sekarang
        document.getElementById('logout-now').onclick = logoutUser;
    }
}

function logoutUser() {
    clearTimeout(inactivityTimer);
    clearTimeout(warningTimer);
    clearInterval(countdownInterval);
    
    // Hapus session storage
    localStorage.removeItem('webpos_session');
    sessionStorage.removeItem('webpos_session');
    
    // Update status login di Firebase
    const user = auth.currentUser;
    if (user) {
        database.ref(`users/${user.uid}/last_logout`).set(firebase.database.ServerValue.TIMESTAMP);
    }
    
    // Redirect ke login
    window.location.href = 'index.html';
}

function checkSessionValidity() {
    const session = localStorage.getItem('webpos_session') || sessionStorage.getItem('webpos_session');
    
    if (!session) {
        // Tidak ada session, redirect ke login
        if (!window.location.href.includes('index.html')) {
            window.location.href = 'index.html';
        }
        return;
    }
    
    const sessionData = JSON.parse(session);
    const loginTime = new Date(sessionData.loginTime);
    const now = new Date();
    
    // Cek apakah sudah ganti hari
    if (isNewDay(sessionData.loginTime.split('T')[0])) {
        // Auto logout jika ganti hari
        logoutUser();
        return;
    }
    
    // Cek apakah session masih valid (kurang dari 30 menit)
    const diffMinutes = (now - loginTime) / (1000 * 60);
    if (diffMinutes >= 30) {
        logoutUser();
    }
}

// Cek apakah user masih login setiap kali halaman dimuat
function checkAuth() {
    auth.onAuthStateChanged(user => {
        if (!user && !window.location.href.includes('index.html')) {
            window.location.href = 'index.html';
        } else if (user) {
            // Verifikasi session di database
            const session = localStorage.getItem('webpos_session') || sessionStorage.getItem('webpos_session');
            if (!session) {
                auth.signOut().then(() => {
                    window.location.href = 'index.html';
                });
            }
        }
    });
}

// Export fungsi
window.initSessionManager = initSessionManager;
window.resetTimer = resetTimer;
window.logoutUser = logoutUser;
window.checkSessionValidity = checkSessionValidity;
window.checkAuth = checkAuth;

// Auto init saat DOM ready
document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.href.includes('index.html')) {
        initSessionManager();
        checkAuth();
    }
});
