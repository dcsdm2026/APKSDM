/**
 * HRIS RSUD Drs. H. AMRI TAMBUNAN - Module Pengaturan Master Data
 * Filename: pengaturan.js
 * Description: Mengatur manajemen opsi master data dengan proteksi ketat Null-Safety.
 */

function initPengaturanModule() {
    // 1. Ambil data saat modul dimuat
    ambilDataMaster();

    // 2. Tempelkan event listener ke form submit secara otomatis (jika ada)
    // const formPengaturan = document.getElementById("form-pengaturan") || document.getElementById("formPengaturan");
    // if (formPengaturan) {
     //   formPengaturan.addEventListener("submit", simpanMasterData);
   // }
}

async function ambilDataMaster() {
    const tbody = document.getElementById("tabel-pengaturan-body");
    if (!tbody) return;
    
    try {
        // Ambil data dari tabel 'pengaturan' diurutkan berdasarkan kolom 'master_data'
        const { data, error } = await supabase
            .from("pengaturan")
            .select("*")
            .order("master_data", { ascending: true });

        if (error) {
            console.error("Supabase Error:", error.message);
            return;
        }

        // Jika data dari database kosong
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="p-3 text-center text-slate-400 text-xs">Belum ada pilihan master data.</td></tr>`;
            return;
        }

        // Render baris tabel secara dinamis
        tbody.innerHTML = data.map(d => {
            // FIX ERROR: Proteksi null/undefined dengan fallback string kosong "" sebelum .toUpperCase()
            const teksMasterData = (d.master_data || "").toUpperCase();
            const teksKeterangan = d.keterangan || "-";
            
            // Antisipasi fleksibel nama kolom primary key (id atau id_pengaturan)
            const idData = d.id_pengaturan || d.id; 

            return `
                <tr class="hover:bg-slate-50 transition">
                    <td class="p-3 font-semibold text-blue-600 text-xs">${teksMasterData}</td>
                    <td class="p-3 text-xs text-slate-600">${teksKeterangan}</td>
                    <td class="p-3 text-center">
                        <button onclick="hapusMasterData('${idData}')" class="text-red-500 hover:text-red-700 p-1" title="Hapus Opsi">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error("Sistem gagal merender tabel pengaturan:", err.message);
    }
}

async function simpanMasterData(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    
    const inputMasterData = document.getElementById("p-master_data");
    const inputKeterangan = document.getElementById("p-keterangan");

    if (!inputMasterData) return;

    const master_data = inputMasterData.value.trim();
    const keterangan = inputKeterangan ? inputKeterangan.value.trim() : "";

    // Validasi input agar user tidak memasukkan data kosong
    if (!master_data) {
        alert("Mohon isi nama entitas master data terlebih dahulu!");
        return;
    }

    const { error } = await supabase
        .from("pengaturan")
        .insert([{ master_data, keterangan }]);

    if (error) {
        alert("Gagal menambahkan entitas: " + error.message);
    } else {
        // Reset input form setelah berhasil disimpan
        inputMasterData.value = "";
        if (inputKeterangan) inputKeterangan.value = "";
        
        // Muat ulang isi tabel
        ambilDataMaster();
    }
}

async function hapusMasterData(id) {
    if (!id || id === "undefined") return;

    if (confirm("Apakah anda bersedia menghapus opsi pilihan ini?")) {
        // PERBAIKAN: Jangan gunakan .or(), langsung gunakan .eq() ke kolom 'id'
        const { error } = await supabase
            .from("pengaturan")
            .delete()
            .eq("id", id); // <--- Mengincar kolom 'id' yang pasti ada di database

        if (error) {
            alert("Gagal menghapus entitas master data: " + error.message);
        } else {
            // Muat ulang data setelah sukses menghapus
            ambilDataMaster();
        }
    }
}

// WAJIB: Daftarkan fungsi ke objek global 'window' agar tag HTML dengan atribut onclick="..." dapat memanggilnya
window.initPengaturanModule = initPengaturanModule;
window.ambilDataMaster = ambilDataMaster;
window.simpanMasterData = simpanMasterData;
window.hapusMasterData = hapusMasterData;
