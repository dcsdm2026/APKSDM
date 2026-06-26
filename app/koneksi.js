// Menggunakan var agar tidak memicu error "already been declared" jika file termuat ulang
var SUPABASE_URL = "https://rojeeobahksjfibndsxd.supabase.co"; // <-- Ganti dengan URL proyek Anda
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvamVlb2JhaGtzamZpYm5kc3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0Mjc0MDcsImV4cCI6MjA5ODAwMzQwN30.iP_T2WgX1BJLs8xzVyQgqu7u45_X67rSRt_X6eT4dek"; // <-- Ganti dengan Anon Key Anda

// Ambil objek library dasar dari CDN sebelum ditimpa
var supabaseLib = window.supabase;

// Buat instance client unik hanya jika belum pernah diinisialisasi
if (!window.supabaseInstance && supabaseLib) {
    window.supabaseInstance = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Ekspos kembali dengan nama 'supabase' agar file JS lain (app.js, pegawai.js) tetap bekerja tanpa ubah kode
var supabase = window.supabaseInstance;

// Definisikan fungsi session check secara aman pada scope global (window)
if (typeof window.periksaSesi !== 'function') {
    window.periksaSesi = function() {
        const sesi = localStorage.getItem("user_session");
        if (!sesi) {
            window.location.href = "portal.html";
        }
        return JSON.parse(sesi);
    };
}

if (typeof window.keluarSesi !== 'function') {
    window.keluarSesi = function() {
        localStorage.removeItem("user_session");
        window.location.href = "portal.html";
    };
}
