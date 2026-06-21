// ============================================
// SIEC - Cek Status Penerjemahan
// Membaca dari translation_clients
// ============================================

async function checkStatus() {
    var input = document.getElementById('trackingInput').value.trim();
    var resultDiv = document.getElementById('statusResult');

    if (!input) {
        showNotification('Masukkan kode tracking atau nomor HP!', 'error');
        return;
    }

    try {
        // Cari berdasarkan document_id ATAU client_phone
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
        // Map ke format yang sama
        result.data = result.data.map(function(reg) {
            var statusMap = {
                'checking': 'Menunggu Verifikasi Pembayaran',
                'valid': 'Pembayaran Valid - Menunggu Proses',
                'rejected': 'Pembayaran Ditolak',
                'in_progress': 'Sedang Diterjemahkan',
                'completed': 'Selesai'
            };
            return {
                document_id: reg.reg_code,
                client_name: reg.client_name,
                client_phone: reg.client_phone,
                document_type: 'Abstrak Skripsi (Online)',
                source_language: 'Indonesia',
                target_language: reg.language_1.split('→')[1] || 'English',
                status: reg.payment_status === 'in_progress' ? 'processing' : (reg.payment_status === 'completed' ? 'completed' : 'pending'),
                created_at: reg.created_at,
                completed_at: reg.payment_status === 'completed' ? reg.updated_at : null,
                updated_at: reg.updated_at,
                file_url: reg.file_url,
                _custom_status: statusMap[reg.payment_status] || reg.payment_status,
                _is_online_reg: true
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

        var statusMap = {
            'pending':    { label: 'Menunggu Konfirmasi',   step: 1, color: '#94a3b8' },
            'processing': { label: 'Sedang Diterjemahkan',  step: 2, color: '#f59e0b' },
            'completed':  { label: 'Selesai',                step: 4, color: '#10b981' },
            'delivered':  { label: 'Sudah Diserahkan',       step: 5, color: '#065f46' }
        };

        var status = statusMap[data.status] || statusMap['pending'];

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

            // Detail
            '<div class="result-details">' +
            '<div class="result-item">' +
            '<label>ID Dokumen</label>' +
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