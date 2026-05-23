
/*
   CORREÇÃO V41 — Favoritos e Histórico sem duplicar
   - Canoniza URL antes de salvar.
   - Favoritos: se já existir a mesma obra com URL parecida, remove/atualiza sem duplicar.
   - Histórico: play do filme e abertura da ficha viram o mesmo registro, só atualiza o último acesso.
   - Limpeza: remove duplicados antigos já existentes no IndexedDB.
*/
(function(){
    const FLAG = '__cronosFixUnicoFavHistV41';
    if (window[FLAG]) return;
    window[FLAG] = true;

    function providerKeyCronosV41(){
        try { if (typeof CRONOS_PROVIDER_KEY !== 'undefined' && CRONOS_PROVIDER_KEY) return String(CRONOS_PROVIDER_KEY); } catch(e) {}
        try { if (typeof SITE_CODE !== 'undefined' && SITE_CODE) return String(SITE_CODE); } catch(e) {}
        return 'CRONOS';
    }

    function baseUrlCronosV41(){
        try { if (typeof CRONOS_BASE_URL !== 'undefined' && CRONOS_BASE_URL) return String(CRONOS_BASE_URL); } catch(e) {}
        return location.href;
    }

    function urlCanonicaCronosV41(url){
        let u = String(url || '').trim().replace(/&amp;/g, '&');
        if (!u) return '';
        try { u = new URL(u, baseUrlCronosV41()).href; } catch(e) {}
        return String(u)
            .replace(/[?#].*$/, '')
            .replace(/\/+$/, '')
            .trim();
    }

    function textoChaveCronosV41(v){
        return String(v || '')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\b(assistir|online|dublado|legendado|gratis|grátis|hd|full hd|filme|serie|série)\b/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function anoChaveCronosV41(v){
        return String(v || '').match(/\b(19|20)\d{2}\b/)?.[0] || '';
    }

    function idCanonicoCronosV41(url){
        return `${providerKeyCronosV41()}::${urlCanonicaCronosV41(url)}`;
    }

    function chaveItemCronosV41(item){
        const url = urlCanonicaCronosV41(item && item.url);
        if (url) return 'url::' + url;
        const titulo = textoChaveCronosV41(item && item.titulo);
        const ano = anoChaveCronosV41(item && item.ano);
        return titulo ? `titulo::${titulo}::${ano}` : '';
    }

    async function garantirDBV41(){
        if (typeof window.migrarLocalStorageParaIndexedDB === 'function') {
            await window.migrarLocalStorageParaIndexedDB().catch(() => {});
        } else if (typeof migrarLocalStorageParaIndexedDB === 'function') {
            await migrarLocalStorageParaIndexedDB().catch(() => {});
        } else if (typeof abrirCronosDB === 'function') {
            await abrirCronosDB().catch(() => {});
        }
    }

    async function getAllStoreV41(store){
        if (typeof dbGetAll !== 'function') return [];
        await garantirDBV41();
        return await dbGetAll(store).catch(() => []);
    }

    async function deleteStoreV41(store, id){
        if (typeof dbDelete !== 'function' || !id) return;
        await dbDelete(store, id).catch(() => {});
    }

    async function putStoreV41(store, item){
        if (typeof dbPut !== 'function' || !item) return;
        await dbPut(store, item).catch(() => {});
    }

    async function apagarDuplicadosStoreV41(store, itemAtual){
        const todos = await getAllStoreV41(store);
        const chaveAtual = chaveItemCronosV41(itemAtual);
        const idAtual = itemAtual && itemAtual.id ? String(itemAtual.id) : idCanonicoCronosV41(itemAtual && itemAtual.url);
        const removidos = [];

        for (const item of todos) {
            if (!item || !item.id) continue;
            const mesmaId = String(item.id) === idAtual;
            const mesmaChave = chaveAtual && chaveItemCronosV41(item) === chaveAtual;
            const mesmaUrlCanonica = urlCanonicaCronosV41(item.url) && urlCanonicaCronosV41(item.url) === urlCanonicaCronosV41(itemAtual && itemAtual.url);
            if ((mesmaChave || mesmaUrlCanonica) && !mesmaId) {
                removidos.push(item.id);
            }
        }

        for (const id of removidos) await deleteStoreV41(store, id);
        return removidos.length;
    }

    async function listaUnicaStoreV41(store){
        const todos = await getAllStoreV41(store);
        const vistos = new Set();
        const saida = [];

        for (const item of todos) {
            if (!item) continue;
            const chave = chaveItemCronosV41(item);
            if (!chave || vistos.has(chave)) {
                if (item.id) deleteStoreV41(store, item.id);
                continue;
            }

            vistos.add(chave);
            const urlCanonica = urlCanonicaCronosV41(item.url);
            const idCanonico = idCanonicoCronosV41(urlCanonica);
            const precisaCorrigir = urlCanonica && (item.url !== urlCanonica || item.id !== idCanonico);

            const corrigido = {
                ...item,
                url: urlCanonica || item.url,
                id: urlCanonica ? idCanonico : item.id,
                providerKey: providerKeyCronosV41(),
                providerName: item.providerName || (typeof CRONOS_PROVIDER_NAME !== 'undefined' ? CRONOS_PROVIDER_NAME : 'Cronos'),
                baseUrl: item.baseUrl || baseUrlCronosV41()
            };

            if (precisaCorrigir) {
                if (item.id && item.id !== corrigido.id) await deleteStoreV41(store, item.id);
                await putStoreV41(store, corrigido);
            }

            saida.push(corrigido);
        }

        return saida;
    }

    const normalizarOriginalV41 = window.normalizarObraParaBanco || (typeof normalizarObraParaBanco === 'function' ? normalizarObraParaBanco : null);
    if (typeof normalizarOriginalV41 === 'function' && !normalizarOriginalV41.__cronosUnicoV41) {
        const normalizarCorrigida = function(obra = {}) {
            const urlOriginal = obra && obra.url ? obra.url : '';
            const urlCanonica = urlCanonicaCronosV41(urlOriginal);
            const registro = normalizarOriginalV41({ ...obra, url: urlCanonica || urlOriginal });
            if (urlCanonica) {
                registro.url = urlCanonica;
                registro.id = idCanonicoCronosV41(urlCanonica);
            }
            registro.providerKey = providerKeyCronosV41();
            if (!registro.providerName) {
                try { registro.providerName = CRONOS_PROVIDER_NAME; } catch(e) { registro.providerName = 'Cronos'; }
            }
            return registro;
        };
        normalizarCorrigida.__cronosUnicoV41 = true;
        window.normalizarObraParaBanco = normalizarCorrigida;
        try { normalizarObraParaBanco = normalizarCorrigida; } catch(e) {}
    }

    window.getFavoritos = async function(){
        const favs = await listaUnicaStoreV41('favoritos');
        return favs.sort((a, b) => String(b.updatedAt || b.createdAt || b.salvoEm || '').localeCompare(String(a.updatedAt || a.createdAt || a.salvoEm || '')));
    };
    try { getFavoritos = window.getFavoritos; } catch(e) {}

    window.isFavoritoCronos = async function(url){
        const u = urlCanonicaCronosV41(url);
        if (!u) return false;
        const favs = await listaUnicaStoreV41('favoritos');
        return favs.some(f => urlCanonicaCronosV41(f.url) === u);
    };
    try { isFavoritoCronos = window.isFavoritoCronos; } catch(e) {}

    window.toggleFavorito = async function(){
        const obra = (window.obraSendoVista && window.obraSendoVista.url) ? window.obraSendoVista : (typeof obraSendoVista !== 'undefined' ? obraSendoVista : null);
        if (!obra || !obra.url) return;

        await garantirDBV41();
        const urlCanonica = urlCanonicaCronosV41(obra.url);
        const todos = await listaUnicaStoreV41('favoritos');
        const existentes = todos.filter(f => urlCanonicaCronosV41(f.url) === urlCanonica);
        const btn = document.getElementById('btnFavoritar');

        if (existentes.length) {
            for (const fav of existentes) await deleteStoreV41('favoritos', fav.id);
            if (btn) { btn.innerText = '⭐ Favoritar'; btn.classList.remove('ativo'); }
        } else {
            const registro = (typeof normalizarObraParaBanco === 'function')
                ? normalizarObraParaBanco({ ...obra, url: urlCanonica, salvoEm: new Date().toISOString() })
                : { ...obra, url: urlCanonica, id: idCanonicoCronosV41(urlCanonica), salvoEm: new Date().toISOString() };
            await apagarDuplicadosStoreV41('favoritos', registro);
            await putStoreV41('favoritos', registro);
            if (btn) { btn.innerText = '🌟 Remover Favorito'; btn.classList.add('ativo'); }
        }

        if (typeof renderizarResumoHomeLocal === 'function') renderizarResumoHomeLocal();
        if (document.getElementById('telaFavoritos')?.classList.contains('ativa') && typeof carregarFavoritos === 'function') carregarFavoritos();
    };
    try { toggleFavorito = window.toggleFavorito; } catch(e) {}

    window.checarBotaoFavorito = async function(urlVerificacao){
        const btn = document.getElementById('btnFavoritar');
        if (!btn) return;
        const isFav = await window.isFavoritoCronos(urlVerificacao);
        if (isFav) { btn.innerText = '🌟 Remover Favorito'; btn.classList.add('ativo'); }
        else { btn.innerText = '⭐ Favoritar'; btn.classList.remove('ativo'); }
    };
    try { checarBotaoFavorito = window.checarBotaoFavorito; } catch(e) {}

    window.adicionarBotaoFavoritarHoverCronos = function(li, dados){
        if (!li || !dados || !dados.url) return;
        if (li.querySelector('.btn-favoritar-card')) return;

        const btn = document.createElement('button');
        btn.className = 'btn-favoritar-card';
        btn.innerText = 'FAVORITAR';

        btn.onclick = async (event) => {
            event.preventDefault();
            event.stopPropagation();

            const urlCanonica = urlCanonicaCronosV41(dados.url);
            const todos = await listaUnicaStoreV41('favoritos');
            const existentes = todos.filter(f => urlCanonicaCronosV41(f.url) === urlCanonica);

            if (existentes.length) {
                for (const fav of existentes) await deleteStoreV41('favoritos', fav.id);
                btn.innerText = 'FAVORITAR';
                btn.classList.remove('ativo');
            } else {
                const posterAtual = li.dataset.poster || li.querySelector('.card-media img')?.src || dados.poster || dados.img || '';
                const registro = (typeof normalizarObraParaBanco === 'function')
                    ? normalizarObraParaBanco({ ...dados, url: urlCanonica, img: posterAtual, poster: posterAtual, salvoEm: new Date().toISOString() })
                    : { ...dados, url: urlCanonica, id: idCanonicoCronosV41(urlCanonica), img: posterAtual, poster: posterAtual, salvoEm: new Date().toISOString() };
                await apagarDuplicadosStoreV41('favoritos', registro);
                await putStoreV41('favoritos', registro);
                btn.innerText = 'SALVO';
                btn.classList.add('ativo');
            }

            if (typeof renderizarResumoHomeLocal === 'function') renderizarResumoHomeLocal();
        };

        li.appendChild(btn);

        window.isFavoritoCronos(dados.url).then(isFav => {
            if (isFav) {
                btn.innerText = 'SALVO';
                btn.classList.add('ativo');
            }
        }).catch(() => {});
    };
    try { adicionarBotaoFavoritarHoverCronos = window.adicionarBotaoFavoritarHoverCronos; } catch(e) {}

    const carregarFavOriginalV41 = window.carregarFavoritos || (typeof carregarFavoritos === 'function' ? carregarFavoritos : null);
    if (typeof carregarFavOriginalV41 === 'function') {
        window.carregarFavoritos = async function(btnElement){
            await listaUnicaStoreV41('favoritos');
            return carregarFavOriginalV41.apply(this, arguments);
        };
        try { carregarFavoritos = window.carregarFavoritos; } catch(e) {}
    }

    async function salvarHistoricoUnicoV41(item){
        if (!item || !item.url || !item.titulo || item.titulo === 'undefined') return;
        await garantirDBV41();

        const obraAtual = (window.obraSendoVista && window.obraSendoVista.url) ? window.obraSendoVista : null;
        const veioDeEpisodio = String(item.url || '').includes('/episodios/') || String(item.tipo || '').toLowerCase().includes('epis');
        const base = (obraAtual && obraAtual.url) ? obraAtual : item;
        const urlCanonica = urlCanonicaCronosV41(base.url || item.url);
        if (!urlCanonica) return;

        const idCanonico = idCanonicoCronosV41(urlCanonica);
        const obraSalva = (typeof dbGet === 'function') ? await dbGet('obras', idCanonico).catch(() => null) : null;

        const posterObra = (typeof escolherPosterSeguroCronos === 'function')
            ? escolherPosterSeguroCronos(base.poster, base.img, obraSalva && obraSalva.poster, obraSalva && obraSalva.img, item.poster, item.img)
            : (base.poster || base.img || item.poster || item.img || '');

        const backdropObra = (typeof escolherBackdropSeguroCronos === 'function')
            ? escolherBackdropSeguroCronos(base.backdrop, obraSalva && obraSalva.backdrop, item.backdrop)
            : (base.backdrop || item.backdrop || '');

        const registroBase = {
            ...(obraSalva || {}),
            ...base,
            url: urlCanonica,
            titulo: base.titulo || item.titulo,
            poster: posterObra,
            img: posterObra,
            backdrop: backdropObra,
            playerUrl: item.playerUrl || '',
            ultimoAcesso: new Date().toISOString()
        };

        if (veioDeEpisodio && !(registroBase.isMovie || registroBase.tipo === 'Filme')) {
            registroBase.tipo = 'Série';
            registroBase.isSerie = true;
            registroBase.episodio = '';
        }

        const registro = (typeof normalizarObraParaBanco === 'function')
            ? normalizarObraParaBanco(registroBase)
            : { ...registroBase, id: idCanonico };

        registro.id = idCanonico;
        registro.url = urlCanonica;
        registro.poster = posterObra;
        registro.img = posterObra;
        registro.ultimoAcesso = registroBase.ultimoAcesso;

        await apagarDuplicadosStoreV41('historico', registro);
        await putStoreV41('historico', registro);
        if (typeof renderizarResumoHomeLocal === 'function') renderizarResumoHomeLocal();
    }

    window.salvarHistoricoHome = salvarHistoricoUnicoV41;
    try { salvarHistoricoHome = salvarHistoricoUnicoV41; } catch(e) {}

    window.getHistoricoHome = async function(){
        const hist = await listaUnicaStoreV41('historico');
        return hist.sort((a, b) => String(b.ultimoAcesso || b.updatedAt || '').localeCompare(String(a.ultimoAcesso || a.updatedAt || '')));
    };
    try { getHistoricoHome = window.getHistoricoHome; } catch(e) {}

    const carregarHistOriginalV41 = window.carregarHistorico || (typeof carregarHistorico === 'function' ? carregarHistorico : null);
    if (typeof carregarHistOriginalV41 === 'function') {
        window.carregarHistorico = async function(btnElement){
            await listaUnicaStoreV41('historico');
            return carregarHistOriginalV41.apply(this, arguments);
        };
        try { carregarHistorico = window.carregarHistorico; } catch(e) {}
    }

    window.cronosCorrigirDuplicadosFavoritosHistorico = async function(){
        await listaUnicaStoreV41('favoritos');
        await listaUnicaStoreV41('historico');
        if (typeof renderizarResumoHomeLocal === 'function') renderizarResumoHomeLocal();
    };

    // Executa uma limpeza leve ao abrir o arquivo, sem apagar dados únicos.
    setTimeout(() => {
        window.cronosCorrigirDuplicadosFavoritosHistorico().catch(e => console.warn('Falha ao corrigir duplicados:', e));
    }, 800);
})();
