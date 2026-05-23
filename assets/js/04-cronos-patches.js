(function () {
    const HOST_BLOQUEADO = [
        'megaembed.link',
        'suaap.com',
        'api.playerp1.sbs',
        'myvidplay.com'
    ];
    const SUPERFLIX_HOSTS = ['superflixapi.best', 'superflixapi.online', 'warezcdn.lat'];
    function normTxt(s) {
        return String(s || '')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().replace(/\s+/g, ' ').trim();
    }
    function dominioDe(url) {
        try {
            return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
        }
        catch (e) {
            return '';
        }
    }
    function caminhoDe(url) {
        try {
            return new URL(url).pathname || '';
        }
        catch (e) {
            return '';
        }
    }
    function superflixValido(url) {
        const host = dominioDe(url);
        if (!SUPERFLIX_HOSTS.includes(host))
            return false;
        const path = caminhoDe(url).replace(/\/+$/, '');
        return /^\/filme\/[A-Za-z0-9_.-]+$/i.test(path) || /^\/serie\/[A-Za-z0-9_.-]+\/\d+\/\d+$/i.test(path);
    }
    function superembedsValido(url) {
        const host = dominioDe(url);
        if (host !== 'superembeds.com')
            return false;
        const path = caminhoDe(url).replace(/\/+$/, '');
        return /^\/embed\/[A-Za-z0-9_.:-]+$/i.test(path);
    }
    function ehDominioPuroSuperembeds(url) {
        const host = dominioDe(url);
        if (host !== 'superembeds.com')
            return false;
        const path = caminhoDe(url).replace(/\/+$/, '');
        return !path || path === '/';
    }
    function ehDominioPuroSuperflix(url) {
        const host = dominioDe(url);
        if (!SUPERFLIX_HOSTS.includes(host))
            return false;
        const path = caminhoDe(url).replace(/\/+$/, '');
        return !path || path === '/' || path === '/inicio';
    }
    window.cronosPlayerBloqueado = function (url) {
        const u = String(url || '').toLowerCase();
        if (!u)
            return true;
        if (u.includes('youtube') || u.includes('youtu.be') || u.includes('youtube-nocookie'))
            return true;
        if (u.includes('/ads/') || u.includes('22bet') || u.includes('betano') || u.includes('doubleclick'))
            return true;
        if (u.includes('adserver') || u.includes('facebook.com') || u.includes('googlesyndication'))
            return true;
        if (u.includes('.mp4?') || /\.mp4(?:$|[?#])/i.test(u))
            return true;
        if (/\.(jpg|jpeg|png|webp|gif|svg|css|js)(?:$|[?#])/i.test(u))
            return true;
        if (u.includes('image.tmdb.org'))
            return true;
        if (HOST_BLOQUEADO.some(h => u.includes(h)))
            return true;
        if (ehDominioPuroSuperembeds(url))
            return true;
        if (dominioDe(url) === 'superembeds.com' && !superembedsValido(url))
            return true;
        if (ehDominioPuroSuperflix(url))
            return true;
        if (SUPERFLIX_HOSTS.includes(dominioDe(url)) && !superflixValido(url))
            return true;
        return false;
    };
    window.cronosNormalizarUrlPlayer = function (url, base = '') {
        try {
            let u = String(url || '').trim().replace(/&amp;/g, '&').replace(/&#038;/g, '&').replace(/\\/g, '');
            if (!u)
                return '';
            u = u.split(/\s+/)[0].replace(/["'<>]/g, '').trim();
            try {
                u = decodeURIComponent(u);
            }
            catch (e) { }
            if (u.startsWith('//'))
                u = 'https:' + u;
            if (u.startsWith('/')) {
                const b = base || (window.obraSendoVista && window.obraSendoVista.baseUrl) || (typeof CRONOS_BASE_URL !== 'undefined' ? CRONOS_BASE_URL : location.href);
                u = new URL(u, b).href;
            }
            return u;
        }
        catch (e) {
            return String(url || '').trim();
        }
    };
    function classePlayer(url) {
        const u = String(url || '').toLowerCase();
        const host = dominioDe(url);
        if (superembedsValido(url) || (u.includes('superembed') && !u.includes('superembeds.com')))
            return 'superembeds';
        if (superflixValido(url))
            return 'superflixapi';
        if (u.includes('playerembedapi.link'))
            return 'playerembedapi';
        if (u.includes('myvidplay.com'))
            return 'myvidplay';
        if (u.includes('viewplayer.online'))
            return 'viewplayer';
        if (u.includes('playerthree.online'))
            return 'playerthree';
        if (u.includes('abyssplayer') || u.includes('lisoflix.net/abyss') || u.includes('trembed='))
            return 'liso';
        return 'desconhecido';
    }
    function nomePlayer(classe, url) {
        if (classe === 'superembeds')
            return 'SuperEmbeds';
        if (classe === 'superflixapi')
            return 'SuperflixAPI';
        if (classe === 'playerembedapi')
            return 'PlayerEmbedAPI';
        if (classe === 'myvidplay')
            return 'MyVidPlay';
        if (classe === 'viewplayer')
            return 'ViewPlayer Original';
        if (classe === 'playerthree')
            return 'PlayerThree Original';
        if (classe === 'liso')
            return 'Abyss Player';
        const host = dominioDe(url);
        return host ? host : 'Player desconhecido';
    }
    function audioPlayer(label, url) {
        const t = normTxt(label + ' ' + url);
        if (/\bleg\b|legendado|legendada|legenda/.test(t))
            return 'Legendado';
        if (/\bdub\b|dublado|dublada|lang=dub|audio=dub/.test(t))
            return 'Dublado';
        return '';
    }
    function prioridadePlayer(p) {
        const c = p.classe || classePlayer(p.src);
        const map = {
            superembeds: 10,
            superflixapi: 20,
            playerembedapi: 30,
            myvidplay: 40,
            viewplayer: 50,
            playerthree: 60,
            liso: 70
        };
        return map[c] || 90;
    }
    function audioPeso(audio) {
        if (audio === 'Dublado')
            return 1;
        if (audio === 'Legendado')
            return 2;
        return 3;
    }
    function chavePlayer(src) {
        return String(src || '').replace(/#.*$/, '').replace(/\/+$/, '').trim().toLowerCase();
    }
    window.cronosRotuloPlayer = function (player) {
        const src = player && player.src || '';
        const classe = player && player.classe || classePlayer(src);
        const nome = player && player.nome || nomePlayer(classe, src);
        if (classe === 'liso')
            return 'Abyss Player';
        const audio = player && player.audio || audioPlayer(player && player.label, src);
        if (audio && !/Original/i.test(nome))
            return `${audio} — ${nome}`;
        return nome;
    };
    window.cronosPushPlayer = function (lista, vistos, src, label = '', tipo = 'direto', base = '') {
        src = window.cronosNormalizarUrlPlayer(src, base);
        if (!src || window.cronosPlayerBloqueado(src))
            return;
        const cls = classePlayer(src);
        if (cls === 'desconhecido')
            return;
        const audio = audioPlayer(label, src);
        const nome = nomePlayer(cls, src);
        const key = chavePlayer(src);
        if (!key || vistos.has(key))
            return;
        vistos.add(key);
        lista.push({ src, label, tipo, classe: cls, audio, nome, prioridade: prioridadePlayer({ src, classe: cls }) });
    };
    function extrairPossiveisUrls(texto) {
        const out = [];
        const s = String(texto || '');
        const regs = [
            /(https?:\/\/[^"'<>\s]*(?:superembeds\.com|superembed|superflixapi\.(?:best|online)|warezcdn\.lat|playerembedapi\.link|viewplayer\.online|playerthree\.online|trembed|abyssplayer|lisoflix\.net\/abyss)[^"'<>\s]*)/ig
        ];
        regs.forEach(reg => { let m; while ((m = reg.exec(s)))
            out.push(m[1]); });
        return out;
    }
    window.cronosExtrairPlayersDetalhe = function (doc, html, iframePrincipal = '') {
        const lista = [];
        const vistos = new Set();
        const add = (src, label, tipo, base) => window.cronosPushPlayer(lista, vistos, src, label, tipo, base || location.href);
        try {
            if (doc && doc.querySelectorAll) {
                const labelPorNume = {};
                doc.querySelectorAll('.dooplay_player_option, #playeroptionsul li, [data-nume][data-post]').forEach(opt => {
                    const n = opt.getAttribute('data-nume') || opt.dataset.nume || '';
                    const label = opt.querySelector('.title')?.innerText || opt.innerText || opt.textContent || '';
                    if (n && label)
                        labelPorNume[n] = label.trim();
                    ['title', 'href', 'data-src', 'data-source', 'data-url'].forEach(a => {
                        const v = opt.getAttribute && opt.getAttribute(a);
                        if (v)
                            add(v, label, 'option-attr');
                    });
                });
                doc.querySelectorAll('[id^="source-player-"]').forEach(box => {
                    const id = box.getAttribute('id') || '';
                    const nume = (id.match(/source-player-([^\s"']+)/i) || [])[1] || '';
                    const label = labelPorNume[nume] || box.querySelector('.title')?.innerText || box.getAttribute('data-title') || box.innerText || '';
                    box.querySelectorAll('iframe[src], source[src]').forEach(el => add(el.getAttribute('src') || '', label, 'source-box'));
                    box.querySelectorAll('[title], [href], [data-source], [data-src], [data-url]').forEach(el => {
                        ['title', 'href', 'data-source', 'data-src', 'data-url'].forEach(a => {
                            const v = el.getAttribute && el.getAttribute(a);
                            if (v)
                                add(v, label || el.innerText || '', 'source-data');
                        });
                    });
                });
                const seletores = [
                    '#dooplay_player_content iframe[src]', '#playcontainer iframe[src]', '.dooplay_player iframe[src]', '.source-box iframe[src]',
                    '.wp-content iframe[src]', 'iframe[src]', 'source[src]',
                    'button[title]', 'a[title]', 'button[data-source]', 'a[data-source]', '[data-src]', '[data-url]', 'a[href]'
                ];
                seletores.forEach(sel => doc.querySelectorAll(sel).forEach(el => {
                    const label = el.innerText || el.textContent || el.getAttribute('aria-label') || el.getAttribute('data-title') || '';
                    ['src', 'title', 'href', 'data-source', 'data-src', 'data-url'].forEach(a => {
                        const v = el.getAttribute && el.getAttribute(a);
                        if (v)
                            add(v, label, sel);
                    });
                }));
            }
        }
        catch (e) { }
        try {
            const texto = String(html || '');
            let m;
            const regexSourceBox = /<div[^>]+id=["']source-player-[^"']+["'][^>]*>[\s\S]*?<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi;
            while ((m = regexSourceBox.exec(texto)))
                add(m[1], '', 'regex-source');
            const regexIframe = /<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi;
            while ((m = regexIframe.exec(texto)))
                add(m[1], '', 'regex-iframe');
            const regexButtonTitle = /<(?:button|a)[^>]+(?:title|href)=["']([^"']+)["'][^>]*>([\s\S]*?)<\/(?:button|a)>/gi;
            while ((m = regexButtonTitle.exec(texto)))
                add(m[1], m[2].replace(/<[^>]+>/g, ' '), 'regex-button');
            extrairPossiveisUrls(texto).forEach(u => add(u, '', 'regex-direto'));
        }
        catch (e) { }
        if (iframePrincipal)
            add(iframePrincipal, 'Player Original', 'principal');
        return lista;
    };
    window.cronosExpandirPlayerInterno = async function (player) {
        const src = window.cronosNormalizarUrlPlayer(player && player.src || '');
        const lower = src.toLowerCase();
        const podeExpandir = lower.includes('viewplayer.online') || lower.includes('playerthree.online') || lower.includes('trembed=');
        if (!src || !podeExpandir)
            return [];
        try {
            const htmlPlayer = await fetch(PROXY + encodeURIComponent(src)).then(r => r.ok ? r.text() : Promise.reject());
            const docPlayer = new DOMParser().parseFromString(htmlPlayer, 'text/html');
            const lista = [];
            const vistos = new Set();
            docPlayer.querySelectorAll('[data-show-player][data-source], [data-source], [title], a[href], iframe[src]').forEach(el => {
                const label = el.innerText || el.textContent || el.getAttribute('title') || el.getAttribute('aria-label') || '';
                ['data-source', 'data-src', 'data-url', 'title', 'href', 'src'].forEach(a => {
                    const v = el.getAttribute && el.getAttribute(a);
                    if (v)
                        window.cronosPushPlayer(lista, vistos, v, label, 'interno', src);
                });
            });
            return lista;
        }
        catch (e) {
            return [];
        }
    };
    window.renderizarBotoesPlayerUnificadoCronos = async function (titulo, doc, htmlDetalhe, iframeSrc) {
        const area = document.getElementById('areaAcaoDetalhe');
        if (!area)
            return;
        area.innerHTML = '<span style="color:#ffcc00;font-size:13px;">⏳ Buscando players disponíveis...</span>';
        const basePlayers = window.cronosExtrairPlayersDetalhe(doc, htmlDetalhe, iframeSrc);
        const final = [];
        const vistos = new Set();
        for (const p of basePlayers) {
            const clsBase = p && (p.classe || classePlayer(p.src));
            if (clsBase === 'liso') {
                window.cronosPushPlayer(final, vistos, p.src, 'Abyss Player', 'original', p.src);
                continue;
            }
            const internos = await window.cronosExpandirPlayerInterno(p);
            if (internos && internos.length) {
                internos.forEach(ip => window.cronosPushPlayer(final, vistos, ip.src, ip.label || p.label, ip.tipo || 'interno', p.src));
                window.cronosPushPlayer(final, vistos, p.src, p.classe === 'playerthree' ? 'PlayerThree Original' : 'ViewPlayer Original', 'original', p.src);
            }
            else {
                window.cronosPushPlayer(final, vistos, p.src, p.label, p.tipo, p.src);
            }
        }
        final.forEach(p => {
            p.classe = p.classe || classePlayer(p.src);
            if (p.classe === 'liso') {
                p.audio = '';
                p.nome = 'Abyss Player';
                p.label = 'Abyss Player';
                p.tipo = 'original';
            }
            else {
                p.audio = p.audio || audioPlayer(p.label, p.src);
                p.nome = p.nome || nomePlayer(p.classe, p.src);
            }
            p.prioridade = prioridadePlayer(p);
        });
        const finalSemAbyssDuplicado = [];
        const vistosAbyss = new Set();
        final.forEach(p => {
            if (p.classe === 'liso') {
                if (vistosAbyss.has('liso'))
                    return;
                vistosAbyss.add('liso');
            }
            finalSemAbyssDuplicado.push(p);
        });
        final.length = 0;
        final.push(...finalSemAbyssDuplicado);
        final.sort((a, b) => (a.prioridade - b.prioridade) || (audioPeso(a.audio) - audioPeso(b.audio)) || String(a.nome).localeCompare(String(b.nome)));
        area.innerHTML = '';
        if (!final.length) {
            area.innerHTML = '<span style="color:#ff0055; font-weight:bold;">Player não encontrado na página base.</span>';
            return;
        }
        final.forEach((p, idx) => {
            const btn = document.createElement('button');
            const isOriginal = p.classe === 'viewplayer' || p.classe === 'playerthree' || p.classe === 'liso' || /original/i.test(p.tipo || p.label || p.nome || '');
            btn.className = 'btn-assistir ' + (isOriginal ? 'btn-cronos-player-original' : 'btn-cronos-player-direto');
            const label = window.cronosRotuloPlayer(p);
            btn.innerHTML = `▶ #${idx + 1} ${label}`;
            btn.title = p.src;
            btn.onclick = () => abrirPlayer(titulo, p.src);
            area.appendChild(btn);
        });
    };
})();
;
(function () {
    if (window.__CRONOS_REPARO_BFTV_EP_MODAL_V2__)
        return;
    window.__CRONOS_REPARO_BFTV_EP_MODAL_V2__ = true;
    try {
        const marca = 'cronos_reparo_fontes_8p_v2_ok';
        const chFontes = 'cronos_providers_ativos';
        const chFiltros = 'cronos_filtros_visuais';
        const keys = ['b01', 'p02', 'm03', 'e04', 's05', 'u06', 'l07', 'primeflix'];
        if (!localStorage.getItem(marca)) {
            const fontes = JSON.parse(localStorage.getItem(chFontes) || '{}') || {};
            const filtros = JSON.parse(localStorage.getItem(chFiltros) || '{}') || {};
            keys.forEach(k => { fontes[k] = true; filtros[k] = true; });
            localStorage.setItem(chFontes, JSON.stringify(fontes));
            localStorage.setItem(chFiltros, JSON.stringify(filtros));
            localStorage.setItem(marca, '1');
        }
    }
    catch (e) { }
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
    function normUrl(url) {
        let u = String(url || '').trim().replace(/&amp;/g, '&').replace(/&#038;/g, '&');
        if (!u)
            return '';
        try {
            u = new URL(u, location.href).href;
        }
        catch (e) { }
        return u;
    }
    function ehPrime(url) { return /primeflix\.mom/i.test(String(url || '')); }
    function playerDiretoValido(url) {
        const u = String(url || '').toLowerCase();
        if (!u)
            return false;
        if (typeof window.cronosPlayerBloqueado === 'function' && window.cronosPlayerBloqueado(url))
            return false;
        return /(superembeds\.com\/embed\/|superflixapi\.(best|online)\/filme\/|superflixapi\.(best|online)\/serie\/|warezcdn\.lat\/(filme|serie)\/|playerembedapi\.link\/\?v=|viewplayer\.online|playerthree\.online|trembed=|abyss|lisoflix\.net\/abyss)/i.test(u);
    }
    function keyPlayer(src) { return String(src || '').replace(/#.*$/, '').replace(/\/+$/, '').trim().toLowerCase(); }
    function garantirModal() {
        let modal = document.getElementById('modalFontesEpisodioCronos');
        if (modal)
            return modal;
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
        modal.addEventListener('click', e => { if (e.target === modal)
            fechar(); });
        return modal;
    }
    function statusModal(titulo, msg) {
        const modal = garantirModal();
        const title = document.getElementById('modalFontesEpisodioTituloCronos');
        const lista = document.getElementById('modalFontesEpisodioListaCronos');
        const texto = document.getElementById('modalFontesEpisodioTextoCronos');
        if (title)
            title.textContent = String(titulo || 'Episódio').replace(/\s+/g, ' ').trim();
        if (texto)
            texto.textContent = 'Buscando fontes disponíveis para este episódio.';
        if (lista)
            lista.innerHTML = `<div class="modal-fontes-episodio-status">${msg || '⏳ Buscando players...'}</div>`;
        modal.style.display = 'flex';
    }
    function fecharModal() { const m = document.getElementById('modalFontesEpisodioCronos'); if (m)
        m.style.display = 'none'; }
    function ordenar(lista) {
        return lista.sort((a, b) => {
            const pa = Number.isFinite(a.prioridade) ? a.prioridade : 999;
            const pb = Number.isFinite(b.prioridade) ? b.prioridade : 999;
            if (pa !== pb)
                return pa - pb;
            const aa = a.audio === 'Dublado' ? 1 : (a.audio === 'Legendado' ? 2 : 3);
            const ab = b.audio === 'Dublado' ? 1 : (b.audio === 'Legendado' ? 2 : 3);
            if (aa !== ab)
                return aa - ab;
            return String(a.nome || a.label || a.src).localeCompare(String(b.nome || b.label || b.src));
        });
    }
    function addFonte(final, vistos, p, label) {
        if (!p)
            return;
        let src = p.src || p.url || p.href || '';
        if (typeof window.cronosNormalizarUrlPlayer === 'function')
            src = window.cronosNormalizarUrlPlayer(src, p.base || location.href);
        else
            src = normUrl(src);
        if (!src || !playerDiretoValido(src))
            return;
        const k = keyPlayer(src);
        if (!k || vistos.has(k))
            return;
        vistos.add(k);
        const item = Object.assign({}, p, { src, label: p.label || label || '' });
        if (typeof window.cronosRotuloPlayer === 'function') {
            try {
                item.nomeRender = window.cronosRotuloPlayer(item);
            }
            catch (e) { }
        }
        final.push(item);
    }
    async function coletarFontes(titulo, url) {
        url = normUrl(url);
        let html = '', doc = null;
        try {
            const endpoint = (typeof PROXY !== 'undefined' && PROXY) ? PROXY + encodeURIComponent(url) : url;
            const res = await fetch(endpoint);
            if (res && res.ok)
                html = await res.text();
            if (html)
                doc = new DOMParser().parseFromString(html, 'text/html');
        }
        catch (e) { }
        let basePlayers = [];
        try {
            if (typeof window.cronosExtrairPlayersDetalhe === 'function')
                basePlayers = window.cronosExtrairPlayersDetalhe(doc, html, '');
        }
        catch (e) {
            basePlayers = [];
        }
        try {
            if (doc && typeof window.extrairLinkLimpoDoPlayer === 'function') {
                const antigo = window.extrairLinkLimpoDoPlayer(doc, html);
                if (antigo)
                    basePlayers.push({ src: antigo, label: 'Player Original', tipo: 'original' });
            }
            else if (doc && typeof extrairLinkLimpoDoPlayer === 'function') {
                const antigo = extrairLinkLimpoDoPlayer(doc, html);
                if (antigo)
                    basePlayers.push({ src: antigo, label: 'Player Original', tipo: 'original' });
            }
        }
        catch (e) { }
        if (!basePlayers.length && playerDiretoValido(url))
            basePlayers.push({ src: url, label: 'Player Original', tipo: 'original' });
        const final = [], vistos = new Set();
        for (const p of basePlayers) {
            try {
                const internos = (typeof window.cronosExpandirPlayerInterno === 'function') ? await window.cronosExpandirPlayerInterno(p) : [];
                if (internos && internos.length) {
                    internos.forEach(ip => addFonte(final, vistos, ip, ip.label || p.label));
                    addFonte(final, vistos, Object.assign({}, p, { label: /playerthree/i.test(String(p.src)) ? 'PlayerThree Original' : 'ViewPlayer Original', tipo: 'original' }), p.label);
                }
                else
                    addFonte(final, vistos, p, p.label);
            }
            catch (e) {
                addFonte(final, vistos, p, p.label);
            }
        }
        return ordenar(final);
    }
    window.cronosAbrirModalFontesEpisodioV2 = async function (titulo, url, fallback) {
        titulo = String(titulo || 'Episódio').replace(/\s+/g, ' ').trim();
        url = normUrl(url);
        if (!url || ehPrime(url)) {
            if (typeof fallback === 'function')
                fallback();
            return false;
        }
        statusModal(titulo, '⏳ Buscando fontes...');
        let fontes = [];
        try {
            fontes = await coletarFontes(titulo, url);
        }
        catch (e) {
            fontes = [];
        }
        const lista = document.getElementById('modalFontesEpisodioListaCronos');
        const texto = document.getElementById('modalFontesEpisodioTextoCronos');
        if (!lista)
            return false;
        lista.innerHTML = '';
        if (!fontes.length) {
            fecharModal();
            if (typeof fallback === 'function')
                fallback();
            return false;
        }
        if (texto)
            texto.textContent = 'Escolha uma fonte. Se uma não carregar, volte e teste outra.';
        fontes.forEach((p, idx) => {
            const btn = document.createElement('button');
            let rotulo = p.nomeRender || p.nome || p.label || 'Player';
            try {
                if (typeof window.cronosRotuloPlayer === 'function')
                    rotulo = window.cronosRotuloPlayer(p);
            }
            catch (e) { }
            const isOriginal = /original|viewplayer|playerthree/i.test(String(p.tipo || p.label || p.nome || p.src || rotulo));
            btn.type = 'button';
            btn.className = 'btn-assistir ' + (isOriginal ? 'btn-cronos-player-original' : 'btn-cronos-player-direto');
            btn.title = p.src;
            btn.innerHTML = `▶ #${idx + 1} ${rotulo}`;
            btn.onclick = () => { fecharModal(); if (typeof window.abrirPlayer === 'function')
                window.abrirPlayer(titulo, p.src);
            else if (typeof abrirPlayer === 'function')
                abrirPlayer(titulo, p.src); };
            lista.appendChild(btn);
        });
        garantirModal().style.display = 'flex';
        return true;
    };
    const prepBase = (typeof window.prepararEpisodioDooplay === 'function') ? window.prepararEpisodioDooplay : (typeof prepararEpisodioDooplay === 'function' ? prepararEpisodioDooplay : null);
    if (prepBase && !prepBase.__cronosModalV2) {
        window.prepararEpisodioDooplay = function (tituloEpisodio, urlEpisodio) {
            const args = arguments, ctx = this;
            return window.cronosAbrirModalFontesEpisodioV2(tituloEpisodio, urlEpisodio, () => prepBase.apply(ctx, args));
        };
        window.prepararEpisodioDooplay.__cronosModalV2 = true;
        try {
            prepararEpisodioDooplay = window.prepararEpisodioDooplay;
        }
        catch (e) { }
    }
    const buscarBase = (typeof window.buscarEAssistirEpisodio === 'function') ? window.buscarEAssistirEpisodio : (typeof buscarEAssistirEpisodio === 'function' ? buscarEAssistirEpisodio : null);
    if (buscarBase && !buscarBase.__cronosModalV2) {
        window.buscarEAssistirEpisodio = function (urlEpisodio, tituloEpisodio) {
            const args = arguments, ctx = this;
            return window.cronosAbrirModalFontesEpisodioV2(tituloEpisodio, urlEpisodio, () => buscarBase.apply(ctx, args));
        };
        window.buscarEAssistirEpisodio.__cronosModalV2 = true;
        try {
            buscarEAssistirEpisodio = window.buscarEAssistirEpisodio;
        }
        catch (e) { }
    }
    document.addEventListener('click', function (e) {
        const card = e.target && e.target.closest ? e.target.closest('#gridEpisodios .episodio-home-card[data-url], #gridInicioEpisodios .episodio-home-card[data-url]') : null;
        if (!card)
            return;
        const url = normUrl(card.dataset.url || card.getAttribute('data-url') || '');
        if (!url || ehPrime(url))
            return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const titulo = card.querySelector('h3')?.innerText || card.querySelector('.ano-card')?.innerText || 'Episódio';
        window.cronosAbrirModalFontesEpisodioV2(titulo, url, () => {
            if (typeof window.analisarObra === 'function')
                window.analisarObra(url, '', titulo, card.querySelector('img')?.src || '', false);
            else if (typeof analisarObra === 'function')
                analisarObra(url, '', titulo, card.querySelector('img')?.src || '', false);
        });
    }, true);
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', garantirModal);
    else
        garantirModal();
    setTimeout(() => {
        try {
            if (typeof window.atualizarBotoesProvider === 'function')
                window.atualizarBotoesProvider();
        }
        catch (e) { }
        try {
            if (typeof window.aplicarFiltroVisualCronos === 'function')
                window.aplicarFiltroVisualCronos();
        }
        catch (e) { }
    }, 500);
})();
;
(function () {
    if (window.__CRONOS_FIX_BFTV_REAL_V1__)
        return;
    window.__CRONOS_FIX_BFTV_REAL_V1__ = true;
    const KEY = 'p02';
    const BASE = 'https://www.boraflixtv.com/';
    function patchProvider() {
        const P = window.CRONOS_MULTI_PROVIDERS;
        if (!P || !P[KEY])
            return;
        P[KEY].buscaPath = P[KEY].buscaPath || '/?s=';
        P[KEY].filmePath = P[KEY].filmePath || '/filmes/';
        P[KEY].seriePath = P[KEY].seriePath || '/series/';
        P[KEY].episodioPath = P[KEY].episodioPath || '/episodios/';
    }
    function stampP02NodesNovos(grid, antesDo) {
        if (!grid)
            return;
        Array.from(grid.children).forEach(li => {
            if (!antesDo || !antesDo.has(li)) {
                if (!li.dataset.provider)
                    li.dataset.provider = KEY;
            }
        });
    }
    function patchRenderizarItem() {
        const orig = window.renderizarItemProvider;
        if (!orig)
            return;
        window.renderizarItemProvider = async function (item, gridId, key) {
            const ret = await orig.apply(this, arguments);
            if (key === KEY) {
                const grid = document.getElementById(gridId);
                if (grid) {
                    grid.querySelectorAll('.card-item:not([data-provider])').forEach(li => {
                        li.dataset.provider = KEY;
                    });
                    grid.querySelectorAll('.card-item[data-provider=""]').forEach(li => {
                        li.dataset.provider = KEY;
                    });
                }
                if (typeof aplicarFiltroVisualCronos === 'function')
                    aplicarFiltroVisualCronos();
            }
            return ret;
        };
        try {
            renderizarItemProvider = window.renderizarItemProvider;
        }
        catch (e) { }
    }
    function patchAdicionarDestaque() {
        const orig = window.adicionarDestaquePremium;
        if (!orig)
            return;
        window.adicionarDestaquePremium = async function (item, enriquecer) {
            const prevKey = window.__CRONOS_RENDER_PROVIDER_KEY;
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
                            d.providerName = P.nome;
                            d.providerSigla = P.sigla;
                        }
                    }
                }
            }
            return ret;
        };
        try {
            adicionarDestaquePremium = window.adicionarDestaquePremium;
        }
        catch (e) { }
    }
    function patchAtualizarDestaque() {
        const orig = window.atualizarDestaquePremium;
        if (!orig)
            return;
        window.atualizarDestaquePremium = function (novoIndex) {
            const ret = orig.apply(this, arguments);
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
                    if (!slide.dataset.provider && obra.url && /boraflixtv\.com/i.test(obra.url)) {
                        slide.dataset.provider = KEY;
                        slide.dataset.providerLabel = 'BFTV';
                    }
                });
                if (typeof aplicarFiltroVisualCronos === 'function')
                    aplicarFiltroVisualCronos();
            }
            return ret;
        };
        try {
            atualizarDestaquePremium = window.atualizarDestaquePremium;
        }
        catch (e) { }
    }
    function patchGarantirBadge() {
        const orig = window.garantirBadgeProvider;
        if (!orig)
            return;
        window.garantirBadgeProvider = function (li, key) {
            if (!key || key === 'b01') {
                const href = li && li.querySelector && (li.querySelector('a[href]') || {}).href || '';
                if (/boraflixtv\.com/i.test(href))
                    key = KEY;
            }
            return orig.call(this, li, key);
        };
        try {
            garantirBadgeProvider = window.garantirBadgeProvider;
        }
        catch (e) { }
    }
    function corrigirCardsSemProvider() {
        document.querySelectorAll('.card-item').forEach(card => {
            if (card.dataset.provider && card.dataset.provider !== '')
                return;
            const a = card.querySelector('a[href*="boraflixtv.com"]');
            if (a) {
                card.dataset.provider = KEY;
                if (typeof garantirBadgeProvider === 'function')
                    garantirBadgeProvider(card, KEY);
            }
        });
        if (Array.isArray(window.destaquesPremiumHome)) {
            document.querySelectorAll('#premiumSlides .premium-slide').forEach((slide, idx) => {
                if (slide.dataset.provider)
                    return;
                const obra = window.destaquesPremiumHome[idx] || {};
                const key = obra.providerKey || (obra.url && /boraflixtv\.com/i.test(obra.url) ? KEY : '');
                if (key) {
                    slide.dataset.provider = key;
                    slide.dataset.providerLabel = obra.providerSigla || (key === KEY ? 'BFTV' : key.toUpperCase());
                }
            });
        }
        if (typeof aplicarFiltroVisualCronos === 'function')
            aplicarFiltroVisualCronos();
    }
    function aplicar() {
        patchProvider();
        patchRenderizarItem();
        patchAdicionarDestaque();
        patchAtualizarDestaque();
        patchGarantirBadge();
        setTimeout(corrigirCardsSemProvider, 2000);
        setTimeout(corrigirCardsSemProvider, 5000);
        setTimeout(corrigirCardsSemProvider, 10000);
        console.log('[CRONOS] Fix BFTV real v1 aplicado — estrutura confirmada pelo HTML real.');
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(aplicar, 200));
    }
    else {
        setTimeout(aplicar, 200);
    }
})();
(function () {
    if (window.__CRONOS_PATCH_VOLTAR_ORIGEM_REAL__)
        return;
    window.__CRONOS_PATCH_VOLTAR_ORIGEM_REAL__ = true;
    window.__CRONOS_ORIGEM_DETALHES__ = window.__CRONOS_ORIGEM_DETALHES__ || {
        tela: 'telaInicio',
        scrollY: 0,
        contextoBuscaAtual: null,
        contextoBuscaMulti: null,
        tituloBusca: ''
    };
    function cronosCloneSeguro(obj) {
        try {
            return obj ? JSON.parse(JSON.stringify(obj)) : null;
        }
        catch (e) {
            return obj ? Object.assign({}, obj) : null;
        }
    }
    function cronosTelaAtivaAtual() {
        const tela = document.querySelector('.view-container.ativa');
        return tela && tela.id ? tela.id : 'telaInicio';
    }
    function cronosCapturarOrigemDetalhes() {
        const telaAtual = cronosTelaAtivaAtual();
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
            btnVoltarCategoriasDisplay: (function () {
                const btn = document.getElementById('btnVoltarCategorias');
                return btn ? btn.style.display : '';
            })()
        };
        return window.__CRONOS_ORIGEM_DETALHES__;
    }
    function cronosRestaurarContextoBusca(origem) {
        if (!origem || origem.tela !== 'telaBusca')
            return;
        try {
            if (origem.contextoBuscaAtual && typeof contextoBuscaAtual !== 'undefined') {
                contextoBuscaAtual = cronosCloneSeguro(origem.contextoBuscaAtual);
                window.contextoBuscaAtual = contextoBuscaAtual;
            }
        }
        catch (e) { }
        try {
            if (origem.contextoBuscaMulti && typeof contextoBuscaMulti !== 'undefined') {
                contextoBuscaMulti = cronosCloneSeguro(origem.contextoBuscaMulti);
                window.contextoBuscaMulti = contextoBuscaMulti;
            }
        }
        catch (e) { }
        try {
            if (typeof termoBuscaAtual !== 'undefined' && origem.termoBuscaAtual !== undefined) {
                termoBuscaAtual = origem.termoBuscaAtual;
                window.termoBuscaAtual = termoBuscaAtual;
            }
        }
        catch (e) { }
        try {
            if (origem.filtroTipoGridAtual && typeof filtroTipoGridAtual !== 'undefined') {
                Object.assign(filtroTipoGridAtual, origem.filtroTipoGridAtual);
            }
        }
        catch (e) { }
        try {
            if (origem.filtroLetraGridAtual && typeof filtroLetraGridAtual !== 'undefined') {
                Object.assign(filtroLetraGridAtual, origem.filtroLetraGridAtual);
            }
        }
        catch (e) { }
        const tituloBuscaEl = document.getElementById('tituloBusca');
        if (tituloBuscaEl && origem.tituloBusca)
            tituloBuscaEl.innerText = origem.tituloBusca;
        const btnVoltarCategorias = document.getElementById('btnVoltarCategorias');
        if (btnVoltarCategorias && origem.btnVoltarCategoriasDisplay !== undefined) {
            btnVoltarCategorias.style.display = origem.btnVoltarCategoriasDisplay;
        }
    }
    function cronosRestaurarScroll(origem) {
        const y = origem && Number.isFinite(Number(origem.scrollY)) ? Number(origem.scrollY) : 0;
        setTimeout(() => { try {
            window.scrollTo(0, y);
        }
        catch (e) { } }, 80);
        setTimeout(() => { try {
            window.scrollTo(0, y);
        }
        catch (e) { } }, 260);
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
            if (typeof ativarTela === 'function')
                ativarTela('telaLancamentos', document.querySelector('button[onclick="carregarLancamentos(this)"]'));
            cronosRestaurarScroll(origem);
            return;
        }
        if (typeof ativarTela === 'function') {
            const elDestino = document.getElementById(destino) ? destino : 'telaInicio';
            ativarTela(elDestino);
        }
        if (destino === 'telaInicio' && typeof renderizarResumoHomeLocal === 'function') {
            try {
                renderizarResumoHomeLocal();
            }
            catch (e) { }
        }
        cronosRestaurarScroll(origem);
    }
    function cronosInstalarPatchAnalisarObra() {
        const atual = window.analisarObra || (typeof analisarObra === 'function' ? analisarObra : null);
        if (!atual || atual.__cronosVoltarOrigemReal)
            return;
        const original = atual;
        const nova = function (url, ano, tituloCard, img, isMovie) {
            cronosCapturarOrigemDetalhes();
            return original.apply(this, arguments);
        };
        nova.__cronosVoltarOrigemReal = true;
        nova.__cronosOriginal = original;
        window.analisarObra = nova;
        try {
            analisarObra = nova;
        }
        catch (e) { }
    }
    window.cronosCapturarOrigemDetalhes = cronosCapturarOrigemDetalhes;
    window.cronosVoltarOrigemDetalhes = cronosAtivarDestinoRetorno;
    window.voltarPaginaAnterior = function () {
        cronosAtivarDestinoRetorno(window.__CRONOS_ORIGEM_DETALHES__);
    };
    try {
        voltarPaginaAnterior = window.voltarPaginaAnterior;
    }
    catch (e) { }
    cronosInstalarPatchAnalisarObra();
    setTimeout(cronosInstalarPatchAnalisarObra, 300);
    setTimeout(cronosInstalarPatchAnalisarObra, 1200);
})();
;
(function () {
    function cronosTituloCard(li) {
        return (li && li.querySelector('h3') && li.querySelector('h3').textContent || '').trim();
    }
    function cronosPosterCard(li) {
        return li?.dataset?.poster || li?.querySelector('.card-media img, img')?.src || '';
    }
    function cronosTipoCard(li) {
        const txt = (li?.querySelector('.badge-tipo')?.textContent || '').toLowerCase();
        if (txt.includes('série') || txt.includes('serie'))
            return { tipo: 'Série', isMovie: false, isSerie: true };
        if (txt.includes('filme'))
            return { tipo: 'Filme', isMovie: true, isSerie: false };
        return { tipo: 'Filme', isMovie: true, isSerie: false };
    }
    function cronosAdicionarFavoritarLisoPrime(root) {
        try {
            if (typeof adicionarBotaoFavoritarHoverCronos !== 'function')
                return;
            const base = root && root.querySelectorAll ? root : document;
            base.querySelectorAll('.card-item.global-card[data-provider="l07"], .card-item.global-card[data-provider="primeflix"]').forEach(li => {
                if (!li || li.querySelector('.btn-favoritar-card'))
                    return;
                if (li.closest('#gridFavoritos, #gridHistorico'))
                    return;
                const providerKey = li.dataset.providerKey || li.dataset.provider || '';
                if (providerKey !== 'l07' && providerKey !== 'primeflix')
                    return;
                const poster = cronosPosterCard(li);
                if (poster)
                    li.dataset.poster = poster;
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
        }
        catch (e) { }
    }
    document.addEventListener('DOMContentLoaded', () => cronosAdicionarFavoritarLisoPrime(document));
    const obs = new MutationObserver(muts => {
        for (const m of muts) {
            for (const node of m.addedNodes || []) {
                if (node && node.nodeType === 1)
                    cronosAdicionarFavoritarLisoPrime(node);
            }
        }
    });
    try {
        obs.observe(document.documentElement, { childList: true, subtree: true });
    }
    catch (e) { }
    window.cronosAdicionarFavoritarLisoPrime = cronosAdicionarFavoritarLisoPrime;
})();
;
(function () {
    if (window.__CRONOS_MODAL_EPISODIOS_OFICIAL_V3__)
        return;
    window.__CRONOS_MODAL_EPISODIOS_OFICIAL_V3__ = true;
    const DIRECT_ORDER = ['superembeds', 'playerembedapi', 'warezcdn', 'superflixbest', 'superflixonline', 'hubby', 'fontedecanais'];
    const FALLBACK_ORDER = ['trembed', 'viewplayer', 'playerthree', 'abyss'];
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
    function proxyUrl(url) {
        return (typeof PROXY !== 'undefined' && PROXY) ? PROXY + encodeURIComponent(url) : url;
    }
    function normUrl(url, base) {
        try {
            let u = String(url || '').trim().replace(/&amp;/g, '&').replace(/&#038;/g, '&').replace(/\\/g, '');
            if (!u)
                return '';
            u = u.split(/\s+/)[0].replace(/["'<>]/g, '').trim();
            if (!u)
                return '';
            if (/^javascript:|^mailto:|^tel:/i.test(u))
                return '';
            try {
                if (/%3A%2F%2F/i.test(u))
                    u = decodeURIComponent(u);
            }
            catch (e) { }
            if (u.startsWith('//'))
                u = 'https:' + u;
            if (base)
                u = new URL(u, base).href;
            else if (u.startsWith('/'))
                u = new URL(u, location.href).href;
            return u;
        }
        catch (e) {
            return String(url || '').trim();
        }
    }
    function hostOf(url) { try {
        return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    }
    catch (e) {
        return '';
    } }
    function pathOf(url) { try {
        return new URL(url).pathname.replace(/\/+$/, '');
    }
    catch (e) {
        return '';
    } }
    function isBlocked(url, label) {
        const u = String(url || '').toLowerCase();
        const l = String(label || '').toLowerCase();
        if (!u)
            return true;
        if (/trailer|preview|teaser|youtube|youtu\.be|youtube-nocookie/.test(u + ' ' + l))
            return true;
        if (/megaembed|suaap|swap|nixplay|nextplay|api\.playerp1|myvidplay/.test(u + ' ' + l))
            return true;
        if (/doubleclick|adserver|googlesyndication|facebook\.com|facebook\.net|betano|22bet|\/ads?\/|propag|publicid|advert|banner/.test(u + ' ' + l))
            return true;
        if (/\.(jpg|jpeg|png|webp|gif|svg|css|js)(?:$|[?#])/i.test(u))
            return true;
        if (/\.mp4(?:$|[?#])/i.test(u) && !/(hubby\.cx|fontedecanais|fonte-de-canais|fonte_de_canais|fontedecanais-me)/i.test(u))
            return true;
        return false;
    }
    function validSuperembeds(url) {
        return hostOf(url) === 'superembeds.com' && /^\/embed\/[A-Za-z0-9_.:-]+$/i.test(pathOf(url));
    }
    function validGroupUrl(url) {
        const h = hostOf(url), p = pathOf(url);
        if (!['warezcdn.lat', 'superflixapi.best', 'superflixapi.online'].includes(h))
            return false;
        return /^\/filme\/[A-Za-z0-9_.-]+$/i.test(p) || /^\/serie\/[A-Za-z0-9_.-]+\/\d+\/\d+$/i.test(p);
    }
    function classify(url, label) {
        const u = String(url || '').toLowerCase();
        const h = hostOf(url);
        const l = String(label || '').toLowerCase();
        if (validSuperembeds(url) || /superembeds?\.com\/embed\//i.test(u))
            return 'superembeds';
        if (/playerembedapi\.link\/\?v=/i.test(u))
            return 'playerembedapi';
        if (h === 'warezcdn.lat' && validGroupUrl(url))
            return 'warezcdn';
        if (h === 'superflixapi.best' && validGroupUrl(url))
            return 'superflixbest';
        if (h === 'superflixapi.online' && validGroupUrl(url))
            return 'superflixonline';
        if (/hubby\.cx\/.*\.mp4(?:$|[?#])/i.test(u))
            return 'hubby';
        if (/(fontedecanais|fonte-de-canais|fonte_de_canais|fontedecanais-me).*\.mp4(?:$|[?#])/i.test(u))
            return 'fontedecanais';
        if (/trembed/i.test(u + ' ' + l))
            return 'trembed';
        if (/viewplayer\.online/i.test(u))
            return 'viewplayer';
        if (/playerthree\.online/i.test(u))
            return 'playerthree';
        if (/abyssplayer|abyss\.to|lisoflix\.net\/abyss|\babyss\b/i.test(u + ' ' + l))
            return 'abyss';
        return '';
    }
    function isDirect(cls) { return DIRECT_ORDER.includes(cls); }
    function keyUrl(url) { return String(url || '').replace(/#.*$/, '').replace(/\/+$/, '').trim().toLowerCase(); }
    function addPlayer(lista, vistos, src, label, tipo, base) {
        src = normUrl(src, base);
        if (!src || isBlocked(src, label))
            return;
        const cls = classify(src, label);
        if (!cls)
            return;
        if ((cls === 'superembeds' && !validSuperembeds(src)) || (['warezcdn', 'superflixbest', 'superflixonline'].includes(cls) && !validGroupUrl(src)))
            return;
        const k = keyUrl(src);
        if (!k || vistos.has(k))
            return;
        vistos.add(k);
        lista.push({ src, label: label || LABELS[cls], classe: cls, nome: LABELS[cls], tipo: isDirect(cls) ? 'direto' : 'original' });
    }
    function extractUrlsFromText(text) {
        const out = [];
        const s = String(text || '');
        const regs = [
            /(https?:\/\/[^"'<>\s]*(?:superembeds\.com\/embed|playerembedapi\.link\/\?v=|warezcdn\.lat\/(?:filme|serie)|superflixapi\.(?:best|online)\/(?:filme|serie)|hubby\.cx\/[^"'<>\s]*\.mp4|fontedecanais[^"'<>\s]*\.mp4|fonte[-_]?de[-_]?canais[^"'<>\s]*\.mp4|viewplayer\.online|playerthree\.online|trembed|abyssplayer|lisoflix\.net\/abyss)[^"'<>\s]*)/ig,
            /(?:data-source|data-src|data-url|title|href|src)=["']([^"']*(?:superembeds\.com\/embed|playerembedapi\.link\/\?v=|warezcdn\.lat\/(?:filme|serie)|superflixapi\.(?:best|online)\/(?:filme|serie)|hubby\.cx\/[^"']*\.mp4|fontedecanais[^"']*\.mp4|fonte[-_]?de[-_]?canais[^"']*\.mp4|viewplayer\.online|playerthree\.online|trembed|abyssplayer|lisoflix\.net\/abyss)[^"']*)["']/ig
        ];
        regs.forEach(reg => { let m; while ((m = reg.exec(s)))
            out.push(m[1]); });
        return out;
    }
    function extractPrimeAttrs(doc, html, url) {
        const el = doc && doc.querySelector ? doc.querySelector('#movie-player-container, [data-apicontentid], [data-contentid]') : null;
        const attrs = {
            id: el ? (el.getAttribute('data-apicontentid') || el.getAttribute('data-contentid') || '') : '',
            season: el ? (el.getAttribute('data-season') || '') : '',
            episode: el ? (el.getAttribute('data-episode') || '') : ''
        };
        const h = String(html || '');
        if (!attrs.id)
            attrs.id = (h.match(/data-(?:apicontentid|contentid)=["']([^"']+)["']/i) || [, ''])[1] || '';
        if (!attrs.season)
            attrs.season = (h.match(/data-season=["']([^"']+)["']/i) || [, ''])[1] || '';
        if (!attrs.episode)
            attrs.episode = (h.match(/data-episode=["']([^"']+)["']/i) || [, ''])[1] || '';
        const m = String(url || '').match(/-(\d+)x(\d+)(?:\D|$)/i) || String(url || '').match(/(?:temporada|season)[^0-9]*(\d+).*?(?:episodio|episode|ep)[^0-9]*(\d+)/i) || [];
        if (!attrs.season && m[1])
            attrs.season = m[1];
        if (!attrs.episode && m[2])
            attrs.episode = m[2];
        return attrs;
    }
    function groupInfoFromUrl(url) {
        try {
            const u = new URL(url);
            const host = u.hostname.replace(/^www\./, '').toLowerCase();
            if (!['warezcdn.lat', 'superflixapi.best', 'superflixapi.online'].includes(host))
                return null;
            let m = u.pathname.match(/^\/filme\/([A-Za-z0-9_.-]+)\/?$/i);
            if (m)
                return { tipo: 'filme', id: m[1] };
            m = u.pathname.match(/^\/serie\/([A-Za-z0-9_.-]+)\/(\d+)\/(\d+)\/?$/i);
            if (m)
                return { tipo: 'serie', id: m[1], s: m[2], e: m[3] };
        }
        catch (e) { }
        return null;
    }
    function buildGroupUrl(cls, info) {
        if (!info || !info.id || !PLAYER_APIS[cls])
            return '';
        if (info.tipo === 'serie') {
            if (!info.s || !info.e)
                return '';
            return `https://${PLAYER_APIS[cls]}/serie/${info.id}/${parseInt(info.s, 10) || info.s}/${parseInt(info.e, 10) || info.e}`;
        }
        if (info.tipo === 'filme')
            return `https://${PLAYER_APIS[cls]}/filme/${info.id}`;
        return '';
    }
    function completeWarezGroup(lista, vistos, explicitInfo) {
        let info = explicitInfo || null;
        if (!info) {
            for (const p of lista) {
                if (['warezcdn', 'superflixbest', 'superflixonline'].includes(p.classe)) {
                    info = groupInfoFromUrl(p.src);
                    if (info)
                        break;
                }
            }
        }
        if (!info || !info.id)
            return;
        if (info.tipo === 'serie' && (!info.s || !info.e))
            return;
        ['warezcdn', 'superflixbest', 'superflixonline'].forEach(cls => addPlayer(lista, vistos, buildGroupUrl(cls, info), LABELS[cls], 'direto'));
    }
    function sortAndDedupe(lista) {
        const seen = new Set();
        const out = [];
        for (const p of lista) {
            const cls = p.classe || classify(p.src, p.label);
            if (!cls)
                continue;
            const group = cls === 'abyss' ? 'abyss' : (['warezcdn', 'superflixbest', 'superflixonline'].includes(cls) ? cls + '|' + (JSON.stringify(groupInfoFromUrl(p.src) || {}) || p.src) : keyUrl(p.src));
            if (seen.has(group))
                continue;
            seen.add(group);
            out.push({ ...p, classe: cls, nome: LABELS[cls], tipo: isDirect(cls) ? 'direto' : 'original' });
        }
        out.sort((a, b) => {
            const oa = isDirect(a.classe) ? DIRECT_ORDER.indexOf(a.classe) : 100 + FALLBACK_ORDER.indexOf(a.classe);
            const ob = isDirect(b.classe) ? DIRECT_ORDER.indexOf(b.classe) : 100 + FALLBACK_ORDER.indexOf(b.classe);
            return oa - ob;
        });
        return out;
    }
    function garantirModal() {
        let modal = document.getElementById('modalFontesEpisodioCronos');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modalFontesEpisodioCronos';
            modal.className = 'modal-fontes-episodio-cronos';
            modal.innerHTML = '<div class="modal-fontes-episodio-box"><h3 id="modalFontesEpisodioTituloCronos">Escolha uma fonte</h3><p id="modalFontesEpisodioTextoCronos">Se uma fonte não carregar, volte e teste outra.</p><div class="modal-fontes-episodio-lista" id="modalFontesEpisodioListaCronos"></div><button type="button" class="modal-fontes-episodio-close" id="modalFontesEpisodioFecharCronos">Cancelar</button></div>';
            document.body.appendChild(modal);
        }
        if (!document.getElementById('cronosModalEpisodiosOficialCssV3')) {
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
        if (btnFechar && !btnFechar.__cronosModalOficialV3) {
            btnFechar.onclick = fechar;
            btnFechar.__cronosModalOficialV3 = true;
        }
        if (!modal.__cronosModalOficialV3) {
            modal.addEventListener('click', e => { if (e.target === modal)
                fechar(); });
            modal.__cronosModalOficialV3 = true;
        }
        return modal;
    }
    function statusModal(titulo, msg) {
        const modal = garantirModal();
        const title = document.getElementById('modalFontesEpisodioTituloCronos');
        const lista = document.getElementById('modalFontesEpisodioListaCronos');
        const texto = document.getElementById('modalFontesEpisodioTextoCronos');
        if (title)
            title.textContent = String(titulo || 'Episódio').replace(/\s+/g, ' ').trim();
        if (texto)
            texto.textContent = 'Buscando fontes disponíveis para este episódio.';
        if (lista)
            lista.innerHTML = `<div class="modal-fontes-episodio-status">${msg || '⏳ Buscando players...'}</div>`;
        modal.style.display = 'flex';
    }
    function fecharModal() { const m = document.getElementById('modalFontesEpisodioCronos'); if (m)
        m.style.display = 'none'; const mp = document.getElementById('modalServidoresPrimeCronos'); if (mp)
        mp.style.display = 'none'; }
    async function fetchDoc(url) {
        const res = await fetch(proxyUrl(url));
        if (!res || !res.ok)
            throw new Error('Falha ao buscar players');
        const html = await res.text();
        return { html, doc: new DOMParser().parseFromString(html, 'text/html') };
    }
    function addFromDoc(lista, vistos, doc, html, base) {
        const add = (src, label) => addPlayer(lista, vistos, src, label, 'direto', base);
        try {
            if (doc && doc.querySelectorAll) {
                doc.querySelectorAll('[data-show-player][data-source], [data-source], [data-src], [data-url], iframe[src], source[src], a[href], button[title], a[title]').forEach(el => {
                    const label = el.innerText || el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || '';
                    ['data-source', 'data-src', 'data-url', 'src', 'href', 'title'].forEach(a => { const v = el.getAttribute && el.getAttribute(a); if (v)
                        add(v, label); });
                });
                if (typeof window.extrairLinkLimpoDoPlayer === 'function') {
                    try {
                        const antigo = window.extrairLinkLimpoDoPlayer(doc, html);
                        if (antigo)
                            add(antigo, 'Player Original');
                    }
                    catch (e) { }
                }
            }
        }
        catch (e) { }
        extractUrlsFromText(html).forEach(u => add(u, ''));
    }
    async function expandInternalPlayers(lista) {
        const expanded = [];
        const vistos = new Set();
        for (const p of lista) {
            if (isDirect(p.classe)) {
                addPlayer(expanded, vistos, p.src, p.label, p.tipo);
                continue;
            }
            let found = false;
            try {
                if (['viewplayer', 'playerthree', 'trembed'].includes(p.classe)) {
                    const { html, doc } = await fetchDoc(p.src);
                    const antes = expanded.length;
                    addFromDoc(expanded, vistos, doc, html, p.src);
                    found = expanded.length > antes;
                }
            }
            catch (e) { }
            addPlayer(expanded, vistos, p.src, LABELS[p.classe] || p.label, 'original');
            if (found)
                continue;
        }
        return expanded;
    }
    async function collectPlayersFromUrl(url) {
        const lista = [], vistos = new Set();
        url = normUrl(url);
        if (!url)
            return [];
        addPlayer(lista, vistos, url, 'Player Original', 'original');
        let explicitInfo = null;
        try {
            const { html, doc } = await fetchDoc(url);
            addFromDoc(lista, vistos, doc, html, url);
            const attrs = extractPrimeAttrs(doc, html, url);
            if (attrs.id && attrs.season && attrs.episode)
                explicitInfo = { tipo: 'serie', id: attrs.id, s: attrs.season, e: attrs.episode };
            else if (attrs.id && /\/filme\//i.test(url))
                explicitInfo = { tipo: 'filme', id: attrs.id };
        }
        catch (e) { }
        let expanded = await expandInternalPlayers(lista);
        const vistos2 = new Set(expanded.map(p => keyUrl(p.src)));
        completeWarezGroup(expanded, vistos2, explicitInfo);
        return sortAndDedupe(expanded);
    }
    function collectPrimePlayers(payload) {
        const lista = [], vistos = new Set();
        const dados = payload && payload.dados || {};
        if (!dados || !dados.id)
            return [];
        const info = payload.tipo === 'filme' ? { tipo: 'filme', id: dados.id } : { tipo: 'serie', id: dados.id, s: dados.s || dados.season || dados.temporada, e: dados.e || dados.episode || dados.episodio };
        completeWarezGroup(lista, vistos, info);
        return sortAndDedupe(lista);
    }
    function renderButtons(titulo, fontes, obraHist) {
        const lista = document.getElementById('modalFontesEpisodioListaCronos');
        const texto = document.getElementById('modalFontesEpisodioTextoCronos');
        if (!lista)
            return false;
        lista.innerHTML = '';
        if (!fontes.length)
            return false;
        if (texto)
            texto.textContent = 'Escolha uma fonte. Se uma não carregar, volte e teste outra.';
        fontes.forEach((p, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-assistir ' + (isDirect(p.classe) ? 'btn-cronos-player-direto' : 'btn-cronos-player-original');
            btn.title = p.src;
            btn.textContent = `▶ #${idx + 1} ${LABELS[p.classe] || p.nome || 'Player'}`;
            btn.onclick = () => {
                fecharModal();
                try {
                    if (obraHist) {
                        window.obraSendoVista = { ...(window.obraSendoVista || {}), ...obraHist, playerUrl: p.src };
                    }
                }
                catch (e) { }
                if (typeof window.abrirPlayer === 'function')
                    window.abrirPlayer(titulo, p.src);
                else if (typeof abrirPlayer === 'function')
                    abrirPlayer(titulo, p.src);
            };
            lista.appendChild(btn);
        });
        garantirModal().style.display = 'flex';
        return true;
    }
    window.cronosAbrirModalFontesEpisodioOficial = async function (titulo, origem, fallback) {
        titulo = String(titulo || 'Episódio').replace(/\s+/g, ' ').trim();
        statusModal(titulo, '⏳ Buscando players...');
        let fontes = [];
        let obraHist = null;
        try {
            if (origem && typeof origem === 'object' && origem.prime) {
                obraHist = origem.obraHist || null;
                fontes = collectPrimePlayers(origem);
            }
            else {
                const url = normUrl(origem && origem.url ? origem.url : origem);
                fontes = await collectPlayersFromUrl(url);
            }
        }
        catch (e) {
            fontes = [];
        }
        fontes = sortAndDedupe(fontes);
        if (renderButtons(titulo, fontes, obraHist))
            return true;
        fecharModal();
        if (typeof fallback === 'function')
            return fallback();
        alert('Player de vídeo não encontrado na página deste episódio.');
        return false;
    };
    const prepBase = (typeof window.prepararEpisodioDooplay === 'function') ? window.prepararEpisodioDooplay : (typeof prepararEpisodioDooplay === 'function' ? prepararEpisodioDooplay : null);
    if (prepBase && !prepBase.__cronosModalOficialV3) {
        window.prepararEpisodioDooplay = function (tituloEpisodio, urlEpisodio) {
            const args = arguments, ctx = this;
            return window.cronosAbrirModalFontesEpisodioOficial(tituloEpisodio, urlEpisodio, () => prepBase.apply(ctx, args));
        };
        window.prepararEpisodioDooplay.__cronosModalOficialV3 = true;
        try {
            prepararEpisodioDooplay = window.prepararEpisodioDooplay;
        }
        catch (e) { }
    }
    const buscarBase = (typeof window.buscarEAssistirEpisodio === 'function') ? window.buscarEAssistirEpisodio : (typeof buscarEAssistirEpisodio === 'function' ? buscarEAssistirEpisodio : null);
    if (buscarBase && !buscarBase.__cronosModalOficialV3) {
        window.buscarEAssistirEpisodio = function (urlEpisodio, tituloEpisodio) {
            const args = arguments, ctx = this;
            return window.cronosAbrirModalFontesEpisodioOficial(tituloEpisodio, urlEpisodio, () => buscarBase.apply(ctx, args));
        };
        window.buscarEAssistirEpisodio.__cronosModalOficialV3 = true;
        try {
            buscarEAssistirEpisodio = window.buscarEAssistirEpisodio;
        }
        catch (e) { }
    }
    document.addEventListener('click', function (e) {
        const card = e.target && e.target.closest ? e.target.closest('#gridEpisodios .episodio-home-card[data-url], #gridInicioEpisodios .episodio-home-card[data-url]') : null;
        if (!card)
            return;
        const url = normUrl(card.dataset.url || card.getAttribute('data-url') || '');
        if (!url)
            return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const titulo = card.querySelector('h3')?.innerText || card.querySelector('.ano-card')?.innerText || 'Episódio';
        window.cronosAbrirModalFontesEpisodioOficial(titulo, url, () => {
            if (typeof window.analisarObra === 'function')
                window.analisarObra(url, '', titulo, card.querySelector('img')?.src || '', false);
            else if (typeof analisarObra === 'function')
                analisarObra(url, '', titulo, card.querySelector('img')?.src || '', false);
        });
    }, true);
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', garantirModal);
    else
        garantirModal();
})();
