var currentTab = 'translation';
var currentDoc = null;

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.verify-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.verify-tab').forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            document.getElementById('verifyResult').style.display = 'none';
            var input = document.getElementById('verifyInput');
            input.placeholder = currentTab === 'translation'
                ? 'Masukkan ID Dokumen (contoh: SIEC-TR-2024-001)'
                : 'Masukkan ID Sertifikat (contoh: SIEC-TF-2024-001)';
        });
    });

    var params = new URLSearchParams(window.location.search);
    var id = params.get('id');
    var type = params.get('type');
    if (id) {
        document.getElementById('verifyInput').value = id;
        if (type === 'toefl') {
            currentTab = 'toefl';
            document.querySelectorAll('.verify-tab').forEach(function(t) { t.classList.remove('active'); });
            var toeflTab = document.querySelector('[data-tab="toefl"]');
            if (toeflTab) toeflTab.classList.add('active');
        }
        verifyDocument();
    }
});

async function verifyDocument() {
    var input = document.getElementById('verifyInput').value.trim();
    var resultDiv = document.getElementById('verifyResult');
    var btn = document.getElementById('verifyBtn');
    if (!input) { showNotification('Masukkan ID dokumen!', 'error'); return; }
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        var data, error;
        if (currentTab === 'translation') {
            var result = await db.from('translation_clients').select('*').eq('document_id', input).eq('status', 'completed').single();
            data = result.data; error = result.error;
        } else {
            var result2 = await db.from('toefl_certificates').select('*').eq('certificate_id', input).single();
            data = result2.data; error = result2.error;
        }

        resultDiv.style.display = 'block';

        if (error || !data) {
            resultDiv.className = 'verify-result result-invalid';
            resultDiv.innerHTML =
                '<div class="result-header"><i class="fas fa-times-circle"></i><span>DOKUMEN TIDAK TERDAFTAR</span></div>' +
                '<p style="color:var(--danger)">ID <strong>"' + input + '"</strong> tidak ditemukan dalam sistem SIEC.</p>' +
                '<p style="margin-top:12px"><a href="https://wa.me/' + WA_NUMBER + '?text=Halo%20SIEC,%20verifikasi%20dokumen%20' + input + '" style="color:var(--primary);font-weight:600"><i class="fab fa-whatsapp"></i> Hubungi kami untuk konfirmasi</a></p>';
        } else {
            currentDoc = data;
            currentDoc._type = currentTab;
            resultDiv.className = 'verify-result result-valid';
            resultDiv.innerHTML = renderResult(data, currentTab);
        }
    } catch (err) {
        resultDiv.style.display = 'block';
        resultDiv.className = 'verify-result result-invalid';
        resultDiv.innerHTML = '<p>Terjadi kesalahan: ' + err.message + '</p>';
    }

    btn.innerHTML = '<i class="fas fa-check-circle"></i> Verifikasi';
    btn.disabled = false;
}

function renderResult(data, type) {
    var html = '';
    var hasReviewed = data.has_reviewed === true;

    if (type === 'translation') {
        var downloadBtn = '';
        if (data.file_url) {
            if (hasReviewed) {
                downloadBtn =
                    '<div class="download-section">' +
                    '<a href="' + data.file_url + '" target="_blank" class="btn btn-success download-btn">' +
                    '<i class="fas fa-download"></i> Download Dokumen' +
                    '</a>' +
                    '<p class="thank-you-msg">💚 Terima kasih atas review Anda!</p>' +
                    '</div>';
            } else {
                downloadBtn =
                    '<div class="review-prompt-section">' +
                    '<div class="review-prompt-card">' +
                    '<div class="review-icon">⭐</div>' +
                    '<h3>Bantu Kami Menjadi Lebih Baik</h3>' +
                    '<p class="review-message">Sebelum Anda mendownload dokumen, kami akan sangat menghargai jika Ananda berkenan meluangkan waktu sejenak untuk berbagi pengalaman dengan layanan kami. Masukan Anda sangat berarti bagi pengembangan SIEC dan akan membantu calon pengguna lainnya. 🙏</p>' +
                    '<button class="btn btn-primary review-btn" onclick="showReviewForm()"><i class="fas fa-star"></i> Berikan Testimoni & Lanjut Download</button>' +
                    '<p class="review-hint">Hanya butuh 30 detik ⏱️</p>' +
                    '</div>' +
                    '</div>';
            }
        }

        html =
            '<div class="result-header"><i class="fas fa-check-circle"></i><span>DOKUMEN TERVERIFIKASI ✅</span></div>' +
            '<div class="result-details">' +
            '<div class="result-item"><label>ID Dokumen</label><p>' + data.document_id + '</p></div>' +
            '<div class="result-item"><label>Nama Klien</label><p>' + data.client_name + '</p></div>' +
            '<div class="result-item"><label>Judul Dokumen</label><p>' + (data.document_title || data.document_type) + '</p></div>' +
            '<div class="result-item"><label>Jenis</label><p>' + data.document_type + '</p></div>' +
            '<div class="result-item"><label>Bahasa Sumber</label><p>' + data.source_language + '</p></div>' +
            '<div class="result-item"><label>Bahasa Target</label><p>' + data.target_language + '</p></div>' +
            '<div class="result-item"><label>Tanggal Terbit</label><p>' + formatDate(data.issued_date || data.completed_at) + '</p></div>' +
            '<div class="result-item"><label>Status</label><p><span class="status-badge status-valid">✓ Valid</span></p></div>' +
            '</div>' +
            downloadBtn +
            '<p style="margin-top:16px;color:var(--success);font-size:0.85rem;text-align:center"><i class="fas fa-shield-alt"></i> Dokumen ini resmi diterbitkan oleh SIEC</p>';
    } else {
        // TOEFL with review system
        var dlBtn = '';
        if (data.file_url) {
            if (hasReviewed) {
                dlBtn =
                    '<div class="download-section">' +
                    '<a href="' + data.file_url + '" target="_blank" class="btn btn-success download-btn">' +
                    '<i class="fas fa-download"></i> Download Sertifikat</a>' +
                    '<p class="thank-you-msg">💚 Terima kasih atas review Anda!</p>' +
                    '</div>';
            } else {
                dlBtn =
                    '<div class="review-prompt-section">' +
                    '<div class="review-prompt-card">' +
                    '<div class="review-icon">⭐</div>' +
                    '<h3>Bantu Kami Menjadi Lebih Baik</h3>' +
                    '<p class="review-message">Sebelum Anda mendownload sertifikat, kami akan sangat menghargai jika Anda berkenan meluangkan waktu sejenak untuk berbagi pengalaman dengan layanan tes TOEFL Prediction kami. 🙏</p>' +
                    '<button class="btn btn-primary review-btn" onclick="showReviewForm()"><i class="fas fa-star"></i> Berikan Testimoni & Lanjut Download</button>' +
                    '<p class="review-hint">Hanya butuh 30 detik ⏱️</p>' +
                    '</div>' +
                    '</div>';
            }
        }
        html =
            '<div class="result-header"><i class="fas fa-check-circle"></i><span>SERTIFIKAT TERVERIFIKASI ✅</span></div>' +
            '<div class="result-details">' +
            '<div class="result-item"><label>ID Sertifikat</label><p>' + data.certificate_id + '</p></div>' +
            '<div class="result-item"><label>Nama Peserta</label><p>' + data.participant_name + '</p></div>' +
            '<div class="result-item"><label>Tanggal Tes</label><p>' + formatDate(data.test_date) + '</p></div>' +
            '<div class="result-item"><label>Listening</label><p>' + data.listening_score + '</p></div>' +
            '<div class="result-item"><label>Structure</label><p>' + data.structure_score + '</p></div>' +
            '<div class="result-item"><label>Reading</label><p>' + data.reading_score + '</p></div>' +
            '<div class="result-item"><label>Total Score</label><p style="font-size:1.5rem;color:var(--primary);font-weight:800">' + data.total_score + '</p></div>' +
            '<div class="result-item"><label>Status</label><p><span class="status-badge status-valid">✓ Valid</span></p></div>' +
            '</div>' +
            dlBtn +
            '<p style="margin-top:16px;color:var(--success);font-size:0.85rem;text-align:center"><i class="fas fa-shield-alt"></i> Sertifikat ini resmi diterbitkan oleh SIEC</p>';
    }

    return html;
}

// REVIEW FORM
async function showReviewForm() {
    var existingReviews = '';
    try {
        var r = await db.from('testimonials').select('*').eq('is_approved', true).order('created_at', { ascending: false }).limit(5);
        if (r.data && r.data.length > 0) {
            var reviewCards = r.data.map(function(t) {
                var stars = '';
                for (var i = 0; i < 5; i++) stars += i < t.rating ? '⭐' : '☆';
                var initials = t.client_name.split(' ').map(function(w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
                var colors = ['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
                var color = colors[Math.abs(t.client_name.charCodeAt(0)) % colors.length];

                var avatar = t.photo_url
                    ? '<div class="mini-avatar" style="background-image:url(' + t.photo_url + ');background-size:cover;background-position:center"></div>'
                    : '<div class="mini-avatar" style="background:' + color + '">' + initials + '</div>';

                var univLabel = '';
                if (t.document_type === 'Abstrak Skripsi' && t.universitas) {
                    var short = t.universitas;
                    if (short.indexOf('Sultan Syarif Kasim') !== -1) short = 'UIN Suska Riau';
                    else if (short.indexOf('Sulthan Syarif Hasyim') !== -1) short = 'STAI SSH Siak';
                    else if (short.indexOf('Al-Kifayah') !== -1) short = 'STAI Al-Kifayah';
                    univLabel = '<span class="mini-univ">🎓 ' + short + '</span>';
                }
                var reviewShort = t.review_text.length > 120 ? t.review_text.substring(0, 120) + '...' : t.review_text;
                return '<div class="mini-review-card">' +
                    '<div class="mini-review-top">' +
                    avatar +
                    '<div class="mini-info"><div class="mini-name">' + t.client_name + '</div><div class="mini-stars">' + stars + '</div>' + univLabel + '</div>' +
                    '</div>' +
                    '<p class="mini-text">"' + reviewShort + '"</p>' +
                    '</div>';
            }).join('');
            existingReviews =
                '<div class="existing-reviews-section">' +
                '<div class="existing-reviews-header"><i class="fas fa-comments"></i><span>Apa kata klien lain tentang SIEC:</span></div>' +
                '<div class="mini-reviews-scroll">' + reviewCards + '</div>' +
                '</div>';
        }
    } catch (e) { console.error(e); }

    var clientName = currentDoc.client_name || currentDoc.participant_name || 'Klien';

    var modal = document.createElement('div');
    modal.className = 'review-modal';
    modal.id = 'reviewModal';
    modal.innerHTML =
        '<div class="review-modal-content">' +
        '<div class="review-modal-header">' +
        '<h3>✨ Bagikan Pengalaman Anda</h3>' +
        '<button onclick="closeReviewModal()" class="btn-close">&times;</button>' +
        '</div>' +
        '<div class="review-modal-body">' +
        '<p class="review-greeting">Halo <strong>' + clientName + '</strong> 👋</p>' +
        '<p class="review-intro">Bagaimana pengalaman Anda menggunakan layanan SIEC? Kami sangat menantikan masukan Anda untuk terus meningkatkan kualitas layanan kami.</p>' +

        '<div class="rating-section">' +
        '<label>Berikan Rating Anda:</label>' +
        '<div class="star-rating" id="starRating">' +
        '<span class="star" onclick="setRating(1)">⭐</span>' +
        '<span class="star" onclick="setRating(2)">⭐</span>' +
        '<span class="star" onclick="setRating(3)">⭐</span>' +
        '<span class="star" onclick="setRating(4)">⭐</span>' +
        '<span class="star" onclick="setRating(5)">⭐</span>' +
        '</div>' +
        '<p class="rating-label" id="ratingLabel">Klik bintang untuk memberi rating</p>' +
        '</div>' +

        '<div class="photo-upload-section">' +
        '<label>📸 Upload Foto Anda (Opsional)</label>' +
        '<div class="photo-upload-box">' +
        '<input type="file" id="reviewPhoto" accept="image/*" onchange="previewReviewPhoto(this)" style="display:none">' +
        '<div id="photoPreview" class="photo-preview-empty" onclick="document.getElementById(\'reviewPhoto\').click()">' +
        '<i class="fas fa-camera"></i>' +
        '<span>Klik untuk upload foto</span>' +
        '<small>JPG/PNG max 2MB</small>' +
        '</div>' +
        '</div>' +
        '</div>' +

        '<div class="review-textarea-section">' +
        '<label>Ceritakan Pengalaman Anda:</label>' +
        '<textarea id="reviewText" placeholder="Contoh: Pelayanan SIEC sangat memuaskan, hasil terjemahan akurat, dan prosesnya cepat. Sangat direkomendasikan!" rows="4"></textarea>' +
        '<p class="char-counter"><span id="charCount">0</span>/500 karakter</p>' +
        '</div>' +

        '<div class="review-actions">' +
        '<button class="btn btn-primary" onclick="submitReview()" id="submitReviewBtn"><i class="fas fa-paper-plane"></i> Kirim & Lanjut Download</button>' +
        '<button class="btn btn-outline" onclick="closeReviewModal()">Nanti Saja</button>' +
        '</div>' +
        '<p class="privacy-note">🔒 Review & foto Anda akan ditampilkan di website kami. Privasi Anda terjaga.</p>' +
        existingReviews +
        '</div>' +
        '</div>';

    document.body.appendChild(modal);

    setTimeout(function() {
        var ta = document.getElementById('reviewText');
        if (ta) {
            ta.addEventListener('input', function() {
                var len = ta.value.length;
                document.getElementById('charCount').textContent = len;
                if (len > 500) ta.value = ta.value.substring(0, 500);
            });
        }
    }, 100);
}

var reviewPhotoFile = null;

function previewReviewPhoto(input) {
    var f = input.files[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
        showNotification('Foto max 2MB!', 'error');
        input.value = '';
        return;
    }
    reviewPhotoFile = f;
    var reader = new FileReader();
    reader.onload = function(e) {
        var preview = document.getElementById('photoPreview');
        preview.className = 'photo-preview-filled';
        preview.innerHTML = '<img src="' + e.target.result + '" alt="Preview">' +
            '<button type="button" onclick="removeReviewPhoto(event)" class="photo-remove-btn"><i class="fas fa-times"></i></button>';
    };
    reader.readAsDataURL(f);
}

function removeReviewPhoto(e) {
    e.stopPropagation();
    reviewPhotoFile = null;
    document.getElementById('reviewPhoto').value = '';
    var preview = document.getElementById('photoPreview');
    preview.className = 'photo-preview-empty';
    preview.innerHTML = '<i class="fas fa-camera"></i><span>Klik untuk upload foto</span><small>JPG/PNG max 2MB</small>';
}

function closeReviewModal() {
    var m = document.getElementById('reviewModal');
    if (m) m.remove();
}

var selectedRating = 0;

function setRating(r) {
    selectedRating = r;
    var stars = document.querySelectorAll('.star');
    stars.forEach(function(s, i) {
        if (i < r) s.classList.add('active');
        else s.classList.remove('active');
    });
    var labels = ['', 'Kurang Memuaskan 😕', 'Cukup 😐', 'Bagus 🙂', 'Sangat Bagus 😊', 'Luar Biasa! 🤩'];
    document.getElementById('ratingLabel').textContent = labels[r] || '';
}

async function submitReview() {
    if (!selectedRating) {
        showNotification('Mohon berikan rating terlebih dahulu! ⭐', 'error');
        return;
    }
    var reviewText = document.getElementById('reviewText').value.trim();
    if (reviewText.length < 10) {
        showNotification('Mohon tulis review minimal 10 karakter 🙏', 'error');
        return;
    }

    var btn = document.getElementById('submitReviewBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
    btn.disabled = true;

    try {
        var photoUrl = '';
        if (reviewPhotoFile) {
            var ext = reviewPhotoFile.name.split('.').pop();
            var fn = 'reviews/' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.' + ext;
            var up = await db.storage.from('uploads').upload(fn, reviewPhotoFile, { cacheControl: '3600', upsert: false });
            if (!up.error) photoUrl = db.storage.from('uploads').getPublicUrl(fn).data.publicUrl;
        }

        var clientName = currentDoc.client_name || currentDoc.participant_name;
        var docType = currentDoc.document_type || 'TOEFL Prediction';

        await db.from('testimonials').insert({
            client_id: currentDoc._type === 'translation' ? currentDoc.id : null,
            document_id: currentDoc.document_id || currentDoc.certificate_id,
            client_name: clientName,
            document_type: docType,
            universitas: currentDoc.universitas || null,
            rating: selectedRating,
            review_text: reviewText,
            photo_url: photoUrl || null,
            is_approved: true
        });

        // Mark as reviewed
        if (currentDoc._type === 'translation') {
            await db.from('translation_clients').update({ has_reviewed: true }).eq('id', currentDoc.id);
        } else {
            await db.from('toefl_certificates').update({ has_reviewed: true }).eq('id', currentDoc.id);
        }

        showNotification('🎉 Terima kasih atas review Anda!');
        closeReviewModal();

        currentDoc.has_reviewed = true;
        document.getElementById('verifyResult').innerHTML = renderResult(currentDoc, currentDoc._type);

        setTimeout(function() {
            window.open(currentDoc.file_url, '_blank');
        }, 1000);
    } catch (e) {
        showNotification('Error: ' + e.message, 'error');
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim & Lanjut Download';
        btn.disabled = false;
    }
}