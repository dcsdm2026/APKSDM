document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Toggle Sembunyikan/Tampilkan Password
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.querySelector('i').classList.toggle('fa-eye');
        togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
    });

    // Proses Handler Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
            // Memeriksa kredensial dari tabel role_akses
            const { data, error } = await supabase
                .from('role_akses')
                .select('*')
                .eq('email', email)
                .eq('password', password) // Catatan: Disarankan hashing pada sistem produksi
                .single();

            if (error || !data) {
                alert('Email atau password salah, silakan periksa kembali berkas login Anda.');
                return;
            }

            // Menyimpan sesi user di LocalStorage
            localStorage.setItem('hris_session', JSON.stringify(data));
            window.location.href = 'index.html';
        } catch (err) {
            console.error(err);
            alert('Terjadi kendala saat menghubungkan ke sistem.');
        }
    });
});
