// ============================================
// SIEC - Document Verification
// ============================================

let currentTab = 'translation';

document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    document.querySelectorAll('.verify-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.verify-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            document.getElementById('verifyInput').placeholder =
                currentTab === 'translation'
                    ? 'Masukkan ID Dokumen (contoh: SIEC-TR-2024-001)'
                    : 'Masukkan ID Sertifikat (contoh: SIEC-TF-2024-001)';
            document.getElementById('verifyResult').style.display = 'none';
        });
    });

    // Check URL params
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const type = params.get('type');
    if (id) {
        document.getElementById('verifyInput').value = id;
        if (type === 'toefl') {
            currentTab = 'toefl';
            document.querySelectorAll('.verify-tab').forEach(t => t.classList.remove('active'));
            document.querySelector('[data-tab="toefl"]').classList.add('active');
        }
        verifyDocument();
    }
});

async function verifyDocument() {
    const input = document.getElementById('verifyInput').value.trim();
    const resultDiv = document.getElementById('verifyResult');
    const btn = document.getElementById('verifyBtn');

    if (!input) {
        showNotification('Masukkan ID dokumen!', 'error');
        return;
    }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        let data, error;

        if (currentTab === 'translation') {
            ({ data, error } = await supabase
                .from('translation_documents')
                .select('*')
                .eq('document_id', input)
                .single());
        } else {
            ({ data, error } = await supabase
                .from('toefl_certificates')
                .select('*')
                .eq('certificate_id', input)
                .single());
        }

        resultDiv.style.display = 'block';

        if (error || !data) {
            resultDiv.className = 'verify-result result-invalid';
            resultDiv.innerHTML = `
                <div class="result-header">
                    <i class="fas fa-times-circle"></i>
                    <span>DOKUMEN TIDAK TERDAFTAR</span>
                </div>
                <p style="color:var(--danger);">
                    Dokumen dengan ID <strong>"${input}"</strong> tidak ditemukan dalam sistem SIEC.
                    Dokumen ini mungkin tidak valid atau ID yang dimasukkan salah.
                </p>
                <p style="margin-top:12px;">
                    <a href="https://wa.me/${WA_NUMBER}?text=Halo%20SIEC,%20saya%20ingin%20memverifikasi%20dokumen%20dengan%20ID:%20${input}" style="color:var(--primary);font-weight:600;">
                        <i class="fab fa-whatsapp"></i> Hubungi kami untuk konfirmasi
                    </a>
                </p>
            `;
        } else {
            resultDiv.className = 'verify-result result-valid';

            if (currentTab === 'translation') {
                resultDiv.innerHTML = `
                    <div class="result-header">
                        <i class="fas fa-check-circle"></i>
                        <span>DOKUMEN TERVERIFIKASI</span>
                    </div>
                    <div class="result-details">
                        <div class="result-item">
                            <label>ID Dokumen</label>
                            <p>${data.document_id}</p>
                        </div>
                        <div class="result-item">
                            <label>Nama Klien</label>
                            <p>${data.client_name}</p>
                        </div>
                        <div class="result-item">
                            <label>Judul Dokumen</label>
                            <p>${data.document_title}</p>
                        </div>
                        <div class="result-item">
                            <label>Jenis Dokumen</label>
                            <p>${data.document_type}</p>
                        </div>
                        <div class="result-item">
                            <label>Bahasa Sumber</label>
                            <p>${data.source_language}</p>
                        </div>
                        <div class="result-item">
                            <label>Bahasa Target</label>
                            <p>${data.target_language}</p>
                        </div>
                        <div class="result-item">
                            <label>Tanggal Terbit</label>
                            <p>${formatDate(data.issued_date)}</p>
                        </div>
                        <div class="result-item">
                            <label>Status</label>
                            <p><span class="status-badge status-valid">✓ Valid</span></p>
                        </div>
                    </div>
                    <p style="margin-top:16px;color:var(--success);font-size:0.85rem;">
                        <i class="fas fa-shield-alt"></i> Dokumen ini resmi diterbitkan oleh SIEC - Syaf Intensive English Course
                    </p>
                `;
            } else {
                resultDiv.innerHTML = `
                    <div class="result-header">
                        <i class="fas fa-check-circle"></i>
                        <span>SERTIFIKAT TERVERIFIKASI</span>
                    </div>
                    <div class="result-details">
                        <div class="result-item">
                            <label>ID Sertifikat</label>
                            <p>${data.certificate_id}</p>
                        </div>
                        <div class="result-item">
                            <label>Nama Peserta</label>
                            <p>${data.participant_name}</p>
                        </div>
                        <div class="result-item">
                            <label>Tanggal Tes</label>
                            <p>${formatDate(data.test_date)}</p>
                        </div>
                        <div class="result-item">
                            <label>Listening Score</label>
                            <p>${data.listening_score}</p>
                        </div>
                        <div class="result-item">
                            <label>Structure Score</label>
                            <p>${data.structure_score}</p>
                        </div>
                        <div class="result-item">
                            <label>Reading Score</label>
                            <p>${data.reading_score}</p>
                        </div>
                        <div class="result-item">
                            <label>Total Score</label>
                            <p style="font-size:1.3rem;color:var(--primary);">${data.total_score}</p>
                        </div>
                        <div class="result-item">
                            <label>Status</label>
                            <p><span class="status-badge status-valid">✓ Valid</span></p>
                        </div>
                    </div>
                    <p style="margin-top:16px;color:var(--success);font-size:0.85rem;">
                        <i class="fas fa-shield-alt"></i> Sertifikat ini resmi diterbitkan oleh SIEC - Syaf Intensive English Course
                    </p>
                `;
            }
        }
    } catch (err) {
        resultDiv.style.display = 'block';
        resultDiv.className = 'verify-result result-invalid';
        resultDiv.innerHTML = `<p>Terjadi kesalahan. Coba lagi.</p>`;
        console.error(err);
    }

    btn.innerHTML = '<i class="fas fa-check-circle"></i> Verifikasi';
    btn.disabled = false;
}

// Barcode Scanner
let html5QrcodeScanner = null;

function toggleScanner() {
    const container = document.getElementById('scannerContainer');
    if (container.style.display === 'none') {
        container.style.display = 'block';
        html5QrcodeScanner = new Html5Qrcode("reader");
        html5QrcodeScanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
                document.getElementById('verifyInput').value = decodedText;
                html5QrcodeScanner.stop();
                container.style.display = 'none';
                verifyDocument();
            },
            () => {}
        ).catch(err => console.error(err));
    } else {
        if (html5QrcodeScanner) html5QrcodeScanner.stop();
        container.style.display = 'none';
    }
}