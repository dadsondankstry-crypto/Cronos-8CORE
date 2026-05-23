
(function(){
    if (window.__CRONOS_MULTI_PROVIDER_PATCH__) return;
    window.__CRONOS_MULTI_PROVIDER_PATCH__ = true;

    const STORAGE_FONTES = 'cronos_providers_ativos';
    const STORAGE_FILTROS = 'cronos_filtros_visuais';
    const ORDEM_PROVEDORES = ['b01', 'p02', 'm03', 'e04', 's05', 'u06', 'l07', 'primeflix'];
    const PROVIDERS = {
        b01: { key: 'b01', sigla: 'BFCK', nome: 'Fonte BFCK', base: 'https://www.boraflix.click/', generoBase: '/categoria/', semEpisodios: false, semAno: false },
        p02: { key: 'p02', sigla: 'BFTV', nome: 'Fonte BFTV', base: 'https://www.boraflixtv.com/', generoBase: '/categoria/', semEpisodios: false, semAno: false },
        m03: { key: 'm03', sigla: 'MEGA', nome: 'Fonte MEGA', base: 'https://megacine.boats/', generoBase: '/generos/', semEpisodios: true, semAno: true, semLetras: true },
        e04: { key: 'e04', sigla: 'EBA', nome: 'Fonte EBA', base: 'https://www.ebaflix.com/', generoBase: '', semCategoria: true, semEpisodios: true, semAno: true },
        s05: { key: 's05', sigla: 'SWEB', nome: 'Fonte SWEB', base: 'https://www.seriesonlineweb.lol/', generoBase: '/generos/', semEpisodios: true, semAno: true },
        u06: { key: 'u06', sigla: 'SSUP', nome: 'Fonte SSUP', base: 'https://superseries.life/', generoBase: '/generos/', semEpisodios: true, semAno: true },
        l07: { key: 'l07', sigla: 'LISO', nome: 'Fonte LISO', base: 'https://lisoflix.net/', generoBase: '/category/', filmePath: '/movies/', seriePath: '/series/', episodioPath: '/episodio/', buscaPath: '/?s=', letrasPath: '/letra/', semEpisodios: false, semAno: true },
        primeflix: { key: 'primeflix', sigla: 'PRIME', nome: 'Fonte PRIME', base: 'https://primeflix.mom/', generoBase: '', filmePath: '/filmes', seriePath: '/series', episodioPath: '/episodios', buscaPath: '/pesquisar?s=', animePath: '/animes', doramaPath: '/doramas', semCategoria: true, semAno: true, semLetras: true, semEpisodios: false }
    };
    const GENEROS_P02_MULTI = [{"nome": "Ação", "slug": "acao", "url": "https://www.boraflixtv.com/categoria/acao/"}, {"nome": "Action & Adventure", "slug": "action-adventure", "url": "https://www.boraflixtv.com/categoria/action-adventure/"}, {"nome": "Animação", "slug": "animacao", "url": "https://www.boraflixtv.com/categoria/animacao/"}, {"nome": "Aventura", "slug": "aventura", "url": "https://www.boraflixtv.com/categoria/aventura/"}, {"nome": "Canais", "slug": "canais", "url": "https://www.boraflixtv.com/categoria/canais/"}, {"nome": "Cinema TV", "slug": "cinema-tv", "url": "https://www.boraflixtv.com/categoria/cinema-tv/"}, {"nome": "Comédia", "slug": "comedia", "url": "https://www.boraflixtv.com/categoria/comedia/"}, {"nome": "Crime", "slug": "crime", "url": "https://www.boraflixtv.com/categoria/crime/"}, {"nome": "Documentário", "slug": "documentario", "url": "https://www.boraflixtv.com/categoria/documentario/"}, {"nome": "Drama", "slug": "drama", "url": "https://www.boraflixtv.com/categoria/drama/"}, {"nome": "Família", "slug": "familia", "url": "https://www.boraflixtv.com/categoria/familia/"}, {"nome": "Fantasia", "slug": "fantasia", "url": "https://www.boraflixtv.com/categoria/fantasia/"}, {"nome": "Faroeste", "slug": "faroeste", "url": "https://www.boraflixtv.com/categoria/faroeste/"}, {"nome": "Ficção Científica", "slug": "ficcao-cientifica", "url": "https://www.boraflixtv.com/categoria/ficcao-cientifica/"}, {"nome": "Guerra & Política", "slug": "guerra-politica", "url": "https://www.boraflixtv.com/categoria/guerra-politica/"}, {"nome": "Guerra", "slug": "guerra", "url": "https://www.boraflixtv.com/categoria/guerra/"}, {"nome": "História", "slug": "historia", "url": "https://www.boraflixtv.com/categoria/historia/"}, {"nome": "Kids", "slug": "kids", "url": "https://www.boraflixtv.com/categoria/kids/"}, {"nome": "Mistério", "slug": "misterio", "url": "https://www.boraflixtv.com/categoria/misterio/"}, {"nome": "Música", "slug": "musica", "url": "https://www.boraflixtv.com/categoria/musica/"}, {"nome": "Reality", "slug": "reality", "url": "https://www.boraflixtv.com/categoria/reality/"}, {"nome": "Romance", "slug": "romance", "url": "https://www.boraflixtv.com/categoria/romance/"}, {"nome": "Sci-Fi & Fantasy", "slug": "sci-fi-fantasy", "url": "https://www.boraflixtv.com/categoria/sci-fi-fantasy/"}, {"nome": "Soap", "slug": "soap", "url": "https://www.boraflixtv.com/categoria/soap/"}, {"nome": "Terror", "slug": "terror", "url": "https://www.boraflixtv.com/categoria/terror/"}, {"nome": "Thriller", "slug": "thriller", "url": "https://www.boraflixtv.com/categoria/thriller/"}, {"nome": "War & Politics", "slug": "war-politics", "url": "https://www.boraflixtv.com/categoria/war-politics/"}];
        const GENEROS_M03_MULTI = [{"nome": "Ação", "slug": "acao", "url": "https://megacine.boats/generos/acao", "providerKey": "m03"}, {"nome": "Animação", "slug": "animacao", "url": "https://megacine.boats/generos/animacao", "providerKey": "m03"}, {"nome": "Aventura", "slug": "aventura", "url": "https://megacine.boats/generos/aventura", "providerKey": "m03"}, {"nome": "Comédia", "slug": "comedia", "url": "https://megacine.boats/generos/comedia", "providerKey": "m03"}, {"nome": "Crime", "slug": "crime", "url": "https://megacine.boats/generos/crime", "providerKey": "m03"}, {"nome": "Documentário", "slug": "documentario", "url": "https://megacine.boats/generos/documentario", "providerKey": "m03"}, {"nome": "Drama", "slug": "drama", "url": "https://megacine.boats/generos/drama", "providerKey": "m03"}, {"nome": "Família", "slug": "familia", "url": "https://megacine.boats/generos/familia", "providerKey": "m03"}, {"nome": "Fantasia", "slug": "fantasia", "url": "https://megacine.boats/generos/fantasia", "providerKey": "m03"}, {"nome": "Faroeste", "slug": "faroeste", "url": "https://megacine.boats/generos/faroeste", "providerKey": "m03"}, {"nome": "Ficção Científica", "slug": "ficcao-cientifica", "url": "https://megacine.boats/generos/ficcao-cientifica", "providerKey": "m03"}, {"nome": "Guerra", "slug": "guerra", "url": "https://megacine.boats/generos/guerra", "providerKey": "m03"}, {"nome": "História", "slug": "historia", "url": "https://megacine.boats/generos/historia", "providerKey": "m03"}, {"nome": "Kids", "slug": "kids", "url": "https://megacine.boats/generos/kids", "providerKey": "m03"}, {"nome": "Mistério", "slug": "misterio", "url": "https://megacine.boats/generos/misterio", "providerKey": "m03"}, {"nome": "Música", "slug": "musica", "url": "https://megacine.boats/generos/musica", "providerKey": "m03"}, {"nome": "Reality", "slug": "reality", "url": "https://megacine.boats/generos/reality", "providerKey": "m03"}, {"nome": "Romance", "slug": "romance", "url": "https://megacine.boats/generos/romance", "providerKey": "m03"}, {"nome": "Terror", "slug": "terror", "url": "https://megacine.boats/generos/terror", "providerKey": "m03"}];
const GENEROS_E04_MULTI = [];
const GENEROS_PRIME_MULTI = [{"nome": "Animes", "slug": "animes", "url": "https://primeflix.mom/animes", "providerKey": "primeflix"}, {"nome": "Doramas", "slug": "doramas", "url": "https://primeflix.mom/doramas", "providerKey": "primeflix"}];
const GENEROS_S05_MULTI = [{"nome": "Ação", "slug": "acao", "url": "https://www.seriesonlineweb.lol/generos/acao", "providerKey": "s05"}, {"nome": "Animação", "slug": "animacao", "url": "https://www.seriesonlineweb.lol/generos/animacao", "providerKey": "s05"}, {"nome": "Aventura", "slug": "aventura", "url": "https://www.seriesonlineweb.lol/generos/aventura", "providerKey": "s05"}, {"nome": "Comédia", "slug": "comedia", "url": "https://www.seriesonlineweb.lol/generos/comedia", "providerKey": "s05"}, {"nome": "Crime", "slug": "crime", "url": "https://www.seriesonlineweb.lol/generos/crime", "providerKey": "s05"}, {"nome": "Documentário", "slug": "documentario", "url": "https://www.seriesonlineweb.lol/generos/documentario", "providerKey": "s05"}, {"nome": "Drama", "slug": "drama", "url": "https://www.seriesonlineweb.lol/generos/drama", "providerKey": "s05"}, {"nome": "Família", "slug": "familia", "url": "https://www.seriesonlineweb.lol/generos/familia", "providerKey": "s05"}, {"nome": "Fantasia", "slug": "fantasia", "url": "https://www.seriesonlineweb.lol/generos/fantasia", "providerKey": "s05"}, {"nome": "Faroeste", "slug": "faroeste", "url": "https://www.seriesonlineweb.lol/generos/faroeste", "providerKey": "s05"}, {"nome": "Ficção Científica", "slug": "ficcao-cientifica", "url": "https://www.seriesonlineweb.lol/generos/ficcao-cientifica", "providerKey": "s05"}, {"nome": "Guerra", "slug": "guerra", "url": "https://www.seriesonlineweb.lol/generos/guerra", "providerKey": "s05"}, {"nome": "História", "slug": "historia", "url": "https://www.seriesonlineweb.lol/generos/historia", "providerKey": "s05"}, {"nome": "Kids", "slug": "kids", "url": "https://www.seriesonlineweb.lol/generos/kids", "providerKey": "s05"}, {"nome": "Mistério", "slug": "misterio", "url": "https://www.seriesonlineweb.lol/generos/misterio", "providerKey": "s05"}, {"nome": "Música", "slug": "musica", "url": "https://www.seriesonlineweb.lol/generos/musica", "providerKey": "s05"}, {"nome": "Reality", "slug": "reality", "url": "https://www.seriesonlineweb.lol/generos/reality", "providerKey": "s05"}, {"nome": "Romance", "slug": "romance", "url": "https://www.seriesonlineweb.lol/generos/romance", "providerKey": "s05"}, {"nome": "Terror", "slug": "terror", "url": "https://www.seriesonlineweb.lol/generos/terror", "providerKey": "s05"}];
const GENEROS_U06_MULTI = [{"nome": "Ação", "slug": "acao", "url": "https://superseries.life/generos/acao", "providerKey": "u06"}, {"nome": "Animação", "slug": "animacao", "url": "https://superseries.life/generos/animacao", "providerKey": "u06"}, {"nome": "Aventura", "slug": "aventura", "url": "https://superseries.life/generos/aventura", "providerKey": "u06"}, {"nome": "Comédia", "slug": "comedia", "url": "https://superseries.life/generos/comedia", "providerKey": "u06"}, {"nome": "Crime", "slug": "crime", "url": "https://superseries.life/generos/crime", "providerKey": "u06"}, {"nome": "Documentário", "slug": "documentario", "url": "https://superseries.life/generos/documentario", "providerKey": "u06"}, {"nome": "Drama", "slug": "drama", "url": "https://superseries.life/generos/drama", "providerKey": "u06"}, {"nome": "Família", "slug": "familia", "url": "https://superseries.life/generos/familia", "providerKey": "u06"}, {"nome": "Fantasia", "slug": "fantasia", "url": "https://superseries.life/generos/fantasia", "providerKey": "u06"}, {"nome": "Faroeste", "slug": "faroeste", "url": "https://superseries.life/generos/faroeste", "providerKey": "u06"}, {"nome": "Ficção Científica", "slug": "ficcao-cientifica", "url": "https://superseries.life/generos/ficcao-cientifica", "providerKey": "u06"}, {"nome": "Guerra", "slug": "guerra", "url": "https://superseries.life/generos/guerra", "providerKey": "u06"}, {"nome": "História", "slug": "historia", "url": "https://superseries.life/generos/historia", "providerKey": "u06"}, {"nome": "Kids", "slug": "kids", "url": "https://superseries.life/generos/kids", "providerKey": "u06"}, {"nome": "Mistério", "slug": "misterio", "url": "https://superseries.life/generos/misterio", "providerKey": "u06"}, {"nome": "Música", "slug": "musica", "url": "https://superseries.life/generos/musica", "providerKey": "u06"}, {"nome": "Reality", "slug": "reality", "url": "https://superseries.life/generos/reality", "providerKey": "u06"}, {"nome": "Romance", "slug": "romance", "url": "https://superseries.life/generos/romance", "providerKey": "u06"}, {"nome": "Terror", "slug": "terror", "url": "https://superseries.life/generos/terror", "providerKey": "u06"}];
const GENEROS_L07_MULTI = [{"nome": "Ação", "slug": "acao", "url": "https://lisoflix.net/category/acao/", "providerKey": "l07"}, {"nome": "Action & Adventure", "slug": "action-adventure", "url": "https://lisoflix.net/category/action-adventure/", "providerKey": "l07"}, {"nome": "Animação", "slug": "animacao", "url": "https://lisoflix.net/category/animacao/", "providerKey": "l07"}, {"nome": "Aventura", "slug": "aventura", "url": "https://lisoflix.net/category/aventura/", "providerKey": "l07"}, {"nome": "Cinema TV", "slug": "cinema-tv", "url": "https://lisoflix.net/category/cinema-tv/", "providerKey": "l07"}, {"nome": "Comédia", "slug": "comedia", "url": "https://lisoflix.net/category/comedia/", "providerKey": "l07"}, {"nome": "Crime", "slug": "crime", "url": "https://lisoflix.net/category/crime/", "providerKey": "l07"}, {"nome": "Documentário", "slug": "documentario", "url": "https://lisoflix.net/category/documentario/", "providerKey": "l07"}, {"nome": "Dorama", "slug": "dorama", "url": "https://lisoflix.net/category/dorama/", "providerKey": "l07"}, {"nome": "Drama", "slug": "drama", "url": "https://lisoflix.net/category/drama/", "providerKey": "l07"}, {"nome": "Família", "slug": "familia", "url": "https://lisoflix.net/category/familia/", "providerKey": "l07"}, {"nome": "Fantasia", "slug": "fantasia", "url": "https://lisoflix.net/category/fantasia/", "providerKey": "l07"}, {"nome": "Faroeste", "slug": "faroeste", "url": "https://lisoflix.net/category/faroeste/", "providerKey": "l07"}, {"nome": "Ficção Científica", "slug": "ficcao-cientifica", "url": "https://lisoflix.net/category/ficcao-cientifica/", "providerKey": "l07"}, {"nome": "Guerra", "slug": "guerra", "url": "https://lisoflix.net/category/guerra/", "providerKey": "l07"}, {"nome": "História", "slug": "historia", "url": "https://lisoflix.net/category/historia/", "providerKey": "l07"}, {"nome": "Kids", "slug": "kids", "url": "https://lisoflix.net/category/kids/", "providerKey": "l07"}, {"nome": "Mistério", "slug": "misterio", "url": "https://lisoflix.net/category/misterio/", "providerKey": "l07"}, {"nome": "Música", "slug": "musica", "url": "https://lisoflix.net/category/musica/", "providerKey": "l07"}, {"nome": "Novelas", "slug": "novelas", "url": "https://lisoflix.net/category/novelas/", "providerKey": "l07"}, {"nome": "Reality", "slug": "reality", "url": "https://lisoflix.net/category/reality/", "providerKey": "l07"}, {"nome": "Romance", "slug": "romance", "url": "https://lisoflix.net/category/romance/", "providerKey": "l07"}, {"nome": "Sci-Fi & Fantasy", "slug": "sci-fi-fantasy", "url": "https://lisoflix.net/category/sci-fi-fantasy/", "providerKey": "l07"}, {"nome": "Soap", "slug": "soap", "url": "https://lisoflix.net/category/soap/", "providerKey": "l07"}, {"nome": "Terror", "slug": "terror", "url": "https://lisoflix.net/category/terror/", "providerKey": "l07"}, {"nome": "Thriller", "slug": "thriller", "url": "https://lisoflix.net/category/thriller/", "providerKey": "l07"}, {"nome": "Uncategorized", "slug": "uncategorized", "url": "https://lisoflix.net/category/uncategorized/", "providerKey": "l07"}];
const ROTAS_TELA = {
        telaInicio: '/',
        telaFilmes: '/filmes/',
        telaSeries: '/series/',
        telaEpisodios: '/episodios/',
        telaTemporadas: '/temporadas/',
        telaAnimes: '/animes'
    };
    let contextoBuscaMulti = { tipo: 'busca', path: '', titulo: '' };
    let paginaAtualMulti = {};

    window.CRONOS_MULTI_PROVIDERS = PROVIDERS;
    window.ORDEM_PROVEDORES = ORDEM_PROVEDORES;

    function lerStorageObj(chave, padrao){
        try {
            const salvo = JSON.parse(localStorage.getItem(chave) || '{}') || {};
            return Object.assign({}, padrao, salvo);
        } catch(e) { return Object.assign({}, padrao); }
    }
    function salvarStorageObj(chave, obj){
        try { localStorage.setItem(chave, JSON.stringify(obj || {})); } catch(e) {}
    }
    function estadoFontes(){ return lerStorageObj(STORAGE_FONTES, { b01: true, p02: true, m03: true, e04: true, s05: true, u06: true, l07: true, primeflix: true }); }
    function estadoFiltros(){ return lerStorageObj(STORAGE_FILTROS, { b01: true, p02: true, m03: true, e04: true, s05: true, u06: true, l07: true, primeflix: true }); }
    function fonteAtiva(key){ return !!estadoFontes()[key]; }
    function filtroAtivo(key){ return !!estadoFiltros()[key]; }
    function existeFonteAtiva(){ const e = estadoFontes(); return ORDEM_PROVEDORES.some(k => e[k]); }
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
        return window.__CRONOS_RENDER_PROVIDER_KEY || 'b01';
    }
    function providerLabel(key){ return (PROVIDERS[key] && PROVIDERS[key].sigla) || String(key || '').toUpperCase(); }
    function normalizarUrlCanonicaMulti(url){
        let u = String(url || '').trim().replace(/&amp;/g, '&');
        if (!u) return '';
        try { u = new URL(u, PROVIDERS[providerPorUrl(u)].base).href; } catch(e) {}
        return u.replace(/[?#].*$/, '').replace(/\/+$/, '');
    }
    function providerUrl(key, urlOuPath){
        const p = PROVIDERS[key] || PROVIDERS.b01;
        const raw = String(urlOuPath || '/').trim();
        if (!raw) return p.base;
        try {
            if (/^https?:\/\//i.test(raw) || raw.startsWith('//')) {
                const abs = raw.startsWith('//') ? ('https:' + raw) : raw;
                const u = new URL(abs);
                const hostAtual = (u.hostname || '').replace(/^www\./i, '');
                const hostProvider = (new URL(p.base).hostname || '').replace(/^www\./i, '');
                if (hostAtual && hostAtual !== hostProvider) return u.href;
                const path = (u.pathname || '/') + (u.search || '');
                return new URL(path, p.base).href;
            }
            return new URL(raw, p.base).href;
        } catch(e) { return raw || p.base; }
    }

    function slugGeneroMulti(titulo, urlBase){
        try {
            const u = new URL(urlBase, PROVIDERS.b01.base);
            const partes = (u.pathname || '').split('/').filter(Boolean);
            const idx = partes.findIndex(p => /^(categoria|category|generos|genero)$/i.test(p));
            if (idx >= 0 && partes[idx + 1]) return partes[idx + 1];
            if (partes.length) return partes[partes.length - 1];
        } catch(e) {}
        if (typeof slugCronos === 'function') return slugCronos(titulo || '');
        return String(titulo || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
    }

    function urlProviderComContexto(key, urlAlvo, idTela){
        const p = PROVIDERS[key] || PROVIDERS.b01;
        const raw = String(urlAlvo || '/');
        const tipoAtual = (contextoBuscaMulti && contextoBuscaMulti.tipo) || '';
        const tituloAtual = (contextoBuscaMulti && contextoBuscaMulti.titulo) || '';
        const eGenero = tipoAtual === 'genre' || /\/(categoria|category|generos|genero)\//i.test(raw);
        const eAno = tipoAtual === 'year' || /\/release\//i.test(raw);
        const eFilmes = idTela === 'telaFilmes' || /\/(filmes|movies)\/?/i.test(raw);
        const eSeries = idTela === 'telaSeries' || /\/series\/?/i.test(raw);
        const eEpisodios = idTela === 'telaEpisodios' || /\/(episodios|episodio)\/?/i.test(raw);
        const eAnimes = idTela === 'telaAnimes' || /\/animes\/?/i.test(raw);
        const eBusca = idTela === 'telaBusca' && /[?&]s=/.test(raw);

        if (eBusca && p.buscaPath) {
            let termo = '';
            try { termo = new URL(raw, p.base).searchParams.get('s') || ''; } catch(e) { termo = String(raw).split('s=')[1] || ''; }
            return new URL(p.buscaPath + encodeURIComponent(decodeURIComponent(termo)), p.base).href;
        }
        if (eAnimes) return key === 'primeflix' ? providerUrl(key, p.animePath || '/animes') : '';
        if (key === 'primeflix' && /\/doramas\/?/i.test(raw)) return providerUrl(key, p.doramaPath || '/doramas');

        if (eAno && p.semAno) return '';
        if (eEpisodios && p.semEpisodios) return '';
        if (eGenero && p.semCategoria) return '';
        if (eFilmes && p.filmePath) return providerUrl(key, p.filmePath);
        if (eSeries && p.seriePath) return providerUrl(key, p.seriePath);
        if (eEpisodios && p.episodioPath) return providerUrl(key, p.episodioPath);

        if (eGenero) {
            const slug = slugGeneroMulti(tituloAtual, raw);
            if (!slug) return providerUrl(key, raw);
            const baseGenero = p.generoBase || '/categoria/';
            return new URL(baseGenero.replace(/\/?$/, '/') + slug + ((key === 'm03' || key === 's05') ? '' : '/'), p.base).href;
        }

        return providerUrl(key, raw);
    }

    function montarUrlPaginadaProvider(key, urlBase, pagina){
        const base = urlProviderComContexto(key, urlBase, 'telaBusca');
        if (!base) return '';
        if (key === 'primeflix') {
            try { const u = new URL(base, PROVIDERS[key].base); u.searchParams.set('page', pagina); return u.href; } catch(e) { return base + (base.includes('?') ? '&' : '?') + 'page=' + pagina; }
        }
        try {
            const u = new URL(base);
            const termo = u.searchParams.get('s');
            if (termo !== null) return new URL(`/page/${pagina}/?s=${encodeURIComponent(termo)}`, PROVIDERS[key].base).href;
        } catch(e) {}
        return base.replace(/\/?$/, '/') + 'page/' + pagina + '/';
    }
    function resetPaginasMulti(idTela){
        paginaAtualMulti[idTela] = {};
        ORDEM_PROVEDORES.forEach(k => paginaAtualMulti[idTela][k] = 1);
        try { paginaAtual[idTela] = 1; } catch(e) {}
    }
    function statusNenhumaFonte(statusId){
        const status = document.getElementById(statusId);
        if (status) {
            status.innerText = 'Nenhuma fonte ativada.';
            status.style.display = 'block';
            status.style.color = '';
        }
    }
    function limparGrid(id){ const el = document.getElementById(id); if (el) el.innerHTML = ''; }

    function prepararItemParaProvider(item, key){
        const clone = item && item.cloneNode ? item.cloneNode(true) : item;
        if (!clone || !clone.querySelectorAll) return clone;
        clone.querySelectorAll('a[href]').forEach(a => {
            const h = a.getAttribute('href') || '';
            a.setAttribute('href', providerUrl(key, h));
        });
        clone.querySelectorAll('img').forEach(img => {
            ['src','data-src','data-lazy-src','data-original','data-wpfc-original-src'].forEach(attr => {
                const v = img.getAttribute(attr);
                if (v) img.setAttribute(attr, providerUrl(key, v));
            });
            const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset') || '';
            if (srcset) {
                const novo = srcset.split(',').map(part => {
                    const bits = part.trim().split(/\s+/);
                    if (!bits[0]) return part;
                    bits[0] = providerUrl(key, bits[0]);
                    return bits.join(' ');
                }).join(', ');
                img.setAttribute('srcset', novo);
            }
        });
        return clone;
    }

    function garantirBadgeProvider(li, key){
        if (!li || !key || !PROVIDERS[key]) return;
        li.dataset.provider = key;
        li.dataset.providerKey = key;
        li.dataset.providerName = PROVIDERS[key].nome;
        li.dataset.providerSigla = PROVIDERS[key].sigla;
        const media = li.querySelector('.card-media') || li;
        const badgeExtra = media && media.querySelector('.badge-provedor-cronos');
        if (badgeExtra) badgeExtra.remove();
        let badgeQualidade = li.querySelector('.badge-qualidade');
        if (!badgeQualidade && media) {
            badgeQualidade = document.createElement('div');
            badgeQualidade.className = 'badge-qualidade';
            media.appendChild(badgeQualidade);
        }
        if (badgeQualidade) {
            badgeQualidade.textContent = PROVIDERS[key].sigla;
            badgeQualidade.dataset.providerSigla = PROVIDERS[key].sigla;
            badgeQualidade.classList.remove('provider-bfck', 'provider-bftv', 'provider-mega', 'provider-eba', 'provider-sweb', 'provider-ssup', 'provider-liso', 'provider-prime');
            badgeQualidade.classList.add(key === 'primeflix' ? 'provider-prime' : (key === 'l07' ? 'provider-liso' : (key === 'u06' ? 'provider-ssup' : (key === 's05' ? 'provider-sweb' : (key === 'e04' ? 'provider-eba' : (key === 'm03' ? 'provider-mega' : (key === 'p02' ? 'provider-bftv' : 'provider-bfck')))))));
        }
        if (!li.__cronosProviderClickWrapped && typeof li.onclick === 'function') {
            const originalClick = li.onclick;
            li.onclick = function(ev){
                const k = li.dataset.provider || key;
                if (!fonteAtiva(k)) {
                    ev && ev.preventDefault && ev.preventDefault();
                    ev && ev.stopPropagation && ev.stopPropagation();
                    mostrarAvisoFonteDesativada(k);
                    return false;
                }
                return originalClick.call(this, ev);
            };
            li.__cronosProviderClickWrapped = true;
        }
    }

    function stampCardsNovos(grid, antes, key){
        if (!grid) return;
        Array.from(grid.children).forEach(li => {
            if (!antes || !antes.has(li)) garantirBadgeProvider(li, key || providerPorUrl(li.dataset.url));
        });
    }
    function aplicarFiltroVisualCronos(){
        const filtros = estadoFiltros();
        document.querySelectorAll('.card-item[data-provider]').forEach(card => {
            const k = card.dataset.provider;
            card.classList.toggle('cronos-provider-oculto', filtros[k] === false);
        });
        document.querySelectorAll('.premium-slide[data-provider]').forEach(slide => {
            const k = slide.dataset.provider;
            slide.classList.toggle('cronos-provider-oculto', filtros[k] === false);
        });
    }
    window.aplicarFiltroVisualCronos = aplicarFiltroVisualCronos;

    function mostrarAvisoFonteDesativada(key){
        const nome = providerLabel(key);
        const status = document.querySelector('.view-container.ativa .loading-text') || document.getElementById('statusDetalhes') || document.getElementById('statusInicio');
        if (status) {
            status.innerText = `Fonte ${nome} desativada.`;
            status.style.display = 'block';
            status.style.color = '#ffcc00';
        } else {
            alert(`Fonte ${nome} desativada.`);
        }
    }

    function atualizarBotoesProvider(){
        const fontes = estadoFontes();
        const filtros = estadoFiltros();
        ORDEM_PROVEDORES.forEach(k => {
            const p = PROVIDERS[k];
            const btnFonte = document.querySelector(`[data-cronos-fonte="${k}"]`);
            if (btnFonte) {
                btnFonte.classList.toggle('ativo', !!fontes[k]);
                btnFonte.classList.toggle('desligado', !fontes[k]);
                btnFonte.textContent = `${p.sigla} — Fonte ${fontes[k] ? 'Ativada' : 'Desativada'}`;
            }
            const btnFiltro = document.querySelector(`[data-cronos-filtro="${k}"]`);
            if (btnFiltro) {
                btnFiltro.classList.toggle('ativo', !!filtros[k]);
                btnFiltro.classList.toggle('desligado', !filtros[k]);
                btnFiltro.textContent = `${filtros[k] ? 'Mostrar' : 'Ocultar'} ${p.sigla}`;
            }
        });
    }
    function toggleFonteProvider(key){
        const fontes = estadoFontes();
        fontes[key] = !fontes[key];
        salvarStorageObj(STORAGE_FONTES, fontes);
        atualizarBotoesProvider();
        if (!existeFonteAtiva()) {
            const ativa = document.querySelector('.view-container.ativa');
            const status = ativa && ativa.querySelector('.loading-text');
            if (status) { status.innerText = 'Nenhuma fonte ativada.'; status.style.display = 'block'; }
        }
    }
    function toggleFiltroProvider(key){
        const filtros = estadoFiltros();
        filtros[key] = !filtros[key];
        salvarStorageObj(STORAGE_FILTROS, filtros);
        atualizarBotoesProvider();
        aplicarFiltroVisualCronos();
    }
    window.cronosToggleFonteProvider = toggleFonteProvider;
    window.cronosToggleFiltroProvider = toggleFiltroProvider;

    function garantirPainelProvider(){
        const cfg = document.getElementById('telaConfiguracoes');
        if (!cfg) return;
        let painel = document.getElementById('cronosMultiProviderControl');
        if (!painel) {
            painel = document.createElement('div');
            painel.id = 'cronosMultiProviderControl';
            painel.className = 'cronos-provider-panel';
            const botoesFonte = ORDEM_PROVEDORES.map(k => {
                const p = PROVIDERS[k];
                return `<button type="button" class="cronos-provider-btn" data-cronos-fonte="${k}" onclick="cronosToggleFonteProvider('${k}')">${p.sigla} — Fonte Ativada</button>`;
            }).join('');
            const botoesFiltro = ORDEM_PROVEDORES.map(k => {
                const p = PROVIDERS[k];
                return `<button type="button" class="cronos-provider-btn" data-cronos-filtro="${k}" onclick="cronosToggleFiltroProvider('${k}')">Mostrar ${p.sigla}</button>`;
            }).join('');
            painel.innerHTML = `
                <h3>Fontes dos Provedores</h3>
                <div class="cronos-provider-linha">${botoesFonte}</div>
                <h3>Filtro Visual</h3>
                <div class="cronos-provider-linha">${botoesFiltro}</div>
                <div class="cronos-provider-help">Fonte controla fetch/requisição. Filtro visual só mostra ou oculta cards já carregados. Ordem fixa: ${ORDEM_PROVEDORES.map(providerLabel).join(' → ')}.</div>
            `;
            const atalho = cfg.querySelector('.categoria-atalhos, .cronos-categoria-atalhos-letras');
            if (atalho && atalho.nextSibling) cfg.insertBefore(painel, atalho.nextSibling);
            else {
                const titulo = cfg.querySelector('h1,h2,h3');
                if (titulo && titulo.nextSibling) cfg.insertBefore(painel, titulo.nextSibling);
                else cfg.insertBefore(painel, cfg.firstChild);
            }
        }
        atualizarBotoesProvider();
    }

    const originalCarregarConfiguracoes = (typeof carregarConfiguracoes === 'function') ? carregarConfiguracoes : null;
    window.carregarConfiguracoes = function(btnElement){
        let r;
        if (originalCarregarConfiguracoes) r = originalCarregarConfiguracoes.apply(this, arguments);
        else if (typeof ativarTela === 'function') ativarTela('telaConfiguracoes', btnElement);
        garantirPainelProvider();
        setTimeout(garantirPainelProvider, 80);
        return r;
    };
    try { carregarConfiguracoes = window.carregarConfiguracoes; } catch(e) {}



    /* ===== ADAPTADOR ESPECÍFICO LISOFLIX — NÃO É DOOPLAY PADRÃO ===== */
    const LISO_ITEM_SELECTOR = '.MovieListSldCn article.TPost.A, article.TPost.B, article.TPost.A, article.TPost, .TPostMv .TPost, article.item, .search-page .item, .result-item, .TPTblCn tbody tr, .TPTblCnMvs tbody tr';
    const LISO_DESTAQUE_SELECTOR = '#featured-titles .item, .MovieListSldCn article.TPost.A, .MovieListSldCn .TPost.A, article.TPost.A';
    function lisoText(el){ return (el && (el.innerText || el.textContent) || '').replace(/\s+/g,' ').trim(); }
    function lisoAttr(el, name){ return el ? (el.getAttribute(name) || '') : ''; }
    function lisoAbsUrl(url){
        let u = String(url || '').trim();
        if(!u) return '';
        u = u.replace(/&amp;/g, '&')
             .replace(/https?:\/\/(www\.)?boraflix\.click\//ig, 'https://lisoflix.net/')
             .replace(/https?:\/\/(www\.)?boraflixtv\.com\//ig, 'https://lisoflix.net/')
             .replace(/https?:\/\/(www\.)?megacine\.boats\//ig, 'https://lisoflix.net/')
             .replace(/https?:\/\/(www\.)?ebaflix\.com\//ig, 'https://lisoflix.net/')
             .replace(/https?:\/\/(www\.)?seriesonlineweb\.lol\//ig, 'https://lisoflix.net/')
             .replace(/https?:\/\/superseries\.life\//ig, 'https://lisoflix.net/')
             .replace(/\/filmes\//g, '/movies/')
             .replace(/\/categoria\//g, '/category/')
             .replace(/\/generos\//g, '/category/')
             .replace(/\/episodios\//g, '/episodio/');
        if(u.startsWith('//')) u = 'https:' + u;
        try { return new URL(u, 'https://lisoflix.net/').href; } catch(e) { return u; }
    }
    function lisoAbsImg(url){
        let u = lisoAbsUrl(url);
        if(!u) return '';
        if(/image\.tmdb\.org\/t\/p\//i.test(u)) u = u.replace(/\/(w92|w154|w185|w300|w342|w500|w780|w1280|original)\//i, '/w500/');
        return u;
    }
    function lisoAno(txt){ const m = String(txt || '').match(/\b(19|20)\d{2}\b/); return m ? m[0] : ''; }
    function lisoLimparTitulo(t){ return String(t || '').replace(/\b(assistir|online|gratis|grátis|dublado|legendado|dual audio|hd|full hd)\b/ig, ' ').replace(/\s+/g,' ').trim(); }
    function lisoTipoPorUrl(url, item){
        const u = String(url || '').toLowerCase();
        const c = String(item && item.className || '').toLowerCase();
        if(u.includes('/episodio/') || c.includes('episode')) return 'Episódio';
        if(u.includes('/movies/') || c.includes('movie')) return 'Filme';
        if(u.includes('/series/') || c.includes('tvshow') || c.includes('serie')) return 'Série';
        return 'Série';
    }
    function lisoPegarImagem(el){
        if(!el) return '';
        const attrs = ['data-src','data-lazy-src','data-original','data-wpfc-original-src','src','content'];
        for(const a of attrs){
            const v = lisoAttr(el,a);
            if(v && !/rating|star|blank|placeholder|sprite/i.test(v)) return v;
        }
        const srcset = lisoAttr(el,'srcset') || lisoAttr(el,'data-srcset');
        if(srcset){
            const first = srcset.split(',').map(p => p.trim().split(/\s+/)[0]).find(Boolean);
            if(first) return first;
        }
        const style = lisoAttr(el,'style');
        const m = style.match(/url\(["']?([^"')]+)["']?\)/i);
        return m ? m[1] : '';
    }
    function extrairDadosCardLiso(item){
        if(!item) return null;
        let url='', titulo='', img='', ano='', tipo='Série';
        if(item.tagName && item.tagName.toLowerCase() === 'tr'){
            const link = item.querySelector('.MvTbTtl a, a[href]');
            if(!link) return null;
            url = lisoAbsUrl(lisoAttr(link,'href') || link.href);
            titulo = lisoLimparTitulo(lisoText(link));
            img = lisoAbsImg(lisoPegarImagem(item.querySelector('.MvTbImg img, img')));
            ano = lisoAno(lisoText(item));
            const tds = item.querySelectorAll('td');
            const tipoTxt = tds.length >= 4 ? lisoText(tds[3]) : '';
            tipo = /filme|movie/i.test(tipoTxt) || url.includes('/movies/') ? 'Filme' : (url.includes('/episodio/') ? 'Episódio' : 'Série');
        } else {
            const link = item.querySelector('a[href]');
            if(!link) return null;
            url = lisoAbsUrl(lisoAttr(link,'href') || link.href);
            const titleEl = item.querySelector('h1.Title, h2.Title, h3.Title, .Title, h3, .title, .Name, .MvTbTtl a, a[title]');
            titulo = lisoLimparTitulo(lisoText(titleEl) || lisoAttr(link,'title') || lisoText(link));
            const imgs = item.querySelectorAll('.Image img, figure img, img.TPostBg, img.imglazy, img');
            for(const im of imgs){
                const got = lisoPegarImagem(im);
                if(got){ img = lisoAbsImg(got); break; }
            }
            if(!img){
                const bg = item.querySelector('.TPostBg, .Image, figure, [style*="background"]');
                img = lisoAbsImg(lisoPegarImagem(bg));
            }
            ano = lisoAno(lisoText(item.querySelector('.Date, span.Date, .year, .Info span.Date, time')) || lisoText(item));
            tipo = lisoTipoPorUrl(url, item);
        }
        if(!url || !titulo) return null;
        if(!img && typeof placeholderCronosPoster === 'function') img = placeholderCronosPoster();
        const isMovie = tipo === 'Filme';
        return {
            id: 'l07::' + url.replace(/[?#].*$/,'').replace(/\/+$/,''),
            url, titulo, ano, img, poster: img, backdrop: img,
            tipo, isMovie, isSerie: tipo === 'Série', qualidade: 'LISO',
            providerKey: 'l07', providerName: 'Fonte LISO', providerSigla: 'LISO', baseUrl: 'https://lisoflix.net/'
        };
    }
    function renderizarItemLisoNoGrid(item, gridId){
        if (item && item.closest && item.closest('.MovieListSldCn, #slider-movies, #slider-tvshows, .slider, .featured, aside, .sidebar, .widget')) return 0;
        const grid = document.getElementById(gridId);
        if(!grid) return 0;
        const dados = extrairDadosCardLiso(item);
        if(!dados) return 0;
        let tipoForcado = '';
        try { tipoForcado = (typeof filtroTipoGridAtual !== 'undefined' && filtroTipoGridAtual[gridId]) ? filtroTipoGridAtual[gridId] : ''; } catch(e) {}
        if(!tipoForcado){
            if(gridId === 'gridFilmes' || gridId === 'gridInicioFilmes') tipoForcado = 'filme';
            if(gridId === 'gridSeries' || gridId === 'gridInicioSeries') tipoForcado = 'serie';
            if(gridId === 'gridEpisodios' || gridId === 'gridInicioEpisodios') tipoForcado = 'episodio';
        }
        if(tipoForcado === 'filme' && dados.tipo !== 'Filme') return 0;
        if(tipoForcado === 'serie' && dados.tipo !== 'Série') return 0;
        if(tipoForcado === 'episodio' && dados.tipo !== 'Episódio') return 0;
        const canon = dados.url.replace(/[?#].*$/,'').replace(/\/+$/,'');
        const ja = Array.from(grid.querySelectorAll('[data-url]')).some(li => String(li.dataset.url || '').replace(/[?#].*$/,'').replace(/\/+$/,'') === canon && li.dataset.provider === 'l07');
        if(ja) return 0;
        const li = document.createElement('li');
        li.className = 'card-item ' + (dados.tipo === 'Episódio' ? 'episodio-home-card' : 'global-card');
        li.dataset.url = dados.url;
        li.dataset.provider = 'l07';
        li.dataset.providerKey = 'l07';
        li.dataset.providerName = 'Fonte LISO';
        li.dataset.providerSigla = 'LISO';
        const badgeClass = dados.tipo === 'Filme' ? 'badge-filme' : 'badge-serie';
        const tituloSafe = String(dados.titulo || '').replace(/"/g,'&quot;');
        const imgFinal = dados.img || (typeof placeholderCronosPoster === 'function' ? placeholderCronosPoster() : '');
        li.dataset.poster = imgFinal;
        li.innerHTML = `
            <div class="card-media">
                <div class="badge-tipo ${badgeClass}">${dados.tipo}</div>
                <div class="badge-qualidade provider-liso">LISO</div>
                ${dados.ano ? `<div class="badge-ano-card">${dados.ano}</div>` : ''}
                <img src="${imgFinal}" alt="${tituloSafe}" loading="lazy">
            </div>
            <h3>${dados.titulo}</h3>
            <span class="ano-card"></span>
        `;
        li.onclick = function(){
            const prev = window.__CRONOS_RENDER_PROVIDER_KEY;
            window.__CRONOS_RENDER_PROVIDER_KEY = 'l07';
            window.__CRONOS_LAST_PROVIDER_RENDERED = 'l07';
            try { analisarObra(dados.url, dados.ano || '', dados.titulo, imgFinal, dados.isMovie); }
            finally { setTimeout(() => { window.__CRONOS_RENDER_PROVIDER_KEY = prev; }, 50); }
        };
        grid.appendChild(li);
        try {
            if (dados.tipo !== 'Episódio' && gridId !== 'gridFavoritos' && gridId !== 'gridHistorico' && typeof adicionarBotaoFavoritarHoverCronos === 'function') {
                adicionarBotaoFavoritarHoverCronos(li, { ...dados, img: imgFinal, poster: imgFinal, providerKey: 'l07', providerName: 'Fonte LISO', providerSigla: 'LISO', baseUrl: 'https://lisoflix.net/' });
            }
        } catch(e) {}
        try { if(typeof salvarObraCronos === 'function' && dados.tipo !== 'Episódio') salvarObraCronos(dados); } catch(e) {}
        aplicarFiltroVisualCronos();
        return 1;
    }
    function seletorItensProvider(key, idTela){
        if(key === 'primeflix') return PRIME_CARD_SELECTOR;
        if(key === 'l07') return LISO_ITEM_SELECTOR;
        return (typeof obterSeletorItensCronos === 'function') ? obterSeletorItensCronos(idTela) : '#archive-content .item, article.item, .items .item';
    }

    async function renderizarItemProvider(item, gridId, key){
        if (key === 'primeflix') return renderizarItemPrimeNoGrid(item, gridId);
        if (key === 'l07') return renderizarItemLisoNoGrid(item, gridId);
        const grid = document.getElementById(gridId);
        if (!grid) return 0;
        const antes = new Set(Array.from(grid.children));
        const prev = window.__CRONOS_RENDER_PROVIDER_KEY;
        window.__CRONOS_LAST_PROVIDER_RENDERED = key;
        window.__CRONOS_RENDER_PROVIDER_KEY = key;
        try {
            const clone = prepararItemParaProvider(item, key);
            renderizarItemNoGrid(clone, gridId);
        } catch(e) { console.warn('Falha ao renderizar item do provider', key, e); }
        finally { window.__CRONOS_RENDER_PROVIDER_KEY = prev; }
        let adicionados = 0;
        Array.from(grid.children).forEach(li => {
            if (!antes.has(li)) { garantirBadgeProvider(li, key); adicionados++; }
        });
        aplicarFiltroVisualCronos();
        return adicionados;
    }

    const originalPreencherCard = (typeof preencherCardObraCronos === 'function') ? preencherCardObraCronos : null;
    if (originalPreencherCard) {
        window.preencherCardObraCronos = function(li, dados, gridId){
            const ret = originalPreencherCard.apply(this, arguments);
            const key = (dados && dados.providerKey && PROVIDERS[dados.providerKey]) ? dados.providerKey : (li && li.dataset && li.dataset.provider) || providerPorUrl(dados && dados.url);
            garantirBadgeProvider(li, key);
            aplicarFiltroVisualCronos();
            return ret;
        };
        try { preencherCardObraCronos = window.preencherCardObraCronos; } catch(e) {}
    }

    const originalRenderEp = (typeof renderizarEpisodioCronos === 'function') ? renderizarEpisodioCronos : null;
    if (originalRenderEp) {
        window.renderizarEpisodioCronos = function(item, gridId, urlString){
            const grid = document.getElementById(gridId);
            const antes = grid ? new Set(Array.from(grid.children)) : null;
            const key = window.__CRONOS_RENDER_PROVIDER_KEY || providerPorUrl(urlString);
            const ret = originalRenderEp.apply(this, arguments);
            stampCardsNovos(grid, antes, key);
            aplicarFiltroVisualCronos();
            return ret;
        };
        try { renderizarEpisodioCronos = window.renderizarEpisodioCronos; } catch(e) {}
    }

    const originalRenderTemp = (typeof renderizarTemporadaCronos === 'function') ? renderizarTemporadaCronos : null;
    if (originalRenderTemp) {
        window.renderizarTemporadaCronos = function(item, gridId){
            const grid = document.getElementById(gridId);
            const antes = grid ? new Set(Array.from(grid.children)) : null;
            const key = window.__CRONOS_RENDER_PROVIDER_KEY || 'b01';
            const ret = originalRenderTemp.apply(this, arguments);
            stampCardsNovos(grid, antes, key);
            aplicarFiltroVisualCronos();
            return ret;
        };
        try { renderizarTemporadaCronos = window.renderizarTemporadaCronos; } catch(e) {}
    }

    const originalAtualizarPremium = (typeof atualizarDestaquePremium === 'function') ? atualizarDestaquePremium : null;
    if (originalAtualizarPremium) {
        window.atualizarDestaquePremium = function(novoIndex){
            const ret = originalAtualizarPremium.apply(this, arguments);
            const box = document.getElementById('premiumSlides');
            if (box && Array.isArray(destaquesPremiumHome)) {
                Array.from(box.children).forEach((slide, idx) => {
                    const obra = destaquesPremiumHome[idx] || {};
                    const key = obra.providerKey || providerPorUrl(obra.url);
                    slide.dataset.provider = key;
                    slide.dataset.providerLabel = providerLabel(key);
                });
                aplicarFiltroVisualCronos();
            }
            return ret;
        };
        try { atualizarDestaquePremium = window.atualizarDestaquePremium; } catch(e) {}
    }

    async function fetchHtmlEPreencherProvider(urlAlvo, gridId, statusId, idTela, key){
        const grid = document.getElementById(gridId);
        const status = document.getElementById(statusId);
        const btnMais = (typeof obterBotaoMaisCronos === 'function') ? obterBotaoMaisCronos(idTela) : null;
        if (!grid || !fonteAtiva(key)) return 0;
        try {
            if (status) { status.innerText = `Carregando ${providerLabel(key)}...`; status.style.display = 'block'; status.style.color = ''; }
            const urlFinal = urlProviderComContexto(key, urlAlvo, idTela);
            if (!urlFinal) return 0;
            const res = await fetch(PROXY + encodeURIComponent(urlFinal));
            const html = await res.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const seletor = seletorItensProvider(key, idTela);
            const itens = doc.querySelectorAll(seletor);
            let total = 0;
            for (const item of itens) total += await renderizarItemProvider(item, gridId, key);
            if (btnMais && total > 0) { btnMais.style.display = 'block'; btnMais.disabled = false; }
            if (status) status.style.display = grid.children.length ? 'none' : 'block';
            aplicarFiltroVisualCronos();
            return total;
        } catch(err) {
            console.warn('Erro provider', key, urlAlvo, err);
            if (status) { status.innerText = `Erro em ${providerLabel(key)}. Continuando...`; status.style.display = 'block'; }
            return 0;
        }
    }

    window.fetchHtmlEPreencherProvider = fetchHtmlEPreencherProvider;

    async function fetchHtmlEPreencherMulti(urlAlvo, gridId, statusId, idTela){
        if (!existeFonteAtiva()) { statusNenhumaFonte(statusId); return 0; }
        let total = 0;
        for (const key of ORDEM_PROVEDORES) {
            if (!fonteAtiva(key)) continue;
            try { total += await fetchHtmlEPreencherProvider(urlAlvo, gridId, statusId, idTela, key); }
            catch(e) { console.warn('Provider falhou e foi ignorado:', key, e); }
        }
        const status = document.getElementById(statusId);
        if (status && total === 0) { status.innerText = 'Nenhum resultado encontrado nas fontes ativas.'; status.style.display = 'block'; }
        aplicarFiltroVisualCronos();
        return total;
    }
    window.fetchHtmlEPreencher = fetchHtmlEPreencherMulti;
    try { fetchHtmlEPreencher = fetchHtmlEPreencherMulti; } catch(e) {}

    async function renderizarEpisodiosHomeProvider(doc, key){
        const grid = document.getElementById('gridInicioEpisodios');
        const head = document.getElementById('headEpisodiosRecentes');
        if (!grid || !doc || !fonteAtiva(key)) return 0;
        const seletores = key === 'l07' ? LISO_ITEM_SELECTOR : '#dt-episodes .item, .episodes .item, .episodios .item, article.episodes, article.episode';
        let countProvider = grid.querySelectorAll(`.card-item[data-provider="${key}"]`).length;
        let total = 0;
        for (const item of doc.querySelectorAll(seletores)) {
            if (countProvider >= 12) break;
            const add = await renderizarItemProvider(item, 'gridInicioEpisodios', key);
            if (add) {
                countProvider += add;
                total += add;
            }
        }
        if (head) head.style.display = grid.children.length ? 'flex' : 'none';
        aplicarFiltroVisualCronos();
        return total;
    }


    /* ===== LISOFLIX — DESTAQUE PREMIUM REAL DA HOME =====
       O Lisoflix NÃO usa a lista de filmes/séries normais para o Premium.
       Ele usa somente #featured-titles .item e depois entra na página interna
       para buscar backdrop, sinopse, ano, gêneros e poster. */
    function lisoEscapeHtml(txt){
        return String(txt || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    function lisoLimparSinopsePremium(txt){
        return String(txt || '')
            .replace(/Assistir\s+/gi, '')
            .replace(/\s+online\s*/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    function lisoExtrairImagemDetalhe(doc, modo){
        const candidatos = [];
        const add = (v) => { if(v && !/rating|star|blank|placeholder|sprite/i.test(String(v))) candidatos.push(v); };
        const pegarDeEl = (el) => {
            if(!el) return;
            ['data-src','data-lazy-src','data-original','data-wpfc-original-src','src','content'].forEach(a => add(el.getAttribute && el.getAttribute(a)));
            const srcset = (el.getAttribute && (el.getAttribute('srcset') || el.getAttribute('data-srcset'))) || '';
            if(srcset) srcset.split(',').forEach(p => add(p.trim().split(/\s+/)[0]));
            const st = (el.getAttribute && el.getAttribute('style')) || '';
            const m = st.match(/url\(["']?([^"')]+)["']?\)/i);
            if(m && m[1]) add(m[1]);
        };
        const posterSel = '.poster img, .dt_poster img, .sheader .poster img, .imagen img, .Image img, figure img, img.TPostBg, meta[property="og:image"]';
        const backdropSel = '.backdrop, .backdrop img, .fanart, .fanart img, .dt_backdrop, .dt_backdrop img, .sheader, .single-cover, [style*="background"], meta[property="og:image"]';
        doc.querySelectorAll(modo === 'backdrop' ? backdropSel : posterSel).forEach(pegarDeEl);
        const normalizados = candidatos
            .map(u => modo === 'backdrop' ? normalizarBackdropOriginal(lisoAbsImg(u)) : normalizarImagemCard(lisoAbsImg(u)))
            .filter(Boolean)
            .filter(u => !(typeof imagemEhPlaceholderCronos === 'function' && imagemEhPlaceholderCronos(u)));
        if(modo === 'backdrop'){
            return normalizados.find(u => /backdrop|w780|w1280|original/i.test(u)) || normalizados[0] || '';
        }
        const bom = normalizados.find(u => (typeof posterBomCronos === 'function' ? posterBomCronos(u) : true));
        return bom || normalizados[0] || '';
    }
    function lisoExtrairSinopseDetalhePremium(doc){
        const seletores = [
            '.wp-content p', '.sinopse p', '.synopsis p', '.description p', '.overview p',
            '#info .wp-content p', '.entry-content p', '.Description p', '.Description', '.TPost .Description'
        ];
        for(const sel of seletores){
            const el = doc.querySelector(sel);
            if(!el) continue;
            const txt = lisoLimparSinopsePremium(el.innerText || el.textContent || '');
            if(txt && txt.length > 20) return txt;
        }
        const meta = doc.querySelector('meta[name="description"]')?.getAttribute('content') || doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
        return lisoLimparSinopsePremium(meta);
    }
    function lisoExtrairGenerosDetalhePremium(doc){
        const generos = [];
        doc.querySelectorAll('.sgeneros a, .genres a, .Genre a, a[href*="/category/"]').forEach(a => {
            const t = lisoText(a);
            if(t && !generos.includes(t)) generos.push(t);
        });
        return generos;
    }
    async function lisoExtrairDetalhesDestaquePremium(urlObra){
        const url = lisoAbsUrl(urlObra);
        const prev = window.__CRONOS_RENDER_PROVIDER_KEY;
        window.__CRONOS_RENDER_PROVIDER_KEY = 'l07';
        window.__CRONOS_LAST_PROVIDER_RENDERED = 'l07';
        try {
            const res = await fetch(PROXY + encodeURIComponent(url));
            const html = await res.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            let titulo = lisoText(doc.querySelector('h1.Title, h1[itemprop="name"], h1, .Title'));
            titulo = lisoLimparTitulo(titulo);
            const poster = lisoExtrairImagemDetalhe(doc, 'poster');
            const backdrop = lisoExtrairImagemDetalhe(doc, 'backdrop');
            const sinopse = lisoExtrairSinopseDetalhePremium(doc);
            const ano = lisoAno((doc.querySelector('.date, .year, time, .Date')?.innerText || '') + ' ' + (doc.body?.innerText?.slice(0, 2500) || ''));
            const generos = lisoExtrairGenerosDetalhePremium(doc);
            const tipo = url.includes('/movies/') ? 'Filme' : (url.includes('/episodio/') ? 'Episódio' : 'Série');
            return {
                titulo: titulo || undefined,
                img: poster || undefined,
                poster: poster || undefined,
                backdrop: backdrop || poster || '',
                sinopse: sinopse || '',
                ano: ano || undefined,
                generos,
                tipo,
                isMovie: tipo === 'Filme',
                isSerie: tipo === 'Série'
            };
        } catch(e) {
            console.warn('Falha ao enriquecer destaque LISO:', url, e);
            return {};
        } finally {
            window.__CRONOS_RENDER_PROVIDER_KEY = prev;
        }
    }
    function lisoTituloPorUrl(url){
        try {
            const u = new URL(url, 'https://lisoflix.net/');
            const partes = u.pathname.split('/').filter(Boolean);
            let slug = partes[partes.length - 1] || '';
            return lisoLimparTitulo(slug.replace(/-/g, ' '));
        } catch(e) { return ''; }
    }
    function lisoExtrairBasicoDestaquePremium(item){
        if(!item) return null;
        const linkEl = item.querySelector('a[href]');
        if(!linkEl) return null;
        const url = lisoAbsUrl(linkEl.getAttribute('href') || linkEl.href || '');
        if(!url || !/lisoflix\.net/i.test(url)) return null;

        const titleEl = item.querySelector('h3, h2, .title, .Title, .name, .Name, a[title]');
        let titulo = lisoLimparTitulo(
            lisoText(titleEl) ||
            linkEl.getAttribute('title') ||
            item.getAttribute('title') ||
            item.querySelector('img')?.getAttribute('alt') ||
            lisoTituloPorUrl(url)
        );
        if(!titulo) titulo = lisoTituloPorUrl(url) || 'Destaque LISO';

        const candidatosImg = [];
        const add = (v) => { if(v && !/rating|star|blank|placeholder|sprite/i.test(String(v))) candidatosImg.push(v); };
        item.querySelectorAll('.poster img, .image .poster img, img[itemprop="image"], .Image img, figure img, img.TPostBg, img').forEach(img => {
            ['data-src','data-lazy-src','data-original','data-wpfc-original-src','src'].forEach(a => add(img.getAttribute(a)));
            const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset') || '';
            if(srcset) srcset.split(',').forEach(p => add(p.trim().split(/\s+/)[0]));
        });
        item.querySelectorAll('[style*="background"]').forEach(el => {
            const st = el.getAttribute('style') || '';
            const m = st.match(/url\(["']?([^"')]+)["']?\)/i);
            if(m && m[1]) add(m[1]);
        });
        let img = candidatosImg.map(lisoAbsImg).map(u => normalizarImagemCard(u)).filter(Boolean).find(u => !(typeof imagemEhPlaceholderCronos === 'function' && imagemEhPlaceholderCronos(u))) || '';
        const tipo = url.includes('/movies/') ? 'Filme' : (url.includes('/episodio/') ? 'Episódio' : 'Série');
        const ano = lisoAno(lisoText(item));
        return {
            id: 'l07::' + url.replace(/[?#].*$/,'').replace(/\/+$/,''),
            url, titulo, ano,
            img, poster: img, backdrop: img,
            tipo, isMovie: tipo === 'Filme', isSerie: tipo === 'Série',
            qualidade: 'LISO', providerKey:'l07', providerName:'Fonte LISO', providerSigla:'LISO', baseUrl:'https://lisoflix.net/'
        };
    }
    async function lisoAdicionarDestaquePremium(item, enriquecer = true){
        let dados = lisoExtrairBasicoDestaquePremium(item);
        if(!dados || !dados.url) return 0;
        if(enriquecer){
            try {
                await migrarLocalStorageParaIndexedDB();
                const salvo = await dbGet('obras', gerarIdCronos(dados.url));
                const completo = salvo && escolherPosterSeguroCronos(salvo.poster, salvo.img) && salvo.backdrop && salvo.sinopse;
                if(completo){
                    dados = { ...dados, ...salvo, providerKey:'l07', providerName:'Fonte LISO', providerSigla:'LISO', baseUrl:'https://lisoflix.net/' };
                } else {
                    const detalhes = await lisoExtrairDetalhesDestaquePremium(dados.url);
                    dados = { ...(salvo || {}), ...dados, ...detalhes, providerKey:'l07', providerName:'Fonte LISO', providerSigla:'LISO', baseUrl:'https://lisoflix.net/' };
                }
                dados.img = escolherPosterSeguroCronos(dados.poster, dados.img) || dados.poster || dados.img || '';
                dados.poster = dados.img || dados.poster || '';
                dados.backdrop = normalizarBackdropOriginal(dados.backdrop || dados.fundo || dados.img || dados.poster || '');
                await salvarObraCronos(dados);
            } catch(e) {
                console.warn('Falha cache/detalhe destaque LISO:', e);
            }
        }
        dados.providerKey = 'l07';
        dados.providerName = 'Fonte LISO';
        dados.providerSigla = 'LISO';
        dados.baseUrl = 'https://lisoflix.net/';
        const canon = dados.url.replace(/[?#].*$/,'').replace(/\/+$/,'');
        const ja = destaquesPremiumHome.some(o => String(o.url || '').replace(/[?#].*$/,'').replace(/\/+$/,'') === canon && o.providerKey === 'l07');
        if(!ja) destaquesPremiumHome.push(dados);
        return ja ? 0 : 1;
    }



    /* ===== ADAPTADOR ESPECÍFICO PRIMEFLIX — CARDS, HOME, PREMIUM, FICHA E PLAYER PRÓPRIOS ===== */
    const PRIME_KEY = 'primeflix';
    const PRIME_BASE = 'https://primeflix.mom/';
    const PRIME_PLAYER_APIS = ['warezcdn.lat', 'superflixapi.best', 'superflixapi.online'];
    const PRIME_CARD_SELECTOR = 'a[class*="group/card"], div[class*="group/card"], article[class*="group/item"], article.relative, .swiper-slide article, .swiper-slide a, article, [data-contentid]';
    function primeText(el){ return (el && (el.innerText || el.textContent) || '').replace(/\s+/g,' ').trim(); }
    function primeHtmlDecode(s){ try { const t=document.createElement('textarea'); t.innerHTML=s||''; return t.value; } catch(e){ return s || ''; } }
    function primeAbs(url){
        let u = String(url || '').trim().replace(/&amp;/g,'&');
        if(!u) return '';
        if(u.startsWith('//')) u = 'https:' + u;
        try { return new URL(u, PRIME_BASE).href; } catch(e) { return u; }
    }
    function primeImg(url, size){
        let u = primeAbs(url || '');
        if(!u || /^data:image/i.test(u) || /blank|placeholder|logo|avatar|icon|rating|svg\+xml/i.test(u)) return '';
        u = u.replace(/^https:\/\/d1muf25xaso8hp\.cloudfront\.net\/https:\/\//i, 'https://').replace(/^http:\/\//i, 'https://');
        if(/image\.tmdb\.org\/t\/p\//i.test(u)) u = u.replace(/\/t\/p\/(w92|w154|w185|w300|w342|w500|w780|w1280|original)\//i, '/t/p/' + (size || 'w500') + '/');
        return u;
    }
    function primeTipoPorUrl(url){
        const u = String(url || '').toLowerCase();
        if(u.includes('/filme/')) return 'Filme';
        if(u.includes('/anime/')) return 'Anime';
        if(u.includes('/dorama/')) return 'Dorama';
        if(u.includes('/episodio/')) return 'Episódio';
        if(u.includes('/serie/')) return 'Série';
        return 'Série';
    }
    function primeEhFilme(url){ return String(url || '').includes('/filme/'); }
    function primeLimparTitulo(t){
        return String(t || '')
            .replace(/\b(Assistir|Online|Grátis|Gratis|Dublado|Legendado|Dual Audio|HD|FHD|4K)\b/gi,' ')
            .replace(/\s+[-|]\s+Primeflix.*$/i,'')
            .replace(/\s+/g,' ')
            .trim();
    }
    function primeAno(txt){ const m = String(txt || '').match(/\b(19|20)\d{2}\b/); return m ? m[0] : ''; }
    function primeKeyUrl(url){ return primeAbs(url).split('#')[0].replace(/[?#].*$/,'').replace(/\/+$/,''); }
    function primeImagemElemento(root, size){
        if(!root) return '';
        const imgs = Array.from(root.querySelectorAll ? root.querySelectorAll('img') : []);
        for(const img of imgs){
            let src = img.getAttribute('data-src') || img.getAttribute('src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-original') || '';
            const limpo = primeImg(src, size || 'w500');
            if(limpo) return limpo;
        }
        const html = ((root.getAttribute && root.getAttribute('style')) || '') + '\n' + (root.innerHTML || '');
        const m = html.match(/background-image\s*:\s*url\((['"]?)(.*?)\1\)/i) || html.match(/url\((['"]?)(https?:\/\/[^'")]+)\1\)/i);
        return m ? primeImg(m[2], size || 'w500') : '';
    }
    function primeBackdropElemento(root){ return primeImagemElemento(root, 'original'); }
    function primeTituloCard(root, link){
        let t = root?.querySelector('img[alt]')?.getAttribute('alt') || '';
        if(!t || /poster|backdrop|assista|epis[oó]dio/i.test(t)) t = '';
        if(!t) t = root?.querySelector('h3[title]')?.getAttribute('title') || '';
        if(!t) t = primeText(root?.querySelector('h3 a, h3, h2 a, h2, .title'));
        if(!t) t = link?.getAttribute('title') || primeText(link);
        return primeLimparTitulo(t);
    }
    function primeDataCurta(data){
        const s = String(data || '').trim();
        const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
        if(!m) return s;
        const meses = ['Jan.','Feb.','Mar.','Apr.','May','Jun.','Jul.','Aug.','Sep.','Oct.','Nov.','Dec.'];
        const d = String(parseInt(m[1],10));
        const mes = meses[Math.max(0, Math.min(11, parseInt(m[2],10)-1))];
        const ano = m[3].length === 2 ? '20' + m[3] : m[3];
        return `${mes} ${d}, ${ano}`;
    }
    function primeTextosFolha(el){
        const arr = [];
        try {
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode(node){ const t=String(node.nodeValue||'').replace(/\s+/g,' ').trim(); return t ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
            let n; while((n = walker.nextNode())) arr.push(String(n.nodeValue || '').replace(/\s+/g,' ').trim());
        } catch(e) {}
        return arr;
    }
    function primeLimparLinhaEp(t){
        return primeLimparTitulo(String(t || '')
            .replace(/\bNovo\b/gi,'')
            .replace(/\b(?:S[ée]rie|Anime|Dorama|Filme)\b/gi,'')
            .replace(/\b(?:LEG|DUB)\b/gi,'')
            .replace(/\bT\s*\d+\s*:\s*E\s*\d+\b/gi,'')
            .replace(/\bS\s*\d+\s*[-–:]?\s*Epis[oó]dio\s*\d+\b/gi,'')
            .replace(/\bEpis[oó]dio\s*\d+\b/gi,'')
            .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,'')
            .replace(/\s+/g,' ').trim());
    }
    function primeValidoSerie(t){
        if(!t || t.length < 3 || t.length > 90) return false;
        if(/^(novo|leg|dub|s[ée]rie|anime|dorama|filme|epis[oó]dio)$/i.test(t)) return false;
        if(/^epis[oó]dio\s*\d+$/i.test(t) || /^T\s*\d+\s*:\s*E\s*\d+$/i.test(t)) return false;
        if(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(t)) return false;
        return true;
    }
    function primeDadosEpisodio(root, url){
        const bruto = primeText(root || {});
        const linhas = primeTextosFolha(root);
        let temporada = '', episodio = '', serieTitulo = '', tituloEp = '';
        const mTE = bruto.match(/T\s*(\d{1,2})\s*:\s*E\s*(\d{1,3})/i) || String(url || '').match(/(\d{1,2})x(\d{1,3})(?:\D|$)/i);
        if(mTE){ temporada = mTE[1]; episodio = mTE[2]; }
        const imgAlt = root?.querySelector('img[alt]')?.getAttribute('alt') || '';
        const mAlt = imgAlt.match(/Epis[oó]dio\s*(\d{1,3})/i);
        if(!episodio && mAlt) episodio = mAlt[1];
        const dataRaw = linhas.find(t => /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(t)) || (bruto.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/) || [''])[0] || '';
        for(let i=0;i<linhas.length;i++){
            const m = linhas[i].match(/^T\s*(\d{1,2})\s*:\s*E\s*(\d{1,3})$/i);
            if(m){
                temporada = temporada || m[1]; episodio = episodio || m[2];
                for(let j=i+1;j<Math.min(linhas.length, i+5);j++){ const prox = primeLimparLinhaEp(linhas[j]); if(primeValidoSerie(prox)){ serieTitulo = prox; break; } }
                if(serieTitulo) break;
            }
        }
        if(imgAlt && !/^Epis[oó]dio\s*\d+$/i.test(imgAlt) && !/poster|backdrop/i.test(imgAlt)) tituloEp = primeLimparTitulo(imgAlt);
        if(!tituloEp){ const linhaTitulo = linhas.map(x => primeLimparTitulo(x)).find(x => /^Epis[oó]dio\s*\d+/i.test(x)); if(linhaTitulo) tituloEp = linhaTitulo; }
        if(!serieTitulo){ const candidatos = linhas.map(primeLimparLinhaEp).filter(primeValidoSerie).sort((a,b)=>a.length-b.length); serieTitulo = candidatos[0] || ''; }
        if(!serieTitulo){ let slug = String(url || '').split('/episodio/')[1] || ''; slug = slug.split(/[?#]/)[0].replace(/-?\d+x\d+.*$/i,'').replace(/-/g,' ').trim(); if(slug) serieTitulo = slug.replace(/\b\w/g, c => c.toUpperCase()); }
        if(!tituloEp) tituloEp = episodio ? `Episódio ${parseInt(episodio,10)}` : 'Episódio';
        return { temporada: String(temporada || '1'), episodio: episodio ? String(parseInt(episodio,10)) : '', data: primeDataCurta(dataRaw), tituloEp, serieTitulo: primeLimparLinhaEp(serieTitulo) };
    }
    function primeExtrairCards(docOrRoot, filtro){
        const roots = Array.from(docOrRoot.querySelectorAll ? docOrRoot.querySelectorAll(PRIME_CARD_SELECTOR) : []);
        const cards = [], vistos = new Set();
        const linkSelector = 'a[href*="/filme/"],a[href*="/serie/"],a[href*="/anime/"],a[href*="/dorama/"],a[href*="/episodio/"]';
        function aceitar(url){
            if(!url) return false;
            if(filtro === 'filmes') return url.includes('/filme/');
            if(filtro === 'series') return url.includes('/serie/') || url.includes('/dorama/');
            if(filtro === 'animes') return url.includes('/anime/');
            if(filtro === 'episodios') return url.includes('/episodio/');
            return /\/(filme|serie|anime|dorama|episodio)\//.test(url);
        }
        for(const root of roots){
            const link = (root.matches && root.matches(linkSelector)) ? root : root.querySelector(linkSelector);
            const url = primeAbs(link && link.getAttribute('href'));
            if(!aceitar(url)) continue;
            const k = primeKeyUrl(url); if(vistos.has(k)) continue;
            const tipo = primeTipoPorUrl(url);
            const ep = tipo === 'Episódio' ? primeDadosEpisodio(root, url) : null;
            const titulo = ep ? (ep.tituloEp || 'Episódio') : primeTituloCard(root, link);
            if(!titulo || titulo.length < 2) continue;
            let img = primeImagemElemento(root, tipo === 'Episódio' ? 'w780' : 'w500');
            cards.push({
                id: PRIME_KEY + '::' + k, url, titulo, ano: primeAno(primeText(root)), img, poster: img, backdrop: tipo === 'Episódio' ? img : '', tipo,
                isMovie: tipo === 'Filme', isSerie: tipo !== 'Filme', qualidade: 'PRIME',
                serieTitulo: ep ? ep.serieTitulo : '', temporada: ep ? ep.temporada : '', episodio: ep ? ep.episodio : '', data: ep ? ep.data : '',
                providerKey: PRIME_KEY, providerName: 'Fonte PRIME', providerSigla: 'PRIME', baseUrl: PRIME_BASE
            });
            vistos.add(k);
        }
        return cards;
    }
    function primeSecao(doc, seletor){ const swiper = doc.querySelector(seletor); return swiper ? (swiper.closest('section') || swiper) : null; }
    function primeCardsDaSecao(doc, seletor, filtro){ const sec = primeSecao(doc, seletor); return sec ? primeExtrairCards(sec, filtro) : []; }
    function primeExtrairHero(doc){
        const links = Array.from(doc.querySelectorAll('a[href*="/filme/"],a[href*="/serie/"],a[href*="/anime/"],a[href*="/dorama/"]'));
        const out = [], vistos = new Set();
        for(const link of links){
            const root = link.closest('[x-show*="active"], .absolute.inset-0.w-full.h-full, .absolute.inset-0') || link.closest('section, main') || link.parentElement;
            if(!root) continue;
            const hasHero = root.querySelector('h1') || /background-image\s*:/.test(root.innerHTML || '');
            if(!hasHero) continue;
            const url = primeAbs(link.getAttribute('href'));
            const k = primeKeyUrl(url); if(vistos.has(k)) continue;
            const titulo = primeLimparTitulo((root.querySelector('h1')?.getAttribute('title') || primeText(root.querySelector('h1'))) || primeText(link));
            if(!titulo) continue;
            const backdrop = primeBackdropElemento(root);
            const img = backdrop || primeImagemElemento(root, 'w500');
            const sinopse = Array.from(root.querySelectorAll('p')).map(primeText).find(x => x.length > 35) || '';
            const generosTxt = Array.from(root.querySelectorAll('span')).map(primeText).find(x => /,/.test(x) && !/^\d{4}$/.test(x)) || '';
            out.push({ id: PRIME_KEY + '::' + k, url, titulo, ano: primeAno(primeText(root)), img, poster: img, backdrop: backdrop || img, sinopse, generos: generosTxt ? generosTxt.split(',').map(x=>x.trim()).filter(Boolean) : [], tipo: primeTipoPorUrl(url), isMovie: primeEhFilme(url), isSerie: !primeEhFilme(url), providerKey: PRIME_KEY, providerName:'Fonte PRIME', providerSigla:'PRIME', baseUrl:PRIME_BASE });
            vistos.add(k); if(out.length >= 10) break;
        }
        return out;
    }
    function primeEscapeHtml(txt){ return String(txt || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
    function primeCardJaExiste(grid, url){ const k = primeKeyUrl(url); return Array.from(grid.querySelectorAll('[data-url]')).some(li => primeKeyUrl(li.dataset.url || '') === k && li.dataset.provider === PRIME_KEY); }
    function primeEpInfo(obra){
        const bruto = `${obra?.titulo || ''} ${obra?.url || ''}`;
        let temporada = obra?.temporada || '', episodio = obra?.episodio || '';
        const m = bruto.match(/S\s*(\d{1,2})\s*[:\- ]?E\s*(\d{1,3})/i) || bruto.match(/(\d{1,2})\s*[xX]\s*(\d{1,3})/i);
        if(m){ temporada = temporada || m[1]; episodio = episodio || m[2]; }
        const mep = bruto.match(/Epis[oó]dio\s*(\d{1,3})/i) || bruto.match(/(?:^|\D)E\s*(\d{1,3})(?:\D|$)/i);
        if(!episodio && mep) episodio = mep[1];
        return { temporada: String(temporada || '1').padStart(2,'0'), episodio: String(episodio || '').padStart(2,'0') };
    }
    function renderizarCardPrimeDados(obra, gridId){
        const grid = document.getElementById(gridId); if(!grid || !obra || !obra.url || primeCardJaExiste(grid, obra.url)) return 0;
        const tipo = obra.tipo || primeTipoPorUrl(obra.url);
        const ehEp = tipo === 'Episódio' || String(obra.url).includes('/episodio/') || gridId === 'gridInicioEpisodios' || gridId === 'gridEpisodios';
        const ehFilme = tipo === 'Filme' || String(obra.url).includes('/filme/');
        let img = primeImg(obra.img || obra.poster || obra.backdrop || '', ehEp ? 'w780' : 'w500') || (typeof placeholderCronosPoster === 'function' ? placeholderCronosPoster() : '');
        const li = document.createElement('li');
        li.dataset.url = obra.url;
        li.dataset.provider = PRIME_KEY;
        li.dataset.providerKey = PRIME_KEY;
        li.dataset.providerName = 'Fonte PRIME';
        li.dataset.providerSigla = 'PRIME';
        li.dataset.poster = img;
        if(ehEp){
            li.className = 'card-item episodio-home-card';
            const epInfo = primeEpInfo(obra);
            const serieTitulo = primeEscapeHtml(primeLimparLinhaEp(obra.serieTitulo || obra.tituloSerie || obra.nomeObra || ''));
            const tituloEp = epInfo.episodio ? `S${epInfo.temporada} - Episódio ${epInfo.episodio}` : 'Episódio';
            li.innerHTML = `
                <div class="episodio-tag-top"><span class="badge-tipo badge-serie">EPISÓDIO</span></div>
                <div class="card-media episodio-media"><img src="${img}" alt="${primeEscapeHtml(tituloEp)}" loading="lazy"></div>
                <div class="episodio-tags-bottom"><span class="badge-data-episodio">${primeEscapeHtml(obra.data || obra.ano || '')}</span><span class="badge-qualidade provider-prime">PRIME</span></div>
                <h3>${tituloEp}</h3>
                <span class="ano-card">${serieTitulo || primeEscapeHtml(obra.titulo || '')}</span>
            `;
            li.onclick = () => analisarObra(obra.url, '', obra.titulo || tituloEp, img, false);
        } else {
            li.className = 'card-item global-card';
            const ano = primeAno(obra.ano || '') || obra.ano || '';
            const badgeClass = ehFilme ? 'badge-filme' : 'badge-serie';
            li.innerHTML = `
                <div class="card-media">
                    <div class="badge-tipo ${badgeClass}">${primeEscapeHtml(tipo)}</div>
                    <div class="badge-qualidade provider-prime">PRIME</div>
                    ${ano ? `<div class="badge-ano-card">${primeEscapeHtml(ano)}</div>` : ''}
                    <img src="${img}" alt="${primeEscapeHtml(obra.titulo || 'Poster')}" loading="lazy">
                </div>
                <h3>${primeEscapeHtml(obra.titulo || 'Sem título')}</h3>
                <span class="ano-card"></span>
            `;
            li.onclick = () => analisarObra(obra.url, ano || obra.ano || '', obra.titulo || '', img, ehFilme);
        }
        grid.appendChild(li);
        try {
            if (!ehEp && gridId !== 'gridFavoritos' && gridId !== 'gridHistorico' && typeof adicionarBotaoFavoritarHoverCronos === 'function') {
                adicionarBotaoFavoritarHoverCronos(li, { ...obra, img, poster: img, providerKey: PRIME_KEY, providerName: 'Fonte PRIME', providerSigla: 'PRIME', baseUrl: PRIME_BASE, tipo, isMovie: ehFilme, isSerie: !ehFilme });
            }
        } catch(e) {}
        try { if(typeof salvarObraCronos === 'function' && !ehEp) salvarObraCronos({ ...obra, providerKey:PRIME_KEY, providerName:'Fonte PRIME', providerSigla:'PRIME', baseUrl:PRIME_BASE }); } catch(e) {}
        aplicarFiltroVisualCronos();
        return 1;
    }
    function renderizarItemPrimeNoGrid(item, gridId){
        let filtro = '';
        if(gridId === 'gridFilmes' || gridId === 'gridInicioFilmes') filtro = 'filmes';
        if(gridId === 'gridSeries' || gridId === 'gridInicioSeries') filtro = 'series';
        if(gridId === 'gridAnimes') filtro = 'animes';
        if(gridId === 'gridEpisodios' || gridId === 'gridInicioEpisodios') filtro = 'episodios';
        const cards = primeExtrairCards({ querySelectorAll: (sel) => item.matches && item.matches(sel) ? [item].concat(Array.from(item.querySelectorAll(sel))) : Array.from(item.querySelectorAll ? item.querySelectorAll(sel) : []) }, filtro);
        let total = 0;
        for(const obra of cards.slice(0, 1)) total += renderizarCardPrimeDados(obra, gridId);
        return total;
    }
    function primeMeta(doc, sel){ return doc.querySelector(sel)?.getAttribute('content') || ''; }
    function primeLimparSinopse(txt){ return String(txt || '').replace(/\s*\|\s*Nota:.*$/i,'').replace(/\s*•\s*Nota:.*$/i,'').replace(/\s*\|\s*Duração:.*$/i,'').replace(/\s*\|\s*Gêneros:.*$/i,'').replace(/\s+/g,' ').trim(); }
    function primePosterDetalhe(doc){ const all=[]; doc.querySelectorAll('img[data-src], img[src], meta[property="og:image"]').forEach(el => all.push(el.getAttribute('data-src') || el.getAttribute('src') || el.getAttribute('content') || '')); return all.map(u => primeImg(u,'w500')).filter(Boolean).find(u => /\/w500\//i.test(u)) || all.map(u=>primeImg(u,'w500')).filter(Boolean)[0] || ''; }
    function primeBackdropDetalhe(doc, html){
        const arr=[]; const add=v=>{ v=String(v||'').trim(); if(v) arr.push(primeHtmlDecode(v)); };
        doc.querySelectorAll('[data-backdrop]').forEach(el=>add(el.getAttribute('data-backdrop')));
        doc.querySelectorAll('img[alt*="backdrop" i], img[class*="backdrop" i], #movie-player-container img, meta[property="og:image"]').forEach(el=>add(el.getAttribute('data-src') || el.getAttribute('src') || el.getAttribute('content')));
        Array.from(String(html||'').matchAll(/data-backdrop=["']([^"']+)["']/ig)).forEach(m=>add(m[1]));
        Array.from(String(html||'').matchAll(/background-image\s*:\s*url\((['"]?)(.*?)\1\)/ig)).forEach(m=>add(m[2]));
        return arr.map(u=>primeImg(u,'original')).filter(Boolean).find(u => /original|w1280|backdrop|tmdb/i.test(u)) || arr.map(u=>primeImg(u,'original')).filter(Boolean)[0] || '';
    }
    function primeSinopseDetalhe(doc){
        const sels = ['.text-slate-700 p','.dark\\:text-slate-200 p','.leading-relaxed p:not(.italic)','.description p','.overview p','main p'];
        for(const sel of sels){ for(const el of Array.from(doc.querySelectorAll(sel))){ const t=primeLimparSinopse(primeText(el)); if(t && t.length > 35 && !/compartilhar|trailer|login|cadastro/i.test(t)) return t; } }
        return primeLimparSinopse(primeMeta(doc,'meta[name="description"]') || primeMeta(doc,'meta[property="og:description"]'));
    }
    function primeGenerosDetalhe(doc, desc){
        const set = new Set();
        const m = String(desc||'').match(/G[eê]neros:\s*([^|•]+)/i); if(m) m[1].split(',').map(x=>x.trim()).filter(Boolean).forEach(g=>set.add(g));
        doc.querySelectorAll('a[href*="genre"], a[href*="genero"], a[href*="/genero"], span, a').forEach(el => { const t=primeText(el); if(!t || t.length > 35) return; if(/Ação|Aventura|Drama|Comédia|Romance|Terror|Crime|Documentário|Família|Animação|Ficção|Faroeste|Mistério|Thriller|Fantasia/i.test(t)) set.add(t); });
        return Array.from(set).slice(0, 8);
    }
    async function primeEnriquecerDestaque(obra){
        if(!obra || !obra.url) return obra;
        try {
            await migrarLocalStorageParaIndexedDB?.();
            const salvo = await (typeof dbGet === 'function' ? dbGet('obras', gerarIdCronos(obra.url)) : null).catch(()=>null);
            if(salvo && salvo.backdrop && salvo.sinopse && (salvo.poster || salvo.img)) return { ...obra, ...salvo, providerKey:PRIME_KEY, providerName:'Fonte PRIME', providerSigla:'PRIME', baseUrl:PRIME_BASE };
        } catch(e) {}
        try {
            const res = await fetch(PROXY + encodeURIComponent(obra.url));
            const html = await res.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const desc = primeMeta(doc,'meta[name="description"]') || primeMeta(doc,'meta[property="og:description"]');
            const titulo = primeLimparTitulo(primeText(doc.querySelector('h1')) || primeMeta(doc,'meta[property="og:title"]') || obra.titulo);
            const poster = primePosterDetalhe(doc) || obra.poster || obra.img || '';
            const backdrop = primeBackdropDetalhe(doc, html) || obra.backdrop || poster || obra.img || '';
            const dados = { ...obra, titulo: titulo || obra.titulo, poster: poster || obra.poster || obra.img, img: poster || obra.img || obra.poster || backdrop, backdrop: backdrop || poster || obra.backdrop || obra.img, sinopse: primeSinopseDetalhe(doc) || obra.sinopse || 'Sem sinopse disponível.', ano: primeAno(primeText(doc.body).slice(0,3000)) || obra.ano || '', generos: primeGenerosDetalhe(doc, desc), tipo: primeTipoPorUrl(obra.url), isMovie: primeEhFilme(obra.url), isSerie: !primeEhFilme(obra.url), providerKey:PRIME_KEY, providerName:'Fonte PRIME', providerSigla:'PRIME', baseUrl:PRIME_BASE };
            try { if(typeof salvarObraCronos === 'function') await salvarObraCronos(dados); } catch(e) {}
            return dados;
        } catch(e) { console.warn('Falha ao enriquecer destaque PRIME:', obra.url, e); return obra; }
    }
    async function primeAdicionarDestaques(lista){
        let total = 0;
        for(const base of (lista || []).slice(0, 8)){
            let dados = await primeEnriquecerDestaque(base);
            dados.providerKey = PRIME_KEY; dados.providerName = 'Fonte PRIME'; dados.providerSigla = 'PRIME'; dados.baseUrl = PRIME_BASE;
            const canon = primeKeyUrl(dados.url);
            const ja = destaquesPremiumHome.some(o => primeKeyUrl(o.url) === canon && o.providerKey === PRIME_KEY);
            if(!ja){ destaquesPremiumHome.push(dados); total++; }
            if(typeof atualizarDestaquePremium === 'function') atualizarDestaquePremium(0);
            if(typeof esperar === 'function') await esperar(80);
        }
        return total;
    }
    async function carregarHomePrimeProvider(doc, status){
        if(status) status.innerText = 'Carregando Home PRIME...';
        let destaques = primeExtrairHero(doc);
        if(!destaques.length) destaques = primeCardsDaSecao(doc, '.swiper_top10_home', '');
        if(!destaques.length) destaques = primeExtrairCards(doc, '').slice(0, 8);
        await primeAdicionarDestaques(destaques);
        const filmes = primeCardsDaSecao(doc, '.swiper_filmes_0', 'filmes');
        const series = primeCardsDaSecao(doc, '.swiper_series_1', 'series');
        const episodios = primeCardsDaSecao(doc, '.swiper_episodios-recentes_4', 'episodios');
        let cf = 0; for(const o of filmes.slice(0,12)) cf += renderizarCardPrimeDados(o, 'gridInicioFilmes');
        let cs = 0; for(const o of series.slice(0,12)) cs += renderizarCardPrimeDados(o, 'gridInicioSeries');
        let ce = 0; for(const o of episodios.slice(0,12)) ce += renderizarCardPrimeDados(o, 'gridInicioEpisodios');
        if(cf < 12) await completarHomeProviderAte(PRIME_KEY, '/filmes', 'gridInicioFilmes', PRIME_CARD_SELECTOR, 12);
        if(cs < 12) await completarHomeProviderAte(PRIME_KEY, '/series', 'gridInicioSeries', PRIME_CARD_SELECTOR, 12);
        if(ce < 12) await completarHomeProviderAte(PRIME_KEY, '/episodios', 'gridInicioEpisodios', PRIME_CARD_SELECTOR, 12);
        const head = document.getElementById('headEpisodiosRecentes');
        const gridEp = document.getElementById('gridInicioEpisodios');
        if(head) head.style.display = gridEp && gridEp.children.length ? 'flex' : 'none';
    }
    function primePlayerAttrs(doc){ const el = doc.querySelector('#movie-player-container, [data-apicontentid], [data-contentid]'); return el ? { id: el.getAttribute('data-apicontentid') || el.getAttribute('data-contentid') || '', season: el.getAttribute('data-season') || '', episode: el.getAttribute('data-episode') || '', playertype: el.getAttribute('data-playertype') || '', backdrop: el.getAttribute('data-backdrop') || '' } : {}; }
    function primeAllEpisodes(html){ const m = String(html||'').match(/window\.allEpisodes\s*=\s*(\{[\s\S]*?\})\s*;/); if(!m) return null; try { return JSON.parse(m[1]); } catch(e){ return null; } }
    function garantirModalServidoresPrime(){
        if(document.getElementById('modalServidoresPrimeCronos')) return;
        const css = document.createElement('style');
        css.textContent = '.modal-servidores-prime-cronos{display:none;position:fixed;inset:0;background:rgba(0,0,0,.86);backdrop-filter:blur(8px);z-index:9999;align-items:center;justify-content:center;padding:18px}.modal-prime-cronos-box{background:#111;border:1px solid #00ffff;border-radius:10px;box-shadow:0 0 28px rgba(0,255,255,.22);max-width:460px;width:100%;padding:24px;text-align:center}.modal-prime-cronos-box h3{color:#fff;margin-bottom:8px}.modal-prime-cronos-box p{color:#aaa;margin-bottom:18px}.prime-cronos-fontes{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}.prime-cronos-fonte-btn{padding:12px 10px;border-radius:6px;border:1px solid #00ffff;background:#0b0b0b;color:#00ffff;font-weight:bold;cursor:pointer}.prime-cronos-fonte-btn:hover{background:#00ffff;color:#000}.prime-cronos-close{margin-top:14px;width:100%;padding:10px;border:1px solid #ff3030;background:#170909;color:#ff4d4d;border-radius:6px;font-weight:bold;cursor:pointer}';
        document.head.appendChild(css);
        const modal = document.createElement('div'); modal.id='modalServidoresPrimeCronos'; modal.className='modal-servidores-prime-cronos';
        modal.innerHTML = '<div class="modal-prime-cronos-box"><h3>Escolha uma fonte</h3><p>Se uma fonte não carregar, volte e teste outra.</p><div class="prime-cronos-fontes" id="primeCronosFontesLista"></div><button class="prime-cronos-close" id="primeCronosModalClose">Cancelar</button></div>';
        document.body.appendChild(modal);
        document.getElementById('primeCronosModalClose').onclick = () => modal.style.display = 'none';
        modal.addEventListener('click', e => { if(e.target === modal) modal.style.display = 'none'; });
    }
    function primePlayerUrl(api, tipo, dados){ return tipo === 'filme' ? `https://${api}/filme/${dados.id}` : `https://${api}/serie/${dados.id}/${dados.s}/${dados.e}`; }
    function abrirModalServidoresPrimeCronos(titulo, tipo, dados, obraHist){
        if(window.cronosAbrirModalFontesEpisodioOficial){
            return window.cronosAbrirModalFontesEpisodioOficial(titulo, { prime:true, tipo, dados, obraHist });
        }
        garantirModalServidoresPrime();
        const lista = document.getElementById('primeCronosFontesLista'); if(!lista) return;
        lista.innerHTML = '';
        PRIME_PLAYER_APIS.forEach((api, idx) => { const b=document.createElement('button'); b.className='prime-cronos-fonte-btn'; b.textContent=`#${idx + 1} ${primeApiLabelCronos(api)}`; b.onclick=()=>{ document.getElementById('modalServidoresPrimeCronos').style.display='none'; abrirPlayerPrimeCronos(titulo, primePlayerUrl(api, tipo, dados), obraHist); }; lista.appendChild(b); });
        document.getElementById('modalServidoresPrimeCronos').style.display='flex';
    }
    function abrirPlayerPrimeCronos(titulo, url, obraHist){
        if(typeof ativarTela === 'function') ativarTela('telaPlayer');
        const tit = document.getElementById('playerTitulo'); if(tit) tit.textContent = titulo || 'Reproduzindo';
        const iframe = document.getElementById('iframePlayer'); if(iframe){ iframe.setAttribute('allow','autoplay; fullscreen; encrypted-media; picture-in-picture'); iframe.setAttribute('referrerpolicy','no-referrer'); iframe.src = url; }
        if(obraHist && typeof salvarHistoricoHome === 'function') { try { salvarHistoricoHome({ ...obraHist, playerUrl:url, ultimoAcesso:new Date().toISOString(), providerKey:PRIME_KEY, providerName:'Fonte PRIME', providerSigla:'PRIME' }); } catch(e) {} }
    }

    function primeApiLabelCronos(api){
        const a = String(api || '').toLowerCase();
        if(a.includes('warezcdn')) return 'WarezCDN';
        if(a.includes('superflixapi.best')) return 'Superflix Best';
        if(a.includes('superflixapi.online')) return 'Superflix Online';
        return String(api || '').replace(/^https?:\/\//i, '').replace(/\/+$/,'');
    }
    function renderizarBotoesPrimeDiretosCronos(area, titulo, tipo, dados, obraHist){
        if(!area || !dados || !dados.id) {
            if(area) area.innerHTML = '<span style="color:#ff4d4d;font-weight:bold;">Player PRIME não encontrado.</span>';
            return;
        }
        area.innerHTML = '';
        PRIME_PLAYER_APIS.forEach((api, idx) => {
            const b = document.createElement('button');
            b.className = 'btn-assistir prime-cronos-direto-btn btn-cronos-player-direto';
            b.textContent = `▶ #${idx + 1} ${primeApiLabelCronos(api)}`;
            b.title = primePlayerUrl(api, tipo, dados);
            b.onclick = () => abrirPlayerPrimeCronos(titulo, primePlayerUrl(api, tipo, dados), obraHist);
            area.appendChild(b);
        });
    }
    function renderizarEpisodiosPrimeDetalhe(allEpisodes, apiContentId, mainTitle){
        const container = document.getElementById('listaEpisodios'); if(!container) return;
        container.innerHTML = '';
        const porTemp = {};
        Object.keys(allEpisodes || {}).forEach(season => { (allEpisodes[season] || []).forEach(ep => { const sid = String(ep.season || season || '1'); (porTemp[sid] ||= []).push(ep); }); });
        const temps = Object.keys(porTemp).sort((a,b)=>parseInt(a)-parseInt(b));
        const total = Object.values(porTemp).reduce((n,arr)=>n+arr.length,0);
        const linha4 = document.getElementById('linha4Volume'); if(linha4){ linha4.style.display='flex'; linha4.innerHTML = `<span class="tag-meta tag-temporada">${temps.length} TEMPORADA${temps.length!==1?'S':''}</span><span class="tag-meta tag-episodios">${total} EPISÓDIO${total!==1?'S':''}</span>`; }
        if(!temps.length){ container.innerHTML = '<h3 style="color:#aaa;text-align:center;margin-top:20px;">Episódios não encontrados nessa página.</h3>'; return; }
        const tabs = document.createElement('div'); tabs.className = 'tabs-temporadas';
        const ul = document.createElement('ul'); ul.className = 'grid-episodios';
        function render(sid){
            Array.from(tabs.children).forEach(b => b.classList.toggle('ativo', b.dataset.sid === sid));
            ul.innerHTML = '';
            (porTemp[sid] || []).forEach((ep,idx) => {
                const s = String(ep.season || sid || '1'); const e = String(ep.epi_num || ep.episode || idx+1);
                const s2 = s.padStart(2,'0'), e2 = e.padStart(2,'0');
                const tituloEp = ep.title && !/^epis[oó]dio\s*\d+$/i.test(ep.title) ? ep.title : `Episódio ${e2}`;
                const thumb = ep.thumb_url ? primeImg('https://image.tmdb.org/t/p/w780' + ep.thumb_url, 'w780') : (obraSendoVista?.backdrop || obraSendoVista?.poster || '');
                const li = document.createElement('li'); li.className = 'ep-card';
                li.innerHTML = `<div class="ep-thumb"><img src="${thumb}" alt="${primeEscapeHtml(tituloEp)}" loading="lazy"><div class="ep-play-icon">▶</div></div><div class="ep-info"><span class="ep-title">S${s2}E${e2} - ${primeEscapeHtml(tituloEp)}</span><span class="ep-year">${primeEscapeHtml(ep.air_date || '')}${ep.duration ? ' • '+primeEscapeHtml(ep.duration)+' min' : ''}</span></div>`;
                li.onclick = () => abrirModalServidoresPrimeCronos(`${mainTitle} - S${s2}E${e2}`, 'serie', { id: apiContentId, s, e }, { ...obraSendoVista, episodio:`S${s2}E${e2}`, playerTitulo:`${mainTitle} - S${s2}E${e2}` });
                ul.appendChild(li);
            });
        }
        temps.forEach((sid,idx)=>{ const b=document.createElement('button'); b.className='btn-temporada'+(idx===0?' ativo':''); b.dataset.sid=sid; b.textContent = parseInt(sid,10) || sid; b.onclick=()=>render(sid); tabs.appendChild(b); });
        container.appendChild(tabs); container.appendChild(ul); render(temps[0]);
    }
    async function analisarObraPrimeCorrigido(url, ano, tituloCard, img, isMovie){
        const status = document.getElementById('statusDetalhes');
        try {
            url = primeAbs(url);
            window.scrollTo({top:0, behavior:'smooth'});
            if(typeof ativarTela === 'function') ativarTela('telaDetalhes');
            if(status){ status.className='loading-text'; status.innerText='Extraindo dados do PRIME...'; status.style.display='block'; status.style.color=''; }
            const bloco = document.getElementById('blocoDetalhesInfo'); if(bloco) bloco.style.display='none';
            ['areaAcaoDetalhe','listaEpisodios','linha1Original','linha2Ficha','linha3Generos','linha4Volume'].forEach(id => { const el=document.getElementById(id); if(el) { if(id==='linha4Volume') el.style.display='none'; el.innerHTML=''; } });
            const res = await fetch(PROXY + encodeURIComponent(url));
            const html = await res.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const desc = primeMeta(doc,'meta[name="description"]') || primeMeta(doc,'meta[property="og:description"]') || '';
            const ogTitle = primeMeta(doc,'meta[property="og:title"]') || '';
            const attrs = primePlayerAttrs(doc);
            const tipoInicial = primeTipoPorUrl(url);
            const titulo = primeLimparTitulo(primeText(doc.querySelector('h1')) || ogTitle || tituloCard || 'Sem título');
            const poster = primeImg(img, 'w500') || primePosterDetalhe(doc) || primeImg(primeMeta(doc,'meta[property="og:image"]'), 'w500') || '';
            const backdrop = primeBackdropDetalhe(doc, html) || primeImg(attrs.backdrop || primeMeta(doc,'meta[property="og:image"]') || poster, 'original');
            const sinopse = primeSinopseDetalhe(doc) || 'Sem sinopse disponível.';
            const anoFinal = ano || primeAno(ogTitle) || primeAno(desc) || primeAno(primeText(doc.body).slice(0,3000));
            const nota = (desc.match(/Nota:\s*([0-9.,]+)/i) || [,''])[1].replace(',', '.');
            const duracao = (desc.match(/Duraç[aã]o:\s*([^•|]+)/i) || [,''])[1].trim();
            const generos = primeGenerosDetalhe(doc, desc);
            const apiContentId = attrs.id || '';
            const playertype = attrs.playertype || (url.includes('/episodio/') ? 'episodio' : primeEhFilme(url) ? 'filme' : 'serie');
            const ehFilme = playertype === 'filme' || primeEhFilme(url);
            obraSendoVista = { url, titulo, ano:anoFinal, img:poster, poster, backdrop, sinopse, generos, isMovie:ehFilme, isSerie:!ehFilme, tipo:ehFilme ? 'Filme' : tipoInicial, providerKey:PRIME_KEY, providerName:'Fonte PRIME', providerSigla:'PRIME', baseUrl:PRIME_BASE };
            try { window.obraSendoVista = obraSendoVista; await salvarObraCronos?.(obraSendoVista); await salvarHistoricoHome?.(obraSendoVista); } catch(e) {}
            if(typeof checarBotaoFavorito === 'function') checarBotaoFavorito(url);
            const setTxt = (id, value) => { const el=document.getElementById(id); if(el) el.textContent=value || ''; };
            setTxt('detalheTitulo', titulo);
            const imgEl = document.getElementById('detalheImg'); if(imgEl) imgEl.src = poster || (typeof placeholderCronosPoster === 'function' ? placeholderCronosPoster() : '');
            const bgEl = document.getElementById('backdropDetalhes'); if(bgEl) bgEl.style.backgroundImage = backdrop ? `url('${backdrop}')` : 'none';
            const linha2 = document.getElementById('linha2Ficha'); if(linha2){ linha2.innerHTML = `${nota ? `<span class="tag-meta tag-nota">IMDb: ${primeEscapeHtml(nota)}</span>` : ''}<span class="tag-meta tag-qualidade">PRIME</span>${duracao ? `<span class="tag-meta tag-duracao">${primeEscapeHtml(duracao)}</span>` : ''}${anoFinal ? `<span class="tag-meta">${primeEscapeHtml(anoFinal)}</span>` : ''}`; }
            const linha3 = document.getElementById('linha3Generos'); if(linha3) linha3.innerHTML = generos.map(g => `<span class="tag-meta tag-genero">${primeEscapeHtml(g)}</span>`).join('');
            setTxt('detalheSinopse', sinopse);
            if(status) status.style.display='none'; if(bloco) bloco.style.display='flex';
            if(typeof ajustarQuebraTituloDetalheCronos === 'function') setTimeout(ajustarQuebraTituloDetalheCronos, 50);
            const area = document.getElementById('areaAcaoDetalhe');
            if(ehFilme){
                renderizarBotoesPrimeDiretosCronos(area, titulo, 'filme', { id: apiContentId }, obraSendoVista);
            } else if(playertype === 'episodio' || url.includes('/episodio/')){
                const m = url.match(/-(\d+)x(\d+)(?:\D|$)/i) || [];
                const s = attrs.season || m[1] || '1'; const e = attrs.episode || m[2] || '1';
                if(area) area.innerHTML = '<button class="btn-assistir" id="btnPrimePlayEpCronos">▶ Assistir Episódio</button>';
                const btn=document.getElementById('btnPrimePlayEpCronos'); if(btn) btn.onclick = () => abrirModalServidoresPrimeCronos(titulo, 'serie', { id: apiContentId, s, e }, obraSendoVista);
            } else {
                const all = primeAllEpisodes(html);
                if(apiContentId && all) renderizarEpisodiosPrimeDetalhe(all, apiContentId, titulo);
                else if(area) area.innerHTML = '<span style="color:#ff4d4d;font-weight:bold;">Episódios não encontrados nessa página.</span>';
            }
        } catch(err) {
            console.error(err);
            if(status){ status.className='error-text'; status.innerText='Erro crítico ao processar as informações do PRIME.'; status.style.display='block'; }
        }
    }

    async function carregarHomeMulti(){
        if (typeof ativarTela === 'function') ativarTela('telaInicio', document.querySelector('.nav-btn'));
        try { telaAnterior = 'telaInicio'; } catch(e) {}
        const status = document.getElementById('statusInicio');
        ['gridInicioFilmes','gridInicioSeries','gridInicioEpisodios'].forEach(limparGrid);
        const slides = document.getElementById('premiumSlides');
        if (slides) slides.innerHTML = '';
        try { destaquesPremiumHome = []; destaquePremiumAtual = 0; } catch(e) {}
        const headEp = document.getElementById('headEpisodiosRecentes');
        if (headEp) headEp.style.display = 'none';
        if (!existeFonteAtiva()) { if(status) statusNenhumaFonte('statusInicio'); return; }
        if (status) { status.style.display = 'block'; status.style.color = ''; status.innerText = 'Carregando fontes em ordem: ' + ORDEM_PROVEDORES.map(providerLabel).join(' → ') + '...'; }

        for (const key of ORDEM_PROVEDORES) {
            if (!fonteAtiva(key)) continue;
            try {
                const res = await fetch(PROXY + encodeURIComponent(providerUrl(key, '/')));
                const html = await res.text();
                const doc = new DOMParser().parseFromString(html, 'text/html');
                if (status) status.innerText = `Carregando Home ${providerLabel(key)}...`;

                if (key === 'primeflix') {
                    await carregarHomePrimeProvider(doc, status);
                    continue;
                }

                if (key !== 'l07') await renderizarEpisodiosHomeProvider(doc, key);

                const destaques = Array.from(doc.querySelectorAll(key === 'l07' ? LISO_DESTAQUE_SELECTOR : '#featured-titles .item')).slice(0, 8);
                for (let i = 0; i < destaques.length; i++) {
                    if (key === 'l07') {
                        try {
                            await lisoAdicionarDestaquePremium(destaques[i], true);
                        } catch(e) { console.warn('Destaque LISO falhou', e); }
                        if (typeof esperar === 'function') await esperar(80);
                        continue;
                    }
                    const clone = prepararItemParaProvider(destaques[i], key);
                    const prev = window.__CRONOS_RENDER_PROVIDER_KEY; window.__CRONOS_RENDER_PROVIDER_KEY = key;
                    try {
                        const antesLen = destaquesPremiumHome.length;
                        await adicionarDestaquePremium(clone, true);
                        for (let j = antesLen; j < destaquesPremiumHome.length; j++) {
                            destaquesPremiumHome[j].providerKey = key;
                            destaquesPremiumHome[j].providerName = PROVIDERS[key].nome;
                            destaquesPremiumHome[j].providerSigla = PROVIDERS[key].sigla;
                        }
                        if (typeof atualizarDestaquePremium === 'function') atualizarDestaquePremium(0);
                    } catch(e) { console.warn('Destaque falhou', key, e); }
                    finally { window.__CRONOS_RENDER_PROVIDER_KEY = prev; }
                    if (typeof esperar === 'function') await esperar(80);
                }

                if (key === 'b01') {
                    const qtdBfck = destaquesPremiumHome.filter(o => (o.providerKey || providerPorUrl(o.url)) === 'b01').length;
                    const alvoBfck = Math.min(8, destaques.length);
                    if (qtdBfck < alvoBfck) {
                        for (const itemBfck of destaques) {
                            try {
                                const cloneBfck = prepararItemParaProvider(itemBfck, 'b01');
                                const basicoBfck = extrairDadosBasicosItem(cloneBfck);
                                if (!basicoBfck || !basicoBfck.url) continue;
                                const canonBfck = normalizarUrlCanonicaMulti(basicoBfck.url, 'b01');
                                const jaBfck = destaquesPremiumHome.some(o => (o.providerKey || providerPorUrl(o.url)) === 'b01' && normalizarUrlCanonicaMulti(o.url, 'b01') === canonBfck);
                                if (jaBfck) continue;
                                let dadosBfck = dadosBasicosParaObra(basicoBfck);
                                dadosBfck.providerKey = 'b01';
                                dadosBfck.providerName = PROVIDERS.b01.nome;
                                dadosBfck.providerSigla = PROVIDERS.b01.sigla;
                                dadosBfck.baseUrl = PROVIDERS.b01.base;
                                try {
                                    const detalhesBfck = await extrairDetalhesDestaquePremium(dadosBfck.url);
                                    dadosBfck = { ...dadosBfck, ...detalhesBfck, providerKey:'b01', providerName:PROVIDERS.b01.nome, providerSigla:PROVIDERS.b01.sigla, baseUrl:PROVIDERS.b01.base };
                                } catch(e) {}
                                try { await salvarObraCronos(dadosBfck); } catch(e) {}
                                destaquesPremiumHome.push(dadosBfck);
                                if (destaquesPremiumHome.filter(o => (o.providerKey || providerPorUrl(o.url)) === 'b01').length >= alvoBfck) break;
                            } catch(e) { console.warn('Fallback destaque BFCK falhou', e); }
                        }
                    }
                }

                if (key === 'l07' && !destaquesPremiumHome.some(o => o.providerKey === 'l07')) {
                    const destaquesFallback = Array.from(doc.querySelectorAll(LISO_DESTAQUE_SELECTOR)).slice(0, 8);
                    for (const itemFb of destaquesFallback) {
                        try { await lisoAdicionarDestaquePremium(itemFb, true); } catch(e) { console.warn('Fallback destaque LISO falhou', e); }
                    }
                }

                const filmes = key === 'l07' ? [] : Array.from(doc.querySelectorAll('#dt-movies .item.movies'));
                const series = key === 'l07' ? [] : Array.from(doc.querySelectorAll('#dt-tvshows .item.tvshows'));
                let cf = 0; for (const item of filmes) { if (cf >= 12) break; cf += await renderizarItemProvider(item, 'gridInicioFilmes', key); }
                let cs = 0; for (const item of series) { if (cs >= 12) break; cs += await renderizarItemProvider(item, 'gridInicioSeries', key); }

                if (cf < 12) await completarHomeProviderAte(key, key === 'l07' ? '/movies/' : '/filmes/', 'gridInicioFilmes', key === 'l07' ? LISO_ITEM_SELECTOR : '#archive-content .item.movies, #archive-content article.item, .items .item.movies, article.item.movies', 12);
                if (cs < 12) await completarHomeProviderAte(key, '/series/', 'gridInicioSeries', key === 'l07' ? LISO_ITEM_SELECTOR : '#archive-content .item.tvshows, #archive-content article.item, .items .item.tvshows, article.item.tvshows', 12);
                await completarHomeProviderAte(key, key === 'l07' ? '/episodio/' : '/episodios/', 'gridInicioEpisodios', key === 'l07' ? LISO_ITEM_SELECTOR : '#archive-content .item, #dt-episodes .item, .episodes .item, article.episodes, article.episode, .items .item', 12);
            } catch(e) {
                console.warn('Home falhou no provider', key, e);
            }
        }
        const epGrid = document.getElementById('gridInicioEpisodios');
        if (headEp) headEp.style.display = epGrid && epGrid.children.length ? 'flex' : 'none';
        try { destaquesPremiumHome = limitarDestaquesPremiumPorFonteCronos(destaquesPremiumHome, 8); } catch(e) {}
        if (typeof atualizarDestaquePremium === 'function') atualizarDestaquePremium(0);
        if (typeof renderizarResumoHomeLocal === 'function') renderizarResumoHomeLocal();
        if (status) status.style.display = 'none';
        aplicarFiltroVisualCronos();
    }
    async function completarHomeProviderAte(key, path, gridId, seletor, limitePorFonte){
        const grid = document.getElementById(gridId);
        if (!grid || !fonteAtiva(key)) return 0;
        const jaProvider = grid.querySelectorAll(`.card-item[data-provider="${key}"]`).length;
        if (jaProvider >= limitePorFonte) return 0;
        try {
            const urlFinal = urlProviderComContexto(key, path, 'telaInicio');
            if (!urlFinal) return 0;
            const res = await fetch(PROXY + encodeURIComponent(urlFinal));
            const html = await res.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            let count = jaProvider;
            let total = 0;
            const seletorFinal = (key === 'l07') ? LISO_ITEM_SELECTOR : seletor;
            for (const item of doc.querySelectorAll(seletorFinal)) {
                if (count >= limitePorFonte) break;
                const add = await renderizarItemProvider(item, gridId, key);
                if (add) { count += add; total += add; }
            }
            return total;
        } catch(e) { return 0; }
    }
    window.carregarHomePage = carregarHomeMulti;
    try { carregarHomePage = carregarHomeMulti; } catch(e) {}

    async function iniciarNavegacaoMulti(idTela, urlAlvo, btnElement){
        if (idTela === 'telaInicio') return carregarHomeMulti();
        if (idTela === 'telaCategorias') { if (typeof ativarTela === 'function') ativarTela('telaCategorias', btnElement); if (typeof montarCategorias === 'function') return montarCategorias(); }
        if (idTela === 'telaConfiguracoes') return window.carregarConfiguracoes(btnElement);
        if (['telaHistorico','telaFavoritos','telaLancamentos'].includes(idTela)) {
            const fn = idTela === 'telaHistorico' ? window.carregarHistorico : idTela === 'telaFavoritos' ? window.carregarFavoritos : window.carregarLancamentos;
            if (typeof fn === 'function') return fn(btnElement);
        }
        if (typeof ativarTela === 'function') ativarTela(idTela, btnElement);
        const gridId = idTela.replace('tela', 'grid');
        const statusId = idTela.replace('tela', 'status');
        const grid = document.getElementById(gridId);
        if (!grid) return;
        grid.innerHTML = '';
        resetPaginasMulti(idTela);
        try {
            filtroTipoGridAtual[gridId] = '';
            if (idTela === 'telaFilmes') filtroTipoGridAtual[gridId] = 'filme';
            if (idTela === 'telaSeries') filtroTipoGridAtual[gridId] = 'serie';
            if (idTela === 'telaEpisodios') filtroTipoGridAtual[gridId] = 'episodio';
            if (idTela === 'telaTemporadas') filtroTipoGridAtual[gridId] = 'temporada';
            if (idTela === 'telaAnimes') filtroTipoGridAtual[gridId] = 'anime';
        } catch(e) {}
        const status = document.getElementById(statusId);
        if (status) { status.innerText = 'Lendo fontes ativas...'; status.style.display = 'block'; status.style.color = ''; }
        const rota = ROTAS_TELA[idTela] || urlAlvo || '/';
        const total = await fetchHtmlEPreencherMulti(rota, gridId, statusId, idTela);
        const btnMais = (typeof obterBotaoMaisCronos === 'function') ? obterBotaoMaisCronos(idTela) : null;
        if (btnMais) {
            btnMais.style.display = total > 0 ? 'block' : 'none';
            btnMais.disabled = false;
            if (typeof atualizarTextoBotaoMaisCronos === 'function') atualizarTextoBotaoMaisCronos(idTela);
        }
        aplicarFiltroVisualCronos();
    }
    window.iniciarNavegacao = iniciarNavegacaoMulti;
    try { iniciarNavegacao = iniciarNavegacaoMulti; } catch(e) {}

    window.carregarMais = async function(idTela, urlBase){
        const gridId = idTela.replace('tela', 'grid');
        const statusId = idTela.replace('tela', 'status');
        const status = document.getElementById(statusId);
        const btn = (typeof obterBotaoMaisCronos === 'function') ? obterBotaoMaisCronos(idTela) : null;
        if (!existeFonteAtiva()) { statusNenhumaFonte(statusId); return 0; }
        if (!paginaAtualMulti[idTela]) resetPaginasMulti(idTela);
        if (btn) btn.disabled = true;
        let totalItens = 0;
        const paginasPorClique = (typeof CRONOS_PAGINAS_POR_CARREGAR_MAIS !== 'undefined') ? CRONOS_PAGINAS_POR_CARREGAR_MAIS : 2;
        const base = contextoBuscaMulti && contextoBuscaMulti.path && idTela === 'telaBusca' ? contextoBuscaMulti.path : (ROTAS_TELA[idTela] || urlBase || '/');
        for (let i = 0; i < paginasPorClique; i++) {
            for (const key of ORDEM_PROVEDORES) {
                if (!fonteAtiva(key)) continue;
                paginaAtualMulti[idTela][key] = (paginaAtualMulti[idTela][key] || 1) + 1;
                const pag = paginaAtualMulti[idTela][key];
                if (status) { status.innerText = `Carregando ${providerLabel(key)} página ${pag}...`; status.style.display = 'block'; status.style.color = ''; }
                const urlPag = montarUrlPaginadaProvider(key, base, pag);
                if (!urlPag) continue;
                const qtd = await fetchHtmlEPreencherProvider(urlPag, gridId, statusId, idTela, key);
                totalItens += Number(qtd || 0);
                if (typeof esperar === 'function') await esperar(60);
            }
        }
        if (btn) btn.disabled = false;
        if (status && totalItens > 0) { status.innerText = `Itens adicionados: ${totalItens}.`; status.style.display = 'block'; }
        aplicarFiltroVisualCronos();
        return totalItens;
    };
    try { carregarMais = window.carregarMais; } catch(e) {}

    window.realizarBusca = async function(){
        const btnVoltarCategorias = document.getElementById('btnVoltarCategorias');
        if (btnVoltarCategorias) btnVoltarCategorias.style.display = 'none';
        const input = document.getElementById('inputBusca');
        const termo = input ? input.value.trim() : '';
        if (!termo) return;
        try { termoBuscaAtual = termo; } catch(e) {}
        const grid = document.getElementById('gridBusca'); if (grid) grid.innerHTML = '';
        const tituloBusca = document.getElementById('tituloBusca'); if (tituloBusca) tituloBusca.innerText = `Resultados para "${termo}"`;
        resetPaginasMulti('telaBusca');
        contextoBuscaMulti = { tipo: 'busca', path: `/?s=${encodeURIComponent(termo)}`, titulo: `Resultados para "${termo}"` };
        try { contextoBuscaAtual = { tipo: 'busca', baseUrl: contextoBuscaMulti.path, titulo: contextoBuscaMulti.titulo }; } catch(e) {}
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('ativa'));
        if (typeof ativarTela === 'function') ativarTela('telaBusca');
        const status = document.getElementById('statusBusca'); if (status) { status.innerText = 'Pesquisando nas fontes ativas...'; status.style.display = 'block'; status.style.color = ''; }
        const total = await fetchHtmlEPreencherMulti(contextoBuscaMulti.path, 'gridBusca', 'statusBusca', 'telaBusca');
        const btnMais = document.getElementById('btnMaisBusca'); if (btnMais) btnMais.style.display = total > 0 ? 'block' : 'none';
        aplicarFiltroVisualCronos();
    };
    try { realizarBusca = window.realizarBusca; } catch(e) {}

    function caminhoCategoriaMulti(tipo, titulo, urlBase){
        if (tipo === 'year') return `/release/${String(titulo || '').trim()}/`;
        try {
            const u = new URL(urlBase, PROVIDERS.b01.base);
            return u.pathname || `/categoria/${slugCronos(titulo)}/`;
        } catch(e) {
            const slug = (typeof slugCronos === 'function') ? slugCronos(titulo) : String(titulo||'').toLowerCase().replace(/\s+/g,'-');
            return `/categoria/${slug}/`;
        }
    }
    window.abrirFiltroCategoria = async function(tipo, titulo, urlBase){
        const btnVoltarCategorias = document.getElementById('btnVoltarCategorias');
        if (btnVoltarCategorias) btnVoltarCategorias.style.display = 'inline-flex';
        resetPaginasMulti('telaBusca');
        const grid = document.getElementById('gridBusca'); if (grid) grid.innerHTML = '';
        const tituloBusca = document.getElementById('tituloBusca'); if (tituloBusca) tituloBusca.innerText = tipo === 'year' ? `Lançamentos de ${titulo}` : `Categoria: ${titulo}`;
        const status = document.getElementById('statusBusca'); if (status) { status.innerText = 'Consultando fontes ativas...'; status.style.display = 'block'; status.style.color = ''; }
        const btnMais = document.getElementById('btnMaisBusca'); if (btnMais) btnMais.style.display = 'none';
        if (typeof ativarTela === 'function') ativarTela('telaBusca');
        if (typeof gerarBarraAZ === 'function') gerarBarraAZ('abcFiltro', 'filtro');
        const path = caminhoCategoriaMulti(tipo, titulo, urlBase);
        contextoBuscaMulti = { tipo, path, titulo };
        try { contextoBuscaAtual = { tipo, baseUrl: path, titulo }; } catch(e) {}
        const total = await fetchHtmlEPreencherMulti(path, 'gridBusca', 'statusBusca', 'telaBusca');
        if (btnMais) btnMais.style.display = total > 0 ? 'block' : 'none';
        aplicarFiltroVisualCronos();
        return total;
    };
    try { abrirFiltroCategoria = window.abrirFiltroCategoria; } catch(e) {}

    window.carregarMaisFiltroAtual = async function(){ return window.carregarMais('telaBusca', contextoBuscaMulti.path || (contextoBuscaAtual && contextoBuscaAtual.baseUrl) || '/'); };
    try { carregarMaisFiltroAtual = window.carregarMaisFiltroAtual; } catch(e) {}

    const originalMontarCategorias = (typeof montarCategorias === 'function') ? montarCategorias : null;
    if (originalMontarCategorias) {
        window.montarCategorias = async function(){
            const ret = await originalMontarCategorias.apply(this, arguments);
            try {
                const gridOficiais = document.getElementById('gridGenerosOficiaisCategorias');
                if (gridOficiais) {
                    const normalizarNomeGenero = nome => String(nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
                    const mapaGeneros = new Map();
                    Array.from(gridOficiais.querySelectorAll('button.btn-cat, button')).forEach(btn => {
                        const nome = (btn.textContent || '').trim();
                        const chave = normalizarNomeGenero(nome);
                        if (nome && !mapaGeneros.has(chave)) mapaGeneros.set(chave, { nome, btn });
                    });
                    const extras = []
                        .concat(Array.isArray(GENEROS_P02_MULTI) ? GENEROS_P02_MULTI : [])
                        .concat(Array.isArray(GENEROS_M03_MULTI) ? GENEROS_M03_MULTI : [])
                        .concat(Array.isArray(GENEROS_E04_MULTI) ? GENEROS_E04_MULTI : [])
                        .concat(Array.isArray(GENEROS_S05_MULTI) ? GENEROS_S05_MULTI : [])
                        .concat(Array.isArray(GENEROS_U06_MULTI) ? GENEROS_U06_MULTI : [])
                        .concat(Array.isArray(GENEROS_L07_MULTI) ? GENEROS_L07_MULTI : [])
                        .concat(Array.isArray(GENEROS_PRIME_MULTI) ? GENEROS_PRIME_MULTI : []);
                    extras.forEach(g => {
                        if (!g || !g.nome) return;
                        const nome = String(g.nome).trim();
                        const chave = normalizarNomeGenero(nome);
                        if (!nome || mapaGeneros.has(chave)) return;
                        const btn = document.createElement('button');
                        btn.className = 'btn-cat';
                        btn.innerText = nome;
                        btn.onclick = () => window.abrirFiltroCategoria('genre', nome, g.url || `/categoria/${g.slug}/`);
                        mapaGeneros.set(chave, { nome, btn });
                    });
                    gridOficiais.innerHTML = '';
                    Array.from(mapaGeneros.values())
                        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
                        .forEach(item => gridOficiais.appendChild(item.btn));
                }
            } catch(e) {}
            aplicarFiltroVisualCronos();
            return ret;
        };
        try { montarCategorias = window.montarCategorias; } catch(e) {}
    }

    const originalAnalisarObra = (typeof analisarObra === 'function') ? analisarObra : null;
    if (originalAnalisarObra) {
        window.analisarObra = function(url, ano, tituloCard, img, isMovie){
            const key = providerPorUrl(url);
            if (!fonteAtiva(key)) { mostrarAvisoFonteDesativada(key); return false; }
            const ret = originalAnalisarObra.apply(this, arguments);
            try {
                if (typeof obraSendoVista !== 'undefined' && obraSendoVista) {
                    obraSendoVista.providerKey = key;
                    obraSendoVista.providerName = PROVIDERS[key].nome;
                    obraSendoVista.providerSigla = PROVIDERS[key].sigla;
                    obraSendoVista.baseUrl = PROVIDERS[key].base;
                    window.obraSendoVista = obraSendoVista;
                }
            } catch(e) {}
            setTimeout(() => {
                try {
                    if (window.obraSendoVista && window.obraSendoVista.url) {
                        const k = providerPorUrl(window.obraSendoVista.url);
                        window.obraSendoVista.providerKey = k;
                        window.obraSendoVista.providerName = PROVIDERS[k].nome;
                        window.obraSendoVista.providerSigla = PROVIDERS[k].sigla;
                        window.obraSendoVista.baseUrl = PROVIDERS[k].base;
                    }
                } catch(e) {}
            }, 100);
            return ret;
        };
        try { analisarObra = window.analisarObra; } catch(e) {}
    }

    const originalNormalizar = (typeof normalizarObraParaBanco === 'function') ? normalizarObraParaBanco : null;
    if (originalNormalizar) {
        window.normalizarObraParaBanco = function(obra){
            const reg = originalNormalizar.apply(this, arguments);
            const key = (obra && obra.providerKey && PROVIDERS[obra.providerKey]) ? obra.providerKey : providerPorUrl((reg && reg.url) || (obra && obra.url));
            const canon = normalizarUrlCanonicaMulti((reg && reg.url) || (obra && obra.url));
            if (canon) { reg.url = canon; reg.id = `${key}::${canon}`; }
            reg.providerKey = key;
            reg.providerName = PROVIDERS[key].nome;
            reg.providerSigla = PROVIDERS[key].sigla;
            reg.baseUrl = PROVIDERS[key].base;
            return reg;
        };
        try { normalizarObraParaBanco = window.normalizarObraParaBanco; } catch(e) {}
    }

    async function corrigirProviderStore(store){
        if (typeof dbGetAll !== 'function' || typeof dbPut !== 'function') return [];
        const todos = await dbGetAll(store).catch(() => []);
        for (const item of todos) {
            if (!item || !item.url) continue;
            const key = providerPorUrl(item.url);
            const canon = normalizarUrlCanonicaMulti(item.url);
            const idNovo = `${key}::${canon}`;
            if (item.providerKey !== key || item.id !== idNovo || item.providerSigla !== PROVIDERS[key].sigla) {
                const novo = { ...item, id: idNovo, url: canon, providerKey: key, providerName: PROVIDERS[key].nome, providerSigla: PROVIDERS[key].sigla, baseUrl: PROVIDERS[key].base };
                if (typeof dbDelete === 'function' && item.id && item.id !== idNovo) await dbDelete(store, item.id).catch(()=>{});
                await dbPut(store, novo).catch(()=>{});
            }
        }
        return await dbGetAll(store).catch(() => []);
    }

    const originalGetFavoritos = (typeof getFavoritos === 'function') ? getFavoritos : null;
    window.getFavoritos = async function(){
        try { if (typeof migrarLocalStorageParaIndexedDB === 'function') await migrarLocalStorageParaIndexedDB(); } catch(e) {}
        const favs = await corrigirProviderStore('favoritos');
        return favs.sort((a,b)=>String(b.updatedAt || b.createdAt || b.salvoEm || '').localeCompare(String(a.updatedAt || a.createdAt || a.salvoEm || '')));
    };
    try { getFavoritos = window.getFavoritos; } catch(e) {}

    window.getHistoricoHome = async function(){
        try { if (typeof migrarLocalStorageParaIndexedDB === 'function') await migrarLocalStorageParaIndexedDB(); } catch(e) {}
        const hist = await corrigirProviderStore('historico');
        return hist.sort((a,b)=>String(b.ultimoAcesso || b.updatedAt || '').localeCompare(String(a.ultimoAcesso || a.updatedAt || '')));
    };
    try { getHistoricoHome = window.getHistoricoHome; } catch(e) {}

    const originalSalvarHistorico = (typeof salvarHistoricoHome === 'function') ? salvarHistoricoHome : null;
    if (originalSalvarHistorico) {
        window.salvarHistoricoHome = async function(item){
            const key = providerPorUrl(item && item.url);
            const novo = Object.assign({}, item || {}, { providerKey: key, providerName: PROVIDERS[key].nome, providerSigla: PROVIDERS[key].sigla });
            const ret = await originalSalvarHistorico.call(this, novo);
            await corrigirProviderStore('historico').catch(()=>{});
            return ret;
        };
        try { salvarHistoricoHome = window.salvarHistoricoHome; } catch(e) {}
    }

    function stampGridPorUrl(gridId){
        const grid = document.getElementById(gridId);
        if (!grid) return;
        Array.from(grid.querySelectorAll('.card-item')).forEach(li => garantirBadgeProvider(li, providerPorUrl(li.dataset.url || li.getAttribute('data-url') || '')));
    }
    const originalCarregarFavoritosMulti = (typeof carregarFavoritos === 'function') ? carregarFavoritos : null;
    if (originalCarregarFavoritosMulti) {
        window.carregarFavoritos = async function(){ const r = await originalCarregarFavoritosMulti.apply(this, arguments); stampGridPorUrl('gridFavoritos'); aplicarFiltroVisualCronos(); return r; };
        try { carregarFavoritos = window.carregarFavoritos; } catch(e) {}
    }
    const originalCarregarHistoricoMulti = (typeof carregarHistorico === 'function') ? carregarHistorico : null;
    if (originalCarregarHistoricoMulti) {
        window.carregarHistorico = async function(){ const r = await originalCarregarHistoricoMulti.apply(this, arguments); stampGridPorUrl('gridHistorico'); aplicarFiltroVisualCronos(); return r; };
        try { carregarHistorico = window.carregarHistorico; } catch(e) {}
    }


    /* ===== CORREÇÃO FINAL LISOFLIX — PREMIUM, FICHA, TEMPORADAS E EPISÓDIOS ===== */
    function lisoEhUrlCronos(url){ return /(^|\.)lisoflix\.net/i.test(String(url || '')); }

    function lisoNormalizarImagemDetalheCronos(url, modo){
        let u = lisoAbsImg(url || '');
        if(!u) return '';
        if(/image\.tmdb\.org\/t\/p\//i.test(u)) {
            u = u.replace(/\/(w92|w154|w185|w300|w342|w500|w780|w1280|original)\//i, modo === 'backdrop' ? '/original/' : '/w500/');
        }
        return modo === 'backdrop' ? normalizarBackdropOriginal(u) : normalizarImagemCard(u);
    }

    function lisoExtrairSinopseDetalhePremium(doc){
        const limpar = (txt) => lisoLimparSinopsePremium(String(txt || '')
            .replace(/^(Diretor|Gênero|Elenco)\s*:?\s*/i, '')
            .replace(/\s+/g, ' ')
            .trim());
        const desc = doc.querySelector('.Description, .description, .wp-content, .entry-content, [itemprop="description"]');
        if(desc){
            const paragrafos = Array.from(desc.querySelectorAll('p')).filter(p => {
                const cls = String(p.className || '');
                const txt = lisoText(p);
                if(/Director|Genre|Cast|Cast-sh/i.test(cls)) return false;
                if(/^(Diretor|Gênero|Elenco)\s*:/i.test(txt)) return false;
                return txt && txt.length > 20;
            });
            for(const p of paragrafos){
                const clone = p.cloneNode(true);
                clone.querySelectorAll('script,style,a span,.Director,.Genre,.Cast').forEach(el => el.remove());
                const txt = limpar(clone.innerText || clone.textContent || '');
                if(txt && txt.length > 20) return txt;
            }
            const cloneDesc = desc.cloneNode(true);
            cloneDesc.querySelectorAll('script,style,.Director,.Genre,.Cast,p.Director,p.Genre,p.Cast').forEach(el => el.remove());
            const txtDesc = limpar(cloneDesc.innerText || cloneDesc.textContent || '');
            if(txtDesc && txtDesc.length > 20 && !/^(Diretor|Gênero|Elenco)/i.test(txtDesc)) return txtDesc;
        }
        const meta = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const txtMeta = limpar(meta);
        return txtMeta && txtMeta.length > 20 ? txtMeta : 'Sinopse não disponível nos registros.';
    }

    function lisoImagemRuimDetalheCronos(url){
        const u = String(url || '').trim();
        if(!u) return true;
        return /rating|star|blank|placeholder|sprite|noimg|favicon|apple-touch-icon|custom-logo|cropped-|cropped_|logo|histats|gravatar|wp-content\/themes\/toroflix\/public\/img\/cnt|MovieListTop|\/ads?\/|\/banner/i.test(u);
    }

    function lisoColetarImagemElementoDetalheCronos(el, add){
        if(!el || typeof add !== 'function') return;
        ['data-src','data-lazy-src','data-original','data-wpfc-original-src','src','content'].forEach(a => add(el.getAttribute && el.getAttribute(a)));
        const srcset = (el.getAttribute && (el.getAttribute('srcset') || el.getAttribute('data-srcset'))) || '';
        if(srcset) srcset.split(',').forEach(p => add(p.trim().split(/\s+/)[0]));
        const st = (el.getAttribute && el.getAttribute('style')) || '';
        const m = st.match(/url\(["']?([^"')]+)["']?\)/i);
        if(m && m[1]) add(m[1]);
    }

    function lisoExtrairTituloDetalheCorrigido(doc, fallback, url){
        const ruim = /^(opç(?:ão|ões)|ver online|assistir online|player|video|vídeo)$/i;
        const seletores = [
            'main article.TPost.A:not(.D) header h1.Title',
            'main article.TPost.A:not(.D) h1.Title',
            'article.TPost.A:not(.D) header h1.Title',
            'article.TPost.A:not(.D) h1.Title',
            'main article.TPost.A:not(.D) header .Title',
            'article.TPost.A:not(.D) header .Title',
            'h1[itemprop="name"]',
            'main h1',
            'h1'
        ];
        for(const sel of seletores){
            const el = doc.querySelector(sel);
            const txt = lisoLimparTitulo(lisoText(el));
            if(txt && txt.length > 1 && !ruim.test(txt)) return txt;
        }
        const og = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || doc.querySelector('title')?.textContent || '';
        const metaTitulo = lisoLimparTitulo(String(og).replace(/-\s*(LisoFlix|LISO FLIX.*)$/i, '').trim());
        if(metaTitulo && !ruim.test(metaTitulo)) return metaTitulo;
        const fb = lisoLimparTitulo(fallback || '');
        if(fb && !ruim.test(fb)) return fb;
        return lisoTituloPorUrl(url || '') || 'Sem título';
    }

    function lisoExtrairPosterDetalheCorrigido(doc, fallback){
        const candidatos = [];
        const vistos = new Set();
        const add = (v) => {
            const raw = String(v || '').trim();
            if(!raw || lisoImagemRuimDetalheCronos(raw)) return;
            const norm = lisoNormalizarImagemDetalheCronos(raw, 'poster');
            if(!norm || lisoImagemRuimDetalheCronos(norm)) return;
            const key = norm.replace(/[?#].*$/,'');
            if(vistos.has(key)) return;
            vistos.add(key);
            candidatos.push(norm);
        };

        // O poster vindo do card/cache é o mais confiável no Liso. A ficha do site quase sempre traz só o backdrop.
        add(fallback);

        const areas = [
            doc.querySelector('main article.TPost.A:not(.D)'),
            doc.querySelector('article.TPost.A:not(.D)'),
            doc.querySelector('.TpRwCont main article.TPost.A')
        ].filter(Boolean);
        areas.forEach(area => {
            area.querySelectorAll('.poster img, .dt_poster img, .sheader .poster img, .imagen img, figure img:not(.TPostBg), .Image img:not(.TPostBg), img:not(.TPostBg)').forEach(el => lisoColetarImagemElementoDetalheCronos(el, add));
        });

        // Último recurso: meta de imagem, sem aceitar logo/favicons.
        doc.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]').forEach(el => lisoColetarImagemElementoDetalheCronos(el, add));

        const bom = candidatos.find(u => (typeof posterBomCronos === 'function' ? posterBomCronos(u) : true));
        if(bom) return bom;

        // Se não houver poster vertical, usar backdrop é melhor que cair no logo vermelho do site.
        const bg = lisoExtrairBackdropDetalheCorrigido(doc, '');
        return bg || candidatos[0] || '';
    }

    function lisoExtrairBackdropDetalheCorrigido(doc, fallback){
        const candidatos = [];
        const vistos = new Set();
        const add = (v) => {
            const raw = String(v || '').trim();
            if(!raw || lisoImagemRuimDetalheCronos(raw)) return;
            const norm = lisoNormalizarImagemDetalheCronos(raw, 'backdrop');
            if(!norm || lisoImagemRuimDetalheCronos(norm)) return;
            const key = norm.replace(/[?#].*$/,'');
            if(vistos.has(key)) return;
            vistos.add(key);
            candidatos.push(norm);
        };
        // No Liso o backdrop correto fica em img.TPostBg dentro da área de player.
        doc.querySelectorAll('img.TPostBg, .TPostBg img, .Image img.TPostBg, .Image .TPostBg').forEach(el => lisoColetarImagemElementoDetalheCronos(el, add));
        doc.querySelectorAll('.TPost.A.D [style*="background"], .VideoPlayer [style*="background"], .Image[style*="background"], .backdrop, .fanart, .dt_backdrop, .single-cover').forEach(el => lisoColetarImagemElementoDetalheCronos(el, add));
        doc.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]').forEach(el => lisoColetarImagemElementoDetalheCronos(el, add));
        add(fallback);
        return candidatos.find(u => /original|w780|w1280|backdrop/i.test(u)) || candidatos[0] || '';
    }

    function lisoExtrairGenerosDetalheCorrigido(doc){
        const vistos = new Set();
        const generos = [];
        const addGenero = (a) => {
            const nome = lisoText(a);
            if(!nome || /^(diretor|elenco|gênero|genero)$/i.test(nome)) return;
            const href = a.getAttribute('href') || a.href || '';
            if(href && !/\/category\//i.test(href)) return;
            const slug = (typeof slugCronos === 'function') ? slugCronos(nome) : nome.toLowerCase().replace(/\s+/g, '-');
            if(vistos.has(slug)) return;
            vistos.add(slug);
            generos.push({ nome, slug, url: lisoAbsUrl(href || `/category/${slug}/`) });
        };
        const areas = [
            doc.querySelector('main article.TPost.A:not(.D) .Description'),
            doc.querySelector('article.TPost.A:not(.D) .Description'),
            doc.querySelector('.TpRwCont main article.TPost.A .Description')
        ].filter(Boolean);
        areas.forEach(area => {
            area.querySelectorAll('p.Genre a[href*="/category/"], p.Genre a').forEach(addGenero);
            // Em páginas de temporada/série do Liso, os gêneros vêm dentro de p.Cast, mas com href /category/.
            area.querySelectorAll('p.Cast a[href*="/category/"]').forEach(addGenero);
            if(!generos.length) area.querySelectorAll('.genres a[href*="/category/"], .sgeneros a[href*="/category/"]').forEach(addGenero);
        });
        return generos;
    }

    function lisoExtrairNumeroTemporada(section, urlBase){
        const txt = lisoText(section.querySelector('.Top .Title, .Title')) || '';
        let m = txt.match(/temporada\s*(\d+)/i) || txt.match(/\b(\d+)\b/);
        if(m && m[1]) return String(parseInt(m[1], 10));
        try {
            const slug = new URL(urlBase || location.href, 'https://lisoflix.net/').pathname.split('/').filter(Boolean).pop() || '';
            m = slug.match(/(?:temporada|season|-)(\d+)$/i) || slug.match(/(\d+)$/);
            if(m && m[1]) return String(parseInt(m[1], 10));
        } catch(e) {}
        return '1';
    }

    function lisoColetarEpisodiosDeTemporadas(doc, urlBase, serieTitulo, posterSerie, backdropSerie, anoSerie){
        const temporadas = {};
        const sections = Array.from(doc.querySelectorAll('.SeasonBx'));
        sections.forEach((section, sIndex) => {
            const tempNum = lisoExtrairNumeroTemporada(section, urlBase) || String(sIndex + 1);
            if(!temporadas[tempNum]) temporadas[tempNum] = [];
            const rows = Array.from(section.querySelectorAll('.TPTblCn tbody tr, .TPTblCn tr, tr')).filter(tr => tr.querySelector('a[href*="/episodio/"]'));
            rows.forEach((tr, eIndex) => {
                const link = tr.querySelector('.MvTbTtl a[href], a[href*="/episodio/"]');
                const epUrl = lisoAbsUrl(link?.getAttribute('href') || link?.href || '');
                if(!epUrl) return;
                const num = lisoText(tr.querySelector('.Num')) || String(eIndex + 1);
                const epTitulo = lisoLimparTitulo(lisoText(link) || `Episódio ${num}`) || `Episódio ${num}`;
                const data = lisoText(tr.querySelector('.MvTbTtl span, .date, time')) || anoSerie || '';
                const imgEl = tr.querySelector('.MvTbImg img, img.TPostBg, img');
                const img = lisoNormalizarImagemDetalheCronos(lisoPegarImagem(imgEl), 'backdrop') || backdropSerie || posterSerie || '';
                temporadas[tempNum].push({
                    url: epUrl,
                    titulo: epTitulo,
                    data,
                    img,
                    episodio: String(parseInt(num, 10) || (eIndex + 1)),
                    temporada: tempNum,
                    serieTitulo,
                    posterSerie,
                    backdropSerie
                });
            });
        });
        return temporadas;
    }

    function lisoMesclarTemporadas(destino, origem){
        Object.keys(origem || {}).forEach(t => {
            if(!destino[t]) destino[t] = [];
            const vistos = new Set(destino[t].map(e => String(e.url || '').replace(/[?#].*$/,'').replace(/\/+$/,'')));
            origem[t].forEach(ep => {
                const k = String(ep.url || '').replace(/[?#].*$/,'').replace(/\/+$/,'');
                if(k && !vistos.has(k)){ destino[t].push(ep); vistos.add(k); }
            });
        });
        return destino;
    }

    function lisoLinksTemporadas(doc){
        const vistos = new Set();
        const links = [];
        doc.querySelectorAll('a[href*="/temporada/"]').forEach(a => {
            const url = lisoAbsUrl(a.getAttribute('href') || a.href || '');
            const key = url.replace(/[?#].*$/,'').replace(/\/+$/,'');
            if(url && !vistos.has(key)){ vistos.add(key); links.push(url); }
        });
        return links;
    }

    function lisoRenderizarGradeEpisodios(temporadas, tituloSerie, posterSerie, backdropSerie, anoSerie){
        const container = document.getElementById('listaEpisodios');
        if(!container) return 0;
        container.innerHTML = '';
        const sids = Object.keys(temporadas || {}).filter(k => temporadas[k] && temporadas[k].length).sort((a,b) => Number(a) - Number(b));
        const totalEps = sids.reduce((n, sid) => n + temporadas[sid].length, 0);
        const bTem = document.getElementById('badgeTemporadas');
        const bEps = document.getElementById('badgeEpisodios');
        if(bTem) bTem.innerText = `${sids.length} TEMPORADA${sids.length !== 1 ? 'S' : ''}`;
        if(bEps) bEps.innerText = `${totalEps} EPISÓDIO${totalEps !== 1 ? 'S' : ''}`;
        if(!totalEps){
            container.innerHTML = '<h3 style="color:#aaa; text-align:center; margin-top:20px;">Nenhuma estrutura de episódios localizada no Liso.</h3>';
            return 0;
        }
        document.querySelectorAll('#linha2Ficha .btn-audio-tag').forEach(el => el.remove());
        const tagQualidade = document.querySelector('#linha2Ficha .tag-qualidade');
        if(tagQualidade){
            const btnDub = document.createElement('button');
            btnDub.className = 'btn-audio-tag ativo';
            btnDub.innerText = 'Dublado';
            btnDub.setAttribute('data-audio', 'dublado');
            tagQualidade.after(btnDub);
        }
        let temporadaAtual = sids[0];
        const tabs = document.createElement('div');
        tabs.className = 'tabs-temporadas';
        const grid = document.createElement('ul');
        grid.className = 'grid-episodios';
        const render = (sid) => {
            temporadaAtual = sid;
            Array.from(tabs.children).forEach(btn => btn.classList.toggle('ativo', btn.dataset.sid === sid));
            grid.innerHTML = '';
            const lista = temporadas[sid] || [];
            lista.forEach((ep, idx) => {
                const epNum = String(parseInt(ep.episodio, 10) || (idx + 1)).padStart(2, '0');
                const tempNum = String(parseInt(sid, 10) || 1).padStart(2, '0');
                const tituloFormatado = `S${tempNum}E${epNum} - ${ep.titulo || ('Episódio ' + epNum)}`;
                const thumb = lisoNormalizarImagemDetalheCronos(ep.img || backdropSerie || posterSerie, 'backdrop') || posterSerie || placeholderCronosPoster();
                try {
                    if(typeof salvarEpisodioCronos === 'function') salvarEpisodioCronos({
                        id: gerarIdCronos(ep.url),
                        url: ep.url,
                        serieUrl: obraSendoVista && obraSendoVista.url ? obraSendoVista.url : '',
                        nomeSerie: tituloSerie,
                        titulo: `${tituloSerie} - ${tituloFormatado}`,
                        serieTitulo: tituloSerie,
                        temporada: String(parseInt(sid, 10) || 1),
                        episodio: String(parseInt(ep.episodio, 10) || (idx + 1)),
                        poster: thumb,
                        img: thumb,
                        backdrop: backdropSerie || '',
                        ano: lisoAno(ep.data || anoSerie || ''),
                        data: ep.data || '',
                        tipo: 'Episódio',
                        providerKey:'l07', providerName:'Fonte LISO', providerSigla:'LISO', baseUrl:'https://lisoflix.net/'
                    });
                } catch(e) {}
                const card = document.createElement('li');
                card.className = 'ep-card';
                card.innerHTML = `
                    <div class="ep-thumb">
                        <img src="${thumb}" alt="Episódio">
                        <div class="ep-badge">DUB</div>
                        <div class="ep-play-icon">▶</div>
                    </div>
                    <div class="ep-info">
                        <span class="ep-title">${tituloFormatado}</span>
                        <span class="ep-year">${ep.data || anoSerie || ''}</span>
                    </div>
                `;
                card.onclick = () => prepararEpisodioDooplay(`${tituloSerie} - ${tituloFormatado}`, ep.url);
                grid.appendChild(card);
            });
        };
        if(sids.length > 1){
            sids.forEach(sid => {
                const btn = document.createElement('button');
                btn.className = 'btn-temporada';
                btn.dataset.sid = sid;
                btn.innerText = String(parseInt(sid, 10) || sid);
                btn.onclick = () => render(sid);
                tabs.appendChild(btn);
            });
            container.appendChild(tabs);
        }
        container.appendChild(grid);
        render(temporadaAtual);
        return totalEps;
    }

    async function lisoCarregarTemporadasSerie(doc, url, titulo, poster, backdrop, ano){
        let temporadas = lisoColetarEpisodiosDeTemporadas(doc, url, titulo, poster, backdrop, ano);
        if(Object.values(temporadas).reduce((n, arr) => n + arr.length, 0) > 0) return temporadas;
        const links = lisoLinksTemporadas(doc).slice(0, 20);
        for(const link of links){
            try {
                const res = await fetch(PROXY + encodeURIComponent(link));
                if(!res.ok) continue;
                const html = await res.text();
                const docTemp = new DOMParser().parseFromString(html, 'text/html');
                const tempData = lisoColetarEpisodiosDeTemporadas(docTemp, link, titulo, poster, backdrop, ano);
                temporadas = lisoMesclarTemporadas(temporadas, tempData);
                if(typeof esperar === 'function') await esperar(40);
            } catch(e) { console.warn('Falha ao buscar temporada LISO:', link, e); }
        }
        return temporadas;
    }

    async function analisarObraLisoCorrigido(url, ano, tituloCard, img, isMovie){
        const status = document.getElementById('statusDetalhes');
        try {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            ativarTela('telaDetalhes');
            limparBotoesTransmissaoDetalheCronos();
            if(status){ status.className = 'loading-text'; status.innerText = 'Extraindo metadados do Liso...'; status.style.display = 'block'; status.style.color = ''; }
            document.getElementById('blocoDetalhesInfo').style.display = 'none';
            document.getElementById('areaAcaoDetalhe').innerHTML = '';
            document.getElementById('listaEpisodios').innerHTML = '';
            document.getElementById('linha4Volume').style.display = 'none';
            ['linha1Original', 'linha2Ficha', 'linha3Generos', 'linha4Volume'].forEach(id => { const el = document.getElementById(id); if(el) el.innerHTML = ''; });
            const backdropEl = document.getElementById('backdropDetalhes');
            if(backdropEl) backdropEl.style.backgroundImage = 'none';

            obraSendoVista = { url, titulo: tituloCard, ano, img, poster: img, isMovie, providerKey:'l07', providerName:'Fonte LISO', providerSigla:'LISO', baseUrl:'https://lisoflix.net/' };
            try { window.obraSendoVista = obraSendoVista; } catch(e) {}
            checarBotaoFavorito(url);

            const res = await fetch(PROXY + encodeURIComponent(url));
            if(!res.ok) throw new Error('Falha HTTP LISO');
            const html = await res.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const urlLower = String(url || '').toLowerCase();
            const ehPlayerUnico = !!isMovie || urlLower.includes('/movies/') || urlLower.includes('/episodio/');
            const tipoObra = urlLower.includes('/episodio/') ? 'Episódio' : (ehPlayerUnico ? 'Filme' : 'Série');

            let titulo = lisoExtrairTituloDetalheCorrigido(doc, tituloCard, url);
            const posterSrc = lisoExtrairPosterDetalheCorrigido(doc, img) || img || placeholderCronosPoster();
            const bgUrl = lisoExtrairBackdropDetalheCorrigido(doc, posterSrc) || posterSrc;
            const sinopse = lisoExtrairSinopseDetalhePremium(doc);
            const generos = lisoExtrairGenerosDetalheCorrigido(doc);
            const anoLimpo = lisoAno(ano || lisoText(doc.querySelector('.Info .Date, .Date, .year, time')) || doc.body?.innerText?.slice(0, 2500) || '') || ano || '';
            const qualidade = lisoText(doc.querySelector('.Info .Qlty, .Qlty, .quality')) || 'LISO';
            const duracao = lisoText(doc.querySelector('.Info .Time, .Time, .runtime')) || '';
            let iframeSrc = extrairLinkLimpoDoPlayer(doc, html) || doc.querySelector('.VideoPlayer iframe[src], iframe[src*="trembed"], iframe[src]')?.getAttribute('src') || '';
            if(iframeSrc) iframeSrc = lisoAbsUrl(iframeSrc.replace(/&#038;/g, '&').replace(/&amp;/g, '&'));

            document.getElementById('detalheTitulo').innerText = titulo;
            document.getElementById('detalheImg').src = posterSrc || placeholderCronosPoster();
            if(backdropEl) backdropEl.style.backgroundImage = bgUrl ? `url(${bgUrl})` : 'none';
            document.getElementById('detalheSinopse').innerText = sinopse;
            document.getElementById('linha1Original').innerText = '';
            let linha2Html = `<span class="tag-meta tag-nota">IMDb: ${extrairNotaImdbDetalheCronos(doc)}</span>`;
            linha2Html += `<span class="tag-meta tag-qualidade">${qualidade}</span>`;
            if(duracao) linha2Html += `<span class="tag-meta tag-duracao">${duracao}</span>`;
            if(anoLimpo) linha2Html += `<span class="tag-meta">${anoLimpo}</span>`;
            document.getElementById('linha2Ficha').innerHTML = linha2Html;
            document.getElementById('linha3Generos').innerHTML = generos.map(g => `<span class="tag-meta tag-genero">${g.nome}</span>`).join('');
            if(!ehPlayerUnico){
                document.getElementById('linha4Volume').innerHTML = `<span class="tag-meta tag-temporada" id="badgeTemporadas">A calcular...</span><span class="tag-meta tag-episodios" id="badgeEpisodios">A calcular...</span>`;
                document.getElementById('linha4Volume').style.display = 'flex';
            }

            obraSendoVista = { url, titulo, ano: anoLimpo || ano, img: posterSrc, poster: posterSrc, backdrop: bgUrl, sinopse, generos, isMovie: ehPlayerUnico, tipo: tipoObra, playerUrl: iframeSrc || '', providerKey:'l07', providerName:'Fonte LISO', providerSigla:'LISO', baseUrl:'https://lisoflix.net/' };
            try { window.obraSendoVista = obraSendoVista; } catch(e) {}
            try { await salvarObraCronos(obraSendoVista); await salvarHistoricoHome(obraSendoVista); } catch(e) { console.warn('Falha ao salvar detalhe LISO:', e); }
            checarBotaoFavorito(url);

            if(status) status.style.display = 'none';
            document.getElementById('blocoDetalhesInfo').style.display = 'flex';
            ajustarQuebraTituloDetalheCronos();

            if(ehPlayerUnico){
                limparBotoesTransmissaoDetalheCronos();
                await renderizarBotoesPlayerUnificadoCronos(titulo, doc, html, iframeSrc);
            } else {
                if(status){ status.innerText = 'Carregando temporadas do Liso...'; status.style.display = 'block'; }
                const temporadas = await lisoCarregarTemporadasSerie(doc, url, titulo, posterSrc, bgUrl, anoLimpo || ano);
                if(status) status.style.display = 'none';
                lisoRenderizarGradeEpisodios(temporadas, titulo, posterSrc, bgUrl, anoLimpo || ano);
            }
        } catch(err) {
            console.error(err);
            if(status){ status.className = 'error-text'; status.innerText = 'Erro crítico ao processar as informações do Liso.'; status.style.display = 'block'; }
        }
    }

    async function lisoExtrairDetalhesDestaquePremium(urlObra){
        const url = lisoAbsUrl(urlObra);
        const prev = window.__CRONOS_RENDER_PROVIDER_KEY;
        window.__CRONOS_RENDER_PROVIDER_KEY = 'l07';
        window.__CRONOS_LAST_PROVIDER_RENDERED = 'l07';
        try {
            const res = await fetch(PROXY + encodeURIComponent(url));
            const html = await res.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            let titulo = lisoExtrairTituloDetalheCorrigido(doc, lisoTituloPorUrl(url), url);
            const poster = lisoExtrairPosterDetalheCorrigido(doc, '');
            const backdrop = lisoExtrairBackdropDetalheCorrigido(doc, poster);
            const sinopse = lisoExtrairSinopseDetalhePremium(doc);
            const ano = lisoAno((doc.querySelector('.date, .year, time, .Date, .Info .Date')?.innerText || '') + ' ' + (doc.body?.innerText?.slice(0, 2500) || ''));
            const generos = lisoExtrairGenerosDetalheCorrigido(doc);
            const tipo = url.includes('/movies/') ? 'Filme' : (url.includes('/episodio/') ? 'Episódio' : 'Série');
            return { titulo: titulo || undefined, img: poster || undefined, poster: poster || undefined, backdrop: backdrop || poster || '', sinopse: sinopse || '', ano: ano || undefined, generos, tipo, isMovie: tipo === 'Filme', isSerie: tipo === 'Série' };
        } catch(e) {
            console.warn('Falha ao enriquecer destaque LISO:', url, e);
            return {};
        } finally {
            window.__CRONOS_RENDER_PROVIDER_KEY = prev;
        }
    }

    const analisarObraComMultiProviderAntesDoLiso = (typeof window.analisarObra === 'function') ? window.analisarObra : (typeof analisarObra === 'function' ? analisarObra : null);
    if(analisarObraComMultiProviderAntesDoLiso){
        window.analisarObra = function(url, ano, tituloCard, img, isMovie){
            const key = providerPorUrl(url);
            if(!fonteAtiva(key)){ mostrarAvisoFonteDesativada(key); return false; }
            if(key === 'primeflix' || /primeflix\.mom/i.test(String(url || ''))) return analisarObraPrimeCorrigido(url, ano, tituloCard, img, isMovie);
            if(key === 'l07' || lisoEhUrlCronos(url)) return analisarObraLisoCorrigido(url, ano, tituloCard, img, isMovie);
            return analisarObraComMultiProviderAntesDoLiso.apply(this, arguments);
        };
        try { analisarObra = window.analisarObra; } catch(e) {}
    }

    document.addEventListener('DOMContentLoaded', function(){
        garantirPainelProvider();
        atualizarBotoesProvider();
        setTimeout(() => { garantirPainelProvider(); aplicarFiltroVisualCronos(); }, 300);
    });
    setTimeout(() => { garantirPainelProvider(); atualizarBotoesProvider(); aplicarFiltroVisualCronos(); }, 700);
})();
