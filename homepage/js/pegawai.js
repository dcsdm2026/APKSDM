// Scope State Management Realtime
let dataSemuaPegawai = [];
let halamanSekarang = 1;
const batasBaris = 25;

function initPegawaiModule() {
    ambilDropdownPengaturan();
    ambilStatistikKepegawaian();
    ambilDataPegawai();
}

// Mengatur Visibility Tab Form Isian
function gantiTabForm(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('border-b-2', 'border-blue-600', 'text-blue-600', 'bg-white'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));
    
    document.getElementById(`tab-${tabId}`).classList.add('border-b-2', 'border-blue-600', 'text-blue-600', 'bg-white');
    document.getElementById(`area-${tabId}`).classList.remove('hidden');
}

function kontrolInputAnak(val) {
    const v = parseInt(val);
    document.getElementById("box-anak1").classList.toggle("hidden", v < 1);
    document.getElementById("box-anak2").classList.toggle("hidden", v < 2);
    document.getElementById("box-anak3").classList.toggle("hidden", v < 3);
}

// Perhitungan Rumus Kompleks Kepegawaian (Kriteria No. B.1)
function hitungMasaKerjaOtomatis(tanggalMasukRS) {
    if (!tanggalMasukRS) return "-";
    const masuk = new Date(tanggalMasukRS);
    const sekarang = new Date();
    
    let tahun = sekarang.getFullYear() - masuk.getFullYear();
    let bulan = sekarang.getMonth() - masuk.getMonth();
    let hari = sekarang.getDate() - masuk.getDate();

    if (hari < 0) {
        bulan--;
        hari += new Date(sekarang.getFullYear(), sekarang.getMonth(), 0).getDate();
    }
    if (bulan < 0) {
        tahun--;
        bulan += 12;
    }
    return `${tahun} Tahun ${bulan} Bulan ${hari} Hari`;
}

function hitungCpnsDariNip(nip) {
    if (nip.length >= 14) {
        const tahun = nip.substring(8, 12);
        const bulan = nip.substring(12, 14);
        document.getElementById("f-tmt_cpns").value = `${tahun}-${bulan}-01`;
    }
}

function hitungPensiunOtomatis() {
    const tglLahirVal = document.getElementById("f-tanggal_lahir").value;
    const bupVal = parseInt(document.getElementById("f-bup").value);
    
    if (tglLahirVal) {
        const lahir = new Date(tglLahirVal);
        let tahunPensiun = lahir.getFullYear() + bupVal;
        let bulanPensiun = lahir.getMonth() + 1; // Bulan berikutnya setelah kelahiran

        if (bulanPensiun > 11) {
            bulanPensiun = 0;
            tahunPensiun++;
        }
        const tmtPensiun = new Date(tahunPensiun, bulanPensiun, 1);
        
        // Format ISO lokal YYYY-MM-DD
        const yyyy = tmtPensiun.getFullYear();
        const mm = String(tmtPensiun.getMonth() + 1).padStart(2, '0');
        document.getElementById("f-tmt_pensiun").value = `${yyyy}-${mm}-01`;
    }
}

// Load Dropdown Options dari Tabel Pengaturan
async function ambilDropdownPengaturan() {
    const { data } = await supabase.from("pengaturan").select("*");
    const kategori = ['golongan', 'ruangan', 'jabatan', 'fakultas', 'jurusan'];
    
    kategori.forEach(kat => {
        const el = document.getElementById(`f-${kat}`);
        const filterEl = document.getElementById(`filter-ruangan`);
        if(!el) return;
        
        const filtered = data.filter(d => d.master_data === kat);
        el.innerHTML = filtered.map(d => `<option value="${d.keterangan}">${d.keterangan}</option>`).join('');
        
        if (kat === 'ruangan' && filterEl) {
            filterEl.innerHTML = `<option value="">Semua Ruangan</option>` + filtered.map(d => `<option value="${d.keterangan}">${d.keterangan}</option>`).join('');
        }
    });
}

// Sinkronisasi Penghitung Atas (Total, Aktif, dll)
async function ambilStatistikKepegawaian() {
    const { data } = await supabase.from("pegawai").select("status_pegawai");
    if(!data) return;
    
    document.getElementById("stat-total").innerText = data.length;
    document.getElementById("stat-aktif").innerText = data.filter(p => p.status_pegawai === 'Aktif').length;
    document.getElementById("stat-resign").innerText = data.filter(p => p.status_pegawai === 'Resign').length;
    document.getElementById("stat-pensiun").innerText = data.filter(p => p.status_pegawai === 'Pensiun').length;
    document.getElementById("stat-mutasi").innerText = data.filter(p => p.status_pegawai === 'Mutasi').length;
}

// Fetch Utama & Filter Data Pegawai
async function ambilDataPegawai() {
    const cari = document.getElementById("cari-pegawai").value;
    const filRuangan = document.getElementById("filter-ruangan").value;
    const tbody = document.getElementById("tabel-pegawai-body");

    let query = supabase.from("pegawai").select("*");

    if (cari) {
        query = query.or(`nama.ilike.%${cari}%,nik.ilike.%${cari}%,nip.ilike.%${cari}%`);
    }
    if (filRuangan) {
        query = query.eq("ruangan", filRuangan);
    }

    const { data, error } = await query;
    if (error) return;

    dataSemuaPegawai = data.map(p => ({
        ...p,
        masa_kerja: hitungMasaKerjaOtomatis(p.masuk_rs)
    }));

    renderTabelPaginated();
}

function renderTabelPaginated() {
    const tbody = document.getElementById("tabel-pegawai-body");
    tbody.innerHTML = "";

    const totalData = dataSemuaPegawai.length;
    const totalHalaman = Math.ceil(totalData / batasBaris) || 1;
    
    const indeksAwal = (halamanSekarang - 1) * batasBaris;
    const indeksAkhir = Math.min(indeksAwal + batasBaris, totalData);
    const dataHalamanIni = dataSemuaPegawai.slice(indeksAwal, indeksAkhir);

    dataHalamanIni.forEach((p, index) => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 border-b border-gray-100 transition">
                <td class="p-4 text-gray-500">${indeksAwal + index + 1}</td>
                <td class="p-4 font-mono text-xs font-semibold">${p.nik}</td>
                <td class="p-4 font-medium text-slate-900">${p.nama}</td>
                <td class="p-4"><div class="text-xs text-gray-500 font-mono">${p.nip || '-'}</div><div class="text-xs text-blue-600 font-medium">${p.ruangan || '-'}</div></td>
                <td class="p-4">
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${p.status_pegawai === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}">${p.status_pegawai}</span>
                    <span class="block text-xs text-gray-400 mt-1">${p.kelompok_pegawai || ''}</span>
                </td>
                <td class="p-4 text-xs font-medium text-slate-600">${p.masa_kerja}</td>
                <td class="p-4 text-center">
                    <div class="inline-flex space-x-1">
                        <button onclick='bukaModalForm(${JSON.stringify(p)})' class="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button onclick="hapusPegawai(${p.id_pegawai})" class="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });

    document.getElementById("pagination-info").innerText = `Menampilkan data ${totalData ? indeksAwal + 1 : 0} - ${indeksAkhir} dari ${totalData} data`;
    document.getElementById("btn-prev").disabled = halamanSekarang === 1;
    document.getElementById("btn-next").disabled = halamanSekarang === totalHalaman;

    // Build nomor navigasi halaman
    let htmlHalaman = "";
    for(let i=1; i<=totalHalaman; i++) {
        htmlHalaman += `<button onclick="pindahHalaman(${i})" class="px-3 py-1 rounded-md text-xs font-medium ${halamanSekarang === i ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}">${i}</button>`;
    }
    document.getElementById("halaman-list").innerHTML = htmlHalaman;
}

function pindahHalaman(hal) { halamanSekarang = hal; renderTabelPaginated(); }
function halamanSebelumnya() { if(halamanSekarang > 1) { halamanSekarang--; renderTabelPaginated(); } }
function halamanBerikutnya() { if(halamanSekarang * batasBaris < dataSemuaPegawai.length) { halamanSekarang++; renderTabelPaginated(); } }

function bukaModalForm(data = null) {
    document.getElementById("form-isi-pegawai").reset();
    document.getElementById("f-id").value = "";
    gantiTabForm('profil');
    kontrolInputAnak(0);

    if (data) {
        document.getElementById("modal-title").innerText = "Ubah Berkas Rekap Pegawai";
        document.getElementById("f-id").value = data.id_pegawai;
        document.getElementById("f-nik").value = data.nik;
        document.getElementById("f-nama").value = data.nama;
        document.getElementById("f-tempat_lahir").value = data.tempat_lahir;
        document.getElementById("f-tanggal_lahir").value = data.tanggal_lahir;
        document.getElementById("f-no_hp").value = data.no_hp;
        document.getElementById("f-email").value = data.email;
        document.getElementById("f-alamat").value = data.alamat;
        document.getElementById("f-status_keluarga").value = data.status_keluarga;
        document.getElementById("f-no_kk").value = data.no_kk;
        document.getElementById("f-pasangan").value = data.pasangan;
        document.getElementById("f-jml_anak").value = data.jml_anak;
        kontrolInputAnak(data.jml_anak);
        document.getElementById("f-anak1").value = data.anak1;
        document.getElementById("f-anak2").value = data.anak2;
        document.getElementById("f-anak3").value = data.anak3;
        document.getElementById("f-jenjang").value = data.jenjang;
        document.getElementById("f-asal_pendidikan").value = data.asal_pendidikan;
        document.getElementById("f-fakultas").value = data.fakultas;
        document.getElementById("f-jurusan").value = data.jurusan;
        document.getElementById("f-nip").value = data.nip;
        document.getElementById("f-status_pegawai").value = data.status_pegawai;
        document.getElementById("f-kelompok_pegawai").value = data.kelompok_pegawai;
        document.getElementById("f-golongan").value = data.golongan;
        document.getElementById("f-tmt_pangkat").value = data.tmt_pangkat;
        document.getElementById("f-kelompok_jabatan").value = data.kelompok_jabatan;
        document.getElementById("f-jabatan").value = data.jabatan;
        document.getElementById("f-tmt_jabatan").value = data.tmt_jabatan;
        document.getElementById("f-masuk_rs").value = data.masuk_rs;
        document.getElementById("f-bup").value = data.bup || 58;
        document.getElementById("f-tmt_cpns").value = data.tmt_cpns;
        document.getElementById("f-tmt_pensiun").value = data.tmt_pensiun;
        document.getElementById("f-ruangan").value = data.ruangan;
        document.getElementById("f-tmt_nota").value = data.tmt_nota;
        document.getElementById("f-role").value = data.role;
        document.getElementById("f-bpjs_kesehatan").value = data.bpjs_kesehatan;
        document.getElementById("f-ketenagakerjaan_taspen").value = data.ketenagakerjaan_taspen;
        document.getElementById("f-npwp").value = data.npwp;
    } else {
        document.getElementById("modal-title").innerText = "Tambah Pegawai Baru";
    }
    document.getElementById("modal-pegawai").classList.remove("hidden");
}

function tutupModalForm() { document.getElementById("modal-pegawai").classList.add("hidden"); }

// Fungsi Upload Berkas ke Supabase Cloud Storage Public Bucket
async function uploadFileKeStorage(inputElementId, oldUrl) {
    const fileInput = document.getElementById(inputElementId);
    if (!fileInput || fileInput.files.length === 0) return oldUrl;

    const file = fileInput.files[0];
    const namaFileUnik = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    
    const { data, error } = await supabase.storage
        .from('pegawai_dokumen')
        .upload(namaFileUnik, file);

    if (error) {
        console.error("Gagal upload file:", error.message);
        return oldUrl;
    }

    const { data: publicUrlData } = supabase.storage.from('pegawai_dokumen').getPublicUrl(namaFileUnik);
    return publicUrlData.publicUrl;
}

// System Save / Update CRUD Operations
async function simpanDataPegawai(e) {
    e.preventDefault();
    
    // Upload semua berkas secara paralel
    const url_foto = await uploadFileKeStorage('up-foto', document.getElementById("f-url_foto").value);
    const url_ktp = await uploadFileKeStorage('up-ktp', document.getElementById("f-url_ktp").value);
    const url_kk = await uploadFileKeStorage('up-kk', document.getElementById("f-url_kk").value);
    const url_ijazah = await uploadFileKeStorage('up-ijazah', document.getElementById("f-url_ijazah").value);
    const url_transkrip = await uploadFileKeStorage('up-transkrip', document.getElementById("f-url_transkrip").value);
    const url_pangkat = await uploadFileKeStorage('up-pangkat', document.getElementById("f-url_pangkat").value);
    const url_jabatan = await uploadFileKeStorage('up-jabatan', document.getElementById("f-url_jabatan").value);
    const url_nota = await uploadFileKeStorage('up-nota', document.getElementById("f-url_nota").value);
    const url_bpjs = await uploadFileKeStorage('up-bpjs', document.getElementById("f-url_bpjs").value);
    const url_ketenagakerjaan_taspen = await uploadFileKeStorage('up-taspen', document.getElementById("f-url_ketenagakerjaan_taspen").value);
    const url_npwp = await uploadFileKeStorage('up-npwp', document.getElementById("f-url_npwp").value);

    const payload = {
        nik: document.getElementById("f-nik").value,
        nama: document.getElementById("f-nama").value,
        tempat_lahir: document.getElementById("f-tempat_lahir").value,
        tanggal_lahir: document.getElementById("f-tanggal_lahir").value || null,
        no_hp: document.getElementById("f-no_hp").value,
        email: document.getElementById("f-email").value,
        alamat: document.getElementById("f-alamat").value,
        status_keluarga: document.getElementById("f-status_keluarga").value,
        no_kk: document.getElementById("f-no_kk").value,
        pasangan: document.getElementById("f-pasangan").value,
        jml_anak: parseInt(document.getElementById("f-jml_anak").value),
        anak1: document.getElementById("f-anak1").value,
        anak2: document.getElementById("f-anak2").value,
        anak3: document.getElementById("f-anak3").value,
        jenjang: document.getElementById("f-jenjang").value,
        asal_pendidikan: document.getElementById("f-asal_pendidikan").value,
        fakultas: document.getElementById("f-fakultas").value,
        jurusan: document.getElementById("f-jurusan").value,
        nip: document.getElementById("f-nip").value,
        status_pegawai: document.getElementById("f-status_pegawai").value,
        kelompok_pegawai: document.getElementById("f-kelompok_pegawai").value,
        golongan: document.getElementById("f-golongan").value,
        tmt_pangkat: document.getElementById("f-tmt_pangkat").value || null,
        kelompok_jabatan: document.getElementById("f-kelompok_jabatan").value,
        jabatan: document.getElementById("f-jabatan").value,
        tmt_jabatan: document.getElementById("f-tmt_jabatan").value || null,
        masuk_rs: document.getElementById("f-masuk_rs").value || null,
        bup: parseInt(document.getElementById("f-bup").value),
        tmt_cpns: document.getElementById("f-tmt_cpns").value || null,
        tmt_pensiun: document.getElementById("f-tmt_pensiun").value || null,
        ruangan: document.getElementById("f-ruangan").value,
        tmt_nota: document.getElementById("f-tmt_nota").value || null,
        role: document.getElementById("f-role").value,
        bpjs_kesehatan: document.getElementById("f-bpjs_kesehatan").value,
        ketenagakerjaan_taspen: document.getElementById("f-ketenagakerjaan_taspen").value,
        npwp: document.getElementById("f-npwp").value,
        masa_kerja: hitungMasaKerjaOtomatis(document.getElementById("f-masuk_rs").value),
        url_foto, url_ktp, url_kk, url_ijazah, url_transkrip, url_pangkat, url_jabatan, url_nota, url_bpjs, url_ketenagakerjaan_taspen, url_npwp
    };

    const id = document.getElementById("f-id").value;
    let hasil;

    if (id) {
        hasil = await supabase.from("pegawai").update(payload).eq("id_pegawai", id);
    } else {
        hasil = await supabase.from("pegawai").insert([payload]).select();
        // Buat pula role_akses default untuk password standar login awal nik
        if(hasil.data) {
            await supabase.from("role_akses").insert([{
                id_pegawai: hasil.data[0].id_pegawai,
                nik: payload.nik,
                nama: payload.nama,
                role: payload.role,
                email: payload.email || `${payload.nik}@rsud.com`,
                password: payload.nik
            }]);
        }
    }

    if (hasil.error) {
        alert("Gagal memproses data: " + hasil.error.message);
    } else {
        tutupModalForm();
        initPegawaiModule();
    }
}

async function hapusPegawai(id) {
    if (confirm("Apakah Anda yakin ingin menghapus data pegawai permanen dari sistem?")) {
        await supabase.from("pegawai").delete().eq("id_pegawai", id);
        initPegawaiModule();
    }
}

// ==========================================
// EXPORT DATA SYSTEM (EXCEL & PDF GENERATOR)
// ==========================================
function dapatkanDataFilter(tipe) {
    if (tipe === 'semua') return dataSemuaPegawai;
    
    // Filter khusus kriteria data kosong/belum diisi (Kriteria No B.1)
    return dataSemuaPegawai.filter(p => !p.no_kk || !p.bpjs_kesehatan || !p.npwp || !p.url_foto);
}

function eksporData(tipe, format) {
    const dataFiltrasi = dapatkanDataFilter(tipe);
    
    if (format === 'excel') {
        const susunanSheet = dataFiltrasi.map((p, index) => ({
            "No": index + 1, "NIK": p.nik, "Nama Pegawai": p.nama, "NIP": p.nip, "Ruangan": p.ruangan, "Status": p.status_pegawai, "Keterangan Validasi": (tipe==='semua'?'Lengkap':'Ada Berkas Kosong')
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(susunanSheet);
        XLSX.utils.book_append_sheet(wb, ws, "Rekap Pegawai");
        XLSX.writeFile(wb, `Laporan_Kepegawaian_${tipe}_${Date.now()}.xlsx`);
    } else {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.text(`REKAPITULASI DATA KEPEGAWAIAN RSUD (${tipe.toUpperCase()})`, 14, 15);
        
        const rows = dataFiltrasi.map((p, index) => [index + 1, p.nik, p.nama, p.nip || '-', p.ruangan || '-', p.status_pegawai]);
        doc.autoTable({
            head: [['No', 'NIK', 'Nama Lengkap', 'NIP', 'Ruangan', 'Status']],
            body: rows,
            startY: 22
        });
        doc.save(`Dokumen_Laporan_${tipe}.pdf`);
    }
}

// CSV / EXCEL PARSER EXTRACTOR IMPORT FILE SYSTEM
function prosesImportFile(input) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = async function(e) {
        const dataBytes = new Uint8Array(e.target.result);
        const workbook = XLSX.read(dataBytes, {type: 'array'});
        const namaSheet = workbook.SheetNames[0];
        const barisData = XLSX.utils.sheet_to_json(workbook.Sheets[namaSheet]);

        // Mapping Bulk Data Row
        const arrayUpload = barisData.map(row => ({
            nik: String(row.NIK || row.nik),
            nama: row.Nama || row.nama,
            status_pegawai: row.Status || 'Aktif',
            ruangan: row.Ruangan || row.ruangan
        }));

        const { error } = await supabase.from("pegawai").insert(arrayUpload);
        if(error) alert("Gagal mengimpor file: " + error.message);
        else { alert("Sukses mengimpor data!"); initPegawaiModule(); }
    };
    reader.readAsArrayBuffer(file);
}
