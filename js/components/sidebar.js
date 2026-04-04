/**
 * Sidebar & Dropdown - Fixed Version
 * File: js/components/sidebar.js
 */

const Sidebar = {
    init: function() {
        console.log('[Sidebar] Initializing...');
        
        this.sidebar = document.getElementById('sidebar');
        this.overlay = document.getElementById('overlay');
        this.menuToggle = document.querySelector('.menu-toggle') || 
                         document.getElementById('menu-toggle');
        
        // Bind toggle button
        if (this.menuToggle) {
            this.menuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggle();
            });
        } else {
            console.warn('[Sidebar] Menu toggle button not found');
        }
        
        // Bind overlay
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.close());
        }
        
        // Initialize dropdowns
        this.initDropdowns();
        
        // Restore dropdown state
        this.restoreDropdownState();
        
        console.log('[Sidebar] Initialized');
    },
    
    toggle: function() {
        if (!this.sidebar) return;
        
        this.sidebar.classList.toggle('open');
        if (this.overlay) {
            this.overlay.classList.toggle('active');
        }
    },
    
    close: function() {
        if (!this.sidebar) return;
        
        this.sidebar.classList.remove('open');
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
    },
    
    initDropdowns: function() {
        const headers = document.querySelectorAll('.nav-section-header');
        
        headers.forEach(header => {
            header.addEventListener('click', (e) => {
                e.preventDefault();
                const section = header.closest('.nav-section');
                if (!section) return;
                
                const dropdown = section.querySelector('.nav-dropdown');
                const arrow = header.querySelector('.dropdown-arrow');
                
                if (dropdown) {
                    const isOpen = dropdown.classList.toggle('open');
                    
                    // Toggle arrow rotation
                    if (arrow) {
                        arrow.classList.toggle('rotate', isOpen);
                    }
                    
                    // Toggle active class on header
                    header.classList.toggle('active', isOpen);
                    
                    // Save state
                    const sectionName = section.classList[1] || 'section';
                    localStorage.setItem(`dropdown-${sectionName}`, isOpen);
                }
            });
        });
    },
    
    restoreDropdownState: function() {
        const sections = ['utama', 'transaksi', 'lainnya', 'pengaturan'];
        
        sections.forEach(section => {
            const isOpen = localStorage.getItem(`dropdown-${section}`) === 'true';
            if (isOpen) {
                const dropdown = document.getElementById(`dropdown-${section}`);
                const header = document.querySelector(`.nav-section.${section} .nav-section-header`);
                const arrow = header?.querySelector('.dropdown-arrow');
                
                if (dropdown) dropdown.classList.add('open');
                if (header) header.classList.add('active');
                if (arrow) arrow.classList.add('rotate');
            }
        });
    }
};

// Initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Sidebar.init());
} else {
    Sidebar.init();
}

window.Sidebar = Sidebar;
