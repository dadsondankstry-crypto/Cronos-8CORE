
/* =========================================================
   V27 — CONTROLES DO BANCO LOCAL / INDEXEDDB
   - Prioridade do banco dentro de Configurações
   - Exportar banco completo
   - Importar banco completo
   - Banco ON: cards enriquecem pelo IndexedDB primeiro
   - Banco OFF: Home/Filmes/Séries/Episódios usam site primeiro
   - Exceção: filtros por ano continuam usando IndexedDB
========================================================= */
(function(){
    const PRIORIDADE_KEY = 'cronos_idb_prioridade_ativa_v27';
    const IMPORT_INPUT_ID = 'cronosImportarBancoInputV27';

    function bancoPrimeiroAtivo(){
        try { return localStorage.getItem(PRIORIDADE_KEY) !== '0'; }
        catch(e) { return true; }
    }

    function setBancoPrimeiroAtivo(ativo){
        try { localStorage.setItem(PRIORIDADE_KEY, ativo ? '1' : '0'); } catch(e) {}
        atualizarPainelBancoV27();
        const msg = ativo
            ? 'Banco local ativado: Home, Filmes, Séries e Episódios tentam IndexedDB primeiro.'
            : 'Banco local desativado como prioridade: Home, Filmes, Séries e Episódios carregam primeiro pelo site.';
        const status = document.getElementById('cronosBancoStatusV27');
        if(status) status.textContent = msg;
    }

    window.cronosBancoPrimeiroAtivo = bancoPrimeiroAtivo;
    window.cronosSetBancoPrimeiroAtivo = setBancoPrimeiroAtivo;
    window.cronosToggleBancoPrioridade = function(){ setBancoPrimeiroAtivo(!bancoPrimeiroAtivo()); };

    function atualizarPainelBancoV27(){
        const ativo = bancoPrimeiroAtivo();
        const btn = document.getElementById('btnBancoPrioridadeV27');
        const chip = document.getElementById('chipBancoPrioridadeV27');
        const desc = document.getElementById('descBancoPrioridadeV27');
        if(btn){
            btn.classList.toggle('ativo', ativo);
            btn.textContent = ativo ? 'Banco: ATIVADO' : 'Banco: DESATIVADO';
            btn.title = ativo ? 'Clique para fazer as abas principais carregarem primeiro pelo site.' : 'Clique para fazer as abas principais usarem IndexedDB primeiro.';
        }
        if(chip){
            chip.textContent = ativo ? 'IndexedDB primeiro' : 'Site primeiro';
            chip.classList.toggle('desativado', !ativo);
        }
        if(desc){
            desc.textContent = ativo
                ? 'Ativado: Home, Filmes, Séries e Episódios consultam o IndexedDB antes do site. Se faltar dado, o site completa.'
                : 'Desativado: Home, Filmes, Séries e Episódios carregam direto do site. Ano, Lançamentos, Favoritos, Histórico e posters manuais continuam usando o banco quando necessário.';
        }
    }

    function garantirPainelBancoV27(){
        const tela = document.getElementById('telaConfiguracoes');
        if(!tela || document.getElementById('cronosBancoPanelV27')) {
            atualizarPainelBancoV27();
            return;
        }

        const painel = document.createElement('div');
        painel.id = 'cronosBancoPanelV27';
        painel.className = 'cronos-banco-panel-v27';
        painel.innerHTML = `
            <h2 class="sessao-titulo cronos-banco-titulo-v27">Banco Local / IndexedDB</h2>
            <div class="cronos-banco-card-v27">
                <div class="cronos-banco-top-v27">
                    <div>
                        <div class="cronos-banco-label-v27">Prioridade do catálogo</div>
                        <div id="descBancoPrioridadeV27" class="cronos-banco-desc-v27"></div>
                    </div>
                    <span id="chipBancoPrioridadeV27" class="cronos-banco-chip-v27">IndexedDB primeiro</span>
                </div>
                <div class="cronos-banco-actions-v27">
                    <button id="btnBancoPrioridadeV27" type="button" class="sync-toggle-cronos cronos-banco-btn-v27 ativo" onclick="cronosToggleBancoPrioridade()">Banco: ATIVADO</button>
                    <button type="button" class="btn-sync-cronos cronos-banco-btn-v27" onclick="cronosExportarBancoIndexedDB()">Exportar Banco</button>
                    <button type="button" class="btn-sync-cronos cronos-banco-btn-v27" onclick="cronosSelecionarImportarBancoIndexedDB()">Importar Banco</button>
                    <input id="${IMPORT_INPUT_ID}" type="file" accept="application/json,.json" style="display:none">
                </div>
                <div id="cronosBancoStatusV27" class="sync-status-cronos cronos-banco-status-v27">Pronto para usar. Exportar/Importar transfere o IndexedDB entre PC e celular.</div>
            </div>
        `;

        const syncTitulo = Array.from(tela.querySelectorAll('.sessao-titulo')).find(h => /sincroniza/i.test(h.textContent || ''));
        if(syncTitulo) tela.insertBefore(painel, syncTitulo);
        else {
            const atalhos = tela.querySelector('.categoria-atalhos');
            if(atalhos && atalhos.nextSibling) tela.insertBefore(painel, atalhos.nextSibling);
            else tela.insertBefore(painel, tela.firstChild);
        }
        const input = painel.querySelector('#' + IMPORT_INPUT_ID);
        if(input){
            input.addEventListener('change', e => {
                const file = e.target.files && e.target.files[0];
                if(file) cronosImportarBancoIndexedDB(file).finally(() => { input.value = ''; });
            });
        }
        atualizarPainelBancoV27();
    }

    window.cronosSelecionarImportarBancoIndexedDB = function(){
        garantirPainelBancoV27();
        const input = document.getElementById(IMPORT_INPUT_ID);
        if(input) input.click();
    };

    async function getStoresBackupV27(){
        const stores = (typeof CRONOS_STORES !== 'undefined' && Array.isArray(CRONOS_STORES))
            ? CRONOS_STORES.slice()
            : ['configuracoes','favoritos','historico','obras','episodios','temporadas','generos','anos','syncLogs'];
        return stores;
    }

    window.cronosExportarBancoIndexedDB = async function(){
        const status = document.getElementById('cronosBancoStatusV27');
        try{
            if(status) status.textContent = 'Exportando banco IndexedDB...';
            if(typeof migrarLocalStorageParaIndexedDB === 'function') await migrarLocalStorageParaIndexedDB();
            const stores = await getStoresBackupV27();
            const data = {};
            for(const store of stores){
                try { data[store] = await dbGetAll(store); }
                catch(e){ data[store] = []; }
            }
            const payload = {
                app: 'Cronos',
                providerKey: (typeof CRONOS_PROVIDER_KEY !== 'undefined' ? CRONOS_PROVIDER_KEY : 'B01'),
                dbName: (typeof CRONOS_DB_NAME !== 'undefined' ? CRONOS_DB_NAME : 'CronosDB_BoraFlix'),
                dbVersion: (typeof CRONOS_DB_VERSION !== 'undefined' ? CRONOS_DB_VERSION : 1),
                exportedAt: new Date().toISOString(),
                stores,
                data,
                localSettings: {
                    prioridadeBancoAtiva: bancoPrimeiroAtivo(),
                    lancamentosCache: localStorage.getItem(typeof CRONOS_LANCAMENTOS_CACHE_KEY !== 'undefined' ? CRONOS_LANCAMENTOS_CACHE_KEY : 'cronos_lancamentos_episodios_obras_unicas_v4') || ''
                }
            };
            const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
            const a = document.createElement('a');
            const dataHoje = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
            a.href = URL.createObjectURL(blob);
            a.download = `Cronos_IndexedDB_Backup_${dataHoje}.json`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
            if(status) status.textContent = 'Banco exportado com sucesso.';
        }catch(e){
            console.error('Falha ao exportar banco:', e);
            if(status) status.textContent = 'Erro ao exportar banco. Veja o console.';
            alert('Erro ao exportar banco. Veja o console.');
        }
    };

    window.cronosImportarBancoIndexedDB = async function(file){
        const status = document.getElementById('cronosBancoStatusV27');
        try{
            if(!file) return;
            const texto = await file.text();
            const payload = JSON.parse(texto);
            if(!payload || !payload.data || typeof payload.data !== 'object') throw new Error('Arquivo inválido.');
            const stores = Array.isArray(payload.stores) ? payload.stores : Object.keys(payload.data);
            const totalItens = stores.reduce((s, st) => s + (Array.isArray(payload.data[st]) ? payload.data[st].length : 0), 0);
            const ok = confirm(`Importar banco do Cronos?\n\nItens no arquivo: ${totalItens}\n\nIsso vai substituir os dados atuais do IndexedDB deste Cronos.`);
            if(!ok) return;
            if(status) status.textContent = 'Importando banco IndexedDB...';
            if(typeof abrirCronosDB === 'function') await abrirCronosDB();
            for(const store of stores){
                if(!payload.data[store] || !Array.isArray(payload.data[store])) continue;
                try { await dbClear(store); } catch(e) { console.warn('Não limpou store', store, e); }
                for(const item of payload.data[store]){
                    if(!item || !item.id) continue;
                    try { await dbPut(store, item); } catch(e) { console.warn('Falha item importado', store, item, e); }
                }
            }
            if(payload.localSettings){
                if(Object.prototype.hasOwnProperty.call(payload.localSettings, 'prioridadeBancoAtiva')){
                    setBancoPrimeiroAtivo(!!payload.localSettings.prioridadeBancoAtiva);
                }
                if(payload.localSettings.lancamentosCache && typeof CRONOS_LANCAMENTOS_CACHE_KEY !== 'undefined'){
                    localStorage.setItem(CRONOS_LANCAMENTOS_CACHE_KEY, payload.localSettings.lancamentosCache);
                }
            }
            if(typeof atualizarResumoSincronizacaoCronos === 'function') await atualizarResumoSincronizacaoCronos();
            if(typeof atualizarInfoProgressoSyncCronos === 'function') await atualizarInfoProgressoSyncCronos();
            if(status) status.textContent = 'Banco importado com sucesso. Reabra a aba desejada para recarregar os dados.';
            alert('Banco importado com sucesso.');
        }catch(e){
            console.error('Falha ao importar banco:', e);
            if(status) status.textContent = 'Erro ao importar banco. Verifique se o arquivo é um backup válido.';
            alert('Erro ao importar banco. Verifique se o arquivo é um backup válido.');
        }
    };

    function gridUsaSitePrimeiroV27(gridId){
        if(bancoPrimeiroAtivo()) return false;
        return ['gridInicioFilmes','gridInicioSeries','gridInicioEpisodios','gridFilmes','gridSeries','gridEpisodios'].includes(gridId);
    }

    // Site primeiro: não consulta dbGet antes de montar o card. Ainda salva no banco depois, se conseguir enriquecer.
    const prepararDBFirstOriginalV27 = window.prepararCardObraDBFirst;
    window.prepararCardObraDBFirst = async function(li, dadosBasicos, itemOriginal, gridId){
        if(!gridUsaSitePrimeiroV27(gridId)){
            return prepararDBFirstOriginalV27.apply(this, arguments);
        }
        try{
            colocarSkeletonCard(li);
            const base = dadosBasicosParaObra(dadosBasicos);
            const imgListagem = normalizarImagemCard(dadosBasicos.img || dadosBasicos.poster || '');
            const podeUsarListagem = itemOriginal && itemJaTemPosterBom(itemOriginal) && posterBomCronos(imgListagem);
            if(podeUsarListagem){
                const dados = { ...base, poster: imgListagem, img: imgListagem };
                preencherCardObraCronos(li, dados, gridId);
                salvarObraCronos(dados).catch(()=>{});
                return;
            }
            // Não achou poster bom na listagem: consulta a ficha do site, não o banco.
            const detalhes = await extrairDetalhesDestaquePremium(dadosBasicos.url).catch(() => ({})) || {};
            const posterDetalhe = escolherPosterSeguroCronos(detalhes.poster, detalhes.img, dadosBasicos.poster, dadosBasicos.img);
            const dados = {
                ...base,
                ...detalhes,
                url: base.url || detalhes.url || dadosBasicos.url || '',
                titulo: limparTextoCard(detalhes.titulo || '') || limparTextoCard(base.titulo || '') || 'Sem título',
                ano: extrairAnoCard(detalhes.ano || '') || extrairAnoCard(base.ano || '') || '',
                tipo: base.tipo || detalhes.tipo || (base.isMovie ? 'Filme' : 'Série'),
                isMovie: !!(base.isMovie || detalhes.isMovie),
                isSerie: !(base.isMovie || detalhes.isMovie),
                poster: posterDetalhe || placeholderCronosPoster(),
                img: posterDetalhe || placeholderCronosPoster()
            };
            preencherCardObraCronos(li, dados, gridId);
            salvarObraCronos(dados).catch(()=>{});
        }catch(e){
            console.warn('Falha no modo site primeiro:', e);
            try { preencherCardObraCronos(li, { ...dadosBasicosParaObra(dadosBasicos), poster: placeholderCronosPoster(), img: placeholderCronosPoster() }, gridId); } catch(_) {}
        }
    };

    // Categoria/Ano: sempre consulta somente o IndexedDB. Não faz fallback para o site.
    const abrirFiltroCategoriaOriginalV27 = window.abrirFiltroCategoria;
    window.abrirFiltroCategoria = async function(tipo, titulo, urlBase){
        return abrirFiltroCategoriaOriginalV27.apply(this, arguments);
    };

    // Garante que o painel apareça sempre dentro de Configurações, mesmo depois de remonte.
    const montarCategoriasOriginalV27 = window.montarCategorias;
    if(typeof montarCategoriasOriginalV27 === 'function'){
        window.montarCategorias = async function(){
            const r = await montarCategoriasOriginalV27.apply(this, arguments);
            garantirPainelBancoV27();
            return r;
        };
    }
    const carregarConfiguracoesOriginalV27 = window.carregarConfiguracoes;
    if(typeof carregarConfiguracoesOriginalV27 === 'function'){
        window.carregarConfiguracoes = function(){
            const r = carregarConfiguracoesOriginalV27.apply(this, arguments);
            setTimeout(garantirPainelBancoV27, 0);
            setTimeout(garantirPainelBancoV27, 200);
            return r;
        };
    }

    const css = document.createElement('style');
    css.textContent = `
        .cronos-banco-panel-v27{margin:14px 0 22px;}
        .cronos-banco-titulo-v27{margin-top:12px!important;}
        .cronos-banco-card-v27{background:#090909;border:1px solid #232323;border-radius:12px;padding:14px;box-shadow:inset 0 0 0 1px rgba(0,255,255,.04);}
        .cronos-banco-top-v27{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px;}
        .cronos-banco-label-v27{color:#ffcc00;font-weight:bold;text-transform:uppercase;font-size:13px;margin-bottom:5px;}
        .cronos-banco-desc-v27{color:#ccc;font-size:13px;line-height:1.4;}
        .cronos-banco-chip-v27{white-space:nowrap;color:#000;background:#00ffff;border:1px solid #00ffff;border-radius:999px;padding:6px 10px;font-weight:bold;font-size:12px;}
        .cronos-banco-chip-v27.desativado{background:#ffcc00;border-color:#ffcc00;color:#000;}
        .cronos-banco-actions-v27{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:10px 0;}
        .cronos-banco-btn-v27{min-height:36px;}
        .cronos-banco-status-v27{margin-top:10px;}
        @media(max-width:700px){.cronos-banco-top-v27{flex-direction:column}.cronos-banco-actions-v27 button{flex:1 1 100%;}.cronos-banco-chip-v27{align-self:flex-start;}}
    `;
    document.head.appendChild(css);

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', garantirPainelBancoV27);
    else setTimeout(garantirPainelBancoV27, 0);
})();
