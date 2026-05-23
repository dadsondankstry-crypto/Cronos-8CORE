
/* ===== POSTER MANUAL — escolher imagem do backdrop/galeria e salvar recorte no IndexedDB ===== */
(function(){
    const MODAL_ID = 'posterManualModalCronos';

    function cronosObraAtualManual() {
        try {
            if (window.obraSendoVista && window.obraSendoVista.url) return window.obraSendoVista;
            if (typeof obraSendoVista !== 'undefined' && obraSendoVista && obraSendoVista.url) return obraSendoVista;
        } catch(e) {}
        return {};
    }

    function cronosSetObraAtualManual(obra) {
        try { window.obraSendoVista = obra; } catch(e) {}
        try { if (typeof obraSendoVista !== 'undefined') obraSendoVista = obra; } catch(e) {}
    }

    function cronosPosterManualPlaceholder() {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750">
            <rect width="500" height="750" fill="#050505"/>
            <rect x="16" y="16" width="468" height="718" rx="14" fill="#080808" stroke="#00ffff" stroke-width="2" stroke-opacity="0.45"/>
            <text x="250" y="380" text-anchor="middle" fill="#00ffff" font-family="Arial, sans-serif" font-size="44" font-weight="700">POSTER</text>
        </svg>`;
        return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    }

    // Permite salvar poster manual em data:image/jpeg/png/webp, mas continua bloqueando o SVG de placeholder.
    if (typeof window.imagemEhPlaceholderCronos === 'function') {
        const originalImagemEhPlaceholderCronos = window.imagemEhPlaceholderCronos;
        window.imagemEhPlaceholderCronos = function(url) {
            const u = String(url || '').toLowerCase();
            if (/^data:image\/(jpeg|jpg|png|webp)/i.test(u)) return false;
            return originalImagemEhPlaceholderCronos(url);
        };
    }

    function garantirModalPosterManual() {
        let modal = document.getElementById(MODAL_ID);
        if (modal) return modal;
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
        modal.addEventListener('click', (e) => { if (e.target === modal) cronosFecharPosterManual(); });
        return modal;
    }

    window.cronosFecharPosterManual = function() {
        const modal = document.getElementById(MODAL_ID);
        if (modal) modal.style.display = 'none';
    };

    function absUrlCronos(url, base) {
        if (!url) return '';
        let u = String(url).trim().replace(/&amp;/g, '&').replace(/^url\(["']?|["']?\)$/g, '').trim();
        if (!u || u.startsWith('data:') || u.startsWith('blob:')) return '';
        try { return new URL(u, base || location.href).href; } catch { return u; }
    }

    function limparUrlImagemManual(url) {
        let u = String(url || '').trim();
        if (!u) return '';
        if (/image\.tmdb\.org\/t\/p\//i.test(u)) {
            u = u.replace(/\/t\/p\/(w\d+|original)\//i, '/t/p/original/');
        }
        return u;
    }

    function imagemCandidataBoaManual(url) {
        const u = String(url || '').toLowerCase();
        if (!u) return false;
        if (u.includes('logo') || u.includes('favicon') || u.includes('avatar') || u.includes('blank') || u.includes('placeholder')) return false;
        return /(image\.tmdb\.org|wp-content\/uploads|\.jpg|\.jpeg|\.png|\.webp)/i.test(u);
    }

    function coletarImagensPosterManual(doc, html, baseUrl) {
        const lista = [];
        const add = (url, origem) => {
            let u = limparUrlImagemManual(absUrlCronos(url, baseUrl));
            if (!imagemCandidataBoaManual(u)) return;
            if (lista.some(x => x.url === u)) return;
            lista.push({ url: u, origem });
        };

        // Prioridade: galeria real/backdrops da ficha.
        doc.querySelectorAll('#dt_galery a[href], .dt_galery a[href], .g-item a[href], .galeria a[href], .gallery a[href]').forEach(a => add(a.getAttribute('href'), 'Galeria'));
        doc.querySelectorAll('#dt_galery img, .dt_galery img, .g-item img, .galeria img, .gallery img').forEach(img => {
            ['data-src','data-lazy-src','data-original','src'].forEach(attr => add(img.getAttribute(attr), 'Galeria img'));
            const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset') || '';
            srcset.split(',').forEach(p => add((p.trim().split(/\s+/)[0] || ''), 'Galeria srcset'));
        });

        // Depois: og:image, incluindo a lista grande do site.
        doc.querySelectorAll('meta[property="og:image"], meta[name="og:image"], meta[property="twitter:image"], meta[name="twitter:image"]').forEach(m => add(m.getAttribute('content'), 'Meta image'));

        // JSON-LD / HTML bruto / background-image.
        const texto = String(html || '');
        let m;
        const regexUrl = /(https?:\/\/[^"'<>\s]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'<>\s]*)?)/gi;
        while ((m = regexUrl.exec(texto))) add(m[1], 'HTML');
        const regexBg = /background(?:-image)?\s*:\s*url\(["']?([^"')]+)["']?\)/gi;
        while ((m = regexBg.exec(texto))) add(m[1], 'Background');

        // Mantém a ordem encontrada: primeira da galeria/meta vem primeiro. Limita para não pesar.
        return lista.slice(0, 40);
    }

    async function buscarImagensDaObraManual() {
        const obra = cronosObraAtualManual();
        const url = obra.url || obra.link || obra.href || '';
        if (!url) throw new Error('URL da obra não encontrada.');
        const res = await fetch(PROXY + encodeURIComponent(url));
        if (!res.ok) throw new Error('Falha ao abrir a página da obra.');
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return coletarImagensPosterManual(doc, html, url);
    }

    window.cronosAbrirModalPosterManual = async function() {
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
                            <img src="${img.url}" loading="lazy" alt="Imagem ${i+1}">
                            <span>${i+1}. ${img.origem}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            window.__cronosPosterManualImagens = imagens;
        } catch (e) {
            console.warn('Poster manual falhou:', e);
            area.innerHTML = `<div class="poster-manual-status">Falha ao carregar imagens: ${e.message || e}</div>`;
        }
    };

    window.cronosSelecionarImagemPosterManual = function(index) {
        const item = (window.__cronosPosterManualImagens || [])[index];
        if (!item) return;
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
        } else {
            sw = nw;
            sh = Math.round(nw / alvo);
            sx = 0;
            sy = Math.round(Math.max(0, nh - sh) * (posY / 100));
        }
        return { sx, sy, sw, sh, nw, nh };
    }

    window.cronosAtualizarPreviewCropPoster = function() {
        const img = document.getElementById('posterCropImgCronos');
        const overlay = document.getElementById('posterCropOverlayCronos');
        const preview = document.getElementById('posterCropPreviewCronos');
        const posX = Number(document.getElementById('posterCropXChronos')?.value || 50);
        const posY = Number(document.getElementById('posterCropYChronos')?.value || 50);
        if (!img || !overlay || !preview) return;
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

    window.cronosSalvarPosterManual = async function(encodedUrl) {
        const urlOriginal = decodeURIComponent(encodedUrl || '');
        const img = document.getElementById('posterCropImgCronos');
        const posX = Number(document.getElementById('posterCropXChronos')?.value || 50);
        const posY = Number(document.getElementById('posterCropYChronos')?.value || 50);
        if (!img || !urlOriginal) return;
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
            if (typeof salvarObraCronos === 'function') await salvarObraCronos(atualizada);
            if (typeof salvarHistoricoHome === 'function') await salvarHistoricoHome(atualizada);
            cronosFecharPosterManual();
            if (typeof checarBotaoFavorito === 'function' && atualizada.url) checarBotaoFavorito(atualizada.url);
        } catch (e) {
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
                if (imgDetalhe) imgDetalhe.src = urlOriginal;
                if (typeof salvarObraCronos === 'function') await salvarObraCronos(atualizada);
                cronosFecharPosterManual();
            } catch (e2) {
                area.innerHTML = `<div class="poster-manual-status">Não consegui salvar o poster: ${e2.message || e2}</div>`;
            }
        }
    };

    function detalhePosterSemImagem() {
        const img = document.getElementById('detalheImg');
        if (!img) return false;
        const src = String(img.getAttribute('src') || '').trim().toLowerCase();
        if (!src || src.startsWith('data:image/svg')) return true;
        if (src.includes('placeholder') || src.includes('no_poster') || src.includes('carregando')) return true;
        if (img.complete && img.naturalWidth === 0) return true;
        return false;
    }

    function ativarPosterClicavelSeSemImagem() {
        const img = document.getElementById('detalheImg');
        if (!img) return;
        if (!img.__posterManualBind) {
            img.__posterManualBind = true;
            img.addEventListener('click', function() {
                if (detalhePosterSemImagem()) cronosAbrirModalPosterManual();
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
        } else {
            img.classList.remove('poster-sem-imagem-manual');
            img.title = '';
            img.alt = 'Poster';
        }
    }

    const obs = new MutationObserver(() => setTimeout(ativarPosterClicavelSeSemImagem, 120));
    document.addEventListener('DOMContentLoaded', () => {
        const img = document.getElementById('detalheImg');
        if (img) obs.observe(img, { attributes: true, attributeFilter: ['src'] });
        ativarPosterClicavelSeSemImagem();
        [250, 900, 1800, 3500].forEach(t => setTimeout(ativarPosterClicavelSeSemImagem, t));
        if (!window.__cronosPosterManualBodyObserver) {
            window.__cronosPosterManualBodyObserver = new MutationObserver(() => setTimeout(ativarPosterClicavelSeSemImagem, 120));
            window.__cronosPosterManualBodyObserver.observe(document.body, { childList: true, subtree: true });
        }
    });
})();
