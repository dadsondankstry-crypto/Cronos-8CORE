
(function(){
    const DEBUG = false;
    const log = (...a) => { if (DEBUG) console.log('[CRONOS V22 NAV REAL]', ...a); };

    function pad2(n){ return String(parseInt(n,10)||0).padStart(2,'0'); }
    function clean(t){ return String(t||'').replace(/[–—]/g,'-').replace(/\s+/g,' ').trim(); }
    function normUrl(url){
        let u = String(url||'').trim();
        if(!u) return '';
        try { u = new URL(u, location.href).href; } catch(e) {}
        return u.replace(/#.*$/,'').replace(/\/$/,'');
    }
    function epNums(txt){
        const t = clean(txt);
        let m = t.match(/S\s*(\d{1,3})\s*E\s*(\d{1,4})/i);
        if(m) return { temp: pad2(m[1]), ep: pad2(m[2]) };
        m = t.match(/(?:epis[oó]dio|episode|ep\.?|e)\s*(\d{1,4})/i);
        if(m) return { temp:'', ep: pad2(m[1]) };
        return { temp:'', ep:'' };
    }
    function ehFilme(){
        try {
            const o = (typeof obraSendoVista !== 'undefined' && obraSendoVista) ? obraSendoVista : (window.obraSendoVista || {});
            if(!o) return false;
            if(o.isMovie === true) return true;
            if(String(o.tipo||'').toLowerCase() === 'filme') return true;
            if(String(o.url||'').includes('/filmes/')) return true;
            if(String(o.url||'').includes('/filme/')) return true;
        } catch(e) {}
        return false;
    }
    function serieAtual(){
        try { if (typeof tituloSerieAtual !== 'undefined' && tituloSerieAtual) return clean(tituloSerieAtual); } catch(e) {}
        try { if (typeof obraSendoVista !== 'undefined' && obraSendoVista && obraSendoVista.titulo) return clean(obraSendoVista.titulo); } catch(e) {}
        return 'Série';
    }
    function mapaAtual(){
        try {
            if (typeof dadosSeriesAtual === 'undefined' || !dadosSeriesAtual) return null;
            const audio = (typeof localAudioAtivo !== 'undefined' && localAudioAtivo && dadosSeriesAtual[localAudioAtivo]) ? localAudioAtivo : Object.keys(dadosSeriesAtual)[0];
            return dadosSeriesAtual[audio] || null;
        } catch(e) { return null; }
    }
    function episodioUtil(li){
        if(!li || !li.querySelector) return false;
        const txt = clean(li.innerText).toLowerCase();
        if(txt.includes('aguardando lançamento') || txt.includes('ainda não foi lançado') || txt.includes('em breve')) return false;
        const nativeUrl = li.getAttribute('data-native-url') || li.querySelector('.episodiotitle a')?.getAttribute('href') || li.querySelector('a[href*="/episodios/"]')?.getAttribute('href') || '';
        const iframeId = li.dataset?.episode_id || li.getAttribute('data-episode-id') || '';
        return !!(nativeUrl || iframeId);
    }
    function listaReal(){
        if(ehFilme()) return [];
        const mapa = mapaAtual();
        if(!mapa) return [];
        const sids = Object.keys(mapa).sort((a,b)=>(parseInt(a,10)||0)-(parseInt(b,10)||0));
        if(!sids.length) return [];
        let sid = sids[0];
        try { if (typeof temporadaAtiva !== 'undefined' && temporadaAtiva && mapa[temporadaAtiva]) sid = temporadaAtiva; } catch(e) {}
        const seasonIndex = Math.max(1, sids.indexOf(sid) + 1);
        const temp = pad2(seasonIndex);
        const serie = serieAtual();
        const eps = Array.from(mapa[sid] || []);
        const lista = [];

        // IMPORTANTE: usa a mesma ordem e o mesmo número usados pela renderizarGradeEpisodios: index + 1.
        // Não ordena de novo por texto, porque isso foi o que fazia E01/E08 receberem botões errados.
        eps.forEach((li, originalIndex) => {
            if(!episodioUtil(li)) return;
            const nativeUrlRaw = li.getAttribute('data-native-url') || li.querySelector('.episodiotitle a')?.getAttribute('href') || li.querySelector('a[href*="/episodios/"]')?.getAttribute('href') || '';
            const iframeId = li.dataset?.episode_id || li.getAttribute('data-episode-id') || '';
            const nativeUrl = normUrl(nativeUrlRaw);
            const playerUrl = iframeId ? normUrl('https://viewplayer.online/episodio/' + iframeId) : '';
            const url = nativeUrl || playerUrl;
            if(!url) return;
            const ep = pad2(originalIndex + 1);
            lista.push({
                index: lista.length,
                originalIndex,
                temp,
                ep,
                titulo: `${serie} - S${temp}E${ep}`,
                url,
                nativeUrl,
                playerUrl,
                iframeId
            });
        });
        window.__cronosPlaylistV22 = lista;
        log('lista real', lista.map(x=>x.titulo));
        return lista;
    }
    function garantirNav(){
        const tela = document.getElementById('telaPlayer');
        const wrap = tela && tela.querySelector('.player-wrapper');
        if(!tela || !wrap) return null;
        let nav = document.getElementById('playerNavegacao');
        if(!nav){
            nav = document.createElement('div');
            nav.id = 'playerNavegacao';
            nav.innerHTML = '<button class="btn-nav-ep" id="btnEpAnterior" type="button">Episódio Anterior</button><button class="btn-nav-ep" id="btnEpProximo" type="button">Próximo Episódio</button>';
        }
        nav.classList.remove('cronos-v21-autorizada','cronos-nav-bloqueada-v20','cronos-nav-top','cronos-nav-below','cronos-nav-after-player');
        nav.classList.add('player-navegacao','cronos-nav-after-player-v19','cronos-v22-lock');
        if (document.getElementById('cronosPlayerBottomRowV24')) { const rowV24 = document.getElementById('cronosPlayerBottomRowV24'); if(nav.parentElement !== rowV24) rowV24.appendChild(nav); } else if(nav.previousElementSibling !== wrap) wrap.insertAdjacentElement('afterend', nav);
        return nav;
    }
    function esconder(){
        const nav = garantirNav();
        if(!nav) return;
        nav.classList.remove('cronos-v22-autorizada','cronos-v21-autorizada');
        nav.classList.add('cronos-v22-lock');
        nav.style.display = '';
        ['btnEpAnterior','btnEpProximo'].forEach(id => {
            const b = document.getElementById(id);
            if(b){ b.classList.remove('cronos-v22-show'); b.style.display=''; b.onclick=null; }
        });
    }
    function acharIndice(titulo, urlVideo){
        const lista = window.__cronosPlaylistV22 || listaReal();
        if(!lista.length) return -1;
        const nums = epNums(titulo);
        if(nums.ep){
            const idx = lista.findIndex(x => x.ep === nums.ep && (!nums.temp || x.temp === nums.temp));
            if(idx >= 0) return idx;
        }
        const pend = window.__cronosPendingEpisodeV22;
        if(pend && Number.isInteger(pend.index) && lista[pend.index]) return pend.index;
        const u = normUrl(urlVideo);
        if(u){
            const idx = lista.findIndex(x => [x.url,x.nativeUrl,x.playerUrl].map(normUrl).includes(u));
            if(idx >= 0) return idx;
        }
        return -1;
    }
    function abrirEntrada(ep){
        if(!ep) return;
        window.__cronosPendingEpisodeV22 = { index: ep.index, titulo: ep.titulo, url: ep.url, nativeUrl: ep.nativeUrl, playerUrl: ep.playerUrl };
        if(ep.nativeUrl && typeof window.prepararEpisodioDooplay === 'function') window.prepararEpisodioDooplay(ep.titulo, ep.nativeUrl);
        else if(typeof window.abrirPlayer === 'function') window.abrirPlayer(ep.titulo, ep.playerUrl || ep.url);
    }
    function aplicar(titulo, urlVideo){
        const nav = garantirNav();
        const ant = document.getElementById('btnEpAnterior');
        const prox = document.getElementById('btnEpProximo');
        if(!nav || !ant || !prox) return;
        const lista = listaReal();
        if(ehFilme() || lista.length <= 1){ esconder(); return; }
        const idx = acharIndice(titulo, urlVideo);
        if(idx < 0){ esconder(); return; }
        const anterior = idx > 0 ? lista[idx - 1] : null;
        const proximo = idx < lista.length - 1 ? lista[idx + 1] : null;
        if(!anterior && !proximo){ esconder(); return; }

        nav.classList.add('cronos-v22-lock','cronos-v22-autorizada');
        nav.classList.remove('cronos-nav-bloqueada-v20');
        nav.style.display = '';

        if(anterior){
            ant.classList.add('cronos-v22-show');
            ant.textContent = 'Episódio Anterior';
            ant.onclick = (e) => { e.preventDefault(); e.stopPropagation(); abrirEntrada(anterior); };
        } else {
            ant.classList.remove('cronos-v22-show');
            ant.onclick = null;
        }
        if(proximo){
            prox.classList.add('cronos-v22-show');
            prox.textContent = 'Próximo Episódio';
            prox.onclick = (e) => { e.preventDefault(); e.stopPropagation(); abrirEntrada(proximo); };
        } else {
            prox.classList.remove('cronos-v22-show');
            prox.onclick = null;
        }
        log('aplicar', {titulo, urlVideo, idx, total:lista.length, anterior:!!anterior, proximo:!!proximo});
    }

    // Atualiza a lista sempre que a grade muda.
    const renderBase = window.renderizarGradeEpisodios;
    if(typeof renderBase === 'function' && !renderBase.__cronosV22Real){
        window.renderizarGradeEpisodios = function(){
            const r = renderBase.apply(this, arguments);
            setTimeout(listaReal, 0);
            return r;
        };
        window.renderizarGradeEpisodios.__cronosV22Real = true;
    }

    const prepBase = window.prepararEpisodioDooplay;
    if(typeof prepBase === 'function' && !prepBase.__cronosV22Real){
        window.prepararEpisodioDooplay = function(tituloEpisodio, urlEpisodio){
            const lista = listaReal();
            const nums = epNums(tituloEpisodio);
            let idx = -1;
            if(nums.ep) idx = lista.findIndex(x => x.ep === nums.ep && (!nums.temp || x.temp === nums.temp));
            if(idx < 0){
                const u = normUrl(urlEpisodio);
                idx = lista.findIndex(x => [x.url,x.nativeUrl,x.playerUrl].map(normUrl).includes(u));
            }
            window.__cronosPendingEpisodeV22 = idx >= 0 ? { index: idx, titulo: lista[idx].titulo, url: lista[idx].url, nativeUrl: lista[idx].nativeUrl, playerUrl: lista[idx].playerUrl } : null;
            return prepBase.apply(this, arguments);
        };
        window.prepararEpisodioDooplay.__cronosV22Real = true;
    }

    const abrirBase = window.abrirPlayer;
    if(typeof abrirBase === 'function' && !abrirBase.__cronosV22Real){
        window.abrirPlayer = function(titulo, urlVideo){
            const r = abrirBase.apply(this, arguments);
            // V20/V21 ainda podem tentar mexer depois. V22 reaplica por último e o CSS trava os botões errados.
            [20,120,420,900,1600,2600].forEach(ms => setTimeout(() => aplicar(titulo, urlVideo), ms));
            return r;
        };
        window.abrirPlayer.__cronosV22Real = true;
    }

    const fecharBase = window.fecharPlayer;
    if(typeof fecharBase === 'function' && !fecharBase.__cronosV22Real){
        window.fecharPlayer = function(){
            const r = fecharBase.apply(this, arguments);
            window.__cronosPendingEpisodeV22 = null;
            esconder();
            return r;
        };
        window.fecharPlayer.__cronosV22Real = true;
    }

    const analisarBase = window.analisarObra;
    if(typeof analisarBase === 'function' && !analisarBase.__cronosV22Real){
        window.analisarObra = function(){
            window.__cronosPendingEpisodeV22 = null;
            esconder();
            return analisarBase.apply(this, arguments);
        };
        window.analisarObra.__cronosV22Real = true;
    }

    function iniciar(){ esconder(); listaReal(); }
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
})();
