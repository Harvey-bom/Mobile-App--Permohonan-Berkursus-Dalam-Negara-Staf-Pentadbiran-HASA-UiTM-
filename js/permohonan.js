// ==========================================
// 1. SEMAK STATUS & AUTO-ISI MAKLUMAT STAF
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection('users').doc(user.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    const dataStaf = doc.data();
                    document.getElementById('formEmail').value = dataStaf.email || user.email;
                    document.getElementById('formNoPekerja').value = dataStaf.noPekerja || "";
                    
                    let namaPenuh = (dataStaf.namaPenuh || "").toUpperCase();
                    namaPenuh = namaPenuh.replace(/\b(BIN|BINTI|A\/L|A\/P|B\.|BT\.)(\s|$)/g, ' ')
                                         .replace(/\s+/g, ' ').trim();
                    document.getElementById('formNama').value = namaPenuh;
                }
            }).catch((error) => console.error("Ralat memuatkan data staf:", error));
    } else {
        window.location.replace("index.html");
    }
});

// ==========================================
// 2. FUNGSI HALANG TAIP BIN/BINTI/AL/AP
// ==========================================
document.getElementById('formNama').addEventListener('input', function(e) {
    let teksSemasa = e.target.value.toUpperCase();
    teksSemasa = teksSemasa.replace(/\b(BIN|BINTI|A\/L|A\/P|B\.|BT\.)(\s|$)/g, ' ')
                           .replace(/\s+/g, ' ').trimStart();
    e.target.value = teksSemasa;
});

// ==========================================
// 3. FUNGSI TUKAR FAIL KE BASE64 (DENGAN HAD SAIZ)
// ==========================================
// Pangkalan data percuma ada had 1MB. Kita hadkan fail ke 750KB maksimum.
function prosesFailKeBase64(fileInputId) {
    return new Promise((resolve, reject) => {
        const fileInput = document.getElementById(fileInputId);
        if (!fileInput.files || fileInput.files.length === 0) {
            resolve("Tiada Fail"); // Sama macam FlutterFlow punya fallback
            return;
        }

        const file = fileInput.files[0];
        
        // Semak saiz fail (Maksimum 750KB = 750,000 bytes)
        if (file.size > 750000) {
            reject(`Fail "${file.name}" terlalu besar. Sila pastikan saiz di bawah 750KB.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); // Berjaya tukar ke teks Base64
        reader.onerror = (error) => reject("Ralat memproses fail.");
        reader.readAsDataURL(file);
    });
}

// ==========================================
// 4. FUNGSI HANTAR BORANG KE FIRESTORE
// ==========================================
document.getElementById('permohonanForm').addEventListener('submit', async function(e) {
    e.preventDefault(); 
    const user = auth.currentUser;
    if (!user) return;

    Swal.fire({
        title: 'Memproses Borang...',
        text: 'Sila tunggu, sistem sedang memuat naik dokumen anda.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        // --- PROSES 1: TUKAR SEMUA DOKUMEN KE TEKS (BASE64) ---
        const file_brosur = await prosesFailKeBase64('fileBrosur');
        const file_tentatif = await prosesFailKeBase64('fileTentatif');
        const file_resit = await prosesFailKeBase64('fileResit');
        const file_kertas_kerja = await prosesFailKeBase64('filePembentangan');
        const file_sokongan = await prosesFailKeBase64('fileTambahan');

        // --- PROSES 2: SUSUN DATA MENGIKUT SCHEMA FLUTTERFLOW ---
        const applicationData = {
            // Rujukan User & Masa
            created_by: db.doc('users/' + user.uid), // Format Reference (Bukan string)
            created_time: firebase.firestore.FieldValue.serverTimestamp(), // Format Timestamp
            status: "Dalam Semakan",
            status_tuntutan: "Belum Selesai",

            // Maklumat Pemohon
            email_rasmi: document.getElementById('formEmail').value,
            no_telefon: document.getElementById('formTel').value,
            no_pekerja: document.getElementById('formNoPekerja').value,
            taraf_jawatan: document.getElementById('formTarafJawatan').value,
            gelaran: document.getElementById('formGelaran').value,
            nama_penuh: document.getElementById('formNama').value,
            jawatan: document.getElementById('formJawatan').value,
            gred_jawatan: document.getElementById('formGred').value,
            jabatan_unit: document.getElementById('formJabatan').value,
            pusat_tanggungjawab: document.getElementById('formPTJ').value,
            lokasi_bertugas: document.getElementById('formLokasiPTJ').value,

            // Maklumat Latihan
            tajuk_kursus: document.getElementById('formTajukKursus').value,
            tarikh_kursus_text: document.getElementById('formTarikhKursus').value,
            tempat_kursus: document.getElementById('formTempatKursus').value,

            // Implikasi Kewangan
            status_yuran: document.getElementById('formStatusYuran').value,
            jumlah_yuran: document.getElementById('formJumlahYuran').value || "-",
            elaun_makan: document.getElementById('formElaunMakan').value,
            elaun_perjalanan: document.getElementById('formElaunPerjalanan').value,
            bayaran_penginapan: document.getElementById('formPenginapan').value,
            tambang_kapal_terbang: document.getElementById('formKapalTerbang').value,

            // Fail & Pembentangan
            ada_pembentangan: document.getElementById('formAdaPembentangan').value,
            file_brosur: file_brosur,
            file_tentatif: file_tentatif,
            file_resit: file_resit,
            file_kertas_kerja: file_kertas_kerja,
            file_sokongan: file_sokongan,

            // Senarai Semak & Perakuan (True secara default sebab form ada atribut 'required')
            adalah_senarai_semak_lengkap: true,
            adalah_perakuan_benar: true
        };

        // --- PROSES 3: SIMPAN KE COLLECTION 'application' ---
        await db.collection('application').add(applicationData);

        // --- PROSES 4: BERJAYA ---
        Swal.fire({
            icon: 'success',
            title: 'Permohonan Berjaya!',
            text: 'Borang anda telah dihantar dan kini Dalam Semakan HR.',
            confirmButtonColor: '#0f766e',
            confirmButtonText: 'Kembali ke Dashboard'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = "dashboard.html";
            }
        });

    } catch (error) {
        // Jika berlaku ralat (contoh: saiz fail terlalu besar)
        console.error("Ralat Hantar Borang:", error);
        
        // Pamerkan ralat khusus kalau ia datang dari saiz fail
        let ralatMesej = "Gagal menghantar permohonan. Sila cuba lagi.";
        if (typeof error === "string" && error.includes("terlalu besar")) {
            ralatMesej = error;
        }

        Swal.fire({
            icon: 'error',
            title: 'Ralat Pemuatnaikan',
            text: ralatMesej,
            confirmButtonColor: '#ef4444'
        });
    }
});

// ==========================================
// 5. FUNGSI PINTASAN MOHON PENGESAHAN KETUA JABATAN
// ==========================================
function mohonPengesahan(platform) {
    // Tarik maklumat yang staf dah taip dalam borang setakat ini
    const namaStaf = document.getElementById('formNama').value || "[Nama Saya]";
    const tajukKursus = document.getElementById('formTajukKursus').value || "[Tajuk Kursus]";
    const tarikhKursus = document.getElementById('formTarikhKursus').value || "[Tarikh Kursus]";

    // Karangan ayat rasmi automatik
    const mesej = `Assalamualaikum / Salam Sejahtera,\n\nSaya ${namaStaf} ingin memohon jasa baik dan sokongan Tuan/Puan untuk menghadiri kursus berikut:\n\n📌 *Tajuk:* ${tajukKursus}\n📅 *Tarikh:* ${tarikhKursus}\n\nBersama-sama mesej ini, saya akan lampirkan dokumen berkaitan untuk semakan dan pengesahan Tuan/Puan.\n\nTerima kasih.`;

    if (platform === 'whatsapp') {
        // Encode ayat ke format URL WhatsApp
        const waLink = `https://wa.me/?text=${encodeURIComponent(mesej)}`;
        window.open(waLink, '_blank');
    } 
    else if (platform === 'email') {
        // Encode ayat ke format E-mel (Subject + Body)
        const subjek = `Mohon Sokongan Menghadiri Kursus: ${tajukKursus}`;
        const emailLink = `mailto:?subject=${encodeURIComponent(subjek)}&body=${encodeURIComponent(mesej)}`;
        window.open(emailLink, '_blank');
    }
}