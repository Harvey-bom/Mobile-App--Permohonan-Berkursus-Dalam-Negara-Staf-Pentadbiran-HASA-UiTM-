// ==========================================
// 1. UI LOADER & TOAST (Pengganti SweetAlert)
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
    toast.innerHTML = `<div class="toast-icon"><i class="${iconClass}"></i></div><div class="toast-content"><h6>${title}</h6><p>${message}</p></div>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3500);
}

// ==========================================
// 2. LOG MASUK & TARIK REKOD DARI FIRESTORE
// ==========================================
let semuaPermohonanStaf = [];

auth.onAuthStateChanged((user) => {
    if (user) {
        const userRef = db.doc('users/' + user.uid);
        db.collection('application').where('created_by', '==', userRef).get()
          .then((snapshot) => {
              const container = document.getElementById('senaraiPermohonanContainer');
              if (snapshot.empty) {
                  container.innerHTML = `
                    <div class="text-center p-5 bg-white rounded-4 shadow-sm border">
                        <i class="fa-solid fa-folder-open fa-3x text-muted opacity-25 mb-3"></i>
                        <h6 class="text-dark fw-bold">Tiada Rekod Permohonan</h6>
                        <p class="small text-muted mb-0">Anda belum membuat sebarang permohonan latihan.</p>
                        <a href="permohonan.html" class="btn btn-primary mt-3 rounded-pill px-4 shadow-sm">Mohon Sekarang</a>
                    </div>`;
                  return;
              }

              container.innerHTML = ''; 
              semuaPermohonanStaf = []; 
              
              snapshot.forEach((doc) => { semuaPermohonanStaf.push({ id: doc.id, data: doc.data() }); });
              semuaPermohonanStaf.sort((a, b) => (b.data.created_time?.toMillis() || 0) - (a.data.created_time?.toMillis() || 0));
              semuaPermohonanStaf.forEach((borang) => { container.innerHTML += binaKadStatus(borang.id, borang.data); });
          })
          .catch((error) => {
              console.error("Ralat memuatkan rekod:", error);
              document.getElementById('senaraiPermohonanContainer').innerHTML = `<p class="text-danger text-center"><i class="fa-solid fa-triangle-exclamation me-2"></i>Gagal memuatkan rekod pangkalan data.</p>`;
          });
    } else {
        window.location.replace("index.html");
    }
});

// ==========================================
// 3. FUNGSI MELUKIS UI KAD & TIMELINE (GAYA SHOPEE PENUH - 4 TAHAP)
// ==========================================
function binaKadStatus(appId, data) {
    const tajuk = data.tajuk_kursus || "KURSUS TANPA TAJUK";
    const tarikh = data.tarikh_kursus_text || "-";
    const statusDB = data.status || "Menunggu Pengesahan Ketua Jabatan";
    const keputusanText = data.keputusan || "Belum Diputuskan";
    const statusTuntutan = data.status_tuntutan || "Belum Selesai";

    // PENTING: Padam 'Lulus' dari isLulus supaya tak ter-trigger ke tahap akhir terlalu awal!
    let isLulus = (statusDB === 'APPROVED' || statusDB === 'Selesai'); 
    let isTolak = (statusDB === 'REJECTED' || statusDB === 'Ditolak');
    let isBatal = (statusDB === 'DIBATALKAN');
    
    let isTungguKJ = (statusDB === 'Menunggu Pengesahan Ketua Jabatan');
    
    // KEMAS KINI: Masukkan 'Lulus' ke dalam logik Urusetia, 
    // kerana walaupun bajet dah lulus, Urusetia belum tekan butang "Hantar Semakan"
    let isTungguHR = (statusDB === 'Menunggu Kelulusan HR' || statusDB === 'Lulus'); 
    
    let isTungguKetuaUnit = (statusDB === 'Menunggu Semakan Ketua Unit');
    let isDitangguhkan = (statusDB === 'DITANGGUHKAN' || statusDB === 'KIV');
    let isDikembalikan = (statusDB && (statusDB.toLowerCase().includes("pulang") || statusDB.toLowerCase().includes("kembali")));

    // Tentukan Lencana Utama di Penjuru Atas Kanan
    let badgeColor = "bg-warning text-dark";
    let badgeIcon = "fa-hourglass-half";
    let badgeText = "DALAM PROSES";

    if (isLulus) { badgeColor = "bg-success"; badgeIcon = "fa-check-double"; badgeText = "LULUS"; }
    else if (isTolak) { badgeColor = "bg-danger"; badgeIcon = "fa-xmark"; badgeText = "DITOLAK"; }
    else if (isBatal) { badgeColor = "bg-secondary"; badgeIcon = "fa-ban"; badgeText = "DIBATALKAN"; }
    else if (isTungguKetuaUnit) { badgeColor = "bg-info text-dark border border-info border-opacity-25"; badgeIcon = "fa-user-shield"; badgeText = "SEMAKAN KETUA UNIT"; }
    else if (isTungguHR) { badgeColor = "bg-primary text-white shadow-sm"; badgeIcon = "fa-user-tie"; badgeText = "MENUNGGU URUSETIA"; }
    else if (isTungguKJ) { badgeColor = "bg-warning text-dark"; badgeIcon = "fa-user-clock"; badgeText = "MENUNGGU KJ"; }
    else if (isDitangguhkan) { 
    badgeColor = "bg-secondary text-white"; 
    badgeIcon = "fa-pause-circle"; 
    badgeText = "DITANGGUHKAN"; 
}
else if (isDikembalikan) { 
    badgeColor = "bg-warning text-dark"; 
    badgeIcon = "fa-reply"; 
    badgeText = "PERLU PEMBETULAN"; 
}

    let lencanaStatusUtama = `<span class="badge ${badgeColor} shadow-sm rounded-pill px-3 py-2"><i class="fa-solid ${badgeIcon} me-1"></i> ${badgeText}</span>`;

    // --- TETAPAN MASA (TIMESTAMP) PINTAR GAYA SHOPEE ---
    function formatMasa(timestampObj) {
        if (!timestampObj) return "";
        try {
            const d = timestampObj.toDate ? timestampObj.toDate() : new Date(timestampObj);
            return `<p class="small text-muted mt-1 fw-bold mb-0" style="font-size: 0.8rem;"><i class="fa-regular fa-clock me-1"></i>${d.toLocaleDateString('ms-MY')} ${d.toLocaleTimeString('ms-MY', {hour: '2-digit', minute:'2-digit'})}</p>`;
        } catch(e) {
            return "";
        }
    }

    // Tangkap masa-masa kritikal dari Firebase
    let masaHantar = formatMasa(data.created_time || data.createdAt);
    let masaKJ = formatMasa(data.kj_action_time || data.tarikh_disokong);
    let masaUrusetia = formatMasa(data.sentToReviewAt); // Masa Urusetia hantar ke Puan Shafika
    
    let masaHR = "";
    if (isLulus || isTolak) {
        masaHR = formatMasa(data.tarikh_lulus_sv || data.decision_time || data.updatedAt || data.tarikh_surat_dijana);
    }
    
    let masaBatal = formatMasa(data.updatedAt || data.updated_at);

    // --- BUTANG BATAL PERMOHONAN AWAL ---
    let butangBatalAwal = "";
    if (isTungguKJ) {
        butangBatalAwal = `<button class="btn btn-sm btn-outline-danger rounded-pill px-3 ms-2" onclick="bukaModalBatal('${appId}', 'permohonan')"><i class="fa-solid fa-trash-can me-1"></i>Batal Permohonan</button>`;
    }

    // --- ALIRAN GARIS MASA (TIMELINE 4 PERINGKAT) ---
    // TAHAP 1: Borang Dihantar (Sentiasa hijau)
    let timelineHTML = `
        <div class="timeline-item">
            <div class="timeline-node node-active"></div>
            <div class="timeline-content">
                <h6 class="text-success">Borang Dihantar</h6>
                <p>Permohonan telah direkodkan dalam sistem.</p>
                ${masaHantar}
            </div>
        </div>
    `;

    if (isBatal) {
        timelineHTML += `
        <div class="timeline-item">
            <div class="timeline-node node-reject"></div>
            <div class="timeline-content">
                <h6 class="text-danger">Permohonan Dibatalkan</h6>
                <p>Anda telah menarik balik dan membatalkan permohonan ini.</p>
                ${masaBatal}
            </div>
        </div>`;
    }
    else {
        // TAHAP 2: SOKONGAN KETUA JABATAN
        let kjNodeClass = "node-pending";
        let kjTextClass = "text-warning text-darken";
        let kjTitle = "Semakan Ketua Jabatan"; // <-- Dikembalikan ke format rasmi
        let kjDesc = "Menunggu sokongan dan ulasan daripada Ketua Jabatan anda."; // <-- Dikembalikan ke format rasmi

        if (isTungguHR || isTungguKetuaUnit || isLulus || (isTolak && data.kj_action_time)) {
            if (keputusanText === "Ditolak oleh Ketua Jabatan") {
                kjNodeClass = "node-reject";
                kjTextClass = "text-danger";
                kjTitle = "Ditolak oleh Ketua Jabatan";
                kjDesc = `Permohonan tidak disokong. Catatan: <em class="text-dark">"${data.catatan_kj || 'Tiada ulasan'}"</em>`;
            } else {
                kjNodeClass = "node-active";
                kjTextClass = "text-success";
                kjTitle = "Disokong oleh Ketua Jabatan";
                kjDesc = `Telah disemak dan disokong. Catatan: <em class="text-dark">"${data.catatan_kj || 'Tiada ulasan'}"</em>`;
            }
        }

        timelineHTML += `
            <div class="timeline-item">
                <div class="timeline-node ${kjNodeClass}"></div>
                <div class="timeline-content">
                    <h6 class="${kjTextClass}">${kjTitle}</h6>
                    <p>${kjDesc}</p>
                    ${masaKJ}
                </div>
            </div>
        `;

        // TAHAP 3: SEMAKAN URUSETIA BPSM (DIKEMASKINI)
if (isTungguHR || isTungguKetuaUnit || isLulus || isDitangguhkan || isDikembalikan || (isTolak && keputusanText !== "Ditolak oleh Ketua Jabatan")) {
    let hrNodeClass = "node-pending";
    let hrTextClass = "text-primary";
    let hrTitle = "Menunggu Semakan Urusetia";
    let hrDesc = "Borang sedang diproses oleh pihak BPBSM untuk kelulusan bajet / mesyuarat.";

    // LOGIK BARU: JIKA DITANGGUHKAN
    if (isDitangguhkan) {
        hrNodeClass = "node-pending"; // Kekal kuning/pending tapi dengan info baru
        hrTextClass = "text-secondary";
        hrTitle = "Keputusan: Ditangguhkan (KIV)";
        hrDesc = `Permohonan telah dibincangkan dalam mesyuarat tetapi ditangguhkan untuk sesi akan datang atau menunggu maklumat tambahan.`;
    } 
    // LOGIK BARU: JIKA DIKEMBALIKAN (PULANG)
    else if (isDikembalikan) {
        hrNodeClass = "node-reject"; // Guna warna merah/oren supaya staf alert
        hrTextClass = "text-warning text-darken";
        hrTitle = "Dikembalikan untuk Pembetulan";
        hrDesc = `Terdapat maklumat yang perlu diperbaiki atau disemak semula oleh urusetia sebelum dihantar ke peringkat akhir.`;
    }
    else if (isTungguKetuaUnit || isLulus) {
        hrNodeClass = "node-active";
        hrTextClass = "text-success";
        hrTitle = "Semakan Urusetia Selesai";
        hrDesc = "Bajet telah disemak. Draf kelulusan dihantar kepada Ketua Unit.";
    } 
    else if (isTolak) {
        hrNodeClass = "node-reject";
        hrTextClass = "text-danger";
        hrTitle = "Permohonan Ditolak";
        hrDesc = `Harap maaf, permohonan tidak diluluskan. Catatan: <em class="text-dark">"${data.catatan_hr || data.catatan || 'Tiada ulasan'}"</em>`;
    }

    timelineHTML += `
    <div class="timeline-item">
        <div class="timeline-node ${hrNodeClass}"></div>
        <div class="timeline-content">
            <h6 class="${hrTextClass}">${hrTitle}</h6>
            <p>${hrDesc}</p>
            ${(isTungguKetuaUnit || isLulus) ? masaUrusetia : (isTolak ? masaHR : '')}
        </div>
    </div>`;
}

        // TAHAP 4: PENGESAHAN KETUA UNIT BPSM (Baru)
        if (isTungguKetuaUnit || isLulus) {
            let kuNodeClass = "node-pending";
            let kuTextClass = "text-info text-darken";
            let kuTitle = "Menunggu Pengesahan Akhir";
            let kuDesc = "Menunggu semakan dan pengesahan draf surat rasmi daripada Ketua Unit BPSM.";

            if (isLulus) {
                kuNodeClass = "node-active";
                kuTextClass = "text-success";
                kuTitle = "Permohonan Lulus (Selesai)";
                kuDesc = "Tahniah! Surat kelulusan rasmi telah disahkan dan diemel kepada anda.";
            }

            timelineHTML += `
            <div class="timeline-item">
                <div class="timeline-node ${kuNodeClass}"></div>
                <div class="timeline-content">
                    <h6 class="${kuTextClass}">${kuTitle}</h6>
                    <p>${kuDesc}</p>
                    ${isLulus ? masaHR : ''}
                </div>
            </div>`;
        }
    }

    // --- KOTAK TINDAKAN KURSUS (Hanya jika lulus dan bukan Batal/Tidak Hadir) ---
    let postCourseHTML = '';
    if (isLulus && statusTuntutan !== "Batal / Tidak Hadir") {
        let borangTuntutan = '';
        if (statusTuntutan === "Belum Selesai") {
            borangTuntutan = `
            <div class="mt-4 pt-3 border-top">
                <h6 class="fw-bold text-dark mb-3"><i class="fa-solid fa-cloud-arrow-up me-2 text-primary"></i>Hantar Dokumen Rekod Latihan</h6>
                
                <div class="alert alert-info small mb-3 border-info bg-info bg-opacity-10 rounded-3 shadow-sm">
                    <i class="fa-solid fa-circle-info text-info me-2"></i><strong>Makluman Penting:</strong> Jabatan HR hanya menguruskan rekod jam latihan. Segala urusan <strong>Tuntutan Kewangan / Elaun</strong> perlu dipanjangkan berasingan kepada <strong>Jabatan Kewangan</strong>.
                </div>

                <div class="row g-3 mb-3">
                    <div class="col-md-6">
                        <label class="small fw-bold mb-1">Muat Naik Borang A1 (PDF) *</label>
                        <div class="input-group">
                            <input type="file" id="fileA1_${appId}" class="form-control form-control-sm" accept=".pdf">
                            <button class="btn btn-outline-danger btn-sm shadow-sm" type="button" onclick="padamFail('fileA1_${appId}')"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <label class="small fw-bold mb-1">Muat Naik Sijil Penyertaan (PDF) *</label>
                        <div class="input-group">
                            <input type="file" id="fileSijil_${appId}" class="form-control form-control-sm" accept=".pdf">
                            <button class="btn btn-outline-danger btn-sm shadow-sm" type="button" onclick="padamFail('fileSijil_${appId}')"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-3 border rounded-3 mb-3">
                    <label class="small fw-bold mb-2 text-dark"><i class="fa-solid fa-sack-dollar me-1 text-success"></i> Tujuan Penghantaran Dokumen:</label>
                    <select id="pilihanTuntutan_${appId}" class="form-select form-select-sm">
                        <option value="Tidak" selected>Rekod Latihan Sahaja (Tiada Tuntutan Kewangan)</option>
                        <option value="Ya">Rekod Latihan & Rujukan Tuntutan (Hubungi Jabatan Kewangan)</option>
                    </select>
                </div>
                
                <div class="d-flex justify-content-end gap-2">
                    <button class="btn btn-sm btn-outline-danger fw-bold rounded-pill px-3" onclick="bukaModalBatal('${appId}', 'kehadiran')">Batal Kehadiran</button>
                    <button class="btn btn-sm btn-success fw-bold rounded-pill px-4 shadow-sm" onclick="hantarTuntutan('${appId}')">Hantar Dokumen <i class="fa-solid fa-paper-plane ms-1"></i></button>
                </div>
            </div>`;
        } else {
            let statusClaimTeks = statusTuntutan.includes("Mohon") ? "Dokumen rujukan tuntutan & rekod latihan" : "Dokumen rekod latihan";
            borangTuntutan = `<div class="alert alert-success small mb-0 mt-3 border-success bg-success bg-opacity-10"><i class="fa-solid fa-circle-check text-success me-2"></i><strong>Berjaya:</strong> ${statusClaimTeks} anda telah dihantar.</div>`;
        }

        postCourseHTML = `
        <div class="post-course-box shadow-sm mt-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="fw-bold mb-0" style="color:#0f766e;"><i class="fa-solid fa-award me-2"></i>Tindakan Selepas Kursus</h6>
            </div>
            
            <button class="btn btn-primary rounded-pill fw-bold shadow-sm" onclick="cetakSuratLulus('${appId}')">
                <i class="fa-solid fa-file-arrow-down me-2"></i>Muat Turun Surat Kelulusan
            </button>
            <p class="small text-muted mt-2 mb-0">Sila muat turun surat ini sebagai bukti sokongan dan rujukan anda.</p>

            ${borangTuntutan}
        </div>`;
    }

    return `
    <div class="status-card shadow-sm mb-4">
        <div class="status-header d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
                <h6 class="fw-bold text-dark mb-1 fs-5">${tajuk}</h6>
                <div class="small text-muted mb-2"><i class="fa-regular fa-calendar-days me-1"></i> ${tarikh}</div>
                <div class="d-flex align-items-center mt-2">
                    <button class="btn btn-sm btn-outline-secondary rounded-pill px-3" onclick="paparButiran('${appId}')"><i class="fa-regular fa-eye me-1"></i>Lihat Butiran</button>
                    ${butangBatalAwal}
                </div>
            </div>
            <div class="text-end d-flex flex-column align-items-end">
                ${lencanaStatusUtama}
            </div>
        </div>
        
        <div class="p-4 pt-2">
            <div class="tracking-timeline">
                ${timelineHTML}
            </div>
            ${postCourseHTML}
        </div>
    </div>
    `;
}

// ==========================================
// 4. PAPAR MAKLUMAT PENUH DI MODAL
// ==========================================
function paparButiran(appId) {
    const borang = semuaPermohonanStaf.find(b => b.id === appId);
    if (!borang) return;
    const data = borang.data;
    
    let yuran = data.jumlah_yuran && data.jumlah_yuran !== "-" ? `RM ${data.jumlah_yuran}` : "Tiada / Tajaan";

    const htmlButiran = `
        <table class="table table-borderless table-sm mb-0">
            <tr><td width="30%" class="text-muted fw-bold">Tajuk Kursus</td><td>: <span class="fw-bold text-dark">${data.tajuk_kursus}</span></td></tr>
            <tr><td class="text-muted fw-bold">Tarikh</td><td>: ${data.tarikh_kursus_text}</td></tr>
            <tr><td class="text-muted fw-bold">Tempat</td><td>: ${data.tempat_kursus}</td></tr>
            <tr><td class="text-muted fw-bold">Jumlah Yuran</td><td>: <span class="text-danger fw-bold">${yuran}</span></td></tr>
            <tr><td class="text-muted fw-bold">Pembentangan</td><td>: ${data.ada_pembentangan}</td></tr>
        </table>
    `;
    
    document.getElementById('kandunganButiran').innerHTML = htmlButiran;
    const modal = new bootstrap.Modal(document.getElementById('modalButiran'));
    modal.show();
}

// ==========================================
// 5. FUNGSI MUAT NAIK A1, SIJIL & TUNTUTAN
// ==========================================
function prosesFailStatusKeBase64(fileInputId) {
    return new Promise((resolve, reject) => {
        const fileInput = document.getElementById(fileInputId);
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) { reject("Tiada Fail"); return; }
        const file = fileInput.files[0];
        if (file.type !== "application/pdf") { reject("Sila muat naik fail format PDF sahaja."); return; }
        if (file.size > 1000000) { reject(`Saiz fail melebihi 1MB.`); return; } // Had 1MB
        
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject("Ralat memproses fail.");
        reader.readAsDataURL(file);
    });
}

async function hantarTuntutan(appId) {
    const inputA1 = document.getElementById(`fileA1_${appId}`);
    const inputSijil = document.getElementById(`fileSijil_${appId}`);
    const pilihanTuntutan = document.getElementById(`pilihanTuntutan_${appId}`).value;

    if (!inputA1.files.length || !inputSijil.files.length) {
        showCustomToast('error', 'Dokumen Tidak Lengkap', 'Sila muat naik Borang A1 & Sijil terlebih dahulu.');
        return;
    }

    showCustomLoader("Menghantar Dokumen...");

    try {
        const base64_A1 = await prosesFailStatusKeBase64(`fileA1_${appId}`);
        const base64_Sijil = await prosesFailStatusKeBase64(`fileSijil_${appId}`);
        
        // Tentukan status tuntutan (Adakah nak claim atau sekadar tutup fail)
        let statusKewangan = pilihanTuntutan === "Ya" ? "Mohon Tuntutan" : "Selesai (Tiada Tuntutan)";

        await db.collection('application').doc(appId).update({
            file_borang_a1: base64_A1,
            file_sijil: base64_Sijil,
            status_tuntutan: statusKewangan
        });

        hideCustomLoader();
        showCustomToast('success', 'Berjaya!', 'Dokumen dan rekod anda telah dikemas kini.');
        setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
        hideCustomLoader();
        let ralatMsg = typeof error === "string" ? error : "Ralat pemuatnaikan.";
        showCustomToast('error', 'Gagal Menghantar', ralatMsg);
    }
}

// ==========================================
// 6. FUNGSI BATAL PERMOHONAN & KEHADIRAN (DENGAN SEBAB)
// ==========================================
function bukaModalBatal(appId, jenis) {
    document.getElementById('hideAppIdBatal').value = appId;
    document.getElementById('hideJenisBatal').value = jenis;
    
    // Kosongkan kotak teks jika staf pernah buka sebelum ni
    document.getElementById('sebabBatalText').value = "";
    
    // Ubah teks modal bergantung kepada situasi pembatalan
    if (jenis === 'permohonan') {
        document.getElementById('tajukBatal').innerText = "Batal Permohonan?";
        document.getElementById('teksBatal').innerText = "Permohonan ini akan ditarik balik sepenuhnya. Anda tidak boleh mengubahnya semula selepas ini.";
    } else {
        document.getElementById('tajukBatal').innerText = "Batal Kehadiran Kursus?";
        document.getElementById('teksBatal').innerText = "Adakah anda pasti tidak dapat hadir ke kursus yang telah diluluskan ini? Rekod kehadiran akan ditutup.";
    }
    
    const modal = new bootstrap.Modal(document.getElementById('modalBatal'));
    modal.show();
}

// ==========================================
// 6.1 FUNGSI BATALKAN PERMOHONAN (DENGAN E-MEL KE ADMIN)
// ==========================================
function prosesBatalSebenar() {
    const appId = document.getElementById('hideAppIdBatal').value;
    const jenis = document.getElementById('hideJenisBatal').value;
    const sebabBatal = document.getElementById('sebabBatalText').value.trim();
    
    // Wajibkan staf isi sebab
    if (sebabBatal === "") {
        if(typeof showCustomToast === "function") showCustomToast('error', 'Maklumat Tidak Lengkap', 'Sila nyatakan sebab pembatalan terlebih dahulu.');
        return;
    }
    
    // Tutup popup modal batal
    const modalEl = document.getElementById('modalBatal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if(modalInstance) modalInstance.hide();
    
    if(typeof showCustomLoader === "function") showCustomLoader("Membatalkan Rekod & Memaklumkan Admin...");
    
    // Sediakan data untuk dikemas kini ke Firestore
    let dataKemaskini = {};
    if (jenis === 'permohonan') {
        dataKemaskini = {
            status: "DIBATALKAN",
            keputusan: "Dibatalkan oleh Staf",
            sebab_batal: sebabBatal,
            isCompleted: true // PENTING: Supaya ia masuk ke History Admin
        };
    } else {
        dataKemaskini = {
            status_tuntutan: 'Batal / Tidak Hadir',
            sebab_batal_kehadiran: sebabBatal
        };
    }
    
    // Cari data permohonan penuh untuk dimasukkan ke dalam e-mel Admin
    const borang = semuaPermohonanStaf.find(b => b.id === appId);
    const dataBorang = borang ? borang.data : null;

    // Hantar ke Firestore Database
    db.collection('application').doc(appId).update(dataKemaskini)
      .then(() => {
          
          // --- HANTAR E-MEL KE SUPER ADMIN (HR) ---
          if (dataBorang && typeof emailjs !== "undefined") {
              let jenisBatalTeks = jenis === 'permohonan' ? "Permohonan Kursus" : "Kehadiran Kursus";
              
              // Ayat Kalis Spam (Spam-Proof)
              let ayatEmelBatal = `Salam pentadbir sistem,\n\n`;
              ayatEmelBatal += `Sistem telah merekodkan pembatalan ${jenisBatalTeks} oleh staf berikut:\n\n`;
              ayatEmelBatal += `Maklumat Staf:\n`;
              ayatEmelBatal += `Nama: ${dataBorang.nama_penuh}\n`;
              ayatEmelBatal += `E-mel: ${dataBorang.email_rasmi}\n`;
              ayatEmelBatal += `Jabatan: ${dataBorang.jabatan_unit}\n\n`;
              
              ayatEmelBatal += `Maklumat Kursus:\n`;
              ayatEmelBatal += `Tajuk: ${dataBorang.tajuk_kursus}\n`;
              ayatEmelBatal += `Tarikh: ${dataBorang.tarikh_kursus_text}\n\n`;
              
              ayatEmelBatal += `Sebab Pembatalan:\n`;
              ayatEmelBatal += `"${sebabBatal}"\n\n`;
              
              ayatEmelBatal += `Sila maklum dan kemas kini rekod pangkalan data sekiranya berkaitan.\nTerima kasih.`;

              const templateParams = {
                  to_email: "hrd@uitm.edu.my",
                  subjek_emel: `Notifikasi Pembatalan: ${dataBorang.nama_penuh}`,
                  kandungan_emel: ayatEmelBatal
              };

              // Hantar E-mel dan TUNGGU sebelum Refresh page
              emailjs.send("service_pryuhiu", "template_h9eddz7", templateParams, "Fevnjv1nV60-D-GvC")
                  .then(() => {
                      console.log("Emel batal berjaya dihantar!");
                      if(typeof hideCustomLoader === "function") hideCustomLoader();
                      if(typeof showCustomToast === "function") showCustomToast('success', 'Berjaya Dibatalkan', 'Rekod dikemas kini dan Admin telah dimaklumkan.');
                      setTimeout(() => window.location.reload(), 2000);
                  })
                  .catch((err) => {
                      console.error("Gagal hantar e-mel batal:", err);
                      if(typeof hideCustomLoader === "function") hideCustomLoader();
                      // Kalau email gagal pun, kita bagi tahu staf rekod dah batal
                      if(typeof showCustomToast === "function") showCustomToast('success', 'Berjaya Dibatalkan', 'Rekod dikemas kini di dalam sistem.');
                      setTimeout(() => window.location.reload(), 2000);
                  });
          } else {
              // Jika EmailJS tak jumpa, terus reload
              if(typeof hideCustomLoader === "function") hideCustomLoader();
              if(typeof showCustomToast === "function") showCustomToast('success', 'Berjaya Dibatalkan', 'Rekod telah dikemas kini dalam sistem.');
              setTimeout(() => window.location.reload(), 2000);
          }
      })
      .catch(error => {
          console.error("Ralat DB:", error);
          if(typeof hideCustomLoader === "function") hideCustomLoader();
          if(typeof showCustomToast === "function") showCustomToast('error', 'Gagal', 'Sistem menghadapi ralat pangkalan data. Sila cuba lagi.');
      });
}

// ==========================================
// 7. FUNGSI CETAK SURAT (TARIK DATA LIVE DARI FIREBASE)
// ==========================================
async function cetakSuratLulus(appId) {
    if(typeof showCustomLoader === "function") showCustomLoader("Mendapatkan surat terkini...");
    
    try {
        // Tarik data paling LATEST terus dari Firebase (bukan dari cache lama)
        const docRef = await db.collection('application').doc(appId).get();
        
        if (docRef.exists) {
            const data = docRef.data();
            const suratHTML = data.surat_kelulusan_html;
            
            if(typeof hideCustomLoader === "function") hideCustomLoader();

            if (suratHTML) {
                // Jika surat wujud, buka tab baru dan pamerkan
                const printWindow = window.open('', '_blank');
                printWindow.document.write(suratHTML);
                printWindow.document.close();
                
                if(typeof showCustomToast === "function") showCustomToast('success', 'Berjaya', 'Surat sedang dibuka di tab baharu.');
            } else {
                // Jika HR belum tekan butang emel/jana surat
                if(typeof showCustomToast === "function") showCustomToast('error', 'Surat Belum Tersedia', 'Surat kelulusan rasmi anda masih dalam proses janaan oleh pihak HR. Sila semak semula sebentar lagi.');
            }
        } else {
            if(typeof hideCustomLoader === "function") hideCustomLoader();
            if(typeof showCustomToast === "function") showCustomToast('error', 'Ralat', 'Data permohonan tidak dijumpai.');
        }
    } catch (error) {
        console.error("Ralat muat turun surat:", error);
        if(typeof hideCustomLoader === "function") hideCustomLoader();
        if(typeof showCustomToast === "function") showCustomToast('error', 'Ralat', 'Sistem gagal menghubungi pelayan pangkalan data.');
    }
}