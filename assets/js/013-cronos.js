
(function(){
    let travando = false;
    function travarLinhaPlayerV26(){
        if(travando) return;
        travando = true;
        try {
            const tela = document.getElementById('telaPlayer');
            const wrap = tela && tela.querySelector('.player-wrapper');
            const nav = document.getElementById('playerNavegacao');
            if(!tela || !wrap) return;

            let row = document.getElementById('cronosPlayerBottomRowV24');
            if(!row){
                row = document.createElement('div');
                row.id = 'cronosPlayerBottomRowV24';
                wrap.insertAdjacentElement('afterend', row);
            } else if(row.previousElementSibling !== wrap){
                wrap.insertAdjacentElement('afterend', row);
            }

            let label = document.getElementById('cronosPlayerTipoLabelDesktopV24');
            if(!label){
                label = document.createElement('div');
                label.id = 'cronosPlayerTipoLabelDesktopV24';
                label.className = 'cronos-player-tipo-label-v24';
                label.textContent = document.getElementById('cronosPlayerTipoLabelMobileV24')?.textContent || 'Player';
            }
            if(label.parentElement !== row) row.insertBefore(label, row.firstChild);
            if(nav && nav.parentElement !== row) row.appendChild(nav);
        } finally {
            travando = false;
        }
    }

    const abrirBase = window.abrirPlayer;
    if(typeof abrirBase === 'function' && !abrirBase.__cronosV26LabelLock){
        window.abrirPlayer = function(){
            const r = abrirBase.apply(this, arguments);
            travarLinhaPlayerV26();
            setTimeout(travarLinhaPlayerV26, 30);
            setTimeout(travarLinhaPlayerV26, 120);
            return r;
        };
        window.abrirPlayer.__cronosV26LabelLock = true;
    }

    const mo = new MutationObserver(() => {
        const tela = document.getElementById('telaPlayer');
        if(tela && tela.classList.contains('ativa')) requestAnimationFrame(travarLinhaPlayerV26);
    });
    function iniciar(){
        travarLinhaPlayerV26();
        const tela = document.getElementById('telaPlayer');
        if(tela) mo.observe(tela, {childList:true, subtree:true});
    }
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
})();
