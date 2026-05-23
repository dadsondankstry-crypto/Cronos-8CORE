
(function(){
    function tipoPlayerCronosV7(urlVideo){
        const u = String(urlVideo || '').toLowerCase();

        // Esses players normalmente abrem uma tela própria com Dublado/Legendado
        // e Servidor Principal/Alternativo. Se centralizar, os botões somem.
        // Ajuste V10: superflixapi volta para o topo.
        // superembeds/superembed ficam centralizados para testar como player de vídeo direto.
        if (/superflixapi/i.test(u)) return 'seletor';
        if (/superembeds|superembed/i.test(u)) return 'video';

        // Esses normalmente já entram no vídeo/controlador 16:9.
        if (/viewplayer|playerthree|trembed/i.test(u)) return 'video';

        // Padrão seguro: centralizar, porque a maioria dos iframes diretos é vídeo.
        return 'video';
    }

    function aplicarModoPlayerCronosV7(urlVideo){
        const tela = document.getElementById('telaPlayer');
        if (!tela) return;
        const modo = tipoPlayerCronosV7(urlVideo || document.getElementById('iframePlayer')?.src || '');
        tela.classList.remove('player-modo-seletor', 'player-modo-video');
        tela.classList.add(modo === 'seletor' ? 'player-modo-seletor' : 'player-modo-video');
        tela.dataset.playerModo = modo;
    }

    const abrirAtual = window.abrirPlayer;
    if (typeof abrirAtual === 'function' && !abrirAtual.__cronosV7PlayerPorTipo) {
        const abrirNovo = function(titulo, urlVideo){
            aplicarModoPlayerCronosV7(urlVideo);
            const retorno = abrirAtual.apply(this, arguments);
            aplicarModoPlayerCronosV7(urlVideo);
            return retorno;
        };
        abrirNovo.__cronosV7PlayerPorTipo = true;
        window.abrirPlayer = abrirNovo;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => aplicarModoPlayerCronosV7());
    } else {
        aplicarModoPlayerCronosV7();
    }

    window.cronosAplicarModoPlayerV7 = aplicarModoPlayerCronosV7;
})();
