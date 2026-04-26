// ============================================
// SIEC - Authentication
// ============================================

function togglePassword() {
    const pwd = document.getElementById('password');
    const eye = document.getElementById('eyeIcon');
    if (pwd.type === 'password') {
        pwd.type = 'text';
        eye.className = 'fas fa-eye-slash';
    } else {
        pwd.type = 'password';
        eye.className = 'fas fa-eye';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');

    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    loginBtn.disabled = true;
    loginError.style.display = 'none';

    try {
        const { data, error } = await supabase
            .from('admins')
            .select('*')
            .eq('username', username)
            .eq('password_hash', password)
            .single();

        if (error || !data) {
            loginError.textContent = 'Username atau password salah!';
            loginError.style.display = 'block';
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
            loginBtn.disabled = false;
            return;
        }

        // Save session
        sessionStorage.setItem('siec_admin', JSON.stringify({
            id: data.id,
            username: data.username,
            full_name: data.full_name
        }));

        window.location.href = 'admin-dashboard.html';
    } catch (err) {
        loginError.textContent = 'Terjadi kesalahan. Coba lagi.';
        loginError.style.display = 'block';
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
        loginBtn.disabled = false;
    }
}

function checkAuth() {
    const admin = sessionStorage.getItem('siec_admin');
    if (!admin) {
        window.location.href = 'admin-login.html';
        return null;
    }
    return JSON.parse(admin);
}

function handleLogout() {
    sessionStorage.removeItem('siec_admin');
    window.location.href = 'admin-login.html';
}