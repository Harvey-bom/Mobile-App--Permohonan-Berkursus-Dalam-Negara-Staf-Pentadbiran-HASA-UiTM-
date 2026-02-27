// ==========================================
// 0. FUNGSI PENAPIS E-MEL (DENGAN PAS VIP ADMIN)
// ==========================================
function isUiTMEmail(email) {
    if (!email) return false;
    const emelKecil = email.trim().toLowerCase();
    
    // Benarkan e-mel UiTM ATAU e-mel rasmi Admin (VIP Bypass)
    if (emelKecil === "latihanhasa@gmail.com") {
        return true; 
    }
    
    return emelKecil.endsWith("uitm.edu.my");
}

// ==========================================
// 1. SEMAK STATUS LOG MASUK & SEKATAN E-MEL
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        if (!isUiTMEmail(user.email)) {
            auth.signOut().then(() => { window.location.replace("index.html"); });
            return;
        }

        dapatkanMaklumatStaf(user.uid);
        semakNotifikasiTuntutan(user.uid); 
        kiraStatistik(user.uid); // <--- TAMBAH BARIS INI
    } else {
        window.location.replace("index.html");
    }
});

// ==========================================
// 2. FUNGSI TARIK DATA & SEMAK PERANAN (ROLE) KJ / ADMIN
// ==========================================
function dapatkanMaklumatStaf(uid) {
    const user = auth.currentUser;
    
    db.collection('users').doc(uid).get()
        .then((doc) => {
            if (doc.exists) {
                const dataStaf = doc.data();
                const namaPenuh = dataStaf.namaPenuh || "Sistem Admin";
                
                // 1. TETAPAN ROLE PINTAR (Bypass Automatik untuk Admin)
                let peranan = dataStaf.role || "staf";
                if (user && user.email === "latihanhasa@gmail.com") {
                    peranan = "superadmin"; // Paksa jadi Super Admin sentiasa!
                }
                
                document.getElementById('displayNamaStaf').innerText = namaPenuh;
                
                const profilContainer = document.getElementById('profilStafContainer');
                let avatarHTML = '';

                // --- BINA AVATAR ---
                if (dataStaf.photoBase64) {
                    avatarHTML = `<img src="${dataStaf.photoBase64}" alt="Profile" class="avatar-circle clickable-avatar shadow-sm" style="object-fit: cover;">`;
                } else {
                    const hurufPertama = namaPenuh.charAt(0).toUpperCase();
                    avatarHTML = `<div class="avatar-circle clickable-avatar text-white shadow-sm" style="background: linear-gradient(135deg, #4f46e5, #818cf8);">${hurufPertama}</div>`;
                }

                // --- SEMAK ROLE PENGGUNA (STAF / KJ / SUPERADMIN) ---
                let lencanaRole = "";
                if (peranan === "ketua_jabatan") {
                    lencanaRole = `<span class="badge bg-warning text-dark px-2 py-1 ms-1" style="font-size: 0.65rem; position:relative; top:-2px;"><i class="fa-solid fa-crown me-1"></i>KJ</span>`;
                    hidupkanModKetuaJabatan(dataStaf.jabatan_diurus);
                } else if (peranan === "superadmin") {
                    lencanaRole = `<span class="badge bg-danger px-2 py-1 ms-1 shadow-sm" style="font-size: 0.65rem; position:relative; top:-2px;"><i class="fa-solid fa-user-shield me-1"></i>ADMIN</span>`;
                    // Hidupkan butang khas Super Admin di Dashboard
                    hidupkanModSuperAdmin();
                }

                profilContainer.innerHTML = `
                    <div class="text-end me-2 d-none d-sm-block">
                        <div class="fw-bold text-dark lh-1" style="font-size: 0.9rem;">${namaPenuh} ${lencanaRole}</div>
                        <div class="text-muted small" style="font-size: 0.75rem;">Kemas Kini Profil &gt;</div>
                    </div>
                    <a href="profile.html" class="text-decoration-none" title="Kemas Kini Profil Anda">
                        ${avatarHTML}
                    </a>
                `;
                
            } else {
                // Jika akaun VIP Master Key (latihanhasa) masuk
                if (user && user.email === "latihanhasa@gmail.com") {
                    console.log("Master Key dikesan!");
                    hidupkanModSuperAdmin();
                    
                    const profilContainer = document.getElementById('profilStafContainer');
                    const namaPenuh = "Super Admin";
                    const hurufPertama = "S"; // Boleh tukar 'L' kalau nak ikut email Latihan
                    
                    // Lencana dan Avatar Khas Super Admin (Warna Merah)
                    const lencanaRole = `<span class="badge bg-danger px-2 py-1 ms-1 shadow-sm" style="font-size: 0.65rem; position:relative; top:-2px;"><i class="fa-solid fa-user-shield me-1"></i>ADMIN</span>`;
                    const avatarHTML = `<div class="avatar-circle text-white shadow-sm" style="background: linear-gradient(135deg, #ef4444, #991b1b);">${hurufPertama}</div>`;
                    
                    // Lukis ke dalam Navbar (Perhatikan kita tak letak link ke profile.html)
                    profilContainer.innerHTML = `
                        <div class="text-end me-2 d-none d-sm-block">
                            <div class="fw-bold text-dark lh-1" style="font-size: 0.9rem;">${namaPenuh} ${lencanaRole}</div>
                            <div class="text-danger small fw-bold" style="font-size: 0.75rem;"><i class="fa-solid fa-key me-1"></i>Akaun Master</div>
                        </div>
                        <div style="cursor: default;" title="Akaun Master Admin">
                            ${avatarHTML}
                        </div>
                    `;
                }
            }
        })
        .catch((error) => {
            console.error("Ralat menarik data:", error);
        });
}

// ==========================================
// 2.1. FUNGSI KHAS MENGAKTIFKAN PAPARAN KETUA JABATAN
// ==========================================
function hidupkanModKetuaJabatan(namaJabatanDiurus) {
    const zonKJ = document.getElementById('zonKetuaJabatan');
    if (zonKJ) {
        zonKJ.classList.remove('d-none'); // Tunjuk kotak emas
        
        // Simpan nama jabatan ke memori sementara (sessionStorage) supaya dibawa ke dashboard_kj.html
        if (namaJabatanDiurus) {
            sessionStorage.setItem('jabatanKJ', namaJabatanDiurus);
        }

        // KIRA BERAPA BORANG YANG KJ KENA SAHKAN
        if (namaJabatanDiurus) {
            db.collection('application')
              .where('status', '==', 'Menunggu Pengesahan Ketua Jabatan')
              .where('jabatan_unit', '==', namaJabatanDiurus)
              .get()
              .then(snapshot => {
                  const kiraanBadge = document.getElementById('kiraanTungguSah');
                  if (kiraanBadge) {
                      kiraanBadge.innerText = snapshot.size;
                  }
              })
              .catch(err => console.error("Ralat kira borang KJ", err));
        }
    }
}

// ==========================================
// 3. FUNGSI LOG KELUAR (LOGOUT)
// ==========================================
function logoutStaff() {
    Swal.fire({
        title: 'Log Keluar?',
        text: "Anda pasti untuk log keluar dari portal?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', 
        cancelButtonColor: '#9ca3af', 
        confirmButtonText: 'Ya, Keluar',
        cancelButtonText: 'Batal',
        reverseButtons: true 
    }).then((result) => {
        if (result.isConfirmed) {
            auth.signOut();
        }
    });
}

// ==========================================
// 4. FUNGSI BUKA BORANG ADUAN (SIMPAN DB & HANTAR EMAILJS)
// ==========================================
function bukaBorangAduan() {
    Swal.fire({
        title: 'Bantuan & Aduan',
        html: `
            <p class="text-muted small mb-3 text-center">Sila nyatakan masalah teknikal atau cadangan anda mengenai sistem ini.</p>
            <div class="bg-light p-3 rounded-3 text-start mb-3 border" style="font-size: 0.9rem;">
                <h6 class="fw-bold text-success mb-2"><i class="fa-solid fa-headset me-2"></i>Hubungi Admin (HR)</h6>
                <div class="text-dark mb-1">
                    <i class="fa-solid fa-envelope text-muted me-2"></i> 
                    <a href="mailto:latihanhasa@gmail.com" class="text-decoration-none text-dark">latihanhasa@gmail.com</a>
                </div>
                <div class="text-dark">
                    <i class="fa-solid fa-phone text-muted me-2"></i> 
                    <a href="tel:0333963356" class="text-decoration-none text-dark">03-3396 3356</a>
                </div>
            </div>
        `,
        input: 'textarea',
        inputPlaceholder: 'Taip maklum balas anda di sini...',
        inputAttributes: { 'aria-label': 'Taip maklum balas anda di sini' },
        showCancelButton: true,
        confirmButtonColor: '#0f766e',
        cancelButtonColor: '#6b7280',
        confirmButtonText: '<i class="fa-solid fa-paper-plane me-1"></i> Hantar Maklum Balas',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed && result.value.trim() !== "") {
            
            Swal.fire({ title: 'Menghantar & Menghubungi Admin...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

            const user = auth.currentUser;
            const mesejAduan = result.value;
            const emailPengirim = user ? user.email : 'TIDAK_DIKETAHUI';

            // PROSES 1: Simpan ke Firestore (Untuk rekod sistem)
            db.collection('aduan').add({
                uid: user ? user.uid : 'TIDAK_DIKETAHUI',
                email: emailPengirim,
                mesej: mesejAduan,
                tarikh: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'Baru'
            }).then(() => {
                
                // PROSES 2: BINA FORMAT E-MEL (GAYA KORPORAT) DAN HANTAR
                
                let ayatEmelAduan = `Salam Sejahtera Admin HR,\n\n`;
                ayatEmelAduan += `Sistem e-Latihan HASA telah menerima satu maklum balas / aduan baharu daripada staf. Berikut adalah butiran laporan tersebut:\n\n`;
                ayatEmelAduan += `Maklumat Pengirim:\n`;
                ayatEmelAduan += `📧 E-mel Staf: ${emailPengirim}\n\n`;
                ayatEmelAduan += `Mesej / Aduan Staf:\n`;
                ayatEmelAduan += `"${mesejAduan}"\n\n`;
                ayatEmelAduan += `Sila log masuk ke Papan Pemuka Admin e-Latihan atau balas (reply) e-mel ini untuk berhubung terus dengan staf berkenaan.\n\n`;
                ayatEmelAduan += `Terima kasih.\n`;
                ayatEmelAduan += `----------------------------------------------------\n`;
                ayatEmelAduan += `Janaan Automatik Sistem e-Latihan HASA UiTM`;

                const templateParams = {
                    to_email: "latihanhasa@gmail.com", // E-mel HR / Super Admin
                    subjek_emel: "[ADUAN BARU] Portal e-Latihan HASA UiTM",
                    kandungan_emel: ayatEmelAduan
                };

                // Susunan: (ServiceID, TemplateID, DataTemplate, PublicKey)
                return emailjs.send(
                    "service_pryuhiu", 
                    "template_h9eddz7", 
                    templateParams, 
                    "Fevnjv1nV60-D-GvC"
                );

            })
            .then(function(response) {
                console.log('SUCCESS EMAILJS!', response.status, response.text);
                Swal.fire({ 
                    icon: 'success', 
                    title: 'Terima Kasih!', 
                    text: 'Maklum balas anda telah direkodkan dan e-mel telah dihantar kepada HR.', 
                    confirmButtonColor: '#0f766e' 
                });
            })
            .catch((error) => {
                console.error("Ralat aduan/emailjs:", error);
                Swal.fire({
                    icon: 'success', 
                    title: 'Aduan Direkodkan', 
                    text: 'Aduan telah masuk ke sistem, tetapi notifikasi e-mel Admin mungkin tertangguh.', 
                    confirmButtonColor: '#0f766e' 
                });
            });
        }
    });
}

// ==========================================
// 6. FUNGSI JAM / MASA SEBENAR (REAL-TIME)
// ==========================================
function mulakanJam() {
    const clockEl = document.getElementById('realtimeClock');
    if (!clockEl) return;
    
    // Kemas kini setiap 1 saat
    setInterval(() => {
        const now = new Date();
        
        const hari = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
        const bulan = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
        
        let namaHari = hari[now.getDay()];
        let tarikh = now.getDate();
        let namaBulan = bulan[now.getMonth()];
        let tahun = now.getFullYear();
        
        let jam = now.getHours();
        let minit = now.getMinutes();
        let ampm = jam >= 12 ? 'PM' : 'AM';
        
        // Format ke 12-jam
        jam = jam % 12;
        jam = jam ? jam : 12; 
        minit = minit < 10 ? '0' + minit : minit; // Letak 0 di depan jika bawah 10
        
        clockEl.innerText = `${namaHari}, ${tarikh} ${namaBulan} ${tahun} | ${jam}:${minit} ${ampm}`;
    }, 1000);
}

// Terus hidupkan jam apabila web dibuka
mulakanJam();

// ==========================================
// 7. FUNGSI KIRA STATISTIK PERMOHONAN STAF
// ==========================================
function kiraStatistik(uid) {
    const userRef = db.doc('users/' + uid);
    
    // Cari semua borang yang dibuat oleh staf ini
    db.collection('application').where('created_by', '==', userRef).get()
        .then((snapshot) => {
            let jumlahSemua = snapshot.size; // Berapa total borang ditarik
            let jumlahLulus = 0;
            
            // Periksa satu per satu untuk kira yang diluluskan sahaja
            snapshot.forEach(doc => {
                const data = doc.data();
                const statusPermohonan = (data.status || "").toUpperCase();
                
                // Sistem mengira jika status adalah Lulus atau APPROVED
                if (statusPermohonan === "LULUS" || statusPermohonan === "APPROVED") {
                    jumlahLulus++;
                }
            });

            // Tembak nombor ke dalam HTML
            document.getElementById('statJumlah').innerText = jumlahSemua;
            document.getElementById('statLulus').innerText = jumlahLulus;
            
        }).catch(error => console.error("Ralat mengira statistik:", error));
}

// ==========================================
// 7.1. FUNGSI TRANSFORMASI UI SUPER ADMIN
// ==========================================
function hidupkanModSuperAdmin() {
    // 1. SEMBUNYIKAN SEMUA MENU STAF BIASA
    const zonStat = document.getElementById('zonStatistikStaf');
    const zonInfo = document.getElementById('zonPengumuman');
    const zonMenu = document.getElementById('zonMenuStaf');
    
    if (zonStat) zonStat.classList.add('d-none');
    if (zonInfo) zonInfo.classList.add('d-none');
    if (zonMenu) zonMenu.classList.add('d-none');

    // 2. LUKIS PAPAN PEMUKA (DASHBOARD) KHAS SUPER ADMIN
    const zonAdmin = document.getElementById('zonKetuaJabatan');
    if (zonAdmin) {
        zonAdmin.classList.remove('d-none');
        
        zonAdmin.innerHTML = `
        <div class="col-12 mb-4">
            <div class="card border-0 shadow-sm" style="background: linear-gradient(135deg, #fecaca, #f87171); border-radius: 16px;">
                <div class="card-body p-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                    <div class="d-flex align-items-center">
                        <div class="bg-white p-3 rounded-circle shadow-sm me-3 text-danger text-center d-flex align-items-center justify-content-center flex-shrink-0" style="width: 60px; height: 60px;">
                            <i class="fa-solid fa-user-shield fa-2x"></i>
                        </div>
                        <div>
                            <h5 class="fw-bold mb-1" style="color: #7f1d1d;">Sistem Pentadbiran (RBAC)</h5>
                            <p class="small mb-0" style="color: #991b1b;">Urus peranan dan lantikan Ketua Jabatan di sini.</p>
                        </div>
                    </div>
                    <a href="superadmin.html" class="btn btn-dark fw-bold px-4 py-2 shadow-sm" style="border-radius: 12px; white-space: nowrap;">
                        Buka Pusat Kawalan <i class="fa-solid fa-gears ms-2"></i>
                    </a>
                </div>
            </div>
        </div>

        <div class="col-12 mt-2">
            <h5 class="fw-bold text-dark mb-3"><i class="fa-solid fa-chart-pie text-primary me-2"></i>Statistik Keseluruhan e-Latihan</h5>
            <div class="row g-3">
                <div class="col-6 col-md-3">
                    <div class="stat-card shadow-sm text-center p-3 h-100 border-top border-primary border-4" style="border-radius: 16px;">
                        <h3 class="fw-bold text-dark mb-0" id="globalTotalUsers"><i class="fa-solid fa-spinner fa-spin fa-xs text-muted"></i></h3>
                        <p class="text-muted small mb-0 mt-1">Jumlah Pengguna</p>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="stat-card shadow-sm text-center p-3 h-100 border-top border-info border-4" style="border-radius: 16px;">
                        <h3 class="fw-bold text-dark mb-0" id="globalTotalApps"><i class="fa-solid fa-spinner fa-spin fa-xs text-muted"></i></h3>
                        <p class="text-muted small mb-0 mt-1">Total Permohonan</p>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="stat-card shadow-sm text-center p-3 h-100 border-top border-warning border-4" style="border-radius: 16px;">
                        <h3 class="fw-bold text-dark mb-0" id="globalPendingApps"><i class="fa-solid fa-spinner fa-spin fa-xs text-muted"></i></h3>
                        <p class="text-muted small mb-0 mt-1">Menunggu Kelulusan</p>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="stat-card shadow-sm text-center p-3 h-100 border-top border-success border-4" style="border-radius: 16px;">
                        <h3 class="fw-bold text-dark mb-0" id="globalApprovedApps"><i class="fa-solid fa-spinner fa-spin fa-xs text-muted"></i></h3>
                        <p class="text-muted small mb-0 mt-1">Selesai Diluluskan</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-12 mt-5">
            <h5 class="fw-bold text-dark mb-3"><i class="fa-solid fa-star text-warning me-2"></i>Maklum Balas Pengalaman Pengguna (UX)</h5>
            <div id="senaraiFeedbackContainer" class="d-flex overflow-auto gap-3 pb-3 px-1" style="scroll-snap-type: x mandatory; scroll-behavior: smooth;">
                <div class="text-center w-100 text-muted small p-4 bg-white rounded-4 shadow-sm border">
                    <div class="custom-spinner mb-2 mx-auto" style="border-top-color: #f59e0b; width:30px; height:30px;"></div>
                    Menarik data maklum balas...
                </div>
            </div>
        </div>

        <div class="col-12 mt-4 mb-4">
            <div class="card border-0 shadow-sm" style="border-radius: 16px; overflow: hidden;">
                <div class="card-header p-4 border-bottom d-flex justify-content-between align-items-center bg-white user-select-none" 
                     data-bs-toggle="collapse" data-bs-target="#collapseAduan" aria-expanded="false" style="cursor: pointer;">
                    <div>
                        <h5 class="fw-bold text-dark mb-0"><i class="fa-solid fa-comments text-danger me-2"></i>Peti Maklum Balas & Aduan Staf</h5>
                        <p class="small text-muted mb-0 mt-1">Tekan di sini untuk melihat masalah teknikal daripada staf.</p>
                    </div>
                    <div class="bg-light p-2 rounded-circle">
                        <i class="fa-solid fa-chevron-down text-dark"></i>
                    </div>
                </div>
                <div id="collapseAduan" class="collapse">
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover align-middle mb-0" id="jadualAduan">
                                <thead class="table-light text-muted small">
                                    <tr>
                                        <th class="ps-4">TARIKH & MASA</th>
                                        <th>MAKLUMAT PENGIRIM</th>
                                        <th style="width: 35%;">MESEJ / ADUAN</th>
                                        <th>STATUS</th>
                                        <th class="text-center pe-4">TINDAKAN</th>
                                    </tr>
                                </thead>
                                <tbody id="senaraiAduanContainer">
                                    <tr><td colspan="5" class="text-center p-5 text-muted">Memuatkan...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;

        // PANGGIL SEMUA FUNGSI DATA
        tarikDataStatistikGlobal();
        tarikFeedbackAdmin(); 
        tarikAduanAdmin(); // <--- Panggil fungsi aduan!
    }
}

// Fungsi menarik rekod penuh dari Firestore untuk Admin
function tarikDataStatistikGlobal() {
    // Kira Jumlah Pengguna (Staf)
    db.collection('users').get().then(snap => {
        const el = document.getElementById('globalTotalUsers');
        if(el) el.innerText = snap.size;
    }).catch(() => document.getElementById('globalTotalUsers').innerText = "Ralat");

    // Kira Statistik Permohonan Keseluruhan
    db.collection('application').get().then(snap => {
        let total = snap.size;
        let pending = 0;
        let approved = 0;

        snap.forEach(doc => {
            const status = doc.data().status || "";
            if (status.includes("Menunggu")) pending++;
            if (status === "APPROVED" || status.toUpperCase() === "LULUS") approved++;
        });

        const elTotal = document.getElementById('globalTotalApps');
        const elPending = document.getElementById('globalPendingApps');
        const elApprove = document.getElementById('globalApprovedApps');
        
        if(elTotal) elTotal.innerText = total;
        if(elPending) elPending.innerText = pending;
        if(elApprove) elApprove.innerText = approved;

    }).catch(err => {
        console.error("Ralat baca stat:", err);
    });
}

// ==========================================
// 8. FUNGSI TARIK MAKLUM BALAS PENGGUNA (KHAS ADMIN)
// ==========================================
function tarikFeedbackAdmin() {
    const container = document.getElementById('senaraiFeedbackContainer');
    if (!container) return;
    
    db.collection('feedback').orderBy('tarikh', 'desc').limit(15).get().then((snapshot) => {
        if (snapshot.empty) {
            container.innerHTML = `<div class="text-center w-100 text-muted p-4 bg-white rounded-4 shadow-sm border">Tiada maklum balas direkodkan lagi.</div>`;
            return;
        }
        
        container.innerHTML = '';
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const rating = data.rating || 0;
            
            // PERUBAHAN PENTING 1: Padankan dengan nama asal dalam 'permohonan.js' iaitu 'komen'
            const ulasan = data.komen || "Tiada ulasan bertulis.";
            
            const uid = data.uid;
            const docId = doc.id; 
            
            // PERUBAHAN PENTING 2: Susun emoji yang TEPAT MENCERMINKAN 'permohonan.js' Tuan
            // Tuan guna array ini dalam permohonan.js: ["😩", "😟", "😐", "🙂", "🤩"]
            let emoji = "😐"; 
            if (rating === 5) emoji = "🤩";
            else if (rating === 4) emoji = "🙂"; // Diubah kepada "🙂" untuk padan permohonan.js
            else if (rating === 3) emoji = "😐";
            else if (rating === 2) emoji = "😟"; // Diubah kepada "😟"
            else if (rating === 1) emoji = "😩"; // Diubah kepada "😩"
            
            let tarikhTeks = "-";
            if (data.tarikh) tarikhTeks = data.tarikh.toDate().toLocaleDateString('ms-MY');

            let bintangHTML = '';
            for(let i=1; i<=5; i++) {
                if(i <= rating) bintangHTML += `<i class="fa-solid fa-star text-warning"></i>`;
                else bintangHTML += `<i class="fa-regular fa-star text-warning opacity-25"></i>`;
            }

            container.innerHTML += `
            <div class="card border border-secondary border-opacity-10 shadow-sm flex-shrink-0 bg-white" style="width: 280px; border-radius: 16px; scroll-snap-align: start;">
                <div class="card-body p-4 text-center d-flex flex-column">
                    <div class="display-3 mb-1">${emoji}</div>
                    <div class="mb-3 fs-5">${bintangHTML}</div>
                    <p class="small text-dark fst-italic mb-3 flex-grow-1" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">"${ulasan}"</p>
                    <hr class="opacity-10 my-2 w-75 mx-auto">
                    <div class="fw-bold text-primary text-truncate" style="font-size: 0.85rem;" id="namaPemberiFeedback_${docId}">Memuatkan Nama...</div>
                    <div class="small text-muted" style="font-size: 0.7rem;"><i class="fa-regular fa-calendar me-1"></i>${tarikhTeks}</div>
                </div>
            </div>
            `;

            if(uid && uid !== "TIDAK_DIKETAHUI") {
                db.collection('users').doc(uid).get().then(userDoc => {
                    let namaPengirim = "Staf Tidak Diketahui";
                    if(userDoc.exists) namaPengirim = userDoc.data().namaPenuh || "Staf";
                    document.getElementById(`namaPemberiFeedback_${docId}`).innerText = namaPengirim;
                }).catch(() => {
                    document.getElementById(`namaPemberiFeedback_${docId}`).innerText = "Staf";
                });
            } else {
                document.getElementById(`namaPemberiFeedback_${docId}`).innerText = "Sistem Staf";
            }
        });
    }).catch(err => {
        console.error("Ralat tarik feedback:", err);
        container.innerHTML = `<div class="text-center w-100 text-danger p-4 bg-white rounded-4 shadow-sm border"><i class="fa-solid fa-triangle-exclamation me-2"></i>Gagal menarik data maklum balas.</div>`;
    });
}

// ==========================================
// 9. LOGIK PETI MAKLUM BALAS & ADUAN (KHAS ADMIN)
// ==========================================
function tarikAduanAdmin() {
    const container = document.getElementById('senaraiAduanContainer');
    if (!container) return;
    
    db.collection('aduan').orderBy('tarikh', 'desc').get().then((snapshot) => {
        if (snapshot.empty) {
            container.innerHTML = `<tr><td colspan="5" class="text-center text-muted p-4">Tiada maklum balas atau aduan direkodkan.</td></tr>`;
            return;
        }
        
        container.innerHTML = '';
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const aduanId = doc.id;
            const uid = data.uid;
            const emel = data.email || "Tiada E-mel";
            const mesej = data.mesej || "";
            const status = data.status || "Baru";
            
            let tarikhTeks = "-";
            if (data.tarikh) {
                const dateObj = data.tarikh.toDate();
                tarikhTeks = dateObj.toLocaleDateString('ms-MY') + '<br><small class="text-muted">' + dateObj.toLocaleTimeString('ms-MY', {hour: '2-digit', minute:'2-digit'}) + '</small>';
            }

            let badgeStatus = status === "Selesai" 
                ? `<span class="badge bg-success rounded-pill px-3 py-2"><i class="fa-solid fa-check-double me-1"></i>Selesai</span>` 
                : `<span class="badge bg-danger rounded-pill px-3 py-2"><i class="fa-solid fa-circle-exclamation me-1"></i>Baru</span>`;

            let actionBtn = status === "Selesai" 
                ? `<button class="btn btn-sm btn-outline-secondary rounded-pill px-3 shadow-sm" disabled><i class="fa-solid fa-lock me-1"></i>Tutup</button>` 
                : `<button class="btn btn-sm btn-success rounded-pill px-3 shadow-sm fw-bold" onclick="selesaikanAduanAdmin('${aduanId}')"><i class="fa-solid fa-check me-1"></i>Selesai</button>`;

            container.innerHTML += `
            <tr>
                <td class="ps-4 py-3 align-middle">${tarikhTeks}</td>
                <td class="align-middle">
                    <div class="fw-bold text-dark" style="font-size: 0.9rem;" id="namaPengirimAduan_${aduanId}">Memuatkan Nama...</div>
                    <div class="small text-primary"><i class="fa-regular fa-envelope me-1"></i>${emel}</div>
                </td>
                <td class="align-middle">
                    <div class="bg-light p-2 rounded-3 small text-dark fst-italic border border-secondary border-opacity-25" style="line-height: 1.4;">
                        "${mesej}"
                    </div>
                </td>
                <td class="align-middle">${badgeStatus}</td>
                <td class="text-center pe-4 align-middle">${actionBtn}</td>
            </tr>
            `;

            // Cari nama sebenar pengirim secara Async
            if(uid && uid !== 'TIDAK_DIKETAHUI') {
                db.collection('users').doc(uid).get().then(userDoc => {
                    let namaPengirim = "Staf Tidak Diketahui";
                    if(userDoc.exists) namaPengirim = userDoc.data().namaPenuh || "Staf";
                    document.getElementById(`namaPengirimAduan_${aduanId}`).innerText = namaPengirim;
                }).catch(() => {
                    document.getElementById(`namaPengirimAduan_${aduanId}`).innerText = "Staf";
                });
            } else {
                document.getElementById(`namaPengirimAduan_${aduanId}`).innerText = "Sistem Staf";
            }
        });
    }).catch(err => {
        console.error("Ralat tarik aduan:", err);
        container.innerHTML = `<tr><td colspan="5" class="text-center text-danger p-4"><i class="fa-solid fa-triangle-exclamation me-2"></i>Gagal menarik data maklum balas.</td></tr>`;
    });
}

function selesaikanAduanAdmin(aduanId) {
    Swal.fire({
        title: 'Sahkan Tindakan?',
        text: "Adakah aduan ini telah disemak dan diselesaikan? Status akan ditukar kepada 'Selesai'.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981', 
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Selesai',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if(result.isConfirmed) {
            showCustomLoader("Mengemaskini Status Aduan...");
            db.collection('aduan').doc(aduanId).update({
                status: "Selesai",
                tarikh_selesai: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                hideCustomLoader();
                showCustomToast('success', 'Aduan Selesai', 'Status aduan telah berjaya dikemas kini.');
                tarikAduanAdmin(); // Refresh jadual
            }).catch(error => {
                hideCustomLoader();
                console.error(error);
                showCustomToast('error', 'Gagal', 'Ralat mengemas kini data pangkalan data.');
            });
        }
    });
}