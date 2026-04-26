// ============================================
// SIEC - Admin Dashboard
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const admin = checkAuth();
    if (!admin) return;

    document.getElementById('adminName').textContent = admin.full_name;

    // Sidebar navigation
    document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            switchSection(section);
        });
    });

    // Sidebar toggle (mobile)
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('adminSidebar');
    const sidebarClose = document.getElementById('sidebarClose');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
    }
    if (sidebarClose) {
        sidebarClose.addEventListener('click', () => sidebar.classList.remove('active'));
    }

    // TOEFL score auto-calculate
    ['toeflListening', 'toeflStructure', 'toeflReading'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', calculateToeflTotal);
        }
    });

    // Load initial data
    loadDashboardStats();
    loadAdminArticles();
    loadAdminPrograms();
    loadAdminTranslations();
    loadAdminStatus();
    loadAdminToefl();
});

function switchSection(section) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

    document.getElementById(`section-${section}`).classList.add('active');
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    const titles = {
        'dashboard': 'Dashboard',
        'articles': 'Kelola Artikel',
        'programs': 'Kelola Program',
        'translations': 'Dokumen Terjemahan',
        'translation-status': 'Status Penerjemahan',
        'toefl': 'Sertifikat TOEFL'
    };
    document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';

    // Close sidebar on mobile
    document.getElementById('adminSidebar').classList.remove('active');
}

// ============================================
// DASHBOARD STATS
// ============================================
async function loadDashboardStats() {
    try {
        const [articles, translations, certificates, programs] = await Promise.all([
            supabase.from('articles').select('id', { count: 'exact' }),
            supabase.from('translation_documents').select('id', { count: 'exact' }),
            supabase.from('toefl_certificates').select('id', { count: 'exact' }),
            supabase.from('learning_programs').select('id', { count: 'exact' }).eq('is_active', true)
        ]);

        document.getElementById('totalArticles').textContent = articles.count || 0;
        document.getElementById('totalTranslations').textContent = translations.count || 0;
        document.getElementById('totalCertificates').textContent = certificates.count || 0;
        document.getElementById('totalPrograms').textContent = programs.count || 0;
    } catch (err) {
        console.error('Stats error:', err);
    }
}

// ============================================
// ARTICLES MANAGEMENT
// ============================================
function showArticleForm(article = null) {
    document.getElementById('articleForm').style.display = 'block';
    if (article) {
        document.getElementById('articleFormTitle').textContent = 'Edit Artikel';
        document.getElementById('articleId').value = article.id;
        document.getElementById('articleTitle').value = article.title;
        document.getElementById('articleCategory').value = article.category;
        document.getElementById('articleLayout').value = article.layout_type;
        document.getElementById('articleCover').value = article.cover_image || '';
        document.getElementById('articleExcerpt').value = article.excerpt || '';
        document.getElementById('articleContent').value = article.content;
        document.getElementById('articlePublished').checked = article.is_published;
    } else {
        document.getElementById('articleFormTitle').textContent = 'Tambah Artikel Baru';
        document.getElementById('articleId').value = '';
        document.getElementById('articleTitle').value = '';
        document.getElementById('articleExcerpt').value = '';
        document.getElementById('articleContent').value = '';
        document.getElementById('articleCover').value = '';
        document.getElementById('articlePublished').checked = false;
    }
}

function hideArticleForm() {
    document.getElementById('articleForm').style.display = 'none';
}

async function saveArticle() {
    const id = document.getElementById('articleId').value;
    const title = document.getElementById('articleTitle').value;

    if (!title) { showNotification('Judul harus diisi!', 'error'); return; }

    const articleData = {
        title: title,
        slug: generateSlug(title) + '-' + Date.now(),
        content: document.getElementById('articleContent').value,
        excerpt: document.getElementById('articleExcerpt').value,
        cover_image: document.getElementById('articleCover').value,
        layout_type: document.getElementById('articleLayout').value,
        category: document.getElementById('articleCategory').value,
        is_published: document.getElementById('articlePublished').checked,
        published_at: document.getElementById('articlePublished').checked ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
    };

    try {
        if (id) {
            await supabase.from('articles').update(articleData).eq('id', id);
            showNotification('Artikel berhasil diperbarui!');
        } else {
            await supabase.from('articles').insert(articleData);
            showNotification('Artikel berhasil ditambahkan!');
        }
        hideArticleForm();
        loadAdminArticles();
        loadDashboardStats();
    } catch (err) {
        showNotification('Gagal menyimpan artikel!', 'error');
        console.error(err);
    }
}

async function loadAdminArticles() {
    const tbody = document.getElementById('articlesTableBody');
    if (!tbody) return;

    try {
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Belum ada artikel.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(a => `
            <tr>
                <td><strong>${a.title}</strong></td>
                <td>${a.category}</td>
                <td>${a.layout_type}</td>
                <td><span class="status-badge ${a.is_published ? 'status-published' : 'status-draft'}">${a.is_published ? 'Published' : 'Draft'}</span></td>
                <td>${formatDate(a.created_at)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick='showArticleForm(${JSON.stringify(a).replace(/'/g, "\\'")})'>
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteArticle('${a.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

async function deleteArticle(id) {
    if (!confirm('Hapus artikel ini?')) return;
    await supabase.from('articles').delete().eq('id', id);
    showNotification('Artikel dihapus!');
    loadAdminArticles();
    loadDashboardStats();
}

// ============================================
// PROGRAMS MANAGEMENT
// ============================================
function showProgramForm(program = null) {
    document.getElementById('programForm').style.display = 'block';
    if (program) {
        document.getElementById('programFormTitle').textContent = 'Edit Program';
        document.getElementById('programId').value = program.id;
        document.getElementById('programTitle').value = program.title;
        document.getElementById('programType').value = program.program_type;
        document.getElementById('programLevel').value = program.level;
        document.getElementById('programDuration').value = program.duration || '';
        document.getElementById('programSchedule').value = program.schedule || '';
        document.getElementById('programPrice').value = program.price || '';
        document.getElementById('programLayout').value = program.layout_type;
        document.getElementById('programCover').value = program.cover_image || '';
        document.getElementById('programDesc').value = program.description;
        document.getElementById('programContent').value = program.content || '';
        document.getElementById('programFeatures').value = (program.features || []).join(', ');
        document.getElementById('programActive').checked = program.is_active;
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
    }
}

function hideProgramForm() {
    document.getElementById('programForm').style.display = 'none';
}

async function saveProgram() {
    const title = document.getElementById('programTitle').value;
    if (!title) { showNotification('Nama program harus diisi!', 'error'); return; }

    const id = document.getElementById('programId').value;
    const features = document.getElementById('programFeatures').value
        .split(',').map(f => f.trim()).filter(f => f);

    const programData = {
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
        layout_type: document.getElementById('programLayout').value,
        features,
        is_active: document.getElementById('programActive').checked,
        updated_at: new Date().toISOString()
    };

    try {
        if (id) {
            await supabase.from('learning_programs').update(programData).eq('id', id);
            showNotification('Program berhasil diperbarui!');
        } else {
            await supabase.from('learning_programs').insert(programData);
            showNotification('Program berhasil ditambahkan!');
        }
        hideProgramForm();
        loadAdminPrograms();
        loadDashboardStats();
    } catch (err) {
        showNotification('Gagal menyimpan!', 'error');
        console.error(err);
    }
}

async function loadAdminPrograms() {
    const tbody = document.getElementById('programsTableBody');
    if (!tbody) return;

    try {
        const { data } = await supabase.from('learning_programs').select('*').order('sort_order');

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Belum ada program.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(p => `
            <tr>
                <td><strong>${p.title}</strong></td>
                <td>${p.program_type}</td>
                <td>${p.level}</td>
                <td>${p.price || '-'}</td>
                <td><span class="status-badge ${p.is_active ? 'status-published' : 'status-draft'}">${p.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick='showProgramForm(${JSON.stringify(p).replace(/'/g, "\\'")})'>
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProgram('${p.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

async function deleteProgram(id) {
    if (!confirm('Hapus program ini?')) return;
    await supabase.from('learning_programs').delete().eq('id', id);
    showNotification('Program dihapus!');
    loadAdminPrograms();
    loadDashboardStats();
}

// ============================================
// TRANSLATION DOCUMENTS MANAGEMENT
// ============================================
function showTranslationForm() {
    document.getElementById('translationForm').style.display = 'block';
    document.getElementById('transDocId').value = '';
    document.getElementById('transClientName').value = '';
    document.getElementById('transDocTitle').value = '';
    document.getElementById('transNotes').value = '';
    document.getElementById('transIssuedDate').value = new Date().toISOString().split('T')[0];
}

function hideTranslationForm() {
    document.getElementById('translationForm').style.display = 'none';
}

async function saveTranslation() {
    const clientName = document.getElementById('transClientName').value;
    const docTitle = document.getElementById('transDocTitle').value;

    if (!clientName || !docTitle) {
        showNotification('Nama klien dan judul dokumen harus diisi!', 'error');
        return;
    }

    const documentId = generateDocumentId('TR');

    const transData = {
        document_id: documentId,
        client_name: clientName,
        document_title: docTitle,
        source_language: document.getElementById('transSourceLang').value,
        target_language: document.getElementById('transTargetLang').value,
        document_type: document.getElementById('transDocType').value,
        barcode_data: documentId,
        issued_date: document.getElementById('transIssuedDate').value,
        notes: document.getElementById('transNotes').value,
        verified: true,
        status: 'valid'
    };

    try {
        const { error } = await supabase.from('translation_documents').insert(transData);
        if (error) throw error;

        showNotification(`Dokumen disimpan! ID: ${documentId}`);
        hideTranslationForm();
        loadAdminTranslations();
        loadDashboardStats();

        // Show print preview
        showTranslationPrint(transData);
    } catch (err) {
        showNotification('Gagal menyimpan!', 'error');
        console.error(err);
    }
}

function showTranslationPrint(doc) {
    const preview = document.getElementById('printPreview');
    preview.style.display = 'block';
    preview.innerHTML = `
        <div style="text-align:center;margin-bottom:20px;">
            <h3>Preview Dokumen Terjemahan</h3>
            <p>ID: <strong>${doc.document_id}</strong></p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
            <div><strong>Klien:</strong> ${doc.client_name}</div>
            <div><strong>Dokumen:</strong> ${doc.document_title}</div>
            <div><strong>Bahasa:</strong> ${doc.source_language} → ${doc.target_language}</div>
            <div><strong>Jenis:</strong> ${doc.document_type}</div>
            <div><strong>Tanggal:</strong> ${formatDate(doc.issued_date)}</div>
        </div>
        <div style="text-align:center;margin:20px 0;">
            <svg id="barcode-${doc.document_id}"></svg>
        </div>
        <div style="text-align:center;margin-top:8px;font-size:0.8rem;color:var(--gray-600);">
            Verifikasi: ${window.location.origin}/verify.html?id=${doc.document_id}&type=translation
        </div>
        <div style="text-align:center;margin-top:16px;">
            <button class="btn btn-primary" onclick="window.print()">
                <i class="fas fa-print"></i> Cetak
            </button>
            <button class="btn btn-outline" onclick="document.getElementById('printPreview').style.display='none'">
                Tutup
            </button>
        </div>
    `;

    // Generate barcode
    if (typeof JsBarcode !== 'undefined') {
        JsBarcode(`#barcode-${doc.document_id}`, doc.document_id, {
            format: "CODE128",
            width: 2,
            height: 60,
            displayValue: true,
            fontSize: 14,
            margin: 10
        });
    }
}

async function loadAdminTranslations() {
    const tbody = document.getElementById('translationsTableBody');
    if (!tbody) return;

    try {
        const { data } = await supabase.from('translation_documents').select('*').order('created_at', { ascending: false });

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Belum ada dokumen.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(d => `
            <tr>
                <td><strong>${d.document_id}</strong></td>
                <td>${d.client_name}</td>
                <td>${d.document_title}</td>
                <td>${d.source_language} → ${d.target_language}</td>
                <td>${formatDate(d.issued_date)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-success" onclick='showTranslationPrint(${JSON.stringify(d)})'>
                            <i class="fas fa-print"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTranslation('${d.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

async function deleteTranslation(id) {
    if (!confirm('Hapus dokumen ini?')) return;
    await supabase.from('translation_documents').delete().eq('id', id);
    showNotification('Dokumen dihapus!');
    loadAdminTranslations();
    loadDashboardStats();
}

// ============================================
// TRANSLATION STATUS MANAGEMENT
// ============================================
function showStatusForm(status = null) {
    document.getElementById('statusForm').style.display = 'block';
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
    const clientName = document.getElementById('statusClientName').value;
    const clientPhone = document.getElementById('statusClientPhone').value;

    if (!clientName || !clientPhone) {
        showNotification('Nama dan no. HP harus diisi!', 'error');
        return;
    }

    const id = document.getElementById('statusId').value;

    const statusData = {
        client_name: clientName,
        client_phone: clientPhone,
        document_type: document.getElementById('statusDocType').value,
        status: document.getElementById('statusValue').value,
        status_description: document.getElementById('statusDesc').value,
        estimated_completion: document.getElementById('statusEstimate').value || null,
        updated_at: new Date().toISOString()
    };

    try {
        if (id) {
            await supabase.from('translation_status').update(statusData).eq('id', id);
            showNotification('Status berhasil diperbarui!');
        } else {
            statusData.tracking_code = generateTrackingCode();
            await supabase.from('translation_status').insert(statusData);
            showNotification(`Status ditambahkan! Kode: ${statusData.tracking_code}`);
        }
        hideStatusForm();
        loadAdminStatus();
    } catch (err) {
        showNotification('Gagal menyimpan!', 'error');
        console.error(err);
    }
}

async function loadAdminStatus() {
    const tbody = document.getElementById('statusTableBody');
    if (!tbody) return;

    try {
        const { data } = await supabase.from('translation_status').select('*').order('created_at', { ascending: false });

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Belum ada data.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(s => `
            <tr>
                <td><strong>${s.tracking_code}</strong></td>
                <td>${s.client_name}</td>
                <td>${s.document_type}</td>
                <td><span class="status-badge status-${s.status}">${s.status}</span></td>
                <td>${s.estimated_completion ? formatDate(s.estimated_completion) : '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick='showStatusForm(${JSON.stringify(s)})'>
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteStatus('${s.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

async function deleteStatus(id) {
    if (!confirm('Hapus status ini?')) return;
    await supabase.from('translation_status').delete().eq('id', id);
    showNotification('Status dihapus!');
    loadAdminStatus();
}

// ============================================
// TOEFL CERTIFICATES MANAGEMENT
// ============================================
function calculateToeflTotal() {
    const l = parseInt(document.getElementById('toeflListening').value) || 0;
    const s = parseInt(document.getElementById('toeflStructure').value) || 0;
    const r = parseInt(document.getElementById('toeflReading').value) || 0;
    const total = Math.round((l + s + r) * 10 / 3);
    document.getElementById('toeflTotal').value = total;
}

function showToeflForm(cert = null) {
    document.getElementById('toeflForm').style.display = 'block';
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
    }
}

function hideToeflForm() {
    document.getElementById('toeflForm').style.display = 'none';
}

async function saveToefl() {
    const name = document.getElementById('toeflName').value;
    const testDate = document.getElementById('toeflTestDate').value;

    if (!name || !testDate) {
        showNotification('Nama dan tanggal tes harus diisi!', 'error');
        return;
    }

    const id = document.getElementById('toeflId').value;
    const certificateId = id ? null : generateDocumentId('TF');

    const l = parseInt(document.getElementById('toeflListening').value) || 0;
    const s = parseInt(document.getElementById('toeflStructure').value) || 0;
    const r = parseInt(document.getElementById('toeflReading').value) || 0;
    const total = Math.round((l + s + r) * 10 / 3);

    const toeflData = {
        participant_name: name,
        test_date: testDate,
        participant_email: document.getElementById('toeflEmail').value,
        participant_phone: document.getElementById('toeflPhone').value,
        listening_score: l,
        structure_score: s,
        reading_score: r,
        total_score: total,
        notes: document.getElementById('toeflNotes').value,
        verified: true,
        status: 'valid'
    };

    try {
        if (id) {
            await supabase.from('toefl_certificates').update(toeflData).eq('id', id);
            showNotification('Sertifikat berhasil diperbarui!');
        } else {
            toeflData.certificate_id = certificateId;
            toeflData.barcode_data = certificateId;
            await supabase.from('toefl_certificates').insert(toeflData);
            showNotification(`Sertifikat disimpan! ID: ${certificateId}`);
        }
        hideToeflForm();
        loadAdminToefl();
        loadDashboardStats();

        if (!id) {
            showCertPrint({ ...toeflData });
        }
    } catch (err) {
        showNotification('Gagal menyimpan!', 'error');
        console.error(err);
    }
}

function showCertPrint(cert) {
    const preview = document.getElementById('certPrintPreview');
    preview.style.display = 'block';
    preview.innerHTML = `
        <div style="text-align:center;margin-bottom:20px;">
            <h3>Preview Sertifikat TOEFL Prediction</h3>
            <p>ID: <strong>${cert.certificate_id}</strong></p>
        </div>
        <div style="text-align:center;margin-bottom:20px;">
            <h2 style="color:var(--dark);">${cert.participant_name}</h2>
            <p>Tanggal Tes: ${formatDate(cert.test_date)}</p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;text-align:center;margin-bottom:20px;">
            <div style="padding:16px;background:var(--gray-100);border-radius:12px;">
                <div style="font-size:0.8rem;color:var(--gray-600);">Listening</div>
                <div style="font-size:1.5rem;font-weight:800;color:var(--dark);">${cert.listening_score}</div>
            </div>
            <div style="padding:16px;background:var(--gray-100);border-radius:12px;">
                <div style="font-size:0.8rem;color:var(--gray-600);">Structure</div>
                <div style="font-size:1.5rem;font-weight:800;color:var(--dark);">${cert.structure_score}</div>
            </div>
            <div style="padding:16px;background:var(--gray-100);border-radius:12px;">
                <div style="font-size:0.8rem;color:var(--gray-600);">Reading</div>
                <div style="font-size:1.5rem;font-weight:800;color:var(--dark);">${cert.reading_score}</div>
            </div>
        </div>
        <div style="text-align:center;padding:16px;background:linear-gradient(135deg,var(--primary),var(--secondary));border-radius:12px;color:white;margin-bottom:20px;">
            <div style="font-size:0.9rem;">Total Score</div>
            <div style="font-size:2.5rem;font-weight:800;">${cert.total_score}</div>
        </div>
        <div style="text-align:center;margin:20px 0;">
            <svg id="barcode-cert-${cert.certificate_id}"></svg>
        </div>
        <div style="text-align:center;font-size:0.8rem;color:var(--gray-600);">
            Verifikasi: ${window.location.origin}/verify.html?id=${cert.certificate_id}&type=toefl
        </div>
        <div style="text-align:center;margin-top:16px;">
            <button class="btn btn-primary" onclick="window.print()">
                <i class="fas fa-print"></i> Cetak
            </button>
            <button class="btn btn-outline" onclick="document.getElementById('certPrintPreview').style.display='none'">
                Tutup
            </button>
        </div>
    `;

    if (typeof JsBarcode !== 'undefined') {
        JsBarcode(`#barcode-cert-${cert.certificate_id}`, cert.certificate_id, {
            format: "CODE128",
            width: 2,
            height: 60,
            displayValue: true,
            fontSize: 14,
            margin: 10
        });
    }
}

async function loadAdminToefl() {
    const tbody = document.getElementById('toeflTableBody');
    if (!tbody) return;

    try {
        const { data } = await supabase.from('toefl_certificates').select('*').order('created_at', { ascending: false });

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Belum ada sertifikat.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(c => `
            <tr>
                <td><strong>${c.certificate_id}</strong></td>
                <td>${c.participant_name}</td>
                <td>${formatDate(c.test_date)}</td>
                <td>${c.listening_score}/${c.structure_score}/${c.reading_score}</td>
                <td><strong style="color:var(--primary);">${c.total_score}</strong></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-success" onclick='showCertPrint(${JSON.stringify(c)})'>
                            <i class="fas fa-print"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick='showToeflForm(${JSON.stringify(c)})'>
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteToefl('${c.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

async function deleteToefl(id) {
    if (!confirm('Hapus sertifikat ini?')) return;
    await supabase.from('toefl_certificates').delete().eq('id', id);
    showNotification('Sertifikat dihapus!');
    loadAdminToefl();
    loadDashboardStats();
}