/**
 * HRIS RSUD Drs. H. AMRI TAMBUNAN - Modul SPK & RKK Pegawai
 * Filename: spkrkk.js
 */

// State Management Global Modul
let spkDataGlobal = [];
let spkPageSekarang = 1;
const spkItemPerHalaman = 25;
let spkTotalItem = 0;
let spkKataKunci = "";
let spkFilterBidang = "";

function initSPKRKKModule() {
    spkPageSekarang = 1;
    ambilDataSPKRKK();
}

async function ambilDataSPKRKK() {
    const tbody = document.getElementById("tabel-spkrkk-body");
    if (!tbody) return;

    try {
        // Bangun query dasar ke database Supabase
        let query = supabase
            .from("spkrkk")
            .select("*", { count: "exact" });

        // Filter berdasar Bidang Komite
        if (spkFilterBidang !== "") {
            query = query.eq("bidang", spkFilterBidang);
        }

        // Filter berdasar Kotak Pencarian (NIK, Nama, atau No SPK)
        if (spkKataKunci !== "") {
            query = query.or(`nama.ilike.%${spkKataKunci}%,nik.ilike.%${spkKataKunci}%,nomor_spk_rkk.ilike.%${spkKataKunci}%`);
        }

        // Jalankan Paginasi (Batas Indeks Jangkauan data)
        const indeksMulai = (spkPageSekarang - 1) * spkItemPerHalaman;
        const indeksSelesai = indeksMulai + spkItemPerHalaman - 1;

        query = query.order("id", { ascending: false }).range(indeksMulai, indeksSelesai);

        const { data, error, count } = await query;

        if (error) throw error;

        spkDataGlobal = data || [];
        spkTotalItem = count || 0;

        renderTabelSPKRKK(indeksMulai);
        updateKontrolPaginasi();

    } catch (err) {
        console.error("Gagal menarik data SPK RKK:", err.message);
        tbody.innerHTML = `<tr><td colspan="9" class="p-4 text-center text-red-500 font-medium">Gagal memuat data dari server.</td></tr>`;
    }
}

function renderTabelSPKRKK(indeksMulai) {
    const tbody = document.getElementById("tabel-spkrkk-body");
    if (!tbody) return;

    if (spkDataGlobal.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="p-4 text-center text-slate-400 italic">Tidak ditemukan arsip data SPK RKK.</td></tr>`;
        return;
    }

    tbody.innerHTML = spkDataGlobal.map((item, index) => {
        const noUrut = indeksMulai + index + 1;
        
        // Format Tanggal Indonesia yang rapi
        const tglTerbit = item.tanggal_terbit ? item.tanggal_terbit.split('-').reverse().join('/') : '-';
        const tglBerakhir = item.tanggal_berakhir ? item.tanggal_berakhir.split('-').reverse().join('/') : '-';

        // Deteksi berkas dokumen
        let komponenFile = `<span class="text-gray-400 italic text-[11px]">Tidak ada file</span>`;
        if (item.file_path) {
            const { data } = supabase.storage.from("spkrkk").getPublicUrl(item.file_path);
            if (data && data.publicUrl) {
                komponenFile = `
                    <a href="${data.publicUrl}" target="_blank" class="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800 px-2 py-1 rounded font-medium border border-blue-200 inline-flex items-center space-x-1 transition">
                        <i class="fa-solid fa-file-lines text-xs"></i> <span>Lihat File</span>
                    </a>`;
            }
        }

        return `
            <tr class="hover:bg-slate-50/80 transition text-slate-600">
                <td class="p-3 text-center font-medium bg-slate-50/40">${noUrut}</td>
                <td class="p-3 font-mono">${item.nik || '-'}</td>
                <td class="p-3 font-semibold text-gray-800">${item.nama || '-'}</td>
                <td class="p-3"><span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">${item.bidang}</span></td>
                <td class="p-3 font-medium text-slate-700">${item.nomor_spk_rkk || '-'}</td>
                <td class="p-3 text-center">${tglTerbit}</td>
                <td class="p-3 text-center">${tglBerakhir}</td>
                <td class="p-3 text-center">${komponenFile}</td>
                <td class="p-3 text-center space-x-1">
                    <button onclick="siapEditSPKRKK('${item.id}')" class="text-amber-600 hover:bg-amber-50 p-1.5 rounded-md border border-transparent hover:border-amber-200 transition" title="Ubah Data">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="hapusSPKRKK('${item.id}', '${item.file_path}')" class="text-rose-600 hover:bg-rose-50 p-1.5 rounded-md border border-transparent hover:border-rose-200 transition" title="Hapus Data">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function updateKontrolPaginasi() {
    const labelHalaman = document.getElementById("label-halaman");
    const infoPaginasi = document.getElementById("info-paginasi");
    const btnBack = document.getElementById("btn-page-back");
    const btnNext = document.getElementById("btn-page-next");

    const totalHalaman = Math.ceil(spkTotalItem / spkItemPerHalaman) || 1;

    if (labelHalaman) labelHalaman.innerText = `Halaman ${spkPageSekarang} # ${totalHalaman}`;

    const mulaiData = spkTotalItem === 0 ? 0 : (spkPageSekarang - 1) * spkItemPerHalaman + 1;
    const akhirData = Math.min(spkPageSekarang * spkItemPerHalaman, spkTotalItem);
    
    if (infoPaginasi) infoPaginasi.innerText = `Menampilkan ${mulaiData} sampai ${akhirData} dari ${spkTotalItem} data`;

    if (btnBack) btnBack.disabled = (spkPageSekarang === 1);
    if (btnNext) btnNext.disabled = (spkPageSekarang >= totalHalaman);
}

function gantiHalamanSPKRKK(arah) {
    spkPageSekarang += arah;
    ambilDataSPKRKK();
}

function filterDataSPKRKK() {
    const select = document.getElementById("filter-bidang");
    spkFilterBidang = select ? select.value : "";
    spkPageSekarang = 1;
    ambilDataSPKRKK();
}

function cariDataSPKRKK() {
    const input = document.getElementById("cari-spkrkk");
    spkKataKunci = input ? input.value.trim() : "";
    spkPageSekarang = 1;
    ambilDataSPKRKK();
}

async function simpanSPKRKK(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    const idData = document.getElementById("spk-id").value;
    const nik = document.getElementById("spk-nik").value.trim();
    const nama = document.getElementById("spk-nama").value.trim();
    const bidang = document.getElementById("spk-bidang").value;
    const nomor_spk_rkk = document.getElementById("spk-nomor").value.trim();
    const tanggal_terbit = document.getElementById("spk-terbit").value;
    const tanggal_berakhir = document.getElementById("spk-berakhir").value;
    const inputFile = document.getElementById("spk-file");

    try {
        let file_path = null;

        // Jika dalam mode EDIT, pertahankan file lama kecuali ada upload berkas baru
        if (idData) {
            const dataLama = spkDataGlobal.find(d => String(d.id) === String(idData));
            if (dataLama) file_path = dataLama.file_path;
        }

        // Proses unggah berkas jika user memilih file baru
        if (inputFile && inputFile.files.length > 0) {
            const fileObj = inputFile.files[0];
            const ekstensi = fileObj.name.split('.').pop();
            const namaFileUnik = `${nik}_${Date.now()}.${ekstensi}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("spkrkk")
                .upload(namaFileUnik, fileObj);

            if (uploadError) throw new Error("Gagal upload file: " + uploadError.message);
            file_path = uploadData.path;
        }

        const payload = { nik, nama, bidang, nomor_spk_rkk, tanggal_terbit, tanggal_berakhir, file_path };

        if (idData) {
            // Aksi Eksekusi UPDATE data
            const { error } = await supabase
                .from("spkrkk")
                .update(payload)
                .eq("id", idData);

            if (error) throw error;
            alert("Data SPK & RKK berhasil diperbarui!");
        } else {
            // Aksi Eksekusi INSERT data baru
            const { error } = await supabase
                .from("spkrkk")
                .insert([payload]);

            if (error) throw error;
            alert("Data SPK & RKK berhasil ditambahkan!");
        }

        resetFormSPKRKK();
        ambilDataSPKRKK();

    } catch (err) {
        alert("Terjadi Kendala: " + err.message);
    }
}

function siapEditSPKRKK(id) {
    const item = spkDataGlobal.find(d => String(d.id) === String(id));
    if (!item) return;

    document.getElementById("spk-id").value = item.id;
    document.getElementById("spk-nik").value = item.nik || "";
    document.getElementById("spk-nama").value = item.nama || "";
    document.getElementById("spk-bidang").value = item.bidang || "";
    document.getElementById("spk-nomor").value = item.nomor_spk_rkk || "";
    document.getElementById("spk-terbit").value = item.tanggal_terbit || "";
    document.getElementById("spk-berakhir").value = item.tanggal_berakhir || "";
    document.getElementById("spk-file").value = ""; // Reset input file pencatat berkas

    // Ubah judul form UI menjadi mode edit
    document.getElementById("form-title").innerHTML = `<i class="fa-solid fa-pen-to-square text-amber-500 text-sm"></i> <span class="text-amber-700">Ubah Data SPK RKK</span>`;
    document.getElementById("btn-submit").innerText = "Perbarui Data";
    document.getElementById("btn-batal").classList.remove("hidden");
}

function resetFormSPKRKK() {
    document.getElementById("form-spkrkk").reset();
    document.getElementById("spk-id").value = "";
    
    document.getElementById("form-title").innerHTML = `<i class="fa-solid fa-square-plus text-blue-600 text-sm"></i> <span>Tambah Data SPK RKK Baru</span>`;
    document.getElementById("btn-submit").innerText = "Simpan Data";
    document.getElementById("btn-batal").classList.add("hidden");
}

async function hapusSPKRKK(id, pathFile) {
    if (!confirm("Apakah Anda yakin akan menghapus permanen arsip SPK RKK ini?")) return;

    try {
        // 1. Hapus baris di tabel database
        const { error: dbError } = await supabase
            .from("spkrkk")
            .delete()
            .eq("id", id);

        if (dbError) throw dbError;

        // 2. Hapus berkas fisiknya di storage bucket jika ada
        if (pathFile && pathFile !== "null" && pathFile !== "undefined") {
            await supabase.storage.from("spkrkk").remove([pathFile]);
        }

        alert("Arsip berhasil dibersihkan!");
        ambilDataSPKRKK();

    } catch (err) {
        alert("Gagal menghapus: " + err.message);
    }
}

// ==========================================
// FITUR EKSPOR DATA (EXCEL & PDF)
// ==========================================

async function ambilSemuaDataFilter() {
    // Menarik seluruh data tanpa batasan halaman (range) untuk laporan ekspor menyeluruh
    try {
        let query = supabase.from("spkrkk").select("*");
        if (spkFilterBidang !== "") query = query.eq("bidang", spkFilterBidang);
        if (spkKataKunci !== "") query = query.or(`nama.ilike.%${spkKataKunci}%,nik.ilike.%${spkKataKunci}%,nomor_spk_rkk.ilike.%${spkKataKunci}%`);
        
        const { data, error } = await query.order("id", { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error("Gagal memuat ekspor:", err.message);
        return [];
    }
}

async function unduhExcel() {
    const dataLaporan = await ambilSemuaDataFilter();
    if (dataLaporan.length === 0) {
        alert("Tidak ada data yang dapat diekspor!");
        return;
    }

    const dataSiapCetak = dataLaporan.map((d, index) => ({
        "No": index + 1,
        "NIK": d.nik,
        "Nama Pegawai": d.nama,
        "Bidang": d.bidang,
        "Nomor SPK & RKK": d.nomor_spk_rkk,
        "Tanggal Terbit": d.tanggal_terbit,
        "Tanggal Berakhir": d.tanggal_berakhir
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataSiapCetak);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data SPK RKK");
    
    // Auto-fit kolom biar rapi
    const max_widths = [{wch:6}, {wch:18}, {wch:30}, {wch:18}, {wch:30}, {wch:15}, {wch:15}];
    worksheet['!cols'] = max_widths;

    XLSX.writeFile(workbook, `Laporan_SPK_RKK_${Date.now()}.xlsx`);
}

async function unduhPDF() {
    const dataLaporan = await ambilSemuaDataFilter();
    if (dataLaporan.length === 0) {
        alert("Tidak ada data untuk dicetak ke PDF!");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Mode Landscape

    doc.setFont("Helvetica", "bold");
    doc.text("RSUD Drs. H. AMRI TAMBUNAN", 14, 15);
    doc.setFontSize(11);
    doc.setFont("Helvetica", "normal");
    doc.text("Laporan Data Surat Penugasan Klinis & Rincian Kewenangan Klinis (SPK RKK)", 14, 21);
    doc.setFontSize(9);
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 26);

    const dataTabelBody = dataLaporan.map((d, index) => [
        index + 1,
        d.nik,
        d.nama,
        d.bidang,
        d.nomor_spk_rkk,
        d.tanggal_terbit.split('-').reverse().join('/'),
        d.tanggal_berakhir.split('-').reverse().join('/')
    ]);

    doc.autoTable({
        startY: 30,
        head: [['No', 'NIK', 'Nama Pegawai', 'Bidang', 'Nomor SPK & RKK', 'Tgl Terbit', 'Tgl Berakhir']],
        body: dataTabelBody,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textLocate: 'center' }, // warna slate-900 sesuai sidebar
        styles: { fontSize: 9, cellPadding: 3 }
    });

    doc.save(`Laporan_SPK_RKK_${Date.now()}.pdf`);
}

// Daftarkan ke Objek Global Window Browser
window.initSPKRKKModule = initSPKRKKModule;
window.ambilDataSPKRKK = ambilDataSPKRKK;
window.simpanSPKRKK = simpanSPKRKK;
window.siapEditSPKRKK = siapEditSPKRKK;
window.resetFormSPKRKK = resetFormSPKRKK;
window.hapusSPKRKK = hapusSPKRKK;
window.filterDataSPKRKK = filterDataSPKRKK;
window.cariDataSPKRKK = cariDataSPKRKK;
window.gantiHalamanSPKRKK = gantiHalamanSPKRKK;
window.unduhExcel = unduhExcel;
window.unduhPDF = unduhPDF;
