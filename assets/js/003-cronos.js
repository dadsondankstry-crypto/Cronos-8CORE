
/* ===== OVERRIDE — Limpa imagens inválidas e salva a escolhida direto como poster ===== */
(function(){
    function cronosUrlRuimPosterManual(url) {
        const u = String(url || '').toLowerCase();
        if (!u) return true;
        if (u.startsWith('data:') || u.startsWith('blob:')) return true;
        if (u.includes('pinterest.') || u.includes('/pin/create/') || u.includes('pin/create/button')) return true;
        if (u.includes('favicon') || u.includes('fivico') || u.includes('apple-touch-icon')) return true;
        if (u.includes('logo') || u.includes('avatar') || u.includes('placeholder') || u.includes('blank')) return true;
        if (!/(image\.tmdb\.org|wp-content\/uploads|\.jpg|\.jpeg|\.png|\.webp)/i.test(u)) return true;
        return false;
    }

    function cronosLimparGaleriaPosterManual() {
        const thumbs = document.querySelectorAll('.poster-manual-thumb');
        thumbs.forEach((thumb) => {
            const img = thumb.querySelector('img');
            if (!img) return;
            const src = img.getAttribute('src') || '';
            if (cronosUrlRuimPosterManual(src)) {
                thumb.classList.add('removido-cronos');
                return;
            }
            img.onerror = function(){ thumb.classList.add('removido-cronos'); };
            img.onload = function(){
                // Remove ícones e imagens muito pequenas que não servem para poster/backdrop.
                if ((img.naturalWidth && img.naturalWidth < 120) || (img.naturalHeight && img.naturalHeight < 120)) {
                    thumb.classList.add('removido-cronos');
                }
            };
            if (img.complete) {
                if (!img.naturalWidth || !img.naturalHeight || img.naturalWidth < 120 || img.naturalHeight < 120) {
                    thumb.classList.add('removido-cronos');
                }
            }
        });
    }

    const abrirOriginal = window.cronosAbrirModalPosterManual;
    if (typeof abrirOriginal === 'function') {
        window.cronosAbrirModalPosterManual = async function(){
            await abrirOriginal.apply(this, arguments);
            setTimeout(cronosLimparGaleriaPosterManual, 80);
            setTimeout(cronosLimparGaleriaPosterManual, 600);
            setTimeout(cronosLimparGaleriaPosterManual, 1500);
        };
    }

    function cronosObraAtualPosterManualFix() {
        try { if (window.obraSendoVista && window.obraSendoVista.url) return window.obraSendoVista; } catch(e) {}
        try { if (typeof obraSendoVista !== 'undefined' && obraSendoVista && obraSendoVista.url) return obraSendoVista; } catch(e) {}
        return {};
    }

    function cronosSetObraAtualPosterManualFix(obra) {
        try { window.obraSendoVista = obra; } catch(e) {}
        try { if (typeof obraSendoVista !== 'undefined') obraSendoVista = obra; } catch(e) {}
    }

    window.cronosSelecionarImagemPosterManual = async function(index) {
        const item = (window.__cronosPosterManualImagens || [])[index];
        if (!item || !item.url) return;
        if (cronosUrlRuimPosterManual(item.url)) return;

        const area = document.getElementById('posterManualConteudoCronos');
        if (area) area.innerHTML = '<div class="poster-manual-status">Salvando imagem escolhida como poster manual...</div>';

        try {
            const obra = cronosObraAtualPosterManualFix();
            const atualizada = {
                ...obra,
                poster: item.url,
                img: item.url,
                posterManual: true,
                posterManualFonte: item.url,
                posterManualModo: 'imagem_direta_sem_recorte',
                updatedAt: new Date().toISOString()
            };
            cronosSetObraAtualPosterManualFix(atualizada);

            const imgDetalhe = document.getElementById('detalheImg');
            if (imgDetalhe) {
                imgDetalhe.src = item.url;
                imgDetalhe.classList.remove('poster-sem-imagem-manual');
                imgDetalhe.title = '';
                imgDetalhe.alt = 'Poster';
                imgDetalhe.style.objectFit = 'cover';
                imgDetalhe.style.objectPosition = 'center center';
            }

            if (typeof salvarObraCronos === 'function') await salvarObraCronos(atualizada);
            if (typeof salvarHistoricoHome === 'function') await salvarHistoricoHome(atualizada);
            if (typeof cronosFecharPosterManual === 'function') cronosFecharPosterManual();
            if (typeof checarBotaoFavorito === 'function' && atualizada.url) checarBotaoFavorito(atualizada.url);
        } catch(e) {
            console.warn('Falha ao salvar poster manual direto:', e);
            if (area) area.innerHTML = `<div class="poster-manual-status">Não consegui salvar o poster: ${e.message || e}</div>`;
        }
    };
})();
