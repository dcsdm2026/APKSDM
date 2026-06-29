/**
 * HRIS RSUD Drs. H. AMRI TAMBUNAN - Module SPKRKK
 * Filename: spkrkk.js
 */

let currentPage = 1;
const limitPerPage = 25;
let searchQuery = "";
let currentFilterBidang = "";

function initSpkrkkModule() {
    ambilDataSpkrkk();
}

async function ambilDataSpkrkk() {
    const tbody = document.getElementById("tabel-spkrkk-body");
    if (!tbody) return;

    try {
        const from = (currentPage - 1) * limitPerPage;
        const to = from + limitPerPage - 1;

        let query = supabase.from("spkrkk").select("*", { count: "exact" });

        if (searchQuery) {
            query = query.or(`nama.ilike.%${searchQuery}%,nik.ilike.%${searchQuery}%`);
        }
        if (currentFilterBidang) {
            query = query.eq("bidang", currentFilterBidang);
        }

        const { data, error, count } = await query
            .order("id", { ascending: false })
            .range(from, to);

        if (error) throw error;

        document.getElementById("btn-prev").disabled = currentPage === 1;
        document.getElementById("btn-next").disabled = to >= (count - 1);
        document.getElementById("info-halaman").innerText = `Halaman: ${currentPage} dari ${Math.ceil(count / limitPerPage) || 1}`;

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-3 text-center text-slate-400 text-xs">Belum ada dokumen SPKRKK yang terdaftar.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(d => {
            const labelNama = (d.nama || "").toUpperCase();
            const labelNik = d.nik || "-";
            const labelBidang = d.bidang || "-";
            const noSpk = d.no_spk || "-";
            const tglTerbit = d.tanggal_terbit || "-";
            const tglBerakhir = d.tanggal_berakhir || "-";
            const fileUrl = d.file || "";

            return `
                <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                    <td class="p-3">
                        <div class="text-xs font-semibold text-blue-600">${labelNama}</div>
                        <div class="text-[10px] text-slate-500">NIK: ${labelNik}</div>
                    </td>
                    <td class="p-3 text-xs text-slate-600">${labelBidang}</td>
                    <td class="p-3 text-xs font-mono text-slate-700">${noSpk}</td>
                    <td class="p-3 text-xs text-slate-600">${tglTerbit} s.d ${tglBerakhir}</td>
                    <td class="p-3 text-center">
                        ${fileUrl ? `<a href="${fileUrl}" target="_blank" class="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"><i class="fa-solid fa-file-pdf"></i> Lihat</a>` : `<span class="text-[10px] text-slate-400">-</span>`}
                    </td>
                    <td class="p-3 text-center">
                        <div class="flex justify-center gap-2">
                            <button onclick="editData('${d.id}')" class="text-amber-500 hover:text-amber-700 p-1 text-xs" title="Edit Data"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button onclick="hapusData('${d.id}')" class="text-red-500 hover:text-red-700 p-1 text-xs" title="Hapus Data"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error("Gagal memuat tabel SPKRKK:", err.message);
    }
}

function cariData() {
    searchQuery = (document.getElementById("cari-spkrkk")?.value || "").trim();
    currentFilterBidang = document.getElementById("filter-bidang")?.value || "";
    currentPage = 1;
    ambilDataSpkrkk();
}

function halamanSebelumnya() { if (currentPage > 1) { currentPage--; ambilDataSpkrkk(); } }
function halamanBerikutnya() { currentPage++; ambilDataSpkrkk(); }

async function handleAutocomplete(val) {
    const box = document.getElementById("autocomplete-results");
    if (!box) return;
    if (val.trim().length < 2) {
        box.classList.add("hidden");
        return;
    }

    try {
        const { data, error } = await supabase
            .from("pegawai")
            .select("nik, nama")
            .ilike("nama", `%${val}%`)
            .limit(5);

        if (error || !data || data.length === 0) {
            box.innerHTML = `<div class="p-2 text-xs text-slate-400 italic">Pegawai tidak ditemukan</div>`;
            box.classList.remove("hidden");
            return;
        }

        box.innerHTML = data.map(p => `
            <div onclick="pilihPegawai('${p.nik}', '${p.nama}')" class="p-2 text-xs hover:bg-slate-100 cursor-pointer transition flex flex-col">
                <span class="font-semibold text-slate-800">${p.nama.toUpperCase()}</span>
                <span class="text-[10px] text-slate-500">NIK: ${p.nik}</span>
            </div>
        `).join('');
        box.classList.remove("hidden");
    } catch (err) {
        console.error("Autocomplete Error:", err.message);
    }
}

function pilihPegawai(nik, nama) {
    document.getElementById("form-nik").value = nik || "";
    document.getElementById("form-nama").value = nama || "";
    document.getElementById("autocomplete-input").value = nama || "";
    document.getElementById("autocomplete-results").classList.add("hidden");
}

async function simpanData(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    const id = document.getElementById("form-id").value;
    const nik = document.getElementById("form-nik").value;
    const nama = document.getElementById("form-nama").value;
    const bidang = document.getElementById("form-bidang").value;
    const no_spk = document.getElementById("form-no-spk").value.trim();
    const tanggal_terbit = document.getElementById("form-tanggal-terbit").value;
    const tanggal_berakhir = document.getElementById("form-tanggal-berakhir").value;
    const inputFile = document.getElementById("form-file");

    if (!nik || !nama) {
        alert("Silahkan pilih pegawai melalui kolom autocomplete pencarian nama!");
        return;
    }

    try {
        let fileUrl = null;
        if (inputFile && inputFile.files.length > 0) {
            const file = inputFile.files[0];
            const ext = file.name.split('.').pop();
            const pathName = `${nik}_${Date.now()}.${ext}`;

            const { error: uploadErr } = await supabase.storage
                .from("spkrkk")
                .upload(pathName, file);

            if (uploadErr) throw new Error("Gagal mengunggah file: " + uploadErr.message);

            fileUrl = supabase.storage.from("spkrkk").getPublicUrl(pathName).data.publicUrl;
        }

        const payload = { nik, nama, bidang, no_spk, tanggal_terbit, tanggal_berakhir };
        if (fileUrl) payload.file = fileUrl;

        if (id) {
            const { error } = await supabase.from("spkrkk").update(payload).eq("id", id);
            if (error) throw error;
        } else {
            if (!fileUrl) {
                alert("Wajib mengunggah file dokumen untuk data SPKRKK baru!");
                return;
            }
            const { error } = await supabase.from("spkrkk").insert([payload]);
            if (error) throw error;
        }

        tutupModal();
        ambilDataSpkrkk();
    } catch (err) {
        alert("Sistem gagal memproses data: " + err.message);
    }
}

async function editData(id) {
    if (!id) return;
    try {
        const { data, error } = await supabase.from("spkrkk").select("*").eq("id", id).single();
        if (error) throw error;

        bukaModal(true);
        document.getElementById("form-id").value = data.id;
        document.getElementById("form-nik").value = data.nik || "";
        document.getElementById("form-nama").value = data.nama || "";
        document.getElementById("autocomplete-input").value = data.nama || "";
        document.getElementById("form-bidang").value = data.bidang || "";
        document.getElementById("form-no-spk").value = data.no_spk || "";
        document.getElementById("form-tanggal-terbit").value = data.tanggal_terbit || "";
        document.getElementById("form-tanggal-berakhir").value = data.tanggal_berakhir || "";
    } catch (err) {
        alert("Gagal mengambil detail data: " + err.message);
    }
}

async function hapusData(id) {
    if (!id || !confirm("Apakah Anda yakin bersedia menghapus data SPKRKK ini secara permanen?")) return;
    try {
        const { error } = await supabase.from("spkrkk").delete().eq("id", id);
        if (error) throw error;
        ambilDataSpkrkk();
    } catch (err) {
        alert("Gagal menghapus data: " + err.message);
    }
}

function bukaModal(isEdit = false) {
    document.getElementById("modal-title").innerText = isEdit ? "Ubah Data SPKRKK" : "Tambah Data SPKRKK";
    document.getElementById("file-helper").classList.toggle("hidden", !isEdit);
    document.getElementById("form-spkrkk").reset();
    document.getElementById("form-id").value = "";
    document.getElementById("modal-spkrkk").classList.remove("hidden");
}

function tutupModal() {
    document.getElementById("modal-spkrkk").classList.add("hidden");
    document.getElementById("autocomplete-results").classList.add("hidden");
}

window.initSpkrkkModule = initSpkrkkModule;
window.ambilDataSpkrkk = ambilDataSpkrkk;
window.cariData = cariData;
window.halamanSebelumnya = halamanSebelumnya;
window.halamanBerikutnya = halamanBerikutnya;
window.handleAutocomplete = handleAutocomplete;
window.pilihPegawai = pilihPegawai;
window.simpanData = simpanData;
window.editData = editData;
window.hapusData = hapusData;
window.bukaModal = bukaModal;
window.tutupModal = tutupModal;
