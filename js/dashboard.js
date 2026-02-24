// ==========================================
// 1. SEMAK STATUS LOG MASUK
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        dapatkanMaklumatStaf(user.uid);
        semakNotifikasiTuntutan(user.uid); 
    } else {
        window.location.replace("index.html");
    }
});

// ==========================================
// 2. FUNGSI TARIK DATA & BINA AVATAR
// ==========================================
function dapatkanMaklumatStaf(uid) {
    db.collection('users').doc(uid).get()
        .then((doc) => {
            if (doc.exists) {
                const dataStaf = doc.data();
                
                let namaPenuh = dataStaf.namaPenuh || "";
                const noPekerja = dataStaf.noPekerja || "";
                const profilContainer = document.getElementById('profilStafContainer');

                // --- SEMAKAN: ADAKAH PROFIL MEREKA KOSONG? ---
                if (noPekerja.trim() === "" || namaPenuh.trim() === "" || namaPenuh === "Staf") {
                    
                    // UI Sementara: Tunjuk amaran supaya mereka tahu kena isi profil
                    profilContainer.innerHTML = `
                        <div class="text-end me-2 d-none d-sm-block">
                            <div class="fw-bold text-dark lh-1" style="font-size: 0.9rem;">Tindakan Diperlukan</div>
                            <div class="text-danger small fw-bold" style="font-size: 0.75rem;">Sila Lengkapkan Profil</div>
                        </div>
                        <div class="avatar-circle bg-warning text-dark shadow-sm fw-bold">
                            <i class="fa-solid fa-exclamation"></i>
                        </div>
                    `;
                    
                    // Panggil Pop-up paksa isi profil
                    mintaLengkapkanProfil(uid, dataStaf.email, namaPenuh);
                    return; // Hentikan fungsi di sini sehingga mereka siap isi
                }

                // --- JIKA PROFIL LENGKAP: BINA AVATAR BERFUNGSI ---
                let avatarHTML = '';

                // Semak kalau ada gambar muka (base64)
                if (dataStaf.photoBase64 && dataStaf.photoBase64.length > 50) {
                    avatarHTML = `<img src="${dataStaf.photoBase64}" alt="Profil" class="avatar-circle clickable-avatar shadow-sm" style="object-fit: cover;">`;
                } else {
                    // Kalau takda gambar, guna huruf pertama
                    const hurufPertama = namaPenuh.charAt(0).toUpperCase();
                    avatarHTML = `<div class="avatar-circle clickable-avatar text-white shadow-sm">${hurufPertama}</div>`;
                }

                // Gantikan ke dalam Navbar (dengan fungsi klik ke profile.html)
                profilContainer.innerHTML = `
                    <div class="text-end me-3 d-none d-sm-block">
                        <div class="fw-bold text-dark lh-1 mb-1" style="font-size: 0.95rem;">${namaPenuh}</div>
                        <a href="profile.html" class="text-success small text-decoration-none fw-semibold" style="font-size: 0.75rem;">
                            Kemas Kini Profil <i class="fa-solid fa-pen-to-square ms-1"></i>
                        </a>
                    </div>
                    <a href="profile.html" title="Pergi ke Tetapan Profil" class="text-decoration-none">
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
// FUNGSI BANTUAN: PAKSA ISI PROFIL (SWEETALERT)
// ==========================================
function mintaLengkapkanProfil(uid, email, cadanganNama) {
    let namaLalai = cadanganNama !== "Staf" ? cadanganNama : "";

    Swal.fire({
        title: 'Lengkapkan Profil Anda',
        html: `
            <p class="text-muted small mb-3">Sila lengkapkan maklumat rasmi anda di bawah untuk mula menggunakan sistem.</p>
            <div class="text-start mb-3">
                <label class="form-label small fw-bold text-dark mb-1">Nama Penuh (Seperti dalam K/P)</label>
                <input id="swalNama" class="form-control" placeholder="Cth: Ali Bin Abu" value="${namaLalai}">
            </div>
            <div class="text-start">
                <label class="form-label small fw-bold text-dark mb-1">No. Pekerja (Staf ID)</label>
                <input id="swalNoPekerja" class="form-control" placeholder="Cth: 123456">
            </div>
        `,
        icon: 'info',
        allowOutsideClick: false, // Wajib isi, tak boleh klik luar
        allowEscapeKey: false,    // Wajib isi, tak boleh tekan ESC
        confirmButtonColor: '#0f766e',
        confirmButtonText: 'Simpan Maklumat',
        preConfirm: () => {
            let nama = document.getElementById('swalNama').value.toUpperCase();
            const noPkj = document.getElementById('swalNoPekerja').value.trim();
            
            if (!nama || !noPkj) {
                Swal.showValidationMessage('Sila isikan kedua-dua ruangan nama dan no. pekerja.');
                return false;
            }

            // Bersihkan nama (Buang Bin/Binti automatik)
            nama = nama.replace(/\b(BIN|BINTI|A\/L|A\/P|B\.|BT\.)(\s|$)/g, ' ').replace(/\s+/g, ' ').trim();
            
            return { nama: nama, noPekerja: noPkj };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
            
            db.collection('users').doc(uid).set({
                namaPenuh: result.value.nama,
                noPekerja: result.value.noPekerja
            }, { merge: true }).then(() => {
                Swal.fire({
                    icon: 'success', title: 'Profil Disimpan!', text: 'Anda kini boleh memohon latihan.', confirmButtonColor: '#0f766e'
                }).then(() => {
                    // Refresh data paparan
                    dapatkanMaklumatStaf(uid);
                });
            });
        }
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
        reverseButtons: true
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
            Swal.fire({ title: 'Menghantar...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

            const user = auth.currentUser;
            db.collection('aduan').add({
                uid: user ? user.uid : 'TIDAK_DIKETAHUI',
                mesej: result.value,
                tarikh: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'Baru'
            }).then(() => {
                Swal.fire({ icon: 'success', title: 'Terima Kasih!', text: 'Maklum balas anda telah dihantar.', confirmButtonColor: '#0f766e' });
            }).catch((error) => {
                console.error("Ralat aduan:", error);
                Swal.fire('Ralat', 'Gagal menghantar aduan.', 'error');
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
            
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.status === "Lulus" && data.status_tuntutan === "Belum Selesai") {
                    jumlahPerluTindakan++;
                }
            });

            const badge = document.getElementById('badgeNotifSemakStatus');
            if (jumlahPerluTindakan > 0) {
                badge.innerText = jumlahPerluTindakan;
                badge.classList.remove('d-none');
            } else {
                badge.classList.add('d-none'); 
            }
        }).catch(error => console.error("Ralat notifikasi:", error));
}