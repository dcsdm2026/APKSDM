/**
 * HRIS RSUD Drs. H. AMRI TAMBUNAN - Module Sertifikat
 * Filename: sertifikat.js
 */

let currentPage = 1;
const limitPerPage = 25;
let searchQuery = "";
let currentFilterJenis = "";

function initSertifikatModule() {
    ambilDataSertifikat();
}

async function ambilDataSertifikat() {
    const tbody = document.getElementById("tabel-sertifikat-body");
    if (!tbody) return;

    try {
        const from = (currentPage - 1) * limitPerPage;
        const to = from + limitPerPage - 1;

        let query = supabase.from("sertifikat").select("*", { count: "exact" });

        if (searchQuery) {
            query = query.or(`nama.ilike.%${searchQuery}%,nik.ilike.%${searchQuery}%,judul_kegiatan.ilike.%${searchQuery}%`);
        }
        if (currentFilterJenis) {
            query = query.eq("jenis_sertifikat", currentFilterJenis);
        }

        const { data, error, count } = await query
            .order("id", { ascending: false })
            .range(from, to);

        if (error) throw error;

        document.getElementById("btn-prev").disabled = currentPage === 1;
        document.getElementById("btn-next").disabled = to >= (count - 1);
        document.getElementById("info-halaman").innerText = `Halaman: ${currentPage} dari ${Math.ceil(count / limitPerPage) || 1}`;

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-3 text-center text-slate-400 text-xs">Tidak ditemukan arsip sertifikat pengembangan kompetensi.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(d => {
            return `
                <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                    <td class="p-3">
                        <div class="text-xs font-semibold text-blue-600">${(d.nama || "").toUpperCase()}</div>
                        <div class="text-[10px] text-slate-500">NIK: ${d.nik || "-"}</div>
                    </td>
                    <td class="p-3 text-xs">
                        <div class="font-semibold text-slate-900">[${d.jenis_sertifikat || ""}] ${d.judul_kegiatan || ""}</div>
                        <div class="text-[10px] text-slate-500">No: ${d.no_sertifikat || "-"}</div>
                    </td>
                    <td class="p-3 text-xs text-slate-600">${d.mulai || ""} s.d ${d.selesai || ""}</td>
                    <td class="p-3 text-xs text-slate-700">
                        <div>JPL: <span class="font-semibold">${d.jpl || "0"}</span></div>
                        <div>SKP: <span class="font-semibold text-emerald-600">${d.skp || "-"}</span></div>
                    </td>
                    <td class="p-3 text-center">
                        ${d.file_sertifikat ? `<a href="${d.file_sertifikat}" target="_blank" class="text-xs text-blue-600 hover:underline"><i class="fa-solid fa-file-invoice"></i> File</a>` : `<span class="text-[10px] text-slate-400">-</span>`}
                    </td>
                    <td class="p-3 text-center">
                        <div class="flex justify-center gap-2">
                            <button onclick="editData('${d.id}')" class="text-amber-500 hover:text-amber-700 p-1 text-xs"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button onclick="hapusData('${d.id}')" class="text-red-500 hover:text-red-700 p-1 text-xs"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) { console.error(err); }
}

function cariData() {
    searchQuery = (document.getElementById("cari-sertifikat")?.value || "").trim();
    currentFilterJenis = document.getElementById("filter-jenis")?.value || "";
    currentPage = 1;
    ambilDataSertifikat();
}

function halamanSebelumnya() { if (currentPage > 1) { currentPage--; ambilDataSertifikat(); } }
function halamanBerikutnya() { currentPage++; ambilDataSertifikat(); }

async function handleAutocomplete(val) {
    const box = document.getElementById("autocomplete-results");
    if (!box) return;
    if (val.trim().length < 2) { box.classList.add("hidden"); return; }

    try {
        const { data, error } = await supabase.from("pegawai").select("nik, nama").ilike("nama", `%${val}%`).limit(5);
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
    } catch (err) { console.error(err); }
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
    const no_sertifikat = document.getElementById("form-no-sertifikat").value.trim();
    const jenis_sertifikat = document.getElementById("form-jenis").value;
    const judul_kegiatan = document.getElementById("form-judul").value.trim();
    const mulai = document.getElementById("form-mulai").value;
    const selesai = document.getElementById("form-selesai").value;
    const jpl = parseInt(document.getElementById("form-jpl").value) || 0;
    const skp = document.getElementById("form-skp-nilai").value.trim();
    const inputFile = document.getElementById("form-file-sertifikat");

    if (!nik) { alert("Pilih pegawai pemilik sertifikat terlebih dahulu!"); return; }

    try {
        let fileUrl = null;
        if (inputFile && inputFile.files.length > 0) {
            const file = inputFile.files[0];
            const ext = file.name.split('.').pop();
            const pathName = `${nik}_CERT_${Date.now()}.${ext}`;

            const { error: uploadErr } = await supabase.storage.from("sertifikat").upload(pathName, file);
            if (uploadErr) throw uploadErr;

            fileUrl = supabase.storage.from("sertifikat").getPublicUrl(pathName).data.publicUrl;
        }

        const payload = { nik, nama, no_sertifikat, jenis_sertifikat, judul_kegiatan, mulai, selesai, jpl, skp };
        if (fileUrl) payload.file_sertifikat = fileUrl;

        if (id) {
            const { error } = await supabase.from("sertifikat").update(payload).eq("id", id);
            if (error) throw error;
        } else {
            if (!fileUrl) { alert("Wajib melampirkan berkas sertifikat!"); return; }
            const { error } = await supabase.from("sertifikat").insert([payload]);
            if (error) throw error;
        }

        tutupModal();
        ambilDataSertifikat();
    } catch (err) { alert(err.message); }
}

async function editData(id) {
    try {
        const { data, error } = await supabase.from("sertifikat").select("*").eq("id", id).single();
        if (error) throw error;

        bukaModal(true);
        document.getElementById("form-id").value = data.id;
        document.getElementById("form-nik").value = data.nik || "";
        document.getElementById("form-nama").value = data.nama || "";
        document.getElementById("autocomplete-input").value = data.nama || "";
        document.getElementById("form-no-sertifikat").value = data.no_sertifikat || "";
        document.getElementById("form-jenis").value = data.jenis_sertifikat || "Pelatihan";
        document.getElementById("form-judul").value = data.judul_kegiatan || "";
        document.getElementById("form-mulai").value = data.mulai || "";
        document.getElementById("form-selesai").value = data.selesai || "";
        document.getElementById("form-jpl").value = data.jpl || 0;
        document.getElementById("form-skp-nilai").value = data.skp || "";
    } catch (err) { alert(err.message); }
}

async function hapusData(id) {
    if (!id || !confirm("Apakah anda yakin ingin membuang berkas sertifikat kompetensi ini?")) return;
    try {
        const { error } = await supabase.from("sertifikat").delete().eq("id", id);
        if (error) throw error;
        ambilDataSertifikat();
    } catch (err) { alert(err.message); }
}

function bukaModal(isEdit = false) {
    document.getElementById("modal-title").innerText = isEdit ? "Ubah Data Sertifikat" : "Unggah Sertifikat Baru";
    document.getElementById("file-helper").classList.toggle("hidden", !isEdit);
    document.getElementById("form-sertifikat").reset();
    document.getElementById("form-id").value = "";
    document.getElementById("modal-sertifikat").classList.remove("hidden");
}

function tutupModal() {
    document.getElementById("modal-sertifikat").classList.add("hidden");
    document.getElementById("autocomplete-results").classList.add("hidden");
}

window.initSertifikatModule = initSertifikatModule;
window.ambilDataSertifikat = ambilDataSertifikat;
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
