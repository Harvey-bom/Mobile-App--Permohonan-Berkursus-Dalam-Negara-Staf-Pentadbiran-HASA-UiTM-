// ==========================================
// VARIABLE GLOBAL UNTUK SIMPAN DATA SEMASA
// ==========================================
let semuaPermohonanStaf = [];

// ==========================================
// SEMAK STATUS LOG MASUK & TARIK REKOD
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        const userRef = db.doc('users/' + user.uid);
        
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

              container.innerHTML = ''; 
              semuaPermohonanStaf = []; // Reset array
              
              snapshot.forEach((doc) => {
                  semuaPermohonanStaf.push({ id: doc.id, data: doc.data() });
              });

              // Susun dari yang paling baru
              semuaPermohonanStaf.sort((a, b) => {
                  let masaA = a.data.created_time ? a.data.created_time.toMillis() : 0;
                  let masaB = b.data.created_time ? b.data.created_time.toMillis() : 0;
                  return masaB - masaA; 
              });

              semuaPermohonanStaf.forEach((borang) => {
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
    
    const statusDB = data.status || "PENDING"; 
    const keputusanText = data.keputusan || "Dalam Semakan"; 
    const jumlahLulus = data.jumlahKelulusan || "RM 0.00";
    const catatanAdmin = data.catatan ? data.catatan.trim() : "Tiada catatan tambahan daripada Admin.";
    const statusTuntutan = data.status_tuntutan || "Belum Selesai";

    let tarikhHantar = "Baru sahaja";
    if (data.created_time) {
        const dateObj = data.created_time.toDate();
        tarikhHantar = dateObj.toLocaleDateString('ms-MY') + " " + dateObj.toLocaleTimeString('ms-MY', {hour: '2-digit', minute:'2-digit'});
    }

    let isLulus = (statusDB === 'APPROVED' || keputusanText.toLowerCase().includes('lulus'));
    let isTolak = (statusDB === 'REJECTED' || keputusanText.toLowerCase().includes('tolak'));

    let timelineHTML = '';
    let lencanaStatusUtama = '';

    // 1. BARU HANTAR
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

    // 2. MESYUARAT
    if (data.sessionID || isLulus || isTolak) {
        timelineHTML += `
        <div class="timeline-item">
            <div class="timeline-node node-orange"></div>
            <div class="timeline-content">
                <h6 class="text-warning text-darken">Sedang Diproses</h6>
                <p>Permohonan telah disemak dan dibawa ke Mesyuarat Jawatankuasa / PPSM.</p>
            </div>
        </div>`;
    }

    // 3. KEPUTUSAN (LULUS / TOLAK)
    if (isLulus) {
        lencanaStatusUtama = `<span class="badge bg-success shadow-sm rounded-pill px-3">LULUS</span>`;
        
        let detailKelulusanHTML = `
            <div class="mt-3 p-3 rounded-3 shadow-sm" style="background-color: #f8fafc; border: 1px solid #e2e8f0;">
                <div class="d-flex justify-content-between mb-2 pb-2 border-bottom">
                    <span class="text-muted small fw-bold">Keputusan:</span>
                    <span class="text-dark small fw-bold text-end">${keputusanText}</span>
                </div>
                <div class="d-flex justify-content-between mb-2 pb-2 border-bottom">
                    <span class="text-muted small fw-bold">Peruntukan:</span>
                    <span class="text-success small fw-bold text-end">${jumlahLulus}</span>
                </div>
                <div>
                    <span class="text-muted small fw-bold d-block mb-1">Catatan Mesyuarat:</span>
                    <span class="text-dark small fst-italic">${catatanAdmin}</span>
                </div>
            </div>
        `;

        timelineHTML += `
        <div class="timeline-item">
            <div class="timeline-node node-green"></div>
            <div class="timeline-content">
                <h6 class="text-success">Permohonan Lulus</h6>
                <p>Tahniah! Permohonan anda diluluskan.</p>
                ${detailKelulusanHTML}
                <button class="btn btn-sm btn-outline-success mt-3 rounded-pill fw-bold" onclick="cetakSuratLulus('${appId}')">
                    <i class="fa-solid fa-print me-1"></i> Cetak Surat (PDF)
                </button>
            </div>
        </div>`;
    } 
    else if (isTolak) {
        lencanaStatusUtama = `<span class="badge bg-danger shadow-sm rounded-pill px-3">DITOLAK</span>`;
        let detailTolakHTML = `
            <div class="mt-2 p-3 rounded-3 shadow-sm" style="background-color: #fef2f2; border: 1px solid #fecaca;">
                <span class="text-danger small fw-bold d-block mb-1"><i class="fa-solid fa-circle-info me-1"></i> Catatan / Alasan Penolakan:</span>
                <span class="text-dark small fw-semibold">${catatanAdmin}</span>
            </div>
        `;
        timelineHTML += `
        <div class="timeline-item">
            <div class="timeline-node node-red"></div>
            <div class="timeline-content">
                <h6 class="text-danger">Permohonan Ditolak</h6>
                <p>Harap maaf, permohonan anda tidak diluluskan.</p>
                ${detailTolakHTML}
            </div>
        </div>`;
    } 
    else {
        lencanaStatusUtama = `<span class="badge bg-primary shadow-sm rounded-pill px-3">DALAM PROSES</span>`;
    }

    // --- KOTAK TINDAKAN SELEPAS KURSUS ---
    let postCourseHTML = '';
    if (isLulus) {
        let badgeTuntutan = statusTuntutan === "Sudah Diterima" 
            ? `<span class="badge bg-success"><i class="fa-solid fa-check-double me-1"></i>Tuntutan Selesai</span>`
            : `<span class="badge bg-warning text-dark"><i class="fa-solid fa-hourglass-half me-1"></i>Menunggu Borang A1/Sijil</span>`;

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
        } else if (statusTuntutan === "Batal / Tidak Hadir") {
            formUploadHTML = `<p class="small text-danger fw-bold mt-2"><i class="fa-solid fa-ban me-1"></i> Anda telah menolak untuk hadir / membatalkan penyertaan.</p>`;
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

    return `
    <div class="status-card shadow-sm mb-4">
        <div class="status-header d-flex justify-content-between align-items-center" data-bs-toggle="collapse" data-bs-target="#collapse-${appId}" style="cursor: pointer;">
            <div>
                <h6 class="fw-bold text-dark mb-1">${tajuk}</h6>
                <div class="small text-muted"><i class="fa-regular fa-calendar-days me-1"></i> ${tarikh}</div>
            </div>
            <div class="text-end">
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
// FUNGSI CETAK SURAT (PDF) UNTUK STAF - (100% SAMA MACAM ADMIN)
// ==========================================
function cetakSuratLulus(appId) {
    const borang = semuaPermohonanStaf.find(b => b.id === appId);
    if (!borang) {
        Swal.fire("Ralat", "Data permohonan tidak dijumpai.", "error");
        return;
    }

    const app = borang.data;
    const keputusan = (app.keputusan || "").toLowerCase();
    
    // Pembersihan Nama & Maklumat
    let cleanName = app.nama_penuh || "NAMA STAF";
    cleanName = cleanName.replace(/\s+(bin|binti|a\/l|a\/p)\s+/gi, ' ');
    if (/^En\./i.test(cleanName)) cleanName = cleanName.replace(/^En\./i, "Encik");
    else if (/^Pn\./i.test(cleanName)) cleanName = cleanName.replace(/^Pn\./i, "Puan");

    const jawatan = app.jawatan || "JAWATAN";
    const jabatan = app.jabatan_unit || "JABATAN";
    const tajuk = (app.tajuk_kursus || "KURSUS").toUpperCase();
    
    // Baiki Format Tarikh Kursus
    let tarikhKursus = app.tarikh_kursus_text || "TARIKH";
    tarikhKursus = tarikhKursus.replace(/\bSep\b|\bSept\b|\bSeptember\b/gi, "September")
                               .replace(/\bOct\b|\bOkt\b|\bOctober\b/gi, "Oktober") 
                               .replace(/\bAug\b|\bAugst\b|\bAugust\b/gi, "Ogos")
                               .replace(/\bDec\b|\bDis\b|\bDecember\b/gi, "Disember").toUpperCase();

    const tempat = (app.tempat_kursus || "TEMPAT").toUpperCase();
    const peruntukan = app.jumlahKelulusan || "Rujuk Admin";

    // --- LOGIK PERENGGAN PINTAR (MENIRU SISTEM ADMIN 100%) ---
    let p2 = "";
    let p4 = "";

    if (keputusan.includes("geran")) {
        p2 = `Sukacita dimaklumkan bahawa Jawatankuasa Pengurusan Latihan telah meneliti dan <strong>MELULUSKAN</strong> permohonan tuan/puan menggunakan peruntukan <strong>Geran Penyelidikan</strong>.`;
        p4 = `Kelulusan ini adalah tertakluk kepada baki peruntukan geran tuan/puan serta kelulusan permohonan pendahuluan (advances) yang sah mengikut peraturan kewangan UiTM.`;
    } 
    else if (keputusan.includes("tanpa pembiayaan") || keputusan.includes("taj") || keputusan.includes("tanpa implikasi")) {
        p2 = `Sukacita dimaklumkan bahawa Jawatankuasa Pengurusan Latihan telah meneliti dan <strong>MELULUSKAN</strong> permohonan tuan/puan <strong>TANPA SEBARANG IMPLIKASI KEWANGAN</strong> kepada pihak Hospital Al-Sultan Abdullah UiTM.`;
        p4 = `Kelulusan ini membolehkan tuan/puan direkodkan jam latihan (CPE) di dalam sistem universiti. Sila maklum bahawa tiada tuntutan kewangan boleh dibuat menggunakan surat ini.`;
    } 
    else {
        // Yuran / Elaun Biasa
        p2 = `Sukacita dimaklumkan bahawa Jawatankuasa Pengurusan Latihan telah meneliti dan <strong>MELULUSKAN</strong> permohonan tuan/puan dengan kelulusan bajet sebanyak <strong>${peruntukan}</strong>.`;
        p4 = `Sila ambil maklum bahawa tuntutan bayaran pendaftaran dan perbelanjaan perjalanan adalah tertakluk kepada kelayakan dan peraturan kewangan UiTM yang sedang berkuatkuasa.`;
    }

    // Susunan Nombor Perenggan Dinamik
    let catatan = app.catatan ? app.catatan.trim() : "";
    let perengganCatatan = catatan ? `<div class="para-block">3. Catatan/Nota Mesyuarat: <em>${catatan}</em></div>` : "";
    let numA1 = catatan ? "4." : "3.";
    let numP4 = catatan ? "5." : "4.";

    // Tarikh & Kalendar Hijriah
    const dateObj = new Date(); 
    const tarikhSemasa = dateObj.toLocaleDateString('ms-MY', { year: 'numeric', month: 'long', day: 'numeric' });
    const hYear = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { year: 'numeric' }).format(dateObj).split(" ")[0] + "H";
    const hMonth = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { month: 'long' }).format(dateObj);
    const hDay = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric' }).format(dateObj);
    const hijriDate = `${hDay} &nbsp;${hMonth}&nbsp; ${hYear}`; 

    let skDept = jabatan;
    if (skDept.trim().toLowerCase().startsWith("jabatan")) skDept = skDept.replace(/^Jabatan\s+/i, "");

    // --- TETAPAN LALUAN GAMBAR MUTLAK (ABSOLUTE PATH) ---
    // Ini memastikan gambar header sentiasa dijumpai walau dari mana staf buka web tersebut
    const rootUrl = window.location.origin; 
    const headerImg = `${rootUrl}/image/header%20surat.jpg`;
    const footerImg = `${rootUrl}/image/foooter_surat.jpg`;

    // Buka Tetingkap Cetakan Baru
    var myWindow = window.open('', 'PRINT', 'height=1123,width=794');
    myWindow.document.write(`
    <html>
    <head>
        <title>Surat_Lulus_${cleanName}</title>
        <style>
            @page { size: A4; margin: 0; }
            body { font-family: 'Arial', sans-serif; font-size: 9.5pt; line-height: 1.15; padding: 0; margin: 0; -webkit-print-color-adjust: exact; }
            .content-wrapper { padding: 5mm 20mm 5mm 20mm; }
            .bold { font-weight: bold; }
            .jawi { font-family: "Traditional Arabic", serif; font-size: 13pt; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 15px; }
            .para-block { margin-bottom: 10px; text-align: justify; }
            .footer-img { position: fixed; bottom: 0; left: 0; width: 100%; z-index: -1; }
        </style>
    </head>
    <body>
        <img src="${headerImg}" style="width:100%;" onerror="this.src='../image/header surat.jpg'; this.onerror=null;">
        
        <div class="content-wrapper">
            <table>
                <tr>
                    <td style="width:55%; vertical-align:top; padding-top:40px;">
                        <div class="bold" style="text-transform:uppercase;">${cleanName}</div>
                        <div>${jawatan} <br> ${jabatan}</div>
                        <div>Hospital Al-Sultan Abdullah, Universiti Teknologi MARA (UiTM)<br>42300 Bandar Puncak Alam, Selangor</div>
                    </td>
                    <td style="width:45%; vertical-align:top; padding-left:75px;">
                        <table>
                            <tr><td class="bold">Ruj. Kami</td><td>: 100-HUITM (PT.910/11/)</td></tr>
                            <tr><td class="bold">Tarikh</td><td>: <span class="jawi" style="direction:rtl;">${hijriDate}</span></td></tr>
                            <tr><td></td><td>&nbsp;&nbsp;${tarikhSemasa}</td></tr>
                        </table>
                    </td>
                </tr>
            </table>
            <div style="margin-bottom:10px;"><span class="jawi">السلام عليكم ورحمة الله وبركاته</span><br><span class="bold">dan Salam Sejahtera.</span></div>
            <div>Tuan/Puan,</div>
            <div class="bold" style="text-align:justify; margin:10px 0; text-transform:uppercase;">PERMOHONAN MENGHADIRI ${tajuk} (${tarikhKursus}) DI ${tempat}</div>
            <div style="text-align:justify; margin-bottom:10px;">Dengan segala hormatnya perkara di atas adalah dirujuk.</div>
            
            <div class="para-block">2. ${p2}</div>
            ${perengganCatatan}
            <div class="para-block">${numA1} Tuan/Puan adalah dikehendaki untuk mengisi <strong>Borang A1</strong> dan serah salinan sijil ke Unit Latihan dalam tempoh 3 bulan selepas tamat kursus bagi proses rekod jam latihan.</div>
            <div class="para-block">${numP4} ${p4}</div>
            
            <div style="margin-top:20px;">Sekian, terima kasih.</div>
            <div style="margin:15px 0;"><div class="jawi bold">اوسها، تقوى، موليا</div><div class="bold">"MALAYSIA MADANI"</div></div>
            <div>Saya yang menjalankan amanah,<br><br><br><br><div class="bold">Setiausaha</div>Panel PPSM HASA UiTM<br>b.p. Pengarah</div>
            <div style="margin-top:30px; font-size:9pt;">s.k. Ketua Jabatan ${skDept}, HASA UiTM</div>
            <div style="margin-top:20px; font-size:8pt; font-style:italic;">Cetakan komputer oleh pemohon. Tandatangan tidak diperlukan.</div>
        </div>

        <img src="${footerImg}" class="footer-img" onerror="this.src='../image/foooter_surat.jpg'; this.onerror=null;">
        
        <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 800); }<\/script>
    </body></html>`);
    myWindow.document.close();
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
// FUNGSI MUAT NAIK BORANG A1 & SIJIL
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

    if (!inputA1.files.length || !inputSijil.files.length) {
        Swal.fire('Perhatian', 'Sila muat naik kedua-dua dokumen (Borang A1 & Sijil) sebelum menghantar.', 'warning');
        return;
    }

    Swal.fire({ title: 'Memuat Naik...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    try {
        const base64_A1 = await prosesFailStatusKeBase64(`fileA1_${appId}`);
        const base64_Sijil = await prosesFailStatusKeBase64(`fileSijil_${appId}`);

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