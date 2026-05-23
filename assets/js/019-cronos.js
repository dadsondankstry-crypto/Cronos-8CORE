
(function(){
    if(window.__CRONOS_REPARO_BFTV_EP_MODAL_V2__) return;
    window.__CRONOS_REPARO_BFTV_EP_MODAL_V2__ = true;

    // Reparo seguro: garante que as fontes/filtros antigos não fiquem presos em localStorage desativando a BFTV.
    // Faz isso só uma vez nesta versão do arquivo.
    try {
        const marca = 'cronos_reparo_fontes_8p_v2_ok';
        const chFontes = 'cronos_providers_ativos';
        const chFiltros = 'cronos_filtros_visuais';
        const keys = ['b01','p02','m03','e04','s05','u06','l07','primeflix'];
        if(!localStorage.getItem(marca)) {
            const fontes = JSON.parse(localStorage.getItem(chFontes) || '{}') || {};
            const filtros = JSON.parse(localStorage.getItem(chFiltros) || '{}') || {};
            keys.forEach(k => { fontes[k] = true; filtros[k] = true; });
            localStorage.setItem(chFontes, JSON.stringify(fontes));
            localStorage.setItem(chFiltros, JSON.stringify(filtros));
            localStorage.setItem(marca, '1');
        }
    } catch(e) {}

    const css = document.createElement('style');
    css.textContent = `
        #areaAcaoDetalhe .btn-cronos-player-direto,
        .modal-fontes-episodio-lista .btn-cronos-player-direto{
            background:#8a2be2!important;color:#fff!important;border:1px solid #8a2be2!important;
            border-radius:5px!important;font-weight:bold!important;min-height:42px!important;
        }
        #areaAcaoDetalhe .btn-cronos-player-original,
        .modal-fontes-episodio-lista .btn-cronos-player-original{
            background:#061827!important;color:#9ee7ff!important;border:1px solid #00a8ff!important;
            border-radius:5px!important;font-weight:bold!important;min-height:42px!important;
        }
        #areaAcaoDetalhe .btn-cronos-player-original:hover,
        .modal-fontes-episodio-lista .btn-cronos-player-original:hover{background:#00a8ff!important;color:#000!important;box-shadow:0 0 12px rgba(0,168,255,.65)!important;}
        .modal-fontes-episodio-cronos{display:none;position:fixed;inset:0;background:rgba(0,0,0,.86);backdrop-filter:blur(8px);z-index:10050;align-items:center;justify-content:center;padding:18px;}
        .modal-fontes-episodio-box{background:#111;border:1px solid #00ffff;border-radius:10px;box-shadow:0 0 28px rgba(0,255,255,.22);max-width:560px;width:100%;padding:22px;text-align:center;}
        .modal-fontes-episodio-box h3{color:#fff;margin:0 0 8px;font-size:20px;line-height:1.25;}
        .modal-fontes-episodio-box p{color:#aaa;margin:0 0 16px;font-size:13px;line-height:1.4;}
        .modal-fontes-episodio-lista{display:flex;flex-direction:column;gap:10px;width:100%;}
        .modal-fontes-episodio-lista .btn-assistir{width:100%!important;max-width:100%!important;margin:0!important;justify-content:center!important;}
        .modal-fontes-episodio-status{color:#ffcc00;font-weight:bold;font-size:13px;padding:12px;border:1px dashed #333;border-radius:8px;background:#080808;}
        .modal-fontes-episodio-close{margin-top:14px;width:100%;padding:10px;border:1px solid #ff3030;background:#170909;color:#ff4d4d;border-radius:6px;font-weight:bold;cursor:pointer;}
        .modal-fontes-episodio-close:hover{background:#ff3030;color:#000;box-shadow:0 0 12px rgba(255,48,48,.55);}
    `;
    document.head.appendChild(css);

    function normUrl(url){
        let u = String(url || '').trim().replace(/&amp;/g,'&').replace(/&#038;/g,'&');
        if(!u) return '';
        try { u = new URL(u, location.href).href; } catch(e) {}
        return u;
    }
    function ehPrime(url){ return /primeflix\.mom/i.test(String(url || '')); }
    function playerDiretoValido(url){
        const u = String(url || '').toLowerCase();
        if(!u) return false;
        if(typeof window.cronosPlayerBloqueado === 'function' && window.cronosPlayerBloqueado(url)) return false;
        return /(superembeds\.com\/embed\/|superflixapi\.(best|online)\/filme\/|superflixapi\.(best|online)\/serie\/|warezcdn\.lat\/(filme|serie)\/|playerembedapi\.link\/\?v=|viewplayer\.online|playerthree\.online|trembed=|abyss|lisoflix\.net\/abyss)/i.test(u);
    }
    function keyPlayer(src){ return String(src || '').replace(/#.*$/,'').replace(/\/+$/,'').trim().toLowerCase(); }
    function garantirModal(){
        let modal = document.getElementById('modalFontesEpisodioCronos');
        if(modal) return modal;
        modal = document.createElement('div');
        modal.id = 'modalFontesEpisodioCronos';
        modal.className = 'modal-fontes-episodio-cronos';
        modal.innerHTML = `
            <div class="modal-fontes-episodio-box">
                <h3 id="modalFontesEpisodioTituloCronos">Escolha uma fonte</h3>
                <p id="modalFontesEpisodioTextoCronos">Se uma fonte não carregar, volte e teste outra.</p>
                <div class="modal-fontes-episodio-lista" id="modalFontesEpisodioListaCronos"></div>
                <button type="button" class="modal-fontes-episodio-close" id="modalFontesEpisodioFecharCronos">Cancelar</button>
            </div>`;
        document.body.appendChild(modal);
        const fechar = () => { modal.style.display = 'none'; };
        document.getElementById('modalFontesEpisodioFecharCronos').onclick = fechar;
        modal.addEventListener('click', e => { if(e.target === modal) fechar(); });
        return modal;
    }
    function statusModal(titulo, msg){
        const modal = garantirModal();
        const title = document.getElementById('modalFontesEpisodioTituloCronos');
        const lista = document.getElementById('modalFontesEpisodioListaCronos');
        const texto = document.getElementById('modalFontesEpisodioTextoCronos');
        if(title) title.textContent = String(titulo || 'Episódio').replace(/\s+/g,' ').trim();
        if(texto) texto.textContent = 'Buscando fontes disponíveis para este episódio.';
        if(lista) lista.innerHTML = `<div class="modal-fontes-episodio-status">${msg || '⏳ Buscando players...'}</div>`;
        modal.style.display = 'flex';
    }
    function fecharModal(){ const m = document.getElementById('modalFontesEpisodioCronos'); if(m) m.style.display = 'none'; }
    function ordenar(lista){
        return lista.sort((a,b)=>{
            const pa = Number.isFinite(a.prioridade) ? a.prioridade : 999;
            const pb = Number.isFinite(b.prioridade) ? b.prioridade : 999;
            if(pa !== pb) return pa - pb;
            const aa = a.audio === 'Dublado' ? 1 : (a.audio === 'Legendado' ? 2 : 3);
            const ab = b.audio === 'Dublado' ? 1 : (b.audio === 'Legendado' ? 2 : 3);
            if(aa !== ab) return aa - ab;
            return String(a.nome || a.label || a.src).localeCompare(String(b.nome || b.label || b.src));
        });
    }
    function addFonte(final, vistos, p, label){
        if(!p) return;
        let src = p.src || p.url || p.href || '';
        if(typeof window.cronosNormalizarUrlPlayer === 'function') src = window.cronosNormalizarUrlPlayer(src, p.base || location.href);
        else src = normUrl(src);
        if(!src || !playerDiretoValido(src)) return;
        const k = keyPlayer(src);
        if(!k || vistos.has(k)) return;
        vistos.add(k);
        const item = Object.assign({}, p, {src, label: p.label || label || ''});
        if(typeof window.cronosRotuloPlayer === 'function') {
            try { item.nomeRender = window.cronosRotuloPlayer(item); } catch(e) {}
        }
        final.push(item);
    }
    async function coletarFontes(titulo, url){
        url = normUrl(url);
        let html = '', doc = null;
        try {
            const endpoint = (typeof PROXY !== 'undefined' && PROXY) ? PROXY + encodeURIComponent(url) : url;
            const res = await fetch(endpoint);
            if(res && res.ok) html = await res.text();
            if(html) doc = new DOMParser().parseFromString(html, 'text/html');
        } catch(e) {}

        let basePlayers = [];
        try {
            if(typeof window.cronosExtrairPlayersDetalhe === 'function') basePlayers = window.cronosExtrairPlayersDetalhe(doc, html, '');
        } catch(e) { basePlayers = []; }

        // Fallback importante: se o fluxo antigo achava o player, colocar esse player também no modal.
        try {
            if(doc && typeof window.extrairLinkLimpoDoPlayer === 'function') {
                const antigo = window.extrairLinkLimpoDoPlayer(doc, html);
                if(antigo) basePlayers.push({src: antigo, label:'Player Original', tipo:'original'});
            } else if(doc && typeof extrairLinkLimpoDoPlayer === 'function') {
                const antigo = extrairLinkLimpoDoPlayer(doc, html);
                if(antigo) basePlayers.push({src: antigo, label:'Player Original', tipo:'original'});
            }
        } catch(e) {}

        if(!basePlayers.length && playerDiretoValido(url)) basePlayers.push({src:url,label:'Player Original',tipo:'original'});

        const final = [], vistos = new Set();
        for(const p of basePlayers) {
            try {
                const internos = (typeof window.cronosExpandirPlayerInterno === 'function') ? await window.cronosExpandirPlayerInterno(p) : [];
                if(internos && internos.length) {
                    internos.forEach(ip => addFonte(final, vistos, ip, ip.label || p.label));
                    addFonte(final, vistos, Object.assign({}, p, {label: /playerthree/i.test(String(p.src)) ? 'PlayerThree Original' : 'ViewPlayer Original', tipo:'original'}), p.label);
                } else addFonte(final, vistos, p, p.label);
            } catch(e) { addFonte(final, vistos, p, p.label); }
        }
        return ordenar(final);
    }
    window.cronosAbrirModalFontesEpisodioV2 = async function(titulo, url, fallback){
        titulo = String(titulo || 'Episódio').replace(/\s+/g,' ').trim();
        url = normUrl(url);
        if(!url || ehPrime(url)) { if(typeof fallback === 'function') fallback(); return false; }
        statusModal(titulo, '⏳ Buscando fontes...');
        let fontes = [];
        try { fontes = await coletarFontes(titulo, url); } catch(e) { fontes = []; }
        const lista = document.getElementById('modalFontesEpisodioListaCronos');
        const texto = document.getElementById('modalFontesEpisodioTextoCronos');
        if(!lista) return false;
        lista.innerHTML = '';
        if(!fontes.length) {
            fecharModal();
            if(typeof fallback === 'function') fallback();
            return false;
        }
        if(texto) texto.textContent = 'Escolha uma fonte. Se uma não carregar, volte e teste outra.';
        fontes.forEach((p, idx) => {
            const btn = document.createElement('button');
            let rotulo = p.nomeRender || p.nome || p.label || 'Player';
            try { if(typeof window.cronosRotuloPlayer === 'function') rotulo = window.cronosRotuloPlayer(p); } catch(e) {}
            const isOriginal = /original|viewplayer|playerthree/i.test(String(p.tipo || p.label || p.nome || p.src || rotulo));
            btn.type = 'button';
            btn.className = 'btn-assistir ' + (isOriginal ? 'btn-cronos-player-original' : 'btn-cronos-player-direto');
            btn.title = p.src;
            btn.innerHTML = `▶ #${idx + 1} ${rotulo}`;
            btn.onclick = () => { fecharModal(); if(typeof window.abrirPlayer === 'function') window.abrirPlayer(titulo, p.src); else if(typeof abrirPlayer === 'function') abrirPlayer(titulo, p.src); };
            lista.appendChild(btn);
        });
        garantirModal().style.display = 'flex';
        return true;
    };

    // Liga o modal apenas nos fluxos de episódio. Não mexe em Home, Filmes, Séries, Premium ou carregamento dos provedores.
    const prepBase = (typeof window.prepararEpisodioDooplay === 'function') ? window.prepararEpisodioDooplay : (typeof prepararEpisodioDooplay === 'function' ? prepararEpisodioDooplay : null);
    if(prepBase && !prepBase.__cronosModalV2){
        window.prepararEpisodioDooplay = function(tituloEpisodio, urlEpisodio){
            const args = arguments, ctx = this;
            return window.cronosAbrirModalFontesEpisodioV2(tituloEpisodio, urlEpisodio, () => prepBase.apply(ctx, args));
        };
        window.prepararEpisodioDooplay.__cronosModalV2 = true;
        try { prepararEpisodioDooplay = window.prepararEpisodioDooplay; } catch(e) {}
    }
    const buscarBase = (typeof window.buscarEAssistirEpisodio === 'function') ? window.buscarEAssistirEpisodio : (typeof buscarEAssistirEpisodio === 'function' ? buscarEAssistirEpisodio : null);
    if(buscarBase && !buscarBase.__cronosModalV2){
        window.buscarEAssistirEpisodio = function(urlEpisodio, tituloEpisodio){
            const args = arguments, ctx = this;
            return window.cronosAbrirModalFontesEpisodioV2(tituloEpisodio, urlEpisodio, () => buscarBase.apply(ctx, args));
        };
        window.buscarEAssistirEpisodio.__cronosModalV2 = true;
        try { buscarEAssistirEpisodio = window.buscarEAssistirEpisodio; } catch(e) {}
    }
    document.addEventListener('click', function(e){
        const card = e.target && e.target.closest ? e.target.closest('#gridEpisodios .episodio-home-card[data-url], #gridInicioEpisodios .episodio-home-card[data-url]') : null;
        if(!card) return;
        const url = normUrl(card.dataset.url || card.getAttribute('data-url') || '');
        if(!url || ehPrime(url)) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const titulo = card.querySelector('h3')?.innerText || card.querySelector('.ano-card')?.innerText || 'Episódio';
        window.cronosAbrirModalFontesEpisodioV2(titulo, url, () => {
            if(typeof window.analisarObra === 'function') window.analisarObra(url, '', titulo, card.querySelector('img')?.src || '', false);
            else if(typeof analisarObra === 'function') analisarObra(url, '', titulo, card.querySelector('img')?.src || '', false);
        });
    }, true);
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', garantirModal); else garantirModal();
    setTimeout(()=>{
        try { if(typeof window.atualizarBotoesProvider === 'function') window.atualizarBotoesProvider(); } catch(e) {}
        try { if(typeof window.aplicarFiltroVisualCronos === 'function') window.aplicarFiltroVisualCronos(); } catch(e) {}
    }, 500);
})();
