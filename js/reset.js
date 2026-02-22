// 1. Dapatkan "Kod Rahsia" (oobCode) dari URL yang Firebase hantar ke e-mel
const urlParams = new URLSearchParams(window.location.search);
const oobCode = urlParams.get('oobCode');

// Jika tiada kod (contohnya staf buka fail ni terus tanpa klik link e-mel)
if (!oobCode) {
    Swal.fire({
        icon: 'warning',
        title: 'Pautan Tidak Sah',
        text: 'Sila gunakan pautan yang dihantar ke e-mel anda.',
        confirmButtonColor: '#0f766e',
        allowOutsideClick: false
    }).then(() => {
        window.location.href = "index.html"; // Tendang balik ke login
    });
}

// 2. Fungsi Mata (Sama macam di index)
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

// 3. Fungsi Hantar Borang Reset
document.getElementById('resetPasswordForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Semak kalau password tak sama
    if (newPassword !== confirmPassword) {
        Swal.fire('Ralat', 'Kata laluan tidak sepadan. Sila pastikan kedua-dua kotak adalah sama.', 'error');
        return;
    }

    Swal.fire({
        title: 'Mengemaskini...',
        text: 'Sila tunggu sebentar.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    // Minta Firebase tukar password menggunakan kod rahsia (oobCode)
    auth.confirmPasswordReset(oobCode, newPassword)
        .then(() => {
            Swal.fire({
                icon: 'success',
                title: 'Berjaya!',
                text: 'Kata laluan anda telah berjaya dikemaskini.',
                confirmButtonColor: '#0f766e'
            }).then(() => {
                window.location.href = "index.html"; // Bawa ke login untuk masuk
            });
        })
        .catch((error) => {
            Swal.fire('Ralat', 'Pautan tetapan semula telah luput atau tidak sah. Sila mohon pautan baharu di halaman Log Masuk.', 'error');
        });
});

// 4. Aktifkan Animasi Particles Hijau HASA
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
          "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" } },
          "modes": { "grab": { "distance": 140, "line_linked": { "opacity": 0.8 } } }
        },
        "retina_detect": true
    });
}