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

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');

    loginError.style.display = 'none';

    if (!username || !password) {
        loginError.textContent = 'Username dan password harus diisi!';
        loginError.style.display = 'block';
        return;
    }

    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    loginBtn.disabled = true;

    try {
        console.log('Mencoba login:', username);

        // Gunakan "db" bukan "supabase"
        const { data, error } = await db
            .from('admins')
            .select('*')
            .eq('username', username)
            .eq('password_hash', password);

        console.log('Data:', data);
        console.log('Error:', error);

        if (error) {
            loginError.textContent = 'Error: ' + error.message;
            loginError.style.display = 'block';
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
            loginBtn.disabled = false;
            return;
        }

        if (!data || data.length === 0) {
            loginError.textContent = 'Username atau password salah!';
            loginError.style.display = 'block';
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
            loginBtn.disabled = false;
            return;
        }

        // LOGIN BERHASIL
        const admin = data[0];
        sessionStorage.setItem('siec_admin', JSON.stringify({
            id: admin.id,
            username: admin.username,
            full_name: admin.full_name
        }));

        console.log('Login berhasil! Redirect ke dashboard...');
        window.location.href = 'admin-dashboard.html';

    } catch (err) {
        console.log('Catch error:', err);
        loginError.textContent = 'Kesalahan: ' + err.message;
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