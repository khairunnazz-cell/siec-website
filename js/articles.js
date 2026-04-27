// ============================================
// SIEC - Articles (Public View)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadPublicArticles();
});

async function loadPublicArticles() {
    const grid = document.getElementById('articlesGrid');
    if (!grid) return;

    try {
        const { data, error } = await db
            .from('articles')
            .select('*')
            .eq('is_published', true)
            .order('published_at', { ascending: false })
            .limit(6);

        if (error) throw error;

        if (!data || data.length === 0) {
            grid.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-newspaper" 
                       style="font-size:3rem;color:var(--gray-400);margin-bottom:16px;">
                    </i>
                    <p>Belum ada artikel.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = data.map(article => `
            <a href="article.html?slug=${article.slug}" 
               class="article-card ${article.layout_type === 'featured' ? 'featured' : ''} 
                      ${article.layout_type === 'compact' ? 'compact' : ''}">
                <div class="article-card-image">
                    ${article.cover_image
                        ? `<img src="${article.cover_image}" alt="${article.title}">`
                        : `<i class="fas fa-newspaper"></i>`
                    }
                </div>
                <div class="article-card-body">
                    <span class="article-category">${article.category || 'Umum'}</span>
                    <h3>${article.title}</h3>
                    <p>${article.excerpt || article.content.substring(0, 120) + '...'}</p>
                    <span class="article-date">
                        <i class="fas fa-calendar"></i> 
                        ${formatDate(article.published_at || article.created_at)}
                    </span>
                </div>
            </a>
        `).join('');

    } catch (err) {
        grid.innerHTML = '<p style="text-align:center;color:var(--gray-500);">Gagal memuat artikel.</p>';
        console.error(err);
    }
}