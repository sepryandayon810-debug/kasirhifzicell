/**
 * WebPOS Theme Manager v2.0
 * Compatible with: dark-mode.css (data-theme attribute)
 */

(function() {
    'use strict';
    
    const THEME_KEY = 'webpos-theme';
    const DEFAULT_THEME = 'light';
    
    // Initialize immediately (before DOM ready)
    const savedTheme = localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Legacy support: also set body class for old CSS
    if (savedTheme === 'dark') {
        document.body?.classList.add('dark-mode');
        document.body?.classList.remove('light-mode');
    } else {
        document.body?.classList.add('light-mode');
        document.body?.classList.remove('dark-mode');
    }
    
    window.ThemeManager = {
        current: savedTheme,
        
        init: function() {
            this.updateUI();
            this.bindEvents();
            this.listenForChanges();
        },
        
        toggle: function() {
            const newTheme = this.current === 'light' ? 'dark' : 'light';
            this.set(newTheme);
        },
        
        set: function(theme) {
            this.current = theme;
            
            // Set data attribute (modern way)
            document.documentElement.setAttribute('data-theme', theme);
            
            // Set body class (legacy support)
            if (theme === 'dark') {
                document.body?.classList.add('dark-mode');
                document.body?.classList.remove('light-mode');
            } else {
                document.body?.classList.add('light-mode');
                document.body?.classList.remove('dark-mode');
            }
            
            // Save to localStorage
            localStorage.setItem(THEME_KEY, theme);
            
            // Update UI
            this.updateUI();
            
            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent('themechange', { 
                detail: { theme: theme } 
            }));
        },
        
        updateUI: function() {
            // Update all theme toggle buttons
            document.querySelectorAll('[data-theme-toggle], .btn-darkmode, .theme-switcher').forEach(btn => {
                btn.classList.toggle('active', this.current === 'dark');
            });
        },
        
        bindEvents: function() {
            // Auto-bind to all theme toggle buttons
            document.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-theme-toggle], .btn-darkmode, .theme-switcher');
                if (btn) {
                    e.preventDefault();
                    this.toggle();
                }
            });
        },
        
        listenForChanges: function() {
            // Listen for changes from other pages
            window.addEventListener('storage', (e) => {
                if (e.key === THEME_KEY && e.newValue !== this.current) {
                    this.set(e.newValue);
                }
            });
        }
    };
    
    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.ThemeManager.init());
    } else {
        window.ThemeManager.init();
    }
})();
