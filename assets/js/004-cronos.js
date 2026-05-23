
/* ===== PATCH FINAL — poster manual persistente, clicável e com upload ===== */
(function(){
    const originalNormalizarObraParaBanco = window.normalizarObraParaBanco;
    if (typeof originalNormalizarObraParaBanco === 'function') {
        window.normalizarObraParaBanco = function(obra = {}) {
            const registro = originalNormalizarObraParaBanco(obra);
            registro.posterManual = !!(obra.posterManual || registro.posterManual);
            registro.posterManualFonte = obra.posterManualFonte || registro.posterManualFonte || '';
            registro.posterManualModo = obra.posterManualModo || registro.posterManualModo || '';
            registro.posterManualUpload = !!(obra.posterManualUpload || registro.posterManualUpload);
            registro.posterManualEditable = obra.posterManualEditable !== false && !!(
                obra.posterManual || obra.posterManualUpload || obra.posterManualFonte || obra.posterManualModo ||
                registro.posterManual || registro.posterManualUpload || registro.posterManualFonte || registro.posterManualModo
            );
            return registro;
        };
    }

    function cronosGetObraAtualPatch() {
        // Preferir a variável real da tela atual. window.obraSendoVista pode ficar com obra antiga
        // depois de salvar poster manual e causar o poster manual aparecer em outras fichas.
        try { if (typeof obraSendoVista !== 'undefined' && obraSendoVista && obraSendoVista.url) return obraSendoVista; } catch(e) {}
        try { if (window.obraSendoVista && window.obraSendoVista.url) return window.obraSendoVista; } catch(e) {}
        return {};
    }

    function cronosSetObraAtualPatch(obra) {
        try { window.obraSendoVista = obra; } catch(e) {}
        try { if (typeof obraSendoVista !== 'undefined') obraSendoVista = obra; } catch(e) {}
    }

    function cronosUrlAtualPatch() {
        const obra = cronosGetObraAtualPatch();
        return obra?.url || '';
    }

    function cronosPosterManualEhEditavel(obra) {
        return !!(obra && (obra.posterManual || obra.posterManualUpload || obra.posterManualEditable));
    }

    function cronosAtualizarCardsDOMPorUrl(url, poster) {
        if (!url || !poster) return;
        document.querySelectorAll('[data-url]').forEach(el => {
            if ((el.dataset.url || '') !== url) return;
            const img = el.querySelector('img');
            if (img) img.src = poster;
            el.dataset.poster = poster;
        });
    }

    async function cronosPropagarPosterManualGlobal(obraAtualizada) {
        if (!obraAtualizada || !obraAtualizada.url) return;
        await migrarLocalStorageParaIndexedDB();
        const id = gerarIdCronos(obraAtualizada.url);

        if (typeof salvarObraCronos === 'function') {
            await salvarObraCronos({ ...obraAtualizada, posterManualEditable: true });
        } else {
            await dbPut('obras', normalizarObraParaBanco({ ...obraAtualizada, posterManualEditable: true }));
        }

        const fav = await dbGet('favoritos', id);
        if (fav) {
            await dbPut('favoritos', normalizarObraParaBanco({ ...fav, ...obraAtualizada, posterManualEditable: true }));
        }

        const hist = await dbGet('historico', id);
        if (hist) {
            await dbPut('historico', normalizarObraParaBanco({
                ...hist,
                ...obraAtualizada,
                ultimoAcesso: hist.ultimoAcesso || new Date().toISOString(),
                posterManualEditable: true
            }));
        }

        cronosAtualizarCardsDOMPorUrl(obraAtualizada.url, obraAtualizada.poster || obraAtualizada.img || '');

        if (typeof renderizarResumoHomeLocal === 'function') {
            try { await renderizarResumoHomeLocal(); } catch(e) { console.warn(e); }
        }

        const telaFav = document.getElementById('telaFavoritos');
        if (telaFav && getComputedStyle(telaFav).display !== 'none' && typeof carregarFavoritos === 'function') {
            try { await carregarFavoritos(); } catch(e) { console.warn(e); }
        }

        const telaHist = document.getElementById('telaHistorico');
        if (telaHist && getComputedStyle(telaHist).display !== 'none' && typeof carregarHistorico === 'function') {
            try { await carregarHistorico(); } catch(e) { console.warn(e); }
        }
    }

    async function cronosAplicarPosterManualNaTelaAtual() {
        const url = cronosUrlAtualPatch();
        if (!url) return;
        await migrarLocalStorageParaIndexedDB();
        const salvo = await dbGet('obras', gerarIdCronos(url));
        if (!salvo) return;

        const imgDetalhe = document.getElementById('detalheImg');
        if (!imgDetalhe) return;

        const posterSalvo = escolherPosterSeguroCronos(salvo.poster, salvo.img);
        if (posterSalvo && cronosPosterManualEhEditavel(salvo)) {
            if ((imgDetalhe.getAttribute('src') || '') !== posterSalvo) {
                imgDetalhe.src = posterSalvo;
            }
            imgDetalhe.classList.remove('poster-sem-imagem-manual');
            imgDetalhe.classList.add('poster-manual-editavel');
            imgDetalhe.dataset.posterManual = '1';
            imgDetalhe.title = 'Poster manual. Clique para trocar.';
            imgDetalhe.alt = 'Poster';
            cronosSetObraAtualPatch({ ...cronosGetObraAtualPatch(), ...salvo, poster: posterSalvo, img: posterSalvo, posterManualEditable: true });
        }
    }

    function cronosHabilitarCliquePosterManual() {
        const img = document.getElementById('detalheImg');
        if (!img || img.__posterManualPatchBind) return;
        img.__posterManualPatchBind = true;
        img.addEventListener('click', function() {
            const obra = cronosGetObraAtualPatch();
            const clicavel = img.classList.contains('poster-sem-imagem-manual') || img.dataset.posterManual === '1' || cronosPosterManualEhEditavel(obra);
            if (clicavel && typeof cronosAbrirModalPosterManual === 'function') {
                cronosAbrirModalPosterManual();
            }
        });
    }

    async function cronosSalvarPosterManualDataUrl(dataUrl, meta = {}) {
        if (!dataUrl) return;
        const obra = cronosGetObraAtualPatch();
        if (!obra || !obra.url) return;
        const atualizada = {
            ...obra,
            poster: dataUrl,
            img: dataUrl,
            posterManual: true,
            posterManualUpload: !!meta.upload,
            posterManualFonte: meta.fonte || 'manual',
            posterManualModo: meta.modo || (meta.upload ? 'upload_manual' : 'imagem_direta_sem_recorte'),
            posterManualEditable: true,
            updatedAt: new Date().toISOString()
        };
        cronosSetObraAtualPatch(atualizada);
        const imgDetalhe = document.getElementById('detalheImg');
        if (imgDetalhe) {
            imgDetalhe.src = dataUrl;
            imgDetalhe.classList.remove('poster-sem-imagem-manual');
            imgDetalhe.classList.add('poster-manual-editavel');
            imgDetalhe.dataset.posterManual = '1';
            imgDetalhe.title = 'Poster manual. Clique para trocar.';
        }
        await cronosPropagarPosterManualGlobal(atualizada);
        if (typeof checarBotaoFavorito === 'function') checarBotaoFavorito(atualizada.url);
        if (typeof cronosFecharPosterManual === 'function') cronosFecharPosterManual();
    }

    // Salva a imagem escolhida da galeria como poster manual persistente.
    window.cronosSelecionarImagemPosterManual = async function(index) {
        const item = (window.__cronosPosterManualImagens || [])[index];
        if (!item || !item.url) return;
        const area = document.getElementById('posterManualConteudoCronos');
        if (area) area.innerHTML = '<div class="poster-manual-status">Salvando imagem escolhida como poster manual...</div>';
        try {
            await cronosSalvarPosterManualDataUrl(item.url, { fonte: item.url, modo: 'imagem_direta_sem_recorte', upload: false });
        } catch (e) {
            console.warn('Falha ao salvar poster manual:', e);
            if (area) area.innerHTML = `<div class="poster-manual-status">Não consegui salvar o poster: ${e.message || e}</div>`;
        }
    };

    function cronosGarantirUploadNoModal() {
        const area = document.getElementById('posterManualConteudoCronos');
        if (!area) return;
        if (document.getElementById('posterManualUploadWrapCronos')) return;
        const wrap = document.createElement('div');
        wrap.id = 'posterManualUploadWrapCronos';
        wrap.className = 'poster-manual-upload-wrap';
        wrap.innerHTML = `
            <button class="poster-manual-btn" type="button" id="btnUploadPosterManualCronos">Upload de capa</button>
            <input type="file" id="inputUploadPosterManualCronos" accept="image/png,image/jpeg,image/webp" style="display:none;">
            <span class="poster-manual-upload-note">Se você já editou uma capa, pode enviar aqui e salvar direto no banco.</span>
        `;
        area.parentNode.insertBefore(wrap, area);
        const btn = document.getElementById('btnUploadPosterManualCronos');
        const input = document.getElementById('inputUploadPosterManualCronos');
        btn.onclick = () => input.click();
        input.onchange = function() {
            const file = input.files && input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async function() {
                try {
                    await cronosSalvarPosterManualDataUrl(reader.result, { upload: true, fonte: file.name || 'upload', modo: 'upload_manual' });
                } catch (e) {
                    console.warn('Falha no upload do poster manual:', e);
                    alert('Não consegui salvar a capa enviada.');
                } finally {
                    input.value = '';
                }
            };
            reader.readAsDataURL(file);
        };
    }

    const originalAbrirModalPosterManualPatch = window.cronosAbrirModalPosterManual;
    if (typeof originalAbrirModalPosterManualPatch === 'function') {
        window.cronosAbrirModalPosterManual = async function() {
            await originalAbrirModalPosterManualPatch.apply(this, arguments);
            setTimeout(cronosGarantirUploadNoModal, 40);
            setTimeout(cronosGarantirUploadNoModal, 300);
        };
    }

    const originalAnalisarObraPatch = window.analisarObra;
    if (typeof originalAnalisarObraPatch === 'function') {
        window.analisarObra = function() {
            const retorno = originalAnalisarObraPatch.apply(this, arguments);
            setTimeout(cronosAplicarPosterManualNaTelaAtual, 200);
            setTimeout(cronosAplicarPosterManualNaTelaAtual, 900);
            setTimeout(cronosAplicarPosterManualNaTelaAtual, 1800);
            setTimeout(cronosAplicarPosterManualNaTelaAtual, 3000);
            return retorno;
        };
    }

    // Garante que, ao entrar direto em uma obra já salva, o poster manual volte automaticamente.
    document.addEventListener('DOMContentLoaded', function() {
        cronosHabilitarCliquePosterManual();
        setTimeout(cronosAplicarPosterManualNaTelaAtual, 600);
        setInterval(() => {
            cronosHabilitarCliquePosterManual();
            cronosAplicarPosterManualNaTelaAtual().catch?.(()=>{});
        }, 1800);
    });
})();
