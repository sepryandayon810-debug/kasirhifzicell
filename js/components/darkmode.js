/**
 * Dark Mode Toggle - Fixed Version
 * File: js/components/darkmode.js
 */

const DarkMode = {
    init: function() {
        console.log('[DarkMode] Initializing...');
        
        // Cek elemen dengan berbagai kemungkinan selector
        this.toggleBtn = document.getElementById('darkmode-toggle') || 
                        document.getElementById('btn-darkmode') ||
                        document.querySelector('.btn-darkmode') ||
                        document.querySelector('[data-action="toggle-darkmode"]');
        
        if (!this.toggleBtn) {
            console.warn('[DarkMode] Toggle button not found, dark mode disabled');
            return;
        }
        
        // Load saved preference
        this.loadPreference();
        
        // Bind event
        this.toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggle();
        });
        
        console.log('[DarkMode] Initialized');
    },
    
    toggle: function() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('webpos-theme', newTheme);
        
        // Update icon
        this.updateIcon(newTheme);
        
        console.log('[DarkMode] Theme changed to:', newTheme);
    },
    
    loadPreference: function() {
        const savedTheme = localStorage.getItem('webpos-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateIcon(savedTheme);
    },
    
    updateIcon: function(theme) {
        if (!this.toggleBtn) return;
        
        const moonIcon = this.toggleBtn.querySelector('.fa-moon');
        const sunIcon = this.toggleBtn.querySelector('.fa-sun');
        
        if (moonIcon && sunIcon) {
            if (theme === 'dark') {
                moonIcon.style.display = 'none';
                sunIcon.style.display = 'inline-block';
            } else {
                moonIcon.style.display = 'inline-block';
                sunIcon.style.display = 'none';
            }
        }
    }
};

// Initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DarkMode.init());
} else {
    DarkMode.init();
}

window.DarkMode = DarkMode;
