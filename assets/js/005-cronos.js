
/* ===== PATCH — poster manual vira capa oficial do Cronos no IndexedDB ===== */
(function(){
    function getObraAtualManualOficial() {
        // Preferir a obra aberta agora. O espelho em window pode estar antigo.
        try { if (typeof obraSendoVista !== 'undefined' && obraSendoVista && obraSendoVista.url) return obraSendoVista; } catch(e) {}
        try { if (window.obraSendoVista && window.obraSendoVista.url) return window.obraSendoVista; } catch(e) {}
        return {};
    }
    function setObraAtualManualOficial(obra) {
        try { window.obraSendoVista = obra; } catch(e) {}
        try { if (typeof obraSendoVista !== 'undefined') obraSendoVista = obra; } catch(e) {}
    }
    function isManual(obra) {
        return !!(obra && (obra.posterManual || obra.posterManualEditable || obra.posterManualUpload));
    }
    function gerarPosterVerticalDeImagem(url) {
        return new Promise((resolve) => {
            const finalizarFallback = () => resolve(url);
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function(){
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = 500;
                    canvas.height = 750;
                    const ctx = canvas.getContext('2d');
                    const iw = img.naturalWidth || img.width;
                    const ih = img.naturalHeight || img.height;
                    if (!iw || !ih) return finalizarFallback();
const targetRatio = 500 / 750;
                    const sourceRatio = iw / ih;
                    let sx = 0, sy = 0, sw = iw, sh = ih;
                    if (sourceRatio > targetRatio) {
                        sw = ih * targetRatio;
                        sx = (iw - sw) / 2;
                    } else {
                        sh = iw / targetRatio;
                        sy = (ih - sh) / 2;
                    }
                    ctx.fillStyle = '#000';
                    ctx.fillRect(0,0,500,750);
                    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 500, 750);
                    resolve(canvas.toDataURL('image/jpeg', 0.9));
                } catch(e) { finalizarFallback(); }
            };
            img.onerror = finalizarFallback;
            if (/^data:image\//i.test(url)) img.src = url;
            else img.src = PROXY + encodeURIComponent(url);
        });
    }
    async function salvarPosterManualOficial(posterFinal, fonte, modo, upload) {
        const obra = getObraAtualManualOficial();
        if (!obra || !obra.url || !posterFinal) return;
        await migrarLocalStorageParaIndexedDB();
        const id = gerarIdCronos(obra.url);
        const base = (await dbGet('obras', id)) || obra;
        const atualizada = {
            ...base,
            ...obra,
            poster: posterFinal,
            img: posterFinal,
            posterManual: true,
            posterManualEditable: true,
            posterManualUpload: !!upload,
            posterManualFonte: fonte || posterFinal,
            posterManualModo: modo || 'manual',
            updatedAt: new Date().toISOString()
        };
        setObraAtualManualOficial(atualizada);
        await salvarObraCronos(atualizada);
        const fav = await dbGet('favoritos', id);
        if (fav) await dbPut('favoritos', normalizarObraParaBanco({ ...fav, ...atualizada }));
        const hist = await dbGet('historico', id);
        if (hist) await dbPut('historico', normalizarObraParaBanco({ ...hist, ...atualizada, ultimoAcesso: hist.ultimoAcesso || new Date().toISOString() }));
        await salvarHistoricoHome(atualizada);
        aplicarPosterManualNaTela(atualizada);
        if (typeof renderizarResumoHomeLocal === 'function') renderizarResumoHomeLocal();
        if (typeof checarBotaoFavorito === 'function') checarBotaoFavorito(atualizada.url);
    }
    function aplicarPosterManualNaTela(obra) {
        const poster = escolherPosterSeguroCronos(obra?.poster, obra?.img);
        if (!poster) return;
        const imgDetalhe = document.getElementById('detalheImg');
        if (imgDetalhe && (!obra?.url || getObraAtualManualOficial().url === obra.url)) {
            imgDetalhe.src = poster;
            imgDetalhe.classList.remove('poster-sem-imagem-manual');
            imgDetalhe.classList.add('poster-manual-editavel');
            imgDetalhe.dataset.posterManual = '1';
            imgDetalhe.title = 'Poster manual. Clique para trocar.';
            imgDetalhe.alt = 'Poster';
        }
        if (obra?.url) {
            document.querySelectorAll(`[data-url="${CSS.escape(obra.url)}"] img`).forEach(img => {
                img.src = poster;
                img.classList.add('poster-manual-card');
            });
        }
    }
    async function reaplicarPosterManualSalvo() {
        const obra = getObraAtualManualOficial();
        if (!obra || !obra.url) return;
        await migrarLocalStorageParaIndexedDB();
        const salvo = await dbGet('obras', gerarIdCronos(obra.url));
        if (!salvo || !isManual(salvo)) return;
        const poster = escolherPosterSeguroCronos(salvo.poster, salvo.img);
        if (!poster) return;
        const mesclada = { ...obra, ...salvo, poster, img: poster, posterManual: true, posterManualEditable: true };
        setObraAtualManualOficial(mesclada);
        aplicarPosterManualNaTela(mesclada);
    }
    window.cronosSelecionarImagemPosterManual = async function(index) {
        const item = (window.__cronosPosterManualImagens || [])[index];
        if (!item || !item.url) return;
        const area = document.getElementById('posterManualConteudoCronos');
        if (area) area.innerHTML = '<div class="poster-manual-status">Gerando capa vertical e salvando no IndexedDB...</div>';
        try {
            const posterVertical = await gerarPosterVerticalDeImagem(item.url);
            await salvarPosterManualOficial(posterVertical, item.url, 'galeria_convertida_2x3', false);
            if (typeof cronosFecharPosterManual === 'function') cronosFecharPosterManual();
        } catch(e) {
            console.warn('Falha ao salvar poster manual oficial:', e);
            if (area) area.innerHTML = `<div class="poster-manual-status">Não consegui salvar o poster: ${e.message || e}</div>`;
        }
    };
    function inserirUploadPosterManual() {
        const area = document.getElementById('posterManualConteudoCronos');
        if (!area || document.getElementById('posterManualUploadWrapCronos')) return;
        const wrap = document.createElement('div');
        wrap.id = 'posterManualUploadWrapCronos';
        wrap.className = 'poster-manual-upload-wrap';
        wrap.innerHTML = `
            <button class="poster-manual-btn" type="button" id="btnUploadPosterManualCronos">Upload de capa</button>
            <input type="file" id="inputUploadPosterManualCronos" accept="image/png,image/jpeg,image/webp" style="display:none;">
            <span class="poster-manual-upload-note">Escolha uma capa pronta do PC para salvar no IndexedDB.</span>
        `;
        area.parentNode.insertBefore(wrap, area);
        const input = document.getElementById('inputUploadPosterManualCronos');
        document.getElementById('btnUploadPosterManualCronos').onclick = () => input.click();
        input.onchange = () => {
            const file = input.files && input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async () => {
                const area2 = document.getElementById('posterManualConteudoCronos');
                if (area2) area2.innerHTML = '<div class="poster-manual-status">Salvando upload como poster manual...</div>';
                await salvarPosterManualOficial(reader.result, file.name || 'upload', 'upload_manual', true);
                if (typeof cronosFecharPosterManual === 'function') cronosFecharPosterManual();
            };
            reader.readAsDataURL(file);
        };
    }
    const abrirModalAntigo = window.cronosAbrirModalPosterManual;
    if (typeof abrirModalAntigo === 'function') {
        window.cronosAbrirModalPosterManual = async function(){
            await abrirModalAntigo.apply(this, arguments);
            setTimeout(inserirUploadPosterManual, 30);
            setTimeout(inserirUploadPosterManual, 400);
        };
    }
    function habilitarCliqueManualPersistente() {
        const img = document.getElementById('detalheImg');
        if (!img || img.__posterManualOficialBind) return;
        img.__posterManualOficialBind = true;
        img.addEventListener('click', () => {
            const obra = getObraAtualManualOficial();
            if (img.classList.contains('poster-sem-imagem-manual') || img.dataset.posterManual === '1' || isManual(obra)) {
                if (typeof cronosAbrirModalPosterManual === 'function') cronosAbrirModalPosterManual();
            }
        });
    }
    document.addEventListener('DOMContentLoaded', () => {
        habilitarCliqueManualPersistente();
        [250, 900, 1800, 3500].forEach(t => setTimeout(() => { habilitarCliqueManualPersistente(); reaplicarPosterManualSalvo(); }, t));
        if (!window.__cronosPosterManualOficialObserver) {
            window.__cronosPosterManualOficialObserver = new MutationObserver(() => { habilitarCliqueManualPersistente(); reaplicarPosterManualSalvo(); });
            window.__cronosPosterManualOficialObserver.observe(document.body, { childList: true, subtree: true });
        }
    });
    const oldAnalisar = window.analisarObra;
    if (typeof oldAnalisar === 'function') {
        window.analisarObra = function(){
            const ret = oldAnalisar.apply(this, arguments);
            setTimeout(reaplicarPosterManualSalvo, 250);
            setTimeout(reaplicarPosterManualSalvo, 900);
            setTimeout(reaplicarPosterManualSalvo, 1800);
            return ret;
        };
    }
})();
