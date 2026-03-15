// ==========================================
// FUNGSI PENGURUSAN POSTER & HEBAHAN (ADMIN & STAF)
// ==========================================

function bukaModalUploadPoster() {
    Swal.fire({
        title: 'Muat Naik Poster Hebahan',
        html: `
            <p class="small text-muted mb-3 text-start">Pilih gambar poster berformat JPG atau PNG. Saiz maksima <strong>2MB</strong>. Sistem akan memampatkan imej secara automatik.</p>
            <input type="file" id="filePosterInput" class="form-control border-info" accept="image/png, image/jpeg, image/jpg">
        `,
        showCancelButton: true,
        confirmButtonColor: '#0ea5e9',
        confirmButtonText: 'Muat Naik Sekarang',
        cancelButtonText: 'Batal',
        preConfirm: () => {
            const file = document.getElementById('filePosterInput').files[0];
            if (!file) { Swal.showValidationMessage('Sila pilih fail gambar terlebih dahulu!'); return false; }
            if (file.size > 2500000) { Swal.showValidationMessage('Saiz gambar melebihi 2MB! Sila pilih gambar yang lebih kecil.'); return false; }
            return file;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            showCustomLoader("Memampatkan & Memuat naik poster...");
            const file = result.value;
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // ==========================================
                // ENJIN PEMAMPAT GAMBAR (IMAGE COMPRESSOR)
                // ==========================================
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800; // Saiz ideal & ringan untuk paparan Web/Mobile
                    let width = img.width;
                    let height = img.height;

                    // Jika gambar besar, kecilkan ikut nisbah (aspect ratio)
                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    
                    // Lukis semula gambar ke atas canvas
                    ctx.drawImage(img, 0, 0, width, height);

                    // Tukar menjadi Base64 (Format JPEG, Kualiti 70%)
                    // Ini akan mengurangkan saiz fail asal sebanyak 80%!
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.9);

                    // Simpan ke Firestore
                    db.collection('pengumuman').add({
                        image_base64: compressedBase64,
                        tarikh_upload: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        hideCustomLoader();
                        showCustomToast('success', 'Berjaya!', 'Poster telah dioptimumkan dan sedia ditayangkan.');
                        tarikPosterAdmin(); 
                    }).catch(err => {
                        hideCustomLoader();
                        console.error(err);
                        showCustomToast('error', 'Gagal', 'Ralat semasa memuat naik poster.');
                    });
                };
                // Masukkan fail asal ke dalam objek imej untuk dimampatkan
                img.src = e.target.result;
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

// ==========================================
// 11. FUNGSI TAYANGAN POSTER (STAF BIASA - CAROUSEL SLIDER)
// ==========================================
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
                    
                    <div id="carouselPosterStaf" class="carousel slide shadow-sm border border-success border-opacity-25" data-bs-ride="carousel" data-bs-interval="3500" style="border-radius: 16px; overflow: hidden; background-color: #ffffff;">
                        
                        <div class="carousel-indicators" style="margin-bottom: 5px;">
        `;
        
        // 1. BINA TITIK INDIKATOR (Berapa banyak poster, sebanyak tulah titik)
        let i = 0;
        snapshot.forEach(doc => {
            let activeClass = i === 0 ? 'active' : '';
            html += `<button type="button" data-bs-target="#carouselPosterStaf" data-bs-slide-to="${i}" class="${activeClass}" aria-current="${i === 0 ? 'true' : 'false'}" aria-label="Slide ${i+1}" style="background-color: #0f766e; height: 8px; border-radius: 4px; width: 25px;"></button>`;
            i++;
        });

        html += `       </div>
                        <div class="carousel-inner">`;
        
        // 2. BINA GAMBAR (SLIDES)
        let j = 0;
        snapshot.forEach(doc => {
            const imgData = doc.data().image_base64;
            let activeClass = j === 0 ? 'active' : '';
            
            html += `
                            <div class="carousel-item ${activeClass}">
                                <img src="${imgData}" class="d-block w-100" style="height: 240px; object-fit: contain; cursor: zoom-in; padding: 10px;" onclick="besarkanPoster('${imgData}')" title="Klik untuk besarkan">
                            </div>
            `;
            j++;
        });

        // 3. BUTANG KIRI & KANAN (PREV/NEXT)
        html += `       </div>
                        <button class="carousel-control-prev" type="button" data-bs-target="#carouselPosterStaf" data-bs-slide="prev" style="width: 50px;">
                            <div class="bg-white rounded-circle shadow d-flex align-items-center justify-content-center" style="width: 35px; height: 35px;">
                                <i class="fa-solid fa-chevron-left fs-5 text-success"></i>
                            </div>
                            <span class="visually-hidden">Previous</span>
                        </button>
                        <button class="carousel-control-next" type="button" data-bs-target="#carouselPosterStaf" data-bs-slide="next" style="width: 50px;">
                            <div class="bg-white rounded-circle shadow d-flex align-items-center justify-content-center" style="width: 35px; height: 35px;">
                                <i class="fa-solid fa-chevron-right fs-5 text-success"></i>
                            </div>
                            <span class="visually-hidden">Next</span>
                        </button>
                    </div>
                    </div>
            </div>
        `;
        
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