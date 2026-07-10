var LOGO_URL='assets/logo.png',toeflFileData=null,uploadFileData=null;

// ============================================
// DATA KAMPUS
// ============================================
var DATA_KAMPUS = {
    'Universitas Islam Negeri Sultan Syarif Kasim Riau': {
        fakultas: {
            'Tarbiyah dan Keguruan': ['Pendidikan Agama Islam (PAI)','Pendidikan Bahasa Arab (PBA)','Pendidikan Bahasa Inggris (PBI)','Manajemen Pendidikan Islam (MPI)','Pendidikan Matematika','Pendidikan Kimia','Pendidikan Guru Madrasah Ibtidaiyah (PGMI)','Pendidikan Islam Anak Usia Dini (PIAUD)','Tadris IPA','Tadris IPS','Pendidikan Ekonomi','Pendidikan Geografi','Pendidikan Bahasa Indonesia','Bimbingan dan Konseling Pendidikan Islam (BKPI)'],
            'Ushuluddin': ['Akidah dan Filsafat Islam','Ilmu Hadis','Ilmu Al-Quran dan Tafsir','Studi Agama-Agama']
        }
    },
    'STAI Sulthan Syarif Hasyim Siak Sri Indrapura Riau': {
        fakultas: null,
        jurusan: ['S1 - Pendidikan Guru Madrasah Ibtidaiyah','S1 - Ekonomi Syariah','S1 - Pendidikan Agama Islam','S1 - Hukum Keluarga Islam (Ahwal Syakhshiyyah)']
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
    var m = { 'dashboard': 'Dashboard', 'articles': 'Artikel', 'programs': 'Program', 'terjemahan': 'Terjemahan', 'toefl': 'TOEFL', 'testimonials': 'Testimoni', 'online-reg': 'Pendaftaran Online', 'penerjemah': 'Penerjemah', 'qr-pages': 'QR Halaman', 'test-reg': 'Pendaftaran Tes' };
    var t = document.getElementById('pageTitle'); if (t) t.textContent = m[s] || 'Dashboard';
    document.getElementById('adminSidebar').classList.remove('active');
    if (s === 'dashboard') loadAnalytics();
    if (s === 'testimonials') loadTestimonialsAdmin();
    if (s === 'online-reg') loadOnlineReg();
    if (s === 'penerjemah') loadTranslators();
    if (s === 'qr-pages') loadQrPages();
    if (s === 'test-reg') loadTestRegs();
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

        var docTypes = {};
        r.data.forEach(function(c) {
            var t = c.document_type || 'Lainnya';
            if (!docTypes[t]) docTypes[t] = 0;
            docTypes[t]++;
        });

        var totalDur = 0, durCount = 0;
        r.data.forEach(function(c) {
            if (c.completed_at && c.created_at) {
                totalDur += new Date(c.completed_at) - new Date(c.created_at);
                durCount++;
            }
        });
        var avgDays = durCount > 0 ? (totalDur / durCount / 86400000).toFixed(1) : 0;

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

        return '<tr>' +
            '<td data-label=""><input type="checkbox" class="row-check" value="' + c.id + '" onchange="updateSelectedCount()"></td>' +
            '<td data-label="ID"><strong style="color:var(--primary)">' + docId + '</strong></td>' +
            '<td data-label="Klien">' + escapeHtml(c.client_name) + '</td>' +
            '<td data-label="HP">' + escapeHtml(c.client_phone) + '</td>' +
            '<td data-label="Dokumen">' + docDisplay + '</td>' +
            '<td data-label="Bahasa">' + c.source_language + '→' + c.target_language + '</td>' +
            '<td data-label="Status">' + statusBadge + '</td>' +
            '<td data-label="Durasi">' + duration + '</td>' +
            '<td data-label=""><div class="action-buttons">' + actions + '</div></td>' +
            '</tr>';
    }).join('');
    updateSelectedCount();
}

function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function uploadDoc(id) { var c = allTerjemahan.find(function(x) { return x.id === id; }); if (c) showUploadDocForm(c); }
function editClient(id) { var c = allTerjemahan.find(function(x) { return x.id === id; }); if (c) showRegisterForm(c); }
function viewResult(id) { var c = allTerjemahan.find(function(x) { return x.id === id; }); if (c) showResultPreview(c); }

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
// SEND WHATSAPP
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
    var isAbstrakUIN = c.document_type === 'Abstrak Skripsi' && c.universitas === 'Universitas Islam Negeri Sultan Syarif Kasim Riau';

    if (isAbstrakUIN) {
        msg += 'Alhamdulillah, terjemahan *Abstrak Skripsi* Ananda sudah *SELESAI* dan siap diakses! 🎓✨\n\n';
        msg += '📄 *Detail Dokumen:*\n';
        msg += '• ID: ' + c.document_id + '\n';
        msg += '• NIM: ' + (c.nim || '-') + '\n';
        msg += '• Jurusan: ' + (c.jurusan || '-') + '\n';
        if (c.fakultas) msg += '• Fakultas: ' + c.fakultas + '\n';
        msg += '• Universitas: UIN Sultan Syarif Kasim Riau\n';
        if (c.judul_skripsi) msg += '• Judul: _"' + c.judul_skripsi + '"_\n';
        msg += '\n🔍 *Akses & Download Dokumen:*\n' + verifyUrl + '\n\n';
        msg += '_Silakan klik link di atas untuk memverifikasi keaslian dan mendownload soft copy abstrak Ananda._\n\n';
        msg += '━━━━━━━━━━━━━━━━━━\n📍 *PENGAMBILAN HARD COPY*\n━━━━━━━━━━━━━━━━━━\n\n';
        msg += 'Silakan ambil *abstrak yang sudah dicap* beserta *kwitansinya* di kantor kami:\n\n';
        msg += '🏢 *Syaf Intensive English Course (SIEC)*\nLembaga Kursus Bahasa Inggris\n\n';
        msg += '📌 *Lokasi Maps:*\nhttps://maps.app.goo.gl/ew5MKzkz6bvbgb1j6\n\n';
        msg += '🗺️ *Petunjuk Arah:*\nMasuk Jl. Yuda Karya, lalu di simpang 4 teruskan masuk ke jalan tanah. Sekitar 30 meter dari simpang, ada gang di sebelah kanan yang sudah disemenisasi. Masuk gang tersebut hingga menemukan rumah seperti pada foto.\n\n';
        msg += '🏠 *Foto Rumah Tempat Pengambilan:*\n' + fotoRumahUrl + '\n\n';
        msg += '🕗 *Jadwal Pengambilan:*\n📅 Senin – Jum\'at\n⏰ 08.00 – 11.00 WIB\n\n';
        msg += '⚠️ *PENTING:*\nBatas maksimal pengambilan abstrak adalah *1 minggu* sejak pesan ini dikirim.\n\n';
        msg += '💡 *Bantu Kami Berkembang:*\nAnanda akan diminta memberikan testimoni singkat saat mengakses dokumen. Pengalaman Ananda sangat berarti bagi kami untuk terus meningkatkan kualitas layanan. 🙏\n\n';
        msg += 'Terima kasih telah mempercayakan SIEC sebagai mitra penerjemahan Ananda. Semoga sukses untuk sidang skripsinya! 🎓💪\n\n';
        msg += '_Barakallahu fiikum_\n_Tim SIEC_';
    } else {
        msg += 'Alhamdulillah, terjemahan dokumen Anda di *SIEC* sudah *SELESAI* dan siap diakses! 🎉\n\n';
        msg += '📄 *Detail Dokumen:*\n• ID: ' + c.document_id + '\n• Jenis: ' + c.document_type + '\n• Bahasa: ' + c.source_language + ' → ' + c.target_language + '\n\n';
        msg += '🔍 *Akses & Download Dokumen:*\n' + verifyUrl + '\n\n';
        msg += '_Silakan klik link di atas untuk memverifikasi keaslian dan mendownload dokumen Anda._\n\n';
        msg += '📊 *Cek Status Anytime:*\n' + statusUrl + '\n\n';
        msg += '💡 *Bantu Kami Berkembang:*\nAnda akan diminta memberikan testimoni singkat saat mengakses dokumen. Pengalaman Anda sangat berarti bagi kami untuk terus meningkatkan kualitas layanan. 🙏\n\n';
        msg += 'Terima kasih telah mempercayakan SIEC sebagai mitra penerjemahan Anda! 🙏\n\n_Syaf Intensive English Course_';
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
// EDIT QR POSITION
// ============================================
var editQrClient = null;
var editQrFileData = null;

function editQrPosition(clientId) {
    var c = allTerjemahan.find(function(x) { return x.id === clientId; });
    if (!c || !c.file_url) { showNotification('File tidak ditemukan!', 'error'); return; }
    editQrClient = c;
    editQrFileData = null;

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
        '<p style="margin:0;color:#dc2626;font-size:0.85rem"><i class="fas fa-info-circle"></i> Upload file PDF original (tanpa QR) lalu drag QR ke posisi baru</p>' +
        '</div>' +
        '<div class="upload-box">' +
        '<h5><i class="fas fa-upload"></i> Upload Ulang File Original</h5>' +
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
}

function closeEditQrModal() {
    var m = document.getElementById('editQrModal');
    if (m) m.remove();
    editQrClient = null;
    editQrFileData = null;
}

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
                        var sz = document.getElementById('editQrSize');
                        if (sz && pos.size) { sz.value = pos.size; document.getElementById('editQrSizeVal').textContent = pos.size + 'px'; }
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
        var nm = 'translations/' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.pdf';
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

// ============================================
// ARTICLES
// ============================================
function showArticleForm(a) { var f = document.getElementById('articleForm'); f.style.display = 'block'; f.scrollIntoView({ behavior: 'smooth' }); if (a) { document.getElementById('articleFormTitle').textContent = 'Edit'; document.getElementById('articleId').value = a.id; document.getElementById('articleTitle').value = a.title; document.getElementById('articleCategory').value = a.category; document.getElementById('articleCover').value = a.cover_image || ''; document.getElementById('articleExcerpt').value = a.excerpt || ''; document.getElementById('articleContent').value = a.content; document.getElementById('articlePublished').checked = a.is_published; var r = document.querySelector('input[name="articleLayout"][value="' + a.layout_type + '"]'); if (r) r.checked = true; } else { document.getElementById('articleFormTitle').textContent = 'Tambah'; ['articleId', 'articleTitle', 'articleCover', 'articleExcerpt', 'articleContent'].forEach(function(id) { var e = document.getElementById(id); if (e) e.value = ''; }); document.getElementById('articlePublished').checked = false; var d = document.querySelector('input[name="articleLayout"][value="standard"]'); if (d) d.checked = true; } }
function hideArticleForm() { document.getElementById('articleForm').style.display = 'none'; }
async function saveArticle() { var t = document.getElementById('articleTitle').value.trim(); if (!t) { showNotification('Judul wajib!', 'error'); return; } var l = document.querySelector('input[name="articleLayout"]:checked'), id = document.getElementById('articleId').value, p = document.getElementById('articlePublished').checked, d = { title: t, slug: generateSlug(t) + '-' + Date.now(), content: document.getElementById('articleContent').value, excerpt: document.getElementById('articleExcerpt').value, cover_image: document.getElementById('articleCover').value, layout_type: l ? l.value : 'standard', category: document.getElementById('articleCategory').value, is_published: p, published_at: p ? new Date().toISOString() : null, updated_at: new Date().toISOString() }; try { var r = id ? await db.from('articles').update(d).eq('id', id) : await db.from('articles').insert(d); if (r.error) throw r.error; showNotification(id ? 'Updated!' : 'Added!'); hideArticleForm(); loadAdminArticles(); loadDashboardStats(); } catch (e) { showNotification('Error: ' + e.message, 'error'); } }

async function loadAdminArticles() {
    var tb = document.getElementById('articlesTableBody');
    if (!tb) return;
    try {
        var r = await db.from('articles').select('*').order('created_at', { ascending: false });
        if (!r.data || !r.data.length) { tb.innerHTML = '<tr><td colspan="6" class="loading-cell">Kosong</td></tr>'; return; }
        tb.innerHTML = r.data.map(function(a) {
            return '<tr>' +
                '<td data-label="Judul"><strong>' + a.title + '</strong></td>' +
                '<td data-label="Kategori">' + a.category + '</td>' +
                '<td data-label="Layout">' + a.layout_type + '</td>' +
                '<td data-label="Status"><span class="status-badge ' + (a.is_published ? 'status-published' : 'status-draft') + '">' + (a.is_published ? 'Live' : 'Draft') + '</span></td>' +
                '<td data-label="Tanggal">' + formatDate(a.created_at) + '</td>' +
                '<td data-label=""><div class="action-buttons">' +
                '<button class="btn btn-sm btn-primary" onclick=\'showArticleForm(' + JSON.stringify(a) + ')\'>Edit</button> ' +
                '<button class="btn btn-sm btn-danger" onclick="deleteArticle(\'' + a.id + '\')">Hapus</button>' +
                '</div></td></tr>';
        }).join('');
    } catch (e) { console.error(e); }
}
async function deleteArticle(id) { if (!confirm('Hapus?')) return; await db.from('articles').delete().eq('id', id); showNotification('Deleted!'); loadAdminArticles(); loadDashboardStats(); }

// ============================================
// PROGRAMS
// ============================================
function showProgramForm(p) { var f = document.getElementById('programForm'); f.style.display = 'block'; f.scrollIntoView({ behavior: 'smooth' }); if (p) { document.getElementById('programFormTitle').textContent = 'Edit'; document.getElementById('programId').value = p.id; document.getElementById('programTitle').value = p.title; document.getElementById('programType').value = p.program_type; document.getElementById('programLevel').value = p.level; document.getElementById('programDuration').value = p.duration || ''; document.getElementById('programSchedule').value = p.schedule || ''; document.getElementById('programPrice').value = p.price || ''; document.getElementById('programCover').value = p.cover_image || ''; document.getElementById('programDesc').value = p.description; document.getElementById('programContent').value = p.content || ''; document.getElementById('programFeatures').value = (p.features || []).join(', '); document.getElementById('programActive').checked = p.is_active; var r = document.querySelector('input[name="programLayout"][value="' + p.layout_type + '"]'); if (r) r.checked = true; } else { document.getElementById('programFormTitle').textContent = 'Tambah'; ['programId', 'programTitle', 'programDuration', 'programSchedule', 'programPrice', 'programCover', 'programDesc', 'programContent', 'programFeatures'].forEach(function(id) { var e = document.getElementById(id); if (e) e.value = ''; }); document.getElementById('programActive').checked = true; var d = document.querySelector('input[name="programLayout"][value="card"]'); if (d) d.checked = true; } }
function hideProgramForm() { document.getElementById('programForm').style.display = 'none'; }
async function saveProgram() { var t = document.getElementById('programTitle').value.trim(); if (!t) { showNotification('Nama wajib!', 'error'); return; } var id = document.getElementById('programId').value, l = document.querySelector('input[name="programLayout"]:checked'), fs = document.getElementById('programFeatures').value, ft = fs ? fs.split(',').map(function(f) { return f.trim(); }).filter(function(f) { return f; }) : [], d = { title: t, slug: generateSlug(t) + '-' + Date.now(), description: document.getElementById('programDesc').value, content: document.getElementById('programContent').value, program_type: document.getElementById('programType').value, level: document.getElementById('programLevel').value, duration: document.getElementById('programDuration').value, schedule: document.getElementById('programSchedule').value, price: document.getElementById('programPrice').value, cover_image: document.getElementById('programCover').value, layout_type: l ? l.value : 'card', features: ft, is_active: document.getElementById('programActive').checked, updated_at: new Date().toISOString() }; try { var r = id ? await db.from('learning_programs').update(d).eq('id', id) : await db.from('learning_programs').insert(d); if (r.error) throw r.error; showNotification(id ? 'Updated!' : 'Added!'); hideProgramForm(); loadAdminPrograms(); loadDashboardStats(); } catch (e) { showNotification('Error: ' + e.message, 'error'); } }

async function loadAdminPrograms() {
    var tb = document.getElementById('programsTableBody');
    if (!tb) return;
    try {
        var r = await db.from('learning_programs').select('*').order('created_at', { ascending: false });
        if (!r.data || !r.data.length) { tb.innerHTML = '<tr><td colspan="6" class="loading-cell">Kosong</td></tr>'; return; }
        tb.innerHTML = r.data.map(function(p) {
            return '<tr>' +
                '<td data-label="Program"><strong>' + p.title + '</strong></td>' +
                '<td data-label="Tipe">' + p.program_type + '</td>' +
                '<td data-label="Layout">' + p.layout_type + '</td>' +
                '<td data-label="Harga">' + (p.price || '-') + '</td>' +
                '<td data-label="Status"><span class="status-badge ' + (p.is_active ? 'status-published' : 'status-draft') + '">' + (p.is_active ? 'Aktif' : 'Off') + '</span></td>' +
                '<td data-label=""><div class="action-buttons">' +
                '<button class="btn btn-sm btn-primary" onclick=\'showProgramForm(' + JSON.stringify(p) + ')\'>Edit</button> ' +
                '<button class="btn btn-sm btn-danger" onclick="deleteProgram(\'' + p.id + '\')">Hapus</button>' +
                '</div></td></tr>';
        }).join('');
    } catch (e) { console.error(e); }
}
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

async function loadAdminToefl() {
    var tb = document.getElementById('toeflTableBody');
    if (!tb) return;
    try {
        var r = await db.from('toefl_certificates').select('*').order('created_at', { ascending: false });
        if (!r.data || !r.data.length) { tb.innerHTML = '<tr><td colspan="7" class="loading-cell">Kosong</td></tr>'; return; }
        tb.innerHTML = r.data.map(function(c) {
            var fb = c.file_url ? '<a href="' + c.file_url + '" target="_blank" class="file-badge"><i class="fas fa-file-pdf"></i> PDF</a>' : '-';
            var dl = c.file_url ? '<a href="' + c.file_url + '" target="_blank" class="btn btn-sm btn-primary"><i class="fas fa-download"></i></a>' : '';
            return '<tr>' +
                '<td data-label="ID"><strong style="color:var(--primary)">' + c.certificate_id + '</strong></td>' +
                '<td data-label="Nama">' + c.participant_name + '</td>' +
                '<td data-label="Tanggal">' + formatDate(c.test_date) + '</td>' +
                '<td data-label="L/S/R">' + c.listening_score + '/' + c.structure_score + '/' + c.reading_score + '</td>' +
                '<td data-label="Total"><strong style="color:var(--primary);font-size:1.1rem">' + c.total_score + '</strong></td>' +
                '<td data-label="File">' + fb + '</td>' +
                '<td data-label=""><div class="action-buttons">' +
                '<button class="btn btn-sm btn-success" onclick=\'showCertPrint(' + JSON.stringify(c) + ')\'>View</button> ' +
                dl + ' ' +
                '<button class="btn btn-sm btn-warning" onclick=\'showToeflForm(' + JSON.stringify(c) + ')\'>Edit</button> ' +
                '<button class="btn btn-sm btn-danger" onclick="deleteToefl(\'' + c.id + '\')">Hapus</button>' +
                '</div></td></tr>';
        }).join('');
    } catch (e) { console.error(e); }
}
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
    } catch (e) { showNotification('Error: ' + e.message, 'error'); }
}

async function deleteTestimonial(id) {
    if (!confirm('Hapus testimoni ini permanen?\n\nTestimoni yang dihapus tidak bisa dikembalikan.')) return;
    try {
        await db.from('testimonials').delete().eq('id', id);
        showNotification('🗑️ Testimoni dihapus!');
        loadTestimonialsAdmin();
    } catch (e) { showNotification('Error: ' + e.message, 'error'); }
}
// ============================================
// PENDAFTARAN ONLINE
// ============================================
async function loadOnlineReg() {
    var tb = document.getElementById('onlineRegTableBody');
    if (!tb) return;
    try {
        var statusFilter = document.getElementById('regStatusFilter').value;
        var query = db.from('online_registrations').select('*').order('created_at', { ascending: false });
        if (statusFilter) query = query.eq('payment_status', statusFilter);
        var r = await query;
        if (!r.data || !r.data.length) { tb.innerHTML = '<tr><td colspan="8" class="loading-cell">Belum ada pendaftaran</td></tr>'; return; }

        tb.innerHTML = r.data.map(function(reg) {
            var statusColor = { checking: '#f59e0b', valid: '#10b981', rejected: '#ef4444', in_progress: '#2563eb', completed: '#065f46' };
            var statusLabel = { checking: 'Checking', valid: 'Valid', rejected: 'Ditolak', in_progress: 'In Progress', completed: 'Selesai' };
            var badge = '<span class="status-badge" style="background:' + (statusColor[reg.payment_status] || '#94a3b8') + '20;color:' + (statusColor[reg.payment_status] || '#94a3b8') + '">' + (statusLabel[reg.payment_status] || reg.payment_status) + '</span>';

            var univShort = (reg.universitas || '').length > 20 ? reg.universitas.substring(0, 20) + '...' : reg.universitas;

            var actions = '<button class="btn btn-sm btn-primary" onclick="showRegDetail(\'' + reg.id + '\')" title="Detail"><i class="fas fa-eye"></i></button> ';

            if (reg.payment_status === 'checking') {
                actions += '<button class="btn btn-sm btn-success" onclick="validatePayment(\'' + reg.id + '\')" title="Valid"><i class="fas fa-check"></i></button> ';
                actions += '<button class="btn btn-sm btn-danger" onclick="rejectPayment(\'' + reg.id + '\')" title="Tolak"><i class="fas fa-times"></i></button> ';
            }

            if (reg.payment_status === 'valid') {
                actions += '<button class="btn btn-sm btn-info" onclick="sendToTranslator(\'' + reg.id + '\')" title="Kirim ke Penerjemah"><i class="fas fa-paper-plane"></i></button> ';
            }

            if (reg.payment_status === 'in_progress') {
                actions += '<button class="btn btn-sm" style="background:#10b981;color:white" onclick="uploadHasilTerjemahan(\'' + reg.id + '\')" title="Upload Hasil"><i class="fas fa-upload"></i> Upload Hasil</button> ';
            }

            if (reg.payment_status === 'completed' && reg.result_file_url) {
                actions += '<a href="' + reg.result_file_url + '" target="_blank" class="btn btn-sm btn-success" title="Download"><i class="fas fa-download"></i></a> ';
                actions += '<button class="btn btn-sm btn-info" onclick="sendResultToClient(\'' + reg.id + '\')" title="Kirim WA"><i class="fab fa-whatsapp"></i></button> ';
                actions += '<button class="btn btn-sm btn-primary" onclick="previewResult(\'' + reg.id + '\')" title="Preview"><i class="fas fa-eye"></i></button> ';
                actions += '<button class="btn btn-sm" style="background:#8b5cf6;color:white" onclick="editQrOnlineReg(\'' + reg.id + '\')" title="Edit Posisi QR"><i class="fas fa-qrcode"></i></button> ';
            }

            actions += '<button class="btn btn-sm btn-danger" onclick="deleteOnlineReg(\'' + reg.id + '\')" title="Hapus"><i class="fas fa-trash"></i></button>';

            return '<tr>' +
                '<td data-label="Kode"><strong style="color:var(--primary);font-size:0.8rem">' + reg.reg_code + '</strong></td>' +
                '<td data-label="Nama">' + escapeHtml(reg.client_name) + '</td>' +
                '<td data-label="Univ">' + escapeHtml(univShort) + '</td>' +
                '<td data-label="Bahasa">' + reg.language_1 + '</td>' +
                '<td data-label="Total">' + formatRp(reg.total_price) + '</td>' +
                '<td data-label="Bayar">' + badge + '</td>' +
                '<td data-label="Penerjemah">' + (reg.translator_status === 'assigned' ? '✅' : '-') + '</td>' +
                '<td data-label=""><div class="action-buttons">' + actions + '</div></td>' +
                '</tr>';
        }).join('');
    } catch (e) { console.error(e); }
}

function formatRp(n) { return 'Rp ' + (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

async function showRegDetail(id) {
    try {
        var r = await db.from('online_registrations').select('*').eq('id', id).single();
        if (!r.data) return;
        var reg = r.data;
        var content = document.getElementById('regDetailContent');

        content.innerHTML =
            '<div class="reg-detail-grid">' +
            '<div class="reg-detail-item"><label>Kode</label><p>' + reg.reg_code + '</p></div>' +
            '<div class="reg-detail-item"><label>Nama</label><p>' + reg.client_name + '</p></div>' +
            '<div class="reg-detail-item"><label>HP</label><p>' + reg.client_phone + '</p></div>' +
            '<div class="reg-detail-item"><label>NIM</label><p>' + (reg.nim || '-') + '</p></div>' +
            '<div class="reg-detail-item"><label>Universitas</label><p>' + reg.universitas + '</p></div>' +
            (reg.fakultas ? '<div class="reg-detail-item"><label>Fakultas</label><p>' + reg.fakultas + '</p></div>' : '') +
            (reg.jurusan ? '<div class="reg-detail-item"><label>Jurusan</label><p>' + reg.jurusan + '</p></div>' : '') +
            '<div class="reg-detail-item" style="grid-column:span 2"><label>Judul Skripsi</label><p>' + reg.judul_skripsi + '</p></div>' +
            '<div class="reg-detail-item"><label>Bahasa</label><p>' + reg.language_1 + (reg.language_2 ? ' & ' + reg.language_2 : '') + '</p></div>' +
            '<div class="reg-detail-item"><label>Total Bayar</label><p style="color:#2563eb;font-size:1.2rem">' + formatRp(reg.total_price) + ' (kode unik: ' + reg.unique_code + ')</p></div>' +
            '</div>' +
            (reg.file_url ? '<div style="margin:12px 0"><a href="' + reg.file_url + '" target="_blank" class="btn btn-sm btn-primary"><i class="fas fa-download"></i> Download File Abstrak (' + (reg.file_name || 'file') + ')</a></div>' : '') +
            '<h4 style="margin-top:16px">📸 Bukti Transfer:</h4>' +
            (reg.receipt_url ? '<img src="' + reg.receipt_url + '" class="receipt-preview-large" onclick="window.open(\'' + reg.receipt_url + '\')">' : '<p style="color:#666">Tidak ada</p>');

        document.getElementById('regDetailModal').style.display = 'flex';
    } catch (e) { console.error(e); }
}

async function validatePayment(id) {
    if (!confirm('Tandai pembayaran ini VALID?')) return;
    try {
        // Hapus gambar resi dari storage untuk hemat space
        var reg = (await db.from('online_registrations').select('receipt_url').eq('id', id).single()).data;
        if (reg && reg.receipt_url) {
            var path = reg.receipt_url.split('/registrations/')[1];
            if (path) await db.storage.from('registrations').remove([path]);
        }

        await db.from('online_registrations').update({
            payment_status: 'valid',
            receipt_url: null,
            receipt_name: null,
            updated_at: new Date().toISOString()
        }).eq('id', id);

        showNotification('✅ Pembayaran divalidasi! Resi dihapus dari storage.');
        loadOnlineReg();
    } catch (e) { showNotification('Error: ' + e.message, 'error'); }
}

async function rejectPayment(id) {
    var reason = prompt('Alasan penolakan pembayaran:');
    if (!reason) return;

    try {
        var reg = (await db.from('online_registrations').select('*').eq('id', id).single()).data;

        await db.from('online_registrations').update({
            payment_status: 'rejected',
            notes: 'Ditolak: ' + reason,
            updated_at: new Date().toISOString()
        }).eq('id', id);

        // Kirim WA ke klien
        if (reg) {
            var phone = (reg.client_phone || '').replace(/[^0-9]/g, '');
            if (phone.startsWith('0')) phone = '62' + phone.substring(1);
            if (!phone.startsWith('62')) phone = '62' + phone;

            var msg = 'Assalamu\'alaikum *' + reg.client_name + '* 🙏\n\n';
            msg += 'Mohon maaf, pembayaran untuk pendaftaran terjemahan Anda dengan kode *' + reg.reg_code + '* belum dapat kami verifikasi.\n\n';
            msg += '❌ *Alasan:*\n' + reason + '\n\n';
            msg += 'Silakan lakukan pembayaran ulang sebesar *' + formatRp(reg.total_price) + '* ke:\n\n';
            msg += '🏦 BSI\na.n. LKP SYAFII INTENSIVE ENGLISH COURSE\nNo. Rek: 1304202088\n\n';
            msg += 'Setelah transfer, silakan hubungi kami kembali dengan menyertakan bukti transfer.\n\n';
            msg += 'Terima kasih atas pengertiannya. 🙏\n_Tim SIEC_';

            window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
        }

        showNotification('❌ Pembayaran ditolak! WA dibuka.');
        loadOnlineReg();
    } catch (e) { showNotification('Error: ' + e.message, 'error'); }
}


async function sendToTranslator(regId) {
    try {
        var reg = (await db.from('online_registrations').select('*').eq('id', regId).single()).data;
        if (!reg) return;

        var translators = (await db.from('translators').select('*').eq('is_active', true).order('total_translated', { ascending: true })).data;
        if (!translators || !translators.length) {
            showNotification('Belum ada penerjemah! Tambah dulu di menu Penerjemah.', 'error');
            return;
        }

        var options = translators.map(function(t) { return t.name + ' (' + t.phone + ')'; }).join('\n');
        var choice = prompt('Pilih penerjemah (ketik nomor):\n\n' + translators.map(function(t, i) { return (i + 1) + '. ' + t.name + ' - ' + (t.specialization || 'Umum'); }).join('\n'));

        if (!choice) return;
        var idx = parseInt(choice) - 1;
        if (idx < 0 || idx >= translators.length) { showNotification('Pilihan tidak valid!', 'error'); return; }

        var translator = translators[idx];
        var phone = (translator.phone || '').replace(/[^0-9]/g, '');
        if (phone.startsWith('0')) phone = '62' + phone.substring(1);
        if (!phone.startsWith('62')) phone = '62' + phone;

        var msg = 'Assalamu\'alaikum *' + translator.name + '* 🙏\n\n';
        msg += 'Semoga Bapak/Ibu dalam keadaan sehat wal\'afiat.\n\n';
        msg += 'Kami dari *SIEC (Syaf Intensive English Course)* ingin meminta kesediaan Bapak/Ibu untuk menerjemahkan abstrak skripsi berikut:\n\n';
        msg += '📄 *Detail Dokumen:*\n';
        msg += '• Mahasiswa: ' + reg.client_name + '\n';
        msg += '• NIM: ' + (reg.nim || '-') + '\n';
        msg += '• Universitas: ' + reg.universitas + '\n';
        msg += '• Bahasa: ' + reg.language_1 + '\n';
        msg += '• Judul: _"' + reg.judul_skripsi + '"_\n\n';
        msg += '📎 *File Abstrak:*\n' + reg.file_url + '\n\n';
        msg += 'Mohon Bapak/Ibu berkenan membalas pesan ini dengan:\n';
        msg += '✅ *"Siap"* - jika bersedia menerjemahkan\n';
        msg += '❌ *"Maaf, tidak bisa"* - beserta alasannya\n\n';
        msg += 'Kami sangat menghargai waktu dan keahlian Bapak/Ibu. Terima kasih banyak atas kerja samanya. 🙏\n\n';
        msg += '_Hormat kami,_\n_Tim SIEC_';

        window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');

        await db.from('online_registrations').update({
            translator_id: translator.id,
            translator_status: 'assigned',
            payment_status: 'in_progress',
            updated_at: new Date().toISOString()
        }).eq('id', regId);

        await db.from('translators').update({
            total_translated: (translator.total_translated || 0) + 1
        }).eq('id', translator.id);

        showNotification('✅ File dikirim ke ' + translator.name + '!');
        loadOnlineReg();
    } catch (e) { showNotification('Error: ' + e.message, 'error'); }
}

async function deleteOnlineReg(id) {
    if (!confirm('Hapus pendaftaran ini?')) return;
    await db.from('online_registrations').delete().eq('id', id);
    showNotification('Dihapus!');
    loadOnlineReg();
}

// ============================================
// PENERJEMAH
// ============================================
function showTranslatorForm(t) {
    var f = document.getElementById('translatorForm');
    f.style.display = 'block';
    f.scrollIntoView({ behavior: 'smooth' });
    if (t) {
        document.getElementById('translatorFormTitle').textContent = 'Edit Penerjemah';
        document.getElementById('trId').value = t.id;
        document.getElementById('trName').value = t.name;
        document.getElementById('trPhone').value = t.phone;
        document.getElementById('trEmail').value = t.email || '';
        document.getElementById('trSpec').value = t.specialization || '';
        document.getElementById('trActive').checked = t.is_active;
    } else {
        document.getElementById('translatorFormTitle').textContent = 'Tambah Penerjemah';
        ['trId', 'trName', 'trPhone', 'trEmail', 'trSpec'].forEach(function(id) {
            var e = document.getElementById(id); if (e) e.value = '';
        });
        document.getElementById('trActive').checked = true;
    }
}

function hideTranslatorForm() { document.getElementById('translatorForm').style.display = 'none'; }

async function saveTranslator() {
    var name = document.getElementById('trName').value.trim();
    var phone = document.getElementById('trPhone').value.trim();
    if (!name || !phone) { showNotification('Nama & No. WA wajib!', 'error'); return; }
    var id = document.getElementById('trId').value;
    var data = {
        name: name,
        phone: phone,
        email: document.getElementById('trEmail').value.trim() || null,
        specialization: document.getElementById('trSpec').value.trim() || null,
        is_active: document.getElementById('trActive').checked
    };
    try {
        var r = id ? await db.from('translators').update(data).eq('id', id) : await db.from('translators').insert(data);
        if (r.error) throw r.error;
        showNotification(id ? 'Updated!' : 'Penerjemah ditambahkan!');
        hideTranslatorForm();
        loadTranslators();
    } catch (e) { showNotification('Error: ' + e.message, 'error'); }
}

async function loadTranslators() {
    var tb = document.getElementById('translatorTableBody');
    if (!tb) return;
    try {
        var r = await db.from('translators').select('*').order('created_at', { ascending: false });
        if (!r.data || !r.data.length) { tb.innerHTML = '<tr><td colspan="6" class="loading-cell">Belum ada penerjemah</td></tr>'; return; }
        tb.innerHTML = r.data.map(function(t) {
            return '<tr>' +
                '<td data-label="Nama"><strong>' + escapeHtml(t.name) + '</strong></td>' +
                '<td data-label="WA">' + escapeHtml(t.phone) + '</td>' +
                '<td data-label="Spesialisasi">' + (t.specialization || '-') + '</td>' +
                '<td data-label="Total">' + (t.total_translated || 0) + '</td>' +
                '<td data-label="Status"><span class="status-badge ' + (t.is_active ? 'status-published' : 'status-draft') + '">' + (t.is_active ? 'Aktif' : 'Off') + '</span></td>' +
                '<td data-label=""><div class="action-buttons">' +
                '<button class="btn btn-sm btn-primary" onclick=\'showTranslatorForm(' + JSON.stringify(t) + ')\'>Edit</button> ' +
                '<button class="btn btn-sm btn-danger" onclick="deleteTranslator(\'' + t.id + '\')">Hapus</button>' +
                '</div></td></tr>';
        }).join('');
    } catch (e) { console.error(e); }
}

async function deleteTranslator(id) {
    if (!confirm('Hapus penerjemah ini?')) return;
    await db.from('translators').delete().eq('id', id);
    showNotification('Dihapus!');
    loadTranslators();
}

// ============================================
// QR HALAMAN WEBSITE
// ============================================
function loadQrPages() {
    var grid = document.getElementById('qrPagesGrid');
    if (!grid) return;

    var pages = [
        { title: 'Beranda', url: location.origin + '/', icon: 'fas fa-home' },
        { title: 'Program Belajar', url: location.origin + '/programs.html', icon: 'fas fa-book' },
        { title: 'Verifikasi Dokumen', url: location.origin + '/verify.html', icon: 'fas fa-check-circle' },
        { title: 'Cek Status', url: location.origin + '/translation-status.html', icon: 'fas fa-search' },
        { title: 'Pendaftaran Online', url: location.origin + '/register.html', icon: 'fas fa-file-alt' },
        { title: 'WhatsApp SIEC', url: 'https://wa.me/' + WA_NUMBER, icon: 'fab fa-whatsapp' },
        { title: 'Lokasi (Maps)', url: 'https://maps.app.goo.gl/ew5MKzkz6bvbgb1j6', icon: 'fas fa-map-marker-alt' }
    ];

    var hiddenPages = JSON.parse(localStorage.getItem('siec_hidden_qr_pages') || '[]');
    var logoUrl = encodeURIComponent(location.origin + '/assets/logo.png');

    grid.innerHTML = pages.map(function(p, i) {
        var isHidden = hiddenPages.indexOf(i) > -1;
        var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(p.url) + '&ecc=H&margin=4';

        return '<div class="qr-page-card ' + (isHidden ? 'hidden-card' : '') + '">' +
            (isHidden ? '<div style="padding:40px;color:#94a3b8"><i class="fas fa-eye-slash" style="font-size:2rem"></i></div>' :
                '<div style="position:relative;display:inline-block">' +
                '<img src="' + qrUrl + '" width="180" height="180" style="border-radius:8px;display:block">' +
                '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:40px;height:40px;border-radius:50%;overflow:hidden;background:white;border:2px solid white;box-shadow:0 0 0 1px #2563eb">' +
                '<img src="assets/logo.png" style="width:100%;height:100%;object-fit:contain" onerror="this.parentElement.innerHTML=\'<div style=width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:white><span style=font-weight:800;color:#2563eb;font-size:10px>SIEC</span></div>\'">' +
                '</div>' +
                '</div>'
            ) +
            '<div class="qr-page-title"><i class="' + p.icon + '"></i> ' + p.title + '</div>' +
            '<div class="qr-page-url">' + p.url + '</div>' +
            '<div class="qr-page-actions">' +
            (isHidden
                ? '<button class="btn btn-sm btn-success" onclick="toggleQrPage(' + i + ',false)"><i class="fas fa-eye"></i> Tampilkan</button>'
                : '<button class="btn btn-sm btn-warning" onclick="toggleQrPage(' + i + ',true)"><i class="fas fa-eye-slash"></i></button> ' +
                  '<button class="btn btn-sm btn-primary" onclick="shareQrPage(\'' + encodeURIComponent(p.url) + '\',\'' + p.title + '\')"><i class="fas fa-share-alt"></i></button> ' +
                  '<a href="' + qrUrl + '" download="QR-' + p.title.replace(/\s/g, '-') + '.png" class="btn btn-sm btn-success"><i class="fas fa-download"></i></a>'
            ) +
            '</div></div>';
    }).join('');
}

function toggleQrPage(index, hide) {
    var hidden = JSON.parse(localStorage.getItem('siec_hidden_qr_pages') || '[]');
    if (hide) {
        if (hidden.indexOf(index) === -1) hidden.push(index);
    } else {
        hidden = hidden.filter(function(i) { return i !== index; });
    }
    localStorage.setItem('siec_hidden_qr_pages', JSON.stringify(hidden));
    loadQrPages();
    showNotification(hide ? 'QR disembunyikan!' : 'QR ditampilkan!');
}

function shareQrPage(url, title) {
    if (navigator.share) {
        navigator.share({ title: 'SIEC - ' + title, url: decodeURIComponent(url) });
    } else {
        navigator.clipboard.writeText(decodeURIComponent(url));
        showNotification('✅ Link disalin: ' + title);
    }
}

// ============================================
// UPLOAD HASIL TERJEMAHAN UNTUK PENDAFTARAN ONLINE
// ============================================
var currentOnlineReg = null;
var onlineResultFileData = null;

async function uploadHasilTerjemahan(regId) {
    try {
        var r = await db.from('online_registrations').select('*').eq('id', regId).single();
        if (!r.data) return;
        currentOnlineReg = r.data;
        onlineResultFileData = null;

        var modal = document.createElement('div');
        modal.className = 'review-modal';
        modal.id = 'uploadHasilModal';
        modal.innerHTML =
            '<div class="review-modal-content" style="max-width:850px">' +
            '<div class="review-modal-header">' +
            '<h3><i class="fas fa-upload"></i> Upload Hasil Terjemahan</h3>' +
            '<button onclick="closeUploadHasilModal()" class="btn-close">&times;</button>' +
            '</div>' +
            '<div class="review-modal-body">' +
            '<div style="background:#dbeafe;padding:12px;border-radius:8px;margin-bottom:16px">' +
            '<p style="margin:0"><b>Klien:</b> ' + currentOnlineReg.client_name + '</p>' +
            '<p style="margin:0"><b>Kode:</b> ' + currentOnlineReg.reg_code + '</p>' +
            '<p style="margin:0"><b>Bahasa:</b> ' + currentOnlineReg.language_1 + '</p>' +
            '<p style="margin:0"><b>Judul:</b> ' + currentOnlineReg.judul_skripsi + '</p>' +
            '</div>' +

            '<div class="upload-box">' +
            '<h5><i class="fas fa-cloud-upload-alt"></i> Upload File Hasil Terjemahan (PDF)</h5>' +
            '<p class="hint">QR Code akan ditempel langsung di dalam PDF</p>' +
            '<div class="file-upload-area">' +
            '<input type="file" id="onlineResultFile" accept=".pdf" onchange="handleOnlineResultFile(this)">' +
            '<label for="onlineResultFile" class="file-upload-label">' +
            '<i class="fas fa-file-pdf"></i><span>Pilih file PDF hasil terjemahan</span>' +
            '<span class="file-hint">PDF max 10MB</span>' +
            '</label>' +
            '</div>' +
            '<div id="onlineResultFileInfo" class="file-info" style="display:none">' +
            '<i class="fas fa-file-pdf"></i><span id="onlineResultFileName">-</span>' +
            '<button type="button" onclick="removeOnlineResultFile()" class="btn-remove-file"><i class="fas fa-times"></i></button>' +
            '</div>' +
            '</div>' +

            '<div id="onlineLivePreview" class="live-preview-container" style="display:none">' +
            '<div class="live-preview-header"><h6><i class="fas fa-hand-pointer"></i> Drag QR ke posisi</h6></div>' +
            '<div class="live-preview-doc"><div class="live-preview-page" id="onlinePreviewPage">' +
            '<iframe id="onlinePreviewFrame" style="display:none;width:100%;border:none"></iframe>' +
            '<div id="onlineQrDrag" class="qr-doc-overlay" style="left:80%;top:85%;position:absolute"><div id="onlineQrCanvas" style="display:inline-block"></div><div id="onlineQrIdText" class="qr-doc-id">' + currentOnlineReg.reg_code + '</div></div>' +
            '</div></div>' +
            '<div class="position-indicator">' +
            '<span>X:<strong id="onlinePosX">80%</strong> Y:<strong id="onlinePosY">85%</strong></span>' +
            '<span>|</span>' +
            '<button type="button" onclick="onlineQrSizeDown()" class="btn-size">−</button>' +
            '<input type="range" id="onlineQrSize" min="40" max="150" value="80" style="width:80px" oninput="onlineResizeQr()">' +
            '<button type="button" onclick="onlineQrSizeUp()" class="btn-size">+</button>' +
            '<strong id="onlineQrSizeVal">80px</strong>' +
            '</div>' +
            '</div>' +

            '<div class="review-actions">' +
            '<button class="btn btn-primary" onclick="saveOnlineResult()" id="saveOnlineResultBtn"><i class="fas fa-save"></i> Upload & Selesaikan</button>' +
            '<button class="btn btn-outline" onclick="closeUploadHasilModal()">Batal</button>' +
            '</div>' +
            '</div>' +
            '</div>';
        document.body.appendChild(modal);
    } catch (e) { showNotification('Error: ' + e.message, 'error'); }
}

function closeUploadHasilModal() {
    var m = document.getElementById('uploadHasilModal');
    if (m) m.remove();
    currentOnlineReg = null;
    onlineResultFileData = null;
}

function handleOnlineResultFile(input) {
    var f = input.files[0];
    if (!f) return;
    if (f.size > 10485760) { showNotification('Max 10MB!', 'error'); return; }
    if (f.type !== 'application/pdf') { showNotification('Harus PDF!', 'error'); return; }

    onlineResultFileData = f;
    document.getElementById('onlineResultFileInfo').style.display = 'flex';
    document.getElementById('onlineResultFileName').textContent = f.name;
    document.getElementById('onlineLivePreview').style.display = 'block';

    var page = document.getElementById('onlinePreviewPage');
    var fr = document.getElementById('onlinePreviewFrame');

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

            var verifyUrl = location.origin + '/verify.html?id=' + currentOnlineReg.reg_code + '&type=translation';
            setTimeout(function() { generateQr('onlineQrCanvas', verifyUrl, 80); }, 600);
            setTimeout(function() { initOnlineDrag(); }, 1500);
        } catch (err) { console.error(err); }
    };
    reader.readAsArrayBuffer(f);
}

function removeOnlineResultFile() {
    onlineResultFileData = null;
    document.getElementById('onlineResultFile').value = '';
    document.getElementById('onlineResultFileInfo').style.display = 'none';
    document.getElementById('onlineLivePreview').style.display = 'none';
}

function initOnlineDrag() {
    var el = document.getElementById('onlineQrDrag');
    var co = document.getElementById('onlinePreviewPage');
    if (!el || !co) return;
    if (co.offsetWidth === 0) { setTimeout(initOnlineDrag, 500); return; }
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
        document.getElementById('onlinePosX').textContent = px + '%';
        document.getElementById('onlinePosY').textContent = py + '%';
    }
    function en() { if (!d) return; d = false; el.classList.remove('dragging'); }
    el.onmousedown = function(e) { st(e.clientX, e.clientY); e.preventDefault(); };
    document.addEventListener('mousemove', function(e) { mv(e.clientX, e.clientY); });
    document.addEventListener('mouseup', en);
    el.ontouchstart = function(e) { var t = e.touches[0]; st(t.clientX, t.clientY); e.preventDefault(); };
    document.addEventListener('touchmove', function(e) { if (!d) return; var t = e.touches[0]; mv(t.clientX, t.clientY); e.preventDefault(); }, { passive: false });
    document.addEventListener('touchend', en);
}

function onlineResizeQr() {
    var s = document.getElementById('onlineQrSize');
    var v = parseInt(s.value);
    document.getElementById('onlineQrSizeVal').textContent = v + 'px';
    if (currentOnlineReg) {
        var verifyUrl = location.origin + '/verify.html?id=' + currentOnlineReg.reg_code + '&type=translation';
        generateQr('onlineQrCanvas', verifyUrl, v);
    }
}
function onlineQrSizeUp() { var s = document.getElementById('onlineQrSize'); s.value = Math.min(parseInt(s.value) + 10, 150); onlineResizeQr(); }
function onlineQrSizeDown() { var s = document.getElementById('onlineQrSize'); s.value = Math.max(parseInt(s.value) - 10, 40); onlineResizeQr(); }

async function saveOnlineResult() {
    if (!onlineResultFileData) { showNotification('Upload file dulu!', 'error'); return; }
    if (!currentOnlineReg) return;

    var btn = document.getElementById('saveOnlineResultBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    btn.disabled = true;

    try {
        var el = document.getElementById('onlineQrDrag');
        var co = document.getElementById('onlinePreviewPage');
        var cx = el.offsetLeft + el.offsetWidth / 2;
        var cy = el.offsetTop + el.offsetHeight / 2;
        var pos = {
            x: Math.max(5, Math.min(95, Math.round(cx / co.offsetWidth * 100))),
            y: Math.max(5, Math.min(95, Math.round(cy / co.offsetHeight * 100))),
            size: parseInt(document.getElementById('onlineQrSize').value) || 80,
            showId: true
        };

        var verifyUrl = location.origin + '/verify.html?id=' + currentOnlineReg.reg_code + '&type=translation';
        var mp = await embedQrInPdf(onlineResultFileData, verifyUrl, currentOnlineReg.reg_code, pos.x, pos.y, pos.size);
        var nm = 'results/' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.pdf';
        var r = await db.storage.from('registrations').upload(nm, mp, { cacheControl: '3600', upsert: false });
        if (r.error) throw r.error;
        var newUrl = db.storage.from('registrations').getPublicUrl(nm).data.publicUrl;

        await db.from('online_registrations').update({
            result_file_url: newUrl,
            result_file_name: onlineResultFileData.name,
            qr_position: JSON.stringify(pos),
            payment_status: 'completed',
            updated_at: new Date().toISOString()
        }).eq('id', currentOnlineReg.id);

        showNotification('✅ Hasil berhasil diupload!');
        var cId = currentOnlineReg.id;
        closeUploadHasilModal();
        loadOnlineReg();

        setTimeout(function() {
            if (confirm('Kirim notifikasi WhatsApp ke klien sekarang?')) sendResultToClient(cId);
        }, 1000);
    } catch (e) {
        showNotification('Error: ' + e.message, 'error');
        btn.innerHTML = '<i class="fas fa-save"></i> Upload & Selesaikan';
        btn.disabled = false;
    }
}

// ============================================
// KIRIM HASIL KE KLIEN VIA WA
// ============================================
async function sendResultToClient(regId) {
    try {
        var r = await db.from('online_registrations').select('*').eq('id', regId).single();
        if (!r.data) return;
        var reg = r.data;

        var phone = (reg.client_phone || '').replace(/[^0-9]/g, '');
        if (phone.startsWith('0')) phone = '62' + phone.substring(1);
        if (!phone.startsWith('62')) phone = '62' + phone;

        var verifyUrl = location.origin + '/verify.html?id=' + reg.reg_code + '&type=translation';
        var statusUrl = location.origin + '/translation-status.html';

        var msg = 'Assalamu\'alaikum *' + reg.client_name + '* 🙏\n\n';
        msg += 'Alhamdulillah, terjemahan abstrak skripsi Anda di *SIEC* sudah *SELESAI*! 🎉\n\n';
        msg += '📄 *Detail Dokumen:*\n';
        msg += '• Kode: ' + reg.reg_code + '\n';
        msg += '• Bahasa: ' + reg.language_1 + '\n';
        msg += '• Universitas: ' + reg.universitas + '\n';
        if (reg.judul_skripsi) msg += '• Judul: _"' + reg.judul_skripsi + '"_\n';
        msg += '\n🔍 *Akses & Download Dokumen:*\n' + verifyUrl + '\n\n';
        msg += '_Silakan klik link di atas untuk memverifikasi keaslian dan mendownload dokumen Anda._\n\n';
        msg += '📊 *Cek Status:*\n' + statusUrl + '\n\n';
        msg += '💡 *Bantu Kami Berkembang:*\nAnda akan diminta memberikan testimoni singkat saat mengakses dokumen. Pengalaman Anda sangat berarti bagi kami. 🙏\n\n';
        msg += 'Terima kasih telah mempercayakan SIEC! 🙏\n\n_Tim SIEC_';

        window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
        showNotification('✅ WhatsApp dibuka!');
    } catch (e) { showNotification('Error: ' + e.message, 'error'); }
}

// ============================================
// PREVIEW HASIL
// ============================================
async function previewResult(regId) {
    try {
        var r = await db.from('online_registrations').select('*').eq('id', regId).single();
        if (!r.data || !r.data.result_file_url) { showNotification('Belum ada file hasil', 'error'); return; }
        var reg = r.data;

        var modal = document.createElement('div');
        modal.className = 'review-modal';
        modal.id = 'previewResultModal';
        modal.innerHTML =
            '<div class="review-modal-content" style="max-width:850px">' +
            '<div class="review-modal-header">' +
            '<h3><i class="fas fa-eye"></i> Preview Hasil Terjemahan</h3>' +
            '<button onclick="closePreviewResultModal()" class="btn-close">&times;</button>' +
            '</div>' +
            '<div class="review-modal-body">' +
            '<div style="background:#dbeafe;padding:12px;border-radius:8px;margin-bottom:16px">' +
            '<p style="margin:0"><b>Klien:</b> ' + reg.client_name + '</p>' +
            '<p style="margin:0"><b>Kode:</b> ' + reg.reg_code + '</p>' +
            '<p style="margin:0"><b>File:</b> ' + (reg.result_file_name || 'PDF') + '</p>' +
            '</div>' +
            '<iframe src="' + reg.result_file_url + '" style="width:100%;height:600px;border:2px solid #ddd;border-radius:8px"></iframe>' +
            '<div class="review-actions" style="margin-top:16px">' +
            '<a href="' + reg.result_file_url + '" target="_blank" class="btn btn-success"><i class="fas fa-download"></i> Download</a>' +
            '<button class="btn btn-outline" onclick="closePreviewResultModal()">Tutup</button>' +
            '</div>' +
            '</div>' +
            '</div>';
        document.body.appendChild(modal);
    } catch (e) { showNotification('Error: ' + e.message, 'error'); }
}

function closePreviewResultModal() {
    var m = document.getElementById('previewResultModal');
    if (m) m.remove();
}

// ============================================
// EDIT QR POSITION UNTUK ONLINE REG
// ============================================
var editOnlineReg = null;
var editOnlineFileData = null;

async function editQrOnlineReg(regId) {
    try {
        var r = await db.from('online_registrations').select('*').eq('id', regId).single();
        if (!r.data || !r.data.result_file_url) { showNotification('File tidak ditemukan!', 'error'); return; }
        editOnlineReg = r.data;
        editOnlineFileData = null;

        var modal = document.createElement('div');
        modal.className = 'review-modal';
        modal.id = 'editOnlineQrModal';
        modal.innerHTML =
            '<div class="review-modal-content" style="max-width:850px">' +
            '<div class="review-modal-header">' +
            '<h3><i class="fas fa-qrcode"></i> Edit Posisi QR Code</h3>' +
            '<button onclick="closeEditOnlineQrModal()" class="btn-close">&times;</button>' +
            '</div>' +
            '<div class="review-modal-body">' +
            '<div style="background:#dbeafe;padding:12px;border-radius:8px;margin-bottom:16px">' +
            '<p style="margin:0"><b>Klien:</b> ' + editOnlineReg.client_name + '</p>' +
            '<p style="margin:0"><b>Kode:</b> ' + editOnlineReg.reg_code + '</p>' +
            '<p style="margin:0;color:#dc2626;font-size:0.85rem"><i class="fas fa-info-circle"></i> Upload file PDF original (tanpa QR) lalu drag QR ke posisi baru</p>' +
            '</div>' +
            '<div class="upload-box">' +
            '<h5><i class="fas fa-upload"></i> Upload Ulang File Original</h5>' +
            '<div class="file-upload-area">' +
            '<input type="file" id="editOnlineQrFile" accept=".pdf" onchange="handleEditOnlineQrFile(this)">' +
            '<label for="editOnlineQrFile" class="file-upload-label">' +
            '<i class="fas fa-file-pdf"></i><span>Pilih file PDF original</span>' +
            '</label>' +
            '</div>' +
            '</div>' +
            '<div id="editOnlineQrLivePreview" class="live-preview-container" style="display:none">' +
            '<div class="live-preview-header"><h6><i class="fas fa-hand-pointer"></i> Drag QR ke posisi baru</h6></div>' +
            '<div class="live-preview-doc"><div class="live-preview-page" id="editOnlineQrPreviewPage">' +
            '<iframe id="editOnlineQrPreviewFrame" style="display:none;width:100%;border:none"></iframe>' +
            '<div id="editOnlineQrDrag" class="qr-doc-overlay" style="left:80%;top:85%;position:absolute"><div id="editOnlineQrCanvas" style="display:inline-block"></div><div class="qr-doc-id">' + editOnlineReg.reg_code + '</div></div>' +
            '</div></div>' +
            '<div class="position-indicator">' +
            '<span>X:<strong id="editOnlinePosX">80%</strong> Y:<strong id="editOnlinePosY">85%</strong></span>' +
            '<span>|</span>' +
            '<button type="button" onclick="editOnlineSizeDown()" class="btn-size">−</button>' +
            '<input type="range" id="editOnlineQrSize" min="40" max="150" value="80" style="width:80px" oninput="editOnlineResize()">' +
            '<button type="button" onclick="editOnlineSizeUp()" class="btn-size">+</button>' +
            '<strong id="editOnlineQrSizeVal">80px</strong>' +
            '</div>' +
            '</div>' +
            '<div class="review-actions">' +
            '<button class="btn btn-primary" onclick="saveEditedOnlineQr()" id="saveEditOnlineQrBtn"><i class="fas fa-save"></i> Simpan Posisi Baru</button>' +
            '<button class="btn btn-outline" onclick="closeEditOnlineQrModal()">Batal</button>' +
            '</div>' +
            '</div>' +
            '</div>';
        document.body.appendChild(modal);
    } catch (e) { showNotification('Error: ' + e.message, 'error'); }
}

function closeEditOnlineQrModal() {
    var m = document.getElementById('editOnlineQrModal');
    if (m) m.remove();
    editOnlineReg = null;
    editOnlineFileData = null;
}

function handleEditOnlineQrFile(input) {
    var f = input.files[0];
    if (!f) return;
    if (f.size > 10485760) { showNotification('Max 10MB!', 'error'); return; }
    if (f.type !== 'application/pdf') { showNotification('Harus PDF!', 'error'); return; }
    editOnlineFileData = f;
    document.getElementById('editOnlineQrLivePreview').style.display = 'block';
    var page = document.getElementById('editOnlineQrPreviewPage');
    var fr = document.getElementById('editOnlineQrPreviewFrame');

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

            if (editOnlineReg.qr_position) {
                try {
                    var pos = JSON.parse(editOnlineReg.qr_position);
                    setTimeout(function() {
                        var drag = document.getElementById('editOnlineQrDrag');
                        if (drag) {
                            var nl = (pos.x / 100) * cw - 50;
                            var nt = (pos.y / 100) * ch - 50;
                            drag.style.left = nl + 'px';
                            drag.style.top = nt + 'px';
                            document.getElementById('editOnlinePosX').textContent = pos.x + '%';
                            document.getElementById('editOnlinePosY').textContent = pos.y + '%';
                        }
                        var sz = document.getElementById('editOnlineQrSize');
                        if (sz && pos.size) { sz.value = pos.size; document.getElementById('editOnlineQrSizeVal').textContent = pos.size + 'px'; }
                    }, 800);
                } catch (e) {}
            }

            var verifyUrl = location.origin + '/verify.html?id=' + editOnlineReg.reg_code + '&type=translation';
            setTimeout(function() { generateQr('editOnlineQrCanvas', verifyUrl, 80); }, 600);
            setTimeout(function() { initEditOnlineDrag(); }, 1500);
        } catch (err) { console.error(err); }
    };
    reader.readAsArrayBuffer(f);
}

function initEditOnlineDrag() {
    var el = document.getElementById('editOnlineQrDrag');
    var co = document.getElementById('editOnlineQrPreviewPage');
    if (!el || !co) return;
    if (co.offsetWidth === 0) { setTimeout(initEditOnlineDrag, 500); return; }
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
        document.getElementById('editOnlinePosX').textContent = px + '%';
        document.getElementById('editOnlinePosY').textContent = py + '%';
    }
    function en() { if (!d) return; d = false; el.classList.remove('dragging'); }
    el.onmousedown = function(e) { st(e.clientX, e.clientY); e.preventDefault(); };
    document.addEventListener('mousemove', function(e) { mv(e.clientX, e.clientY); });
    document.addEventListener('mouseup', en);
    el.ontouchstart = function(e) { var t = e.touches[0]; st(t.clientX, t.clientY); e.preventDefault(); };
    document.addEventListener('touchmove', function(e) { if (!d) return; var t = e.touches[0]; mv(t.clientX, t.clientY); e.preventDefault(); }, { passive: false });
    document.addEventListener('touchend', en);
}

function editOnlineResize() {
    var s = document.getElementById('editOnlineQrSize');
    var v = parseInt(s.value);
    document.getElementById('editOnlineQrSizeVal').textContent = v + 'px';
    if (editOnlineReg) {
        var verifyUrl = location.origin + '/verify.html?id=' + editOnlineReg.reg_code + '&type=translation';
        generateQr('editOnlineQrCanvas', verifyUrl, v);
    }
}
function editOnlineSizeUp() { var s = document.getElementById('editOnlineQrSize'); s.value = Math.min(parseInt(s.value) + 10, 150); editOnlineResize(); }
function editOnlineSizeDown() { var s = document.getElementById('editOnlineQrSize'); s.value = Math.max(parseInt(s.value) - 10, 40); editOnlineResize(); }

async function saveEditedOnlineQr() {
    if (!editOnlineFileData) { showNotification('Upload file PDF dulu!', 'error'); return; }
    if (!editOnlineReg) return;
    var btn = document.getElementById('saveEditOnlineQrBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    btn.disabled = true;

    try {
        var el = document.getElementById('editOnlineQrDrag');
        var co = document.getElementById('editOnlineQrPreviewPage');
        var cx = el.offsetLeft + el.offsetWidth / 2;
        var cy = el.offsetTop + el.offsetHeight / 2;
        var pos = {
            x: Math.max(5, Math.min(95, Math.round(cx / co.offsetWidth * 100))),
            y: Math.max(5, Math.min(95, Math.round(cy / co.offsetHeight * 100))),
            size: parseInt(document.getElementById('editOnlineQrSize').value) || 80,
            showId: true
        };

        var verifyUrl = location.origin + '/verify.html?id=' + editOnlineReg.reg_code + '&type=translation';
        var mp = await embedQrInPdf(editOnlineFileData, verifyUrl, editOnlineReg.reg_code, pos.x, pos.y, pos.size);
        var nm = 'results/' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.pdf';
        var r = await db.storage.from('registrations').upload(nm, mp, { cacheControl: '3600', upsert: false });
        if (r.error) throw r.error;
        var newUrl = db.storage.from('registrations').getPublicUrl(nm).data.publicUrl;

        await db.from('online_registrations').update({
            result_file_url: newUrl,
            qr_position: JSON.stringify(pos),
            updated_at: new Date().toISOString()
        }).eq('id', editOnlineReg.id);

        showNotification('✅ Posisi QR berhasil diupdate!');
        closeEditOnlineQrModal();
        loadOnlineReg();
    } catch (e) {
        showNotification('Error: ' + e.message, 'error');
        btn.innerHTML = '<i class="fas fa-save"></i> Simpan Posisi Baru';
        btn.disabled = false;
    }
}

// ============================================
// PENDAFTARAN TES
// ============================================
async function loadTestRegs() {
    var tb = document.getElementById('testRegTableBody');
    if (!tb) return;
    try {
        var filter = document.getElementById('testRegFilter').value;
        var query = db.from('test_registrations').select('*').order('created_at', { ascending: false });
        if (filter === 'info_sent') query = query.eq('info_sent', true);
        else if (filter) query = query.eq('payment_status', filter);
        var r = await query;
        if (!r.data || !r.data.length) { tb.innerHTML = '<tr><td colspan="6" class="loading-cell">Belum ada</td></tr>'; return; }

        tb.innerHTML = r.data.map(function(t) {
            var statusColor = { checking: '#f59e0b', valid: '#10b981', rejected: '#ef4444' };
            var statusLabel = t.info_sent ? 'Info Terkirim' : (t.payment_status === 'valid' ? 'Valid' : t.payment_status);
            var badge = '<span class="status-badge" style="background:' + (t.info_sent ? '#065f46' : (statusColor[t.payment_status] || '#94a3b8')) + '20;color:' + (t.info_sent ? '#065f46' : (statusColor[t.payment_status] || '#94a3b8')) + '">' + statusLabel + '</span>';

            var actions = '<button class="btn btn-sm btn-primary" onclick="showTestDetail(\'' + t.id + '\')" title="Detail"><i class="fas fa-eye"></i></button> ';
            if (t.payment_status === 'checking') {
                actions += '<button class="btn btn-sm btn-success" onclick="validateTestPayment(\'' + t.id + '\')" title="Valid"><i class="fas fa-check"></i></button> ';
                actions += '<button class="btn btn-sm btn-danger" onclick="rejectTestPayment(\'' + t.id + '\')" title="Tolak"><i class="fas fa-times"></i></button> ';
            }
            if (t.payment_status === 'valid' && !t.info_sent) {
                actions += '<button class="btn btn-sm btn-info" onclick="showTestInfoForm(\'' + t.id + '\')" title="Generate Info"><i class="fas fa-key"></i> Info Tes</button> ';
            }
            actions += '<button class="btn btn-sm btn-danger" onclick="deleteTestReg(\'' + t.id + '\')" title="Hapus"><i class="fas fa-trash"></i></button>';

            return '<tr>' +
                '<td data-label="Kode"><strong style="color:var(--primary);font-size:0.8rem">' + t.reg_code + '</strong></td>' +
                '<td data-label="Nama">' + escapeHtml(t.full_name) + '</td>' +
                '<td data-label="Tes">' + t.test_type + '</td>' +
                '<td data-label="Total">' + (t.test_currency === 'USD' ? '$' + t.total_price : formatRp(t.total_price)) + '</td>' +
                '<td data-label="Status">' + badge + '</td>' +
                '<td data-label=""><div class="action-buttons">' + actions + '</div></td></tr>';
        }).join('');
    } catch (e) { console.error(e); }
}

async function showTestDetail(id) {
    var r = await db.from('test_registrations').select('*').eq('id', id).single();
    if (!r.data) return;
    var t = r.data;
    document.getElementById('testDetailContent').innerHTML =
        '<div class="reg-detail-grid">' +
        '<div class="reg-detail-item"><label>Kode</label><p>' + t.reg_code + '</p></div>' +
        '<div class="reg-detail-item"><label>Jenis Tes</label><p>' + t.test_type + '</p></div>' +
        '<div class="reg-detail-item"><label>Nama</label><p>' + t.full_name + '</p></div>' +
        '<div class="reg-detail-item"><label>NIK</label><p>' + t.nik + '</p></div>' +
        '<div class="reg-detail-item"><label>TTL</label><p>' + t.birth_place + ', ' + formatDate(t.birth_date) + '</p></div>' +
        '<div class="reg-detail-item"><label>HP</label><p>' + t.phone + '</p></div>' +
        '<div class="reg-detail-item" style="grid-column:span 2"><label>Alamat</label><p>' + t.address + '</p></div>' +
        '<div class="reg-detail-item"><label>Total Bayar</label><p style="color:#2563eb;font-size:1.2rem">' + (t.test_currency === 'USD' ? '$' + t.total_price : formatRp(t.total_price)) + '</p></div>' +
        '<div class="reg-detail-item"><label>Status</label><p>' + t.payment_status + (t.info_sent ? ' ✅ Info terkirim' : '') + '</p></div>' +
        '</div>' +
        (t.ktp_url ? '<h4>📄 KTP:</h4><img src="' + t.ktp_url + '" class="receipt-preview-large" onclick="window.open(\'' + t.ktp_url + '\')">' : '') +
        (t.receipt_url ? '<h4>📸 Bukti Transfer:</h4><img src="' + t.receipt_url + '" class="receipt-preview-large" onclick="window.open(\'' + t.receipt_url + '\')">' : '') +
        (t.test_id ? '<div style="background:#ecfdf5;padding:12px;border-radius:8px;margin-top:16px"><h4>🔑 Info Tes:</h4><p><b>ID:</b> ' + t.test_id + '</p><p><b>Password:</b> ' + t.test_password + '</p>' + (t.test_link ? '<p><b>Link Tes:</b> ' + t.test_link + '</p>' : '') + (t.zoom_link ? '<p><b>Zoom:</b> ' + t.zoom_link + '</p>' : '') + (t.test_date ? '<p><b>Jadwal Tes:</b> ' + formatDate(t.test_date) + ' ' + (t.test_time || '') + '</p>' : '') + '</div>' : '');

    document.getElementById('testDetailModal').style.display = 'flex';
}

async function validateTestPayment(id) {
    if (!confirm('Validasi pembayaran ini?')) return;
    var r = await db.from('test_registrations').select('receipt_url').eq('id', id).single();
    if (r.data && r.data.receipt_url) {
        var path = r.data.receipt_url.split('/registrations/')[1];
        if (path) await db.storage.from('registrations').remove([path]);
    }
    await db.from('test_registrations').update({ payment_status: 'valid', receipt_url: null, receipt_name: null, updated_at: new Date().toISOString() }).eq('id', id);
    showNotification('✅ Pembayaran valid!');
    loadTestRegs();
}

async function rejectTestPayment(id) {
    var reason = prompt('Alasan penolakan:');
    if (!reason) return;
    var t = (await db.from('test_registrations').select('*').eq('id', id).single()).data;
    await db.from('test_registrations').update({ payment_status: 'rejected', rejection_reason: reason, updated_at: new Date().toISOString() }).eq('id', id);
    if (t) {
        var phone = (t.phone || '').replace(/[^0-9]/g, '');
        if (phone.startsWith('0')) phone = '62' + phone.substring(1);
        if (!phone.startsWith('62')) phone = '62' + phone;
        var msg = 'Assalamu\'alaikum *' + t.full_name + '* 🙏\n\nMohon maaf, pembayaran pendaftaran tes *' + t.test_type + '* (kode: ' + t.reg_code + ') belum dapat kami verifikasi.\n\n❌ *Alasan:* ' + reason + '\n\nSilakan hubungi kami untuk informasi lebih lanjut.\n\n_Tim SIEC_';
        window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
    }
    showNotification('❌ Ditolak!');
    loadTestRegs();
}

function showTestInfoForm(id) {
    document.getElementById('testInfoContent').innerHTML =
        '<div style="padding:16px">' +
        '<input type="hidden" id="testInfoId" value="' + id + '">' +
        '<div class="form-group"><label>Test ID *</label><input type="text" id="tiId" placeholder="Contoh: 12345678"></div>' +
        '<div class="form-group"><label>Password *</label><input type="text" id="tiPass" placeholder="Contoh: abc123"></div>' +
        '<div class="form-group"><label>Link Tes</label><input type="text" id="tiLink" placeholder="https://test.ets.org/..."></div>' +
        '<div class="form-group"><label>Link Zoom/GMeet</label><input type="text" id="tiZoom" placeholder="https://zoom.us/..."></div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Tanggal Tes</label><input type="date" id="tiTestDate"></div>' +
        '<div class="form-group"><label>Jam Tes</label><input type="text" id="tiTestTime" placeholder="09:00 WIB"></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Tanggal Zoom</label><input type="date" id="tiZoomDate"></div>' +
        '<div class="form-group"><label>Jam Zoom</label><input type="text" id="tiZoomTime" placeholder="08:30 WIB"></div>' +
        '</div>' +
        '<div class="form-group"><label>Catatan Tambahan</label><input type="text" id="tiNotes" placeholder="Instruksi khusus"></div>' +
        '<div class="review-actions">' +
        '<button class="btn btn-primary" onclick="sendTestInfo()"><i class="fas fa-paper-plane"></i> Simpan & Kirim ke Peserta</button>' +
        '<button class="btn btn-outline" onclick="closePrintPreview(\'testInfoModal\')">Batal</button>' +
        '</div>' +
        '</div>';
    document.getElementById('testInfoModal').style.display = 'flex';
}

async function sendTestInfo() {
    var id = document.getElementById('testInfoId').value;
    var testId = document.getElementById('tiId').value.trim();
    var testPass = document.getElementById('tiPass').value.trim();
    if (!testId || !testPass) { showNotification('ID & Password wajib!', 'error'); return; }

    var data = {
        test_id: testId,
        test_password: testPass,
        test_link: document.getElementById('tiLink').value.trim() || null,
        zoom_link: document.getElementById('tiZoom').value.trim() || null,
        test_date: document.getElementById('tiTestDate').value || null,
        test_time: document.getElementById('tiTestTime').value.trim() || null,
        zoom_date: document.getElementById('tiZoomDate').value || null,
        zoom_time: document.getElementById('tiZoomTime').value.trim() || null,
        test_notes: document.getElementById('tiNotes').value.trim() || null,
        info_sent: true,
        updated_at: new Date().toISOString()
    };

    await db.from('test_registrations').update(data).eq('id', id);

    var t = (await db.from('test_registrations').select('*').eq('id', id).single()).data;
    if (t) {
        var phone = (t.phone || '').replace(/[^0-9]/g, '');
        if (phone.startsWith('0')) phone = '62' + phone.substring(1);
        if (!phone.startsWith('62')) phone = '62' + phone;

        var msg = 'Assalamu\'alaikum *' + t.full_name + '* 🙏\n\n';
        msg += 'Alhamdulillah, pembayaran Anda untuk *' + t.test_type + '* telah kami verifikasi! ✅\n\n';
        msg += 'Berikut adalah informasi tes Anda:\n\n';
        msg += '🔑 *Akses Tes:*\n';
        msg += '• ID: *' + t.test_id + '*\n';
        msg += '• Password: *' + t.test_password + '*\n';
        if (t.test_link) msg += '• Link Tes: ' + t.test_link + '\n';
        msg += '\n';
        if (t.zoom_link) {
            msg += '📹 *Zoom/GMeet:*\n';
            msg += '• Link: ' + t.zoom_link + '\n';
            if (t.zoom_date) msg += '• Jadwal: ' + t.zoom_date + ' ' + (t.zoom_time || '') + '\n';
            msg += '\n';
        }
        if (t.test_date) {
            msg += '📅 *Jadwal Pelaksanaan Tes:*\n';
            msg += '• Tanggal: ' + t.test_date + '\n';
            if (t.test_time) msg += '• Jam: ' + t.test_time + '\n';
            msg += '\n';
        }
        if (t.test_notes) msg += '📝 *Catatan:*\n' + t.test_notes + '\n\n';
        msg += '⚠️ *PENTING:*\n';
        msg += '• Simpan ID & Password ini dengan baik\n';
        msg += '• Pastikan koneksi internet stabil saat tes\n';
        msg += '• Login 15 menit sebelum jadwal\n\n';
        msg += 'Semoga sukses dalam tes Anda! 🙏✨\n\n_Tim SIEC_';

        window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
    }

    closePrintPreview('testInfoModal');
    showNotification('✅ Info tes terkirim!');
    loadTestRegs();
}

async function deleteTestReg(id) {
    if (!confirm('Hapus pendaftaran ini?')) return;
    await db.from('test_registrations').delete().eq('id', id);
    showNotification('Dihapus!');
    loadTestRegs();
}