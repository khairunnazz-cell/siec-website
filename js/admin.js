var LOGO_URL='assets/logo.png',toeflFileData=null,uploadFileData=null;

// ============================================
// DATA KAMPUS
// ============================================
var DATA_KAMPUS = {
    'Universitas Islam Negeri Sultan Syarif Kasim Riau': {
        fakultas: {
            'Tarbiyah dan Keguruan': ['Pendidikan Agama Islam (PAI)','Pendidikan Bahasa Arab (PBA)','Pendidikan Bahasa Inggris (PBI)','Manajemen Pendidikan Islam (MPI)','Pendidikan Matematika','Pendidikan Kimia','Pendidikan Guru Madrasah Ibtidaiyah (PGMI)','Pendidikan Islam Anak Usia Dini (PIAUD)','Tadris IPA','Tadris IPS','Pendidikan Ekonomi','Pendidikan Geografi','Pendidikan Bahasa Indonesia','Bimbingan dan Konseling Pendidikan Islam (BKPI)'],
            'Ushuluddin': ['Ilmu Akidah','Ilmu Al-Quran dan Tafsir','Perbandingan Agama']
        }
    },
    'STAI Sulthan Syarif Hasyim Siak Sri Indrapura Riau': {
        fakultas: null,
        jurusan: ['S1 - Pendidikan Guru Madrasah Ibtidaiyah','S1 - Ekonomi Syariah','S1 - Pendidikan Agama Islam','S1 - Hukum Keluarga Islam (Ahwal Syakhshiyyah)']
    },
    'STAI Al-Kifayah Riau': {
        fakultas: null,
        jurusan: ['Pendidikan Guru Madrasah Ibtidaiyah (PGMI)','Pendidikan Islam Anak Usia Dini (PIAUD)','Pendidikan Agama Islam (PAI)','Bimbingan dan Konseling Pendidikan Islam (BKPI)','Manajemen Bisnis Syariah','Hukum Keluarga Islam','Hukum Tata Negara','Akuntansi Syariah','Magister Pendidikan Agama Islam']
    }
};

function onDocTypeChange() {
    var docType = document.getElementById('regDocType').value;
    var abstrakFields = document.getElementById('abstrakFields');
    if (docType === 'Abstrak Skripsi') abstrakFields.style.display = 'block';
    else { abstrakFields.style.display = 'none'; document.getElementById('regUniversitas').value = ''; document.getElementById('fakultasGroup').style.display = 'none'; document.getElementById('jurusanGroup').style.display = 'none'; }
}

function onUniversitasChange() {
    var univ = document.getElementById('regUniversitas').value;
    var fakultasGroup = document.getElementById('fakultasGroup'), jurusanGroup = document.getElementById('jurusanGroup');
    var fakultasSelect = document.getElementById('regFakultas'), jurusanSelect = document.getElementById('regJurusan');
    fakultasSelect.innerHTML = '<option value="">-- Pilih Fakultas --</option>';
    jurusanSelect.innerHTML = '<option value="">-- Pilih Jurusan --</option>';
    fakultasGroup.style.display = 'none'; jurusanGroup.style.display = 'none';
    if (!univ || !DATA_KAMPUS[univ]) return;
    var data = DATA_KAMPUS[univ];
    if (data.fakultas) {
        Object.keys(data.fakultas).forEach(function(f) { var opt = document.createElement('option'); opt.value = f; opt.textContent = f; fakultasSelect.appendChild(opt); });
        fakultasGroup.style.display = 'block';
    } else if (data.jurusan) {
        data.jurusan.forEach(function(j) { var opt = document.createElement('option'); opt.value = j; opt.textContent = j; jurusanSelect.appendChild(opt); });
        jurusanGroup.style.display = 'block';
    }
}

function onFakultasChange() {
    var univ = document.getElementById('regUniversitas').value, fakultas = document.getElementById('regFakultas').value;
    var jurusanGroup = document.getElementById('jurusanGroup'), jurusanSelect = document.getElementById('regJurusan');
    jurusanSelect.innerHTML = '<option value="">-- Pilih Jurusan --</option>';
    jurusanGroup.style.display = 'none';
    if (!univ || !fakultas || !DATA_KAMPUS[univ] || !DATA_KAMPUS[univ].fakultas) return;
    var jurusanList = DATA_KAMPUS[univ].fakultas[fakultas];
    if (jurusanList) {
        jurusanList.forEach(function(j) { var opt = document.createElement('option'); opt.value = j; opt.textContent = j; jurusanSelect.appendChild(opt); });
        jurusanGroup.style.display = 'block';
    }
}

// ============================================
// QR CODE
// ============================================
function getQrUrl(t,s){return'https://api.qrserver.com/v1/create-qr-code/?size='+(s||150)+'x'+(s||150)+'&data='+encodeURIComponent(t||location.origin)+'&ecc=H&margin=4&format=png'}
function generateQr(id,t,s){var e=document.getElementById(id);if(!e)return;var z=parseInt(s)||100,l=Math.round(z*.22);e.innerHTML='<div style="position:relative;display:inline-block;width:'+z+'px;height:'+z+'px"><img src="'+getQrUrl(t,z)+'" width="'+z+'" height="'+z+'" style="display:block;border-radius:4px"><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:'+l+'px;height:'+l+'px;border-radius:50%;overflow:hidden;background:#fff;border:2px solid #fff;box-shadow:0 0 0 1px #2563eb"><img src="'+LOGO_URL+'" style="width:100%;height:100%;object-fit:contain" onerror="this.parentElement.innerHTML=\'<div style=width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#fff><span style=font-weight:800;color:#2563eb;font-size:'+Math.round(l*.35)+'px>SIEC</span></div>\'"></div></div>'}

async function embedQrInPdf(file, qrText, idText, posXPct, posYPct, qrSizePx) {
    var ab = await file.arrayBuffer();
    var doc = await PDFLib.PDFDocument.load(ab);
    var pg = doc.getPages()[0];
    var pw = pg.getWidth(), ph = pg.getHeight();
    var resp = await fetch(getQrUrl(qrText, 300));
    if (!resp.ok) throw new Error('QR fetch fail');
    var qrBuf = await resp.arrayBuffer();
    var qrImg = await doc.embedPng(qrBuf);
    var sz = parseInt(qrSizePx) || 80;
    var adjustedY = (posYPct - 5) / 90 * 100;
    if (adjustedY < 0) adjustedY = 0;
    if (adjustedY > 100) adjustedY = 100;
    var pdfX = (posXPct / 100) * pw - (sz / 2);
    var pdfY = ph - ((adjustedY / 100) * ph) - (sz / 2);
    if (pdfX < 5) pdfX = 5;
    if (pdfX > pw - sz - 5) pdfX = pw - sz - 5;
    if (pdfY < 25) pdfY = 25;
    if (pdfY > ph - sz - 5) pdfY = ph - sz - 5;
    pg.drawRectangle({ x: pdfX - 4, y: pdfY - 22, width: sz + 8, height: sz + 26, color: PDFLib.rgb(1, 1, 1) });
    pg.drawImage(qrImg, { x: pdfX, y: pdfY, width: sz, height: sz });
    if (idText) {
        var font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
        var tw = font.widthOfTextAtSize(idText, 7);
        pg.drawText(idText, { x: pdfX + (sz - tw) / 2, y: pdfY - 10, size: 7, font: font, color: PDFLib.rgb(0, 0, 0) });
        var vt = 'Scan QR untuk verifikasi';
        var vw = font.widthOfTextAtSize(vt, 5);
        pg.drawText(vt, { x: pdfX + (sz - vw) / 2, y: pdfY - 18, size: 5, font: font, color: PDFLib.rgb(0.5, 0.5, 0.5) });
    }
    try {
        var lr = await fetch(LOGO_URL);
        if (lr.ok) {
            var lb = await lr.arrayBuffer();
            var li = await doc.embedPng(lb);
            var ls = sz * 0.22;
            pg.drawCircle({ x: pdfX + sz / 2, y: pdfY + sz / 2, size: ls / 2 + 2, color: PDFLib.rgb(1, 1, 1) });
            pg.drawImage(li, { x: pdfX + (sz - ls) / 2, y: pdfY + (sz - ls) / 2, width: ls, height: ls });
        }
    } catch (e) {}
    return new Blob([await doc.save()], { type: 'application/pdf' });
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    var a = checkAuth(); if (!a) return;
    var n = document.getElementById('adminName'); if (n) n.textContent = a.full_name;
    document.querySelectorAll('.sidebar-link[data-section]').forEach(function(l) {
        l.addEventListener('click', function(e) { e.preventDefault(); switchSection(l.dataset.section); });
    });
    var t = document.getElementById('sidebarToggle'), c = document.getElementById('sidebarClose'), s = document.getElementById('adminSidebar');
    if (t) t.addEventListener('click', function() { s.classList.toggle('active'); });
    if (c) c.addEventListener('click', function() { s.classList.remove('active'); });

    // Dark mode
    var savedTheme = localStorage.getItem('siec_theme');
    if (savedTheme === 'dark') document.body.classList.add('dark-mode');
    var darkBtn = document.getElementById('darkModeToggle');
    if (darkBtn) darkBtn.addEventListener('click', toggleDarkMode);

    loadDashboardStats(); loadAdminArticles(); loadAdminPrograms();
    loadTerjemahan(); loadAdminToefl();

    setTimeout(loadAnalytics, 1000);
});

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('siec_theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

function switchSection(s) {
    document.querySelectorAll('.admin-section').forEach(function(x) { x.classList.remove('active'); });
    document.querySelectorAll('.sidebar-link').forEach(function(x) { x.classList.remove('active'); });
    var e = document.getElementById('section-' + s); if (e) e.classList.add('active');
    var l = document.querySelector('[data-section="' + s + '"]'); if (l) l.classList.add('active');
    var m = { 'dashboard': 'Dashboard', 'articles': 'Artikel', 'programs': 'Program', 'terjemahan': 'Terjemahan', 'toefl': 'TOEFL', 'testimonials': 'Testimoni' };
    var t = document.getElementById('pageTitle'); if (t) t.textContent = m[s] || 'Dashboard';
    document.getElementById('adminSidebar').classList.remove('active');
    if (s === 'dashboard') loadAnalytics();
    if (s === 'testimonials') loadTestimonialsAdmin();
}

// ============================================
// DASHBOARD STATS + ANALYTICS
// ============================================
async function loadDashboardStats() {
    try {
        var a = await db.from('articles').select('*', { count: 'exact', head: true });
        var pen = await db.from('translation_clients').select('*', { count: 'exact', head: true }).in('status', ['pending', 'processing']);
        var com = await db.from('translation_clients').select('*', { count: 'exact', head: true }).eq('status', 'completed');
        var ce = await db.from('toefl_certificates').select('*', { count: 'exact', head: true });
        var p = await db.from('learning_programs').select('*', { count: 'exact', head: true }).eq('is_active', true);
        document.getElementById('totalArticles').textContent = a.count || 0;
        document.getElementById('totalPending').textContent = pen.count || 0;
        document.getElementById('totalCompleted').textContent = com.count || 0;
        document.getElementById('totalCertificates').textContent = ce.count || 0;
        document.getElementById('totalPrograms').textContent = p.count || 0;
    } catch (e) { console.error(e); }
}

async function loadAnalytics() {
    var chartContainer = document.getElementById('chartContainer');
    if (!chartContainer) return;

    try {
        var r = await db.from('translation_clients').select('*');
        if (!r.data) return;

        // Group by month (last 6 months)
        var months = {};
        var now = new Date();
        for (var i = 5; i >= 0; i--) {
            var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            var label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
            months[key] = { label: label, count: 0, completed: 0 };
        }

        r.data.forEach(function(c) {
            var d = new Date(c.created_at);
            var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            if (months[key]) {
                months[key].count++;
                if (c.status === 'completed') months[key].completed++;
            }
        });

        // Group by document type
        var docTypes = {};
        r.data.forEach(function(c) {
            var t = c.document_type || 'Lainnya';
            if (!docTypes[t]) docTypes[t] = 0;
            docTypes[t]++;
        });

        // Avg duration
        var totalDur = 0, durCount = 0;
        r.data.forEach(function(c) {
            if (c.completed_at && c.created_at) {
                totalDur += new Date(c.completed_at) - new Date(c.created_at);
                durCount++;
            }
        });
        var avgDays = durCount > 0 ? (totalDur / durCount / 86400000).toFixed(1) : 0;

        // Render
        var maxCount = Math.max.apply(null, Object.values(months).map(function(m) { return m.count; }));
        if (maxCount === 0) maxCount = 1;

        var monthBars = Object.values(months).map(function(m) {
            var hPct = (m.count / maxCount) * 100;
            var hPctC = (m.completed / maxCount) * 100;
            return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">' +
                '<div style="width:100%;height:120px;display:flex;align-items:flex-end;justify-content:center;gap:2px">' +
                '<div title="Total: ' + m.count + '" style="width:40%;height:' + hPct + '%;background:linear-gradient(180deg,#2563eb,#7c3aed);border-radius:4px 4px 0 0;min-height:2px"></div>' +
                '<div title="Selesai: ' + m.completed + '" style="width:40%;height:' + hPctC + '%;background:linear-gradient(180deg,#10b981,#059669);border-radius:4px 4px 0 0;min-height:2px"></div>' +
                '</div>' +
                '<div style="font-size:0.7rem;color:#666">' + m.label + '</div>' +
                '<div style="font-size:0.65rem;color:#2563eb;font-weight:700">' + m.count + '/' + m.completed + '</div>' +
                '</div>';
        }).join('');

        var docTypesList = Object.entries(docTypes).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 5).map(function(d) {
            var pct = Math.round((d[1] / r.data.length) * 100);
            return '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:4px"><span>' + d[0] + '</span><strong>' + d[1] + ' (' + pct + '%)</strong></div><div style="background:#e2e8f0;border-radius:4px;overflow:hidden;height:8px"><div style="background:linear-gradient(90deg,#2563eb,#7c3aed);height:100%;width:' + pct + '%"></div></div></div>';
        }).join('');

        chartContainer.innerHTML =
            '<div class="analytics-grid">' +
            '<div class="chart-card">' +
            '<h4><i class="fas fa-chart-bar"></i> Klien per Bulan (6 bulan terakhir)</h4>' +
            '<div style="display:flex;gap:8px;align-items:flex-end;height:160px;margin-top:16px">' + monthBars + '</div>' +
            '<div style="display:flex;gap:16px;justify-content:center;margin-top:12px;font-size:0.75rem">' +
            '<span><span style="display:inline-block;width:12px;height:12px;background:linear-gradient(180deg,#2563eb,#7c3aed);border-radius:2px;vertical-align:middle"></span> Total</span>' +
            '<span><span style="display:inline-block;width:12px;height:12px;background:linear-gradient(180deg,#10b981,#059669);border-radius:2px;vertical-align:middle"></span> Selesai</span>' +
            '</div>' +
            '</div>' +

            '<div class="chart-card">' +
            '<h4><i class="fas fa-trophy"></i> Top 5 Jenis Dokumen</h4>' +
            '<div style="margin-top:16px">' + (docTypesList || '<p style="color:#666;font-size:0.85rem">Belum ada data</p>') + '</div>' +
            '</div>' +

            '<div class="chart-card">' +
            '<h4><i class="fas fa-stopwatch"></i> Statistik</h4>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px">' +
            '<div style="padding:12px;background:#dbeafe;border-radius:8px;text-align:center"><div style="font-size:1.8rem;font-weight:800;color:#2563eb">' + avgDays + '</div><div style="font-size:0.75rem;color:#666">Rata-rata Hari</div></div>' +
            '<div style="padding:12px;background:#dcfce7;border-radius:8px;text-align:center"><div style="font-size:1.8rem;font-weight:800;color:#10b981">' + (r.data.length > 0 ? Math.round((r.data.filter(function(c) { return c.status === 'completed'; }).length / r.data.length) * 100) : 0) + '%</div><div style="font-size:0.75rem;color:#666">Tingkat Selesai</div></div>' +
            '<div style="padding:12px;background:#fef3c7;border-radius:8px;text-align:center"><div style="font-size:1.8rem;font-weight:800;color:#d97706">' + r.data.length + '</div><div style="font-size:0.75rem;color:#666">Total Klien</div></div>' +
            '<div style="padding:12px;background:#fce7f3;border-radius:8px;text-align:center"><div style="font-size:1.8rem;font-weight:800;color:#db2777">' + (r.data.filter(function(c) { return c.document_type === 'Abstrak Skripsi'; }).length) + '</div><div style="font-size:0.75rem;color:#666">Abstrak Skripsi</div></div>' +
            '</div>' +
            '</div>' +
            '</div>';
    } catch (e) { console.error(e); }
}

function insertTag(t) { var e = document.getElementById('articleContent'), s = e.selectionStart, n = e.selectionEnd, x = e.value.substring(s, n); e.value = e.value.substring(0, s) + '<' + t + '>' + x + '</' + t + '>' + e.value.substring(n); e.focus(); }
function togglePreview() { var p = document.getElementById('articlePreview'); if (p.style.display === 'none') { p.innerHTML = document.getElementById('articleContent').value; p.style.display = 'block'; } else p.style.display = 'none'; }
function closePrintPreview(id) { document.getElementById(id).style.display = 'none'; }
function calculateToeflTotal() { var l = parseFloat(document.getElementById('toeflListening').value) || 0, s = parseFloat(document.getElementById('toeflStructure').value) || 0, r = parseFloat(document.getElementById('toeflReading').value) || 0; document.getElementById('toeflTotal').value = Math.round((l + s + r) * 10 / 3); }

function calculateDuration(start, end) {
    if (!start || !end) return '-';
    var s = new Date(start), e = new Date(end);
    var diff = e - s;
    var days = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return days + ' hari ' + hours + ' jam';
    var mins = Math.floor((diff % 3600000) / 60000);
    return hours + ' jam ' + mins + ' menit';
}

// ============================================
// FILTER & SEARCH & SORT TABEL
// ============================================
var allTerjemahan = [];
var sortConfig = { column: 'created_at', asc: false };

function applyFilter() {
    var search = document.getElementById('filterSearch').value.toLowerCase();
    var status = document.getElementById('filterStatus').value;
    var docType = document.getElementById('filterDocType').value;

    var filtered = allTerjemahan.filter(function(c) {
        var matchSearch = !search || (
            (c.client_name || '').toLowerCase().includes(search) ||
            (c.client_phone || '').toLowerCase().includes(search) ||
            (c.document_id || '').toLowerCase().includes(search) ||
            (c.document_type || '').toLowerCase().includes(search) ||
            (c.universitas || '').toLowerCase().includes(search) ||
            (c.jurusan || '').toLowerCase().includes(search)
        );
        var matchStatus = !status || c.status === status;
        var matchDocType = !docType || c.document_type === docType;
        return matchSearch && matchStatus && matchDocType;
    });

    renderTerjemahanTable(filtered);
}

function sortTable(col) {
    if (sortConfig.column === col) sortConfig.asc = !sortConfig.asc;
    else { sortConfig.column = col; sortConfig.asc = true; }
    applyFilter();
}

function renderTerjemahanTable(data) {
    var tb = document.getElementById('terjemahanTableBody');
    if (!tb) return;

    data.sort(function(a, b) {
        var av = a[sortConfig.column] || '';
        var bv = b[sortConfig.column] || '';
        if (av < bv) return sortConfig.asc ? -1 : 1;
        if (av > bv) return sortConfig.asc ? 1 : -1;
        return 0;
    });

    if (!data.length) {
        tb.innerHTML = '<tr><td colspan="9" class="loading-cell">Tidak ada data</td></tr>';
        document.getElementById('selectedCount').textContent = '0';
        return;
    }

    tb.innerHTML = data.map(function(c) {
        var statusBadge = '<span class="status-badge status-' + c.status + '">' + c.status + '</span>';
        var duration = c.completed_at ? calculateDuration(c.created_at, c.completed_at) : (c.status === 'processing' ? calculateDuration(c.created_at, new Date().toISOString()) : '-');
        var docId = c.document_id || '-';

        var docDisplay = escapeHtml(c.document_type);
        if (c.document_type === 'Abstrak Skripsi') {
            if (c.jurusan) docDisplay += '<br><small style="color:#666;font-size:0.7rem">📚 ' + escapeHtml(c.jurusan) + '</small>';
            if (c.judul_skripsi) {
                var judulShort = c.judul_skripsi.length > 40 ? c.judul_skripsi.substring(0, 40) + '...' : c.judul_skripsi;
                docDisplay += '<br><small style="color:#666;font-size:0.7rem;font-style:italic">"' + escapeHtml(judulShort) + '"</small>';
            }
        }

        var actions = '';
        if (c.status === 'completed' && c.file_url) {
            actions = '<a href="' + c.file_url + '" target="_blank" class="btn btn-sm btn-success" title="Download"><i class="fas fa-download"></i></a> ' +
                '<button class="btn btn-sm btn-info" onclick="sendWhatsApp(\'' + c.id + '\')" title="Kirim WA"><i class="fab fa-whatsapp"></i></button> ' +
                '<button class="btn btn-sm btn-primary" onclick="viewResult(\'' + c.id + '\')" title="Preview"><i class="fas fa-eye"></i></button> ' +
                '<button class="btn btn-sm" style="background:#8b5cf6;color:white" onclick="editQrPosition(\'' + c.id + '\')" title="Edit Posisi QR"><i class="fas fa-qrcode"></i></button>';
        } else {
            actions = '<button class="btn btn-sm btn-success" onclick="uploadDoc(\'' + c.id + '\')" title="Upload"><i class="fas fa-upload"></i></button>';
        }
        actions += ' <button class="btn btn-sm btn-warning" onclick="editClient(\'' + c.id + '\')" title="Edit"><i class="fas fa-edit"></i></button>';
        actions += ' <button class="btn btn-sm btn-danger" onclick="deleteClient(\'' + c.id + '\')" title="Hapus"><i class="fas fa-trash"></i></button>';

        return '<tr><td><input type="checkbox" class="row-check" value="' + c.id + '" onchange="updateSelectedCount()"></td>' +
            '<td><strong style="color:var(--primary)">' + docId + '</strong></td>' +
            '<td>' + escapeHtml(c.client_name) + '</td>' +
            '<td>' + escapeHtml(c.client_phone) + '</td>' +
            '<td>' + docDisplay + '</td>' +
            '<td>' + c.source_language + '→' + c.target_language + '</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td>' + duration + '</td>' +
            '<td><div class="action-buttons">' + actions + '</div></td></tr>';
    }).join('');
    updateSelectedCount();
}

function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function uploadDoc(id) {
    var c = allTerjemahan.find(function(x) { return x.id === id; });
    if (c) showUploadDocForm(c);
}

function editClient(id) {
    var c = allTerjemahan.find(function(x) { return x.id === id; });
    if (c) showRegisterForm(c);
}

function viewResult(id) {
    var c = allTerjemahan.find(function(x) { return x.id === id; });
    if (c) showResultPreview(c);
}

function toggleSelectAll() {
    var all = document.getElementById('selectAll').checked;
    document.querySelectorAll('.row-check').forEach(function(cb) { cb.checked = all; });
    updateSelectedCount();
}

function updateSelectedCount() {
    var n = document.querySelectorAll('.row-check:checked').length;
    document.getElementById('selectedCount').textContent = n;
}

async function bulkDelete() {
    var checks = document.querySelectorAll('.row-check:checked');
    if (!checks.length) { showNotification('Pilih dulu data yang mau dihapus!', 'error'); return; }
    if (!confirm('Hapus ' + checks.length + ' data?')) return;
    var ids = Array.from(checks).map(function(cb) { return cb.value; });
    try {
        await db.from('translation_clients').delete().in('id', ids);
        showNotification('✅ ' + ids.length + ' data dihapus!');
        loadTerjemahan();
        loadDashboardStats();
    } catch (e) { showNotification('Error: ' + e.message, 'error'); }
}

// ============================================
// TERJEMAHAN
// ============================================
function showRegisterForm(client) {
    var f = document.getElementById('registerForm');
    f.style.display = 'block';
    f.scrollIntoView({ behavior: 'smooth' });
    if (client) {
        document.getElementById('regId').value = client.id;
        document.getElementById('regName').value = client.client_name;
        document.getElementById('regPhone').value = client.client_phone;
        document.getElementById('regEmail').value = client.client_email || '';
        document.getElementById('regDocType').value = client.document_type;
        document.getElementById('regSourceLang').value = client.source_language;
        document.getElementById('regTargetLang').value = client.target_language;
        document.getElementById('regNotes').value = client.notes || '';
        onDocTypeChange();
        if (client.document_type === 'Abstrak Skripsi') {
            document.getElementById('regNim').value = client.nim || '';
            document.getElementById('regSemester').value = client.semester || '';
            document.getElementById('regJudul').value = client.judul_skripsi || '';
            if (client.universitas) {
                document.getElementById('regUniversitas').value = client.universitas;
                onUniversitasChange();
                setTimeout(function() {
                    if (client.fakultas) { document.getElementById('regFakultas').value = client.fakultas; onFakultasChange(); }
                    setTimeout(function() { if (client.jurusan) document.getElementById('regJurusan').value = client.jurusan; }, 100);
                }, 100);
            }
        }
    } else {
        ['regId', 'regName', 'regPhone', 'regEmail', 'regNotes', 'regNim', 'regSemester', 'regJudul'].forEach(function(id) {
            var e = document.getElementById(id); if (e) e.value = '';
        });
        document.getElementById('regDocType').value = 'Ijazah';
        document.getElementById('regUniversitas').value = '';
        document.getElementById('abstrakFields').style.display = 'none';
        document.getElementById('fakultasGroup').style.display = 'none';
        document.getElementById('jurusanGroup').style.display = 'none';
    }
}

function hideRegisterForm() { document.getElementById('registerForm').style.display = 'none'; }

async function saveRegister() {
    var nm = document.getElementById('regName').value.trim();
    var ph = document.getElementById('regPhone').value.trim();
    if (!nm || !ph) { showNotification('Nama & HP wajib!', 'error'); return; }

    var docType = document.getElementById('regDocType').value;
    var univ = '', fak = '', jur = '', nim = '', sem = '', judul = '';

    if (docType === 'Abstrak Skripsi') {
        univ = document.getElementById('regUniversitas').value;
        fak = document.getElementById('regFakultas').value;
        jur = document.getElementById('regJurusan').value;
        nim = document.getElementById('regNim').value.trim();
        sem = document.getElementById('regSemester').value.trim();
        judul = document.getElementById('regJudul').value.trim();
        if (!univ) { showNotification('Pilih Universitas!', 'error'); return; }
        if (!jur) { showNotification('Pilih Jurusan!', 'error'); return; }
        if (!nim) { showNotification('NIM wajib!', 'error'); return; }
        if (!judul) { showNotification('Judul Skripsi wajib!', 'error'); return; }
    }

    var id = document.getElementById('regId').value;
    var data = {
        client_name: nm, client_phone: ph,
        client_email: document.getElementById('regEmail').value,
        document_type: docType,
        source_language: document.getElementById('regSourceLang').value,
        target_language: document.getElementById('regTargetLang').value,
        notes: document.getElementById('regNotes').value,
        universitas: univ || null, fakultas: fak || null, jurusan: jur || null,
        nim: nim || null, semester: sem || null, judul_skripsi: judul || null,
        updated_at: new Date().toISOString()
    };
    if (!id) data.status = 'processing';

    try {
        var r = id ? await db.from('translation_clients').update(data).eq('id', id) : await db.from('translation_clients').insert(data);
        if (r.error) throw r.error;
        showNotification(id ? '✅ Diperbarui!' : '✅ Klien terdaftar! Status: Proses');
        hideRegisterForm();
        loadTerjemahan();
        loadDashboardStats();
    } catch (e) { showNotification('Error: ' + e.message, 'error'); }
}

async function loadTerjemahan() {
    try {
        var r = await db.from('translation_clients').select('*').order('created_at', { ascending: false });
        if (!r.data) { allTerjemahan = []; renderTerjemahanTable([]); return; }
        allTerjemahan = r.data;
        applyFilter();
    } catch (e) { console.error(e); }
}

async function deleteClient(id) {
    if (!confirm('Hapus data ini?')) return;
    await db.from('translation_clients').delete().eq('id', id);
    showNotification('Dihapus!');
    loadTerjemahan();
    loadDashboardStats();
}

async function exportTerjemahan() {
    var checks = document.querySelectorAll('.row-check:checked');
    var data;
    if (checks.length > 0) {
        var ids = Array.from(checks).map(function(cb) { return cb.value; });
        data = allTerjemahan.filter(function(c) { return ids.indexOf(c.id) > -1; });
    } else { data = allTerjemahan; }
    if (!data.length) { showNotification('Tidak ada data!', 'error'); return; }
    var h = ['ID', 'Nama', 'HP', 'Email', 'Dokumen', 'NIM', 'Semester', 'Judul Skripsi', 'Universitas', 'Fakultas', 'Jurusan', 'Sumber', 'Target', 'Status', 'Durasi', 'Daftar', 'Selesai'];
    var rows = data.map(function(c) {
        var dur = c.completed_at ? calculateDuration(c.created_at, c.completed_at) : '-';
        return [c.document_id || '-', c.client_name, c.client_phone, c.client_email || '', c.document_type, c.nim || '-', c.semester || '-', c.judul_skripsi || '-', c.universitas || '-', c.fakultas || '-', c.jurusan || '-', c.source_language, c.target_language, c.status, dur, formatDate(c.created_at), c.completed_at ? formatDate(c.completed_at) : '-'];
    });
    var csv = [h].concat(rows).map(function(r) { return r.map(function(v) { return '"' + (v || '').toString().replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var b = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'terjemahan-' + Date.now() + '.csv';
    a.click();
    showNotification('✅ Downloaded ' + data.length + ' data!');
}

// ============================================
// SEND WHATSAPP NOTIFICATION
// ============================================
function sendWhatsApp(clientId) {
    var c = allTerjemahan.find(function(x) { return x.id === clientId; });
    if (!c) return;
    var phone = (c.client_phone || '').replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);
    if (!phone.startsWith('62')) phone = '62' + phone;
    var verifyUrl = location.origin + '/verify.html?id=' + c.document_id + '&type=translation';
    var statusUrl = location.origin + '/translation-status.html';
    var fotoRumahUrl = location.origin + '/assets/rumah.jpeg';

    var msg = 'Assalamu\'alaikum *' + c.client_name + '* 🙏\n\n';

    var isAbstrakUIN = c.document_type === 'Abstrak Skripsi' &&
                       c.universitas === 'Universitas Islam Negeri Sultan Syarif Kasim Riau';

    if (isAbstrakUIN) {
        msg += 'Alhamdulillah, terjemahan *Abstrak Skripsi* Ananda sudah *SELESAI* dan siap diakses! 🎓✨\n\n';
        msg += '📄 *Detail Dokumen:*\n';
        msg += '• ID: ' + c.document_id + '\n';
        msg += '• NIM: ' + (c.nim || '-') + '\n';
        msg += '• Jurusan: ' + (c.jurusan || '-') + '\n';
        if (c.fakultas) msg += '• Fakultas: ' + c.fakultas + '\n';
        msg += '• Universitas: UIN Sultan Syarif Kasim Riau\n';
        if (c.judul_skripsi) msg += '• Judul: _"' + c.judul_skripsi + '"_\n';
        msg += '\n';

        msg += '🔍 *Akses & Download Dokumen:*\n';
        msg += verifyUrl + '\n\n';
        msg += '_Silakan klik link di atas untuk memverifikasi keaslian dan mendownload soft copy abstrak Ananda._\n\n';

        msg += '━━━━━━━━━━━━━━━━━━\n';
        msg += '📍 *PENGAMBILAN HARD COPY*\n';
        msg += '━━━━━━━━━━━━━━━━━━\n\n';

        msg += 'Silakan ambil *abstrak yang sudah dicap* beserta *kwitansinya* di kantor kami:\n\n';
        msg += '🏢 *Syaf Intensive English Course (SIEC)*\n';
        msg += 'Lembaga Kursus Bahasa Inggris\n\n';

        msg += '📌 *Lokasi Maps:*\n';
        msg += 'https://maps.app.goo.gl/ew5MKzkz6bvbgb1j6\n\n';

        msg += '🗺️ *Petunjuk Arah:*\n';
        msg += 'Masuk Jl. Yuda Karya, lalu di simpang 4 teruskan masuk ke jalan tanah. Sekitar 30 meter dari simpang, ada gang di sebelah kanan yang sudah disemenisasi. Masuk gang tersebut hingga menemukan rumah seperti pada foto.\n\n';

        msg += '🏠 *Foto Rumah Tempat Pengambilan:*\n';
        msg += fotoRumahUrl + '\n\n';

        msg += '🕗 *Jadwal Pengambilan:*\n';
        msg += '📅 Senin – Jum\'at\n';
        msg += '⏰ 08.00 – 11.00 WIB\n\n';

        msg += '⚠️ *PENTING:*\n';
        msg += 'Batas maksimal pengambilan abstrak adalah *1 minggu* sejak pesan ini dikirim.\n\n';

        msg += '💡 *Bantu Kami Berkembang:*\n';
        msg += 'Ananda akan diminta memberikan testimoni singkat saat mengakses dokumen. Pengalaman Ananda sangat berarti bagi kami untuk terus meningkatkan kualitas layanan. 🙏\n\n';

        msg += 'Terima kasih telah mempercayakan SIEC sebagai mitra penerjemahan Ananda. Semoga sukses untuk sidang skripsinya! 🎓💪\n\n';
        msg += '_Barakallahu fiikum_\n';
        msg += '_Tim SIEC_';

    } else {
        msg += 'Alhamdulillah, terjemahan dokumen Anda di *SIEC* sudah *SELESAI* dan siap diakses! 🎉\n\n';
        msg += '📄 *Detail Dokumen:*\n';
        msg += '• ID: ' + c.document_id + '\n';
        msg += '• Jenis: ' + c.document_type + '\n';
        msg += '• Bahasa: ' + c.source_language + ' → ' + c.target_language + '\n\n';

        msg += '🔍 *Akses & Download Dokumen:*\n';
        msg += verifyUrl + '\n\n';
        msg += '_Silakan klik link di atas untuk memverifikasi keaslian dan mendownload dokumen Anda._\n\n';

        msg += '📊 *Cek Status Anytime:*\n' + statusUrl + '\n\n';

        msg += '💡 *Bantu Kami Berkembang:*\n';
        msg += 'Anda akan diminta memberikan testimoni singkat saat mengakses dokumen. Pengalaman Anda sangat berarti bagi kami untuk terus meningkatkan kualitas layanan. 🙏\n\n';

        msg += 'Terima kasih telah mempercayakan SIEC sebagai mitra penerjemahan Anda! 🙏\n\n';
        msg += '_Syaf Intensive English Course_';
    }

    var waUrl = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg);
    window.open(waUrl, '_blank');
    showNotification('✅ WhatsApp dibuka!');
}

// ============================================
// UPLOAD DOCUMENT
// ============================================
function showUploadDocForm(client) {
    var f = document.getElementById('uploadDocForm');
    f.style.display = 'block';
    f.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('uploadClientId').value = client.id;
    document.getElementById('uploadClientName').textContent = client.client_name;
    var docInfo = client.document_type + ' (' + client.source_language + ' → ' + client.target_language + ')';
    if (client.document_type === 'Abstrak Skripsi') {
        if (client.jurusan) docInfo += ' - ' + client.jurusan;
        if (client.judul_skripsi) docInfo += ' - "' + client.judul_skripsi + '"';
    }
    document.getElementById('uploadClientDoc').textContent = docInfo;
    var defaultTitle = client.document_type + ' - ' + client.client_name;
    if (client.document_type === 'Abstrak Skripsi' && client.judul_skripsi) {
        defaultTitle = 'Abstract: ' + client.judul_skripsi.substring(0, 50);
    }
    document.getElementById('uploadDocTitle').value = defaultTitle;
    uploadFileData = null;
    removeUploadFile();
}

function hideUploadDocForm() { document.getElementById('uploadDocForm').style.display = 'none'; }

function handleUploadFilePreview(input) {
    var f = input.files[0]; if (!f) return;
    if (f.size > 10485760) { showNotification('Max 10MB!', 'error'); input.value = ''; return; }
    uploadFileData = f;
    document.getElementById('uploadFileInfo').style.display = 'flex';
    document.getElementById('uploadFileName').textContent = f.name;
    var lv = document.getElementById('uploadLivePreview');
    if (lv) lv.style.display = 'block';
    var page = document.getElementById('uploadPreviewPage');
    var fr = document.getElementById('uploadPreviewFrame');
    var wd = document.getElementById('uploadWordFallback');
    if (f.type === 'application/pdf') {
        var reader = new FileReader();
        reader.onload = async function(e) {
            try {
                var pdfDoc = await PDFLib.PDFDocument.load(e.target.result);
                var pg = pdfDoc.getPages()[0];
                var pw = pg.getWidth(), ph = pg.getHeight();
                var cw = page.parentElement.offsetWidth || 600;
                var ch = Math.round(cw * (ph / pw));
                page.style.width = cw + 'px';
                page.style.height = ch + 'px';
                if (fr) { fr.src = URL.createObjectURL(f); fr.style.display = 'block'; fr.style.height = ch + 'px'; }
                if (wd) wd.style.display = 'none';
                setTimeout(function() { generateQr('uploadQrCanvas', location.origin + '/verify.html?id=SIEC-TR-PREVIEW', 80); }, 600);
                setTimeout(function() { initDragU(); }, 1500);
            } catch (err) {
                page.style.height = '700px';
                if (fr) { fr.src = URL.createObjectURL(f); fr.style.display = 'block'; fr.style.height = '700px'; }
                setTimeout(function() { generateQr('uploadQrCanvas', location.origin + '/verify.html?id=SIEC-TR-PREVIEW', 80); }, 600);
                setTimeout(function() { initDragU(); }, 1500);
            }
        };
        reader.readAsArrayBuffer(f);
    } else {
        page.style.height = '400px';
        if (fr) fr.style.display = 'none';
        if (wd) { wd.style.display = 'flex'; var n = document.getElementById('uploadWordName'); if (n) n.textContent = f.name; }
    }
}

function removeUploadFile() {
    uploadFileData = null;
    var f = document.getElementById('uploadFile'); if (f) f.value = '';
    var fi = document.getElementById('uploadFileInfo'); if (fi) fi.style.display = 'none';
    var lv = document.getElementById('uploadLivePreview'); if (lv) lv.style.display = 'none';
    var fr = document.getElementById('uploadPreviewFrame'); if (fr) fr.src = '';
}

function initDragU() {
    var el = document.getElementById('uploadQrDrag'), co = document.getElementById('uploadPreviewPage');
    if (!el || !co) return;
    if (co.offsetWidth === 0 || co.offsetHeight === 0) { setTimeout(initDragU, 500); return; }
    var d = false, sx = 0, sy = 0, ol = 0, ot = 0;
    function st(x, y) { d = true; el.classList.add('dragging'); sx = x; sy = y; ol = el.offsetLeft; ot = el.offsetTop; }
    function mv(x, y) {
        if (!d) return;
        var cw = co.offsetWidth, ch = co.offsetHeight;
        var nl = Math.max(0, Math.min(ol + (x - sx), cw - el.offsetWidth));
        var nt = Math.max(0, Math.min(ot + (y - sy), ch - el.offsetHeight));
        el.style.left = nl + 'px'; el.style.top = nt + 'px';
        var cx = nl + el.offsetWidth / 2, cy = nt + el.offsetHeight / 2;
        var px = Math.max(5, Math.min(95, Math.round(cx / cw * 100)));
        var py = Math.max(5, Math.min(95, Math.round(cy / ch * 100)));
        document.getElementById('uploadPosX').textContent = px + '%';
        document.getElementById('uploadPosY').textContent = py + '%';
    }
    function en() { if (!d) return; d = false; el.classList.remove('dragging'); }
    el.onmousedown = function(e) { st(e.clientX, e.clientY); e.preventDefault(); };
    document.addEventListener('mousemove', function(e) { mv(e.clientX, e.clientY); });
    document.addEventListener('mouseup', en);
    el.ontouchstart = function(e) { var t = e.touches[0]; st(t.clientX, t.clientY); e.preventDefault(); };
    document.addEventListener('touchmove', function(e) { if (!d) return; var t = e.touches[0]; mv(t.clientX, t.clientY); e.preventDefault(); }, { passive: false });
    document.addEventListener('touchend', en);
}

function getUploadQrPosition() {
    var el = document.getElementById('uploadQrDrag'), co = document.getElementById('uploadPreviewPage');
    if (el && co && co.offsetWidth > 0) {
        var cx = el.offsetLeft + el.offsetWidth / 2, cy = el.offsetTop + el.offsetHeight / 2;
        return { x: Math.max(5, Math.min(95, Math.round(cx / co.offsetWidth * 100))), y: Math.max(5, Math.min(95, Math.round(cy / co.offsetHeight * 100))), size: parseInt(document.getElementById('uploadQrSize').value) || 80, showId: document.getElementById('uploadShowId').checked };
    }
    return { x: 80, y: 85, size: 80, showId: true };
}

function resizeQrU() { var s = document.getElementById('uploadQrSize'); var v = parseInt(s.value); document.getElementById('uploadQrSizeVal').textContent = v + 'px'; generateQr('uploadQrCanvas', location.origin + '/verify.html?id=SIEC-TR-PREVIEW', v); }
function qrSizeUpU() { var s = document.getElementById('uploadQrSize'); s.value = Math.min(parseInt(s.value) + 10, 150); resizeQrU(); }
function qrSizeDownU() { var s = document.getElementById('uploadQrSize'); s.value = Math.max(parseInt(s.value) - 10, 40); resizeQrU(); }
function toggleQrIdU() { var s = document.getElementById('uploadShowId'), t = document.getElementById('uploadQrIdText'); if (s && t) t.style.display = s.checked ? 'block' : 'none'; }

async function uploadFile(f, folder) {
    var ext = f.name.split('.').pop();
    var fn = folder + '/' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.' + ext;
    var r = await db.storage.from('uploads').upload(fn, f, { cacheControl: '3600', upsert: false });
    if (r.error) throw r.error;
    return { url: db.storage.from('uploads').getPublicUrl(fn).data.publicUrl, name: f.name };
}

async function saveUploadDoc() {
    var clientId = document.getElementById('uploadClientId').value;
    var docTitle = document.getElementById('uploadDocTitle').value.trim();
    if (!clientId || !docTitle) { showNotification('Judul dokumen wajib!', 'error'); return; }
    if (!uploadFileData) { showNotification('Upload file dulu!', 'error'); return; }
    var docId = generateDocumentId('TR');
    var url = location.origin + '/verify.html?id=' + docId + '&type=translation';
    var pos = getUploadQrPosition();
    var fu = '', fn = '';
    try {
        showNotification('Memproses file...', 'info');
        if (uploadFileData.type === 'application/pdf') {
            var mp = await embedQrInPdf(uploadFileData, url, docId, pos.x, pos.y, pos.size);
            var ext = uploadFileData.name.split('.').pop();
            var nm = 'translations/' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.' + ext;
            var r = await db.storage.from('uploads').upload(nm, mp, { cacheControl: '3600', upsert: false });
            if (r.error) throw r.error;
            fu = db.storage.from('uploads').getPublicUrl(nm).data.publicUrl;
            fn = uploadFileData.name;
        } else {
            var up = await uploadFile(uploadFileData, 'translations');
            fu = up.url; fn = up.name;
        }
    } catch (e) { showNotification('Error: ' + e.message, 'error'); return; }
    var data = { document_id: docId, document_title: docTitle, file_url: fu, file_name: fn, qr_position: JSON.stringify(pos), verify_url: url, status: 'completed', completed_at: new Date().toISOString(), issued_date: new Date().toISOString().split('T')[0], updated_at: new Date().toISOString() };
    try {
        var r = await db.from('translation_clients').update(data).eq('id', clientId);
        if (r.error) throw r.error;
        showNotification('✅ Selesai! ID: ' + docId);
        hideUploadDocForm();
        loadTerjemahan();
        loadDashboardStats();
        var clientResult = await db.from('translation_clients').select('*').eq('id', clientId).single();
        if (clientResult.data) {
            showResultPreview(clientResult.data);
            // Auto prompt to send WA
            setTimeout(function() {
                if (confirm('Kirim notifikasi WhatsApp ke klien sekarang?')) sendWhatsApp(clientId);
            }, 1500);
        }
    } catch (e) { showNotification('Error: ' + e.message, 'error'); }
}

function showResultPreview(c) {
    var m = document.getElementById('resultPreview');
    var content = document.getElementById('resultPreviewContent');
    var dur = c.completed_at ? calculateDuration(c.created_at, c.completed_at) : '-';
    var akademikInfo = '';
    if (c.document_type === 'Abstrak Skripsi') {
        akademikInfo = (c.universitas ? '<p><b>Universitas:</b> ' + c.universitas + '</p>' : '') +
            (c.fakultas ? '<p><b>Fakultas:</b> ' + c.fakultas + '</p>' : '') +
            (c.jurusan ? '<p><b>Jurusan:</b> ' + c.jurusan + '</p>' : '') +
            (c.nim ? '<p><b>NIM:</b> ' + c.nim + '</p>' : '') +
            (c.semester ? '<p><b>Semester:</b> ' + c.semester + '</p>' : '') +
            (c.judul_skripsi ? '<p><b>Judul:</b> <em>"' + c.judul_skripsi + '"</em></p>' : '');
    }
    content.innerHTML = '<div style="padding:20px"><div style="text-align:center;margin-bottom:16px">' +
        '<p style="font-size:1.2rem;font-weight:700;color:#10b981">✅ Terjemahan Selesai!</p>' +
        '<p><b>ID:</b> ' + (c.document_id || '-') + '</p>' +
        '</div>' +
        '<div style="background:#f1f5f9;padding:12px;border-radius:8px;margin-bottom:16px">' +
        '<p><b>Klien:</b> ' + c.client_name + ' (' + c.client_phone + ')</p>' +
        '<p><b>Dokumen:</b> ' + c.document_type + '</p>' +
        akademikInfo +
        '<p><b>Bahasa:</b> ' + c.source_language + ' → ' + c.target_language + '</p>' +
        '<p><b>Tanggal Daftar:</b> ' + formatDate(c.created_at) + '</p>' +
        '<p><b>Tanggal Selesai:</b> ' + (c.completed_at ? formatDate(c.completed_at) : '-') + '</p>' +
        '<p><b>Durasi Proses:</b> <strong style="color:#2563eb">' + dur + '</strong></p>' +
        '</div>' +
        '<div style="text-align:center;margin-bottom:12px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">' +
        (c.file_url ? '<a href="' + c.file_url + '" target="_blank" class="btn btn-success" style="display:inline-flex;gap:8px;padding:12px 24px"><i class="fas fa-download"></i> Download PDF</a>' : '') +
        '<button class="btn btn-info" onclick="sendWhatsApp(\'' + c.id + '\')" style="display:inline-flex;gap:8px;padding:12px 24px"><i class="fab fa-whatsapp"></i> Kirim ke Klien</button>' +
        '</div>' +
        (c.file_url ? '<iframe src="' + c.file_url + '" style="width:100%;height:500px;border:2px solid #ddd;border-radius:8px"></iframe>' : '') +
        '</div>';
    m.style.display = 'flex';
}

// ============================================
// ARTICLES
// ============================================
function showArticleForm(a) { var f = document.getElementById('articleForm'); f.style.display = 'block'; f.scrollIntoView({ behavior: 'smooth' }); if (a) { document.getElementById('articleFormTitle').textContent = 'Edit'; document.getElementById('articleId').value = a.id; document.getElementById('articleTitle').value = a.title; document.getElementById('articleCategory').value = a.category; document.getElementById('articleCover').value = a.cover_image || ''; document.getElementById('articleExcerpt').value = a.excerpt || ''; document.getElementById('articleContent').value = a.content; document.getElementById('articlePublished').checked = a.is_published; var r = document.querySelector('input[name="articleLayout"][value="' + a.layout_type + '"]'); if (r) r.checked = true; } else { document.getElementById('articleFormTitle').textContent = 'Tambah'; ['articleId', 'articleTitle', 'articleCover', 'articleExcerpt', 'articleContent'].forEach(function(id) { var e = document.getElementById(id); if (e) e.value = ''; }); document.getElementById('articlePublished').checked = false; var d = document.querySelector('input[name="articleLayout"][value="standard"]'); if (d) d.checked = true; } }
function hideArticleForm() { document.getElementById('articleForm').style.display = 'none'; }
async function saveArticle() { var t = document.getElementById('articleTitle').value.trim(); if (!t) { showNotification('Judul wajib!', 'error'); return; } var l = document.querySelector('input[name="articleLayout"]:checked'), id = document.getElementById('articleId').value, p = document.getElementById('articlePublished').checked, d = { title: t, slug: generateSlug(t) + '-' + Date.now(), content: document.getElementById('articleContent').value, excerpt: document.getElementById('articleExcerpt').value, cover_image: document.getElementById('articleCover').value, layout_type: l ? l.value : 'standard', category: document.getElementById('articleCategory').value, is_published: p, published_at: p ? new Date().toISOString() : null, updated_at: new Date().toISOString() }; try { var r = id ? await db.from('articles').update(d).eq('id', id) : await db.from('articles').insert(d); if (r.error) throw r.error; showNotification(id ? 'Updated!' : 'Added!'); hideArticleForm(); loadAdminArticles(); loadDashboardStats(); } catch (e) { showNotification('Error: ' + e.message, 'error'); } }
async function loadAdminArticles() { var tb = document.getElementById('articlesTableBody'); if (!tb) return; try { var r = await db.from('articles').select('*').order('created_at', { ascending: false }); if (!r.data || !r.data.length) { tb.innerHTML = '<tr><td colspan="6" class="loading-cell">Kosong</td></tr>'; return; } tb.innerHTML = r.data.map(function(a) { return '<tr><td><strong>' + a.title + '</strong></td><td>' + a.category + '</td><td>' + a.layout_type + '</td><td><span class="status-badge ' + (a.is_published ? 'status-published' : 'status-draft') + '">' + (a.is_published ? 'Live' : 'Draft') + '</span></td><td>' + formatDate(a.created_at) + '</td><td><div class="action-buttons"><button class="btn btn-sm btn-primary" onclick=\'showArticleForm(' + JSON.stringify(a) + ')\'>Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteArticle(\'' + a.id + '\')">Hapus</button></div></td></tr>'; }).join(''); } catch (e) { console.error(e); } }
async function deleteArticle(id) { if (!confirm('Hapus?')) return; await db.from('articles').delete().eq('id', id); showNotification('Deleted!'); loadAdminArticles(); loadDashboardStats(); }

// ============================================
// PROGRAMS
// ============================================
function showProgramForm(p) { var f = document.getElementById('programForm'); f.style.display = 'block'; f.scrollIntoView({ behavior: 'smooth' }); if (p) { document.getElementById('programFormTitle').textContent = 'Edit'; document.getElementById('programId').value = p.id; document.getElementById('programTitle').value = p.title; document.getElementById('programType').value = p.program_type; document.getElementById('programLevel').value = p.level; document.getElementById('programDuration').value = p.duration || ''; document.getElementById('programSchedule').value = p.schedule || ''; document.getElementById('programPrice').value = p.price || ''; document.getElementById('programCover').value = p.cover_image || ''; document.getElementById('programDesc').value = p.description; document.getElementById('programContent').value = p.content || ''; document.getElementById('programFeatures').value = (p.features || []).join(', '); document.getElementById('programActive').checked = p.is_active; var r = document.querySelector('input[name="programLayout"][value="' + p.layout_type + '"]'); if (r) r.checked = true; } else { document.getElementById('programFormTitle').textContent = 'Tambah'; ['programId', 'programTitle', 'programDuration', 'programSchedule', 'programPrice', 'programCover', 'programDesc', 'programContent', 'programFeatures'].forEach(function(id) { var e = document.getElementById(id); if (e) e.value = ''; }); document.getElementById('programActive').checked = true; var d = document.querySelector('input[name="programLayout"][value="card"]'); if (d) d.checked = true; } }
function hideProgramForm() { document.getElementById('programForm').style.display = 'none'; }
async function saveProgram() { var t = document.getElementById('programTitle').value.trim(); if (!t) { showNotification('Nama wajib!', 'error'); return; } var id = document.getElementById('programId').value, l = document.querySelector('input[name="programLayout"]:checked'), fs = document.getElementById('programFeatures').value, ft = fs ? fs.split(',').map(function(f) { return f.trim(); }).filter(function(f) { return f; }) : [], d = { title: t, slug: generateSlug(t) + '-' + Date.now(), description: document.getElementById('programDesc').value, content: document.getElementById('programContent').value, program_type: document.getElementById('programType').value, level: document.getElementById('programLevel').value, duration: document.getElementById('programDuration').value, schedule: document.getElementById('programSchedule').value, price: document.getElementById('programPrice').value, cover_image: document.getElementById('programCover').value, layout_type: l ? l.value : 'card', features: ft, is_active: document.getElementById('programActive').checked, updated_at: new Date().toISOString() }; try { var r = id ? await db.from('learning_programs').update(d).eq('id', id) : await db.from('learning_programs').insert(d); if (r.error) throw r.error; showNotification(id ? 'Updated!' : 'Added!'); hideProgramForm(); loadAdminPrograms(); loadDashboardStats(); } catch (e) { showNotification('Error: ' + e.message, 'error'); } }
async function loadAdminPrograms() { var tb = document.getElementById('programsTableBody'); if (!tb) return; try { var r = await db.from('learning_programs').select('*').order('created_at', { ascending: false }); if (!r.data || !r.data.length) { tb.innerHTML = '<tr><td colspan="6" class="loading-cell">Kosong</td></tr>'; return; } tb.innerHTML = r.data.map(function(p) { return '<tr><td><strong>' + p.title + '</strong></td><td>' + p.program_type + '</td><td>' + p.layout_type + '</td><td>' + (p.price || '-') + '</td><td><span class="status-badge ' + (p.is_active ? 'status-published' : 'status-draft') + '">' + (p.is_active ? 'Aktif' : 'Off') + '</span></td><td><div class="action-buttons"><button class="btn btn-sm btn-primary" onclick=\'showProgramForm(' + JSON.stringify(p) + ')\'>Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteProgram(\'' + p.id + '\')">Hapus</button></div></td></tr>'; }).join(''); } catch (e) { console.error(e); } }
async function deleteProgram(id) { if (!confirm('Hapus?')) return; await db.from('learning_programs').delete().eq('id', id); showNotification('Deleted!'); loadAdminPrograms(); loadDashboardStats(); }

// ============================================
// TOEFL
// ============================================
function handleFilePreview(input, type) {
    var f = input.files[0]; if (!f) return;
    if (f.size > 10485760) { showNotification('Max 10MB!', 'error'); input.value = ''; return; }
    if (type === 'toefl') toeflFileData = f;
    document.getElementById(type + 'FileInfo').style.display = 'flex';
    document.getElementById(type + 'FileName').textContent = f.name;
    var lv = document.getElementById(type + 'LivePreview'), sm = document.getElementById(type + 'SmallPreview');
    if (lv) lv.style.display = 'block';
    if (sm) sm.style.display = 'none';
    var page = document.getElementById(type + 'PreviewPage');
    var fr = document.getElementById(type + 'PreviewFrame');
    if (f.type === 'application/pdf') {
        var reader = new FileReader();
        reader.onload = async function(e) {
            try {
                var pdfDoc = await PDFLib.PDFDocument.load(e.target.result);
                var pg = pdfDoc.getPages()[0];
                var pw = pg.getWidth(), ph = pg.getHeight();
                var cw = page.parentElement.offsetWidth || 600;
                var ch = Math.round(cw * (ph / pw));
                page.style.width = cw + 'px';
                page.style.height = ch + 'px';
                if (fr) { fr.src = URL.createObjectURL(f); fr.style.display = 'block'; fr.style.height = ch + 'px'; }
                var sid = 'SIEC-TF-2024-0001';
                setTimeout(function() { generateQr(type + 'QrCanvas', location.origin + '/verify.html?id=' + sid, 80); }, 600);
                if (type === 'toefl') loadSavedToeflPositionToLive();
                setTimeout(function() { initDrag(type); }, 1500);
            } catch (err) { console.error(err); }
        };
        reader.readAsArrayBuffer(f);
    }
}

function removeFilePreview(type) {
    if (type === 'toefl') { toeflFileData = null; var f = document.getElementById('toeflFile'); if (f) f.value = ''; }
    var fi = document.getElementById(type + 'FileInfo'); if (fi) fi.style.display = 'none';
    var lv = document.getElementById(type + 'LivePreview'); if (lv) lv.style.display = 'none';
    var sm = document.getElementById(type + 'SmallPreview'); if (sm) sm.style.display = 'block';
    var fr = document.getElementById(type + 'PreviewFrame'); if (fr) fr.src = '';
}

function initDrag(type) {
    var el = document.getElementById(type + 'QrDrag'), co = document.getElementById(type + 'PreviewPage');
    if (!el || !co) return;
    if (co.offsetWidth === 0 || co.offsetHeight === 0) { setTimeout(function() { initDrag(type); }, 500); return; }
    var d = false, sx = 0, sy = 0, ol = 0, ot = 0;
    function st(x, y) { d = true; el.classList.add('dragging'); sx = x; sy = y; ol = el.offsetLeft; ot = el.offsetTop; }
    function mv(x, y) {
        if (!d) return;
        var cw = co.offsetWidth, ch = co.offsetHeight;
        var nl = Math.max(0, Math.min(ol + (x - sx), cw - el.offsetWidth));
        var nt = Math.max(0, Math.min(ot + (y - sy), ch - el.offsetHeight));
        el.style.left = nl + 'px'; el.style.top = nt + 'px';
        var cx = nl + el.offsetWidth / 2, cy = nt + el.offsetHeight / 2;
        var px = Math.max(5, Math.min(95, Math.round(cx / cw * 100)));
        var py = Math.max(5, Math.min(95, Math.round(cy / ch * 100)));
        var a = document.getElementById(type + 'PosX'); if (a) a.textContent = px + '%';
        var b = document.getElementById(type + 'PosY'); if (b) b.textContent = py + '%';
        var c = document.getElementById(type + 'QrX'); if (c) c.value = px;
        var dd = document.getElementById(type + 'QrY'); if (dd) dd.value = py;
    }
    function en() { if (!d) return; d = false; el.classList.remove('dragging'); if (type === 'toefl') saveToeflPos(el, co); }
    el.onmousedown = function(e) { st(e.clientX, e.clientY); e.preventDefault(); };
    document.addEventListener('mousemove', function(e) { mv(e.clientX, e.clientY); });
    document.addEventListener('mouseup', en);
    el.ontouchstart = function(e) { var t = e.touches[0]; st(t.clientX, t.clientY); e.preventDefault(); };
    document.addEventListener('touchmove', function(e) { if (!d) return; var t = e.touches[0]; mv(t.clientX, t.clientY); e.preventDefault(); }, { passive: false });
    document.addEventListener('touchend', en);
}

function saveToeflPos(el, co) {
    var r = document.getElementById('toeflRememberPos'); if (!r || !r.checked) return;
    var cx = el.offsetLeft + el.offsetWidth / 2, cy = el.offsetTop + el.offsetHeight / 2;
    localStorage.setItem('siec_toefl_qr', JSON.stringify({ x: Math.round(cx / co.offsetWidth * 100), y: Math.round(cy / co.offsetHeight * 100), size: document.getElementById('toeflQrSize') ? document.getElementById('toeflQrSize').value : 80 }));
}
function loadSavedToeflPositionToLive() {
    var s = localStorage.getItem('siec_toefl_qr'); if (!s) return;
    try { var p = JSON.parse(s), el = document.getElementById('toeflQrDrag'), co = document.getElementById('toeflPreviewPage'); if (el && co) setTimeout(function() { var cw = co.offsetWidth, ch = co.offsetHeight; if (cw === 0 || ch === 0) return; var nl = (p.x / 100) * cw - el.offsetWidth / 2, nt = (p.y / 100) * ch - el.offsetHeight / 2; nl = Math.max(0, Math.min(nl, cw - el.offsetWidth)); nt = Math.max(0, Math.min(nt, ch - el.offsetHeight)); el.style.left = nl + 'px'; el.style.top = nt + 'px'; var a = document.getElementById('toeflPosX'); if (a) a.textContent = p.x + '%'; var b = document.getElementById('toeflPosY'); if (b) b.textContent = p.y + '%'; }, 1000); var sz = document.getElementById('toeflQrSize'); if (sz && p.size) sz.value = p.size; } catch (e) {}
}
function loadSavedToeflPosition() { var s = localStorage.getItem('siec_toefl_qr'); if (!s) return; try { var p = JSON.parse(s); var x = document.getElementById('toeflQrX'); if (x) x.value = p.x; var y = document.getElementById('toeflQrY'); if (y) y.value = p.y; var sz = document.getElementById('toeflQrSize'); if (sz) sz.value = p.size || 80; updateSmallPreview('toefl'); } catch (e) {} }
function resetToeflPosition() { ['toeflQrX', 'toeflQrY'].forEach(function(id, i) { var e = document.getElementById(id); if (e) e.value = i === 0 ? 80 : 85; }); var s = document.getElementById('toeflQrSize'); if (s) s.value = 80; localStorage.removeItem('siec_toefl_qr'); updateSmallPreview('toefl'); var d = document.getElementById('toeflQrDrag'); if (d) { d.style.left = '80%'; d.style.top = '85%'; } showNotification('Reset!'); }
function resizeQr(type) { var s = document.getElementById(type + 'QrSize'); if (!s) return; var v = parseInt(s.value); var sv = document.getElementById(type + 'QrSizeVal'); if (sv) sv.textContent = v + 'px'; var lv = document.getElementById(type + 'LivePreview'); if (lv && lv.style.display !== 'none') { generateQr(type + 'QrCanvas', location.origin + '/verify.html?id=SIEC-TF-2024-0001', v); } }
function qrSizeUp(type) { var s = document.getElementById(type + 'QrSize'); s.value = Math.min(parseInt(s.value) + 10, 150); resizeQr(type); }
function qrSizeDown(type) { var s = document.getElementById(type + 'QrSize'); s.value = Math.max(parseInt(s.value) - 10, 40); resizeQr(type); }
function toggleQrId(type) { var s = document.getElementById(type + 'ShowId'), t = document.getElementById(type + 'QrIdText'); if (s && t) t.style.display = s.checked ? 'block' : 'none'; }
function updateSmallPreview(type) { var xE = document.getElementById(type + 'QrX'), yE = document.getElementById(type + 'QrY'); if (!xE || !yE) return; var x = xE.value || 80, y = yE.value || 85; var xv = document.getElementById(type + 'QrXVal'), yv = document.getElementById(type + 'QrYVal'); if (xv) xv.textContent = x + '%'; if (yv) yv.textContent = y + '%'; var ov = document.getElementById(type + 'SmallQr'); if (ov) { ov.style.left = x + '%'; ov.style.top = y + '%'; } generateQr(type + 'SmallQrCanvas', location.origin + '/verify.html?id=SIEC-SAMPLE', 50); }

function getQrPosition(type) {
    var lv = document.getElementById(type + 'LivePreview');
    if (lv && lv.style.display !== 'none') {
        var el = document.getElementById(type + 'QrDrag'), co = document.getElementById(type + 'PreviewPage');
        if (el && co && co.offsetWidth > 0) {
            var cx = el.offsetLeft + el.offsetWidth / 2, cy = el.offsetTop + el.offsetHeight / 2;
            return { x: Math.max(5, Math.min(95, Math.round(cx / co.offsetWidth * 100))), y: Math.max(5, Math.min(95, Math.round(cy / co.offsetHeight * 100))), size: parseInt(document.getElementById(type + 'QrSize').value) || 80, showId: document.getElementById(type + 'ShowId').checked };
        }
    }
    return { x: parseInt(document.getElementById(type + 'QrX').value) || 80, y: parseInt(document.getElementById(type + 'QrY').value) || 85, size: parseInt(document.getElementById(type + 'QrSize').value) || 80, showId: document.getElementById(type + 'ShowId').checked };
}

function showToeflForm(c) { var f = document.getElementById('toeflForm'); f.style.display = 'block'; f.scrollIntoView({ behavior: 'smooth' }); toeflFileData = null; removeFilePreview('toefl'); if (c) { document.getElementById('toeflId').value = c.id; document.getElementById('toeflName').value = c.participant_name; document.getElementById('toeflTestDate').value = c.test_date; document.getElementById('toeflEmail').value = c.participant_email || ''; document.getElementById('toeflPhone').value = c.participant_phone || ''; document.getElementById('toeflListening').value = c.listening_score; document.getElementById('toeflStructure').value = c.structure_score; document.getElementById('toeflReading').value = c.reading_score; document.getElementById('toeflTotal').value = c.total_score; document.getElementById('toeflNotes').value = c.notes || ''; if (c.qr_position) { try { var p = JSON.parse(c.qr_position); var x = document.getElementById('toeflQrX'); if (x) x.value = p.x; var y = document.getElementById('toeflQrY'); if (y) y.value = p.y; var s = document.getElementById('toeflQrSize'); if (s) s.value = p.size || 80; } catch (e) {} } } else { ['toeflId', 'toeflName', 'toeflTestDate', 'toeflEmail', 'toeflPhone', 'toeflListening', 'toeflStructure', 'toeflReading', 'toeflTotal', 'toeflNotes'].forEach(function(id) { var e = document.getElementById(id); if (e) e.value = ''; }); loadSavedToeflPosition(); } setTimeout(function() { updateSmallPreview('toefl'); }, 300); }
function hideToeflForm() { document.getElementById('toeflForm').style.display = 'none'; }

async function saveToefl() {
    var nm = document.getElementById('toeflName').value.trim(), td = document.getElementById('toeflTestDate').value;
    if (!nm || !td) { showNotification('Nama & tanggal wajib!', 'error'); return; }
    var id = document.getElementById('toeflId').value, l = parseInt(document.getElementById('toeflListening').value) || 0, s = parseInt(document.getElementById('toeflStructure').value) || 0, r2 = parseInt(document.getElementById('toeflReading').value) || 0, total = Math.round((l + s + r2) * 10 / 3), pos = getQrPosition('toefl');
    var re = document.getElementById('toeflRememberPos'); if (re && re.checked) localStorage.setItem('siec_toefl_qr', JSON.stringify(pos));
    var fu = '', fn = '', cid = id ? null : generateDocumentId('TF'), url = location.origin + '/verify.html?id=' + (cid || id) + '&type=toefl';
    if (toeflFileData) { try { showNotification('Processing...', 'info'); if (toeflFileData.type === 'application/pdf') { var mp = await embedQrInPdf(toeflFileData, url, cid || id, pos.x, pos.y, pos.size); var ext = toeflFileData.name.split('.').pop(), nm2 = 'certificates/' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.' + ext; var r = await db.storage.from('uploads').upload(nm2, mp, { cacheControl: '3600', upsert: false }); if (r.error) throw r.error; fu = db.storage.from('uploads').getPublicUrl(nm2).data.publicUrl; fn = toeflFileData.name; } else { var up = await uploadFile(toeflFileData, 'certificates'); fu = up.url; fn = up.name; } } catch (e) { showNotification('Error: ' + e.message, 'error'); return; } }
    var d = { participant_name: nm, test_date: td, participant_email: document.getElementById('toeflEmail').value, participant_phone: document.getElementById('toeflPhone').value, listening_score: l, structure_score: s, reading_score: r2, total_score: total, qr_position: JSON.stringify(pos), file_url: fu, file_name: fn, notes: document.getElementById('toeflNotes').value, verified: true, status: 'valid' };
    try { var r; if (id) { r = await db.from('toefl_certificates').update(d).eq('id', id); if (r.error) throw r.error; showNotification('Updated!'); } else { d.certificate_id = cid; d.barcode_data = url; r = await db.from('toefl_certificates').insert(d); if (r.error) throw r.error; showNotification('✅ ID: ' + cid); showCertPrint(d); } hideToeflForm(); loadAdminToefl(); loadDashboardStats(); } catch (e) { showNotification('Error: ' + e.message, 'error'); }
}

function showCertPrint(cert) { var m = document.getElementById('certPrintModal'), c = document.getElementById('certPrintContent'), dl = document.getElementById('certDownloadLink'); if (dl) { if (cert.file_url) { dl.href = cert.file_url; dl.style.display = 'inline-flex'; } else dl.style.display = 'none'; } c.innerHTML = '<div style="padding:20px;text-align:center"><p style="font-size:1.2rem;font-weight:700;color:#10b981;margin-bottom:12px">✅ QR tertempel!</p><p style="font-size:1.3rem;font-weight:700">' + cert.participant_name + '</p><p>L:' + cert.listening_score + ' S:' + cert.structure_score + ' R:' + cert.reading_score + ' = <strong style="font-size:1.5rem;color:#2563eb">' + cert.total_score + '</strong></p><p><b>ID:</b> ' + cert.certificate_id + '</p>' + (cert.file_url ? '<iframe src="' + cert.file_url + '" style="width:100%;height:500px;border:2px solid #ddd;border-radius:8px;margin-top:12px"></iframe>' : '') + '</div>'; m.style.display = 'flex'; }

async function loadAdminToefl() { var tb = document.getElementById('toeflTableBody'); if (!tb) return; try { var r = await db.from('toefl_certificates').select('*').order('created_at', { ascending: false }); if (!r.data || !r.data.length) { tb.innerHTML = '<tr><td colspan="7" class="loading-cell">Kosong</td></tr>'; return; } tb.innerHTML = r.data.map(function(c) { var fb = c.file_url ? '<a href="' + c.file_url + '" target="_blank" class="file-badge"><i class="fas fa-file-pdf"></i> PDF</a>' : '-', dl = c.file_url ? '<a href="' + c.file_url + '" target="_blank" class="btn btn-sm btn-primary"><i class="fas fa-download"></i></a>' : ''; return '<tr><td><strong style="color:var(--primary)">' + c.certificate_id + '</strong></td><td>' + c.participant_name + '</td><td>' + formatDate(c.test_date) + '</td><td>' + c.listening_score + '/' + c.structure_score + '/' + c.reading_score + '</td><td><strong style="color:var(--primary);font-size:1.1rem">' + c.total_score + '</strong></td><td>' + fb + '</td><td><div class="action-buttons"><button class="btn btn-sm btn-success" onclick=\'showCertPrint(' + JSON.stringify(c) + ')\'>View</button> ' + dl + ' <button class="btn btn-sm btn-warning" onclick=\'showToeflForm(' + JSON.stringify(c) + ')\'>Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteToefl(\'' + c.id + '\')">Hapus</button></div></td></tr>'; }).join(''); } catch (e) { console.error(e); } }
async function deleteToefl(id) { if (!confirm('Hapus?')) return; await db.from('toefl_certificates').delete().eq('id', id); showNotification('Deleted!'); loadAdminToefl(); loadDashboardStats(); }

// ============================================
// ADMIN: KELOLA TESTIMONI
// ============================================
async function loadTestimonialsAdmin() {
    var container = document.getElementById('testimonialsAdminList');
    if (!container) return;

    try {
        var r = await db.from('testimonials').select('*').order('created_at', { ascending: false });

        if (!r.data || !r.data.length) {
            container.innerHTML = '<p style="text-align:center;color:#666;padding:40px">Belum ada testimoni</p>';
            document.getElementById('totalReviews').textContent = '0 Testimoni';
            return;
        }

        document.getElementById('totalReviews').textContent = r.data.length + ' Testimoni';

        container.innerHTML = r.data.map(function(t) {
            var stars = '';
            for (var i = 0; i < 5; i++) stars += i < t.rating ? '⭐' : '☆';

            var univInfo = '';
            if (t.document_type === 'Abstrak Skripsi' && t.universitas) {
                univInfo = '<div class="testi-univ"><i class="fas fa-graduation-cap"></i> ' + escapeHtmlA(t.universitas) + '</div>';
            }

            var ratingClass = t.rating >= 4 ? 'rating-good' : t.rating >= 3 ? 'rating-medium' : 'rating-bad';

            return '<div class="testi-admin-card ' + ratingClass + '">' +
                '<div class="testi-admin-header">' +
                '<div class="testi-stars">' + stars + ' <span class="rating-num">(' + t.rating + '/5)</span></div>' +
                '<div class="testi-date">' + formatDate(t.created_at) + '</div>' +
                '</div>' +
                '<p class="testi-text">"' + escapeHtmlA(t.review_text) + '"</p>' +
                '<div class="testi-footer">' +
                '<div class="testi-author">' +
                '<strong>' + escapeHtmlA(t.client_name) + '</strong>' +
                '<small>' + escapeHtmlA(t.document_type || '') + '</small>' +
                univInfo +
                (t.document_id ? '<small style="color:#2563eb">ID: ' + t.document_id + '</small>' : '') +
                '</div>' +
                '<div class="testi-actions">' +
                (t.is_approved
                    ? '<button class="btn btn-sm btn-warning" onclick="toggleApproval(\'' + t.id + '\', false)" title="Sembunyikan"><i class="fas fa-eye-slash"></i> Sembunyikan</button>'
                    : '<button class="btn btn-sm btn-success" onclick="toggleApproval(\'' + t.id + '\', true)" title="Tampilkan"><i class="fas fa-eye"></i> Tampilkan</button>'
                ) +
                ' <button class="btn btn-sm btn-danger" onclick="deleteTestimonial(\'' + t.id + '\')" title="Hapus"><i class="fas fa-trash"></i> Hapus</button>' +
                '</div>' +
                '</div>' +
                '</div>';
        }).join('');
    } catch (e) {
        container.innerHTML = '<p style="text-align:center;color:#ef4444">Error: ' + e.message + '</p>';
    }
}

function escapeHtmlA(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function toggleApproval(id, approve) {
    try {
        await db.from('testimonials').update({ is_approved: approve }).eq('id', id);
        showNotification(approve ? '✅ Testimoni ditampilkan!' : '⛔ Testimoni disembunyikan!');
        loadTestimonialsAdmin();
    } catch (e) {
        showNotification('Error: ' + e.message, 'error');
    }
}

async function deleteTestimonial(id) {
    if (!confirm('Hapus testimoni ini permanen?\n\nTestimoni yang dihapus tidak bisa dikembalikan.')) return;
    try {
        await db.from('testimonials').delete().eq('id', id);
        showNotification('🗑️ Testimoni dihapus!');
        loadTestimonialsAdmin();
    } catch (e) {
        showNotification('Error: ' + e.message, 'error');
    }
}

// ============================================
// EDIT QR POSITION (untuk dokumen yang sudah completed)
// ============================================
var editQrClient = null;

async function editQrPosition(clientId) {
    var c = allTerjemahan.find(function(x) { return x.id === clientId; });
    if (!c || !c.file_url) {
        showNotification('File tidak ditemukan!', 'error');
        return;
    }
    editQrClient = c;

    // Download original file dari URL untuk re-process
    showNotification('Memuat dokumen...', 'info');

    try {
        // Buat modal
        var modal = document.createElement('div');
        modal.className = 'review-modal';
        modal.id = 'editQrModal';
        modal.innerHTML =
            '<div class="review-modal-content" style="max-width:850px">' +
            '<div class="review-modal-header">' +
            '<h3><i class="fas fa-qrcode"></i> Edit Posisi QR Code</h3>' +
            '<button onclick="closeEditQrModal()" class="btn-close">&times;</button>' +
            '</div>' +
            '<div class="review-modal-body">' +
            '<div style="background:#dbeafe;padding:12px;border-radius:8px;margin-bottom:16px">' +
            '<p style="margin:0"><b>Klien:</b> ' + c.client_name + '</p>' +
            '<p style="margin:0"><b>ID:</b> ' + c.document_id + '</p>' +
            '<p style="margin:0;color:#dc2626;font-size:0.85rem"><i class="fas fa-info-circle"></i> Drag QR ke posisi baru lalu klik "Simpan"</p>' +
            '</div>' +
            '<div class="upload-box">' +
            '<h5><i class="fas fa-upload"></i> Upload Ulang File Original</h5>' +
            '<p class="hint">Untuk edit posisi QR, upload kembali file PDF original (tanpa QR)</p>' +
            '<div class="file-upload-area">' +
            '<input type="file" id="editQrFile" accept=".pdf" onchange="handleEditQrFileSelect(this)">' +
            '<label for="editQrFile" class="file-upload-label">' +
            '<i class="fas fa-file-pdf"></i><span>Pilih file PDF original</span>' +
            '<span class="file-hint">PDF max 10MB</span>' +
            '</label>' +
            '</div>' +
            '</div>' +
            '<div id="editQrLivePreview" class="live-preview-container" style="display:none">' +
            '<div class="live-preview-header"><h6><i class="fas fa-hand-pointer"></i> Drag QR ke posisi baru</h6></div>' +
            '<div class="live-preview-doc"><div class="live-preview-page" id="editQrPreviewPage">' +
            '<iframe id="editQrPreviewFrame" style="display:none;width:100%;border:none"></iframe>' +
            '<div id="editQrDrag" class="qr-doc-overlay" style="left:80%;top:85%;position:absolute"><div id="editQrCanvas" style="display:inline-block"></div><div id="editQrIdText" class="qr-doc-id">' + c.document_id + '</div></div>' +
            '</div></div>' +
            '<div class="position-indicator">' +
            '<span>X:<strong id="editPosX">80%</strong> Y:<strong id="editPosY">85%</strong></span>' +
            '<span>|</span>' +
            '<button type="button" onclick="editQrSizeDown()" class="btn-size">−</button>' +
            '<input type="range" id="editQrSize" min="40" max="150" value="80" style="width:80px" oninput="editResizeQr()">' +
            '<button type="button" onclick="editQrSizeUp()" class="btn-size">+</button>' +
            '<strong id="editQrSizeVal">80px</strong>' +
            '</div>' +
            '</div>' +
            '<div class="review-actions">' +
            '<button class="btn btn-primary" onclick="saveEditedQr()" id="saveEditQrBtn"><i class="fas fa-save"></i> Simpan Posisi Baru</button>' +
            '<button class="btn btn-outline" onclick="closeEditQrModal()">Batal</button>' +
            '</div>' +
            '</div>' +
            '</div>';
        document.body.appendChild(modal);

        // Set saved position
        if (c.qr_position) {
            try {
                var pos = JSON.parse(c.qr_position);
                setTimeout(function() {
                    var sz = document.getElementById('editQrSize');
                    if (sz) { sz.value = pos.size || 80; document.getElementById('editQrSizeVal').textContent = (pos.size || 80) + 'px'; }
                }, 200);
            } catch (e) {}
        }
    } catch (e) {
        showNotification('Error: ' + e.message, 'error');
    }
}

function closeEditQrModal() {
    var m = document.getElementById('editQrModal');
    if (m) m.remove();
    editQrClient = null;
}

var editQrFileData = null;

function handleEditQrFileSelect(input) {
    var f = input.files[0];
    if (!f) return;
    if (f.size > 10485760) { showNotification('Max 10MB!', 'error'); return; }
    if (f.type !== 'application/pdf') { showNotification('Harus PDF!', 'error'); return; }

    editQrFileData = f;
    document.getElementById('editQrLivePreview').style.display = 'block';

    var page = document.getElementById('editQrPreviewPage');
    var fr = document.getElementById('editQrPreviewFrame');

    var reader = new FileReader();
    reader.onload = async function(e) {
        try {
            var pdfDoc = await PDFLib.PDFDocument.load(e.target.result);
            var pg = pdfDoc.getPages()[0];
            var pw = pg.getWidth(), ph = pg.getHeight();
            var cw = page.parentElement.offsetWidth || 600;
            var ch = Math.round(cw * (ph / pw));
            page.style.width = cw + 'px';
            page.style.height = ch + 'px';
            if (fr) { fr.src = URL.createObjectURL(f); fr.style.display = 'block'; fr.style.height = ch + 'px'; }

            // Set saved position
            if (editQrClient.qr_position) {
                try {
                    var pos = JSON.parse(editQrClient.qr_position);
                    setTimeout(function() {
                        var drag = document.getElementById('editQrDrag');
                        if (drag) {
                            var nl = (pos.x / 100) * cw - 50;
                            var nt = (pos.y / 100) * ch - 50;
                            drag.style.left = nl + 'px';
                            drag.style.top = nt + 'px';
                            document.getElementById('editPosX').textContent = pos.x + '%';
                            document.getElementById('editPosY').textContent = pos.y + '%';
                        }
                    }, 800);
                } catch (e) {}
            }

            setTimeout(function() {
                generateQr('editQrCanvas', editQrClient.verify_url || (location.origin + '/verify.html?id=' + editQrClient.document_id), 80);
            }, 600);
            setTimeout(function() { initEditDrag(); }, 1500);
        } catch (err) { console.error(err); }
    };
    reader.readAsArrayBuffer(f);
}

function initEditDrag() {
    var el = document.getElementById('editQrDrag');
    var co = document.getElementById('editQrPreviewPage');
    if (!el || !co) return;
    if (co.offsetWidth === 0) { setTimeout(initEditDrag, 500); return; }

    var d = false, sx = 0, sy = 0, ol = 0, ot = 0;
    function st(x, y) { d = true; el.classList.add('dragging'); sx = x; sy = y; ol = el.offsetLeft; ot = el.offsetTop; }
    function mv(x, y) {
        if (!d) return;
        var cw = co.offsetWidth, ch = co.offsetHeight;
        var nl = Math.max(0, Math.min(ol + (x - sx), cw - el.offsetWidth));
        var nt = Math.max(0, Math.min(ot + (y - sy), ch - el.offsetHeight));
        el.style.left = nl + 'px'; el.style.top = nt + 'px';
        var cx = nl + el.offsetWidth / 2, cy = nt + el.offsetHeight / 2;
        var px = Math.max(5, Math.min(95, Math.round(cx / cw * 100)));
        var py = Math.max(5, Math.min(95, Math.round(cy / ch * 100)));
        document.getElementById('editPosX').textContent = px + '%';
        document.getElementById('editPosY').textContent = py + '%';
    }
    function en() { if (!d) return; d = false; el.classList.remove('dragging'); }
    el.onmousedown = function(e) { st(e.clientX, e.clientY); e.preventDefault(); };
    document.addEventListener('mousemove', function(e) { mv(e.clientX, e.clientY); });
    document.addEventListener('mouseup', en);
    el.ontouchstart = function(e) { var t = e.touches[0]; st(t.clientX, t.clientY); e.preventDefault(); };
    document.addEventListener('touchmove', function(e) { if (!d) return; var t = e.touches[0]; mv(t.clientX, t.clientY); e.preventDefault(); }, { passive: false });
    document.addEventListener('touchend', en);
}

function editResizeQr() {
    var s = document.getElementById('editQrSize');
    var v = parseInt(s.value);
    document.getElementById('editQrSizeVal').textContent = v + 'px';
    if (editQrClient) generateQr('editQrCanvas', editQrClient.verify_url || (location.origin + '/verify.html?id=' + editQrClient.document_id), v);
}

function editQrSizeUp() { var s = document.getElementById('editQrSize'); s.value = Math.min(parseInt(s.value) + 10, 150); editResizeQr(); }
function editQrSizeDown() { var s = document.getElementById('editQrSize'); s.value = Math.max(parseInt(s.value) - 10, 40); editResizeQr(); }

async function saveEditedQr() {
    if (!editQrFileData) { showNotification('Upload file PDF dulu!', 'error'); return; }
    if (!editQrClient) return;

    var btn = document.getElementById('saveEditQrBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    btn.disabled = true;

    try {
        var el = document.getElementById('editQrDrag');
        var co = document.getElementById('editQrPreviewPage');
        var cx = el.offsetLeft + el.offsetWidth / 2;
        var cy = el.offsetTop + el.offsetHeight / 2;
        var pos = {
            x: Math.max(5, Math.min(95, Math.round(cx / co.offsetWidth * 100))),
            y: Math.max(5, Math.min(95, Math.round(cy / co.offsetHeight * 100))),
            size: parseInt(document.getElementById('editQrSize').value) || 80,
            showId: true
        };

        var url = editQrClient.verify_url || (location.origin + '/verify.html?id=' + editQrClient.document_id + '&type=translation');
        var mp = await embedQrInPdf(editQrFileData, url, editQrClient.document_id, pos.x, pos.y, pos.size);

        var ext = 'pdf';
        var nm = 'translations/' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.' + ext;
        var r = await db.storage.from('uploads').upload(nm, mp, { cacheControl: '3600', upsert: false });
        if (r.error) throw r.error;

        var newUrl = db.storage.from('uploads').getPublicUrl(nm).data.publicUrl;

        await db.from('translation_clients').update({
            file_url: newUrl,
            qr_position: JSON.stringify(pos),
            updated_at: new Date().toISOString()
        }).eq('id', editQrClient.id);

        showNotification('✅ Posisi QR berhasil diupdate!');
        closeEditQrModal();
        loadTerjemahan();
    } catch (e) {
        showNotification('Error: ' + e.message, 'error');
        btn.innerHTML = '<i class="fas fa-save"></i> Simpan Posisi Baru';
        btn.disabled = false;
    }
}