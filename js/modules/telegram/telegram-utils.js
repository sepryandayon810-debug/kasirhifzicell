/**
 * Telegram Utils Module
 * File: js/modules/telegram/telegram-utils.js
 */

const TelegramUtils = {
    showToast: function(msg, type = 'info') {
        if (typeof utils !== 'undefined' && utils.showToast) {
            utils.showToast(msg, type);
        } else if (typeof showToast === 'function') {
            showToast(msg, type);
        } else {
            const toast = document.getElementById('toast');
            if (toast) {
                toast.textContent = msg;
                toast.className = `toast show ${type}`;
                setTimeout(() => toast.className = 'toast', 3000);
            } else {
                alert(msg);
            }
        }
    },
    
    formatMoney: function(amount) {
        return 'Rp ' + (amount || 0).toLocaleString('id-ID');
    },
    
    escapeHtml: function(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },
    
    copyToClipboard: function(text, successMsg) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast(successMsg, 'success');
            }).catch(() => {
                this.fallbackCopy(text, successMsg);
            });
        } else {
            this.fallbackCopy(text, successMsg);
        }
    },
    
    fallbackCopy: function(text, successMsg) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showToast(successMsg, 'success');
        } catch (err) {
            this.showToast('❌ Gagal copy, silakan copy manual', 'error');
        }
        
        document.body.removeChild(textArea);
    },
    
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    formatDate: function(date, format = 'id-ID') {
        return new Date(date).toLocaleDateString(format);
    },
    
    formatDateTime: function(date, format = 'id-ID') {
        return new Date(date).toLocaleString(format);
    }
};
