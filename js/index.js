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
// 2. FUNGSI PENDAFTARAN (SIGN UP) FIREBASE
// ==========================================
document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Halang page refresh

    // 1. Ambil data dari kotak input borang daftar (berdasarkan susunan)
    const form = e.target;
    const fullName = form.querySelectorAll('input')[0].value;
    const email = form.querySelectorAll('input')[1].value;
    const staffId = form.querySelectorAll('input')[2].value;
    const password = form.querySelectorAll('input')[3].value;

    // 2. Tunjuk animasi loading (SweetAlert2)
    Swal.fire({
        title: 'Mendaftar...',
        text: 'Sistem sedang memproses maklumat anda.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // 3. Proses cipta akaun di Firebase Authentication
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Akaun berjaya dicipta! Ambil ID pengguna
            const user = userCredential.user;

            // 4. Simpan maklumat tambahan ke dalam Firestore (Collection 'users')
            return db.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: email,
                namaPenuh: fullName,
                noPekerja: staffId,
                role: 'staf', // Supaya Admin tahu ini adalah staf biasa
                created_time: firebase.firestore.FieldValue.serverTimestamp() // Ikut format lama Tuan
            }, { merge: true }); // Guna merge supaya selamat
        })
        .then(() => {
            // 5. Mesej Berjaya
            Swal.fire({
                icon: 'success',
                title: 'Pendaftaran Berjaya!',
                text: 'Akaun e-Latihan anda telah dicipta. Sila log masuk.',
                confirmButtonColor: '#0f766e'
            }).then(() => {
                // Bersihkan form dan tukar paparan ke tab Log Masuk semula
                form.reset();
                showLogin();
            });
        })
        .catch((error) => {
            // 6. Jika Gagal (Cth: E-mel dah wujud, password pendek)
            let errorMessage = "Sila cuba lagi.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "E-mel ini telah didaftarkan dalam sistem.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Kata laluan mestilah sekurang-kurangnya 6 aksara.";
            }

            Swal.fire({
                icon: 'error',
                title: 'Pendaftaran Gagal',
                text: error.message,
                confirmButtonColor: '#0f766e'
            });
        });
});

// ==========================================
// 3. FUNGSI MATA (SHOW/HIDE PASSWORD)
// ==========================================
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (input.type === "password") {
        input.type = "text"; // Tunjuk teks
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash"); // Tukar ikon mata palang
    } else {
        input.type = "password"; // Sembunyi teks
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye"); // Tukar ikon mata biasa
    }
}

// ==========================================
// 4. FUNGSI LUPA KATA LALUAN (RESET PASSWORD)
// ==========================================
function forgotPassword() {
    Swal.fire({
        title: 'Lupa Kata Laluan?',
        text: "Masukkan e-mel rasmi yang anda daftarkan. Kami akan hantar pautan tetapan semula.",
        input: 'email',
        inputPlaceholder: 'cth: nama@hasa.uitm.edu.my',
        showCancelButton: true,
        confirmButtonColor: '#0f766e',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Hantar Pautan',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            const email = result.value;
            // Arahkan Firebase hantar email reset
            auth.sendPasswordResetEmail(email)
                .then(() => {
                    Swal.fire('E-mel Dihantar!', 'Sila semak peti masuk (atau folder Spam) e-mel anda untuk menetapkan kata laluan baru.', 'success');
                })
                .catch((error) => {
                    let err = "E-mel ini tidak wujud dalam pangkalan data kami.";
                    Swal.fire('Ralat', err, 'error');
                });
        }
    });
}

// ==========================================
// 5. FUNGSI LOG MASUK (LOGIN) + INGAT SAYA
// ==========================================
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault(); 

    const form = e.target;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[id="loginPassword"]').value;
    
    // Semak adakah kotak "Ingat Saya" ditanda?
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Tetapkan persistence Firebase berdasarkan kotak tanda
    const persistenceType = rememberMe 
        ? firebase.auth.Auth.Persistence.LOCAL   // Ingat sampai kiamat (kecuali logout)
        : firebase.auth.Auth.Persistence.SESSION; // Lupa lepas tutup browser

    Swal.fire({
        title: 'Log Masuk...',
        text: 'Sistem sedang mengesahkan maklumat anda.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    // 1. Setkan "Ingat Saya" dulu
    auth.setPersistence(persistenceType)
        .then(() => {
            // 2. Baru proses Log Masuk
            return auth.signInWithEmailAndPassword(email, password);
        })
        .then((userCredential) => {
            Swal.fire({
                icon: 'success', title: 'Log Masuk Berjaya!',
                text: 'Selamat datang kembali ke portal e-Latihan.',
                confirmButtonColor: '#0f766e', timer: 2000, showConfirmButton: false
            }).then(() => {
                console.log("Berjaya masuk! UID: ", userCredential.user.uid);
                window.location.href = "dashboard.html"; // Bawa ke dashboard utama (ganti dengan nama file sebenar)
            });
        })
        .catch((error) => {
            let errorMessage = "Ralat sistem. Sila cuba lagi.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = "E-mel atau Kata Laluan tidak tepat.";
            }
            Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: errorMessage, confirmButtonColor: '#0f766e' });
        });
});

// ================================================================
// SETTING ANIMASI BACKGROUND (PARTICLES.JS) - TEMA HIJAU HASA
// ================================================================
/* Pastikan library particles.js dah load di HTML sebelum kod ni jalan */
if (typeof particlesJS !== 'undefined') {
    particlesJS("particles-js", {
        "particles": {
          "number": {
            "value": 60, // Jumlah bintik (jangan banyak sangat nanti telefon lag)
            "density": {
              "enable": true,
              "value_area": 800
            }
          },
          "color": {
            "value": "#0f766e" // WARNA HIJAU HASA
          },
          "shape": {
            "type": "circle", // Bentuk bintik
            "stroke": {
              "width": 0,
              "color": "#000000"
            },
            "polygon": {
              "nb_sides": 5
            }
          },
          "opacity": {
            "value": 0.5, // Ketelusan bintik
            "random": false,
            "anim": {
              "enable": false,
              "speed": 1,
              "opacity_min": 0.1,
              "sync": false
            }
          },
          "size": {
            "value": 4, // Saiz bintik
            "random": true,
            "anim": {
              "enable": false,
              "speed": 40,
              "size_min": 0.1,
              "sync": false
            }
          },
          "line_linked": {
            "enable": true,
            "distance": 150, // Jarak garisan bersambung
            "color": "#0f766e", // WARNA GARISAN HIJAU HASA
            "opacity": 0.3,
            "width": 1
          },
          "move": {
            "enable": true,
            "speed": 2, // Kelajuan pergerakan
            "direction": "none",
            "random": false,
            "straight": false,
            "out_mode": "out",
            "bounce": false,
            "attract": {
              "enable": false,
              "rotateX": 600,
              "rotateY": 1200
            }
          }
        },
        "interactivity": {
          "detect_on": "canvas",
          "events": {
            "onhover": {
              "enable": true, // Boleh react dengan mouse hover
              "mode": "grab" // Bintik akan sambung ke mouse
            },
            "onclick": {
              "enable": true,
              "mode": "push" // Klik tambah bintik
            },
            "resize": true
          },
          "modes": {
            "grab": {
              "distance": 140,
              "line_linked": {
                "opacity": 0.8
              }
            },
            "bubble": {
              "distance": 400,
              "size": 40,
              "duration": 2,
              "opacity": 8,
              "speed": 3
            },
            "repulse": {
              "distance": 200,
              "duration": 0.4
            },
            "push": {
              "particles_nb": 4
            },
            "remove": {
              "particles_nb": 2
            }
          }
        },
        "retina_detect": true
      });
}

// ==========================================
// 1. FUNGSI LOG MASUK GUNA GOOGLE (MOD REDIRECT)
// ==========================================
function logMasukGoogle() {
    // Panggil pembekal perkhidmatan Google dari Firebase
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // Paparkan loading supaya staf tahu sistem sedang berjalan
    Swal.fire({
        title: 'Menyambung ke Google...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    // Guna 'Redirect' ganti 'Popup' (Sangat penting untuk Mobile Phone)
    auth.signInWithRedirect(provider);
}

// ==========================================
// 2. TANGKAP HASIL SELEPAS GOOGLE REDIRECT
// ==========================================
// Kod ini akan berjalan bila Google dah hantar staf semula ke web kita
auth.getRedirectResult().then((result) => {
    if (result.user) {
        // Jika berjaya log masuk, terus terbang ke Dashboard
        window.location.replace("dashboard.html");
    }
}).catch((error) => {
    console.error("Ralat Google Login:", error);
    Swal.fire('Ralat', 'Gagal log masuk. Sila semak internet anda.', 'error');
});

// ==========================================
// 3. SEMAK JIKA STAF MEMANG DAH LOG MASUK SEBELUM INI
// ==========================================
// Kalau staf buka je web ni dan dia memang dah login kelmarin, terus hantar ke dashboard
auth.onAuthStateChanged((user) => {
    if (user) {
        window.location.replace("dashboard.html");
    }
});