var DATA_KAMPUS_REG = {
    'Universitas Islam Negeri Sultan Syarif Kasim Riau': {
        fakultas: {
            'Tarbiyah dan Keguruan': ['Pendidikan Agama Islam (PAI)','Pendidikan Bahasa Arab (PBA)','Pendidikan Bahasa Inggris (PBI)','Manajemen Pendidikan Islam (MPI)','Pendidikan Matematika','Pendidikan Kimia','Pendidikan Guru Madrasah Ibtidaiyah (PGMI)','Pendidikan Islam Anak Usia Dini (PIAUD)','Tadris IPA','Tadris IPS','Pendidikan Ekonomi','Pendidikan Geografi','Pendidikan Bahasa Indonesia','Bimbingan dan Konseling Pendidikan Islam (BKPI)'],
            'Ushuluddin': ['Ilmu Akidah','Ilmu Al-Quran dan Tafsir','Perbandingan Agama']
        },
        price1: 100000,
        price2: 200000
    },
    'Institut Agama Islam Sulthan Syarif Hasyim Siak Sri Indrapura': {
        fakultas: null,
        jurusan: ['S1 - Pendidikan Guru Madrasah Ibtidaiyah','S1 - Ekonomi Syariah','S1 - Pendidikan Agama Islam','S1 - Hukum Keluarga Islam (Ahwal Syakhshiyyah)'],
        price1: null,
        price2: 300000
    }
};

var regFileData = null;
var receiptFileData = null;
var regUniqueCode = Math.floor(Math.random() * 99) + 1;
var regPrice = 0;
var regTotal = 0;
var regLangCount = 1;

function onRegUnivChange() {
    var univ = document.getElementById('rUniv').value;
    var customGroup = document.getElementById('customUnivGroup');
    var fakultasGroup = document.getElementById('rFakultasGroup');
    var jurusanGroup = document.getElementById('rJurusanGroup');
    var fakultasSelect = document.getElementById('rFakultas');
    var jurusanSelect = document.getElementById('rJurusan');

    customGroup.style.display = 'none';
    fakultasGroup.style.display = 'none';
    jurusanGroup.style.display = 'none';
    fakultasSelect.innerHTML = '<option value="">-- Pilih Fakultas --</option>';
    jurusanSelect.innerHTML = '<option value="">-- Pilih Jurusan --</option>';

    if (univ === 'lainnya') {
        customGroup.style.display = 'block';
    } else if (DATA_KAMPUS_REG[univ]) {
        var data = DATA_KAMPUS_REG[univ];
        if (data.fakultas) {
            Object.keys(data.fakultas).forEach(function(f) {
                var opt = document.createElement('option'); opt.value = f; opt.textContent = f; fakultasSelect.appendChild(opt);
            });
            fakultasGroup.style.display = 'block';
        } else if (data.jurusan) {
            data.jurusan.forEach(function(j) {
                var opt = document.createElement('option'); opt.value = j; opt.textContent = j; jurusanSelect.appendChild(opt);
            });
            jurusanGroup.style.display = 'block';
        }
    }
    updatePrice();
}

function onRegFakultasChange() {
    var univ = document.getElementById('rUniv').value;
    var fakultas = document.getElementById('rFakultas').value;
    var jurusanGroup = document.getElementById('rJurusanGroup');
    var jurusanSelect = document.getElementById('rJurusan');
    jurusanSelect.innerHTML = '<option value="">-- Pilih Jurusan --</option>';
    jurusanGroup.style.display = 'none';
    if (!univ || !fakultas || !DATA_KAMPUS_REG[univ] || !DATA_KAMPUS_REG[univ].fakultas) return;
    var list = DATA_KAMPUS_REG[univ].fakultas[fakultas];
    if (list) {
        list.forEach(function(j) { var opt = document.createElement('option'); opt.value = j; opt.textContent = j; jurusanSelect.appendChild(opt); });
        jurusanGroup.style.display = 'block';
    }
}

function selectLang(n) {
    regLangCount = n;
    document.getElementById('langCard1').classList.toggle('selected', n === 1);
    document.getElementById('langCard2').classList.toggle('selected', n === 2);
    updatePrice();
}

function updatePrice() {
    var univ = document.getElementById('rUniv').value;
    var p1El = document.getElementById('price1');
    var p2El = document.getElementById('price2');

    var price1 = 100000, price2 = 200000;

    if (univ === 'Universitas Islam Negeri Sultan Syarif Kasim Riau') {
        price1 = 100000; price2 = 200000;
    } else if (univ === 'Institut Agama Islam Sulthan Syarif Hasyim Siak Sri Indrapura') {
        price1 = null; price2 = 300000;
    } else if (univ === 'lainnya') {
        price1 = 100000; price2 = 200000;
    }

    p1El.textContent = price1 ? formatRupiah(price1) : 'Tidak tersedia';
    p2El.textContent = price2 ? formatRupiah(price2) : '-';

    if (!price1 && regLangCount === 1) {
        regLangCount = 2;
        document.querySelector('input[name="langCount"][value="2"]').checked = true;
    }

    regPrice = regLangCount === 1 ? (price1 || 0) : (price2 || 0);
    regTotal = regPrice + regUniqueCode;
}

function formatRupiah(n) {
    return 'Rp ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function onRegFileSelect(input) {
    var f = input.files[0]; if (!f) return;
    if (!f.name.endsWith('.doc') && !f.name.endsWith('.docx')) {
        showNotification('Hanya file .doc atau .docx!', 'error'); input.value = ''; return;
    }
    if (f.size > 10 * 1024 * 1024) { showNotification('Max 10MB!', 'error'); input.value = ''; return; }
    regFileData = f;
    document.getElementById('rFileInfo').style.display = 'flex';
    document.getElementById('rFileName').textContent = f.name;
}

function removeRegFile() {
    regFileData = null;
    document.getElementById('rFile').value = '';
    document.getElementById('rFileInfo').style.display = 'none';
}

function onReceiptSelect(input) {
    var f = input.files[0]; if (!f) return;
    if (f.size > 5 * 1024 * 1024) { showNotification('Max 5MB!', 'error'); input.value = ''; return; }
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

function goToStep2() {
    var name = document.getElementById('rName').value.trim();
    var phone = document.getElementById('rPhone').value.trim();
    var nim = document.getElementById('rNim').value.trim();
    var univ = document.getElementById('rUniv').value;
    var judul = document.getElementById('rJudul').value.trim();

    if (!name) { showNotification('Nama wajib diisi!', 'error'); return; }
    if (!phone) { showNotification('No. WhatsApp wajib diisi!', 'error'); return; }
    if (!nim) { showNotification('NIM wajib diisi!', 'error'); return; }
    if (!univ) { showNotification('Pilih Universitas!', 'error'); return; }
    if (univ === 'lainnya' && !document.getElementById('rUnivCustom').value.trim()) {
        showNotification('Ketik nama universitas!', 'error'); return;
    }
    if (!judul) { showNotification('Judul Skripsi wajib diisi!', 'error'); return; }
    if (!regFileData) { showNotification('Upload file abstrak!', 'error'); return; }

    updatePrice();

    if (regPrice === 0) { showNotification('Pilih jumlah bahasa yang tersedia!', 'error'); return; }

    var univName = univ === 'lainnya' ? document.getElementById('rUnivCustom').value.trim() : univ;
    var langText = regLangCount === 1 ? 'Indonesia → English' : 'Indonesia → English & Indonesia → Arabic';

    document.getElementById('paymentSummary').innerHTML =
        '<h3>📋 Ringkasan Pendaftaran</h3>' +
        '<div class="payment-row"><span>Nama</span><strong>' + name + '</strong></div>' +
        '<div class="payment-row"><span>NIM</span><strong>' + nim + '</strong></div>' +
        '<div class="payment-row"><span>Universitas</span><strong>' + univName + '</strong></div>' +
        '<div class="payment-row"><span>Terjemahan</span><strong>' + langText + '</strong></div>' +
        '<div class="payment-row"><span>Biaya</span><strong>' + formatRupiah(regPrice) + '</strong></div>' +
        '<div class="payment-row"><span>Kode Unik</span><strong>+ Rp ' + regUniqueCode + '</strong></div>' +
        '<div class="payment-row total"><span>TOTAL TRANSFER</span><strong>' + formatRupiah(regTotal) + '</strong></div>';

    document.getElementById('amountDisplay').textContent = formatRupiah(regTotal);

    document.getElementById('step1').classList.remove('active');
    document.getElementById('step2').classList.add('active');
    window.scrollTo(0, 0);
}

function backToStep1() {
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step1').classList.add('active');
    window.scrollTo(0, 0);
}

async function submitRegistration() {
    if (!receiptFileData) { showNotification('Upload bukti transfer dulu!', 'error'); return; }

    var btn = document.getElementById('submitRegBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    btn.disabled = true;

    try {
        var univ = document.getElementById('rUniv').value;
        var univName = univ === 'lainnya' ? document.getElementById('rUnivCustom').value.trim() : univ;
        var fakultas = document.getElementById('rFakultas').value || null;
        var jurusan = document.getElementById('rJurusan').value || null;

        // Upload file abstrak
        var fileExt = regFileData.name.split('.').pop();
        var fileName = 'abstracts/' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.' + fileExt;
        var fileResult = await db.storage.from('registrations').upload(fileName, regFileData, { cacheControl: '3600', upsert: false });
        if (fileResult.error) throw fileResult.error;
        var fileUrl = db.storage.from('registrations').getPublicUrl(fileName).data.publicUrl;

        // Upload receipt
        var rcptExt = receiptFileData.name.split('.').pop();
        var rcptName = 'receipts/' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.' + rcptExt;
        var rcptResult = await db.storage.from('registrations').upload(rcptName, receiptFileData, { cacheControl: '3600', upsert: false });
        if (rcptResult.error) throw rcptResult.error;
        var rcptUrl = db.storage.from('registrations').getPublicUrl(rcptName).data.publicUrl;

        var codes = [];

        // Insert registrations (1 or 2 based on language count)
        for (var i = 1; i <= regLangCount; i++) {
            var code = 'REG-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase() + '-L' + i;
            codes.push({ code: code, lang: i === 1 ? 'Indonesia → English' : 'Indonesia → Arabic' });

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
                fakultas: fakultas,
                jurusan: jurusan,
                languages: regLangCount,
                language_1: 'Indonesia → English',
                language_2: regLangCount === 2 ? 'Indonesia → Arabic' : null,
                price: regPrice,
                unique_code: regUniqueCode,
                total_price: regTotal,
                file_url: fileUrl,
                file_name: regFileData.name,
                receipt_url: rcptUrl,
                receipt_name: receiptFileData.name,
                payment_status: 'checking',
                notes: document.getElementById('rNotes').value.trim() || null
            };

            // Set specific language for this entry
            if (i === 1) data.language_1 = 'Indonesia → English';
            if (i === 2) data.language_1 = 'Indonesia → Arabic';

            var r = await db.from('online_registrations').insert(data);
            if (r.error) throw r.error;
        }

        // Show confirmation
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
            '<p style="color:#666;margin-bottom:20px">Pembayaran Anda sedang kami periksa. Proses penerjemahan akan dimulai setelah pembayaran terverifikasi.</p>' +
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

        document.getElementById('step2').classList.remove('active');
        document.getElementById('step3').classList.add('active');
        window.scrollTo(0, 0);

    } catch (e) {
        showNotification('Error: ' + e.message, 'error');
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Pendaftaran';
        btn.disabled = false;
    }
}

// Init
document.addEventListener('DOMContentLoaded', function() {
    updatePrice();
});