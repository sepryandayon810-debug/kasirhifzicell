// js/auth.js - Universal Auth Handler untuk semua halaman WebPOS

(function() {
    'use strict';
    
    // Tunggu DOM siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }
    
    function initAuth() {
        // Cek Firebase sudah load
        if (typeof firebase === 'undefined' || !auth) {
            console.error('Firebase belum diinisialisasi');
            return;
        }
        
        // Ambil elemen dengan null safety
        const elements = {
            userName: document.getElementById('user-name'),
            userRole: document.getElementById('user-role'),
            userEmail: document.getElementById('user-email'),
            btnLogout: document.getElementById('btn-logout'),
            btnLogin: document.getElementById('btn-login')
        };
        
        // Cek halaman saat ini
        const isLoginPage = window.location.pathname.includes('login.html');
        const isDashboard = window.location.pathname.includes('dashboard.html');
        const isPages = window.location.pathname.includes('/pages/');
        
        // Auth state listener
        auth.onAuthStateChanged(function(user) {
            if (user) {
                // ✅ User sudah login
                handleLoggedIn(user, elements, isLoginPage);
            } else {
                // ❌ User belum login
                handleLoggedOut(isLoginPage, isPages);
            }
        });
    }
    
    function handleLoggedIn(user, elements, isLoginPage) {
        // Redirect dari login ke dashboard
        if (isLoginPage) {
            window.location.replace('./dashboard.html');
            return;
        }
        
        // Update UI jika elemen ada
        const displayName = user.displayName || user.email;
        
        if (elements.userName) {
            elements.userName.textContent = displayName;
        }
        
        if (elements.userEmail) {
            elements.userEmail.textContent = user.email;
        }
        
        // Ambil role dari database
        if (elements.userRole) {
            database.ref('users/' + user.uid).once('value')
                .then(function(snapshot) {
                    const userData = snapshot.val();
                    if (userData && elements.userRole) {
                        elements.userRole.textContent = userData.role || 'Kasir';
                        
                        // Simpan ke session
                        sessionStorage.setItem('user_role', userData.role || 'kasir');
                        sessionStorage.setItem('user_nama', userData.nama || user.email);
                    }
                })
                .catch(function(error) {
                    console.log('Error mengambil data user:', error);
                });
        }
        
        // Simpan session
        sessionStorage.setItem('user_uid', user.uid);
        sessionStorage.setItem('user_email', user.email);
        
        // Setup logout button
        if (elements.btnLogout) {
            elements.btnLogout.addEventListener('click', handleLogout);
        }
    }
    
    function handleLoggedOut(isLoginPage, isPages) {
        // Redirect ke login jika di halaman yang memerlukan auth
        if (!isLoginPage) {
            const redirectUrl = isPages ? '../login.html' : './login.html';
            window.location.replace(redirectUrl);
        }
    }
    
    function handleLogout() {
        auth.signOut()
            .then(function() {
                sessionStorage.clear();
                const isPages = window.location.pathname.includes('/pages/');
                const redirectUrl = isPages ? '../login.html' : './login.html';
                window.location.replace(redirectUrl);
            })
            .catch(function(error) {
                console.error('Error logout:', error);
            });
    }
    
    // Export fungsi untuk digunakan manual jika perlu
    window.AuthHelper = {
        logout: handleLogout,
        getCurrentUser: function() {
            return auth.currentUser;
        }
    };
    
})();
