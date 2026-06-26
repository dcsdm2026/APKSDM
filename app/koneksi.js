// Konfigurasi koneksi Supabase JS Client v2
const SUPABASE_URL = "https://your-project-id.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-key-here";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fungsi utilitas global untuk proteksi halaman/session check
function periksaSesi() {
    const sesi = localStorage.getItem("user_session");
    if (!sesi) {
        window.location.href = "/portal.html";
    }
    return JSON.parse(sesi);
}

function keluarSesi() {
    localStorage.removeItem("user_session");
    window.location.href = "/portal.html";
}
