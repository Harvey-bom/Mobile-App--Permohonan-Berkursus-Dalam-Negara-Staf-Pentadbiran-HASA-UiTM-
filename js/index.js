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

function showCustomLoader(textMsg = "Memproses...") {
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
    
    // Tentukan Ikon berdasarkan jenis
    let iconClass = "fa-solid fa-circle-info";
    if (type === 'success') iconClass = "fa-solid fa-circle-check";
    if (type === 'error') iconClass = "fa-solid fa-circle-exclamation";

    // Cipta elemen HTML
    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="${iconClass}"></i></div>
        <div class="toast-content">
            <h6>${title}</h6>
            <p>${message}</p>
        </div>
    `;

    // Masukkan ke dalam skrin dan mulakan animasi
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    // Hilangkan secara automatik selepas 4 saat
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// ==========================================
// 1. FUNGSI UI (Tukar Tab)
// ==========================================
function showLogin() {
    document.getElementById('loginForm').classList.remove('d-none');
    document.getElementById('signupForm').classList.add('d-none');
    document.getElementById('btnLoginToggle').classList.add('active');
    document.getElementById('btnSignupToggle').classList.remove('active');
}

function showSignup() {
    document.getElementById('signupForm').classList.remove('d-none');
    document.getElementById('loginForm').classList.add('d-none');
    document.getElementById('btnSignupToggle').classList.add('active');
    document.getElementById('btnLoginToggle').classList.remove('active');
}

// ==========================================
// 2. FUNGSI PENDAFTARAN (SIGN UP)
// ==========================================
document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault(); 

    const form = e.target;
    const fullName = form.querySelectorAll('input')[0].value;
    const email = form.querySelectorAll('input')[1].value;
    const staffId = form.querySelectorAll('input')[2].value;
    const password = form.querySelectorAll('input')[3].value;

    if (!isUiTMEmail(email)) {
        showCustomToast('error', 'E-mel Tidak Sah', 'Hanya e-mel rasmi UiTM dibenarkan untuk pendaftaran.');
        return; 
    }

    showCustomLoader("Mendaftar Akaun...");

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            return db.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: email,
                namaPenuh: fullName,
                noPekerja: staffId,
                role: 'staf', 
                created_time: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }); 
        })
        .then(() => {
            hideCustomLoader();
            showCustomToast('success', 'Pendaftaran Berjaya!', 'Sila log masuk menggunakan akaun anda.');
            form.reset();
            showLogin();
        })
        .catch((error) => {
            hideCustomLoader();
            let errorMessage = "Sila cuba lagi.";
            if (error.code === 'auth/email-already-in-use') errorMessage = "E-mel ini telah didaftarkan dalam sistem.";
            else if (error.code === 'auth/weak-password') errorMessage = "Kata laluan mestilah sekurang-kurangnya 6 aksara.";
            
            showCustomToast('error', 'Pendaftaran Gagal', errorMessage);
        });
});

// ==========================================
// 3. FUNGSI MATA (SHOW/HIDE PASSWORD)
// ==========================================
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (input.type === "password") {
        input.type = "text"; 
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash"); 
    } else {
        input.type = "password"; 
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye"); 
    }
}

// ==========================================
// 4. FUNGSI LUPA KATA LALUAN (MODAL BOOTSTRAP)
// ==========================================
function forgotPassword() {
    // Buka modal Bootstrap yang kita letak di HTML tadi
    const modal = new bootstrap.Modal(document.getElementById('forgotPassModal'));
    modal.show();
}

function processResetPassword() {
    const email = document.getElementById('resetEmailInput').value;
    
    if (!email) {
        showCustomToast('error', 'E-mel Diperlukan', 'Sila masukkan e-mel anda dahulu.');
        return;
    }

    showCustomLoader("Menghantar Pautan...");

    auth.sendPasswordResetEmail(email)
        .then(() => {
            hideCustomLoader();
            
            // Tutup modal
            const modalEl = document.getElementById('forgotPassModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            modalInstance.hide();
            
            document.getElementById('resetEmailInput').value = ""; // bersihkan
            showCustomToast('success', 'E-mel Dihantar!', 'Sila semak peti masuk atau folder Spam e-mel anda.');
        })
        .catch((error) => {
            hideCustomLoader();
            showCustomToast('error', 'Ralat Sistem', 'E-mel ini tidak wujud dalam pangkalan data kami.');
        });
}

// ==========================================
// 5. FUNGSI LOG MASUK (LOGIN)
// ==========================================
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault(); 

    const form = e.target;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[id="loginPassword"]').value;
    
    if (!isUiTMEmail(email)) {
        showCustomToast('error', 'Akses Ditolak', 'Hanya e-mel rasmi UiTM dibenarkan log masuk.');
        return; 
    }

    const rememberMe = document.getElementById('rememberMe').checked;
    const persistenceType = rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION; 

    showCustomLoader("Mengesahkan Maklumat...");

    auth.setPersistence(persistenceType)
        .then(() => {
            return auth.signInWithEmailAndPassword(email, password);
        })
        .then((userCredential) => {
            showCustomToast('success', 'Berjaya Log Masuk!', 'Mengalihkan ke papan pemuka...');
            // Beri masa 1.5 saat untuk staf baca mesej Toast sebelum tukar page
            setTimeout(() => {
                window.location.href = "dashboard.html"; 
            }, 1500);
        })
        .catch((error) => {
            hideCustomLoader();
            
            let tajukRalat = "Log Masuk Gagal";
            let mesejRalat = "Sistem menghadapi ralat. Sila cuba lagi.";

            // ====================================================
            // PENGASINGAN MESEJ RALAT SPESIFIK DARI FIREBASE
            // ====================================================
            if (error.code === 'auth/user-not-found') {
                tajukRalat = "Akaun Tidak Ditemui";
                mesejRalat = "E-mel ini belum didaftarkan. Sila daftar akaun terlebih dahulu.";
            } 
            else if (error.code === 'auth/wrong-password') {
                tajukRalat = "Kata Laluan Salah";
                mesejRalat = "Kata laluan yang anda masukkan adalah tidak tepat. Sila cuba lagi.";
            } 
            else if (error.code === 'auth/invalid-credential') {
                // Untuk keselamatan, sistem Firebase baharu kadang-kadang gabungkan ralat
                tajukRalat = "Maklumat Tidak Tepat";
                mesejRalat = "E-mel tiada dalam sistem ATAU kata laluan yang dimasukkan salah.";
            }
            else if (error.code === 'auth/too-many-requests') {
                tajukRalat = "Akaun Disekat Sementara";
                mesejRalat = "Terlalu banyak percubaan log masuk yang gagal. Sila cuba sebentar lagi atau klik 'Lupa Kata Laluan'.";
            }

            showCustomToast('error', tajukRalat, mesejRalat);
        });
});

// ================================================================
// SETTING ANIMASI BACKGROUND (PARTICLES.JS)
// ================================================================
if (typeof particlesJS !== 'undefined') {
    particlesJS("particles-js", {
        "particles": {
          "number": { "value": 60, "density": { "enable": true, "value_area": 800 } },
          "color": { "value": "#0f766e" },
          "shape": { "type": "circle" },
          "opacity": { "value": 0.5 },
          "size": { "value": 4, "random": true },
          "line_linked": { "enable": true, "distance": 150, "color": "#0f766e", "opacity": 0.3, "width": 1 },
          "move": { "enable": true, "speed": 2 }
        },
        "interactivity": {
          "detect_on": "canvas",
          "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
          "modes": { "grab": { "distance": 140, "line_linked": { "opacity": 0.8 } }, "push": { "particles_nb": 4 } }
        },
        "retina_detect": true
      });
}

// ==========================================
// 6. FUNGSI LOG MASUK GUNA GOOGLE
// ==========================================
function logMasukGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ hd: 'uitm.edu.my' });
    
    showCustomLoader("Menyambung ke Google...");
    auth.signInWithRedirect(provider);
}

auth.getRedirectResult().then((result) => {
    if (result.user) {
        const userEmail = result.user.email;
        
        if (!isUiTMEmail(userEmail)) {
            auth.signOut().then(() => {
                hideCustomLoader();
                showCustomToast('error', 'Akses Ditolak', 'Hanya akaun Google rasmi UiTM dibenarkan.');
            });
        } else {
            showCustomLoader("Melog masuk...");
            if (result.additionalUserInfo && result.additionalUserInfo.isNewUser) {
                db.collection('users').doc(result.user.uid).set({
                    uid: result.user.uid,
                    email: userEmail,
                    namaPenuh: result.user.displayName || "Staf",
                    noPekerja: "", 
                    role: 'staf',
                    created_time: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true }).then(() => {
                    window.location.replace("dashboard.html");
                });
            } else {
                window.location.replace("dashboard.html");
            }
        }
    }
}).catch((error) => {
    hideCustomLoader();
    showCustomToast('error', 'Ralat', 'Gagal log masuk dengan Google.');
});

// ==========================================
// 8. SEMAK JIKA STAF DAH LOG MASUK
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        if (isUiTMEmail(user.email)) {
            // Jangan kacau page kalau dia baru lepas daftar (sebab kita nak tunjuk toast kejayaan dulu)
            if (window.location.pathname.includes("index.html")) {
                // Biar kosong, nanti dia redirect selepas butang login
            }
        } else {
            auth.signOut();
        }
    }
});

