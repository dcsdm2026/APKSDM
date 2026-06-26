function initPengaturanModule() {
    ambilDataMaster();
}

async function ambilDataMaster() {
    const tbody = document.getElementById("tabel-pengaturan-body");
    if(!tbody) return;
    
    const { data, error } = await supabase.from("pengaturan").select("*").order("master_data", { ascending: true });
    if(error) return;

    tbody.innerHTML = data.map(d => `
        <tr class="hover:bg-slate-50 transition">
            <td class="p-3 font-semibold text-blue-600 text-xs">${d.master_data.toUpperCase()}</td>
            <td class="p-3">${d.keterangan}</td>
            <td class="p-3 text-center">
                <button onclick="hapusMasterData(${d.id_pengaturan})" class="text-red-500 hover:text-red-700 p-1"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        </tr>
    `).join('');
}

async function simpanMasterData(e) {
    e.preventDefault();
    const master_data = document.getElementById("p-master_data").value;
    const keterangan = document.getElementById("p-keterangan").value;

    const { error } = await supabase.from("pengaturan").insert([{ master_data, keterangan }]);
    if (error) {
        alert("Gagal menambahkan entitas: " + error.message);
    } else {
        document.getElementById("p-keterangan").value = "";
        ambilDataMaster();
    }
}

async function hapusMasterData(id) {
    if (confirm("Apakah anda bersedia menghapus opsi pilihan ini?")) {
        await supabase.from("pengaturan").delete().eq("id_pengaturan", id);
        ambilDataMaster();
    }
}
