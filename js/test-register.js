var tSelectedTest = null;
var tUniqueCode = Math.floor(Math.random() * 99) + 1;
var tPrice = 0, tTotal = 0, tCurrency = 'IDR';
var tKtpFile = null, tReceiptFile = null;

function formatRp(n) { return 'Rp ' + (n||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function formatPrice(n, cur) { return cur === 'USD' ? '$' + n : formatRp(n); }

function switchTStep(from, to) {
    document.getElementById(from).classList.remove('active');
    document.getElementById(to).classList.add('active');
    window.scrollTo(0, 0);
}

function selectTest(name, price, currency) {
    tSelectedTest = name;
    tPrice = price;
    tCurrency = currency;
    tTotal = currency === 'IDR' ? price + tUniqueCode : price;

    document.getElementById('selectedTest').innerHTML =
        '<div style="background:#dbeafe;padding:12px;border-radius:8px;margin-bottom:16px">' +
        '<p style="margin:0"><b>Tes:</b> ' + name + '</p>' +
        '<p style="margin:0"><b>Biaya:</b> ' + formatPrice(price, currency) +
        (currency === 'IDR' ? ' + Rp ' + tUniqueCode + ' (kode unik) = <strong>' + formatRp(tTotal) + '</strong>' : '') +
        '</p></div>';

    switchTStep('tStep1', 'tStep2');
}

function tBackToStep1() { switchTStep('tStep2', 'tStep1'); }
function tBackToStep2() { switchTStep('tStep3', 'tStep2'); }

function onKtpSelect(input) {
    var f = input.files[0]; if (!f) return;
    if (f.size > 5242880) { showNotification('Max 5MB!', 'error'); input.value = ''; return; }
    tKtpFile = f;
    document.getElementById('tKtpInfo').style.display = 'flex';
    document.getElementById('tKtpName').textContent = f.name;
}
function removeKtp() { tKtpFile = null; document.getElementById('tKtp').value = ''; document.getElementById('tKtpInfo').style.display = 'none'; }

function onTReceiptSelect(input) {
    var f = input.files[0]; if (!f) return;
    if (f.size > 5242880) { showNotification('Max 5MB!', 'error'); input.value = ''; return; }
    tReceiptFile = f;
    document.getElementById('tReceiptInfo').style.display = 'flex';
    document.getElementById('tReceiptName').textContent = f.name;
    var reader = new FileReader();
    reader.onload = function(e) { document.getElementById('tReceiptImg').src = e.target.result; document.getElementById('tReceiptPreview').style.display = 'block'; };
    reader.readAsDataURL(f);
}
function removeTReceipt() { tReceiptFile = null; document.getElementById('tReceipt').value = ''; document.getElementById('tReceiptInfo').style.display = 'none'; document.getElementById('tReceiptPreview').style.display = 'none'; }

function copyAccount() { navigator.clipboard.writeText('1304202088'); showNotification('✅ Disalin!'); }

function tGoToStep3() {
    var name = document.getElementById('tName').value.trim();
    var nik = document.getElementById('tNik').value.trim();
    var birthPlace = document.getElementById('tBirthPlace').value.trim();
    var birthDate = document.getElementById('tBirthDate').value;
    var address = document.getElementById('tAddress').value.trim();
    var phone = document.getElementById('tPhone').value.trim();

    if (!name) { showNotification('Nama wajib!', 'error'); return; }
    if (!nik || nik.length !== 16) { showNotification('NIK harus 16 digit!', 'error'); return; }
    if (!birthPlace || !birthDate) { showNotification('Tempat & tanggal lahir wajib!', 'error'); return; }
    if (!address) { showNotification('Alamat wajib!', 'error'); return; }
    if (!phone) { showNotification('No. WA wajib!', 'error'); return; }
    if (!tKtpFile) { showNotification('Upload foto KTP!', 'error'); return; }

    document.getElementById('tPaymentSummary').innerHTML =
        '<h3>📋 Ringkasan</h3>' +
        '<div class="payment-row"><span>Nama</span><strong>' + name + '</strong></div>' +
        '<div class="payment-row"><span>NIK</span><strong>' + nik + '</strong></div>' +
        '<div class="payment-row"><span>Jenis Tes</span><strong>' + tSelectedTest + '</strong></div>' +
        '<div class="payment-row"><span>Biaya</span><strong>' + formatPrice(tPrice, tCurrency) + '</strong></div>' +
        (tCurrency === 'IDR' ? '<div class="payment-row"><span>Kode Unik</span><strong>+ Rp ' + tUniqueCode + '</strong></div>' : '') +
        '<div class="payment-row total"><span>TOTAL</span><strong>' + formatPrice(tTotal, tCurrency) + '</strong></div>';

    document.getElementById('tAmountDisplay').textContent = formatPrice(tTotal, tCurrency);
    switchTStep('tStep2', 'tStep3');
}

async function submitTestReg() {
    if (!tReceiptFile) { showNotification('Upload bukti transfer!', 'error'); return; }
    var btn = document.getElementById('submitTestBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    btn.disabled = true;

    try {
        // Upload KTP
        var kExt = tKtpFile.name.split('.').pop();
        var kName = 'ktp/' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.' + kExt;
        var kRes = await db.storage.from('registrations').upload(kName, tKtpFile, { cacheControl: '3600', upsert: false });
        if (kRes.error) throw kRes.error;
        var kUrl = db.storage.from('registrations').getPublicUrl(kName).data.publicUrl;

        // Upload receipt
        var rExt = tReceiptFile.name.split('.').pop();
        var rName = 'test-receipts/' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.' + rExt;
        var rRes = await db.storage.from('registrations').upload(rName, tReceiptFile, { cacheControl: '3600', upsert: false });
        if (rRes.error) throw rRes.error;
        var rUrl = db.storage.from('registrations').getPublicUrl(rName).data.publicUrl;

        var code = 'TEST-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();

        var data = {
            reg_code: code,
            test_type: tSelectedTest,
            test_price: tPrice,
            test_currency: tCurrency,
            unique_code: tUniqueCode,
            total_price: tTotal,
            full_name: document.getElementById('tName').value.trim(),
            birth_place: document.getElementById('tBirthPlace').value.trim(),
            birth_date: document.getElementById('tBirthDate').value,
            address: document.getElementById('tAddress').value.trim(),
            nik: document.getElementById('tNik').value.trim(),
            phone: document.getElementById('tPhone').value.trim(),
            email: document.getElementById('tEmail').value.trim() || null,
            ktp_url: kUrl,
            ktp_name: tKtpFile.name,
            receipt_url: rUrl,
            receipt_name: tReceiptFile.name,
            payment_status: 'checking'
        };

        var r = await db.from('test_registrations').insert(data);
        if (r.error) throw r.error;

        // Send email notification to admin
        sendAdminEmailNotification(data);

        document.getElementById('tConfirmationContent').innerHTML =
            '<div class="confirmation-card">' +
            '<div class="confirmation-icon">🎉</div>' +
            '<div class="confirmation-title">Pendaftaran Tes Berhasil Dikirim!</div>' +
            '<p style="color:#666;margin-bottom:16px">Terima kasih telah mendaftar <strong>' + tSelectedTest + '</strong> di SIEC!</p>' +
            '<div class="track-code-item" style="margin-bottom:16px"><div class="track-code-label">Kode Pendaftaran</div><div class="track-code-value">' + code + '</div></div>' +
            '<div style="background:#f0f9ff;padding:16px;border-radius:12px;border:2px solid #2563eb;margin-bottom:16px;text-align:left">' +
            '<h3 style="color:#1e40af;margin-bottom:8px;font-size:1rem"><i class="fas fa-info-circle"></i> Langkah Selanjutnya:</h3>' +
            '<ol style="color:#334155;line-height:2;padding-left:20px;margin:0">' +
            '<li>Tim SIEC akan memverifikasi pembayaran Anda</li>' +
            '<li>Setelah diverifikasi, kami akan mengirimkan <strong>ID & Password tes</strong>, <strong>link tes</strong>, dan <strong>jadwal pelaksanaan</strong> langsung ke WhatsApp Anda</li>' +
            '<li>Pastikan nomor WhatsApp Anda aktif: <strong>' + data.phone + '</strong></li>' +
            '</ol></div>' +
            '<div class="save-warning"><i class="fas fa-exclamation-triangle"></i><strong>SIMPAN</strong> kode pendaftaran Anda: <strong style="color:#2563eb;font-size:1.1rem">' + code + '</strong></div>' +
            '<p style="color:#666;margin-top:16px;font-size:0.9rem;text-align:center">💬 Jika ada pertanyaan, hubungi kami via WhatsApp</p>' +
            '<a href="index.html" class="btn btn-primary btn-full" style="margin-top:12px"><i class="fas fa-home"></i> Kembali ke Beranda</a>' +
            '</div>';

        switchTStep('tStep3', 'tStep4');
    } catch (e) {
        showNotification('Error: ' + e.message, 'error');
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Pendaftaran';
        btn.disabled = false;
    }
}

function sendAdminEmailNotification(data) {
    var SERVICE_ID = ' service_siec';       // ← Paste Service ID
    var TEMPLATE_ID = ' template_hm8jzlq';     // ← Paste Template ID
    var PUBLIC_KEY = ' khzQQWWoH8FvYAW9Z';   // ← Paste Public Key

    if (typeof emailjs !== 'undefined') {
        emailjs.init(PUBLIC_KEY);
        emailjs.send(SERVICE_ID, TEMPLATE_ID, {
            test_type: data.test_type,
            name: data.full_name,
            phone: data.phone,
            reg_code: data.reg_code,
            total: data.test_currency === 'USD' ? '$' + data.total_price : 'Rp ' + data.total_price.toLocaleString('id-ID')
        }).then(function(response) {
            console.log('✅ Email sent!', response.status);
        }).catch(function(err) {
            console.log('❌ Email failed:', err);
        });
    }
}

