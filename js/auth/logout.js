// Logout Handler

document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('btn-logout');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

async function handleLogout() {
    try {
        // Konfirmasi logout
        if (!confirm('Apakah Anda yakin ingin logout?')) {
            return;
        }
        
        const user = auth.currentUser;
        const session = localStorage.getItem('webpos_session') || sessionStorage.getItem('webpos_session');
        
        if (user && session) {
            const sessionData = JSON.parse(session);
            
            // Update last logout di database
            await database.ref(`users/${user.uid}/last_logout`).set(firebase.database.ServerValue.TIMESTAMP);
            
            // Log aktivitas logout
            await database.ref(`activity_logs/${user.uid}`).push({
                type: 'logout',
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                device: getDeviceInfo()
            });
            
            // Jika kasir, tutup shift otomatis
            if (sessionData.role === 'kasir') {
                const today = getToday();
                await database.ref(`daily_data/${user.uid}/${today}`).update({
                    status: 'closed',
                    closed_at: firebase.database.ServerValue.TIMESTAMP
                });
            }
        }
        
        // Clear session
        localStorage.removeItem('webpos_session');
        sessionStorage.removeItem('webpos_session');
        
        // Firebase logout
        await auth.signOut();
        
        // Redirect ke login
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Logout error:', error);
        alert('Gagal logout: ' + error.message);
    }
}

function getDeviceInfo() {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screen: `${window.screen.width}x${window.screen.height}`,
        timestamp: new Date().toISOString()
    };
}

// Export
window.handleLogout = handleLogout;
