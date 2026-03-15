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
// 0. KASTAM UI LOADER & TOAST (WAJIB ADA)
// ==========================================
function showCustomLoader(textMsg = "Memproses...") { 
    const textEl = document.getElementById('loaderText');
    if(textEl) textEl.innerText = textMsg; 
    const loader = document.getElementById('customLoader'); 
    if(loader) {
        loader.classList.remove('d-none'); 
        setTimeout(() => loader.classList.add('show'), 10); 
    }
}

function hideCustomLoader() { 
    const loader = document.getElementById('customLoader'); 
    if(loader) {
        loader.classList.remove('show'); 
        setTimeout(() => loader.classList.add('d-none'), 300); 
    }
}

function showCustomToast(type, title, message) { 
    const container = document.getElementById('toastContainer'); 
    if(!container) return;
    let iconClass = "fa-solid fa-circle-info";
    if (type === 'success') iconClass = "fa-solid fa-circle-check";
    if (type === 'error') iconClass = "fa-solid fa-circle-exclamation";
    
    const toast = document.createElement('div'); 
    toast.className = `custom-toast toast-${type}`; 
    toast.innerHTML = `<div class="toast-icon"><i class="${iconClass}"></i></div><div class="toast-content"><h6>${title}</h6><p>${message}</p></div>`; 
    container.appendChild(toast); 
    setTimeout(() => toast.classList.add('show'), 10); 
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3500); 
}

// ==========================================
// FAIL: js/notifikasi.js
// FUNGSI KIRA & POP-UP NOTIFIKASI PINTAR DALAM WEB
// ==========================================

function semakNotifikasiTuntutan(uid) {
    const userRef = db.doc('users/' + uid);
    
    db.collection('application').where('created_by', '==', userRef).get()
        .then((snapshot) => {
            let jumlahPerluTindakan = 0;
            
            // 🌟 MEMORI INGATAN: Tarik senarai ID borang yang staf DAH BACA
            let notifiedTolak = JSON.parse(localStorage.getItem('notifiedTolak') || '[]');
            let notifiedSokong = JSON.parse(localStorage.getItem('notifiedSokong') || '[]');
            
            // Simpanan ID baru untuk sesi ini
            let newTolakIds = [];
            let newSokongIds = [];
            
            // Pembolehubah untuk Pop-up Lulus Akhir (HR)
            let adaStatusLulus = false;
            let senaraiKursusLulus = "";
            
            // Pembolehubah untuk Pop-up Ditolak (KJ/HR)
            let adaStatusTolak = false;
            let senaraiKursusTolak = "";
            
            // Pembolehubah untuk Pop-up Disokong (KJ)
            let adaStatusSokong = false;
            let senaraiKursusSokong = "";
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const statusDB = data.status || "";
                const statusTuntutan = data.status_tuntutan || "Belum Selesai";
                
                // 1. Semak Lulus Akhir (HILANG BILA DAH HANTAR A1)
                // Tambah syarat 'SELESAI' kerana Admin HR tukar status ke Selesai lepas hantar emel
                let isLulusSistem = (statusDB === 'APPROVED' || statusDB.toUpperCase() === 'LULUS' || statusDB.toUpperCase() === 'SELESAI');
                if (isLulusSistem && statusTuntutan === "Belum Selesai") {
                    jumlahPerluTindakan++;
                    adaStatusLulus = true;
                    senaraiKursusLulus += `<li>${data.tajuk_kursus}</li>`;
                }

                // 2. Semak jika DITOLAK (HILANG LEPAS STAF KLIK TUTUP)
                if (statusDB === "REJECTED" || statusDB === "DITOLAK" || (data.keputusan || "").includes("Ditolak")) {
                    // Hanya kumpul jika BELUM PERNAH dibaca
                    if (!notifiedTolak.includes(doc.id)) {
                        adaStatusTolak = true;
                        senaraiKursusTolak += `<li>${data.tajuk_kursus} <br><small class="text-dark">Sebab: ${data.catatan_kj || data.catatan || "Tiada ulasan"}</small></li>`;
                        newTolakIds.push(doc.id); // Simpan ID untuk ditanda "Dah Baca" nanti
                    }
                }

                // 3. Semak jika DISOKONG OLEH KJ (HILANG LEPAS STAF KLIK BAIK)
                // Tambahan && !isLulusSistem untuk pastikan borang yg dah lulus tak masuk sini
                if (statusDB === "Menunggu Kelulusan HR" && !isLulusSistem) {
                    // Hanya kumpul jika BELUM PERNAH dibaca
                    if (!notifiedSokong.includes(doc.id)) {
                        adaStatusSokong = true;
                        senaraiKursusSokong += `<li>${data.tajuk_kursus} <br><small class="text-muted">Catatan KJ: <i>"${data.catatan_kj || "Disokong"}"</i></small></li>`;
                        newSokongIds.push(doc.id); // Simpan ID untuk ditanda "Dah Baca" nanti
                    }
                }
            });

            // ===============================================
            // JENIS 1: LENCANA MERAH DI DASHBOARD
            // ===============================================
            const badge = document.getElementById('badgeNotifSemakStatus');
            if (badge) {
                if (jumlahPerluTindakan > 0) {
                    badge.innerText = jumlahPerluTindakan;
                    badge.classList.remove('d-none'); 
                } else {
                    badge.classList.add('d-none'); 
                }
            }

            // ===============================================
            // LOGIK PAPARAN POP-UP (Hierarki Keutamaan: LULUS > TOLAK > SOKONG KJ)
            // ===============================================
            
            if (adaStatusLulus && !sessionStorage.getItem('popup7HariDilihat')) {
                // POP-UP A: LULUS & KENA HANTAR A1
                Swal.fire({
                    title: 'Tindakan Diperlukan! 📢',
                    html: `
                        <div class="text-start mt-2" style="font-size: 0.95rem;">
                            Tahniah! Permohonan kursus anda telah <b class="text-success">DILULUSKAN</b>:
                            <ul class="text-primary-green fw-bold mt-2 ps-3">
                                ${senaraiKursusLulus}
                            </ul>
                            Sila pastikan anda memuat naik <b>Borang A1 & Sijil Penyertaan</b> di bahagian Semak Status dalam tempoh <b class="text-danger bg-warning-subtle px-1 rounded">7 HARI</b> selepas kursus tamat.<br><br>
                            <small class="text-muted fst-italic">*Notifikasi ini akan hilang secara automatik selepas anda memuat naik dokumen tersebut.</small>
                        </div>
                    `,
                    icon: 'warning',
                    iconColor: '#f59e0b', 
                    confirmButtonColor: '#0f766e',
                    confirmButtonText: 'Baik, Saya Faham',
                    allowOutsideClick: false
                }).then(() => {
                    sessionStorage.setItem('popup7HariDilihat', 'true');
                });
            } 
            else if (adaStatusTolak) {
                // POP-UP B: DITOLAK
                Swal.fire({
                    title: 'Permohonan Ditolak',
                    html: `
                        <div class="text-start mt-2" style="font-size: 0.95rem;">
                            Harap maaf, permohonan kursus berikut <b>TIDAK DISOKONG / DITOLAK</b>:
                            <ul class="text-danger fw-bold mt-3 ps-3" style="list-style-type: square;">
                                ${senaraiKursusTolak}
                            </ul>
                            <div class="mt-3 small text-muted">Sila rujuk muka surat Semak Status untuk butiran lanjut.</div>
                        </div>
                    `,
                    icon: 'error',
                    confirmButtonColor: '#dc2626',
                    confirmButtonText: 'Tutup',
                    allowOutsideClick: false
                }).then((result) => {
                    if (result.isConfirmed) {
                        // 🌟 TANDA SEBAGAI "DAH BACA"
                        let currentTolak = JSON.parse(localStorage.getItem('notifiedTolak') || '[]');
                        localStorage.setItem('notifiedTolak', JSON.stringify([...currentTolak, ...newTolakIds]));
                    }
                });
            }
            else if (adaStatusSokong) {
                // POP-UP C: DISOKONG KJ
                Swal.fire({
                    title: 'Sokongan Ketua Jabatan! 🎉',
                    html: `
                        <div class="text-start mt-2" style="font-size: 0.95rem;">
                            Berita baik! Permohonan kursus anda telah <b class="text-success">DISEMAK & DISOKONG</b> oleh Ketua Jabatan:
                            <ul class="text-primary fw-bold mt-3 ps-3" style="list-style-type: square; color: #0284c7 !important;">
                                ${senaraiKursusSokong}
                            </ul>
                            <div class="mt-3 small text-muted">Borang anda kini sedang dalam fasa kelulusan akhir oleh pihak HR. Terus pantau status anda di sini.</div>
                        </div>
                    `,
                    icon: 'success',
                    iconColor: '#0ea5e9',
                    confirmButtonColor: '#0284c7',
                    confirmButtonText: 'Alhamdulillah, Baik',
                    allowOutsideClick: false
                }).then((result) => {
                    if (result.isConfirmed) {
                        // 🌟 TANDA SEBAGAI "DAH BACA"
                        let currentSokong = JSON.parse(localStorage.getItem('notifiedSokong') || '[]');
                        localStorage.setItem('notifiedSokong', JSON.stringify([...currentSokong, ...newSokongIds]));
                    }
                });
            }

        }).catch(error => console.error("Ralat notifikasi:", error));
}

// ==========================================
// 4. FUNGSI MEMOHON AKSES KETUA JABATAN (E-MEL ADMIN)
// ==========================================
function mohonAksesKJ() {
    const user = auth.currentUser;
    if (!user) return;

    if (user.email === "hrd@uitm.edu.my") {
        showCustomToast('info', 'Akaun Master', 'Anda adalah Super Admin. Anda tidak perlu memohon akses ini.');
        return;
    }

    db.collection('users').doc(user.uid).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();

            if (data.role === 'ketua_jabatan' || data.role === 'superadmin') {
                showCustomToast('info', 'Akses Diberikan', 'Anda sudah pun mempunyai akses pentadbiran.');
                return;
            }

            // POP-UP SWEETALERT BERSERTA DROPDOWN KUMPULAN (OPTGROUP)
            Swal.fire({
                title: 'Mohon Akses Ketua Jabatan',
                html: `
                    <p class="small text-muted mb-3">Sila pilih jabatan / unit yang anda uruskan untuk semakan dan kelulusan Admin HR.</p>
                    <select id="swal-pilihan-jabatan" class="form-select border-success shadow-sm" style="text-align: left;">
                        ${binaHTMLDropdownJabatan()}
                    </select>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#0f766e', 
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Hantar Permohonan',
                cancelButtonText: 'Batal',
                preConfirm: () => {
                    const jabatan = document.getElementById('swal-pilihan-jabatan').value;
                    if (!jabatan) {
                        Swal.showValidationMessage('Sila pilih jabatan anda terlebih dahulu!');
                        return false;
                    }
                    return jabatan;
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const jabatanDipilih = result.value;
                    showCustomLoader("Menghantar Permohonan kepada HR...");

                    let ayatEmel = `Salam pentadbir sistem,\n\n`;
                    ayatEmel += `Sistem telah merekodkan satu permohonan baharu daripada staf untuk ditetapkan sebagai Ketua Jabatan di dalam pangkalan data e-Latihan.\n\n`;
                    ayatEmel += `Butiran Staf:\n`;
                    ayatEmel += `Nama: ${data.namaPenuh || "Tiada Maklumat"}\n`;
                    ayatEmel += `E-mel: ${data.email || user.email}\n`;
                    ayatEmel += `No. Pekerja: ${data.noPekerja || "Tiada Maklumat"}\n`;
                    ayatEmel += `Jabatan Dipohon: ${jabatanDipilih}\n\n`; // <-- JABATAN DIMASUKKAN DI SINI
                    ayatEmel += `Tindakan:\n`;
                    ayatEmel += `Sila semak Pusat Kawalan dan tetapkan "Role" staf ini kepada Ketua Jabatan berserta jabatan yang dipohon sekiranya beliau layak.\n\n`;
                    ayatEmel += `Terima kasih.\n`;

                    const templateParams = {
                        to_email: "hrd@uitm.edu.my", 
                        subjek_emel: `Mohon Ketua Jabatan: ${jabatanDipilih} - ${data.namaPenuh || "Staf"}`,
                        kandungan_emel: ayatEmel
                    };

                    if (typeof emailjs !== "undefined") {
                        emailjs.send("service_pryuhiu", "template_h9eddz7", templateParams, "Fevnjv1nV60-D-GvC")
                            .then(() => {
                                hideCustomLoader();
                                Swal.fire('Berjaya!', 'Permohonan anda berserta jabatan pilihan telah dihantar kepada Admin HR.', 'success');
                            })
                            .catch((err) => {
                                hideCustomLoader();
                                showCustomToast('error', 'Gagal', 'Sistem gagal menghantar notifikasi.');
                            });
                    }
                }
            });
        }
    }).catch(() => showCustomToast('error', 'Ralat', 'Gagal menyambung ke pangkalan data.'));
}