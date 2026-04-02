// Login Logic
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    
    // Cek apakah sudah login
    checkExistingSession();
    
    // Update info shift dan tanggal
    updateLoginInfo();
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;
        const submitBtn = loginForm.querySelector('.btn-login');
        
        // Validasi
        if (!email || !password) {
            showError('Email dan password wajib diisi');
            return;
        }
        
        // Loading state
        submitBtn.classList.add('loading');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        
        try {
            // Login dengan Firebase Auth
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Ambil data user dari database
            const userSnapshot = await database.ref('users/' + user.uid).once('value');
            const userData = userSnapshot.val();
            
            if (!userData) {
                throw new Error('Data user tidak ditemukan');
            }
            
            // Cek apakah user aktif
            if (userData.status === 'nonaktif') {
                await auth.signOut();
                throw new Error('Akun Anda telah dinonaktifkan');
            }
            
            // Simpan session
            const sessionData = {
                uid: user.uid,
                email: user.email,
                role: userData.role,
                nama: userData.nama,
                loginTime: new Date().toISOString(),
                device: getDeviceInfo()
            };
            
            if (remember) {
                localStorage.setItem('webpos_session', JSON.stringify(sessionData));
            } else {
                sessionStorage.setItem('webpos_session', JSON.stringify(sessionData));
            }
            
            // Log device login
            await logDeviceLogin(user.uid, sessionData.device);
            
            // Cek reset harian
            await checkDailyReset(user.uid, userData.role);
            
            // Redirect ke dashboard
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            console.error('Login error:', error);
            showError(getErrorMessage(error.code));
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
        }
    });
});

// Fungsi helper
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.classList.remove('fa-eye');
        toggleBtn.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleBtn.classList.remove('fa-eye-slash');
        toggleBtn.classList.add('fa-eye');
    }
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.classList.add('show');
    
    setTimeout(() => {
        errorElement.classList.remove('show');
    }, 5000);
}

function getErrorMessage(code) {
    const messages = {
        'auth/user-not-found': 'Email tidak terdaftar',
        'auth/wrong-password': 'Password salah',
        'auth/invalid-email': 'Format email tidak valid',
        'auth/user-disabled': 'Akun telah dinonaktifkan',
        'auth/too-many-requests': 'Terlalu banyak percobaan, coba lagi nanti',
        'auth/network-request-failed': 'Koneksi internet bermasalah'
    };
    return messages[code] || 'Terjadi kesalahan, coba lagi';
}

function checkExistingSession() {
    const session = localStorage.getItem('webpos_session') || sessionStorage.getItem('webpos_session');
    if (session) {
        const sessionData = JSON.parse(session);
        const loginTime = new Date(sessionData.loginTime);
        const now = new Date();
        const diffMinutes = (now - loginTime) / (1000 * 60);
        
        // Jika kurang dari 30 menit, redirect ke dashboard
        if (diffMinutes < 30) {
            window.location.href = 'dashboard.html';
        } else {
            // Hapus session yang expired
            localStorage.removeItem('webpos_session');
            sessionStorage.removeItem('webpos_session');
        }
    }
}

function updateLoginInfo() {
    const shiftElement = document.getElementById('current-shift');
    const dateElement = document.getElementById('date-info');
    
    const now = new Date();
    const hour = now.getHours();
    let shift = 'Shift 1';
    
    if (hour >= 6 && hour < 14) shift = 'Shift 1 (Pagi)';
    else if (hour >= 14 && hour < 22) shift = 'Shift 2 (Siang)';
    else shift = 'Shift 3 (Malam)';
    
    shiftElement.textContent = shift;
    dateElement.textContent = formatTanggalLengkap(now);
}

function getDeviceInfo() {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screen: `${window.screen.width}x${window.screen.height}`,
        timestamp: new Date().toISOString()
    };
}

async function logDeviceLogin(uid, deviceInfo) {
    const today = new Date().toISOString().split('T')[0];
    const logRef = database.ref(`device_logs/${uid}/${today}`).push();
    
    await logRef.set({
        ...deviceInfo,
        loginAt: firebase.database.ServerValue.TIMESTAMP
    });
}

async function checkDailyReset(uid, role) {
    const today = new Date().toISOString().split('T')[0];
    const lastResetRef = database.ref(`system/last_reset/${uid}`);
    const snapshot = await lastResetRef.once('value');
    const lastReset = snapshot.val();
    
    if (lastReset !== today) {
        // Reset data harian
        await database.ref(`daily_data/${uid}/${today}`).set({
            modal_awal: 0,
            total_penjualan: 0,
            total_topup: 0,
            total_tarik: 0,
            kas_masuk: 0,
            kas_keluar: 0,
            shift: getCurrentShift(),
            status: role === 'kasir' ? 'closed' : 'open',
            created_at: firebase.database.ServerValue.TIMESTAMP
        });
        
        await lastResetRef.set(today);
    }
}

function getCurrentShift() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return '1';
    else if (hour >= 14 && hour < 22) return '2';
    else return '3';
}
