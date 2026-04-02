let usersData = [];

document.addEventListener('DOMContentLoaded', function() {
    initUserManagement();
});

function initUserManagement() {
    setupEventListeners();
    loadUsers();
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

function setupEventListeners() {
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('collapsed'));
    document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('active'));
    document.getElementById('btn-tambah-user')?.addEventListener('click', () => bukaModalUser());
    document.getElementById('btn-simpan-user')?.addEventListener('click', simpanUser);
}

async function loadUsers() {
    try {
        const snapshot = await database.ref('users').once('value');
        usersData = [];
        
        snapshot.forEach(child => {
            usersData.push({ uid: child.key, ...child.val() });
        });

        renderUsers(usersData);
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function renderUsers(data) {
    const tbody = document.getElementById('user-list');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada data user</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(u => {
        const lastLogin = u.last_login ? new Date(u.last_login).toLocaleString('id-ID') : '-';
        const statusClass = u.active !== false ? 'status-active' : 'status-inactive';
        return `
            <tr>
                <td><strong>${u.nama || '-'}</strong></td>
                <td>${u.email || '-'}</td>
                <td><span class="role-badge role-${u.role || 'kasir'}">${(u.role || 'kasir').toUpperCase()}</span></td>
                <td class="${statusClass}">${u.active !== false ? 'Aktif' : 'Nonaktif'}</td>
                <td>${lastLogin}</td>
                <td>
                    <button class="btn-action btn-edit" onclick="editUser('${u.uid}')"><i class="fas fa-edit"></i></button>
                    ${u.uid !== auth.currentUser?.uid ? `<button class="btn-action btn-delete" onclick="hapusUser('${u.uid}')"><i class="fas fa-trash"></i></button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function bukaModalUser(uid = null) {
    document.getElementById('user-id').value = uid || '';
    document.getElementById('modal-title').innerHTML = uid ? '<i class="fas fa-edit"></i> Edit User' : '<i class="fas fa-user-plus"></i> Tambah User';
    document.getElementById('password-hint').style.display = uid ? 'inline' : 'none';
    document.getElementById('user-password').required = !uid;
    
    if (uid) {
        const u = usersData.find(x => x.uid === uid);
        document.getElementById('user-nama').value = u.nama || '';
        document.getElementById('user-email').value = u.email || '';
        document.getElementById('user-role-select').value = u.role || 'kasir';
        document.getElementById('user-active').checked = u.active !== false;
        document.getElementById('user-password').value = '';
    } else {
        document.getElementById('user-nama').value = '';
        document.getElementById('user-email').value = '';
        document.getElementById('user-role-select').value = 'kasir';
        document.getElementById('user-active').checked = true;
        document.getElementById('user-password').value = '';
    }
    
    openModal('modal-user');
}

async function simpanUser() {
    const uid = document.getElementById('user-id').value;
    const nama = document.getElementById('user-nama').value.trim();
    const email = document.getElementById('user-email').value.trim();
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role-select').value;
    const active = document.getElementById('user-active').checked;

    if (!nama || !email) {
        alert('Nama dan email wajib diisi');
        return;
    }

    try {
        if (uid) {
            // Update existing
            const updates = { nama, email, role, active, updated_at: firebase.database.ServerValue.TIMESTAMP };
            if (password) {
                // Update password via Firebase Auth (requires admin SDK or re-auth)
                // For client-side, this is limited
            }
            await database.ref(`users/${uid}`).update(updates);
            showToast('User berhasil diupdate', 'success');
        } else {
            // Create new - in real implementation, use Firebase Admin SDK or Cloud Function
            // This is simplified version
            const newUserRef = database.ref('users').push();
            await newUserRef.set({
                nama, email, role, active,
                created_at: firebase.database.ServerValue.TIMESTAMP
            });
            showToast('User berhasil ditambahkan (set password via Firebase Console)', 'success');
        }
        closeModal('modal-user');
        loadUsers();
    } catch (error) {
        console.error('Error saving user:', error);
        alert('Gagal menyimpan user');
    }
}

function editUser(uid) {
    bukaModalUser(uid);
}

async function hapusUser(uid) {
    if (!confirm('Yakin ingin menghapus user ini?')) return;
    
    try {
        await database.ref(`users/${uid}`).remove();
        showToast('User berhasil dihapus', 'success');
        loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Gagal menghapus user');
    }
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function updateDateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('current-date').textContent = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

window.bukaModalUser = bukaModalUser;
window.closeModal = closeModal;
window.openModal = openModal;
window.editUser = editUser;
window.hapusUser = hapusUser;
