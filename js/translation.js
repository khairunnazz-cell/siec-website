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
        const { data, error } = await supabase
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
                    <span>KODE TRACKING TIDAK DITEMUKAN</span>
                </div>
                <p style="color:var(--danger);">
                    Kode tracking <strong>"${input}"</strong> tidak ditemukan.
                    Pastikan kode yang Anda masukkan benar.
                </p>
                <p style="margin-top:12px;">
                    <a href="https://wa.me/${WA_NUMBER}?text=Halo%20SIEC,%20saya%20ingin%20menanyakan%20status%20terjemahan%20dengan%20kode:%20${input}" style="color:var(--primary);font-weight:600;">
                        <i class="fab fa-whatsapp"></i> Hubungi kami
                    </a>
                </p>
            `;
        } else {
            const statusMap = {
                'received': { label: 'Dokumen Diterima', icon: 'inbox', color: '#2563eb', step: 1 },
                'processing': { label: 'Sedang Diterjemahkan', icon: 'cogs', color: '#f59e0b', step: 2 },
                'review': { label: 'Tahap Review', icon: 'search', color: '#7c3aed', step: 3 },
                'completed': { label: 'Selesai', icon: 'check-circle', color: '#10b981', step: 4 },
                'delivered': { label: 'Sudah Diserahkan', icon: 'handshake', color: '#065f46', step: 5 }
            };

            const status = statusMap[data.status] || statusMap['received'];

            resultDiv.className = 'verify-result result-valid';
            resultDiv.innerHTML = `
                <div class="result-header">
                    <i class="fas fa-${status.icon}" style="color:${status.color}"></i>
                    <span style="color:${status.color}">${status.label.toUpperCase()}</span>
                </div>

                <!-- Progress Bar -->
                <div style="margin:20px 0;background:var(--gray-200);border-radius:10px;height:8px;overflow:hidden;">
                    <div style="width:${(status.step / 5) * 100}%;background:linear-gradient(90deg,var(--primary),var(--success));height:100%;border-radius:10px;transition:width 0.5s ease;"></div>
                </div>

                <!-- Steps -->
                <div style="display:flex;justify-content:space-between;margin-bottom:24px;font-size:0.7rem;color:var(--gray-500);">
                    <span style="color:${status.step >= 1 ? status.color : ''}">Diterima</span>
                    <span style="color:${status.step >= 2 ? status.color : ''}">Proses</span>
                    <span style="color:${status.step >= 3 ? status.color : ''}">Review</span>
                    <span style="color:${status.step >= 4 ? status.color : ''}">Selesai</span>
                    <span style="color:${status.step >= 5 ? status.color : ''}">Diserahkan</span>
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
                        <p>${data.estimated_completion ? formatDate(data.estimated_completion) : 'Belum ditentukan'}</p>
                    </div>
                    ${data.status_description ? `
                    <div class="result-item" style="grid-column:span 2;">
                        <label>Keterangan</label>
                        <p>${data.status_description}</p>
                    </div>
                    ` : ''}
                </div>
                <p style="margin-top:16px;font-size:0.85rem;color:var(--gray-600);">
                    Terakhir diperbarui: ${formatDate(data.updated_at)}
                </p>
            `;
        }
    } catch (err) {
        resultDiv.style.display = 'block';
        resultDiv.className = 'verify-result result-invalid';
        resultDiv.innerHTML = `<p>Terjadi kesalahan. Coba lagi.</p>`;
        console.error(err);
    }
}