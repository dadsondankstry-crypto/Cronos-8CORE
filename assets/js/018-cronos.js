
(function(){
    const HOST_BLOQUEADO = [
        'megaembed.link',
        'suaap.com',
        'api.playerp1.sbs',
        'myvidplay.com'
    ];
    const SUPERFLIX_HOSTS = ['superflixapi.best', 'superflixapi.online', 'warezcdn.lat'];

    function normTxt(s){
        return String(s || '')
            .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
            .toLowerCase().replace(/\s+/g,' ').trim();
    }
    function dominioDe(url){
        try { return new URL(url).hostname.replace(/^www\./,'').toLowerCase(); } catch(e) { return ''; }
    }
    function caminhoDe(url){
        try { return new URL(url).pathname || ''; } catch(e) { return ''; }
    }
    function superflixValido(url){
        const host = dominioDe(url);
        if(!SUPERFLIX_HOSTS.includes(host)) return false;
        const path = caminhoDe(url).replace(/\/+$/,'');
        return /^\/filme\/[A-Za-z0-9_.-]+$/i.test(path) || /^\/serie\/[A-Za-z0-9_.-]+\/\d+\/\d+$/i.test(path);
    }
    function superembedsValido(url){
        const host = dominioDe(url);
        if(host !== 'superembeds.com') return false;
        const path = caminhoDe(url).replace(/\/+$/,'');
        return /^\/embed\/[A-Za-z0-9_.:-]+$/i.test(path);
    }
    function ehDominioPuroSuperembeds(url){
        const host = dominioDe(url);
        if(host !== 'superembeds.com') return false;
        const path = caminhoDe(url).replace(/\/+$/,'');
        return !path || path === '/';
    }

    function ehDominioPuroSuperflix(url){
        const host = dominioDe(url);
        if(!SUPERFLIX_HOSTS.includes(host)) return false;
        const path = caminhoDe(url).replace(/\/+$/,'');
        return !path || path === '/' || path === '/inicio';
    }

    window.cronosPlayerBloqueado = function(url){
        const u = String(url || '').toLowerCase();
        if(!u) return true;
        if(u.includes('youtube') || u.includes('youtu.be') || u.includes('youtube-nocookie')) return true;
        if(u.includes('/ads/') || u.includes('22bet') || u.includes('betano') || u.includes('doubleclick')) return true;
        if(u.includes('adserver') || u.includes('facebook.com') || u.includes('googlesyndication')) return true;
        if(u.includes('.mp4?') || /\.mp4(?:$|[?#])/i.test(u)) return true;
        if(/\.(jpg|jpeg|png|webp|gif|svg|css|js)(?:$|[?#])/i.test(u)) return true;
        if(u.includes('image.tmdb.org')) return true;
        if(HOST_BLOQUEADO.some(h => u.includes(h))) return true;
        if(ehDominioPuroSuperembeds(url)) return true;
        if(dominioDe(url) === 'superembeds.com' && !superembedsValido(url)) return true;
        if(ehDominioPuroSuperflix(url)) return true;
        if(SUPERFLIX_HOSTS.includes(dominioDe(url)) && !superflixValido(url)) return true;
        return false;
    };

    window.cronosNormalizarUrlPlayer = function(url, base = ''){
        try {
            let u = String(url || '').trim().replace(/&amp;/g, '&').replace(/&#038;/g, '&').replace(/\\/g, '');
            if(!u) return '';
            u = u.split(/\s+/)[0].replace(/["'<>]/g, '').trim();
            try { u = decodeURIComponent(u); } catch(e) {}
            if(u.startsWith('//')) u = 'https:' + u;
            if(u.startsWith('/')) {
                const b = base || (window.obraSendoVista && window.obraSendoVista.baseUrl) || (typeof CRONOS_BASE_URL !== 'undefined' ? CRONOS_BASE_URL : location.href);
                u = new URL(u, b).href;
            }
            return u;
        } catch(e) { return String(url || '').trim(); }
    };

    function classePlayer(url){
        const u = String(url || '').toLowerCase();
        const host = dominioDe(url);
        if(superembedsValido(url) || (u.includes('superembed') && !u.includes('superembeds.com'))) return 'superembeds';
        if(superflixValido(url)) return 'superflixapi';
        if(u.includes('playerembedapi.link')) return 'playerembedapi';
        if(u.includes('myvidplay.com')) return 'myvidplay';
        if(u.includes('viewplayer.online')) return 'viewplayer';
        if(u.includes('playerthree.online')) return 'playerthree';
        if(u.includes('abyssplayer') || u.includes('lisoflix.net/abyss') || u.includes('trembed=')) return 'liso';
        return 'desconhecido';
    }
    function nomePlayer(classe, url){
        if(classe === 'superembeds') return 'SuperEmbeds';
        if(classe === 'superflixapi') return 'SuperflixAPI';
        if(classe === 'playerembedapi') return 'PlayerEmbedAPI';
        if(classe === 'myvidplay') return 'MyVidPlay';
        if(classe === 'viewplayer') return 'ViewPlayer Original';
        if(classe === 'playerthree') return 'PlayerThree Original';
        if(classe === 'liso') return 'Abyss Player';
        const host = dominioDe(url);
        return host ? host : 'Player desconhecido';
    }
    function audioPlayer(label, url){
        const t = normTxt(label + ' ' + url);
        if(/\bleg\b|legendado|legendada|legenda/.test(t)) return 'Legendado';
        if(/\bdub\b|dublado|dublada|lang=dub|audio=dub/.test(t)) return 'Dublado';
        return '';
    }
    function prioridadePlayer(p){
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
    function audioPeso(audio){
        if(audio === 'Dublado') return 1;
        if(audio === 'Legendado') return 2;
        return 3;
    }
    function chavePlayer(src){
        return String(src || '').replace(/#.*$/, '').replace(/\/+$/, '').trim().toLowerCase();
    }

    window.cronosRotuloPlayer = function(player){
        const src = player && player.src || '';
        const classe = player && player.classe || classePlayer(src);
        const nome = player && player.nome || nomePlayer(classe, src);
        // Abyss/IBIS/Liso é player intermediário. Se não existir link direto diferente,
        // não mostra Dublado/Legendado fora: deixa apenas Abyss Player para escolher dentro.
        if(classe === 'liso') return 'Abyss Player';
        const audio = player && player.audio || audioPlayer(player && player.label, src);
        if(audio && !/Original/i.test(nome)) return `${audio} — ${nome}`;
        return nome;
    };

    window.cronosPushPlayer = function(lista, vistos, src, label = '', tipo = 'direto', base = ''){
        src = window.cronosNormalizarUrlPlayer(src, base);
        if(!src || window.cronosPlayerBloqueado(src)) return;
        const cls = classePlayer(src);
        if(cls === 'desconhecido') return;
        const audio = audioPlayer(label, src);
        const nome = nomePlayer(cls, src);
        const key = chavePlayer(src);
        if(!key || vistos.has(key)) return;
        vistos.add(key);
        lista.push({ src, label, tipo, classe: cls, audio, nome, prioridade: prioridadePlayer({src, classe:cls}) });
    };

    function extrairPossiveisUrls(texto){
        const out = [];
        const s = String(texto || '');
        const regs = [
            /(https?:\/\/[^"'<>\s]*(?:superembeds\.com|superembed|superflixapi\.(?:best|online)|warezcdn\.lat|playerembedapi\.link|viewplayer\.online|playerthree\.online|trembed|abyssplayer|lisoflix\.net\/abyss)[^"'<>\s]*)/ig
        ];
        regs.forEach(reg => { let m; while((m = reg.exec(s))) out.push(m[1]); });
        return out;
    }

    window.cronosExtrairPlayersDetalhe = function(doc, html, iframePrincipal = ''){
        const lista = [];
        const vistos = new Set();
        const add = (src, label, tipo, base) => window.cronosPushPlayer(lista, vistos, src, label, tipo, base || location.href);

        try {
            if(doc && doc.querySelectorAll) {
                const labelPorNume = {};
                doc.querySelectorAll('.dooplay_player_option, #playeroptionsul li, [data-nume][data-post]').forEach(opt => {
                    const n = opt.getAttribute('data-nume') || opt.dataset.nume || '';
                    const label = opt.querySelector('.title')?.innerText || opt.innerText || opt.textContent || '';
                    if(n && label) labelPorNume[n] = label.trim();
                    ['title','href','data-src','data-source','data-url'].forEach(a => {
                        const v = opt.getAttribute && opt.getAttribute(a);
                        if(v) add(v, label, 'option-attr');
                    });
                });
                doc.querySelectorAll('[id^="source-player-"]').forEach(box => {
                    const id = box.getAttribute('id') || '';
                    const nume = (id.match(/source-player-([^\s"']+)/i) || [])[1] || '';
                    const label = labelPorNume[nume] || box.querySelector('.title')?.innerText || box.getAttribute('data-title') || box.innerText || '';
                    box.querySelectorAll('iframe[src], source[src]').forEach(el => add(el.getAttribute('src') || '', label, 'source-box'));
                    box.querySelectorAll('[title], [href], [data-source], [data-src], [data-url]').forEach(el => {
                        ['title','href','data-source','data-src','data-url'].forEach(a => {
                            const v = el.getAttribute && el.getAttribute(a);
                            if(v) add(v, label || el.innerText || '', 'source-data');
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
                    ['src','title','href','data-source','data-src','data-url'].forEach(a => {
                        const v = el.getAttribute && el.getAttribute(a);
                        if(v) add(v, label, sel);
                    });
                }));
            }
        } catch(e) {}

        try {
            const texto = String(html || '');
            let m;
            const regexSourceBox = /<div[^>]+id=["']source-player-[^"']+["'][^>]*>[\s\S]*?<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi;
            while((m = regexSourceBox.exec(texto))) add(m[1], '', 'regex-source');
            const regexIframe = /<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi;
            while((m = regexIframe.exec(texto))) add(m[1], '', 'regex-iframe');
            const regexButtonTitle = /<(?:button|a)[^>]+(?:title|href)=["']([^"']+)["'][^>]*>([\s\S]*?)<\/(?:button|a)>/gi;
            while((m = regexButtonTitle.exec(texto))) add(m[1], m[2].replace(/<[^>]+>/g,' '), 'regex-button');
            extrairPossiveisUrls(texto).forEach(u => add(u, '', 'regex-direto'));
        } catch(e) {}

        if(iframePrincipal) add(iframePrincipal, 'Player Original', 'principal');
        return lista;
    };

    window.cronosExpandirPlayerInterno = async function(player){
        const src = window.cronosNormalizarUrlPlayer(player && player.src || '');
        const lower = src.toLowerCase();
        const podeExpandir = lower.includes('viewplayer.online') || lower.includes('playerthree.online') || lower.includes('trembed=');
        if(!src || !podeExpandir) return [];
        try {
            const htmlPlayer = await fetch(PROXY + encodeURIComponent(src)).then(r => r.ok ? r.text() : Promise.reject());
            const docPlayer = new DOMParser().parseFromString(htmlPlayer, 'text/html');
            const lista = [];
            const vistos = new Set();
            docPlayer.querySelectorAll('[data-show-player][data-source], [data-source], [title], a[href], iframe[src]').forEach(el => {
                const label = el.innerText || el.textContent || el.getAttribute('title') || el.getAttribute('aria-label') || '';
                ['data-source','data-src','data-url','title','href','src'].forEach(a => {
                    const v = el.getAttribute && el.getAttribute(a);
                    if(v) window.cronosPushPlayer(lista, vistos, v, label, 'interno', src);
                });
            });
            return lista;
        } catch(e) { return []; }
    };

    window.renderizarBotoesPlayerUnificadoCronos = async function(titulo, doc, htmlDetalhe, iframeSrc){
        const area = document.getElementById('areaAcaoDetalhe');
        if(!area) return;
        area.innerHTML = '<span style="color:#ffcc00;font-size:13px;">⏳ Buscando players disponíveis...</span>';

        const basePlayers = window.cronosExtrairPlayersDetalhe(doc, htmlDetalhe, iframeSrc);
        const final = [];
        const vistos = new Set();

        for(const p of basePlayers) {
            const clsBase = p && (p.classe || classePlayer(p.src));
            if(clsBase === 'liso') {
                window.cronosPushPlayer(final, vistos, p.src, 'Abyss Player', 'original', p.src);
                continue;
            }
            const internos = await window.cronosExpandirPlayerInterno(p);
            if(internos && internos.length) {
                internos.forEach(ip => window.cronosPushPlayer(final, vistos, ip.src, ip.label || p.label, ip.tipo || 'interno', p.src));
                window.cronosPushPlayer(final, vistos, p.src, p.classe === 'playerthree' ? 'PlayerThree Original' : 'ViewPlayer Original', 'original', p.src);
            } else {
                window.cronosPushPlayer(final, vistos, p.src, p.label, p.tipo, p.src);
            }
        }

        final.forEach(p => {
            p.classe = p.classe || classePlayer(p.src);
            if(p.classe === 'liso') {
                p.audio = '';
                p.nome = 'Abyss Player';
                p.label = 'Abyss Player';
                p.tipo = 'original';
            } else {
                p.audio = p.audio || audioPlayer(p.label, p.src);
                p.nome = p.nome || nomePlayer(p.classe, p.src);
            }
            p.prioridade = prioridadePlayer(p);
        });

        const finalSemAbyssDuplicado = [];
        const vistosAbyss = new Set();
        final.forEach(p => {
            if(p.classe === 'liso') {
                if(vistosAbyss.has('liso')) return;
                vistosAbyss.add('liso');
            }
            finalSemAbyssDuplicado.push(p);
        });
        final.length = 0;
        final.push(...finalSemAbyssDuplicado);

        final.sort((a,b) => (a.prioridade - b.prioridade) || (audioPeso(a.audio) - audioPeso(b.audio)) || String(a.nome).localeCompare(String(b.nome)));

        area.innerHTML = '';
        if(!final.length) {
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
