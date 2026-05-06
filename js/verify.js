// ============================================
// SIEC - Document Verification
// Translation: dari translation_clients
// TOEFL: dari toefl_certificates
// ============================================

var currentTab = 'translation';

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.verify-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.verify-tab').forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            document.getElementById('verifyResult').style.display = 'none';
            var input = document.getElementById('verifyInput');
            input.placeholder = currentTab === 'translation'
                ? 'Masukkan ID Dokumen (contoh: SIEC-TR-2024-001)'
                : 'Masukkan ID Sertifikat (contoh: SIEC-TF-2024-001)';
        });
    });

    // Auto verify if URL has params
    var params = new URLSearchParams(window.location.search);
    var id = params.get('id');
    var type = params.get('type');
    if (id) {
        document.getElementById('verifyInput').value = id;
        if (type === 'toefl') {
            currentTab = 'toefl';
            document.querySelectorAll('.verify-tab').forEach(function(t) { t.classList.remove('active'); });
            var toeflTab = document.querySelector('[data-tab="toefl"]');
            if (toeflTab) toeflTab.classList.add('active');
        }
        verifyDocument();
    }
});

async function verifyDocument() {
    var input = document.getElementById('verifyInput').value.trim();
    var resultDiv = document.getElementById('verifyResult');
    var btn = document.getElementById('verifyBtn');

    if (!input) {
        showNotification('Masukkan ID dokumen!', 'error');
        return;
    }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        var data, error;

        if (currentTab === 'translation') {
            // Cari di translation_clients berdasarkan document_id
            var result = await db.from('translation_clients')
                .select('*')
                .eq('document_id', input)
                .eq('status', 'completed')
                .single();
            data = result.data;
            error = result.error;
        } else {
            var result2 = await db.from('toefl_certificates')
                .select('*')
                .eq('certificate_id', input)
                .single();
            data = result2.data;
            error = result2.error;
        }

        resultDiv.style.display = 'block';

        if (error || !data) {
            resultDiv.className = 'verify-result result-invalid';
            resultDiv.innerHTML =
                '<div class="result-header">' +
                '<i class="fas fa-times-circle"></i>' +
                '<span>DOKUMEN TIDAK TERDAFTAR</span>' +
                '</div>' +
                '<p style="color:var(--danger);">' +
                'ID <strong>"' + input + '"</strong> tidak ditemukan dalam sistem SIEC.' +
                '</p>' +
                '<p style="margin-top:12px;">' +
                '<a href="https://wa.me/' + WA_NUMBER + '?text=Halo%20SIEC,%20verifikasi%20dokumen%20' + input + '" style="color:var(--primary);font-weight:600;">' +
                '<i class="fab fa-whatsapp"></i> Hubungi kami untuk konfirmasi' +
                '</a>' +
                '</p>';
        } else {
            resultDiv.className = 'verify-result result-valid';

            if (currentTab === 'translation') {
                // Tombol download
                var downloadBtn = '';
                if (data.file_url) {
                    downloadBtn =
                        '<div style="margin-top:20px;text-align:center;padding:16px;background:#ecfdf5;border:2px solid #10b981;border-radius:12px;">' +
                        '<a href="' + data.file_url + '" target="_blank" class="btn btn-success" style="display:inline-flex;gap:8px;padding:14px 28px;font-size:1.05rem;">' +
                        '<i class="fas fa-download"></i> Download Dokumen Terverifikasi' +
                        '</a>' +
                        '</div>';
                }

                resultDiv.innerHTML =
                    '<div class="result-header">' +
                    '<i class="fas fa-check-circle"></i>' +
                    '<span>DOKUMEN TERVERIFIKASI ✅</span>' +
                    '</div>' +
                    '<div class="result-details">' +
                    '<div class="result-item">' +
                    '<label>ID Dokumen</label>' +
                    '<p>' + data.document_id + '</p>' +
                    '</div>' +
                    '<div class="result-item">' +
                    '<label>Nama Klien</label>' +
                    '<p>' + data.client_name + '</p>' +
                    '</div>' +
                    '<div class="result-item">' +
                    '<label>Judul Dokumen</label>' +
                    '<p>' + (data.document_title || data.document_type) + '</p>' +
                    '</div>' +
                    '<div class="result-item">' +
                    '<label>Jenis</label>' +
                    '<p>' + data.document_type + '</p>' +
                    '</div>' +
                    '<div class="result-item">' +
                    '<label>Bahasa Sumber</label>' +
                    '<p>' + data.source_language + '</p>' +
                    '</div>' +
                    '<div class="result-item">' +
                    '<label>Bahasa Target</label>' +
                    '<p>' + data.target_language + '</p>' +
                    '</div>' +
                    '<div class="result-item">' +
                    '<label>Tanggal Terbit</label>' +
                    '<p>' + formatDate(data.issued_date || data.completed_at) + '</p>' +
                    '</div>' +
                    '<div class="result-item">' +
                    '<label>Status</label>' +
                    '<p><span class="status-badge status-valid">✓ Valid</span></p>' +
                    '</div>' +
                    '</div>' +

                    downloadBtn +

                    '<p style="margin-top:16px;color:var(--success);font-size:0.85rem;text-align:center;">' +
                    '<i class="fas fa-shield-alt"></i> ' +
                    'Dokumen ini resmi diterbitkan oleh SIEC - Syaf Intensive English Course' +
                    '</p>';
            } else {
                // TOEFL
                var downloadBtn2 = '';
                if (data.file_url) {
                    downloadBtn2 =
                        '<div style="margin-top:20px;text-align:center;padding:16px;background:#ecfdf5;border:2px solid #10b981;border-radius:12px;">' +
                        '<a href="' + data.file_url + '" target="_blank" class="btn btn-success" style="display:inline-flex;gap:8px;padding:14px 28px;font-size:1.05rem;">' +
                        '<i class="fas fa-download"></i> Download Sertifikat' +
                        '</a>' +
                        '</div>';
                }

                resultDiv.innerHTML =
                    '<div class="result-header">' +
                    '<i class="fas fa-check-circle"></i>' +
                    '<span>SERTIFIKAT TERVERIFIKASI ✅</span>' +
                    '</div>' +
                    '<div class="result-details">' +
                    '<div class="result-item">' +
                    '<label>ID Sertifikat</label>' +
                    '<p>' + data.certificate_id + '</p>' +
                    '</div>' +
                    '<div class="result-item">' +
                    '<label>Nama Peserta</label>' +
                    '<p>' + data.participant_name + '</p>' +
                    '</div>' +
                    '<div class="result-item">' +
                    '<label>Tanggal Tes</label>' +
                    '<p>' + formatDate(data.test_date) + '</p>' +
                    '</div>' +
                    '<div class="result-item">' +
                    '<label>Listening</label>' +
                    '<p>' + data.listening_score + '</p>' +
                    '</div>' +
                    '<div class="result-item">' +
                    '<label>Structure</label>' +
                    '<p>' + data.structure_score + '</p>' +
                    '</div>' +
                    '<div class="result-item">' +
                    '<label>Reading</label>' +
                    '<p>' + data.reading_score + '</p>' +
                    '</div>' +
                    '<div class="result-item">' +
                    '<label>Total Score</label>' +
                    '<p style="font-size:1.5rem;color:var(--primary);font-weight:800;">' + data.total_score + '</p>' +
                    '</div>' +
                    '<div class="result-item">' +
                    '<label>Status</label>' +
                    '<p><span class="status-badge status-valid">✓ Valid</span></p>' +
                    '</div>' +
                    '</div>' +

                    downloadBtn2 +

                    '<p style="margin-top:16px;color:var(--success);font-size:0.85rem;text-align:center;">' +
                    '<i class="fas fa-shield-alt"></i> ' +
                    'Sertifikat ini resmi diterbitkan oleh SIEC - Syaf Intensive English Course' +
                    '</p>';
            }
        }
    } catch (err) {
        resultDiv.style.display = 'block';
        resultDiv.className = 'verify-result result-invalid';
        resultDiv.innerHTML = '<p>Terjadi kesalahan: ' + err.message + '</p>';
        console.error(err);
    }

    btn.innerHTML = '<i class="fas fa-check-circle"></i> Verifikasi';
    btn.disabled = false;
}

// Barcode/QR Scanner (jika dipakai)
var html5QrcodeScanner = null;
function toggleScanner() {
    var container = document.getElementById('scannerContainer');
    if (!container) return;
    if (container.style.display === 'none') {
        container.style.display = 'block';
        if (typeof Html5Qrcode !== 'undefined') {
            html5QrcodeScanner = new Html5Qrcode("reader");
            html5QrcodeScanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                function(decodedText) {
                    // Jika QR berisi URL, ekstrak ID
                    var idMatch = decodedText.match(/[?&]id=([^&]+)/);
                    if (idMatch) {
                        document.getElementById('verifyInput').value = idMatch[1];
                        var typeMatch = decodedText.match(/[?&]type=([^&]+)/);
                        if (typeMatch && typeMatch[1] === 'toefl') {
                            currentTab = 'toefl';
                            document.querySelectorAll('.verify-tab').forEach(function(t) { t.classList.remove('active'); });
                            document.querySelector('[data-tab="toefl"]').classList.add('active');
                        }
                    } else {
                        document.getElementById('verifyInput').value = decodedText;
                    }
                    html5QrcodeScanner.stop();
                    container.style.display = 'none';
                    verifyDocument();
                },
                function() {}
            ).catch(function(err) { console.error(err); });
        }
    } else {
        if (html5QrcodeScanner) html5QrcodeScanner.stop();
        container.style.display = 'none';
    }
}

