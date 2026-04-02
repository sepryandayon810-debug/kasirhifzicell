// Dashboard Main Logic

document.addEventListener('DOMContentLoaded', function() {
    initDashboard();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Toggle info cards
    const toggleBtn = document.getElementById('toggle-info');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleInfoSection);
    }
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            createOverlay();
        });
    }
    
    // Menu search
    const menuSearch = document.getElementById('menu-search');
    if (menuSearch) {
        menuSearch.addEventListener('input', filterMenu);
    }
    
    // Settings button
    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            window.location.href = 'pages/setting.html';
        });
    }
    
    // Check Firebase connection
    checkFirebaseConnection();
});

function initDashboard() {
    console.log('Dashboard initialized');
    
    // Cek notifikasi
    checkNotifications();
}

function updateDateTime() {
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('current-date');
    
    const now = new Date();
    
    if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
    
    if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
}

function toggleInfoSection() {
    const section = document.querySelector('.header-info-section');
    const btn = document.getElementById('toggle-info');
    const icon = btn.querySelector('i');
    const text = btn.querySelector('span');
    
    section.classList.toggle('collapsed');
    
    if (section.classList.contains('collapsed')) {
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
        text.textContent = 'Tampilkan';
    } else {
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
        text.textContent = 'Sembunyikan';
    }
    
    // Simpan preference
    localStorage.setItem('header_collapsed', section.classList.contains('collapsed'));
}

function filterMenu(e) {
    const searchTerm = e.target.value.toLowerCase();
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        const menuText = item.textContent.toLowerCase();
        if (menuText.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function createOverlay() {
    // Hapus overlay yang ada
    const existingOverlay = document.querySelector('.sidebar-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
        return;
    }
    
    // Buat overlay baru
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay active';
    overlay.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('active');
        overlay.remove();
    });
    
    document.body.appendChild(overlay);
}

function checkNotifications() {
    // Cek notifikasi penting
    const user = auth.currentUser;
    if (!user) return;
    
    // Cek stok menipis
    database.ref('products').orderByChild('stok').endAt(5).once('value')
        .then(snapshot => {
            const lowStock = [];
            snapshot.forEach(child => {
                const product = child.val();
                if (product.stok <= 5) {
                    lowStock.push(product.nama);
                }
            });
            
            if (lowStock.length > 0) {
                showToast(`${lowStock.length} produk stok menipis`, 'warning');
            }
        });
    
    // Cek hutang jatuh tempo
    const today = getToday();
    database.ref('hutang').orderByChild('jatuh_tempo').endAt(today).once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                showToast('Ada hutang yang jatuh tempo hari ini', 'danger');
            }
        });
}

function showToast(message, type = 'info') {
    // Cek apakah toast container ada
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }
    
    // Buat toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${getIconByType(type)}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    
    toast.style.cssText = `
        background: var(--bg-card);
        border-left: 4px solid var(--${type}-color, var(--info-color));
        padding: 15px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
        min-width: 300px;
    `;
    
    container.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function getIconByType(type) {
    const icons = {
        success: 'fa-check-circle',
        danger: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

// Load collapsed state
const isCollapsed = localStorage.getItem('header_collapsed') === 'true';
if (isCollapsed) {
    const section = document.querySelector('.header-info-section');
    if (section) {
        section.classList.add('collapsed');
        const btn = document.getElementById('toggle-info');
        if (btn) {
            const icon = btn.querySelector('i');
            const text = btn.querySelector('span');
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
            text.textContent = 'Tampilkan';
        }
    }
}
