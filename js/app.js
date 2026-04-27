// ============================================
// SIEC - Main Application
// GANTI URL DAN KEY DENGAN MILIK ANDA!
// ============================================

const SUPABASE_URL = 'https://yskonhtunugujxinjedv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlza29uaHR1bnVndWp4aW5qZWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMDQzNDYsImV4cCI6MjA5Mjc4MDM0Nn0.XpoZZj4WwaelH6vmicNtwU6uvzIMwLNKUqU50dcjgkg';

// Inisialisasi Supabase dengan nama berbeda
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Ganti semua referensi supabase ke supabaseClient
const db = supabaseClient;

// WhatsApp Number
const WA_NUMBER = '6282174104447';

// ============================================
// NAVBAR
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        }
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu) navMenu.classList.remove('active');
        });
    });
});

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function generateSlug(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function generateDocumentId(prefix) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `SIEC-${prefix}-${year}-${random}`;
}

function generateTrackingCode() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `TRK-${year}-${random}`;
}

function showNotification(message, type = 'success') {
    const notif = document.createElement('div');
    notif.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 600;
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}