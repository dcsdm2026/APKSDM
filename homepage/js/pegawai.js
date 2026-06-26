/**
 * HRIS RSUD Drs. H. AMRI TAMBUNAN - Module Pegawai
 * Filename: pegawai.js
 * Description: Mengatur manajemen data pegawai (CRUD), kalkulasi reaktif, pencarian, dan fitur ekspor data.
 * Versi: 2.0 (Super Aman & Kebal Crash dari Element Null)
 */

// 1. Store Data Global
let dataPegawai = [];

// 2. Mapping Elemen DOM Secara Dinamis (Menggunakan Getters untuk Mencegah Error Null)
const DOM = {
    get form() { return document.getElementById('formPegawai') || document.getElementById('form_pegawai'); },
    get txtCari() { return document.getElementById('txtCari') || document.getElementById('searchPegawai'); },
    get filterStatus() { return document.getElementById('filterStatus') || document.getElementById('filter_status'); },
    get filterKelompok() { return document.getElementById('filterKelompok') || document.getElementById('filter_kelompok'); },
    get tabelBody() { return document.getElementById('tabelPegawaiBody') || document.getElementById('tabel_pegawai_body'); },
    
    // Form Input Fields
    get idPegawai() { return document.getElementById('id_pegawai') || document.getElementById('idPegawai'); },
    get nip() { return document.getElementById('nip'); },
    get nama() { return document.getElementById('nama'); },
    get tanggalLahir() { return document.getElementById('tanggal_lahir') || document.getElementById('tanggalLahir'); },
    get bup() { return document.getElementById('bup'); },
    get tmtCpns() { return document.getElementById('tmt_cpns') || document.getElementById('tmtCpns'); },
    get tmtPensiun() { return document.getElementById('tmt_pensiun') || document.getElementById('tmtPensiun'); },
    get masukRs() { return document.getElementById('tanggal_masuk_rs') || document.getElementById('tanggalMasukRs'); },
    get masaKerja() { return document.getElementById('masa_kerja') || document.getElementById('masaKerja'); },
    get jmlAnak() { return document.getElementById('jml_anak') || document.getElementById('jmlAnak'); },
    get boxAnak() { return document.getElementById('box_anak') || document.getElementById('boxAnak'); },
    get statusPegawai() { return document.getElementById('status_pegawai') || document.getElementById('statusPegawai'); },
    get kelompokJabatan() { return document.getElementById('kelompok_jabatan') || document.getElementById('kelompokJabatan'); },
    get urlFoto() { return document.getElementById('url_foto') || document.getElementById('urlFoto'); }
};

// 3. Inisialisasi Aplikasi Saat Halaman Selesai Dimuat
document.addEventListener('DOMContentLoaded', init);

async function init() {
    console.log("=== Memulai Sinkronisasi Komponen HRIS ===");
    
    // Jalankan pengecekan elemen HTML secara real-time di console untuk pelacakan
    for (const key in DOM) {
        if (!DOM[key]) {
            console.warn(`⚠️ Catatan: Elemen DOM '${key}' tidak ditemukan di halaman HTML Anda. Fitur terkait dinonaktifkan otomatis agar tidak crash.`);
        }
    }

    // Tempelkan seluruh event handler ke tombol & input
    menempelEventRules();

    // Ambil data terbaru dari Supabase Database
    await muatDataDariSupabase();
}

// 4. Pengaturan Seluruh Event Listener dengan Proteksi Penuh (Anti Error)
function menempelEventRules() {
    // A. Kontrol input dinamis jumlah anak
    if (DOM.jmlAnak) {
        DOM.jmlAnak.addEventListener('change', (e) => {
            const val = parseInt(e.target.value) || 0;
            if (DOM.boxAnak) DOM.boxAnak.style.display = val > 0 ? 'block' : 'none';
            for (let i = 1; i <= 3; i++) {
                const chAnak = document.getElementById(`c_anak${i}`);
                const inpAnak = document.getElementById(`anak${i}`);
                if (chAnak) chAnak.style.display = i <= val ? 'block' : 'none';
                if (i > val && inpAnak) inpAnak.value = "";
            }
        });
    }

    // B. Ekstraksi Otomatis TMT CPNS berdasarkan Digit NIP (Digit 9-14)
    if (DOM.nip) {
        DOM.nip.addEventListener('input', (e) => {
            const nipVal = e.target.value.replace(/\s+/g, '');
            if (nipVal.length >= 14 && DOM.tmtCpns) {
                const tahun = nipVal.substring(8, 12);
                const bulan = nipVal.substring(12, 14);
                DOM.tmtCpns.value = `${tahun}-${bulan}-01`;
            }
        });
    }

    // C. Kalkulasi Otomatis Batas Usia Pensiun (BUP)
    const hitungPensiun = () => {
        if (DOM.tanggalLahir && DOM.bup && DOM.tmtPensiun && DOM.tanggalLahir.value && DOM.bup.value) {
            const tglLahir = new Date(DOM.tanggalLahir.value);
            const bupTahun = parseInt(DOM.bup.value) || 0;
            
            let tahunPensiun = tglLahir.getFullYear() + bupTahun;
            let bulanPensiun = tglLahir.getMonth() + 1; // getMonth() dimulai dari 0
            
            // Pensiun berlaku mulai awal bulan berikutnya
            bulanPensiun += 1;
            if (bulanPensiun > 12) {
                bulanPensiun = 1;
                tahunPensiun += 1;
            }
            
            const strBulan = bulanPensiun.toString().padStart(2, '0');
            DOM.tmtPensiun.value = `${tahunPensiun}-${strBulan}-01`;
        }
    };
    if (DOM.tanggalLahir) DOM.tanggalLahir.addEventListener('change', hitungPensiun);
    if (DOM.bup) DOM.bup.addEventListener('change', hitungPensiun);

    // D. Kalkulasi Masa Kerja Berdasarkan Tanggal Masuk RSUD
    if (DOM.masukRs) {
        DOM.masukRs.addEventListener('change', (e) => {
            if (e.target.value && DOM.masaKerja) {
                const masuk = new Date(e.target.value);
                const sekarang = new Date();
                
                let tahun = sekarang.getFullYear() - masuk.getFullYear();
                let bulan = geopolitical = sekarang.getMonth() - masuk.getMonth();
                let hari = sekarang.getDate() - masuk.getDate();
                
                if (hari < 0) {
                    bulan -= 1;
                    hari += new Date(sekarang.getFullYear(), sekarang.getMonth(), 0).getDate();
                }
                if (bulan < 0) {
                    tahun -= 1;
                    bulan += 12;
                }
                DOM.masaKerja.value = `${tahun} Tahun ${bulan} Bulan ${hari} Hari`;
            }
        });
    }

    // E. Event Realtime Pencarian & Filter Data Tabel
    if (DOM.txtCari) DOM.txtCari.addEventListener('input', renderTabel);
    if (DOM.filterStatus) DOM.filterStatus.addEventListener('change', renderTabel);
    if (DOM.filterKelompok) DOM.filterKelompok.addEventListener('change', renderTabel);

    // F. Submit Form (Tambah / Edit Pegawai)
    if (DOM.form) DOM.form.addEventListener('submit', simpanPegawai);
    
    // G. Event Klik Tombol "+ Tambah" (Mereset Form & Judul Modal)
    const btnTambah = document.getElementById('btnTambah') || document.querySelector('[data-bs-target="#modalPegawai"]');
    if (btnTambah) {
        btnTambah.addEventListener('click', () => {
            if (DOM.form) DOM.form.reset();
            if (DOM.idPegawai) DOM.idPegawai.value = "";
            if (DOM.boxAnak) DOM.boxAnak.style.display = 'none';
            const modTitle = document.getElementById('modalTitle');
            if (modTitle) modTitle.innerHTML = '<i class="fa-solid fa-plus me-2 text-primary"></i> Tambah Pegawai Baru';
        });
    }

    // H. Event Binding untuk Aksi Ekspor / Impor Data (Pastikan ID tombol HTML sesuai)
    const btnExcelSemua = document.getElementById('btnExportExcelSemua');
    const btnPdfSemua = document.getElementById('btnExportPdfSemua');
    const btnExcelBelum = document.getElementById('btnExportExcelBelum');
    const btnPdfBelum = document.getElementById('btnExportPdfBelum');
    const fileImport = document.getElementById('fileImportExcel');

    if (btnExcelSemua) btnExcelSemua.addEventListener('click', (e) => { e.preventDefault(); downloadExcelSemua(); });
    if (btnPdfSemua) btnPdfSemua.addEventListener('click', (e) => { e.preventDefault(); downloadPdfSemua(); });
    if (btnExcelBelum) btnExcelBelum.addEventListener('click', (e) => { e.preventDefault(); downloadExcelBelumIsi(); });
    if (btnPdfBelum) btnPdfBelum.addEventListener('click', (e) => { e.preventDefault(); downloadPdfBelumIsi(); });
    if (fileImport) fileImport.addEventListener('change', importExcelCSV);
}

// 5. Mengambil Data Dari Database Supabase
async function muatDataDariSupabase() {
    try {
        const clientSupabase = window.supabaseClient || window.supabase;
        if (!clientSupabase) {
            console.error("❌ Hubungan Gagal: Library Supabase belum terdeteksi di window global.");
            return;
        }

        const { data, error } = await clientSupabase
            .from('pegawai')
            .select('*')
            .order('nama', { ascending: true });

        if (error) throw error;
        dataPegawai = data || [];
        renderTabel();
    } catch (err) {
        console.error("Gagal memuat data dari Supabase:", err.message);
    }
}

// 6. Merender Data Pegawai ke Grid / Tabel HTML
function renderTabel() {
    if (!DOM.tabelBody) return;
    DOM.tabelBody.innerHTML = "";

    const kataKunci = DOM.txtCari ? DOM.txtCari.value.toLowerCase() : "";
    const statusTerpilih = DOM.filterStatus ? DOM.filterStatus.value : "";
    const kelompokTerpilih = DOM.filterKelompok ? DOM.filterKelompok.value : "";

    // Lakukan filter data secara dinamis di sisi klien
    const dataTerfilter = dataPegawai.filter(p => {
        const cocokKataKunci = (p.nama || "").toLowerCase().includes(kataKunci) || (p.nip || "").includes(kataKunci);
        const cocokStatus = statusTerpilih === "" || p.status_pegawai === statusTerpilih;
        const cocokKelompok = kelompokTerpilih === "" || p.kelompok_jabatan === kelompokTerpilih;
        return cocokKataKunci && cocokStatus && cocokKelompok;
    });

    if (dataTerfilter.length === 0) {
        DOM.tabelBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Tidak ada data pegawai yang sesuai.</td></tr>`;
        return;
    }

    // Loop data untuk dimasukkan ke baris tabel
    dataTerfilter.forEach((p, index) => {
        const tr = document.createElement('tr');
        
        // Menggunakan SVG lokal sebagai fallback avatar jika foto tidak termuat (Anti ERR_CONNECTION_CLOSED)
        const avatarSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5-4-8-4z'/></svg>`;
        const srcFoto = p.url_foto && p.url_foto.length > 5 ? p.url_foto : avatarSvg;

        tr.innerHTML = `
            <td class="text-center align-middle">${index + 1}</td>
            <td class="align-middle">
                <div class="d-flex align-items-center">
                    <img src="${srcFoto}" class="rounded-circle me-2 object-fit-cover shadow-sm" width="40" height="40" onerror="this.src='${avatarSvg}'">
                    <div>
                        <div class="fw-bold">${p.nama || '-'}</div>
                        <small class="text-muted">NIP. ${p.nip || '-'}</small>
                    </div>
                </div>
            </td>
            <td class="align-middle">${p.status_pegawai || '-'}</td>
            <td class="align-middle">${p.kelompok_jabatan || '-'}</td>
            <td class="align-middle"><small>${p.masa_kerja || '-'}</small></td>
            <td class="align-middle text-center">${p.jml_anak || '0'}</td>
            <td class="align-middle text-center">
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-warning" onclick="editPegawai('${p.id}')" title="Edit Data">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="hapusPegawai('${p.id}', '${p.nama}')" title="Hapus Data">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        DOM.tabelBody.appendChild(tr);
    });
}

// 7. Simpan Data (Tambah Baru / Update Data Lama)
async function simpanPegawai(e) {
    e.preventDefault();
    try {
        const clientSupabase = window.supabaseClient || window.supabase;
        if (!clientSupabase) return alert("Koneksi ke database bermasalah!");

        const id = DOM.idPegawai ? DOM.idPegawai.value : "";
        
        const payload = {
            nip: DOM.nip ? DOM.nip.value : "",
            nama: DOM.nama ? DOM.nama.value : "",
            tanggal_lahir: DOM.tanggalLahir ? DOM.tanggalLahir.value : null,
            bup: DOM.bup ? parseInt(DOM.bup.value) : null,
            tmt_cpns: DOM.tmtCpns ? DOM.tmtCpns.value : null,
            tmt_pensiun: DOM.tmtPensiun ? DOM.tmtPensiun.value : null,
            tanggal_masuk_rs: DOM.masukRs ? DOM.masukRs.value : null,
            masa_kerja: DOM.masaKerja ? DOM.masaKerja.value : "",
            jml_anak: DOM.jmlAnak ? parseInt(DOM.jmlAnak.value) || 0 : 0,
            status_pegawai: DOM.statusPegawai ? DOM.statusPegawai.value : "",
            kelompok_jabatan: DOM.kelompokJabatan ? DOM.kelompokJabatan.value : "",
            url_foto: DOM.urlFoto ? DOM.urlFoto.value : ""
        };

        for (let i = 1; i <= 3; i++) {
            const elAnak = document.getElementById(`anak${i}`);
            payload[`anak${i}`] = elAnak ? elAnak.value : "";
        }

        let respon;
        if (id) {
            respon = await clientSupabase.from('pegawai').update(payload).eq('id', id);
        } else {
            respon = await clientSupabase.from('pegawai').insert([payload]);
        }

        if (respon.error) throw respon.error;

        const modalEl = document.getElementById('modalPegawai');
        if (modalEl) {
            const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modalInstance.hide();
        }

        alert(id ? "Data pegawai berhasil diperbarui!" : "Pegawai baru berhasil ditambahkan!");
        await muatDataDariSupabase();
    } catch (err) {
        alert("Terjadi kesalahan saat menyimpan data: " + err.message);
    }
}

// 8. Menampilkan Data ke Form untuk Proses Edit
function editPegawai(id) {
    const p = dataPegawai.find(peg => peg.id === id);
    if (!p) return;

    if (DOM.idPegawai) DOM.idPegawai.value = p.id;
    if (DOM.nip) DOM.nip.value = p.nip || "";
    if (DOM.nama) DOM.nama.value = p.nama || "";
    if (DOM.tanggalLahir) DOM.tanggalLahir.value = p.tanggal_lahir || "";
    if (DOM.bup) DOM.bup.value = p.bup || "";
    if (DOM.tmtCpns) DOM.tmtCpns.value = p.tmt_cpns || "";
    if (DOM.tmtPensiun) DOM.tmtPensiun.value = p.tmt_pensiun || "";
    if (DOM.masukRs) DOM.masukRs.value = p.tanggal_masuk_rs || "";
    if (DOM.masaKerja) DOM.masaKerja.value = p.masa_kerja || "";
    if (DOM.jmlAnak) DOM.jmlAnak.value = p.jml_anak || 0;
    if (DOM.statusPegawai) DOM.statusPegawai.value = p.status_pegawai || "";
    if (DOM.kelompokJabatan) DOM.kelompokJabatan.value = p.kelompok_jabatan || "";
    if (DOM.urlFoto) DOM.urlFoto.value = p.url_foto || "";

    const valAnak = parseInt(p.jml_anak) || 0;
    if (DOM.boxAnak) DOM.boxAnak.style.display = valAnak > 0 ? 'block' : 'none';
    for (let i = 1; i <= 3; i++) {
        const chAnak = document.getElementById(`c_anak${i}`);
        const inpAnak = document.getElementById(`anak${i}`);
        if (chAnak) chAnak.style.display = i <= valAnak ? 'block' : 'none';
        if (inpAnak) inpAnak.value = p[`anak${i}`] || "";
    }

    const modTitle = document.getElementById('modalTitle');
    if (modTitle) modTitle.innerHTML = '<i class="fa-solid fa-user-pen me-2 text-warning"></i> Edit Data Pegawai';

    const modalEl = document.getElementById('modalPegawai');
    if (modalEl) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modalInstance.show();
    }
}

// 9. Menghapus Data Pegawai
async function hapusPegawai(id, nama) {
    if (!confirm(`Apakah Anda yakin ingin menghapus data pegawai "${nama}"?`)) return;
    try {
        const clientSupabase = window.supabaseClient || window.supabase;
        if (!clientSupabase) return;

        const { error } = await clientSupabase.from('pegawai').delete().eq('id', id);
        if (error) throw error;

        alert("Data pegawai berhasil dihapus!");
        await muatDataDariSupabase();
    } catch (err) {
        alert("Terjadi masalah saat menghapus data: " + err.message);
    }
}

// 10. FITUR EKSPOR EXCEL (Semua Data)
function downloadExcelSemua() {
    if (dataPegawai.length === 0) return alert("Data kosong, tidak dapat diekspor.");
    
    const wsData = dataPegawai.map((p, idx) => ({
        "No": idx + 1,
        "NIP": p.nip || "-",
        "Nama Pegawai": p.nama || "-",
        "Tanggal Lahir": p.tanggal_lahir || "-",
        "BUP (Tahun)": p.bup || "-",
        "TMT CPNS": p.tmt_cpns || "-",
        "TMT Pensiun": p.tmt_pensiun || "-",
        "Masa Kerja": p.masa_kerja || "-",
        "Status Pegawai": p.status_pegawai || "-",
        "Kelompok Jabatan": p.kelompok_jabatan || "-",
        "Jumlah Anak": p.jml_anak || 0
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Semua_Pegawai");
    XLSX.writeFile(wb, "Data_Pegawai_RSUD_AmriTambunan.xlsx");
}

// 11. FITUR EKSPOR EXCEL (Pegawai Belum Lengkap Isi Datanya / "Belum Isi")
function downloadExcelBelumIsi() {
    // Filter pegawai yang field utamanya masih kosong/null
    const dataBelumLengkap = dataPegawai.filter(p => !p.nip || !p.tanggal_lahir || !p.tanggal_masuk_rs || !p.status_pegawai);
    
    if (dataBelumLengkap.length === 0) return alert("Semua data pegawai sudah diisi dengan lengkap.");

    const wsData = dataBelumLengkap.map((p, idx) => ({
        "No": idx + 1,
        "Nama Pegawai": p.nama || "-",
        "NIP": p.nip ? "Terisi" : "KOSONG",
        "Tanggal Lahir": p.tanggal_lahir ? "Terisi" : "KOSONG",
        "Tanggal Masuk RS": p.tanggal_masuk_rs ? "Terisi" : "KOSONG",
        "Status": p.status_pegawai ? "Terisi" : "KOSONG"
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Belum_Lengkap");
    XLSX.writeFile(wb, "Pegawai_Belum_Lengkap_Data.xlsx");
}

// 12. FITUR EKSPOR PDF (Semua Data)
function downloadPdfSemua() {
    if (dataPegawai.length === 0) return alert("Tidak ada data untuk dibuat PDF.");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFont("Helvetica", "bold");
    doc.text("DAFTAR PEGAWAI RSUD Drs. H. AMRI TAMBUNAN", 14, 15);
    doc.setFontSize(10);
    doc.text("Sistem Informasi Sumber Daya Manusia (HRIS)", 14, 20);

    const rows = dataPegawai.map((p, idx) => [
        idx + 1,
        p.nama || "-",
        p.nip || "-",
        p.status_pegawai || "-",
        p.kelompok_jabatan || "-",
        p.masa_kerja || "-",
        p.jml_anak || "0"
    ]);

    doc.autoTable({
        startY: 25,
        head: [['No', 'Nama Pegawai', 'NIP', 'Status', 'Kelompok Jabatan', 'Masa Kerja', 'Anak']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [24, 76, 120] }
    });

    doc.save("Data_Pegawai_HRIS.pdf");
}

// 13. FITUR EKSPOR PDF (Data Belum Lengkap)
function downloadPdfBelumIsi() {
    const dataBelumLengkap = dataPegawai.filter(p => !p.nip || !p.tanggal_lahir || !p.tanggal_masuk_rs || !p.status_pegawai);
    if (dataBelumLengkap.length === 0) return alert("Semua data pegawai sudah terisi lengkap.");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    doc.setFont("Helvetica", "bold");
    doc.text("LAPORAN DATA PEGAWAI BELUM LENGKAP", 14, 15);
    
    const rows = dataBelumLengkap.map((p, idx) => [
        idx + 1,
        p.nama || "-",
        p.nip ? "Ada" : "KOSONG",
        p.tanggal_lahir ? "Ada" : "KOSONG",
        p.tanggal_masuk_rs ? "Ada" : "KOSONG"
    ]);

    doc.autoTable({
        startY: 22,
        head: [['No', 'Nama Pegawai', 'NIP', 'Tgl Lahir', 'Masuk RS']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [220, 53, 69] }
    });

    doc.save("Laporan_Belum_Lengkap.pdf");
}

// 14. FITUR MASS IMPORT VIA EXCEL
function importExcelCSV(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(evt) {
        try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const barisJson = XLSX.utils.sheet_to_json(worksheet);

            if (barisJson.length === 0) return alert("File Excel kosong!");

            const clientSupabase = window.supabaseClient || window.supabase;
            if (!clientSupabase) return;

            const records = barisJson.map(row => ({
                nama: row['Nama Pegawai'] || row['nama'] || '',
                nip: row['NIP'] || row['nip'] || '',
                status_pegawai: row['Status Pegawai'] || row['status'] || '',
                kelompok_jabatan: row['Kelompok Jabatan'] || row['jabatan'] || '',
                jml_anak: parseInt(row['Jumlah Anak'] || row['anak']) || 0
            }));

            const { error } = await clientSupabase.from('pegawai').insert(records);
            if (error) throw error;

            alert(`Berhasil mengimpor ${records.length} data pegawai secara massal!`);
            await muatDataDariSupabase();
        } catch (err) {
            alert("Gagal mengimpor file: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}
