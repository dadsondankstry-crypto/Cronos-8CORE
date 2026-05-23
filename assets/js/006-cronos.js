
/* ===== Centraliza antes do paint: sem aparecer no canto e depois pular ===== */
(function(){
    let aplicando = false;

    function norm(txt){
        return String(txt || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g,'')
            .toLowerCase()
            .replace(/\s+/g,' ')
            .trim();
    }

    function alvo(el){
        return norm([
            el.textContent || '',
            el.id || '',
            el.className || '',
            el.getAttribute('onclick') || '',
            el.getAttribute('title') || ''
        ].join(' '));
    }

    function isAtualizar(el){
        const a = alvo(el);
        return a.includes('atualizar') ||
               a.includes('recarregar') ||
               a.includes('refresh') ||
               a.includes('reload');
    }

    function isVoltar(el){
        return alvo(el).includes('voltar');
    }

    function isFavorito(el){
        const a = alvo(el);
        return a.includes('favorito') || a.includes('favoritar');
    }

    function isTransmissao(el){
        const a = alvo(el);
        return !isAtualizar(el) && (
            a.includes('iniciar transmissao') ||
            a.includes('transmissao') ||
            a.includes('transmiss') ||
            a.includes('player')
        );
    }

    function getTela(){
        return document.getElementById('telaDetalhes');
    }

    function esconderAtualizar(tela){
        Array.from(tela.querySelectorAll('button,a')).forEach(btn => {
            if (!isAtualizar(btn)) return;

            btn.style.setProperty('display', 'none', 'important');
            btn.style.setProperty('visibility', 'hidden', 'important');
            btn.style.setProperty('opacity', '0', 'important');
            btn.style.setProperty('pointer-events', 'none', 'important');
            btn.style.setProperty('width', '0', 'important');
            btn.style.setProperty('height', '0', 'important');
            btn.style.setProperty('min-width', '0', 'important');
            btn.style.setProperty('min-height', '0', 'important');
            btn.style.setProperty('margin', '0', 'important');
            btn.style.setProperty('padding', '0', 'important');
            btn.style.setProperty('border', '0', 'important');
            btn.setAttribute('aria-hidden', 'true');
            btn.tabIndex = -1;
        });
    }

    function organizarVoltarFavorito(tela){
        if (window.innerWidth > 720) return;

        const botoes = Array.from(tela.querySelectorAll('button,a')).filter(btn => !isAtualizar(btn));
        const btnVoltar = botoes.find(isVoltar);
        const btnFavorito = botoes.find(isFavorito);

        if (!btnVoltar || !btnFavorito) return;

        let barra = tela.querySelector('.detalhe-actions-cronos-mobile');
        if (!barra) {
            barra = document.createElement('div');
            barra.className = 'detalhe-actions-cronos-mobile';
            tela.insertBefore(barra, tela.firstElementChild);
        }

        if (btnVoltar.parentElement !== barra) barra.appendChild(btnVoltar);
        if (btnFavorito.parentElement !== barra) barra.appendChild(btnFavorito);
    }

    function limparPatchesAntigosDoBotao(btn){
        btn.classList.remove(
            'cronos-transmissao-centro-real-btn',
            'cronos-btn-transmissao-centro',
            'cronos-btn-transmissao-fixo',
            'cronos-btn-transmissao-dentro-fix'
        );

        btn.style.removeProperty('left');
        btn.style.removeProperty('right');
        btn.style.setProperty('position', 'static', 'important');
        btn.style.setProperty('transform', 'none', 'important');
    }

    function acharContainerDaFicha(tela, btn){
        const seletores = [
            '.detalhe-card',
            '.detail-card',
            '.detalhe-hero',
            '.detail-hero',
            '.obra-detalhe',
            '.details-card',
            '.detalhe-container',
            '.detail-container'
        ];

        for (const sel of seletores) {
            const c = btn.closest(sel);
            if (c && tela.contains(c)) return c;
        }

        let el = btn.parentElement;
        while (el && el !== tela) {
            const r = el.getBoundingClientRect();
            if (r.width > 250 && r.height > 180) return el;
            el = el.parentElement;
        }

        return tela;
    }

    function centralizarTransmissaoSemPulo(tela){
        if (window.innerWidth > 720) return;

        const btn = Array.from(tela.querySelectorAll('button,a')).find(isTransmissao);
        if (!btn) return;

        limparPatchesAntigosDoBotao(btn);

        let wrap = btn.closest('.cronos-transmissao-sem-pulo-wrap');

        if (!wrap) {
            wrap = document.createElement('div');
            wrap.className = 'cronos-transmissao-sem-pulo-wrap';

            const container = acharContainerDaFicha(tela, btn);

            /* coloca o wrapper exatamente onde o botão já estava, sem mandar para fora da ficha */
            btn.parentNode.insertBefore(wrap, btn);
            wrap.appendChild(btn);

            /* Mantém o wrapper dentro da areaAcaoDetalhe.
               Antes ele era movido para o container da ficha; aí areaAcaoDetalhe era limpa
               ao abrir outro filme, mas o botão antigo continuava fora dela e duplicava. */
        }

        btn.classList.add('cronos-transmissao-sem-pulo-btn');

        wrap.style.setProperty('display', 'flex', 'important');
        wrap.style.setProperty('justify-content', 'center', 'important');
        wrap.style.setProperty('align-items', 'center', 'important');
        wrap.style.setProperty('width', '100%', 'important');
        wrap.style.setProperty('max-width', '100%', 'important');
        wrap.style.setProperty('grid-column', '1 / -1', 'important');
        wrap.style.setProperty('flex-basis', '100%', 'important');
        wrap.style.setProperty('margin', '16px 0 0', 'important');
        wrap.style.setProperty('padding', '0', 'important');
        wrap.style.setProperty('box-sizing', 'border-box', 'important');
        wrap.style.setProperty('text-align', 'center', 'important');
        wrap.style.setProperty('clear', 'both', 'important');

        btn.style.setProperty('display', 'flex', 'important');
        btn.style.setProperty('align-items', 'center', 'important');
        btn.style.setProperty('justify-content', 'center', 'important');
        btn.style.setProperty('width', window.innerWidth <= 360 ? '74%' : '70%', 'important');
        btn.style.setProperty('max-width', window.innerWidth <= 360 ? '74%' : '70%', 'important');
        btn.style.setProperty('min-width', window.innerWidth <= 360 ? '215px' : '230px', 'important');
        btn.style.setProperty('height', '44px', 'important');
        btn.style.setProperty('min-height', '44px', 'important');
        btn.style.setProperty('max-height', '44px', 'important');
        btn.style.setProperty('margin', '0 auto', 'important');
        btn.style.setProperty('padding', '0 14px', 'important');
        btn.style.setProperty('box-sizing', 'border-box', 'important');
        btn.style.setProperty('white-space', 'nowrap', 'important');
        btn.style.setProperty('text-align', 'center', 'important');
        btn.style.setProperty('font-size', window.innerWidth <= 360 ? '12px' : '14px', 'important');
        btn.style.setProperty('line-height', '1', 'important');
        btn.style.setProperty('float', 'none', 'important');
        btn.style.setProperty('position', 'static', 'important');
        btn.style.setProperty('left', 'auto', 'important');
        btn.style.setProperty('right', 'auto', 'important');
        btn.style.setProperty('transform', 'none', 'important');
        btn.style.setProperty('transition', 'none', 'important');
        btn.style.setProperty('animation', 'none', 'important');
    }

    function aplicar(){
        if (aplicando) return;

        const tela = getTela();
        if (!tela) return;

        aplicando = true;
        esconderAtualizar(tela);
        organizarVoltarFavorito(tela);
        centralizarTransmissaoSemPulo(tela);
        aplicando = false;
    }

    function init(){
        aplicar();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.addEventListener('resize', aplicar);
    document.addEventListener('click', function(){
        aplicar();
        setTimeout(aplicar, 80);
    }, true);

    /* MutationObserver leve e imediato: aplica antes do navegador pintar a ficha */
    const obs = new MutationObserver(function(muts){
        const tela = getTela();
        if (!tela) return;
        for (const m of muts) {
            if (tela.contains(m.target) || m.target === tela) {
                aplicar();
                break;
            }
        }
    });

    if (document.body) {
        obs.observe(document.body, { childList: true, subtree: true });
    }
})();
