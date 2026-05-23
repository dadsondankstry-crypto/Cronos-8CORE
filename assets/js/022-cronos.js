
/*
  MODAL OFICIAL DOS PLAYERS DOS EPISÓDIOS — V3
  - Um único modal para episódios de todos os provedores.
  - Diretos primeiro: SuperEmbeds, PlayerEmbedAPI, WarezCDN, Superflix.best, Superflix Online, Hubby MP4, FonteDeCanais MP4.
  - Originais/fallback no final: Trembed, ViewPlayer, PlayerThree, Abyss.
  - Bloqueia anúncios, MegaEmbed, Suaap/Swap, Nix/Next e duplicados.
  - Completa WarezCDN/Superflix quando houver ID seguro.
*/
(function(){
    if(window.__CRONOS_MODAL_EPISODIOS_OFICIAL_V3__) return;
    window.__CRONOS_MODAL_EPISODIOS_OFICIAL_V3__ = true;

    const DIRECT_ORDER = ['superembeds','playerembedapi','warezcdn','superflixbest','superflixonline','hubby','fontedecanais'];
    const FALLBACK_ORDER = ['trembed','viewplayer','playerthree','abyss'];
    const PLAYER_APIS = {
        warezcdn: 'warezcdn.lat',
        superflixbest: 'superflixapi.best',
        superflixonline: 'superflixapi.online'
    };
    const LABELS = {
        superembeds: 'SuperEmbeds',
        playerembedapi: 'PlayerEmbedAPI',
        warezcdn: 'WarezCDN',
        superflixbest: 'Superflix.best',
        superflixonline: 'Superflix Online',
        hubby: 'Hubby MP4',
        fontedecanais: 'FonteDeCanais MP4',
        trembed: 'Trembed Original',
        viewplayer: 'ViewPlayer Original',
        playerthree: 'PlayerThree Original',
        abyss: 'Abyss Player'
    };

    function proxyUrl(url){
        return (typeof PROXY !== 'undefined' && PROXY) ? PROXY + encodeURIComponent(url) : url;
    }
    function normUrl(url, base){
        try {
            let u = String(url || '').trim().replace(/&amp;/g,'&').replace(/&#038;/g,'&').replace(/\\/g,'');
            if(!u) return '';
            u = u.split(/\s+/)[0].replace(/["'<>]/g,'').trim();
            if(!u) return '';
            if(/^javascript:|^mailto:|^tel:/i.test(u)) return '';
            try { if(/%3A%2F%2F/i.test(u)) u = decodeURIComponent(u); } catch(e) {}
            if(u.startsWith('//')) u = 'https:' + u;
            if(base) u = new URL(u, base).href;
            else if(u.startsWith('/')) u = new URL(u, location.href).href;
            return u;
        } catch(e) { return String(url || '').trim(); }
    }
    function hostOf(url){ try { return new URL(url).hostname.replace(/^www\./,'').toLowerCase(); } catch(e){ return ''; } }
    function pathOf(url){ try { return new URL(url).pathname.replace(/\/+$/,''); } catch(e){ return ''; } }
    function isBlocked(url, label){
        const u = String(url || '').toLowerCase();
        const l = String(label || '').toLowerCase();
        if(!u) return true;
        if(/trailer|preview|teaser|youtube|youtu\.be|youtube-nocookie/.test(u + ' ' + l)) return true;
        if(/megaembed|suaap|swap|nixplay|nextplay|api\.playerp1|myvidplay/.test(u + ' ' + l)) return true;
        if(/doubleclick|adserver|googlesyndication|facebook\.com|facebook\.net|betano|22bet|\/ads?\/|propag|publicid|advert|banner/.test(u + ' ' + l)) return true;
        if(/\.(jpg|jpeg|png|webp|gif|svg|css|js)(?:$|[?#])/i.test(u)) return true;
        if(/\.mp4(?:$|[?#])/i.test(u) && !/(hubby\.cx|fontedecanais|fonte-de-canais|fonte_de_canais|fontedecanais-me)/i.test(u)) return true;
        return false;
    }
    function validSuperembeds(url){
        return hostOf(url) === 'superembeds.com' && /^\/embed\/[A-Za-z0-9_.:-]+$/i.test(pathOf(url));
    }
    function validGroupUrl(url){
        const h = hostOf(url), p = pathOf(url);
        if(!['warezcdn.lat','superflixapi.best','superflixapi.online'].includes(h)) return false;
        return /^\/filme\/[A-Za-z0-9_.-]+$/i.test(p) || /^\/serie\/[A-Za-z0-9_.-]+\/\d+\/\d+$/i.test(p);
    }
    function classify(url, label){
        const u = String(url || '').toLowerCase();
        const h = hostOf(url);
        const l = String(label || '').toLowerCase();
        if(validSuperembeds(url) || /superembeds?\.com\/embed\//i.test(u)) return 'superembeds';
        if(/playerembedapi\.link\/\?v=/i.test(u)) return 'playerembedapi';
        if(h === 'warezcdn.lat' && validGroupUrl(url)) return 'warezcdn';
        if(h === 'superflixapi.best' && validGroupUrl(url)) return 'superflixbest';
        if(h === 'superflixapi.online' && validGroupUrl(url)) return 'superflixonline';
        if(/hubby\.cx\/.*\.mp4(?:$|[?#])/i.test(u)) return 'hubby';
        if(/(fontedecanais|fonte-de-canais|fonte_de_canais|fontedecanais-me).*\.mp4(?:$|[?#])/i.test(u)) return 'fontedecanais';
        if(/trembed/i.test(u + ' ' + l)) return 'trembed';
        if(/viewplayer\.online/i.test(u)) return 'viewplayer';
        if(/playerthree\.online/i.test(u)) return 'playerthree';
        if(/abyssplayer|abyss\.to|lisoflix\.net\/abyss|\babyss\b/i.test(u + ' ' + l)) return 'abyss';
        return '';
    }
    function isDirect(cls){ return DIRECT_ORDER.includes(cls); }
    function keyUrl(url){ return String(url || '').replace(/#.*$/,'').replace(/\/+$/,'').trim().toLowerCase(); }
    function addPlayer(lista, vistos, src, label, tipo, base){
        src = normUrl(src, base);
        if(!src || isBlocked(src, label)) return;
        const cls = classify(src, label);
        if(!cls) return;
        if((cls === 'superembeds' && !validSuperembeds(src)) || (['warezcdn','superflixbest','superflixonline'].includes(cls) && !validGroupUrl(src))) return;
        const k = keyUrl(src);
        if(!k || vistos.has(k)) return;
        vistos.add(k);
        lista.push({ src, label: label || LABELS[cls], classe: cls, nome: LABELS[cls], tipo: isDirect(cls) ? 'direto' : 'original' });
    }
    function extractUrlsFromText(text){
        const out = [];
        const s = String(text || '');
        const regs = [
            /(https?:\/\/[^"'<>\s]*(?:superembeds\.com\/embed|playerembedapi\.link\/\?v=|warezcdn\.lat\/(?:filme|serie)|superflixapi\.(?:best|online)\/(?:filme|serie)|hubby\.cx\/[^"'<>\s]*\.mp4|fontedecanais[^"'<>\s]*\.mp4|fonte[-_]?de[-_]?canais[^"'<>\s]*\.mp4|viewplayer\.online|playerthree\.online|trembed|abyssplayer|lisoflix\.net\/abyss)[^"'<>\s]*)/ig,
            /(?:data-source|data-src|data-url|title|href|src)=["']([^"']*(?:superembeds\.com\/embed|playerembedapi\.link\/\?v=|warezcdn\.lat\/(?:filme|serie)|superflixapi\.(?:best|online)\/(?:filme|serie)|hubby\.cx\/[^"']*\.mp4|fontedecanais[^"']*\.mp4|fonte[-_]?de[-_]?canais[^"']*\.mp4|viewplayer\.online|playerthree\.online|trembed|abyssplayer|lisoflix\.net\/abyss)[^"']*)["']/ig
        ];
        regs.forEach(reg => { let m; while((m = reg.exec(s))) out.push(m[1]); });
        return out;
    }
    function extractPrimeAttrs(doc, html, url){
        const el = doc && doc.querySelector ? doc.querySelector('#movie-player-container, [data-apicontentid], [data-contentid]') : null;
        const attrs = {
            id: el ? (el.getAttribute('data-apicontentid') || el.getAttribute('data-contentid') || '') : '',
            season: el ? (el.getAttribute('data-season') || '') : '',
            episode: el ? (el.getAttribute('data-episode') || '') : ''
        };
        const h = String(html || '');
        if(!attrs.id) attrs.id = (h.match(/data-(?:apicontentid|contentid)=["']([^"']+)["']/i) || [,''])[1] || '';
        if(!attrs.season) attrs.season = (h.match(/data-season=["']([^"']+)["']/i) || [,''])[1] || '';
        if(!attrs.episode) attrs.episode = (h.match(/data-episode=["']([^"']+)["']/i) || [,''])[1] || '';
        const m = String(url || '').match(/-(\d+)x(\d+)(?:\D|$)/i) || String(url || '').match(/(?:temporada|season)[^0-9]*(\d+).*?(?:episodio|episode|ep)[^0-9]*(\d+)/i) || [];
        if(!attrs.season && m[1]) attrs.season = m[1];
        if(!attrs.episode && m[2]) attrs.episode = m[2];
        return attrs;
    }
    function groupInfoFromUrl(url){
        try {
            const u = new URL(url);
            const host = u.hostname.replace(/^www\./,'').toLowerCase();
            if(!['warezcdn.lat','superflixapi.best','superflixapi.online'].includes(host)) return null;
            let m = u.pathname.match(/^\/filme\/([A-Za-z0-9_.-]+)\/?$/i);
            if(m) return { tipo:'filme', id:m[1] };
            m = u.pathname.match(/^\/serie\/([A-Za-z0-9_.-]+)\/(\d+)\/(\d+)\/?$/i);
            if(m) return { tipo:'serie', id:m[1], s:m[2], e:m[3] };
        } catch(e) {}
        return null;
    }
    function buildGroupUrl(cls, info){
        if(!info || !info.id || !PLAYER_APIS[cls]) return '';
        if(info.tipo === 'serie') {
            if(!info.s || !info.e) return '';
            return `https://${PLAYER_APIS[cls]}/serie/${info.id}/${parseInt(info.s,10) || info.s}/${parseInt(info.e,10) || info.e}`;
        }
        if(info.tipo === 'filme') return `https://${PLAYER_APIS[cls]}/filme/${info.id}`;
        return '';
    }
    function completeWarezGroup(lista, vistos, explicitInfo){
        let info = explicitInfo || null;
        if(!info) {
            for(const p of lista) {
                if(['warezcdn','superflixbest','superflixonline'].includes(p.classe)) { info = groupInfoFromUrl(p.src); if(info) break; }
            }
        }
        if(!info || !info.id) return;
        if(info.tipo === 'serie' && (!info.s || !info.e)) return;
        ['warezcdn','superflixbest','superflixonline'].forEach(cls => addPlayer(lista, vistos, buildGroupUrl(cls, info), LABELS[cls], 'direto'));
    }
    function sortAndDedupe(lista){
        const seen = new Set();
        const out = [];
        for(const p of lista) {
            const cls = p.classe || classify(p.src, p.label);
            if(!cls) continue;
            const group = cls === 'abyss' ? 'abyss' : (['warezcdn','superflixbest','superflixonline'].includes(cls) ? cls + '|' + (JSON.stringify(groupInfoFromUrl(p.src) || {}) || p.src) : keyUrl(p.src));
            if(seen.has(group)) continue;
            seen.add(group);
            out.push({ ...p, classe: cls, nome: LABELS[cls], tipo: isDirect(cls) ? 'direto' : 'original' });
        }
        out.sort((a,b)=>{
            const oa = isDirect(a.classe) ? DIRECT_ORDER.indexOf(a.classe) : 100 + FALLBACK_ORDER.indexOf(a.classe);
            const ob = isDirect(b.classe) ? DIRECT_ORDER.indexOf(b.classe) : 100 + FALLBACK_ORDER.indexOf(b.classe);
            return oa - ob;
        });
        return out;
    }
    function garantirModal(){
        let modal = document.getElementById('modalFontesEpisodioCronos');
        if(!modal){
            modal = document.createElement('div');
            modal.id = 'modalFontesEpisodioCronos';
            modal.className = 'modal-fontes-episodio-cronos';
            modal.innerHTML = '<div class="modal-fontes-episodio-box"><h3 id="modalFontesEpisodioTituloCronos">Escolha uma fonte</h3><p id="modalFontesEpisodioTextoCronos">Se uma fonte não carregar, volte e teste outra.</p><div class="modal-fontes-episodio-lista" id="modalFontesEpisodioListaCronos"></div><button type="button" class="modal-fontes-episodio-close" id="modalFontesEpisodioFecharCronos">Cancelar</button></div>';
            document.body.appendChild(modal);
        }
        if(!document.getElementById('cronosModalEpisodiosOficialCssV3')){
            const css = document.createElement('style');
            css.id = 'cronosModalEpisodiosOficialCssV3';
            css.textContent = `
                .modal-fontes-episodio-cronos{display:none;position:fixed;inset:0;background:rgba(0,0,0,.86);backdrop-filter:blur(8px);z-index:10080;align-items:center;justify-content:center;padding:18px;}
                .modal-fontes-episodio-box{background:#111;border:1px solid #00ffff;border-radius:10px;box-shadow:0 0 28px rgba(0,255,255,.22);max-width:560px;width:100%;padding:22px;text-align:center;}
                .modal-fontes-episodio-box h3{color:#fff;margin:0 0 8px;font-size:20px;line-height:1.25;}
                .modal-fontes-episodio-box p{color:#aaa;margin:0 0 16px;font-size:13px;line-height:1.4;}
                .modal-fontes-episodio-lista{display:flex;flex-direction:column;gap:10px;width:100%;}
                .modal-fontes-episodio-lista .btn-assistir{width:100%!important;max-width:100%!important;margin:0!important;justify-content:center!important;}
                .modal-fontes-episodio-lista .btn-cronos-player-direto{background:#8a2be2!important;color:#fff!important;border:1px solid #8a2be2!important;border-radius:5px!important;font-weight:bold!important;min-height:42px!important;}
                .modal-fontes-episodio-lista .btn-cronos-player-original{background:#061827!important;color:#9ee7ff!important;border:1px solid #00a8ff!important;border-radius:5px!important;font-weight:bold!important;min-height:42px!important;}
                .modal-fontes-episodio-status{color:#ffcc00;font-weight:bold;font-size:13px;padding:12px;border:1px dashed #333;border-radius:8px;background:#080808;}
                .modal-fontes-episodio-close{margin-top:14px;width:100%;padding:10px;border:1px solid #ff3030;background:#170909;color:#ff4d4d;border-radius:6px;font-weight:bold;cursor:pointer;}
                .modal-fontes-episodio-close:hover{background:#ff3030;color:#000;box-shadow:0 0 12px rgba(255,48,48,.55);}
            `;
            document.head.appendChild(css);
        }
        const fechar = () => { modal.style.display = 'none'; };
        const btnFechar = document.getElementById('modalFontesEpisodioFecharCronos');
        if(btnFechar && !btnFechar.__cronosModalOficialV3) { btnFechar.onclick = fechar; btnFechar.__cronosModalOficialV3 = true; }
        if(!modal.__cronosModalOficialV3) { modal.addEventListener('click', e => { if(e.target === modal) fechar(); }); modal.__cronosModalOficialV3 = true; }
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
    function fecharModal(){ const m = document.getElementById('modalFontesEpisodioCronos'); if(m) m.style.display = 'none'; const mp = document.getElementById('modalServidoresPrimeCronos'); if(mp) mp.style.display = 'none'; }
    async function fetchDoc(url){
        const res = await fetch(proxyUrl(url));
        if(!res || !res.ok) throw new Error('Falha ao buscar players');
        const html = await res.text();
        return { html, doc: new DOMParser().parseFromString(html, 'text/html') };
    }
    function addFromDoc(lista, vistos, doc, html, base){
        const add = (src, label) => addPlayer(lista, vistos, src, label, 'direto', base);
        try {
            if(doc && doc.querySelectorAll) {
                doc.querySelectorAll('[data-show-player][data-source], [data-source], [data-src], [data-url], iframe[src], source[src], a[href], button[title], a[title]').forEach(el => {
                    const label = el.innerText || el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || '';
                    ['data-source','data-src','data-url','src','href','title'].forEach(a => { const v = el.getAttribute && el.getAttribute(a); if(v) add(v, label); });
                });
                if(typeof window.extrairLinkLimpoDoPlayer === 'function') {
                    try { const antigo = window.extrairLinkLimpoDoPlayer(doc, html); if(antigo) add(antigo, 'Player Original'); } catch(e) {}
                }
            }
        } catch(e) {}
        extractUrlsFromText(html).forEach(u => add(u, ''));
    }
    async function expandInternalPlayers(lista){
        const expanded = [];
        const vistos = new Set();
        for(const p of lista) {
            if(isDirect(p.classe)) { addPlayer(expanded, vistos, p.src, p.label, p.tipo); continue; }
            let found = false;
            try {
                if(['viewplayer','playerthree','trembed'].includes(p.classe)) {
                    const { html, doc } = await fetchDoc(p.src);
                    const antes = expanded.length;
                    addFromDoc(expanded, vistos, doc, html, p.src);
                    found = expanded.length > antes;
                }
            } catch(e) {}
            addPlayer(expanded, vistos, p.src, LABELS[p.classe] || p.label, 'original');
            if(found) continue;
        }
        return expanded;
    }
    async function collectPlayersFromUrl(url){
        const lista = [], vistos = new Set();
        url = normUrl(url);
        if(!url) return [];
        addPlayer(lista, vistos, url, 'Player Original', 'original');
        let explicitInfo = null;
        try {
            const { html, doc } = await fetchDoc(url);
            addFromDoc(lista, vistos, doc, html, url);
            const attrs = extractPrimeAttrs(doc, html, url);
            if(attrs.id && attrs.season && attrs.episode) explicitInfo = { tipo:'serie', id:attrs.id, s:attrs.season, e:attrs.episode };
            else if(attrs.id && /\/filme\//i.test(url)) explicitInfo = { tipo:'filme', id:attrs.id };
        } catch(e) {}
        let expanded = await expandInternalPlayers(lista);
        const vistos2 = new Set(expanded.map(p => keyUrl(p.src)));
        completeWarezGroup(expanded, vistos2, explicitInfo);
        return sortAndDedupe(expanded);
    }
    function collectPrimePlayers(payload){
        const lista = [], vistos = new Set();
        const dados = payload && payload.dados || {};
        if(!dados || !dados.id) return [];
        const info = payload.tipo === 'filme' ? { tipo:'filme', id:dados.id } : { tipo:'serie', id:dados.id, s:dados.s || dados.season || dados.temporada, e:dados.e || dados.episode || dados.episodio };
        completeWarezGroup(lista, vistos, info);
        return sortAndDedupe(lista);
    }
    function renderButtons(titulo, fontes, obraHist){
        const lista = document.getElementById('modalFontesEpisodioListaCronos');
        const texto = document.getElementById('modalFontesEpisodioTextoCronos');
        if(!lista) return false;
        lista.innerHTML = '';
        if(!fontes.length) return false;
        if(texto) texto.textContent = 'Escolha uma fonte. Se uma não carregar, volte e teste outra.';
        fontes.forEach((p, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-assistir ' + (isDirect(p.classe) ? 'btn-cronos-player-direto' : 'btn-cronos-player-original');
            btn.title = p.src;
            btn.textContent = `▶ #${idx + 1} ${LABELS[p.classe] || p.nome || 'Player'}`;
            btn.onclick = () => {
                fecharModal();
                try { if(obraHist) { window.obraSendoVista = { ...(window.obraSendoVista || {}), ...obraHist, playerUrl:p.src }; } } catch(e) {}
                if(typeof window.abrirPlayer === 'function') window.abrirPlayer(titulo, p.src);
                else if(typeof abrirPlayer === 'function') abrirPlayer(titulo, p.src);
            };
            lista.appendChild(btn);
        });
        garantirModal().style.display = 'flex';
        return true;
    }

    window.cronosAbrirModalFontesEpisodioOficial = async function(titulo, origem, fallback){
        titulo = String(titulo || 'Episódio').replace(/\s+/g,' ').trim();
        statusModal(titulo, '⏳ Buscando players...');
        let fontes = [];
        let obraHist = null;
        try {
            if(origem && typeof origem === 'object' && origem.prime) {
                obraHist = origem.obraHist || null;
                fontes = collectPrimePlayers(origem);
            } else {
                const url = normUrl(origem && origem.url ? origem.url : origem);
                fontes = await collectPlayersFromUrl(url);
            }
        } catch(e) { fontes = []; }
        fontes = sortAndDedupe(fontes);
        if(renderButtons(titulo, fontes, obraHist)) return true;
        fecharModal();
        if(typeof fallback === 'function') return fallback();
        alert('Player de vídeo não encontrado na página deste episódio.');
        return false;
    };

    // Sobrescreve os fluxos padrão de episódio para sempre abrirem o modal oficial.
    const prepBase = (typeof window.prepararEpisodioDooplay === 'function') ? window.prepararEpisodioDooplay : (typeof prepararEpisodioDooplay === 'function' ? prepararEpisodioDooplay : null);
    if(prepBase && !prepBase.__cronosModalOficialV3){
        window.prepararEpisodioDooplay = function(tituloEpisodio, urlEpisodio){
            const args = arguments, ctx = this;
            return window.cronosAbrirModalFontesEpisodioOficial(tituloEpisodio, urlEpisodio, () => prepBase.apply(ctx, args));
        };
        window.prepararEpisodioDooplay.__cronosModalOficialV3 = true;
        try { prepararEpisodioDooplay = window.prepararEpisodioDooplay; } catch(e) {}
    }
    const buscarBase = (typeof window.buscarEAssistirEpisodio === 'function') ? window.buscarEAssistirEpisodio : (typeof buscarEAssistirEpisodio === 'function' ? buscarEAssistirEpisodio : null);
    if(buscarBase && !buscarBase.__cronosModalOficialV3){
        window.buscarEAssistirEpisodio = function(urlEpisodio, tituloEpisodio){
            const args = arguments, ctx = this;
            return window.cronosAbrirModalFontesEpisodioOficial(tituloEpisodio, urlEpisodio, () => buscarBase.apply(ctx, args));
        };
        window.buscarEAssistirEpisodio.__cronosModalOficialV3 = true;
        try { buscarEAssistirEpisodio = window.buscarEAssistirEpisodio; } catch(e) {}
    }

    // Cards de episódios da Home/Aba Episódios abrem direto o modal, para todos os provedores, inclusive PRIME.
    document.addEventListener('click', function(e){
        const card = e.target && e.target.closest ? e.target.closest('#gridEpisodios .episodio-home-card[data-url], #gridInicioEpisodios .episodio-home-card[data-url]') : null;
        if(!card) return;
        const url = normUrl(card.dataset.url || card.getAttribute('data-url') || '');
        if(!url) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const titulo = card.querySelector('h3')?.innerText || card.querySelector('.ano-card')?.innerText || 'Episódio';
        window.cronosAbrirModalFontesEpisodioOficial(titulo, url, () => {
            if(typeof window.analisarObra === 'function') window.analisarObra(url, '', titulo, card.querySelector('img')?.src || '', false);
            else if(typeof analisarObra === 'function') analisarObra(url, '', titulo, card.querySelector('img')?.src || '', false);
        });
    }, true);

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', garantirModal); else garantirModal();
})();
