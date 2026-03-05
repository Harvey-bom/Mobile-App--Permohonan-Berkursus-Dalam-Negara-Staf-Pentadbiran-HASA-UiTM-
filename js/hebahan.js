// ==========================================
// FUNGSI PENGURUSAN POSTER & HEBAHAN (ADMIN & STAF)
// ==========================================

function bukaModalUploadPoster() {
    Swal.fire({
        title: 'Muat Naik Poster Hebahan',
        html: `
            <p class="small text-muted mb-3 text-start">Pilih gambar poster berformat JPG atau PNG. Saiz maksima <strong>1MB</strong>.</p>
            <input type="file" id="filePosterInput" class="form-control border-info" accept="image/png, image/jpeg, image/jpg">
        `,
        showCancelButton: true,
        confirmButtonColor: '#0ea5e9',
        confirmButtonText: 'Muat Naik Sekarang',
        cancelButtonText: 'Batal',
        preConfirm: () => {
            const file = document.getElementById('filePosterInput').files[0];
            if (!file) { Swal.showValidationMessage('Sila pilih fail gambar terlebih dahulu!'); return false; }
            if (file.size > 1000000) { Swal.showValidationMessage('Saiz gambar melebihi 1MB! Sila kecilkan gambar.'); return false; }
            return file;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            showCustomLoader("Memuat naik poster ke pangkalan data...");
            const file = result.value;
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const base64Img = e.target.result;
                db.collection('pengumuman').add({
                    image_base64: base64Img,
                    tarikh_upload: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    hideCustomLoader();
                    showCustomToast('success', 'Berjaya!', 'Poster telah siap ditayangkan kepada semua staf.');
                    tarikPosterAdmin(); 
                }).catch(err => {
                    hideCustomLoader();
                    console.error(err);
                    showCustomToast('error', 'Gagal', 'Ralat semasa memuat naik poster.');
                });
            };
            reader.readAsDataURL(file);
        }
    });
}

function tarikPosterAdmin() {
    const container = document.getElementById('senaraiPosterAdminContainer');
    if (!container) return;

    db.collection('pengumuman').orderBy('tarikh_upload', 'desc').get().then(snapshot => {
        if (snapshot.empty) {
            container.innerHTML = `<span class="text-muted small fst-italic w-100 text-center">Tiada poster sedang ditayangkan.</span>`;
            return;
        }
        
        container.innerHTML = '';
        snapshot.forEach(doc => {
            const d = doc.data();
            container.innerHTML += `
                <div class="position-relative flex-shrink-0" style="scroll-snap-align: start;">
                    <img src="${d.image_base64}" class="rounded-3 shadow-sm border border-secondary border-opacity-25" style="height: 180px; width: auto; object-fit: cover; cursor:pointer;" onclick="besarkanPoster('${d.image_base64}')">
                    <button class="btn btn-sm btn-danger position-absolute shadow" style="top: 5px; right: 5px; border-radius: 50%; width:30px; height:30px; padding:0;" onclick="padamPoster('${doc.id}')" title="Padam Poster Ini">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
        });
    });
}

function padamPoster(id) {
    Swal.fire({
        title: 'Padam Poster?',
        text: "Poster ini akan dibuang dari tayangan skrin staf.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Ya, Padam',
    }).then((result) => {
        if (result.isConfirmed) {
            showCustomLoader("Memadam poster...");
            db.collection('pengumuman').doc(id).delete().then(() => {
                hideCustomLoader();
                tarikPosterAdmin();
            });
        }
    });
}

function tarikPosterStaf() {
    const zonInfo = document.getElementById('zonPengumuman');
    if (!zonInfo) return; 

    db.collection('pengumuman').orderBy('tarikh_upload', 'desc').get().then(snapshot => {
        if (snapshot.empty) {
            zonInfo.innerHTML = ''; 
            return;
        }
        
        let html = `
            <div class="card border-0 shadow-sm mb-4" style="border-radius: 16px; background-color: #f0fdf4;">
                <div class="card-body p-4">
                    <h6 class="fw-bold text-success mb-3"><i class="fa-solid fa-bullhorn me-2"></i>Hebahan & Pengumuman Terkini</h6>
                    <div class="d-flex overflow-auto gap-3 pb-2" style="scroll-snap-type: x mandatory;">
        `;
        
        snapshot.forEach(doc => {
            const imgData = doc.data().image_base64;
            html += `<img src="${imgData}" class="rounded-3 shadow-sm border border-success border-opacity-25" style="height: 160px; width: auto; object-fit: contain; cursor: zoom-in; scroll-snap-align: start; background:white;" onclick="besarkanPoster('${imgData}')" title="Klik untuk besarkan">`;
        });

        html += `</div></div></div>`;
        zonInfo.innerHTML = html;
    }).catch(err => console.error("Ralat tarik poster:", err));
}

function besarkanPoster(base64Gambar) {
    Swal.fire({
        imageUrl: base64Gambar,
        imageAlt: 'Poster Hebahan',
        showConfirmButton: false,
        showCloseButton: true,
        width: 'auto',
        padding: '1em',
        background: 'transparent',
        backdrop: 'rgba(0,0,0,0.85)', 
        customClass: {
            image: 'img-fluid rounded-3 shadow-lg', 
            closeButton: 'bg-white text-dark rounded-circle'
        }
    });
}