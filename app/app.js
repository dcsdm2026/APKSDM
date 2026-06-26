document.addEventListener("DOMContentLoaded", () => {
    const user = periksaSesi();
    document.getElementById("user-nama").innerText = user.nama;
    document.getElementById("user-role").innerText = user.role;
    document.getElementById("user-avatar").innerText = user.nama.charAt(0).toUpperCase();
    
    // Set default menu awal ke halaman pegawai
    loadMenu('homepage/html/pegawai.html');
    
    // Live clock updater
    setInterval(() => {
        const d = new Date();
        document.getElementById("live-clock").innerText = d.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + " | " + d.toLocaleTimeString('id-ID');
    }, 1000);
});

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("sidebar-hide");
}

// System AJAX Content Loader Injector
async function loadMenu(url) {
    const mainFrame = document.getElementById("main-frame");
    const headerTitle = document.getElementById("header-title");
    
    headerTitle.innerText = url.includes('pengaturan') ? "Pengaturan Parameter Master" : "Manajemen Data Pegawai";
    
    try {
        mainFrame.innerHTML = `<div class="flex items-center justify-center py-20"><i class="fa-solid fa-spinner fa-spin text-4xl text-blue-600"></i></div>`;
        const respon = await fetch(url);
        if (!respon.ok) throw new Error("Gagal mengambil data halaman");
        const html = await respon.text();
        mainFrame.innerHTML = html;

        // Jalankan script inisialisasi modul setelah DOM di-inject
        if (url.includes('pegawai')) {
            initPegawaiModule();
        } else if (url.includes('pengaturan')) {
            initPengaturanModule();
        }
    } catch (err) {
        mainFrame.innerHTML = `<div class="p-4 bg-red-100 text-red-700 rounded-lg">Error: ${err.message}</div>`;
    }
}
