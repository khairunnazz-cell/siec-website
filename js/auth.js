// ============================================
// SIEC - Authentication (Supabase Auth)
// Login admin SEKARANG lewat sistem auth bawaan Supabase,
// bukan lagi membaca tabel 'admins' secara langsung.
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

    const email = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');

    loginError.style.display = 'none';

    if (!email || !password) {
        loginError.textContent = 'Email dan password harus diisi!';
        loginError.style.display = 'block';
        return;
    }

    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    loginBtn.disabled = true;

    try {
        const { data, error } = await db.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            loginError.textContent = 'Email atau password salah!';
            loginError.style.display = 'block';
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
            loginBtn.disabled = false;
            return;
        }

        // LOGIN BERHASIL — sesi dikelola Supabase Auth secara otomatis
        sessionStorage.setItem('siec_admin', JSON.stringify({
            id: data.user.id,
            username: data.user.email,
            full_name: data.user.user_metadata && data.user.user_metadata.full_name
                ? data.user.user_metadata.full_name
                : 'Admin SIEC'
        }));

        window.location.href = 'admin-dashboard.html';

    } catch (err) {
        loginError.textContent = 'Kesalahan: ' + err.message;
        loginError.style.display = 'block';
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
        loginBtn.disabled = false;
    }
}

async function checkAuth() {
    const admin = sessionStorage.getItem('siec_admin');
    if (!admin) {
        window.location.href = 'admin-login.html';
        return null;
    }
    // Pastikan sesi Supabase masih hidup
    try {
        const { data } = await db.auth.getSession();
        if (!data.session) {
            sessionStorage.removeItem('siec_admin');
            window.location.href = 'admin-login.html';
            return null;
        }
    } catch (e) { /* biarkan lanjut jika error jaringan sesaat */ }
    return JSON.parse(admin);
}

async function handleLogout() {
    try { await db.auth.signOut(); } catch (e) {}
    sessionStorage.removeItem('siec_admin');
    window.location.href = 'admin-login.html';
}
