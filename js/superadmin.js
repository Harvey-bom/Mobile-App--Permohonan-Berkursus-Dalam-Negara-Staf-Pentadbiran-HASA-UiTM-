// ==========================================
// CARTA ORGANISASI HASA UiTM (HIERARKI)
// ==========================================
const KATEGORI_JABATAN_HASA = {
    "Pengarah Hospital / Pengurusan Tertinggi": [
        "Pejabat Pengarah",
        "Jabatan Khidmat Komuniti & Ambulatori",
        "Jabatan Penyelidikan, Jaringan Industri & Inovasi",
        "Jabatan Kejururawatan",
        "Jabatan Komunikasi Korporat",
        "Pejabat Undang-Undang",
        "Bahagian Perkhidmatan Eksekutif",
        "Bahagian Pengurusan Klinikal"
    ],
    "Timbalan Pengarah Klinikal (Perubatan)": [
        "Jabatan Perubatan",
        "Jabatan Perubatan Kecemasan",
        "Jabatan Perubatan Penjagaan Primer",
        "Jabatan Perubatan Pemulihan",
        "Jabatan Pediatrik",
        "Jabatan Psikiatri",
        "Jabatan Perubatan Kesihatan Awam",
        "Jabatan Etika & Undang-Undang Perubatan",
        "Pusat Perkhidmatan Nefrologi",
        "Pusat Perkhidmatan Onkologi",
        "Pusat Perkhidmatan Kardiologi",
        "Pusat Perkhidmatan Respiratori",
        "Pusat Perkhidmatan Rawatan Harian",
        "Pusat Perkhidmatan Gastroenterologi & Hepatologi",
        "Unit Pencegahan & Kawalan Infeksi"
    ],
    "Timbalan Pengarah Klinikal (Pembedahan)": [
        "Jabatan Pembedahan",
        "Jabatan Kardiovaskular & Pembedahan Torasik",
        "Jabatan Ortopedik & Traumatologi",
        "Jabatan Oftalmologi",
        "Jabatan Otorinolaringologi - Pembedahan Kepala & Leher",
        "Jabatan Anestesiologi & Rawatan Intensif",
        "Jabatan Obstetrik & Ginekologi",
        "Jabatan Patologi Forensik",
        "Pusat Perkhidmatan Pergigian",
        "Pusat Perkhidmatan Pembedahan Plastik",
        "Pusat Perkhidmatan Dewan Bedah"
    ],
    "Timbalan Pengarah Profesional dan Operasi": [
        "Jabatan Radiologi",
        "Jabatan Makmal Diagnostik Klinikal",
        "Jabatan Pengurusan Risiko, Pematuhan & Kualiti",
        "Jabatan Farmasi",
        "Jabatan Maklumat Pesakit",
        "Jabatan Dietetik & Sajian",
        "Jabatan Kerja Sosial Perubatan",
        "Jabatan Infrastruktur",
        "Jabatan Infostruktur",
        "Unit Penyeliaan Penolong Pegawai Perubatan",
        "Unit Casemix",
        "Perpustakaan Perubatan Tun Abdul Razak"
    ],
    "Timbalan Pengarah Pengurusan": [
        "Bahagian Sumber Manusia",
        "Bahagian Pembangunan Sumber Manusia",
        "Bahagian Governan & Integriti",
        "Bahagian Pembangunan Perniagaan",
        "Pejabat Polis Bantuan",
        "Unit Spiritualiti",
        "Unit Kaunseling"
    ],
    "Timbalan Pengarah Kewangan": [
        "Jabatan Kewangan"
    ]
};

// Fungsi untuk menukar Kamus Data menjadi HTML <optgroup>
function binaHTMLDropdownJabatan() {
    let html = `<option value="" disabled selected>Pilih Jabatan / Unit Anda...</option>`;
    
    for (const [kategori, senaraiJabatan] of Object.entries(KATEGORI_JABATAN_HASA)) {
        // Bina tajuk kumpulan yang tak boleh diklik (optgroup)
        html += `<optgroup label="--- ${kategori.toUpperCase()} ---">`;
        
        // Masukkan jabatan di bawah kumpulan tersebut
        senaraiJabatan.forEach(jabatan => {
            html += `<option value="${jabatan}">${jabatan}</option>`;
        });
        
        html += `</optgroup>`;
    }
    return html;
}

// ==========================================
// 0. KASTAM UI LOADER & TOAST
// ==========================================
function showCustomLoader(textMsg = "Memproses...") { document.getElementById('loaderText').innerText = textMsg; const loader = document.getElementById('customLoader'); loader.classList.remove('d-none'); setTimeout(() => loader.classList.add('show'), 10); }
function hideCustomLoader() { const loader = document.getElementById('customLoader'); loader.classList.remove('show'); setTimeout(() => loader.classList.add('d-none'), 300); }
function showCustomToast(type, title, message) { const container = document.getElementById('toastContainer'); let iconClass = type === 'success' ? "fa-solid fa-circle-check" : "fa-solid fa-circle-exclamation"; const toast = document.createElement('div'); toast.className = `custom-toast toast-${type}`; toast.innerHTML = `<div class="toast-icon"><i class="${iconClass}"></i></div><div class="toast-content"><h6>${title}</h6><p>${message}</p></div>`; container.appendChild(toast); setTimeout(() => toast.classList.add('show'), 10); setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3500); }

// ==========================================
// 1. SISTEM KESELAMATAN & TARIK DATA SEMUA PENGGUNA
// ==========================================
let senaraiSemuaPengguna = [];

auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('pilihanJabatanDiurus').innerHTML = binaHTMLDropdownJabatan();
        // 1. LALUAN VIP UNTUK MASTER KEY (LATIHAN HASA)
        if (user.email === "hrd@uitm.edu.my") {
            tarikSemuaPengguna(); // Terus benarkan masuk dan tarik data
            return; // Berhentikan kod di sini, tak perlu cari dalam collection 'users'
        }

        // 2. LALUAN BIASA (Untuk staf yang diangkat jadi Super Admin nanti)
        db.collection('users').doc(user.uid).get().then((doc) => {
            if (doc.exists && doc.data().role === "superadmin") {
                tarikSemuaPengguna();
            } else {
                // TENDANG JIKA BUKAN SUPER ADMIN
                window.location.replace("dashboard.html");
            }
        }).catch(() => {
            window.location.replace("dashboard.html");
        });
        
    } else {
        window.location.replace("index.html");
    }
});

function tarikSemuaPengguna() {
    const container = document.getElementById('senaraiPenggunaContainer');
    
    db.collection('users').get().then((snapshot) => {
        senaraiSemuaPengguna = [];
        document.getElementById('totalUsersCount').innerText = snapshot.size;

        if (snapshot.empty) {
            container.innerHTML = `<tr><td colspan="5" class="text-center text-muted p-4">Tiada pengguna didaftarkan.</td></tr>`;
            return;
        }

        snapshot.forEach((doc) => {
            senaraiSemuaPengguna.push({ id: doc.id, data: doc.data() });
        });

        // Susun abjad ikut nama
        senaraiSemuaPengguna.sort((a, b) => (a.data.namaPenuh || "").localeCompare(b.data.namaPenuh || ""));
        lukisJadual(senaraiSemuaPengguna);
        
    }).catch(error => console.error("Ralat:", error));
}

// ==========================================
// 2. LUKIS JADUAL PENGGUNA
// ==========================================
function lukisJadual(senarai) {
    const container = document.getElementById('senaraiPenggunaContainer');
    container.innerHTML = '';

    if (senarai.length === 0) {
        container.innerHTML = `<tr><td colspan="5" class="text-center text-muted p-4">Carian tidak dijumpai.</td></tr>`;
        return;
    }

    senarai.forEach((user) => {
        const d = user.data;
        const nama = d.namaPenuh || "TIDAK DIKETAHUI";
        const emel = d.email || "-";
        const noPkj = d.noPekerja || "-";
        const peranan = d.role || "staf";
        const jabatan = d.jabatan_diurus || "-";
        const huruf = nama.charAt(0).toUpperCase();

        let lencanaRole = `<span class="badge badge-staf rounded-pill px-3 py-2"><i class="fa-solid fa-user-tie me-1"></i> Staf Biasa</span>`;
        if (peranan === "ketua_jabatan") {
            lencanaRole = `<span class="badge badge-kj rounded-pill px-3 py-2 fw-bold"><i class="fa-solid fa-crown me-1"></i> Ketua Jabatan</span>`;
        } else if (peranan === "superadmin") {
            lencanaRole = `<span class="badge badge-super rounded-pill px-3 py-2 fw-bold"><i class="fa-solid fa-shield-halved me-1"></i> Super Admin</span>`;
        }

        container.innerHTML += `
        <tr>
            <td class="ps-4 py-3">
                <div class="d-flex align-items-center">
                    <div class="avatar-circle bg-primary text-white me-3 flex-shrink-0 shadow-sm" style="background: linear-gradient(135deg, #4f46e5, #818cf8) !important;">${huruf}</div>
                    <div>
                        <div class="fw-bold text-dark" style="font-size: 0.95rem;">${nama}</div>
                        <div class="small text-muted">${emel}</div>
                    </div>
                </div>
            </td>
            <td class="fw-bold text-muted">${noPkj}</td>
            <td>${lencanaRole}</td>
            <td class="small text-muted">${peranan === 'ketua_jabatan' ? `<i class="fa-regular fa-building me-1"></i>${jabatan}` : `<span class="opacity-50">- Tidak Berkaitan -</span>`}</td>
            <td class="text-center pe-4">
                <button class="btn btn-sm btn-dark rounded-pill px-3 shadow-sm" onclick="bukaModalEdit('${user.id}')">
                    <i class="fa-solid fa-pen-to-square me-1"></i> Ubah
                </button>
            </td>
        </tr>`;
    });
}

// ==========================================
// 3. FUNGSI CARIAN (SEARCH BAR)
// ==========================================
function tapisJadual() {
    const kataKunci = document.getElementById('carianStaf').value.toLowerCase();
    const senaraiDitapis = senaraiSemuaPengguna.filter(user => {
        const nama = (user.data.namaPenuh || "").toLowerCase();
        const emel = (user.data.email || "").toLowerCase();
        return nama.includes(kataKunci) || emel.includes(kataKunci);
    });
    lukisJadual(senaraiDitapis);
}

// ==========================================
// 4. LOGIK MODAL EDIT & KEMAS KINI
// ==========================================
function togglePilihanJabatan() {
    const roleDipilih = document.getElementById('pilihanRole').value;
    const kotakJabatan = document.getElementById('kotakJabatanDiurus');
    
    if (roleDipilih === "ketua_jabatan") {
        kotakJabatan.classList.remove('d-none');
    } else {
        kotakJabatan.classList.add('d-none');
    }
}

function bukaModalEdit(userId) {
    const pengguna = senaraiSemuaPengguna.find(u => u.id === userId);
    if (!pengguna) return;
    
    document.getElementById('hideUserId').value = userId;
    document.getElementById('editNamaStaf').innerText = pengguna.data.namaPenuh || "Tiada Nama";
    document.getElementById('editEmailStaf').innerText = pengguna.data.email || "Tiada E-mel";
    document.getElementById('editHurufMula').innerText = (pengguna.data.namaPenuh || "A").charAt(0).toUpperCase();
    
    // Set nilai sedia ada
    const roleSemasa = pengguna.data.role || "staf";
    document.getElementById('pilihanRole').value = roleSemasa;
    document.getElementById('pilihanJabatanDiurus').value = pengguna.data.jabatan_diurus || "";
    
    togglePilihanJabatan(); // Tunjuk/Sembunyi kotak jabatan ikut role
    
    new bootstrap.Modal(document.getElementById('modalEditRole')).show();
}

function simpanPerananBaharu() {
    const userId = document.getElementById('hideUserId').value;
    const roleBaru = document.getElementById('pilihanRole').value;
    let jabatanBaru = document.getElementById('pilihanJabatanDiurus').value;

    // Halang simpan jika pilih KJ tapi tak pilih jabatan
    if (roleBaru === "ketua_jabatan" && !jabatanBaru) {
        showCustomToast('error', 'Sila Pilih Jabatan', 'Ketua Jabatan mesti diberikan satu Jabatan untuk diuruskan.');
        return;
    }

    // Jika dia diturunkan pangkat ke staf biasa/superadmin, kosongkan jabatan
    if (roleBaru !== "ketua_jabatan") {
        jabatanBaru = "";
    }

    const modalEl = document.getElementById('modalEditRole');
    bootstrap.Modal.getInstance(modalEl).hide();
    
    showCustomLoader("Mengemaskini Pangkalan Data...");

    db.collection('users').doc(userId).update({
        role: roleBaru,
        jabatan_diurus: jabatanBaru
    }).then(() => {
        hideCustomLoader();
        showCustomToast('success', 'Berjaya Dikemas Kini!', 'Peranan staf telah berjaya diubah.');
        tarikSemuaPengguna(); // Refresh jadual
    }).catch(error => {
        hideCustomLoader();
        console.error(error);
        showCustomToast('error', 'Gagal Disimpan', 'Ralat sistem pangkalan data.');
    });
}