// ============================================
// SIEC Admin Dashboard - Final Working Version
// QR Code: Google Charts API
// ============================================

var LOGO_URL = 'assets/logo.png';
var transFileData = null;
var toeflFileData = null;

// ============================================
// QR CODE GENERATOR
// ============================================
function generateQr(targetId, text, size) {
    var el = document.getElementById(targetId);
    if (!el) return;

    var s = parseInt(size) || 100;
    var encoded = encodeURIComponent(text || window.location.origin);
    var qrUrl = 'https://chart.googleapis.com/chart?cht=qr&chs=' + s + 'x' + s + '&chl=' + encoded + '&choe=UTF-8&chld=H|2';

    el.innerHTML =
        '<div style="position:relative;display:inline-block;width:'+s+'px;height:'+s+'px;">' +
        '<img src="'+qrUrl+'" width="'+s+'" height="'+s+'" style="display:block;border-radius:4px;" crossorigin="anonymous" onerror="this.parentElement.innerHTML=\'<div style=width:'+s+'px;height:'+s+'px;display:flex;align-items:center;justify-content:center;background:#f0f0f0;border:2px solid #2563eb;border-radius:4px;><span style=font-weight:800;color:#2563eb;>QR SIEC</span></div>\'">' +
        '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:'+Math.round(s*0.22)+'px;height:'+Math.round(s*0.22)+'px;border-radius:50%;overflow:hidden;background:white;border:2px solid white;box-shadow:0 0 0 1px #2563eb;">' +
        '<img src="'+LOGO_URL+'" style="width:100%;height:100%;object-fit:contain;" onerror="this.parentElement.innerHTML=\'<div style=width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:white;><span style=font-size:'+Math.round(s*0.07)+'px;font-weight:800;color:#2563eb;>SIEC</span></div>\'">' +
        '</div></div>';
}

// Alias
function generateQrWithLogo(id, text, size) { generateQr(id, text, size); }
function generateQrCode(id, text, size) { generateQr(id, text, size); }

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    var admin = checkAuth();
    if (!admin) return;
    var n = document.getElementById('adminName');
    if (n) n.textContent = admin.full_name;

    document.querySelectorAll('.sidebar-link[data-section]').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            switchSection(link.dataset.section);
        });
    });

    var tog = document.getElementById('sidebarToggle');
    var cls = document.getElementById('sidebarClose');
    var sb = document.getElementById('adminSidebar');
    if (tog) tog.addEventListener('click', function() { sb.classList.toggle('active'); });
    if (cls) cls.addEventListener('click', function() { sb.classList.remove('active'); });

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

// ============================================
// NAVIGATION
// ============================================
function switchSection(section) {
    document.querySelectorAll('.admin-section').forEach(function(s) { s.classList.remove('active'); });
    document.querySelectorAll('.sidebar-link').forEach(function(l) { l.classList.remove('active'); });
    var el = document.getElementById('section-' + section);
    if (el) el.classList.add('active');
    var lk = document.querySelector('[data-section="' + section + '"]');
    if (lk) lk.classList.add('active');
    var titles = { 'dashboard':'Dashboard','articles':'Artikel','programs':'Program Belajar','translation-clients':'Laporan Pengguna Jasa','translations':'Dokumen Terjemahan','translation-status':'Status Terjemahan','toefl':'Sertifikat TOEFL' };
    var t = document.getElementById('pageTitle');
    if (t) t.textContent = titles[section] || 'Dashboard';
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
function insertTag(tag) { var t=document.getElementById('articleContent'); var s=t.selectionStart,e=t.selectionEnd; var sel=t.value.substring(s,e); t.value=t.value.substring(0,s)+'<'+tag+'>'+sel+'</'+tag+'>'+t.value.substring(e); t.focus(); }
function togglePreview() { var p=document.getElementById('articlePreview'); if(p.style.display==='none'){p.innerHTML=document.getElementById('articleContent').value;p.style.display='block';}else p.style.display='none'; }
function closePrintPreview(id) { document.getElementById(id).style.display = 'none'; }
function printDocument() { window.print(); }
function calculateToeflTotal() { var l=parseFloat(document.getElementById('toeflListening').value)||0; var s=parseFloat(document.getElementById('toeflStructure').value)||0; var r=parseFloat(document.getElementById('toeflReading').value)||0; document.getElementById('toeflTotal').value=Math.round((l+s+r)*10/3); }

// ============================================
// FILE UPLOAD
// ============================================
function handleFilePreview(input, type) {
    var file = input.files[0];
    if (!file) return;
    if (file.size > 10*1024*1024) { showNotification('Max 10MB!','error'); input.value=''; return; }
    if (type==='trans') transFileData=file; else toeflFileData=file;
    document.getElementById(type+'FileInfo').style.display='flex';
    document.getElementById(type+'FileName').textContent=file.name;
    var live=document.getElementById(type+'LivePreview');
    var small=document.getElementById(type+'SmallPreview');
    if(live)live.style.display='block';
    if(small)small.style.display='none';
    var frame=document.getElementById(type+'PreviewFrame');
    var word=document.getElementById(type+'WordFallback');
    if(file.type==='application/pdf'){
        var url=URL.createObjectURL(file);
        if(frame){frame.src=url;frame.style.display='block';}
        if(word)word.style.display='none';
    } else {
        if(frame)frame.style.display='none';
        if(word){word.style.display='flex';var n=document.getElementById(type+'WordName');if(n)n.textContent=file.name;}
    }
    var sampleId=type==='trans'?'SIEC-TR-2024-0001':'SIEC-TF-2024-0001';
    setTimeout(function(){generateQr(type+'QrCanvas',window.location.origin+'/verify.html?id='+sampleId,80);},600);
    if(type==='toefl')loadSavedToeflPositionToLive();
    setTimeout(function(){initDrag(type);},1000);
}

function removeFilePreview(type) {
    if(type==='trans'){transFileData=null;var f=document.getElementById('transFile');if(f)f.value='';}
    else{toeflFileData=null;var f2=document.getElementById('toeflFile');if(f2)f2.value='';}
    var fi=document.getElementById(type+'FileInfo');if(fi)fi.style.display='none';
    var live=document.getElementById(type+'LivePreview');if(live)live.style.display='none';
    var small=document.getElementById(type+'SmallPreview');if(small)small.style.display='block';
    var fr=document.getElementById(type+'PreviewFrame');if(fr)fr.src='';
}

async function uploadFileToSupabase(file, folder) {
    var ext=file.name.split('.').pop();
    var fn=folder+'/'+Date.now()+'-'+Math.random().toString(36).substr(2,9)+'.'+ext;
    var r=await db.storage.from('uploads').upload(fn,file,{cacheControl:'3600',upsert:false});
    if(r.error)throw r.error;
    var u=db.storage.from('uploads').getPublicUrl(fn);
    return{url:u.data.publicUrl,name:file.name};
}

// ============================================
// DRAG QR
// ============================================
function initDrag(type) {
    var el=document.getElementById(type+'QrDrag');
    var cont=document.getElementById(type+'PreviewPage');
    if(!el||!cont)return;
    var dragging=false,sx=0,sy=0,ol=0,ot=0;

    function onStart(x,y){dragging=true;el.classList.add('dragging');sx=x;sy=y;ol=el.offsetLeft;ot=el.offsetTop;}
    function onMove(x,y){
        if(!dragging)return;
        var nl=Math.max(0,Math.min(ol+(x-sx),cont.offsetWidth-el.offsetWidth));
        var nt=Math.max(0,Math.min(ot+(y-sy),cont.offsetHeight-el.offsetHeight));
        el.style.left=nl+'px';el.style.top=nt+'px';
        var px=Math.round((nl/cont.offsetWidth)*100);
        var py=Math.round((nt/cont.offsetHeight)*100);
        var pxe=document.getElementById(type+'PosX');if(pxe)pxe.textContent=px+'%';
        var pye=document.getElementById(type+'PosY');if(pye)pye.textContent=py+'%';
        var sxe=document.getElementById(type+'QrX');if(sxe)sxe.value=px;
        var sye=document.getElementById(type+'QrY');if(sye)sye.value=py;
    }
    function onEnd(){if(!dragging)return;dragging=false;el.classList.remove('dragging');if(type==='toefl')saveToeflPos(el,cont);}

    el.addEventListener('mousedown',function(e){onStart(e.clientX,e.clientY);e.preventDefault();});
    document.addEventListener('mousemove',function(e){onMove(e.clientX,e.clientY);});
    document.addEventListener('mouseup',onEnd);
    el.addEventListener('touchstart',function(e){var t=e.touches[0];onStart(t.clientX,t.clientY);e.preventDefault();},{passive:false});
    document.addEventListener('touchmove',function(e){if(!dragging)return;var t=e.touches[0];onMove(t.clientX,t.clientY);e.preventDefault();},{passive:false});
    document.addEventListener('touchend',onEnd);
}

function saveToeflPos(el,cont) {
    var re=document.getElementById('toeflRememberPos');if(!re||!re.checked)return;
    localStorage.setItem('siec_toefl_qr',JSON.stringify({
        x:Math.round((el.offsetLeft/cont.offsetWidth)*100),
        y:Math.round((el.offsetTop/cont.offsetHeight)*100),
        size:document.getElementById('toeflQrSize')?document.getElementById('toeflQrSize').value:80,
        showId:document.getElementById('toeflShowId')?document.getElementById('toeflShowId').checked:true
    }));
}

function loadSavedToeflPositionToLive() {
    var saved=localStorage.getItem('siec_toefl_qr');if(!saved)return;
    try{var pos=JSON.parse(saved);var el=document.getElementById('toeflQrDrag');var cont=document.getElementById('toeflPreviewPage');
    if(el&&cont){setTimeout(function(){el.style.left=((pos.x/100)*cont.offsetWidth)+'px';el.style.top=((pos.y/100)*cont.offsetHeight)+'px';
    var px=document.getElementById('toeflPosX');if(px)px.textContent=pos.x+'%';
    var py=document.getElementById('toeflPosY');if(py)py.textContent=pos.y+'%';},600);}
    var sz=document.getElementById('toeflQrSize');if(sz&&pos.size)sz.value=pos.size;}catch(e){}
}

function loadSavedToeflPosition() {
    var saved=localStorage.getItem('siec_toefl_qr');if(!saved)return;
    try{var pos=JSON.parse(saved);
    var x=document.getElementById('toeflQrX');if(x)x.value=pos.x;
    var y=document.getElementById('toeflQrY');if(y)y.value=pos.y;
    var s=document.getElementById('toeflQrSize');if(s)s.value=pos.size||80;
    updateSmallPreview('toefl');}catch(e){}
}

function resetToeflPosition() {
    var x=document.getElementById('toeflQrX');if(x)x.value=80;
    var y=document.getElementById('toeflQrY');if(y)y.value=85;
    var s=document.getElementById('toeflQrSize');if(s)s.value=80;
    localStorage.removeItem('siec_toefl_qr');
    updateSmallPreview('toefl');
    var d=document.getElementById('toeflQrDrag');if(d){d.style.left='80%';d.style.top='85%';}
    showNotification('Posisi di-reset!');
}

function resizeQr(type) {
    var s=document.getElementById(type+'QrSize');if(!s)return;
    var size=parseInt(s.value);
    var sv=document.getElementById(type+'QrSizeVal');if(sv)sv.textContent=size+'px';
    var live=document.getElementById(type+'LivePreview');
    if(live&&live.style.display!=='none'){
        var id=type==='trans'?'SIEC-TR-2024-0001':'SIEC-TF-2024-0001';
        generateQr(type+'QrCanvas',window.location.origin+'/verify.html?id='+id,size);
    }
}

function toggleQrId(type) {
    var s=document.getElementById(type+'ShowId');
    var t=document.getElementById(type+'QrIdText');
    if(s&&t)t.style.display=s.checked?'block':'none';
}

function updateSmallPreview(type) {
    var xEl=document.getElementById(type+'QrX');
    var yEl=document.getElementById(type+'QrY');
    if(!xEl||!yEl)return;
    var x=xEl.value||80,y=yEl.value||85;
    var xv=document.getElementById(type+'QrXVal');if(xv)xv.textContent=x+'%';
    var yv=document.getElementById(type+'QrYVal');if(yv)yv.textContent=y+'%';
    var ov=document.getElementById(type+'SmallQr');
    if(ov){ov.style.left=x+'%';ov.style.top=y+'%';}
    generateQr(type+'SmallQrCanvas',window.location.origin+'/verify.html?id=SIEC-SAMPLE',50);
}

function getQrPosition(type) {
    var live=document.getElementById(type+'LivePreview');
    if(live&&live.style.display!=='none'){
        var el=document.getElementById(type+'QrDrag');
        var cont=document.getElementById(type+'PreviewPage');
        if(el&&cont&&cont.offsetWidth>0){
            return{x:Math.round((el.offsetLeft/cont.offsetWidth)*100),y:Math.round((el.offsetTop/cont.offsetHeight)*100),
            size:document.getElementById(type+'QrSize')?parseInt(document.getElementById(type+'QrSize').value):80,
            showId:document.getElementById(type+'ShowId')?document.getElementById(type+'ShowId').checked:true};
        }
    }
    return{x:document.getElementById(type+'QrX')?parseInt(document.getElementById(type+'QrX').value):80,
    y:document.getElementById(type+'QrY')?parseInt(document.getElementById(type+'QrY').value):85,
    size:document.getElementById(type+'QrSize')?parseInt(document.getElementById(type+'QrSize').value):80,
    showId:document.getElementById(type+'ShowId')?document.getElementById(type+'ShowId').checked:true};
}

// ============================================
// PRINT - Halaman Verifikasi Terpisah
// ============================================
function showTranslationPrint(doc) {
    var pos={x:80,y:85,size:120,showId:true};
    if(doc.qr_position){try{pos=JSON.parse(doc.qr_position);}catch(e){}}
    var modal=document.getElementById('printPreview');
    var content=document.getElementById('printPreviewContent');
    var verifyUrl=window.location.origin+'/verify.html?id='+doc.document_id+'&type=translation';
    var qs=parseInt(pos.size)||120;

    content.innerHTML =
        // Info dokumen + QR
        '<div style="background:white;padding:30px;border:1px solid #ddd;border-radius:8px;">' +
        '<div style="text-align:center;margin-bottom:20px;">' +
        '<img src="'+LOGO_URL+'" style="width:60px;height:60px;object-fit:contain;margin-bottom:8px;" onerror="this.style.display=\'none\'">' +
        '<div style="font-size:1.4rem;font-weight:800;color:#2563eb;">SIEC</div>' +
        '<div style="font-weight:600;">Syaf Intensive English Course</div>' +
        '<div style="color:#666;font-size:0.85rem;">Lembar Verifikasi Dokumen Terjemahan</div>' +
        '<hr style="margin:16px 0;">' +
        '</div>' +

        '<div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;">' +

        // Kolom kiri: detail
        '<div style="flex:1;min-width:250px;line-height:2;">' +
        '<p><b>ID Dokumen:</b> '+doc.document_id+'</p>' +
        '<p><b>Nama Klien:</b> '+doc.client_name+'</p>' +
        '<p><b>Judul:</b> '+doc.document_title+'</p>' +
        '<p><b>Jenis:</b> '+doc.document_type+'</p>' +
        '<p><b>Bahasa:</b> '+doc.source_language+' → '+doc.target_language+'</p>' +
        '<p><b>Tanggal Terbit:</b> '+formatDate(doc.issued_date)+'</p>' +
        '</div>' +

        // Kolom kanan: QR
        '<div style="text-align:center;padding:16px;border:2px solid #e2e8f0;border-radius:12px;background:#f8fafc;">' +
        '<div id="printQrTrans" style="display:inline-block;margin-bottom:8px;"></div>' +
        (pos.showId?'<div style="font-size:10px;font-weight:700;font-family:monospace;">'+doc.document_id+'</div>':'') +
        '<div style="font-size:8px;color:#999;margin-top:4px;">Scan QR untuk verifikasi keaslian</div>' +
        '<div style="font-size:7px;color:#2563eb;margin-top:4px;word-break:break-all;">'+verifyUrl+'</div>' +
        '</div>' +

        '</div>' +

        // Tanda tangan
        '<div style="display:flex;justify-content:space-between;margin-top:40px;padding-top:16px;border-top:1px solid #ddd;">' +
        '<div style="text-align:center;"><div style="height:50px;"></div><div style="border-top:1px solid #333;padding-top:4px;width:150px;">Penerjemah</div></div>' +
        '<div style="text-align:center;"><div style="height:50px;"></div><div style="border-top:1px solid #333;padding-top:4px;width:150px;">Administrator SIEC</div></div>' +
        '</div>' +
        '</div>' +

        // Preview PDF (jika ada)
        (doc.file_url?'<div style="margin-top:16px;"><p style="font-size:0.85rem;color:#666;margin-bottom:8px;">📄 File dokumen:</p><iframe src="'+doc.file_url+'" style="width:100%;height:500px;border:2px solid #ddd;border-radius:8px;"></iframe></div>':'');

    modal.style.display='flex';
    setTimeout(function(){generateQr('printQrTrans',verifyUrl,qs);},500);
}

function showCertPrint(cert) {
    var pos={x:80,y:85,size:120,showId:true};
    if(cert.qr_position){try{pos=JSON.parse(cert.qr_position);}catch(e){}}
    var modal=document.getElementById('certPrintModal');
    var content=document.getElementById('certPrintContent');
    var verifyUrl=window.location.origin+'/verify.html?id='+cert.certificate_id+'&type=toefl';
    var qs=parseInt(pos.size)||120;

    var dl=document.getElementById('certDownloadLink');
    if(dl){if(cert.file_url){dl.href=cert.file_url;dl.style.display='inline-flex';}else dl.style.display='none';}

    content.innerHTML =
        '<div style="background:white;padding:30px;border:1px solid #ddd;border-radius:8px;">' +
        '<div style="text-align:center;margin-bottom:20px;">' +
        '<img src="'+LOGO_URL+'" style="width:60px;height:60px;object-fit:contain;margin-bottom:8px;" onerror="this.style.display=\'none\'">' +
        '<div style="font-size:1.4rem;font-weight:800;color:#2563eb;">SIEC</div>' +
        '<div style="font-weight:600;">Syaf Intensive English Course</div>' +
        '<div style="color:#666;font-size:0.85rem;">Lembar Verifikasi Sertifikat TOEFL Prediction</div>' +
        '<hr style="margin:16px 0;">' +
        '</div>' +

        '<div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;">' +

        // Detail
        '<div style="flex:1;min-width:250px;">' +
        '<p style="font-size:0.85rem;color:#666;">Sertifikat ini menyatakan bahwa:</p>' +
        '<p style="font-size:1.5rem;font-weight:700;color:#0f172a;margin:8px 0;">'+cert.participant_name+'</p>' +
        '<p style="color:#666;">Tanggal Tes: '+formatDate(cert.test_date)+'</p>' +
        '<div style="display:flex;gap:12px;margin:16px 0;">' +
        '<div style="padding:10px 16px;background:#f1f5f9;border-radius:8px;text-align:center;"><div style="font-size:0.7rem;color:#666;">LISTENING</div><div style="font-size:1.5rem;font-weight:800;color:#2563eb;">'+cert.listening_score+'</div></div>' +
        '<div style="padding:10px 16px;background:#f1f5f9;border-radius:8px;text-align:center;"><div style="font-size:0.7rem;color:#666;">STRUCTURE</div><div style="font-size:1.5rem;font-weight:800;color:#2563eb;">'+cert.structure_score+'</div></div>' +
        '<div style="padding:10px 16px;background:#f1f5f9;border-radius:8px;text-align:center;"><div style="font-size:0.7rem;color:#666;">READING</div><div style="font-size:1.5rem;font-weight:800;color:#2563eb;">'+cert.reading_score+'</div></div>' +
        '</div>' +
        '<div style="background:linear-gradient(135deg,#2563eb,#7c3aed);color:white;padding:12px 24px;border-radius:12px;display:inline-block;">' +
        '<div style="font-size:0.7rem;opacity:0.8;">Total Score</div>' +
        '<div style="font-size:2.5rem;font-weight:900;line-height:1;">'+cert.total_score+'</div></div>' +
        '</div>' +

        // QR
        '<div style="text-align:center;padding:16px;border:2px solid #e2e8f0;border-radius:12px;background:#f8fafc;">' +
        '<div id="printQrToefl" style="display:inline-block;margin-bottom:8px;"></div>' +
        (pos.showId?'<div style="font-size:10px;font-weight:700;font-family:monospace;">'+cert.certificate_id+'</div>':'') +
        '<div style="font-size:8px;color:#999;margin-top:4px;">Scan QR untuk verifikasi</div>' +
        '<div style="font-size:7px;color:#2563eb;margin-top:4px;word-break:break-all;">'+verifyUrl+'</div>' +
        '</div>' +

        '</div></div>' +

        (cert.file_url?'<div style="margin-top:16px;"><p style="font-size:0.85rem;color:#666;margin-bottom:8px;">📄 File sertifikat:</p><iframe src="'+cert.file_url+'" style="width:100%;height:500px;border:2px solid #ddd;border-radius:8px;"></iframe></div>':'');

    modal.style.display='flex';
    setTimeout(function(){generateQr('printQrToefl',verifyUrl,qs);},500);
}

// ============================================
// ARTICLES
// ============================================
function showArticleForm(a){var f=document.getElementById('articleForm');f.style.display='block';f.scrollIntoView({behavior:'smooth'});if(a){document.getElementById('articleFormTitle').textContent='Edit Artikel';document.getElementById('articleId').value=a.id;document.getElementById('articleTitle').value=a.title;document.getElementById('articleCategory').value=a.category;document.getElementById('articleCover').value=a.cover_image||'';document.getElementById('articleExcerpt').value=a.excerpt||'';document.getElementById('articleContent').value=a.content;document.getElementById('articlePublished').checked=a.is_published;var r=document.querySelector('input[name="articleLayout"][value="'+a.layout_type+'"]');if(r)r.checked=true;}else{document.getElementById('articleFormTitle').textContent='Tambah Artikel';['articleId','articleTitle','articleCover','articleExcerpt','articleContent'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});document.getElementById('articlePublished').checked=false;var def=document.querySelector('input[name="articleLayout"][value="standard"]');if(def)def.checked=true;}}
function hideArticleForm(){document.getElementById('articleForm').style.display='none';}

async function saveArticle(){var title=document.getElementById('articleTitle').value.trim();if(!title){showNotification('Judul harus diisi!','error');return;}var le=document.querySelector('input[name="articleLayout"]:checked');var id=document.getElementById('articleId').value;var pub=document.getElementById('articlePublished').checked;var data={title:title,slug:generateSlug(title)+'-'+Date.now(),content:document.getElementById('articleContent').value,excerpt:document.getElementById('articleExcerpt').value,cover_image:document.getElementById('articleCover').value,layout_type:le?le.value:'standard',category:document.getElementById('articleCategory').value,is_published:pub,published_at:pub?new Date().toISOString():null,updated_at:new Date().toISOString()};try{var r=id?await db.from('articles').update(data).eq('id',id):await db.from('articles').insert(data);if(r.error)throw r.error;showNotification(id?'Diperbarui!':'Ditambahkan!');hideArticleForm();loadAdminArticles();loadDashboardStats();}catch(e){showNotification('Gagal: '+e.message,'error');}}

async function loadAdminArticles(){var tb=document.getElementById('articlesTableBody');if(!tb)return;try{var r=await db.from('articles').select('*').order('created_at',{ascending:false});if(!r.data||!r.data.length){tb.innerHTML='<tr><td colspan="6" class="loading-cell">Belum ada</td></tr>';return;}tb.innerHTML=r.data.map(function(a){return'<tr><td><strong>'+a.title+'</strong></td><td>'+a.category+'</td><td>'+a.layout_type+'</td><td><span class="status-badge '+(a.is_published?'status-published':'status-draft')+'">'+(a.is_published?'Published':'Draft')+'</span></td><td>'+formatDate(a.created_at)+'</td><td><div class="action-buttons"><button class="btn btn-sm btn-primary" onclick=\'showArticleForm('+JSON.stringify(a)+')\'>Edit</button><button class="btn btn-sm btn-danger" onclick="deleteArticle(\''+a.id+'\')">Hapus</button></div></td></tr>';}).join('');}catch(e){console.error(e);}}
async function deleteArticle(id){if(!confirm('Hapus?'))return;await db.from('articles').delete().eq('id',id);showNotification('Dihapus!');loadAdminArticles();loadDashboardStats();}

// ============================================
// PROGRAMS
// ============================================
function showProgramForm(p){var f=document.getElementById('programForm');f.style.display='block';f.scrollIntoView({behavior:'smooth'});if(p){document.getElementById('programFormTitle').textContent='Edit Program';document.getElementById('programId').value=p.id;document.getElementById('programTitle').value=p.title;document.getElementById('programType').value=p.program_type;document.getElementById('programLevel').value=p.level;document.getElementById('programDuration').value=p.duration||'';document.getElementById('programSchedule').value=p.schedule||'';document.getElementById('programPrice').value=p.price||'';document.getElementById('programCover').value=p.cover_image||'';document.getElementById('programDesc').value=p.description;document.getElementById('programContent').value=p.content||'';document.getElementById('programFeatures').value=(p.features||[]).join(', ');document.getElementById('programActive').checked=p.is_active;var r=document.querySelector('input[name="programLayout"][value="'+p.layout_type+'"]');if(r)r.checked=true;}else{document.getElementById('programFormTitle').textContent='Tambah Program';['programId','programTitle','programDuration','programSchedule','programPrice','programCover','programDesc','programContent','programFeatures'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});document.getElementById('programActive').checked=true;var def=document.querySelector('input[name="programLayout"][value="card"]');if(def)def.checked=true;}}
function hideProgramForm(){document.getElementById('programForm').style.display='none';}

async function saveProgram(){var title=document.getElementById('programTitle').value.trim();if(!title){showNotification('Nama harus diisi!','error');return;}var id=document.getElementById('programId').value;var le=document.querySelector('input[name="programLayout"]:checked');var fs=document.getElementById('programFeatures').value;var features=fs?fs.split(',').map(function(f){return f.trim();}).filter(function(f){return f;}):[]; var data={title:title,slug:generateSlug(title)+'-'+Date.now(),description:document.getElementById('programDesc').value,content:document.getElementById('programContent').value,program_type:document.getElementById('programType').value,level:document.getElementById('programLevel').value,duration:document.getElementById('programDuration').value,schedule:document.getElementById('programSchedule').value,price:document.getElementById('programPrice').value,cover_image:document.getElementById('programCover').value,layout_type:le?le.value:'card',features:features,is_active:document.getElementById('programActive').checked,updated_at:new Date().toISOString()};try{var r=id?await db.from('learning_programs').update(data).eq('id',id):await db.from('learning_programs').insert(data);if(r.error)throw r.error;showNotification(id?'Diperbarui!':'Ditambahkan!');hideProgramForm();loadAdminPrograms();loadDashboardStats();}catch(e){showNotification('Gagal: '+e.message,'error');}}

async function loadAdminPrograms(){var tb=document.getElementById('programsTableBody');if(!tb)return;try{var r=await db.from('learning_programs').select('*').order('created_at',{ascending:false});if(!r.data||!r.data.length){tb.innerHTML='<tr><td colspan="6" class="loading-cell">Belum ada</td></tr>';return;}tb.innerHTML=r.data.map(function(p){return'<tr><td><strong>'+p.title+'</strong></td><td>'+p.program_type+'</td><td>'+p.layout_type+'</td><td>'+(p.price||'-')+'</td><td><span class="status-badge '+(p.is_active?'status-published':'status-draft')+'">'+(p.is_active?'Aktif':'Nonaktif')+'</span></td><td><div class="action-buttons"><button class="btn btn-sm btn-primary" onclick=\'showProgramForm('+JSON.stringify(p)+')\'>Edit</button><button class="btn btn-sm btn-danger" onclick="deleteProgram(\''+p.id+'\')">Hapus</button></div></td></tr>';}).join('');}catch(e){console.error(e);}}
async function deleteProgram(id){if(!confirm('Hapus?'))return;await db.from('learning_programs').delete().eq('id',id);showNotification('Dihapus!');loadAdminPrograms();loadDashboardStats();}

// ============================================
// CLIENTS
// ============================================
function showClientForm(c){var f=document.getElementById('clientForm');f.style.display='block';f.scrollIntoView({behavior:'smooth'});if(c){document.getElementById('clientId').value=c.id;document.getElementById('clientName').value=c.client_name;document.getElementById('clientPhone').value=c.client_phone;document.getElementById('clientEmail').value=c.client_email||'';document.getElementById('clientDocType').value=c.document_type;document.getElementById('clientSourceLang').value=c.source_language;document.getElementById('clientTargetLang').value=c.target_language;document.getElementById('clientStatus').value=c.status;document.getElementById('clientNotes').value=c.notes||'';}else{['clientId','clientName','clientPhone','clientEmail','clientNotes'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});}}
function hideClientForm(){document.getElementById('clientForm').style.display='none';}

async function saveClient(){var name=document.getElementById('clientName').value.trim();var phone=document.getElementById('clientPhone').value.trim();if(!name||!phone){showNotification('Nama dan HP wajib!','error');return;}var id=document.getElementById('clientId').value;var data={client_name:name,client_phone:phone,client_email:document.getElementById('clientEmail').value,document_type:document.getElementById('clientDocType').value,source_language:document.getElementById('clientSourceLang').value,target_language:document.getElementById('clientTargetLang').value,status:document.getElementById('clientStatus').value,notes:document.getElementById('clientNotes').value,updated_at:new Date().toISOString()};try{var r=id?await db.from('translation_clients').update(data).eq('id',id):await db.from('translation_clients').insert(data);if(r.error)throw r.error;showNotification(id?'Diperbarui!':'Ditambahkan!');hideClientForm();loadAdminClients();loadDashboardStats();}catch(e){showNotification('Gagal: '+e.message,'error');}}

async function loadAdminClients(){var tb=document.getElementById('clientsTableBody');if(!tb)return;try{var r=await db.from('translation_clients').select('*').order('created_at',{ascending:false});if(!r.data||!r.data.length){tb.innerHTML='<tr><td colspan="7" class="loading-cell">Belum ada</td></tr>';return;}tb.innerHTML=r.data.map(function(c){return'<tr><td><strong>'+c.client_name+'</strong></td><td>'+c.client_phone+'</td><td>'+c.document_type+'</td><td>'+c.source_language+'→'+c.target_language+'</td><td><span class="status-badge status-'+c.status+'">'+c.status+'</span></td><td>'+formatDate(c.created_at)+'</td><td><div class="action-buttons"><button class="btn btn-sm btn-primary" onclick=\'showClientForm('+JSON.stringify(c)+')\'>Edit</button><button class="btn btn-sm btn-danger" onclick="deleteClient(\''+c.id+'\')">Hapus</button></div></td></tr>';}).join('');}catch(e){console.error(e);}}
async function deleteClient(id){if(!confirm('Hapus?'))return;await db.from('translation_clients').delete().eq('id',id);showNotification('Dihapus!');loadAdminClients();loadDashboardStats();}

async function exportClients(){var r=await db.from('translation_clients').select('*').order('created_at',{ascending:false});if(!r.data||!r.data.length){showNotification('Tidak ada data!','error');return;}var h=['Nama','HP','Email','Dokumen','Sumber','Target','Status','Catatan','Tanggal'];var rows=r.data.map(function(c){return[c.client_name,c.client_phone,c.client_email||'',c.document_type,c.source_language,c.target_language,c.status,c.notes||'',formatDate(c.created_at)];});var csv=[h].concat(rows).map(function(r){return r.join(',');}).join('\n');var blob=new Blob([csv],{type:'text/csv'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='klien-siec-'+Date.now()+'.csv';a.click();showNotification('CSV downloaded!');}

// ============================================
// TRANSLATIONS
// ============================================
function showTranslationForm(){var f=document.getElementById('translationForm');f.style.display='block';f.scrollIntoView({behavior:'smooth'});document.getElementById('transDocId').value='';document.getElementById('transClientName').value='';document.getElementById('transDocTitle').value='';document.getElementById('transNotes').value='';document.getElementById('transIssuedDate').value=new Date().toISOString().split('T')[0];transFileData=null;removeFilePreview('trans');setTimeout(function(){updateSmallPreview('trans');},300);}
function hideTranslationForm(){document.getElementById('translationForm').style.display='none';}

async function saveTranslation(){var cn=document.getElementById('transClientName').value.trim();var dt=document.getElementById('transDocTitle').value.trim();if(!cn||!dt){showNotification('Nama dan judul wajib!','error');return;}var docId=generateDocumentId('TR');var verifyUrl=window.location.origin+'/verify.html?id='+docId+'&type=translation';var pos=getQrPosition('trans');var fu='',fn='';if(transFileData){try{showNotification('Mengupload...','info');var up=await uploadFileToSupabase(transFileData,'translations');fu=up.url;fn=up.name;}catch(err){showNotification('Gagal upload: '+err.message,'error');return;}}var data={document_id:docId,client_name:cn,document_title:dt,source_language:document.getElementById('transSourceLang').value,target_language:document.getElementById('transTargetLang').value,document_type:document.getElementById('transDocType').value,barcode_data:verifyUrl,qr_position:JSON.stringify(pos),file_url:fu,file_name:fn,issued_date:document.getElementById('transIssuedDate').value,notes:document.getElementById('transNotes').value,verified:true,status:'valid'};try{var r=await db.from('translation_documents').insert(data);if(r.error)throw r.error;showNotification('Disimpan! ID: '+docId);hideTranslationForm();loadAdminTranslations();loadDashboardStats();showTranslationPrint(data);}catch(err){showNotification('Gagal: '+err.message,'error');}}

async function loadAdminTranslations(){var tb=document.getElementById('translationsTableBody');if(!tb)return;try{var r=await db.from('translation_documents').select('*').order('created_at',{ascending:false});if(!r.data||!r.data.length){tb.innerHTML='<tr><td colspan="7" class="loading-cell">Belum ada</td></tr>';return;}tb.innerHTML=r.data.map(function(d){var fb=d.file_url?'<a href="'+d.file_url+'" target="_blank" class="file-badge"><i class="fas fa-file-pdf"></i> '+(d.file_name||'PDF')+'</a>':'<span class="no-file">-</span>';var dl=d.file_url?'<a href="'+d.file_url+'" target="_blank" class="btn btn-sm btn-primary"><i class="fas fa-download"></i></a>':'';return'<tr><td><strong style="color:var(--primary)">'+d.document_id+'</strong></td><td>'+d.client_name+'</td><td>'+d.document_title+'</td><td>'+d.source_language+'→'+d.target_language+'</td><td>'+fb+'</td><td>'+formatDate(d.issued_date)+'</td><td><div class="action-buttons"><button class="btn btn-sm btn-success" onclick=\'showTranslationPrint('+JSON.stringify(d)+')\'>Cetak</button>'+dl+'<button class="btn btn-sm btn-danger" onclick="deleteTranslation(\''+d.id+'\')">Hapus</button></div></td></tr>';}).join('');}catch(e){console.error(e);}}
async function deleteTranslation(id){if(!confirm('Hapus?'))return;await db.from('translation_documents').delete().eq('id',id);showNotification('Dihapus!');loadAdminTranslations();loadDashboardStats();}

// ============================================
// STATUS
// ============================================
function showStatusForm(s){var f=document.getElementById('statusForm');f.style.display='block';f.scrollIntoView({behavior:'smooth'});if(s){document.getElementById('statusId').value=s.id;document.getElementById('statusClientName').value=s.client_name;document.getElementById('statusClientPhone').value=s.client_phone;document.getElementById('statusDocType').value=s.document_type;document.getElementById('statusValue').value=s.status;document.getElementById('statusDesc').value=s.status_description||'';document.getElementById('statusEstimate').value=s.estimated_completion||'';}else{['statusId','statusClientName','statusClientPhone','statusDocType','statusDesc','statusEstimate'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});document.getElementById('statusValue').value='received';}}
function hideStatusForm(){document.getElementById('statusForm').style.display='none';}

async function saveStatus(){var name=document.getElementById('statusClientName').value.trim();var phone=document.getElementById('statusClientPhone').value.trim();if(!name||!phone){showNotification('Nama dan HP wajib!','error');return;}var id=document.getElementById('statusId').value;var data={client_name:name,client_phone:phone,document_type:document.getElementById('statusDocType').value,status:document.getElementById('statusValue').value,status_description:document.getElementById('statusDesc').value,estimated_completion:document.getElementById('statusEstimate').value||null,updated_at:new Date().toISOString()};try{var r;if(id){r=await db.from('translation_status').update(data).eq('id',id);}else{data.tracking_code=generateTrackingCode();r=await db.from('translation_status').insert(data);showNotification('Kode: '+data.tracking_code);}if(r.error)throw r.error;if(id)showNotification('Diperbarui!');hideStatusForm();loadAdminStatus();}catch(e){showNotification('Gagal: '+e.message,'error');}}

async function loadAdminStatus(){var tb=document.getElementById('statusTableBody');if(!tb)return;try{var r=await db.from('translation_status').select('*').order('created_at',{ascending:false});if(!r.data||!r.data.length){tb.innerHTML='<tr><td colspan="6" class="loading-cell">Belum ada</td></tr>';return;}tb.innerHTML=r.data.map(function(s){return'<tr><td><strong style="color:var(--primary)">'+s.tracking_code+'</strong></td><td>'+s.client_name+'</td><td>'+s.document_type+'</td><td><span class="status-badge status-'+s.status+'">'+s.status+'</span></td><td>'+(s.estimated_completion?formatDate(s.estimated_completion):'-')+'</td><td><div class="action-buttons"><button class="btn btn-sm btn-primary" onclick=\'showStatusForm('+JSON.stringify(s)+')\'>Edit</button><button class="btn btn-sm btn-danger" onclick="deleteStatus(\''+s.id+'\')">Hapus</button></div></td></tr>';}).join('');}catch(e){console.error(e);}}
async function deleteStatus(id){if(!confirm('Hapus?'))return;await db.from('translation_status').delete().eq('id',id);showNotification('Dihapus!');loadAdminStatus();}

// ============================================
// TOEFL
// ============================================
function showToeflForm(c){var f=document.getElementById('toeflForm');f.style.display='block';f.scrollIntoView({behavior:'smooth'});toeflFileData=null;removeFilePreview('toefl');if(c){document.getElementById('toeflId').value=c.id;document.getElementById('toeflName').value=c.participant_name;document.getElementById('toeflTestDate').value=c.test_date;document.getElementById('toeflEmail').value=c.participant_email||'';document.getElementById('toeflPhone').value=c.participant_phone||'';document.getElementById('toeflListening').value=c.listening_score;document.getElementById('toeflStructure').value=c.structure_score;document.getElementById('toeflReading').value=c.reading_score;document.getElementById('toeflTotal').value=c.total_score;document.getElementById('toeflNotes').value=c.notes||'';if(c.qr_position){try{var p=JSON.parse(c.qr_position);var x=document.getElementById('toeflQrX');var y=document.getElementById('toeflQrY');var s=document.getElementById('toeflQrSize');if(x)x.value=p.x;if(y)y.value=p.y;if(s)s.value=p.size||80;}catch(e){}}}else{['toeflId','toeflName','toeflTestDate','toeflEmail','toeflPhone','toeflListening','toeflStructure','toeflReading','toeflTotal','toeflNotes'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});loadSavedToeflPosition();}setTimeout(function(){updateSmallPreview('toefl');},300);}
function hideToeflForm(){document.getElementById('toeflForm').style.display='none';}

async function saveToefl(){var name=document.getElementById('toeflName').value.trim();var testDate=document.getElementById('toeflTestDate').value;if(!name||!testDate){showNotification('Nama dan tanggal wajib!','error');return;}var id=document.getElementById('toeflId').value;var l=parseInt(document.getElementById('toeflListening').value)||0;var s=parseInt(document.getElementById('toeflStructure').value)||0;var r2=parseInt(document.getElementById('toeflReading').value)||0;var total=Math.round((l+s+r2)*10/3);var pos=getQrPosition('toefl');var re=document.getElementById('toeflRememberPos');if(re&&re.checked)localStorage.setItem('siec_toefl_qr',JSON.stringify(pos));var fu='',fn='';if(toeflFileData){try{showNotification('Mengupload...','info');var up=await uploadFileToSupabase(toeflFileData,'certificates');fu=up.url;fn=up.name;}catch(err){showNotification('Gagal upload: '+err.message,'error');return;}}var certId=id?null:generateDocumentId('TF');var verifyUrl=window.location.origin+'/verify.html?id='+(certId||id)+'&type=toefl';var data={participant_name:name,test_date:testDate,participant_email:document.getElementById('toeflEmail').value,participant_phone:document.getElementById('toeflPhone').value,listening_score:l,structure_score:s,reading_score:r2,total_score:total,qr_position:JSON.stringify(pos),file_url:fu,file_name:fn,notes:document.getElementById('toeflNotes').value,verified:true,status:'valid'};try{var r;if(id){r=await db.from('toefl_certificates').update(data).eq('id',id);if(r.error)throw r.error;showNotification('Diperbarui!');}else{data.certificate_id=certId;data.barcode_data=verifyUrl;r=await db.from('toefl_certificates').insert(data);if(r.error)throw r.error;showNotification('Disimpan! ID: '+certId);showCertPrint(data);}hideToeflForm();loadAdminToefl();loadDashboardStats();}catch(err){showNotification('Gagal: '+err.message,'error');}}

async function loadAdminToefl(){var tb=document.getElementById('toeflTableBody');if(!tb)return;try{var r=await db.from('toefl_certificates').select('*').order('created_at',{ascending:false});if(!r.data||!r.data.length){tb.innerHTML='<tr><td colspan="7" class="loading-cell">Belum ada</td></tr>';return;}tb.innerHTML=r.data.map(function(c){var fb=c.file_url?'<a href="'+c.file_url+'" target="_blank" class="file-badge"><i class="fas fa-file-pdf"></i> PDF</a>':'<span class="no-file">-</span>';var dl=c.file_url?'<a href="'+c.file_url+'" target="_blank" class="btn btn-sm btn-primary"><i class="fas fa-download"></i></a>':'';return'<tr><td><strong style="color:var(--primary)">'+c.certificate_id+'</strong></td><td>'+c.participant_name+'</td><td>'+formatDate(c.test_date)+'</td><td>'+c.listening_score+'/'+c.structure_score+'/'+c.reading_score+'</td><td><strong style="color:var(--primary);font-size:1.1rem;">'+c.total_score+'</strong></td><td>'+fb+'</td><td><div class="action-buttons"><button class="btn btn-sm btn-success" onclick=\'showCertPrint('+JSON.stringify(c)+')\'>Preview</button>'+dl+'<button class="btn btn-sm btn-warning" onclick=\'showToeflForm('+JSON.stringify(c)+')\'>Edit</button><button class="btn btn-sm btn-danger" onclick="deleteToefl(\''+c.id+'\')">Hapus</button></div></td></tr>';}).join('');}catch(e){console.error(e);}}
async function deleteToefl(id){if(!confirm('Hapus?'))return;await db.from('toefl_certificates').delete().eq('id',id);showNotification('Dihapus!');loadAdminToefl();loadDashboardStats();}