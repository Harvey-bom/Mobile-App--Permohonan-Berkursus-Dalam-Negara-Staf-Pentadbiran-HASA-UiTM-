// ==========================================
// 0. FUNGSI UI KHAS (PENGGANTI SWEETALERT)
// ==========================================
function showCustomLoader(textMsg = "Menyimpan...") {
    document.getElementById('loaderText').innerText = textMsg;
    const loader = document.getElementById('customLoader');
    loader.classList.remove('d-none');
    setTimeout(() => loader.classList.add('show'), 10);
}

function hideCustomLoader() {
    const loader = document.getElementById('customLoader');
    loader.classList.remove('show');
    setTimeout(() => loader.classList.add('d-none'), 300);
}

function showCustomToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    let iconClass = type === 'success' ? "fa-solid fa-circle-check" : "fa-solid fa-circle-exclamation";

    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="${iconClass}"></i></div>
        <div class="toast-content">
            <h6>${title}</h6>
            <p>${message}</p>
        </div>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ==========================================
// 1. SEMAK STATUS LOG MASUK & TARIK DATA
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection('users').doc(user.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    const dataStaf = doc.data();
                    
                    // Kemaskan nama jika dari Google
                    let rawNama = dataStaf.namaPenuh || "";
                    if (rawNama === "Staf") rawNama = ""; // Kosongkan kalau masih default
                    
                    document.getElementById('editNama').value = rawNama;
                    document.getElementById('editStaffId').value = dataStaf.noPekerja || "";
                    document.getElementById('editEmail').value = dataStaf.email || user.email;
                    
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
// 2. FUNGSI MATA, KAMERA & AUTO-FORMAT NAMA
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

// FORMAT NAMA: Buang Bin/Binti dan paksa Huruf Besar
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
            const img = new Image();
            img.src = e.target.result;
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 400; 
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

                fileBase64String = canvas.toDataURL('image/jpeg', 0.7);

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

    showCustomLoader("Menyimpan Profil...");

    const newNama = document.getElementById('editNama').value;
    const newStaffId = document.getElementById('editStaffId').value;
    const newPassword = document.getElementById('editPassword').value;

    let updateData = {
        namaPenuh: newNama,
        noPekerja: newStaffId
    };

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
            hideCustomLoader();
            showCustomToast('success', 'Berjaya!', 'Profil anda telah dikemas kini.');
            
            // Re-render Title & Avatar
            document.getElementById('profileNameTitle').innerText = newNama;
            document.getElementById('editPassword').value = ""; // Kosongkan lepas save
            fileBase64String = null;
        })
        .catch((error) => {
            hideCustomLoader();
            console.error("Ralat kemas kini:", error);
            showCustomToast('error', 'Ralat', 'Gagal menyimpan maklumat. Sila cuba lagi.');
        });
});