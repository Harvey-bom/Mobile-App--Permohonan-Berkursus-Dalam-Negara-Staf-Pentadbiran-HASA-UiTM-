// ==========================================
// SEMAK STATUS LOG MASUK & TARIK REKOD
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        // Tarik permohonan khusus untuk staf yang sedang login sahaja
        const userRef = db.doc('users/' + user.uid);
        
        // KITA BUANG '.orderBy()' DI SINI SUPAYA FIREBASE TAK MARAH
        db.collection('application')
          .where('created_by', '==', userRef)
          .get()
          .then((snapshot) => {
              const container = document.getElementById('senaraiPermohonanContainer');
              
              if (snapshot.empty) {
                  container.innerHTML = `
                    <div class="text-center p-5 bg-white rounded-4 shadow-sm border">
                        <i class="fa-solid fa-folder-open fa-3x text-muted opacity-25 mb-3"></i>
                        <h6 class="text-dark fw-bold">Tiada Rekod Permohonan</h6>
                        <p class="small text-muted mb-0">Anda belum membuat sebarang permohonan latihan.</p>
                        <a href="permohonan.html" class="btn btn-primary mt-3 rounded-pill px-4">Mohon Sekarang</a>
                    </div>`;
                  return;
              }

              container.innerHTML = ''; // Kosongkan text loading
              
              // --- TRIK: KITA SUSUN DATA MENGGUNAKAN JAVASCRIPT ---
              let senaraiBorang = [];
              snapshot.forEach((doc) => {
                  senaraiBorang.push({ id: doc.id, data: doc.data() });
              });

              // Susun dari yang paling baru (descending)
              senaraiBorang.sort((a, b) => {
                  let masaA = a.data.created_time ? a.data.created_time.toMillis() : 0;
                  let masaB = b.data.created_time ? b.data.created_time.toMillis() : 0;
                  return masaB - masaA; 
              });

              // Bina Kad UI untuk setiap borang yang telah disusun
              senaraiBorang.forEach((borang) => {
                  container.innerHTML += binaKadStatus(borang.id, borang.data);
              });
          })
          .catch((error) => {
              console.error("Ralat memuatkan rekod:", error);
              document.getElementById('senaraiPermohonanContainer').innerHTML = `<p class="text-danger text-center"><i class="fa-solid fa-triangle-exclamation me-2"></i>Gagal memuatkan rekod. Sila cuba lagi.</p>`;
          });
    } else {
        window.location.replace("index.html");
    }
});

// ==========================================
// FUNGSI MELUKIS UI TIMELINE & KOTAK
// ==========================================
function binaKadStatus(appId, data) {
    const tajuk = data.tajuk_kursus || "KURSUS TANPA TAJUK";
    const tarikh = data.tarikh_kursus_text || "-";
    const statusSemasa = data.status || "Dalam Semakan";
    const statusTuntutan = data.status_tuntutan || "Belum Selesai";

    // Format tarikh hantar borang
    let tarikhHantar = "Baru sahaja";
    if (data.created_time) {
        const dateObj = data.created_time.toDate();
        tarikhHantar = dateObj.toLocaleDateString('ms-MY') + " " + dateObj.toLocaleTimeString('ms-MY', {hour: '2-digit', minute:'2-digit'});
    }

    // --- LOGIK TIMELINE SHOPEE ---
    let timelineHTML = '';
    let lencanaStatusUtama = '';

    // 1. TAHAP: BARU HANTAR (Sentiasa Aktif)
    timelineHTML += `
        <div class="timeline-item">
            <div class="timeline-node node-blue"></div>
            <div class="timeline-content">
                <h6 class="text-primary">Permohonan Diterima</h6>
                <p>Borang berjaya dihantar ke dalam sistem. Menunggu semakan awal HR.</p>
                <p class="small text-muted mt-1"><i class="fa-regular fa-clock me-1"></i>${tarikhHantar}</p>
            </div>
        </div>
    `;

    // 2. TAHAP: MESYUARAT (Muncul kalau status bukan "Dalam Semakan" / Baru)
    if (statusSemasa !== "Dalam Semakan") {
        timelineHTML += `
        <div class="timeline-item">
            <div class="timeline-node node-orange"></div>
            <div class="timeline-content">
                <h6 class="text-warning text-darken">Sedang Diproses</h6>
                <p>Permohonan telah disemak dan dibawa ke Mesyuarat Jawatankuasa / PPSM.</p>
            </div>
        </div>`;
    }

    // 3. TAHAP: KEPUTUSAN (LULUS / TOLAK)
    let isLulus = false;
    if (statusSemasa === "Lulus") {
        isLulus = true;
        lencanaStatusUtama = `<span class="badge bg-success shadow-sm rounded-pill px-3">LULUS</span>`;
        timelineHTML += `
        <div class="timeline-item">
            <div class="timeline-node node-green"></div>
            <div class="timeline-content">
                <h6 class="text-success">Permohonan Lulus</h6>
                <p>Tahniah! Permohonan anda diluluskan. Sila semak e-mel rasmi untuk surat kelulusan.</p>
                <button class="btn btn-sm btn-outline-success mt-2 rounded-pill"><i class="fa-solid fa-download me-1"></i> Muat Turun Surat Kelulusan</button>
            </div>
        </div>`;
    } 
    else if (statusSemasa === "Ditolak") {
        lencanaStatusUtama = `<span class="badge bg-danger shadow-sm rounded-pill px-3">DITOLAK</span>`;
        timelineHTML += `
        <div class="timeline-item">
            <div class="timeline-node node-red"></div>
            <div class="timeline-content">
                <h6 class="text-danger">Permohonan Ditolak</h6>
                <p>Harap maaf, permohonan anda tidak diluluskan. Sila hubungi HR untuk maklumat lanjut.</p>
            </div>
        </div>`;
    } 
    else {
        // Kalau masih dalam semakan/mesyuarat
        lencanaStatusUtama = `<span class="badge bg-primary shadow-sm rounded-pill px-3">DALAM PROSES</span>`;
    }

    // --- KOTAK TINDAKAN SELEPAS KURSUS (Hanya Muncul Jika LULUS) ---
    let postCourseHTML = '';
    if (isLulus) {
        let badgeTuntutan = statusTuntutan === "Sudah Diterima" 
            ? `<span class="badge bg-success"><i class="fa-solid fa-check-double me-1"></i>Tuntutan Selesai</span>`
            : `<span class="badge bg-warning text-dark"><i class="fa-solid fa-hourglass-half me-1"></i>Menunggu Borang A1/Sijil</span>`;

        // Kalau tuntutan dah selesai, kita sorok butang upload
        let formUploadHTML = '';
        if (statusTuntutan !== "Sudah Diterima" && statusTuntutan !== "Batal / Tidak Hadir") {
            formUploadHTML = `
            <div class="row g-2 mb-3">
                <div class="col-md-6">
                    <label class="small fw-bold mb-1 text-danger">Muat Naik Borang A1 *</label>
                    <input type="file" id="fileA1_${appId}" class="form-control form-control-sm" accept=".pdf, image/*">
                </div>
                <div class="col-md-6">
                    <label class="small fw-bold mb-1 text-danger">Muat Naik Sijil Penyertaan *</label>
                    <input type="file" id="fileSijil_${appId}" class="form-control form-control-sm" accept=".pdf, image/*">
                </div>
            </div>
            <div class="d-flex justify-content-between mt-2 pt-3 border-top">
                <button class="btn btn-sm text-white fw-bold shadow-sm" style="background-color: #0f766e;" onclick="hantarTuntutan('${appId}')">
                    <i class="fa-solid fa-cloud-arrow-up me-1"></i> Hantar Dokumen
                </button>
                <button class="btn btn-sm btn-outline-danger fw-bold shadow-sm" onclick="batalKehadiran('${appId}')">
                    <i class="fa-solid fa-user-xmark me-1"></i> Batal / Tidak Hadir
                </button>
            </div>`;
        } else {
            formUploadHTML = `<p class="small text-success fw-bold mt-2"><i class="fa-solid fa-circle-check me-1"></i> Dokumen tuntutan telah berjaya dihantar ke HR.</p>`;
        }

        postCourseHTML = `
        <div class="post-course-box shadow-sm mt-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="fw-bold text-teal mb-0" style="color:#0f766e;"><i class="fa-solid fa-file-circle-check me-2"></i>Tindakan Selepas Kursus</h6>
                ${badgeTuntutan}
            </div>
            <p class="small text-muted mb-3">Sila muat naik Borang A1 & Sijil dalam masa 7 hari selepas kursus tamat untuk proses tuntutan.</p>
            ${formUploadHTML}
        </div>
        `;
    }

    // --- CANTUMKAN SEMUA HTML UNTUK KAD INI ---
    return `
    <div class="status-card shadow-sm">
        <div class="status-header d-flex justify-content-between align-items-center" data-bs-toggle="collapse" data-bs-target="#collapse-${appId}">
            <div>
                <h6 class="fw-bold text-dark mb-1">${tajuk}</h6>
                <div class="small text-muted"><i class="fa-regular fa-calendar-days me-1"></i> ${tarikh}</div>
            </div>
            <div>
                ${lencanaStatusUtama}
                <i class="fa-solid fa-chevron-down ms-2 text-muted"></i>
            </div>
        </div>
        
        <div id="collapse-${appId}" class="collapse show p-4">
            
            <div class="tracking-timeline">
                ${timelineHTML}
            </div>

            ${postCourseHTML}

        </div>
    </div>
    `;
}

// ==========================================
// FUNGSI BATAL / TIDAK HADIR KURSUS
// ==========================================
function batalKehadiran(appId) {
    Swal.fire({
        title: 'Pengesahan Batal Kehadiran',
        text: 'Adakah anda pasti? Rekod Borang A1 dan Sijil akan ditandakan PANGKAH (X) dalam sistem Admin HR.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, Saya Tidak Hadir',
        cancelButtonText: 'Kembali'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Mengemaskini...', didOpen: () => { Swal.showLoading(); } });
            
            // Kemaskini database: Tukar status supaya Admin alert
            db.collection('application').doc(appId).update({
                status_tuntutan: 'Batal / Tidak Hadir'
            }).then(() => {
                Swal.fire('Selesai!', 'Status kehadiran anda telah dibatalkan.', 'success')
                .then(() => window.location.reload());
            });
        }
    });
}

// ==========================================
// FUNGSI MUAT NAIK BORANG A1 & SIJIL (BASE64)
// ==========================================
function prosesFailStatusKeBase64(fileInputId) {
    return new Promise((resolve, reject) => {
        const fileInput = document.getElementById(fileInputId);
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            reject("Tiada Fail"); return;
        }
        const file = fileInput.files[0];
        if (file.size > 750000) {
            reject(`Fail "${file.name}" terlalu besar (Max: 750KB).`); return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject("Ralat memproses fail.");
        reader.readAsDataURL(file);
    });
}

async function hantarTuntutan(appId) {
    const inputA1 = document.getElementById(`fileA1_${appId}`);
    const inputSijil = document.getElementById(`fileSijil_${appId}`);

    // Cek kalau staf tak letak fail
    if (!inputA1.files.length || !inputSijil.files.length) {
        Swal.fire('Perhatian', 'Sila muat naik kedua-dua dokumen (Borang A1 & Sijil) sebelum menghantar.', 'warning');
        return;
    }

    Swal.fire({ title: 'Memuat Naik...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    try {
        const base64_A1 = await prosesFailStatusKeBase64(`fileA1_${appId}`);
        const base64_Sijil = await prosesFailStatusKeBase64(`fileSijil_${appId}`);

        // Update database application
        await db.collection('application').doc(appId).update({
            file_borang_a1: base64_A1,
            file_sijil: base64_Sijil,
            status_tuntutan: 'Sudah Diterima'
        });

        Swal.fire('Berjaya!', 'Dokumen tuntutan anda telah berjaya dihantar kepada HR.', 'success')
            .then(() => window.location.reload());

    } catch (error) {
        let ralatMsg = "Ralat muat naik sistem.";
        if (typeof error === "string") ralatMsg = error;
        Swal.fire('Ralat Muat Naik', ralatMsg, 'error');
    }
}