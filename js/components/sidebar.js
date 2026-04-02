// Dropdown toggle
document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', function(e) {
        e.preventDefault();
        const parent = this.closest('.has-dropdown');
        const menu = parent.querySelector('.dropdown-menu');
        
        parent.classList.toggle('active');
        menu.classList.toggle('show');
        
        // Save state
        const section = this.querySelector('span').textContent.toLowerCase();
        localStorage.setItem(`sidebar-${section}`, menu.classList.contains('show'));
    });
});

// Restore state
document.querySelectorAll('.has-dropdown').forEach(item => {
    const section = item.querySelector('span').textContent.toLowerCase();
    const isOpen = localStorage.getItem(`sidebar-${section}`) === 'true';
    
    if (isOpen || item.classList.contains('active')) {
        item.classList.add('active');
        item.querySelector('.dropdown-menu').classList.add('show');
    }
});

// Mobile toggle
document.getElementById('mobile-menu-toggle').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('show');
});

document.getElementById('sidebar-toggle').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('collapsed');
});
