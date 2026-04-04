/**
 * UI/UX Enhancements for WebPOS
 * File: js/ui-enhancements.js
 * 
 * Tambahkan di akhir body: <script src="js/ui-enhancements.js"></script>
 */

const UIEnhancements = {
    init: function() {
        this.initTooltips();
        this.initRippleEffect();
        this.initScrollAnimations();
        this.initNumberAnimations();
        this.initHoverCards();
        console.log('[UI] Enhancements loaded');
    },

    // Tooltip system
    initTooltips: function() {
        const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
        
        tooltipTriggers.forEach(trigger => {
            trigger.addEventListener('mouseenter', (e) => {
                const text = e.target.getAttribute('data-tooltip');
                const tooltip = document.createElement('div');
                tooltip.className = 'ui-tooltip';
                tooltip.textContent = text;
                document.body.appendChild(tooltip);
                
                const rect = e.target.getBoundingClientRect();
                tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
                tooltip.style.opacity = '1';
            });
            
            trigger.addEventListener('mouseleave', () => {
                const tooltip = document.querySelector('.ui-tooltip');
                if (tooltip) tooltip.remove();
            });
        });
    },

    // Ripple effect for buttons
    initRippleEffect: function() {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.btn, .menu-item, .template-card');
            if (!button) return;
            
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            button.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    },

    // Scroll animations
    initScrollAnimations: function() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.stat-card, .menu-item, .telegram-section').forEach(el => {
            el.style.opacity = '0';
            observer.observe(el);
        });
    },

    // Animate numbers on load
    initNumberAnimations: function() {
        document.querySelectorAll('.stat-value').forEach(el => {
            const finalValue = parseInt(el.textContent.replace(/\D/g, '')) || 0;
            if (finalValue === 0) return;
            
            let currentValue = 0;
            const increment = finalValue / 30;
            const duration = 1000;
            const stepTime = duration / 30;
            
            const timer = setInterval(() => {
                currentValue += increment;
                if (currentValue >= finalValue) {
                    currentValue = finalValue;
                    clearInterval(timer);
                }
                el.textContent = this.formatNumber(Math.floor(currentValue));
            }, stepTime);
        });
    },

    // 3D hover effect for cards
    initHoverCards: function() {
        document.querySelectorAll('.stat-card, .menu-item').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    },

    formatNumber: function(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    },

    // Enhanced toast notification
    showToast: function(message, type = 'info', duration = 3000) {
        const existing = document.querySelector('.ui-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = `ui-toast ${type}`;
        
        const icons = {
            success: 'check-circle',
            error: 'times-circle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas fa-${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => UIEnhancements.init());
} else {
    UIEnhancements.init();
}
