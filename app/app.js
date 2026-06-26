document.addEventListener('DOMContentLoaded', () => {
    // Validasi Sesi Login
    const session = localStorage.getItem('hris_session');
    if (!session) {
        window.location.href = 'portal.html';
        return;
    }
    const userData = JSON.parse(session);
    document.getElementById('userLabel').textContent = userData.nama;

    // Aksi Toggle Sidebar
    const sidebar = document.getElementById('sidebar');
    document.getElementById('sidebarCollapse').addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Logout Engine
    document.getElementById('btnLogout').addEventListener('click', () => {
        if(confirm('Apakah Anda yakin ingin keluar sistem?')) {
            localStorage.removeItem('hris_session');
            window.location.href = 'portal.html';
        }
    });

    // Injeksi Halaman Kerja Pegawai
    const mainFrame = document.getElementById('mainFrame');
    async function loadPegawaiModule() {
        try {
            const response = await fetch('homepage/html/pegawai.html');
            const html = await response.text();
            mainFrame.innerHTML = html;

            // Memuat skrip logika kontroler pegawai setelah DOM ter-injeksi
            const script = document.createElement('script');
            script.src = 'homepage/js/pegawai.js';
            document.body.appendChild(script);
        } catch (err) {
            mainFrame.innerHTML = `<div class="alert alert-danger">Gagal memuat modul kerja: ${err.message}</div>`;
        }
    }

    loadPegawaiModule();
});
