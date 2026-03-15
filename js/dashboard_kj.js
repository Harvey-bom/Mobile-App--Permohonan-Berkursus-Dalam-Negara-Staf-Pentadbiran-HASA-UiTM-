// ==========================================
// 0. KASTAM UI LOADER & TOAST
// ==========================================
function showCustomLoader(textMsg = "Memproses...") { document.getElementById('loaderText').innerText = textMsg; const loader = document.getElementById('customLoader'); loader.classList.remove('d-none'); setTimeout(() => loader.classList.add('show'), 10); }
function hideCustomLoader() { const loader = document.getElementById('customLoader'); loader.classList.remove('show'); setTimeout(() => loader.classList.add('d-none'), 300); }
function showCustomToast(type, title, message) { const container = document.getElementById('toastContainer'); let iconClass = type === 'success' ? "fa-solid fa-circle-check" : "fa-solid fa-circle-exclamation"; const toast = document.createElement('div'); toast.className = `custom-toast toast-${type}`; toast.innerHTML = `<div class="toast-icon"><i class="${iconClass}"></i></div><div class="toast-content"><h6>${title}</h6><p>${message}</p></div>`; container.appendChild(toast); setTimeout(() => toast.classList.add('show'), 10); setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3500); }

// ==========================================
// SENARAI JAWATAN MATRIKS (KINI SELARAS DENGAN BORANG STAF)
// ==========================================
const SENARAI_PENEMPATAN_JAWATAN = [
    "Pengarah / Timbalan Pengarah", "Ketua Jabatan (Klinikal/Pentadbiran)", "Pakar Perubatan / Pergigian (Pakar)", "Pegawai Perubatan (MO)", "Pegawai Perubatan Siswazah (HO)", "Pegawai Pergigian",
    "Ketua Penyelia Jururawat (Matron)", "Penyelia Jururawat (Sister)", "Ketua Jururawat", "Jururawat Terlatih (SN)", "Jururawat Masyarakat (JM)",
    "Penolong Pegawai Perubatan (MA)", "Pegawai Farmasi (FRP)", "Penolong Pegawai Farmasi", "Juru X-Ray (Radiografer)", "Juruteknologi Makmal Perubatan (JTMP)", "Pegawai Dietetik / Sajian", "Jurupulih Perubatan (Fisioterapi/Cara Kerja)", "Pegawai Kerja Sosial Perubatan",
    "Pegawai Tadbir / Eksekutif", "Pembantu Tadbir (Kerani)", "Pembantu Perawatan Kesihatan (PPK)", "Pegawai Teknologi Maklumat (IT)", "Jurutera / Penolong Jurutera", "Pemandu / Pemandu Ambulans", "Polis Bantuan / Keselamatan", "Lain-lain Jawatan Sokongan"
];

function janaPilihanJawatan() {
    let html = `<option value="" disabled selected>Pilih Jawatan Penempatan...</option>`;
    SENARAI_PENEMPATAN_JAWATAN.forEach(jawatan => {
        html += `<option value="${jawatan}">${jawatan}</option>`;
    });
    return html;
}

// ==========================================
// 1. SISTEM KESELAMATAN & PENARIKAN DATA (HIBRID)
// ==========================================
let senaraiPermohonanKJSemasa = [];
let arrayPenempatanKJ = []; 
let namaJabatanKJ = ""; // 👉 KEMAS KINI: Kenal pasti jabatan asal KJ

auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection('users').doc(user.uid).get().then((doc) => {
            if (doc.exists) {
                const dataStaf = doc.data();
                if (dataStaf.role !== "ketua_jabatan") {
                    window.location.replace("dashboard.html");
                    return;
                }
                
                // Ambil Jabatan Asal & Penempatan Jawatan
                namaJabatanKJ = dataStaf.jabatan_diurus || "Panel Ketua Profesion";
                arrayPenempatanKJ = dataStaf.penempatan_diurus || [];
                
                // Papar nama Jabatan di tajuk biru
                document.getElementById('namaJabatanTitle').innerText = namaJabatanKJ;
                
                // Lukis panel kotak
                lukisPanelTetapan();

                // Terus tarik data (Sistem akan cari gabungan Jabatan + Jawatan)
                tarikPermohonanStafBawahan();
                tarikSejarahKJ();
            }
        });
    } else {
        window.location.replace("index.html");
    }
});

// ==========================================
// PENGURUSAN PANEL LAYAN DIRI KJ (KEKAL SAMA)
// ==========================================
function lukisPanelTetapan() {
    const bekas = document.getElementById('bekasDropdownPenempatan');
    bekas.innerHTML = '';
    
    if (arrayPenempatanKJ.length > 0) {
        arrayPenempatanKJ.forEach(j => tambahKotakPenempatan(j));
    } else {
        tambahKotakPenempatan("");
    }
}

function tambahKotakPenempatan(nilaiSemasa = "") {
    const bekas = document.getElementById('bekasDropdownPenempatan');
    const div = document.createElement('div');
    div.className = "d-flex gap-2 align-items-center mb-2 kotak-penempatan-item";
    
    let disableAttr = nilaiSemasa !== "" ? "disabled" : "";
    let bgClass = nilaiSemasa !== "" ? "bg-light text-muted border-secondary" : "border-primary bg-white";
    
    div.innerHTML = `
        <select class="form-select select-jawatan-kj ${bgClass} shadow-sm" ${disableAttr}>
            ${janaPilihanJawatan()}
        </select>
        <button class="btn btn-outline-danger shadow-sm flex-shrink-0" onclick="padamKotakPenempatan(this)" title="Buang Kotak Ini">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;
    bekas.appendChild(div);

    if (nilaiSemasa !== "") {
        div.querySelector('.select-jawatan-kj').value = nilaiSemasa;
    }
}

function padamKotakPenempatan(butangElement) {
    const kotakParent = butangElement.parentElement;
    const selectBox = kotakParent.querySelector('.select-jawatan-kj');
    const sudahDisimpan = selectBox.disabled; 
    kotakParent.remove();
    if (sudahDisimpan) { simpanTetapanPenempatan(true); }
}

function simpanTetapanPenempatan(isDelete = false) {
    const kotakPilihan = document.querySelectorAll('.select-jawatan-kj');
    let susunanBaru = [];
    
    kotakPilihan.forEach(select => {
        if (select.value && select.value !== "") {
            if (!susunanBaru.includes(select.value)) {
                susunanBaru.push(select.value);
                select.disabled = true;
                select.classList.remove('border-primary', 'bg-white');
                select.classList.add('bg-light', 'text-muted', 'border-secondary');
            }
        }
    });

    if (susunanBaru.length === 0 && !isDelete) {
        showCustomToast('error', 'Maklumat Kosong', 'Sila pilih sekurang-kurangnya 1 penempatan jawatan.');
        return;
    }

    const user = auth.currentUser;
    showCustomLoader(isDelete ? "Memadam Tetapan..." : "Menyimpan Tetapan...");

    db.collection('users').doc(user.uid).update({ penempatan_diurus: susunanBaru }).then(() => {
        hideCustomLoader();
        if (isDelete) showCustomToast('success', 'Berjaya Dibuang!', 'Jawatan dikeluarkan.');
        else showCustomToast('success', 'Berjaya Disimpan!', 'Sistem memantau penempatan tersebut.');
        
        arrayPenempatanKJ = susunanBaru;
        tarikPermohonanStafBawahan();
        tarikSejarahKJ();
    }).catch(error => {
        hideCustomLoader();
        console.error(error);
        showCustomToast('error', 'Gagal', 'Sistem ralat semasa menyimpan tetapan.');
    });
}

// ==========================================
// 2. FUNGSI TARIK PERMOHONAN STAF (GABUNGAN JABATAN + JAWATAN)
// ==========================================
async function tarikPermohonanStafBawahan() {
    const container = document.getElementById('senaraiPermohonanKJContainer');
    
    // Guna 'Map' supaya jika staf dari Jabatan yg sama dan Jawatan yg sama, borang tak jadi 2 kali (duplicate)
    let mapBorang = new Map(); 

    try {
        // --- CARIAN 1: Berdasarkan JABATAN ASAL KJ ---
        if (namaJabatanKJ && namaJabatanKJ !== "") {
            const snapJabatan = await db.collection('application')
                .where('status', '==', 'Menunggu Pengesahan Ketua Jabatan')
                .where('jabatan_unit', '==', namaJabatanKJ)
                .get();
            
            snapJabatan.forEach(doc => { mapBorang.set(doc.id, { id: doc.id, data: doc.data() }); });
        }

        // --- CARIAN 2: Berdasarkan KOTAK PENEMPATAN (Jika KJ ada set jawatan) ---
        if (arrayPenempatanKJ.length > 0) {
            // Firebase hanya benarkan max 10 carian 'in'. Kita pecahkan kepada kumpulan 10
            const chunks = [];
            for (let i = 0; i < arrayPenempatanKJ.length; i += 10) {
                chunks.push(arrayPenempatanKJ.slice(i, i + 10));
            }

            for (const chunk of chunks) {
                const snapJawatan = await db.collection('application')
                    .where('status', '==', 'Menunggu Pengesahan Ketua Jabatan')
                    .where('jawatan', 'in', chunk)
                    .get();
                
                snapJawatan.forEach(doc => { mapBorang.set(doc.id, { id: doc.id, data: doc.data() }); });
            }
        }

        // --- GABUNG & PAPARKAN KEPUTUSAN ---
        senaraiPermohonanKJSemasa = Array.from(mapBorang.values());
        document.getElementById('kiraanPending').innerText = senaraiPermohonanKJSemasa.length;

        if (senaraiPermohonanKJSemasa.length === 0) {
            container.innerHTML = `
                <div class="text-center p-5 bg-white rounded-4 shadow-sm border">
                    <i class="fa-solid fa-mug-hot fa-3x text-muted opacity-25 mb-3"></i>
                    <h6 class="text-dark fw-bold">Tiada Permohonan Baharu</h6>
                    <p class="small text-muted mb-0">Semua permohonan staf di bawah seliaan anda telah disemak.</p>
                </div>`;
            return;
        }

        container.innerHTML = ''; 
        senaraiPermohonanKJSemasa.sort((a, b) => (a.data.created_time?.toMillis() || 0) - (b.data.created_time?.toMillis() || 0));
        
        senaraiPermohonanKJSemasa.forEach((borang) => { 
            container.innerHTML += binaKadKJ(borang.id, borang.data); 
        });

    } catch (error) {
        console.error("Ralat memuatkan rekod:", error);
        container.innerHTML = `<p class="text-danger text-center"><i class="fa-solid fa-triangle-exclamation me-2"></i>Ralat carian data (Periksa Index di Console F12).</p>`;
    }
}

// ==========================================
// 2B. LUKIS UI KAD PERMOHONAN KHAS KJ
// ==========================================
function binaKadKJ(appId, data) {
    const namaStaf = data.nama_penuh || "STAF TIDAK DIKETAHUI";
    const hurufMula = namaStaf.charAt(0);
    const tarikhHantar = data.created_time ? data.created_time.toDate().toLocaleDateString('ms-MY') : "-";
    
    let yuran = data.jumlah_yuran && data.jumlah_yuran !== "-" ? data.jumlah_yuran : "Tiada / Tajaan";

    return `
    <div class="app-card shadow-sm p-4">
        <div class="row align-items-center">
            <div class="col-md-5 d-flex align-items-center mb-3 mb-md-0">
                <div class="staf-avatar-small me-3 shadow-sm flex-shrink-0">${hurufMula}</div>
                <div>
                    <h6 class="fw-bold text-dark mb-1" style="font-size:0.95rem;">${namaStaf}</h6>
                    <p class="small text-muted mb-0"><i class="fa-solid fa-id-badge me-1"></i> ${data.jawatan} (${data.gred_jawatan})</p>
                    <p class="small text-primary mb-0 fw-bold mt-1"><i class="fa-solid fa-tag me-1"></i> ${data.kategori_permohonan || "Peruntukan HASA"}</p>
                </div>
            </div>
            
            <div class="col-md-4 mb-3 mb-md-0 border-start ps-md-4">
                <p class="small text-muted fw-bold mb-1">Tajuk Kursus:</p>
                <h6 class="text-dark fw-bold mb-1 lh-sm" style="font-size:0.9rem;">${data.tajuk_kursus}</h6>
                <p class="small text-muted mb-0"><i class="fa-regular fa-calendar-days me-1"></i> ${data.tarikh_kursus_text}</p>
                <p class="small text-danger fw-bold mt-1 mb-0"><i class="fa-solid fa-wallet me-1"></i> Yuran: ${yuran}</p>
            </div>
            
            <div class="col-md-3 text-md-end border-start ps-md-4 d-flex flex-column gap-2 justify-content-center">
                <button class="btn btn-sm btn-outline-secondary rounded-pill w-100 fw-bold" onclick="paparButiranKJ('${appId}')">
                    <i class="fa-regular fa-file-pdf me-1"></i> Lihat Dokumen
                </button>
                <div class="d-flex gap-2 w-100">
                    <button class="btn btn-sm btn-danger rounded-pill w-50 fw-bold shadow-sm" onclick="bukaModalTindakan('${appId}', 'tolak')">
                        <i class="fa-solid fa-xmark"></i> Tolak
                    </button>
                    <button class="btn btn-sm btn-success rounded-pill w-50 fw-bold shadow-sm" onclick="bukaModalTindakan('${appId}', 'sokong')">
                        <i class="fa-solid fa-check"></i> Sokong
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
}

// ==========================================
// 3. FUNGSI BUTIRAN PENUH (MODAL) - DIKEMAS KINI
// ==========================================
function paparButiranKJ(appId) {
    const borang = senaraiPermohonanKJSemasa.find(b => b.id === appId);
    if (!borang) return;
    const data = borang.data;
    
    let yuran = data.jumlah_yuran && data.jumlah_yuran !== "-" ? data.jumlah_yuran : "Tiada / Tajaan";

    // --- BINA BUTANG LIHAT UNTUK SEMUA DOKUMEN ---
    let dokHTML = `<div class="d-flex flex-wrap gap-2 mt-2">`;
    
    // PENAPIS PINTAR: Pastikan data wujud DAN panjang aksara melebihi 100 (sah fail PDF Base64)
    if (data.file_brosur && data.file_brosur.length > 100) {
        dokHTML += `<button type="button" onclick="lihatPDF('${appId}', 'brosur')" class="btn btn-sm btn-outline-danger shadow-sm"><i class="fa-solid fa-file-pdf me-1"></i> Brosur / Poster</button>`;
    }
    if (data.file_tentatif && data.file_tentatif.length > 100) {
        dokHTML += `<button type="button" onclick="lihatPDF('${appId}', 'tentatif')" class="btn btn-sm btn-outline-danger shadow-sm"><i class="fa-solid fa-file-pdf me-1"></i> Tentatif</button>`;
    }
    if (data.file_resit && data.file_resit.length > 100) {
        dokHTML += `<button type="button" onclick="lihatPDF('${appId}', 'resit')" class="btn btn-sm btn-outline-danger shadow-sm"><i class="fa-solid fa-file-pdf me-1"></i> Resit Bayaran</button>`;
    }
    if (data.file_kertas_kerja && data.file_kertas_kerja.length > 100) {
        dokHTML += `<button type="button" onclick="lihatPDF('${appId}', 'kertas_kerja')" class="btn btn-sm btn-outline-danger shadow-sm"><i class="fa-solid fa-file-pdf me-1"></i> Slaid Pembentangan</button>`;
    }
    
    // Semak untuk senarai fail tambahan (Lampiran) jika ada
    if (data.file_sokongan && Array.isArray(data.file_sokongan) && data.file_sokongan.length > 0) {
        data.file_sokongan.forEach((fail, index) => {
            if (fail && fail.length > 100) {
                dokHTML += `<button type="button" onclick="lihatPDF('${appId}', 'tambahan', ${index})" class="btn btn-sm btn-outline-secondary shadow-sm"><i class="fa-solid fa-file-pdf me-1"></i> Lampiran ${index+1}</button>`;
            }
        });
    }
    
    // Jika tiada satu pun butang berjaya dilukis, paparkan teks "Tiada dokumen"
    if (dokHTML === `<div class="d-flex flex-wrap gap-2 mt-2">`) {
        dokHTML = `<span class="small text-muted fst-italic">Tiada dokumen sokongan lain dilampirkan.</span>`;
    } else {
        dokHTML += `</div>`;
    }

    const htmlButiran = `
        <table class="table table-borderless table-sm mb-3">
            <tr><td width="35%" class="text-muted fw-bold">Nama Pemohon</td><td>: <span class="fw-bold text-dark">${data.nama_penuh}</span></td></tr>
            <tr><td class="text-muted fw-bold">Jawatan & Gred</td><td>: ${data.jawatan} (${data.gred_jawatan})</td></tr>
            <tr><td class="text-muted fw-bold">Tajuk Kursus</td><td>: <span class="fw-bold text-primary">${data.tajuk_kursus}</span></td></tr>
            <tr><td class="text-muted fw-bold">Tarikh</td><td>: ${data.tarikh_kursus_text}</td></tr>
            <tr><td class="text-muted fw-bold">Tempat</td><td>: ${data.tempat_kursus}</td></tr>
            <tr><td class="text-muted fw-bold">Jumlah Yuran</td><td>: <span class="text-danger fw-bold">${yuran}</span></td></tr>
        </table>
        <div class="bg-light p-3 rounded-3 border">
            <h6 class="fw-bold text-dark mb-2 border-bottom pb-2"><i class="fa-solid fa-paperclip me-2"></i>Senarai Dokumen Pemohon</h6>
            ${dokHTML}
        </div>
    `;
    
    document.getElementById('kandunganButiranKJ').innerHTML = htmlButiran;
    new bootstrap.Modal(document.getElementById('modalButiranKJ')).show();
}

// ==========================================
// 4. FUNGSI SOKONG / TOLAK
// ==========================================
function bukaModalTindakan(appId, jenis) {
    document.getElementById('hideAppIdKJ').value = appId;
    document.getElementById('hideTindakanKJ').value = jenis;
    document.getElementById('catatanKJText').value = ""; 

    const header = document.getElementById('modalTindakanHeader');
    const title = document.getElementById('modalTindakanTitle');
    const desc = document.getElementById('modalTindakanDesc');
    const btn = document.getElementById('btnSahkanTindakan');

    if (jenis === 'sokong') {
        header.className = "modal-header bg-success text-white";
        title.innerHTML = '<i class="fa-solid fa-check-circle me-2"></i>Sokong Permohonan';
        desc.innerText = "Anda bersetuju untuk menyokong permohonan staf ini. Borang ini akan dihantar ke pihak HR untuk kelulusan bajet seterusnya.";
        btn.className = "btn btn-success rounded-pill px-4 shadow-sm fw-bold";
        btn.innerText = "Sokong & Hantar ke HR";
    } else {
        header.className = "modal-header bg-danger text-white";
        title.innerHTML = '<i class="fa-solid fa-xmark-circle me-2"></i>Tolak Permohonan';
        desc.innerText = "Anda memilih untuk menolak permohonan staf ini. Borang ini akan dipulangkan kembali kepada staf untuk tindakan lanjut.";
        btn.className = "btn btn-danger rounded-pill px-4 shadow-sm fw-bold";
        btn.innerText = "Tolak Permohonan";
    }
    
    new bootstrap.Modal(document.getElementById('modalTindakanKJ')).show();
}

async function prosesTindakanKJ() {
    const appId = document.getElementById('hideAppIdKJ').value;
    const jenis = document.getElementById('hideTindakanKJ').value;
    const catatan = document.getElementById('catatanKJText').value.trim();

    const kjUser = auth.currentUser;
    if (!kjUser) return;

    let statusBaharu = jenis === 'sokong' ? "Menunggu Kelulusan HR" : "REJECTED";
    let keputusanTeks = jenis === 'sokong' ? "Disokong oleh Ketua Jabatan" : "Ditolak oleh Ketua Jabatan";

    if (jenis === 'tolak' && catatan === "") {
        showCustomToast('error', 'Sila Isi Catatan', 'Sila berikan ulasan / sebab penolakan untuk rujukan staf.');
        return;
    }

    bootstrap.Modal.getInstance(document.getElementById('modalTindakanKJ')).hide();
    showCustomLoader("Merekod Keputusan Secara Digital...");

    const borang = senaraiPermohonanKJSemasa.find(b => b.id === appId);
    const dataBorang = borang ? borang.data : null;

    let namaKJSemasa = "Ketua Jabatan";
    try {
        const kjDoc = await db.collection('users').doc(kjUser.uid).get();
        if (kjDoc.exists) namaKJSemasa = kjDoc.data().namaPenuh || "Ketua Jabatan";
    } catch(e) { console.error("Gagal ambil nama KJ", e); }

    let dataUpdate = {
        status: statusBaharu,
        keputusan: keputusanTeks,
        catatan_kj: catatan,
        disokong_oleh_nama: namaKJSemasa,
        disokong_oleh_email: kjUser.email,
        tarikh_disokong: firebase.firestore.FieldValue.serverTimestamp(),
        kj_action_time: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('application').doc(appId).update(dataUpdate).then(() => {
        if (dataBorang && dataBorang.email_rasmi) {
            let ayatEmel = `Salam ${dataBorang.nama_penuh},\n\n`;
            ayatEmel += `Permohonan anda untuk kursus ${dataBorang.tajuk_kursus} telah disemak dan ${jenis === 'sokong' ? 'disokong' : 'ditolak'} oleh Ketua Jabatan.\n\n`;
            ayatEmel += `Disahkan oleh: ${namaKJSemasa} (${kjUser.email})\n`;
            ayatEmel += `Catatan KJ: ${catatan || "Tiada ulasan tambahan."}\n\n`;
            
            if (jenis === 'sokong') ayatEmel += `Permohonan anda kini sedang menunggu semakan akhir dan kelulusan daripada pihak HR.\n\n`;
            else ayatEmel += `Sila log masuk ke sistem e-Latihan untuk menyemak maklumat lanjut dan membatalkan atau memohon semula kursus ini.\n\n`;
            ayatEmel += `Terima kasih.`;

            const templateParams = { to_email: dataBorang.email_rasmi, subjek_emel: `Status Permohonan e-Latihan: ${keputusanTeks}`, kandungan_emel: ayatEmel };

            if(typeof emailjs !== "undefined") {
                emailjs.send("service_pryuhiu", "template_h9eddz7", templateParams, "Fevnjv1nV60-D-GvC")
                .catch((err) => console.error("Gagal hantar e-mel:", err));
            }
        }

        hideCustomLoader();
        showCustomToast('success', 'Pengesahan Berjaya!', 'Keputusan direkodkan dan staf telah dimaklumkan.');
        setTimeout(() => { tarikPermohonanStafBawahan(); tarikSejarahKJ(); }, 2000);

    }).catch(error => {
        hideCustomLoader();
        console.error(error);
        showCustomToast('error', 'Gagal', 'Sistem menghadapi ralat teknikal. Sila cuba lagi.');
    });
}

// ==========================================
// 4A. FUNGSI PAPAR PDF (Teknik BLOB)
// ==========================================
function lihatPDF(appId, jenisDoc, index = 0) {
    const borang = senaraiPermohonanKJSemasa.find(b => b.id === appId);
    if (!borang) return;
    const data = borang.data;
    
    let base64Data = "";
    if (jenisDoc === 'brosur') base64Data = data.file_brosur;
    else if (jenisDoc === 'tentatif') base64Data = data.file_tentatif;
    else if (jenisDoc === 'resit') base64Data = data.file_resit;
    else if (jenisDoc === 'kertas_kerja') base64Data = data.file_kertas_kerja;
    else if (jenisDoc === 'tambahan') base64Data = data.file_sokongan[index];

    if (!base64Data) { showCustomToast('error', 'Ralat', 'Dokumen tidak dijumpai.'); return; }

    try {
        let base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
        const byteCharacters = atob(base64String);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        const blobUrl = URL.createObjectURL(blob);
        const pdfWindow = window.open(blobUrl, '_blank');
        if (!pdfWindow) showCustomToast('error', 'Pop-up Dihalang', 'Sila benarkan "Pop-up" pada browser anda.');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
        console.error("Gagal membuka PDF:", error);
        showCustomToast('error', 'Dokumen Rosak', 'Maaf, fail ini tidak dapat dibuka.');
    }
}

// ==========================================
// 5. FUNGSI TARIK SEJARAH (DENGAN NAMA PENGESAH/AUDIT TRAIL)
// ==========================================
async function tarikSejarahKJ() {
    const container = document.getElementById('senaraiSejarahKJContainer');
    if (!container) return;

    let mapSejarah = new Map();

    try {
        // CARIAN 1: JABATAN
        if (namaJabatanKJ && namaJabatanKJ !== "") {
            const snapJabatan = await db.collection('application')
                .where('jabatan_unit', '==', namaJabatanKJ)
                .get();
            
            snapJabatan.forEach(doc => {
                const data = doc.data();
                if (data.kj_action_time || data.tarikh_disokong || data.keputusan) mapSejarah.set(doc.id, { id: doc.id, data: data });
            });
        }

        // CARIAN 2: KOTAK JAWATAN MATRIKS
        if (arrayPenempatanKJ.length > 0) {
            const chunks = [];
            for (let i = 0; i < arrayPenempatanKJ.length; i += 10) chunks.push(arrayPenempatanKJ.slice(i, i + 10));

            for (const chunk of chunks) {
                const snapJawatan = await db.collection('application')
                    .where('jawatan', 'in', chunk)
                    .get();
                
                snapJawatan.forEach(doc => {
                    const data = doc.data();
                    if (data.kj_action_time || data.tarikh_disokong || data.keputusan) mapSejarah.set(doc.id, { id: doc.id, data: data });
                });
            }
        }

        // GABUNGKAN & PAPAR
        let sejarah = Array.from(mapSejarah.values());

        if (sejarah.length === 0) {
            container.innerHTML = `<tr><td colspan="4" class="text-center text-muted p-4">Tiada rekod pengesahan setakat ini.</td></tr>`;
            return;
        }

        // SUSUN: Dari terkini
        sejarah.sort((a, b) => {
            const timeA = a.data.kj_action_time ? a.data.kj_action_time.toMillis() : (a.data.tarikh_disokong ? a.data.tarikh_disokong.toMillis() : 0);
            const timeB = b.data.kj_action_time ? b.data.kj_action_time.toMillis() : (b.data.tarikh_disokong ? b.data.tarikh_disokong.toMillis() : 0);
            return timeB - timeA;
        });

        // Paparkan 30 rekod terkini di dalam scroll box
        const sejarahTerhad = sejarah.slice(0, 30);
        container.innerHTML = '';
        sejarahTerhad.forEach(borang => {
            const d = borang.data;
            
            let masaTindakan = d.kj_action_time || d.tarikh_disokong;
            let tarikhTeks = "-";
            if (masaTindakan) {
                const dt = masaTindakan.toDate();
                tarikhTeks = dt.toLocaleDateString('ms-MY') + '<br><small class="text-muted">' + dt.toLocaleTimeString('ms-MY', {hour: '2-digit', minute:'2-digit'}) + '</small>';
            }

            let keputusanTeks = d.keputusan || "Tiada Maklumat";
            let lencana = keputusanTeks.includes('Ditolak') 
                ? `<span class="badge bg-danger rounded-pill px-2 py-1"><i class="fa-solid fa-xmark me-1"></i>Ditolak</span>`
                : `<span class="badge bg-success rounded-pill px-2 py-1"><i class="fa-solid fa-check me-1"></i>Disokong</span>`;

            // 👉 KEMAS KINI: Tarik nama KJ yang mengesahkan borang ini
            let namaTukangSah = d.disokong_oleh_nama || "Ketua Jabatan / Pentadbir";

            container.innerHTML += `
                <tr>
                    <td class="ps-4 py-3 align-middle">${tarikhTeks}</td>
                    <td class="align-middle fw-bold text-dark" style="font-size: 0.9rem;">${d.nama_penuh || "Staf"}<br><span class="badge bg-light text-dark border mt-1">${d.jawatan || "-"}</span></td>
                    <td class="align-middle small text-primary fw-bold">${d.tajuk_kursus || "-"}</td>
                    <td class="align-middle">
                        ${lencana}
                        
                        <div class="mt-1 mb-1" style="font-size: 0.8rem; color: #475569;">
                            <i class="fa-solid fa-user-pen me-1 opacity-75"></i>Oleh: <b class="text-dark">${namaTukangSah}</b>
                        </div>
                        
                        <small class="text-muted fst-italic d-block" style="line-height: 1.2;">"${d.catatan_kj || 'Tiada catatan'}"</small>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Ralat tarik sejarah:", err);
    }
}