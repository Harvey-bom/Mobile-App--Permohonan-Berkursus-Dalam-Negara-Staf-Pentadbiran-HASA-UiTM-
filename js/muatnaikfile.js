// ==========================================
// FAIL: js/muatnaikfile.js
// PENGURUSAN MUAT NAIK DOKUMEN & PENUKARAN BASE64
// ==========================================

// 1. FUNGSI TUKAR 1 FAIL KE BASE64 (HAD 1MB & PDF SAHAJA)
function prosesFailKeBase64(fileInputId) {
    return new Promise((resolve, reject) => {
        const fileInput = document.getElementById(fileInputId);
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            resolve("Tiada Fail"); 
            return;
        }

        const file = fileInput.files[0];
        
        if (file.type !== "application/pdf") {
            reject(`Fail "${file.name}" BUKAN berformat PDF. Sila muat naik dokumen PDF sahaja.`);
            return;
        }

        if (file.size > 1000000) { // Had 1MB
            reject(`Saiz fail "${file.name}" terlalu besar. Sila pastikan saiz di bawah 1MB.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); 
        reader.onerror = (error) => reject("Ralat memproses fail.");
        reader.readAsDataURL(file);
    });
}

// 2. FUNGSI TUKAR BANYAK FAIL (MULTIPLE) KE BASE64 (HAD 1MB SETIAP FAIL)
function prosesBanyakFailKeBase64(fileInputId) {
    return new Promise(async (resolve, reject) => {
        const fileInput = document.getElementById(fileInputId);
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            resolve([]); 
            return;
        }

        let senaraiBase64 = []; 
        
        for (let i = 0; i < fileInput.files.length; i++) {
            const file = fileInput.files[i];

            if (file.type !== "application/pdf") {
                reject(`Fail "${file.name}" BUKAN berformat PDF.`);
                return;
            }

            if (file.size > 1000000) { // Had 1MB
                reject(`Saiz fail "${file.name}" terlalu besar. Sila pastikan saiz di bawah 1MB.`);
                return;
            }

            try {
                const base64 = await new Promise((res, rej) => {
                    const reader = new FileReader();
                    reader.onload = () => res(reader.result);
                    reader.onerror = () => rej("Ralat memproses fail.");
                    reader.readAsDataURL(file);
                });
                senaraiBase64.push(base64); 
            } catch (error) {
                reject(error);
                return;
            }
        }
        
        resolve(senaraiBase64); 
    });
}

// 3. FUNGSI BATAL / RESET MUAT NAIK FAIL (BUTANG X)
function padamFail(inputId) {
    const fileInput = document.getElementById(inputId);
    if (fileInput) {
        fileInput.value = ''; // Kosongkan kotak input
        
        // Khas untuk No.26: Kosongkan juga lencana nama fail di bawahnya
        if (inputId === 'fileTambahan') {
            const senaraiFailTambahan = document.getElementById('senaraiFailTambahan');
            if(senaraiFailTambahan) senaraiFailTambahan.innerHTML = '';
        }
    }
}

// ==========================================
// 4. FUNGSI MUAT NAIK BERTAMBAH (INCREMENTAL UPLOAD) UNTUK NO. 26
// ==========================================
let koleksiFailTambahan = []; // Memori khas untuk simpan fail

const inputTambahan = document.getElementById('fileTambahan');
if (inputTambahan) {
    inputTambahan.addEventListener('change', function(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Validasi: Mesti PDF dan Bawah 1MB
            if (file.type !== "application/pdf") {
                if(typeof showCustomToast === "function") showCustomToast('error', 'Format Tidak Sah', `Fail "${file.name}" BUKAN berformat PDF.`);
                continue;
            }
            if (file.size > 1000000) {
                if(typeof showCustomToast === "function") showCustomToast('error', 'Fail Terlalu Besar', `Saiz "${file.name}" melebihi 1MB.`);
                continue;
            }
            
            // Masukkan fail ke dalam memori
            koleksiFailTambahan.push(file);
        }
        
        // KOSONGKAN input supaya staf boleh klik dan pilih fail yang SAMA dari folder lain jika perlu
        this.value = ''; 
        
        // Lukiskan senarai fail di skrin
        renderSenaraiFailTambahan();
    });
}

// Fungsi melukis lencana fail dengan butang X masing-masing
function renderSenaraiFailTambahan() {
    const senaraiBekas = document.getElementById('senaraiFailTambahan');
    if (!senaraiBekas) return;
    
    senaraiBekas.innerHTML = ''; // Kosongkan paparan lama
    
    koleksiFailTambahan.forEach((file, index) => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-white text-dark border border-secondary px-3 py-2 text-start shadow-sm d-flex align-items-center gap-2';
        badge.style.fontSize = '0.8rem';
        
        badge.innerHTML = `
            <i class="fa-solid fa-file-pdf text-danger fs-6"></i> 
            <span class="text-truncate" style="max-width: 150px;" title="${file.name}">${file.name}</span>
            <button type="button" class="btn-close ms-1" style="font-size: 0.6rem; background-color: #fecaca; border-radius: 50%; padding: 4px;" onclick="buangFailIndividu(${index})" title="Padam Fail Ini"></button>
        `;
        senaraiBekas.appendChild(badge);
    });
}

// Fungsi apabila staf tekan butang X pada salah satu fail
function buangFailIndividu(index) {
    koleksiFailTambahan.splice(index, 1); // Buang fail dari memori
    renderSenaraiFailTambahan(); // Lukis semula senarai
}

// 5. FUNGSI TUKAR ARRAY FAIL KE BASE64 (KHAS UNTUK SISTEM BARU INI)
function prosesArrayFailKeBase64(fileArray) {
    return new Promise(async (resolve, reject) => {
        if (!fileArray || fileArray.length === 0) {
            resolve([]); 
            return;
        }
        let senaraiBase64 = []; 
        for (let i = 0; i < fileArray.length; i++) {
            const file = fileArray[i];
            try {
                const base64 = await new Promise((res, rej) => {
                    const reader = new FileReader();
                    reader.onload = () => res(reader.result);
                    reader.onerror = () => rej("Ralat memproses fail.");
                    reader.readAsDataURL(file);
                });
                senaraiBase64.push(base64); 
            } catch (error) {
                reject(error);
                return;
            }
        }
        resolve(senaraiBase64); 
    });
}