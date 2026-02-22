// ==========================================
// 1. SEMAK STATUS LOG MASUK & TARIK DATA
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection('users').doc(user.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    const dataStaf = doc.data();
                    
                    // Isi borang dengan data semasa
                    document.getElementById('editNama').value = dataStaf.namaPenuh || "";
                    document.getElementById('editStaffId').value = dataStaf.noPekerja || "";
                    document.getElementById('editEmail').value = dataStaf.email || user.email;
                    
                    // Update Title
                    document.getElementById('profileNameTitle').innerText = dataStaf.namaPenuh || "Staf HASA";
                    
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
// 2. FUNGSI MATA & TRIGGER KAMERA
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

// ==========================================
// 3. FUNGSI TUKAR GAMBAR KE TEKS (BASE64)
// ==========================================
let fileBase64String = null; // Simpan teks gambar di sini

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
        reader.readAsDataURL(file); // Mula proses baca fail
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

    const newNama = document.getElementById('editNama').value;
    const newStaffId = document.getElementById('editStaffId').value;
    const newPassword = document.getElementById('editPassword').value;

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