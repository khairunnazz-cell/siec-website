// ============================================================
// SIEC — Sinkron tema pengunjung dari database (site_settings)
// Ringan: 1 GET kecil setelah halaman jadi; cache di localStorage.
// Pemasangan TANPA kedip sudah dilakukan skrip inline di <head>.
// ============================================================
(function () {
    var LS_KEY = 'siec_theme';
    var VALID = ['default', 'midnight', 'emerald', 'sunset', 'royal'];
    var THEME_COLORS = {
        'default': '#2563eb',
        'midnight': '#0b1220',
        'emerald': '#059669',
        'sunset': '#ea580c',
        'royal': '#6d28d9'
    };

    function applyTheme(t) {
        if (VALID.indexOf(t) === -1) t = 'default';
        if (document.documentElement.getAttribute('data-theme') !== t) {
            document.documentElement.setAttribute('data-theme', t);
        }
        try { localStorage.setItem(LS_KEY, t); } catch (e) {}
        // Sinkronkan warna status bar HP (meta theme-color) dengan tema aktif
        var m = document.querySelector('meta[name="theme-color"]');
        if (m && THEME_COLORS[t]) m.setAttribute('content', THEME_COLORS[t]);
    }

    async function syncFromServer() {
        try {
            if (typeof db === 'undefined' || !db || !db.from) return;
            var r = await db.from('site_settings').select('value').eq('key', 'theme').maybeSingle();
            if (r && r.data && r.data.value) applyTheme(r.data.value);
        } catch (e) { /* senyap: tetap pakai tema cache/default */ }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', syncFromServer);
    } else {
        syncFromServer();
    }
})();
