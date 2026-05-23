
/*
  FIX BFTV (p02) — baseado no HTML real do boraflixtv.com
  =========================================================
  Estrutura confirmada do BFTV:
  - Home destaques : #featured-titles article.item  (igual BFCK ✓)
  - Home filmes    : #dt-movies article.item.movies  (igual BFCK ✓)
  - Home séries    : #dt-tvshows article.item.tvshows (igual BFCK ✓)
  - Home episódios : #dt-episodes article.item.se.episodes (igual BFCK ✓)
  - Aba filmes     : /filmes/ → #archive-content article.item.movies ✓
  - Aba séries     : /series/ → #archive-content article.item.tvshows ✓
  - Aba episódios  : /episodios/ → #archive-content article.item (ou #dt-episodes .item) ✓
  - Busca          : /?s=termo → #archive-content article.item ✓
  - Paginação      : /filmes/page/2/ ✓

  PROBLEMA REAL: O CRONOS chama adicionarDestaquePremium() e renderizarItemNoGrid()
  via renderizarItemProvider() — que para p02 usa o caminho genérico (não-liso,
  não-prime). Porém o __CRONOS_RENDER_PROVIDER_KEY pode não estar setado
  corretamente quando garantirBadgeProvider() roda, deixando data-provider=""
  e o filtro esconde tudo.

  SOLUÇÃO: garantir que todo card/slide do p02 tenha data-provider="p02" correto,
  e que buscaPath + filmePath + seriePath + episodioPath estejam definidos
  para evitar fallback errado em urlProviderComContexto.
*/
(function(){
    if(window.__CRONOS_FIX_BFTV_REAL_V1__) return;
    window.__CRONOS_FIX_BFTV_REAL_V1__ = true;

    const KEY = 'p02';
    const BASE = 'https://www.boraflixtv.com/';

    /* ── 1. Completar definição do provider p02 ── */
    function patchProvider() {
        const P = window.CRONOS_MULTI_PROVIDERS;
        if (!P || !P[KEY]) return;
        // O BFTV tem EXATAMENTE os mesmos paths do BFCK
        P[KEY].buscaPath    = P[KEY].buscaPath    || '/?s=';
        P[KEY].filmePath    = P[KEY].filmePath    || '/filmes/';
        P[KEY].seriePath    = P[KEY].seriePath    || '/series/';
        P[KEY].episodioPath = P[KEY].episodioPath || '/episodios/';
        // Não tem semLetras, então letras funcionam normalmente
    }

    /* ── 2. Garantir data-provider="p02" em todo card/slide sem provider ── */
    function stampP02NodesNovos(grid, antesDo) {
        if (!grid) return;
        Array.from(grid.children).forEach(li => {
            if (!antesDo || !antesDo.has(li)) {
                // Se ainda não tem provider, provavelmente é p02 (contexto da chamada)
                if (!li.dataset.provider) li.dataset.provider = KEY;
            }
        });
    }

    /* ── 3. Patch em renderizarItemProvider para p02 ── */
    function patchRenderizarItem() {
        const orig = window.renderizarItemProvider;
        if (!orig) return;
        window.renderizarItemProvider = async function(item, gridId, key) {
            const ret = await orig.apply(this, arguments);
            if (key === KEY) {
                // Garantir que os cards recém-adicionados tenham data-provider correto
                const grid = document.getElementById(gridId);
                if (grid) {
                    grid.querySelectorAll('.card-item:not([data-provider])').forEach(li => {
                        li.dataset.provider = KEY;
                    });
                    grid.querySelectorAll('.card-item[data-provider=""]').forEach(li => {
                        li.dataset.provider = KEY;
                    });
                }
                if (typeof aplicarFiltroVisualCronos === 'function') aplicarFiltroVisualCronos();
            }
            return ret;
        };
        try { renderizarItemProvider = window.renderizarItemProvider; } catch(e) {}
    }

    /* ── 4. Patch em adicionarDestaquePremium para garantir providerKey p02 ── */
    function patchAdicionarDestaque() {
        const orig = window.adicionarDestaquePremium;
        if (!orig) return;
        window.adicionarDestaquePremium = async function(item, enriquecer) {
            const prevKey = window.__CRONOS_RENDER_PROVIDER_KEY;
            // Se o key atual for p02, garantir que após adicionar o dado tenha providerKey
            const antesLen = (window.destaquesPremiumHome || []).length;
            const ret = await orig.apply(this, arguments);
            const depoisLen = (window.destaquesPremiumHome || []).length;
            if (prevKey === KEY || window.__CRONOS_RENDER_PROVIDER_KEY === KEY) {
                for (let i = antesLen; i < depoisLen; i++) {
                    const d = window.destaquesPremiumHome[i];
                    if (d && !d.providerKey) {
                        d.providerKey = KEY;
                        const P = window.CRONOS_MULTI_PROVIDERS && window.CRONOS_MULTI_PROVIDERS[KEY];
                        if (P) {
                            d.providerName  = P.nome;
                            d.providerSigla = P.sigla;
                        }
                    }
                }
            }
            return ret;
        };
        try { adicionarDestaquePremium = window.adicionarDestaquePremium; } catch(e) {}
    }

    /* ── 5. Patch em atualizarDestaquePremium para garantir data-provider nos slides ── */
    function patchAtualizarDestaque() {
        const orig = window.atualizarDestaquePremium;
        if (!orig) return;
        window.atualizarDestaquePremium = function(novoIndex) {
            const ret = orig.apply(this, arguments);
            // Garantir que slides sem data-provider recebam o correto
            const box = document.getElementById('premiumSlides');
            if (box && Array.isArray(window.destaquesPremiumHome)) {
                Array.from(box.children).forEach((slide, idx) => {
                    const obra = window.destaquesPremiumHome[idx] || {};
                    if (!slide.dataset.provider && obra.providerKey) {
                        slide.dataset.provider = obra.providerKey;
                    }
                    if (!slide.dataset.providerLabel && obra.providerSigla) {
                        slide.dataset.providerLabel = obra.providerSigla;
                    }
                    // Se não tem nada, tenta inferir pela URL
                    if (!slide.dataset.provider && obra.url && /boraflixtv\.com/i.test(obra.url)) {
                        slide.dataset.provider = KEY;
                        slide.dataset.providerLabel = 'BFTV';
                    }
                });
                if (typeof aplicarFiltroVisualCronos === 'function') aplicarFiltroVisualCronos();
            }
            return ret;
        };
        try { atualizarDestaquePremium = window.atualizarDestaquePremium; } catch(e) {}
    }

    /* ── 6. Patch em garantirBadgeProvider para p02 ── */
    function patchGarantirBadge() {
        const orig = window.garantirBadgeProvider;
        if (!orig) return;
        window.garantirBadgeProvider = function(li, key) {
            // Se key chegou vazio mas o card tem href para boraflixtv, corrigir
            if (!key || key === 'b01') {
                const href = li && li.querySelector && (li.querySelector('a[href]') || {}).href || '';
                if (/boraflixtv\.com/i.test(href)) key = KEY;
            }
            return orig.call(this, li, key);
        };
        try { garantirBadgeProvider = window.garantirBadgeProvider; } catch(e) {}
    }

    /* ── 7. Verificação periódica: corrigir cards p02 sem data-provider ── */
    function corrigirCardsSemProvider() {
        // Qualquer card que tenha href para boraflixtv mas data-provider errado
        document.querySelectorAll('.card-item').forEach(card => {
            if (card.dataset.provider && card.dataset.provider !== '') return; // já tem
            const a = card.querySelector('a[href*="boraflixtv.com"]');
            if (a) {
                card.dataset.provider = KEY;
                if (typeof garantirBadgeProvider === 'function') garantirBadgeProvider(card, KEY);
            }
        });
        // Slides premium sem data-provider
        if (Array.isArray(window.destaquesPremiumHome)) {
            document.querySelectorAll('#premiumSlides .premium-slide').forEach((slide, idx) => {
                if (slide.dataset.provider) return;
                const obra = window.destaquesPremiumHome[idx] || {};
                const key = obra.providerKey || (obra.url && /boraflixtv\.com/i.test(obra.url) ? KEY : '');
                if (key) {
                    slide.dataset.provider = key;
                    slide.dataset.providerLabel = obra.providerSigla || (key === KEY ? 'BFTV' : key.toUpperCase());
                }
            });
        }
        if (typeof aplicarFiltroVisualCronos === 'function') aplicarFiltroVisualCronos();
    }

    /* ── Aplicar todos os patches ── */
    function aplicar() {
        patchProvider();
        patchRenderizarItem();
        patchAdicionarDestaque();
        patchAtualizarDestaque();
        patchGarantirBadge();
        // Rodar verificação após carregamentos
        setTimeout(corrigirCardsSemProvider, 2000);
        setTimeout(corrigirCardsSemProvider, 5000);
        setTimeout(corrigirCardsSemProvider, 10000);
        console.log('[CRONOS] Fix BFTV real v1 aplicado — estrutura confirmada pelo HTML real.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(aplicar, 200));
    } else {
        setTimeout(aplicar, 200);
    }
})();

/* =========================================================
   PATCH FINAL — VOLTAR INTELIGENTE DA FICHA TÉCNICA
   Mantém a origem real do clique: Filmes, Séries, Busca,
   Gênero, Ano, Favoritos, Histórico, Lançamentos etc.
========================================================= */
(function(){
    if (window.__CRONOS_PATCH_VOLTAR_ORIGEM_REAL__) return;
    window.__CRONOS_PATCH_VOLTAR_ORIGEM_REAL__ = true;

    window.__CRONOS_ORIGEM_DETALHES__ = window.__CRONOS_ORIGEM_DETALHES__ || {
        tela: 'telaInicio',
        scrollY: 0,
        contextoBuscaAtual: null,
        contextoBuscaMulti: null,
        tituloBusca: ''
    };

    function cronosCloneSeguro(obj) {
        try { return obj ? JSON.parse(JSON.stringify(obj)) : null; }
        catch(e) { return obj ? Object.assign({}, obj) : null; }
    }

    function cronosTelaAtivaAtual() {
        const tela = document.querySelector('.view-container.ativa');
        return tela && tela.id ? tela.id : 'telaInicio';
    }

    function cronosCapturarOrigemDetalhes() {
        const telaAtual = cronosTelaAtivaAtual();

        // Se já está na ficha ou no player, não sobrescreve a origem real.
        // Isso evita perder a volta correta quando abrir player, trocar episódio ou atualizar detalhes.
        if (telaAtual === 'telaDetalhes' || telaAtual === 'telaPlayer') {
            return window.__CRONOS_ORIGEM_DETALHES__;
        }

        const tituloBuscaEl = document.getElementById('tituloBusca');
        window.__CRONOS_ORIGEM_DETALHES__ = {
            tela: telaAtual || 'telaInicio',
            scrollY: window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0,
            contextoBuscaAtual: (typeof contextoBuscaAtual !== 'undefined') ? cronosCloneSeguro(contextoBuscaAtual) : null,
            contextoBuscaMulti: (typeof contextoBuscaMulti !== 'undefined') ? cronosCloneSeguro(contextoBuscaMulti) : null,
            tituloBusca: tituloBuscaEl ? tituloBuscaEl.innerText : '',
            termoBuscaAtual: (typeof termoBuscaAtual !== 'undefined') ? termoBuscaAtual : '',
            filtroTipoGridAtual: (typeof filtroTipoGridAtual !== 'undefined') ? cronosCloneSeguro(filtroTipoGridAtual) : null,
            filtroLetraGridAtual: (typeof filtroLetraGridAtual !== 'undefined') ? cronosCloneSeguro(filtroLetraGridAtual) : null,
            btnVoltarCategoriasDisplay: (function(){
                const btn = document.getElementById('btnVoltarCategorias');
                return btn ? btn.style.display : '';
            })()
        };
        return window.__CRONOS_ORIGEM_DETALHES__;
    }

    function cronosRestaurarContextoBusca(origem) {
        if (!origem || origem.tela !== 'telaBusca') return;
        try {
            if (origem.contextoBuscaAtual && typeof contextoBuscaAtual !== 'undefined') {
                contextoBuscaAtual = cronosCloneSeguro(origem.contextoBuscaAtual);
                window.contextoBuscaAtual = contextoBuscaAtual;
            }
        } catch(e) {}
        try {
            if (origem.contextoBuscaMulti && typeof contextoBuscaMulti !== 'undefined') {
                contextoBuscaMulti = cronosCloneSeguro(origem.contextoBuscaMulti);
                window.contextoBuscaMulti = contextoBuscaMulti;
            }
        } catch(e) {}
        try {
            if (typeof termoBuscaAtual !== 'undefined' && origem.termoBuscaAtual !== undefined) {
                termoBuscaAtual = origem.termoBuscaAtual;
                window.termoBuscaAtual = termoBuscaAtual;
            }
        } catch(e) {}
        try {
            if (origem.filtroTipoGridAtual && typeof filtroTipoGridAtual !== 'undefined') {
                Object.assign(filtroTipoGridAtual, origem.filtroTipoGridAtual);
            }
        } catch(e) {}
        try {
            if (origem.filtroLetraGridAtual && typeof filtroLetraGridAtual !== 'undefined') {
                Object.assign(filtroLetraGridAtual, origem.filtroLetraGridAtual);
            }
        } catch(e) {}

        const tituloBuscaEl = document.getElementById('tituloBusca');
        if (tituloBuscaEl && origem.tituloBusca) tituloBuscaEl.innerText = origem.tituloBusca;

        const btnVoltarCategorias = document.getElementById('btnVoltarCategorias');
        if (btnVoltarCategorias && origem.btnVoltarCategoriasDisplay !== undefined) {
            btnVoltarCategorias.style.display = origem.btnVoltarCategoriasDisplay;
        }
    }

    function cronosRestaurarScroll(origem) {
        const y = origem && Number.isFinite(Number(origem.scrollY)) ? Number(origem.scrollY) : 0;
        setTimeout(() => { try { window.scrollTo(0, y); } catch(e) {} }, 80);
        setTimeout(() => { try { window.scrollTo(0, y); } catch(e) {} }, 260);
    }

    function cronosAtivarDestinoRetorno(origem) {
        origem = origem || window.__CRONOS_ORIGEM_DETALHES__ || {};
        const destino = origem.tela || (typeof telaAnterior !== 'undefined' ? telaAnterior : '') || 'telaInicio';

        cronosRestaurarContextoBusca(origem);

        if (destino === 'telaFavoritos' && typeof carregarFavoritos === 'function') {
            carregarFavoritos(document.querySelector('button[onclick="carregarFavoritos(this)"]'));
            cronosRestaurarScroll(origem);
            return;
        }

        if (destino === 'telaHistorico' && typeof carregarHistorico === 'function') {
            carregarHistorico(document.querySelector('button[onclick="carregarHistorico(this)"]'));
            cronosRestaurarScroll(origem);
            return;
        }

        if (destino === 'telaCategorias' && typeof carregarCategorias === 'function') {
            carregarCategorias(document.querySelector('button[onclick="carregarCategorias(this)"]'));
            cronosRestaurarScroll(origem);
            return;
        }

        if (destino === 'telaConfiguracoes' && typeof carregarConfiguracoes === 'function') {
            carregarConfiguracoes(document.querySelector('button[onclick="carregarConfiguracoes(this)"]'));
            cronosRestaurarScroll(origem);
            return;
        }

        if (destino === 'telaLancamentos') {
            if (typeof ativarTela === 'function') ativarTela('telaLancamentos', document.querySelector('button[onclick="carregarLancamentos(this)"]'));
            cronosRestaurarScroll(origem);
            return;
        }

        if (typeof ativarTela === 'function') {
            const elDestino = document.getElementById(destino) ? destino : 'telaInicio';
            ativarTela(elDestino);
        }

        if (destino === 'telaInicio' && typeof renderizarResumoHomeLocal === 'function') {
            try { renderizarResumoHomeLocal(); } catch(e) {}
        }

        cronosRestaurarScroll(origem);
    }

    function cronosInstalarPatchAnalisarObra() {
        const atual = window.analisarObra || (typeof analisarObra === 'function' ? analisarObra : null);
        if (!atual || atual.__cronosVoltarOrigemReal) return;

        const original = atual;
        const nova = function(url, ano, tituloCard, img, isMovie) {
            cronosCapturarOrigemDetalhes();
            return original.apply(this, arguments);
        };
        nova.__cronosVoltarOrigemReal = true;
        nova.__cronosOriginal = original;

        window.analisarObra = nova;
        try { analisarObra = nova; } catch(e) {}
    }

    window.cronosCapturarOrigemDetalhes = cronosCapturarOrigemDetalhes;
    window.cronosVoltarOrigemDetalhes = cronosAtivarDestinoRetorno;
    window.voltarPaginaAnterior = function() {
        cronosAtivarDestinoRetorno(window.__CRONOS_ORIGEM_DETALHES__);
    };
    try { voltarPaginaAnterior = window.voltarPaginaAnterior; } catch(e) {}

    cronosInstalarPatchAnalisarObra();
    setTimeout(cronosInstalarPatchAnalisarObra, 300);
    setTimeout(cronosInstalarPatchAnalisarObra, 1200);
})();

