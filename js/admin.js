// ============================================
// SIEC Admin - Clean Version
// QR Code menggunakan Google Charts API
// (Tidak perlu library external)
// ============================================

var LOGO_URL = 'assets/logo.png';
var transFileData = null;
var toeflFileData = null;

// ============================================
// QR CODE - GOOGLE CHARTS API (SELALU WORKS)
// ============================================
function generateQrCode(canvasId, text, size) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    var qrSize = Math.max(parseInt(size) || 80, 40);
    canvas.width = qrSize;
    canvas.height = qrSize;
    canvas.style.display = 'block';

    var ctx = canvas.getContext('2d');

    // Buat URL Google Charts QR
    var encodedText = encodeURIComponent(text || window.location.origin);
    var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=' +
                qrSize + 'x' + qrSize +
                '&data=' + encodedText +
                '&margin=4' +
                '&ecc=H';

    var qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';

    qrImg.onload = function() {
        // Gambar QR ke canvas
        ctx.drawImage(qrImg, 0, 0, qrSize, qrSize);
        // Tambah logo di tengah
        addLogoToCanvas(canvas, qrSize);
    };

    qrImg.onerror = function() {
        // Fallback: gambar kotak sederhana dengan teks
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, qrSize, qrSize);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(4, 4, qrSize - 8, qrSize - 8);
        ctx.fillStyle = '#2563eb';
        ctx.font = 'bold ' + Math.max(qrSize * 0.15, 8) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('QR', qrSize / 2, qrSize / 2 - 8);
        ctx.font = Math.max(qrSize * 0.12, 6) + 'px Arial';
        ctx.fillText('SIEC', qrSize / 2, qrSize / 2 + 8);
    };

    qrImg.src = qrUrl;
}

function addLogoToCanvas(canvas, qrSize) {
    var ctx = canvas.getContext('2d');
    var logo = new Image();
    logo.crossOrigin = 'anonymous';

    logo.onload = function() {
        var logoSize = qrSize * 0.22;
        var cx = canvas.width / 2;
        var cy = canvas.height / 2;

        // Background putih bulat
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, logoSize / 2 + 3, 0, Math.PI * 2);
        ctx.fill();

        // Logo bulat
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, logoSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logo, cx - logoSize/2, cy - logoSize/2, logoSize, logoSize);
        ctx.restore();

        // Border biru
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, logoSize / 2 + 1, 0, Math.PI * 2);
        ctx.stroke();
    };

    logo.onerror = function() {
        // Tulis teks SIEC jika logo tidak ada
        var ctx2 = canvas.getContext('2d');
        var logoSize = qrSize * 0.22;
        var cx = canvas.width / 2;
        var cy = canvas.height / 2;

        ctx2.fillStyle = '#ffffff';
        ctx2.beginPath();
        ctx2.arc(cx, cy, logoSize/2 + 3, 0, Math.PI * 2);
        ctx2.fill();

        ctx2.fillStyle = '#2563eb';
        ctx2.font = 'bold ' + Math.max(logoSize * 0.35, 7) + 'px Arial';
        ctx2.textAlign = 'center';
        ctx2.textBaseline = 'middle';
        ctx2.fillText('SIEC', cx, cy);
    };

    logo.src = LOGO_URL;
}

// Alias - supaya kode lama tetap works
function generateQrWithLogo(canvasId, text, size) {
    generateQrCode(canvasId, text, size);
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    var admin = checkAuth();
    if (!admin) return;

    var adminNameEl = document.getElementById('adminName');
    if (adminNameEl) adminNameEl.textContent = admin.full_name;

    document.querySelectorAll('.sidebar-link[data-section]').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            switchSection(link.dataset.section);
        });
    });

    var sidebarToggle = document.getElementById('sidebarToggle');
    var sidebarClose = document.getElementById('sidebarClose');
    var adminSidebar = document.getElementById('adminSidebar');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            adminSidebar.classList.toggle('active');
        });
    }
    if (sidebarClose) {
        sidebarClose.addEventListener('click', function() {
            adminSidebar.classList.remove('active');
        });
    }

    loadDashboardStats();
    loadAdminArticles();
    loadAdminPrograms();
    loadAdminClients();
    loadAdminTranslations();
    loadAdminStatus();
    loadAdminToefl();

    setTimeout(function() {
        updateSmallPreview('trans');
        updateSmallPreview('toefl');
    }, 1000);
});

// ============================================
// NAVIGATION
// ============================================
function switchSection(section) {
    document.querySelectorAll('.admin-section').forEach(function(s) {
        s.classList.remove('active');
    });
    document.querySelectorAll('.sidebar-link').forEach(function(l) {
        l.classList.remove('active');
    });

    var el = document.getElementById('section-' + section);
    if (el) el.classList.add('active');

    var link = document.querySelector('[data-section="' + section + '"]');
    if (link) link.classList.add('active');

    var titles = {
        'dashboard': 'Dashboard',
        'articles': 'Artikel',
        'programs': 'Program Belajar',
        'translation-clients': 'Laporan Pengguna Jasa',
        'translations': 'Dokumen Terjemahan',
        'translation-status': 'Status Terjemahan',
        'toefl': 'Sertifikat TOEFL'
    };

    var titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = titles[section] || 'Dashboard';

    document.getElementById('adminSidebar').classList.remove('active');
}

// ============================================
// DASHBOARD
// ============================================
async function loadDashboardStats() {
    try {
        var a = await db.from('articles').select('*', { count: 'exact', head: true });
        var c = await db.from('translation_clients').select('*', { count: 'exact', head: true });
        var t = await db.from('translation_documents').select('*', { count: 'exact', head: true });
        var cert = await db.from('toefl_certificates').select('*', { count: 'exact', head: true });
        var p = await db.from('learning_programs').select('*', { count: 'exact', head: true }).eq('is_active', true);

        document.getElementById('totalArticles').textContent = a.count || 0;
        document.getElementById('totalClients').textContent = c.count || 0;
        document.getElementById('totalTranslations').textContent = t.count || 0;
        document.getElementById('totalCertificates').textContent = cert.count || 0;
        document.getElementById('totalPrograms').textContent = p.count || 0;
    } catch(e) { console.error(e); }
}

// ============================================
// UTILITY
// ============================================
function insertTag(tag) {
    var t = document.getElementById('articleContent');
    var s = t.selectionStart;
    var e = t.selectionEnd;
    var sel = t.value.substring(s, e);
    t.value = t.value.substring(0,s) + '<'+tag+'>'+sel+'</'+tag+'>' + t.value.substring(e);
    t.focus();
}

function togglePreview() {
    var p = document.getElementById('articlePreview');
    if (p.style.display === 'none') {
        p.innerHTML = document.getElementById('articleContent').value;
        p.style.display = 'block';
    } else {
        p.style.display = 'none';
    }
}

function closePrintPreview(id) {
    document.getElementById(id).style.display = 'none';
}

function printDocument() {
    window.print();
}

function calculateToeflTotal() {
    var l = parseFloat(document.getElementById('toeflListening').value) || 0;
    var s = parseFloat(document.getElementById('toeflStructure').value) || 0;
    var r = parseFloat(document.getElementById('toeflReading').value) || 0;
    document.getElementById('toeflTotal').value = Math.round((l + s + r) * 10 / 3);
}

// ============================================
// FILE UPLOAD & PREVIEW
// ============================================
function handleFilePreview(input, type) {
    var file = input.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        showNotification('File terlalu besar! Max 10MB', 'error');
        input.value = '';
        return;
    }

    if (type === 'trans') transFileData = file;
    else toeflFileData = file;

    document.getElementById(type + 'FileInfo').style.display = 'flex';
    document.getElementById(type + 'FileName').textContent = file.name;

    var livePreview = document.getElementById(type + 'LivePreview');
    var smallPreview = document.getElementById(type + 'SmallPreview');
    if (livePreview) livePreview.style.display = 'block';
    if (smallPreview) smallPreview.style.display = 'none';

    var previewFrame = document.getElementById(type + 'PreviewFrame');
    var wordFallback = document.getElementById(type + 'WordFallback');

    if (file.type === 'application/pdf') {
        var url = URL.createObjectURL(file);
        if (previewFrame) {
            previewFrame.src = url;
            previewFrame.style.display = 'block';
        }
        if (wordFallback) wordFallback.style.display = 'none';
    } else {
        if (previewFrame) previewFrame.style.display = 'none';
        if (wordFallback) {
            wordFallback.style.display = 'flex';
            var nameEl = document.getElementById(type + 'WordName');
            if (nameEl) nameEl.textContent = file.name;
        }
    }

    var sampleId = type === 'trans' ? 'SIEC-TR-2024-0001' : 'SIEC-TF-2024-0001';
    var verifyUrl = window.location.origin + '/verify.html?id=' + sampleId;

    setTimeout(function() {
        generateQrCode(type + 'QrCanvas', verifyUrl, 80);
    }, 800);

    if (type === 'toefl') loadSavedToeflPositionToLive();

    setTimeout(function() {
        initDrag(type);
    }, 1000);
}

function removeFilePreview(type) {
    if (type === 'trans') {
        transFileData = null;
        var f = document.getElementById('transFile');
        if (f) f.value = '';
    } else {
        toeflFileData = null;
        var f2 = document.getElementById('toeflFile');
        if (f2) f2.value = '';
    }

    var fileInfo = document.getElementById(type + 'FileInfo');
    if (fileInfo) fileInfo.style.display = 'none';

    var livePreview = document.getElementById(type + 'LivePreview');
    var smallPreview = document.getElementById(type + 'SmallPreview');
    if (livePreview) livePreview.style.display = 'none';
    if (smallPreview) smallPreview.style.display = 'block';

    var frame = document.getElementById(type + 'PreviewFrame');
    if (frame) frame.src = '';
}

async function uploadFileToSupabase(file, folder) {
    var ext = file.name.split('.').pop();
    var fileName = folder + '/' + Date.now() + '-' + Math.random().toString(36).substr(2,9) + '.' + ext;

    var result = await db.storage.from('uploads').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
    });

    if (result.error) throw result.error;

    var urlData = db.storage.from('uploads').getPublicUrl(fileName);
    return { url: urlData.data.publicUrl, name: file.name };
}

// ============================================
// DRAGGABLE QR
// ============================================
function initDrag(type) {
    var dragEl = document.getElementById(type + 'QrDrag');
    var container = document.getElementById(type + 'PreviewPage');
    if (!dragEl || !container) return;

    var isDragging = false;
    var startX = 0, startY = 0, origLeft = 0, origTop = 0;

    dragEl.addEventListener('mousedown', function(e) {
        isDragging = true;
        dragEl.classList.add('dragging');
        startX = e.clientX; startY = e.clientY;
        origLeft = dragEl.offsetLeft; origTop = dragEl.offsetTop;
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        moveQr(type, dragEl, container, origLeft + (e.clientX - startX), origTop + (e.clientY - startY));
    });

    document.addEventListener('mouseup', function() {
        if (!isDragging) return;
        isDragging = false;
        dragEl.classList.remove('dragging');
        if (type === 'toefl') saveQrPos(dragEl, container);
    });

    dragEl.addEventListener('touchstart', function(e) {
        isDragging = true;
        dragEl.classList.add('dragging');
        var t = e.touches[0];
        startX = t.clientX; startY = t.clientY;
        origLeft = dragEl.offsetLeft; origTop = dragEl.offsetTop;
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        var t = e.touches[0];
        moveQr(type, dragEl, container, origLeft + (t.clientX - startX), origTop + (t.clientY - startY));
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchend', function() {
        if (!isDragging) return;
        isDragging = false;
        dragEl.classList.remove('dragging');
        if (type === 'toefl') saveQrPos(dragEl, container);
    });
}

function moveQr(type, el, container, newLeft, newTop) {
    newLeft = Math.max(0, Math.min(newLeft, container.offsetWidth - el.offsetWidth));
    newTop = Math.max(0, Math.min(newTop, container.offsetHeight - el.offsetHeight));
    el.style.left = newLeft + 'px';
    el.style.top = newTop + 'px';

    var px = Math.round((newLeft / container.offsetWidth) * 100);
    var py = Math.round((newTop / container.offsetHeight) * 100);

    var posXEl = document.getElementById(type + 'PosX');
    var posYEl = document.getElementById(type + 'PosY');
    if (posXEl) posXEl.textContent = px + '%';
    if (posYEl) posYEl.textContent = py + '%';

    var sx = document.getElementById(type + 'QrX');
    var sy = document.getElementById(type + 'QrY');
    if (sx) sx.value = px;
    if (sy) sy.value = py;
}

function saveQrPos(el, container) {
    var remEl = document.getElementById('toeflRememberPos');
    if (!remEl || !remEl.checked) return;
    var pos = {
        x: Math.round((el.offsetLeft / container.offsetWidth) * 100),
        y: Math.round((el.offsetTop / container.offsetHeight) * 100),
        size: document.getElementById('toeflQrSize') ? document.getElementById('toeflQrSize').value : 80,
        showId: document.getElementById('toeflShowId') ? document.getElementById('toeflShowId').checked : true
    };
    localStorage.setItem('siec_toefl_qr_pos', JSON.stringify(pos));
}

function loadSavedToeflPositionToLive() {
    var saved = localStorage.getItem('siec_toefl_qr_pos');
    if (!saved) return;
    try {
        var pos = JSON.parse(saved);
        var dragEl = document.getElementById('toeflQrDrag');
        var container = document.getElementById('toeflPreviewPage');
        if (dragEl && container) {
            setTimeout(function() {
                dragEl.style.left = ((pos.x / 100) * container.offsetWidth) + 'px';
                dragEl.style.top = ((pos.y / 100) * container.offsetHeight) + 'px';
                var posXEl = document.getElementById('toeflPosX');
                var posYEl = document.getElementById('toeflPosY');
                if (posXEl) posXEl.textContent = pos.x + '%';
                if (posYEl) posYEl.textContent = pos.y + '%';
            }, 500);
        }
        var sz = document.getElementById('toeflQrSize');
        if (sz && pos.size) sz.value = pos.size;
    } catch(e) {}
}

function loadSavedToeflPosition() {
    var saved = localStorage.getItem('siec_toefl_qr_pos');
    if (!saved) return;
    try {
        var pos = JSON.parse(saved);
        var xEl = document.getElementById('toeflQrX');
        var yEl = document.getElementById('toeflQrY');
        var sz = document.getElementById('toeflQrSize');
        if (xEl) xEl.value = pos.x;
        if (yEl) yEl.value = pos.y;
        if (sz) sz.value = pos.size || 80;
        updateSmallPreview('toefl');
    } catch(e) {}
}

function resetToeflPosition() {
    var xEl = document.getElementById('toeflQrX');
    var yEl = document.getElementById('toeflQrY');
    var sz = document.getElementById('toeflQrSize');
    var si = document.getElementById('toeflShowId');
    if (xEl) xEl.value = 80;
    if (yEl) yEl.value = 85;
    if (sz) sz.value = 80;
    if (si) si.checked = true;
    localStorage.removeItem('siec_toefl_qr_pos');
    updateSmallPreview('toefl');
    var drag = document.getElementById('toeflQrDrag');
    if (drag) { drag.style.left = '80%'; drag.style.top = '85%'; }
    showNotification('Posisi di-reset!');
}

function resizeQr(type) {
    var sz = document.getElementById(type + 'QrSize');
    if (!sz) return;
    var size = parseInt(sz.value);
    var szVal = document.getElementById(type + 'QrSizeVal');
    if (szVal) szVal.textContent = size + 'px';

    var canvas = document.getElementById(type + 'QrCanvas');
    if (canvas) {
        var sampleId = type === 'trans' ? 'SIEC-TR-2024-0001' : 'SIEC-TF-2024-0001';
        generateQrCode(type + 'QrCanvas', window.location.origin + '/verify.html?id=' + sampleId, size);
    }
}

function toggleQrId(type) {
    var showEl = document.getElementById(type + 'ShowId');
    var idText = document.getElementById(type + 'QrIdText');
    if (showEl && idText) idText.style.display = showEl.checked ? 'block' : 'none';
}

function updateSmallPreview(type) {
    var xEl = document.getElementById(type + 'QrX');
    var yEl = document.getElementById(type + 'QrY');
    if (!xEl || !yEl) return;

    var x = xEl.value || 80;
    var y = yEl.value || 85;

    var xValEl = document.getElementById(type + 'QrXVal');
    var yValEl = document.getElementById(type + 'QrYVal');
    if (xValEl) xValEl.textContent = x + '%';
    if (yValEl) yValEl.textContent = y + '%';

    var overlay = document.getElementById(type + 'SmallQr');
    if (overlay) {
        overlay.style.left = x + '%';
        overlay.style.top = y + '%';
    }

    var sampleText = window.location.origin + '/verify.html?id=SIEC-SAMPLE';
    generateQrCode(type + 'SmallQrCanvas', sampleText, 50);
}

function getQrPosition(type) {
    var livePreview = document.getElementById(type + 'LivePreview');
    var isLive = livePreview && livePreview.style.display !== 'none';

    if (isLive) {
        var drag = document.getElementById(type + 'QrDrag');
        var cont = document.getElementById(type + 'PreviewPage');
        if (drag && cont && cont.offsetWidth > 0) {
            return {
                x: Math.round((drag.offsetLeft / cont.offsetWidth) * 100),
                y: Math.round((drag.offsetTop / cont.offsetHeight) * 100),
                size: document.getElementById(type + 'QrSize') ? document.getElementById(type + 'QrSize').value : 80,
                showId: document.getElementById(type + 'ShowId') ? document.getElementById(type + 'ShowId').checked : true
            };
        }
    }

    return {
        x: document.getElementById(type + 'QrX') ? document.getElementById(type + 'QrX').value : 80,
        y: document.getElementById(type + 'QrY') ? document.getElementById(type + 'QrY').value : 85,
        size: document.getElementById(type + 'QrSize') ? document.getElementById(type + 'QrSize').value : 80,
        showId: document.getElementById(type + 'ShowId') ? document.getElementById(type + 'ShowId').checked : true
    };
}

// ============================================
// PRINT FUNCTIONS
// ============================================
function showTranslationPrint(doc) {
    var pos = { x: 80, y: 85, size: 100, showId: true };
    if (doc.qr_position) { try { pos = JSON.parse(doc.qr_position); } catch(e) {} }

    var modal = document.getElementById('printPreview');
    var content = document.getElementById('printPreviewContent');
    var verifyUrl = window.location.origin + '/verify.html?id=' + doc.document_id + '&type=translation';
    var qrSize = parseInt(pos.size) || 100;

    content.innerHTML =
        '<div style="position:relative;min-height:600px;border:1px solid #ddd;background:white;">' +
        (doc.file_url
            ? '<iframe src="' + doc.file_url + '" style="width:100%;height:650px;border:none;display:block;"></iframe>'
            : '<div style="padding:40px;">' +
              '<div style="text-align:center;border-bottom:3px double #333;padding-bottom:16px;margin-bottom:20px;">' +
              '<img src="' + LOGO_URL + '" style="width:60px;height:60px;object-fit:contain;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto;" onerror="this.style.display=\'none\'">' +
              '<div style="font-size:1.5rem;font-weight:800;color:#2563eb;">SIEC</div>' +
              '<div style="font-weight:700;">Syaf Intensive English Course</div>' +
              '<div style="color:#666;font-size:0.85rem;">Dokumen Terjemahan Resmi</div>' +
              '</div>' +
              '<div style="line-height:2.2;font-size:0.95rem;">' +
              '<div><b>ID:</b> ' + doc.document_id + '</div>' +
              '<div><b>Klien:</b> ' + doc.client_name + '</div>' +
              '<div><b>Judul:</b> ' + doc.document_title + '</div>' +
              '<div><b>Jenis:</b> ' + doc.document_type + '</div>' +
              '<div><b>Bahasa:</b> ' + doc.source_language + ' → ' + doc.target_language + '</div>' +
              '<div><b>Tanggal:</b> ' + formatDate(doc.issued_date) + '</div>' +
              '</div>' +
              '<div style="margin-top:60px;display:flex;justify-content:space-between;border-top:1px solid #ccc;padding-top:16px;">' +
              '<div><div style="height:50px;"></div><small>Penerjemah</small></div>' +
              '<div style="text-align:right;"><div style="height:50px;"></div><small>Administrator SIEC</small></div>' +
              '</div>' +
              '</div>'
        ) +
        '<div id="printQrContainer" style="position:absolute;left:' + pos.x + '%;top:' + pos.y + '%;' +
        'transform:translate(-50%,-50%);background:white;padding:6px;border-radius:6px;' +
        'box-shadow:0 2px 8px rgba(0,0,0,0.2);text-align:center;z-index:999;">' +
        '<canvas id="printQrTrans" width="' + qrSize + '" height="' + qrSize + '"></canvas>' +
        (pos.showId ? '<div style="font-size:8px;font-weight:700;font-family:monospace;margin-top:3px;">' + doc.document_id + '</div>' : '') +
        '<div style="font-size:6px;color:#999;margin-top:2px;">Scan untuk verifikasi</div>' +
        '</div>' +
        '</div>';

    modal.style.display = 'flex';

    setTimeout(function() {
        generateQrCode('printQrTrans', verifyUrl, qrSize);
    }, 600);
}

function showCertPrint(cert) {
    var pos = { x: 80, y: 85, size: 100, showId: true };
    if (cert.qr_position) { try { pos = JSON.parse(cert.qr_position); } catch(e) {} }

    var modal = document.getElementById('certPrintModal');
    var content = document.getElementById('certPrintContent');
    var verifyUrl = window.location.origin + '/verify.html?id=' + cert.certificate_id + '&type=toefl';
    var qrSize = parseInt(pos.size) || 100;

    var dlLink = document.getElementById('certDownloadLink');
    if (dlLink) {
        if (cert.file_url) {
            dlLink.href = cert.file_url;
            dlLink.style.display = 'inline-flex';
        } else {
            dlLink.style.display = 'none';
        }
    }

    content.innerHTML =
        '<div style="position:relative;min-height:550px;border:1px solid #ddd;background:white;">' +
        (cert.file_url
            ? '<iframe src="' + cert.file_url + '" style="width:100%;height:600px;border:none;display:block;"></iframe>'
            : '<div style="padding:30px;text-align:center;">' +
              '<img src="' + LOGO_URL + '" style="width:70px;height:70px;object-fit:contain;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;" onerror="this.style.display=\'none\'">' +
              '<div style="font-size:0.85rem;color:#666;text-transform:uppercase;letter-spacing:2px;">Certificate of Achievement</div>' +
              '<div style="font-size:1.8rem;font-weight:800;color:#2563eb;margin:8px 0;">TOEFL Prediction Test</div>' +
              '<div style="color:#666;font-size:0.9rem;">Syaf Intensive English Course</div>' +
              '<div style="font-size:0.9rem;color:#666;margin:16px 0;">This certifies that</div>' +
              '<div style="font-size:2rem;font-weight:700;border-bottom:2px solid #333;padding-bottom:8px;margin:8px 60px;">' + cert.participant_name + '</div>' +
              '<div style="display:flex;gap:12px;justify-content:center;margin:20px 0;">' +
              '<div style="padding:14px 20px;background:#f1f5f9;border-radius:10px;text-align:center;">' +
              '<div style="font-size:0.7rem;color:#666;margin-bottom:4px;">LISTENING</div>' +
              '<div style="font-size:1.8rem;font-weight:800;color:#2563eb;">' + cert.listening_score + '</div></div>' +
              '<div style="padding:14px 20px;background:#f1f5f9;border-radius:10px;text-align:center;">' +
              '<div style="font-size:0.7rem;color:#666;margin-bottom:4px;">STRUCTURE</div>' +
              '<div style="font-size:1.8rem;font-weight:800;color:#2563eb;">' + cert.structure_score + '</div></div>' +
              '<div style="padding:14px 20px;background:#f1f5f9;border-radius:10px;text-align:center;">' +
              '<div style="font-size:0.7rem;color:#666;margin-bottom:4px;">READING</div>' +
              '<div style="font-size:1.8rem;font-weight:800;color:#2563eb;">' + cert.reading_score + '</div></div>' +
              '</div>' +
              '<div style="background:linear-gradient(135deg,#2563eb,#7c3aed);color:white;padding:14px 28px;border-radius:14px;display:inline-block;margin:12px 0;">' +
              '<div style="font-size:0.75rem;opacity:0.8;">Total Score</div>' +
              '<div style="font-size:3rem;font-weight:900;line-height:1;">' + cert.total_score + '</div></div>' +
              '<div style="color:#666;font-size:0.85rem;margin-top:12px;">Test Date: ' + formatDate(cert.test_date) + '</div>' +
              '</div>'
        ) +
        '<div style="position:absolute;left:' + pos.x + '%;top:' + pos.y + '%;' +
        'transform:translate(-50%,-50%);background:white;padding:6px;border-radius:6px;' +
        'box-shadow:0 2px 8px rgba(0,0,0,0.2);text-align:center;z-index:999;">' +
        '<canvas id="printQrToefl" width="' + qrSize + '" height="' + qrSize + '"></canvas>' +
        (pos.showId ? '<div style="font-size:8px;font-weight:700;font-family:monospace;margin-top:3px;">' + cert.certificate_id + '</div>' : '') +
        '<div style="font-size:6px;color:#999;margin-top:2px;">Scan untuk verifikasi</div>' +
        '</div>' +
        '</div>';

    modal.style.display = 'flex';

    setTimeout(function() {
        generateQrCode('printQrToefl', verifyUrl, qrSize);
    }, 600);
}

// ============================================
// ARTICLES
// ============================================
function showArticleForm(a) {
    var f = document.getElementById('articleForm');
    f.style.display = 'block';
    f.scrollIntoView({ behavior: 'smooth' });
    if (a) {
        document.getElementById('articleFormTitle').textContent = 'Edit Artikel';
        document.getElementById('articleId').value = a.id;
        document.getElementById('articleTitle').value = a.title;
        document.getElementById('articleCategory').value = a.category;
        document.getElementById('articleCover').value = a.cover_image || '';
        document.getElementById('articleExcerpt').value = a.excerpt || '';
        document.getElementById('articleContent').value = a.content;
        document.getElementById('articlePublished').checked = a.is_published;
        var r = document.querySelector('input[name="articleLayout"][value="' + a.layout_type + '"]');
        if (r) r.checked = true;
    } else {
        document.getElementById('articleFormTitle').textContent = 'Tambah Artikel';
        document.getElementById('articleId').value = '';
        document.getElementById('articleTitle').value = '';
        document.getElementById('articleCover').value = '';
        document.getElementById('articleExcerpt').value = '';
        document.getElementById('articleContent').value = '';
        document.getElementById('articlePublished').checked = false;
        var def = document.querySelector('input[name="articleLayout"][value="standard"]');
        if (def) def.checked = true;
    }
}

function hideArticleForm() { document.getElementById('articleForm').style.display = 'none'; }

async function saveArticle() {
    var title = document.getElementById('articleTitle').value.trim();
    if (!title) { showNotification('Judul harus diisi!', 'error'); return; }
    var layoutEl = document.querySelector('input[name="articleLayout"]:checked');
    var id = document.getElementById('articleId').value;
    var pub = document.getElementById('articlePublished').checked;
    var data = {
        title: title,
        slug: generateSlug(title) + '-' + Date.now(),
        content: document.getElementById('articleContent').value,
        excerpt: document.getElementById('articleExcerpt').value,
        cover_image: document.getElementById('articleCover').value,
        layout_type: layoutEl ? layoutEl.value : 'standard',
        category: document.getElementById('articleCategory').value,
        is_published: pub,
        published_at: pub ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
    };
    try {
        var result = id
            ? await db.from('articles').update(data).eq('id', id)
            : await db.from('articles').insert(data);
        if (result.error) throw result.error;
        showNotification(id ? 'Diperbarui!' : 'Ditambahkan!');
        hideArticleForm();
        loadAdminArticles();
        loadDashboardStats();
    } catch(e) { showNotification('Gagal: ' + e.message, 'error'); }
}

async function loadAdminArticles() {
    var tbody = document.getElementById('articlesTableBody');
    if (!tbody) return;
    try {
        var result = await db.from('articles').select('*').order('created_at', { ascending: false });
        if (!result.data || !result.data.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Belum ada artikel</td></tr>';
            return;
        }
        tbody.innerHTML = result.data.map(function(a) {
            return '<tr><td><strong>' + a.title + '</strong></td><td>' + a.category + '</td>' +
                '<td>' + a.layout_type + '</td>' +
                '<td><span class="status-badge ' + (a.is_published ? 'status-published' : 'status-draft') + '">' + (a.is_published ? 'Published' : 'Draft') + '</span></td>' +
                '<td>' + formatDate(a.created_at) + '</td>' +
                '<td><div class="action-buttons">' +
                '<button class="btn btn-sm btn-primary" onclick=\'showArticleForm(' + JSON.stringify(a) + ')\'><i class="fas fa-edit"></i></button>' +
                '<button class="btn btn-sm btn-danger" onclick="deleteArticle(\'' + a.id + '\')"><i class="fas fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
    } catch(e) { console.error(e); }
}

async function deleteArticle(id) {
    if (!confirm('Hapus?')) return;
    await db.from('articles').delete().eq('id', id);
    showNotification('Dihapus!');
    loadAdminArticles();
    loadDashboardStats();
}

// ============================================
// PROGRAMS
// ============================================
function showProgramForm(p) {
    var f = document.getElementById('programForm');
    f.style.display = 'block';
    f.scrollIntoView({ behavior: 'smooth' });
    if (p) {
        document.getElementById('programFormTitle').textContent = 'Edit Program';
        document.getElementById('programId').value = p.id;
        document.getElementById('programTitle').value = p.title;
        document.getElementById('programType').value = p.program_type;
        document.getElementById('programLevel').value = p.level;
        document.getElementById('programDuration').value = p.duration || '';
        document.getElementById('programSchedule').value = p.schedule || '';
        document.getElementById('programPrice').value = p.price || '';
        document.getElementById('programCover').value = p.cover_image || '';
        document.getElementById('programDesc').value = p.description;
        document.getElementById('programContent').value = p.content || '';
        document.getElementById('programFeatures').value = (p.features || []).join(', ');
        document.getElementById('programActive').checked = p.is_active;
        var r = document.querySelector('input[name="programLayout"][value="' + p.layout_type + '"]');
        if (r) r.checked = true;
    } else {
        document.getElementById('programFormTitle').textContent = 'Tambah Program';
        ['programId','programTitle','programDuration','programSchedule','programPrice','programCover','programDesc','programContent','programFeatures'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
        });
        document.getElementById('programActive').checked = true;
        var def = document.querySelector('input[name="programLayout"][value="card"]');
        if (def) def.checked = true;
    }
}

function hideProgramForm() { document.getElementById('programForm').style.display = 'none'; }

async function saveProgram() {
    var title = document.getElementById('programTitle').value.trim();
    if (!title) { showNotification('Nama harus diisi!', 'error'); return; }
    var id = document.getElementById('programId').value;
    var layoutEl = document.querySelector('input[name="programLayout"]:checked');
    var featStr = document.getElementById('programFeatures').value;
    var features = featStr ? featStr.split(',').map(function(f) { return f.trim(); }).filter(function(f) { return f; }) : [];
    var data = {
        title: title,
        slug: generateSlug(title) + '-' + Date.now(),
        description: document.getElementById('programDesc').value,
        content: document.getElementById('programContent').value,
        program_type: document.getElementById('programType').value,
        level: document.getElementById('programLevel').value,
        duration: document.getElementById('programDuration').value,
        schedule: document.getElementById('programSchedule').value,
        price: document.getElementById('programPrice').value,
        cover_image: document.getElementById('programCover').value,
        layout_type: layoutEl ? layoutEl.value : 'card',
        features: features,
        is_active: document.getElementById('programActive').checked,
        updated_at: new Date().toISOString()
    };
    try {
        var result = id
            ? await db.from('learning_programs').update(data).eq('id', id)
            : await db.from('learning_programs').insert(data);
        if (result.error) throw result.error;
        showNotification(id ? 'Diperbarui!' : 'Ditambahkan!');
        hideProgramForm();
        loadAdminPrograms();
        loadDashboardStats();
    } catch(e) { showNotification('Gagal: ' + e.message, 'error'); }
}

async function loadAdminPrograms() {
    var tbody = document.getElementById('programsTableBody');
    if (!tbody) return;
    try {
        var result = await db.from('learning_programs').select('*').order('created_at', { ascending: false });
        if (!result.data || !result.data.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Belum ada program</td></tr>';
            return;
        }
        tbody.innerHTML = result.data.map(function(p) {
            return '<tr><td><strong>' + p.title + '</strong></td><td>' + p.program_type + '</td>' +
                '<td>' + p.layout_type + '</td><td>' + (p.price || '-') + '</td>' +
                '<td><span class="status-badge ' + (p.is_active ? 'status-published' : 'status-draft') + '">' + (p.is_active ? 'Aktif' : 'Nonaktif') + '</span></td>' +
                '<td><div class="action-buttons">' +
                '<button class="btn btn-sm btn-primary" onclick=\'showProgramForm(' + JSON.stringify(p) + ')\'><i class="fas fa-edit"></i></button>' +
                '<button class="btn btn-sm btn-danger" onclick="deleteProgram(\'' + p.id + '\')"><i class="fas fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
    } catch(e) { console.error(e); }
}

async function deleteProgram(id) {
    if (!confirm('Hapus?')) return;
    await db.from('learning_programs').delete().eq('id', id);
    showNotification('Dihapus!');
    loadAdminPrograms();
    loadDashboardStats();
}

// ============================================
// CLIENTS
// ============================================
function showClientForm(c) {
    var f = document.getElementById('clientForm');
    f.style.display = 'block';
    f.scrollIntoView({ behavior: 'smooth' });
    if (c) {
        document.getElementById('clientId').value = c.id;
        document.getElementById('clientName').value = c.client_name;
        document.getElementById('clientPhone').value = c.client_phone;
        document.getElementById('clientEmail').value = c.client_email || '';
        document.getElementById('clientDocType').value = c.document_type;
        document.getElementById('clientSourceLang').value = c.source_language;
        document.getElementById('clientTargetLang').value = c.target_language;
        document.getElementById('clientStatus').value = c.status;
        document.getElementById('clientNotes').value = c.notes || '';
    } else {
        ['clientId','clientName','clientPhone','clientEmail','clientNotes'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
        });
    }
}

function hideClientForm() { document.getElementById('clientForm').style.display = 'none'; }

async function saveClient() {
    var name = document.getElementById('clientName').value.trim();
    var phone = document.getElementById('clientPhone').value.trim();
    if (!name || !phone) { showNotification('Nama dan HP wajib!', 'error'); return; }
    var id = document.getElementById('clientId').value;
    var data = {
        client_name: name, client_phone: phone,
        client_email: document.getElementById('clientEmail').value,
        document_type: document.getElementById('clientDocType').value,
        source_language: document.getElementById('clientSourceLang').value,
        target_language: document.getElementById('clientTargetLang').value,
        status: document.getElementById('clientStatus').value,
        notes: document.getElementById('clientNotes').value,
        updated_at: new Date().toISOString()
    };
    try {
        var result = id
            ? await db.from('translation_clients').update(data).eq('id', id)
            : await db.from('translation_clients').insert(data);
        if (result.error) throw result.error;
        showNotification(id ? 'Diperbarui!' : 'Ditambahkan!');
        hideClientForm();
        loadAdminClients();
        loadDashboardStats();
    } catch(e) { showNotification('Gagal: ' + e.message, 'error'); }
}

async function loadAdminClients() {
    var tbody = document.getElementById('clientsTableBody');
    if (!tbody) return;
    try {
        var result = await db.from('translation_clients').select('*').order('created_at', { ascending: false });
        if (!result.data || !result.data.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading-cell">Belum ada data</td></tr>';
            return;
        }
        tbody.innerHTML = result.data.map(function(c) {
            return '<tr><td><strong>' + c.client_name + '</strong></td><td>' + c.client_phone + '</td>' +
                '<td>' + c.document_type + '</td><td>' + c.source_language + '→' + c.target_language + '</td>' +
                '<td><span class="status-badge status-' + c.status + '">' + c.status + '</span></td>' +
                '<td>' + formatDate(c.created_at) + '</td>' +
                '<td><div class="action-buttons">' +
                '<button class="btn btn-sm btn-primary" onclick=\'showClientForm(' + JSON.stringify(c) + ')\'><i class="fas fa-edit"></i></button>' +
                '<button class="btn btn-sm btn-danger" onclick="deleteClient(\'' + c.id + '\')"><i class="fas fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
    } catch(e) { console.error(e); }
}

async function deleteClient(id) {
    if (!confirm('Hapus?')) return;
    await db.from('translation_clients').delete().eq('id', id);
    showNotification('Dihapus!');
    loadAdminClients();
    loadDashboardStats();
}

async function exportClients() {
    var result = await db.from('translation_clients').select('*').order('created_at', { ascending: false });
    if (!result.data || !result.data.length) { showNotification('Tidak ada data!', 'error'); return; }
    var h = ['Nama','HP','Email','Dokumen','Sumber','Target','Status','Catatan','Tanggal'];
    var rows = result.data.map(function(c) {
        return [c.client_name,c.client_phone,c.client_email||'',c.document_type,c.source_language,c.target_language,c.status,c.notes||'',formatDate(c.created_at)];
    });
    var csv = [h].concat(rows).map(function(r) { return r.join(','); }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'klien-siec-' + Date.now() + '.csv';
    a.click();
    showNotification('CSV downloaded!');
}

// ============================================
// TRANSLATIONS
// ============================================
function showTranslationForm() {
    var f = document.getElementById('translationForm');
    f.style.display = 'block';
    f.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('transDocId').value = '';
    document.getElementById('transClientName').value = '';
    document.getElementById('transDocTitle').value = '';
    document.getElementById('transNotes').value = '';
    document.getElementById('transIssuedDate').value = new Date().toISOString().split('T')[0];
    transFileData = null;
    removeFilePreview('trans');
    setTimeout(function() { updateSmallPreview('trans'); }, 300);
}

function hideTranslationForm() { document.getElementById('translationForm').style.display = 'none'; }

async function saveTranslation() {
    var clientName = document.getElementById('transClientName').value.trim();
    var docTitle = document.getElementById('transDocTitle').value.trim();
    if (!clientName || !docTitle) { showNotification('Nama dan judul wajib!', 'error'); return; }

    var documentId = generateDocumentId('TR');
    var verifyUrl = window.location.origin + '/verify.html?id=' + documentId + '&type=translation';
    var qrPos = getQrPosition('trans');
    var fileUrl = '', fileName = '';

    if (transFileData) {
        try {
            showNotification('Mengupload file...', 'info');
            var up = await uploadFileToSupabase(transFileData, 'translations');
            fileUrl = up.url; fileName = up.name;
        } catch(err) {
            showNotification('Gagal upload: ' + err.message, 'error');
            return;
        }
    }

    var data = {
        document_id: documentId, client_name: clientName, document_title: docTitle,
        source_language: document.getElementById('transSourceLang').value,
        target_language: document.getElementById('transTargetLang').value,
        document_type: document.getElementById('transDocType').value,
        barcode_data: verifyUrl, qr_position: JSON.stringify(qrPos),
        file_url: fileUrl, file_name: fileName,
        issued_date: document.getElementById('transIssuedDate').value,
        notes: document.getElementById('transNotes').value,
        verified: true, status: 'valid'
    };

    try {
        var result = await db.from('translation_documents').insert(data);
        if (result.error) throw result.error;
        showNotification('Dokumen disimpan! ID: ' + documentId);
        hideTranslationForm();
        loadAdminTranslations();
        loadDashboardStats();
        showTranslationPrint(data);
    } catch(err) { showNotification('Gagal: ' + err.message, 'error'); }
}

async function loadAdminTranslations() {
    var tbody = document.getElementById('translationsTableBody');
    if (!tbody) return;
    try {
        var result = await db.from('translation_documents').select('*').order('created_at', { ascending: false });
        if (!result.data || !result.data.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading-cell">Belum ada</td></tr>';
            return;
        }
        tbody.innerHTML = result.data.map(function(d) {
            var fb = d.file_url ? '<a href="' + d.file_url + '" target="_blank" class="file-badge"><i class="fas fa-file-pdf"></i> ' + (d.file_name || 'PDF') + '</a>' : '<span class="no-file">-</span>';
            var db2 = d.file_url ? '<a href="' + d.file_url + '" target="_blank" class="btn btn-sm btn-primary"><i class="fas fa-download"></i></a>' : '';
            return '<tr><td><strong style="color:var(--primary)">' + d.document_id + '</strong></td>' +
                '<td>' + d.client_name + '</td><td>' + d.document_title + '</td>' +
                '<td>' + d.source_language + '→' + d.target_language + '</td>' +
                '<td>' + fb + '</td><td>' + formatDate(d.issued_date) + '</td>' +
                '<td><div class="action-buttons">' +
                '<button class="btn btn-sm btn-success" onclick=\'showTranslationPrint(' + JSON.stringify(d) + ')\'><i class="fas fa-print"></i></button>' +
                db2 +
                '<button class="btn btn-sm btn-danger" onclick="deleteTranslation(\'' + d.id + '\')"><i class="fas fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
    } catch(e) { console.error(e); }
}

async function deleteTranslation(id) {
    if (!confirm('Hapus?')) return;
    await db.from('translation_documents').delete().eq('id', id);
    showNotification('Dihapus!');
    loadAdminTranslations();
    loadDashboardStats();
}

// ============================================
// STATUS
// ============================================
function showStatusForm(s) {
    var f = document.getElementById('statusForm');
    f.style.display = 'block';
    f.scrollIntoView({ behavior: 'smooth' });
    if (s) {
        document.getElementById('statusId').value = s.id;
        document.getElementById('statusClientName').value = s.client_name;
        document.getElementById('statusClientPhone').value = s.client_phone;
        document.getElementById('statusDocType').value = s.document_type;
        document.getElementById('statusValue').value = s.status;
        document.getElementById('statusDesc').value = s.status_description || '';
        document.getElementById('statusEstimate').value = s.estimated_completion || '';
    } else {
        ['statusId','statusClientName','statusClientPhone','statusDocType','statusDesc','statusEstimate'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
        });
        document.getElementById('statusValue').value = 'received';
    }
}

function hideStatusForm() { document.getElementById('statusForm').style.display = 'none'; }

async function saveStatus() {
    var name = document.getElementById('statusClientName').value.trim();
    var phone = document.getElementById('statusClientPhone').value.trim();
    if (!name || !phone) { showNotification('Nama dan HP wajib!', 'error'); return; }
    var id = document.getElementById('statusId').value;
    var data = {
        client_name: name, client_phone: phone,
        document_type: document.getElementById('statusDocType').value,
        status: document.getElementById('statusValue').value,
        status_description: document.getElementById('statusDesc').value,
        estimated_completion: document.getElementById('statusEstimate').value || null,
        updated_at: new Date().toISOString()
    };
    try {
        var result;
        if (id) {
            result = await db.from('translation_status').update(data).eq('id', id);
        } else {
            data.tracking_code = generateTrackingCode();
            result = await db.from('translation_status').insert(data);
            showNotification('Kode Tracking: ' + data.tracking_code);
        }
        if (result.error) throw result.error;
        if (id) showNotification('Diperbarui!');
        hideStatusForm();
        loadAdminStatus();
    } catch(e) { showNotification('Gagal: ' + e.message, 'error'); }
}

async function loadAdminStatus() {
    var tbody = document.getElementById('statusTableBody');
    if (!tbody) return;
    try {
        var result = await db.from('translation_status').select('*').order('created_at', { ascending: false });
        if (!result.data || !result.data.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Belum ada</td></tr>';
            return;
        }
        tbody.innerHTML = result.data.map(function(s) {
            return '<tr><td><strong style="color:var(--primary)">' + s.tracking_code + '</strong></td>' +
                '<td>' + s.client_name + '</td><td>' + s.document_type + '</td>' +
                '<td><span class="status-badge status-' + s.status + '">' + s.status + '</span></td>' +
                '<td>' + (s.estimated_completion ? formatDate(s.estimated_completion) : '-') + '</td>' +
                '<td><div class="action-buttons">' +
                '<button class="btn btn-sm btn-primary" onclick=\'showStatusForm(' + JSON.stringify(s) + ')\'><i class="fas fa-edit"></i></button>' +
                '<button class="btn btn-sm btn-danger" onclick="deleteStatus(\'' + s.id + '\')"><i class="fas fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
    } catch(e) { console.error(e); }
}

async function deleteStatus(id) {
    if (!confirm('Hapus?')) return;
    await db.from('translation_status').delete().eq('id', id);
    showNotification('Dihapus!');
    loadAdminStatus();
}

// ============================================
// TOEFL
// ============================================
function showToeflForm(c) {
    var f = document.getElementById('toeflForm');
    f.style.display = 'block';
    f.scrollIntoView({ behavior: 'smooth' });
    toeflFileData = null;
    removeFilePreview('toefl');
    if (c) {
        document.getElementById('toeflId').value = c.id;
        document.getElementById('toeflName').value = c.participant_name;
        document.getElementById('toeflTestDate').value = c.test_date;
        document.getElementById('toeflEmail').value = c.participant_email || '';
        document.getElementById('toeflPhone').value = c.participant_phone || '';
        document.getElementById('toeflListening').value = c.listening_score;
        document.getElementById('toeflStructure').value = c.structure_score;
        document.getElementById('toeflReading').value = c.reading_score;
        document.getElementById('toeflTotal').value = c.total_score;
        document.getElementById('toeflNotes').value = c.notes || '';
        if (c.qr_position) {
            try {
                var p = JSON.parse(c.qr_position);
                var xEl = document.getElementById('toeflQrX');
                var yEl = document.getElementById('toeflQrY');
                var sz = document.getElementById('toeflQrSize');
                if (xEl) xEl.value = p.x;
                if (yEl) yEl.value = p.y;
                if (sz) sz.value = p.size || 80;
            } catch(e) {}
        }
    } else {
        ['toeflId','toeflName','toeflTestDate','toeflEmail','toeflPhone',
         'toeflListening','toeflStructure','toeflReading','toeflTotal','toeflNotes'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
        });
        loadSavedToeflPosition();
    }
    setTimeout(function() { updateSmallPreview('toefl'); }, 300);
}

function hideToeflForm() { document.getElementById('toeflForm').style.display = 'none'; }

async function saveToefl() {
    var name = document.getElementById('toeflName').value.trim();
    var testDate = document.getElementById('toeflTestDate').value;
    if (!name || !testDate) { showNotification('Nama dan tanggal wajib!', 'error'); return; }

    var id = document.getElementById('toeflId').value;
    var l = parseInt(document.getElementById('toeflListening').value) || 0;
    var s = parseInt(document.getElementById('toeflStructure').value) || 0;
    var r = parseInt(document.getElementById('toeflReading').value) || 0;
    var total = Math.round((l + s + r) * 10 / 3);
    var qrPos = getQrPosition('toefl');

    var remEl = document.getElementById('toeflRememberPos');
    if (remEl && remEl.checked) {
        localStorage.setItem('siec_toefl_qr_pos', JSON.stringify(qrPos));
    }

    var fileUrl = '', fileName = '';
    if (toeflFileData) {
        try {
            showNotification('Mengupload file...', 'info');
            var up = await uploadFileToSupabase(toeflFileData, 'certificates');
            fileUrl = up.url; fileName = up.name;
        } catch(err) {
            showNotification('Gagal upload: ' + err.message, 'error');
            return;
        }
    }

    var certId = id ? null : generateDocumentId('TF');
    var verifyUrl = window.location.origin + '/verify.html?id=' + (certId || id) + '&type=toefl';

    var data = {
        participant_name: name, test_date: testDate,
        participant_email: document.getElementById('toeflEmail').value,
        participant_phone: document.getElementById('toeflPhone').value,
        listening_score: l, structure_score: s, reading_score: r, total_score: total,
        qr_position: JSON.stringify(qrPos),
        file_url: fileUrl, file_name: fileName,
        notes: document.getElementById('toeflNotes').value,
        verified: true, status: 'valid'
    };

    try {
        var result;
        if (id) {
            result = await db.from('toefl_certificates').update(data).eq('id', id);
            if (result.error) throw result.error;
            showNotification('Sertifikat diperbarui!');
        } else {
            data.certificate_id = certId;
            data.barcode_data = verifyUrl;
            result = await db.from('toefl_certificates').insert(data);
            if (result.error) throw result.error;
            showNotification('Sertifikat disimpan! ID: ' + certId);
            showCertPrint(data);
        }
        hideToeflForm();
        loadAdminToefl();
        loadDashboardStats();
    } catch(err) { showNotification('Gagal: ' + err.message, 'error'); }
}

async function loadAdminToefl() {
    var tbody = document.getElementById('toeflTableBody');
    if (!tbody) return;
    try {
        var result = await db.from('toefl_certificates').select('*').order('created_at', { ascending: false });
        if (!result.data || !result.data.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading-cell">Belum ada</td></tr>';
            return;
        }
        tbody.innerHTML = result.data.map(function(c) {
            var fb = c.file_url ? '<a href="' + c.file_url + '" target="_blank" class="file-badge"><i class="fas fa-file-pdf"></i> PDF</a>' : '<span class="no-file">-</span>';
            var db2 = c.file_url ? '<a href="' + c.file_url + '" target="_blank" class="btn btn-sm btn-primary"><i class="fas fa-download"></i></a>' : '';
            return '<tr><td><strong style="color:var(--primary)">' + c.certificate_id + '</strong></td>' +
                '<td>' + c.participant_name + '</td><td>' + formatDate(c.test_date) + '</td>' +
                '<td>' + c.listening_score + '/' + c.structure_score + '/' + c.reading_score + '</td>' +
                '<td><strong style="font-size:1.1rem;color:var(--primary)">' + c.total_score + '</strong></td>' +
                '<td>' + fb + '</td>' +
                '<td><div class="action-buttons">' +
                '<button class="btn btn-sm btn-success" onclick=\'showCertPrint(' + JSON.stringify(c) + ')\'><i class="fas fa-eye"></i></button>' +
                db2 +
                '<button class="btn btn-sm btn-warning" onclick=\'showToeflForm(' + JSON.stringify(c) + ')\'><i class="fas fa-edit"></i></button>' +
                '<button class="btn btn-sm btn-danger" onclick="deleteToefl(\'' + c.id + '\')"><i class="fas fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
    } catch(e) { console.error(e); }
}

async function deleteToefl(id) {
    if (!confirm('Hapus?')) return;
    await db.from('toefl_certificates').delete().eq('id', id);
    showNotification('Dihapus!');
    loadAdminToefl();
    loadDashboardStats();
}