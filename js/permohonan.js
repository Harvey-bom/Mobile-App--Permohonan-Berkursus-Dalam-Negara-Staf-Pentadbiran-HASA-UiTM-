// ==========================================
// CARTA ORGANISASI HASA UiTM (HIERARKI)
// ==========================================
const KATEGORI_JABATAN_HASA = {
    "Pengarah Hospital / Pengurusan Tertinggi": [
        "Pejabat Pengarah",
        "Jabatan Khidmat Komuniti & Ambulatori",
        "Jabatan Penyelidikan, Jaringan Industri & Inovasi",
        "Jabatan Kejururawatan",
        "Jabatan Komunikasi Korporat",
        "Pejabat Undang-Undang",
        "Bahagian Perkhidmatan Eksekutif",
        "Bahagian Pengurusan Klinikal"
    ],
    "Timbalan Pengarah Klinikal (Perubatan)": [
        "Jabatan Perubatan",
        "Jabatan Perubatan Kecemasan",
        "Jabatan Perubatan Penjagaan Primer",
        "Jabatan Perubatan Pemulihan",
        "Jabatan Pediatrik",
        "Jabatan Psikiatri",
        "Jabatan Perubatan Kesihatan Awam",
        "Jabatan Etika & Undang-Undang Perubatan",
        "Pusat Perkhidmatan Nefrologi",
        "Pusat Perkhidmatan Onkologi",
        "Pusat Perkhidmatan Kardiologi",
        "Pusat Perkhidmatan Respiratori",
        "Pusat Perkhidmatan Rawatan Harian",
        "Pusat Perkhidmatan Gastroenterologi & Hepatologi",
        "Unit Pencegahan & Kawalan Infeksi"
    ],
    "Timbalan Pengarah Klinikal (Pembedahan)": [
        "Jabatan Pembedahan",
        "Jabatan Kardiovaskular & Pembedahan Torasik",
        "Jabatan Ortopedik & Traumatologi",
        "Jabatan Oftalmologi",
        "Jabatan Otorinolaringologi - Pembedahan Kepala & Leher",
        "Jabatan Anestesiologi & Rawatan Intensif",
        "Jabatan Obstetrik & Ginekologi",
        "Jabatan Patologi Forensik",
        "Pusat Perkhidmatan Pergigian",
        "Pusat Perkhidmatan Pembedahan Plastik",
        "Pusat Perkhidmatan Dewan Bedah"
    ],
    "Timbalan Pengarah Profesional dan Operasi": [
        "Jabatan Radiologi",
        "Jabatan Makmal Diagnostik Klinikal",
        "Jabatan Pengurusan Risiko, Pematuhan & Kualiti",
        "Jabatan Farmasi",
        "Jabatan Maklumat Pesakit",
        "Jabatan Dietetik & Sajian",
        "Jabatan Kerja Sosial Perubatan",
        "Jabatan Infrastruktur",
        "Jabatan Infostruktur",
        "Unit Penyeliaan Penolong Pegawai Perubatan",
        "Unit Casemix",
        "Perpustakaan Perubatan Tun Abdul Razak"
    ],
    "Timbalan Pengarah Pengurusan": [
        "Bahagian Sumber Manusia",
        "Bahagian Pembangunan Sumber Manusia",
        "Bahagian Governan & Integriti",
        "Bahagian Pembangunan Perniagaan",
        "Pejabat Polis Bantuan",
        "Unit Spiritualiti",
        "Unit Kaunseling"
    ],
    "Timbalan Pengarah Kewangan": [
        "Jabatan Kewangan"
    ]
};

// Fungsi untuk menukar Kamus Data menjadi HTML <optgroup>
function binaHTMLDropdownJabatan() {
    let html = `<option value="" disabled selected>Pilih Jabatan / Unit Anda...</option>`;
    
    for (const [kategori, senaraiJabatan] of Object.entries(KATEGORI_JABATAN_HASA)) {
        // Bina tajuk kumpulan yang tak boleh diklik (optgroup)
        html += `<optgroup label="--- ${kategori.toUpperCase()} ---">`;
        
        // Masukkan jabatan di bawah kumpulan tersebut
        senaraiJabatan.forEach(jabatan => {
            html += `<option value="${jabatan}">${jabatan}</option>`;
        });
        
        html += `</optgroup>`;
    }
    return html;
}

// ==========================================
// 0. FUNGSI UI KASTAM (PENGGANTI SWEETALERT)
// ==========================================
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
    }, 3500); // Toast akan hilang selepas 3.5 saat
}

// ==========================================
// 1. SEMAK STATUS, AUTO-ISI MAKLUMAT & PAPAR MODAL KATEGORI
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        // PANGGIL FUNGSI LUKIS JABATAN DI SINI SEBAIK SAHAJA MASUK
        document.getElementById('formJabatan').innerHTML = binaHTMLDropdownJabatan();
        db.collection('users').doc(user.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    const dataStaf = doc.data();
                    document.getElementById('formEmail').value = dataStaf.email || user.email;
                    document.getElementById('formNoPekerja').value = dataStaf.noPekerja || "";
                    
                    let namaPenuh = (dataStaf.namaPenuh || "").toUpperCase();
                    namaPenuh = namaPenuh.replace(/\b(BIN|BINTI|A\/L|A\/P|B\.|BT\.)(\s|$)/g, ' ').replace(/\s+/g, ' ').trim();
                    document.getElementById('formNama').value = namaPenuh;
                }
            }).catch((error) => console.error("Ralat memuatkan data staf:", error));

        // Paparkan Modal Pilihan Kategori sebaik sahaja halaman dimuatkan
        const modalKategori = new bootstrap.Modal(document.getElementById('kategoriModal'));
        modalKategori.show();

    } else {
        window.location.replace("index.html");
    }
});

// ==========================================
// 1.1 FUNGSI TETAPAN KATEGORI PERMOHONAN (PINTAR)
// ==========================================
function pilihKategori(jenis) {
    // 1. Simpan dan papar nama kategori
    document.getElementById('hideKategoriPermohonan').value = jenis;
    const paparan = document.getElementById('paparanKategori');
    
    let icon = "fa-building-columns";
    let warna = "bg-success";
    if(jenis === 'TIK') { icon = "fa-hand-holding-dollar"; warna = "bg-primary"; }
    else if(jenis === 'Tajaan') { icon = "fa-gift"; warna = "bg-warning text-dark"; }
    
    paparan.className = `badge ${warna} fs-6 px-3 py-2 rounded-pill shadow-sm`;
    paparan.innerHTML = `<i class="fa-solid ${icon} me-1"></i> Kategori: ${jenis}`;

    // 2. Kenal pasti kotak Implikasi Kewangan
    const yuran = document.getElementById('formStatusYuran');
    const yuranRM = document.getElementById('formJumlahYuran');
    const mkn = document.getElementById('formElaunMakan');
    const jln = document.getElementById('formElaunPerjalanan');
    const inap = document.getElementById('formPenginapan');
    const flight = document.getElementById('formKapalTerbang');

    // 3. Logik Pintar Mengikut Kategori
    if (jenis === 'TIK') {
        // TIK: Semua letak "-" dan KUNCI
        yuran.value = "-"; yuran.disabled = true;
        yuranRM.value = "-"; yuranRM.disabled = true;
        mkn.value = "-"; mkn.disabled = true;
        jln.value = "-"; jln.disabled = true;
        inap.value = "-"; inap.disabled = true;
        flight.value = "-"; flight.disabled = true;
    } 
    else if (jenis === 'Tajaan') {
        // TAJAAN: Yuran set Tajaan, Buka RM, Elaun lain letak "-" tapi tak kunci (boleh ubah ke Tajaan)
        yuran.value = "Tajaan"; yuran.disabled = true;
        yuranRM.value = ""; yuranRM.disabled = false; yuranRM.placeholder = "Sila letak nilai (Cth: RM500)";
        mkn.value = "-"; mkn.disabled = false;
        jln.value = "-"; jln.disabled = false;
        inap.value = "-"; inap.disabled = false;
        flight.value = "-"; flight.disabled = false;
    } 
    else {
        // PERUNTUKAN HASA: Default (Buka semua)
        yuran.value = ""; yuran.disabled = false;
        yuranRM.value = ""; yuranRM.disabled = false; yuranRM.placeholder = "Cth: RM100.00 (Letak - jika tiada)";
        mkn.value = "Ikut kelayakan berkursus"; mkn.disabled = false;
        jln.value = "Ikut kelayakan berkursus"; jln.disabled = false;
        inap.value = "Ikut kelayakan berkursus"; inap.disabled = false;
        flight.value = "-"; flight.disabled = false;
    }

    // 4. Tutup Modal
    const modalEl = document.getElementById('kategoriModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if(modalInstance) modalInstance.hide();
}

// ==========================================
// 2. FUNGSI FORMAT INPUT (HURUF BESAR & BUANG BIN/BINTI)
// ==========================================
// A. Khas untuk Nama (No. 6) - Buang Bin/Binti & Uppercase
document.getElementById('formNama').addEventListener('input', function(e) {
    let teksSemasa = e.target.value.toUpperCase();
    teksSemasa = teksSemasa.replace(/\b(BIN|BINTI|A\/L|A\/P|B\.|BT\.)(\s|$)/g, ' ')
                           .replace(/\s+/g, ' ').trimStart();
    e.target.value = teksSemasa;
});

// B. Untuk ruangan lain (No. 8, 12, 14, 16) - Hanya Paksa Uppercase
const uppercaseFields = ['formGred', 'formTajukKursus', 'formTempatKursus', 'formJumlahYuran'];

uppercaseFields.forEach(fieldId => {
    document.getElementById(fieldId).addEventListener('input', function(e) {
        // Tukar apa sahaja yang ditaip menjadi huruf besar serta-merta
        e.target.value = e.target.value.toUpperCase();
    });
});

// C. Khas untuk No. Telefon (No. 2) - Auto-format 01X-XXXXXXX dan halang huruf
document.getElementById('formTel').addEventListener('input', function(e) {
    // 1. Buang semua karakter yang BUKAN nombor (huruf/simbol automatik ghaib)
    let nombor = e.target.value.replace(/\D/g, '');
    
    // 2. Pasang sengkang (-) secara automatik selepas 3 digit pertama
    if (nombor.length > 3) {
        // Hadkan kepada maksimum 11 digit nombor (format paling panjang di Malaysia: 011-12345678)
        e.target.value = nombor.substring(0, 3) + '-' + nombor.substring(3, 11);
    } else {
        e.target.value = nombor;
    }
});

// D. Khas untuk Jumlah Yuran (No. 16) - Auto-format RM & 2 titik perpuluhan
document.getElementById('formJumlahYuran').addEventListener('blur', function(e) {
    let nilai = e.target.value.trim().toUpperCase();
    
    // Abaikan jika staf letak "-" atau biarkan kosong
    if (nilai === "" || nilai === "-") {
        e.target.value = nilai;
        return;
    }

    // Buang huruf (seperti RM), ruang kosong, dan koma untuk dapatkan nombor sahaja
    // Regex /[^\d.]/g bermaksud: Buang semua benda KECUALI nombor dan titik (.)
    let nomborBersih = nilai.replace(/[^\d.]/g, ''); 
    
    // Semak adakah yang ditaip itu adalah nombor yang sah
    if (!isNaN(nomborBersih) && nomborBersih !== "") {
        // Tukar kepada format 2 tempat perpuluhan (Cth: 200 jadi 200.00)
        let nilaiDiformat = parseFloat(nomborBersih).toFixed(2);
        
        // Cantumkan perkataan RM di depan
        e.target.value = "RM" + nilaiDiformat;
    }
});

// E. Khas untuk No. 15 & No. 16 (Hubungan Status Yuran & Jumlah Yuran)
document.getElementById('formStatusYuran').addEventListener('change', function(e) {
    const statusYuran = e.target.value;
    const inputJumlahYuran = document.getElementById('formJumlahYuran');

    if (statusYuran === "-") {
        // Jika pilih "-", terus letak "-" dan kunci kotak supaya tak boleh ditaip
        inputJumlahYuran.value = "-";
        inputJumlahYuran.disabled = true;
    } else {
        // Jika pilih "Ada" atau "Tajaan", buka semula kotak
        inputJumlahYuran.disabled = false;
        
        // Kalau sebelum ni ada tanda "-", kita kosongkan semula untuk staf taip RM
        if (inputJumlahYuran.value === "-") {
            inputJumlahYuran.value = "";
        }
    }
});

// ==========================================
// FUNGSI BANTUAN: TUKAR TARIKH KALENDAR KE AYAT RASMI
// ==========================================
function formatTarikhRasmi(dateString) {
    if (!dateString) return "";
    const bulanArr = ["JANUARI", "FEBRUARI", "MAC", "APRIL", "MEI", "JUN", "JULAI", "OGOS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DISEMBER"];
    const d = new Date(dateString);
    return `${d.getDate()} ${bulanArr[d.getMonth()]} ${d.getFullYear()}`;
}

// ==========================================
// 4. FUNGSI SEMAKAN (DOUBLE-CHECK) SEBELUM HANTAR
// ==========================================
document.getElementById('permohonanForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Halang form dari terus submit
    const user = auth.currentUser;
    if (!user) return;

    // --- GABUNGKAN TARIKH UNTUK PAPARAN SEMAKAN ---
    const tarikhMula = document.getElementById('formTarikhMula').value;
    const tarikhAkhir = document.getElementById('formTarikhAkhir').value;
    let tarikhGabungan = (tarikhMula === tarikhAkhir) ? formatTarikhRasmi(tarikhMula) : `${formatTarikhRasmi(tarikhMula)} HINGGA ${formatTarikhRasmi(tarikhAkhir)}`;

    // --- TANGKAP NAMA FAIL BROSUR/POSTER (DOKUMEN WAJIB) ---
    const inputBrosur = document.getElementById('fileBrosur');
    let namaFailBrosur = "TIADA FAIL";
    if (inputBrosur.files && inputBrosur.files.length > 0) {
        namaFailBrosur = inputBrosur.files[0].name; // Ambil nama fail sebenar
    }

    // --- MASUKKAN MAKLUMAT KE DALAM KOTAK MODAL SEMAKAN ---
    document.getElementById('confirmNama').innerText = document.getElementById('formNama').value.toUpperCase();
    document.getElementById('confirmNoPkj').innerText = document.getElementById('formNoPekerja').value;
    document.getElementById('confirmJabatan').innerText = document.getElementById('formJabatan').value;
    
    document.getElementById('confirmTajuk').innerText = document.getElementById('formTajukKursus').value.toUpperCase();
    document.getElementById('confirmTarikh').innerText = tarikhGabungan;
    document.getElementById('confirmTempat').innerText = document.getElementById('formTempatKursus').value.toUpperCase();
    
    document.getElementById('confirmYuran').innerText = document.getElementById('formJumlahYuran').value.toUpperCase() || "TIADA YURAN";
    
    // Paparkan nama fail PDF di dalam modal
    document.getElementById('confirmDokumen').innerHTML = `<i class="fa-solid fa-file-pdf me-1 text-danger"></i> ${namaFailBrosur}`;

    // --- PAPARKAN MODAL BOOTSTRAP KEPADA STAF ---
    const confirmModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    confirmModal.show();
});

// ==========================================
// 4.1. FUNGSI HANTAR SEBENAR (BILA STAF KLIK "SAHKAN & HANTAR")
// ==========================================
async function hantarPermohonanSah() {
    const user = auth.currentUser;
    if (!user) return;

    // 1. Tutup kotak Modal Semakan
    const modalEl = document.getElementById('confirmationModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();

    // 2. Panggil Custom Loader Moden (Kaca Hijau Gelap)
    showCustomLoader("Memuat Naik Dokumen...");

    try {
        // --- PROSES 1: TUKAR SEMUA DOKUMEN KE TEKS (BASE64) ---
        const file_brosur = await prosesFailKeBase64('fileBrosur');
        const file_tentatif = await prosesFailKeBase64('fileTentatif');
        const file_resit = await prosesFailKeBase64('fileResit');
        const file_kertas_kerja = await prosesFailKeBase64('filePembentangan');
        const file_sokongan = await prosesArrayFailKeBase64(koleksiFailTambahan); // Guna fungsi Array Pintar

        // --- PROSES 2: GABUNGKAN TARIKH MULA & AKHIR ---
        const tarikhMula = document.getElementById('formTarikhMula').value;
        const tarikhAkhir = document.getElementById('formTarikhAkhir').value;
        let tarikhGabungan = (tarikhMula === tarikhAkhir) ? formatTarikhRasmi(tarikhMula) : `${formatTarikhRasmi(tarikhMula)} HINGGA ${formatTarikhRasmi(tarikhAkhir)}`;

        // --- PROSES 3: SUSUN DATA MENGIKUT SCHEMA FIRESTORE ---
        const applicationData = {
            created_by: db.doc('users/' + user.uid), 
            created_time: firebase.firestore.FieldValue.serverTimestamp(), 
            status: "Menunggu Pengesahan Ketua Jabatan",
            status_tuntutan: "Belum Selesai",

            kategori_permohonan: document.getElementById('hideKategoriPermohonan').value,

            email_rasmi: document.getElementById('formEmail').value,
            no_telefon: document.getElementById('formTel').value,
            no_pekerja: document.getElementById('formNoPekerja').value,
            taraf_jawatan: document.getElementById('formTarafJawatan').value,
            gelaran: document.getElementById('formGelaran').value,
            nama_penuh: document.getElementById('formNama').value.toUpperCase(),
            jawatan: document.getElementById('formJawatan').value,
            gred_jawatan: document.getElementById('formGred').value.toUpperCase(),
            jabatan_unit: document.getElementById('formJabatan').value,
            pusat_tanggungjawab: document.getElementById('formPTJ').value,
            lokasi_bertugas: document.getElementById('formLokasiPTJ').value,

            tajuk_kursus: document.getElementById('formTajukKursus').value.toUpperCase(),
            tarikh_mula: tarikhMula, 
            tarikh_akhir: tarikhAkhir, 
            tarikh_kursus_text: tarikhGabungan, 
            tempat_kursus: document.getElementById('formTempatKursus').value.toUpperCase(),

            status_yuran: document.getElementById('formStatusYuran').value,
            // Jika kotak dikunci (disabled), kita paksa ia baca sebagai "-"
            jumlah_yuran: document.getElementById('formJumlahYuran').disabled ? "-" : (document.getElementById('formJumlahYuran').value.toUpperCase() || "-"),
            elaun_makan: document.getElementById('formElaunMakan').value,
            elaun_perjalanan: document.getElementById('formElaunPerjalanan').value,
            bayaran_penginapan: document.getElementById('formPenginapan').value,
            tambang_kapal_terbang: document.getElementById('formKapalTerbang').value,

            ada_pembentangan: document.getElementById('formAdaPembentangan').value,
            file_brosur: file_brosur,
            file_tentatif: file_tentatif,
            file_resit: file_resit,
            file_kertas_kerja: file_kertas_kerja,
            file_sokongan: file_sokongan,

            adalah_senarai_semak_lengkap: true,
            adalah_perakuan_benar: true
        };

        // --- PROSES 4: SIMPAN KE COLLECTION 'application' ---
        await db.collection('application').add(applicationData);

        // --- PROSES 4.5: CARI KETUA JABATAN & HANTAR E-MEL NOTIFIKASI ---
        const jabatanStaf = applicationData.jabatan_unit;
        const namaStaf = applicationData.nama_penuh;
        const tajukKursus = applicationData.tajuk_kursus;

        // Minta Firebase cari siapa yang pegang jawatan KJ untuk jabatan staf ini
        const kjSnapshot = await db.collection('users')
            .where('role', '==', 'ketua_jabatan')
            .where('jabatan_diurus', '==', jabatanStaf)
            .get();

        if (!kjSnapshot.empty) {
            // Bina format e-mel rasmi untuk KJ
            let ayatEmelKJ = `Salam Sejahtera Ketua Jabatan / Ketua Unit,\n\n`;
            ayatEmelKJ += `Sistem e-Latihan merekodkan terdapat satu permohonan latihan baharu daripada staf di bawah seliaan jabatan anda yang memerlukan semakan dan sokongan.\n\n`;
            ayatEmelKJ += `Maklumat Permohonan:\n`;
            ayatEmelKJ += `Pemohon: ${namaStaf}\n`;
            ayatEmelKJ += `Jabatan: ${jabatanStaf}\n`;
            ayatEmelKJ += `Kursus: ${tajukKursus}\n\n`;
            ayatEmelKJ += `Tindakan:\n`;
            ayatEmelKJ += `Sila log masuk ke Papan Pemuka Ketua Jabatan (e-Latihan) untuk membuat semakan dan memberikan sokongan ke atas permohonan ini.\n\n`;
            ayatEmelKJ += `Terima kasih.`;

            // Hantar e-mel kepada setiap KJ yang dijumpai (In case HR set 2 orang KJ untuk 1 jabatan)
            kjSnapshot.forEach(docKJ => {
                const dataKJ = docKJ.data();
                if (dataKJ.email && typeof emailjs !== "undefined") {
                    const templateParams = {
                        to_email: dataKJ.email, 
                        subjek_emel: `[TINDAKAN KJ] Mohon Sokongan Latihan: ${namaStaf}`,
                        kandungan_emel: ayatEmelKJ
                    };

                    // Tembak e-mel di belakang tabir (tak perlu await supaya staf tak tunggu lama)
                    emailjs.send("service_pryuhiu", "template_h9eddz7", templateParams, "Fevnjv1nV60-D-GvC")
                        .then(() => console.log(`E-mel berjaya dihantar kepada KJ: ${dataKJ.email}`))
                        .catch((err) => console.error("Gagal hantar e-mel KJ:", err));
                }
            });
        }

        // --- PROSES 5: BERJAYA (Panggil Toast & Buka Modal Feedback) ---
        hideCustomLoader();

        // --- PROSES 5: BERJAYA (Panggil Toast & Alih ke Dashboard) ---
        hideCustomLoader();
        showCustomToast('success', 'Permohonan Berjaya!', 'Borang anda telah dihantar. Kembali ke Dashboard...');
        koleksiFailTambahan = []; // Kosongkan memori fail selepas submit berjaya
        
        // PADAM window.location.href, kita ganti dengan buka modal feedback
        setTimeout(() => {
            const feedbackModal = new bootstrap.Modal(document.getElementById('feedbackModal'));
            feedbackModal.show();
        }, 2000);

    } catch (error) {
        // --- PROSES 6: JIKA GAGAL (Panggil Toast Merah dengan Ayat Mudah) ---
        hideCustomLoader();
        console.error("Ralat Hantar Borang:", error);
        
        // Mesej lalai jika internet terputus atau server Firebase down
        let tajukRalat = "Gagal Menghantar Borang";
        let ralatMesej = "Sistem tidak dapat memproses permohonan anda ketika ini. Sila semak sambungan internet dan cuba lagi.";
        
        // Mesej khusus jika fail saiz besar atau bukan PDF
        if (typeof error === "string" && (error.includes("PDF") || error.includes("terlalu besar"))) {
            tajukRalat = "Masalah Dokumen Lampiran";
            ralatMesej = error; 
        }

        showCustomToast('error', tajukRalat, ralatMesej);
    }
}

// ==========================================
// 8. FUNGSI MAKLUM BALAS (FEEDBACK) PENGGUNA
// ==========================================
let nilaiRating = 0;
const emojis = ["😩", "😟", "😐", "🙂", "🤩"]; // Tahap emoji 1 hingga 5

// Fungsi apabila staf tekan bintang
document.querySelectorAll('.star-rating i').forEach(star => {
    star.addEventListener('click', function() {
        nilaiRating = parseInt(this.getAttribute('data-rating'));
        
        // Warnakan bintang yang dipilih dan sebelumnya
        document.querySelectorAll('.star-rating i').forEach(s => {
            if (parseInt(s.getAttribute('data-rating')) <= nilaiRating) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });

        // Tukar Emoji mengikut bintang
        document.getElementById('emojiReaction').innerText = emojis[nilaiRating - 1];
    });
});

// Jika staf tekan Hantar Maklum Balas
async function hantarFeedback() {
    if (nilaiRating === 0) {
        showCustomToast('error', 'Sila Beri Rating', 'Sila klik pada bintang untuk memberi rating terlebih dahulu.');
        return;
    }

    const teks = document.getElementById('feedbackText').value;
    const user = auth.currentUser;

    showCustomLoader("Menghantar Maklum Balas...");

    try {
        // Simpan ke collection khas 'feedback'
        await db.collection('feedback').add({
            uid: user ? user.uid : "TIDAK_DIKETAHUI",
            email: user ? user.email : "TIDAK_DIKETAHUI",
            rating: nilaiRating,
            komen: teks,
            tarikh: firebase.firestore.FieldValue.serverTimestamp(),
            sistem: "Borang Permohonan"
        });

        hideCustomLoader();
        showCustomToast('success', 'Terima Kasih!', 'Maklum balas anda amat bermakna bagi kami.');
        
        // Balik ke Dashboard selepas hantar
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 2000);

    } catch (error) {
        hideCustomLoader();
        console.error("Ralat feedback:", error);
        // Jika ralat, kita teruskan sahaja bawa staf pulang ke Dashboard
        window.location.href = "dashboard.html";
    }
}