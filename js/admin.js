// ============================================
// SIEC - Admin Dashboard (Lengkap)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const admin = checkAuth();
    if (!admin) return;

    document.getElementById('adminName').textContent = admin.full_name;

    // Sidebar navigation
    document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection(link.dataset.section);
        });
    });

    // Sidebar mobile toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        document.getElementById('adminSidebar').classList.toggle('active');
    });
    document.getElementById('sidebarClose')?.addEventListener('click', () => {
        document.getElementById('adminSidebar').classList.remove('active');
    });

    // Load semua data
    loadDashboardStats();
    loadAdminArticles();
    loadAdminPrograms();
    loadAdminClients();
    loadAdminTranslations();
    loadAdminStatus();
    loadAdminToefl();

    // Load posisi barcode tersimpan untuk TOEFL
    loadSavedToeflPosition();

    // Init barcode preview
    updateBarcodePreview('trans');
    updateBarcodePreview('toefl');
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
        'dashboard': 'Dashboard',
        'articles': 'Kelola Artikel',
        'programs': 'Program Belajar',
        'translation-clients': 'Laporan Pengguna Jasa',
        'translations': 'Dokumen Terjemahan',
        'translation-status': 'Status Penerjemahan',
        'toefl': 'Sertifikat TOEFL Prediction'
    };
    document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';
    document.getElementById('adminSidebar').classList.remove('active');
}

// ============================================
// DASHBOARD STATS
// ============================================
async function loadDashboardStats() {
    try {
        const [a, c, t, cert, p] = await Promise.all([
            db.from('articles').select('*', { count: 'exact', head: true }),
            db.from('translation_clients').select('*', { count: 'exact', head: true }),
            db.from('translation_documents').select('*', { count: 'exact', head: true }),
            db.from('toefl_certificates').select('*', { count: 'exact', head: true }),
            db.from('learning_programs').select('*', { count: 'exact', head: true }).eq('is_active', true)
        ]);
        document.getElementById('totalArticles').textContent = a.count || 0;
        document.getElementById('totalClients').textContent = c.count || 0;
        document.getElementById('totalTranslations').textContent = t.count || 0;
        document.getElementById('totalCertificates').textContent = cert.count || 0;
        document.getElementById('totalPrograms').textContent = p.count || 0;
    } catch (err) { console.error(err); }
}

// ============================================
// UTILITY
// ============================================
function filterTable(input, tbodyId) {
    const search = input.value.toLowerCase();
    const rows = document.querySelectorAll(`#${tbodyId} tr`);
    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(search) ? '' : 'none';
    });
}

function insertTag(tag) {
    const textarea = document.getElementById('articleContent');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const replacement = `<${tag}>${selected}</${tag}>`;
    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.focus();
}

function togglePreview() {
    const content = document.getElementById('articleContent').value;
    const preview = document.getElementById('articlePreview');
    if (preview.style.display === 'none') {
        preview.innerHTML = content;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
}

function closePrintPreview(id) {
    document.getElementById(id).style.display = 'none';
}

// ============================================
// BARCODE POSITION PREVIEW
// ============================================
function updateBarcodePreview(type) {
    const prefix = type === 'trans' ? 'trans' : 'toefl';
    const x = document.getElementById(`${prefix}BarcodeX`)?.value || 70;
    const y = document.getElementById(`${prefix}BarcodeY`)?.value || 85;
    const size = document.getElementById(`${prefix}BarcodeSize`)?.value || 100;
    const showBarcode = document.getElementById(`${prefix}ShowBarcode`)?.checked ?? true;
    const showId = document.getElementById(`${prefix}ShowId`)?.checked ?? true;

    // Update labels
    const xEl = document.getElementById(`${prefix}BarcodeXVal`);
    const yEl = document.getElementById(`${prefix}BarcodeYVal`);
    const sizeEl = document.getElementById(`${prefix}BarcodeSizeVal`);
    if (xEl) xEl.textContent = x + '%';
    if (yEl) yEl.textContent = y + '%';
    if (sizeEl) sizeEl.textContent = size + 'px';

    // Update preview position
    const overlay = document.getElementById(`${prefix}BarcodePreview`);
    if (overlay) {
        overlay.style.left = x + '%';
        overlay.style.top = y + '%';
        overlay.style.transform = 'translate(-50%, -50%)';
    }

    // Update barcode SVG
    const barcodeEl = document.getElementById(`${prefix}BarcodeImg`);
    if (barcodeEl && showBarcode) {
        barcodeEl.style.display = 'block';
        const sampleId = type === 'trans' ? 'SIEC-TR-2024-0001' : 'SIEC-TF-2024-0001';
        try {
            JsBarcode(`#${prefix}BarcodeImg`, sampleId, {
                format: "CODE128",
                width: 1,
                height: Math.max(20, size * 0.3),
                displayValue: false,
                margin: 2
            });
            barcodeEl.style.width = (size * 0.8) + 'px';
        } catch(e) {}
    } else if (barcodeEl) {
        barcodeEl.style.display = 'none';
    }

    // Update ID text
    const idEl = document.getElementById(`${prefix}IdText`);
    if (idEl) {
        idEl.style.display = showId ? 'block' : 'none';
    }
}

// ============================================
// TOEFL POSITION MEMORY
// ============================================
function saveToeflPosition() {
    const remember = document.getElementById('toeflRememberPos')?.checked;
    if (!remember) return;
    const pos = {
        x: document.getElementById('toeflBarcodeX').value,
        y: document.getElementById('toeflBarcodeY').value,
        size: document.getElementById('toeflBarcodeSize').value,
        showBarcode: document.getElementById('toeflShowBarcode').checked,
        showId: document.getElementById('toeflShowId').checked
    };
    localStorage.setItem('siec_toefl_barcode_pos', JSON.stringify(pos));
    showNotification('Posisi barcode disimpan!');
}

function loadSavedToeflPosition() {
    const saved = localStorage.getItem('siec_toefl_barcode_pos');
    if (!saved) return;
    try {
        const pos = JSON.parse(saved);
        document.getElementById('toeflBarcodeX').value = pos.x;
        document.getElementById('toeflBarcodeY').value = pos.y;
        document.getElementById('toeflBarcodeSize').value = pos.size;
        document.getElementById('toeflShowBarcode').checked = pos.showBarcode;
        document.getElementById('toeflShowId').checked = pos.showId;
        updateBarcodePreview('toefl');
    } catch(e) {}
}

function resetToeflPosition() {
    document.getElementById('toeflBarcodeX').value = 70;
    document.getElementById('toeflBarcodeY').value = 85;
    document.getElementById('toeflBarcodeSize').value = 100;
    document.getElementById('toeflShowBarcode').checked = true;
    document.getElementById('toeflShowId').checked = true;
    localStorage.removeItem('siec_toefl_barcode_pos');
    updateBarcodePreview('toefl');
    showNotification('Posisi di-reset!');
}

function calculateToeflTotal() {
    const l = parseFloat(document.getElementById('toeflListening').value) || 0;
    const s = parseFloat(document.getElementById('toeflStructure').value) || 0;
    const r = parseFloat(document.getElementById('toeflReading').value) || 0;
    const total = Math.round((l + s + r) * 10 / 3);
    document.getElementById('toeflTotal').value = total;
}

// ============================================
// ARTICLES
// ============================================
function showArticleForm(article = null) {
    const form = document.getElementById('articleForm');
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
    if (article) {
        document.getElementById('articleFormTitle').textContent = 'Edit Artikel';
        document.getElementById('articleId').value = article.id;
        document.getElementById('articleTitle').value = article.title;
        document.getElementById('articleCategory').value = article.category;
        document.getElementById('articleCover').value = article.cover_image || '';
        document.getElementById('articleExcerpt').value = article.excerpt || '';
        document.getElementById('articleContent').value = article.content;
        document.getElementById('articlePublished').checked = article.is_published;
        document.querySelector(`input[name="articleLayout"][value="${article.layout_type}"]`).checked = true;
    } else {
        document.getElementById('articleFormTitle').textContent = 'Tambah Artikel Baru';
        document.getElementById('articleId').value = '';
        document.getElementById('articleTitle').value = '';
        document.getElementById('articleCover').value = '';
        document.getElementById('articleExcerpt').value = '';
        document.getElementById('articleContent').value = '';
        document.getElementById('articlePublished').checked = false;
        document.querySelector('input[name="articleLayout"][value="standard"]').checked = true;
    }
}

function hideArticleForm() {
    document.getElementById('articleForm').style.display = 'none';
    document.getElementById('articlePreview').style.display = 'none';
}

async function saveArticle() {
    const title = document.getElementById('articleTitle').value.trim();
    if (!title) { showNotification('Judul harus diisi!', 'error'); return; }

    const layout = document.querySelector('input[name="articleLayout"]:checked')?.value || 'standard';
    const id = document.getElementById('articleId').value;
    const isPublished = document.getElementById('articlePublished').checked;

    const data = {
        title,
        slug: generateSlug(title) + '-' + Date.now(),
        content: document.getElementById('articleContent').value,
        excerpt: document.getElementById('articleExcerpt').value,
        cover_image: document.getElementById('articleCover').value,
        layout_type: layout,
        category: document.getElementById('articleCategory').value,
        is_published: isPublished,
        published_at: isPublished ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
    };

    try {
        if (id) {
            const { error } = await db.from('articles').update(data).eq('id', id);
            if (error) throw error;
            showNotification('Artikel berhasil diperbarui!');
        } else {
            const { error } = await db.from('articles').insert(data);
            if (error) throw error;
            showNotification('Artikel berhasil ditambahkan!');
        }
        hideArticleForm();
        loadAdminArticles();
        loadDashboardStats();
    } catch (err) {
        showNotification('Gagal: ' + err.message, 'error');
    }
}

async function loadAdminArticles() {
    const tbody = document.getElementById('articlesTableBody');
    if (!tbody) return;
    try {
        const { data, error } = await db.from('articles').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        if (!data?.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Belum ada artikel</td></tr>';
            return;
        }
        tbody.innerHTML = data.map(a => `
            <tr>
                <td><strong>${a.title}</strong></td>
                <td>${a.category}</td>
                <td><span class="status-badge status-draft">${a.layout_type}</span></td>
                <td><span class="status-badge ${a.is_published ? 'status-published' : 'status-draft'}">
                    ${a.is_published ? 'Published' : 'Draft'}</span></td>
                <td>${formatDate(a.created_at)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" 
                            onclick='showArticleForm(${JSON.stringify(a)})'>
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteArticle('${a.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) { console.error(err); }
}

async function deleteArticle(id) {
    if (!confirm('Hapus artikel ini?')) return;
    await db.from('articles').delete().eq('id', id);
    showNotification('Artikel dihapus!');
    loadAdminArticles();
    loadDashboardStats();
}

// ============================================
// PROGRAMS
// ============================================
function showProgramForm(program = null) {
    const form = document.getElementById('programForm');
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
    if (program) {
        document.getElementById('programFormTitle').textContent = 'Edit Program';
        document.getElementById('programId').value = program.id;
        document.getElementById('programTitle').value = program.title;
        document.getElementById('programType').value = program.program_type;
        document.getElementById('programLevel').value = program.level;
        document.getElementById('programDuration').value = program.duration || '';
        document.getElementById('programSchedule').value = program.schedule || '';
        document.getElementById('programPrice').value = program.price || '';
        document.getElementById('programCover').value = program.cover_image || '';
        document.getElementById('programDesc').value = program.description;
        document.getElementById('programContent').value = program.content || '';
        document.getElementById('programFeatures').value = (program.features || []).join(', ');
        document.getElementById('programActive').checked = program.is_active;
        const layout = program.layout_type || 'card';
        const radio = document.querySelector(`input[name="programLayout"][value="${layout}"]`);
        if (radio) radio.checked = true;
    } else {
        document.getElementById('programFormTitle').textContent = 'Tambah Program Baru';
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
        document.querySelector('input[name="programLayout"][value="card"]').checked = true;
    }
}

function hideProgramForm() {
    document.getElementById('programForm').style.display = 'none';
}

async function saveProgram() {
    const title = document.getElementById('programTitle').value.trim();
    if (!title) { showNotification('Nama program harus diisi!', 'error'); return; }

    const id = document.getElementById('programId').value;
    const layout = document.querySelector('input[name="programLayout"]:checked')?.value || 'card';
    const features = document.getElementById('programFeatures').value
        .split(',').map(f => f.trim()).filter(f => f);

    const data = {
        title,
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
        features,
        is_active: document.getElementById('programActive').checked,
        updated_at: new Date().toISOString()
    };

    try {
        if (id) {
            const { error } = await db.from('learning_programs').update(data).eq('id', id);
            if (error) throw error;
            showNotification('Program diperbarui!');
        } else {
            const { error } = await db.from('learning_programs').insert(data);
            if (error) throw error;
            showNotification('Program ditambahkan!');
        }
        hideProgramForm();
        loadAdminPrograms();
        loadDashboardStats();
    } catch (err) {
        showNotification('Gagal: ' + err.message, 'error');
    }
}

async function loadAdminPrograms() {
    const tbody = document.getElementById('programsTableBody');
    if (!tbody) return;
    try {
        const { data } = await db.from('learning_programs').select('*').order('created_at', { ascending: false });
        if (!data?.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Belum ada program</td></tr>';
            return;
        }
        tbody.innerHTML = data.map(p => `
            <tr>
                <td><strong>${p.title}</strong></td>
                <td>${p.program_type}</td>
                <td><span class="status-badge status-draft">${p.layout_type}</span></td>
                <td>${p.price || '-'}</td>
                <td><span class="status-badge ${p.is_active ? 'status-published' : 'status-draft'}">
                    ${p.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" 
                            onclick='showProgramForm(${JSON.stringify(p)})'>
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProgram('${p.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) { console.error(err); }
}

async function deleteProgram(id) {
    if (!confirm('Hapus program?')) return;
    await db.from('learning_programs').delete().eq('id', id);
    showNotification('Program dihapus!');
    loadAdminPrograms();
    loadDashboardStats();
}

// ============================================
// TRANSLATION CLIENTS (Laporan Pengguna Jasa)
// ============================================
function showClientForm(client = null) {
    const form = document.getElementById('clientForm');
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
    if (client) {
        document.getElementById('clientId').value = client.id;
        document.getElementById('clientName').value = client.client_name;
        document.getElementById('clientPhone').value = client.client_phone;
        document.getElementById('clientEmail').value = client.client_email || '';
        document.getElementById('clientDocType').value = client.document_type;
        document.getElementById('clientSourceLang').value = client.source_language;
        document.getElementById('clientTargetLang').value = client.target_language;
        document.getElementById('clientStatus').value = client.status;
        document.getElementById('clientNotes').value = client.notes || '';
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
    const name = document.getElementById('clientName').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    if (!name || !phone) {
        showNotification('Nama dan no. HP harus diisi!', 'error');
        return;
    }
    const id = document.getElementById('clientId').value;
    const data = {
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
        if (id) {
            const { error } = await db.from('translation_clients').update(data).eq('id', id);
            if (error) throw error;
            showNotification('Data klien diperbarui!');
        } else {
            const { error } = await db.from('translation_clients').insert(data);
            if (error) throw error;
            showNotification('Data klien ditambahkan!');
        }
        hideClientForm();
        loadAdminClients();
        loadDashboardStats();
    } catch (err) {
        showNotification('Gagal: ' + err.message, 'error');
    }
}

async function loadAdminClients() {
    const tbody = document.getElementById('clientsTableBody');
    if (!tbody) return;
    try {
        const { data } = await db.from('translation_clients').select('*').order('created_at', { ascending: false });
        if (!data?.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading-cell">Belum ada data</td></tr>';
            return;
        }
        tbody.innerHTML = data.map(c => `
            <tr>
                <td><strong>${c.client_name}</strong></td>
                <td>${c.client_phone}</td>
                <td>${c.document_type}</td>
                <td>${c.source_language} → ${c.target_language}</td>
                <td><span class="status-badge status-${c.status}">${c.status}</span></td>
                <td>${formatDate(c.created_at)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" 
                            onclick='showClientForm(${JSON.stringify(c)})'>
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteClient('${c.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) { console.error(err); }
}

async function deleteClient(id) {
    if (!confirm('Hapus data klien?')) return;
    await db.from('translation_clients').delete().eq('id', id);
    showNotification('Data klien dihapus!');
    loadAdminClients();
    loadDashboardStats();
}

async function exportClients() {
    const { data } = await db.from('translation_clients').select('*').order('created_at', { ascending: false });
    if (!data?.length) { showNotification('Tidak ada data!', 'error'); return; }
    const headers = ['Nama','No HP','Email','Jenis Dokumen','Bahasa Sumber','Bahasa Target','Status','Catatan','Tanggal'];
    const rows = data.map(c => [
        c.client_name, c.client_phone, c.client_email || '',
        c.document_type, c.source_language, c.target_language,
        c.status, c.notes || '', formatDate(c.created_at)
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `laporan-klien-siec-${Date.now()}.csv`;
    a.click();
    showNotification('File CSV berhasil didownload!');
}

// ============================================
// TRANSLATION DOCUMENTS
// ============================================
function showTranslationForm() {
    const form = document.getElementById('translationForm');
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('transDocId').value = '';
    document.getElementById('transClientName').value = '';
    document.getElementById('transDocTitle').value = '';
    document.getElementById('transNotes').value = '';
    document.getElementById('transIssuedDate').value = new Date().toISOString().split('T')[0];
    updateBarcodePreview('trans');
}

function hideTranslationForm() {
    document.getElementById('translationForm').style.display = 'none';
}

async function saveTranslation() {
    const clientName = document.getElementById('transClientName').value.trim();
    const docTitle = document.getElementById('transDocTitle').value.trim();
    if (!clientName || !docTitle) {
        showNotification('Nama klien dan judul dokumen harus diisi!', 'error');
        return;
    }

    const documentId = generateDocumentId('TR');
    const barcodePos = {
        x: document.getElementById('transBarcodeX').value,
        y: document.getElementById('transBarcodeY').value,
        size: document.getElementById('transBarcodeSize').value,
        showBarcode: document.getElementById('transShowBarcode').checked,
        showId: document.getElementById('transShowId').checked
    };

    const data = {
        document_id: documentId,
        client_name: clientName,
        document_title: docTitle,
        source_language: document.getElementById('transSourceLang').value,
        target_language: document.getElementById('transTargetLang').value,
        document_type: document.getElementById('transDocType').value,
        barcode_data: documentId,
        barcode_position: JSON.stringify(barcodePos),
        issued_date: document.getElementById('transIssuedDate').value,
        notes: document.getElementById('transNotes').value,
        verified: true,
        status: 'valid'
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
    const pos = doc.barcode_position ? JSON.parse(doc.barcode_position) : { x: 70, y: 85, size: 100, showBarcode: true, showId: true };
    const modal = document.getElementById('printPreview');
    const content = document.getElementById('printPreviewContent');

    content.innerHTML = `
        <div class="print-doc" id="printableDoc">
            <div class="print-doc-header">
                <div class="print-doc-logo">SIEC</div>
                <div style="font-size:1rem;font-weight:700;color:var(--dark);">
                    Syaf Intensive English Course
                </div>
                <div class="print-doc-subtitle">
                    Dokumen Terjemahan Resmi
                </div>
            </div>
            <div class="print-doc-body">
                <div class="print-doc-row">
                    <span class="print-doc-label">ID Dokumen</span>
                    <span>: <strong>${doc.document_id}</strong></span>
                </div>
                <div class="print-doc-row">
                    <span class="print-doc-label">Nama Klien</span>
                    <span>: ${doc.client_name}</span>
                </div>
                <div class="print-doc-row">
                    <span class="print-doc-label">Judul Dokumen</span>
                    <span>: ${doc.document_title}</span>
                </div>
                <div class="print-doc-row">
                    <span class="print-doc-label">Jenis Dokumen</span>
                    <span>: ${doc.document_type}</span>
                </div>
                <div class="print-doc-row">
                    <span class="print-doc-label">Bahasa</span>
                    <span>: ${doc.source_language} → ${doc.target_language}</span>
                </div>
                <div class="print-doc-row">
                    <span class="print-doc-label">Tanggal Terbit</span>
                    <span>: ${formatDate(doc.issued_date)}</span>
                </div>
                ${doc.notes ? `
                <div class="print-doc-row">
                    <span class="print-doc-label">Catatan</span>
                    <span>: ${doc.notes}</span>
                </div>` : ''}
            </div>

            <!-- Barcode & ID -->
            <div style="position:relative;margin-top:24px;min-height:80px;">
                <div style="position:absolute;left:${pos.x}%;top:0;transform:translateX(-50%);text-align:center;">
                    ${pos.showBarcode ? `<svg id="printBarcodeTrans"></svg>` : ''}
                    ${pos.showId ? `<div style="font-size:10px;font-weight:700;font-family:monospace;margin-top:4px;">
                        ${doc.document_id}
                    </div>` : ''}
                    <div style="font-size:8px;color:var(--gray-500);margin-top:2px;">
                        Verifikasi: ${window.location.origin}/verify.html?id=${doc.document_id}
                    </div>
                </div>
            </div>

            <div style="margin-top:60px;display:flex;justify-content:space-between;
                        border-top:1px solid #ccc;padding-top:16px;">
                <div>
                    <div style="height:40px;"></div>
                    <div style="font-size:0.85rem;">Penerjemah</div>
                </div>
                <div style="text-align:right;">
                    <div style="height:40px;"></div>
                    <div style="font-size:0.85rem;">Administrator</div>
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'flex';

    // Generate barcode
    if (pos.showBarcode) {
        setTimeout(() => {
            try {
                JsBarcode('#printBarcodeTrans', doc.document_id, {
                    format: "CODE128",
                    width: 2,
                    height: 50,
                    displayValue: true,
                    fontSize: 10,
                    margin: 5
                });
            } catch(e) {}
        }, 100);
    }
}

async function loadAdminTranslations() {
    const tbody = document.getElementById('translationsTableBody');
    if (!tbody) return;
    try {
        const { data } = await db.from('translation_documents').select('*').order('created_at', { ascending: false });
        if (!data?.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Belum ada dokumen</td></tr>';
            return;
        }
        tbody.innerHTML = data.map(d => `
            <tr>
                <td><strong style="color:var(--primary);">${d.document_id}</strong></td>
                <td>${d.client_name}</td>
                <td>${d.document_title}</td>
                <td>${d.source_language} → ${d.target_language}</td>
                <td>${formatDate(d.issued_date)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-success" 
                            onclick='showTranslationPrint(${JSON.stringify(d)})' title="Cetak">
                            <i class="fas fa-print"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" 
                            onclick="deleteTranslation('${d.id}')" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) { console.error(err); }
}

async function deleteTranslation(id) {
    if (!confirm('Hapus dokumen ini?')) return;
    await db.from('translation_documents').delete().eq('id', id);
    showNotification('Dokumen dihapus!');
    loadAdminTranslations();
    loadDashboardStats();
}

// ============================================
// TRANSLATION STATUS
// ============================================
function showStatusForm(status = null) {
    const form = document.getElementById('statusForm');
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
    if (status) {
        document.getElementById('statusId').value = status.id;
        document.getElementById('statusClientName').value = status.client_name;
        document.getElementById('statusClientPhone').value = status.client_phone;
        document.getElementById('statusDocType').value = status.document_type;
        document.getElementById('statusValue').value = status.status;
        document.getElementById('statusDesc').value = status.status_description || '';
        document.getElementById('statusEstimate').value = status.estimated_completion || '';
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
    const name = document.getElementById('statusClientName').value.trim();
    const phone = document.getElementById('statusClientPhone').value.trim();
    if (!name || !phone) {
        showNotification('Nama dan no. HP harus diisi!', 'error');
        return;
    }
    const id = document.getElementById('statusId').value;
    const data = {
        client_name: name,
        client_phone: phone,
        document_type: document.getElementById('statusDocType').value,
        status: document.getElementById('statusValue').value,
        status_description: document.getElementById('statusDesc').value,
        estimated_completion: document.getElementById('statusEstimate').value || null,
        updated_at: new Date().toISOString()
    };
    try {
        if (id) {
            const { error } = await db.from('translation_status').update(data).eq('id', id);
            if (error) throw error;
            showNotification('Status diperbarui!');
        } else {
            data.tracking_code = generateTrackingCode();
            const { error } = await db.from('translation_status').insert(data);
            if (error) throw error;
            showNotification(`Status ditambahkan! Kode: ${data.tracking_code}`);
        }
        hideStatusForm();
        loadAdminStatus();
    } catch (err) {
        showNotification('Gagal: ' + err.message, 'error');
    }
}

async function loadAdminStatus() {
    const tbody = document.getElementById('statusTableBody');
    if (!tbody) return;
    try {
        const { data } = await db.from('translation_status').select('*').order('created_at', { ascending: false });
        if (!data?.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Belum ada status</td></tr>';
            return;
        }
        tbody.innerHTML = data.map(s => `
            <tr>
                <td><strong style="color:var(--primary);">${s.tracking_code}</strong></td>
                <td>${s.client_name}</td>
                <td>${s.document_type}</td>
                <td><span class="status-badge status-${s.status}">${s.status}</span></td>
                <td>${s.estimated_completion ? formatDate(s.estimated_completion) : '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" 
                            onclick='showStatusForm(${JSON.stringify(s)})'>
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteStatus('${s.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) { console.error(err); }
}

async function deleteStatus(id) {
    if (!confirm('Hapus status?')) return;
    await db.from('translation_status').delete().eq('id', id);
    showNotification('Status dihapus!');
    loadAdminStatus();
}

// ============================================
// TOEFL CERTIFICATES
// ============================================
function showToeflForm(cert = null) {
    const form = document.getElementById('toeflForm');
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
    if (cert) {
        document.getElementById('toeflId').value = cert.id;
        document.getElementById('toeflName').value = cert.participant_name;
        document.getElementById('toeflTestDate').value = cert.test_date;
        document.getElementById('toeflEmail').value = cert.participant_email || '';
        document.getElementById('toeflPhone').value = cert.participant_phone || '';
        document.getElementById('toeflListening').value = cert.listening_score;
        document.getElementById('toeflStructure').value = cert.structure_score;
        document.getElementById('toeflReading').value = cert.reading_score;
        document.getElementById('toeflTotal').value = cert.total_score;
        document.getElementById('toeflNotes').value = cert.notes || '';
        if (cert.barcode_position) {
            const pos = JSON.parse(cert.barcode_position);
            document.getElementById('toeflBarcodeX').value = pos.x;
            document.getElementById('toeflBarcodeY').value = pos.y;
            document.getElementById('toeflBarcodeSize').value = pos.size;
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
    updateBarcodePreview('toefl');
}

function hideToeflForm() {
    document.getElementById('toeflForm').style.display = 'none';
}

async function saveToefl() {
    const name = document.getElementById('toeflName').value.trim();
    const testDate = document.getElementById('toeflTestDate').value;
    if (!name || !testDate) {
        showNotification('Nama dan tanggal tes harus diisi!', 'error');
        return;
    }

    const id = document.getElementById('toeflId').value;
    const l = parseInt(document.getElementById('toeflListening').value) || 0;
    const s = parseInt(document.getElementById('toeflStructure').value) || 0;
    const r = parseInt(document.getElementById('toeflReading').value) || 0;
    const total = Math.round((l + s + r) * 10 / 3);

    const barcodePos = {
        x: document.getElementById('toeflBarcodeX').value,
        y: document.getElementById('toeflBarcodeY').value,
        size: document.getElementById('toeflBarcodeSize').value,
        showBarcode: document.getElementById('toeflShowBarcode').checked,
        showId: document.getElementById('toeflShowId').checked
    };

    // Simpan posisi jika dicentang
    if (document.getElementById('toeflRememberPos')?.checked) {
        localStorage.setItem('siec_toefl_barcode_pos', JSON.stringify(barcodePos));
    }

    const certId = id ? null : generateDocumentId('TF');

    const data = {
        participant_name: name,
        test_date: testDate,
        participant_email: document.getElementById('toeflEmail').value,
        participant_phone: document.getElementById('toeflPhone').value,
        listening_score: l,
        structure_score: s,
        reading_score: r,
        total_score: total,
        barcode_position: JSON.stringify(barcodePos),
        notes: document.getElementById('toeflNotes').value,
        verified: true,
        status: 'valid'
    };

    try {
        if (id) {
            const { error } = await db.from('toefl_certificates').update(data).eq('id', id);
            if (error) throw error;
            showNotification('Sertifikat diperbarui!');
        } else {
            data.certificate_id = certId;
            data.barcode_data = certId;
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
    const pos = cert.barcode_position
        ? JSON.parse(cert.barcode_position)
        : { x: 70, y: 85, size: 100, showBarcode: true, showId: true };

    const modal = document.getElementById('certPrintModal');
    const content = document.getElementById('certPrintContent');

    content.innerHTML = `
        <div class="toefl-cert" id="printableCert">
            <div class="toefl-cert-header">
                <div class="toefl-cert-logo">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <div class="toefl-cert-title">Certificate of Achievement</div>
                <div class="toefl-cert-main-title">TOEFL Prediction Test</div>
                <div style="font-size:0.9rem;color:var(--gray-600);">
                    Syaf Intensive English Course (SIEC)
                </div>
            </div>

            <div style="font-size:0.9rem;color:var(--gray-600);margin-bottom:8px;">
                This certifies that
            </div>
            <div class="toefl-cert-name">${cert.participant_name}</div>

            <div style="font-size:0.9rem;color:var(--gray-600);margin-bottom:16px;">
                has successfully completed the TOEFL Prediction Test on
                <strong>${formatDate(cert.test_date)}</strong>
                with the following scores:
            </div>

            <div class="toefl-scores-grid">
                <div class="toefl-score-item">
                    <div class="toefl-score-label">Listening</div>
                    <span class="toefl-score-value">${cert.listening_score}</span>
                </div>
                <div class="toefl-score-item">
                    <div class="toefl-score-label">Structure</div>
                    <span class="toefl-score-value">${cert.structure_score}</span>
                </div>
                <div class="toefl-score-item">
                    <div class="toefl-score-label">Reading</div>
                    <span class="toefl-score-value">${cert.reading_score}</span>
                </div>
            </div>

            <div class="toefl-total-box">
                <div class="toefl-total-label">Total Score</div>
                <span class="toefl-total-value">${cert.total_score}</span>
            </div>

            <div class="toefl-cert-footer">
                <div class="toefl-date">
                    <div style="height:40px;border-bottom:1px solid #333;width:150px;"></div>
                    <div>Authorized Signature</div>
                    <div style="font-weight:700;">SIEC Administrator</div>
                </div>
                <div class="toefl-barcode-area">
                    ${pos.showBarcode ? `<svg id="printBarcodeToefl"></svg>` : ''}
                    ${pos.showId ? `
                        <div style="font-size:9px;font-family:monospace;font-weight:700;
                                    text-align:center;margin-top:4px;">
                            ${cert.certificate_id}
                        </div>
                    ` : ''}
                    <div style="font-size:7px;color:var(--gray-500);text-align:center;margin-top:2px;">
                        Verify: ${window.location.origin}/verify.html?id=${cert.certificate_id}&type=toefl
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'flex';

    if (pos.showBarcode) {
        setTimeout(() => {
            try {
                JsBarcode('#printBarcodeToefl', cert.certificate_id, {
                    format: "CODE128",
                    width: 1.5,
                    height: 40,
                    displayValue: false,
                    margin: 3
                });
            } catch(e) {}
        }, 100);
    }
}

async function loadAdminToefl() {
    const tbody = document.getElementById('toeflTableBody');
    if (!tbody) return;
    try {
        const { data } = await db.from('toefl_certificates').select('*').order('created_at', { ascending: false });
        if (!data?.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Belum ada sertifikat</td></tr>';
            return;
        }
        tbody.innerHTML = data.map(c => `
            <tr>
                <td><strong style="color:var(--primary);">${c.certificate_id}</strong></td>
                <td>${c.participant_name}</td>
                <td>${formatDate(c.test_date)}</td>
                <td>${c.listening_score} / ${c.structure_score} / ${c.reading_score}</td>
                <td><strong style="font-size:1.1rem;color:var(--primary);">${c.total_score}</strong></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-success" 
                            onclick='showCertPrint(${JSON.stringify(c)})' title="Cetak">
                            <i class="fas fa-print"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" 
                            onclick='showToeflForm(${JSON.stringify(c)})' title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" 
                            onclick="deleteToefl('${c.id}')" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) { console.error(err); }
}

async function deleteToefl(id) {
    if (!confirm('Hapus sertifikat ini?')) return;
    await db.from('toefl_certificates').delete().eq('id', id);
    showNotification('Sertifikat dihapus!');
    loadAdminToefl();
    loadDashboardStats();
}