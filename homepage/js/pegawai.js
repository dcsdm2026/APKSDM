(function () {
    let listPegawai = [];
    let pageSekarang = 1;
    const barisPerHalaman = 25;

    // Cache elemen-elemen DOM
    const DOM = {
        tbody: document.getElementById('tbodyPegawai'),
        form: document.getElementById('formPegawai'),
        txtCari: document.getElementById('txtCari'),
        filterStatus: document.getElementById('filterStatus'),
        filterKelompok: document.getElementById('filterKelompok'),
        jmlAnak: document.getElementById('jml_anak'),
        boxAnak: document.getElementById('box_anak'),
        nip: document.getElementById('nip'),
        tmtCpns: document.getElementById('tmt_cpns'),
        tanggalLahir: document.getElementById('tanggal_lahir'),
        bup: document.getElementById('bup'),
        tmtPensiun: document.getElementById('tmt_pensiun'),
        masukRs: document.getElementById('masuk_rs'),
        masaKerja: document.getElementById('masa_kerja')
    };

    // Inisialisasi awal modul pegawai
    async function init() {
        menempelEventRules();
        await muatDataDariSupabase();
    }

    // Mengatur event listener dan kalkulasi reaktif otomatis
    function menempelEventRules() {
        // Kontrol input dinamis jumlah anak
        DOM.jmlAnak.addEventListener('change', (e) => {
            const val = parseInt(e.target.value);
            DOM.boxAnak.style.display = val > 0 ? 'block' : 'none';
            for (let i = 1; i <= 3; i++) {
                document.getElementById(`c_anak${i}`).style.display = i <= val ? 'block' : 'none';
                if(i > val) document.getElementById(`anak${i}`).value = "";
            }
        });

        // Ekstraksi TMT CPNS otomatis berdasarkan NIP
        DOM.nip.addEventListener('input', (e) => {
            const nipVal = e.target.value.replace(/\s+/g, '');
            if (nipVal.length >= 14) {
                const tahun = nipVal.substring(8, 12);
                const bulan = nipVal.substring(12, 14);
                DOM.tmtCpns.value = `${tahun}-${bulan}-01`;
            }
        });

        // Kalkulasi Otomatis TMT Pensiun (Tanggal Lahir + Batas Usia Pensiun -> Tanggal 1 Bulan Berikutnya)
        const hitungPensiun = () => {
            if (DOM.tanggalLahir.value && DOM.bup.value) {
                const tglLahir = new Date(DOM.tanggalLahir.value);
                const bupTahun = parseInt(DOM.bup.value);
                
                let tahunPensiun = tglLahir.getFullYear() + bupTahun;
                let bulanPensiun = tglLahir.getMonth() + 1; // getMonth() dimulai dari 0
                
                // Bergeser ke bulan berikutnya
                bulanPensiun += 1;
                if (bulanPensiun > 12) {
                    bulanPensiun = 1;
                    tahunPensiun += 1;
                }
                
                const strBulan = bulanPensiun.toString().padStart(2, '0');
                DOM.tmtPensiun.value = `${tahunPensiun}-${strBulan}-01`;
            }
        };
        DOM.tanggalLahir.addEventListener('change', hitungPensiun);
        DOM.bup.addEventListener('change', hitungPensiun);

        // Menghitung Masa Kerja (Tahun, Bulan, Hari) dari Tanggal Masuk RS
        DOM.masukRs.addEventListener('change', (e) => {
            if (e.target.value) {
                const masuk = new Date(e.target.value);
                const sekarang = new Date();
                
                let tahun = sekarang.getFullYear() - masuk.getFullYear();
                let bulan = sekarang.getMonth() - masuk.getMonth();
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

        // Filter dan Pencarian Realtime
        DOM.txtCari.addEventListener('input', renderTabel);
        DOM.filterStatus.addEventListener('change', renderTabel);
        DOM.filterKelompok.addEventListener('change', renderTabel);

        // Operasi Submit Form Pegawai
        DOM.form.addEventListener('submit', simpanPegawai);
        
        document.getElementById('btnTambah').addEventListener('click', () => {
            DOM.form.reset();
            document.getElementById('id_pegawai').value = "";
            document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-user-plus me-2 text-warning"></i> Tambah Pegawai Baru';
            DOM.boxAnak.style.display = 'none';
        });
    }

    // Pengambilan data utama dari DB Supabase
    async function muatDataDariSupabase() {
        try {
            const { data, error } = await supabase.from('pegawai').select('*').order('id_pegawai', { ascending: false });
            if (error) throw error;
            listPegawai = data || [];
            hitungStatistikKolektif(listPegawai);
            renderTabel();
        } catch (err) {
            alert('Gagal mengambil data pegawai: ' + err.message);
        }
    }

    function hitungStatistikKolektif(arr) {
        document.getElementById('lblTotal').textContent = arr.length;
        document.getElementById('lblAktif').textContent = arr.filter(p => p.status_pegawai === 'Aktif').length;
        document.getElementById('lblKeluar').textContent = arr.filter(p => p.status_pegawai === 'Resign' || p.status_pegawai === 'Pensiun').length;
        document.getElementById('lblMutasi').textContent = arr.filter(p => p.status_pegawai === 'Mutasi').length;
    }

    // File Upload Handler Utility
    async function uploadBerkasKeBucket(inputElement, folderName, nik) {
        if (!inputElement.files || inputElement.files.length === 0) return null;
        const file = inputElement.files[0];
        const ext = file.name.split('.').pop();
        const filePath = `${folderName}/${nik}_${Date.now()}.${ext}`;

        const { data, error } = await supabaseClient.storage.from('hris-documents').upload(filePath, file);
        if (error) {
            console.error('Gagal mengunggah berkas:', error.message);
            return null;
        }
        const { data: publicUrlData } = supabaseClient.storage.from('hris-documents').getPublicUrl(filePath);
        return publicUrlData.publicUrl;
    }

    // Simpan & Update Mesin CRUD
    async function simpanPegawai(e) {
        e.preventDefault();
        const id = document.getElementById('id_pegawai').value;
        const nikPegawai = document.getElementById('nik').value.trim();

        // Object payload penampung data input
        const payload = {
            nik: nikPegawai,
            nama: document.getElementById('nama').value.trim(),
            tempat_lahir: document.getElementById('tempat_lahir').value,
            tanggal_lahir: DOM.tanggalLahir.value || null,
            nip: DOM.nip.value.trim() || null,
            status_pegawai: document.getElementById('status_pegawai').value,
            kelompok_pegawai: document.getElementById('kelompok_pegawai').value,
            golongan: document.getElementById('golongan').value,
            tmt_pangkat: document.getElementById('tmt_pangkat').value || null,
            kelompok_jabatan: document.getElementById('kelompok_jabatan').value,
            jabatan: document.getElementById('jabatan').value,
            tmt_jabatan: document.getElementById('tmt_jabatan').value || null,
            masuk_rs: DOM.masukRs.value || null,
            masa_kerja: DOM.masaKerja.value,
            tmt_cpns: DOM.tmtCpns.value || null,
            bup: parseInt(DOM.bup.value),
            tmt_pensiun: DOM.tmtPensiun.value || null,
            status_keluarga: document.getElementById('status_keluarga').value,
            no_kk: document.getElementById('no_kk').value,
            pasangan: document.getElementById('pasangan').value,
            jml_anak: parseInt(DOM.jmlAnak.value),
            anak1: document.getElementById('anak1').value,
            anak2: document.getElementById('anak2').value,
            anak3: document.getElementById('anak3').value,
            alamat: document.getElementById('alamat').value,
            jenjang: document.getElementById('jenjang').value,
            fakultas: document.getElementById('fakultas').value,
            jurusan: document.getElementById('jurusan').value,
            asal_pendidikan: document.getElementById('asal_pendidikan').value,
            ruangan: document.getElementById('ruangan').value,
            tmt_nota: document.getElementById('tmt_nota').value || null,
            bpjs_kesehatan: document.getElementById('bpjs_kesehatan').value,
            ketenagakerjaan_taspen: document.getElementById('ketenagakerjaan_taspen').value,
            npwp: document.getElementById('npwp').value,
            no_hp: document.getElementById('no_hp').value,
            email: document.getElementById('email_pegawai').value,
            role: document.getElementById('role_user').value
        };

        // Proses Unggah Berkas jika ada file baru yang dipilih
        const fileMapping = [
            { id: 'f_foto', folder: 'foto', key: 'url_foto' },
            { id: 'f_ktp', folder: 'ktp', key: 'url_ktp' },
            { id: 'f_kk', folder: 'kk', key: 'url_kk' },
            { id: 'f_ijazah', folder: 'ijazah', key: 'url_ijazah' },
            { id: 'f_transkrip', folder: 'transkrip', key: 'url_transkrip' },
            { id: 'f_pangkat', folder: 'pangkat', key: 'url_pangkat' },
            { id: 'f_jabatan', folder: 'jabatan', key: 'url_jabatan' },
            { id: 'f_nota', folder: 'nota', key: 'url_nota' },
            { id: 'f_bpjs', folder: 'bpjs', key: 'url_bpjs' },
            { id: 'f_taspen', folder: 'taspen', key: 'url_ketenagakerjaan_taspen' },
            { id: 'f_npwp', folder: 'npwp', key: 'url_npwp' }
        ];

        for (const f of fileMapping) {
            const fileUrl = await uploadBerkasKeBucket(document.getElementById(f.id), f.folder, nikPegawai);
            if (fileUrl) payload[f.key] = fileUrl;
        }

        try {
            if (id) {
                // Proses Aksi Update Data Pegawai
                const { error } = await supabaseClient.from('pegawai').update(payload).eq('id_pegawai', id);
                if (error) throw error;
                alert('Data pegawai berhasil diperbarui.');
            } else {
                // Proses Aksi Tambah Baru Data Pegawai
               const { error } = await supabaseClient.from('pegawai').insert([payload]);
                if (error) throw error;
                alert('Pegawai baru berhasil ditambahkan.');
            }

            // Tutup Modal Bootstrap secara programmatif
            bootstrap.Modal.getInstance(document.getElementById('modalPegawai')).hide();
            await muatDataDariSupabase();
        } catch (err) {
            alert('Gagal menyimpan data: ' + err.message);
        }
    }

    // Render Data & Pagination Framework
    function renderTabel() {
        const cari = DOM.txtCari.value.toLowerCase();
        const stat = DOM.filterStatus.value;
        const kel = DOM.filterKelompok.value;

        // Proses seleksi filter array data
        const dataDisaring = listPegawai.filter(p => {
            const matchKeyword = (p.nama && p.nama.toLowerCase().includes(cari)) ||
                                 (p.nik && p.nik.includes(cari)) ||
                                 (p.nip && p.nip.includes(cari));
            const matchStatus = !stat || p.status_pegawai === stat;
            const matchKelompok = !kel || p.kelompok_pegawai === kel;
            return matchKeyword && matchStatus && matchKelompok;
        });

        // Hitung batasan index halaman
        const indexMulai = (pageSekarang - 1) * barisPerHalaman;
        const indexSelesai = indexMulai + barisPerHalaman;
        const pagedData = dataDisaring.slice(indexMulai, indexSelesai);

        DOM.tbody.innerHTML = "";

        if (pagedData.length === 0) {
            DOM.tbody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-muted">Tidak ada data pegawai yang cocok ditemukan.</td></tr>`;
            return;
        }

        pagedData.forEach(p => {
            const badgeMap = {
                'Aktif': 'bg-success', 'Mutasi': 'bg-warning', 'Pensiun': 'bg-danger', 'Resign': 'bg-secondary'
            };
            const badgeClass = badgeMap[p.status_pegawai] || 'bg-dark';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${p.url_foto || 'https://via.placeholder.com/40'}" class="rounded-circle me-2 object-fit-cover shadow-sm" width="40" height="40">
                        <div>
                            <div class="fw-bold text-dark">${p.nama}</div>
                            <small class="text-muted">NIK: ${p.nik}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div>${p.nip || '<span class="text-muted font-monospace">-</span>'}</div>
                    <small class="text-muted">HP: ${p.no_hp || '-'}</small>
                </td>
                <td>
                    <div><span class="badge bg-light text-dark border">${p.kelompok_pegawai}</span></div>
                    <small class="text-secondary">Gol: ${p.golongan || '-'}</small>
                </td>
                <td>
                    <div class="fw-semibold text-truncate" style="max-width:180px;">${p.jabatan || '-'}</div>
                    <small class="text-primary"><i class="fa-solid fa-door-open me-1"></i>${p.ruangan || '-'}</small>
                </td>
                <td><small class="text-dark font-xs fw-medium">${p.masa_kerja || '-'}</small></td>
                <td><span class="badge ${badgeClass}">${p.status_pegawai}</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary btn-edit me-1" data-id="${p.id_pegawai}"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn btn-sm btn-outline-danger btn-hapus" data-id="${p.id_pegawai}"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;

            // Pasang Aksi Event Handler Inline Tombol Aksi
            tr.querySelector('.btn-edit').addEventListener('click', () => muatEditForm(p.id_pegawai));
            tr.querySelector('.btn-hapus').addEventListener('click', () => hapusPegawaiData(p.id_pegawai));
            DOM.tbody.appendChild(tr);
        });

        document.getElementById('lblInfoHalaman').textContent = `Menampilkan ${indexMulai + 1}-${Math.min(indexSelesai, dataDisaring.length)} dari ${dataDisaring.length} Pegawai`;
        bangunNavigasiHalaman(dataDisaring.length);
    }

    // Generator Komponen Pagination Dinamis
    function bangunNavigasiHalaman(totalData) {
        const totalHalaman = Math.ceil(totalData / barisPerHalaman);
        const barNav = document.getElementById('paginationBar');
        barNav.innerHTML = "";

        if(totalHalaman <= 1) return;

        // Tombol Back
        barNav.innerHTML += `<li class="page-item ${pageSekarang === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${pageSekarang - 1}">Back</a></li>`;
        
        // Nomor Halaman Terurut
        for (let i = 1; i <= totalHalaman; i++) {
            barNav.innerHTML += `<li class="page-item ${pageSekarang === i ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }

        // Tombol Next
        barNav.innerHTML += `<li class="page-item ${pageSekarang === totalHalaman ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${pageSekarang + 1}">Next</a></li>`;

        barNav.querySelectorAll('.page-link').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = parseInt(e.target.getAttribute('data-page'));
                if (targetPage > 0 && targetPage <= totalHalaman) {
                    pageSekarang = targetPage;
                    renderTabel();
                }
            });
        });
    }

    // Mengambil dan memetakan data terpilih ke form pengeditan modal
    function muatEditForm(id) {
        const p = listPegawai.find(peg => peg.id_pegawai === id);
        if(!p) return;

        document.getElementById('id_pegawai').value = p.id_pegawai;
        document.getElementById('nik').value = p.nik;
        document.getElementById('nama').value = p.nama;
        document.getElementById('tempat_lahir').value = p.tempat_lahir;
        DOM.tanggalLahir.value = p.tanggal_lahir;
        DOM.nip.value = p.nip;
        document.getElementById('status_pegawai').value = p.status_pegawai;
        document.getElementById('kelompok_pegawai').value = p.kelompok_pegawai;
        document.getElementById('golongan').value = p.golongan;
        document.getElementById('tmt_pangkat').value = p.tmt_pangkat;
        document.getElementById('kelompok_jabatan').value = p.kelompok_jabatan;
        document.getElementById('jabatan').value = p.jabatan;
        document.getElementById('tmt_jabatan').value = p.tmt_jabatan;
        DOM.masukRs.value = p.masuk_rs;
        DOM.masaKerja.value = p.masa_kerja;
        DOM.tmtCpns.value = p.tmt_cpns;
        DOM.bup.value = p.bup;
        DOM.tmtPensiun.value = p.tmt_pensiun;
        document.getElementById('status_keluarga').value = p.status_keluarga;
        document.getElementById('no_kk').value = p.no_kk;
        document.getElementById('pasangan').value = p.pasangan;
        
        DOM.jmlAnak.value = p.jml_anak;
        DOM.jmlAnak.dispatchEvent(new Event('change')); // Memicu update kolom anak

        document.getElementById('anak1').value = p.anak1 || "";
        document.getElementById('anak2').value = p.anak2 || "";
        document.getElementById('anak3').value = p.anak3 || "";
        document.getElementById('alamat').value = p.alamat;
        document.getElementById('jenjang').value = p.jenjang;
        document.getElementById('fakultas').value = p.fakultas;
        document.getElementById('jurusan').value = p.jurusan;
        document.getElementById('asal_pendidikan').value = p.asal_pendidikan;
        document.getElementById('ruangan').value = p.ruangan;
        document.getElementById('tmt_nota').value = p.tmt_nota;
        document.getElementById('bpjs_kesehatan').value = p.bpjs_kesehatan;
        document.getElementById('ketenagakerjaan_taspen').value = p.ketenagakerjaan_taspen;
        document.getElementById('npwp').value = p.npwp;
        document.getElementById('no_hp').value = p.no_hp;
        document.getElementById('email_pegawai').value = p.email;
        document.getElementById('role_user').value = p.role;

        document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-user-pen me-2 text-warning"></i> Perbarui Data Pegawai';
        new bootstrap.Modal(document.getElementById('modalPegawai')).show();
    }

    // Fungsi Hapus Data Pegawai
    async function hapusPegawaiData(id) {
        if(confirm('Apakah Anda yakin ingin menghapus data pegawai ini secara permanen dari sistem?')) {
            try {
                const { error } = await supabaseClient.from('pegawai').delete().eq('id_pegawai', id);
                if(error) throw error;
                alert('Data pegawai telah berhasil dihapus.');
                await muatDataDariSupabase();
            } catch(err) {
                alert('Gagal menghapus data: ' + err.message);
            }
        }
    }

    // Jalankan inisialisasi aplikasi
    init();
})();
