/**
 * Theme Sync - WebPOS v3.0
 * Sinkronisasi dark mode antar halaman
 * File: js/theme-sync.js
 */

const ThemeSync = {
    init: function() {
        this.applyTheme();
        this.setupListeners();
        this.setupToggleButton();
    },
    
    applyTheme: function() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateToggleIcon(savedTheme);
    },
    
    setupListeners: function() {
        // Listen perubahan dari tab lain
        window.addEventListener('storage', (e) => {
            if (e.key === 'theme') {
                const newTheme = e.newValue || 'light';
                document.documentElement.setAttribute('data-theme', newTheme);
                this.updateToggleIcon(newTheme);
            }
        });
    },
    
    setupToggleButton: function() {
        // Cari semua tombol theme toggle
        const toggleBtns = document.querySelectorAll('[data-theme-toggle], #theme-toggle, .theme-toggle');
        
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => this.toggle());
        });
    },
    
    toggle: function() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        
        // Apply
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        
        // Update icon
        this.updateToggleIcon(next);
        
        // Trigger event untuk komponen lain
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'theme',
            newValue: next
        }));
        
        console.log('[ThemeSync] Theme changed to:', next);
    },
    
    updateToggleIcon: function(theme) {
        const icons = document.querySelectorAll('[data-theme-icon], .theme-icon');
        icons.forEach(icon => {
            if (theme === 'dark') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        });
    },
    
    getCurrentTheme: function() {
        return localStorage.getItem('theme') || 'light';
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeSync.init());
} else {
    ThemeSync.init();
}
