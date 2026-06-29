/**
 * HRIS RSUD Drs. H. AMRI TAMBUNAN - Module SKP
 * Filename: skp.js
 */

let currentPage = 1;
const limitPerPage = 25;
let searchQuery = "";
let currentFilterTahun = "";

function initSkpModule() {
    ambilDataSkp();
}

async function ambilDataSkp() {
    const tbody = document.getElementById("tabel-skp-body");
    if (!tbody) return;

    try {
        const from = (currentPage - 1) * limitPerPage;
        const to = from + limitPerPage - 1;

        let query = supabase.from("skp").select("*", { count: "exact" });

        if (searchQuery) {
            query = query.or(`nama.ilike.%${searchQuery}%,nik.ilike.%${searchQuery}%,nip.ilike.%${searchQuery}%`);
        }
        if (currentFilterTahun) {
            query = query.eq("tahun_skp", currentFilterTahun);
        }

        const { data, error, count } = await query
            .order("tahun_skp", { ascending: false })
            .range(from, to);

        if (error) throw error;

        document.getElementById("btn-prev").disabled = currentPage === 1;
        document.getElementById("btn-next").disabled = to >= (count - 1);
        document.getElementById("info-halaman").innerText = `Halaman: ${currentPage} dari ${Math.ceil(count / limitPerPage) || 1}`;

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-3 text-center text-slate-400 text-xs">Belum ada dokumen evaluasi SKP.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(d => {
            return `
                <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                    <td class="p-3">
                        <div class="text-xs font-semibold text-blue-600">${(d.nama || "").toUpperCase()}</div>
                        <div class="text-[10px] text-slate-500">NIP: ${d.nip || "-"} | NIK: ${d.nik || "-"}</div>
                    </td>
                    <td class="p-3 text-xs text-slate-600">${d.jabatan || "-"}</td>
                    <td class="p-3 text-xs font-semibold text-slate-700">${d.tahun_skp || "-"}</td>
                    <td class="p-3 text-xs">
                        <div class="text-slate-600">Org: <span class="font-medium">${d.capaian_kinerja_organisasi || "-"}</span></div>
                        <div class="text-blue-600 font-semibold">Pegawai: ${d.predikat_kinerja_pegawai || "-"}</div>
                    </td>
                    <td class="p-3 text-center">
                        ${d.lampiran_skp ? `<a href="${d.lampiran_skp}" target="_blank" class="text-xs text-blue-600 hover:underline"><i class="fa-solid fa-paperclip"></i> Dokumen</a>` : `<span class="text-[10px] text-slate-400">-</span>`}
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

    } catch (err) {
        console.error("Gagal memuat tabel SKP:", err.message);
    }
}

function cariData() {
    searchQuery = (document.getElementById("cari-skp")?.value || "").trim();
    currentFilterTahun = document.getElementById("filter-tahun")?.value || "";
    currentPage = 1;
    ambilDataSkp();
}

function halamanSebelumnya() { if (currentPage > 1) { currentPage--; ambilDataSkp(); } }
function halamanBerikutnya() { currentPage++; ambilDataSkp(); }

async function handleAutocomplete(val) {
    const box = document.getElementById("autocomplete-results");
    if (!box) return;
    if (val.trim().length < 2) { box.classList.add("hidden"); return; }

    try {
        const { data, error } = await supabase
            .from("pegawai")
            .select("nik, nama, nip, jabatan")
            .ilike("nama", `%${val}%`)
            .limit(5);

        if (error || !data || data.length === 0) {
            box.innerHTML = `<div class="p-2 text-xs text-slate-400 italic">Pegawai tidak ditemukan</div>`;
            box.classList.remove("hidden");
            return;
        }

        box.innerHTML = data.map(p => `
            <div onclick="pilihPegawai('${p.nik}', '${p.nama}', '${p.nip || ''}', '${p.jabatan || ''}')" class="p-2 text-xs hover:bg-slate-100 cursor-pointer transition flex flex-col">
                <span class="font-semibold text-slate-800">${p.nama.toUpperCase()}</span>
                <span class="text-[10px] text-slate-500">NIP: ${p.nip || "-"}</span>
            </div>
        `).join('');
        box.classList.remove("hidden");
    } catch (err) { console.error(err); }
}

function pilihPegawai(nik, nama, nip, jabatan) {
    document.getElementById("form-nik").value = nik || "";
    document.getElementById("form-nama").value = nama || "";
    document.getElementById("form-nip").value = nip || "";
    document.getElementById("form-jabatan").value = jabatan || "";
    document.getElementById("autocomplete-input").value = nama || "";
    document.getElementById("autocomplete-results").classList.add("hidden");
}

async function simpanData(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    const id = document.getElementById("form-id").value;
    const nik = document.getElementById("form-nik").value;
    const nama = document.getElementById("form-nama").value;
    const nip = document.getElementById("form-nip").value;
    const jabatan = document.getElementById("form-jabatan").value;
    const pejabat_penilai = document.getElementById("form-penilai").value.trim();
    const atasan_pejabat_penilai = document.getElementById("form-atasan").value.trim();
    const tahun_skp = parseInt(document.getElementById("form-tahun").value);
    const capaian_kinerja_organisasi = document.getElementById("form-capaian").value.trim();
    const predikat_kinerja_pegawai = document.getElementById("form-predikat").value.trim();
    const catatan_rekomendasi = document.getElementById("form-rekomendasi").value.trim();
    const inputFile = document.getElementById("form-lampiran");

    if (!nik) { alert("Pilih pegawai terlebih dahulu!"); return; }

    try {
        let fileUrl = null;
        if (inputFile && inputFile.files.length > 0) {
            const file = inputFile.files[0];
            const ext = file.name.split('.').pop();
            const pathName = `${nik}_SKP_${tahun_skp}_${Date.now()}.${ext}`;

            const { error: uploadErr } = await supabase.storage.from("skp").upload(pathName, file);
            if (uploadErr) throw uploadErr;

            fileUrl = supabase.storage.from("skp").getPublicUrl(pathName).data.publicUrl;
        }

        const payload = { 
            nik, nama, nip, jabatan, pejabat_penilai, atasan_pejabat_penilai, 
            tahun_skp, capaian_kinerja_organisasi, predikat_kinerja_pegawai, catatan_rekomendasi 
        };
        if (fileUrl) payload.lampiran_skp = fileUrl;

        if (id) {
            const { error } = await supabase.from("skp").update(payload).eq("id", id);
            if (error) throw error;
        } else {
            if (!fileUrl) { alert("Berkas lampiran SKP wajib diunggah!"); return; }
            const { error } = await supabase.from("skp").insert([payload]);
            if (error) throw error;
        }

        tutupModal();
        ambilDataSkp();
    } catch (err) { alert("Gagal mengeksekusi data: " + err.message); }
}

async function editData(id) {
    try {
        const { data, error } = await supabase.from("skp").select("*").eq("id", id).single();
        if (error) throw error;

        bukaModal(true);
        document.getElementById("form-id").value = data.id;
        document.getElementById("form-nik").value = data.nik || "";
        document.getElementById("form-nama").value = data.nama || "";
        document.getElementById("form-nip").value = data.nip || "";
        document.getElementById("form-jabatan").value = data.jabatan || "";
        document.getElementById("autocomplete-input").value = data.nama || "";
        document.getElementById("form-penilai").value = data.pejabat_penilai || "";
        document.getElementById("form-atasan").value = data.atasan_pejabat_penilai || "";
        document.getElementById("form-tahun").value = data.tahun_skp || "";
        document.getElementById("form-capaian").value = data.capaian_kinerja_organisasi || "";
        document.getElementById("form-predikat").value = data.predikat_kinerja_pegawai || "";
        document.getElementById("form-rekomendasi").value = data.catatan_rekomendasi || "";
    } catch (err) { alert(err.message); }
}

async function hapusData(id) {
    if (!id || !confirm("Hapus rekam data SKP ini?")) return;
    try {
        const { error } = await supabase.from("skp").delete().eq("id", id);
        if (error) throw error;
        ambilDataSkp();
    } catch (err) { alert(err.message); }
}

function bukaModal(isEdit = false) {
    document.getElementById("modal-title").innerText = isEdit ? "Ubah Data SKP" : "Tambah Data SKP";
    document.getElementById("file-helper").classList.toggle("hidden", !isEdit);
    document.getElementById("form-skp").reset();
    document.getElementById("form-id").value = "";
    document.getElementById("modal-skp").classList.remove("hidden");
}

function tutupModal() {
    document.getElementById("modal-skp").classList.add("hidden");
    document.getElementById("autocomplete-results").classList.add("hidden");
}

window.initSkpModule = initSkpModule;
window.ambilDataSkp = ambilDataSkp;
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
