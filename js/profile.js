// ==========================================
// 0. FUNGSI PENAPIS E-MEL (DENGAN PAS VIP ADMIN)
// ==========================================
function isUiTMEmail(email) {
    if (!email) return false;
    const emelKecil = email.trim().toLowerCase();
    
    // Benarkan e-mel UiTM ATAU e-mel rasmi Admin (VIP Bypass)
    if (emelKecil === "hrd@uitm.edu.my") {
        return true; 
    }
    
    return emelKecil.endsWith("uitm.edu.my");
}

// ==========================================
// 1. SEMAK STATUS LOG MASUK & TARIK DATA
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        // PERLINDUNGAN BERGANDA
        if (!isUiTMEmail(user.email)) {
            auth.signOut().then(() => {
                window.location.replace("index.html");
            });
            return;
        }

        db.collection('users').doc(user.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    const dataStaf = doc.data();
                    
                    // Isi borang dengan data semasa
                    let namaSemasa = dataStaf.namaPenuh || "";
                    if (namaSemasa === "Staf") namaSemasa = "";

                    document.getElementById('editNama').value = namaSemasa;
                    document.getElementById('editStaffId').value = dataStaf.noPekerja || "";
                    document.getElementById('editEmail').value = dataStaf.email || user.email;
                    
                    // Update Title Nama Penuh
                    document.getElementById('profileNameTitle').innerText = dataStaf.namaPenuh || "Sila Kemas Kini Nama";
                    
                    // ===============================================
                    // [BARU] SEMAK & PAPAR LENCANA PERANAN / PANGKAT
                    // ===============================================
                    const peranan = dataStaf.role || "staf";
                    const jabatanDiurus = dataStaf.jabatan_diurus || "Tiada Maklumat Jabatan";
                    const badgeContainer = document.getElementById('badgePerananProfil');
                    
                    if (peranan === "ketua_jabatan") {
                        // Papar Lencana Emas & Biru untuk KJ
                        badgeContainer.innerHTML = `
                            <span class="badge shadow-sm px-3 py-2 text-dark" style="background-color: #fde68a; border: 1px solid #f59e0b;">
                                <i class="fa-solid fa-crown text-warning text-darken me-1"></i> Ketua Jabatan
                            </span>
                            <div class="small text-muted fw-bold mt-1"><i class="fa-solid fa-building text-success me-1"></i> ${jabatanDiurus}</div>
                        `;
                    } else {
                        // Papar Lencana Hijau untuk Staf Biasa
                        badgeContainer.innerHTML = `
                            <span class="badge bg-success bg-opacity-10 text-success border border-success px-3 py-2 rounded-pill shadow-sm">
                                <i class="fa-solid fa-user-tie me-1"></i> Staf Biasa
                            </span>
                        `;
                    }
                    
                    // --- CEK: ADA GAMBAR BASE64 TAK? ---
                    if (dataStaf.photoBase64) {
                        document.getElementById('bigAvatarLetter').classList.add('d-none');
                        const imgElement = document.getElementById('bigAvatarImage');
                        imgElement.src = dataStaf.photoBase64;
                        imgElement.classList.remove('d-none');
                    } else {
                        const hurufPertama = (dataStaf.namaPenuh || "S").charAt(0).toUpperCase();
                        document.getElementById('bigAvatarLetter').innerText = hurufPertama;
                    }
                }
            })
            .catch((error) => console.error("Ralat memuatkan profil:", error));
    } else {
        window.location.replace("index.html");
    }
});

// ==========================================
// 2. FUNGSI MATA, TRIGGER KAMERA & BERSIHKAN NAMA
// ==========================================
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
    }
}

function triggerFileInput() {
    document.getElementById('fileInputPFP').click();
}

// FUNGSI AUTO-FORMAT: Buang Bin/Binti bila menaip
document.getElementById('editNama').addEventListener('input', function(e) {
    let teksSemasa = e.target.value.toUpperCase();
    teksSemasa = teksSemasa.replace(/\b(BIN|BINTI|A\/L|A\/P|B\.|BT\.)(\s|$)/g, ' ')
                           .replace(/\s+/g, ' ').trimStart();
    e.target.value = teksSemasa;
});

// ==========================================
// 3. FUNGSI TUKAR GAMBAR KE TEKS (BASE64)
// ==========================================
let fileBase64String = null; 

function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Gunakan Canvas untuk kecilkan saiz gambar sebelum simpan
            const img = new Image();
            img.src = e.target.result;
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 400; // Maksimum 400px cukup untuk profile
                let width = img.width;
                let height = img.height;

                if (width > height && width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                } else if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Tukar gambar jadi format teks (kualiti 70% supaya ringan)
                fileBase64String = canvas.toDataURL('image/jpeg', 0.7);

                // Paparkan di UI (Preview)
                document.getElementById('bigAvatarLetter').classList.add('d-none');
                const imgElement = document.getElementById('bigAvatarImage');
                imgElement.src = fileBase64String;
                imgElement.classList.remove('d-none');
            }
        }
        reader.readAsDataURL(file); 
    }
}

// ==========================================
// 4. FUNGSI SIMPAN PERUBAHAN
// ==========================================
document.getElementById('profileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    Swal.fire({
        title: 'Menyimpan Maklumat...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    let newNama = document.getElementById('editNama').value;
    const newStaffId = document.getElementById('editStaffId').value;
    const newPassword = document.getElementById('editPassword').value;

    // Bersihkan nama sekali lagi sebelum hantar
    newNama = newNama.replace(/\b(BIN|BINTI|A\/L|A\/P|B\.|BT\.)(\s|$)/g, ' ').replace(/\s+/g, ' ').trim();

    let updateData = {
        namaPenuh: newNama,
        noPekerja: newStaffId
    };

    // Jika ada gambar baru dipilih, masukkan teks gambar ke dalam database
    if (fileBase64String) {
        updateData.photoBase64 = fileBase64String;
    }

    let updatePromises = [];
    updatePromises.push(db.collection('users').doc(user.uid).update(updateData));

    if (newPassword.trim() !== "") {
        updatePromises.push(user.updatePassword(newPassword));
    }

    Promise.all(updatePromises)
        .then(() => {
            Swal.fire({
                icon: 'success', title: 'Berjaya!',
                text: 'Profil anda telah dikemas kini.',
                confirmButtonColor: '#0f766e'
            }).then(() => {
                fileBase64String = null;
                window.location.reload(); 
            });
        })
        .catch((error) => {
            console.error("Ralat kemas kini:", error);
            Swal.fire('Ralat', 'Gagal menyimpan maklumat. Sila cuba lagi.', 'error');
        });
});