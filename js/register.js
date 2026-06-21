var DATA_KAMPUS_REG = {
    'Universitas Islam Negeri Sultan Syarif Kasim Riau': {
        fakultas: {
            'Tarbiyah dan Keguruan': ['Pendidikan Agama Islam (PAI)','Pendidikan Bahasa Arab (PBA)','Pendidikan Bahasa Inggris (PBI)','Manajemen Pendidikan Islam (MPI)','Pendidikan Matematika','Pendidikan Kimia','Pendidikan Guru Madrasah Ibtidaiyah (PGMI)','Pendidikan Islam Anak Usia Dini (PIAUD)','Tadris IPA','Tadris IPS','Pendidikan Ekonomi','Pendidikan Geografi','Pendidikan Bahasa Indonesia','Bimbingan dan Konseling Pendidikan Islam (BKPI)'],
            'Ushuluddin': ['Akidah dan Filsafat Islam','Ilmu Hadis','Ilmu Al-Quran dan Tafsir','Studi Agama-Agama']
        },
        prices: { 'id-en': 100000, 'id-ar': 100000, 'id-en-ar': 200000 }
    },
    'Institut Agama Islam Sulthan Syarif Hasyim Siak Sri Indrapura': {
        fakultas: null,
        jurusan: ['S1 - Pendidikan Guru Madrasah Ibtidaiyah','S1 - Ekonomi Syariah','S1 - Pendidikan Agama Islam','S1 - Hukum Keluarga Islam (Ahwal Syakhshiyyah)'],
        prices: { 'id-en-ar': 300000 }
    }
};

var regFileData = null, receiptFileData = null;
var regUniqueCode = Math.floor(Math.random() * 99) + 1;
var regPrice = 0, regTotal = 0, regLangChoice = '', regLangCount = 1;

function formatRupiah(n) { return 'Rp ' + (n||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

function switchRegStep(from, to) {
    document.getElementById(from).classList.remove('active');
    document.getElementById(to).classList.add('active');
    window.scrollTo(0, 0);
}

// ============================================
// STEP 1 → STEP 2
// ============================================
function goToStep2() {
    var name = document.getElementById('rName').value.trim();
    var phone = document.getElementById('rPhone').value.trim();
    if (!name) { showNotification('Nama wajib diisi!', 'error'); return; }
    if (!phone) { showNotification('No. WhatsApp wajib diisi!', 'error'); return; }
    switchRegStep('step1', 'step2');
}

function backToStep1() { switchRegStep('step2', 'step1'); }

// ============================================
// STEP 2: Jenis Dokumen & Detail
// ============================================
function onDocTypeReg() {
    var docType = document.getElementById('rDocType').value;
    var abstrakSection = document.getElementById('abstrakSection');
    var otherDocSection = document.getElementById('otherDocSection');
    var fileUploadSection = document.getElementById('fileUploadSection');
    var btnNext = document.getElementById('btnToStep3');

    abstrakSection.style.display = 'none';
    otherDocSection.style.display = 'none';
    fileUploadSection.style.display = 'none';
    btnNext.style.display = 'none';

    if (!docType) return;

    if (docType === 'Abstrak Skripsi') {
        abstrakSection.style.display = 'block';
        // File upload akan muncul setelah pilih bahasa
    } else {
        otherDocSection.style.display = 'block';
    }
}

function onUnivChange() {
    var univ = document.getElementById('rUniv').value;
    var customGroup = document.getElementById('customUnivGroup');
    var fakultasGroup = document.getElementById('rFakultasGroup');
    var jurusanGroup = document.getElementById('rJurusanGroup');
    var langContainer = document.getElementById('langOptionsContainer');
    var fileSection = document.getElementById('fileUploadSection');
    var btnNext = document.getElementById('btnToStep3');

    customGroup.style.display = 'none';
    fakultasGroup.style.display = 'none';
    jurusanGroup.style.display = 'none';
    langContainer.style.display = 'none';
    fileSection.style.display = 'none';
    btnNext.style.display = 'none';

    document.getElementById('rFakultas').innerHTML = '<option value="">-- Pilih --</option>';
    document.getElementById('rJurusan').innerHTML = '<option value="">-- Pilih --</option>';

    if (!univ) return;

    if (univ === 'lainnya') {
        customGroup.style.display = 'block';
        showLangOptions(univ);
    } else if (DATA_KAMPUS_REG[univ]) {
        var data = DATA_KAMPUS_REG[univ];
        if (data.fakultas) {
            Object.keys(data.fakultas).forEach(function(f) {
                var o = document.createElement('option');
                o.value = f; o.textContent = f;
                document.getElementById('rFakultas').appendChild(o);
            });
            fakultasGroup.style.display = 'block';
        } else if (data.jurusan) {
            data.jurusan.forEach(function(j) {
                var o = document.createElement('option');
                o.value = j; o.textContent = j;
                document.getElementById('rJurusan').appendChild(o);
            });
            jurusanGroup.style.display = 'block';
            showLangOptions(univ);
        }
    }
}

function onFakultasChange() {
    var univ = document.getElementById('rUniv').value;
    var fak = document.getElementById('rFakultas').value;
    var jurusanGroup = document.getElementById('rJurusanGroup');
    var jurusanSelect = document.getElementById('rJurusan');
    jurusanSelect.innerHTML = '<option value="">-- Pilih --</option>';
    jurusanGroup.style.display = 'none';
    document.getElementById('langOptionsContainer').style.display = 'none';
    document.getElementById('fileUploadSection').style.display = 'none';
    document.getElementById('btnToStep3').style.display = 'none';

    if (!DATA_KAMPUS_REG[univ] || !DATA_KAMPUS_REG[univ].fakultas || !fak) return;
    var list = DATA_KAMPUS_REG[univ].fakultas[fak];
    if (list) {
        list.forEach(function(j) {
            var o = document.createElement('option');
            o.value = j; o.textContent = j;
            jurusanSelect.appendChild(o);
        });
        jurusanGroup.style.display = 'block';
        showLangOptions(univ);
    }
}

function showLangOptions(univ) {
    var langContainer = document.getElementById('langOptionsContainer');
    var langOptions = document.getElementById('langOptions');

    var prices = { 'id-en': 100000, 'id-ar': 100000, 'id-en-ar': 200000 };
    if (univ === 'Institut Agama Islam Sulthan Syarif Hasyim Siak Sri Indrapura') {
        prices = { 'id-en-ar': 300000 };
    } else if (DATA_KAMPUS_REG[univ] && DATA_KAMPUS_REG[univ].prices) {
        prices = DATA_KAMPUS_REG[univ].prices;
    }

    var html = '';
    if (prices['id-en']) html += '<label class="lang-option" onclick="selectLangChoice(\'id-en\')"><input type="radio" name="langChoice" value="id-en"><div class="lang-card"><span class="lang-title">Indonesia → Inggris</span><span class="lang-price">' + formatRupiah(prices['id-en']) + '</span></div></label>';
    if (prices['id-ar']) html += '<label class="lang-option" onclick="selectLangChoice(\'id-ar\')"><input type="radio" name="langChoice" value="id-ar"><div class="lang-card"><span class="lang-title">Indonesia → Arab</span><span class="lang-price">' + formatRupiah(prices['id-ar']) + '</span></div></label>';
    if (prices['id-en-ar']) html += '<label class="lang-option" onclick="selectLangChoice(\'id-en-ar\')"><input type="radio" name="langChoice" value="id-en-ar"><div class="lang-card"><span class="lang-title">Indonesia → Inggris & Arab</span><span class="lang-price">' + formatRupiah(prices['id-en-ar']) + '</span></div></label>';

    langOptions.innerHTML = html;
    langContainer.style.display = 'block';
}

function selectLangChoice(choice) {
    regLangChoice = choice;
    var univ = document.getElementById('rUniv').value;
    var prices = { 'id-en': 100000, 'id-ar': 100000, 'id-en-ar': 200000 };

    if (univ === 'Institut Agama Islam Sulthan Syarif Hasyim Siak Sri Indrapura') {
        prices = { 'id-en-ar': 300000 };
    } else if (DATA_KAMPUS_REG[univ] && DATA_KAMPUS_REG[univ].prices) {
        prices = DATA_KAMPUS_REG[univ].prices;
    }

    regPrice = prices[choice] || 0;
    regLangCount = choice === 'id-en-ar' ? 2 : 1;
    regTotal = regPrice + regUniqueCode;

    document.getElementById('fileUploadSection').style.display = 'block';
    document.getElementById('btnToStep3').style.display = 'inline-flex';
}

function onRegFileSelect(input) {
    var f = input.files[0]; if (!f) return;
    if (!f.name.endsWith('.doc') && !f.name.endsWith('.docx')) {
        showNotification('Hanya .doc / .docx!', 'error'); input.value = ''; return;
    }
    if (f.size > 10485760) { showNotification('Max 10MB!', 'error'); input.value = ''; return; }
    regFileData = f;
    document.getElementById('rFileInfo').style.display = 'flex';
    document.getElementById('rFileName').textContent = f.name;
}

function removeRegFile() {
    regFileData = null;
    document.getElementById('rFile').value = '';
    document.getElementById('rFileInfo').style.display = 'none';
}

// ============================================
// STEP 2 → STEP 3
// ============================================
function goToStep3() {
    var docType = document.getElementById('rDocType').value;
    if (!docType) { showNotification('Pilih jenis dokumen!', 'error'); return; }
    if (docType !== 'Abstrak Skripsi') { showNotification('Untuk dokumen ini, silakan hubungi via WhatsApp', 'error'); return; }

    var univ = document.getElementById('rUniv').value;
    if (!univ) { showNotification('Pilih Universitas!', 'error'); return; }
    if (univ === 'lainnya' && !document.getElementById('rUnivCustom').value.trim()) {
        showNotification('Ketik nama universitas!', 'error'); return;
    }

    // Validasi fakultas/jurusan
    if (univ === 'Universitas Islam Negeri Sultan Syarif Kasim Riau') {
        if (!document.getElementById('rFakultas').value) { showNotification('Pilih Fakultas!', 'error'); return; }
        if (!document.getElementById('rJurusan').value) { showNotification('Pilih Jurusan!', 'error'); return; }
    }
    if (univ === 'Institut Agama Islam Sulthan Syarif Hasyim Siak Sri Indrapura') {
        if (!document.getElementById('rJurusan').value) { showNotification('Pilih Jurusan!', 'error'); return; }
    }

    var nim = document.getElementById('rNim').value.trim();
    if (!nim) { showNotification('NIM wajib diisi!', 'error'); return; }

    var judul = document.getElementById('rJudul').value.trim();
    if (!judul) { showNotification('Judul Skripsi wajib diisi!', 'error'); return; }

    if (!regLangChoice) { showNotification('Pilih bahasa terjemahan!', 'error'); return; }
    if (!regFileData) { showNotification('Upload file abstrak!', 'error'); return; }

    // Tampilkan summary
    var name = document.getElementById('rName').value.trim();
    var univName = univ === 'lainnya' ? document.getElementById('rUnivCustom').value.trim() : univ;
    var langLabels = { 'id-en': 'Indonesia → Inggris', 'id-ar': 'Indonesia → Arab', 'id-en-ar': 'Indonesia → Inggris & Arab' };

    document.getElementById('paymentSummary').innerHTML =
        '<h3>📋 Ringkasan Pendaftaran</h3>' +
        '<div class="payment-row"><span>Nama</span><strong>' + name + '</strong></div>' +
        '<div class="payment-row"><span>NIM</span><strong>' + nim + '</strong></div>' +
        '<div class="payment-row"><span>Universitas</span><strong>' + univName + '</strong></div>' +
        '<div class="payment-row"><span>Dokumen</span><strong>' + docType + '</strong></div>' +
        '<div class="payment-row"><span>Terjemahan</span><strong>' + langLabels[regLangChoice] + '</strong></div>' +
        '<div class="payment-row"><span>Biaya</span><strong>' + formatRupiah(regPrice) + '</strong></div>' +
        '<div class="payment-row"><span>Kode Unik</span><strong>+ Rp ' + regUniqueCode + '</strong></div>' +
        '<div class="payment-row total"><span>TOTAL TRANSFER</span><strong>' + formatRupiah(regTotal) + '</strong></div>';

    document.getElementById('amountDisplay').textContent = formatRupiah(regTotal);
    switchRegStep('step2', 'step3');
}

function backToStep2() { switchRegStep('step3', 'step2'); }

// ============================================
// STEP 3: Pembayaran
// ============================================
function onReceiptSelect(input) {
    var f = input.files[0]; if (!f) return;
    if (f.size > 5242880) { showNotification('Max 5MB!', 'error'); input.value = ''; return; }
    receiptFileData = f;
    document.getElementById('rReceiptInfo').style.display = 'flex';
    document.getElementById('rReceiptName').textContent = f.name;
    var reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('receiptImg').src = e.target.result;
        document.getElementById('receiptPreview').style.display = 'block';
    };
    reader.readAsDataURL(f);
}

function removeReceipt() {
    receiptFileData = null;
    document.getElementById('rReceipt').value = '';
    document.getElementById('rReceiptInfo').style.display = 'none';
    document.getElementById('receiptPreview').style.display = 'none';
}

function copyAccount() {
    navigator.clipboard.writeText('1304202088');
    showNotification('✅ No. Rekening disalin!');
}

async function submitRegistration() {
    if (!receiptFileData) { showNotification('Upload bukti transfer!', 'error'); return; }

    var btn = document.getElementById('submitRegBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    btn.disabled = true;

    try {
        var univ = document.getElementById('rUniv').value;
        var univName = univ === 'lainnya' ? document.getElementById('rUnivCustom').value.trim() : univ;

        // Upload file abstrak
        var fExt = regFileData.name.split('.').pop();
        var fName = 'abstracts/' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.' + fExt;
        var fRes = await db.storage.from('registrations').upload(fName, regFileData, { cacheControl: '3600', upsert: false });
        if (fRes.error) throw fRes.error;
        var fUrl = db.storage.from('registrations').getPublicUrl(fName).data.publicUrl;

        // Upload receipt
        var rExt = receiptFileData.name.split('.').pop();
        var rName = 'receipts/' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.' + rExt;
        var rRes = await db.storage.from('registrations').upload(rName, receiptFileData, { cacheControl: '3600', upsert: false });
        if (rRes.error) throw rRes.error;
        var rUrl = db.storage.from('registrations').getPublicUrl(rName).data.publicUrl;

        var langMap = {
            'id-en': ['Indonesia → English'],
            'id-ar': ['Indonesia → Arabic'],
            'id-en-ar': ['Indonesia → English', 'Indonesia → Arabic']
        };
        var langs = langMap[regLangChoice] || ['Indonesia → English'];
        var codes = [];

        for (var i = 0; i < langs.length; i++) {
            var code = 'REG-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase() + '-L' + (i + 1);
            codes.push({ code: code, lang: langs[i] });

            var data = {
                reg_code: code,
                client_name: document.getElementById('rName').value.trim(),
                client_phone: document.getElementById('rPhone').value.trim(),
                client_email: document.getElementById('rEmail').value.trim() || null,
                nim: document.getElementById('rNim').value.trim(),
                semester: document.getElementById('rSemester').value.trim() || null,
                judul_skripsi: document.getElementById('rJudul').value.trim(),
                universitas: univName,
                universitas_custom: univ === 'lainnya' ? univName : null,
                fakultas: document.getElementById('rFakultas').value || null,
                jurusan: document.getElementById('rJurusan').value || null,
                languages: regLangCount,
                language_1: langs[i],
                language_2: regLangCount === 2 ? langs[1] : null,
                price: regPrice,
                unique_code: regUniqueCode,
                total_price: regTotal,
                file_url: fUrl,
                file_name: regFileData.name,
                receipt_url: rUrl,
                receipt_name: receiptFileData.name,
                payment_status: 'checking',
                notes: document.getElementById('rNotes').value.trim() || null
            };

            var r = await db.from('online_registrations').insert(data);
            if (r.error) throw r.error;
        }

        var codesHtml = codes.map(function(c) {
            return '<div class="track-code-item">' +
                '<div class="track-code-label">' + c.lang + '</div>' +
                '<div class="track-code-value">' + c.code + '</div>' +
                '</div>';
        }).join('');

        document.getElementById('confirmationContent').innerHTML =
            '<div class="confirmation-card">' +
            '<div class="confirmation-icon">🎉</div>' +
            '<div class="confirmation-title">Pendaftaran Berhasil Dikirim!</div>' +
            '<p style="color:#666;margin-bottom:20px">Pembayaran Anda sedang kami periksa. Proses terjemahan dimulai setelah pembayaran terverifikasi.</p>' +
            '<div class="track-codes">' +
            '<h3 style="font-size:1rem;margin-bottom:12px">📋 Kode Tracking Anda:</h3>' +
            codesHtml +
            '</div>' +
            '<div class="save-warning">' +
            '<i class="fas fa-exclamation-triangle"></i>' +
            '<strong>PENTING!</strong> Simpan kode tracking di atas untuk melacak progres terjemahan Anda di halaman <a href="translation-status.html" style="color:#2563eb;font-weight:700">Cek Status</a>' +
            '</div>' +
            '<a href="translation-status.html" class="btn btn-primary btn-full" style="margin-top:16px"><i class="fas fa-search"></i> Cek Status Terjemahan</a>' +
            '<a href="index.html" class="btn btn-outline btn-full" style="margin-top:8px"><i class="fas fa-home"></i> Kembali ke Beranda</a>' +
            '</div>';

        switchRegStep('step3', 'step4');
    } catch (e) {
        showNotification('Error: ' + e.message, 'error');
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Pendaftaran';
        btn.disabled = false;
    }
}