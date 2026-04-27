// ============================================
// SIEC - Translation Status (Public)
// ============================================

async function checkStatus() {
    const input = document.getElementById('trackingInput').value.trim();
    const resultDiv = document.getElementById('statusResult');

    if (!input) {
        showNotification('Masukkan kode tracking!', 'error');
        return;
    }

    try {
        const { data, error } = await db
            .from('translation_status')
            .select('*')
            .eq('tracking_code', input)
            .single();

        resultDiv.style.display = 'block';

        if (error || !data) {
            resultDiv.className = 'verify-result result-invalid';
            resultDiv.innerHTML = `
                <div class="result-header">
                    <i class="fas fa-times-circle"></i>
                    <span>KODE TIDAK DITEMUKAN</span>
                </div>
                <p>Kode <strong>"${input}"</strong> tidak ditemukan.</p>
                <p style="margin-top:12px;">
                    <a href="https://wa.me/${WA_NUMBER}" style="color:var(--primary);font-weight:600;">
                        <i class="fab fa-whatsapp"></i> Hubungi kami
                    </a>
                </p>
            `;
        } else {
            const statusMap = {
                'received':   { label: 'Dokumen Diterima',    step: 1 },
                'processing': { label: 'Sedang Diterjemahkan', step: 2 },
                'review':     { label: 'Tahap Review',         step: 3 },
                'completed':  { label: 'Selesai',              step: 4 },
                'delivered':  { label: 'Sudah Diserahkan',     step: 5 }
            };

            const status = statusMap[data.status] || statusMap['received'];

            resultDiv.className = 'verify-result result-valid';
            resultDiv.innerHTML = `
                <div class="result-header">
                    <i class="fas fa-check-circle"></i>
                    <span>${status.label.toUpperCase()}</span>
                </div>
                <div style="margin:16px 0;background:var(--gray-200);
                            border-radius:10px;height:8px;overflow:hidden;">
                    <div style="width:${(status.step/5)*100}%;
                                background:linear-gradient(90deg,var(--primary),var(--success));
                                height:100%;border-radius:10px;">
                    </div>
                </div>
                <div class="result-details">
                    <div class="result-item">
                        <label>Kode Tracking</label>
                        <p>${data.tracking_code}</p>
                    </div>
                    <div class="result-item">
                        <label>Nama Klien</label>
                        <p>${data.client_name}</p>
                    </div>
                    <div class="result-item">
                        <label>Jenis Dokumen</label>
                        <p>${data.document_type}</p>
                    </div>
                    <div class="result-item">
                        <label>Estimasi Selesai</label>
                        <p>${data.estimated_completion 
                            ? formatDate(data.estimated_completion) 
                            : 'Belum ditentukan'}</p>
                    </div>
                </div>
            `;
        }
    } catch (err) {
        resultDiv.style.display = 'block';
        resultDiv.className = 'verify-result result-invalid';
        resultDiv.innerHTML = `<p>Terjadi kesalahan. Coba lagi.</p>`;
        console.error(err);
    }
}