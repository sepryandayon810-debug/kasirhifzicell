/**
 * WebPOS Theme Manager - Universal Dark Mode
 * Works across all pages with localStorage sync
 */

(function() {
    'use strict';
    
    const THEME_KEY = 'webpos-theme';
    
    // Initialize immediately (before DOM ready)
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Theme Manager Object
    window.ThemeManager = {
        current: savedTheme,
        
        init: function() {
            this.bindEvents();
            this.updateIcons();
            
            // Listen for changes from other pages
            window.addEventListener('storage', (e) => {
                if (e.key === THEME_KEY) {
                    this.apply(e.newValue);
                }
            });
        },
        
        toggle: function() {
            const newTheme = this.current === 'light' ? 'dark' : 'light';
            this.apply(newTheme);
            localStorage.setItem(THEME_KEY, newTheme);
            
            // Notify other pages
            window.dispatchEvent(new StorageEvent('storage', {
                key: THEME_KEY,
                newValue: newTheme
            }));
        },
        
        apply: function(theme) {
            this.current = theme;
            document.documentElement.setAttribute('data-theme', theme);
            this.updateIcons();
        },
        
        updateIcons: function() {
            const btn = document.querySelector('.btn-darkmode');
            if (btn) {
                btn.classList.toggle('active', this.current === 'dark');
            }
        },
        
        bindEvents: function() {
            // Auto-bind to any button with data-theme-toggle
            document.addEventListener('click', (e) => {
                if (e.target.closest('[data-theme-toggle]') || 
                    e.target.closest('.btn-darkmode')) {
                    e.preventDefault();
                    this.toggle();
                }
            });
        }
    };
    
    // Auto-init when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.ThemeManager.init());
    } else {
        window.ThemeManager.init();
    }
})();
