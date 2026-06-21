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

function onUnivStep0Change() {
    var univ = document.getElementById('rUniv0').value;
    var customGroup = document.getElementById('customUnivGroup0');
    var langContainer = document.getElementById('langOptionsContainer');
    var langOptions = document.getElementById('langOptions');
    var btnNext = document.getElementById('btnToStep1');

    customGroup.style.display = 'none';
    langContainer.style.display = 'none';
    btnNext.style.display = 'none';
    langOptions.innerHTML = '';

    if (!univ) return;

    if (univ === 'lainnya') {
        customGroup.style.display = 'block';
        langContainer.style.display = 'block';
        langOptions.innerHTML =
            '<label class="lang-option" onclick="selectLangChoice(\'id-en\')"><input type="radio" name="langChoice" value="id-en"><div class="lang-card"><span class="lang-title">Indonesia → Inggris</span><span class="lang-price">' + formatRupiah(100000) + '</span></div></label>' +
            '<label class="lang-option" onclick="selectLangChoice(\'id-ar\')"><input type="radio" name="langChoice" value="id-ar"><div class="lang-card"><span class="lang-title">Indonesia → Arab</span><span class="lang-price">' + formatRupiah(100000) + '</span></div></label>' +
            '<label class="lang-option" onclick="selectLangChoice(\'id-en-ar\')"><input type="radio" name="langChoice" value="id-en-ar"><div class="lang-card"><span class="lang-title">Indonesia → Inggris & Arab</span><span class="lang-price">' + formatRupiah(200000) + '</span></div></label>';
    } else if (univ === 'Institut Agama Islam Sulthan Syarif Hasyim Siak Sri Indrapura') {
        langContainer.style.display = 'block';
        langOptions.innerHTML =
            '<label class="lang-option" onclick="selectLangChoice(\'id-en-ar\')"><input type="radio" name="langChoice" value="id-en-ar"><div class="lang-card"><span class="lang-title">Indonesia → Inggris & Arab</span><span class="lang-price">' + formatRupiah(300000) + '</span></div></label>';
    } else {
        langContainer.style.display = 'block';
        langOptions.innerHTML =
            '<label class="lang-option" onclick="selectLangChoice(\'id-en\')"><input type="radio" name="langChoice" value="id-en"><div class="lang-card"><span class="lang-title">Indonesia → Inggris</span><span class="lang-price">' + formatRupiah(100000) + '</span></div></label>' +
            '<label class="lang-option" onclick="selectLangChoice(\'id-ar\')"><input type="radio" name="langChoice" value="id-ar"><div class="lang-card"><span class="lang-title">Indonesia → Arab</span><span class="lang-price">' + formatRupiah(100000) + '</span></div></label>' +
            '<label class="lang-option" onclick="selectLangChoice(\'id-en-ar\')"><input type="radio" name="langChoice" value="id-en-ar"><div class="lang-card"><span class="lang-title">Indonesia → Inggris & Arab</span><span class="lang-price">' + formatRupiah(200000) + '</span></div></label>';
    }
}

function selectLangChoice(choice) {
    regLangChoice = choice;
    var univ = document.getElementById('rUniv0').value;
    var prices = { 'id-en': 100000, 'id-ar': 100000, 'id-en-ar': 200000 };

    if (univ === 'Institut Agama Islam Sulthan Syarif Hasyim Siak Sri Indrapura') {
        prices = { 'id-en-ar': 300000 };
    } else if (DATA_KAMPUS_REG[univ] && DATA_KAMPUS_REG[univ].prices) {
        prices = DATA_KAMPUS_REG[univ].prices;
    }

    regPrice = prices[choice] || 0;
    regLangCount = choice === 'id-en-ar' ? 2 : 1;
    regTotal = regPrice + regUniqueCode;
    document.getElementById('btnToStep1').style.display = 'block';
}

function goToStep1() {
    var univ = document.getElementById('rUniv0').value;
    if (!univ) { showNotification('Pilih universitas!', 'error'); return; }
    if (univ === 'lainnya' && !document.getElementById('rUnivCustom0').value.trim()) { showNotification('Ketik nama universitas!', 'error'); return; }
    if (!regLangChoice) { showNotification('Pilih bahasa terjemahan!', 'error'); return; }

    var univName = univ === 'lainnya' ? document.getElementById('rUnivCustom0').value.trim() : univ;
    var langLabels = { 'id-en': 'Indonesia → Inggris', 'id-ar': 'Indonesia → Arab', 'id-en-ar': 'Indonesia → Inggris & Arab' };

    document.getElementById('selectedService').innerHTML =
        '<div style="background:#dbeafe;padding:12px;border-radius:8px;margin-bottom:16px">' +
        '<p style="margin:0"><b>Universitas:</b> ' + univName + '</p>' +
        '<p style="margin:0"><b>Terjemahan:</b> ' + langLabels[regLangChoice] + '</p>' +
        '<p style="margin:0"><b>Biaya:</b> ' + formatRupiah(regPrice) + ' + kode unik Rp ' + regUniqueCode + ' = <strong>' + formatRupiah(regTotal) + '</strong></p>' +
        '</div>';

    // Setup fakultas/jurusan
    var fakultasGroup = document.getElementById('rFakultasGroup');
    var jurusanGroup = document.getElementById('rJurusanGroup');
    var fakultasSelect = document.getElementById('rFakultas');
    var jurusanSelect = document.getElementById('rJurusan');
    fakultasGroup.style.display = 'none';
    jurusanGroup.style.display = 'none';
    fakultasSelect.innerHTML = '<option value="">-- Pilih --</option>';
    jurusanSelect.innerHTML = '<option value="">-- Pilih --</option>';

    if (DATA_KAMPUS_REG[univ]) {
        var data = DATA_KAMPUS_REG[univ];
        if (data.fakultas) {
            Object.keys(data.fakultas).forEach(function(f) { var o = document.createElement('option'); o.value = f; o.textContent = f; fakultasSelect.appendChild(o); });
            fakultasGroup.style.display = 'block';
        } else if (data.jurusan) {
            data.jurusan.forEach(function(j) { var o = document.createElement('option'); o.value = j; o.textContent = j; jurusanSelect.appendChild(o); });
            jurusanGroup.style.display = 'block';
        }
    }

    switchRegStep('step0', 'step1');
}

function onRegFakultasChange() {
    var univ = document.getElementById('rUniv0').value;
    var fak = document.getElementById('rFakultas').value;
    var jurusanGroup = document.getElementById('rJurusanGroup');
    var jurusanSelect = document.getElementById('rJurusan');
    jurusanSelect.innerHTML = '<option value="">-- Pilih --</option>';
    jurusanGroup.style.display = 'none';
    if (!DATA_KAMPUS_REG[univ] || !DATA_KAMPUS_REG[univ].fakultas || !fak) return;
    var list = DATA_KAMPUS_REG[univ].fakultas[fak];
    if (list) {
        list.forEach(function(j) { var o = document.createElement('option'); o.value = j; o.textContent = j; jurusanSelect.appendChild(o); });
        jurusanGroup.style.display = 'block';
    }
}

function onRegFileSelect(input) {
    var f = input.files[0]; if (!f) return;
    if (!f.name.endsWith('.doc') && !f.name.endsWith('.docx')) { showNotification('Hanya .doc / .docx!', 'error'); input.value = ''; return; }
    if (f.size > 10485760) { showNotification('Max 10MB!', 'error'); input.value = ''; return; }
    regFileData = f;
    document.getElementById('rFileInfo').style.display = 'flex';
    document.getElementById('rFileName').textContent = f.name;
}
function removeRegFile() { regFileData = null; document.getElementById('rFile').value = ''; document.getElementById('rFileInfo').style.display = 'none'; }

function onReceiptSelect(input) {
    var f = input.files[0]; if (!f) return;
    if (f.size > 5242880) { showNotification('Max 5MB!', 'error'); input.value = ''; return; }
    receiptFileData = f;
    document.getElementById('rReceiptInfo').style.display = 'flex';
    document.getElementById('rReceiptName').textContent = f.name;
    var reader = new FileReader();
    reader.onload = function(e) { document.getElementById('receiptImg').src = e.target.result; document.getElementById('receiptPreview').style.display = 'block'; };
    reader.readAsDataURL(f);
}
function removeReceipt() { receiptFileData = null; document.getElementById('rReceipt').value = ''; document.getElementById('rReceiptInfo').style.display = 'none'; document.getElementById('receiptPreview').style.display = 'none'; }
function copyAccount() { navigator.clipboard.writeText('1304202088'); showNotification('✅ No. Rekening disalin!'); }

function switchRegStep(from, to) {
    document.getElementById(from).classList.remove('active');
    document.getElementById(to).classList.add('active');
    window.scrollTo(0, 0);
}

function backToStep0() { switchRegStep('step1', 'step0'); }
function backToStep1() { switchRegStep('step2', 'step1'); }

function goToStep2() {
    var name = document.getElementById('rName').value.trim();
    var phone = document.getElementById('rPhone').value.trim();
    var nim = document.getElementById('rNim').value.trim();
    var judul = document.getElementById('rJudul').value.trim();
    if (!name || !phone || !nim || !judul) { showNotification('Lengkapi data yang wajib!', 'error'); return; }
    if (!regFileData) { showNotification('Upload file abstrak!', 'error'); return; }

    var univ = document.getElementById('rUniv0').value;
    var univName = univ === 'lainnya' ? document.getElementById('rUnivCustom0').value.trim() : univ;
    var langLabels = { 'id-en': 'Indonesia → Inggris', 'id-ar': 'Indonesia → Arab', 'id-en-ar': 'Indonesia → Inggris & Arab' };

    document.getElementById('paymentSummary').innerHTML =
        '<h3>📋 Ringkasan</h3>' +
        '<div class="payment-row"><span>Nama</span><strong>' + name + '</strong></div>' +
        '<div class="payment-row"><span>NIM</span><strong>' + nim + '</strong></div>' +
        '<div class="payment-row"><span>Universitas</span><strong>' + univName + '</strong></div>' +
        '<div class="payment-row"><span>Terjemahan</span><strong>' + langLabels[regLangChoice] + '</strong></div>' +
        '<div class="payment-row"><span>Biaya</span><strong>' + formatRupiah(regPrice) + '</strong></div>' +
        '<div class="payment-row"><span>Kode Unik</span><strong>+ Rp ' + regUniqueCode + '</strong></div>' +
        '<div class="payment-row total"><span>TOTAL</span><strong>' + formatRupiah(regTotal) + '</strong></div>';

    document.getElementById('amountDisplay').textContent = formatRupiah(regTotal);
    switchRegStep('step1', 'step2');
}

async function submitRegistration() {
    if (!receiptFileData) { showNotification('Upload bukti transfer!', 'error'); return; }
    var btn = document.getElementById('submitRegBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    btn.disabled = true;

    try {
        var univ = document.getElementById('rUniv0').value;
        var univName = univ === 'lainnya' ? document.getElementById('rUnivCustom0').value.trim() : univ;

        // Upload file
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

        var langMap = { 'id-en': ['Indonesia → English'], 'id-ar': ['Indonesia → Arabic'], 'id-en-ar': ['Indonesia → English', 'Indonesia → Arabic'] };
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
            return '<div class="track-code-item"><div class="track-code-label">' + c.lang + '</div><div class="track-code-value">' + c.code + '</div></div>';
        }).join('');

        document.getElementById('confirmationContent').innerHTML =
            '<div class="confirmation-card">' +
            '<div class="confirmation-icon">🎉</div>' +
            '<div class="confirmation-title">Pendaftaran Berhasil Dikirim!</div>' +
            '<p style="color:#666;margin-bottom:20px">Pembayaran Anda sedang kami periksa. Proses terjemahan dimulai setelah pembayaran terverifikasi.</p>' +
            '<div class="track-codes"><h3 style="font-size:1rem;margin-bottom:12px">📋 Kode Tracking Anda:</h3>' + codesHtml + '</div>' +
            '<div class="save-warning"><i class="fas fa-exclamation-triangle"></i><strong>PENTING!</strong> Simpan kode tracking di atas untuk melacak progres terjemahan Anda di halaman <a href="translation-status.html" style="color:#2563eb;font-weight:700">Cek Status</a></div>' +
            '<a href="translation-status.html" class="btn btn-primary btn-full" style="margin-top:16px"><i class="fas fa-search"></i> Cek Status</a>' +
            '<a href="index.html" class="btn btn-outline btn-full" style="margin-top:8px"><i class="fas fa-home"></i> Beranda</a>' +
            '</div>';

        switchRegStep('step2', 'step3');
    } catch (e) {
        showNotification('Error: ' + e.message, 'error');
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Pendaftaran';
        btn.disabled = false;
    }
}