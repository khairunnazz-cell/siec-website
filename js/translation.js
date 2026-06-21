// ============================================
// SIEC - Cek Status Penerjemahan
// Support: translation_clients & online_registrations
// ============================================

async function checkStatus() {
    var input = document.getElementById('trackingInput').value.trim();
    var resultDiv = document.getElementById('statusResult');

    if (!input) {
        showNotification('Masukkan kode tracking atau nomor HP!', 'error');
        return;
    }

    try {
        // Cek di translation_clients dulu
        var result = await db.from('translation_clients')
            .select('*')
            .or('document_id.eq.' + input + ',client_phone.eq.' + input)
            .order('created_at', { ascending: false });

        // Jika tidak ada, cek di online_registrations
        if (!result.data || result.data.length === 0) {
            result = await db.from('online_registrations')
                .select('*')
                .or('reg_code.eq.' + input + ',client_phone.eq.' + input)
                .order('created_at', { ascending: false });

            if (result.data && result.data.length > 0) {
                var statusMap = {
                    'checking': 'Menunggu Verifikasi Pembayaran',
                    'valid': 'Pembayaran Valid - Menunggu Proses',
                    'rejected': 'Pembayaran Ditolak',
                    'in_progress': 'Sedang Diterjemahkan',
                    'completed': 'Selesai'
                };

                result.data = result.data.map(function(reg) {
                    return {
                        document_id: reg.reg_code,
                        client_name: reg.client_name,
                        client_phone: reg.client_phone,
                        document_type: 'Abstrak Skripsi (Online)',
                        source_language: 'Indonesia',
                        target_language: (reg.language_1 || '').split('→')[1] || (reg.language_1 || '').split('->')[1] || 'English',
                        status: reg.payment_status === 'in_progress' ? 'processing' :
                                reg.payment_status === 'completed' ? 'completed' :
                                reg.payment_status === 'rejected' ? 'rejected' :
                                reg.payment_status === 'valid' ? 'processing' : 'pending',
                        created_at: reg.created_at,
                        completed_at: reg.payment_status === 'completed' ? reg.updated_at : null,
                        updated_at: reg.updated_at,
                        file_url: reg.file_url,
                        _custom_status: statusMap[reg.payment_status] || reg.payment_status,
                        _is_online_reg: true,
                        _rejection_reason: reg.payment_status === 'rejected' ? (reg.notes || '').replace('Ditolak: ', '') : null,
                        _payment_status: reg.payment_status
                    };
                });
            }
        }

        resultDiv.style.display = 'block';

        if (!result.data || result.data.length === 0) {
            resultDiv.className = 'verify-result result-invalid';
            resultDiv.innerHTML =
                '<div class="result-header">' +
                '<i class="fas fa-times-circle"></i>' +
                '<span>DATA TIDAK DITEMUKAN</span>' +
                '</div>' +
                '<p>Kode <strong>"' + input + '"</strong> atau No. HP tidak ditemukan dalam sistem.</p>' +
                '<p style="margin-top:12px;">' +
                '<a href="https://wa.me/' + WA_NUMBER + '?text=Halo%20SIEC,%20saya%20ingin%20menanyakan%20status%20terjemahan" style="color:var(--primary);font-weight:600;">' +
                '<i class="fab fa-whatsapp"></i> Hubungi kami' +
                '</a>' +
                '</p>';
            return;
        }

        var data = result.data[0];

        // Khusus rejected
        if (data._rejection_reason) {
            resultDiv.className = 'verify-result result-invalid';
            resultDiv.innerHTML =
                '<div class="result-header" style="color:#ef4444">' +
                '<i class="fas fa-times-circle"></i>' +
                '<span>PEMBAYARAN DITOLAK</span>' +
                '</div>' +

                '<div style="margin:16px 0;padding:16px;background:#fef2f2;border:2px solid #ef4444;border-radius:12px">' +
                '<p style="color:#991b1b;font-weight:700;margin-bottom:8px"><i class="fas fa-exclamation-triangle"></i> Alasan Penolakan:</p>' +
                '<p style="color:#7f1d1d;font-size:1rem">' + data._rejection_reason + '</p>' +
                '</div>' +

                '<div class="result-details">' +
                '<div class="result-item"><label>Kode Pendaftaran</label><p>' + data.document_id + '</p></div>' +
                '<div class="result-item"><label>Nama Klien</label><p>' + data.client_name + '</p></div>' +
                '<div class="result-item"><label>Jenis Dokumen</label><p>' + data.document_type + '</p></div>' +
                '<div class="result-item"><label>Bahasa</label><p>' + data.source_language + ' → ' + data.target_language + '</p></div>' +
                '<div class="result-item"><label>Tanggal Daftar</label><p>' + formatDate(data.created_at) + '</p></div>' +
                '<div class="result-item"><label>Diperbarui</label><p>' + formatDate(data.updated_at) + '</p></div>' +
                '</div>' +

                '<div style="margin-top:20px;text-align:center;padding:16px;background:#fef3c7;border:2px solid #f59e0b;border-radius:12px">' +
                '<p style="color:#78350f;font-weight:600;margin-bottom:12px">💡 Silakan hubungi kami untuk informasi lebih lanjut atau melakukan pembayaran ulang</p>' +
                '<a href="https://wa.me/' + WA_NUMBER + '?text=Halo%20SIEC,%20saya%20ingin%20menanyakan%20tentang%20pendaftaran%20' + data.document_id + '%20yang%20ditolak" target="_blank" class="btn btn-success" style="display:inline-flex;gap:8px;padding:12px 24px">' +
                '<i class="fab fa-whatsapp"></i> Hubungi via WhatsApp' +
                '</a>' +
                '</div>';
            return;
        }

        // Status normal
        var statusMap = {
            'pending':    { label: 'Menunggu Konfirmasi',   step: 1, color: '#94a3b8' },
            'processing': { label: 'Sedang Diterjemahkan',  step: 2, color: '#f59e0b' },
            'completed':  { label: 'Selesai',                step: 4, color: '#10b981' },
            'delivered':  { label: 'Sudah Diserahkan',       step: 5, color: '#065f46' }
        };

        var status = statusMap[data.status] || statusMap['pending'];

        // Override label jika ada custom status
        if (data._custom_status) {
            status.label = data._custom_status;
        }

        // Hitung durasi
        var durationText = '';
        if (data.completed_at) {
            durationText = calculateDur(data.created_at, data.completed_at);
        } else {
            durationText = calculateDur(data.created_at, new Date().toISOString()) + ' (berjalan)';
        }

        // Tombol download jika sudah selesai
        var downloadBtn = '';
        if (data.status === 'completed' && data.file_url) {
            downloadBtn =
                '<div style="margin-top:20px;text-align:center;padding:16px;background:#ecfdf5;border:2px solid #10b981;border-radius:12px;">' +
                '<p style="font-weight:700;color:#10b981;margin-bottom:12px;">' +
                '<i class="fas fa-check-circle"></i> Dokumen Anda sudah selesai!' +
                '</p>' +
                '<a href="' + data.file_url + '" target="_blank" class="btn btn-success" style="display:inline-flex;gap:8px;padding:14px 28px;font-size:1.05rem;">' +
                '<i class="fas fa-download"></i> Download Hasil Terjemahan' +
                '</a>' +
                (data.document_id ? '<p style="margin-top:12px;font-size:0.85rem;color:var(--gray-600);">ID Verifikasi: <strong>' + data.document_id + '</strong></p>' : '') +
                '</div>';
        }

        // Info pembayaran untuk online reg
        var paymentInfo = '';
        if (data._is_online_reg) {
            if (data._payment_status === 'checking') {
                paymentInfo =
                    '<div style="margin-top:16px;padding:12px;background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;text-align:center">' +
                    '<p style="color:#78350f;margin:0"><i class="fas fa-clock"></i> Pembayaran sedang diverifikasi oleh admin</p>' +
                    '</div>';
            } else if (data._payment_status === 'valid') {
                paymentInfo =
                    '<div style="margin-top:16px;padding:12px;background:#dbeafe;border:2px solid #2563eb;border-radius:8px;text-align:center">' +
                    '<p style="color:#1e40af;margin:0"><i class="fas fa-check-circle"></i> Pembayaran tervalidasi, menunggu penerjemah</p>' +
                    '</div>';
            } else if (data._payment_status === 'in_progress') {
                paymentInfo =
                    '<div style="margin-top:16px;padding:12px;background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;text-align:center">' +
                    '<p style="color:#78350f;margin:0"><i class="fas fa-cogs"></i> Dokumen sedang diterjemahkan oleh tim kami</p>' +
                    '</div>';
            }
        }

        resultDiv.className = 'verify-result result-valid';
        resultDiv.innerHTML =
            '<div class="result-header">' +
            '<i class="fas fa-check-circle"></i>' +
            '<span style="color:' + status.color + '">' + status.label.toUpperCase() + '</span>' +
            '</div>' +

            // Progress bar
            '<div style="margin:16px 0;background:var(--gray-200);border-radius:10px;height:10px;overflow:hidden;">' +
            '<div style="width:' + (status.step / 5 * 100) + '%;background:linear-gradient(90deg,var(--primary),' + status.color + ');height:100%;border-radius:10px;transition:width 0.5s ease;"></div>' +
            '</div>' +

            // Steps
            '<div style="display:flex;justify-content:space-between;margin-bottom:24px;font-size:0.7rem;color:var(--gray-500);">' +
            '<span style="' + (status.step >= 1 ? 'color:' + status.color + ';font-weight:700' : '') + '">Diterima</span>' +
            '<span style="' + (status.step >= 2 ? 'color:' + status.color + ';font-weight:700' : '') + '">Proses</span>' +
            '<span style="' + (status.step >= 3 ? 'color:' + status.color + ';font-weight:700' : '') + '">Review</span>' +
            '<span style="' + (status.step >= 4 ? 'color:' + status.color + ';font-weight:700' : '') + '">Selesai</span>' +
            '<span style="' + (status.step >= 5 ? 'color:' + status.color + ';font-weight:700' : '') + '">Diserahkan</span>' +
            '</div>' +

            paymentInfo +

            // Detail
            '<div class="result-details" style="margin-top:16px">' +
            '<div class="result-item">' +
            '<label>ID/Kode</label>' +
            '<p>' + (data.document_id || 'Belum tersedia') + '</p>' +
            '</div>' +
            '<div class="result-item">' +
            '<label>Nama Klien</label>' +
            '<p>' + data.client_name + '</p>' +
            '</div>' +
            '<div class="result-item">' +
            '<label>Jenis Dokumen</label>' +
            '<p>' + data.document_type + '</p>' +
            '</div>' +
            '<div class="result-item">' +
            '<label>Bahasa</label>' +
            '<p>' + data.source_language + ' → ' + data.target_language + '</p>' +
            '</div>' +
            '<div class="result-item">' +
            '<label>Tanggal Daftar</label>' +
            '<p>' + formatDate(data.created_at) + '</p>' +
            '</div>' +
            '<div class="result-item">' +
            '<label>' + (data.completed_at ? 'Selesai' : 'Estimasi') + '</label>' +
            '<p>' + (data.completed_at ? formatDate(data.completed_at) : '3-7 hari kerja') + '</p>' +
            '</div>' +
            '<div class="result-item" style="grid-column:span 2;">' +
            '<label>Durasi Proses</label>' +
            '<p style="font-size:1.1rem;color:var(--primary);">' + durationText + '</p>' +
            '</div>' +
            '</div>' +

            downloadBtn +

            '<p style="margin-top:16px;font-size:0.8rem;color:var(--gray-600);text-align:center;">' +
            'Terakhir diperbarui: ' + formatDate(data.updated_at) +
            '</p>';

    } catch (err) {
        resultDiv.style.display = 'block';
        resultDiv.className = 'verify-result result-invalid';
        resultDiv.innerHTML = '<p>Terjadi kesalahan: ' + err.message + '</p>';
        console.error(err);
    }
}

function calculateDur(start, end) {
    if (!start || !end) return '-';
    var s = new Date(start), e = new Date(end);
    var diff = e - s;
    var days = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);
    var mins = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return days + ' hari ' + hours + ' jam';
    if (hours > 0) return hours + ' jam ' + mins + ' menit';
    return mins + ' menit';
}