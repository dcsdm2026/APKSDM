/**
 * HRIS RSUD Drs. H. AMRI TAMBUNAN - Module Sertifikat
 * Filename: sertifikat.js
 */
(function () {
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
                query = query.or(`nama.ilike.%${searchQuery}%,judul_kegiatan.ilike.%${searchQuery}%`);
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
                tbody.innerHTML = `<tr><td colspan="6" class="p-3 text-center text-slate-400 text-xs">Belum ada data sertifikat pengembangan kompetensi.</td></tr>`;
                return;
            }

            tbody.innerHTML = data.map(d => {
                const labelNama = (d.nama || "").toUpperCase();
                const labelNik = d.nik || "-";
                const jenis = d.jenis_sertifikat || "-";
                const judul = d.judul_kegiatan || "-";
                const noSertifikat = d.no_sertifikat || "-";
                const fileUrl = d.file_sertifikat || "";

                return `
                    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                        <td class="p-3">
                            <div class="text-xs font-semibold text-blue-600">${labelNama}</div>
                            <div class="text-[10px] text-slate-500">NIK: ${labelNik}</div>
                        </td>
                        <td class="p-3 text-xs text-slate-600">${jenis}</td>
                        <td class="p-3 text-xs font-semibold text-slate-700">${judul}</td>
                        <td class="p-3 text-xs font-mono text-slate-600">${noSertifikat}</td>
                        <td class="p-3 text-center">
                            ${fileUrl ? `<a href="${fileUrl}" target="_blank" class="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"><i class="fa-solid fa-file-pdf"></i> Lihat</a>` : `<span class="text-[10px] text-slate-400">-</span>`}
                        </td>
                        <td class="p-3 text-center">
                            <div class="flex justify-center gap-2">
                                <button onclick="sertifikatModule.editData('${d.id}')" class="text-amber-500 hover:text-amber-700 p-1 text-xs" title="Edit Data"><i class="fa-solid fa-pen-to-square"></i></button>
                                <button onclick="sertifikatModule.hapusData('${d.id}')" class="text-red-500 hover:text-red-700 p-1 text-xs" title="Hapus Data"><i class="fa-solid fa-trash-can"></i></button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

        } catch (err) {
            console.error("Gagal memuat tabel sertifikat:", err.message);
        }
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
                <div onclick="sertifikatModule.pilihPegawai('${p.nik}', '${p.nama}')" class="p-2 text-xs hover:bg-slate-100 cursor-pointer transition flex flex-col">
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
        const jenis_sertifikat = document.getElementById("form-jenis").value;
        const judul_kegiatan = document.getElementById("form-judul").value.trim();
        const no_sertifikat = document.getElementById("form-no-sertifikat").value.trim();
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
                const pathName = `${nik}_CERT_${Date.now()}.${ext}`;

                const { error: uploadErr } = await supabase.storage
                    .from("sertifikat")
                    .upload(pathName, file);

                if (uploadErr) throw new Error("Gagal mengunggah file: " + uploadErr.message);

                fileUrl = supabase.storage.from("sertifikat").getPublicUrl(pathName).data.publicUrl;
            }

            const payload = { nik, nama, jenis_sertifikat, judul_kegiatan, no_sertifikat };
            if (fileUrl) payload.file_sertifikat = fileUrl;

            if (id) {
                const { error } = await supabase.from("sertifikat").update(payload).eq("id", id);
                if (error) throw error;
            } else {
                if (!fileUrl) {
                    alert("Wajib mengunggah file dokumen untuk data sertifikat baru!");
                    return;
                }
                const { error } = await supabase.from("sertifikat").insert([payload]);
                if (error) throw error;
            }

            tutupModal();
            ambilDataSertifikat();
        } catch (err) {
            alert("Sistem gagal memproses data: " + err.message);
        }
    }

    async function editData(id) {
        if (!id) return;
        try {
            const { data, error } = await supabase.from("sertifikat").select("*").eq("id", id).single();
            if (error) throw error;

            bukaModal(true);
            document.getElementById("form-id").value = data.id;
            document.getElementById("form-nik").value = data.nik || "";
            document.getElementById("form-nama").value = data.nama || "";
            document.getElementById("autocomplete-input").value = data.nama || "";
            document.getElementById("form-jenis").value = data.jenis_sertifikat || "";
            document.getElementById("form-judul").value = data.judul_kegiatan || "";
            document.getElementById("form-no-sertifikat").value = data.no_sertifikat || "";
        } catch (err) {
            alert("Gagal mengambil detail data: " + err.message);
        }
    }

    async function hapusData(id) {
        if (!id || !confirm("Apakah Anda yakin bersedia menghapus data sertifikat ini secara permanen?")) return;
        try {
            const { error } = await supabase.from("sertifikat").delete().eq("id", id);
            if (error) throw error;
            ambilDataSertifikat();
        } catch (err) {
            alert("Gagal menghapus data: " + err.message);
        }
    }

    function bukaModal(isEdit = false) {
        document.getElementById("modal-title").innerText = isEdit ? "Ubah Data Sertifikat" : "Tambah Data Sertifikat";
        document.getElementById("file-helper").classList.toggle("hidden", !isEdit);
        document.getElementById("form-sertifikat").reset();
        document.getElementById("form-id").value = "";
        document.getElementById("modal-sertifikat").classList.remove("hidden");
    }

    function tutupModal() {
        document.getElementById("modal-sertifikat").classList.add("hidden");
        document.getElementById("autocomplete-results").classList.add("hidden");
    }

    window.sertifikatModule = {
        init: initSertifikatModule,
        ambilDataSertifikat: ambilDataSertifikat,
        cariData: cariData,
        halamanSebelumnya: halamanSebelumnya,
        halamanBerikutnya: halamanBerikutnya,
        handleAutocomplete: handleAutocomplete,
        pilihPegawai: pilihPegawai,
        simpanData: simpanData,
        editData: editData,
        hapusData: hapusData,
        bukaModal: bukaModal,
        tutupModal: tutupModal
    };
})();
