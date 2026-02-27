// ==========================================
// 0. KASTAM UI LOADER & TOAST
// ==========================================
function showCustomLoader(textMsg = "Memproses...") { document.getElementById('loaderText').innerText = textMsg; const loader = document.getElementById('customLoader'); loader.classList.remove('d-none'); setTimeout(() => loader.classList.add('show'), 10); }
function hideCustomLoader() { const loader = document.getElementById('customLoader'); loader.classList.remove('show'); setTimeout(() => loader.classList.add('d-none'), 300); }
function showCustomToast(type, title, message) { const container = document.getElementById('toastContainer'); let iconClass = type === 'success' ? "fa-solid fa-circle-check" : "fa-solid fa-circle-exclamation"; const toast = document.createElement('div'); toast.className = `custom-toast toast-${type}`; toast.innerHTML = `<div class="toast-icon"><i class="${iconClass}"></i></div><div class="toast-content"><h6>${title}</h6><p>${message}</p></div>`; container.appendChild(toast); setTimeout(() => toast.classList.add('show'), 10); setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3500); }

// ==========================================
// 1. SISTEM KESELAMATAN & PENARIKAN DATA
// ==========================================
let senaraiPermohonanKJSemasa = [];
let namaJabatanKJ = "";

auth.onAuthStateChanged((user) => {
    if (user) {
        // SEMAKAN KESELAMATAN: Pastikan ini betul-betul Ketua Jabatan
        db.collection('users').doc(user.uid).get().then((doc) => {
            if (doc.exists) {
                const dataStaf = doc.data();
                if (dataStaf.role !== "ketua_jabatan") {
                    // TENDANG KELUAR KE DASHBOARD BIASA JIKA BUKAN KJ
                    window.location.replace("dashboard.html");
                    return;
                }
                
                namaJabatanKJ = dataStaf.jabatan_diurus || sessionStorage.getItem('jabatanKJ') || "Jabatan Tidak Diketahui";
                document.getElementById('namaJabatanTitle').innerText = namaJabatanKJ;
                
                // Tarik senarai permohonan staf di bawah jabatannya
                tarikPermohonanStafBawahan();
            }
        });
    } else {
        window.location.replace("index.html");
    }
});

function tarikPermohonanStafBawahan() {
    const container = document.getElementById('senaraiPermohonanKJContainer');
    
    db.collection('application')
      .where('jabatan_unit', '==', namaJabatanKJ)
      .where('status', '==', 'Menunggu Pengesahan Ketua Jabatan')
      .get()
      .then((snapshot) => {
          document.getElementById('kiraanPending').innerText = snapshot.size;

          if (snapshot.empty) {
              container.innerHTML = `
                <div class="text-center p-5 bg-white rounded-4 shadow-sm border">
                    <i class="fa-solid fa-mug-hot fa-3x text-muted opacity-25 mb-3"></i>
                    <h6 class="text-dark fw-bold">Tiada Permohonan Baharu</h6>
                    <p class="small text-muted mb-0">Wah, semua permohonan staf anda telah selesai disemak! Anda boleh berehat sebentar.</p>
                </div>`;
              return;
          }

          container.innerHTML = ''; 
          senaraiPermohonanKJSemasa = []; 
          
          snapshot.forEach((doc) => { senaraiPermohonanKJSemasa.push({ id: doc.id, data: doc.data() }); });
          
          // Susun borang dari paling lama (supaya KJ approve yang lama dulu)
          senaraiPermohonanKJSemasa.sort((a, b) => (a.data.created_time?.toMillis() || 0) - (b.data.created_time?.toMillis() || 0));
          
          senaraiPermohonanKJSemasa.forEach((borang) => { 
              container.innerHTML += binaKadKJ(borang.id, borang.data); 
          });
      })
      .catch((error) => {
          console.error("Ralat memuatkan rekod:", error);
          container.innerHTML = `<p class="text-danger text-center"><i class="fa-solid fa-triangle-exclamation me-2"></i>Gagal memuatkan rekod pangkalan data.</p>`;
      });
}

// ==========================================
// 2. LUKIS UI KAD PERMOHONAN KHAS KJ
// ==========================================
function binaKadKJ(appId, data) {
    const namaStaf = data.nama_penuh || "STAF TIDAK DIKETAHUI";
    const hurufMula = namaStaf.charAt(0);
    const tarikhHantar = data.created_time ? data.created_time.toDate().toLocaleDateString('ms-MY') : "-";
    
    let yuran = data.jumlah_yuran && data.jumlah_yuran !== "-" ? `RM ${data.jumlah_yuran}` : "Tiada / Tajaan";

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
// 3. FUNGSI BUTIRAN PENUH (MODAL)
// ==========================================
function paparButiranKJ(appId) {
    const borang = senaraiPermohonanKJSemasa.find(b => b.id === appId);
    if (!borang) return;
    const data = borang.data;
    
    let yuran = data.jumlah_yuran && data.jumlah_yuran !== "-" ? `RM ${data.jumlah_yuran}` : "Tiada / Tajaan";

    // --- BINA BUTANG MUAT TURUN UNTUK SEMUA DOKUMEN ---
    let dokHTML = `<div class="d-flex flex-wrap gap-2 mt-2">`;
    
    if (data.file_brosur) dokHTML += `<a href="${data.file_brosur}" download="Brosur_${data.nama_penuh}.pdf" class="btn btn-sm btn-outline-danger shadow-sm"><i class="fa-solid fa-file-pdf me-1"></i> Brosur / Poster</a>`;
    if (data.file_tentatif) dokHTML += `<a href="${data.file_tentatif}" download="Tentatif_${data.nama_penuh}.pdf" class="btn btn-sm btn-outline-danger shadow-sm"><i class="fa-solid fa-file-pdf me-1"></i> Tentatif</a>`;
    if (data.file_resit) dokHTML += `<a href="${data.file_resit}" download="Resit_${data.nama_penuh}.pdf" class="btn btn-sm btn-outline-danger shadow-sm"><i class="fa-solid fa-file-pdf me-1"></i> Resit Bayaran</a>`;
    if (data.file_kertas_kerja) dokHTML += `<a href="${data.file_kertas_kerja}" download="Pembentangan_${data.nama_penuh}.pdf" class="btn btn-sm btn-outline-danger shadow-sm"><i class="fa-solid fa-file-pdf me-1"></i> Slaid Pembentangan</a>`;
    
    // Jika ada dokumen tambahan (array)
    if (data.file_sokongan && data.file_sokongan.length > 0) {
        data.file_sokongan.forEach((fail, index) => {
            dokHTML += `<a href="${fail}" download="Tambahan_${index+1}_${data.nama_penuh}.pdf" class="btn btn-sm btn-outline-secondary shadow-sm"><i class="fa-solid fa-file-pdf me-1"></i> Lampiran ${index+1}</a>`;
        });
    }
    
    if (dokHTML === `<div class="d-flex flex-wrap gap-2 mt-2">`) {
        dokHTML = `<span class="small text-muted fst-italic">Tiada dokumen dilampirkan.</span>`;
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
// 4. FUNGSI SOKONG / TOLAK (DENGAN UPLOAD BERTAMBAH KJ)
// ==========================================

// --- A. MEMORI FAIL KJ ---
let koleksiFailKJ = [];

// --- B. LISTENER UNTUK INPUT FAIL KJ ---
document.addEventListener('DOMContentLoaded', () => {
    const inputKJ = document.getElementById('fileBrosurKJSigned');
    if (inputKJ) {
        inputKJ.addEventListener('change', function(e) {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.type !== "application/pdf") {
                    showCustomToast('error', 'Format Tidak Sah', `Fail "${file.name}" BUKAN berformat PDF.`);
                    continue;
                }
                if (file.size > 1000000) {
                    showCustomToast('error', 'Fail Terlalu Besar', `Saiz "${file.name}" melebihi 1MB.`);
                    continue;
                }
                koleksiFailKJ.push(file); // Masukkan ke dalam memori
            }
            this.value = ''; // Kosongkan input
            renderSenaraiFailKJ(); // Lukis semula
        });
    }
});

// --- C. FUNGSI LUKIS LENCANA FAIL ---
function renderSenaraiFailKJ() {
    const senaraiBekas = document.getElementById('senaraiFailKJ');
    if (!senaraiBekas) return;
    
    senaraiBekas.innerHTML = ''; 
    
    if (koleksiFailKJ.length === 0) {
        senaraiBekas.innerHTML = '<span class="text-muted small w-100 text-center opacity-50 fst-italic" style="font-size: 0.7rem;">Tiada dokumen dimuat naik.</span>';
        return;
    }

    koleksiFailKJ.forEach((file, index) => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-white text-dark border border-success px-2 py-1 text-start shadow-sm d-flex align-items-center gap-1';
        badge.style.fontSize = '0.75rem';
        
        badge.innerHTML = `
            <i class="fa-solid fa-file-pdf text-danger"></i> 
            <span class="text-truncate" style="max-width: 120px;" title="${file.name}">${file.name}</span>
            <button type="button" class="btn-close ms-1" style="font-size: 0.5rem; background-color: #fecaca; border-radius: 50%; padding: 3px;" onclick="buangFailKJ(${index})" title="Padam Fail"></button>
        `;
        senaraiBekas.appendChild(badge);
    });
}

function buangFailKJ(index) {
    koleksiFailKJ.splice(index, 1);
    renderSenaraiFailKJ();
}


// --- D. FUNGSI UTAMA BUKA MODAL ---
function bukaModalTindakan(appId, jenis) {
    document.getElementById('hideAppIdKJ').value = appId;
    document.getElementById('hideTindakanKJ').value = jenis;
    document.getElementById('catatanKJText').value = ""; 
    
    // Reset memori fail setiap kali buka modal baru
    koleksiFailKJ = [];
    renderSenaraiFailKJ();

    const header = document.getElementById('modalTindakanHeader');
    const title = document.getElementById('modalTindakanTitle');
    const desc = document.getElementById('modalTindakanDesc');
    const btn = document.getElementById('btnSahkanTindakan');
    const kotakUpload = document.getElementById('ruanganUploadKJ');

    if (jenis === 'sokong') {
        header.className = "modal-header bg-success text-white";
        title.innerHTML = '<i class="fa-solid fa-check-circle me-2"></i>Sokong Permohonan';
        desc.innerText = "Anda bersetuju untuk menyokong permohonan staf ini. Borang ini akan dihantar ke pihak HR untuk kelulusan bajet seterusnya.";
        btn.className = "btn btn-success rounded-pill px-4 shadow-sm fw-bold";
        btn.innerText = "Sokong & Hantar ke HR";
        if(kotakUpload) kotakUpload.classList.remove('d-none'); 
    } else {
        header.className = "modal-header bg-danger text-white";
        title.innerHTML = '<i class="fa-solid fa-xmark-circle me-2"></i>Tolak Permohonan';
        desc.innerText = "Anda memilih untuk menolak permohonan staf ini. Borang ini akan dipulangkan kembali kepada staf.";
        btn.className = "btn btn-danger rounded-pill px-4 shadow-sm fw-bold";
        btn.innerText = "Tolak Permohonan";
        if(kotakUpload) kotakUpload.classList.add('d-none'); 
    }
    
    new bootstrap.Modal(document.getElementById('modalTindakanKJ')).show();
}

// --- E. FUNGSI PROSES DAN HANTAR DATA ---
async function prosesTindakanKJ() {
    const appId = document.getElementById('hideAppIdKJ').value;
    const jenis = document.getElementById('hideTindakanKJ').value;
    const catatan = document.getElementById('catatanKJText').value.trim();

    let statusBaharu = jenis === 'sokong' ? "Menunggu Kelulusan HR" : "REJECTED";
    let keputusanTeks = jenis === 'sokong' ? "Disokong oleh Ketua Jabatan" : "Ditolak oleh Ketua Jabatan";

    if (jenis === 'tolak' && catatan === "") {
        showCustomToast('error', 'Sila Isi Catatan', 'Sila berikan ulasan / sebab penolakan untuk rujukan staf.');
        return;
    }

    // --- PROSES SEMUA FAIL DALAM ARRAY KE BASE64 ---
    let senaraiBase64KJ = [];
    if (jenis === 'sokong' && koleksiFailKJ.length > 0) {
        showCustomLoader("Memproses Dokumen...");
        for (let i = 0; i < koleksiFailKJ.length; i++) {
            try {
                const base64 = await new Promise((res, rej) => {
                    const reader = new FileReader();
                    reader.onload = () => res(reader.result);
                    reader.onerror = () => rej(null);
                    reader.readAsDataURL(koleksiFailKJ[i]);
                });
                if (base64) senaraiBase64KJ.push(base64);
            } catch (error) {
                console.error("Gagal convert fail ke Base64");
            }
        }
    }

    bootstrap.Modal.getInstance(document.getElementById('modalTindakanKJ')).hide();
    showCustomLoader("Merekod Keputusan & Menghantar E-mel...");

    const borang = senaraiPermohonanKJSemasa.find(b => b.id === appId);
    const dataBorang = borang ? borang.data : null;

    let dataUpdate = {
        status: statusBaharu,
        keputusan: keputusanTeks,
        catatan_kj: catatan,
        kj_action_time: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Jika ada senarai fail disahkan, simpan sebagai ARRAY dalam field baru
    if (senaraiBase64KJ.length > 0) {
        dataUpdate.file_dokumen_kj_signed = senaraiBase64KJ; // Simpan array fail
    }

    db.collection('application').doc(appId).update(dataUpdate).then(() => {
        
        // HANTAR E-MEL NOTIFIKASI KEPADA STAF
        if (dataBorang && dataBorang.email_rasmi) {
            let ayatEmel = `Salam ${dataBorang.nama_penuh},\n\n`;
            ayatEmel += `Permohonan anda untuk kursus ${dataBorang.tajuk_kursus} telah disemak oleh Ketua Jabatan.\n\n`;
            ayatEmel += `Keputusan: ${keputusanTeks}\n`;
            ayatEmel += `Catatan KJ: ${catatan || "Tiada ulasan tambahan."}\n\n`;
            ayatEmel += `Sila log masuk ke sistem e-Latihan untuk maklumat lanjut.\n\nTerima kasih.`;

            const templateParams = {
                to_email: dataBorang.email_rasmi,
                subjek_emel: `Status Permohonan e-Latihan: ${keputusanTeks}`,
                kandungan_emel: ayatEmel
            };

            if(typeof emailjs !== "undefined") {
                emailjs.send("service_pryuhiu", "template_h9eddz7", templateParams, "Fevnjv1nV60-D-GvC")
                .then(() => console.log("E-mel berjaya dihantar ke staf!"))
                .catch((err) => console.error("Gagal hantar e-mel:", err));
            }
        }

        hideCustomLoader();
        showCustomToast('success', 'Selesai!', 'Keputusan direkodkan dan staf telah dimaklumkan.');
        setTimeout(() => { tarikPermohonanStafBawahan(); }, 2000);

    }).catch(error => {
        hideCustomLoader();
        console.error(error);
        showCustomToast('error', 'Gagal', 'Sistem menghadapi ralat teknikal. Sila cuba lagi.');
    });
}