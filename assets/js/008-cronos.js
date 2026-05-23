
/* Camada leve de estabilidade: remove duplicatas visuais e evita menu mobile no desktop. */
(function(){
    function isMobileCronos(){ return window.matchMedia && window.matchMedia('(max-width: 768px)').matches; }
    function limparDuplicatasCronos(){
        document.querySelectorAll('#mobileMenuBtnCronos').forEach((el, i) => { if (i > 0) el.remove(); });
        document.querySelectorAll('#mobileMenuOverlayCronos').forEach((el, i) => { if (i > 0) el.remove(); });
        if (!isMobileCronos()) {
            const overlay = document.getElementById('mobileMenuOverlayCronos');
            if (overlay) overlay.classList.remove('ativo');
        }
    }
    function initDuploMelhorado(){ limparDuplicatasCronos(); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDuploMelhorado);
    else initDuploMelhorado();
    window.addEventListener('resize', () => { clearTimeout(window.__cronosDuploResize); window.__cronosDuploResize = setTimeout(initDuploMelhorado, 140); }, { passive:true });
})();
