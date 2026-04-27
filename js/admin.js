// ============================================
// SIEC - Admin Dashboard v2
// Upload PDF + QR Code + Logo
// ============================================

// Logo URL - GANTI DENGAN URL LOGO ANDA
const LOGO_URL = 'assets/logo.png';

// File references
let transFileData = null;
let toeflFileData = null;

document.addEventListener('DOMContentLoaded', () => {
    const admin = checkAuth();
    if (!admin) return;
    document.getElementById('adminName').textContent = admin.full_name;

    // Sidebar nav
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

    // Load data
    loadDashboardStats();
    loadAdminArticles();
    loadAdminPrograms();
    loadAdminClients();
    loadAdminTranslations();
    loadAdminStatus();
    loadAdminToefl();
    loadSavedToeflPosition();

    // Init QR previews
    setTimeout(() => {
        updateQrPreview('trans');
        updateQrPreview('toefl');
    }, 500);
});

// ============================================
// NAVIGATION
// ============================================
function switchSection(section) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    document.getElementById(`section-${section}`)?.classList.add('active');
    document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
    const titles = {
        'dashboard':'Dashboard','articles':'Artikel','programs':'Program Belajar',
        'translation-clients':'Laporan Pengguna Jasa','translations':'Dokumen Terjemahan',
        'translation-status':'Status Terjemahan','toefl':'Sertifikat TOEFL'
    };
    document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';
    document.getElementById('adminSidebar').classList.remove('active');
}

// ============================================
// DASHBOARD
// ============================================
async function loadDashboardStats() {
    try {
        const [a,c,t,cert,p] = await Promise.all([
            db.from('articles').select('*',{count:'exact',head:true}),
            db.from('translation_clients').select('*',{count:'exact',head:true}),
            db.from('translation_documents').select('*',{count:'exact',head:true}),
            db.from('toefl_certificates').select('*',{count:'exact',head:true}),
            db.from('learning_programs').select('*',{count:'exact',head:true}).eq('is_active',true)
        ]);
        document.getElementById('totalArticles').textContent = a.count||0;
        document.getElementById('totalClients').textContent = c.count||0;
        document.getElementById('totalTranslations').textContent = t.count||0;
        document.getElementById('totalCertificates').textContent = cert.count||0;
        document.getElementById('totalPrograms').textContent = p.count||0;
    } catch(e) { console.error(e); }
}

// ============================================
// FILE UPLOAD HANDLING
// ============================================
function handleFileSelect(input, type) {
    const file = input.files[0];
    if (!file) return;

    // Check size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showNotification('File terlalu besar! Max 10MB', 'error');
        input.value = '';
        return;
    }

    if (type === 'trans') {
        transFileData = file;
        document.getElementById('transFileInfo').style.display = 'flex';
        document.getElementById('transFileName').textContent = file.name;
    } else {
        toeflFileData = file;
        document.getElementById('toeflFileInfo').style.display = 'flex';
        document.getElementById('toeflFileName').textContent = file.name;
    }

    // PDF Preview
    if (file.type === 'application/pdf') {
        const url = URL.createObjectURL(file);
        const previewId = type === 'trans' ? 'transPdfPreview' : 'toeflPdfPreview';
        const frameId = type === 'trans' ? 'transPdfFrame' : 'toeflPdfFrame';
        document.getElementById(previewId).style.display = 'block';
        document.getElementById(frameId).src = url;
    }
}

function removeFile(type) {
    if (type === 'trans') {
        transFileData = null;
        document.getElementById('transFile').value = '';
        document.getElementById('transFileInfo').style.display = 'none';
        document.getElementById('transPdfPreview').style.display = 'none';
    } else {
        toeflFileData = null;
        document.getElementById('toeflFile').value = '';
        document.getElementById('toeflFileInfo').style.display = 'none';
        document.getElementById('toeflPdfPreview').style.display = 'none';
    }
}

async function uploadFileToSupabase(file, folder) {
    const ext = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substr(2,9)}.${ext}`;

    const { data, error } = await db.storage
        .from('uploads')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) throw error;

    const { data: urlData } = db.storage
        .from('uploads')
        .getPublicUrl(fileName);

    return {
        url: urlData.publicUrl,
        name: file.name
    };
}

// ============================================
// QR CODE WITH LOGO
// ============================================
function generateQrWithLogo(canvasId, text, size) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const qrSize = Math.max(size || 80, 40);

    // Generate QR code
    QRCode.toCanvas(canvas, text, {
        width: qrSize,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H' // High error correction for logo overlay
    }, function(error) {
        if (error) {
            console.error('QR Error:', error);
            return;
        }

        // Add logo in center
        const ctx = canvas.getContext('2d');
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        logo.onload = function() {
            const logoSize = qrSize * 0.25;
            const logoX = (canvas.width - logoSize) / 2;
            const logoY = (canvas.height - logoSize) / 2;

            // White background for logo
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(canvas.width/2, canvas.height/2, logoSize/2 + 3, 0, Math.PI * 2);
            ctx.fill();

            // Draw logo
            ctx.save();
            ctx.beginPath();
            ctx.arc(canvas.width/2, canvas.height/2, logoSize/2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
            ctx.restore();

            // Border
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(canvas.width/2, canvas.height/2, logoSize/2 + 1, 0, Math.PI * 2);
            ctx.stroke();
        };
        logo.onerror = function() {
            // If logo fails, draw text "SIEC" instead
            const ctx2 = canvas.getContext('2d');
            const logoSize = qrSize * 0.22;
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            ctx2.fillStyle = '#ffffff';
            ctx2.beginPath();
            ctx2.arc(cx, cy, logoSize/2 + 3, 0, Math.PI * 2);
            ctx2.fill();

            ctx2.fillStyle = '#2563eb';
            ctx2.font = `bold ${logoSize * 0.4}px Arial`;
            ctx2.textAlign = 'center';
            ctx2.textBaseline = 'middle';
            ctx2.fillText('SIEC', cx, cy);
        };
        logo.src = LOGO_URL;
    });
}

function updateQrPreview(type) {
    const x = document.getElementById(`${type}QrX`)?.value || 85;
    const y = document.getElementById(`${type}QrY`)?.value || 90;
    const size = document.getElementById(`${type}QrSize`)?.value || 80;
    const showQr = document.getElementById(`${type}ShowQr`)?.checked ?? true;
    const showId = document.getElementById(`${type}ShowId`)?.checked ?? true;

    // Update labels
    const xEl = document.getElementById(`${type}QrXVal`);
    const yEl = document.getElementById(`${type}QrYVal`);
    const sizeEl = document.getElementById(`${type}QrSizeVal`);
    if (xEl) xEl.textContent = x + '%';
    if (yEl) yEl.textContent = y + '%';
    if (sizeEl) sizeEl.textContent = size + 'px';

    // Update overlay position
    const overlay = document.getElementById(`${type}QrOverlay`);
    if (overlay) {
        overlay.style.left = x + '%';
        overlay.style.top = y + '%';
        overlay.style.transform = 'translate(-50%, -50%)';
    }

    // Generate QR preview
    const canvasId = `${type}QrCanvas`;
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        if (showQr) {
            canvas.style.display = 'block';
            const sampleId = type === 'trans' ? 'SIEC-TR-2024-0001' : 'SIEC-TF-2024-0001';
            const previewSize = Math.min(parseInt(size) * 0.6, 80);
            generateQrWithLogo(canvasId, sampleId, previewSize);
        } else {
            canvas.style.display = 'none';
        }
    }

    // ID text
    const idEl = document.getElementById(`${type}IdText`);
    if (idEl) idEl.style.display = showId ? 'block' : 'none';
}

// ============================================
// TOEFL POSITION MEMORY
// ============================================
function loadSavedToeflPosition() {
    const saved = localStorage.getItem('siec_toefl_qr_pos');
    if (!saved) return;
    try {
        const pos = JSON.parse(saved);
        if (document.getElementById('toeflQrX')) document.getElementById('toeflQrX').value = pos.x;
        if (document.getElementById('toeflQrY')) document.getElementById('toeflQrY').value = pos.y;
        if (document.getElementById('toeflQrSize')) document.getElementById('toeflQrSize').value = pos.size;
        if (document.getElementById('toeflShowQr')) document.getElementById('toeflShowQr').checked = pos.showQr;
        if (document.getElementById('toeflShowId')) document.getElementById('toeflShowId').checked = pos.showId;
        updateQrPreview('toefl');
    } catch(e) {}
}

function resetToeflPosition() {
    document.getElementById('toeflQrX').value = 85;
    document.getElementById('toeflQrY').value = 90;
    document.getElementById('toeflQrSize').value = 80;
    document.getElementById('toeflShowQr').checked = true;
    document.getElementById('toeflShowId').checked = true;
    localStorage.removeItem('siec_toefl_qr_pos');
    updateQrPreview('toefl');
    showNotification('Posisi di-reset!');
}

function calculateToeflTotal() {
    const l = parseFloat(document.getElementById('toeflListening').value) || 0;
    const s = parseFloat(document.getElementById('toeflStructure').value) || 0;
    const r = parseFloat(document.getElementById('toeflReading').value) || 0;
    document.getElementById('toeflTotal').value = Math.round((l + s + r) * 10 / 3);
}

// ============================================
// UTILITY
// ============================================
function insertTag(tag) {
    const t = document.getElementById('articleContent');
    const s = t.selectionStart, e = t.selectionEnd;
    const sel = t.value.substring(s, e);
    t.value = t.value.substring(0,s) + `<${tag}>${sel}</${tag}>` + t.value.substring(e);
    t.focus();
}

function togglePreview() {
    const p = document.getElementById('articlePreview');
    if (p.style.display === 'none') {
        p.innerHTML = document.getElementById('articleContent').value;
        p.style.display = 'block';
    } else {
        p.style.display = 'none';
    }
}

function closePrintPreview(id) { document.getElementById(id).style.display = 'none'; }

function printDocument() { window.print(); }

// ============================================
// ARTICLES (same as before)
// ============================================
function showArticleForm(a=null) {
    const f = document.getElementById('articleForm');
    f.style.display='block'; f.scrollIntoView({behavior:'smooth'});
    if(a){
        document.getElementById('articleFormTitle').textContent='Edit Artikel';
        document.getElementById('articleId').value=a.id;
        document.getElementById('articleTitle').value=a.title;
        document.getElementById('articleCategory').value=a.category;
        document.getElementById('articleCover').value=a.cover_image||'';
        document.getElementById('articleExcerpt').value=a.excerpt||'';
        document.getElementById('articleContent').value=a.content;
        document.getElementById('articlePublished').checked=a.is_published;
        const r=document.querySelector(`input[name="articleLayout"][value="${a.layout_type}"]`);
        if(r)r.checked=true;
    } else {
        document.getElementById('articleFormTitle').textContent='Tambah Artikel';
        document.getElementById('articleId').value='';
        document.getElementById('articleTitle').value='';
        document.getElementById('articleCover').value='';
        document.getElementById('articleExcerpt').value='';
        document.getElementById('articleContent').value='';
        document.getElementById('articlePublished').checked=false;
        document.querySelector('input[name="articleLayout"][value="standard"]').checked=true;
    }
}
function hideArticleForm(){document.getElementById('articleForm').style.display='none';}

async function saveArticle() {
    const title=document.getElementById('articleTitle').value.trim();
    if(!title){showNotification('Judul harus diisi!','error');return;}
    const layout=document.querySelector('input[name="articleLayout"]:checked')?.value||'standard';
    const id=document.getElementById('articleId').value;
    const pub=document.getElementById('articlePublished').checked;
    const data={title,slug:generateSlug(title)+'-'+Date.now(),content:document.getElementById('articleContent').value,
        excerpt:document.getElementById('articleExcerpt').value,cover_image:document.getElementById('articleCover').value,
        layout_type:layout,category:document.getElementById('articleCategory').value,
        is_published:pub,published_at:pub?new Date().toISOString():null,updated_at:new Date().toISOString()};
    try {
        if(id){const{error}=await db.from('articles').update(data).eq('id',id);if(error)throw error;showNotification('Artikel diperbarui!');}
        else{const{error}=await db.from('articles').insert(data);if(error)throw error;showNotification('Artikel ditambahkan!');}
        hideArticleForm();loadAdminArticles();loadDashboardStats();
    }catch(e){showNotification('Gagal: '+e.message,'error');}
}

async function loadAdminArticles() {
    const tbody=document.getElementById('articlesTableBody');if(!tbody)return;
    try{const{data}=await db.from('articles').select('*').order('created_at',{ascending:false});
        if(!data?.length){tbody.innerHTML='<tr><td colspan="6" class="loading-cell">Belum ada</td></tr>';return;}
        tbody.innerHTML=data.map(a=>`<tr><td><strong>${a.title}</strong></td><td>${a.category}</td><td>${a.layout_type}</td>
            <td><span class="status-badge ${a.is_published?'status-published':'status-draft'}">${a.is_published?'Published':'Draft'}</span></td>
            <td>${formatDate(a.created_at)}</td><td><div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick='showArticleForm(${JSON.stringify(a)})'><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteArticle('${a.id}')"><i class="fas fa-trash"></i></button></div></td></tr>`).join('');
    }catch(e){console.error(e);}
}
async function deleteArticle(id){if(!confirm('Hapus?'))return;await db.from('articles').delete().eq('id',id);showNotification('Dihapus!');loadAdminArticles();loadDashboardStats();}

// ============================================
// PROGRAMS (same as before)
// ============================================
function showProgramForm(p=null) {
    const f=document.getElementById('programForm');f.style.display='block';f.scrollIntoView({behavior:'smooth'});
    if(p){document.getElementById('programFormTitle').textContent='Edit Program';document.getElementById('programId').value=p.id;
        document.getElementById('programTitle').value=p.title;document.getElementById('programType').value=p.program_type;
        document.getElementById('programLevel').value=p.level;document.getElementById('programDuration').value=p.duration||'';
        document.getElementById('programSchedule').value=p.schedule||'';document.getElementById('programPrice').value=p.price||'';
        document.getElementById('programCover').value=p.cover_image||'';document.getElementById('programDesc').value=p.description;
        document.getElementById('programContent').value=p.content||'';document.getElementById('programFeatures').value=(p.features||[]).join(', ');
        document.getElementById('programActive').checked=p.is_active;const r=document.querySelector(`input[name="programLayout"][value="${p.layout_type}"]`);if(r)r.checked=true;
    }else{document.getElementById('programFormTitle').textContent='Tambah Program';document.getElementById('programId').value='';
        document.getElementById('programTitle').value='';document.getElementById('programDuration').value='';document.getElementById('programSchedule').value='';
        document.getElementById('programPrice').value='';document.getElementById('programCover').value='';document.getElementById('programDesc').value='';
        document.getElementById('programContent').value='';document.getElementById('programFeatures').value='';document.getElementById('programActive').checked=true;
        document.querySelector('input[name="programLayout"][value="card"]').checked=true;}
}
function hideProgramForm(){document.getElementById('programForm').style.display='none';}

async function saveProgram() {
    const title=document.getElementById('programTitle').value.trim();if(!title){showNotification('Nama harus diisi!','error');return;}
    const id=document.getElementById('programId').value;const layout=document.querySelector('input[name="programLayout"]:checked')?.value||'card';
    const features=document.getElementById('programFeatures').value.split(',').map(f=>f.trim()).filter(f=>f);
    const data={title,slug:generateSlug(title)+'-'+Date.now(),description:document.getElementById('programDesc').value,
        content:document.getElementById('programContent').value,program_type:document.getElementById('programType').value,
        level:document.getElementById('programLevel').value,duration:document.getElementById('programDuration').value,
        schedule:document.getElementById('programSchedule').value,price:document.getElementById('programPrice').value,
        cover_image:document.getElementById('programCover').value,layout_type:layout,features,
        is_active:document.getElementById('programActive').checked,updated_at:new Date().toISOString()};
    try{if(id){const{error}=await db.from('learning_programs').update(data).eq('id',id);if(error)throw error;showNotification('Diperbarui!');}
        else{const{error}=await db.from('learning_programs').insert(data);if(error)throw error;showNotification('Ditambahkan!');}
        hideProgramForm();loadAdminPrograms();loadDashboardStats();
    }catch(e){showNotification('Gagal: '+e.message,'error');}
}

async function loadAdminPrograms(){const tbody=document.getElementById('programsTableBody');if(!tbody)return;
    try{const{data}=await db.from('learning_programs').select('*').order('created_at',{ascending:false});
        if(!data?.length){tbody.innerHTML='<tr><td colspan="6" class="loading-cell">Belum ada</td></tr>';return;}
        tbody.innerHTML=data.map(p=>`<tr><td><strong>${p.title}</strong></td><td>${p.program_type}</td><td>${p.layout_type}</td>
            <td>${p.price||'-'}</td><td><span class="status-badge ${p.is_active?'status-published':'status-draft'}">${p.is_active?'Aktif':'Nonaktif'}</span></td>
            <td><div class="action-buttons"><button class="btn btn-sm btn-primary" onclick='showProgramForm(${JSON.stringify(p)})'><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteProgram('${p.id}')"><i class="fas fa-trash"></i></button></div></td></tr>`).join('');
    }catch(e){console.error(e);}
}
async function deleteProgram(id){if(!confirm('Hapus?'))return;await db.from('learning_programs').delete().eq('id',id);showNotification('Dihapus!');loadAdminPrograms();loadDashboardStats();}

// ============================================
// CLIENTS
// ============================================
function showClientForm(c=null){const f=document.getElementById('clientForm');f.style.display='block';f.scrollIntoView({behavior:'smooth'});
    if(c){document.getElementById('clientId').value=c.id;document.getElementById('clientName').value=c.client_name;
        document.getElementById('clientPhone').value=c.client_phone;document.getElementById('clientEmail').value=c.client_email||'';
        document.getElementById('clientDocType').value=c.document_type;document.getElementById('clientSourceLang').value=c.source_language;
        document.getElementById('clientTargetLang').value=c.target_language;document.getElementById('clientStatus').value=c.status;
        document.getElementById('clientNotes').value=c.notes||'';
    }else{document.getElementById('clientId').value='';document.getElementById('clientName').value='';
        document.getElementById('clientPhone').value='';document.getElementById('clientEmail').value='';document.getElementById('clientNotes').value='';}
}
function hideClientForm(){document.getElementById('clientForm').style.display='none';}

async function saveClient(){const name=document.getElementById('clientName').value.trim();const phone=document.getElementById('clientPhone').value.trim();
    if(!name||!phone){showNotification('Nama dan HP harus diisi!','error');return;}const id=document.getElementById('clientId').value;
    const data={client_name:name,client_phone:phone,client_email:document.getElementById('clientEmail').value,
        document_type:document.getElementById('clientDocType').value,source_language:document.getElementById('clientSourceLang').value,
        target_language:document.getElementById('clientTargetLang').value,status:document.getElementById('clientStatus').value,
        notes:document.getElementById('clientNotes').value,updated_at:new Date().toISOString()};
    try{if(id){const{error}=await db.from('translation_clients').update(data).eq('id',id);if(error)throw error;showNotification('Diperbarui!');}
        else{const{error}=await db.from('translation_clients').insert(data);if(error)throw error;showNotification('Ditambahkan!');}
        hideClientForm();loadAdminClients();loadDashboardStats();
    }catch(e){showNotification('Gagal: '+e.message,'error');}
}

async function loadAdminClients(){const tbody=document.getElementById('clientsTableBody');if(!tbody)return;
    try{const{data}=await db.from('translation_clients').select('*').order('created_at',{ascending:false});
        if(!data?.length){tbody.innerHTML='<tr><td colspan="7" class="loading-cell">Belum ada data</td></tr>';return;}
        tbody.innerHTML=data.map(c=>`<tr><td><strong>${c.client_name}</strong></td><td>${c.client_phone}</td><td>${c.document_type}</td>
            <td>${c.source_language}→${c.target_language}</td><td><span class="status-badge status-${c.status}">${c.status}</span></td>
            <td>${formatDate(c.created_at)}</td><td><div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick='showClientForm(${JSON.stringify(c)})'><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteClient('${c.id}')"><i class="fas fa-trash"></i></button></div></td></tr>`).join('');
    }catch(e){console.error(e);}
}
async function deleteClient(id){if(!confirm('Hapus?'))return;await db.from('translation_clients').delete().eq('id',id);showNotification('Dihapus!');loadAdminClients();loadDashboardStats();}

async function exportClients(){const{data}=await db.from('translation_clients').select('*').order('created_at',{ascending:false});
    if(!data?.length){showNotification('Tidak ada data!','error');return;}
    const h=['Nama','HP','Email','Dokumen','Bahasa Sumber','Bahasa Target','Status','Catatan','Tanggal'];
    const r=data.map(c=>[c.client_name,c.client_phone,c.client_email||'',c.document_type,c.source_language,c.target_language,c.status,c.notes||'',formatDate(c.created_at)]);
    const csv=[h,...r].map(r=>r.join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`klien-siec-${Date.now()}.csv`;a.click();showNotification('CSV downloaded!');}

// ============================================
// TRANSLATION DOCUMENTS (Upload PDF + QR)
// ============================================
function showTranslationForm(){const f=document.getElementById('translationForm');f.style.display='block';f.scrollIntoView({behavior:'smooth'});
    document.getElementById('transDocId').value='';document.getElementById('transClientName').value='';
    document.getElementById('transDocTitle').value='';document.getElementById('transNotes').value='';
    document.getElementById('transIssuedDate').value=new Date().toISOString().split('T')[0];
    transFileData=null;removeFile('trans');updateQrPreview('trans');
}
function hideTranslationForm(){document.getElementById('translationForm').style.display='none';}

async function saveTranslation() {
    const clientName = document.getElementById('transClientName').value.trim();
    const docTitle = document.getElementById('transDocTitle').value.trim();
    if (!clientName || !docTitle) { showNotification('Nama dan judul harus diisi!', 'error'); return; }

    const documentId = generateDocumentId('TR');
    const verifyUrl = `${window.location.origin}/verify.html?id=${documentId}&type=translation`;

    const qrPos = {
        x: document.getElementById('transQrX').value,
        y: document.getElementById('transQrY').value,
        size: document.getElementById('transQrSize').value,
        showQr: document.getElementById('transShowQr').checked,
        showId: document.getElementById('transShowId').checked
    };

    let fileUrl = '', fileName = '';

    // Upload file if exists
    if (transFileData) {
        try {
            showNotification('Mengupload file...', 'info');
            const result = await uploadFileToSupabase(transFileData, 'translations');
            fileUrl = result.url;
            fileName = result.name;
        } catch (err) {
            showNotification('Gagal upload file: ' + err.message, 'error');
            return;
        }
    }

    const data = {
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
        verified: true, status: 'valid'
    };

    try {
        const { error } = await db.from('translation_documents').insert(data);
        if (error) throw error;
        showNotification(`Dokumen disimpan! ID: ${documentId}`);
        hideTranslationForm();
        loadAdminTranslations();
        loadDashboardStats();
        showTranslationPrint(data);
    } catch (err) {
        showNotification('Gagal: ' + err.message, 'error');
    }
}

function showTranslationPrint(doc) {
    const pos = doc.qr_position ? JSON.parse(doc.qr_position) : { x:85, y:90, size:80, showQr:true, showId:true };
    const modal = document.getElementById('printPreview');
    const content = document.getElementById('printPreviewContent');
    const verifyUrl = `${window.location.origin}/verify.html?id=${doc.document_id}&type=translation`;

    content.innerHTML = `
        <div class="print-doc" id="printableDoc">
            <div class="print-doc-header">
                <img src="${LOGO_URL}" style="width:50px;height:50px;object-fit:contain;margin:0 auto 8px;display:block;"
                     onerror="this.style.display='none'">
                <div class="print-doc-logo">SIEC</div>
                <div style="font-size:1rem;font-weight:700;">Syaf Intensive English Course</div>
                <div class="print-doc-subtitle">Dokumen Terjemahan Resmi</div>
            </div>
            <div class="print-doc-body">
                <div class="print-doc-row"><span class="print-doc-label">ID Dokumen</span><span>: <strong>${doc.document_id}</strong></span></div>
                <div class="print-doc-row"><span class="print-doc-label">Nama Klien</span><span>: ${doc.client_name}</span></div>
                <div class="print-doc-row"><span class="print-doc-label">Judul</span><span>: ${doc.document_title}</span></div>
                <div class="print-doc-row"><span class="print-doc-label">Jenis</span><span>: ${doc.document_type}</span></div>
                <div class="print-doc-row"><span class="print-doc-label">Bahasa</span><span>: ${doc.source_language} → ${doc.target_language}</span></div>
                <div class="print-doc-row"><span class="print-doc-label">Tanggal</span><span>: ${formatDate(doc.issued_date)}</span></div>
                ${doc.file_name?`<div class="print-doc-row"><span class="print-doc-label">File</span><span>: ${doc.file_name}</span></div>`:''}
            </div>
            <div style="text-align:center;margin-top:24px;">
                <canvas id="printQrTrans"></canvas>
                ${pos.showId?`<div style="font-size:10px;font-weight:700;font-family:monospace;margin-top:4px;">${doc.document_id}</div>`:''}
                <div style="font-size:7px;color:#999;margin-top:2px;">Scan QR Code untuk verifikasi</div>
            </div>
            <div style="margin-top:40px;display:flex;justify-content:space-between;border-top:1px solid #ccc;padding-top:16px;">
                <div><div style="height:40px;"></div><div style="font-size:0.85rem;">Penerjemah</div></div>
                <div style="text-align:right;"><div style="height:40px;"></div><div style="font-size:0.85rem;">Administrator</div></div>
            </div>
        </div>
    `;

    modal.style.display = 'flex';

    setTimeout(() => {
        generateQrWithLogo('printQrTrans', verifyUrl, parseInt(pos.size) || 100);
    }, 200);
}

async function loadAdminTranslations() {
    const tbody = document.getElementById('translationsTableBody'); if (!tbody) return;
    try {
        const { data } = await db.from('translation_documents').select('*').order('created_at', { ascending: false });
        if (!data?.length) { tbody.innerHTML = '<tr><td colspan="7" class="loading-cell">Belum ada</td></tr>'; return; }
        tbody.innerHTML = data.map(d => `
            <tr>
                <td><strong style="color:var(--primary)">${d.document_id}</strong></td>
                <td>${d.client_name}</td>
                <td>${d.document_title}</td>
                <td>${d.source_language}→${d.target_language}</td>
                <td>${d.file_url
                    ? `<a href="${d.file_url}" target="_blank" class="file-badge"><i class="fas fa-file-pdf"></i> ${d.file_name||'PDF'}</a>`
                    : '<span class="no-file">-</span>'}</td>
                <td>${formatDate(d.issued_date)}</td>
                <td><div class="action-buttons">
                    <button class="btn btn-sm btn-success" onclick='showTranslationPrint(${JSON.stringify(d)})' title="Cetak"><i class="fas fa-print"></i></button>
                    ${d.file_url?`<a href="${d.file_url}" target="_blank" class="btn btn-sm btn-primary" title="Download"><i class="fas fa-download"></i></a>`:''}
                    <button class="btn btn-sm btn-danger" onclick="deleteTranslation('${d.id}')" title="Hapus"><i class="fas fa-trash"></i></button>
                </div></td>
            </tr>`).join('');
    } catch (e) { console.error(e); }
}
async function deleteTranslation(id) { if (!confirm('Hapus?')) return; await db.from('translation_documents').delete().eq('id', id); showNotification('Dihapus!'); loadAdminTranslations(); loadDashboardStats(); }

// ============================================
// STATUS TERJEMAHAN
// ============================================
function showStatusForm(s=null){const f=document.getElementById('statusForm');f.style.display='block';f.scrollIntoView({behavior:'smooth'});
    if(s){document.getElementById('statusId').value=s.id;document.getElementById('statusClientName').value=s.client_name;
        document.getElementById('statusClientPhone').value=s.client_phone;document.getElementById('statusDocType').value=s.document_type;
        document.getElementById('statusValue').value=s.status;document.getElementById('statusDesc').value=s.status_description||'';
        document.getElementById('statusEstimate').value=s.estimated_completion||'';
    }else{document.getElementById('statusId').value='';document.getElementById('statusClientName').value='';
        document.getElementById('statusClientPhone').value='';document.getElementById('statusDocType').value='';
        document.getElementById('statusValue').value='received';document.getElementById('statusDesc').value='';document.getElementById('statusEstimate').value='';}
}
function hideStatusForm(){document.getElementById('statusForm').style.display='none';}

async function saveStatus(){const name=document.getElementById('statusClientName').value.trim();const phone=document.getElementById('statusClientPhone').value.trim();
    if(!name||!phone){showNotification('Nama dan HP harus diisi!','error');return;}const id=document.getElementById('statusId').value;
    const data={client_name:name,client_phone:phone,document_type:document.getElementById('statusDocType').value,
        status:document.getElementById('statusValue').value,status_description:document.getElementById('statusDesc').value,
        estimated_completion:document.getElementById('statusEstimate').value||null,updated_at:new Date().toISOString()};
    try{if(id){const{error}=await db.from('translation_status').update(data).eq('id',id);if(error)throw error;showNotification('Diperbarui!');}
        else{data.tracking_code=generateTrackingCode();const{error}=await db.from('translation_status').insert(data);if(error)throw error;
            showNotification(`Kode: ${data.tracking_code}`);}
        hideStatusForm();loadAdminStatus();
    }catch(e){showNotification('Gagal: '+e.message,'error');}
}

async function loadAdminStatus(){const tbody=document.getElementById('statusTableBody');if(!tbody)return;
    try{const{data}=await db.from('translation_status').select('*').order('created_at',{ascending:false});
        if(!data?.length){tbody.innerHTML='<tr><td colspan="6" class="loading-cell">Belum ada</td></tr>';return;}
        tbody.innerHTML=data.map(s=>`<tr><td><strong style="color:var(--primary)">${s.tracking_code}</strong></td><td>${s.client_name}</td>
            <td>${s.document_type}</td><td><span class="status-badge status-${s.status}">${s.status}</span></td>
            <td>${s.estimated_completion?formatDate(s.estimated_completion):'-'}</td><td><div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick='showStatusForm(${JSON.stringify(s)})'><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteStatus('${s.id}')"><i class="fas fa-trash"></i></button></div></td></tr>`).join('');
    }catch(e){console.error(e);}
}
async function deleteStatus(id){if(!confirm('Hapus?'))return;await db.from('translation_status').delete().eq('id',id);showNotification('Dihapus!');loadAdminStatus();}

// ============================================
// TOEFL CERTIFICATES (Upload PDF + QR)
// ============================================
function showToeflForm(c=null){const f=document.getElementById('toeflForm');f.style.display='block';f.scrollIntoView({behavior:'smooth'});
    toeflFileData=null;removeFile('toefl');
    if(c){document.getElementById('toeflId').value=c.id;document.getElementById('toeflName').value=c.participant_name;
        document.getElementById('toeflTestDate').value=c.test_date;document.getElementById('toeflEmail').value=c.participant_email||'';
        document.getElementById('toeflPhone').value=c.participant_phone||'';document.getElementById('toeflListening').value=c.listening_score;
        document.getElementById('toeflStructure').value=c.structure_score;document.getElementById('toeflReading').value=c.reading_score;
        document.getElementById('toeflTotal').value=c.total_score;document.getElementById('toeflNotes').value=c.notes||'';
        if(c.qr_position){const p=JSON.parse(c.qr_position);
            document.getElementById('toeflQrX').value=p.x;document.getElementById('toeflQrY').value=p.y;
            document.getElementById('toeflQrSize').value=p.size;}
    }else{document.getElementById('toeflId').value='';document.getElementById('toeflName').value='';
        document.getElementById('toeflTestDate').value='';document.getElementById('toeflEmail').value='';
        document.getElementById('toeflPhone').value='';document.getElementById('toeflListening').value='';
        document.getElementById('toeflStructure').value='';document.getElementById('toeflReading').value='';
        document.getElementById('toeflTotal').value='';document.getElementById('toeflNotes').value='';
        loadSavedToeflPosition();}
    updateQrPreview('toefl');
}
function hideToeflForm(){document.getElementById('toeflForm').style.display='none';}

async function saveToefl() {
    const name = document.getElementById('toeflName').value.trim();
    const testDate = document.getElementById('toeflTestDate').value;
    if (!name || !testDate) { showNotification('Nama dan tanggal harus diisi!', 'error'); return; }

    const id = document.getElementById('toeflId').value;
    const l = parseInt(document.getElementById('toeflListening').value) || 0;
    const s = parseInt(document.getElementById('toeflStructure').value) || 0;
    const r = parseInt(document.getElementById('toeflReading').value) || 0;
    const total = Math.round((l + s + r) * 10 / 3);

    const qrPos = {
        x: document.getElementById('toeflQrX').value,
        y: document.getElementById('toeflQrY').value,
        size: document.getElementById('toeflQrSize').value,
        showQr: document.getElementById('toeflShowQr').checked,
        showId: document.getElementById('toeflShowId').checked
    };

    if (document.getElementById('toeflRememberPos')?.checked) {
        localStorage.setItem('siec_toefl_qr_pos', JSON.stringify(qrPos));
    }

    let fileUrl = '', fileName = '';
    if (toeflFileData) {
        try {
            showNotification('Mengupload file...', 'info');
            const result = await uploadFileToSupabase(toeflFileData, 'certificates');
            fileUrl = result.url;
            fileName = result.name;
        } catch (err) {
            showNotification('Gagal upload: ' + err.message, 'error');
            return;
        }
    }

    const certId = id ? null : generateDocumentId('TF');
    const verifyUrl = `${window.location.origin}/verify.html?id=${certId || ''}&type=toefl`;

    const data = {
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
        if (id) {
            const { error } = await db.from('toefl_certificates').update(data).eq('id', id);
            if (error) throw error;
            showNotification('Sertifikat diperbarui!');
        } else {
            data.certificate_id = certId;
            data.barcode_data = verifyUrl;
            const { error } = await db.from('toefl_certificates').insert(data);
            if (error) throw error;
            showNotification(`Sertifikat disimpan! ID: ${certId}`);
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
    const pos = cert.qr_position ? JSON.parse(cert.qr_position) : { x:85, y:90, size:80, showQr:true, showId:true };
    const modal = document.getElementById('certPrintModal');
    const content = document.getElementById('certPrintContent');
    const verifyUrl = `${window.location.origin}/verify.html?id=${cert.certificate_id}&type=toefl`;

    // Show download link if file exists
    const downloadLink = document.getElementById('certDownloadLink');
    if (cert.file_url && downloadLink) {
        downloadLink.href = cert.file_url;
        downloadLink.target = '_blank';
        downloadLink.style.display = 'inline-flex';
    }

    content.innerHTML = `
        <div style="text-align:center;padding:20px;">
            <p style="color:var(--gray-600);margin-bottom:16px;">
                Sertifikat <strong>${cert.certificate_id}</strong> untuk <strong>${cert.participant_name}</strong>
            </p>
            <p><strong>Score:</strong> L:${cert.listening_score} / S:${cert.structure_score} / R:${cert.reading_score} = <strong style="font-size:1.3rem;color:var(--primary)">${cert.total_score}</strong></p>

            ${cert.file_url ? `
                <div style="margin:20px 0;">
                    <iframe src="${cert.file_url}" style="width:100%;height:500px;border:2px solid var(--gray-300);border-radius:8px;"></iframe>
                </div>
            ` : ''}

            <div style="margin:20px 0;">
                <p style="font-size:0.85rem;color:var(--gray-600);margin-bottom:8px;">QR Code Verifikasi:</p>
                <canvas id="printQrToefl"></canvas>
                ${pos.showId ? `<div style="font-size:10px;font-weight:700;font-family:monospace;margin-top:4px;">${cert.certificate_id}</div>` : ''}
                <div style="font-size:8px;color:#999;margin-top:2px;">Scan untuk verifikasi keaslian</div>
            </div>
        </div>
    `;

    modal.style.display = 'flex';

    setTimeout(() => {
        generateQrWithLogo('printQrToefl', verifyUrl, parseInt(pos.size) || 120);
    }, 200);
}

async function loadAdminToefl() {
    const tbody = document.getElementById('toeflTableBody'); if (!tbody) return;
    try {
        const { data } = await db.from('toefl_certificates').select('*').order('created_at', { ascending: false });
        if (!data?.length) { tbody.innerHTML = '<tr><td colspan="7" class="loading-cell">Belum ada</td></tr>'; return; }
        tbody.innerHTML = data.map(c => `
            <tr>
                <td><strong style="color:var(--primary)">${c.certificate_id}</strong></td>
                <td>${c.participant_name}</td>
                <td>${formatDate(c.test_date)}</td>
                <td>${c.listening_score}/${c.structure_score}/${c.reading_score}</td>
                <td><strong style="font-size:1.1rem;color:var(--primary)">${c.total_score}</strong></td>
                <td>${c.file_url
                    ? `<a href="${c.file_url}" target="_blank" class="file-badge"><i class="fas fa-file-pdf"></i> PDF</a>`
                    : '<span class="no-file">-</span>'}</td>
                <td><div class="action-buttons">
                    <button class="btn btn-sm btn-success" onclick='showCertPrint(${JSON.stringify(c)})' title="Preview"><i class="fas fa-eye"></i></button>
                    ${c.file_url ? `<a href="${c.file_url}" target="_blank" class="btn btn-sm btn-primary" title="Download"><i class="fas fa-download"></i></a>` : ''}
                    <button class="btn btn-sm btn-warning" onclick='showToeflForm(${JSON.stringify(c)})' title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteToefl('${c.id}')" title="Hapus"><i class="fas fa-trash"></i></button>
                </div></td>
            </tr>`).join('');
    } catch (e) { console.error(e); }
}
async function deleteToefl(id) { if (!confirm('Hapus?')) return; await db.from('toefl_certificates').delete().eq('id', id); showNotification('Dihapus!'); loadAdminToefl(); loadDashboardStats(); }