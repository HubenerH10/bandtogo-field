// BandToGo Field — Patches v2.1
// Carregar após index.html via <script src="patches.js"></script>
// Correções: visitados hoje/mês, PV 1201324, missões como arrays

(function () {
  'use strict';

  /* ── Utilitários de data ─────────────────────────────────────────────── */
  function hojeStr() { return new Date().toISOString().slice(0, 10); }
  function mesStr()  { return new Date().toISOString().slice(0, 7); }

  function contarHoje(vis) {
    var h = hojeStr();
    return Object.values(vis).filter(function (v) { return v.ts && v.ts.slice(0, 10) === h; }).length;
  }

  function contarMes(vis) {
    var m = mesStr();
    return Object.values(vis).filter(function (v) { return v.ts && v.ts.slice(0, 7) === m; }).length;
  }

  /* ── 1. Patch loadData: corrigir PV 1201324 ─────────────────────────── */
  var _origLoadData = null;
  function patchLoadData() {
    if (typeof window.loadData !== 'function') return;
    _origLoadData = window.loadData;
    window.loadData = async function () {
      await _origLoadData();
      var idx = CLIENTES.findIndex(function (c) { return c.id === '1201324'; });
      if (idx >= 0) {
        CLIENTES[idx].nome = 'Empório Máximos';
        console.log('[patch] PV 1201324 → Empório Máximos');
      }
    };
  }

  /* ── 2. Patch showStep: tela de sucesso com 4 cards ─────────────────── */
  function patchShowStep() {
    if (typeof window.showStep !== 'function') return;
    var _orig = window.showStep;
    window.showStep = function (id) {
      _orig(id);
      if (id !== 'step3') return;
      setTimeout(function () {
        var minhaBase = CLIENTES.filter(function (c) { return c.rota === rotaSelecionada; });
        var baseAtiva = minhaBase.filter(function (c) { return c.base_foco; });
        var hoje     = contarHoje(visitados);
        var mes      = contarMes(visitados);
        var pendente = baseAtiva.filter(function (c) { return !visitados[c.id]; }).length;
        var pctMes   = baseAtiva.length ? Math.round((mes / baseAtiva.length) * 100) : 0;

        var statsEl = document.querySelector('.success-stats');
        if (!statsEl) return;
        statsEl.style.gridTemplateColumns = '1fr 1fr';
        statsEl.innerHTML =
          '<div class="stat-card">' +
            '<div class="stat-num" id="statVisit">' + hoje + '</div>' +
            '<div class="stat-lbl">Visitados hoje</div>' +
          '</div>' +
          '<div class="stat-card">' +
            '<div class="stat-num" id="statPend" style="color:var(--text2)">' + pendente + '</div>' +
            '<div class="stat-lbl">Pendentes</div>' +
          '</div>' +
          '<div class="stat-card">' +
            '<div class="stat-num" style="color:var(--blue)">' + mes + '</div>' +
            '<div class="stat-lbl">Visitados no mês</div>' +
          '</div>' +
          '<div class="stat-card">' +
            '<div class="stat-num" style="color:var(--green)">' + pctMes + '%</div>' +
            '<div class="stat-lbl">Cobertura mês</div>' +
          '</div>';
      }, 60);
    };
  }

  /* ── 3. Patch renderParciais: adicionar bloco hoje/mês ──────────────── */
  function patchRenderParciais() {
    if (typeof window.renderParciais !== 'function') return;
    var _orig = window.renderParciais;
    window.renderParciais = function () {
      _orig();
      var el = document.getElementById('parciaisContent');
      if (!el) return;
      var baseAtiva = CLIENTES.filter(function (c) {
        return c.rota === rotaSelecionada && c.base_foco;
      });
      var hoje   = contarHoje(visitados);
      var mes    = contarMes(visitados);
      var pctH   = baseAtiva.length ? Math.round((hoje / baseAtiva.length) * 100) : 0;
      var pctM   = baseAtiva.length ? Math.round((mes  / baseAtiva.length) * 100) : 0;

      var extra =
        '<div class="parc-card" style="background:linear-gradient(135deg,#fff0f4,#fff);border-color:#f5c0ce">' +
          '<div class="parc-card-title">📅 Acompanhamento de Cobertura</div>' +
          '<div class="parc-grid">' +
            '<div class="parc-stat"><div class="parc-num">' + hoje + '</div><div class="parc-lbl">Visitados hoje</div></div>' +
            '<div class="parc-stat"><div class="parc-num" style="color:var(--blue)">' + mes + '</div><div class="parc-lbl">Visitados no mês</div></div>' +
            '<div class="parc-stat"><div class="parc-num" style="color:var(--text2)">' + pctH + '%</div><div class="parc-lbl">% cobertura hoje</div></div>' +
            '<div class="parc-stat"><div class="parc-num" style="color:var(--green)">' + pctM + '%</div><div class="parc-lbl">% cobertura mês</div></div>' +
          '</div>' +
        '</div>';
      el.innerHTML = extra + el.innerHTML;
    };
  }

  /* ── 4. Patch _doSubmit: missões como arrays ─────────────────────────── */
  function patchDoSubmit() {
    if (typeof window._doSubmit !== 'function') return;
    var _orig = window._doSubmit;
    window._doSubmit = function () {
      // Coletar missões como arrays (compatível com novo Código.gs)
      var apEls  = document.querySelectorAll('#cond_missao .cond-mini-opts .cond-mini-opt.sel');
      var negEls;
      var allOpts = document.querySelectorAll('#cond_missao .cond-mini-opts');
      if (allOpts.length >= 2) {
        negEls = allOpts[1].querySelectorAll('.cond-mini-opt.sel');
      } else {
        negEls = [];
      }
      respostas.missao_apresentada = Array.from(apEls).map(function (e) { return e.textContent.trim(); });
      respostas.missao_negociada   = Array.from(negEls).map(function (e) { return e.textContent.trim(); });
      _orig();
    };
  }

  /* ── Aplicar todos os patches quando DOM estiver pronto ─────────────── */
  function applyAll() {
    patchLoadData();
    patchShowStep();
    patchRenderParciais();
    patchDoSubmit();
    console.log('[BandToGo Field] Patches v2.1 OK');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAll);
  } else {
    // DOM já carregado — aguardar funções do index.html estarem disponíveis
    setTimeout(applyAll, 100);
  }
})();
