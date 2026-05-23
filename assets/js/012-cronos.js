
(function(){
    function normalizarUrlV24(u){ return String(u || '').toLowerCase(); }

    function detectarNomePlayerCronosV24(url){
        const u = normalizarUrlV24(url || document.getElementById('iframePlayer')?.src || '');
        if (/superflixapi/i.test(u)) return 'Superflix API';
        if (/superembeds/i.test(u)) return 'Superembeds';
        if (/superembed/i.test(u)) return 'Superembed';
        if (/viewplayer/i.test(u)) return 'ViewPlayer';
        if (/playerthree/i.test(u)) return 'PlayerThree';
        if (/trembed/i.test(u)) return 'Trembed';
        return 'Player';
    }

    function garantirEstruturaPlayerLabelV24(){
        const tela = document.getElementById('telaPlayer');
        if (!tela) return;
        const wrapper = tela.querySelector('.player-wrapper');
        const header = tela.querySelector('.header-player');
        const fechar = tela.querySelector('.btn-fechar-player');
        const nav = document.getElementById('playerNavegacao');
        if (!wrapper || !header || !fechar) return;

        let controles = header.querySelector('.player-top-controls-v19');
        if (!controles) {
            controles = document.createElement('div');
            controles.className = 'player-top-controls-v19';
            header.appendChild(controles);
        }

        let labelMobile = document.getElementById('cronosPlayerTipoLabelMobileV24');
        if (!labelMobile) {
            labelMobile = document.createElement('div');
            labelMobile.id = 'cronosPlayerTipoLabelMobileV24';
            labelMobile.className = 'cronos-player-tipo-label-v24';
            labelMobile.textContent = 'Player';
        }
        if (labelMobile.parentElement !== controles) controles.insertBefore(labelMobile, fechar);
        if (fechar.parentElement !== controles) controles.appendChild(fechar);

        let row = document.getElementById('cronosPlayerBottomRowV24');
        if (!row) {
            row = document.createElement('div');
            row.id = 'cronosPlayerBottomRowV24';
        }
        if (row.previousElementSibling !== wrapper) wrapper.insertAdjacentElement('afterend', row);

        let labelDesktop = document.getElementById('cronosPlayerTipoLabelDesktopV24');
        if (!labelDesktop) {
            labelDesktop = document.createElement('div');
            labelDesktop.id = 'cronosPlayerTipoLabelDesktopV24';
            labelDesktop.className = 'cronos-player-tipo-label-v24';
            labelDesktop.textContent = 'Player';
        }
        if (labelDesktop.parentElement !== row) row.insertBefore(labelDesktop, row.firstChild);
        if (nav && nav.parentElement !== row) row.appendChild(nav);
    }

    function atualizarNomePlayerCronosV24(url){
        garantirEstruturaPlayerLabelV24();
        const nome = detectarNomePlayerCronosV24(url);
        const desktop = document.getElementById('cronosPlayerTipoLabelDesktopV24');
        const mobile = document.getElementById('cronosPlayerTipoLabelMobileV24');
        if (desktop) desktop.textContent = nome;
        if (mobile) mobile.textContent = nome;
    }

    const abrirBase = window.abrirPlayer;
    if (typeof abrirBase === 'function' && !abrirBase.__cronosV24PlayerLabel) {
        window.abrirPlayer = function(titulo, urlVideo){
            const r = abrirBase.apply(this, arguments);
            requestAnimationFrame(() => {
                garantirEstruturaPlayerLabelV24();
                atualizarNomePlayerCronosV24(urlVideo || document.getElementById('iframePlayer')?.src || '');
            });
            setTimeout(() => {
                garantirEstruturaPlayerLabelV24();
                atualizarNomePlayerCronosV24(urlVideo || document.getElementById('iframePlayer')?.src || '');
            }, 80);
            return r;
        };
        window.abrirPlayer.__cronosV24PlayerLabel = true;
    }

    const fecharBase = window.fecharPlayer;
    if (typeof fecharBase === 'function' && !fecharBase.__cronosV24PlayerLabel) {
        window.fecharPlayer = function(){
            const r = fecharBase.apply(this, arguments);
            setTimeout(() => atualizarNomePlayerCronosV24(''), 20);
            return r;
        };
        window.fecharPlayer.__cronosV24PlayerLabel = true;
    }

    function iniciar(){
        garantirEstruturaPlayerLabelV24();
        atualizarNomePlayerCronosV24(document.getElementById('iframePlayer')?.src || '');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
    window.addEventListener('resize', () => {
        clearTimeout(window.__cronosV24Resize);
        window.__cronosV24Resize = setTimeout(garantirEstruturaPlayerLabelV24, 120);
    }, { passive: true });
})();
