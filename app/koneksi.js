// Konfigurasi koneksi Supabase JS Client v2
const SUPABASE_URL = "https://rojeeobahksjfibndsxd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvamVlb2JhaGtzamZpYm5kc3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0Mjc0MDcsImV4cCI6MjA5ODAwMzQwN30.iP_T2WgX1BJLs8xzVyQgqu7u45_X67rSRt_X6eT4dek";

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
