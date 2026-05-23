
(function(){
    const TITULO_ORIGINAL_CRONOS_V15 = document.title || 'Cronos';

    function limpar(txt){
        return String(txt || '').replace(/\s+/g, ' ').trim();
    }

    function tituloPlayerSerieSemNomeDoEpisodio(titulo){
        let t = limpar(titulo);
        // Ex.: "Naruto - S01E01 - Nome do episódio" => "Naruto - S01E01"
        let m = t.match(/^(.+?)\s*[-–]\s*S\s*(\d{1,2})\s*E\s*(\d{1,4})(?:\s*[-–].*)?$/i);
        if (m) return `${limpar(m[1])} - S${String(m[2]).padStart(2,'0')}E${String(m[3]).padStart(2,'0')}`;
        // Ex.: "Naruto - S1 E1 / alguma coisa" => "Naruto - S01E01"
        m = t.match(/^(.+?)\s*[-–]\s*S\s*(\d{1,2})\s*E\s*(\d{1,4})(?:\s*[\/|].*)?$/i);
        if (m) return `${limpar(m[1])} - S${String(m[2]).padStart(2,'0')}E${String(m[3]).padStart(2,'0')}`;
        return t;
    }

    function tipoPlayerCronosV15(url){
        const u = String(url || '').toLowerCase();
        // Mantém a regra testada: superflixapi no topo; superembed(s) centralizado.
        if (u.includes('superflixapi')) return 'seletor';
        if (u.includes('superembeds') || u.includes('superembed')) return 'video';
        if (u.includes('viewplayer') || u.includes('playerthree') || u.includes('trembed')) return 'video';
        return 'video';
    }

    function aplicarModoPlayer(url){
        const tela = document.getElementById('telaPlayer');
        if (!tela) return;
        const modo = tipoPlayerCronosV15(url || document.getElementById('iframePlayer')?.src || '');
        tela.classList.remove('player-modo-seletor', 'player-modo-video');
        tela.classList.add(modo === 'seletor' ? 'player-modo-seletor' : 'player-modo-video');
    }

    function garantirNavegacaoPlayer(){
        const tela = document.getElementById('telaPlayer');
        const wrap = tela && tela.querySelector('.player-wrapper');
        if (!tela || !wrap) return;
        if (document.getElementById('playerNavegacao')) return;
        const nav = document.createElement('div');
        nav.id = 'playerNavegacao';
        nav.className = 'player-navegacao';
        nav.style.display = 'none';
        nav.innerHTML = '<button class="btn-nav-ep" id="btnEpAnterior" style="display:none;">Episódio Anterior</button><button class="btn-nav-ep" id="btnEpProximo" style="display:none;">Próximo Episódio</button>';
        wrap.after(nav);
    }

    function montarListaPlayerDaTemporadaAtual(){
        try {
            const lista = [];
            const mapa = (typeof dadosSeriesAtual !== 'undefined' && dadosSeriesAtual[localAudioAtivo]) ? dadosSeriesAtual[localAudioAtivo] : {};
            const sids = Object.keys(mapa).sort((a,b)=>parseInt(a)-parseInt(b));
            if (!sids.length) return lista;
            let sidAtual = (typeof temporadaAtiva !== 'undefined' && temporadaAtiva && mapa[temporadaAtiva]) ? temporadaAtiva : sids[0];
            const seasonIndex = sids.indexOf(sidAtual) + 1;
            const tNum = String(seasonIndex || 1).padStart(2, '0');
            const eps = mapa[sidAtual] || [];
            eps.forEach((li, index) => {
                const nativeUrl = li.getAttribute('data-native-url');
                const iframeId = li.dataset.episode_id || li.getAttribute('data-episode-id');
                const eNum = String(index + 1).padStart(2, '0');
                let epUrl = nativeUrl || (iframeId ? `https://viewplayer.online/episodio/${iframeId}` : '');
                if (!epUrl) return;
                let epNumText = li.querySelector('.episode-title, .episodiotitle')?.innerText || '';
                let epDateEl = li.querySelector('.date');
                let epDate = epDateEl ? epDateEl.innerText.trim() : '';
                if (epDate && epNumText.includes(epDate)) epNumText = epNumText.replace(epDate, '').trim();
                epNumText = epNumText.replace(/^[0-9]+\s*[-–]\s*/, '').trim();
                if (epNumText.toLowerCase() === 'episódio' || epNumText === '') epNumText = `Episódio ${eNum}`;
                const tituloFormatado = `S${tNum}E${eNum} - ${epNumText}`;
                const serie = (typeof tituloSerieAtual !== 'undefined' && tituloSerieAtual) || (typeof obraSendoVista !== 'undefined' && obraSendoVista.titulo) || 'Série';
                lista.push({ url: epUrl, titulo: `${serie} - ${tituloFormatado}` });
            });
            return lista;
        } catch(e) { return []; }
    }

    window.__cronosPlayerListaAtual = window.__cronosPlayerListaAtual || [];

    function atualizarListaPlayerCronos(){
        const lista = montarListaPlayerDaTemporadaAtual();
        if (lista.length) window.__cronosPlayerListaAtual = lista;
    }

    function atualizarBotoesNavegacaoCronos(urlAtual){
        garantirNavegacaoPlayer();
        const nav = document.getElementById('playerNavegacao');
        const ant = document.getElementById('btnEpAnterior');
        const prox = document.getElementById('btnEpProximo');
        if (!nav || !ant || !prox) return;
        const lista = window.__cronosPlayerListaAtual || [];
        if (lista.length <= 1) { nav.style.display = 'none'; return; }
        const atual = String(urlAtual || document.getElementById('iframePlayer')?.src || '');
        const idx = lista.findIndex(ep => ep.url === atual);
        if (idx < 0) { nav.style.display = 'none'; return; }
        nav.style.display = 'grid';
        if (idx > 0) {
            const ep = lista[idx - 1];
            ant.style.display = 'block';
            ant.onclick = () => abrirEpisodioPlayerNav(ep);
        } else ant.style.display = 'none';
        if (idx < lista.length - 1) {
            const ep = lista[idx + 1];
            prox.style.display = 'block';
            prox.onclick = () => abrirEpisodioPlayerNav(ep);
        } else prox.style.display = 'none';
    }

    function abrirEpisodioPlayerNav(ep){
        if (!ep || !ep.url) return;
        if (ep.url.includes('viewplayer.online/episodio/')) abrirPlayer(ep.titulo, ep.url);
        else prepararEpisodioDooplay(ep.titulo, ep.url);
    }

    const renderOriginal = window.renderizarGradeEpisodios;
    if (typeof renderOriginal === 'function' && !renderOriginal.__cronosV15Nav) {
        window.renderizarGradeEpisodios = function(){
            const r = renderOriginal.apply(this, arguments);
            atualizarListaPlayerCronos();
            return r;
        };
        window.renderizarGradeEpisodios.__cronosV15Nav = true;
    }

    const abrirOriginal = window.abrirPlayer;
    if (typeof abrirOriginal === 'function' && !abrirOriginal.__cronosV15TituloGuia) {
        window.abrirPlayer = function(titulo, urlVideo){
            const r = abrirOriginal.apply(this, arguments);
            const tituloFinal = tituloPlayerSerieSemNomeDoEpisodio(titulo);
            const tituloEl = document.getElementById('playerTitulo');
            if (tituloEl) tituloEl.innerText = tituloFinal;
            document.title = tituloFinal || TITULO_ORIGINAL_CRONOS_V15;
            aplicarModoPlayer(urlVideo);
            atualizarListaPlayerCronos();
            atualizarBotoesNavegacaoCronos(urlVideo);
            setTimeout(() => {
                try { document.getElementById('telaPlayer')?.scrollIntoView({behavior:'smooth', block:'start'}); } catch(e) {}
            }, 60);
            return r;
        };
        window.abrirPlayer.__cronosV15TituloGuia = true;
    }

    const fecharOriginal = window.fecharPlayer;
    if (typeof fecharOriginal === 'function' && !fecharOriginal.__cronosV15TituloGuia) {
        window.fecharPlayer = function(){
            const r = fecharOriginal.apply(this, arguments);
            document.title = TITULO_ORIGINAL_CRONOS_V15;
            const nav = document.getElementById('playerNavegacao');
            if (nav) nav.style.display = 'none';
            return r;
        };
        window.fecharPlayer.__cronosV15TituloGuia = true;
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', garantirNavegacaoPlayer);
    else garantirNavegacaoPlayer();
})();
