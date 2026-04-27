// ============================================
// SIEC - Document Verification
// ============================================

let currentTab = 'translation';

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.verify-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.verify-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            document.getElementById('verifyResult').style.display = 'none';
        });
    });

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
            ({ data, error } = await db
                .from('translation_documents')
                .select('*')
                .eq('document_id', input)
                .single());
        } else {
            ({ data, error } = await db
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
                    ID <strong>"${input}"</strong> tidak ditemukan dalam sistem SIEC.
                </p>
                <p style="margin-top:12px;">
                    <a href="https://wa.me/${WA_NUMBER}" style="color:var(--primary);font-weight:600;">
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
                        <span>DOKUMEN TERVERIFIKASI ✅</span>
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
                            <label>Jenis</label>
                            <p>${data.document_type}</p>
                        </div>
                        <div class="result-item">
                            <label>Bahasa</label>
                            <p>${data.source_language} → ${data.target_language}</p>
                        </div>
                        <div class="result-item">
                            <label>Tanggal Terbit</label>
                            <p>${formatDate(data.issued_date)}</p>
                        </div>
                    </div>
                    <p style="margin-top:16px;color:var(--success);font-size:0.85rem;">
                        <i class="fas fa-shield-alt"></i> 
                        Dokumen resmi diterbitkan oleh SIEC
                    </p>
                `;
            } else {
                resultDiv.innerHTML = `
                    <div class="result-header">
                        <i class="fas fa-check-circle"></i>
                        <span>SERTIFIKAT TERVERIFIKASI ✅</span>
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
                            <label>Listening</label>
                            <p>${data.listening_score}</p>
                        </div>
                        <div class="result-item">
                            <label>Structure</label>
                            <p>${data.structure_score}</p>
                        </div>
                        <div class="result-item">
                            <label>Reading</label>
                            <p>${data.reading_score}</p>
                        </div>
                        <div class="result-item">
                            <label>Total Score</label>
                            <p style="font-size:1.3rem;color:var(--primary);font-weight:800;">
                                ${data.total_score}
                            </p>
                        </div>
                        <div class="result-item">
                            <label>Status</label>
                            <p><span class="status-badge status-valid">✓ Valid</span></p>
                        </div>
                    </div>
                    <p style="margin-top:16px;color:var(--success);font-size:0.85rem;">
                        <i class="fas fa-shield-alt"></i> 
                        Sertifikat resmi diterbitkan oleh SIEC
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