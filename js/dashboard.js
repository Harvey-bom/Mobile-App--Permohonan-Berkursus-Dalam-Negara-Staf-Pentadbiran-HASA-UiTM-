// ==========================================
// 1. SEMAK STATUS LOG MASUK
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        dapatkanMaklumatStaf(user.uid);
        semakNotifikasiTuntutan(user.uid); // Panggil fungsi semak notifikasi dengan UID pengguna
    } else {
        window.location.replace("index.html");
    }
});

// ==========================================
// 2. FUNGSI TARIK DATA & BINA AVATAR GOOGLE
// ==========================================
function dapatkanMaklumatStaf(uid) {
    db.collection('users').doc(uid).get()
        .then((doc) => {
            if (doc.exists) {
                const dataStaf = doc.data();
                const namaPenuh = dataStaf.namaPenuh || "Staf HASA";
                document.getElementById('displayNamaStaf').innerText = namaPenuh;
                
                const profilContainer = document.getElementById('profilStafContainer');
                let avatarHTML = '';

                // --- CEK: USER ADA GAMBAR (photoBase64) KE TAK? ---
                if (dataStaf.photoBase64) {
                    // ADA GAMBAR: Guna tag <img>
                    avatarHTML = `
                        <img src="${dataStaf.photoBase64}" alt="Profile" class="avatar-circle clickable-avatar shadow-sm" style="object-fit: cover;">
                    `;
                } else {
                    // TIADA GAMBAR: Guna huruf (Google Style)
                    const hurufPertama = namaPenuh.charAt(0).toUpperCase();
                    avatarHTML = `
                        <div class="avatar-circle clickable-avatar text-white shadow-sm">
                            ${hurufPertama}
                        </div>
                    `;
                }

                // Masukkan ke dalam HTML navbar
                profilContainer.innerHTML = `
                    <div class="text-end me-2 d-none d-sm-block">
                        <div class="fw-bold text-dark lh-1" style="font-size: 0.9rem;">${namaPenuh}</div>
                        <div class="text-muted small" style="font-size: 0.75rem;">Kemas Kini Profil &gt;</div>
                    </div>
                    <a href="profile.html" class="text-decoration-none" title="Kemas Kini Profil Anda">
                        ${avatarHTML}
                    </a>
                `;
                
            } else {
                console.log("Dokumen profil tidak dijumpai!");
            }
        })
        .catch((error) => {
            console.error("Ralat menarik data:", error);
        });
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
        reverseButtons: true // Susun butang Batal di kiri, Ya di kanan (Gaya Mobile App)
    }).then((result) => {
        if (result.isConfirmed) {
            auth.signOut();
        }
    });
}

// ==========================================
// 4. FUNGSI BUKA BORANG ADUAN / MAKLUM BALAS
// ==========================================
function bukaBorangAduan() {
    Swal.fire({
        title: 'Bantuan & Aduan',
        // Kita gunakan 'html' untuk buat kotak info Admin yang cantik
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
        inputAttributes: {
            'aria-label': 'Taip maklum balas anda di sini'
        },
        showCancelButton: true,
        confirmButtonColor: '#0f766e',
        cancelButtonColor: '#6b7280',
        confirmButtonText: '<i class="fa-solid fa-paper-plane me-1"></i> Hantar Maklum Balas',
        cancelButtonText: 'Batal'
    }).then((result) => {
        // Jika user taip sesuatu dan tekan Hantar
        if (result.isConfirmed && result.value.trim() !== "") {
            
            Swal.fire({ title: 'Menghantar...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

            const user = auth.currentUser;
            
            // Simpan ke collection 'aduan' di Firestore
            db.collection('aduan').add({
                uid: user ? user.uid : 'TIDAK_DIKETAHUI',
                mesej: result.value,
                tarikh: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'Baru'
            }).then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Terima Kasih!',
                    text: 'Maklum balas anda telah dihantar kepada pihak Admin.',
                    confirmButtonColor: '#0f766e'
                });
            }).catch((error) => {
                console.error("Ralat aduan:", error);
                Swal.fire('Ralat', 'Gagal menghantar aduan. Sila semak capaian internet anda.', 'error');
            });
        }
    });
}

// ==========================================
// 5. FUNGSI KIRA NOTIFIKASI (BORANG A1/SIJIL)
// ==========================================
function semakNotifikasiTuntutan(uid) {
    const userRef = db.doc('users/' + uid);
    
    db.collection('application').where('created_by', '==', userRef).get()
        .then((snapshot) => {
            let jumlahPerluTindakan = 0;
            
            // Semak setiap borang, kalau Lulus TAPI belum hantar A1
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.status === "Lulus" && data.status_tuntutan === "Belum Selesai") {
                    jumlahPerluTindakan++;
                }
            });

            const badge = document.getElementById('badgeNotifSemakStatus');
            if (jumlahPerluTindakan > 0) {
                badge.innerText = jumlahPerluTindakan;
                badge.classList.remove('d-none'); // Munculkan badge merah
            } else {
                badge.classList.add('d-none'); // Sorokkan kalau 0
            }
        }).catch(error => console.error("Ralat notifikasi:", error));
}