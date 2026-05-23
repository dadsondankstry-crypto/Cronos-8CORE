
const PROXY = 'https://fragrant-unit-a421.dadsondankstry.workers.dev/?url=';
const SITE_CODE = 'B01';
let telaAnterior = 'telaInicio'; 
let paginaAtual = { 'telaFilmes': 1, 'telaSeries': 1, 'telaBusca': 1, 'telaEpisodios': 1, 'telaTemporadas': 1, 'telaAnimes': 1 };
const CRONOS_PAGINAS_POR_CARREGAR_MAIS = 2; 
let termoBuscaAtual = '';
let destaquesPremiumHome = [];
let destaquePremiumAtual = 0;
let obraSendoVista = { url: '', titulo: '', ano: '', img: '', isMovie: false };
let dadosSeriesAtual = { dublado: {}, legendado: {} };
let temporadasNomesAtual = {};
let tituloSerieAtual = '';
let localAudioAtivo = 'dublado';
let temporadaAtiva = null;
let cachePosterDetalhe = new Map();
let contextoBuscaAtual = { tipo: 'busca', baseUrl: '', titulo: '' };
let filtroTipoGridAtual = {};
let filtroLetraGridAtual = {};
let tokenFiltroLetraCronos = 0;
// Filtro A-Z configurado para usar somente o IndexedDB, sem varrer páginas do site.

document.getElementById('inputBusca').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') realizarBusca();
});

window.onload = () => {
    renderizarResumoHomeLocal();
    gerarTodasBarrasAZ();
    montarCategorias();
    carregarHomePage();
};

function ativarTela(idTelaAlvo, btnElement = null) {
    document.querySelectorAll('.view-container').forEach(t => t.classList.remove('ativa'));
    document.getElementById(idTelaAlvo).classList.add('ativa');
    if(btnElement && !btnElement.classList.contains('btn-voltar')) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('ativa'));
        btnElement.classList.add('ativa');
    }
}


function carregarCategorias(btnElement) {
    ativarTela('telaCategorias', btnElement);
    telaAnterior = 'telaCategorias';
    montarCategorias();
}

function carregarConfiguracoes(btnElement) {
    ativarTela('telaConfiguracoes', btnElement);
    telaAnterior = 'telaConfiguracoes';
    setTimeout(() => {
        try { if (typeof atualizarInfoProgressoSyncCronos === 'function') atualizarInfoProgressoSyncCronos(); } catch(e) {}
        try { if (typeof atualizarResumoSincronizacaoCronos === 'function') atualizarResumoSincronizacaoCronos(); } catch(e) {}
    }, 0);
}

function carregarLancamentos(btnElement) {
    ativarTela('telaLancamentos', btnElement);
    telaAnterior = 'telaLancamentos';
    carregarLancamentosDeEpisodiosCronos(false);
}

function atualizarLancamentosCronos() {
    carregarLancamentosDeEpisodiosCronos(true);
}

const CRONOS_LANCAMENTOS_CACHE_KEY = 'cronos_lancamentos_episodios_obras_unicas_v4';
const CRONOS_LANCAMENTOS_LIMITE_OBRAS = 120;
const CRONOS_LANCAMENTOS_OBRAS_POR_PAGINA = 30;
const CRONOS_LANCAMENTOS_PAGINAS_POR_BLOCO = 2;
const CRONOS_LANCAMENTOS_ITENS_POR_BLOCO = CRONOS_LANCAMENTOS_OBRAS_POR_PAGINA * CRONOS_LANCAMENTOS_PAGINAS_POR_BLOCO;
let CRONOS_LANCAMENTOS_PAGINA_ATUAL = 1;
let CRONOS_LANCAMENTOS_LISTA_ATUAL = [];
// A montagem inicial busca quantas páginas de EPISÓDIOS forem necessárias
// até completar 4 páginas de OBRAS únicas: 30 + 30 + 30 + 30 = 120.
// O limite abaixo é só uma trava de segurança para não varrer o site inteiro se algo mudar.
const CRONOS_LANCAMENTOS_MAX_PAGINAS_EPISODIOS_INICIAL = 120;

function lerCacheLancamentosCronos() {
    try {
        const arr = JSON.parse(localStorage.getItem(CRONOS_LANCAMENTOS_CACHE_KEY) || '[]');
        return Array.isArray(arr) ? arr.filter(x => x && x.titulo) : [];
    } catch(e) { return []; }
}

function salvarCacheLancamentosCronos(lista) {
    try {
        localStorage.setItem(CRONOS_LANCAMENTOS_CACHE_KEY, JSON.stringify((lista || []).slice(0, CRONOS_LANCAMENTOS_LIMITE_OBRAS)));
    } catch(e) {}
}

function chaveLancamentoCronos(nome) {
    return slugCronos(String(nome || '').replace(/\b(?:temporada|season)\s*\d+\b/gi, '').trim());
}

function urlAbsCronos(url, base = CRONOS_BASE_URL) {
    const u = String(url || '').trim().replace(/&amp;/g, '&');
    if (!u) return '';
    try { return new URL(u, base).href; } catch(e) { return u; }
}

function inferirUrlSerieLancamentoCronos(nomeObra, urlEpisodio = '') {
    const slugNome = slugCronos(nomeObra || '');
    if (slugNome) return `${CRONOS_BASE_URL}series/${slugNome}/`;
    try {
        let slug = new URL(urlEpisodio).pathname.split('/').filter(Boolean).pop() || '';
        slug = slug
            .replace(/(?:s\d+e\d+|\d+x\d+).*/i, '')
            .replace(/epis[oó]dio[-_\s]*\d+.*/i, '')
            .replace(/episode[-_\s]*\d+.*/i, '')
            .replace(/temporada[-_\s]*\d+.*/i, '')
            .replace(/[-_]+$/g, '');
        return slug ? `${CRONOS_BASE_URL}series/${slug}/` : '';
    } catch(e) { return ''; }
}

async function buscarObraLocalPorTituloLancamentoCronos(nomeObra) {
    try {
        await migrarLocalStorageParaIndexedDB();
        const chave = chaveLancamentoCronos(nomeObra);
        if (!chave) return null;
        const obras = await dbGetAll('obras');
        return obras.find(o => (o.tipo === 'Série' || o.isSerie) && chaveLancamentoCronos(o.titulo) === chave) || null;
    } catch(e) { return null; }
}

function extrairLancamentoDeItemEpisodioCronos(item) {
    if (!item || !item.querySelector) return null;
    if (item.closest && item.closest('#slider-movies, #slider-tvshows, .slider, .featured, .sidebar, aside, .widget')) return null;
    const linkEl = item.querySelector('a[href]');
    const titleEl = item.querySelector('h3') || item.querySelector('.title') || item.querySelector('.data h3') || item.querySelector('.post-title');
    const imgEl = item.querySelector('img');
    if (!linkEl || !titleEl) return null;
    const urlEpisodio = urlAbsCronos(linkEl.getAttribute('href') || linkEl.href || '');
    if (!urlEpisodio || !urlEpisodio.includes('/episodios/')) return null;
    const tituloLimpo = limparTextoCard(titleEl.innerText || titleEl.textContent || '');
    const img = normalizarImagemCard(extrairImagemCapaItem(item) || imgEl?.getAttribute('data-src') || imgEl?.getAttribute('data-lazy-src') || imgEl?.getAttribute('src') || imgEl?.src || '');
    const dadosEp = extrairDadosEpisodioItem(item, tituloLimpo, urlEpisodio, img, '');
    const nomeObra = limparTextoCard(dadosEp.serieTitulo || tituloLimpo || extrairNomeObraPelaUrl(urlEpisodio));
    const key = chaveLancamentoCronos(nomeObra);
    if (!key || !nomeObra || /^epis[oó]dio\s*\d+$/i.test(nomeObra)) return null;
    const serieLink = Array.from(item.querySelectorAll('a[href]'))
        .map(a => urlAbsCronos(a.getAttribute('href') || a.href || ''))
        .find(h => h.includes('/series/')) || '';
    return {
        key,
        titulo: nomeObra,
        url: serieLink || inferirUrlSerieLancamentoCronos(nomeObra, urlEpisodio),
        origemEpisodioUrl: urlEpisodio,
        poster: img,
        img,
        ano: '',
        tipo: 'Série',
        isMovie: false,
        isSerie: true,
        providerKey: CRONOS_PROVIDER_KEY,
        providerName: CRONOS_PROVIDER_NAME,
        updatedAt: new Date().toISOString()
    };
}

async function enriquecerLancamentoObraCronos(item) {
    if (!item) return item;
    const local = await buscarObraLocalPorTituloLancamentoCronos(item.titulo);
    if (local && local.url) {
        return {
            ...item,
            ...local,
            key: item.key,
            origemEpisodioUrl: item.origemEpisodioUrl,
            tipo: 'Série',
            isMovie: false,
            isSerie: true,
            poster: escolherPosterSeguroCronos(local.poster, local.img, item.poster, item.img),
            img: escolherPosterSeguroCronos(local.poster, local.img, item.poster, item.img)
        };
    }
    return item;
}

function atualizarBotaoMaisLancamentosCronos(total = 0) {
    const btn = document.getElementById('btnMaisLancamentos');
    if (!btn) return;
    const visiveis = Math.min(CRONOS_LANCAMENTOS_PAGINA_ATUAL * CRONOS_LANCAMENTOS_OBRAS_POR_PAGINA, total);
    if (total > visiveis) {
        const proximoBloco = Math.min(visiveis + CRONOS_LANCAMENTOS_ITENS_POR_BLOCO, total);
        btn.style.display = 'block';
        btn.disabled = false;
        btn.innerText = `Carregar Mais (+${CRONOS_LANCAMENTOS_ITENS_POR_BLOCO}) (${visiveis}/${total})`;
        btn.title = `Vai mostrar de ${visiveis + 1} até ${proximoBloco}, em bloco de 2 páginas.`;
    } else {
        btn.style.display = 'none';
        btn.disabled = false;
        btn.title = '';
    }
}

function carregarMaisLancamentosCronos() {
    CRONOS_LANCAMENTOS_PAGINA_ATUAL += CRONOS_LANCAMENTOS_PAGINAS_POR_BLOCO;
    renderizarLancamentosCronos(CRONOS_LANCAMENTOS_LISTA_ATUAL, CRONOS_LANCAMENTOS_PAGINA_ATUAL);
    const status = document.getElementById('statusLancamentos');
    if (status) {
        const total = CRONOS_LANCAMENTOS_LISTA_ATUAL.length;
        const visiveis = Math.min(CRONOS_LANCAMENTOS_PAGINA_ATUAL * CRONOS_LANCAMENTOS_OBRAS_POR_PAGINA, total);
        status.style.display = 'block';
        status.style.color = '';
        status.innerText = `Mostrando ${visiveis} de ${total} obra(s) única(s) em lançamentos. Cada clique abre mais 2 páginas (${CRONOS_LANCAMENTOS_ITENS_POR_BLOCO} cards).`;
    }
}

function renderizarLancamentosCronos(lista, pagina = 1) {
    const grid = document.getElementById('gridLancamentos');
    if (!grid) return;
    const limpas = (lista || [])
        .filter(item => item && item.key && item.titulo && !/^sem\s+t[ií]tulo$/i.test(String(item.titulo).trim()))
        .slice(0, CRONOS_LANCAMENTOS_LIMITE_OBRAS);
    CRONOS_LANCAMENTOS_LISTA_ATUAL = limpas;
    CRONOS_LANCAMENTOS_PAGINA_ATUAL = Math.max(1, Number(pagina) || 1);
    const quantidadeVisivel = Math.min(CRONOS_LANCAMENTOS_PAGINA_ATUAL * CRONOS_LANCAMENTOS_OBRAS_POR_PAGINA, limpas.length);
    grid.innerHTML = '';
    limpas.slice(0, quantidadeVisivel).forEach(item => {
        const li = document.createElement('li');
        li.className = 'card-item global-card card-skeleton';
        li.dataset.keyLancamento = item.key || chaveLancamentoCronos(item.titulo);
        li.dataset.url = item.url || item.origemEpisodioUrl || '';
        grid.appendChild(li);
        const urlSerie = item.url && item.url.includes('/series/') ? item.url : inferirUrlSerieLancamentoCronos(item.titulo, item.origemEpisodioUrl);
        const dados = {
            url: urlSerie || item.origemEpisodioUrl,
            titulo: item.titulo || 'Sem título',
            poster: item.poster || item.img || '',
            img: item.img || item.poster || '',
            ano: item.ano || '',
            tipo: 'Série',
            isMovie: false,
            isSerie: true,
            origemEpisodioUrl: item.origemEpisodioUrl || ''
        };
        if (urlSerie) {
            prepararCardObraDBFirst(li, dados, null, 'gridLancamentos');
        } else {
            const poster = escolherPosterSeguroCronos(dados.poster, dados.img) || placeholderCronosPoster();
            preencherCardObraCronos(li, { ...dados, poster, img: poster }, 'gridLancamentos');
        }
    });
    atualizarBotaoMaisLancamentosCronos(limpas.length);
}

async function coletarLancamentosPaginaEpisodiosCronos(pagina = 1) {
    const url = pagina === 1 ? `${CRONOS_BASE_URL}episodios/` : montarUrlPaginada(`${CRONOS_BASE_URL}episodios/`, pagina);
    const res = await fetch(PROXY + encodeURIComponent(url));
    if (!res.ok) throw new Error('Falha ao ler episódios');
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const itens = Array.from(doc.querySelectorAll('#archive-content .item, #archive-content article.item, #dt-episodes .item, .episodes .item, article.episodes, article.episode'));
    return itens.map(extrairLancamentoDeItemEpisodioCronos).filter(Boolean);
}

async function carregarLancamentosDeEpisodiosCronos(forcarCompleto = false) {
    const grid = document.getElementById('gridLancamentos');
    const status = document.getElementById('statusLancamentos');
    if (!grid || !status) return;

    await migrarLocalStorageParaIndexedDB();
    let cache = lerCacheLancamentosCronos();
    const cacheCompleto = cache.length >= CRONOS_LANCAMENTOS_LIMITE_OBRAS;

    if (cache.length && !forcarCompleto) {
        CRONOS_LANCAMENTOS_PAGINA_ATUAL = CRONOS_LANCAMENTOS_PAGINAS_POR_BLOCO;
        renderizarLancamentosCronos(cache, CRONOS_LANCAMENTOS_PAGINAS_POR_BLOCO);
        status.style.display = 'block';
        status.style.color = '';
        status.innerText = `Mostrando ${Math.min(CRONOS_LANCAMENTOS_ITENS_POR_BLOCO, cache.length)} de ${cache.length} obra(s) salvas. Checando novidades na primeira página...`;
    } else {
        grid.innerHTML = '';
        status.style.display = 'block';
        status.style.color = '';
        status.innerText = 'Montando lançamentos a partir dos episódios recentes...';
    }

    const leituraRapida = !forcarCompleto && cacheCompleto;
    const maxPaginasParaLer = leituraRapida ? 1 : CRONOS_LANCAMENTOS_MAX_PAGINAS_EPISODIOS_INICIAL;
    const coletados = [];
    const vistosNovos = new Set();
    const vistosNaExecucao = new Set();
    let paginasSemItens = 0;

    try {
        for (let pagina = 1; pagina <= maxPaginasParaLer; pagina++) {
            const alvoTexto = leituraRapida
                ? 'checando somente a primeira página'
                : `buscando até completar ${CRONOS_LANCAMENTOS_LIMITE_OBRAS} obras únicas`;
            status.innerText = `Lendo episódios recentes: página ${pagina} (${coletados.length}/${CRONOS_LANCAMENTOS_LIMITE_OBRAS} obras únicas encontradas, ${alvoTexto})...`;

            const itens = await coletarLancamentosPaginaEpisodiosCronos(pagina);
            if (!itens || !itens.length) {
                paginasSemItens++;
                if (paginasSemItens >= 3) break;
                await esperar(80);
                continue;
            }
            paginasSemItens = 0;

            let adicionouNestaPagina = false;
            for (const item of itens) {
                if (!item || !item.key) continue;
                if (vistosNaExecucao.has(item.key)) continue;
                vistosNaExecucao.add(item.key);

                if (vistosNovos.has(item.key)) continue;
                vistosNovos.add(item.key);
                coletados.push(await enriquecerLancamentoObraCronos(item));
                adicionouNestaPagina = true;

                if (coletados.length >= CRONOS_LANCAMENTOS_LIMITE_OBRAS) break;
            }

            if (leituraRapida) break;
            if (coletados.length >= CRONOS_LANCAMENTOS_LIMITE_OBRAS) break;
            // Mesmo quando uma página vem cheia de episódios repetidos da mesma obra,
            // continua lendo: a próxima página pode trazer outra obra inédita.
            await esperar(adicionouNestaPagina ? 80 : 120);
        }

        const mapa = new Map();
        coletados.forEach(item => { if (item && item.key && !mapa.has(item.key)) mapa.set(item.key, item); });
        if (!forcarCompleto && cache.length) {
            cache.forEach(item => { const key = item.key || chaveLancamentoCronos(item.titulo); if (key && !mapa.has(key)) mapa.set(key, { ...item, key }); });
        }
        const listaFinal = Array.from(mapa.values()).slice(0, CRONOS_LANCAMENTOS_LIMITE_OBRAS);
        salvarCacheLancamentosCronos(listaFinal);
        CRONOS_LANCAMENTOS_PAGINA_ATUAL = CRONOS_LANCAMENTOS_PAGINAS_POR_BLOCO;
        renderizarLancamentosCronos(listaFinal, CRONOS_LANCAMENTOS_PAGINAS_POR_BLOCO);
        const visiveis = Math.min(CRONOS_LANCAMENTOS_ITENS_POR_BLOCO, listaFinal.length);
        status.innerText = `${listaFinal.length} obra(s) única(s) montada(s) pelos episódios recentes. Mostrando ${visiveis} agora. ${listaFinal.length > CRONOS_LANCAMENTOS_OBRAS_POR_PAGINA ? 'Use Carregar Mais para abrir o próximo bloco de 2 páginas de lançamentos.' : ''} ${listaFinal.length >= CRONOS_LANCAMENTOS_LIMITE_OBRAS ? 'Cache completo: nas próximas aberturas a aba checa só a primeira página de episódios.' : 'Ainda não completou 120 obras únicas; na próxima atualização completa ele continua lendo páginas de episódios até completar ou até bater a trava de segurança.'}`;
        status.style.display = 'block';
    } catch(err) {
        console.warn('Falha nos lançamentos por episódios:', err);
        if (cache.length) {
            CRONOS_LANCAMENTOS_PAGINA_ATUAL = CRONOS_LANCAMENTOS_PAGINAS_POR_BLOCO;
            renderizarLancamentosCronos(cache, CRONOS_LANCAMENTOS_PAGINAS_POR_BLOCO);
            status.innerText = `Não consegui atualizar agora. Mostrando ${Math.min(CRONOS_LANCAMENTOS_ITENS_POR_BLOCO, cache.length)} de ${cache.length} obra(s) salvas.`;
            status.style.color = '#ffcc00';
        } else {
            status.innerText = 'Não consegui montar os lançamentos agora. Verifique conexão/proxy.';
            status.style.color = 'red';
        }
        status.style.display = 'block';
    }
}

function voltarPaginaAnterior() { 
    ativarTela(telaAnterior); 
    if(telaAnterior === 'telaFavoritos') carregarFavoritos(document.querySelector('button[onclick="carregarFavoritos(this)"]'));
}

function realizarBusca() {
    const btnVoltarCategorias = document.getElementById('btnVoltarCategorias');
    if (btnVoltarCategorias) btnVoltarCategorias.style.display = 'none';
    termoBuscaAtual = document.getElementById('inputBusca').value.trim();
    if(!termoBuscaAtual) return;

    document.getElementById('gridBusca').innerHTML = '';
    document.getElementById('tituloBusca').innerText = `Resultados para "${termoBuscaAtual}"`;
    paginaAtual['telaBusca'] = 1;
    contextoBuscaAtual = {
        tipo: 'busca',
        baseUrl: `https://www.boraflix.click/?s=${encodeURIComponent(termoBuscaAtual)}`,
        titulo: `Resultados para "${termoBuscaAtual}"`
    };

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('ativa'));
    iniciarNavegacao('telaBusca', contextoBuscaAtual.baseUrl, null);
}

function iniciarNavegacao(idTela, urlAlvo, btnElement) {
    ativarTela(idTela, btnElement);
    if(idTela !== 'telaBusca' && idTela !== 'telaFavoritos' && idTela !== 'telaHistorico' && idTela !== 'telaCategorias' && idTela !== 'telaConfiguracoes' && idTela !== 'telaLancamentos') telaAnterior = idTela;
    if(idTela === 'telaInicio') return;
    if(idTela === 'telaCategorias') { montarCategorias(); return; }
    if(idTela === 'telaConfiguracoes') { carregarConfiguracoes(btnElement); return; }

    let gridId = idTela.replace('tela', 'grid');
    let statusId = idTela.replace('tela', 'status');
    const grid = document.getElementById(gridId);

    filtroTipoGridAtual[gridId] = '';
    if (idTela === 'telaFilmes') filtroTipoGridAtual[gridId] = 'filme';
    if (idTela === 'telaSeries') filtroTipoGridAtual[gridId] = 'serie';
    if (idTela === 'telaEpisodios') filtroTipoGridAtual[gridId] = 'episodio';
    if (idTela === 'telaTemporadas') filtroTipoGridAtual[gridId] = 'temporada';

    if (grid.children.length > 0 && idTela !== 'telaBusca') return;

    document.getElementById(statusId).innerText = 'Lendo servidor...';
    document.getElementById(statusId).style.display = 'block';

    fetchHtmlEPreencher(urlAlvo, gridId, statusId, idTela);
}

async function carregarHomePage() {
    ativarTela('telaInicio', document.querySelector('.nav-btn'));
    telaAnterior = 'telaInicio';
    const status = document.getElementById('statusInicio');

    if(destaquesPremiumHome.length > 0 || (document.getElementById('gridInicioFilmes') && document.getElementById('gridInicioFilmes').children.length > 0)) {
        renderizarResumoHomeLocal();
        return;
    }

    try {
        status.style.display = 'block';
status.innerText = 'Lendo página inicial...';

        const res = await fetch(PROXY + encodeURIComponent('https://www.boraflix.click/'));
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        
        const destaques = Array.from(doc.querySelectorAll('#featured-titles .item')).slice(0, 8);
        const filmesNormais = doc.querySelectorAll('#dt-movies .item.movies');
        const seriesNormais = doc.querySelectorAll('#dt-tvshows .item.tvshows');

        tentarRenderizarEpisodiosRecentes(doc);

        destaquesPremiumHome = [];
        const premiumSlides = document.getElementById('premiumSlides');
        if(premiumSlides) premiumSlides.innerHTML = '';

        // Destaques Premium limitados a 8 itens por fonte/provedor.
        // O enriquecimento entra em cada link um por um, com pausa curta, para não abrir tudo de uma vez.
        for (let i = 0; i < destaques.length; i++) {
            status.innerText = `Carregando destaque ${i + 1} de ${destaques.length} pelo IndexedDB (limite 8 por fonte)...`;
            await adicionarDestaquePremium(destaques[i], true);
            atualizarDestaquePremium(0);
            await esperar(120);
        }
        atualizarDestaquePremium(0);

        let limitF = 0; filmesNormais.forEach(item => { if(limitF < 12) { renderizarItemNoGrid(item, 'gridInicioFilmes'); limitF++; } });
        let limitS = 0; seriesNormais.forEach(item => { if(limitS < 12) { renderizarItemNoGrid(item, 'gridInicioSeries'); limitS++; } });
        completarHomeGridAte12('https://www.boraflix.click/filmes/', 'gridInicioFilmes', '#archive-content .item.movies, #archive-content article.item');
        completarHomeGridAte12('https://www.boraflix.click/series/', 'gridInicioSeries', '#archive-content .item.tvshows, #archive-content article.item');
        completarHomeGridAte12('https://www.boraflix.click/episodios/', 'gridInicioEpisodios', '#archive-content .item, #dt-episodes .item, .episodes .item, article.episodes, article.episode', true);
        renderizarResumoHomeLocal();
        status.style.display = 'none';
    } catch(err) {
        status.innerText = 'Erro ao carregar catálogo. Verifique conexão/proxy.';
        status.style.color = 'red';
    }
}

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function completarHomeGridAte12(urlAlvo, gridId, seletorItens, controlarTituloEpisodios = false) {
    const grid = document.getElementById(gridId);
    if(!grid || grid.children.length >= 12) return;
    fetch(PROXY + encodeURIComponent(urlAlvo))
        .then(res => res.text())
        .then(html => {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const itens = doc.querySelectorAll(seletorItens);
            let count = grid.children.length;
            itens.forEach(item => {
                if(count >= 12) return;
                const before = grid.children.length;
                renderizarItemNoGrid(item, gridId);
                if(grid.children.length > before) count++;
            });
            if(controlarTituloEpisodios) {
                const head = document.getElementById('headEpisodiosRecentes');
                if(head) head.style.display = grid.children.length > 0 ? 'flex' : 'none';
            }
            renderizarResumoHomeLocal();
        })
        .catch(() => {
            if(controlarTituloEpisodios) {
                const head = document.getElementById('headEpisodiosRecentes');
                if(head && grid.children.length > 0) head.style.display = 'flex';
            }
        });
}

function montarUrlPaginada(urlBase, pagina) {
    if (!urlBase) return '';
    if (urlBase.includes('/?s=') || urlBase.includes('?s=')) {
        const termo = urlBase.split('?s=')[1] || '';
        return `https://www.boraflix.click/page/${pagina}/?s=${termo}`;
    }
    return urlBase.replace(/\/?$/, '/') + 'page/' + pagina + '/';
}

function obterBotaoMaisCronos(idTela) {
    if (idTela === 'telaBusca') return document.getElementById('btnMaisBusca');
    return document.getElementById(`btnMais${idTela.replace('tela', '')}`);
}

function atualizarTextoBotaoMaisCronos(idTela) {
    const btn = obterBotaoMaisCronos(idTela);
    if (!btn) return;
    const proxima = (paginaAtual[idTela] || 1) + 1;
    const ultima = proxima + CRONOS_PAGINAS_POR_CARREGAR_MAIS - 1;
    if (idTela === 'telaBusca') {
        btn.innerText = `Carregar Mais Resultados (Páginas ${proxima} e ${ultima})`;
    } else {
        btn.innerText = `Carregar Mais (Páginas ${proxima} e ${ultima})`;
    }
}

async function carregarMais(idTela, urlBase) {
    const gridId = idTela.replace('tela', 'grid');
    const statusId = idTela.replace('tela', 'status');
    const status = document.getElementById(statusId);
    const btn = obterBotaoMaisCronos(idTela);
    const paginasCarregadas = [];
    let totalItens = 0;

    if (btn) btn.disabled = true;

    for (let i = 0; i < CRONOS_PAGINAS_POR_CARREGAR_MAIS; i++) {
        paginaAtual[idTela]++;
        const pagina = paginaAtual[idTela];
        const urlPaginada = montarUrlPaginada(urlBase, pagina);
        paginasCarregadas.push(pagina);

        if (status) {
            status.innerText = `Carregando página ${pagina}...`;
            status.style.display = 'block';
            status.style.color = '';
        }

        const qtd = await fetchHtmlEPreencher(urlPaginada, gridId, statusId, idTela);
        totalItens += Number(qtd || 0);

        if (!qtd) break;
        if (i < CRONOS_PAGINAS_POR_CARREGAR_MAIS - 1) await esperar(80);
    }

    if (btn) btn.disabled = false;
    atualizarTextoBotaoMaisCronos(idTela);

    if (status && totalItens > 0) {
        status.innerText = `Páginas ${paginasCarregadas.join(' e ')} carregadas. Itens adicionados: ${totalItens}.`;
        status.style.display = 'block';
        status.style.color = '';
    }
}

async function carregarMaisFiltroAtual() {
    const status = document.getElementById('statusBusca');
    const btn = obterBotaoMaisCronos('telaBusca');

    if (contextoBuscaAtual && contextoBuscaAtual.tipo === 'year') {
        if (btn) btn.style.display = 'none';
        if (status) {
            status.innerText = 'Este filtro de Ano usa somente o IndexedDB e já mostra todos os itens locais.';
            status.style.display = 'block';
            status.style.color = '';
        }
        return;
    }

    const paginasCarregadas = [];
    let totalItens = 0;

    if (btn) btn.disabled = true;

    for (let i = 0; i < CRONOS_PAGINAS_POR_CARREGAR_MAIS; i++) {
        paginaAtual['telaBusca']++;
        const pagina = paginaAtual['telaBusca'];
        const urlPaginada = montarUrlPaginada(contextoBuscaAtual.baseUrl, pagina);
        paginasCarregadas.push(pagina);

        if (status) {
            status.innerText = `Carregando página ${pagina}...`;
            status.style.display = 'block';
            status.style.color = '';
        }

        const qtd = await fetchHtmlEPreencher(urlPaginada, 'gridBusca', 'statusBusca', 'telaBusca');
        totalItens += Number(qtd || 0);

        if (!qtd) break;
        if (i < CRONOS_PAGINAS_POR_CARREGAR_MAIS - 1) await esperar(80);
    }

    if (btn) btn.disabled = false;
    atualizarTextoBotaoMaisCronos('telaBusca');

    if (status && totalItens > 0) {
        status.innerText = `Páginas ${paginasCarregadas.join(' e ')} carregadas. Itens adicionados: ${totalItens}.`;
        status.style.display = 'block';
        status.style.color = '';
    }
}

function obterSeletorItensCronos(idTela) {
    let seletorItens = '#archive-content .item, article.item, .items .item, .module .content .items .item';
    if (idTela === 'telaBusca') seletorItens = '#archive-content .item, .search-page .item, .result-item, article.item, .items .item, .module .content .items .item';
    if (idTela === 'telaEpisodios') seletorItens = '#archive-content .item, #dt-episodes .item, .episodes .item, article.episodes, article.episode';
    if (idTela === 'telaTemporadas') seletorItens = '#archive-content .item.seasons, #archive-content .item.se, article.seasons, article.item.se, article.item.seasons';
    return seletorItens;
}

function tipoDooplayPorTela(idTela) {
    if (idTela === 'telaFilmes') return 'movies';
    if (idTela === 'telaSeries') return 'tvshows';
    return '';
}

function urlBaseDooplayPorTipo(tipo) {
    if (tipo === 'movies') return 'https://www.boraflix.click/filmes/';
    if (tipo === 'tvshows') return 'https://www.boraflix.click/series/';
    return 'https://www.boraflix.click/';
}

function letraDooplay(letra) {
    if (letra === '0-9') return '09';
    return String(letra || '').toLowerCase();
}

function extrairDtGonzaDaPagina(html) {
    const cfg = { glossary: 'https://www.boraflix.click/wp-json/dooplay/glossary/', nonce: '' };
    const m = String(html || '').match(/var\s+dtGonza\s*=\s*(\{[\s\S]*?\})\s*;/);
    if (!m) return cfg;
    try {
        const obj = JSON.parse(m[1]);
        cfg.glossary = obj.glossary || cfg.glossary;
        cfg.nonce = obj.nonce || '';
    } catch(e) {}
    return cfg;
}

async function obterConfigGlossaryDooplay(tipo) {
    const urlBase = urlBaseDooplayPorTipo(tipo);
    try {
        const res = await fetch(PROXY + encodeURIComponent(urlBase));
        const html = await res.text();
        return extrairDtGonzaDaPagina(html);
    } catch(e) {
        return { glossary: 'https://www.boraflix.click/wp-json/dooplay/glossary/', nonce: '' };
    }
}

function extrairStringsHtmlPossiveis(valor, saida = []) {
    if (typeof valor === 'string') {
        if (valor.includes('<article') || valor.includes('class="item') || valor.includes("class='item") || valor.includes('<li')) saida.push(valor);
        return saida;
    }
    if (Array.isArray(valor)) {
        valor.forEach(v => extrairStringsHtmlPossiveis(v, saida));
        return saida;
    }
    if (valor && typeof valor === 'object') {
        Object.values(valor).forEach(v => extrairStringsHtmlPossiveis(v, saida));
    }
    return saida;
}

function htmlGlossaryDaResposta(textoResposta) {
    const texto = String(textoResposta || '').trim();
    if (!texto) return '';
    if (texto.startsWith('<')) return texto;
    try {
        const json = JSON.parse(texto);
        const partes = extrairStringsHtmlPossiveis(json);
        return partes.join('\n');
    } catch(e) {
        return texto.includes('<') ? texto : '';
    }
}

function urlsTesteGlossaryDooplay(cfg, tipo, letra) {
    const base = (cfg.glossary || 'https://www.boraflix.click/wp-json/dooplay/glossary/').replace(/\/?$/, '/');
    const n = encodeURIComponent(cfg.nonce || '');
    const t = encodeURIComponent(tipo);
    const g = encodeURIComponent(letraDooplay(letra));
    const urls = [];

    // Formatos mais prováveis do tema Dooplay. O arquivo testa em ordem e usa o primeiro que devolver itens.
    urls.push(`${base}?nonce=${n}&type=${t}&glossary=${g}`);
    urls.push(`${base}?nonce=${n}&post_type=${t}&glossary=${g}`);
    urls.push(`${base}?nonce=${n}&type=${t}&term=${g}`);
    urls.push(`${base}?nonce=${n}&post_type=${t}&term=${g}`);
    urls.push(`${base}${t}/${g}/?nonce=${n}`);
    urls.push(`${base}${g}/${t}/?nonce=${n}`);
    urls.push(`${base}?security=${n}&type=${t}&glossary=${g}`);
    urls.push(`${base}?_wpnonce=${n}&type=${t}&glossary=${g}`);

    return [...new Set(urls)];
}

async function tentarGlossaryDooplayPorLetra(gridId, statusId, idTela, letra, tokenLocal) {
    const tipo = tipoDooplayPorTela(idTela);
    if (!tipo || !letra || letra === 'ALL') return false;

    const grid = document.getElementById(gridId);
    const status = document.getElementById(statusId);
    if (!grid || !status) return false;

    status.innerText = `Consultando índice A-Z do site (${letra})...`;

    const cfg = await obterConfigGlossaryDooplay(tipo);
    const urls = urlsTesteGlossaryDooplay(cfg, tipo, letra);

    for (const urlApi of urls) {
        if (tokenLocal !== tokenFiltroLetraCronos) return true;
        try {
            const res = await fetch(PROXY + encodeURIComponent(urlApi));
            const txt = await res.text();
            const html = htmlGlossaryDaResposta(txt);
            if (!html || /no_verify_nonce|No data nonce|rest_no_route/i.test(html)) continue;

            const doc = new DOMParser().parseFromString(html, 'text/html');
            const itens = doc.querySelectorAll(obterSeletorItensCronos(idTela));
            if (!itens.length) continue;

            grid.innerHTML = '';
            itens.forEach(item => renderizarItemNoGrid(item, gridId));

            registrarSyncLog(idTela || 'listagem', `Página processada: ${urlAlvo}`, { itens: itens.length, gridId });

            if (grid.children.length > 0) {
                status.innerText = `Filtro ${letra}: ${grid.children.length} resultado(s) carregado(s) pelo índice A-Z do site.`;
                status.style.display = 'block';
                return true;
            }
        } catch(e) {}
    }

    return false;
}

async function carregarTodasPaginasPorLetraFallbackCronos(baseUrl, gridId, statusId, idTela, letra, tokenLocal) {
    // Mantido apenas para compatibilidade: o A-Z não busca mais páginas do site.
    const status = document.getElementById(statusId);
    if (status) {
        status.innerText = `Filtro ${letra}: consulta somente pelo IndexedDB.`;
        status.style.display = 'block';
        status.style.color = '';
    }
    return 0;
}

async function renderizarResultadosLetraDoBancoCronos(gridId, letra, tipoGrid = '') {
    await migrarLocalStorageParaIndexedDB();
    const grid = document.getElementById(gridId);
    if (!grid) return 0;

    let store = 'obras';
    if (tipoGrid === 'episodio') store = 'episodios';
    if (tipoGrid === 'temporada') store = 'temporadas';

    const itensBanco = await dbGetAll(store);
    let total = 0;
    itensBanco.forEach(item => {
        const titulo = item.titulo || item.serieTitulo || '';
        if (!tituloPassaFiltroLetraCronos(titulo, letra)) return;
        if (tipoGrid === 'filme' && item.tipo !== 'Filme') return;
        if (tipoGrid === 'serie' && item.tipo !== 'Série') return;
        if (grid.querySelector(`[data-url="${CSS.escape(item.url || '')}"]`)) return;
        renderizarRegistroBancoNoGrid(item, gridId);
        total++;
    });
    return total;
}

function renderizarRegistroBancoNoGrid(item, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid || !item || !item.url) return;
    if (grid.querySelector(`[data-url="${CSS.escape(item.url)}"]`)) return;

    const li = document.createElement('li');
    li.className = 'card-item';
    li.dataset.url = item.url;

    if (gridId === 'gridEpisodios' || gridId === 'gridInicioEpisodios' || item.tipo === 'Episódio') {
        li.classList.add('episodio-home-card');
        const temporada = String(item.temporada || '01').padStart(2, '0');
        const episodio = String(item.episodio || '01').padStart(2, '0');
        li.innerHTML = `
            <div class="card-media">
                <div class="badge-tipo badge-serie">Episódio</div>
                <div class="badge-qualidade">${SITE_CODE}</div>
                <img src="${normalizarImagemCard(item.img || item.poster || '') || placeholderCronosPoster()}" alt="Poster">
                ${item.data ? `<div class="badge-data-episodio">${item.data}</div>` : ''}
            </div>
            <h3>S${temporada} - Episódio ${episodio}</h3>
            <span class="ano-card">${item.serieTitulo || item.titulo || 'Nome da obra'}</span>
        `;
        li.onclick = () => analisarObra(item.url, item.ano || '', item.titulo || item.serieTitulo || '', item.img || item.poster || '', false);
        grid.appendChild(li);
        return;
    }

    if (gridId === 'gridTemporadas' || item.tipo === 'Temporada') {
        li.classList.add('global-card');
        const anoLimpo = extrairAnoCard(item.data || item.ano || '');
        li.innerHTML = `
            <div class="card-media">
                <div class="badge-tipo badge-serie">Temporada</div>
                <div class="badge-qualidade">${SITE_CODE}</div>
                <img src="${normalizarImagemCard(item.img || item.poster || '') || placeholderCronosPoster()}" alt="Poster">
                ${anoLimpo ? `<div class="badge-ano-card">${anoLimpo}</div>` : ''}
            </div>
            <h3>${item.serieTitulo || item.titulo || 'Temporada'}</h3>
            <span class="ano-card">Temporada ${item.temporada || ''}</span>
        `;
        li.onclick = () => analisarObra(item.url, anoLimpo, item.titulo || item.serieTitulo || '', item.img || item.poster || '', false);
        grid.appendChild(li);
        return;
    }

    li.classList.add('global-card');
    const isMovie = item.tipo === 'Filme' || item.isMovie;
    const posterSeguro = escolherPosterSeguroCronos(item.poster, item.img);
    grid.appendChild(li);
    if (posterSeguro) {
        preencherCardObraCronos(li, { ...item, poster: posterSeguro, img: posterSeguro }, gridId);
    } else {
        // Categoria, ano, busca e qualquer outra aba também não podem mostrar backdrop/fallback como poster.
        prepararCardObraDBFirst(li, {
            url: item.url,
            titulo: item.titulo || 'Sem título',
            ano: item.ano || '',
            img: '',
            poster: '',
            isMovie,
            isSerie: !isMovie,
            tipo: isMovie ? 'Filme' : 'Série'
        }, null, gridId);
    }
}

async function carregarTodasPaginasPorLetraCronos(baseUrl, gridId, statusId, idTela, btnMaisId, letra) {
    const tokenLocal = ++tokenFiltroLetraCronos;
    const grid = document.getElementById(gridId);
    const status = document.getElementById(statusId);
    const btnMais = document.getElementById(btnMaisId);
    if (!grid || !status) return 0;

    grid.innerHTML = '';
    if (btnMais) btnMais.style.display = 'none';
    status.style.display = 'block';
    status.style.color = '';
    status.innerText = `Consultando letra ${letra} no IndexedDB...`;

    const tipoGrid = filtroTipoGridAtual[gridId] || '';
    const qtdBanco = await renderizarResultadosLetraDoBancoCronos(gridId, letra, tipoGrid);
    if (tokenLocal !== tokenFiltroLetraCronos) return 0;

    if (qtdBanco > 0) {
        status.innerText = `Filtro ${letra}: ${qtdBanco} item(ns) carregado(s) do IndexedDB.`;
    } else {
        status.innerText = `Nenhum item encontrado com ${letra} no IndexedDB.`;
    }
    status.style.display = 'block';
    return qtdBanco;
}

async function fetchHtmlEPreencher(urlAlvo, gridId, statusId, idTela) {
    const grid = document.getElementById(gridId);
    const status = document.getElementById(statusId);
    const btnMais = obterBotaoMaisCronos(idTela);

    try {
        const res = await fetch(PROXY + encodeURIComponent(urlAlvo));
        const html = await res.text();
        if (status) status.style.display = 'none';
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const itens = doc.querySelectorAll(obterSeletorItensCronos(idTela));

        if (itens.length === 0) {
            if (grid && grid.children.length === 0 && status) {
                status.innerText = 'Nenhum resultado encontrado nessa página.';
                status.style.display = 'block';
            } else if (status) {
                status.innerText = 'Fim da lista ou nenhuma nova página encontrada.';
                status.style.display = 'block';
            }
            if (btnMais) btnMais.style.display = 'none';
            return 0;
        }

        itens.forEach(item => renderizarItemNoGrid(item, gridId));

        if (btnMais) {
            btnMais.style.display = 'block';
            btnMais.disabled = false;
            atualizarTextoBotaoMaisCronos(idTela);
        }
        return itens.length;
    }
    catch(err) {
        if (status) {
            status.innerText = 'Fim da lista ou erro de conexão.';
            status.style.display = 'block';
        }
        if (btnMais) btnMais.disabled = false;
        return 0;
    }
}

const GENEROS_CRONOS = [
    ['Ação', 'acao'],
    ['Aventura', 'aventura'],
    ['Animação', 'animacao'],
    ['Comédia', 'comedia'],
    ['Crime', 'crime'],
    ['Documentário', 'documentario'],
    ['Drama', 'drama'],
    ['Família', 'familia'],
    ['Fantasia', 'fantasia'],
    ['Faroeste', 'faroeste'],
    ['Ficção Científica', 'ficcao-cientifica'],
    ['Guerra', 'guerra'],
    ['História', 'historia'],
    ['Mistério', 'misterio'],
    ['Romance', 'romance'],
    ['Terror', 'terror'],
    ['Thriller', 'thriller'],
    ['Dorama', 'dorama']
];

async function montarCategorias() {
    const gridOficiais = document.getElementById('gridGenerosOficiaisCategorias');
    const gridAchados = document.getElementById('gridGenerosAchadosCategorias');
    const gridAnos = document.getElementById('gridAnosCategorias');
    if (!gridOficiais || !gridAchados || !gridAnos) return;

    await migrarLocalStorageParaIndexedDB();
    await atualizarInfoProgressoSyncCronos();
    const generosBanco = await dbGetAll('generos').catch(() => []);
    const anosBanco = await dbGetAll('anos').catch(() => []);

    const oficiaisMap = new Map();
    GENEROS_CRONOS.forEach(([nome, slug]) => oficiaisMap.set(slug, { nome, slug, url: `${CRONOS_BASE_URL}categoria/${slug}/` }));

    const generosOficiais = [];
    const generosAchados = [];
    const vistosOficiais = new Set();
    const vistosAchados = new Set();

    // Oficiais sempre aparecem primeiro: é a lista base do site/provedor.
    Array.from(oficiaisMap.values()).forEach(g => {
        if (!vistosOficiais.has(g.slug)) {
            vistosOficiais.add(g.slug);
            generosOficiais.push(g);
        }
    });

    // Achados são os gêneros descobertos dentro das fichas durante navegação/sincronização.
    generosBanco.forEach(g => {
        if (!g || !g.slug) return;
        const registro = { nome: g.nome || g.slug, slug: g.slug, url: g.url || `${CRONOS_BASE_URL}categoria/${g.slug}/` };
        if (oficiaisMap.has(g.slug)) return;
        if (vistosAchados.has(g.slug)) return;
        vistosAchados.add(g.slug);
        generosAchados.push(registro);
    });

    function criarBotaoGenero(g) {
        const btn = document.createElement('button');
        btn.className = 'btn-cat';
        btn.innerText = g.nome;
        btn.onclick = () => abrirFiltroCategoria('genre', g.nome, g.url || `${CRONOS_BASE_URL}categoria/${g.slug}/`);
        return btn;
    }

    gridOficiais.innerHTML = '';
    generosOficiais
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        .forEach(g => gridOficiais.appendChild(criarBotaoGenero(g)));

    gridAchados.innerHTML = '';
    generosAchados
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        .forEach(g => gridAchados.appendChild(criarBotaoGenero(g)));
    if (!gridAchados.children.length) gridAchados.innerHTML = '<div class="categoria-vazio">Nenhum gênero novo achado ainda. Use a sincronização para descobrir gêneros reais nas fichas.</div>';

    const setAnos = new Set();
    anosBanco.forEach(a => { if (a && a.ano) setAnos.add(String(a.ano)); });

    gridAnos.innerHTML = '';
    Array.from(setAnos).sort((a, b) => Number(b) - Number(a)).forEach(ano => {
        const btn = document.createElement('button');
        btn.className = 'btn-cat';
        btn.innerText = ano;
        btn.onclick = () => abrirFiltroCategoria('year', String(ano), `${CRONOS_BASE_URL}release/${ano}/`);
        gridAnos.appendChild(btn);
    });
    if (!gridAnos.children.length) gridAnos.innerHTML = '<div class="categoria-vazio">Nenhum ano salvo ainda. A sincronização preenche esta parte com os anos encontrados.</div>';

    await atualizarResumoSincronizacaoCronos();
}

async function renderizarFiltroDoBancoComLetraCronos(tipo, titulo, gridId, letra = 'ALL') {
    await migrarLocalStorageParaIndexedDB();
    const grid = document.getElementById(gridId);
    if (!grid) return 0;
    const obras = await dbGetAll('obras').catch(() => []);
    const slug = slugCronos(titulo);
    const termoBusca = slugCronos(termoBuscaAtual || titulo || '');
    let total = 0;

    obras.forEach(obra => {
        let passa = false;

        if (tipo === 'year') {
            passa = extrairAnoCard(obra.ano || '') === String(titulo);
        } else if (tipo === 'genre') {
            const generos = Array.isArray(obra.generos) ? obra.generos : [];
            passa = generos.some(g => g.slug === slug || slugCronos(g.nome || '') === slug);
        } else if (tipo === 'busca') {
            const tituloBusca = slugCronos(`${obra.titulo || ''} ${obra.tituloOriginal || ''}`);
            passa = termoBusca ? tituloBusca.includes(termoBusca) : true;
        } else {
            passa = true;
        }

        if (!passa) return;
        if (!tituloPassaFiltroLetraCronos(obra.titulo || '', letra)) return;
        if (grid.querySelector(`[data-url="${CSS.escape(obra.url || '')}"]`)) return;
        renderizarRegistroBancoNoGrid(obra, gridId);
        total++;
    });

    return total;
}

async function renderizarFiltroDoBanco(tipo, titulo, gridId) {
    return renderizarFiltroDoBancoComLetraCronos(tipo, titulo, gridId, 'ALL');
}

async function abrirFiltroCategoria(tipo, titulo, urlBase) {
    contextoBuscaAtual = { tipo, baseUrl: urlBase, titulo };
    const btnVoltarCategorias = document.getElementById('btnVoltarCategorias');
    if (btnVoltarCategorias) btnVoltarCategorias.style.display = 'inline-flex';

    paginaAtual['telaBusca'] = 1;
    filtroTipoGridAtual['gridBusca'] = '';
    filtroLetraGridAtual['gridBusca'] = 'ALL';

    const grid = document.getElementById('gridBusca');
    if (grid) grid.innerHTML = '';

    const tituloBusca = document.getElementById('tituloBusca');
    if (tituloBusca) tituloBusca.innerText = tipo === 'year' ? `Lançamentos de ${titulo}` : `Categoria: ${titulo}`;

    const status = document.getElementById('statusBusca');
    if (status) {
        status.innerText = tipo === 'year' ? 'Consultando Ano somente no IndexedDB...' : 'Consultando IndexedDB...';
        status.style.display = 'block';
        status.style.color = '';
    }

    const btnMais = document.getElementById('btnMaisBusca');
    if (btnMais) btnMais.style.display = 'none';

    ativarTela('telaBusca');
    gerarBarraAZ('abcFiltro', 'filtro');

    const qtdBanco = await renderizarFiltroDoBanco(tipo, titulo, 'gridBusca');

    if (tipo === 'year') {
        if (status) {
            status.innerText = qtdBanco > 0
                ? `Ano ${titulo}: ${qtdBanco} item(ns) carregado(s) somente do IndexedDB.`
                : `Nenhum item encontrado no IndexedDB para o ano ${titulo}. Sincronize o catálogo para preencher esse filtro.`;
            status.style.display = 'block';
        }
        if (btnMais) btnMais.style.display = 'none';
        return qtdBanco;
    }

    // Gênero fica como estava: primeiro mostra o que já existe no banco,
    // depois atualiza pela rota do provedor e mantém paginação/carregar mais pelo site.
    if (status) status.innerText = `Banco local: ${qtdBanco} item(ns). Atualizando pelo site...`;
    fetchHtmlEPreencher(urlBase, 'gridBusca', 'statusBusca', 'telaBusca');
    return qtdBanco;
}

function gerarTodasBarrasAZ() {
    gerarBarraAZ('abcFilmes', 'filmes');
    gerarBarraAZ('abcSeries', 'series');
    gerarBarraAZ('abcFiltro', 'filtro');
    gerarBarraAZ('abcTemporadas', 'temporadas');
}

function gerarBarraAZ(containerId, contexto) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const letras = ['ALL', '0-9', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
    letras.forEach(letra => {
        const btn = document.createElement('button');
        btn.className = 'abc-btn';
        btn.innerText = letra;
        btn.onclick = () => filtrarPorLetraCronos(contexto, letra, btn);
        container.appendChild(btn);
    });
}

async function filtrarPorLetraCronos(contexto, letra, btn) {
    // Cancela qualquer busca A-Z anterior se o usuário clicar em outra letra.
    tokenFiltroLetraCronos++;

    if (btn && btn.parentElement) {
        btn.parentElement.querySelectorAll('.abc-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    const localMap = {
        historicoLocal: { gridId: 'gridHistorico', statusId: 'statusHistorico' },
        favoritoLocal: { gridId: 'gridFavoritos', statusId: 'statusFavoritos' },
        lancamentosLocal: { gridId: 'gridLancamentos', statusId: 'statusLancamentos' }
    };
    if (localMap[contexto]) {
        filtrarGridAtualPorLetra(localMap[contexto].gridId, letra);
        const statusLocal = document.getElementById(localMap[contexto].statusId);
        if (statusLocal) {
            statusLocal.innerText = letra === 'ALL' ? 'Mostrando todos os itens locais.' : `Filtro ${letra} aplicado nos itens já carregados.`;
            statusLocal.style.display = 'block';
        }
        return;
    }

    if (contexto === 'filtro') {
        const gridId = 'gridBusca';
        const status = document.getElementById('statusBusca');
        const btnMais = document.getElementById('btnMaisBusca');
        const tipoAtual = (contextoBuscaAtual && contextoBuscaAtual.tipo) || 'busca';

        filtroLetraGridAtual[gridId] = letra;
        paginaAtual['telaBusca'] = 1;

        const grid = document.getElementById(gridId);
        if (grid) grid.innerHTML = '';
        if (btnMais) btnMais.style.display = 'none';

        if (tipoAtual === 'year') {
            if (status) {
                status.innerText = letra === 'ALL' ? 'Consultando Ano no IndexedDB...' : `Filtrando Ano por ${letra} no IndexedDB...`;
                status.style.display = 'block';
                status.style.color = '';
            }

            const qtdBanco = await renderizarFiltroDoBancoComLetraCronos(
                'year',
                contextoBuscaAtual.titulo || '',
                gridId,
                letra
            );

            if (status) {
                status.innerText = qtdBanco > 0
                    ? `Ano ${contextoBuscaAtual.titulo || ''} / ${letra}: ${qtdBanco} item(ns) do IndexedDB.`
                    : `Nenhum item encontrado no IndexedDB para este ano com ${letra}.`;
                status.style.display = 'block';
            }
            return;
        }

        if (tipoAtual === 'genre') {
            // Gênero continua pelo sistema original quando abre/carrega mais.
            // A barra A-Z, quando usada dentro do gênero, apenas refina pelo banco local para não varrer páginas do site.
            if (letra === 'ALL') {
                if (status) {
                    status.innerText = 'Recarregando categoria pelo site...';
                    status.style.display = 'block';
                    status.style.color = '';
                }
                fetchHtmlEPreencher(contextoBuscaAtual.baseUrl, gridId, 'statusBusca', 'telaBusca');
                return;
            }

            if (status) {
                status.innerText = `Filtrando gênero por ${letra} no IndexedDB...`;
                status.style.display = 'block';
                status.style.color = '';
            }
            const qtdBanco = await renderizarFiltroDoBancoComLetraCronos(
                'genre',
                contextoBuscaAtual.titulo || '',
                gridId,
                letra
            );
            if (status) {
                status.innerText = qtdBanco > 0
                    ? `Gênero ${contextoBuscaAtual.titulo || ''} / ${letra}: ${qtdBanco} item(ns) do IndexedDB.`
                    : `Nenhum item do gênero ${contextoBuscaAtual.titulo || ''} encontrado no IndexedDB com ${letra}.`;
                status.style.display = 'block';
            }
            return;
        }

        if (status) {
            status.innerText = letra === 'ALL' ? 'Consultando filtro no IndexedDB...' : `Filtrando ${letra} no IndexedDB...`;
            status.style.display = 'block';
            status.style.color = '';
        }

        const qtdBanco = await renderizarFiltroDoBancoComLetraCronos(
            tipoAtual,
            (contextoBuscaAtual && contextoBuscaAtual.titulo) || termoBuscaAtual || '',
            gridId,
            letra
        );

        if (status) {
            status.innerText = qtdBanco > 0
                ? `Filtro ${letra}: ${qtdBanco} item(ns) do IndexedDB.`
                : `Nenhum item encontrado com ${letra} no IndexedDB.`;
            status.style.display = 'block';
        }
        return;
    }

    let idTela = 'telaFilmes';
    let gridId = 'gridFilmes';
    let statusId = 'statusFilmes';
    let btnMaisId = 'btnMaisFilmes';
    let catalogoBase = 'https://www.boraflix.click/filmes/';
    let tipoGrid = 'filme';

    if (contexto === 'series') {
        idTela = 'telaSeries'; gridId = 'gridSeries'; statusId = 'statusSeries'; btnMaisId = 'btnMaisSeries';
        catalogoBase = 'https://www.boraflix.click/series/'; tipoGrid = 'serie';
    }
    if (contexto === 'episodios') {
        idTela = 'telaEpisodios'; gridId = 'gridEpisodios'; statusId = 'statusEpisodios'; btnMaisId = 'btnMaisEpisodios';
        catalogoBase = 'https://www.boraflix.click/episodios/'; tipoGrid = 'episodio';
    }
    if (contexto === 'temporadas') {
        idTela = 'telaTemporadas'; gridId = 'gridTemporadas'; statusId = 'statusTemporadas'; btnMaisId = 'btnMaisTemporadas';
        catalogoBase = 'https://www.boraflix.click/temporadas/'; tipoGrid = 'temporada';
    }

    filtroTipoGridAtual[gridId] = tipoGrid;
    filtroLetraGridAtual[gridId] = letra;
    paginaAtual[idTela] = 1;

    const status = document.getElementById(statusId);
    const btnMais = document.getElementById(btnMaisId);
    if (btnMais) btnMais.style.display = 'none';
    if (status) {
        status.innerText = letra === 'ALL' ? 'Consultando todos no IndexedDB...' : `Filtrando por ${letra} no IndexedDB...`;
        status.style.display = 'block';
        status.style.color = '';
    }

    await carregarTodasPaginasPorLetraCronos(catalogoBase, gridId, statusId, idTela, btnMaisId, letra);
}

function tituloPassaFiltroLetraCronos(titulo, letra) {
    if (!letra || letra === 'ALL') return true;
    const primeiro = (titulo || '').trim().charAt(0).toUpperCase();
    if (letra === '0-9') return /^[0-9]/.test(primeiro);
    return primeiro === letra;
}

function filtrarGridAtualPorLetra(gridId, letra) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    filtroLetraGridAtual[gridId] = letra;
    const cards = Array.from(grid.querySelectorAll('.card-item'));
    cards.forEach(card => {
        const titulo = (card.querySelector('h3')?.innerText || '').trim();
        card.style.display = tituloPassaFiltroLetraCronos(titulo, letra) ? 'flex' : 'none';
    });
}

function limparTextoCard(txt) {
    return (txt || '').trim().replace(/Assistir /gi, '').replace(/ online.*/gi, '').replace(/ dublado.*/gi, '').replace(/ legendado.*/gi, '').trim();
}


function normalizarImagemCard(url) {
    // Poster/capa sempre em W500 e sempre absoluto quando vier relativo.
    if (!url) return '';
    let limpa = String(url).trim();
    if (!limpa) return '';
    if (limpa.startsWith('//')) limpa = 'https:' + limpa;
    limpa = limpa.split(' ')[0];
    if (limpa.startsWith('data:image')) return limpa;
    if (!/^(https?:)?\/\//i.test(limpa)) {
        try {
            const providers = window.CRONOS_MULTI_PROVIDERS || {
                b01: { base: 'https://www.boraflix.click/' },
                p02: { base: 'https://www.boraflixtv.com/' }
            };
            const keyAtual = window.__CRONOS_RENDER_PROVIDER_KEY || window.__CRONOS_LAST_PROVIDER_RENDERED || (window.obraSendoVista && window.obraSendoVista.providerKey) || 'b01';
            const baseAtual = (providers[keyAtual] && providers[keyAtual].base) || providers.b01.base;
            limpa = new URL(limpa, baseAtual).href;
        } catch(e) {}
    }
    return limpa
        .replace(/\/(w92|w154|w185|w300|w342|w500|w780|w1280|original)\//i, '/w500/');
}

function normalizarBackdropOriginal(url) {
    // Backdrop/fundo sempre em original quando vier do TMDB e absoluto quando relativo.
    if (!url) return '';
    let limpa = String(url).trim();
    if (!limpa) return '';
    if (limpa.startsWith('//')) limpa = 'https:' + limpa;
    limpa = limpa.split(' ')[0];
    if (limpa.startsWith('data:image')) return limpa;
    if (!/^(https?:)?\/\//i.test(limpa)) {
        try {
            const providers = window.CRONOS_MULTI_PROVIDERS || {
                b01: { base: 'https://www.boraflix.click/' },
                p02: { base: 'https://www.boraflixtv.com/' }
            };
            const keyAtual = window.__CRONOS_RENDER_PROVIDER_KEY || window.__CRONOS_LAST_PROVIDER_RENDERED || (window.obraSendoVista && window.obraSendoVista.providerKey) || 'b01';
            const baseAtual = (providers[keyAtual] && providers[keyAtual].base) || providers.b01.base;
            limpa = new URL(limpa, baseAtual).href;
        } catch(e) {}
    }
    return limpa.replace(/\/(w92|w154|w185|w300|w342|w500|w780|w1280|original)\//i, '/original/');
}

function imagemEhPlaceholderCronos(url) {
    const u = String(url || '').toLowerCase();
    return !u ||
        u.startsWith('data:image') ||
        u.includes('/assets/img/no/') ||
        u.includes('dt_backdrop.png') ||
        u.includes('no_poster') ||
        u.includes('placeholder') ||
        u.includes('loading') ||
        u.includes('carregando') ||
        u.includes('favicon') ||
        u.includes('logo');
}

function coletarSrcsImagemCronos(img) {
    const candidatos = [];
    const attrs = [
        'data-src',
        'data-lazy-src',
        'data-wpfc-original-src',
        'data-original',
        'data-image',
        'data-poster',
        'src'
    ];

    attrs.forEach(attr => {
        const val = img.getAttribute(attr);
        if (val) candidatos.push(val);
    });

    const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset');
    if (srcset) {
        const partes = srcset.split(',').map(p => p.trim().split(/\s+/)[0]).filter(Boolean);
        candidatos.push(...partes.reverse());
    }

    return candidatos;
}

function extrairImagemCapaItem(item) {
    const candidatosPrioritarios = [];
    const candidatosGerais = [];

    // No BoraFlix a capa correta de filme/série fica principalmente em .poster img.
    // Essa prioridade evita salvar backdrop/fallback no lugar do poster.
    item.querySelectorAll('.poster img, .image .poster img, img[itemprop="image"]').forEach(img => {
        candidatosPrioritarios.push(...coletarSrcsImagemCronos(img));
    });

    item.querySelectorAll('img').forEach(img => {
        candidatosGerais.push(...coletarSrcsImagemCronos(img));
    });

    item.querySelectorAll('[style*="background"]').forEach(el => {
        const st = el.getAttribute('style') || '';
        const m = st.match(/url\(["']?([^"')]+)["']?\)/i);
        if (m && m[1]) candidatosGerais.push(m[1]);
    });

    const limparLista = lista => lista
        .map(normalizarImagemCard)
        .filter(Boolean)
        .filter(u => !imagemEhPlaceholderCronos(u));

    const prioritarios = limparLista(candidatosPrioritarios);
    if (prioritarios.length) return prioritarios[0];

    const gerais = limparLista(candidatosGerais);
    const poster = gerais.find(u => posterBomCronos(u));
    if (poster) return poster;

    return '';
}

function itemJaTemPosterBom(item) {
    return !!item.querySelector('.poster img, .image .poster img, img[itemprop="image"]');
}

function imagemPareceBackdropOuImagemFraca(url) {
    const u = String(url || '').toLowerCase();
    if (!u) return true;
    return /backdrop|fanart|\/w780\/|\/w1280\/|\/original\//i.test(u);
}

async function buscarPosterDetalhePorUrl(urlObra) {
    if (!urlObra) return '';
    if (cachePosterDetalhe.has(urlObra)) return cachePosterDetalhe.get(urlObra);
    try {
        const res = await fetch(PROXY + encodeURIComponent(urlObra));
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const poster = normalizarImagemCard(extrairPosterDetalhe(doc) || '');
        cachePosterDetalhe.set(urlObra, poster || '');
        return poster || '';
    } catch (e) {
        console.warn('Falha ao buscar poster do detalhe:', urlObra, e);
        cachePosterDetalhe.set(urlObra, '');
        return '';
    }
}

async function enriquecerPosterDoCardSeNecessario(li, itemOriginal, urlObra, imgAtual) {
    if (!li || !urlObra) return;
    if (itemJaTemPosterBom(itemOriginal) && !imagemPareceBackdropOuImagemFraca(imgAtual)) return;
    if (!imagemPareceBackdropOuImagemFraca(imgAtual) && /\/w500\//i.test(String(imgAtual || ''))) return;
    const poster = await buscarPosterDetalhePorUrl(urlObra);
    if (!poster) return;
    const imgEl = li.querySelector('.card-media img');
    if (imgEl) imgEl.src = poster;
    li.dataset.poster = poster;
}

function extrairDadosBasicosItem(item) {
    if(!item || !item.querySelector) return null;
    const linkEl = item.querySelector('a[href]');
    const imgEl = item.querySelector('.poster img, .dt_poster img, .imagen img, .Image img, figure img, img.TPostBg, img');
    const titleEl = item.querySelector('h1.Title, h2.Title, h3.Title, .Title, h3, .title, .name, .Name, a[title]');
    const anoEl = item.querySelector('.year, .Date, span.Date, .Info .Date, time, span');
    const qualidadeEl = item.querySelector('.quality, .Qlty, span.Qlty');
    if(!linkEl || !titleEl) return null;
    const urlString = linkEl.href || linkEl.getAttribute('href') || '';
    const isMovie = urlString.includes('/filmes/') || urlString.includes('/movies/') || item.classList.contains('movies') || item.classList.contains('movie');
    const isSerie = urlString.includes('/series/') || urlString.includes('/temporada/') || item.classList.contains('tvshows') || item.classList.contains('serie');
    const titulo = limparTextoCard((titleEl.innerText || titleEl.textContent || linkEl.getAttribute('title') || '').trim());
    let img = extrairImagemCapaItem(item) || '';
    if(!img && imgEl) {
        img = imgEl.getAttribute('data-src') || imgEl.getAttribute('data-lazy-src') || imgEl.getAttribute('data-original') || imgEl.getAttribute('data-wpfc-original-src') || imgEl.getAttribute('src') || '';
    }
    if(img && img.startsWith('//')) img = 'https:' + img;
    if(img) img = img.replace('w92', 'w500').replace('w185', 'w500');
    return {
        url: urlString,
        titulo,
        img,
        ano: anoEl ? (anoEl.innerText || anoEl.textContent || '').trim() : '',
        qualidade: qualidadeEl ? (qualidadeEl.innerText || qualidadeEl.textContent || '').trim() : '',
        isMovie,
        isSerie
    };
}

async function adicionarDestaquePremium(item, enriquecer = false) {
    const dadosBasicos = extrairDadosBasicosItem(item);
    if(!dadosBasicos) return;

    let dados = dadosBasicosParaObra(dadosBasicos);
    const providerKeyAtual = dados.providerKey || window.__CRONOS_RENDER_PROVIDER_KEY || providerPorUrl(dados.url);
    const providerInfoAtual = providerInfoCronos(providerKeyAtual);
    dados.providerKey = providerKeyAtual;
    dados.providerName = providerInfoAtual.nome;
    dados.providerSigla = providerInfoAtual.sigla;
    dados.baseUrl = providerInfoAtual.base;

    if (enriquecer && dados.url) {
        try {
            await migrarLocalStorageParaIndexedDB();
            const salvo = await dbGet('obras', gerarIdCronos(dados.url, providerKeyAtual));
            const completoNoBanco = salvo && escolherPosterSeguroCronos(salvo.poster, salvo.img) && salvo.backdrop && salvo.sinopse && salvo.ano;

            if (completoNoBanco) {
                // Cache completo: não entra novamente na página interna do destaque.
                dados = { ...dados, ...salvo };
            } else {
                // Só faz crawler do destaque quando a obra é nova ou está incompleta no IndexedDB.
                const detalhes = await extrairDetalhesDestaquePremium(dados.url);
                dados = { ...(salvo || {}), ...dados, ...detalhes };
                dados.providerKey = providerKeyAtual;
                dados.providerName = providerInfoAtual.nome;
                dados.providerSigla = providerInfoAtual.sigla;
                dados.baseUrl = providerInfoAtual.base;
                await salvarObraCronos(dados);
            }
        } catch(e) {
            console.warn('Falha ao enriquecer destaque:', dados.url, e);
            try { await salvarObraCronos(dados); } catch(e2) { console.warn('Falha ao salvar destaque no banco:', dados.url, e2); }
        }
    } else {
        try { await salvarObraCronos(dados); } catch(e) { console.warn('Falha ao salvar destaque no banco:', dados.url, e); }
    }

    dados.providerKey = providerKeyAtual;
    dados.providerName = providerInfoAtual.nome;
    dados.providerSigla = providerInfoAtual.sigla;
    dados.baseUrl = providerInfoAtual.base;
    destaquesPremiumHome.push(dados);
}

async function extrairDetalhesDestaquePremium(urlObra) {
    const res = await fetch(PROXY + encodeURIComponent(urlObra));
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    let titulo = doc.querySelector('h1')?.innerText?.trim() || '';
    titulo = limparTextoCard(titulo);

    const poster = extrairPosterDetalhe(doc);
    const backdrop = extrairBackdropDetalhe(doc);
    const sinopse = extrairSinopseDetalhe(doc);
    const ano = extrairAnoDetalhe(doc);
    const generos = extrairGenerosDetalhe(doc);
    const tipo = (urlObra.includes('/filmes/') || urlObra.includes('/movies/')) ? 'Filme' : 'Série';

    return {
        titulo: titulo || undefined,
        img: poster || undefined,
        poster: poster || undefined,
        backdrop: backdrop || '',
        sinopse: sinopse || '',
        ano: ano || undefined,
        generos,
        tipo: tipo,
        isMovie: tipo === 'Filme',
        isSerie: tipo === 'Série'
    };
}

function extrairPosterDetalhe(doc) {
    const candidatosPrioritarios = [];
    const candidatosGerais = [];

    ['.poster img', '.dt_poster img', '.sheader .poster img', '.imagen img'].forEach(sel => {
        doc.querySelectorAll(sel).forEach(img => candidatosPrioritarios.push(...coletarSrcsImagemCronos(img)));
    });

    ['.image img', 'meta[property="og:image"]'].forEach(sel => {
        doc.querySelectorAll(sel).forEach(el => {
            const val = el.tagName === 'META'
                ? el.getAttribute('content')
                : (el.getAttribute('data-src') || el.getAttribute('data-lazy-src') || el.getAttribute('src'));
            if (val) candidatosGerais.push(val);
        });
    });

    const prioritarios = candidatosPrioritarios.map(normalizarImagemCard).filter(posterBomCronos);
    if (prioritarios.length) return prioritarios[0];

    const gerais = candidatosGerais.map(normalizarImagemCard).filter(posterBomCronos);
    return gerais[0] || '';
}

function extrairBackdropDetalhe(doc) {
    const candidatos = [];

    const seletores = [
        '.backdrop',
        '.backdrop img',
        '.fanart',
        '.fanart img',
        '.dt_backdrop',
        '.dt_backdrop img',
        '.sheader',
        '.single-cover',
        '[style*="background"]',
        'meta[property="og:image"]'
    ];

    seletores.forEach(sel => {
        doc.querySelectorAll(sel).forEach(el => {
            const src = el.tagName === 'META'
                ? el.getAttribute('content')
                : (el.getAttribute('data-src') || el.getAttribute('data-lazy-src') || el.getAttribute('src'));
            if (src) candidatos.push(src);
            const st = el.getAttribute('style') || '';
            const m = st.match(/url\(["']?([^"')]+)["']?\)/i);
            if (m && m[1]) candidatos.push(m[1]);
        });
    });

    const limpos = candidatos.map(normalizarBackdropOriginal).filter(Boolean).filter(u => !imagemEhPlaceholderCronos(u));
    const preferido = limpos.find(u => /backdrop|w780|w1280|original/i.test(u));
    return preferido || limpos[0] || '';
}

function extrairSinopseDetalhe(doc) {
    const seletores = [
        '.wp-content p',
        '.sinopse p',
        '.synopsis p',
        '.description p',
        '.overview p',
        '#info .wp-content p',
        '.entry-content p'
    ];

    for (const sel of seletores) {
        const el = doc.querySelector(sel);
        if (!el) continue;
        const txt = limparSinopsePremium(el.innerText || '');
        if (txt && txt.length > 20) return txt;
    }

    const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    return limparSinopsePremium(metaDesc);
}

function ajustarUrlBackdropPremium(url) {
    return normalizarBackdropOriginal(url || '');
}

function limparSinopsePremium(txt) {
    return String(txt || '')
        .replace(/Assistir\s+/gi, '')
        .replace(/\s+online\s*/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function extrairAnoDetalhe(doc) {
    const texto = [
        doc.querySelector('.date')?.innerText || '',
        doc.querySelector('.year')?.innerText || '',
        doc.querySelector('.custom_fields')?.innerText || '',
        doc.body?.innerText?.slice(0, 3000) || ''
    ].join(' ');
    return extrairAnoCard(texto);
}



function limitarDestaquesPremiumPorFonteCronos(lista, limite = 8) {
    if (!Array.isArray(lista)) return [];
    const contadores = {};
    return lista.filter(item => {
        const key = item && (item.providerKey || item.providerSigla || item.providerName || 'default');
        contadores[key] = (contadores[key] || 0) + 1;
        return contadores[key] <= limite;
    });
}

function atualizarDestaquePremium(novoIndex) {
    try { destaquesPremiumHome = limitarDestaquesPremiumPorFonteCronos(destaquesPremiumHome, 8); } catch(e) {}
    const box = document.getElementById('premiumSlides');
    const slider = document.getElementById('sliderDestaquesPremium');
    const dots = document.getElementById('premiumDots');
    if(!box || !slider) return;
    if(!destaquesPremiumHome.length) {
        box.innerHTML = '<div class="premium-empty">Nenhum destaque premium encontrado.</div>';
        if(dots) dots.innerHTML = '';
        return;
    }

    destaquePremiumAtual = (novoIndex + destaquesPremiumHome.length) % destaquesPremiumHome.length;
    box.innerHTML = '';
    if(dots) dots.innerHTML = '';

    destaquesPremiumHome.forEach((obra, index) => {
        const slide = document.createElement('div');
        slide.className = 'premium-slide' + (index === destaquePremiumAtual ? ' ativo' : '');
        if (obra.providerKey) { slide.dataset.provider = obra.providerKey; slide.dataset.providerSigla = obra.providerSigla || ''; }

        const posterPremium = escolherPosterSeguroCronos(obra.poster, obra.img) || placeholderCronosPoster();
        const fundoPremiumBase = obra.backdrop || posterPremium;
        const fundoPremium = ajustarUrlBackdropPremium(fundoPremiumBase);
        const sinopsePremium = obra.sinopse || 'Sem sinopse disponível.';

        slide.innerHTML = `
            <div class="premium-bg-cover" style="background-image:url('${fundoPremium}')"></div>
            <div class="premium-bg-contain" style="background-image:url('${fundoPremium}')"></div>
            <div class="premium-overlay"></div>
            <div class="premium-info">
                <h3>${obra.titulo}</h3>
                <p>${sinopsePremium}</p>
            </div>
        `;
        slide.onclick = () => analisarObra(obra.url, obra.ano, obra.titulo, posterPremium, obra.isMovie);
        box.appendChild(slide);

        if(dots) {
            const dot = document.createElement('button');
            dot.className = 'premium-dot' + (index === destaquePremiumAtual ? ' ativo' : '');
            dot.setAttribute('aria-label', 'Ir para destaque ' + (index + 1));
            dot.onclick = (ev) => {
                ev.stopPropagation();
                atualizarDestaquePremium(index);
            };
            dots.appendChild(dot);
        }
    });
}

function moverDestaquePremium(direcao) {
    atualizarDestaquePremium(destaquePremiumAtual + direcao);
}

function rolarHomeRow(gridId, direcao) {
    const grid = document.getElementById(gridId);
    if(!grid) return;
    grid.scrollBy({ left: direcao * 720, behavior: 'smooth' });
}
function extrairAnoCard(texto) {
    const match = String(texto || '').match(/\b(19|20)\d{2}\b/);
    return match ? match[0] : '';
}

function extrairNomeObraPelaUrl(url) {
    try {
        const partes = new URL(url).pathname.split('/').filter(Boolean);
        let slug = partes[partes.length - 1] || '';
        slug = slug
            .replace(/epis[oó]dio[-_\s]*\d+/gi, '')
            .replace(/episode[-_\s]*\d+/gi, '')
            .replace(/s\d+e\d+/gi, '')
            .replace(/temporada[-_\s]*\d+/gi, '')
            .replace(/[-_]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        return slug ? slug.replace(/\b\w/g, c => c.toUpperCase()) : '';
    } catch(e) {
        return '';
    }
}

function limparDataEpisodioHome(texto) {
    return (texto || '')
        .replace(/S\s*\d+\s*E\s*\d+/gi, '')
        .replace(/\d+\s*[xX×]\s*\d+/gi, '')
        .replace(/[\/|]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function extrairNomeObraDoEpisodio(item, tituloLimpoCard, urlString = '') {
    const spanSerie = item.querySelector('.serie');
    const textoSerie = spanSerie ? ((spanSerie.innerText || spanSerie.textContent || '').trim()) : '';
    if (textoSerie) return textoSerie;

    const possiveis = [
        '.tvshow', '.show', '.name', '.serie-title', '.series-title',
        '.post-title', '.data h3', '.data h2', '.title-series', '.titulo-serie'
    ];

    for (const sel of possiveis) {
        const el = item.querySelector(sel);
        if (!el) continue;
        let txt = (el.innerText || '').trim();
        if (!txt) continue;
        txt = txt
            .replace(/epis[oó]dio\s*\d+/gi, '')
            .replace(/episode\s*\d+/gi, '')
            .replace(/S\s*\d+\s*E\s*\d+/gi, '')
            .replace(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2},\s+\d{4}\b/gi, '')
            .replace(/[\/|–-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (txt && txt.length > 3 && !/^epis[oó]dio\s*\d+$/i.test(txt)) return txt;
    }

    let fallback = (tituloLimpoCard || '').split(/[:\-]/)[0].trim();
    if (!fallback || /^epis[oó]dio\s*\d+$/i.test(fallback)) {
        fallback = extrairNomeObraPelaUrl(urlString);
    }
    return fallback || tituloLimpoCard || 'Nome da obra';
}

function placeholderCronosPoster() {
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750"><rect width="500" height="750" fill="#0b0b0b"/><text x="250" y="375" text-anchor="middle" fill="#00ffff" font-family="Arial" font-size="42" font-weight="bold">CRONOS</text><text x="250" y="425" text-anchor="middle" fill="#ffcc00" font-family="Arial" font-size="22">carregando poster</text></svg>`);
}

function colocarSkeletonCard(li) {
    li.className = 'card-item global-card card-skeleton';
    li.innerHTML = `<div class="skeleton-media"></div><div class="skeleton-line"></div><div class="skeleton-line curta"></div>`;
}

function slugCronos(txt) {
    return String(txt || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/&/g, 'e')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function detectarTipoPorUrl(url) {
    if (String(url || '').includes('/filmes/')) return 'Filme';
    if (String(url || '').includes('/episodios/') || String(url || '').includes('/episodio/')) return 'Episódio';
    if (String(url || '').includes('/temporadas/')) return 'Temporada';
    return 'Série';
}

function extrairGenerosDetalhe(doc) {
    const generos = [];
    doc.querySelectorAll('.genres .mta a, .sgeneros a, a[href*="/categoria/"]').forEach(a => {
        const nome = limparTextoCard(a.innerText || '');
        if (!nome || nome.length > 40) return;
        let url = a.href || '';
        let slug = '';
        try { slug = new URL(url).pathname.split('/').filter(Boolean).pop() || slugCronos(nome); }
        catch(e) { slug = slugCronos(nome); }
        if (!generos.some(g => g.slug === slug)) generos.push({ nome, slug, url: url || `${CRONOS_BASE_URL}categoria/${slug}/` });
    });
    return generos;
}

async function salvarGeneroCronos(genero) {
    if (!genero || !genero.slug) return;
    await dbPut('generos', {
        id: genero.slug,
        providerKey: CRONOS_PROVIDER_KEY,
        providerName: CRONOS_PROVIDER_NAME,
        nome: genero.nome || genero.slug,
        slug: genero.slug,
        url: genero.url || `${CRONOS_BASE_URL}categoria/${genero.slug}/`,
        updatedAt: new Date().toISOString()
    });
}

async function salvarAnoCronos(ano) {
    const anoLimpo = extrairAnoCard(ano || '');
    if (!anoLimpo) return;
    await dbPut('anos', {
        id: anoLimpo,
        providerKey: CRONOS_PROVIDER_KEY,
        providerName: CRONOS_PROVIDER_NAME,
        ano: anoLimpo,
        url: `${CRONOS_BASE_URL}release/${anoLimpo}/`,
        updatedAt: new Date().toISOString()
    });
}

async function salvarObraCronos(obra) {
    if (!obra || !obra.url) return null;
    await migrarLocalStorageParaIndexedDB();
    const providerKeySalvar = obra.providerKey || window.__CRONOS_RENDER_PROVIDER_KEY || providerPorUrl(obra.url);
    const providerInfoSalvar = providerInfoCronos(providerKeySalvar);
    const existente = await dbGet('obras', gerarIdCronos(obra.url, providerKeySalvar));

    const posterExistente = escolherPosterSeguroCronos(existente?.poster, existente?.img);
    const posterNovo = escolherPosterSeguroCronos(obra.poster, obra.img);
    const posterManualExistente = (existente?.posterManual || existente?.posterManualEditable || existente?.posterManualUpload) ? posterExistente : '';
    const posterManualNovo = (obra.posterManual || obra.posterManualEditable || obra.posterManualUpload) ? posterNovo : '';
    const posterFinal = posterManualNovo || posterManualExistente || posterNovo || posterExistente || '';
    const backdropExistente = escolherBackdropSeguroCronos(existente?.backdrop);
    const backdropNovo = escolherBackdropSeguroCronos(obra.backdrop, (!posterBomCronos(obra.img) ? obra.img : ''));

    const mesclado = {
        ...(existente || {}),
        ...obra,
        providerKey: providerKeySalvar,
        providerName: providerInfoSalvar.nome,
        providerSigla: obra.providerSigla || providerInfoSalvar.sigla,
        baseUrl: providerInfoSalvar.base,
        poster: posterFinal,
        img: posterFinal,
        backdrop: backdropNovo || backdropExistente || '',
        sinopse: obra.sinopse || existente?.sinopse || obra.overview || existente?.overview || '',
        generos: (Array.isArray(obra.generos) && obra.generos.length) ? obra.generos : (existente?.generos || []),
        posterManual: !!(obra.posterManual || existente?.posterManual),
        posterManualEditable: !!(obra.posterManual || obra.posterManualEditable || existente?.posterManual || existente?.posterManualEditable),
        posterManualUpload: !!(obra.posterManualUpload || existente?.posterManualUpload),
        posterManualFonte: obra.posterManualFonte || existente?.posterManualFonte || '',
        posterManualModo: obra.posterManualModo || existente?.posterManualModo || '',
        createdAt: existente?.createdAt
    };

    const registro = normalizarObraParaBanco(mesclado);
    await dbPut('obras', registro);
    await salvarAnoCronos(registro.ano);
    for (const genero of (registro.generos || [])) await salvarGeneroCronos(genero);
    return registro;
}

async function salvarEpisodioCronos(ep) {
    if (!ep || !ep.url) return null;
    await migrarLocalStorageParaIndexedDB();
    const agora = new Date().toISOString();
    const registro = {
        id: gerarIdCronos(ep.url),
        providerKey: CRONOS_PROVIDER_KEY,
        providerName: CRONOS_PROVIDER_NAME,
        baseUrl: CRONOS_BASE_URL,
        tipo: 'Episódio',
        ...ep,
        img: normalizarImagemCard(ep.img || ep.poster || ''),
        poster: normalizarImagemCard(ep.poster || ep.img || ''),
        updatedAt: agora,
        createdAt: ep.createdAt || agora
    };
    await dbPut('episodios', registro);
    await salvarAnoCronos(registro.ano || registro.data || '');
    return registro;
}

async function salvarTemporadaCronos(temp) {
    if (!temp || !temp.url) return null;
    await migrarLocalStorageParaIndexedDB();
    const registro = { ...temp, tipo: 'Temporada', updatedAt: new Date().toISOString() };
    await dbPut('temporadas', registro);
    await salvarAnoCronos(registro.data || registro.ano || '');
    return registro;
}

function dadosBasicosParaObra(dados) {
    const tipo = dados.isMovie ? 'Filme' : 'Série';
    return {
        ...dados,
        tipo,
        isMovie: tipo === 'Filme',
        poster: dados.poster || dados.img || '',
        img: dados.img || dados.poster || ''
    };
}

function posterBomCronos(url) {
    return !!url && !imagemEhPlaceholderCronos(url) && !imagemPareceBackdropOuImagemFraca(url);
}

function escolherPosterSeguroCronos(...urls) {
    for (const url of urls) {
        const normalizada = normalizarImagemCard(url || '');
        if (posterBomCronos(normalizada)) return normalizada;
    }
    return '';
}

function escolherBackdropSeguroCronos(...urls) {
    for (const url of urls) {
        const normalizada = normalizarBackdropOriginal(url || '');
        if (normalizada && !imagemEhPlaceholderCronos(normalizada)) return normalizada;
    }
    return '';
}

function preencherCardObraCronos(li, dados, gridId) {
    if (!li || !dados) return;
    li.className = 'card-item global-card';
    li.dataset.url = dados.url || '';
    li.dataset.provider = dados.providerKey || providerPorUrl(dados.url);
    li.dataset.providerKey = li.dataset.provider;
    li.dataset.providerSigla = dados.providerSigla || providerLabel(li.dataset.provider);
    const isMovie = dados.tipo === 'Filme' || dados.isMovie;
    const anoLimpo = extrairAnoCard(dados.ano || '');
    const poster = escolherPosterSeguroCronos(dados.poster, dados.img) || placeholderCronosPoster();
    li.dataset.poster = poster;
    li.innerHTML = `
        <div class="card-media">
            <div class="badge-tipo ${isMovie ? 'badge-filme' : 'badge-serie'}">${isMovie ? 'Filme' : 'Série'}</div>
            <div class="badge-qualidade">${SITE_CODE}</div>
            <img src="${poster}" alt="Poster">
            ${anoLimpo ? `<div class="badge-ano-card">${anoLimpo}</div>` : ''}
        </div>
        <h3>${dados.titulo || 'Sem título'}</h3>
    `;
    li.onclick = () => analisarObra(dados.url, anoLimpo || dados.ano || '', dados.titulo || '', poster, isMovie);
    if (gridId !== 'gridFavoritos' && gridId !== 'gridHistorico') {
        adicionarBotaoFavoritarHoverCronos(li, { ...dados, img: poster, poster, isMovie, tipo: isMovie ? 'Filme' : 'Série' });
    }
}

async function prepararCardObraDBFirst(li, dadosBasicos, itemOriginal, gridId) {
    colocarSkeletonCard(li);
    await migrarLocalStorageParaIndexedDB();
    const salvo = await dbGet('obras', gerarIdCronos(dadosBasicos.url));
    let dados = { ...dadosBasicosParaObra(dadosBasicos), ...(salvo || {}) };

    const posterSalvo = escolherPosterSeguroCronos(salvo?.poster, salvo?.img);
    if (posterSalvo) {
        dados.poster = posterSalvo;
        dados.img = posterSalvo;
        preencherCardObraCronos(li, dados, gridId);
        // Atualiza ano/título/tipo sem permitir que fallback/backdrop sobrescreva o poster salvo.
        salvarObraCronos({ ...dados, ano: dadosBasicos.ano || dados.ano, titulo: dadosBasicos.titulo || dados.titulo });
        return;
    }

    const imgListagem = normalizarImagemCard(dadosBasicos.img || '');
    const podeUsarListagem = itemOriginal && itemJaTemPosterBom(itemOriginal) && posterBomCronos(imgListagem);
    if (podeUsarListagem) {
        dados.poster = imgListagem;
        dados.img = imgListagem;
        preencherCardObraCronos(li, dados, gridId);
        salvarObraCronos(dados);
        return;
    }

    try {
        const detalhes = await extrairDetalhesDestaquePremium(dadosBasicos.url) || {};
        const posterDetalhe = escolherPosterSeguroCronos(detalhes.poster, detalhes.img, dados.poster, dados.img, dadosBasicos.poster, dadosBasicos.img);
        // Mescla segura: detalhe vazio/404 não pode apagar título, URL ou tipo que já vieram da listagem.
        dados = {
            ...dados,
            ...detalhes,
            url: dados.url || dadosBasicos.url || detalhes.url || '',
            titulo: limparTextoCard(detalhes.titulo || '') || limparTextoCard(dados.titulo || '') || limparTextoCard(dadosBasicos.titulo || '') || 'Sem título',
            ano: extrairAnoCard(detalhes.ano || '') || extrairAnoCard(dados.ano || '') || extrairAnoCard(dadosBasicos.ano || ''),
            tipo: dados.tipo || dadosBasicos.tipo || detalhes.tipo || (dados.isMovie ? 'Filme' : 'Série'),
            isMovie: !!(dados.isMovie || dadosBasicos.isMovie || detalhes.isMovie),
            isSerie: !(dados.isMovie || dadosBasicos.isMovie || detalhes.isMovie),
            poster: posterDetalhe || dados.poster || dados.img || dadosBasicos.poster || dadosBasicos.img || '',
            img: posterDetalhe || dados.img || dados.poster || dadosBasicos.img || dadosBasicos.poster || ''
        };
        await salvarObraCronos(dados);
        preencherCardObraCronos(li, dados, gridId);
    } catch (e) {
        console.warn('Falha ao enriquecer card:', dadosBasicos.url, e);
        const posterSeguro = escolherPosterSeguroCronos(dados.poster, dados.img);
        if (posterSeguro) {
            preencherCardObraCronos(li, { ...dados, poster: posterSeguro, img: posterSeguro }, gridId);
        } else {
            preencherCardObraCronos(li, { ...dados, poster: placeholderCronosPoster(), img: placeholderCronosPoster() }, gridId);
        }
    }
}

function extrairDadosEpisodioItem(item, tituloLimpoCard, urlString, imgFinal, dataCard) {
    const textoCompleto = item.innerText || '';
    let temporada = '01';
    let episodio = '01';
    const matchSE = textoCompleto.match(/S\s*(\d+)\s*E\s*(\d+)/i) || urlString.match(/(\d+)\s*[xX]\s*(\d+)/i);
    const matchEp = textoCompleto.match(/epis[oó]dio\s*(\d+)/i);
    if (matchSE) {
        temporada = String(matchSE[1]).padStart(2, '0');
        episodio = String(matchSE[2]).padStart(2, '0');
    } else if (matchEp) {
        episodio = String(matchEp[1]).padStart(2, '0');
    }
    const dataLimpa = limparDataEpisodioHome(dataCard);
    const nomeObra = extrairNomeObraDoEpisodio(item, tituloLimpoCard, urlString);
    return {
        url: urlString,
        titulo: tituloLimpoCard || `${nomeObra} ${temporada}x${episodio}`,
        serieTitulo: nomeObra,
        temporada,
        episodio,
        data: dataLimpa,
        img: imgFinal,
        poster: imgFinal
    };
}

function renderizarEpisodioCronos(item, gridId, urlString, tituloLimpoCard, imgFinal, dataCard, qualityHTML, badgeHTML) {
    const gridDestino = document.getElementById(gridId);
    const dadosEp = extrairDadosEpisodioItem(item, tituloLimpoCard, urlString, imgFinal, dataCard);
    const li = document.createElement('li');
    li.className = 'card-item episodio-home-card';
    li.dataset.url = urlString;
    li.innerHTML = `
        <div class="card-media">
            ${badgeHTML}
            ${qualityHTML}
            <img src="${imgFinal || placeholderCronosPoster()}" alt="Poster">
            ${dadosEp.data ? `<div class="badge-data-episodio">${dadosEp.data}</div>` : ''}
        </div>
        <h3>S${dadosEp.temporada} - Episódio ${dadosEp.episodio}</h3>
        <span class="ano-card">${dadosEp.serieTitulo}</span>
    `;
    li.onclick = () => analisarObra(urlString, '', tituloLimpoCard, imgFinal, false);
    gridDestino.appendChild(li);
    salvarEpisodioCronos(dadosEp);
}

function renderizarTemporadaCronos(item, gridId) {
    const gridDestino = document.getElementById(gridId);
    const dadosTemp = extrairDadosTemporadaItem(item);
    if (!dadosTemp || !dadosTemp.url) return;
    const letraAtivaGrid = filtroLetraGridAtual[gridId] || 'ALL';
    if (!tituloPassaFiltroLetraCronos(dadosTemp.serieTitulo || dadosTemp.titulo, letraAtivaGrid)) return;
    if (gridDestino.querySelector(`[data-url="${CSS.escape(dadosTemp.url)}"]`)) return;
    const li = document.createElement('li');
    li.className = 'card-item global-card';
    li.dataset.url = dadosTemp.url;
    const anoLimpo = extrairAnoCard(dadosTemp.data || '');
    li.innerHTML = `
        <div class="card-media">
            <div class="badge-tipo badge-serie">Temporada</div>
            <div class="badge-qualidade">${SITE_CODE}</div>
            <img src="${dadosTemp.poster || placeholderCronosPoster()}" alt="Poster">
            ${anoLimpo ? `<div class="badge-ano-card">${anoLimpo}</div>` : ''}
        </div>
        <h3>${dadosTemp.serieTitulo || dadosTemp.titulo || 'Temporada'}</h3>
        <span class="ano-card">Temporada ${dadosTemp.temporada || ''}</span>
    `;
    li.onclick = () => analisarObra(dadosTemp.url, anoLimpo, dadosTemp.titulo || dadosTemp.serieTitulo, dadosTemp.poster, false);
    gridDestino.appendChild(li);
    salvarTemporadaCronos(dadosTemp);
}

function renderizarItemNoGrid(item, gridId) {
    // Catálogo normal não deve puxar carrossel, featured, sidebar ou widgets do site.
    if (item.closest && item.closest('#slider-movies, #slider-tvshows, .slider, .featured, .sidebar, aside, .widget')) return;
    const linkEl = item.querySelector('a');
    const imgEl = item.querySelector('img');
    const titleEl = item.querySelector('h3') || item.querySelector('.title');
    const anoEl = item.querySelector('.year') || item.querySelector('span');
    const qualidadeEl = item.querySelector('.quality');

    if (!linkEl || !titleEl) return;

    const urlString = linkEl.href;
    const gridDestino = document.getElementById(gridId);
    if (!gridDestino) return;
    if (gridDestino.querySelector(`[data-url="${CSS.escape(urlString)}"]`)) return;

    const isEpisodioHome = gridId === 'gridInicioEpisodios' || gridId === 'gridEpisodios' || urlString.includes('/episodios/') || urlString.includes('/episodio/');
    const isTemporada = !isEpisodioHome && (gridId === 'gridTemporadas' || urlString.includes('/temporadas/') || item.classList.contains('seasons'));
    if (isTemporada) {
        renderizarTemporadaCronos(item, gridId);
        return;
    }

    let isMovie = urlString.includes('/filmes/') || urlString.includes('/movies/') || item.classList.contains('movies');
    let isSerie = urlString.includes('/series/') || item.classList.contains('tvshows');
    const isCarouselCard = gridId === 'gridContinuarAssistindo' || gridId === 'gridHomeFavoritos';
    const tipoForcadoGrid = filtroTipoGridAtual[gridId] || '';

    if (tipoForcadoGrid === 'filme' && !isMovie) return;
    if (tipoForcadoGrid === 'serie' && !isSerie) return;
    if (tipoForcadoGrid === 'episodio' && !isEpisodioHome) return;
    if (tipoForcadoGrid === 'temporada' && !isTemporada) return;

    const tituloLimpoCard = limparTextoCard(titleEl.innerText);
    const letraAtivaGrid = filtroLetraGridAtual[gridId] || 'ALL';
    if (!tituloPassaFiltroLetraCronos(tituloLimpoCard, letraAtivaGrid)) return;

    let badgeHTML = '';
    if (isEpisodioHome) badgeHTML = `<div class="badge-tipo badge-serie">Episódio</div>`;
    else if (isMovie) badgeHTML = `<div class="badge-tipo badge-filme">Filme</div>`;
    else if (isSerie) badgeHTML = `<div class="badge-tipo badge-serie">Série</div>`;

    const qualityHTML = `<div class="badge-qualidade">${SITE_CODE}</div>`;
    const imgFinal = normalizarImagemCard(extrairImagemCapaItem(item) || imgEl?.src || '');
    const dataCard = anoEl ? anoEl.innerText.trim() : '';
    const anoLimpo = extrairAnoCard(dataCard);

    if (isEpisodioHome) {
        renderizarEpisodioCronos(item, gridId, urlString, tituloLimpoCard, imgFinal, dataCard, qualityHTML, badgeHTML);
        return;
    }

    const dadosBasicos = {
        url: urlString,
        titulo: tituloLimpoCard,
        img: imgFinal,
        poster: imgFinal,
        ano: anoLimpo || dataCard || '',
        qualidade: qualidadeEl ? qualidadeEl.innerText.trim() : '',
        isMovie,
        isSerie,
        tipo: isMovie ? 'Filme' : 'Série'
    };

    const li = document.createElement('li');
    li.className = 'card-item global-card card-skeleton';
    li.dataset.url = urlString;
    gridDestino.appendChild(li);
    prepararCardObraDBFirst(li, dadosBasicos, item, gridId);
}


// ==========================================
// SINCRONIZAÇÃO PROGRESSIVA DO CATÁLOGO
// ==========================================
let syncCronosAtiva = false;
let syncCronosAbort = false;
let syncCronosController = null;
let syncCronosModo = '';
let syncCronosOperacao = 'continuar';
let syncCronosRotasAtivas = {
    filmes: true,
    series: true,
    episodios: false,
    temporadas: false
};

function setStatusSyncCronos(msg) {
    const el = document.getElementById('statusSyncCronos');
    if (el) el.innerText = msg;
}

function addLogSyncCronos(msg) {
    const log = document.getElementById('logSyncCronos');
    if (!log) return;
    if (log.children.length === 1 && log.innerText.includes('Aguardando')) log.innerHTML = '';
    const linha = document.createElement('div');
    linha.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    log.prepend(linha);
    while (log.children.length > 80) log.removeChild(log.lastChild);
}

function setSyncOperacaoCronos(operacao) {
    if (syncCronosAtiva) return;
    syncCronosOperacao = operacao === 'reiniciar' ? 'reiniciar' : 'continuar';
    atualizarControlesSyncCronos();
}

function toggleRotaSyncCronos(rota) {
    if (syncCronosAtiva) return;
    if (!Object.prototype.hasOwnProperty.call(syncCronosRotasAtivas, rota)) return;
    syncCronosRotasAtivas[rota] = !syncCronosRotasAtivas[rota];
    atualizarControlesSyncCronos();
}

function atualizarControlesSyncCronos() {
    const btnContinuar = document.getElementById('btnOperacaoContinuarCronos');
    const btnReiniciar = document.getElementById('btnOperacaoReiniciarCronos');
    if (btnContinuar) btnContinuar.classList.toggle('ativo', syncCronosOperacao === 'continuar');
    if (btnReiniciar) btnReiniciar.classList.toggle('ativo', syncCronosOperacao === 'reiniciar');

    const mapa = {
        filmes: 'btnRotaFilmesCronos',
        series: 'btnRotaSeriesCronos',
        episodios: 'btnRotaEpisodiosCronos',
        temporadas: 'btnRotaTemporadasCronos'
    };
    Object.entries(mapa).forEach(([rota, id]) => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.toggle('ativo', !!syncCronosRotasAtivas[rota]);
    });
}

function montarRotasSelecionadasSyncCronos() {
    const todas = [
        { key: 'filmes', nome: 'Filmes', tipo: 'Filme', store: 'obras', base: `${CRONOS_BASE_URL}filmes/` },
        { key: 'series', nome: 'Séries', tipo: 'Série', store: 'obras', base: `${CRONOS_BASE_URL}series/` },
        { key: 'episodios', nome: 'Episódios', tipo: 'Episódio', store: 'episodios', base: `${CRONOS_BASE_URL}episodios/` },
        { key: 'temporadas', nome: 'Temporadas', tipo: 'Temporada', store: 'temporadas', base: `${CRONOS_BASE_URL}temporadas/` }
    ];
    return todas.filter(r => syncCronosRotasAtivas[r.key]);
}

async function salvarRegistroSyncCronosPorRota(rota, registro, modo = 'rapida') {
    const comum = {
        ...registro,
        tipo: rota.tipo,
        providerKey: CRONOS_PROVIDER_KEY,
        providerName: CRONOS_PROVIDER_NAME,
        syncModo: modo,
        updatedAt: new Date().toISOString()
    };
    if (rota.tipo === 'Episódio') {
        await salvarEpisodioCronos({
            ...comum,
            id: gerarIdCronos(comum.url),
            poster: escolherBackdropSeguroCronos(comum.poster || comum.img || comum.backdrop || ''),
            img: escolherBackdropSeguroCronos(comum.img || comum.poster || comum.backdrop || '')
        });
        return comum;
    }
    if (rota.tipo === 'Temporada') {
        await salvarTemporadaCronos({
            ...comum,
            id: gerarIdCronos(comum.url),
            poster: escolherPosterSeguroCronos(comum.poster, comum.img),
            img: escolherPosterSeguroCronos(comum.poster, comum.img)
        });
        return comum;
    }
    return await salvarObraCronos(comum);
}

function setBotaoSyncCronos(rodando, modo = syncCronosModo) {
    const btnCompleta = document.getElementById('btnSyncCompletaCronos');
    const btnRapida = document.getElementById('btnSyncRapidaCronos');

    if (btnCompleta) {
        const ativo = rodando && modo === 'completa';
        btnCompleta.classList.toggle('parar', ativo);
        btnCompleta.disabled = rodando && !ativo;
        btnCompleta.innerText = ativo ? 'Parar Sincronização Completa' : 'Iniciar Sincronização Completa';
    }

    if (btnRapida) {
        const ativo = rodando && modo === 'rapida';
        btnRapida.classList.toggle('parar', ativo);
        btnRapida.disabled = rodando && !ativo;
        btnRapida.innerText = ativo ? 'Parar Sincronização Rápida' : 'Iniciar Sincronização Rápida';
    }
    ['btnOperacaoContinuarCronos','btnOperacaoReiniciarCronos','btnRotaFilmesCronos','btnRotaSeriesCronos','btnRotaEpisodiosCronos','btnRotaTemporadasCronos'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = !!rodando;
    });
    atualizarControlesSyncCronos();
}

async function atualizarResumoSincronizacaoCronos() {
    const obras = await dbGetAll('obras').catch(() => []);
    const episodios = await dbGetAll('episodios').catch(() => []);
    const temporadas = await dbGetAll('temporadas').catch(() => []);
    const generos = await dbGetAll('generos').catch(() => []);
    const anos = await dbGetAll('anos').catch(() => []);

    const oficiais = new Set(GENEROS_CRONOS.map(g => g[1]));
    const achados = generos.filter(g => g && g.slug && !oficiais.has(g.slug));
    const filmes = obras.filter(o => o && (o.tipo === 'Filme' || o.isMovie)).length;
    const series = obras.filter(o => o && (o.tipo === 'Série' || o.isSerie)).length;

    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = String(val); };
    setText('syncQtdObras', obras.length);
    setText('syncQtdFilmes', filmes);
    setText('syncQtdSeries', series);
    setText('syncQtdEpisodios', episodios.length);
    setText('syncQtdTemporadas', temporadas.length);
    setText('syncQtdGeneros', achados.length);
    setText('syncQtdAnos', anos.length);
}


const CRONOS_SYNC_PROGRESS_ID = 'syncProgressCronos';

async function obterProgressoSyncCronos() {
    return await dbGet('configuracoes', CRONOS_SYNC_PROGRESS_ID).catch(() => null);
}

async function salvarProgressoSyncCronos(progresso = {}) {
    const item = {
        id: CRONOS_SYNC_PROGRESS_ID,
        providerKey: CRONOS_PROVIDER_KEY,
        providerName: CRONOS_PROVIDER_NAME,
        ...progresso,
        updatedAt: new Date().toISOString()
    };
    await dbPut('configuracoes', item).catch(() => {});
    await atualizarInfoProgressoSyncCronos();
}

async function limparProgressoSyncCronos(silencioso = false) {
    await dbDelete('configuracoes', CRONOS_SYNC_PROGRESS_ID).catch(() => {});
    await atualizarInfoProgressoSyncCronos();
    if (!silencioso) {
        setStatusSyncCronos('Ponto de continuação limpo. A próxima sincronização começa da página 1.');
        addLogSyncCronos('Ponto de continuação limpo pelo usuário.');
    }
}

async function reiniciarProgressoSyncCronos() {
    if (syncCronosAtiva) {
        alert('Pare a sincronização antes de reiniciar o ponto salvo.');
        return;
    }
    await limparProgressoSyncCronos(false);
}

async function atualizarInfoProgressoSyncCronos() {
    const el = document.getElementById('infoProgressoSyncCronos');
    if (!el) return;
    const progresso = await obterProgressoSyncCronos();
    if (!progresso || progresso.status === 'concluido') {
        el.innerText = progresso && progresso.status === 'concluido'
            ? 'Última sincronização concluída.'
            : 'Sem ponto salvo.';
        return;
    }
    const modo = progresso.modo === 'rapida' ? 'rápida' : 'completa';
    const rota = progresso.rotaNome || 'Filmes';
    const pagina = progresso.nextPage || progresso.paginaAtual || 1;
    el.innerText = `Ponto salvo: ${modo} • ${rota} • página ${pagina}`;
}

async function iniciarOuPararSyncCronos(modo = 'completa') {
    if (syncCronosAtiva) {
        syncCronosAbort = true;
        if (syncCronosController) syncCronosController.abort();
        setStatusSyncCronos('Parando sincronização...');
        addLogSyncCronos('Pedido de parada recebido.');
        return;
    }
    const continuar = syncCronosOperacao !== 'reiniciar';
    iniciarSincronizacaoCronos(modo, { continuar });
}

async function toggleSincronizacaoCronos() {
    return iniciarOuPararSyncCronos('completa');
}

async function limparDadosSincronizadosCronos() {
    if (!confirm('Limpar dados sincronizados? Favoritos e histórico serão preservados.')) return;
    const stores = ['obras', 'episodios', 'temporadas', 'generos', 'anos', 'syncLogs'];
    for (const store of stores) await dbClear(store).catch(() => {});
    await limparProgressoSyncCronos(true);
    setStatusSyncCronos('Dados sincronizados limpos. Favoritos e histórico foram mantidos.');
    addLogSyncCronos('Dados sincronizados limpos.');
    await montarCategorias();
    await atualizarResumoSincronizacaoCronos();
}

function extrairItensCatalogoParaSync(doc, tipo) {
    let seletor = '';
    if (tipo === 'Filme') {
        seletor = '#archive-content .item.movies, #archive-content article.movies, .items.normal .item.movies';
    } else if (tipo === 'Série') {
        seletor = '#archive-content .item.tvshows, #archive-content article.tvshows, .items.normal .item.tvshows';
    } else if (tipo === 'Episódio') {
        seletor = '#archive-content .item, #archive-content article.item, #dt-episodes .item, .episodes .item, article.episodes, article.episode';
    } else if (tipo === 'Temporada') {
        seletor = '#archive-content .item, #archive-content article.item, article.seasons, article.item.se, .item.seasons';
    }
    let itens = Array.from(doc.querySelectorAll(seletor));
    if (!itens.length) itens = Array.from(doc.querySelectorAll('#archive-content .item, #archive-content article.item'));
    return itens.filter(item => {
        if (!item || !item.querySelector) return false;
        if (item.closest('#slider-movies, #slider-tvshows, .slider, .featured, .sidebar, aside, .widget')) return false;
        const url = item.querySelector('a')?.href || '';
        if (tipo === 'Filme') return url.includes('/filmes/') || item.classList.contains('movies');
        if (tipo === 'Série') return url.includes('/series/') || item.classList.contains('tvshows');
        if (tipo === 'Episódio') return url.includes('/episodios/');
        if (tipo === 'Temporada') return url.includes('/temporadas/') || item.classList.contains('seasons');
        return false;
    });
}

async function extrairDetalhesParaSyncCronos(url, tipo, dadosBase = {}) {
    const res = await fetch(PROXY + encodeURIComponent(url), { signal: syncCronosController ? syncCronosController.signal : undefined });
    if (!res.ok) throw new Error('Falha ao abrir detalhe');
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    let titulo = doc.querySelector('h1[itemprop="name"]')?.innerText || doc.querySelector('h1')?.innerText || dadosBase.titulo || '';
    titulo = limparTextoCard(titulo.replace(/(Assistir |Online|Grátis|Completo|Dublado|Legendado)/gi, '').trim());

    const poster = escolherPosterSeguroCronos(extrairPosterClickDetalhe(doc, dadosBase.poster || dadosBase.img || ''), dadosBase.poster, dadosBase.img);
    const backdrop = escolherBackdropSeguroCronos(extrairBackdropClickDetalhe(doc, html), dadosBase.backdrop);
    const sinopse = extrairSinopseClick(doc);
    const generos = extrairGenerosClick(doc);
    const ano = extrairAnoCard(dadosBase.ano || doc.querySelector('.extra .date, [itemprop="dateCreated"]')?.innerText || '');
    const qualidade = extrairQualidadeClick(doc, html);
    const tituloOriginal = extrairTituloOriginalClick(doc);
    let playerUrl = tipo === 'Filme' ? extrairLinkLimpoDoPlayer(doc, html) : '';
    if (tipo === 'Filme' && !playerUrl) {
        const altPlayer = await tentarHtmlAlternativoComPlayerCronos(url);
        if (altPlayer && altPlayer.playerUrl) playerUrl = altPlayer.playerUrl;
    }

    return {
        ...dadosBase,
        url,
        titulo: titulo || dadosBase.titulo,
        tipo,
        isMovie: tipo === 'Filme',
        isSerie: tipo === 'Série',
        poster,
        img: poster,
        backdrop,
        sinopse,
        generos,
        ano: ano || dadosBase.ano || '',
        qualidade,
        tituloOriginal,
        playerUrl,
        enrichedAt: new Date().toISOString(),
        _doc: doc
    };
}

async function salvarEpisodiosDaSerieSyncCronos(doc, serie) {
    const seasonsValidas = Array.from(doc.querySelectorAll('#seasons .se-c')).filter(s => {
        const ul = s.querySelector('.se-a ul.episodios');
        return ul && ul.children.length > 0;
    });
    let totalEps = 0;

    for (let sIndex = 0; sIndex < seasonsValidas.length; sIndex++) {
        const season = seasonsValidas[sIndex];
        const temporadaNum = String(sIndex + 1);
        const temporadaId = `${gerarIdCronos(serie.url)}::T${temporadaNum}`;
        await salvarTemporadaCronos({
            id: temporadaId,
            url: `${serie.url}#temporada-${temporadaNum}`,
            serieUrl: serie.url,
            nomeSerie: serie.titulo,
            titulo: `${serie.titulo} - Temporada ${temporadaNum}`,
            temporada: temporadaNum,
            ano: serie.ano || '',
            poster: serie.poster || serie.img || '',
            img: serie.poster || serie.img || '',
            providerKey: CRONOS_PROVIDER_KEY,
            providerName: CRONOS_PROVIDER_NAME
        });

        const eps = Array.from(season.querySelectorAll('.se-a ul.episodios li'));
        for (let eIndex = 0; eIndex < eps.length; eIndex++) {
            const ep = eps[eIndex];
            const linkEl = ep.querySelector('.episodiotitle a, a');
            const epUrl = linkEl?.href || '';
            if (!epUrl) continue;
            const epDate = ep.querySelector('.date')?.innerText?.trim() || serie.ano || '';
            let epTitulo = linkEl.innerText?.trim() || `Episódio ${String(eIndex + 1).padStart(2, '0')}`;
            if (epDate && epTitulo.includes(epDate)) epTitulo = epTitulo.replace(epDate, '').trim();
            epTitulo = epTitulo.replace(/^[0-9]+\s*-\s*/, '').trim() || `Episódio ${String(eIndex + 1).padStart(2, '0')}`;
            const imgEl = ep.querySelector('.imagen img, img');
            let epImg = imgEl ? (imgEl.getAttribute('data-src') || imgEl.getAttribute('data-lazy-src') || imgEl.getAttribute('src') || '') : '';
            if (epImg && epImg.startsWith('//')) epImg = 'https:' + epImg;
            if (epImg && epImg.startsWith('/')) epImg = CRONOS_BASE_URL.replace(/\/$/, '') + epImg;
            epImg = normalizarBackdropOriginal(epImg || serie.backdrop || serie.poster || '');

            await salvarEpisodioCronos({
                id: gerarIdCronos(epUrl),
                url: epUrl,
                serieUrl: serie.url,
                nomeSerie: serie.titulo,
                titulo: `${serie.titulo} - S${String(sIndex + 1).padStart(2, '0')}E${String(eIndex + 1).padStart(2, '0')} - ${epTitulo}`,
                temporada: temporadaNum,
                episodio: String(eIndex + 1),
                data: epDate,
                ano: extrairAnoCard(epDate || serie.ano || ''),
                img: epImg,
                poster: epImg,
                backdrop: serie.backdrop || '',
                tipo: 'Episódio',
                providerKey: CRONOS_PROVIDER_KEY,
                providerName: CRONOS_PROVIDER_NAME
            });
            totalEps++;
        }
    }
    return { temporadas: seasonsValidas.length, episodios: totalEps };
}

async function iniciarSincronizacaoCronos(modo = 'completa', opcoes = {}) {
    syncCronosAtiva = true;
    syncCronosAbort = false;
    syncCronosModo = modo === 'rapida' ? 'rapida' : 'completa';
    syncCronosController = new AbortController();
    setBotaoSyncCronos(true, syncCronosModo);
    const nomeModoSync = syncCronosModo === 'rapida' ? 'rápida' : 'completa';
    setStatusSyncCronos(`Sincronização ${nomeModoSync} iniciada. Preparando rotas selecionadas...`);
    addLogSyncCronos(`Sincronização ${nomeModoSync} iniciada.`);

    const rotas = montarRotasSelecionadasSyncCronos();
    if (!rotas.length) {
        syncCronosAtiva = false;
        syncCronosAbort = false;
        setBotaoSyncCronos(false, syncCronosModo);
        setStatusSyncCronos('Nenhuma rota selecionada. Ative Filmes, Séries, Episódios ou Temporadas antes de iniciar.');
        addLogSyncCronos('Sincronização cancelada: nenhuma rota selecionada.');
        return;
    }

    let totalSalvo = 0;
    let indiceInicial = 0;
    let paginaInicial = 1;
    try {
        await migrarLocalStorageParaIndexedDB();
        const progressoAnterior = opcoes.continuar !== false ? await obterProgressoSyncCronos() : null;
        if (progressoAnterior && progressoAnterior.status !== 'concluido' && progressoAnterior.modo === syncCronosModo) {
            indiceInicial = Number(progressoAnterior.routeIndex || 0);
            paginaInicial = Number(progressoAnterior.nextPage || progressoAnterior.paginaAtual || 1);
            if (!rotas[indiceInicial]) { indiceInicial = 0; paginaInicial = 1; }
            addLogSyncCronos(`Continuando do ponto salvo: ${progressoAnterior.rotaNome || rotas[indiceInicial]?.nome || 'rota'} página ${paginaInicial}.`);
            setStatusSyncCronos(`Continuando sincronização ${nomeModoSync}: ${progressoAnterior.rotaNome || rotas[indiceInicial]?.nome || 'rota'} página ${paginaInicial}.`);
        } else {
            await limparProgressoSyncCronos(true);
            addLogSyncCronos('Começando sincronização do início.');
        }

        for (let rIndex = indiceInicial; rIndex < rotas.length; rIndex++) {
            const rota = rotas[rIndex];
            let pagina = rIndex === indiceInicial ? paginaInicial : 1;
            let paginasProcessadas = 0;
            addLogSyncCronos(`Iniciando ${rota.nome} na página ${pagina}.`);

            while (!syncCronosAbort) {
                const urlPagina = rota.base + (pagina > 1 ? `page/${pagina}/` : '');
                await salvarProgressoSyncCronos({
                    status: 'em_andamento',
                    modo: syncCronosModo,
                    routeIndex: rIndex,
                    rotaNome: rota.nome,
                    paginaAtual: pagina,
                    nextPage: pagina,
                    totalProcessadoRodada: totalSalvo
                });
                setStatusSyncCronos(`${rota.nome} — página ${pagina}. Buscando itens...`);

                let html = '';
                try {
                    const res = await fetch(PROXY + encodeURIComponent(urlPagina), { signal: syncCronosController.signal });
                    if (!res.ok) throw new Error('Fim ou falha de página');
                    html = await res.text();
                } catch (e) {
                    if (syncCronosAbort) break;
                    addLogSyncCronos(`${rota.nome}: página ${pagina} não respondeu. Encerrando esta rota.`);
                    break;
                }

                const doc = new DOMParser().parseFromString(html, 'text/html');
                const itens = extrairItensCatalogoParaSync(doc, rota.tipo);
                if (!itens.length) {
                    addLogSyncCronos(`${rota.nome}: página ${pagina} sem itens. Rota finalizada.`);
                    break;
                }

                addLogSyncCronos(`${rota.nome}: página ${pagina} com ${itens.length} item(ns).`);
                let salvosNaPagina = 0;

                for (const item of itens) {
                    if (syncCronosAbort) break;
                    const dados = extrairDadosBasicosItem(item);
                    if (!dados || !dados.url) continue;
                    const dadosBase = {
                        ...dados,
                        tipo: rota.tipo,
                        isMovie: rota.tipo === 'Filme',
                        isSerie: rota.tipo === 'Série',
                        isEpisodio: rota.tipo === 'Episódio',
                        isTemporada: rota.tipo === 'Temporada',
                        poster: escolherPosterSeguroCronos(dados.poster, dados.img),
                        img: escolherPosterSeguroCronos(dados.poster, dados.img),
                        backdrop: escolherBackdropSeguroCronos(!posterBomCronos(dados.img) ? dados.img : '')
                    };

                    if (syncCronosModo === 'rapida') {
                        setStatusSyncCronos(`${rota.nome} — página ${pagina}. Salvando básico: ${dadosBase.titulo}`);
                        await salvarRegistroSyncCronosPorRota(rota, {
                            ...dadosBase,
                            enrichedAt: dadosBase.enrichedAt || ''
                        }, 'rapida');
                    } else {
                        setStatusSyncCronos(`${rota.nome} — página ${pagina}. Enriquecendo: ${dadosBase.titulo}`);
                        try {
                            if (rota.tipo === 'Filme' || rota.tipo === 'Série') {
                                const detalhes = await extrairDetalhesParaSyncCronos(dadosBase.url, rota.tipo, dadosBase);
                                const docDetalhe = detalhes._doc;
                                delete detalhes._doc;
                                const salvo = await salvarObraCronos(detalhes);
                                if (rota.tipo === 'Série' && docDetalhe && salvo) {
                                    const infoEps = await salvarEpisodiosDaSerieSyncCronos(docDetalhe, salvo);
                                    if (infoEps.episodios) addLogSyncCronos(`${salvo.titulo}: ${infoEps.temporadas} temporada(s), ${infoEps.episodios} episódio(s).`);
                                }
                            } else {
                                await salvarRegistroSyncCronosPorRota(rota, dadosBase, 'completa');
                            }
                        } catch (erroDetalhe) {
                            await salvarRegistroSyncCronosPorRota(rota, dadosBase, 'basico');
                            addLogSyncCronos(`${dadosBase.titulo}: salvo básico, detalhe falhou.`);
                        }
                    }

                    totalSalvo++;
                    salvosNaPagina++;
                    await atualizarResumoSincronizacaoCronos();
                    await esperar(syncCronosModo === 'rapida' ? 35 : 90);
                }

                paginasProcessadas++;
                await registrarSyncLog('catalogo', `${rota.nome} página ${pagina} sincronizada`, { rota: rota.nome, pagina, salvosNaPagina });
                await salvarProgressoSyncCronos({
                    status: 'em_andamento',
                    modo: syncCronosModo,
                    routeIndex: rIndex,
                    rotaNome: rota.nome,
                    paginaAtual: pagina,
                    nextPage: pagina + 1,
                    totalProcessadoRodada: totalSalvo
                });
                if (salvosNaPagina === 0) {
                    addLogSyncCronos(`${rota.nome}: nenhum item salvo na página ${pagina}. Encerrando.`);
                    break;
                }
                pagina++;
                await esperar(250);
            }

            addLogSyncCronos(`${rota.nome} finalizado. Páginas processadas: ${paginasProcessadas}.`);
            if (!syncCronosAbort && rIndex + 1 < rotas.length) {
                await salvarProgressoSyncCronos({
                    status: 'em_andamento',
                    modo: syncCronosModo,
                    routeIndex: rIndex + 1,
                    rotaNome: rotas[rIndex + 1].nome,
                    paginaAtual: 1,
                    nextPage: 1,
                    totalProcessadoRodada: totalSalvo
                });
            }
            if (syncCronosAbort) break;
        }

        if (syncCronosAbort) {
            setStatusSyncCronos(`Sincronização interrompida. Total processado nesta rodada: ${totalSalvo}.`);
            addLogSyncCronos('Sincronização interrompida pelo usuário.');
        } else {
            setStatusSyncCronos(`Site sincronizado. Total processado nesta rodada: ${totalSalvo}.`);
            addLogSyncCronos('Site todo sincronizado.');
            await salvarProgressoSyncCronos({
                status: 'concluido',
                modo: syncCronosModo,
                routeIndex: rotas.length,
                rotaNome: 'Concluído',
                paginaAtual: 0,
                nextPage: 1,
                totalProcessadoRodada: totalSalvo,
                completedAt: new Date().toISOString()
            });
            await registrarSyncLog('catalogo', 'Site todo sincronizado', { totalSalvo });
        }
    } catch (erro) {
        console.error('Erro na sincronização:', erro);
        setStatusSyncCronos('Erro durante a sincronização. Veja o console para detalhes.');
        addLogSyncCronos('Erro durante a sincronização.');
    } finally {
        syncCronosAtiva = false;
        syncCronosAbort = false;
        syncCronosController = null;
        syncCronosModo = '';
        setBotaoSyncCronos(false);
        await atualizarInfoProgressoSyncCronos();
        await atualizarResumoSincronizacaoCronos();
        await montarCategorias();
    }
}

// ==========================================
// INDEXEDDB CRONOS - BORAFLIX
// ==========================================
const CRONOS_DB_NAME = 'CronosDB_BoraFlix';
const CRONOS_DB_VERSION = 1;
const CRONOS_PROVIDER_KEY = SITE_CODE;
const CRONOS_PROVIDER_NAME = 'BoraFlix';
const CRONOS_BASE_URL = 'https://www.boraflix.click/';
const CRONOS_STORES = [
    'configuracoes',
    'favoritos',
    'historico',
    'obras',
    'episodios',
    'temporadas',
    'generos',
    'anos',
    'syncLogs'
];

let cronosDBPromise = null;
let cronosMigracaoExecutada = false;

function abrirCronosDB() {
    if (cronosDBPromise) return cronosDBPromise;

    cronosDBPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(CRONOS_DB_NAME, CRONOS_DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            CRONOS_STORES.forEach(nomeStore => {
                if (!db.objectStoreNames.contains(nomeStore)) {
                    const store = db.createObjectStore(nomeStore, { keyPath: 'id' });

                    if (nomeStore === 'favoritos') {
                        store.createIndex('providerKey', 'providerKey', { unique: false });
                        store.createIndex('url', 'url', { unique: false });
                        store.createIndex('createdAt', 'createdAt', { unique: false });
                        store.createIndex('updatedAt', 'updatedAt', { unique: false });
                    }

                    if (nomeStore === 'historico') {
                        store.createIndex('providerKey', 'providerKey', { unique: false });
                        store.createIndex('url', 'url', { unique: false });
                        store.createIndex('ultimoAcesso', 'ultimoAcesso', { unique: false });
                        store.createIndex('tipo', 'tipo', { unique: false });
                    }

                    if (nomeStore === 'obras') {
                        store.createIndex('providerKey', 'providerKey', { unique: false });
                        store.createIndex('url', 'url', { unique: true });
                        store.createIndex('tipo', 'tipo', { unique: false });
                        store.createIndex('ano', 'ano', { unique: false });
                        store.createIndex('titulo', 'titulo', { unique: false });
                    }

                    if (nomeStore === 'episodios') {
                        store.createIndex('providerKey', 'providerKey', { unique: false });
                        store.createIndex('url', 'url', { unique: true });
                        store.createIndex('serieUrl', 'serieUrl', { unique: false });
                        store.createIndex('temporada', 'temporada', { unique: false });
                        store.createIndex('episodio', 'episodio', { unique: false });
                    }

                    if (nomeStore === 'temporadas') {
                        store.createIndex('providerKey', 'providerKey', { unique: false });
                        store.createIndex('url', 'url', { unique: true });
                        store.createIndex('serieUrl', 'serieUrl', { unique: false });
                        store.createIndex('serieTitulo', 'serieTitulo', { unique: false });
                        store.createIndex('temporada', 'temporada', { unique: false });
                    }

                    if (nomeStore === 'generos') {
                        store.createIndex('slug', 'slug', { unique: true });
                        store.createIndex('nome', 'nome', { unique: false });
                    }

                    if (nomeStore === 'anos') {
                        store.createIndex('ano', 'ano', { unique: true });
                    }

                    if (nomeStore === 'syncLogs') {
                        store.createIndex('providerKey', 'providerKey', { unique: false });
                        store.createIndex('tipo', 'tipo', { unique: false });
                        store.createIndex('createdAt', 'createdAt', { unique: false });
                    }
                }
            });
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    return cronosDBPromise;
}

async function cronosStore(nomeStore, modo = 'readonly') {
    const db = await abrirCronosDB();
    return db.transaction(nomeStore, modo).objectStore(nomeStore);
}

function requestToPromise(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function dbPut(nomeStore, item) {
    const store = await cronosStore(nomeStore, 'readwrite');
    return requestToPromise(store.put(item));
}

async function dbGet(nomeStore, id) {
    const store = await cronosStore(nomeStore, 'readonly');
    return requestToPromise(store.get(id));
}

async function dbDelete(nomeStore, id) {
    const store = await cronosStore(nomeStore, 'readwrite');
    return requestToPromise(store.delete(id));
}

async function dbGetAll(nomeStore) {
    const store = await cronosStore(nomeStore, 'readonly');
    return requestToPromise(store.getAll());
}

async function dbClear(nomeStore) {
    const store = await cronosStore(nomeStore, 'readwrite');
    return requestToPromise(store.clear());
}

function providerPorUrl(url){
    const s = String(url || '');
    if (/primeflix\.mom/i.test(s)) return 'primeflix';
    if (/lisoflix\.net/i.test(s)) return 'l07';
    if (/superseries\.life/i.test(s)) return 'u06';
    if (/seriesonlineweb\.lol/i.test(s)) return 's05';
    if (/ebaflix\.com/i.test(s)) return 'e04';
    if (/megacine\.boats/i.test(s)) return 'm03';
    if (/boraflixtv\.com/i.test(s)) return 'p02';
    if (/boraflix\.click/i.test(s)) return 'b01';
    return window.__CRONOS_RENDER_PROVIDER_KEY || window.__CRONOS_LAST_PROVIDER_RENDERED || 'b01';
}

function providerInfoCronos(key){
    const providers = window.CRONOS_MULTI_PROVIDERS || {};
    const mapaFallback = {
        b01: { key: 'b01', sigla: 'BFCK', nome: 'Fonte BFCK', base: 'https://www.boraflix.click/' },
        p02: { key: 'p02', sigla: 'BFTV', nome: 'Fonte BFTV', base: 'https://www.boraflixtv.com/' },
        m03: { key: 'm03', sigla: 'MEGA', nome: 'Fonte MEGA', base: 'https://megacine.boats/' },
        e04: { key: 'e04', sigla: 'EBA', nome: 'Fonte EBA', base: 'https://www.ebaflix.com/' },
        s05: { key: 's05', sigla: 'SWEB', nome: 'Fonte SWEB', base: 'https://www.seriesonlineweb.lol/' },
        u06: { key: 'u06', sigla: 'SSUP', nome: 'Fonte SSUP', base: 'https://superseries.life/' },
        l07: { key: 'l07', sigla: 'LISO', nome: 'Fonte LISO', base: 'https://lisoflix.net/' },
        primeflix: { key: 'primeflix', sigla: 'PRIME', nome: 'Fonte PRIME', base: 'https://primeflix.mom/' }
    };
    return providers[key] || mapaFallback[key] || mapaFallback.b01;
}

function providerLabel(key){
    return providerInfoCronos(key).sigla || String(key || '').toUpperCase();
}

function normalizarUrlCanonicaMulti(url, providerKey = ''){
    let u = String(url || '').trim().replace(/&amp;/g, '&');
    if (!u) return '';
    try {
        const key = providerKey || providerPorUrl(u);
        const info = providerInfoCronos(key);
        u = new URL(u, info.base || CRONOS_BASE_URL || location.href).href;
    } catch(e) {}
    return u.replace(/[?#].*$/, '').replace(/\/+$/, '');
}

function gerarIdCronosMulti(url, providerKey = '') {
    const key = providerKey || providerPorUrl(url);
    const canon = normalizarUrlCanonicaMulti(url, key);
    return `${key}::${canon || (url || '')}`;
}

function siglaObraCronos(obra) {
    const key = obra?.providerKey || providerPorUrl(obra?.url || '');
    return obra?.providerSigla || providerLabel(key) || 'CRONOS';
}

function gerarIdCronos(url, providerKey = '') {
    return gerarIdCronosMulti(url, providerKey);
}

function tipoObraCronos(obra) {
    if (obra?.tipo) return obra.tipo;
    if (obra?.isMovie) return 'Filme';
    if (obra?.temporada || obra?.episodio || String(obra?.url || '').includes('/episodios/')) return 'Episódio';
    return 'Série';
}

function normalizarObraParaBanco(obra = {}) {
    const url = obra.url || '';
    const providerKey = obra.providerKey || providerPorUrl(url);
    const providerInfo = providerInfoCronos(providerKey);
    const urlCanonica = normalizarUrlCanonicaMulti(url, providerKey) || url;
    const agora = new Date().toISOString();
    const posterSeguro = escolherPosterSeguroCronos(obra.poster, obra.img);
    const backdropSeguro = escolherBackdropSeguroCronos(obra.backdrop, (!posterBomCronos(obra.img) ? obra.img : ''));
    return {
        id: gerarIdCronos(urlCanonica, providerKey),
        providerKey,
        providerName: providerInfo.nome || CRONOS_PROVIDER_NAME,
        providerSigla: obra.providerSigla || providerInfo.sigla || providerKey.toUpperCase(),
        baseUrl: providerInfo.base || CRONOS_BASE_URL,
        url: urlCanonica,
        titulo: obra.titulo || 'Sem título',
        ano: extrairAnoCard(obra.ano || '') || obra.ano || '',
        tipo: tipoObraCronos(obra),
        isMovie: !!obra.isMovie,
        img: posterSeguro,
        poster: posterSeguro,
        backdrop: backdropSeguro,
        sinopse: obra.sinopse || obra.overview || obra.descricao || '',
        generos: Array.isArray(obra.generos) ? obra.generos : [],
        temporada: obra.temporada || '',
        episodio: obra.episodio || '',
        playerUrl: obra.playerUrl || '',
        playerProvider: obra.playerProvider || '',
        playerPostId: obra.playerPostId || '',
        playerNume: obra.playerNume || '',
        posterManual: !!obra.posterManual,
        posterManualEditable: !!(obra.posterManualEditable || obra.posterManual),
        posterManualUpload: !!obra.posterManualUpload,
        posterManualFonte: obra.posterManualFonte || '',
        posterManualModo: obra.posterManualModo || '',
        createdAt: obra.createdAt || agora,
        updatedAt: agora,
        ultimoAcesso: obra.ultimoAcesso || agora
    };
}

function extrairDadosTemporadaItem(item) {
    const linkEl = item.querySelector('.season_m a, .poster a, h3 a, a');
    const imgEl = item.querySelector('.poster img, img');
    const numeroEl = item.querySelector('.season_m .b');
    const serieEl = item.querySelector('.season_m .c');
    const dataEl = item.querySelector('.data span');
    const tituloEl = item.querySelector('.data h3 a, h3 a');
    const url = linkEl?.href || '';
    const serieTitulo = limparTextoCard(serieEl?.innerText || '');
    const temporadaNumero = numeroEl?.innerText?.trim() || ((tituloEl?.innerText || '').match(/season\s*(\d+)/i)?.[1] || '');

    return {
        id: gerarIdCronos(url),
        providerKey: CRONOS_PROVIDER_KEY,
        providerName: CRONOS_PROVIDER_NAME,
        baseUrl: CRONOS_BASE_URL,
        url,
        serieUrl: '',
        serieTitulo,
        temporada: temporadaNumero,
        titulo: limparTextoCard(tituloEl?.innerText || `Temporada ${temporadaNumero}`),
        data: dataEl?.innerText?.trim() || '',
        poster: normalizarImagemCard(imgEl?.src || ''),
        img: normalizarImagemCard(imgEl?.src || ''),
        updatedAt: new Date().toISOString()
    };
}

async function salvarConfiguracaoInicialCronos() {
    await dbPut('configuracoes', {
        id: 'provider',
        providerKey: CRONOS_PROVIDER_KEY,
        providerName: CRONOS_PROVIDER_NAME,
        dbName: CRONOS_DB_NAME,
        baseUrl: CRONOS_BASE_URL,
        stores: CRONOS_STORES,
        updatedAt: new Date().toISOString()
    });
}

async function registrarSyncLog(tipo, mensagem, extra = {}) {
    const agora = new Date().toISOString();
    await dbPut('syncLogs', {
        id: `${CRONOS_PROVIDER_KEY}::${tipo}::${Date.now()}`,
        providerKey: CRONOS_PROVIDER_KEY,
        providerName: CRONOS_PROVIDER_NAME,
        tipo,
        mensagem,
        extra,
        createdAt: agora
    });
}

async function migrarLocalStorageParaIndexedDB() {
    if (cronosMigracaoExecutada) return;
    cronosMigracaoExecutada = true;
    await abrirCronosDB();
    await salvarConfiguracaoInicialCronos();

    try {
        const favsAntigos = JSON.parse(localStorage.getItem('cronos_boraflix_favs') || '[]');
        for (const obra of favsAntigos) {
            if (obra?.url) await dbPut('favoritos', normalizarObraParaBanco(obra));
        }

        const histAntigo = JSON.parse(localStorage.getItem('cronos_boraflix_history') || '[]');
        for (const obra of histAntigo) {
            if (obra?.url) await dbPut('historico', normalizarObraParaBanco(obra));
        }

        if (favsAntigos.length || histAntigo.length) {
            await registrarSyncLog('migracao', 'Migração do localStorage para IndexedDB concluída.', {
                favoritos: favsAntigos.length,
                historico: histAntigo.length
            });
        }
    } catch (e) {
        console.warn('Falha na migração do localStorage para IndexedDB:', e);
    }
}

async function isFavoritoCronos(url) {
    if (!url) return false;
    await migrarLocalStorageParaIndexedDB();
    return !!(await dbGet('favoritos', gerarIdCronos(url, providerPorUrl(url))));
}

function adicionarBotaoFavoritarHoverCronos(li, dados) {
    if (!li || !dados || !dados.url) return;
    if (li.querySelector('.btn-favoritar-card')) return;

    const btn = document.createElement('button');
    btn.className = 'btn-favoritar-card';
    btn.innerText = 'FAVORITAR';
    btn.onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await migrarLocalStorageParaIndexedDB();
        const providerKey = dados.providerKey || li.dataset.providerKey || li.dataset.provider || providerPorUrl(dados.url);
        const id = gerarIdCronos(dados.url, providerKey);
        const existente = await dbGet('favoritos', id);
        if (existente) {
            await dbDelete('favoritos', id);
            btn.innerText = 'FAVORITAR';
            btn.classList.remove('ativo');
        } else {
            const posterAtual = li.dataset.poster || li.querySelector('.card-media img')?.src || dados.poster || dados.img || '';
            await dbPut('favoritos', normalizarObraParaBanco({ ...dados, providerKey, providerSigla: providerLabel(providerKey), img: posterAtual, poster: posterAtual }));
            btn.innerText = 'SALVO';
            btn.classList.add('ativo');
        }
        renderizarResumoHomeLocal();
    };
    li.appendChild(btn);

    isFavoritoCronos(dados.url).then(isFav => {
        if (isFav) {
            btn.innerText = 'SALVO';
            btn.classList.add('ativo');
        }
    });
}

function adicionarBotaoRemoverHoverCronos(li, storeName, url) {
    if (!li || !storeName || !url) return;
    if (li.querySelector('.btn-remover-card')) return;
    const btn = document.createElement('button');
    btn.className = 'btn-remover-card';
    btn.innerText = 'REMOVER';
    btn.onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await migrarLocalStorageParaIndexedDB();
        const providerKey = li.dataset.providerKey || li.dataset.provider || providerPorUrl(url);
        await dbDelete(storeName, gerarIdCronos(url, providerKey));
        li.remove();
        renderizarResumoHomeLocal();
        if (storeName === 'favoritos') {
            const status = document.getElementById('statusFavoritos');
            const grid = document.getElementById('gridFavoritos');
            if (status && grid && !grid.children.length) status.style.display = 'block';
        }
        if (storeName === 'historico') {
            const status = document.getElementById('statusHistorico');
            const grid = document.getElementById('gridHistorico');
            if (status && grid && !grid.children.length) status.style.display = 'block';
        }
    };
    li.appendChild(btn);
}

async function limparFavoritosHome() {
    if(!confirm('Limpar todos os favoritos?')) return;
    await migrarLocalStorageParaIndexedDB();
    await dbClear('favoritos');
    await registrarSyncLog('limpeza', 'Favoritos limpos pelo usuário.');
    const gridFav = document.getElementById('gridFavoritos');
    const statusFav = document.getElementById('statusFavoritos');
    if (gridFav) gridFav.innerHTML = '';
    if (statusFav) statusFav.style.display = 'block';
    renderizarResumoHomeLocal();
}

async function getFavoritos() {
    await migrarLocalStorageParaIndexedDB();
    const favs = await dbGetAll('favoritos');
    return favs.sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
}

async function toggleFavorito() {
    if (!obraSendoVista || !obraSendoVista.url) return;
    await migrarLocalStorageParaIndexedDB();

    const providerKey = obraSendoVista.providerKey || providerPorUrl(obraSendoVista.url);
    obraSendoVista.providerKey = providerKey;
    obraSendoVista.providerSigla = obraSendoVista.providerSigla || providerLabel(providerKey);
    const id = gerarIdCronos(obraSendoVista.url, providerKey);
    const existente = await dbGet('favoritos', id);
    const btn = document.getElementById('btnFavoritar');

    if (existente) {
        await dbDelete('favoritos', id);
        if (btn) { btn.innerText = '⭐ Favoritar'; btn.classList.remove('ativo'); }
    } else {
        await dbPut('favoritos', normalizarObraParaBanco(obraSendoVista));
        if (btn) { btn.innerText = '🌟 Remover Favorito'; btn.classList.add('ativo'); }
    }

    renderizarResumoHomeLocal();
}

async function checarBotaoFavorito(urlVerificacao) {
    await migrarLocalStorageParaIndexedDB();
    const btn = document.getElementById('btnFavoritar');
    if (!btn) return;
    const isFav = !!(await dbGet('favoritos', gerarIdCronos(urlVerificacao, providerPorUrl(urlVerificacao))));

    if (isFav) { btn.innerText = '🌟 Remover Favorito'; btn.classList.add('ativo'); }
    else { btn.innerText = '⭐ Favoritar'; btn.classList.remove('ativo'); }
}

async function carregarFavoritos(btnElement) {
    ativarTela('telaFavoritos', btnElement);
    telaAnterior = 'telaFavoritos';

    const gridFav = document.getElementById('gridFavoritos');
    const statusFav = document.getElementById('statusFavoritos');
    if(!gridFav || !statusFav) return;
    gridFav.innerHTML = '';

    let favs = await getFavoritos();

    if(favs.length === 0) {
        statusFav.style.display = 'block';
    } else {
        statusFav.style.display = 'none';
        favs.forEach(obra => {
            let badgeHTML = obra.isMovie || obra.tipo === 'Filme' ? `<div class="badge-tipo badge-filme">Filme</div>` : `<div class="badge-tipo badge-serie">Série</div>`;
            const li = document.createElement('li');
            li.className = 'card-item global-card';
            const anoLimpo = extrairAnoCard(obra.ano || '');
            const posterFav = escolherPosterSeguroCronos(obra.poster, obra.img) || placeholderCronosPoster();
            li.dataset.poster = posterFav;
            li.dataset.url = obra.url || '';
            li.dataset.provider = obra.providerKey || providerPorUrl(obra.url);
            li.dataset.providerKey = li.dataset.provider;
            li.dataset.providerSigla = siglaObraCronos(obra);
            li.innerHTML = `
                <div class="card-media">
                    ${badgeHTML}
                    <div class="badge-qualidade">${siglaObraCronos(obra)}</div>
                    ${anoLimpo ? `<div class="badge-ano-card">${anoLimpo}</div>` : ''}
                    <img src="${posterFav}" alt="Poster">
                </div>
                <h3>${obra.titulo}</h3>
            `;
            li.onclick = () => analisarObra(obra.url, obra.ano, obra.titulo, posterFav, obra.isMovie || obra.tipo === 'Filme');
            adicionarBotaoRemoverHoverCronos(li, 'favoritos', obra.url);
            gridFav.appendChild(li);
        });
    }
}


// ==========================================
// HOME NOVA: CONTINUAR, MINHA LISTA E STATUS LOCAL
// ==========================================
async function getHistoricoHome() {
    await migrarLocalStorageParaIndexedDB();
    const hist = await dbGetAll('historico');
    return hist.sort((a, b) => String(b.ultimoAcesso || '').localeCompare(String(a.ultimoAcesso || '')));
}

async function salvarHistoricoHome(item) {
    if(!item || !item.url || !item.titulo || item.titulo === 'undefined') return;
    await migrarLocalStorageParaIndexedDB();
    const providerKey = item.providerKey || providerPorUrl(item.url);
    item.providerKey = providerKey;
    item.providerSigla = item.providerSigla || providerLabel(providerKey);
    const obraSalva = await dbGet('obras', gerarIdCronos(item.url, providerKey));
    const posterSeguro = escolherPosterSeguroCronos(item.poster, item.img, obraSalva?.poster, obraSalva?.img);
    const backdropSeguro = escolherBackdropSeguroCronos(item.backdrop, obraSalva?.backdrop, (!posterBomCronos(item.img) ? item.img : ''));
    const registro = normalizarObraParaBanco({
        ...(obraSalva || {}),
        ...item,
        poster: posterSeguro,
        img: posterSeguro,
        backdrop: backdropSeguro,
        ultimoAcesso: new Date().toISOString()
    });
    await dbPut('historico', registro);
    renderizarResumoHomeLocal();
}

async function limparHistoricoHome() {
    if(!confirm('Limpar todo o histórico?')) return;
    await migrarLocalStorageParaIndexedDB();
    await dbClear('historico');
    await registrarSyncLog('limpeza', 'Histórico limpo pelo usuário.');

    const gridHist = document.getElementById('gridHistorico');
    const statusHist = document.getElementById('statusHistorico');
    if (gridHist) gridHist.innerHTML = '';
    if (statusHist) statusHist.style.display = 'block';

    renderizarResumoHomeLocal();
}

async function carregarHistorico(btnElement) {
    ativarTela('telaHistorico', btnElement);
    telaAnterior = 'telaHistorico';

    const gridHist = document.getElementById('gridHistorico');
    const statusHist = document.getElementById('statusHistorico');
    if(!gridHist || !statusHist) return;
    gridHist.innerHTML = '';

    const hist = await getHistoricoHome();
    if(!hist.length) {
        statusHist.style.display = 'block';
        return;
    }

    statusHist.style.display = 'none';
    hist.forEach(obra => {
        const li = document.createElement('li');
        li.className = 'card-item global-card';
        const badgeHTML = obra.isMovie || obra.tipo === 'Filme' ? `<div class="badge-tipo badge-filme">Filme</div>` : `<div class="badge-tipo badge-serie">Série</div>`;
        const anoLimpo = extrairAnoCard(obra.ano || '');
        const posterHist = escolherPosterSeguroCronos(obra.poster, obra.img) || placeholderCronosPoster();
        li.dataset.poster = posterHist;
        li.dataset.url = obra.url || '';
        li.dataset.provider = obra.providerKey || providerPorUrl(obra.url);
        li.dataset.providerKey = li.dataset.provider;
        li.dataset.providerSigla = siglaObraCronos(obra);
        li.innerHTML = `
            <div class="card-media">
                ${badgeHTML}
                <div class="badge-qualidade">${siglaObraCronos(obra)}</div>
                <img src="${posterHist}" alt="Poster">
${anoLimpo ? `<div class="badge-ano-card">${anoLimpo}</div>` : ''}
            </div>
            <h3>${obra.titulo || 'Sem título'}</h3>
        `;
        li.onclick = () => analisarObra(obra.url, anoLimpo || obra.ano || '', obra.titulo || '', posterHist, obra.isMovie || obra.tipo === 'Filme');
        adicionarBotaoRemoverHoverCronos(li, 'historico', obra.url);
        gridHist.appendChild(li);
    });
}

function renderizarObraSalvaHome(obra, gridId) {
    const grid = document.getElementById(gridId);
    if(!grid || !obra || !obra.url) return;
    const li = document.createElement('li');
    li.className = 'card-item carousel-card';
    const badgeHTML = obra.isMovie || obra.tipo === 'Filme' ? `<div class="badge-tipo badge-filme">Filme</div>` : `<div class="badge-tipo badge-serie">Série</div>`;
    const anoLimpo = extrairAnoCard(obra.ano || '');
    const posterHome = escolherPosterSeguroCronos(obra.poster, obra.img) || placeholderCronosPoster();
    li.dataset.poster = posterHome;
    li.dataset.url = obra.url || '';
    li.dataset.provider = obra.providerKey || providerPorUrl(obra.url);
    li.dataset.providerKey = li.dataset.provider;
    li.dataset.providerSigla = siglaObraCronos(obra);
    li.innerHTML = `
        <div class="card-media">
            ${badgeHTML}
            <div class="badge-qualidade">${siglaObraCronos(obra)}</div>
            ${anoLimpo ? `<div class="badge-ano-card">${anoLimpo}</div>` : ''}
            <img src="${posterHome}" alt="Poster">
        </div>
        <h3>${obra.titulo || 'Sem título'}</h3>
    `;
    li.onclick = () => analisarObra(obra.url, anoLimpo || obra.ano || '', obra.titulo || '', posterHome, obra.isMovie || obra.tipo === 'Filme');
    grid.appendChild(li);
    if (gridId !== 'gridHomeFavoritos') adicionarBotaoFavoritarHoverCronos(li, { ...obra, img: posterHome, poster: posterHome });
}

async function renderizarResumoHomeLocal() {
    await migrarLocalStorageParaIndexedDB();
    const favs = await getFavoritos();
    const hist = await getHistoricoHome();

    const gridFav = document.getElementById('gridHomeFavoritos');
    const gridHist = document.getElementById('gridContinuarAssistindo');
    if(gridFav) gridFav.innerHTML = '';
    if(gridHist) gridHist.innerHTML = '';

    favs.slice(0, 8).forEach(obra => renderizarObraSalvaHome(obra, 'gridHomeFavoritos'));
    hist.slice(0, 8).forEach(obra => renderizarObraSalvaHome(obra, 'gridContinuarAssistindo'));

    const emptyFav = document.getElementById('emptyMinhaLista');
    const emptyHist = document.getElementById('emptyContinuar');
    if(emptyFav) emptyFav.style.display = favs.length ? 'none' : 'block';
    if(emptyHist) emptyHist.style.display = hist.length ? 'none' : 'block';

    const statFavs = document.getElementById('statFavsHome');
    const statHist = document.getElementById('statHistHome');
    const statFilmes = document.getElementById('statFilmesHome');
    const statSeries = document.getElementById('statSeriesHome');
    if(statFavs) statFavs.innerText = favs.length;
    if(statHist) statHist.innerText = hist.length;
    if(statFilmes) statFilmes.innerText = document.getElementById('gridInicioFilmes') ? document.getElementById('gridInicioFilmes').children.length : 0;
    if(statSeries) statSeries.innerText = document.getElementById('gridInicioSeries') ? document.getElementById('gridInicioSeries').children.length : 0;

    const statusLocal = document.getElementById('homeStatusLocal');
    if(statusLocal) {
        const ultima = hist[0] && hist[0].ultimoAcesso ? new Date(hist[0].ultimoAcesso).toLocaleString('pt-BR') : 'sem reprodução ainda';
        statusLocal.innerHTML = `IndexedDB <b>${CRONOS_DB_NAME}</b>: <b>${favs.length}</b> favoritos · <b>${hist.length}</b> itens no histórico · último acesso: <b>${ultima}</b>`;
    }
}

function tentarRenderizarEpisodiosRecentes(doc) {
    const grid = document.getElementById('gridInicioEpisodios');
    const head = document.getElementById('headEpisodiosRecentes');
    if(!grid || !head) return;
    grid.innerHTML = '';
    const candidatos = doc.querySelectorAll('#dt-episodes .item, .episodes .item, .episodios .item, article.episodes, article.episode');
    let count = 0;
    candidatos.forEach(item => {
        if(count >= 12) return;
        const before = grid.children.length;
        renderizarItemNoGrid(item, 'gridInicioEpisodios');
        if(grid.children.length > before) count++;
    });
    head.style.display = count > 0 ? 'flex' : 'none';
}


function extrairTextoCampoCustomDetalhe(doc, nomes = []) {
    const termos = nomes.map(n => String(n || '').toUpperCase());
    const blocos = Array.from(doc.querySelectorAll('.custom_fields, .custom_fields span, .metadata span, .extra span, .dt_mainmeta span, .info span, .sbox .custom_fields'));
    for (const el of blocos) {
        const texto = (el.innerText || '').replace(/\s+/g, ' ').trim();
        if (!texto) continue;
        const upper = texto.toUpperCase();
        if (!termos.some(t => upper.includes(t))) continue;
        const valorEl = el.querySelector?.('.valor, .value, b + span');
        let valor = valorEl ? valorEl.innerText.trim() : texto;
        valor = valor.replace(/^(Título original|Original title|Duração|Runtime|Data de lançamento|Primeira data de exibição|First air date|Lançamento|Exibição)\s*:?\s*/i, '').trim();
        if (valor) return valor;
    }
    return '';
}
function extrairTituloOriginalDetalheCronos(doc) { return extrairTextoCampoCustomDetalhe(doc, ['TÍTULO ORIGINAL', 'ORIGINAL TITLE', 'ORIGINAL']) || ''; }
function extrairNotaImdbDetalheCronos(doc) {
    const candidatos = [doc.querySelector('.dt_rating_vgs')?.innerText, doc.querySelector('.rating')?.innerText, doc.querySelector('.imdb')?.innerText, doc.querySelector('[itemprop="ratingValue"]')?.innerText].filter(Boolean);
    for (let c of candidatos) { let m = String(c).match(/(\d+(?:[.,]\d+)?)/); if (m) return m[1].replace(',', '.'); }
    return '?';
}
function extrairQualidadeDetalheCronos(doc, html = '') {
    const texto = ((doc.querySelector('title')?.innerText || '') + ' ' + (doc.querySelector('meta[name="description"]')?.getAttribute('content') || '') + ' ' + (doc.body?.innerText?.slice(0, 5000) || '') + ' ' + html.slice(0, 5000)).toUpperCase();
    const qNode = doc.querySelector('.quality, .Qlty, .calidad, .resolucao, .quality-tag');
    if (qNode && qNode.innerText.trim()) return qNode.innerText.trim().toUpperCase();
    if (texto.includes('4K') || texto.includes('2160P')) return '4K';
    if (texto.includes('1080P') || texto.includes('FHD') || texto.includes(' FULL HD') || texto.includes(' HD')) return 'HD';
    if (texto.includes('720P')) return 'HD';
    if (texto.includes('480P') || texto.includes(' SD')) return 'SD';
    return 'HD';
}
function extrairDuracaoDetalheCronos(doc) {
    const node = doc.querySelector('.runtime, .metadata span.runtime, .Info span.Time, [itemprop="duration"]');
    if (node && node.innerText.trim()) return node.innerText.trim();
    return extrairTextoCampoCustomDetalhe(doc, ['DURAÇÃO', 'RUNTIME', 'TIME']);
}
function extrairDataDetalheCronos(doc, anoFallback = '') {
    const node = doc.querySelector('.extra .date, [itemprop="dateCreated"], [itemprop="datePublished"], .date');
    let val = node?.innerText?.trim() || node?.getAttribute?.('content') || '';
    if (!val) val = extrairTextoCampoCustomDetalhe(doc, ['DATA DE LANÇAMENTO', 'PRIMEIRA DATA DE EXIBIÇÃO', 'FIRST AIR DATE', 'LANÇAMENTO', 'EXIBIÇÃO']);
    return val || anoFallback || '';
}
function detectarAudiosDetalheCronos(doc, html = '') {
    const texto = ((doc.querySelector('title')?.innerText || '') + ' ' + (doc.querySelector('meta[name="description"]')?.getAttribute('content') || '') + ' ' + (doc.body?.innerText?.slice(0, 8000) || '') + ' ' + html.slice(0, 8000)).toUpperCase();
    return { dublado: /DUBLAD[OA]|\bDUB\b/.test(texto), legendado: /LEGENDAD[OA]|\bLEG\b/.test(texto) };
}
function montarTagsGeneroDetalheCronos(generos = []) { return (generos || []).map(g => `<span class="tag-meta tag-genero">${g.nome || g}</span>`).join(''); }
function extrairLinkPlayerDetalheCronos(doc) {
    const iframes = doc.querySelectorAll('.source-box iframe, iframe');
    let linkPlayer = null;
    iframes.forEach((iframe) => {
        let src = iframe.getAttribute('src');
        if (!src || src.includes('/ads/') || src.includes('22bet')) return;
        if (src.startsWith('//')) src = 'https:' + src;
        if (src.includes('superflixapi') || src.includes('superembeds') || src.includes('embed')) linkPlayer = src;
        else if (!linkPlayer) linkPlayer = src;
    });
    return linkPlayer;
}
function ajustarQuebraTituloDetalheCronos() {
    const el = document.getElementById('detalheTitulo');
    if (!el) return;
    const txt = el.innerText || '';
    el.style.fontSize = '';
    if (txt.length > 34) el.style.fontSize = '28px';
    if (txt.length > 54) el.style.fontSize = '24px';
}


// ==========================================
// PÓS-CLIQUE: DETALHES BORAFLIX — PADRÃO CRONOS CLICK
// ==========================================
function maximizarQualidadeTMDB(url, tamanhoAlvo = 'w500') {
    if (!url) return '';
    let limpa = String(url).trim();
    if (!limpa) return '';
    if (limpa.startsWith('//')) limpa = 'https:' + limpa;
    limpa = limpa.split(' ')[0];
    return limpa.replace(/\/(w92|w154|w185|w300|w342|w500|w780|w1280|original)\//i, '/' + tamanhoAlvo + '/');
}

function limparUrlMidiaCronos(url = '') {
    let u = String(url || '').trim();
    if (!u) return '';
    if (u.startsWith('//')) u = 'https:' + u;
    u = u.split(/\s+/)[0].replace(/["'<>]/g, '').trim();
    return u;
}

function removerSufixoWpImagemCronos(url = '') {
    const u = limparUrlMidiaCronos(url);
    // Ex.: imagem-200x300.jpg -> imagem.jpg para pegar a versão maior do WordPress.
    return u.replace(/-\d{2,4}x\d{2,4}(\.(?:jpg|jpeg|png|webp))(\?.*)?$/i, '$1$2');
}

function coletarOgImagesCronos(doc) {
    const lista = [];
    doc.querySelectorAll('meta[property="og:image"]').forEach(meta => {
        const url = limparUrlMidiaCronos(meta.getAttribute('content') || '');
        if (!url) return;
        let width = 0;
        let height = 0;
        let el = meta.nextElementSibling;
        // No WordPress, og:image:width/height normalmente vêm logo após o og:image.
        for (let i = 0; el && i < 5; i++, el = el.nextElementSibling) {
            const prop = (el.getAttribute('property') || '').toLowerCase();
            if (prop === 'og:image') break;
            if (prop === 'og:image:width') width = parseInt(el.getAttribute('content') || '0', 10) || 0;
            if (prop === 'og:image:height') height = parseInt(el.getAttribute('content') || '0', 10) || 0;
        }
        lista.push({ url, width, height });
    });
    return lista;
}

function extrairThumbnailJsonLdCronos(doc) {
    for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) {
        try {
            const json = JSON.parse(s.textContent || '{}');
            const pilha = Array.isArray(json?.['@graph']) ? json['@graph'] : [json];
            for (const obj of pilha) {
                const thumb = obj?.thumbnailUrl || obj?.image?.url || obj?.image?.contentUrl || obj?.primaryImageOfPage?.url;
                if (typeof thumb === 'string' && thumb) return limparUrlMidiaCronos(thumb);
            }
        } catch(e) {}
    }
    return '';
}

function urlPareceHorizontalCronos(url = '') {
    const u = String(url || '').toLowerCase();
    return /\/w780\/|\/w1280\/|\/original\//.test(u) || /backdrop|fanart|still/.test(u);
}


function extrairPosterClickDetalhe(doc, fallback = '') {
    const candidatos = [];
    const add = (url) => { url = removerSufixoWpImagemCronos(url); if (url) candidatos.push(url); };

    doc.querySelectorAll('.poster img, .sheader .poster img, #thumbHis, img[itemprop="image"]').forEach(img => {
        add(img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('src') || '');
    });

    // Se o WordPress declarar og:image vertical 500x749, ele é poster real.
    coletarOgImagesCronos(doc).forEach(o => {
        if (o.width && o.height && o.height > o.width) add(o.url);
    });

    add(extrairThumbnailJsonLdCronos(doc));
    add(fallback);

    const bom = candidatos
        .map(u => maximizarQualidadeTMDB(u, 'w500'))
        .filter(u => u && !imagemEhPlaceholderCronos(u) && !urlPareceHorizontalCronos(u));

    return bom[0] || '';
}

function extrairBackdropClickDetalhe(doc, html = '') {
    const candidatos = [];
    const add = (url) => { url = limparUrlMidiaCronos(url); if (url) candidatos.push(url); };

    // Regra nova: usar a primeira imagem horizontal real da galeria, não a última aleatória.
    doc.querySelectorAll('#dt_galery a[href], #dt_galery .g-item a[href], .galeria a[href], .gallery a[href]').forEach(a => add(a.getAttribute('href')));
    doc.querySelectorAll('#dt_galery img, .galeria img, .gallery img').forEach(img => add(img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('src')));

    // Backdrop declarado em background-image também vale.
    const bgMatch = html.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/i);
    if (bgMatch && bgMatch[1]) add(bgMatch[1]);

    // Se não encontrou galeria/background, usa a primeira og:image horizontal/TMDB.
    coletarOgImagesCronos(doc).forEach(o => {
        if ((o.width && o.height && o.width >= o.height) || urlPareceHorizontalCronos(o.url)) add(o.url);
    });

    const limpos = candidatos
        .map(u => maximizarQualidadeTMDB(u, 'original'))
        .filter(u => u && !imagemEhPlaceholderCronos(u));

    return limpos[0] || '';
}

function extrairCustomClick(doc, nomes = []) {
    const termos = nomes.map(n => String(n || '').toUpperCase());
    const blocosCustom = Array.from(doc.querySelectorAll('.custom_fields'));
    for (const el of blocosCustom) {
        const txt = (el.innerText || '').replace(/\s+/g, ' ').trim();
        if (!txt) continue;
        const up = txt.toUpperCase();
        if (!termos.some(t => up.includes(t))) continue;
        const valor = el.querySelector('.valor')?.innerText?.trim();
        if (valor) return valor;
        return txt.replace(/^(Título original|Original title|Duração|Runtime|Data de lançamento|Primeira data de exibição|First air date|Lançamento|Exibição)\s*:?\s*/i, '').trim();
    }
    return '';
}

function extrairTituloOriginalClick(doc) {
    return extrairCustomClick(doc, ['TÍTULO ORIGINAL', 'ORIGINAL TITLE']);
}

function extrairSinopseClick(doc) {
    const sinopseNode = doc.querySelector('.sinopse-texto') || doc.querySelector('[itemprop="description"]') || doc.querySelector('.wp-content');
    if (!sinopseNode) return 'Sinopse não disponível nos registros.';
    const clone = sinopseNode.cloneNode(true);
    clone.querySelectorAll('iframe, ul, .wp-tags, a, script, style').forEach(el => el.remove());
    return clone.innerText.trim() || 'Sinopse não disponível nos registros.';
}

function extrairGenerosClick(doc) {
    const vistos = new Set();
    const generos = [];
    doc.querySelectorAll('.sgeneros a').forEach(g => {
        const nome = (g.innerText || '').trim();
        if (!nome) return;
        const slug = slugCronos(nome);
        if (vistos.has(slug)) return;
        vistos.add(slug);
        generos.push({ nome, slug, url: g.href || `${CRONOS_BASE_URL}categoria/${slug}/` });
    });
    return generos;
}

function extrairQualidadeClick(doc, html = '') {
    const texto = ((doc.querySelector('title')?.innerText || '') + ' ' + (doc.querySelector("meta[name='description']")?.getAttribute('content') || '') + ' ' + html.slice(0, 8000)).toUpperCase();
    let qualidade = 'HD';
    if (texto.includes('4K')) qualidade = '4K';
    else if (texto.includes('SD ') || texto.includes(' 480P')) qualidade = 'SD';
    else if (doc.querySelector('.quality, .Qlty')) qualidade = doc.querySelector('.quality, .Qlty').innerText.trim();
    return qualidade || 'HD';
}

function extrairDuracaoClick(doc) {
    const runtimeNode = doc.querySelector('.runtime, .metadata span.runtime, .Info span.Time');
    if (runtimeNode && runtimeNode.innerText.trim()) return runtimeNode.innerText.trim();
    return extrairCustomClick(doc, ['DURAÇÃO', 'RUNTIME']);
}

function extrairDataClick(doc, anoFallback = '') {
    const dateElement = doc.querySelector('.extra .date, [itemprop="dateCreated"]');
    const customDate = extrairCustomClick(doc, ['LANÇAMENTO', 'EXIBIÇÃO', 'AIR DATE', 'DATA DE LANÇAMENTO', 'PRIMEIRA DATA DE EXIBIÇÃO']);
    return dateElement?.innerText?.trim() || dateElement?.getAttribute?.('content') || customDate || anoFallback || '';
}


function gerarUrlsAlternativasPlayerCronos(url = '') {
    const lista = [];
    const add = (u) => {
        if (!u) return;
        if (!lista.includes(u)) lista.push(u);
    };
    add(url);
    try {
        const u = new URL(url);
        const path = u.pathname + (u.search || '');
        const hosts = [
            'www.boraflix.click',
            'boraflix.click',
            'www.boraflixtv.com',
            'boraflixtv.com',
            'www.boraflix.com',
            'boraflix.com'
        ];
        hosts.forEach(host => add(`${u.protocol}//${host}${path}`));
    } catch(e) {}
    return lista;
}

async function tentarHtmlAlternativoComPlayerCronos(urlOriginal = '') {
    const urls = gerarUrlsAlternativasPlayerCronos(urlOriginal).filter(u => u && u !== urlOriginal);
    for (const urlTeste of urls) {
        try {
            const res = await fetch(PROXY + encodeURIComponent(urlTeste));
            if (!res.ok) continue;
            const html = await res.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const playerUrl = extrairLinkLimpoDoPlayer(doc, html);
            if (playerUrl) {
                return { urlUsada: urlTeste, html, doc, playerUrl };
            }
        } catch(e) {}
    }
    return null;
}

function extrairLinkLimpoDoPlayer(doc, html = '') {
    // SWEB corrigido: filmes podem vir pelo redirecionador suaap cpurl com o player real no parâmetro t.
    function extrairSuaapCpurlCronos(doc, html){
        const resolver = (href) => {
            try {
                href = String(href || '').trim().replace(/&amp;/g, '&').replace(/&#038;/g, '&');
                if (!href) return '';
                if (href.startsWith('//')) href = 'https:' + href;
                if (href.startsWith('/')) href = new URL(href, (window.obraSendoVista && window.obraSendoVista.baseUrl) || CRONOS_BASE_URL || location.href).href;
                const u = new URL(href);
                let t = u.searchParams.get('t') || '';
                t = String(t || '').trim().replace(/&amp;/g, '&').replace(/&#038;/g, '&');
                if (t.startsWith('//')) t = 'https:' + t;
                if (t.startsWith('/')) t = new URL(t, u.origin).href;
                return t || '';
            } catch(e) { return ''; }
        };
        try {
            const a = doc && doc.querySelector && doc.querySelector('a[href*="suaap.com/api/start/cpurl"], a[href*="api/start/cpurl"]');
            const direto = a ? resolver(a.getAttribute('href') || a.href || '') : '';
            if (direto) return direto;
        } catch(e) {}
        try {
            const texto = String(html || '');
            let m;
            const regs = [
                /href=["']([^"']*suaap\.com\/api\/start\/cpurl[^"']*)["']/ig,
                /href=["']([^"']*api\/start\/cpurl[^"']*)["']/ig,
                /(https?:\/\/[^"'<>\s]*suaap\.com\/api\/start\/cpurl[^"'<>\s]*)/ig
            ];
            for (const reg of regs) {
                while ((m = reg.exec(texto))) {
                    const achado = resolver(m[1]);
                    if (achado) return achado;
                }
            }
        } catch(e) {}
        return '';
    }
    const playerSuaapCronos = extrairSuaapCpurlCronos(doc, html);
    if (playerSuaapCronos) return playerSuaapCronos;
    const candidatos = [];
    const vistos = new Set();

    const limparSrcPlayer = (src) => {
        src = String(src || '').trim();
        if (!src) return '';
        src = src.replace(/&amp;/g, '&').replace(/&#038;/g, '&').replace(/\\/g, '');
        if (src.startsWith('//')) src = 'https:' + src;
        src = src.split(/\s+/)[0].replace(/["'<>]/g, '').trim();
        return src;
    };

    const addCandidato = (src, origem = '') => {
        src = limparSrcPlayer(src);
        if (!src || vistos.has(src)) return;
        vistos.add(src);
        const u = src.toLowerCase();
        if (u.includes('/ads/') || u.includes('22bet') || u.includes('doubleclick') || u.includes('adserver') || u.includes('facebook')) return;
        if (u.includes('youtube') || u.includes('youtu.be') || u.includes('youtube-nocookie')) {
            // Bloqueio fixo: YouTube quase sempre é trailer, não player do filme.
            // Não usar nem como fallback, para evitar abrir trailer no lugar do conteúdo.
            return;
        }
        let peso = 10;
        if (u.includes('superflixapi')) peso = 100;
        else if (u.includes('superembeds') || u.includes('superembed')) peso = 90;
        else if (u.includes('viewplayer') || u.includes('playerthree') || u.includes('trembed')) peso = 80;
        else if (u.includes('embed')) peso = 50;
        candidatos.push({ src, origem, peso });
    };

    const seletoresPrioritarios = [
        '#dooplay_player_content .source-box.on iframe',
        '#playcontainer .source-box.on iframe',
        '.dooplay_player .source-box.on iframe',
        '.source-box.on iframe',
        '#source-player-superflixapi_slug iframe',
        '#source-player-1 iframe',
        'iframe[src*="superflixapi"]',
        'iframe[src*="superembeds"]',
        'iframe[src*="superembed"]',
        'iframe[src*="viewplayer"]',
        'iframe[src*="playerthree"]',
        'iframe[src*="trembed"]',
        'iframe[src*="suaap"]',
        '#dooplay_player_content iframe',
        '#playcontainer iframe',
        '.dooplay_player iframe',
        '.source-box iframe',
        '.wp-content iframe',
        'iframe'
    ];

    if (doc && doc.querySelectorAll) {
        for (const sel of seletoresPrioritarios) {
            doc.querySelectorAll(sel).forEach(iframe => addCandidato(iframe.getAttribute('src') || '', sel));
        }
    }

    if (html) {
        const texto = String(html);
        let m;
        // Primeiro procura especificamente os blocos source-player, que é como o DooPlay entrega o player ativo.
        const regexSourceBox = /<div[^>]+id=["']source-player-[^"']+["'][^>]*>[\s\S]*?<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi;
        while ((m = regexSourceBox.exec(texto))) addCandidato(m[1], 'regex-source-player');

        const regexIframe = /<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi;
        while ((m = regexIframe.exec(texto))) addCandidato(m[1], 'regex-iframe');

        const regexDireto = /(https?:\/\/[^"'<>\s]*(?:superflixapi|superembeds|superembed|viewplayer|playerthree|trembed|suaap)[^"'<>\s]*)/gi;
        while ((m = regexDireto.exec(texto))) addCandidato(m[1], 'regex-direto');
    }

    candidatos.sort((a, b) => b.peso - a.peso);
    const escolhido = candidatos.find(c => c.peso >= 50) || candidatos[0];
    return escolhido ? escolhido.src : '';
}




/* ===== PLAYER UNIFICADO — BOTÕES EXTERNOS PARA TODOS OS PROVEDORES ===== */
function cronosNormalizarUrlPlayer(url, base = '') {
    try {
        let u = String(url || '').trim().replace(/&amp;/g, '&').replace(/&#038;/g, '&').replace(/\\/g, '');
        if (!u) return '';
        u = u.split(/\s+/)[0].replace(/["'<>]/g, '').trim();
        try { u = decodeURIComponent(u); } catch(e) {}
        if (u.startsWith('//')) u = 'https:' + u;
        if (u.startsWith('/')) {
            const b = base || (window.obraSendoVista && window.obraSendoVista.baseUrl) || CRONOS_BASE_URL || location.href;
            u = new URL(u, b).href;
        }
        return u;
    } catch(e) { return String(url || '').trim(); }
}

function cronosPlayerBloqueado(url) {
    const u = String(url || '').toLowerCase();
    return !u ||
        u.includes('youtube') || u.includes('youtu.be') || u.includes('youtube-nocookie') ||
        u.includes('/ads/') || u.includes('22bet') || u.includes('betano') || u.includes('doubleclick') ||
        u.includes('adserver') || u.includes('facebook.com') || u.includes('googlesyndication');
}

function cronosRotuloPlayer(player, idx = 0) {
    let label = String(player && player.label || '').replace(/\s+/g, ' ').trim();
    label = label.replace(/^(assistir|player|servidor|opção|opcao)\s*[:\-#]?\s*/i, '').trim();
    const u = String(player && player.src || '').toLowerCase();
    if (!label) {
        if (u.includes('megaembed')) label = 'MegaEmbed';
        else if (u.includes('superflixapi') || u.includes('superembed') || u.includes('superembeds')) label = 'Dublado [SEM ANÚNCIO]';
        else if (u.includes('viewplayer') || u.includes('playerthree') || u.includes('trembed')) label = 'Dublado';
        else if (u.includes('suaap')) label = 'Dublado';
        else label = 'Player';
    }
    if (/legendado|\bleg\b/i.test(label)) return 'Legendado';
    if (/sem\s*an[úu]ncio|superflix|superembed|megaembed/i.test(label)) return label.replace(/superflixapi/ig, 'Dublado [SEM ANÚNCIO]');
    if (/dublado|\bdub\b/i.test(label)) return 'Dublado';
    return label || `Player ${idx + 1}`;
}

function cronosPushPlayer(lista, vistos, src, label = '', tipo = 'direto', base = '') {
    src = cronosNormalizarUrlPlayer(src, base);
    if (!src || cronosPlayerBloqueado(src)) return;
    const chave = src.replace(/#.*$/, '').trim();
    if (!chave || vistos.has(chave)) return;
    vistos.add(chave);
    lista.push({ src, label, tipo });
}

function cronosExtrairSuaapPlayers(doc, html, lista, vistos) {
    const resolver = (href) => {
        try {
            href = cronosNormalizarUrlPlayer(href, (window.obraSendoVista && window.obraSendoVista.baseUrl) || CRONOS_BASE_URL || location.href);
            if (!href) return '';
            const u = new URL(href);
            let t = u.searchParams.get('t') || '';
            t = String(t || '').trim().replace(/&amp;/g, '&').replace(/&#038;/g, '&');
            return cronosNormalizarUrlPlayer(t, href);
        } catch(e) { return ''; }
    };
    try {
        if (doc && doc.querySelectorAll) {
            doc.querySelectorAll('a[href*="suaap.com/api/start/cpurl"], a[href*="api/start/cpurl"]').forEach(a => {
                const label = a.innerText || a.textContent || 'Dublado';
                const real = resolver(a.getAttribute('href') || a.href || '');
                if (real) cronosPushPlayer(lista, vistos, real, label, 'suaap');
            });
        }
    } catch(e) {}
    try {
        const texto = String(html || '');
        let m;
        const regs = [
            /href=["']([^"']*suaap\.com\/api\/start\/cpurl[^"']*)["']/ig,
            /href=["']([^"']*api\/start\/cpurl[^"']*)["']/ig,
            /(https?:\/\/[^"'<>\s]*suaap\.com\/api\/start\/cpurl[^"'<>\s]*)/ig
        ];
        for (const reg of regs) while ((m = reg.exec(texto))) {
            const real = resolver(m[1]);
            if (real) cronosPushPlayer(lista, vistos, real, 'Dublado', 'suaap-regex');
        }
    } catch(e) {}
}

function cronosExtrairPlayersDetalhe(doc, html, iframePrincipal = '') {
    const lista = [];
    const vistos = new Set();
    cronosExtrairSuaapPlayers(doc, html, lista, vistos);

    try {
        const labelPorNume = {};
        if (doc && doc.querySelectorAll) {
            doc.querySelectorAll('.dooplay_player_option, #playeroptionsul li, [data-nume][data-post]').forEach(opt => {
                const n = opt.getAttribute('data-nume') || opt.dataset.nume || '';
                const label = opt.querySelector('.title')?.innerText || opt.innerText || opt.textContent || '';
                if (n && label) labelPorNume[n] = label.trim();
            });
            doc.querySelectorAll('[id^="source-player-"]').forEach(box => {
                const id = box.getAttribute('id') || '';
                const nume = (id.match(/source-player-([^\s"']+)/i) || [])[1] || '';
                const label = labelPorNume[nume] || box.querySelector('.title')?.innerText || box.getAttribute('data-title') || '';
                box.querySelectorAll('iframe[src]').forEach(ifr => cronosPushPlayer(lista, vistos, ifr.getAttribute('src') || '', label, 'source-box', location.href));
                box.querySelectorAll('[data-source], [data-src], a[href]').forEach(el => {
                    const src = el.getAttribute('data-source') || el.getAttribute('data-src') || el.getAttribute('href') || '';
                    if (/player|embed|suaap|superflix|viewplayer|trembed|mega/i.test(src)) cronosPushPlayer(lista, vistos, src, label || el.innerText || '', 'source-data', location.href);
                });
            });
            const seletores = [
                '#dooplay_player_content iframe[src]', '#playcontainer iframe[src]', '.dooplay_player iframe[src]', '.source-box iframe[src]',
                '.wp-content iframe[src]', 'iframe[src*="superflixapi"]', 'iframe[src*="superembeds"]', 'iframe[src*="superembed"]',
                'iframe[src*="megaembed"]', 'iframe[src*="viewplayer"]', 'iframe[src*="playerthree"]', 'iframe[src*="trembed"]', 'iframe[src*="suaap"]', 'iframe[src]'
            ];
            seletores.forEach(sel => doc.querySelectorAll(sel).forEach(ifr => {
                const box = ifr.closest && ifr.closest('[id^="source-player-"], .source-box, .dooplay_player, #playcontainer');
                const label = box?.querySelector('.title')?.innerText || box?.getAttribute('data-title') || '';
                cronosPushPlayer(lista, vistos, ifr.getAttribute('src') || '', label, 'iframe', location.href);
            }));
        }
    } catch(e) {}

    try {
        const texto = String(html || '');
        let m;
        const regexSourceBox = /<div[^>]+id=["']source-player-[^"']+["'][^>]*>[\s\S]*?<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi;
        while ((m = regexSourceBox.exec(texto))) cronosPushPlayer(lista, vistos, m[1], '', 'regex-source');
        const regexIframe = /<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi;
        while ((m = regexIframe.exec(texto))) cronosPushPlayer(lista, vistos, m[1], '', 'regex-iframe');
        const regexDireto = /(https?:\/\/[^"'<>\s]*(?:superflixapi|superembeds|superembed|megaembed|viewplayer|playerthree|trembed|suaap)[^"'<>\s]*)/gi;
        while ((m = regexDireto.exec(texto))) cronosPushPlayer(lista, vistos, m[1], '', 'regex-direto');
    } catch(e) {}

    if (iframePrincipal) cronosPushPlayer(lista, vistos, iframePrincipal, 'Player Original', 'principal');
    return lista;
}

async function cronosExpandirPlayerInterno(player) {
    const src = cronosNormalizarUrlPlayer(player && player.src || '');
    const lower = src.toLowerCase();
    const podeExpandir = lower.includes('viewplayer') || lower.includes('playerthree') || lower.includes('trembed');
    if (!src || !podeExpandir || lower.includes('megaembed')) return [];
    try {
        const htmlPlayer = await fetch(PROXY + encodeURIComponent(src)).then(r => r.ok ? r.text() : Promise.reject());
        const docPlayer = new DOMParser().parseFromString(htmlPlayer, 'text/html');
        const lista = [];
        const vistos = new Set();
        docPlayer.querySelectorAll('[data-show-player][data-source], [data-source]').forEach(btn => {
            const link = btn.getAttribute('data-source') || '';
            const label = btn.innerText || btn.textContent || btn.getAttribute('title') || btn.getAttribute('aria-label') || '';
            cronosPushPlayer(lista, vistos, link, label, 'interno', src);
        });
        docPlayer.querySelectorAll('iframe[src]').forEach(ifr => {
            const label = ifr.closest('[data-title]')?.getAttribute('data-title') || 'Player';
            cronosPushPlayer(lista, vistos, ifr.getAttribute('src') || '', label, 'interno-iframe', src);
        });
        return lista;
    } catch(e) { return []; }
}

async function renderizarBotoesPlayerUnificadoCronos(titulo, doc, htmlDetalhe, iframeSrc) {
    const area = document.getElementById('areaAcaoDetalhe');
    if (!area) return;
    area.innerHTML = '<span style="color:#ffcc00;font-size:13px;">⏳ Buscando players disponíveis...</span>';

    const basePlayers = cronosExtrairPlayersDetalhe(doc, htmlDetalhe, iframeSrc);
    const final = [];
    const vistos = new Set();

    for (const p of basePlayers) {
        const internos = await cronosExpandirPlayerInterno(p);
        if (internos && internos.length) {
            internos.forEach(ip => cronosPushPlayer(final, vistos, ip.src, ip.label || p.label, ip.tipo || 'interno', p.src));
            cronosPushPlayer(final, vistos, p.src, 'ViewPlayer Original', 'original');
        } else {
            cronosPushPlayer(final, vistos, p.src, p.label, p.tipo, p.src);
        }
    }

    area.innerHTML = '';
    if (!final.length) {
        area.innerHTML = '<span style="color:#ff0055; font-weight:bold;">Player não encontrado na página base.</span>';
        return;
    }

    final.forEach((p, idx) => {
        const isOriginal = /original/i.test(p.label || '') || p.tipo === 'original' || p.tipo === 'principal';
        const btn = document.createElement('button');
        btn.className = 'btn-assistir';
        if (isOriginal) btn.style.cssText = 'background:#111;border:1px solid #555;color:#aaa;font-size:11px;padding:7px 10px;';
        const label = cronosRotuloPlayer(p, idx);
        btn.innerHTML = isOriginal ? `🔗 ${label}` : `▶ #${idx + 1} ${label}`;
        btn.title = p.src;
        btn.onclick = () => abrirPlayer(titulo, p.src);
        area.appendChild(btn);
    });
}

function limparBotoesTransmissaoDetalheCronos() {
    const tela = document.getElementById('telaDetalhes');
    const area = document.getElementById('areaAcaoDetalhe');
    if (!tela) return;

    // O botão de transmissão no mobile era movido para fora da areaAcaoDetalhe.
    // Quando uma nova ficha abria, areaAcaoDetalhe era limpa, mas o botão antigo ficava salvo na tela.
    tela.querySelectorAll('.cronos-transmissao-sem-pulo-wrap').forEach(wrap => wrap.remove());
    tela.querySelectorAll('.btn-assistir, .cronos-transmissao-sem-pulo-btn').forEach(btn => {
        if (!area || !area.contains(btn)) btn.remove();
    });
}

function analisarObra(url, ano, tituloCard, img, isMovie) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    ativarTela('telaDetalhes');
    limparBotoesTransmissaoDetalheCronos();

    const status = document.getElementById('statusDetalhes');
    status.className = 'loading-text';
    status.innerText = 'Extraindo metadados estendidos...';
    status.style.display = 'block';

    document.getElementById('blocoDetalhesInfo').style.display = 'none';
    document.getElementById('areaAcaoDetalhe').innerHTML = '';
    document.getElementById('listaEpisodios').innerHTML = '';
    document.getElementById('linha4Volume').style.display = 'none';
    ['linha1Original', 'linha2Ficha', 'linha3Generos', 'linha4Volume'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
    const backdropEl = document.getElementById('backdropDetalhes');
    if (backdropEl) backdropEl.style.backgroundImage = 'none';

    obraSendoVista = { url, titulo: tituloCard, ano, img, isMovie };
    try { window.obraSendoVista = obraSendoVista; } catch(e) {}
    checarBotaoFavorito(url);

    fetch(PROXY + encodeURIComponent(url))
        .then(res => { if(!res.ok) throw new Error('Falha HTTP'); return res.text(); })
        .then(async html => {
            let doc = new DOMParser().parseFromString(html, 'text/html');
            let htmlDetalhe = html;
            let playerDetectadoAntes = extrairLinkLimpoDoPlayer(doc, htmlDetalhe);

            // Se a rota atual não trouxe iframe, tenta os espelhos do mesmo slug.
            // Ex.: boraflix.click/filmes/matrix/ pode não entregar player, mas boraflixtv.com/filmes/matrix/ entrega.
            if (isMovie && !playerDetectadoAntes) {
                const alternativo = await tentarHtmlAlternativoComPlayerCronos(url);
                if (alternativo && alternativo.playerUrl) {
                    doc = alternativo.doc;
                    htmlDetalhe = alternativo.html;
                    playerDetectadoAntes = alternativo.playerUrl;
                    console.log('Player encontrado em espelho:', alternativo.urlUsada, playerDetectadoAntes);
                }
            }

            let titulo = doc.querySelector('h1[itemprop="name"]')?.innerText || doc.querySelector('h1')?.innerText || tituloCard;
            titulo = titulo.replace(/(Assistir |Online|Grátis|Completo|Dublado|Legendado)/gi, '').trim();

            let posterSrc = escolherPosterSeguroCronos(extrairPosterClickDetalhe(doc, img), img);
            const obraSalvaAntesDetalhe = await dbGet('obras', gerarIdCronos(url));
            const posterManualSalvoDetalhe = (obraSalvaAntesDetalhe?.posterManual || obraSalvaAntesDetalhe?.posterManualEditable || obraSalvaAntesDetalhe?.posterManualUpload)
                ? escolherPosterSeguroCronos(obraSalvaAntesDetalhe.poster, obraSalvaAntesDetalhe.img)
                : '';
            if (posterManualSalvoDetalhe) posterSrc = posterManualSalvoDetalhe;
            const bgUrl = escolherBackdropSeguroCronos(extrairBackdropClickDetalhe(doc, htmlDetalhe));
            const sinopse = extrairSinopseClick(doc);
            const generos = extrairGenerosClick(doc);
            const anoLimpo = extrairAnoCard(ano || extrairDataClick(doc, ano)) || extrairAnoCard(tituloCard) || '';
            const tipoObra = isMovie ? 'Filme' : 'Série';

            document.getElementById('detalheTitulo').innerText = titulo;
            document.getElementById('detalheImg').src = posterSrc || placeholderCronosPoster();
            if (backdropEl) backdropEl.style.backgroundImage = bgUrl ? `url(${bgUrl})` : 'none';
            document.getElementById('detalheSinopse').innerText = sinopse;
            document.getElementById('linha1Original').innerText = extrairTituloOriginalClick(doc) || '';

            let linha2Html = `<span class="tag-meta tag-nota">IMDb: ${extrairNotaImdbDetalheCronos(doc)}</span>`;
            linha2Html += `<span class="tag-meta tag-qualidade">${extrairQualidadeClick(doc, htmlDetalhe)}</span>`;
            const duracao = extrairDuracaoClick(doc);
            if (duracao) linha2Html += `<span class="tag-meta tag-duracao">${duracao}</span>`;
            const dataFinal = extrairDataClick(doc, ano);
            if (dataFinal) linha2Html += `<span class="tag-meta">${dataFinal}</span>`;
            document.getElementById('linha2Ficha').innerHTML = linha2Html;

            document.getElementById('linha3Generos').innerHTML = generos.map(g => `<span class="tag-meta tag-genero">${g.nome}</span>`).join('');

            if (!isMovie) {
                document.getElementById('linha4Volume').innerHTML = `<span class="tag-meta tag-temporada" id="badgeTemporadas">A calcular...</span><span class="tag-meta tag-episodios" id="badgeEpisodios">A calcular...</span>`;
                document.getElementById('linha4Volume').style.display = 'flex';
            }

            const iframeSrc = playerDetectadoAntes || extrairLinkLimpoDoPlayer(doc, htmlDetalhe);
            const playerOption = doc.querySelector('.dooplay_player_option.on, #playeroptionsul .dooplay_player_option');
            obraSendoVista = {
                url,
                titulo,
                ano: anoLimpo || ano,
                img: posterSrc,
                poster: posterSrc,
                backdrop: bgUrl,
                sinopse,
                generos,
                isMovie,
                tipo: tipoObra,
                playerUrl: iframeSrc || '',
                playerProvider: playerOption?.querySelector('.title')?.innerText?.trim() || '',
                playerPostId: playerOption?.getAttribute('data-post') || '',
                playerNume: playerOption?.getAttribute('data-nume') || '',
                posterManual: !!(obraSalvaAntesDetalhe?.posterManual || obraSalvaAntesDetalhe?.posterManualEditable || obraSalvaAntesDetalhe?.posterManualUpload),
                posterManualEditable: !!(obraSalvaAntesDetalhe?.posterManual || obraSalvaAntesDetalhe?.posterManualEditable || obraSalvaAntesDetalhe?.posterManualUpload),
                posterManualUpload: !!obraSalvaAntesDetalhe?.posterManualUpload,
                posterManualFonte: obraSalvaAntesDetalhe?.posterManualFonte || '',
                posterManualModo: obraSalvaAntesDetalhe?.posterManualModo || ''
            };
            try { window.obraSendoVista = obraSendoVista; } catch(e) {}
            try {
                await salvarObraCronos(obraSendoVista);
                await salvarHistoricoHome(obraSendoVista);
            } catch (erroBancoDetalhe) {
                console.warn('Detalhes renderizados, mas falhou ao salvar no IndexedDB:', erroBancoDetalhe);
            }
            checarBotaoFavorito(url);

            status.style.display = 'none';
            document.getElementById('blocoDetalhesInfo').style.display = 'flex';
            ajustarQuebraTituloDetalheCronos();

            if (isMovie) {
                limparBotoesTransmissaoDetalheCronos();
                await renderizarBotoesPlayerUnificadoCronos(titulo, doc, htmlDetalhe, iframeSrc);
            } else {
                const seasonsDiv = doc.querySelectorAll('#seasons .se-c');
                if (seasonsDiv.length > 0) {
                    extrairEpisodiosNativos(doc, titulo, posterSrc, bgUrl, anoLimpo || ano);
                } else if (iframeSrc) {
                    extrairEpisodiosIframeMestre(iframeSrc, titulo, posterSrc, bgUrl, anoLimpo || ano);
                } else {
                    document.getElementById('listaEpisodios').innerHTML = '<h3 style="color:#aaa; text-align:center; margin-top:20px;">Nenhuma estrutura de episódios localizada.</h3>';
                    const bEps = document.getElementById('badgeEpisodios'); if (bEps) bEps.innerText = '0 EPISÓDIOS';
                    const bTem = document.getElementById('badgeTemporadas'); if (bTem) bTem.innerText = '0 TEMPORADAS';
                }
            }
        })
        .catch(err => {
            console.error(err);
            status.className = 'error-text';
            status.innerText = 'Erro crítico ao processar as informações da página.';
        });
}

function alternarAudioStreaming(audioSelecionado) {
    localAudioAtivo = audioSelecionado;
    document.querySelectorAll('.btn-audio-tag').forEach(btn => {
        if (btn.getAttribute('data-audio') === audioSelecionado) btn.classList.add('ativo');
        else btn.classList.remove('ativo');
    });
    const sids = Object.keys(dadosSeriesAtual[localAudioAtivo] || {}).sort((a, b) => parseInt(a) - parseInt(b));
    const badgeTemporadas = document.getElementById('badgeTemporadas');
    if (badgeTemporadas) badgeTemporadas.innerText = `${sids.length} TEMPORADA${sids.length !== 1 ? 'S' : ''}`;
    let totalEps = 0;
    Object.values(dadosSeriesAtual[localAudioAtivo] || {}).forEach(list => totalEps += list.length);
    const badgeEps = document.getElementById('badgeEpisodios');
    if (badgeEps) badgeEps.innerText = `${totalEps} EPISÓDIO${totalEps !== 1 ? 'S' : ''}`;
    if (!sids.includes(temporadaAtiva)) temporadaAtiva = sids[0] || null;
    renderizarGradeEpisodios();
}

function renderizarGradeEpisodios() {
    const container = document.getElementById('listaEpisodios');
    container.innerHTML = '';
    const listaTemporadas = dadosSeriesAtual[localAudioAtivo] || {};
    const sids = Object.keys(listaTemporadas).sort((a, b) => parseInt(a) - parseInt(b));
    if (sids.length === 0) return;
    if (!temporadaAtiva || !sids.includes(temporadaAtiva)) temporadaAtiva = sids[0];

    if (sids.length > 1) {
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'tabs-temporadas';
        sids.forEach((sid, index) => {
            const btn = document.createElement('button');
            btn.className = 'btn-temporada' + (sid === temporadaAtiva ? ' ativo' : '');
            btn.innerText = (index + 1).toString();
            btn.onclick = () => { temporadaAtiva = sid; renderizarGradeEpisodios(); };
            tabsContainer.appendChild(btn);
        });
        container.appendChild(tabsContainer);
    }

    const gridContainer = document.createElement('ul');
    gridContainer.className = 'grid-episodios';
    const bgElement = document.getElementById('backdropDetalhes');
    const seasonIndex = sids.indexOf(temporadaAtiva) + 1;
    const tNum = String(seasonIndex).padStart(2, '0');
    const episDaTemporada = listaTemporadas[temporadaAtiva] || [];

    episDaTemporada.forEach((li, index) => {
        const nativeUrl = li.getAttribute('data-native-url');
        const iframeId = li.dataset.episode_id || li.getAttribute('data-episode-id');
        let epDateEl = li.querySelector('.date');
        let epDate = epDateEl ? epDateEl.innerText.trim() : '';
        if (!epDate) epDate = obraSendoVista.ano || new Date().getFullYear();

        let epNumText = li.querySelector('.episode-title, .episodiotitle')?.innerText || '';
        if (epDate && epNumText.includes(epDate)) epNumText = epNumText.replace(epDate, '').trim();
        epNumText = epNumText.replace(/^[0-9]+\s*-\s*/, '').trim();
        const eNum = String(index + 1).padStart(2, '0');
        if (epNumText.toLowerCase() === 'episódio' || epNumText === '') epNumText = `Episódio ${eNum}`;
        const tituloFormatado = `S${tNum}E${eNum} - ${epNumText}`;

        let epImgEl = li.querySelector('.imagen img') || li.querySelector('img');
        let thumbUrl = epImgEl ? (epImgEl.getAttribute('data-src') || epImgEl.getAttribute('src')) : '';
        if (thumbUrl && thumbUrl.startsWith('//')) thumbUrl = 'https:' + thumbUrl;
        if (thumbUrl && thumbUrl.startsWith('/')) thumbUrl = CRONOS_BASE_URL.replace(/\/$/, '') + thumbUrl;
        if (!thumbUrl) {
            thumbUrl = obraSendoVista.img;
            if (bgElement.style.backgroundImage && bgElement.style.backgroundImage !== 'none') {
                const match = bgElement.style.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/);
                if (match) thumbUrl = match[1];
            }
        }
        thumbUrl = maximizarQualidadeTMDB(thumbUrl, 'w780');

        salvarEpisodioCronos({
            url: nativeUrl || (iframeId ? `https://viewplayer.online/episodio/${iframeId}` : obraSendoVista.url + '#ep-' + tNum + '-' + eNum),
            titulo: `${tituloSerieAtual || obraSendoVista.titulo} - ${tituloFormatado}`,
            serieTitulo: tituloSerieAtual || obraSendoVista.titulo,
            temporada: tNum,
            episodio: eNum,
            poster: thumbUrl,
            img: thumbUrl,
            ano: epDate || obraSendoVista.ano
        });

        const badgeClass = localAudioAtivo === 'legendado' ? 'ep-badge leg' : 'ep-badge';
        const badgeText = localAudioAtivo === 'legendado' ? 'LEG' : 'DUB';
        const epCard = document.createElement('li');
        epCard.className = 'ep-card';
        epCard.innerHTML = `
            <div class="ep-thumb">
                <img src="${thumbUrl}" alt="Episódio">
                <div class="${badgeClass}">${badgeText}</div>
                <div class="ep-play-icon">▶</div>
            </div>
            <div class="ep-info">
                <span class="ep-title">${tituloFormatado}</span>
                <span class="ep-year">${epDate}</span>
            </div>
        `;
        if (nativeUrl) epCard.onclick = () => prepararEpisodioDooplay(`${tituloSerieAtual} - ${tituloFormatado}`, nativeUrl);
        else if (iframeId) epCard.onclick = () => {
            const urlPlayerEpCronos = `https://viewplayer.online/episodio/${iframeId}`;
            if(window.cronosAbrirModalFontesEpisodioOficial) window.cronosAbrirModalFontesEpisodioOficial(`${tituloSerieAtual} - ${tituloFormatado}`, urlPlayerEpCronos, () => abrirPlayer(`${tituloSerieAtual} - ${tituloFormatado}`, urlPlayerEpCronos));
            else abrirPlayer(`${tituloSerieAtual} - ${tituloFormatado}`, urlPlayerEpCronos);
        };
        gridContainer.appendChild(epCard);
    });
    container.appendChild(gridContainer);
}

function extrairEpisodiosNativos(doc, tituloSerie, posterSerie = '', backdropSerie = '', anoSerie = '') {
    const container = document.getElementById('listaEpisodios');
    container.innerHTML = '';
    const seasonsValidas = Array.from(doc.querySelectorAll('#seasons .se-c')).filter(s => {
        const ul = s.querySelector('.se-a ul.episodios');
        return ul && ul.children.length > 0;
    });
    let totalEps = 0;
    dadosSeriesAtual = { dublado: {} };
    temporadasNomesAtual = {};
    tituloSerieAtual = tituloSerie;
    temporadaAtiva = null;

    seasonsValidas.forEach((season, index) => {
        const realTempIndex = (index + 1).toString();
        temporadasNomesAtual[realTempIndex] = `Temporada ${realTempIndex}`;
        dadosSeriesAtual.dublado[realTempIndex] = [];
        const eps = season.querySelectorAll('.se-a ul.episodios li');
        eps.forEach(ep => {
            const linkEl = ep.querySelector('.episodiotitle a');
            if (linkEl) {
                ep.setAttribute('data-native-url', linkEl.getAttribute('href'));
                dadosSeriesAtual.dublado[realTempIndex].push(ep);
                totalEps++;
            }
        });
    });

    if (totalEps === 0) {
        container.innerHTML = '<h3 style="color:#aaa; text-align:center; margin-top:20px;">Nenhum episódio localizado.</h3>';
        const badgeEps = document.getElementById('badgeEpisodios'); if (badgeEps) badgeEps.innerText = '0 EPISÓDIOS';
        const badgeTem = document.getElementById('badgeTemporadas'); if (badgeTem) badgeTem.innerText = '0 TEMPORADAS';
        return;
    }

    const tagQualidade = document.querySelector('#linha2Ficha .tag-qualidade');
    if (tagQualidade) {
        const btnDub = document.createElement('button');
        btnDub.className = 'btn-audio-tag ativo';
        btnDub.innerText = 'Dublado';
        btnDub.setAttribute('data-audio', 'dublado');
        btnDub.onclick = () => alternarAudioStreaming('dublado');
        tagQualidade.after(btnDub);
    }
    alternarAudioStreaming('dublado');
}

function extrairEpisodiosIframeMestre(src, tituloSerie, posterSerie = '', backdropSerie = '', anoSerie = '') {
    const msgEps = document.createElement('div');
    msgEps.id = 'statusEpisodiosExtras';
    msgEps.style.marginTop = '15px';
    msgEps.innerHTML = '<span style="color:#aaa; font-style:italic; font-size: 13px;">A estruturar matriz de episódios...</span>';
    document.getElementById('listaEpisodios').appendChild(msgEps);
    fetch(PROXY + encodeURIComponent(src))
        .then(res => { if(!res.ok) throw new Error(); return res.text(); })
        .then(html => {
            msgEps.remove();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            dadosSeriesAtual = { dublado: {}, legendado: {} };
            temporadasNomesAtual = {};
            tituloSerieAtual = tituloSerie;
            temporadaAtiva = null;
            doc.querySelectorAll('.header-navigation li').forEach(li => { temporadasNomesAtual[li.dataset.seasonId] = li.innerText.trim(); });
            const cards = doc.querySelectorAll('.card');
            if (!cards.length) {
                const badgeEpisodios = document.getElementById('badgeEpisodios');
                if (badgeEpisodios) badgeEpisodios.innerText = `Catálogo Principal Unificado`;
                return;
            }
            let temDublado = false, temLegendado = false;
            cards.forEach(card => {
                const txtIdioma = card.querySelector('.card-title')?.innerText || '';
                let audioKey = txtIdioma.toUpperCase().includes('LEGENDADO') ? 'legendado' : 'dublado';
                if (audioKey === 'legendado') temLegendado = true; else temDublado = true;
                const eps = card.querySelectorAll('li[data-episode-id]');
                eps.forEach(li => {
                    const sid = li.dataset.seasonId;
                    if (!dadosSeriesAtual[audioKey][sid]) dadosSeriesAtual[audioKey][sid] = [];
                    dadosSeriesAtual[audioKey][sid].push(li);
                });
            });
            localAudioAtivo = temDublado ? 'dublado' : 'legendado';
            if (!temDublado && !temLegendado) { temDublado = true; localAudioAtivo = 'dublado'; }
            document.querySelectorAll('#linha2Ficha .tag-idioma, #linha2Ficha .btn-audio-tag').forEach(el => el.remove());
            const tagQualidade = document.querySelector('#linha2Ficha .tag-qualidade');
            if (tagQualidade) {
                if (temLegendado) {
                    const btnLeg = document.createElement('button');
                    btnLeg.className = 'btn-audio-tag' + (localAudioAtivo === 'legendado' ? ' ativo' : '');
                    btnLeg.innerText = 'Legendado'; btnLeg.setAttribute('data-audio', 'legendado');
                    btnLeg.onclick = () => alternarAudioStreaming('legendado');
                    tagQualidade.after(btnLeg);
                }
                if (temDublado) {
                    const btnDub = document.createElement('button');
                    btnDub.className = 'btn-audio-tag' + (localAudioAtivo === 'dublado' ? ' ativo' : '');
                    btnDub.innerText = 'Dublado'; btnDub.setAttribute('data-audio', 'dublado');
                    btnDub.onclick = () => alternarAudioStreaming('dublado');
                    tagQualidade.after(btnDub);
}
            }
            alternarAudioStreaming(localAudioAtivo);
        })
        .catch(() => { if (msgEps) msgEps.remove(); });
}


async function forcarAtualizacaoObra() {
    if (!obraSendoVista || !obraSendoVista.url) {
        alert('Nenhuma obra aberta para atualizar.');
        return;
    }
    const btn = document.getElementById('btnAtualizarDetalhe');
    if (btn) {
        btn.classList.add('carregando');
        btn.innerText = '⟳ Atualizando...';
    }
    const status = document.getElementById('statusDetalhes');
    if (status) {
        status.className = 'loading-text';
        status.style.display = 'block';
        status.innerText = 'Atualizando obra: relendo página completa e substituindo dados no banco...';
    }
    const atual = { ...obraSendoVista };
    try {
        // Reprocessa a URL real da obra, sem depender do cache do IndexedDB.
        analisarObra(atual.url, atual.ano || '', atual.titulo || '', atual.poster || atual.img || '', atual.isMovie || atual.tipo === 'Filme');
    } finally {
        setTimeout(() => {
            const b = document.getElementById('btnAtualizarDetalhe');
            if (b) {
                b.classList.remove('carregando');
                b.innerText = '⟳ Atualizar';
            }
        }, 1200);
    }
}

function prepararEpisodioDooplay(tituloEpisodio, urlEpisodio) {
    const status = document.getElementById('statusDetalhes');
    status.className = 'loading-text';
    status.innerText = 'A extrair link seguro de vídeo do episódio...';
    status.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetch(PROXY + encodeURIComponent(urlEpisodio))
        .then(res => { if(!res.ok) throw new Error(); return res.text(); })
        .then(html => {
            status.style.display = 'none';
            const doc = new DOMParser().parseFromString(html, 'text/html');
            let linkPlayer = extrairLinkLimpoDoPlayer(doc);
            if (linkPlayer) abrirPlayer(tituloEpisodio, linkPlayer);
            else alert('Player de vídeo não encontrado na página deste episódio.');
        })
        .catch(() => {
            status.style.display = 'none';
            alert('Erro ao tentar acessar a transmissão do episódio.');
        });
}

function buscarEAssistirEpisodio(urlEpisodio, tituloEpisodio) {
    prepararEpisodioDooplay(tituloEpisodio, urlEpisodio);
}

function abrirPlayer(titulo, urlVideo) {
    if(obraSendoVista && obraSendoVista.url) salvarHistoricoHome({...obraSendoVista, titulo: obraSendoVista.titulo || titulo, playerUrl: urlVideo});
    ativarTela('telaPlayer');
    document.getElementById('playerTitulo').innerText = titulo;
    document.getElementById('iframePlayer').src = urlVideo;
}

function fecharPlayer() {
    ativarTela('telaDetalhes');
    document.getElementById('iframePlayer').src = ''; 
}
