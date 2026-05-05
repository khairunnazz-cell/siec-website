var LOGO_URL='assets/logo.png',transFileData=null,toeflFileData=null;

function getQrUrl(t,s){return'https://api.qrserver.com/v1/create-qr-code/?size='+(s||150)+'x'+(s||150)+'&data='+encodeURIComponent(t||location.origin)+'&ecc=H&margin=4&format=png'}

function generateQr(id,t,s){var e=document.getElementById(id);if(!e)return;var z=parseInt(s)||100,l=Math.round(z*.22);e.innerHTML='<div style="position:relative;display:inline-block;width:'+z+'px;height:'+z+'px"><img src="'+getQrUrl(t,z)+'" width="'+z+'" height="'+z+'" style="display:block;border-radius:4px"><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:'+l+'px;height:'+l+'px;border-radius:50%;overflow:hidden;background:#fff;border:2px solid #fff;box-shadow:0 0 0 1px #2563eb"><img src="'+LOGO_URL+'" style="width:100%;height:100%;object-fit:contain" onerror="this.parentElement.innerHTML=\'<div style=width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#fff><span style=font-weight:800;color:#2563eb;font-size:'+Math.round(l*.35)+'px>SIEC</span></div>\'"></div></div>'}

async function embedQrInPdf(file, qrText, idText, posXPct, posYPct, qrSizePx) {
    var ab = await file.arrayBuffer();
    var doc = await PDFLib.PDFDocument.load(ab);
    var pg = doc.getPages()[0];
    var pw = pg.getWidth();
    var ph = pg.getHeight();

    var resp = await fetch(getQrUrl(qrText, 300));
    if (!resp.ok) throw new Error('QR fetch fail');
    var qrBuf = await resp.arrayBuffer();
    var qrImg = await doc.embedPng(qrBuf);

    var sz = parseInt(qrSizePx) || 80;

    var pdfX = (posXPct / 100) * pw - (sz / 2);
    var pdfY = ph - ((posYPct / 100) * ph) - (sz / 2);

    if (pdfX < 5) pdfX = 5;
    if (pdfX > pw - sz - 5) pdfX = pw - sz - 5;
    if (pdfY < 25) pdfY = 25;
    if (pdfY > ph - sz - 5) pdfY = ph - sz - 5;

    pg.drawRectangle({
        x: pdfX - 4,
        y: pdfY - 22,
        width: sz + 8,
        height: sz + 26,
        color: PDFLib.rgb(1, 1, 1)
    });

    pg.drawImage(qrImg, {
        x: pdfX,
        y: pdfY,
        width: sz,
        height: sz
    });

    if (idText) {
        var font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
        var textW = font.widthOfTextAtSize(idText, 7);
        pg.drawText(idText, {
            x: pdfX + (sz - textW) / 2,
            y: pdfY - 10,
            size: 7,
            font: font,
            color: PDFLib.rgb(0, 0, 0)
        });
        var verifyText = 'Scan QR untuk verifikasi';
        var verifyW = font.widthOfTextAtSize(verifyText, 5);
        pg.drawText(verifyText, {
            x: pdfX + (sz - verifyW) / 2,
            y: pdfY - 18,
            size: 5,
            font: font,
            color: PDFLib.rgb(0.5, 0.5, 0.5)
        });
    }

    try {
        var logoResp = await fetch(LOGO_URL);
        if (logoResp.ok) {
            var logoBuf = await logoResp.arrayBuffer();
            var logoImg = await doc.embedPng(logoBuf);
            var logoSz = sz * 0.22;
            pg.drawCircle({
                x: pdfX + sz / 2,
                y: pdfY + sz / 2,
                size: logoSz / 2 + 2,
                color: PDFLib.rgb(1, 1, 1)
            });
            pg.drawImage(logoImg, {
                x: pdfX + (sz - logoSz) / 2,
                y: pdfY + (sz - logoSz) / 2,
                width: logoSz,
                height: logoSz
            });
        }
    } catch (e) {}

    return new Blob([await doc.save()], { type: 'application/pdf' });
}

document.addEventListener('DOMContentLoaded', function() {
    var a = checkAuth();
    if (!a) return;
    var n = document.getElementById('adminName');
    if (n) n.textContent = a.full_name;
    document.querySelectorAll('.sidebar-link[data-section]').forEach(function(l) {
        l.addEventListener('click', function(e) {
            e.preventDefault();
            switchSection(l.dataset.section);
        });
    });
    var t = document.getElementById('sidebarToggle'),
        c = document.getElementById('sidebarClose'),
        s = document.getElementById('adminSidebar');
    if (t) t.addEventListener('click', function() { s.classList.toggle('active'); });
    if (c) c.addEventListener('click', function() { s.classList.remove('active'); });
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
    }, 800);
});

function switchSection(s) {
    document.querySelectorAll('.admin-section').forEach(function(x) { x.classList.remove('active'); });
    document.querySelectorAll('.sidebar-link').forEach(function(x) { x.classList.remove('active'); });
    var e = document.getElementById('section-' + s);
    if (e) e.classList.add('active');
    var l = document.querySelector('[data-section="' + s + '"]');
    if (l) l.classList.add('active');
    var m = { 'dashboard': 'Dashboard', 'articles': 'Artikel', 'programs': 'Program', 'translation-clients': 'Klien', 'translations': 'Terjemahan', 'translation-status': 'Status', 'toefl': 'TOEFL' };
    var t = document.getElementById('pageTitle');
    if (t) t.textContent = m[s] || 'Dashboard';
    document.getElementById('adminSidebar').classList.remove('active');
}

async function loadDashboardStats() {
    try {
        var a = await db.from('articles').select('*', { count: 'exact', head: true }),
            c = await db.from('translation_clients').select('*', { count: 'exact', head: true }),
            t = await db.from('translation_documents').select('*', { count: 'exact', head: true }),
            ce = await db.from('toefl_certificates').select('*', { count: 'exact', head: true }),
            p = await db.from('learning_programs').select('*', { count: 'exact', head: true }).eq('is_active', true);
        document.getElementById('totalArticles').textContent = a.count || 0;
        document.getElementById('totalClients').textContent = c.count || 0;
        document.getElementById('totalTranslations').textContent = t.count || 0;
        document.getElementById('totalCertificates').textContent = ce.count || 0;
        document.getElementById('totalPrograms').textContent = p.count || 0;
    } catch (e) { console.error(e); }
}

function insertTag(t) { var e = document.getElementById('articleContent'), s = e.selectionStart, n = e.selectionEnd, x = e.value.substring(s, n); e.value = e.value.substring(0, s) + '<' + t + '>' + x + '</' + t + '>' + e.value.substring(n); e.focus(); }
function togglePreview() { var p = document.getElementById('articlePreview'); if (p.style.display === 'none') { p.innerHTML = document.getElementById('articleContent').value; p.style.display = 'block'; } else p.style.display = 'none'; }
function closePrintPreview(id) { document.getElementById(id).style.display = 'none'; }
function printDocument() { window.print(); }
function calculateToeflTotal() { var l = parseFloat(document.getElementById('toeflListening').value) || 0, s = parseFloat(document.getElementById('toeflStructure').value) || 0, r = parseFloat(document.getElementById('toeflReading').value) || 0; document.getElementById('toeflTotal').value = Math.round((l + s + r) * 10 / 3); }

function handleFilePreview(i, type) {
    var f = i.files[0];
    if (!f) return;
    if (f.size > 10485760) { showNotification('Max 10MB!', 'error'); i.value = ''; return; }
    if (type === 'trans') transFileData = f;
    else toeflFileData = f;
    document.getElementById(type + 'FileInfo').style.display = 'flex';
    document.getElementById(type + 'FileName').textContent = f.name;
    var lv = document.getElementById(type + 'LivePreview'),
        sm = document.getElementById(type + 'SmallPreview');
    if (lv) lv.style.display = 'block';
    if (sm) sm.style.display = 'none';
    var fr = document.getElementById(type + 'PreviewFrame'),
        wd = document.getElementById(type + 'WordFallback');
    if (f.type === 'application/pdf') {
        if (fr) { fr.src = URL.createObjectURL(f); fr.style.display = 'block'; }
        if (wd) wd.style.display = 'none';
    } else {
        if (fr) fr.style.display = 'none';
        if (wd) { wd.style.display = 'flex'; var n = document.getElementById(type + 'WordName'); if (n) n.textContent = f.name; }
    }
    var sid = type === 'trans' ? 'SIEC-TR-2024-0001' : 'SIEC-TF-2024-0001';
    setTimeout(function() { generateQr(type + 'QrCanvas', location.origin + '/verify.html?id=' + sid, 80); }, 600);
    if (type === 'toefl') loadSavedToeflPositionToLive();
    setTimeout(function() { initDrag(type); }, 1000);
}

function removeFilePreview(type) {
    if (type === 'trans') { transFileData = null; var f = document.getElementById('transFile'); if (f) f.value = ''; }
    else { toeflFileData = null; var f2 = document.getElementById('toeflFile'); if (f2) f2.value = ''; }
    var fi = document.getElementById(type + 'FileInfo'); if (fi) fi.style.display = 'none';
    var lv = document.getElementById(type + 'LivePreview'); if (lv) lv.style.display = 'none';
    var sm = document.getElementById(type + 'SmallPreview'); if (sm) sm.style.display = 'block';
    var fr = document.getElementById(type + 'PreviewFrame'); if (fr) fr.src = '';
}

async function uploadFile(f, folder) {
    var ext = f.name.split('.').pop(),
        fn = folder + '/' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.' + ext;
    var r = await db.storage.from('uploads').upload(fn, f, { cacheControl: '3600', upsert: false });
    if (r.error) throw r.error;
    return { url: db.storage.from('uploads').getPublicUrl(fn).data.publicUrl, name: f.name };
}

function initDrag(type) {
    var el = document.getElementById(type + 'QrDrag'),
        co = document.getElementById(type + 'PreviewPage');
    if (!el || !co) return;
    var d = false, sx = 0, sy = 0, ol = 0, ot = 0;

    function st(x, y) { d = true; el.classList.add('dragging'); sx = x; sy = y; ol = el.offsetLeft; ot = el.offsetTop; }

    function mv(x, y) {
        if (!d) return;
        var nl = Math.max(0, Math.min(ol + (x - sx), co.offsetWidth - el.offsetWidth)),
            nt = Math.max(0, Math.min(ot + (y - sy), co.offsetHeight - el.offsetHeight));
        el.style.left = nl + 'px';
        el.style.top = nt + 'px';
        var centerX = nl + (el.offsetWidth / 2);
        var centerY = nt + (el.offsetHeight / 2);
        var px = Math.round(centerX / co.offsetWidth * 100);
        var py = Math.round(centerY / co.offsetHeight * 100);
        px = Math.max(5, Math.min(px, 95));
        py = Math.max(5, Math.min(py, 95));
        var a = document.getElementById(type + 'PosX'); if (a) a.textContent = px + '%';
        var b = document.getElementById(type + 'PosY'); if (b) b.textContent = py + '%';
        var c2 = document.getElementById(type + 'QrX'); if (c2) c2.value = px;
        var e2 = document.getElementById(type + 'QrY'); if (e2) e2.value = py;
    }

    function en() {
        if (!d) return;
        d = false;
        el.classList.remove('dragging');
        if (type === 'toefl') saveToeflPos(el, co);
    }

    el.onmousedown = function(e) { st(e.clientX, e.clientY); e.preventDefault(); };
    document.addEventListener('mousemove', function(e) { mv(e.clientX, e.clientY); });
    document.addEventListener('mouseup', en);
    el.ontouchstart = function(e) { var t = e.touches[0]; st(t.clientX, t.clientY); e.preventDefault(); };
    document.addEventListener('touchmove', function(e) { if (!d) return; var t = e.touches[0]; mv(t.clientX, t.clientY); e.preventDefault(); }, { passive: false });
    document.addEventListener('touchend', en);
}

function saveToeflPos(el, co) {
    var r = document.getElementById('toeflRememberPos');
    if (!r || !r.checked) return;
    var centerX = el.offsetLeft + (el.offsetWidth / 2);
    var centerY = el.offsetTop + (el.offsetHeight / 2);
    localStorage.setItem('siec_toefl_qr', JSON.stringify({
        x: Math.round(centerX / co.offsetWidth * 100),
        y: Math.round(centerY / co.offsetHeight * 100),
        size: document.getElementById('toeflQrSize') ? document.getElementById('toeflQrSize').value : 80
    }));
}

function loadSavedToeflPositionToLive() {
    var s = localStorage.getItem('siec_toefl_qr');
    if (!s) return;
    try {
        var p = JSON.parse(s), el = document.getElementById('toeflQrDrag'), co = document.getElementById('toeflPreviewPage');
        if (el && co) setTimeout(function() {
            var newLeft = (p.x / 100) * co.offsetWidth - (el.offsetWidth / 2);
            var newTop = (p.y / 100) * co.offsetHeight - (el.offsetHeight / 2);
            newLeft = Math.max(0, Math.min(newLeft, co.offsetWidth - el.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, co.offsetHeight - el.offsetHeight));
            el.style.left = newLeft + 'px';
            el.style.top = newTop + 'px';
            var a = document.getElementById('toeflPosX'); if (a) a.textContent = p.x + '%';
            var b = document.getElementById('toeflPosY'); if (b) b.textContent = p.y + '%';
        }, 600);
        var sz = document.getElementById('toeflQrSize');
        if (sz && p.size) sz.value = p.size;
    } catch (e) {}
}

function loadSavedToeflPosition() {
    var s = localStorage.getItem('siec_toefl_qr');
    if (!s) return;
    try {
        var p = JSON.parse(s),
            x = document.getElementById('toeflQrX'),
            y = document.getElementById('toeflQrY'),
            sz = document.getElementById('toeflQrSize');
        if (x) x.value = p.x;
        if (y) y.value = p.y;
        if (sz) sz.value = p.size || 80;
        updateSmallPreview('toefl');
    } catch (e) {}
}

function resetToeflPosition() {
    ['toeflQrX', 'toeflQrY'].forEach(function(id, i) { var e = document.getElementById(id); if (e) e.value = i === 0 ? 80 : 85; });
    var s = document.getElementById('toeflQrSize'); if (s) s.value = 80;
    localStorage.removeItem('siec_toefl_qr');
    updateSmallPreview('toefl');
    var d = document.getElementById('toeflQrDrag'); if (d) { d.style.left = '80%'; d.style.top = '85%'; }
    showNotification('Reset!');
}

function resizeQr(type) {
    var s = document.getElementById(type + 'QrSize');
    if (!s) return;
    var v = parseInt(s.value),
        sv = document.getElementById(type + 'QrSizeVal');
    if (sv) sv.textContent = v + 'px';
    var lv = document.getElementById(type + 'LivePreview');
    if (lv && lv.style.display !== 'none') {
        var id = type === 'trans' ? 'SIEC-TR-2024-0001' : 'SIEC-TF-2024-0001';
        generateQr(type + 'QrCanvas', location.origin + '/verify.html?id=' + id, v);
    }
}

function qrSizeUp(type) { var s = document.getElementById(type + 'QrSize'); if (!s) return; s.value = Math.min(parseInt(s.value) + 10, 150); resizeQr(type); }
function qrSizeDown(type) { var s = document.getElementById(type + 'QrSize'); if (!s) return; s.value = Math.max(parseInt(s.value) - 10, 40); resizeQr(type); }

function toggleQrId(type) { var s = document.getElementById(type + 'ShowId'), t = document.getElementById(type + 'QrIdText'); if (s && t) t.style.display = s.checked ? 'block' : 'none'; }

function updateSmallPreview(type) {
    var xE = document.getElementById(type + 'QrX'), yE = document.getElementById(type + 'QrY');
    if (!xE || !yE) return;
    var x = xE.value || 80, y = yE.value || 85;
    var xv = document.getElementById(type + 'QrXVal'), yv = document.getElementById(type + 'QrYVal');
    if (xv) xv.textContent = x + '%';
    if (yv) yv.textContent = y + '%';
    var ov = document.getElementById(type + 'SmallQr');
    if (ov) { ov.style.left = x + '%'; ov.style.top = y + '%'; }
    generateQr(type + 'SmallQrCanvas', location.origin + '/verify.html?id=SIEC-SAMPLE', 50);
}

function getQrPosition(type) {
    var lv = document.getElementById(type + 'LivePreview');
    if (lv && lv.style.display !== 'none') {
        var el = document.getElementById(type + 'QrDrag'),
            co = document.getElementById(type + 'PreviewPage');
        if (el && co && co.offsetWidth > 0) {
            var centerX = el.offsetLeft + (el.offsetWidth / 2);
            var centerY = el.offsetTop + (el.offsetHeight / 2);
            var pctX = Math.round((centerX / co.offsetWidth) * 100);
            var pctY = Math.round((centerY / co.offsetHeight) * 100);
            pctX = Math.max(5, Math.min(pctX, 95));
            pctY = Math.max(5, Math.min(pctY, 95));
            return {
                x: pctX,
                y: pctY,
                size: document.getElementById(type + 'QrSize') ? parseInt(document.getElementById(type + 'QrSize').value) : 80,
                showId: document.getElementById(type + 'ShowId') ? document.getElementById(type + 'ShowId').checked : true
            };
        }
    }
    return {
        x: document.getElementById(type + 'QrX') ? parseInt(document.getElementById(type + 'QrX').value) : 80,
        y: document.getElementById(type + 'QrY') ? parseInt(document.getElementById(type + 'QrY').value) : 85,
        size: document.getElementById(type + 'QrSize') ? parseInt(document.getElementById(type + 'QrSize').value) : 80,
        showId: document.getElementById(type + 'ShowId') ? document.getElementById(type + 'ShowId').checked : true
    };
}

function showTranslationPrint(doc) { var m = document.getElementById('printPreview'), c = document.getElementById('printPreviewContent'); c.innerHTML = '<div style="padding:20px;text-align:center"><p style="font-size:1.2rem;font-weight:700;color:#10b981;margin-bottom:12px">✅ QR Code tertempel di PDF!</p><p><b>ID:</b> ' + doc.document_id + ' | <b>Klien:</b> ' + doc.client_name + '</p>' + (doc.file_url ? '<a href="' + doc.file_url + '" target="_blank" class="btn btn-success" style="display:inline-flex;gap:8px;padding:12px 24px;margin-top:16px"><i class="fas fa-download"></i> Download PDF</a><iframe src="' + doc.file_url + '" style="width:100%;height:500px;border:2px solid #ddd;border-radius:8px;margin-top:12px"></iframe>' : '<p style="color:#666">Tidak ada file</p>') + '</div>'; m.style.display = 'flex'; }

function showCertPrint(cert) { var m = document.getElementById('certPrintModal'), c = document.getElementById('certPrintContent'), dl = document.getElementById('certDownloadLink'); if (dl) { if (cert.file_url) { dl.href = cert.file_url; dl.style.display = 'inline-flex'; } else dl.style.display = 'none'; } c.innerHTML = '<div style="padding:20px;text-align:center"><p style="font-size:1.2rem;font-weight:700;color:#10b981;margin-bottom:12px">✅ QR Code tertempel!</p><p style="font-size:1.3rem;font-weight:700">' + cert.participant_name + '</p><p>L:' + cert.listening_score + ' S:' + cert.structure_score + ' R:' + cert.reading_score + ' = <strong style="font-size:1.5rem;color:#2563eb">' + cert.total_score + '</strong></p><p><b>ID:</b> ' + cert.certificate_id + '</p>' + (cert.file_url ? '<iframe src="' + cert.file_url + '" style="width:100%;height:500px;border:2px solid #ddd;border-radius:8px;margin-top:12px"></iframe>' : '') + '</div>'; m.style.display = 'flex'; }

function showArticleForm(a) { var f = document.getElementById('articleForm'); f.style.display = 'block'; f.scrollIntoView({ behavior: 'smooth' }); if (a) { document.getElementById('articleFormTitle').textContent = 'Edit'; document.getElementById('articleId').value = a.id; document.getElementById('articleTitle').value = a.title; document.getElementById('articleCategory').value = a.category; document.getElementById('articleCover').value = a.cover_image || ''; document.getElementById('articleExcerpt').value = a.excerpt || ''; document.getElementById('articleContent').value = a.content; document.getElementById('articlePublished').checked = a.is_published; var r = document.querySelector('input[name="articleLayout"][value="' + a.layout_type + '"]'); if (r) r.checked = true; } else { document.getElementById('articleFormTitle').textContent = 'Tambah'; ['articleId', 'articleTitle', 'articleCover', 'articleExcerpt', 'articleContent'].forEach(function(id) { var e = document.getElementById(id); if (e) e.value = ''; }); document.getElementById('articlePublished').checked = false; var d = document.querySelector('input[name="articleLayout"][value="standard"]'); if (d) d.checked = true; } }
function hideArticleForm() { document.getElementById('articleForm').style.display = 'none'; }

async function saveArticle() { var t = document.getElementById('articleTitle').value.trim(); if (!t) { showNotification('Judul wajib!', 'error'); return; } var l = document.querySelector('input[name="articleLayout"]:checked'), id = document.getElementById('articleId').value, p = document.getElementById('articlePublished').checked, d = { title: t, slug: generateSlug(t) + '-' + Date.now(), content: document.getElementById('articleContent').value, excerpt: document.getElementById('articleExcerpt').value, cover_image: document.getElementById('articleCover').value, layout_type: l ? l.value : 'standard', category: document.getElementById('articleCategory').value, is_published: p, published_at: p ? new Date().toISOString() : null, updated_at: new Date().toISOString() }; try { var r = id ? await db.from('articles').update(d).eq('id', id) : await db.from('articles').insert(d); if (r.error) throw r.error; showNotification(id ? 'Updated!' : 'Added!'); hideArticleForm(); loadAdminArticles(); loadDashboardStats(); } catch (e) { showNotification('Error: ' + e.message, 'error'); } }

async function loadAdminArticles() { var tb = document.getElementById('articlesTableBody'); if (!tb) return; try { var r = await db.from('articles').select('*').order('created_at', { ascending: false }); if (!r.data || !r.data.length) { tb.innerHTML = '<tr><td colspan="6" class="loading-cell">Kosong</td></tr>'; return; } tb.innerHTML = r.data.map(function(a) { return '<tr><td><strong>' + a.title + '</strong></td><td>' + a.category + '</td><td>' + a.layout_type + '</td><td><span class="status-badge ' + (a.is_published ? 'status-published' : 'status-draft') + '">' + (a.is_published ? 'Live' : 'Draft') + '</span></td><td>' + formatDate(a.created_at) + '</td><td><div class="action-buttons"><button class="btn btn-sm btn-primary" onclick=\'showArticleForm(' + JSON.stringify(a) + ')\'>Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteArticle(\'' + a.id + '\')">Hapus</button></div></td></tr>'; }).join(''); } catch (e) { console.error(e); } }
async function deleteArticle(id) { if (!confirm('Hapus?')) return; await db.from('articles').delete().eq('id', id); showNotification('Deleted!'); loadAdminArticles(); loadDashboardStats(); }

function showProgramForm(p) { var f = document.getElementById('programForm'); f.style.display = 'block'; f.scrollIntoView({ behavior: 'smooth' }); if (p) { document.getElementById('programFormTitle').textContent = 'Edit'; document.getElementById('programId').value = p.id; document.getElementById('programTitle').value = p.title; document.getElementById('programType').value = p.program_type; document.getElementById('programLevel').value = p.level; document.getElementById('programDuration').value = p.duration || ''; document.getElementById('programSchedule').value = p.schedule || ''; document.getElementById('programPrice').value = p.price || ''; document.getElementById('programCover').value = p.cover_image || ''; document.getElementById('programDesc').value = p.description; document.getElementById('programContent').value = p.content || ''; document.getElementById('programFeatures').value = (p.features || []).join(', '); document.getElementById('programActive').checked = p.is_active; var r = document.querySelector('input[name="programLayout"][value="' + p.layout_type + '"]'); if (r) r.checked = true; } else { document.getElementById('programFormTitle').textContent = 'Tambah'; ['programId', 'programTitle', 'programDuration', 'programSchedule', 'programPrice', 'programCover', 'programDesc', 'programContent', 'programFeatures'].forEach(function(id) { var e = document.getElementById(id); if (e) e.value = ''; }); document.getElementById('programActive').checked = true; var d = document.querySelector('input[name="programLayout"][value="card"]'); if (d) d.checked = true; } }
function hideProgramForm() { document.getElementById('programForm').style.display = 'none'; }

async function saveProgram() { var t = document.getElementById('programTitle').value.trim(); if (!t) { showNotification('Nama wajib!', 'error'); return; } var id = document.getElementById('programId').value, l = document.querySelector('input[name="programLayout"]:checked'), fs = document.getElementById('programFeatures').value, ft = fs ? fs.split(',').map(function(f) { return f.trim(); }).filter(function(f) { return f; }) : [], d = { title: t, slug: generateSlug(t) + '-' + Date.now(), description: document.getElementById('programDesc').value, content: document.getElementById('programContent').value, program_type: document.getElementById('programType').value, level: document.getElementById('programLevel').value, duration: document.getElementById('programDuration').value, schedule: document.getElementById('programSchedule').value, price: document.getElementById('programPrice').value, cover_image: document.getElementById('programCover').value, layout_type: l ? l.value : 'card', features: ft, is_active: document.getElementById('programActive').checked, updated_at: new Date().toISOString() }; try { var r = id ? await db.from('learning_programs').update(d).eq('id', id) : await db.from('learning_programs').insert(d); if (r.error) throw r.error; showNotification(id ? 'Updated!' : 'Added!'); hideProgramForm(); loadAdminPrograms(); loadDashboardStats(); } catch (e) { showNotification('Error: ' + e.message, 'error'); } }

async function loadAdminPrograms() { var tb = document.getElementById('programsTableBody'); if (!tb) return; try { var r = await db.from('learning_programs').select('*').order('created_at', { ascending: false }); if (!r.data || !r.data.length) { tb.innerHTML = '<tr><td colspan="6" class="loading-cell">Kosong</td></tr>'; return; } tb.innerHTML = r.data.map(function(p) { return '<tr><td><strong>' + p.title + '</strong></td><td>' + p.program_type + '</td><td>' + p.layout_type + '</td><td>' + (p.price || '-') + '</td><td><span class="status-badge ' + (p.is_active ? 'status-published' : 'status-draft') + '">' + (p.is_active ? 'Aktif' : 'Off') + '</span></td><td><div class="action-buttons"><button class="btn btn-sm btn-primary" onclick=\'showProgramForm(' + JSON.stringify(p) + ')\'>Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteProgram(\'' + p.id + '\')">Hapus</button></div></td></tr>'; }).join(''); } catch (e) { console.error(e); } }
async function deleteProgram(id) { if (!confirm('Hapus?')) return; await db.from('learning_programs').delete().eq('id', id); showNotification('Deleted!'); loadAdminPrograms(); loadDashboardStats(); }

function showClientForm(c) { var f = document.getElementById('clientForm'); f.style.display = 'block'; f.scrollIntoView({ behavior: 'smooth' }); if (c) { document.getElementById('clientId').value = c.id; document.getElementById('clientName').value = c.client_name; document.getElementById('clientPhone').value = c.client_phone; document.getElementById('clientEmail').value = c.client_email || ''; document.getElementById('clientDocType').value = c.document_type; document.getElementById('clientSourceLang').value = c.source_language; document.getElementById('clientTargetLang').value = c.target_language; document.getElementById('clientStatus').value = c.status; document.getElementById('clientNotes').value = c.notes || ''; } else { ['clientId', 'clientName', 'clientPhone', 'clientEmail', 'clientNotes'].forEach(function(id) { var e = document.getElementById(id); if (e) e.value = ''; }); } }
function hideClientForm() { document.getElementById('clientForm').style.display = 'none'; }

async function saveClient() { var nm = document.getElementById('clientName').value.trim(), ph = document.getElementById('clientPhone').value.trim(); if (!nm || !ph) { showNotification('Nama & HP wajib!', 'error'); return; } var id = document.getElementById('clientId').value, d = { client_name: nm, client_phone: ph, client_email: document.getElementById('clientEmail').value, document_type: document.getElementById('clientDocType').value, source_language: document.getElementById('clientSourceLang').value, target_language: document.getElementById('clientTargetLang').value, status: document.getElementById('clientStatus').value, notes: document.getElementById('clientNotes').value, updated_at: new Date().toISOString() }; try { var r = id ? await db.from('translation_clients').update(d).eq('id', id) : await db.from('translation_clients').insert(d); if (r.error) throw r.error; showNotification(id ? 'Updated!' : 'Added!'); hideClientForm(); loadAdminClients(); loadDashboardStats(); } catch (e) { showNotification('Error: ' + e.message, 'error'); } }

async function loadAdminClients() { var tb = document.getElementById('clientsTableBody'); if (!tb) return; try { var r = await db.from('translation_clients').select('*').order('created_at', { ascending: false }); if (!r.data || !r.data.length) { tb.innerHTML = '<tr><td colspan="7" class="loading-cell">Kosong</td></tr>'; return; } tb.innerHTML = r.data.map(function(c) { return '<tr><td><strong>' + c.client_name + '</strong></td><td>' + c.client_phone + '</td><td>' + c.document_type + '</td><td>' + c.source_language + '→' + c.target_language + '</td><td><span class="status-badge status-' + c.status + '">' + c.status + '</span></td><td>' + formatDate(c.created_at) + '</td><td><div class="action-buttons"><button class="btn btn-sm btn-primary" onclick=\'showClientForm(' + JSON.stringify(c) + ')\'>Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteClient(\'' + c.id + '\')">Hapus</button></div></td></tr>'; }).join(''); } catch (e) { console.error(e); } }
async function deleteClient(id) { if (!confirm('Hapus?')) return; await db.from('translation_clients').delete().eq('id', id); showNotification('Deleted!'); loadAdminClients(); loadDashboardStats(); }

async function exportClients() { var r = await db.from('translation_clients').select('*').order('created_at', { ascending: false }); if (!r.data || !r.data.length) { showNotification('No data!', 'error'); return; } var h = ['Nama', 'HP', 'Email', 'Dokumen', 'Sumber', 'Target', 'Status', 'Catatan', 'Tanggal'], rows = r.data.map(function(c) { return [c.client_name, c.client_phone, c.client_email || '', c.document_type, c.source_language, c.target_language, c.status, c.notes || '', formatDate(c.created_at)]; }), csv = [h].concat(rows).map(function(r) { return r.join(','); }).join('\n'), b = new Blob([csv], { type: 'text/csv' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'klien-' + Date.now() + '.csv'; a.click(); showNotification('Downloaded!'); }

function showTranslationForm() { var f = document.getElementById('translationForm'); f.style.display = 'block'; f.scrollIntoView({ behavior: 'smooth' }); ['transDocId', 'transClientName', 'transDocTitle', 'transNotes'].forEach(function(id) { var e = document.getElementById(id); if (e) e.value = ''; }); document.getElementById('transIssuedDate').value = new Date().toISOString().split('T')[0]; transFileData = null; removeFilePreview('trans'); setTimeout(function() { updateSmallPreview('trans'); }, 300); }
function hideTranslationForm() { document.getElementById('translationForm').style.display = 'none'; }

async function saveTranslation() {
    var cn = document.getElementById('transClientName').value.trim(),
        dt = document.getElementById('transDocTitle').value.trim();
    if (!cn || !dt) { showNotification('Nama & judul wajib!', 'error'); return; }
    var docId = generateDocumentId('TR'),
        url = location.origin + '/verify.html?id=' + docId + '&type=translation',
        pos = getQrPosition('trans'),
        fu = '', fn = '';
    if (transFileData) {
        try {
            showNotification('Processing...', 'info');
            if (transFileData.type === 'application/pdf') {
                var mp = await embedQrInPdf(transFileData, url, docId, pos.x, pos.y, pos.size);
                var ext = transFileData.name.split('.').pop(),
                    nm = 'translations/' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.' + ext;
                var r = await db.storage.from('uploads').upload(nm, mp, { cacheControl: '3600', upsert: false });
                if (r.error) throw r.error;
                fu = db.storage.from('uploads').getPublicUrl(nm).data.publicUrl;
                fn = transFileData.name;
            } else {
                var up = await uploadFile(transFileData, 'translations');
                fu = up.url; fn = up.name;
            }
        } catch (e) { showNotification('Error: ' + e.message, 'error'); return; }
    }
    var d = { document_id: docId, client_name: cn, document_title: dt, source_language: document.getElementById('transSourceLang').value, target_language: document.getElementById('transTargetLang').value, document_type: document.getElementById('transDocType').value, barcode_data: url, qr_position: JSON.stringify(pos), file_url: fu, file_name: fn, issued_date: document.getElementById('transIssuedDate').value, notes: document.getElementById('transNotes').value, verified: true, status: 'valid' };
    try { var r = await db.from('translation_documents').insert(d); if (r.error) throw r.error; showNotification('✅ ID: ' + docId + (fu ? ' - QR in PDF!' : '')); hideTranslationForm(); loadAdminTranslations(); loadDashboardStats(); showTranslationPrint(d); } catch (e) { showNotification('Error: ' + e.message, 'error'); }
}

async function loadAdminTranslations() { var tb = document.getElementById('translationsTableBody'); if (!tb) return; try { var r = await db.from('translation_documents').select('*').order('created_at', { ascending: false }); if (!r.data || !r.data.length) { tb.innerHTML = '<tr><td colspan="7" class="loading-cell">Kosong</td></tr>'; return; } tb.innerHTML = r.data.map(function(d) { var fb = d.file_url ? '<a href="' + d.file_url + '" target="_blank" class="file-badge"><i class="fas fa-file-pdf"></i> ' + (d.file_name || 'PDF') + '</a>' : '-', dl = d.file_url ? '<a href="' + d.file_url + '" target="_blank" class="btn btn-sm btn-primary"><i class="fas fa-download"></i></a>' : ''; return '<tr><td><strong style="color:var(--primary)">' + d.document_id + '</strong></td><td>' + d.client_name + '</td><td>' + d.document_title + '</td><td>' + d.source_language + '→' + d.target_language + '</td><td>' + fb + '</td><td>' + formatDate(d.issued_date) + '</td><td><div class="action-buttons"><button class="btn btn-sm btn-success" onclick=\'showTranslationPrint(' + JSON.stringify(d) + ')\'>View</button> ' + dl + ' <button class="btn btn-sm btn-danger" onclick="deleteTranslation(\'' + d.id + '\')">Hapus</button></div></td></tr>'; }).join(''); } catch (e) { console.error(e); } }
async function deleteTranslation(id) { if (!confirm('Hapus?')) return; await db.from('translation_documents').delete().eq('id', id); showNotification('Deleted!'); loadAdminTranslations(); loadDashboardStats(); }

function showStatusForm(s) { var f = document.getElementById('statusForm'); f.style.display = 'block'; f.scrollIntoView({ behavior: 'smooth' }); if (s) { document.getElementById('statusId').value = s.id; document.getElementById('statusClientName').value = s.client_name; document.getElementById('statusClientPhone').value = s.client_phone; document.getElementById('statusDocType').value = s.document_type; document.getElementById('statusValue').value = s.status; document.getElementById('statusDesc').value = s.status_description || ''; document.getElementById('statusEstimate').value = s.estimated_completion || ''; } else { ['statusId', 'statusClientName', 'statusClientPhone', 'statusDocType', 'statusDesc', 'statusEstimate'].forEach(function(id) { var e = document.getElementById(id); if (e) e.value = ''; }); document.getElementById('statusValue').value = 'received'; } }
function hideStatusForm() { document.getElementById('statusForm').style.display = 'none'; }

async function saveStatus() { var nm = document.getElementById('statusClientName').value.trim(), ph = document.getElementById('statusClientPhone').value.trim(); if (!nm || !ph) { showNotification('Nama & HP wajib!', 'error'); return; } var id = document.getElementById('statusId').value, d = { client_name: nm, client_phone: ph, document_type: document.getElementById('statusDocType').value, status: document.getElementById('statusValue').value, status_description: document.getElementById('statusDesc').value, estimated_completion: document.getElementById('statusEstimate').value || null, updated_at: new Date().toISOString() }; try { var r; if (id) { r = await db.from('translation_status').update(d).eq('id', id); } else { d.tracking_code = generateTrackingCode(); r = await db.from('translation_status').insert(d); showNotification('Code: ' + d.tracking_code); } if (r.error) throw r.error; if (id) showNotification('Updated!'); hideStatusForm(); loadAdminStatus(); } catch (e) { showNotification('Error: ' + e.message, 'error'); } }

async function loadAdminStatus() { var tb = document.getElementById('statusTableBody'); if (!tb) return; try { var r = await db.from('translation_status').select('*').order('created_at', { ascending: false }); if (!r.data || !r.data.length) { tb.innerHTML = '<tr><td colspan="6" class="loading-cell">Kosong</td></tr>'; return; } tb.innerHTML = r.data.map(function(s) { return '<tr><td><strong style="color:var(--primary)">' + s.tracking_code + '</strong></td><td>' + s.client_name + '</td><td>' + s.document_type + '</td><td><span class="status-badge status-' + s.status + '">' + s.status + '</span></td><td>' + (s.estimated_completion ? formatDate(s.estimated_completion) : '-') + '</td><td><div class="action-buttons"><button class="btn btn-sm btn-primary" onclick=\'showStatusForm(' + JSON.stringify(s) + ')\'>Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteStatus(\'' + s.id + '\')">Hapus</button></div></td></tr>'; }).join(''); } catch (e) { console.error(e); } }
async function deleteStatus(id) { if (!confirm('Hapus?')) return; await db.from('translation_status').delete().eq('id', id); showNotification('Deleted!'); loadAdminStatus(); }

function showToeflForm(c) { var f = document.getElementById('toeflForm'); f.style.display = 'block'; f.scrollIntoView({ behavior: 'smooth' }); toeflFileData = null; removeFilePreview('toefl'); if (c) { document.getElementById('toeflId').value = c.id; document.getElementById('toeflName').value = c.participant_name; document.getElementById('toeflTestDate').value = c.test_date; document.getElementById('toeflEmail').value = c.participant_email || ''; document.getElementById('toeflPhone').value = c.participant_phone || ''; document.getElementById('toeflListening').value = c.listening_score; document.getElementById('toeflStructure').value = c.structure_score; document.getElementById('toeflReading').value = c.reading_score; document.getElementById('toeflTotal').value = c.total_score; document.getElementById('toeflNotes').value = c.notes || ''; if (c.qr_position) { try { var p = JSON.parse(c.qr_position), x = document.getElementById('toeflQrX'), y = document.getElementById('toeflQrY'), s = document.getElementById('toeflQrSize'); if (x) x.value = p.x; if (y) y.value = p.y; if (s) s.value = p.size || 80; } catch (e) {} } } else { ['toeflId', 'toeflName', 'toeflTestDate', 'toeflEmail', 'toeflPhone', 'toeflListening', 'toeflStructure', 'toeflReading', 'toeflTotal', 'toeflNotes'].forEach(function(id) { var e = document.getElementById(id); if (e) e.value = ''; }); loadSavedToeflPosition(); } setTimeout(function() { updateSmallPreview('toefl'); }, 300); }
function hideToeflForm() { document.getElementById('toeflForm').style.display = 'none'; }

async function saveToefl() {
    var nm = document.getElementById('toeflName').value.trim(),
        td = document.getElementById('toeflTestDate').value;
    if (!nm || !td) { showNotification('Nama & tanggal wajib!', 'error'); return; }
    var id = document.getElementById('toeflId').value,
        l = parseInt(document.getElementById('toeflListening').value) || 0,
        s = parseInt(document.getElementById('toeflStructure').value) || 0,
        r2 = parseInt(document.getElementById('toeflReading').value) || 0,
        total = Math.round((l + s + r2) * 10 / 3),
        pos = getQrPosition('toefl');
    var re = document.getElementById('toeflRememberPos');
    if (re && re.checked) localStorage.setItem('siec_toefl_qr', JSON.stringify(pos));
    var fu = '', fn = '', cid = id ? null : generateDocumentId('TF'),
        url = location.origin + '/verify.html?id=' + (cid || id) + '&type=toefl';
    if (toeflFileData) {
        try {
            showNotification('Processing...', 'info');
            if (toeflFileData.type === 'application/pdf') {
                var mp = await embedQrInPdf(toeflFileData, url, cid || id, pos.x, pos.y, pos.size);
                var ext = toeflFileData.name.split('.').pop(),
                    nm2 = 'certificates/' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.' + ext;
                var r = await db.storage.from('uploads').upload(nm2, mp, { cacheControl: '3600', upsert: false });
                if (r.error) throw r.error;
                fu = db.storage.from('uploads').getPublicUrl(nm2).data.publicUrl;
                fn = toeflFileData.name;
            } else {
                var up = await uploadFile(toeflFileData, 'certificates');
                fu = up.url; fn = up.name;
            }
        } catch (e) { showNotification('Error: ' + e.message, 'error'); return; }
    }
    var d = { participant_name: nm, test_date: td, participant_email: document.getElementById('toeflEmail').value, participant_phone: document.getElementById('toeflPhone').value, listening_score: l, structure_score: s, reading_score: r2, total_score: total, qr_position: JSON.stringify(pos), file_url: fu, file_name: fn, notes: document.getElementById('toeflNotes').value, verified: true, status: 'valid' };
    try {
        var r;
        if (id) { r = await db.from('toefl_certificates').update(d).eq('id', id); if (r.error) throw r.error; showNotification('Updated!'); }
        else { d.certificate_id = cid; d.barcode_data = url; r = await db.from('toefl_certificates').insert(d); if (r.error) throw r.error; showNotification('✅ ID: ' + cid + (fu ? ' - QR in PDF!' : '')); showCertPrint(d); }
        hideToeflForm(); loadAdminToefl(); loadDashboardStats();
    } catch (e) { showNotification('Error: ' + e.message, 'error'); }
}

async function loadAdminToefl() { var tb = document.getElementById('toeflTableBody'); if (!tb) return; try { var r = await db.from('toefl_certificates').select('*').order('created_at', { ascending: false }); if (!r.data || !r.data.length) { tb.innerHTML = '<tr><td colspan="7" class="loading-cell">Kosong</td></tr>'; return; } tb.innerHTML = r.data.map(function(c) { var fb = c.file_url ? '<a href="' + c.file_url + '" target="_blank" class="file-badge"><i class="fas fa-file-pdf"></i> PDF</a>' : '-', dl = c.file_url ? '<a href="' + c.file_url + '" target="_blank" class="btn btn-sm btn-primary"><i class="fas fa-download"></i></a>' : ''; return '<tr><td><strong style="color:var(--primary)">' + c.certificate_id + '</strong></td><td>' + c.participant_name + '</td><td>' + formatDate(c.test_date) + '</td><td>' + c.listening_score + '/' + c.structure_score + '/' + c.reading_score + '</td><td><strong style="color:var(--primary);font-size:1.1rem">' + c.total_score + '</strong></td><td>' + fb + '</td><td><div class="action-buttons"><button class="btn btn-sm btn-success" onclick=\'showCertPrint(' + JSON.stringify(c) + ')\'>View</button> ' + dl + ' <button class="btn btn-sm btn-warning" onclick=\'showToeflForm(' + JSON.stringify(c) + ')\'>Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteToefl(\'' + c.id + '\')">Hapus</button></div></td></tr>'; }).join(''); } catch (e) { console.error(e); } }
async function deleteToefl(id) { if (!confirm('Hapus?')) return; await db.from('toefl_certificates').delete().eq('id', id); showNotification('Deleted!'); loadAdminToefl(); loadDashboardStats(); }