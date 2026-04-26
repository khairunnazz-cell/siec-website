// ============================================
// SIEC - Programs (Public View)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadPublicPrograms();

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterPrograms(btn.dataset.filter);
        });
    });
});

let allPrograms = [];

async function loadPublicPrograms() {
    const grid = document.getElementById('programsGrid');
    if (!grid) return;

    try {
        const { data, error } = await supabase
            .from('learning_programs')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;

        allPrograms = data || [];

        if (allPrograms.length === 0) {
            grid.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-book" style="font-size:3rem;color:var(--gray-400);margin-bottom:16px;"></i>
                    <p>Belum ada program.</p>
                </div>
            `;
            return;
        }

        renderPrograms(allPrograms);
    } catch (err) {
        grid.innerHTML = '<p style="text-align:center;color:var(--gray-500);">Gagal memuat program.</p>';
        console.error(err);
    }
}

function renderPrograms(programs) {
    const grid = document.getElementById('programsGrid');

    grid.innerHTML = programs.map(program => {
        const features = program.features || [];
        const layoutClass = program.layout_type === 'list' ? 'list-layout' : program.layout_type === 'featured' ? 'featured-layout' : '';

        return `
            <div class="program-card ${layoutClass}" data-type="${program.program_type}">
                <div class="program-card-header ${program.program_type}">
                    <span class="program-type-badge">${program.program_type.toUpperCase()}</span>
                    <h3>${program.title}</h3>
                    ${program.level !== 'all' ? `<span style="font-size:0.8rem;opacity:0.8;">Level: ${program.level}</span>` : ''}
                </div>
                <div class="program-card-body">
                    <p>${program.description}</p>
                    <div class="program-info">
                        ${program.duration ? `<div class="program-info-item"><i class="fas fa-clock"></i> ${program.duration}</div>` : ''}
                        ${program.schedule ? `<div class="program-info-item"><i class="fas fa-calendar-alt"></i> ${program.schedule}</div>` : ''}
                    </div>
                    ${features.length > 0 ? `
                        <ul class="program-features">
                            ${features.map(f => `<li>${f}</li>`).join('')}
                        </ul>
                    ` : ''}
                    ${program.price ? `<div class="program-price">${program.price}</div>` : ''}
                    <a href="https://wa.me/${WA_NUMBER}?text=Halo%20SIEC,%20saya%20ingin%20mendaftar%20program%20${encodeURIComponent(program.title)}" class="btn btn-primary btn-full" target="_blank">
                        <i class="fab fa-whatsapp"></i> Daftar Sekarang
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

function filterPrograms(filter) {
    if (filter === 'all') {
        renderPrograms(allPrograms);
    } else {
        renderPrograms(allPrograms.filter(p => p.program_type === filter));
    }
}