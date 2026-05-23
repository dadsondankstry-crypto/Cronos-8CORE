
/* PATCH: Favoritar no hover também para cards LISO/PRIME renderizados por adaptadores próprios */
(function(){
    function cronosTituloCard(li){
        return (li && li.querySelector('h3') && li.querySelector('h3').textContent || '').trim();
    }
    function cronosPosterCard(li){
        return li?.dataset?.poster || li?.querySelector('.card-media img, img')?.src || '';
    }
    function cronosTipoCard(li){
        const txt = (li?.querySelector('.badge-tipo')?.textContent || '').toLowerCase();
        if (txt.includes('série') || txt.includes('serie')) return { tipo: 'Série', isMovie: false, isSerie: true };
        if (txt.includes('filme')) return { tipo: 'Filme', isMovie: true, isSerie: false };
        return { tipo: 'Filme', isMovie: true, isSerie: false };
    }
    function cronosAdicionarFavoritarLisoPrime(root){
        try {
            if (typeof adicionarBotaoFavoritarHoverCronos !== 'function') return;
            const base = root && root.querySelectorAll ? root : document;
            base.querySelectorAll('.card-item.global-card[data-provider="l07"], .card-item.global-card[data-provider="primeflix"]').forEach(li => {
                if (!li || li.querySelector('.btn-favoritar-card')) return;
                if (li.closest('#gridFavoritos, #gridHistorico')) return;
                const providerKey = li.dataset.providerKey || li.dataset.provider || '';
                if (providerKey !== 'l07' && providerKey !== 'primeflix') return;
                const poster = cronosPosterCard(li);
                if (poster) li.dataset.poster = poster;
                const tipoInfo = cronosTipoCard(li);
                adicionarBotaoFavoritarHoverCronos(li, {
                    url: li.dataset.url || '',
                    titulo: cronosTituloCard(li),
                    ano: li.querySelector('.badge-ano-card')?.textContent || '',
                    img: poster,
                    poster,
                    providerKey,
                    providerName: providerKey === 'l07' ? 'Fonte LISO' : 'Fonte PRIME',
                    providerSigla: providerKey === 'l07' ? 'LISO' : 'PRIME',
                    baseUrl: providerKey === 'l07' ? 'https://lisoflix.net/' : 'https://primeflix.mom/',
                    ...tipoInfo
                });
            });
        } catch(e) {}
    }
    document.addEventListener('DOMContentLoaded', () => cronosAdicionarFavoritarLisoPrime(document));
    const obs = new MutationObserver(muts => {
        for (const m of muts) {
            for (const node of m.addedNodes || []) {
                if (node && node.nodeType === 1) cronosAdicionarFavoritarLisoPrime(node);
            }
        }
    });
    try { obs.observe(document.documentElement, { childList: true, subtree: true }); } catch(e) {}
    window.cronosAdicionarFavoritarLisoPrime = cronosAdicionarFavoritarLisoPrime;
})();
