
(function(){
    function normCronosAjuste(t){return String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
    function acharBotaoPorTexto(container, texto){
        const alvo = normCronosAjuste(texto);
        return [...container.querySelectorAll('button,a')].find(b => normCronosAjuste(b.textContent).includes(alvo));
    }
    function criarBotaoAtalho(texto, acao){
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'categoria-atalho-btn';
        b.textContent = texto;
        b.onclick = acao;
        return b;
    }
    function aplicarAjusteConfigLancamentos(){
        const cat = document.getElementById('telaCategorias');
        if(cat){
            [...cat.querySelectorAll('.categoria-atalhos button,.categoria-atalhos a,.cronos-categoria-atalhos-letras button,.cronos-categoria-atalhos-letras a')].forEach(b => {
                const t = normCronosAjuste(b.textContent);
                if(t.includes('episod') || t.includes('lancamento') || t.includes('anime')) b.remove();
            });
            [...cat.querySelectorAll('.categoria-atalhos,.cronos-categoria-atalhos-letras')].forEach(box => {
                if(!box.querySelector('button,a')) box.remove();
            });
        }

        const cfg = document.getElementById('telaConfiguracoes');
        if(!cfg) return;
        let box = cfg.querySelector('.cronos-categoria-atalhos-letras') || cfg.querySelector('.categoria-atalhos');
        if(!box){
            box = document.createElement('div');
            box.className = 'cronos-categoria-atalhos-letras';
            const titulo = [...cfg.querySelectorAll('h1,h2,h3')].find(h => /configura/i.test(h.textContent||''));
            if(titulo && titulo.nextSibling) cfg.insertBefore(box, titulo.nextSibling);
            else cfg.insertBefore(box, cfg.firstChild);
        }
        box.classList.add('cronos-categoria-atalhos-letras');

        let btnTemp = acharBotaoPorTexto(cfg, 'Temporadas') || criarBotaoAtalho('Temporadas', function(e){
            e.preventDefault();
            if(typeof window.iniciarNavegacao === 'function') window.iniciarNavegacao('telaTemporadas', 'https://www.boraflix.click/temporadas/', document.querySelector('button[onclick*=\'carregarConfiguracoes\']') || this);
        });
        let btnEp = acharBotaoPorTexto(cfg, 'Episódios') || criarBotaoAtalho('Episódios', function(e){
            e.preventDefault();
            if(typeof window.iniciarNavegacao === 'function') window.iniciarNavegacao('telaEpisodios', 'https://www.boraflix.click/episodios/', document.querySelector('button[onclick*=\'carregarConfiguracoes\']') || this);
        });
        let btnLetras = cfg.querySelector('.btn-letras-categoria-cronos');
        let btnLanc = acharBotaoPorTexto(cfg, 'Lançamentos') || criarBotaoAtalho('Lançamentos', function(e){
            e.preventDefault();
            if(typeof window.carregarLancamentos === 'function') window.carregarLancamentos(document.querySelector('button[onclick*=\'carregarConfiguracoes\']') || this);
            else if(typeof window.ativarTela === 'function') window.ativarTela('telaLancamentos', this);
        });
        let btnAnime = acharBotaoPorTexto(cfg, 'Animes') || acharBotaoPorTexto(cfg, 'Anime') || criarBotaoAtalho('Animes', function(e){
            e.preventDefault();
            if(typeof window.iniciarNavegacao === 'function') window.iniciarNavegacao('telaAnimes', 'https://primeflix.mom/animes', document.querySelector('button[onclick*=\'carregarConfiguracoes\']') || this);
        });

        btnTemp.textContent = 'Temporadas';
        btnEp.textContent = 'Episódios';
        btnLanc.textContent = 'Lançamentos';
        btnAnime.textContent = 'Animes';
        if(btnLetras) btnLetras.textContent = 'Letras';

        [btnTemp, btnEp, btnLetras, btnLanc, btnAnime].filter(Boolean).forEach(b => box.appendChild(b));
    }
    function agendar(){aplicarAjusteConfigLancamentos(); setTimeout(aplicarAjusteConfigLancamentos, 250); setTimeout(aplicarAjusteConfigLancamentos, 1000); setTimeout(aplicarAjusteConfigLancamentos, 2000);}
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', agendar); else agendar();
})();
