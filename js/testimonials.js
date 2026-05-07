var allTestimonials = [];
var currentTestimonialIndex = 0;
var testimonialInterval = null;

document.addEventListener('DOMContentLoaded', function() {
    loadTestimonials();
});

async function loadTestimonials() {
    var container = document.getElementById('testimonialsCarousel');
    if (!container) return;

    try {
        var r = await db.from('testimonials')
            .select('*')
            .eq('is_approved', true)
            .order('created_at', { ascending: false });

        if (!r.data || !r.data.length) {
            var section = document.getElementById('testimonialsSection');
            if (section) section.style.display = 'none';
            return;
        }

        allTestimonials = r.data;
        renderCarousel();
        startAutoRotate();
    } catch (e) {
        console.error(e);
        var section = document.getElementById('testimonialsSection');
        if (section) section.style.display = 'none';
    }
}

function getUniversitasShort(univ) {
    if (!univ) return '';
    if (univ.indexOf('Sultan Syarif Kasim') !== -1) return 'UIN Suska Riau';
    if (univ.indexOf('Sulthan Syarif Hasyim') !== -1) return 'STAI SSH Siak';
    if (univ.indexOf('Al-Kifayah') !== -1) return 'STAI Al-Kifayah Riau';
    return univ.length > 30 ? univ.substring(0, 30) + '...' : univ;
}

function renderTestimonialCard(t) {
    var stars = '';
    for (var i = 0; i < 5; i++) stars += i < t.rating ? '⭐' : '☆';
    var initials = t.client_name.split(' ').map(function(w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
    var colors = ['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
    var color = colors[Math.abs(t.client_name.charCodeAt(0)) % colors.length];

    var subtitle = '';
    if (t.document_type === 'Abstrak Skripsi' && t.universitas) {
        subtitle = '<div class="author-doc"><i class="fas fa-graduation-cap"></i> ' + escapeHtmlT(getUniversitasShort(t.universitas)) + '</div>';
    } else if (t.document_type) {
        subtitle = '<div class="author-doc"><i class="fas fa-file-alt"></i> Klien ' + escapeHtmlT(t.document_type) + '</div>';
    } else {
        subtitle = '<div class="author-doc">Klien SIEC</div>';
    }

    return '<div class="testimonial-slide">' +
        '<div class="testimonial-card-large">' +
        '<div class="quote-icon">"</div>' +
        '<div class="testimonial-stars-big">' + stars + '</div>' +
        '<p class="testimonial-text-big">' + escapeHtmlT(t.review_text) + '</p>' +
        '<div class="testimonial-author-big">' +
        '<div class="author-avatar-big" style="background:' + color + '">' + initials + '</div>' +
        '<div class="author-info-big">' +
        '<div class="author-name-big">' + escapeHtmlT(t.client_name) + '</div>' +
        subtitle +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>';
}

function renderCarousel() {
    var container = document.getElementById('testimonialsCarousel');
    if (!container) return;

    container.innerHTML =
        '<div class="carousel-wrapper">' +
        '<button class="carousel-arrow carousel-prev" onclick="prevTestimonial()">' +
        '<i class="fas fa-chevron-left"></i>' +
        '</button>' +
        '<div class="carousel-container" id="carouselContainer">' +
        allTestimonials.map(renderTestimonialCard).join('') +
        '</div>' +
        '<button class="carousel-arrow carousel-next" onclick="nextTestimonial()">' +
        '<i class="fas fa-chevron-right"></i>' +
        '</button>' +
        '</div>' +
        '<div class="carousel-dots" id="carouselDots">' +
        allTestimonials.map(function(_, i) {
            return '<button class="carousel-dot' + (i === 0 ? ' active' : '') + '" onclick="goToTestimonial(' + i + ')"></button>';
        }).join('') +
        '</div>';

    showTestimonial(0);
}

function showTestimonial(index) {
    var slides = document.querySelectorAll('.testimonial-slide');
    var dots = document.querySelectorAll('.carousel-dot');
    if (!slides.length) return;
    currentTestimonialIndex = (index + slides.length) % slides.length;
    slides.forEach(function(s, i) { s.classList.toggle('active', i === currentTestimonialIndex); });
    dots.forEach(function(d, i) { d.classList.toggle('active', i === currentTestimonialIndex); });
}

function nextTestimonial() { showTestimonial(currentTestimonialIndex + 1); resetAutoRotate(); }
function prevTestimonial() { showTestimonial(currentTestimonialIndex - 1); resetAutoRotate(); }
function goToTestimonial(i) { showTestimonial(i); resetAutoRotate(); }

function startAutoRotate() {
    if (testimonialInterval) clearInterval(testimonialInterval);
    testimonialInterval = setInterval(function() {
        showTestimonial(currentTestimonialIndex + 1);
    }, 5000);
}

function resetAutoRotate() {
    if (testimonialInterval) {
        clearInterval(testimonialInterval);
        startAutoRotate();
    }
}

function escapeHtmlT(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}