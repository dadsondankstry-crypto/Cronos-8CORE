(function () {
    const MODAL_ID = 'posterManualModalCronos';
    function cronosObraAtualManual() {
        try {
            if (window.obraSendoVista && window.obraSendoVista.url)
                return window.obraSendoVista;
            if (typeof obraSendoVista !== 'undefined' && obraSendoVista && obraSendoVista.url)
                return obraSendoVista;
        }
        catch (e) { }
        return {};
    }
    function cronosSetObraAtualManual(obra) {
        try {
            window.obraSendoVista = obra;
        }
        catch (e) { }
        try {
            if (typeof obraSendoVista !== 'undefined')
                obraSendoVista = obra;
        }
        catch (e) { }
    }
    function cronosPosterManualPlaceholder() {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750">
            <rect width="500" height="750" fill="#050505"/>
            <rect x="16" y="16" width="468" height="718" rx="14" fill="#080808" stroke="#00ffff" stroke-width="2" stroke-opacity="0.45"/>
            <text x="250" y="380" text-anchor="middle" fill="#00ffff" font-family="Arial, sans-serif" font-size="44" font-weight="700">POSTER</text>
        </svg>`;
        return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    }
    if (typeof window.imagemEhPlaceholderCronos === 'function') {
        const originalImagemEhPlaceholderCronos = window.imagemEhPlaceholderCronos;
        window.imagemEhPlaceholderCronos = function (url) {
            const u = String(url || '').toLowerCase();
            if (/^data:image\/(jpeg|jpg|png|webp)/i.test(u))
                return false;
            return originalImagemEhPlaceholderCronos(url);
        };
    }
    function garantirModalPosterManual() {
        let modal = document.getElementById(MODAL_ID);
        if (modal)
            return modal;
        modal = document.createElement('div');
        modal.id = MODAL_ID;
        modal.className = 'poster-manual-modal';
        modal.innerHTML = `
            <div class="poster-manual-box">
                <div class="poster-manual-head">
                    <h3>Escolher poster manual</h3>
                    <button class="poster-manual-close" type="button" onclick="cronosFecharPosterManual()">Fechar</button>
                </div>
                <div id="posterManualConteudoCronos"></div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal)
            cronosFecharPosterManual(); });
        return modal;
    }
    window.cronosFecharPosterManual = function () {
        const modal = document.getElementById(MODAL_ID);
        if (modal)
            modal.style.display = 'none';
    };
    function absUrlCronos(url, base) {
        if (!url)
            return '';
        let u = String(url).trim().replace(/&amp;/g, '&').replace(/^url\(["']?|["']?\)$/g, '').trim();
        if (!u || u.startsWith('data:') || u.startsWith('blob:'))
            return '';
        try {
            return new URL(u, base || location.href).href;
        }
        catch {
            return u;
        }
    }
    function limparUrlImagemManual(url) {
        let u = String(url || '').trim();
        if (!u)
            return '';
        if (/image\.tmdb\.org\/t\/p\//i.test(u)) {
            u = u.replace(/\/t\/p\/(w\d+|original)\//i, '/t/p/original/');
        }
        return u;
    }
    function imagemCandidataBoaManual(url) {
        const u = String(url || '').toLowerCase();
        if (!u)
            return false;
        if (u.includes('logo') || u.includes('favicon') || u.includes('avatar') || u.includes('blank') || u.includes('placeholder'))
            return false;
        return /(image\.tmdb\.org|wp-content\/uploads|\.jpg|\.jpeg|\.png|\.webp)/i.test(u);
    }
    function coletarImagensPosterManual(doc, html, baseUrl) {
        const lista = [];
        const add = (url, origem) => {
            let u = limparUrlImagemManual(absUrlCronos(url, baseUrl));
            if (!imagemCandidataBoaManual(u))
                return;
            if (lista.some(x => x.url === u))
                return;
            lista.push({ url: u, origem });
        };
        doc.querySelectorAll('#dt_galery a[href], .dt_galery a[href], .g-item a[href], .galeria a[href], .gallery a[href]').forEach(a => add(a.getAttribute('href'), 'Galeria'));
        doc.querySelectorAll('#dt_galery img, .dt_galery img, .g-item img, .galeria img, .gallery img').forEach(img => {
            ['data-src', 'data-lazy-src', 'data-original', 'src'].forEach(attr => add(img.getAttribute(attr), 'Galeria img'));
            const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset') || '';
            srcset.split(',').forEach(p => add((p.trim().split(/\s+/)[0] || ''), 'Galeria srcset'));
        });
        doc.querySelectorAll('meta[property="og:image"], meta[name="og:image"], meta[property="twitter:image"], meta[name="twitter:image"]').forEach(m => add(m.getAttribute('content'), 'Meta image'));
        const texto = String(html || '');
        let m;
        const regexUrl = /(https?:\/\/[^"'<>\s]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'<>\s]*)?)/gi;
        while ((m = regexUrl.exec(texto)))
            add(m[1], 'HTML');
        const regexBg = /background(?:-image)?\s*:\s*url\(["']?([^"')]+)["']?\)/gi;
        while ((m = regexBg.exec(texto)))
            add(m[1], 'Background');
        return lista.slice(0, 40);
    }
    async function buscarImagensDaObraManual() {
        const obra = cronosObraAtualManual();
        const url = obra.url || obra.link || obra.href || '';
        if (!url)
            throw new Error('URL da obra não encontrada.');
        const res = await fetch(PROXY + encodeURIComponent(url));
        if (!res.ok)
            throw new Error('Falha ao abrir a página da obra.');
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return coletarImagensPosterManual(doc, html, url);
    }
    window.cronosAbrirModalPosterManual = async function () {
        const modal = garantirModalPosterManual();
        const area = document.getElementById('posterManualConteudoCronos');
        modal.style.display = 'flex';
        area.innerHTML = '<div class="poster-manual-status">Carregando imagens da página...</div>';
        try {
            const imagens = await buscarImagensDaObraManual();
            if (!imagens.length) {
                area.innerHTML = '<div class="poster-manual-status">Nenhuma imagem de galeria/backdrop encontrada nessa página.</div>';
                return;
            }
            area.innerHTML = `
                <div class="poster-manual-status">Escolha uma imagem para transformar em poster vertical.</div>
                <div class="poster-manual-grid">
                    ${imagens.map((img, i) => `
                        <div class="poster-manual-thumb" onclick="cronosSelecionarImagemPosterManual(${i})">
                            <img src="${img.url}" loading="lazy" alt="Imagem ${i + 1}">
                            <span>${i + 1}. ${img.origem}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            window.__cronosPosterManualImagens = imagens;
        }
        catch (e) {
            console.warn('Poster manual falhou:', e);
            area.innerHTML = `<div class="poster-manual-status">Falha ao carregar imagens: ${e.message || e}</div>`;
        }
    };
    window.cronosSelecionarImagemPosterManual = function (index) {
        const item = (window.__cronosPosterManualImagens || [])[index];
        if (!item)
            return;
        const area = document.getElementById('posterManualConteudoCronos');
        area.innerHTML = `
            <div class="poster-manual-status">Ajuste o recorte vertical que será salvo como poster.</div>
            <div class="poster-crop-wrap">
                <div class="poster-crop-area" id="posterCropAreaCronos">
                    <img id="posterCropImgCronos" src="${item.url}" crossorigin="anonymous" alt="Imagem para recorte">
                    <div class="poster-crop-overlay" id="posterCropOverlayCronos"></div>
                </div>
                <div class="poster-crop-side">
                    <strong style="color:#ffcc00;">Recorte 2:3</strong>
                    <label>Posição horizontal</label>
                    <input id="posterCropXChronos" type="range" min="0" max="100" value="50" oninput="cronosAtualizarPreviewCropPoster()">
                    <label>Posição vertical</label>
                    <input id="posterCropYChronos" type="range" min="0" max="100" value="50" oninput="cronosAtualizarPreviewCropPoster()">
                    <div class="poster-crop-preview" id="posterCropPreviewCronos"></div>
                    <button class="poster-manual-btn" type="button" onclick="cronosSalvarPosterManual('${encodeURIComponent(item.url)}')">Salvar como poster</button>
                    <button class="poster-manual-btn" type="button" style="margin-top:8px;border-color:#8a2be2;color:#fff;" onclick="cronosAbrirModalPosterManual()">Voltar para galeria</button>
                    <p style="color:#aaa;font-size:12px;line-height:1.4;margin-top:10px;">Esse poster fica salvo no IndexedDB desta obra. Se limpar o banco, ele some.</p>
                </div>
            </div>
        `;
        const imgEl = document.getElementById('posterCropImgCronos');
        imgEl.onload = () => cronosAtualizarPreviewCropPoster();
        setTimeout(cronosAtualizarPreviewCropPoster, 80);
    };
    function calcularCropPosterManual(img, posX, posY) {
        const nw = img.naturalWidth || 1;
        const nh = img.naturalHeight || 1;
        const alvo = 2 / 3;
        let sw = nw, sh = nh, sx = 0, sy = 0;
        if (nw / nh > alvo) {
            sh = nh;
            sw = Math.round(nh * alvo);
            sx = Math.round((nw - sw) * (posX / 100));
            sy = 0;
        }
        else {
            sw = nw;
            sh = Math.round(nw / alvo);
            sx = 0;
            sy = Math.round(Math.max(0, nh - sh) * (posY / 100));
        }
        return { sx, sy, sw, sh, nw, nh };
    }
    window.cronosAtualizarPreviewCropPoster = function () {
        const img = document.getElementById('posterCropImgCronos');
        const overlay = document.getElementById('posterCropOverlayCronos');
        const preview = document.getElementById('posterCropPreviewCronos');
        const posX = Number(document.getElementById('posterCropXChronos')?.value || 50);
        const posY = Number(document.getElementById('posterCropYChronos')?.value || 50);
        if (!img || !overlay || !preview)
            return;
        const crop = calcularCropPosterManual(img, posX, posY);
        const rect = img.getBoundingClientRect();
        const areaRect = document.getElementById('posterCropAreaCronos').getBoundingClientRect();
        const scaleX = rect.width / crop.nw;
        const scaleY = rect.height / crop.nh;
        overlay.style.left = (rect.left - areaRect.left + crop.sx * scaleX) + 'px';
        overlay.style.top = (rect.top - areaRect.top + crop.sy * scaleY) + 'px';
        overlay.style.width = (crop.sw * scaleX) + 'px';
        overlay.style.height = (crop.sh * scaleY) + 'px';
        overlay.style.bottom = 'auto';
        preview.style.backgroundImage = `url("${img.src}")`;
        preview.style.backgroundSize = `${(crop.nw / crop.sw) * 100}% ${(crop.nh / crop.sh) * 100}%`;
        preview.style.backgroundPosition = `${crop.sw === crop.nw ? 50 : (crop.sx / Math.max(1, crop.nw - crop.sw)) * 100}% ${crop.sh === crop.nh ? 50 : (crop.sy / Math.max(1, crop.nh - crop.sh)) * 100}%`;
    };
    window.cronosSalvarPosterManual = async function (encodedUrl) {
        const urlOriginal = decodeURIComponent(encodedUrl || '');
        const img = document.getElementById('posterCropImgCronos');
        const posX = Number(document.getElementById('posterCropXChronos')?.value || 50);
        const posY = Number(document.getElementById('posterCropYChronos')?.value || 50);
        if (!img || !urlOriginal)
            return;
        const area = document.getElementById('posterManualConteudoCronos');
        try {
            const crop = calcularCropPosterManual(img, posX, posY);
            const canvas = document.createElement('canvas');
            canvas.width = 500;
            canvas.height = 750;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, 500, 750);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
            const obra = cronosObraAtualManual();
            const atualizada = {
                ...obra,
                poster: dataUrl,
                img: dataUrl,
                posterManual: true,
                posterManualFonte: urlOriginal,
                posterManualCrop: { x: posX, y: posY, width: 500, height: 750 },
                updatedAt: new Date().toISOString()
            };
            cronosSetObraAtualManual(atualizada);
            const imgDetalhe = document.getElementById('detalheImg');
            if (imgDetalhe) {
                imgDetalhe.src = dataUrl;
                imgDetalhe.classList.remove('poster-sem-imagem-manual');
                imgDetalhe.title = '';
            }
            if (typeof salvarObraCronos === 'function')
                await salvarObraCronos(atualizada);
            if (typeof salvarHistoricoHome === 'function')
                await salvarHistoricoHome(atualizada);
            cronosFecharPosterManual();
            if (typeof checarBotaoFavorito === 'function' && atualizada.url)
                checarBotaoFavorito(atualizada.url);
        }
        catch (e) {
            console.warn('Falha ao gerar poster com canvas. Salvando imagem original como fallback:', e);
            try {
                const obra = cronosObraAtualManual();
                const atualizada = {
                    ...obra,
                    poster: urlOriginal,
                    img: urlOriginal,
                    posterManual: true,
                    posterManualFonte: urlOriginal,
                    posterManualCropFalhou: true,
                    updatedAt: new Date().toISOString()
                };
                cronosSetObraAtualManual(atualizada);
                const imgDetalhe = document.getElementById('detalheImg');
                if (imgDetalhe)
                    imgDetalhe.src = urlOriginal;
                if (typeof salvarObraCronos === 'function')
                    await salvarObraCronos(atualizada);
                cronosFecharPosterManual();
            }
            catch (e2) {
                area.innerHTML = `<div class="poster-manual-status">Não consegui salvar o poster: ${e2.message || e2}</div>`;
            }
        }
    };
    function detalhePosterSemImagem() {
        const img = document.getElementById('detalheImg');
        if (!img)
            return false;
        const src = String(img.getAttribute('src') || '').trim().toLowerCase();
        if (!src || src.startsWith('data:image/svg'))
            return true;
        if (src.includes('placeholder') || src.includes('no_poster') || src.includes('carregando'))
            return true;
        if (img.complete && img.naturalWidth === 0)
            return true;
        return false;
    }
    function ativarPosterClicavelSeSemImagem() {
        const img = document.getElementById('detalheImg');
        if (!img)
            return;
        if (!img.__posterManualBind) {
            img.__posterManualBind = true;
            img.addEventListener('click', function () {
                if (detalhePosterSemImagem())
                    cronosAbrirModalPosterManual();
            });
            img.addEventListener('error', ativarPosterClicavelSeSemImagem);
            img.addEventListener('load', () => setTimeout(ativarPosterClicavelSeSemImagem, 80));
        }
        if (detalhePosterSemImagem()) {
            img.classList.add('poster-sem-imagem-manual');
            img.title = 'Sem poster. Clique para escolher uma imagem da galeria.';
            img.alt = 'Poster';
            const placeholder = cronosPosterManualPlaceholder();
            if (!String(img.getAttribute('src') || '').startsWith('data:image/svg+xml')) {
                img.src = placeholder;
            }
        }
        else {
            img.classList.remove('poster-sem-imagem-manual');
            img.title = '';
            img.alt = 'Poster';
        }
    }
    const obs = new MutationObserver(() => setTimeout(ativarPosterClicavelSeSemImagem, 120));
    document.addEventListener('DOMContentLoaded', () => {
        const img = document.getElementById('detalheImg');
        if (img)
            obs.observe(img, { attributes: true, attributeFilter: ['src'] });
        ativarPosterClicavelSeSemImagem();
        [250, 900, 1800, 3500].forEach(t => setTimeout(ativarPosterClicavelSeSemImagem, t));
        if (!window.__cronosPosterManualBodyObserver) {
            window.__cronosPosterManualBodyObserver = new MutationObserver(() => setTimeout(ativarPosterClicavelSeSemImagem, 120));
            window.__cronosPosterManualBodyObserver.observe(document.body, { childList: true, subtree: true });
        }
    });
})();
;
(function () {
    function cronosUrlRuimPosterManual(url) {
        const u = String(url || '').toLowerCase();
        if (!u)
            return true;
        if (u.startsWith('data:') || u.startsWith('blob:'))
            return true;
        if (u.includes('pinterest.') || u.includes('/pin/create/') || u.includes('pin/create/button'))
            return true;
        if (u.includes('favicon') || u.includes('fivico') || u.includes('apple-touch-icon'))
            return true;
        if (u.includes('logo') || u.includes('avatar') || u.includes('placeholder') || u.includes('blank'))
            return true;
        if (!/(image\.tmdb\.org|wp-content\/uploads|\.jpg|\.jpeg|\.png|\.webp)/i.test(u))
            return true;
        return false;
    }
    function cronosLimparGaleriaPosterManual() {
        const thumbs = document.querySelectorAll('.poster-manual-thumb');
        thumbs.forEach((thumb) => {
            const img = thumb.querySelector('img');
            if (!img)
                return;
            const src = img.getAttribute('src') || '';
            if (cronosUrlRuimPosterManual(src)) {
                thumb.classList.add('removido-cronos');
                return;
            }
            img.onerror = function () { thumb.classList.add('removido-cronos'); };
            img.onload = function () {
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
        window.cronosAbrirModalPosterManual = async function () {
            await abrirOriginal.apply(this, arguments);
            setTimeout(cronosLimparGaleriaPosterManual, 80);
            setTimeout(cronosLimparGaleriaPosterManual, 600);
            setTimeout(cronosLimparGaleriaPosterManual, 1500);
        };
    }
    function cronosObraAtualPosterManualFix() {
        try {
            if (window.obraSendoVista && window.obraSendoVista.url)
                return window.obraSendoVista;
        }
        catch (e) { }
        try {
            if (typeof obraSendoVista !== 'undefined' && obraSendoVista && obraSendoVista.url)
                return obraSendoVista;
        }
        catch (e) { }
        return {};
    }
    function cronosSetObraAtualPosterManualFix(obra) {
        try {
            window.obraSendoVista = obra;
        }
        catch (e) { }
        try {
            if (typeof obraSendoVista !== 'undefined')
                obraSendoVista = obra;
        }
        catch (e) { }
    }
    window.cronosSelecionarImagemPosterManual = async function (index) {
        const item = (window.__cronosPosterManualImagens || [])[index];
        if (!item || !item.url)
            return;
        if (cronosUrlRuimPosterManual(item.url))
            return;
        const area = document.getElementById('posterManualConteudoCronos');
        if (area)
            area.innerHTML = '<div class="poster-manual-status">Salvando imagem escolhida como poster manual...</div>';
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
            if (typeof salvarObraCronos === 'function')
                await salvarObraCronos(atualizada);
            if (typeof salvarHistoricoHome === 'function')
                await salvarHistoricoHome(atualizada);
            if (typeof cronosFecharPosterManual === 'function')
                cronosFecharPosterManual();
            if (typeof checarBotaoFavorito === 'function' && atualizada.url)
                checarBotaoFavorito(atualizada.url);
        }
        catch (e) {
            console.warn('Falha ao salvar poster manual direto:', e);
            if (area)
                area.innerHTML = `<div class="poster-manual-status">Não consegui salvar o poster: ${e.message || e}</div>`;
        }
    };
})();
;
(function () {
    const originalNormalizarObraParaBanco = window.normalizarObraParaBanco;
    if (typeof originalNormalizarObraParaBanco === 'function') {
        window.normalizarObraParaBanco = function (obra = {}) {
            const registro = originalNormalizarObraParaBanco(obra);
            registro.posterManual = !!(obra.posterManual || registro.posterManual);
            registro.posterManualFonte = obra.posterManualFonte || registro.posterManualFonte || '';
            registro.posterManualModo = obra.posterManualModo || registro.posterManualModo || '';
            registro.posterManualUpload = !!(obra.posterManualUpload || registro.posterManualUpload);
            registro.posterManualEditable = obra.posterManualEditable !== false && !!(obra.posterManual || obra.posterManualUpload || obra.posterManualFonte || obra.posterManualModo ||
                registro.posterManual || registro.posterManualUpload || registro.posterManualFonte || registro.posterManualModo);
            return registro;
        };
    }
    function cronosGetObraAtualPatch() {
        try {
            if (typeof obraSendoVista !== 'undefined' && obraSendoVista && obraSendoVista.url)
                return obraSendoVista;
        }
        catch (e) { }
        try {
            if (window.obraSendoVista && window.obraSendoVista.url)
                return window.obraSendoVista;
        }
        catch (e) { }
        return {};
    }
    function cronosSetObraAtualPatch(obra) {
        try {
            window.obraSendoVista = obra;
        }
        catch (e) { }
        try {
            if (typeof obraSendoVista !== 'undefined')
                obraSendoVista = obra;
        }
        catch (e) { }
    }
    function cronosUrlAtualPatch() {
        const obra = cronosGetObraAtualPatch();
        return obra?.url || '';
    }
    function cronosPosterManualEhEditavel(obra) {
        return !!(obra && (obra.posterManual || obra.posterManualUpload || obra.posterManualEditable));
    }
    function cronosAtualizarCardsDOMPorUrl(url, poster) {
        if (!url || !poster)
            return;
        document.querySelectorAll('[data-url]').forEach(el => {
            if ((el.dataset.url || '') !== url)
                return;
            const img = el.querySelector('img');
            if (img)
                img.src = poster;
            el.dataset.poster = poster;
        });
    }
    async function cronosPropagarPosterManualGlobal(obraAtualizada) {
        if (!obraAtualizada || !obraAtualizada.url)
            return;
        await migrarLocalStorageParaIndexedDB();
        const id = gerarIdCronos(obraAtualizada.url);
        if (typeof salvarObraCronos === 'function') {
            await salvarObraCronos({ ...obraAtualizada, posterManualEditable: true });
        }
        else {
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
            try {
                await renderizarResumoHomeLocal();
            }
            catch (e) {
                console.warn(e);
            }
        }
        const telaFav = document.getElementById('telaFavoritos');
        if (telaFav && getComputedStyle(telaFav).display !== 'none' && typeof carregarFavoritos === 'function') {
            try {
                await carregarFavoritos();
            }
            catch (e) {
                console.warn(e);
            }
        }
        const telaHist = document.getElementById('telaHistorico');
        if (telaHist && getComputedStyle(telaHist).display !== 'none' && typeof carregarHistorico === 'function') {
            try {
                await carregarHistorico();
            }
            catch (e) {
                console.warn(e);
            }
        }
    }
    async function cronosAplicarPosterManualNaTelaAtual() {
        const url = cronosUrlAtualPatch();
        if (!url)
            return;
        await migrarLocalStorageParaIndexedDB();
        const salvo = await dbGet('obras', gerarIdCronos(url));
        if (!salvo)
            return;
        const imgDetalhe = document.getElementById('detalheImg');
        if (!imgDetalhe)
            return;
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
        if (!img || img.__posterManualPatchBind)
            return;
        img.__posterManualPatchBind = true;
        img.addEventListener('click', function () {
            const obra = cronosGetObraAtualPatch();
            const clicavel = img.classList.contains('poster-sem-imagem-manual') || img.dataset.posterManual === '1' || cronosPosterManualEhEditavel(obra);
            if (clicavel && typeof cronosAbrirModalPosterManual === 'function') {
                cronosAbrirModalPosterManual();
            }
        });
    }
    async function cronosSalvarPosterManualDataUrl(dataUrl, meta = {}) {
        if (!dataUrl)
            return;
        const obra = cronosGetObraAtualPatch();
        if (!obra || !obra.url)
            return;
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
        if (typeof checarBotaoFavorito === 'function')
            checarBotaoFavorito(atualizada.url);
        if (typeof cronosFecharPosterManual === 'function')
            cronosFecharPosterManual();
    }
    window.cronosSelecionarImagemPosterManual = async function (index) {
        const item = (window.__cronosPosterManualImagens || [])[index];
        if (!item || !item.url)
            return;
        const area = document.getElementById('posterManualConteudoCronos');
        if (area)
            area.innerHTML = '<div class="poster-manual-status">Salvando imagem escolhida como poster manual...</div>';
        try {
            await cronosSalvarPosterManualDataUrl(item.url, { fonte: item.url, modo: 'imagem_direta_sem_recorte', upload: false });
        }
        catch (e) {
            console.warn('Falha ao salvar poster manual:', e);
            if (area)
                area.innerHTML = `<div class="poster-manual-status">Não consegui salvar o poster: ${e.message || e}</div>`;
        }
    };
    function cronosGarantirUploadNoModal() {
        const area = document.getElementById('posterManualConteudoCronos');
        if (!area)
            return;
        if (document.getElementById('posterManualUploadWrapCronos'))
            return;
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
        input.onchange = function () {
            const file = input.files && input.files[0];
            if (!file)
                return;
            const reader = new FileReader();
            reader.onload = async function () {
                try {
                    await cronosSalvarPosterManualDataUrl(reader.result, { upload: true, fonte: file.name || 'upload', modo: 'upload_manual' });
                }
                catch (e) {
                    console.warn('Falha no upload do poster manual:', e);
                    alert('Não consegui salvar a capa enviada.');
                }
                finally {
                    input.value = '';
                }
            };
            reader.readAsDataURL(file);
        };
    }
    const originalAbrirModalPosterManualPatch = window.cronosAbrirModalPosterManual;
    if (typeof originalAbrirModalPosterManualPatch === 'function') {
        window.cronosAbrirModalPosterManual = async function () {
            await originalAbrirModalPosterManualPatch.apply(this, arguments);
            setTimeout(cronosGarantirUploadNoModal, 40);
            setTimeout(cronosGarantirUploadNoModal, 300);
        };
    }
    const originalAnalisarObraPatch = window.analisarObra;
    if (typeof originalAnalisarObraPatch === 'function') {
        window.analisarObra = function () {
            const retorno = originalAnalisarObraPatch.apply(this, arguments);
            setTimeout(cronosAplicarPosterManualNaTelaAtual, 200);
            setTimeout(cronosAplicarPosterManualNaTelaAtual, 900);
            setTimeout(cronosAplicarPosterManualNaTelaAtual, 1800);
            setTimeout(cronosAplicarPosterManualNaTelaAtual, 3000);
            return retorno;
        };
    }
    document.addEventListener('DOMContentLoaded', function () {
        cronosHabilitarCliquePosterManual();
        setTimeout(cronosAplicarPosterManualNaTelaAtual, 600);
        setInterval(() => {
            cronosHabilitarCliquePosterManual();
            cronosAplicarPosterManualNaTelaAtual().catch?.(() => { });
        }, 1800);
    });
})();
;
(function () {
    function getObraAtualManualOficial() {
        try {
            if (typeof obraSendoVista !== 'undefined' && obraSendoVista && obraSendoVista.url)
                return obraSendoVista;
        }
        catch (e) { }
        try {
            if (window.obraSendoVista && window.obraSendoVista.url)
                return window.obraSendoVista;
        }
        catch (e) { }
        return {};
    }
    function setObraAtualManualOficial(obra) {
        try {
            window.obraSendoVista = obra;
        }
        catch (e) { }
        try {
            if (typeof obraSendoVista !== 'undefined')
                obraSendoVista = obra;
        }
        catch (e) { }
    }
    function isManual(obra) {
        return !!(obra && (obra.posterManual || obra.posterManualEditable || obra.posterManualUpload));
    }
    function gerarPosterVerticalDeImagem(url) {
        return new Promise((resolve) => {
            const finalizarFallback = () => resolve(url);
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function () {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = 500;
                    canvas.height = 750;
                    const ctx = canvas.getContext('2d');
                    const iw = img.naturalWidth || img.width;
                    const ih = img.naturalHeight || img.height;
                    if (!iw || !ih)
                        return finalizarFallback();
                    const targetRatio = 500 / 750;
                    const sourceRatio = iw / ih;
                    let sx = 0, sy = 0, sw = iw, sh = ih;
                    if (sourceRatio > targetRatio) {
                        sw = ih * targetRatio;
                        sx = (iw - sw) / 2;
                    }
                    else {
                        sh = iw / targetRatio;
                        sy = (ih - sh) / 2;
                    }
                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, 0, 500, 750);
                    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 500, 750);
                    resolve(canvas.toDataURL('image/jpeg', 0.9));
                }
                catch (e) {
                    finalizarFallback();
                }
            };
            img.onerror = finalizarFallback;
            if (/^data:image\//i.test(url))
                img.src = url;
            else
                img.src = PROXY + encodeURIComponent(url);
        });
    }
    async function salvarPosterManualOficial(posterFinal, fonte, modo, upload) {
        const obra = getObraAtualManualOficial();
        if (!obra || !obra.url || !posterFinal)
            return;
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
        if (fav)
            await dbPut('favoritos', normalizarObraParaBanco({ ...fav, ...atualizada }));
        const hist = await dbGet('historico', id);
        if (hist)
            await dbPut('historico', normalizarObraParaBanco({ ...hist, ...atualizada, ultimoAcesso: hist.ultimoAcesso || new Date().toISOString() }));
        await salvarHistoricoHome(atualizada);
        aplicarPosterManualNaTela(atualizada);
        if (typeof renderizarResumoHomeLocal === 'function')
            renderizarResumoHomeLocal();
        if (typeof checarBotaoFavorito === 'function')
            checarBotaoFavorito(atualizada.url);
    }
    function aplicarPosterManualNaTela(obra) {
        const poster = escolherPosterSeguroCronos(obra?.poster, obra?.img);
        if (!poster)
            return;
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
        if (!obra || !obra.url)
            return;
        await migrarLocalStorageParaIndexedDB();
        const salvo = await dbGet('obras', gerarIdCronos(obra.url));
        if (!salvo || !isManual(salvo))
            return;
        const poster = escolherPosterSeguroCronos(salvo.poster, salvo.img);
        if (!poster)
            return;
        const mesclada = { ...obra, ...salvo, poster, img: poster, posterManual: true, posterManualEditable: true };
        setObraAtualManualOficial(mesclada);
        aplicarPosterManualNaTela(mesclada);
    }
    window.cronosSelecionarImagemPosterManual = async function (index) {
        const item = (window.__cronosPosterManualImagens || [])[index];
        if (!item || !item.url)
            return;
        const area = document.getElementById('posterManualConteudoCronos');
        if (area)
            area.innerHTML = '<div class="poster-manual-status">Gerando capa vertical e salvando no IndexedDB...</div>';
        try {
            const posterVertical = await gerarPosterVerticalDeImagem(item.url);
            await salvarPosterManualOficial(posterVertical, item.url, 'galeria_convertida_2x3', false);
            if (typeof cronosFecharPosterManual === 'function')
                cronosFecharPosterManual();
        }
        catch (e) {
            console.warn('Falha ao salvar poster manual oficial:', e);
            if (area)
                area.innerHTML = `<div class="poster-manual-status">Não consegui salvar o poster: ${e.message || e}</div>`;
        }
    };
    function inserirUploadPosterManual() {
        const area = document.getElementById('posterManualConteudoCronos');
        if (!area || document.getElementById('posterManualUploadWrapCronos'))
            return;
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
            if (!file)
                return;
            const reader = new FileReader();
            reader.onload = async () => {
                const area2 = document.getElementById('posterManualConteudoCronos');
                if (area2)
                    area2.innerHTML = '<div class="poster-manual-status">Salvando upload como poster manual...</div>';
                await salvarPosterManualOficial(reader.result, file.name || 'upload', 'upload_manual', true);
                if (typeof cronosFecharPosterManual === 'function')
                    cronosFecharPosterManual();
            };
            reader.readAsDataURL(file);
        };
    }
    const abrirModalAntigo = window.cronosAbrirModalPosterManual;
    if (typeof abrirModalAntigo === 'function') {
        window.cronosAbrirModalPosterManual = async function () {
            await abrirModalAntigo.apply(this, arguments);
            setTimeout(inserirUploadPosterManual, 30);
            setTimeout(inserirUploadPosterManual, 400);
        };
    }
    function habilitarCliqueManualPersistente() {
        const img = document.getElementById('detalheImg');
        if (!img || img.__posterManualOficialBind)
            return;
        img.__posterManualOficialBind = true;
        img.addEventListener('click', () => {
            const obra = getObraAtualManualOficial();
            if (img.classList.contains('poster-sem-imagem-manual') || img.dataset.posterManual === '1' || isManual(obra)) {
                if (typeof cronosAbrirModalPosterManual === 'function')
                    cronosAbrirModalPosterManual();
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
        window.analisarObra = function () {
            const ret = oldAnalisar.apply(this, arguments);
            setTimeout(reaplicarPosterManualSalvo, 250);
            setTimeout(reaplicarPosterManualSalvo, 900);
            setTimeout(reaplicarPosterManualSalvo, 1800);
            return ret;
        };
    }
})();
;
(function () {
    let aplicando = false;
    function norm(txt) {
        return String(txt || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }
    function alvo(el) {
        return norm([
            el.textContent || '',
            el.id || '',
            el.className || '',
            el.getAttribute('onclick') || '',
            el.getAttribute('title') || ''
        ].join(' '));
    }
    function isAtualizar(el) {
        const a = alvo(el);
        return a.includes('atualizar') ||
            a.includes('recarregar') ||
            a.includes('refresh') ||
            a.includes('reload');
    }
    function isVoltar(el) {
        return alvo(el).includes('voltar');
    }
    function isFavorito(el) {
        const a = alvo(el);
        return a.includes('favorito') || a.includes('favoritar');
    }
    function isTransmissao(el) {
        const a = alvo(el);
        return !isAtualizar(el) && (a.includes('iniciar transmissao') ||
            a.includes('transmissao') ||
            a.includes('transmiss') ||
            a.includes('player'));
    }
    function getTela() {
        return document.getElementById('telaDetalhes');
    }
    function esconderAtualizar(tela) {
        Array.from(tela.querySelectorAll('button,a')).forEach(btn => {
            if (!isAtualizar(btn))
                return;
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
    function organizarVoltarFavorito(tela) {
        if (window.innerWidth > 720)
            return;
        const botoes = Array.from(tela.querySelectorAll('button,a')).filter(btn => !isAtualizar(btn));
        const btnVoltar = botoes.find(isVoltar);
        const btnFavorito = botoes.find(isFavorito);
        if (!btnVoltar || !btnFavorito)
            return;
        let barra = tela.querySelector('.detalhe-actions-cronos-mobile');
        if (!barra) {
            barra = document.createElement('div');
            barra.className = 'detalhe-actions-cronos-mobile';
            tela.insertBefore(barra, tela.firstElementChild);
        }
        if (btnVoltar.parentElement !== barra)
            barra.appendChild(btnVoltar);
        if (btnFavorito.parentElement !== barra)
            barra.appendChild(btnFavorito);
    }
    function limparPatchesAntigosDoBotao(btn) {
        btn.classList.remove('cronos-transmissao-centro-real-btn', 'cronos-btn-transmissao-centro', 'cronos-btn-transmissao-fixo', 'cronos-btn-transmissao-dentro-fix');
        btn.style.removeProperty('left');
        btn.style.removeProperty('right');
        btn.style.setProperty('position', 'static', 'important');
        btn.style.setProperty('transform', 'none', 'important');
    }
    function acharContainerDaFicha(tela, btn) {
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
            if (c && tela.contains(c))
                return c;
        }
        let el = btn.parentElement;
        while (el && el !== tela) {
            const r = el.getBoundingClientRect();
            if (r.width > 250 && r.height > 180)
                return el;
            el = el.parentElement;
        }
        return tela;
    }
    function centralizarTransmissaoSemPulo(tela) {
        if (window.innerWidth > 720)
            return;
        const btn = Array.from(tela.querySelectorAll('button,a')).find(isTransmissao);
        if (!btn)
            return;
        limparPatchesAntigosDoBotao(btn);
        let wrap = btn.closest('.cronos-transmissao-sem-pulo-wrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.className = 'cronos-transmissao-sem-pulo-wrap';
            const container = acharContainerDaFicha(tela, btn);
            btn.parentNode.insertBefore(wrap, btn);
            wrap.appendChild(btn);
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
    function aplicar() {
        if (aplicando)
            return;
        const tela = getTela();
        if (!tela)
            return;
        aplicando = true;
        esconderAtualizar(tela);
        organizarVoltarFavorito(tela);
        centralizarTransmissaoSemPulo(tela);
        aplicando = false;
    }
    function init() {
        aplicar();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    }
    else {
        init();
    }
    window.addEventListener('resize', aplicar);
    document.addEventListener('click', function () {
        aplicar();
        setTimeout(aplicar, 80);
    }, true);
    const obs = new MutationObserver(function (muts) {
        const tela = getTela();
        if (!tela)
            return;
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
;
(function () {
    const KEY = 'cronos_mobile_letras_ativas';
    const MENU = [['Início', 'telaInicio', ['inicio', 'início', 'home']], ['Filmes', 'telaFilmes', ['filmes', 'filme']], ['Séries', 'telaSeries', ['series', 'séries', 'serie', 'série']], ['Episódios', 'telaEpisodios', ['episodios', 'episódios', 'episodio', 'episódio']], ['Categorias', 'telaCategorias', ['categorias', 'categoria']], ['Configurações', 'telaConfiguracoes', ['configuracoes', 'configurações', 'configuracao', 'configuração']], ['Histórico', 'telaHistorico', ['historico', 'histórico']], ['Favoritos', 'telaFavoritos', ['favoritos', 'favorito']]].map(x => ({ label: x[0], tela: x[1], keys: x[2] }));
    let atual = localStorage.getItem('cronos_mobile_menu_atual') || 'Início';
    function norm(t) { return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim(); }
    function letrasAtivas() { let v = localStorage.getItem(KEY); return v === null ? false : v === '1'; }
    function setLetras(v) { localStorage.setItem(KEY, v ? '1' : '0'); aplicarLetras(); renderMenu(); atualizarBotoesCat(); }
    function acharOriginal(item) { let bs = [...document.querySelectorAll('.nav-links .nav-btn,.nav-links button,.nav-links a,nav .nav-btn,nav button,nav a')]; return bs.find(el => { let t = norm(el.textContent); if (!t || ['ir', '☰', '=', 'menu'].includes(t))
        return false; let alvo = norm([el.textContent, el.getAttribute('onclick'), el.getAttribute('data-tab'), el.getAttribute('data-page'), el.getAttribute('data-tela'), el.id, el.className, el.getAttribute('href')].join(' ')); return item.keys.some(k => alvo.includes(norm(k))); }); }
    function abrirFallback(item) { let tela = document.getElementById(item.tela); if (!tela)
        return false; document.querySelectorAll('.view-container,.tela').forEach(x => { x.classList.remove('ativa'); if (x.id && x.id.startsWith('tela'))
        x.style.display = 'none'; }); tela.classList.add('ativa'); tela.style.display = 'block'; scrollTo({ top: 0, behavior: 'smooth' }); return true; }
    function navegar(item) {
        atual = item.label;
        localStorage.setItem('cronos_mobile_menu_atual', atual);
        let orig = acharOriginal(item);
        if (item.label === 'Configurações') {
            try {
                if (typeof window.carregarConfiguracoes === 'function') {
                    window.carregarConfiguracoes(document.querySelector('button[onclick*="carregarConfiguracoes"]'));
                    aplicarLetras();
                    return;
                }
            }
            catch (e) { }
            try {
                if (typeof window.ativarTela === 'function') {
                    window.ativarTela('telaConfiguracoes');
                    aplicarLetras();
                    return;
                }
            }
            catch (e) { }
        }
        if (item.label === 'Lançamentos') {
            try {
                if (typeof window.carregarLancamentos === 'function') {
                    window.carregarLancamentos(document.querySelector('button[onclick*="carregarLancamentos"]'));
                    aplicarLetras();
                    return;
                }
            }
            catch (e) { }
            try {
                if (typeof window.ativarTela === 'function') {
                    window.ativarTela('telaLancamentos');
                    aplicarLetras();
                    return;
                }
            }
            catch (e) { }
        }
        if (item.label === 'Episódios') {
            let ok = false;
            try {
                if (typeof window.iniciarNavegacao === 'function') {
                    window.iniciarNavegacao('telaEpisodios', 'https://www.boraflix.click/episodios/', document.querySelector('button[onclick*=\"carregarCategorias\"]'));
                    ok = true;
                }
            }
            catch (e) { }
            try {
                if (!ok && orig) {
                    orig.click();
                    ok = true;
                }
            }
            catch (e) { }
            try {
                if (!ok && typeof window.ativarTela === 'function') {
                    window.ativarTela('telaEpisodios');
                    ok = true;
                }
            }
            catch (e) { }
            if (!ok)
                abrirFallback(item);
            aplicarLetras();
            return;
        }
        if (item.label === 'Histórico') {
            try {
                if (typeof window.carregarHistorico === 'function') {
                    window.carregarHistorico(document.querySelector('button[onclick*="carregarHistorico"]'));
                    aplicarLetras();
                    return;
                }
            }
            catch (e) { }
        }
        if (item.label === 'Favoritos') {
            try {
                if (typeof window.carregarFavoritos === 'function') {
                    window.carregarFavoritos(document.querySelector('button[onclick*="carregarFavoritos"]'));
                    aplicarLetras();
                    return;
                }
            }
            catch (e) { }
        }
        if (orig) {
            orig.click();
            aplicarLetras();
            return;
        }
        try {
            if (typeof window.ativarTela === 'function') {
                window.ativarTela(item.tela);
                aplicarLetras();
                return;
            }
        }
        catch (e) { }
        try {
            if (typeof window.navegar === 'function') {
                window.navegar(norm(item.keys[0]));
                aplicarLetras();
                return;
            }
        }
        catch (e) { }
        abrirFallback(item);
        aplicarLetras();
    }
    function garantirBtn() { let nav = document.querySelector('.navbar') || document.querySelector('header') || document.body; document.querySelectorAll('#mobileMenuBtnCronos').forEach((b, i) => { if (i > 0)
        b.remove(); }); let b = document.getElementById('mobileMenuBtnCronos'); if (!b) {
        b = document.createElement('button');
        b.id = 'mobileMenuBtnCronos';
        b.className = 'mobile-menu-btn';
        b.type = 'button';
        nav.appendChild(b);
    } b.innerHTML = '☰'; b.onclick = e => { e.preventDefault(); e.stopPropagation(); abrirMenuMobileCronos(); }; }
    function overlay() { let o = document.getElementById('mobileMenuOverlayCronos'); if (!o) {
        o = document.createElement('div');
        o.id = 'mobileMenuOverlayCronos';
        o.className = 'mobile-menu-overlay';
        document.body.appendChild(o);
    } if (!o.querySelector('.mobile-menu-panel'))
        o.innerHTML = '<div class="mobile-menu-panel"><div class="mobile-menu-title">MENU</div><div id="mobileMenuLinksCronos"></div></div>'; o.onclick = e => { if (e.target === o)
        fecharMenuMobileCronos(); }; return o; }
    function detectar() { let a = document.querySelector('.view-container.ativa,.tela.ativa'); if (!a)
        return atual; let m = MENU.find(x => x.tela === a.id); if (m) {
        atual = m.label;
        localStorage.setItem('cronos_mobile_menu_atual', atual);
    } return atual; }
    function renderMenu() { overlay(); detectar(); let box = document.getElementById('mobileMenuLinksCronos'); if (!box)
        return; box.innerHTML = ''; MENU.forEach(item => { let b = document.createElement('button'); b.type = 'button'; b.textContent = item.label; if (item.label === atual)
        b.classList.add('menu-atual-cronos'); b.onclick = e => { e.preventDefault(); e.stopPropagation(); fecharMenuMobileCronos(); navegar(item); }; box.appendChild(b); }); let l = document.createElement('button'); l.type = 'button'; l.textContent = letrasAtivas() ? 'Letras: Ativado' : 'Letras: Desativado'; l.className = letrasAtivas() ? 'letras-ligadas-cronos' : 'letras-desligadas-cronos'; l.onclick = e => { e.preventDefault(); e.stopPropagation(); setLetras(!letrasAtivas()); }; box.appendChild(l); }
    window.abrirMenuMobileCronos = function () { garantirBtn(); renderMenu(); overlay().classList.add('ativo'); };
    window.fecharMenuMobileCronos = function () { let o = document.getElementById('mobileMenuOverlayCronos'); if (o)
        o.classList.remove('ativo'); };
    function esconderAbas() { if (innerWidth > 720)
        return; document.querySelectorAll('.nav-links').forEach(el => { el.style.setProperty('display', 'none', 'important'); el.style.setProperty('visibility', 'hidden', 'important'); el.style.setProperty('height', '0', 'important'); el.style.setProperty('overflow', 'hidden', 'important'); }); }
    function criarAZ(id, ctx, gridId) { if (document.getElementById(id))
        return; let grid = document.getElementById(gridId); if (!grid || !grid.parentNode)
        return; let div = document.createElement('div'); div.id = id; div.className = 'abc-bar letras-forcada-cronos'; ['ALL', '0-9', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].forEach(letra => { let b = document.createElement('button'); b.className = 'abc-btn'; b.innerText = letra; b.onclick = function () { if (typeof window.filtrarPorLetraCronos === 'function')
        filtrarPorLetraCronos(ctx, letra, b);
    else
        filtrarLocal(gridId, letra); }; div.appendChild(b); }); grid.parentNode.insertBefore(div, grid); }
    function filtrarLocal(gridId, letra) { let grid = document.getElementById(gridId); if (!grid)
        return; [...grid.children].forEach(c => { let t = (c.innerText || '').trim(); let ok = true; if (letra && letra !== 'ALL')
        ok = letra === '0-9' ? /^[0-9]/.test(t) : t.charAt(0).toUpperCase() === letra; c.style.display = ok ? '' : 'none'; }); }
    function garantirAZ() { criarAZ('abcEpisodios', 'episodios', 'gridEpisodios'); criarAZ('abcLancamentos', 'lancamentosLocal', 'gridLancamentos'); criarAZ('abcTemporadas', 'temporadas', 'gridTemporadas'); criarAZ('abcAnimes', 'animesLocal', 'gridAnimes'); criarAZ('abcHistorico', 'historicoLocal', 'gridHistorico'); criarAZ('abcFavoritos', 'favoritoLocal', 'gridFavoritos'); }
    function aplicarLetras() { let on = letrasAtivas(); document.body.classList.toggle('letras-cronos-on', on); document.body.classList.toggle('letras-cronos-off', !on); garantirAZ(); let telas = new Set(['telaFilmes', 'telaSeries', 'telaEpisodios', 'telaLancamentos', 'telaTemporadas', 'telaAnimes', 'telaHistorico', 'telaFavoritos', 'telaBusca']); document.querySelectorAll('.abc-bar,.az-bar,.alfabeto,.filtro-letras').forEach(bar => { let p = bar.closest('.view-container,.tela'); let permitir = p && telas.has(p.id); bar.style.setProperty('display', (on && permitir) ? 'flex' : 'none', 'important'); if (on && permitir)
        bar.style.setProperty('flex-wrap', 'wrap', 'important'); }); atualizarBotoesCat(); }
    function atualizarBotoesCat() { document.querySelectorAll('.btn-letras-categoria-cronos').forEach(b => { b.textContent = 'Letras'; b.classList.toggle('letras-ligadas-cronos', letrasAtivas()); b.classList.toggle('letras-desligadas-cronos', !letrasAtivas()); }); }
    function btnCatTxt(txt) { let tcat = document.getElementById('telaConfiguracoes') || document.body; let alvo = norm(txt); return [...tcat.querySelectorAll('button,a')].find(b => { let t = norm(b.textContent); return t === alvo || t.includes(alvo); }); }
    function garantirBotaoLetrasCat() { let tcat = document.getElementById('telaConfiguracoes'); if (!tcat)
        return; let box = tcat.querySelector('.cronos-categoria-atalhos-letras'); if (!box) {
        box = document.createElement('div');
        box.className = 'cronos-categoria-atalhos-letras';
        let refs = [btnCatTxt('Temporadas'), btnCatTxt('Episódios'), btnCatTxt('Lançamentos')].filter(Boolean);
        if (refs.length) {
            let parent = refs[0].parentElement || tcat;
            parent.insertBefore(box, refs[0]);
            refs.forEach(b => box.appendChild(b));
        }
        else {
            let h = [...tcat.querySelectorAll('h1,h2,h3')].find(x => /configura/i.test(x.textContent || ''));
            if (h && h.nextSibling)
                tcat.insertBefore(box, h.nextSibling);
            else
                tcat.insertBefore(box, tcat.firstElementChild);
        }
    } let bl = box.querySelector('.btn-letras-categoria-cronos'); if (!bl) {
        bl = document.createElement('button');
        bl.type = 'button';
        bl.className = 'btn-letras-categoria-cronos';
        bl.onclick = e => { e.preventDefault(); e.stopPropagation(); setLetras(!letrasAtivas()); };
        let lanc = [...box.querySelectorAll('button,a')].find(b => norm(b.textContent).includes('lancamentos'));
        if (lanc)
            box.insertBefore(bl, lanc);
        else
            box.appendChild(bl);
    } atualizarBotoesCat(); }
    function botaoCatalogoEp() { let head = document.getElementById('headEpisodiosRecentes'); if (!head || head.querySelector('.home-mini-link'))
        return; let b = document.createElement('button'); b.className = 'home-mini-link'; b.textContent = 'Ver catálogo'; b.onclick = () => navegar({ label: 'Episódios', tela: 'telaEpisodios', keys: ['episodios', 'episódios', 'episodio', 'episódio'] }); head.appendChild(b); }
    function titulos() { document.querySelectorAll('h1,h2,h3,.sessao-titulo,.section-title,.titulo-secao').forEach(el => { let t = (el.textContent || '').trim(); if (/Filmes\s+Adicionados\s+Recentemente/i.test(t))
        el.textContent = 'Filmes Recentes'; if (/S[ée]ries\s+Adicionadas\s+Recentemente/i.test(t))
        el.textContent = 'Séries Recentes'; if (/Epis[oó]dios\s+Adicionados\s+Recentemente/i.test(t))
        el.textContent = 'Episódios Recentes'; }); }
    function init() { garantirBtn(); overlay(); esconderAbas(); garantirAZ(); garantirBotaoLetrasCat(); aplicarLetras(); botaoCatalogoEp(); titulos(); }
    document.addEventListener('click', e => { let b = e.target && e.target.closest ? e.target.closest('#mobileMenuBtnCronos') : null; if (!b)
        return; e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); abrirMenuMobileCronos(); }, true);
    function agendarInitLeve() {
        init();
        [250, 900, 1800, 3500].forEach(t => setTimeout(init, t));
        window.addEventListener('resize', () => { clearTimeout(window.__cronosMenuResizeTimer); window.__cronosMenuResizeTimer = setTimeout(init, 160); }, { passive: true });
        if (!window.__cronosMenuObserver) {
            window.__cronosMenuObserver = new MutationObserver(() => { clearTimeout(window.__cronosMenuMutTimer); window.__cronosMenuMutTimer = setTimeout(init, 120); });
            window.__cronosMenuObserver.observe(document.body, { childList: true, subtree: true });
        }
    }
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', agendarInitLeve);
    else
        agendarInitLeve();
})();
;
(function () {
    function isMobileCronos() { return window.matchMedia && window.matchMedia('(max-width: 768px)').matches; }
    function limparDuplicatasCronos() {
        document.querySelectorAll('#mobileMenuBtnCronos').forEach((el, i) => { if (i > 0)
            el.remove(); });
        document.querySelectorAll('#mobileMenuOverlayCronos').forEach((el, i) => { if (i > 0)
            el.remove(); });
        if (!isMobileCronos()) {
            const overlay = document.getElementById('mobileMenuOverlayCronos');
            if (overlay)
                overlay.classList.remove('ativo');
        }
    }
    function initDuploMelhorado() { limparDuplicatasCronos(); }
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', initDuploMelhorado);
    else
        initDuploMelhorado();
    window.addEventListener('resize', () => { clearTimeout(window.__cronosDuploResize); window.__cronosDuploResize = setTimeout(initDuploMelhorado, 140); }, { passive: true });
})();
;
(function () {
    function tipoPlayerCronosV7(urlVideo) {
        const u = String(urlVideo || '').toLowerCase();
        if (/superflixapi/i.test(u))
            return 'seletor';
        if (/superembeds|superembed/i.test(u))
            return 'video';
        if (/viewplayer|playerthree|trembed/i.test(u))
            return 'video';
        return 'video';
    }
    function aplicarModoPlayerCronosV7(urlVideo) {
        const tela = document.getElementById('telaPlayer');
        if (!tela)
            return;
        const modo = tipoPlayerCronosV7(urlVideo || document.getElementById('iframePlayer')?.src || '');
        tela.classList.remove('player-modo-seletor', 'player-modo-video');
        tela.classList.add(modo === 'seletor' ? 'player-modo-seletor' : 'player-modo-video');
        tela.dataset.playerModo = modo;
    }
    const abrirAtual = window.abrirPlayer;
    if (typeof abrirAtual === 'function' && !abrirAtual.__cronosV7PlayerPorTipo) {
        const abrirNovo = function (titulo, urlVideo) {
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
    }
    else {
        aplicarModoPlayerCronosV7();
    }
    window.cronosAplicarModoPlayerV7 = aplicarModoPlayerCronosV7;
})();
;
(function () {
    const TITULO_ORIGINAL_CRONOS_V15 = document.title || 'Cronos';
    function limpar(txt) {
        return String(txt || '').replace(/\s+/g, ' ').trim();
    }
    function tituloPlayerSerieSemNomeDoEpisodio(titulo) {
        let t = limpar(titulo);
        let m = t.match(/^(.+?)\s*[-–]\s*S\s*(\d{1,2})\s*E\s*(\d{1,4})(?:\s*[-–].*)?$/i);
        if (m)
            return `${limpar(m[1])} - S${String(m[2]).padStart(2, '0')}E${String(m[3]).padStart(2, '0')}`;
        m = t.match(/^(.+?)\s*[-–]\s*S\s*(\d{1,2})\s*E\s*(\d{1,4})(?:\s*[\/|].*)?$/i);
        if (m)
            return `${limpar(m[1])} - S${String(m[2]).padStart(2, '0')}E${String(m[3]).padStart(2, '0')}`;
        return t;
    }
    function tipoPlayerCronosV15(url) {
        const u = String(url || '').toLowerCase();
        if (u.includes('superflixapi'))
            return 'seletor';
        if (u.includes('superembeds') || u.includes('superembed'))
            return 'video';
        if (u.includes('viewplayer') || u.includes('playerthree') || u.includes('trembed'))
            return 'video';
        return 'video';
    }
    function aplicarModoPlayer(url) {
        const tela = document.getElementById('telaPlayer');
        if (!tela)
            return;
        const modo = tipoPlayerCronosV15(url || document.getElementById('iframePlayer')?.src || '');
        tela.classList.remove('player-modo-seletor', 'player-modo-video');
        tela.classList.add(modo === 'seletor' ? 'player-modo-seletor' : 'player-modo-video');
    }
    function garantirNavegacaoPlayer() {
        const tela = document.getElementById('telaPlayer');
        const wrap = tela && tela.querySelector('.player-wrapper');
        if (!tela || !wrap)
            return;
        if (document.getElementById('playerNavegacao'))
            return;
        const nav = document.createElement('div');
        nav.id = 'playerNavegacao';
        nav.className = 'player-navegacao';
        nav.style.display = 'none';
        nav.innerHTML = '<button class="btn-nav-ep" id="btnEpAnterior" style="display:none;">Episódio Anterior</button><button class="btn-nav-ep" id="btnEpProximo" style="display:none;">Próximo Episódio</button>';
        wrap.after(nav);
    }
    function montarListaPlayerDaTemporadaAtual() {
        try {
            const lista = [];
            const mapa = (typeof dadosSeriesAtual !== 'undefined' && dadosSeriesAtual[localAudioAtivo]) ? dadosSeriesAtual[localAudioAtivo] : {};
            const sids = Object.keys(mapa).sort((a, b) => parseInt(a) - parseInt(b));
            if (!sids.length)
                return lista;
            let sidAtual = (typeof temporadaAtiva !== 'undefined' && temporadaAtiva && mapa[temporadaAtiva]) ? temporadaAtiva : sids[0];
            const seasonIndex = sids.indexOf(sidAtual) + 1;
            const tNum = String(seasonIndex || 1).padStart(2, '0');
            const eps = mapa[sidAtual] || [];
            eps.forEach((li, index) => {
                const nativeUrl = li.getAttribute('data-native-url');
                const iframeId = li.dataset.episode_id || li.getAttribute('data-episode-id');
                const eNum = String(index + 1).padStart(2, '0');
                let epUrl = nativeUrl || (iframeId ? `https://viewplayer.online/episodio/${iframeId}` : '');
                if (!epUrl)
                    return;
                let epNumText = li.querySelector('.episode-title, .episodiotitle')?.innerText || '';
                let epDateEl = li.querySelector('.date');
                let epDate = epDateEl ? epDateEl.innerText.trim() : '';
                if (epDate && epNumText.includes(epDate))
                    epNumText = epNumText.replace(epDate, '').trim();
                epNumText = epNumText.replace(/^[0-9]+\s*[-–]\s*/, '').trim();
                if (epNumText.toLowerCase() === 'episódio' || epNumText === '')
                    epNumText = `Episódio ${eNum}`;
                const tituloFormatado = `S${tNum}E${eNum} - ${epNumText}`;
                const serie = (typeof tituloSerieAtual !== 'undefined' && tituloSerieAtual) || (typeof obraSendoVista !== 'undefined' && obraSendoVista.titulo) || 'Série';
                lista.push({ url: epUrl, titulo: `${serie} - ${tituloFormatado}` });
            });
            return lista;
        }
        catch (e) {
            return [];
        }
    }
    window.__cronosPlayerListaAtual = window.__cronosPlayerListaAtual || [];
    function atualizarListaPlayerCronos() {
        const lista = montarListaPlayerDaTemporadaAtual();
        if (lista.length)
            window.__cronosPlayerListaAtual = lista;
    }
    function atualizarBotoesNavegacaoCronos(urlAtual) {
        garantirNavegacaoPlayer();
        const nav = document.getElementById('playerNavegacao');
        const ant = document.getElementById('btnEpAnterior');
        const prox = document.getElementById('btnEpProximo');
        if (!nav || !ant || !prox)
            return;
        const lista = window.__cronosPlayerListaAtual || [];
        if (lista.length <= 1) {
            nav.style.display = 'none';
            return;
        }
        const atual = String(urlAtual || document.getElementById('iframePlayer')?.src || '');
        const idx = lista.findIndex(ep => ep.url === atual);
        if (idx < 0) {
            nav.style.display = 'none';
            return;
        }
        nav.style.display = 'grid';
        if (idx > 0) {
            const ep = lista[idx - 1];
            ant.style.display = 'block';
            ant.onclick = () => abrirEpisodioPlayerNav(ep);
        }
        else
            ant.style.display = 'none';
        if (idx < lista.length - 1) {
            const ep = lista[idx + 1];
            prox.style.display = 'block';
            prox.onclick = () => abrirEpisodioPlayerNav(ep);
        }
        else
            prox.style.display = 'none';
    }
    function abrirEpisodioPlayerNav(ep) {
        if (!ep || !ep.url)
            return;
        if (ep.url.includes('viewplayer.online/episodio/'))
            abrirPlayer(ep.titulo, ep.url);
        else
            prepararEpisodioDooplay(ep.titulo, ep.url);
    }
    const renderOriginal = window.renderizarGradeEpisodios;
    if (typeof renderOriginal === 'function' && !renderOriginal.__cronosV15Nav) {
        window.renderizarGradeEpisodios = function () {
            const r = renderOriginal.apply(this, arguments);
            atualizarListaPlayerCronos();
            return r;
        };
        window.renderizarGradeEpisodios.__cronosV15Nav = true;
    }
    const abrirOriginal = window.abrirPlayer;
    if (typeof abrirOriginal === 'function' && !abrirOriginal.__cronosV15TituloGuia) {
        window.abrirPlayer = function (titulo, urlVideo) {
            const r = abrirOriginal.apply(this, arguments);
            const tituloFinal = tituloPlayerSerieSemNomeDoEpisodio(titulo);
            const tituloEl = document.getElementById('playerTitulo');
            if (tituloEl)
                tituloEl.innerText = tituloFinal;
            document.title = tituloFinal || TITULO_ORIGINAL_CRONOS_V15;
            aplicarModoPlayer(urlVideo);
            atualizarListaPlayerCronos();
            atualizarBotoesNavegacaoCronos(urlVideo);
            setTimeout(() => {
                try {
                    document.getElementById('telaPlayer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                catch (e) { }
            }, 60);
            return r;
        };
        window.abrirPlayer.__cronosV15TituloGuia = true;
    }
    const fecharOriginal = window.fecharPlayer;
    if (typeof fecharOriginal === 'function' && !fecharOriginal.__cronosV15TituloGuia) {
        window.fecharPlayer = function () {
            const r = fecharOriginal.apply(this, arguments);
            document.title = TITULO_ORIGINAL_CRONOS_V15;
            const nav = document.getElementById('playerNavegacao');
            if (nav)
                nav.style.display = 'none';
            return r;
        };
        window.fecharPlayer.__cronosV15TituloGuia = true;
    }
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', garantirNavegacaoPlayer);
    else
        garantirNavegacaoPlayer();
})();
