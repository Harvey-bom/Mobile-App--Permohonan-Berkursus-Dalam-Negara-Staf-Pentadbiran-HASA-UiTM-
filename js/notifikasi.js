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

// ==========================================
// FAIL: js/notifikasi.js
// FUNGSI KIRA & POP-UP NOTIFIKASI PINTAR DALAM WEB
// ==========================================

function semakNotifikasiTuntutan(uid) {
    const userRef = db.doc('users/' + uid);
    
    db.collection('application').where('created_by', '==', userRef).get()
        .then((snapshot) => {
            let jumlahPerluTindakan = 0;
            
            // Pembolehubah untuk Pop-up Lulus Akhir (HR)
            let adaStatusLulus = false;
            let senaraiKursusLulus = "";
            
            // Pembolehubah untuk Pop-up Ditolak (KJ/HR)
            let adaStatusTolak = false;
            let senaraiKursusTolak = "";
            
            // Pembolehubah untuk Pop-up Disokong (KJ) - BAHARU!
            let adaStatusSokong = false;
            let senaraiKursusSokong = "";
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const statusDB = data.status || "";
                const statusTuntutan = data.status_tuntutan || "Belum Selesai";
                
                // 1. Semak Lulus Akhir (Memerlukan Borang A1)
                let isLulusSistem = (statusDB === 'APPROVED' || statusDB.toUpperCase() === 'LULUS');
                if (isLulusSistem && statusTuntutan === "Belum Selesai") {
                    jumlahPerluTindakan++;
                    adaStatusLulus = true;
                    senaraiKursusLulus += `<li>${data.tajuk_kursus}</li>`;
                }

                // 2. Semak jika DITOLAK
                if (statusDB === "REJECTED" || statusDB === "DITOLAK" || (data.keputusan || "").includes("Ditolak")) {
                    adaStatusTolak = true;
                    senaraiKursusTolak += `<li>${data.tajuk_kursus} <br><small class="text-dark">Sebab: ${data.catatan_kj || data.catatan || "Tiada ulasan"}</small></li>`;
                }

                // 3. Semak jika DISOKONG OLEH KJ (Menunggu HR)
                if (statusDB === "Menunggu Kelulusan HR") {
                    adaStatusSokong = true;
                    senaraiKursusSokong += `<li>${data.tajuk_kursus} <br><small class="text-muted">Catatan KJ: <i>"${data.catatan_kj || "Disokong"}"</i></small></li>`;
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
            // LOGIK PAPARAN POP-UP (Hanya 1 pop-up per sesi login supaya tak serabut)
            // Hierarki Keutamaan: LULUS > TOLAK > SOKONG KJ
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
                            Sila pastikan anda memuat naik <b>Borang A1 & Sijil Penyertaan</b> di bahagian Semak Status dalam tempoh <b class="text-danger bg-warning-subtle px-1 rounded">7 HARI</b> selepas kursus tamat.
                        </div>
                    `,
                    icon: 'warning',
                    iconColor: '#f59e0b', 
                    confirmButtonColor: '#0f766e',
                    confirmButtonText: 'Baik, Saya Faham',
                    allowOutsideClick: false
                });
                sessionStorage.setItem('popup7HariDilihat', 'true');
            } 
            else if (adaStatusTolak && !sessionStorage.getItem('popupTolakDilihat')) {
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
                });
                sessionStorage.setItem('popupTolakDilihat', 'true'); 
            }
            else if (adaStatusSokong && !sessionStorage.getItem('popupSokongDilihat')) {
                // POP-UP C: DISOKONG KJ (BAHARU)
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
                    iconColor: '#0ea5e9', // Biru Muda
                    confirmButtonColor: '#0284c7',
                    confirmButtonText: 'Alhamdulillah, Baik',
                    allowOutsideClick: false
                });
                sessionStorage.setItem('popupSokongDilihat', 'true'); 
            }

        }).catch(error => console.error("Ralat notifikasi:", error));
}

// ==========================================
// 4. FUNGSI MEMOHON AKSES KETUA JABATAN (E-MEL ADMIN)
// ==========================================
function mohonAksesKJ() {
    const user = auth.currentUser;
    if (!user) return;

    // 1. HALANG JIKA AKAUN MASTER (GHOST ADMIN) YANG TEKAN
    if (user.email === "latihanhasa@gmail.com") {
        showCustomToast('info', 'Akaun Master', 'Anda adalah Super Admin. Anda tidak perlu memohon akses ini.');
        return;
    }

    // Semak profil di pangkalan data
    db.collection('users').doc(user.uid).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();

            // 2. HALANG JIKA SUDAH JADI KJ / ADMIN
            if (data.role === 'ketua_jabatan' || data.role === 'superadmin') {
                showCustomToast('info', 'Akses Diberikan', 'Anda sudah pun mempunyai akses pentadbiran.');
                return;
            }

            // 3. JIKA STAF BIASA, TERUSKAN PROSES MEMOHON
            Swal.fire({
                title: 'Mohon Akses Ketua Jabatan',
                text: 'Adakah anda pasti ingin memohon peranan Ketua Jabatan? Permohonan ini akan dihantar kepada Admin HR untuk semakan dan pengesahan.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#0f766e', // Hijau HASA
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Ya, Hantar Permohonan',
                cancelButtonText: 'Batal'
            }).then((result) => {
                if (result.isConfirmed) {
                    showCustomLoader("Menghantar Permohonan kepada HR...");

                    // Bina format E-mel yang Kalis Spam (Spam-Proof)
                    let ayatEmel = `Salam pentadbir sistem,\n\n`;
                    ayatEmel += `Sistem telah merekodkan satu permohonan baharu daripada staf untuk ditetapkan sebagai Ketua Jabatan di dalam pangkalan data e-Latihan.\n\n`;
                    ayatEmel += `Butiran Staf:\n`;
                    ayatEmel += `Nama: ${data.namaPenuh || "Tiada Maklumat"}\n`;
                    ayatEmel += `E-mel: ${data.email || user.email}\n`;
                    ayatEmel += `No. Pekerja: ${data.noPekerja || "Tiada Maklumat"}\n\n`;
                    ayatEmel += `Tindakan:\n`;
                    ayatEmel += `Sila semak senarai staf di Pusat Kawalan dan tetapkan jabatan yang berkaitan untuk staf ini.\n\n`;
                    ayatEmel += `Terima kasih.\n`;

                    const templateParams = {
                        to_email: "latihanhasa@gmail.com", 
                        subjek_emel: `Permohonan Ketua Jabatan - ${data.namaPenuh || "Staf"}`,
                        kandungan_emel: ayatEmel
                    };

                    // Hantar E-mel guna EmailJS
                    if (typeof emailjs !== "undefined") {
                        emailjs.send("service_pryuhiu", "template_h9eddz7", templateParams, "Fevnjv1nV60-D-GvC")
                            .then(() => {
                                hideCustomLoader();
                                Swal.fire({
                                    title: 'Berjaya Dihantar!',
                                    text: 'Permohonan anda telah direkodkan. Pihak pentadbir akan menyemak akaun anda sebentar lagi.',
                                    icon: 'success',
                                    confirmButtonColor: '#0f766e'
                                });
                            })
                            .catch((err) => {
                                hideCustomLoader();
                                console.error("Ralat EmailJS:", err);
                                showCustomToast('error', 'Gagal', 'Sistem gagal menghantar notifikasi.');
                            });
                    } else {
                        hideCustomLoader();
                        showCustomToast('error', 'Ralat', 'Skrip sistem e-mel tidak dijumpai.');
                    }
                }
            });
        } else {
            showCustomToast('error', 'Ralat Profil', 'Profil anda tidak dijumpai. Sila kemas kini profil.');
        }
    }).catch(error => {
        console.error("Ralat pangkalan data:", error);
        showCustomToast('error', 'Ralat', 'Gagal menyambung ke pangkalan data.');
    });
}