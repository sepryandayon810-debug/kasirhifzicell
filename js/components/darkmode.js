const btnDarkmode = document.getElementById('btn-darkmode');

function initDarkMode() {
    const savedTheme = localStorage.getItem('webpos-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateIcon(savedTheme);
}

function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('webpos-theme', newTheme);
    updateIcon(newTheme);
}

function updateIcon(theme) {
    const icon = btnDarkmode.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

btnDarkmode.addEventListener('click', toggleDarkMode);
initDarkMode();
