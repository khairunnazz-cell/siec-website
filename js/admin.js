// ============================================
// SIEC - Admin Dashboard
// Versi Bersih - Tanpa Error
// ============================================

// Logo URL
const LOGO_URL = 'assets/logo.png';

// File references
let transFileData = null;
let toeflFileData = null;

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const admin = checkAuth();
    if (!admin) return;
    document.getElementById('adminName').textContent = admin.full_name;

    document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection(link.dataset.section);
        });
    });

    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        document.getElementById('adminSidebar').classList.toggle('active');
    });

    document.getElementById('sidebarClose')?.addEventListener('click', () => {
        document.getElementById('adminSidebar').classList.remove('active');
    });

    loadDashboardStats();
    loadAdminArticles();
    loadAdminPrograms();
    loadAdminClients();
    loadAdminTranslations();
    loadAdminStatus();
    loadAdminToefl();

        // Tunggu QR library siap baru init preview
    waitForQrLibrary(function() {
        console.log('QR Library ready, initializing previews...');
        updateSmallPreview('trans');
        updateSmallPreview('toefl');
    }, 8000);
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

    var sectionEl = document.getElementById('section-' + section);
    if (sectionEl) sectionEl.classList.add('active');

    var linkEl = document.querySelector('[data-section="' + section + '"]');
    if (linkEl) linkEl.classList.add('active');

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
// DASHBOARD STATS
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
    } catch (e) {
        console.error(e);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function insertTag(tag) {
    var t = document.getElementById('articleContent');
    var s = t.selectionStart;
    var e = t.selectionEnd;
    var sel = t.value.substring(s, e);
    t.value = t.value.substring(0, s) + '<' + tag + '>' + sel + '</' + tag + '>' + t.value.substring(e);
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

function filterTable(input, tbodyId) {
    var search = input.value.toLowerCase();
    var rows = document.querySelectorAll('#' + tbodyId + ' tr');
    rows.forEach(function(row) {
        row.style.display = row.textContent.toLowerCase().includes(search) ? '' : 'none';
    });
}

function calculateToeflTotal() {
    var l = parseFloat(document.getElementById('toeflListening').value) || 0;
    var s = parseFloat(document.getElementById('toeflStructure').value) || 0;
    var r = parseFloat(document.getElementById('toeflReading').value) || 0;
    document.getElementById('toeflTotal').value = Math.round((l + s + r) * 10 / 3);
}

// ============================================
// QR CODE GENERATOR - ROBUST VERSION
// ============================================

// Cek apakah QRCode library sudah load
function isQrLibraryReady() {
    return typeof QRCode !== 'undefined';
}

// Tunggu library siap
function waitForQrLibrary(callback, maxWait) {
    var waited = 0;
    var interval = 100;
    var max = maxWait || 5000;

    var timer = setInterval(function() {
        waited += interval;
        if (isQrLibraryReady()) {
            clearInterval(timer);
            callback();
        } else if (waited >= max) {
            clearInterval(timer);
            console.error('QR Library timeout - not loaded after ' + max + 'ms');
            // Coba load manual
            loadQrLibraryManual(callback);
        }
    }, interval);
}

// Load library manual jika semua CDN gagal
function loadQrLibraryManual(callback) {
    var script = document.createElement('script');
    script.src = 'https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js';
    script.onload = function() {
        console.log('QR Library loaded manually');
        if (callback) callback();
    };
    script.onerror = function() {
        console.error('All QR CDN failed - using canvas fallback');
        if (callback) callback();
    };
    document.head.appendChild(script);
}

function generateQrCode(canvasId, text, size) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.warn('Canvas not found:', canvasId);
        return;
    }

    var qrSize = Math.max(parseInt(size) || 80, 40);

    // Set ukuran canvas
    canvas.width = qrSize;
    canvas.height = qrSize;
    canvas.style.width = qrSize + 'px';
    canvas.style.height = qrSize + 'px';
    canvas.style.display = 'block';

    // Jika library belum siap, tunggu
    if (!isQrLibraryReady()) {
        console.log('QR library not ready, waiting...');
        waitForQrLibrary(function() {
            generateQrCode(canvasId, text, size);
        }, 5000);
        return;
    }

    // Pastikan text tidak kosong
    if (!text || text.trim() === '') {
        text = 'https://siec-website.vercel.app';
    }

    try {
        QRCode.toCanvas(canvas, text, {
            width: qrSize,
            height: qrSize,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#ffffff'
            },
            errorCorrectionLevel: 'H'
        }, function(error) {
            if (error) {
                console.error('QR Generate Error:', error);
                drawFallbackQr(canvas, qrSize, text);
                return;
            }
            console.log('QR OK:', canvasId);
            addLogoToQr(canvas, qrSize);
        });
    } catch(e) {
        console.error('QR Exception:', e);
        drawFallbackQr(canvas, qrSize, text);
    }
}

// Fallback jika QR gagal generate
function drawFallbackQr(canvas, size, text) {
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, size - 4, size - 4);
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold ' + Math.max(size * 0.12, 8) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('QR CODE', size / 2, size / 2 - 8);
    ctx.font = Math.max(size * 0.08, 6) + 'px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('SIEC', size / 2, size / 2 + 10);
}

function addLogoToQr(canvas, qrSize) {
    var ctx = canvas.getContext('2d');
    var logo = new Image();
    logo.crossOrigin = 'anonymous';

    logo.onload = function() {
        try {
            var logoSize = qrSize * 0.25;
            var logoX = (canvas.width - logoSize) / 2;
            var logoY = (canvas.height - logoSize) / 2;

            // Background putih
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2 + 4, 0, Math.PI * 2);
            ctx.fill();

            // Logo bulat
            ctx.save();
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
            ctx.restore();

            // Border
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2 + 2, 0, Math.PI * 2);
            ctx.stroke();

            console.log('Logo added to QR:', canvas.id);
        } catch(e) {
            console.error('Logo draw error:', e);
        }
    };

    logo.onerror = function() {
        // Tulis teks SIEC jika logo tidak ada
        try {
            var logoSize = qrSize * 0.22;
            var cx = canvas.width / 2;
            var cy = canvas.height / 2;

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx, cy, logoSize / 2 + 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2563eb';
            ctx.font = 'bold ' + Math.max(logoSize * 0.35, 7) + 'px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('SIEC', cx, cy);

            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(cx, cy, logoSize / 2 + 2, 0, Math.PI * 2);
            ctx.stroke();
        } catch(e) {
            console.error('Fallback logo error:', e);
        }
    };

    // Coba load logo
    logo.src = LOGO_URL + '?t=' + Date.now(); // cache busting
}

// ============================================
// FILE UPLOAD & LIVE PREVIEW
// ============================================
function handleFilePreview(input, type) {
    var file = input.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        showNotification('File terlalu besar! Max 10MB', 'error');
        input.value = '';
        return;
    }

    if (type === 'trans') {
        transFileData = file;
    } else {
        toeflFileData = file;
    }

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
    } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        if (previewFrame) previewFrame.style.display = 'none';
        if (wordFallback) {
            wordFallback.style.display = 'flex';
            var nameEl = document.getElementById(type + 'WordName');
            if (nameEl) nameEl.textContent = file.name;
        }
    }

    var sampleId = type === 'trans' ? 'SIEC-TR-2024-0001' : 'SIEC-TF-2024-0001';
    setTimeout(function() {
        generateQrCode(type + 'QrCanvas', sampleId, 80);
    }, 300);

    if (type === 'toefl') {
        loadSavedToeflPositionToLive();
    }

    initDrag(type);
}

function removeFilePreview(type) {
    if (type === 'trans') {
        transFileData = null;
        document.getElementById('transFile').value = '';
    } else {
        toeflFileData = null;
        document.getElementById('toeflFile').value = '';
    }

    document.getElementById(type + 'FileInfo').style.display = 'none';

    var livePreview = document.getElementById(type + 'LivePreview');
    var smallPreview = document.getElementById(type + 'SmallPreview');

    if (livePreview) livePreview.style.display = 'none';
    if (smallPreview) smallPreview.style.display = 'block';

    var frame = document.getElementById(type + 'PreviewFrame');
    if (frame) frame.src = '';
}

async function uploadFileToSupabase(file, folder) {
    var ext = file.name.split('.').pop();
    var fileName = folder + '/' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.' + ext;

    var result = await db.storage.from('uploads').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
    });

    if (result.error) throw result.error;

    var urlData = db.storage.from('uploads').getPublicUrl(fileName);
    return {
        url: urlData.data.publicUrl,
        name: file.name
    };
}

// ============================================
// DRAGGABLE QR CODE
// ============================================
function initDrag(type) {
    var dragEl = document.getElementById(type + 'QrDrag');
    var container = document.getElementById(type + 'PreviewPage');
    if (!dragEl || !container) return;

    var isDragging = false;
    var startX = 0;
    var startY = 0;
    var origLeft = 0;
    var origTop = 0;

    dragEl.addEventListener('mousedown', function(e) {
        isDragging = true;
        dragEl.classList.add('dragging');
        startX = e.clientX;
        startY = e.clientY;
        origLeft = dragEl.offsetLeft;
        origTop = dragEl.offsetTop;
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        moveQrDrag(type, dragEl, container, origLeft + dx, origTop + dy);
    });

    document.addEventListener('mouseup', function() {
        if (!isDragging) return;
        isDragging = false;
        dragEl.classList.remove('dragging');
        saveQrPositionIfNeeded(type, dragEl, container);
    });

    dragEl.addEventListener('touchstart', function(e) {
        isDragging = true;
        dragEl.classList.add('dragging');
        var touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        origLeft = dragEl.offsetLeft;
        origTop = dragEl.offsetTop;
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        var touch = e.touches[0];
        var dx = touch.clientX - startX;
        var dy = touch.clientY - startY;
        moveQrDrag(type, dragEl, container, origLeft + dx, origTop + dy);
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchend', function() {
        if (!isDragging) return;
        isDragging = false;
        dragEl.classList.remove('dragging');
        saveQrPositionIfNeeded(type, dragEl, container);
    });
}

function moveQrDrag(type, dragEl, container, newLeft, newTop) {
    var maxLeft = container.offsetWidth - dragEl.offsetWidth;
    var maxTop = container.offsetHeight - dragEl.offsetHeight;

    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));

    dragEl.style.left = newLeft + 'px';
    dragEl.style.top = newTop + 'px';

    var percX = Math.round((newLeft / container.offsetWidth) * 100);
    var percY = Math.round((newTop / container.offsetHeight) * 100);

    var posXEl = document.getElementById(type + 'PosX');
    var posYEl = document.getElementById(type + 'PosY');
    if (posXEl) posXEl.textContent = percX + '%';
    if (posYEl) posYEl.textContent = percY + '%';

    var sliderX = document.getElementById(type + 'QrX');
    var sliderY = document.getElementById(type + 'QrY');
    if (sliderX) sliderX.value = percX;
    if (sliderY) sliderY.value = percY;
}

function saveQrPositionIfNeeded(type, dragEl, container) {
    if (type !== 'toefl') return;
    var rememberEl = document.getElementById('toeflRememberPos');
    if (!rememberEl || !rememberEl.checked) return;

    var pos = {
        x: Math.round((dragEl.offsetLeft / container.offsetWidth) * 100),
        y: Math.round((dragEl.offsetTop / container.offsetHeight) * 100),
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
                var newLeft = (pos.x / 100) * container.offsetWidth;
                var newTop = (pos.y / 100) * container.offsetHeight;
                dragEl.style.left = newLeft + 'px';
                dragEl.style.top = newTop + 'px';

                var posXEl = document.getElementById('toeflPosX');
                var posYEl = document.getElementById('toeflPosY');
                if (posXEl) posXEl.textContent = pos.x + '%';
                if (posYEl) posYEl.textContent = pos.y + '%';
            }, 500);
        }

        var sizeEl = document.getElementById('toeflQrSize');
        if (sizeEl && pos.size) sizeEl.value = pos.size;
    } catch (e) {
        console.error(e);
    }
}

function loadSavedToeflPosition() {
    var saved = localStorage.getItem('siec_toefl_qr_pos');
    if (!saved) return;
    try {
        var pos = JSON.parse(saved);
        var xEl = document.getElementById('toeflQrX');
        var yEl = document.getElementById('toeflQrY');
        var sizeEl = document.getElementById('toeflQrSize');
        if (xEl) xEl.value = pos.x;
        if (yEl) yEl.value = pos.y;
        if (sizeEl) sizeEl.value = pos.size || 80;
        updateSmallPreview('toefl');
    } catch (e) {
        console.error(e);
    }
}

function resizeQr(type) {
    var size = parseInt(document.getElementById(type + 'QrSize').value);
    var sizeValEl = document.getElementById(type + 'QrSizeVal');
    if (sizeValEl) sizeValEl.textContent = size + 'px';

    var canvas = document.getElementById(type + 'QrCanvas');
    if (canvas) {
        canvas.width = size;
        canvas.height = size;
        var sampleId = type === 'trans' ? 'SIEC-TR-2024-0001' : 'SIEC-TF-2024-0001';
        generateQrCode(type + 'QrCanvas', sampleId, size);
    }
}

function toggleQrId(type) {
    var showEl = document.getElementById(type + 'ShowId');
    var idText = document.getElementById(type + 'QrIdText');
    if (showEl && idText) {
        idText.style.display = showEl.checked ? 'block' : 'none';
    }
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

    // Generate QR - tunggu library siap
    var canvasId = type + 'SmallQrCanvas';
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    var sampleText = window.location.origin + '/verify.html?id=SIEC-SAMPLE-001';

    if (isQrLibraryReady()) {
        generateQrCode(canvasId, sampleText, 50);
    } else {
        // Tunggu library load
        waitForQrLibrary(function() {
            generateQrCode(canvasId, sampleText, 50);
        }, 8000);
    }
}

function getQrPosition(type) {
    var livePreview = document.getElementById(type + 'LivePreview');
    var isLive = livePreview && livePreview.style.display !== 'none';

    if (isLive) {
        var dragEl = document.getElementById(type + 'QrDrag');
        var container = document.getElementById(type + 'PreviewPage');
        if (dragEl && container && container.offsetWidth > 0) {
            return {
                x: Math.round((dragEl.offsetLeft / container.offsetWidth) * 100),
                y: Math.round((dragEl.offsetTop / container.offsetHeight) * 100),
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

function resetToeflPosition() {
    var xEl = document.getElementById('toeflQrX');
    var yEl = document.getElementById('toeflQrY');
    var sizeEl = document.getElementById('toeflQrSize');
    var showIdEl = document.getElementById('toeflShowId');

    if (xEl) xEl.value = 80;
    if (yEl) yEl.value = 85;
    if (sizeEl) sizeEl.value = 80;
    if (showIdEl) showIdEl.checked = true;

    localStorage.removeItem('siec_toefl_qr_pos');
    updateSmallPreview('toefl');

    var dragEl = document.getElementById('toeflQrDrag');
    if (dragEl) {
        dragEl.style.left = '80%';
        dragEl.style.top = '85%';
    }

    showNotification('Posisi di-reset!');
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

function hideArticleForm() {
    document.getElementById('articleForm').style.display = 'none';
}

async function saveArticle() {
    var title = document.getElementById('articleTitle').value.trim();
    if (!title) { showNotification('Judul harus diisi!', 'error'); return; }

    var layoutEl = document.querySelector('input[name="articleLayout"]:checked');
    var layout = layoutEl ? layoutEl.value : 'standard';
    var id = document.getElementById('articleId').value;
    var pub = document.getElementById('articlePublished').checked;

    var data = {
        title: title,
        slug: generateSlug(title) + '-' + Date.now(),
        content: document.getElementById('articleContent').value,
        excerpt: document.getElementById('articleExcerpt').value,
        cover_image: document.getElementById('articleCover').value,
        layout_type: layout,
        category: document.getElementById('articleCategory').value,
        is_published: pub,
        published_at: pub ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
    };

    try {
        var result;
        if (id) {
            result = await db.from('articles').update(data).eq('id', id);
            if (result.error) throw result.error;
            showNotification('Artikel diperbarui!');
        } else {
            result = await db.from('articles').insert(data);
            if (result.error) throw result.error;
            showNotification('Artikel ditambahkan!');
        }
        hideArticleForm();
        loadAdminArticles();
        loadDashboardStats();
    } catch (e) {
        showNotification('Gagal: ' + e.message, 'error');
    }
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
            return '<tr>' +
                '<td><strong>' + a.title + '</strong></td>' +
                '<td>' + a.category + '</td>' +
                '<td>' + a.layout_type + '</td>' +
                '<td><span class="status-badge ' + (a.is_published ? 'status-published' : 'status-draft') + '">' + (a.is_published ? 'Published' : 'Draft') + '</span></td>' +
                '<td>' + formatDate(a.created_at) + '</td>' +
                '<td><div class="action-buttons">' +
                '<button class="btn btn-sm btn-primary" onclick=\'showArticleForm(' + JSON.stringify(a) + ')\'><i class="fas fa-edit"></i></button>' +
                '<button class="btn btn-sm btn-danger" onclick="deleteArticle(\'' + a.id + '\')"><i class="fas fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
    } catch (e) { console.error(e); }
}

async function deleteArticle(id) {
    if (!confirm('Hapus artikel ini?')) return;
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
        document.getElementById('programId').value = '';
        document.getElementById('programTitle').value = '';
        document.getElementById('programDuration').value = '';
        document.getElementById('programSchedule').value = '';
        document.getElementById('programPrice').value = '';
        document.getElementById('programCover').value = '';
        document.getElementById('programDesc').value = '';
        document.getElementById('programContent').value = '';
        document.getElementById('programFeatures').value = '';
        document.getElementById('programActive').checked = true;
        var def = document.querySelector('input[name="programLayout"][value="card"]');
        if (def) def.checked = true;
    }
}

function hideProgramForm() {
    document.getElementById('programForm').style.display = 'none';
}

async function saveProgram() {
    var title = document.getElementById('programTitle').value.trim();
    if (!title) { showNotification('Nama harus diisi!', 'error'); return; }

    var id = document.getElementById('programId').value;
    var layoutEl = document.querySelector('input[name="programLayout"]:checked');
    var layout = layoutEl ? layoutEl.value : 'card';
    var featuresStr = document.getElementById('programFeatures').value;
    var features = featuresStr.split(',').map(function(f) { return f.trim(); }).filter(function(f) { return f; });

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
        layout_type: layout,
        features: features,
        is_active: document.getElementById('programActive').checked,
        updated_at: new Date().toISOString()
    };

    try {
        var result;
        if (id) {
            result = await db.from('learning_programs').update(data).eq('id', id);
            if (result.error) throw result.error;
            showNotification('Program diperbarui!');
        } else {
            result = await db.from('learning_programs').insert(data);
            if (result.error) throw result.error;
            showNotification('Program ditambahkan!');
        }
        hideProgramForm();
        loadAdminPrograms();
        loadDashboardStats();
    } catch (e) {
        showNotification('Gagal: ' + e.message, 'error');
    }
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
            return '<tr>' +
                '<td><strong>' + p.title + '</strong></td>' +
                '<td>' + p.program_type + '</td>' +
                '<td>' + p.layout_type + '</td>' +
                '<td>' + (p.price || '-') + '</td>' +
                '<td><span class="status-badge ' + (p.is_active ? 'status-published' : 'status-draft') + '">' + (p.is_active ? 'Aktif' : 'Nonaktif') + '</span></td>' +
                '<td><div class="action-buttons">' +
                '<button class="btn btn-sm btn-primary" onclick=\'showProgramForm(' + JSON.stringify(p) + ')\'><i class="fas fa-edit"></i></button>' +
                '<button class="btn btn-sm btn-danger" onclick="deleteProgram(\'' + p.id + '\')"><i class="fas fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
    } catch (e) { console.error(e); }
}

async function deleteProgram(id) {
    if (!confirm('Hapus program?')) return;
    await db.from('learning_programs').delete().eq('id', id);
    showNotification('Dihapus!');
    loadAdminPrograms();
    loadDashboardStats();
}

// ============================================
// TRANSLATION CLIENTS
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
        document.getElementById('clientId').value = '';
        document.getElementById('clientName').value = '';
        document.getElementById('clientPhone').value = '';
        document.getElementById('clientEmail').value = '';
        document.getElementById('clientNotes').value = '';
    }
}

function hideClientForm() {
    document.getElementById('clientForm').style.display = 'none';
}

async function saveClient() {
    var name = document.getElementById('clientName').value.trim();
    var phone = document.getElementById('clientPhone').value.trim();
    if (!name || !phone) { showNotification('Nama dan HP harus diisi!', 'error'); return; }

    var id = document.getElementById('clientId').value;
    var data = {
        client_name: name,
        client_phone: phone,
        client_email: document.getElementById('clientEmail').value,
        document_type: document.getElementById('clientDocType').value,
        source_language: document.getElementById('clientSourceLang').value,
        target_language: document.getElementById('clientTargetLang').value,
        status: document.getElementById('clientStatus').value,
        notes: document.getElementById('clientNotes').value,
        updated_at: new Date().toISOString()
    };

    try {
        var result;
        if (id) {
            result = await db.from('translation_clients').update(data).eq('id', id);
            if (result.error) throw result.error;
            showNotification('Diperbarui!');
        } else {
            result = await db.from('translation_clients').insert(data);
            if (result.error) throw result.error;
            showNotification('Ditambahkan!');
        }
        hideClientForm();
        loadAdminClients();
        loadDashboardStats();
    } catch (e) {
        showNotification('Gagal: ' + e.message, 'error');
    }
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
            return '<tr>' +
                '<td><strong>' + c.client_name + '</strong></td>' +
                '<td>' + c.client_phone + '</td>' +
                '<td>' + c.document_type + '</td>' +
                '<td>' + c.source_language + ' → ' + c.target_language + '</td>' +
                '<td><span class="status-badge status-' + c.status + '">' + c.status + '</span></td>' +
                '<td>' + formatDate(c.created_at) + '</td>' +
                '<td><div class="action-buttons">' +
                '<button class="btn btn-sm btn-primary" onclick=\'showClientForm(' + JSON.stringify(c) + ')\'><i class="fas fa-edit"></i></button>' +
                '<button class="btn btn-sm btn-danger" onclick="deleteClient(\'' + c.id + '\')"><i class="fas fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
    } catch (e) { console.error(e); }
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

    var headers = ['Nama', 'HP', 'Email', 'Dokumen', 'Bahasa Sumber', 'Bahasa Target', 'Status', 'Catatan', 'Tanggal'];
    var rows = result.data.map(function(c) {
        return [c.client_name, c.client_phone, c.client_email || '', c.document_type,
                c.source_language, c.target_language, c.status, c.notes || '', formatDate(c.created_at)];
    });

    var csv = [headers].concat(rows).map(function(r) { return r.join(','); }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'klien-siec-' + Date.now() + '.csv';
    a.click();
    showNotification('CSV downloaded!');
}

// ============================================
// TRANSLATION DOCUMENTS
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
}

function hideTranslationForm() {
    document.getElementById('translationForm').style.display = 'none';
}

async function saveTranslation() {
    var clientName = document.getElementById('transClientName').value.trim();
    var docTitle = document.getElementById('transDocTitle').value.trim();
    if (!clientName || !docTitle) { showNotification('Nama dan judul harus diisi!', 'error'); return; }

    var documentId = generateDocumentId('TR');
    var verifyUrl = window.location.origin + '/verify.html?id=' + documentId + '&type=translation';
    var qrPos = getQrPosition('trans');

    var fileUrl = '';
    var fileName = '';

    if (transFileData) {
        try {
            showNotification('Mengupload file...', 'info');
            var uploaded = await uploadFileToSupabase(transFileData, 'translations');
            fileUrl = uploaded.url;
            fileName = uploaded.name;
        } catch (err) {
            showNotification('Gagal upload: ' + err.message, 'error');
            return;
        }
    }

    var data = {
        document_id: documentId,
        client_name: clientName,
        document_title: docTitle,
        source_language: document.getElementById('transSourceLang').value,
        target_language: document.getElementById('transTargetLang').value,
        document_type: document.getElementById('transDocType').value,
        barcode_data: verifyUrl,
        qr_position: JSON.stringify(qrPos),
        file_url: fileUrl,
        file_name: fileName,
        issued_date: document.getElementById('transIssuedDate').value,
        notes: document.getElementById('transNotes').value,
        verified: true,
        status: 'valid'
    };

    try {
        var result = await db.from('translation_documents').insert(data);
        if (result.error) throw result.error;
        showNotification('Dokumen disimpan! ID: ' + documentId);
        hideTranslationForm();
        loadAdminTranslations();
        loadDashboardStats();
        showTranslationPrint(data);
    } catch (err) {
        showNotification('Gagal: ' + err.message, 'error');
    }
}

function showTranslationPrint(doc) {
    var pos = doc.qr_position ? JSON.parse(doc.qr_position) : { x: 80, y: 85, size: 80, showId: true };
    var modal = document.getElementById('printPreview');
    var content = document.getElementById('printPreviewContent');
    var verifyUrl = window.location.origin + '/verify.html?id=' + doc.document_id + '&type=translation';

    content.innerHTML =
        '<div class="print-doc" id="printableDoc">' +
        '<div class="print-doc-header">' +
        '<img src="' + LOGO_URL + '" style="width:50px;height:50px;object-fit:contain;margin:0 auto 8px;display:block;">' +
        '<div class="print-doc-logo">SIEC</div>' +
        '<div style="font-size:1rem;font-weight:700;">Syaf Intensive English Course</div>' +
        '<div class="print-doc-subtitle">Dokumen Terjemahan Resmi</div>' +
        '</div>' +
        '<div class="print-doc-body">' +
        '<div class="print-doc-row"><span class="print-doc-label">ID Dokumen</span><span>: <strong>' + doc.document_id + '</strong></span></div>' +
        '<div class="print-doc-row"><span class="print-doc-label">Nama Klien</span><span>: ' + doc.client_name + '</span></div>' +
        '<div class="print-doc-row"><span class="print-doc-label">Judul</span><span>: ' + doc.document_title + '</span></div>' +
        '<div class="print-doc-row"><span class="print-doc-label">Jenis</span><span>: ' + doc.document_type + '</span></div>' +
        '<div class="print-doc-row"><span class="print-doc-label">Bahasa</span><span>: ' + doc.source_language + ' → ' + doc.target_language + '</span></div>' +
        '<div class="print-doc-row"><span class="print-doc-label">Tanggal</span><span>: ' + formatDate(doc.issued_date) + '</span></div>' +
        '</div>' +
        '<div style="text-align:center;margin-top:24px;">' +
        '<canvas id="printQrTrans"></canvas>' +
        (pos.showId ? '<div style="font-size:10px;font-weight:700;font-family:monospace;margin-top:4px;">' + doc.document_id + '</div>' : '') +
        '<div style="font-size:7px;color:#999;margin-top:2px;">Scan QR Code untuk verifikasi</div>' +
        '</div>' +
        '<div style="margin-top:40px;display:flex;justify-content:space-between;border-top:1px solid #ccc;padding-top:16px;">' +
        '<div><div style="height:40px;"></div><div style="font-size:0.85rem;">Penerjemah</div></div>' +
        '<div style="text-align:right;"><div style="height:40px;"></div><div style="font-size:0.85rem;">Administrator</div></div>' +
        '</div>' +
        '</div>';

    modal.style.display = 'flex';

    setTimeout(function() {
        generateQrCode('printQrTrans', verifyUrl, parseInt(pos.size) || 100);
    }, 200);
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
            var fileBadge = d.file_url
                ? '<a href="' + d.file_url + '" target="_blank" class="file-badge"><i class="fas fa-file-pdf"></i> ' + (d.file_name || 'PDF') + '</a>'
                : '<span class="no-file">-</span>';
            var downloadBtn = d.file_url
                ? '<a href="' + d.file_url + '" target="_blank" class="btn btn-sm btn-primary" title="Download"><i class="fas fa-download"></i></a>'
                : '';
            return '<tr>' +
                '<td><strong style="color:var(--primary)">' + d.document_id + '</strong></td>' +
                '<td>' + d.client_name + '</td>' +
                '<td>' + d.document_title + '</td>' +
                '<td>' + d.source_language + '→' + d.target_language + '</td>' +
                '<td>' + fileBadge + '</td>' +
                '<td>' + formatDate(d.issued_date) + '</td>' +
                '<td><div class="action-buttons">' +
                '<button class="btn btn-sm btn-success" onclick=\'showTranslationPrint(' + JSON.stringify(d) + ')\' title="Cetak"><i class="fas fa-print"></i></button>' +
                downloadBtn +
                '<button class="btn btn-sm btn-danger" onclick="deleteTranslation(\'' + d.id + '\')" title="Hapus"><i class="fas fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
    } catch (e) { console.error(e); }
}

async function deleteTranslation(id) {
    if (!confirm('Hapus dokumen?')) return;
    await db.from('translation_documents').delete().eq('id', id);
    showNotification('Dihapus!');
    loadAdminTranslations();
    loadDashboardStats();
}

// ============================================
// TRANSLATION STATUS
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
        document.getElementById('statusId').value = '';
        document.getElementById('statusClientName').value = '';
        document.getElementById('statusClientPhone').value = '';
        document.getElementById('statusDocType').value = '';
        document.getElementById('statusValue').value = 'received';
        document.getElementById('statusDesc').value = '';
        document.getElementById('statusEstimate').value = '';
    }
}

function hideStatusForm() {
    document.getElementById('statusForm').style.display = 'none';
}

async function saveStatus() {
    var name = document.getElementById('statusClientName').value.trim();
    var phone = document.getElementById('statusClientPhone').value.trim();
    if (!name || !phone) { showNotification('Nama dan HP harus diisi!', 'error'); return; }

    var id = document.getElementById('statusId').value;
    var data = {
        client_name: name,
        client_phone: phone,
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
            if (result.error) throw result.error;
            showNotification('Diperbarui!');
        } else {
            data.tracking_code = generateTrackingCode();
            result = await db.from('translation_status').insert(data);
            if (result.error) throw result.error;
            showNotification('Kode: ' + data.tracking_code);
        }
        hideStatusForm();
        loadAdminStatus();
    } catch (e) {
        showNotification('Gagal: ' + e.message, 'error');
    }
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
            return '<tr>' +
                '<td><strong style="color:var(--primary)">' + s.tracking_code + '</strong></td>' +
                '<td>' + s.client_name + '</td>' +
                '<td>' + s.document_type + '</td>' +
                '<td><span class="status-badge status-' + s.status + '">' + s.status + '</span></td>' +
                '<td>' + (s.estimated_completion ? formatDate(s.estimated_completion) : '-') + '</td>' +
                '<td><div class="action-buttons">' +
                '<button class="btn btn-sm btn-primary" onclick=\'showStatusForm(' + JSON.stringify(s) + ')\'><i class="fas fa-edit"></i></button>' +
                '<button class="btn btn-sm btn-danger" onclick="deleteStatus(\'' + s.id + '\')"><i class="fas fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
    } catch (e) { console.error(e); }
}

async function deleteStatus(id) {
    if (!confirm('Hapus?')) return;
    await db.from('translation_status').delete().eq('id', id);
    showNotification('Dihapus!');
    loadAdminStatus();
}

// ============================================
// TOEFL CERTIFICATES
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
            var p = JSON.parse(c.qr_position);
            var xEl = document.getElementById('toeflQrX');
            var yEl = document.getElementById('toeflQrY');
            var sizeEl = document.getElementById('toeflQrSize');
            if (xEl) xEl.value = p.x;
            if (yEl) yEl.value = p.y;
            if (sizeEl) sizeEl.value = p.size || 80;
        }
    } else {
        document.getElementById('toeflId').value = '';
        document.getElementById('toeflName').value = '';
        document.getElementById('toeflTestDate').value = '';
        document.getElementById('toeflEmail').value = '';
        document.getElementById('toeflPhone').value = '';
        document.getElementById('toeflListening').value = '';
        document.getElementById('toeflStructure').value = '';
        document.getElementById('toeflReading').value = '';
        document.getElementById('toeflTotal').value = '';
        document.getElementById('toeflNotes').value = '';
        loadSavedToeflPosition();
    }

    updateSmallPreview('toefl');
}

function hideToeflForm() {
    document.getElementById('toeflForm').style.display = 'none';
}

async function saveToefl() {
    var name = document.getElementById('toeflName').value.trim();
    var testDate = document.getElementById('toeflTestDate').value;
    if (!name || !testDate) { showNotification('Nama dan tanggal harus diisi!', 'error'); return; }

    var id = document.getElementById('toeflId').value;
    var l = parseInt(document.getElementById('toeflListening').value) || 0;
    var s = parseInt(document.getElementById('toeflStructure').value) || 0;
    var r = parseInt(document.getElementById('toeflReading').value) || 0;
    var total = Math.round((l + s + r) * 10 / 3);

    var qrPos = getQrPosition('toefl');

    var rememberEl = document.getElementById('toeflRememberPos');
    if (rememberEl && rememberEl.checked) {
        localStorage.setItem('siec_toefl_qr_pos', JSON.stringify(qrPos));
    }

    var fileUrl = '';
    var fileName = '';

    if (toeflFileData) {
        try {
            showNotification('Mengupload file...', 'info');
            var uploaded = await uploadFileToSupabase(toeflFileData, 'certificates');
            fileUrl = uploaded.url;
            fileName = uploaded.name;
        } catch (err) {
            showNotification('Gagal upload: ' + err.message, 'error');
            return;
        }
    }

    var certId = id ? null : generateDocumentId('TF');
    var verifyUrl = window.location.origin + '/verify.html?id=' + (certId || '') + '&type=toefl';

    var data = {
        participant_name: name,
        test_date: testDate,
        participant_email: document.getElementById('toeflEmail').value,
        participant_phone: document.getElementById('toeflPhone').value,
        listening_score: l,
        structure_score: s,
        reading_score: r,
        total_score: total,
        qr_position: JSON.stringify(qrPos),
        file_url: fileUrl,
        file_name: fileName,
        notes: document.getElementById('toeflNotes').value,
        verified: true,
        status: 'valid'
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
    } catch (err) {
        showNotification('Gagal: ' + err.message, 'error');
    }
}

function showCertPrint(cert) {
    var pos = cert.qr_position ? JSON.parse(cert.qr_position) : { x: 80, y: 85, size: 80, showId: true };
    var modal = document.getElementById('certPrintModal');
    var content = document.getElementById('certPrintContent');
    var verifyUrl = window.location.origin + '/verify.html?id=' + cert.certificate_id + '&type=toefl';

    var downloadLink = document.getElementById('certDownloadLink');
    if (cert.file_url && downloadLink) {
        downloadLink.href = cert.file_url;
        downloadLink.target = '_blank';
        downloadLink.style.display = 'inline-flex';
    }

    var iframeHtml = cert.file_url
        ? '<div style="margin:20px 0;"><iframe src="' + cert.file_url + '" style="width:100%;height:500px;border:2px solid var(--gray-300);border-radius:8px;"></iframe></div>'
        : '';

    content.innerHTML =
        '<div style="text-align:center;padding:20px;">' +
        '<p style="color:var(--gray-600);margin-bottom:16px;">Sertifikat <strong>' + cert.certificate_id + '</strong> untuk <strong>' + cert.participant_name + '</strong></p>' +
        '<p><strong>Score:</strong> L:' + cert.listening_score + ' / S:' + cert.structure_score + ' / R:' + cert.reading_score + ' = <strong style="font-size:1.3rem;color:var(--primary)">' + cert.total_score + '</strong></p>' +
        iframeHtml +
        '<div style="margin:20px 0;">' +
        '<p style="font-size:0.85rem;color:var(--gray-600);margin-bottom:8px;">QR Code Verifikasi:</p>' +
        '<canvas id="printQrToefl"></canvas>' +
        (pos.showId ? '<div style="font-size:10px;font-weight:700;font-family:monospace;margin-top:4px;">' + cert.certificate_id + '</div>' : '') +
        '<div style="font-size:8px;color:#999;margin-top:2px;">Scan untuk verifikasi keaslian</div>' +
        '</div>' +
        '</div>';

    modal.style.display = 'flex';

    setTimeout(function() {
        generateQrCode('printQrToefl', verifyUrl, parseInt(pos.size) || 120);
    }, 200);
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
            var fileBadge = c.file_url
                ? '<a href="' + c.file_url + '" target="_blank" class="file-badge"><i class="fas fa-file-pdf"></i> PDF</a>'
                : '<span class="no-file">-</span>';
            var downloadBtn = c.file_url
                ? '<a href="' + c.file_url + '" target="_blank" class="btn btn-sm btn-primary" title="Download"><i class="fas fa-download"></i></a>'
                : '';
            return '<tr>' +
                '<td><strong style="color:var(--primary)">' + c.certificate_id + '</strong></td>' +
                '<td>' + c.participant_name + '</td>' +
                '<td>' + formatDate(c.test_date) + '</td>' +
                '<td>' + c.listening_score + '/' + c.structure_score + '/' + c.reading_score + '</td>' +
                '<td><strong style="font-size:1.1rem;color:var(--primary)">' + c.total_score + '</strong></td>' +
                '<td>' + fileBadge + '</td>' +
                '<td><div class="action-buttons">' +
                '<button class="btn btn-sm btn-success" onclick=\'showCertPrint(' + JSON.stringify(c) + ')\' title="Preview"><i class="fas fa-eye"></i></button>' +
                downloadBtn +
                '<button class="btn btn-sm btn-warning" onclick=\'showToeflForm(' + JSON.stringify(c) + ')\' title="Edit"><i class="fas fa-edit"></i></button>' +
                '<button class="btn btn-sm btn-danger" onclick="deleteToefl(\'' + c.id + '\')" title="Hapus"><i class="fas fa-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
    } catch (e) { console.error(e); }
}

async function deleteToefl(id) {
    if (!confirm('Hapus sertifikat?')) return;
    await db.from('toefl_certificates').delete().eq('id', id);
    showNotification('Dihapus!');
    loadAdminToefl();
    loadDashboardStats();
}