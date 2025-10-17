/* ============================================
    NEXT Sports BR - Turbo | script.js (Completo)
    – Refatorado para incorporar todas as funcionalidades
    – Filtros, KPIs, Kanban, Tabelas, Scanner, Modais
    – Chart.js, CSV, Controle de Acesso Simulado
    ============================================ */

// ---------- CONFIGURAÇÃO INICIAL ----------
const IS_ADMIN = true; // Simula um usuário admin. Mude para 'false' para testar a visão de não-admin.


// ---------- UTILS GLOBAIS ----------
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const $ = (sel, root = document) => root.querySelector(sel);

const fmtBRL = (v) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtPct = (v) => `${(v * 100).toFixed(1)}%`.replace('.',',');

const toISODate = (d) => {
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset()); // Ajusta para o fuso horário local
  return dt.toISOString().slice(0, 10);
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

const inRange = (dateStr, start, end) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return (!start || d >= start) && (!end || d <= end);
};

const uid = () => Math.random().toString(36).slice(2, 10);

// ---------- MODAL GLOBAL ----------
const Modal = (() => {
  const overlay = $("#modal-overlay");
  const title = $("#modal-title");
  const content = $("#modal-content");
  const footer = $("#modal-footer");
  const closeBtn = $("#modal-close");

  const open = ({ title: t = "Detalhes", html = "", footerHtml = "" } = {}) => {
    title.textContent = t;
    content.innerHTML = html;
    footer.innerHTML = footerHtml;
    overlay.setAttribute("aria-hidden", "false");
    overlay.style.display = "grid";
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.display = "none";
    content.innerHTML = "";
    footer.innerHTML = "";
    document.body.style.overflow = '';
  };

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  closeBtn.addEventListener("click", close);

  return { open, close };
})();

// ---------- DATASTORE (Mock de Dados) ----------
const DataStore = (() => {
  const rndDateWithin = (days = 120) => {
    const d = new Date();
    const delta = Math.floor(Math.random() * days);
    d.setDate(d.getDate() - delta);
    return toISODate(d);
  };
  
  const clientes = [
      { nome: "Ana Silva", cpf: "111.222.333-44" },
      { nome: "Bruno Costa", cpf: "222.333.444-55" },
      { nome: "Carla Dias", cpf: "333.444.555-66" },
      { nome: "Diego Souza", cpf: "444.555.666-77" },
      { nome: "Eva Lima", cpf: "555.666.777-88" },
      { nome: "Felipe Melo", cpf: "666.777.888-99" },
      { nome: "Gabi Alves", cpf: "777.888.999-00" },
  ];

  const STATUS_PEDIDO = ["Novo", "Pago", "Separando", "Enviado", "Entregue"];
  const produtosBase = Array.from({ length: 26 }).map((_, i) => ({
      sku: "SKU-" + (1000 + i),
      nome: "Produto " + (i + 1),
      categoria: ["Masculino", "Feminino", "Infantil", "Acessórios"][i % 4],
      custo: +(29.9 + Math.random() * 50).toFixed(2),
      preco: +(79.9 + Math.random() * 120).toFixed(2),
      status: ["Ativo", "Inativo"][i % 2],
  }));
  
  const pedidos = Array.from({ length: 42 }).map((_, i) => {
      const cliente = clientes[i % clientes.length];
      const produto = produtosBase[i % produtosBase.length];
      return {
          id: 1000 + i,
          cliente: cliente.nome,
          cpf: cliente.cpf,
          total: +(60 + Math.random() * 640).toFixed(2),
          created_at: rndDateWithin(120),
          status: STATUS_PEDIDO[Math.floor(Math.random() * STATUS_PEDIDO.length)],
          items: [{ sku: produto.sku, nome: produto.nome, qtd: 1, preco: produto.preco }],
      };
  });

  const categoriasCusto = ["MKT", "Logística", "Operacional", "Taxas", "Outros"];
  const custos = Array.from({ length: 28 }).map((_, i) => ({
    id: uid(),
    nome: ["Meta Ads", "Correios", "Embalagens", "Taxa Gateway", "Serviços"][i % 5],
    categoria: "Operacional",
    data: rndDateWithin(120),
    valor: +(50 + Math.random() * 1500).toFixed(2),
    status: ["Pago", "Pendente"][i % 2],
  }));

  const adsDaily = Array.from({ length: 120 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return {
      data: toISODate(d),
      meta: +(20 + Math.random() * 180).toFixed(2),
      google: +(10 + Math.random() * 90).toFixed(2),
    };
  });

  const influencers = Array.from({ length: 14 }).map((_, i) => ({
    id: uid(),
    nome: ["Lia Fit", "João Runner", "Cris Move", "Vivi Health", "Gui Pro"][i % 5] + " #" + (i + 1),
    tel: "55 32 9" + Math.floor(80000000 + Math.random() * 9999999),
    cupom: ["LIA10", "JOAO5", "CRIS7", "VIVI8", "GUI12"][i % 5],
    vendas: Math.floor(Math.random() * 90),
    vendas_pagas: Math.floor(Math.random() * 70),
    comissao_pct: 10 + i, // 10%, 11%, ...
    data: rndDateWithin(120),
  }));

  const emails = Array.from({ length: 24 }).map((_, i) => ({
    id: uid(),
    para: `cliente${i}@mail.com`,
    assunto: ["Lançamento Manto", "Cupom VIP", "Rastreio Atualizado"][i % 3],
    status: ["Enviado", "Agendado", "Erro"][i % 3],
    data: rndDateWithin(60),
  }));

  const locais = ["CD-Matriz", "Loja-Estádio", "CD-2", "Quiosque-Centro"];
  const estoque = produtosBase.map((p, i) => ({
    ...p,
    local: locais[i % locais.length],
    estoque: Math.floor(Math.random() * 120),
    minimo: 10 + Math.floor(Math.random() * 10),
    data_mod: rndDateWithin(120),
  }));

  const rastreio = pedidos.filter(p => p.status === 'Enviado' || p.status === 'Entregue').map((p, i) => ({
      id_pedido: p.id,
      nome: p.cliente,
      cpf: p.cpf,
      rastreio: "NSX" + Math.floor(100000 + Math.random() * 899999),
      transportadora: ["Correios", "Jadlog", "Sequoia"][i % 3],
      data_pedido: p.created_at,
      status: p.status === 'Enviado' ? 'Em Trânsito' : 'Entregue',
      custo_etiqueta: +(15 + Math.random() * 20).toFixed(2)
  }));
  
  const trocas = Array.from({ length: 15 }).map((_, i) => ({
      id: uid(),
      id_pedido: 1000 + i,
      cliente: clientes[i % clientes.length].nome,
      valor_compra: +(100 + Math.random() * 300).toFixed(2),
      custo_pac_reverso: +(12 + Math.random() * 15).toFixed(2),
      tipo: ["Troca", "Devolução"][i % 2],
      motivo: ["Tamanho errado", "Defeito", "Arrependimento"][i % 3],
      status: ["Solicitado", "Em análise", "Concluído"][i % 3],
      data: rndDateWithin(90),
  }));

  const contatos = Array.from({ length: 50 }).map((_, i) => ({
      id: uid(),
      nome: `Contato ${i+1}`,
      email: `contato${i+1}@example.com`,
      telefone: "55 32 9" + Math.floor(81000000 + Math.random() * 9999999),
      status: ['Ativo', 'Inativo'][i % 2]
  }));

  const filterByRange = (arr, getDate, start, end) =>
    arr.filter((r) => inRange(getDate(r), start, end));

  return {
    getPedidos: (s, e) => filterByRange(pedidos, (r) => r.created_at, s, e),
    getPedidoById: (id) => pedidos.find(p => p.id === id),
    upPedidoStatus: (id, st) => { const p=pedidos.find(x=>x.id===id); if (p) p.status=st; },

    getCustos: (s, e) => filterByRange(custos, (r) => r.data, s, e),
    addCusto: (c) => custos.unshift({ id: uid(), ...c }),

    getAdsDaily: (s, e) => filterByRange(adsDaily, (r) => r.data, s, e),

    getInfluencers: (s, e) => filterByRange(influencers, (r) => r.data, s, e),
    addInflu: (it) => influencers.unshift({ id: uid(), ...it }),

    getEmails: (s, e) => filterByRange(emails, (r) => r.data, s, e),
    addEmail: (em) => emails.unshift({ id: uid(), ...em }),
    
    getEstoque: (s, e) => estoque, // Estoque não filtra por data de modificação por simplicidade
    updateEstoque: (sku, delta) => {
        const item = estoque.find(i => i.sku === sku);
        if (item) {
            item.estoque += delta;
            if(item.estoque < 0) item.estoque = 0;
            return true;
        }
        return false;
    },

    getRastreio: (s, e) => filterByRange(rastreio, (r) => r.data_pedido, s, e),
    
    getTrocas: (s, e) => filterByRange(trocas, (r) => r.data, s, e),
    addTroca: (t) => trocas.unshift({id: uid(), ...t}),

    getContatos: () => contatos,
    addContato: (c) => contatos.unshift({id: uid(), ...c}),

    STATUS_PEDIDO,
  };
})();

// ---------- NAVEGAÇÃO E CONTROLE DE ACESSO ----------
const Nav = (() => {
  const items = $$(".menu-item");
  const sections = $$(".section-container");
  const title = $("#page-title");

  const checkPermissions = () => {
    items.forEach(item => {
        if(item.dataset.adminOnly === 'true' && !IS_ADMIN) {
            item.style.display = 'none';
        }
    });
  };

  const activate = (key) => {
    const targetItem = items.find(i => i.dataset.target === key);
    if (targetItem.dataset.adminOnly === 'true' && !IS_ADMIN) {
        console.warn("Acesso negado.");
        return;
    }

    items.forEach((i) => i.classList.toggle("active", i.dataset.target === key));
    sections.forEach((s) =>
      s.classList.toggle("active", s.id === `${key}-section`)
    );
    title.textContent = targetItem.textContent.trim();
  };

  items.forEach((i) =>
    i.addEventListener("click", () => {
        activate(i.dataset.target);
        $("#sidebar").classList.remove("open");
    })
  );

  $("#burger").addEventListener("click", () => {
    $("#sidebar").classList.toggle("open");
  });
  
  checkPermissions();
  return { activate };
})();

// ---------- COMPONENTE FILTRO DE DATA ----------
class DateFilter {
  constructor(rootEl, { startInput, endInput }) {
    this.root = rootEl;
    this.startEl = $(startInput, rootEl);
    this.endEl = $(endInput, rootEl);
    this.quickButtons = $$(".quick-range .action-button", rootEl);
    
    const end = new Date();
    const start = daysAgo(30);
    this.setRange(start, end);

    this.quickButtons.forEach((btn) =>
      btn.addEventListener("click", () => {
        const n = parseInt(btn.dataset.range, 10) || 30;
        this.setRange(daysAgo(n), new Date());
        this._emit();
      })
    );
    [this.startEl, this.endEl].forEach((el) =>
      el.addEventListener("change", () => this._emit())
    );
  }
  getRange() {
    const s = this.startEl.value ? new Date(this.startEl.value + "T00:00:00") : null;
    const e = this.endEl.value ? new Date(this.endEl.value + "T23:59:59") : null;
    return { start: s, end: e };
  }
  setRange(start, end) {
    this.startEl.value = toISODate(start);
    this.endEl.value = toISODate(end);
  }
  onChange(handler) { this._handler = handler; }
  _emit() { if (this._handler) this._handler(this.getRange()); }
}

// ---------- SEÇÃO: DASHBOARD ----------
const Dash = (() => {
  let chart;
  const grid = $("#kpi-grid");

  const calcKPIs = (start, end) => {
    const pedidos = DataStore.getPedidos(start, end);
    const faturamento = pedidos.reduce((s, p) => s + p.total, 0);
    const marketing = DataStore.getAdsDaily(start, end).reduce((s, d) => s + d.meta + d.google, 0);
    const lucroLiquido = faturamento - marketing;
    const margem = faturamento > 0 ? lucroLiquido / faturamento : 0;
    const cpa = pedidos.length > 0 ? marketing / pedidos.length : 0;
    const roi = marketing > 0 ? lucroLiquido / marketing : 0;
    return { faturamento, marketing, lucroLiquido, margem, cpa, roi, pedidosCount: pedidos.length };
  };

  const renderKPIs = (k) => {
    const lucroClass = k.lucroLiquido < 0 ? 'err-text' : 'ok-text';
    grid.innerHTML = `
      <div class="metric-card"><div class="label">Faturamento</div><div class="value">${fmtBRL(k.faturamento)}</div></div>
      <div class="metric-card"><div class="label">Marketing (Meta+Google)</div><div class="value">${fmtBRL(k.marketing)}</div></div>
      <div class="metric-card"><div class="label">Lucro Líquido</div><div class="value ${lucroClass}">${fmtBRL(k.lucroLiquido)}</div></div>
      <div class="metric-card"><div class="label">Margem</div><div class="value">${fmtPct(k.margem)}</div></div>
      <div class="metric-card"><div class="label">CPA</div><div class="value">${fmtBRL(k.cpa)}</div></div>
      <div class="metric-card"><div class="label">ROI</div><div class="value">${fmtPct(k.roi)}</div></div>
      <div class="metric-card"><div class="label"># Pedidos</div><div class="value">${k.pedidosCount}</div></div>
    `;
  };

  const renderChart = (start, end) => {
    const ctx = $("#chartFatAds").getContext("2d");
    const daily = DataStore.getAdsDaily(start, end).sort((a,b) => a.data.localeCompare(b.data));
    const labels = daily.map((d) => d.data);
    const pedidos = DataStore.getPedidos(start, end);
    const receitaByDate = {};
    pedidos.forEach(p => {
      receitaByDate[p.created_at] = (receitaByDate[p.created_at] || 0) + p.total;
    });
    const receitaArr = labels.map(d => +(receitaByDate[d] || 0).toFixed(2));
    const adsArr = labels.map(d => +(daily.find(x => x.data === d).meta + daily.find(x => x.data === d).google).toFixed(2));

    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Faturamento (R$)", data: receitaArr, borderColor: 'rgba(34, 197, 94, 1)', tension: 0.1 },
          { label: "Marketing (R$)", data: adsArr, borderColor: 'rgba(239, 68, 68, 1)', tension: 0.1 },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false } },
    });
  };

  const init = (range) => {
    const k = calcKPIs(range.start, range.end);
    renderKPIs(k);
    renderChart(range.start, range.end);
  };

  return { init };
})();

// ---------- SEÇÃO: PEDIDOS ----------
const Pedidos = (() => {
  const board = $("#kanban-board");
  const search = $("#search-pedidos");

  const openPedidoModal = (id) => {
      const pedido = DataStore.getPedidoById(id);
      if (!pedido) return;
      
      Modal.open({
          title: `Detalhes do Pedido #${pedido.id}`,
          html: `
              <div class="form-grid">
                  <div class="form-field"><strong>Cliente:</strong> ${pedido.cliente}</div>
                  <div class="form-field"><strong>CPF:</strong> ${pedido.cpf}</div>
                  <div class="form-field"><strong>Data:</strong> ${pedido.created_at}</div>
                  <div class="form-field"><strong>Total:</strong> ${fmtBRL(pedido.total)}</div>
              </div>
              <hr>
              <h4>Itens do Pedido</h4>
              <table style="margin-top: 10px;">
                <thead><tr><th>SKU</th><th>Produto</th><th>Qtd.</th><th>Preço</th></tr></thead>
                <tbody>
                ${pedido.items.map(item => `
                    <tr>
                        <td>${item.sku}</td>
                        <td>${item.nome}</td>
                        <td>${item.qtd}</td>
                        <td>${fmtBRL(item.preco)}</td>
                    </tr>
                `).join('')}
                </tbody>
              </table>
          `,
          footerHtml: `<button class="action-button btn-ghost" id="close-modal-ped">Fechar</button>`
      });
      $("#close-modal-ped").onclick = Modal.close;
  };

  const render = (start, end, term = "") => {
    const pedidos = DataStore.getPedidos(start, end).filter(p => {
      const t = term.trim().toLowerCase();
      if (!t) return true;
      return p.id.toString().includes(t) || p.cliente.toLowerCase().includes(t) || p.items.some(it => it.sku.toLowerCase().includes(t));
    });

    const groups = {};
    DataStore.STATUS_PEDIDO.forEach(s => (groups[s] = []));
    pedidos.forEach(p => groups[p.status]?.push(p));

    board.innerHTML = DataStore.STATUS_PEDIDO.map(st => `
      <div class="kanban-col" data-status="${st}">
        <div class="kanban-col-header"><span>${st}</span><span class="count">${groups[st].length}</span></div>
        <div class="kanban-col-body" data-dropzone="true">
          ${groups[st].map(p => `
            <div class="kanban-card" draggable="true" data-id="${p.id}">
              <div class="line"><strong>#${p.id}</strong> — ${p.cliente}</div>
              <div class="line">${fmtBRL(p.total)} • ${p.created_at}</div>
              <div class="line small">${p.items[0].sku} × ${p.items[0].qtd}</div>
            </div>`).join("")}
        </div>
      </div>`).join("");

    $$(".kanban-card", board).forEach(card => {
        card.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", card.dataset.id));
        card.addEventListener("click", () => openPedidoModal(parseInt(card.dataset.id, 10)));
    });
    $$("[data-dropzone]", board).forEach(zone => {
      zone.addEventListener("dragover", e => e.preventDefault());
      zone.addEventListener("drop", e => {
        e.preventDefault();
        const id = parseInt(e.dataTransfer.getData("text/plain"), 10);
        const newStatus = zone.closest(".kanban-col").dataset.status;
        DataStore.upPedidoStatus(id, newStatus);
        render(start, end, search.value);
      });
    });
  };
  const init = (range) => {
    render(range.start, range.end);
    search.addEventListener("input", () => render(range.start, range.end, search.value));
  };
  return { init };
})();

// ---------- SEÇÃO: FINANÇAS ----------
const Financas = (() => {
  const kpisWrap = $("#financas-kpis");
  const tbody = $("#tbody-custos");
  const btnAdd = $("#btnAdicionarCusto");

  const calc = (start, end) => {
    const custos = DataStore.getCustos(start, end);
    const total = custos.reduce((s, c) => s + c.valor, 0);
    const pago = custos.filter(c => c.status === 'Pago').reduce((s, c) => s + c.valor, 0);
    const pendente = total - pago;
    return { custos, total, pago, pendente };
  };

  const renderKPIs = k => {
    kpisWrap.innerHTML = `
      <div class="metric-card"><div class="label">Custo Operacional Total</div><div class="value">${fmtBRL(k.total)}</div></div>
      <div class="metric-card"><div class="label">Total Pago</div><div class="value ok-text">${fmtBRL(k.pago)}</div></div>
      <div class="metric-card"><div class="label">Total Pendente</div><div class="value warn-text">${fmtBRL(k.pendente)}</div></div>
    `;
  };

  const renderTable = custos => {
    tbody.innerHTML = custos
      .sort((a, b) => b.data.localeCompare(a.data))
      .map(c => `
      <tr>
        <td>${c.nome}</td><td>${c.categoria}</td><td>${c.data}</td><td>${fmtBRL(c.valor)}</td>
        <td><span class="${c.status === 'Pago' ? 'ok-text' : 'warn-text'}">${c.status}</span></td>
        <td><button class="link danger" data-del="${c.id}">Excluir</button></td>
      </tr>`).join("");
  };

  const openModalNovo = (range) => {
    Modal.open({
      title: "Adicionar Custo Operacional",
      html: `
        <div class="form-grid">
          <label>Nome<input id="custo-nome"/></label>
          <label>Categoria<select id="custo-cat"><option>Logística</option><option>Operacional</option><option>Taxas</option><option>Outros</option></select></label>
          <label>Data<input type="date" id="custo-data" value="${toISODate(new Date())}"/></label>
          <label>Valor (R$)<input id="custo-valor" type="number" min="0" step="0.01"/></label>
          <label>Status<select id="custo-status"><option>Pago</option><option>Pendente</option></select></label>
        </div>`,
      footerHtml: `<button class="action-button" id="save-custo">Salvar</button><button class="action-button btn-ghost" id="cancel-custo">Cancelar</button>`,
    });
    $("#cancel-custo").onclick = Modal.close;
    $("#save-custo").onclick = () => {
      DataStore.addCusto({
        nome: $("#custo-nome").value.trim() || "Custo",
        categoria: $("#custo-cat").value, data: $("#custo-data").value,
        valor: parseFloat($("#custo-valor").value || "0"),
        status: $("#custo-status").value,
      });
      Modal.close();
      const k = calc(range.start, range.end);
      renderKPIs(k);
      renderTable(k.custos);
    };
  };

  const init = (range) => {
    const k = calc(range.start, range.end);
    renderKPIs(k);
    renderTable(k.custos);
    btnAdd.onclick = () => openModalNovo(range);
  };

  return { init };
})();

// ---------- SEÇÃO: RASTREIO ----------
const Rastreio = (() => {
  const search = $("#search-rastreio");
  const tbody = $("#tabela-rastreio-interno tbody");
  const pag = $("#pag-rastreio");
  const kpisWrap = $("#rastreio-kpis");
  const PAGE_SIZE = 8;
  const state = { page: 1, total: 1, rows: [] };

  const renderKPIs = rows => {
      const total = rows.length;
      const emTransito = rows.filter(r => r.status === 'Em Trânsito').length;
      const entregue = rows.filter(r => r.status === 'Entregue').length;
      const custoTotal = rows.reduce((s, r) => s + r.custo_etiqueta, 0);
      kpisWrap.innerHTML = `
        <div class="metric-card"><div class="label">Pedidos Totais</div><div class="value">${total}</div></div>
        <div class="metric-card"><div class="label">Em Trânsito</div><div class="value">${emTransito}</div></div>
        <div class="metric-card"><div class="label">Entregues</div><div class="value">${entregue}</div></div>
        <div class="metric-card"><div class="label">Custo Total Etiquetas</div><div class="value">${fmtBRL(custoTotal)}</div></div>
      `;
  };

  const renderTable = (rows) => {
    const start = (state.page - 1) * PAGE_SIZE;
    const pageRows = rows.slice(start, start + PAGE_SIZE);
    tbody.innerHTML = pageRows.map(r => `
      <tr>
        <td>${r.data_pedido}</td><td>${r.nome}</td><td>${r.cpf}</td>
        <td>${r.rastreio}</td><td>${r.transportadora}</td>
        <td>${r.status}</td><td>${fmtBRL(r.custo_etiqueta)}</td>
      </tr>`).join("");
    state.total = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    pag.innerHTML = `<button class="action-button btn-ghost" ${state.page===1?"disabled":""} id="pg-prev">Anterior</button> <span class="muted">Página ${state.page} de ${state.total}</span> <button class="action-button btn-ghost" ${state.page===state.total?"disabled":""} id="pg-next">Próxima</button>`;
    $("#pg-prev")?.addEventListener("click", () => { state.page--; renderTable(state.rows); });
    $("#pg-next")?.addEventListener("click", () => { state.page++; renderTable(state.rows); });
  };

  const apply = (range) => {
    const all = DataStore.getRastreio(range.start, range.end);
    const term = search.value.trim().toLowerCase();
    state.rows = all.filter(r => !term || r.nome.toLowerCase().includes(term) || r.rastreio.toLowerCase().includes(term) || r.transportadora.toLowerCase().includes(term));
    state.page = 1;
    renderKPIs(state.rows);
    renderTable(state.rows);
  };

  const init = (range) => {
    apply(range);
    search.addEventListener("input", () => apply(range));
  };
  return { init };
})();

// ---------- SEÇÃO: INFLUENCERS ----------
const Influencers = (() => {
    const tbody = $("#tabela-influencers tbody");
    const pag = $("#pag-influencers");
    const search = $("#search-influ");
    const summary = $("#influencers-summary");
    const btnAdd = $("#btnAdicionarInfluencer");
    const PAGE_SIZE = 8;
    const state = { page: 1, rows: [] };

    const renderSummary = (rows) => {
        const vendas = rows.reduce((s, r) => s + r.vendas, 0);
        const comissaoTotal = rows.reduce((s, r) => {
            const comissaoValor = (r.vendas_pagas * 50) * (r.comissao_pct / 100); // Assumindo ticket médio de 50 para cálculo
            return s + comissaoValor;
        }, 0);
        summary.innerHTML = `
            <div class="metric-card"><div class="label">Vendas (somatório)</div><div class="value">${vendas}</div></div>
            <div class="metric-card"><div class="label">Comissão Total</div><div class="value">${fmtBRL(comissaoTotal)}</div></div>
            <div class="metric-card"><div class="label"># Influencers</div><div class="value">${rows.length}</div></div>
        `;
    };

    const renderTable = (rows) => {
        const start = (state.page - 1) * PAGE_SIZE;
        const pageRows = rows.slice(start, start + PAGE_SIZE);
        tbody.innerHTML = pageRows.map(r => {
            const comissaoValor = (r.vendas_pagas * 50) * (r.comissao_pct / 100);
            return `
            <tr class="clickable" data-id="${r.id}">
                <td>${r.nome}</td><td>${r.cupom}</td><td>${r.vendas}</td>
                <td>${r.vendas_pagas}</td><td>${r.comissao_pct}%</td><td>${fmtBRL(comissaoValor)}</td>
            </tr>`
        }).join("");
        
        $$('tr[data-id]', tbody).forEach(row => row.addEventListener('click', () => {
            const influ = DataStore.getInfluencers(null, null).find(inf => inf.id === row.dataset.id);
            Modal.open({
                title: `Detalhes de ${influ.nome}`,
                html: `<div class="form-grid">
                    <div class="form-field"><strong>Telefone:</strong> ${influ.tel}</div>
                    <div class="form-field"><strong>Cupom:</strong> ${influ.cupom}</div>
                    <div class="form-field"><strong>Data Cadastro:</strong> ${influ.data}</div>
                </div>`,
                footerHtml: `<button class="action-button btn-ghost" id="close-influ-modal">Fechar</button>`
            });
            $('#close-influ-modal').onclick = Modal.close;
        }));

        state.total = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
        pag.innerHTML = `<button class="action-button btn-ghost" ${state.page===1?"disabled":""} id="inf-prev">Anterior</button> <span class="muted">Página ${state.page} de ${state.total}</span> <button class="action-button btn-ghost" ${state.page===state.total?"disabled":""} id="inf-next">Próxima</button>`;
        $("#inf-prev")?.addEventListener("click", () => { state.page--; renderTable(state.rows); });
        $("#inf-next")?.addEventListener("click", () => { state.page++; renderTable(state.rows); });
    };

    const apply = (range) => {
        const all = DataStore.getInfluencers(range.start, range.end);
        const term = search.value.trim().toLowerCase();
        state.rows = all.filter(r => !term || r.nome.toLowerCase().includes(term) || r.cupom.toLowerCase().includes(term));
        state.page = 1;
        renderSummary(state.rows);
        renderTable(state.rows);
    };
    
    //... (Restante da lógica de influencers: openNovo, init)
     const openNovo = (range) => {
        Modal.open({
            title: "Lançar Influencer",
            html: `
            <div class="form-grid">
                <label>Nome<input id="inf-nome"/></label>
                <label>Telefone<input id="inf-tel"/></label>
                <label>Cupom<input id="inf-cupom"/></label>
                <label>Vendas<input id="inf-vendas" type="number" min="0" value="0"/></label>
                <label>Vendas Pagas<input id="inf-vendas-pagas" type="number" min="0" value="0"/></label>
                <label>Comissão (%)<input id="inf-comissao" type="number" min="0" step="0.1" value="10"/></label>
                <label>Data<input id="inf-data" type="date" value="${toISODate(new Date())}"/></label>
            </div>
            `,
            footerHtml: `<button class="action-button" id="inf-save">Salvar</button><button class="action-button btn-ghost" id="inf-cancel">Cancelar</button>`,
        });
        $("#inf-cancel").onclick = Modal.close;
        $("#inf-save").onclick = () => {
            DataStore.addInflu({
                nome: $("#inf-nome").value || "Influencer",
                tel: $("#inf-tel").value || "",
                cupom: $("#inf-cupom").value || "",
                vendas: parseInt($("#inf-vendas").value || "0", 10),
                vendas_pagas: parseInt($("#inf-vendas-pagas").value || "0", 10),
                comissao_pct: parseFloat($("#inf-comissao").value || "0"),
                data: $("#inf-data").value || toISODate(new Date()),
            });
            Modal.close();
            apply(range);
        };
    };

    const init = (range) => {
        apply(range);
        search.addEventListener("input", () => apply(range));
        btnAdd.onclick = () => openNovo(range);
    };

    return { init };
})();

// ---------- SEÇÃO: ESTOQUE ----------
const Estoque = (() => {
    const tbody = $("#tabela-estoque tbody");
    const pag = $("#pag-estoque");
    const search = $("#search-estoque");
    const btnIn = $("#btnEntradaEstoque");
    const btnOut = $("#btnSaidaEstoque");
    const btnAdj = $("#btnAjusteEstoque");
    const btnCSV = $("#btnBaixarCSV");
    const kpisWrap = $("#estoque-kpis");
    const scanner = $("#scanner-input");
    const scanResult = $("#scan-result");
    const PAGE_SIZE = 10;
    const state = { page: 1, rows: [] };

    const renderKPIs = (rows) => {
        const totalItens = rows.reduce((s, r) => s + r.estoque, 0);
        const custoTotal = rows.reduce((s, r) => s + (r.estoque * r.custo), 0);
        kpisWrap.innerHTML = `
            <div class="metric-card"><div class="label">Itens em Estoque</div><div class="value">${totalItens}</div></div>
            <div class="metric-card"><div class="label">Custo Total do Estoque</div><div class="value">${fmtBRL(custoTotal)}</div></div>
        `;
    };

    const renderTable = (rows) => {
        const start = (state.page - 1) * PAGE_SIZE;
        const pageRows = rows.slice(start, start + PAGE_SIZE);
        tbody.innerHTML = pageRows.map(r => `
            <tr class="${r.estoque < r.minimo ? 'warn-text' : ''}">
                <td>${r.sku}</td><td>${r.nome}</td><td>${r.categoria}</td>
                <td>${fmtBRL(r.custo)}</td><td>${fmtBRL(r.preco)}</td>
                <td>${r.estoque}</td><td>${r.minimo}</td>
                <td><span class="${r.status === 'Ativo' ? 'ok-text' : 'err-text'}">${r.status}</span></td>
            </tr>`
        ).join("");
        state.total = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
        pag.innerHTML = `<button class="action-button btn-ghost" ${state.page===1?"disabled":""} id="es-prev">Anterior</button> <span class="muted">Página ${state.page} de ${state.total}</span> <button class="action-button btn-ghost" ${state.page===state.total?"disabled":""} id="es-next">Próxima</button>`;
        $("#es-prev")?.addEventListener("click", () => { state.page--; renderTable(state.rows); });
        $("#es-next")?.addEventListener("click", () => { state.page++; renderTable(state.rows); });
    };
    
    const apply = () => {
        const all = DataStore.getEstoque();
        const term = search.value.trim().toLowerCase();
        state.rows = all.filter(r => !term || r.sku.toLowerCase().includes(term) || r.nome.toLowerCase().includes(term) || r.local.toLowerCase().includes(term));
        state.page = 1;
        renderKPIs(state.rows);
        renderTable(state.rows);
    };

    const downloadCSV = () => {
        const rows = DataStore.getEstoque();
        let csvContent = "data:text/csv;charset=utf-8," 
            + "SKU,Produto,Categoria,Custo,Preco,Estoque,Minimo,Status,Local\n"
            + rows.map(r => `${r.sku},"${r.nome}","${r.categoria}",${r.custo},${r.preco},${r.estoque},${r.minimo},${r.status},"${r.local}"`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "estoque.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    //... (Lógica de Estoque: promptMov, scanner, init)
     const promptMov = (type) => {
        Modal.open({
            title: type.charAt(0).toUpperCase() + type.slice(1) + " de Estoque",
            html: `
                <div class="form-grid">
                  <label>SKU<input id="mv-sku"/></label>
                  <label>Quantidade<input id="mv-qtd" type="number" min="1"/></label>
                </div>
            `,
            footerHtml: `<button class="action-button" id="mv-save">Salvar</button><button class="action-button btn-ghost" id="mv-cancel">Cancelar</button>`,
        });
        $("#mv-cancel").onclick = Modal.close;
        $("#mv-save").onclick = () => {
            const sku = $("#mv-sku").value.trim().toUpperCase();
            let qtd = parseInt($("#mv-qtd").value || "0", 10);
            if(type === 'saida' || type === 'ajuste') qtd = -Math.abs(qtd);
            
            if(DataStore.updateEstoque(sku, qtd)) {
                Modal.close();
                apply();
            } else {
                alert("SKU não encontrado!");
            }
        };
    };


    const init = () => {
        apply();
        search.addEventListener("input", apply);
        btnIn.onclick = () => promptMov("entrada");
        btnOut.onclick = () => promptMov("saida");
        btnAdj.onclick = () => promptMov("ajuste");
        btnCSV.onclick = downloadCSV;

        scanner.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const sku = scanner.value.trim().toUpperCase();
                if (!sku) return;
                
                if(DataStore.updateEstoque(sku, -1)) {
                    scanResult.innerHTML = `<strong>Baixa realizada:</strong> 1 unidade do SKU ${sku}.`;
                    apply();
                } else {
                    scanResult.innerHTML = `<span class="err-text"><strong>Erro:</strong> SKU ${sku} não encontrado.</span>`;
                }
                scanner.value = "";
                setTimeout(() => scanResult.innerHTML = "", 3000);
            }
        });
    };

    return { init };
})();

// ---------- SEÇÃO: TROCAS E DEVOLUÇÕES ----------
const Trocas = (() => {
    const tbody = $("#tabela-trocas tbody");
    const pag = $("#pag-trocas");
    const search = $("#search-trocas");
    const btnNew = $("#btnNovaTroca");
    const PAGE_SIZE = 10;
    const state = { page: 1, rows: [] };

    const renderTable = (rows) => {
        const start = (state.page - 1) * PAGE_SIZE;
        const pageRows = rows.slice(start, start + PAGE_SIZE);
        tbody.innerHTML = pageRows.map(r => `
            <tr>
                <td>#${r.id_pedido}</td><td>${r.cliente}</td><td>${fmtBRL(r.valor_compra)}</td>
                <td>${fmtBRL(r.custo_pac_reverso)}</td><td>${r.tipo}</td><td>${r.motivo}</td>
                <td>${r.status}</td><td><button class="link">Ver</button></td>
            </tr>`
        ).join("");

        state.total = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
        pag.innerHTML = `<button class="action-button btn-ghost" ${state.page===1?"disabled":""} id="trc-prev">Anterior</button> <span class="muted">Página ${state.page} de ${state.total}</span> <button class="action-button btn-ghost" ${state.page===state.total?"disabled":""} id="trc-next">Próxima</button>`;
        $("#trc-prev")?.addEventListener("click", () => { state.page--; renderTable(state.rows); });
        $("#trc-next")?.addEventListener("click", () => { state.page++; renderTable(state.rows); });
    };

    const apply = (range) => {
        const all = DataStore.getTrocas(range.start, range.end);
        const term = search.value.trim().toLowerCase();
        state.rows = all.filter(r => !term || r.id_pedido.toString().includes(term) || r.cliente.toLowerCase().includes(term) || r.motivo.toLowerCase().includes(term));
        state.page = 1;
        renderTable(state.rows);
    };

    const openNovo = (range) => {
        Modal.open({
            title: "Nova Solicitação de Troca/Devolução",
            html: `
            <div class="form-grid">
                <label>Nº do Pedido<input id="trc-pedido" type="number"/></label>
                <label>Nome do Cliente<input id="trc-cliente"/></label>
                <label>Valor da Compra<input id="trc-valor" type="number" step="0.01"/></label>
                <label>Custo PAC Reverso<input id="trc-pac" type="number" step="0.01"/></label>
                <label>Tipo<select id="trc-tipo"><option>Troca</option><option>Devolução</option></select></label>
                <label>Motivo<input id="trc-motivo"/></label>
                <label>Status<select id="trc-status"><option>Solicitado</option><option>Em análise</option><option>Concluído</option></select></label>
                <label>Data<input type="date" id="trc-data" value="${toISODate(new Date())}"/></label>
            </div>
            `,
            footerHtml: `<button class="action-button" id="trc-save">Salvar</button><button class="action-button btn-ghost" id="trc-cancel">Cancelar</button>`,
        });
        $('#trc-cancel').onclick = Modal.close;
        $('#trc-save').onclick = () => {
            DataStore.addTroca({
                id_pedido: parseInt($('#trc-pedido').value), cliente: $('#trc-cliente').value,
                valor_compra: parseFloat($('#trc-valor').value), custo_pac_reverso: parseFloat($('#trc-pac').value),
                tipo: $('#trc-tipo').value, motivo: $('#trc-motivo').value, status: $('#trc-status').value,
                data: $('#trc-data').value,
            });
            Modal.close();
            apply(range);
        };
    };

    const init = (range) => {
        apply(range);
        search.addEventListener("input", () => apply(range));
        btnNew.onclick = () => openNovo(range);
    };

    return { init };
})();


// ---------- SEÇÃO: EMAILS E CONTATOS ----------
const Emails = (() => {
  const tbody = $("#tabela-emails tbody");
  const pag = $("#pag-emails");
  const search = $("#search-emails");
  const btnNew = $("#btnNovoEmail");
  const PAGE_SIZE = 8;
  const state = { page: 1, rows: [] };
  
  const renderTable = (rows) => {
    const start = (state.page - 1) * PAGE_SIZE;
    const pageRows = rows.slice(start, start + PAGE_SIZE);
    tbody.innerHTML = pageRows.map(r => `
      <tr><td>${r.para}</td><td>${r.assunto}</td><td>${r.status}</td><td>${r.data}</td></tr>`
    ).join("");
    state.total = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    pag.innerHTML = `<button class="action-button btn-ghost" ${state.page===1?"disabled":""} id="em-prev">Anterior</button> <span class="muted">Página ${state.page} de ${state.total}</span> <button class="action-button btn-ghost" ${state.page===state.total?"disabled":""} id="em-next">Próxima</button>`;
    $("#em-prev")?.addEventListener("click", () => { state.page--; renderTable(state.rows); });
    $("#em-next")?.addEventListener("click", () => { state.page++; renderTable(state.rows); });
  };
  
  const apply = (range) => {
    const all = DataStore.getEmails(range.start, range.end);
    const term = search.value.trim().toLowerCase();
    state.rows = all.filter(r => !term || r.para.toLowerCase().includes(term) || r.assunto.toLowerCase().includes(term));
    state.page = 1;
    renderTable(state.rows);
  };
  
  const openNovo = (range) => {
    Modal.open({
        title: "Novo Disparo",
        html: `
        <div class="form-grid">
            <label>Para (email)<input id="mail-para"/></label>
            <label>Assunto<input id="mail-assunto"/></label>
            <label>Status<select id="mail-status"><option>Agendado</option><option>Enviado</option><option>Erro</option></select></label>
            <label>Data<input type="date" id="mail-data" value="${toISODate(new Date())}"/></label>
        </div>
        `,
        footerHtml: `<button class="action-button" id="mail-save">Salvar</button><button class="action-button btn-ghost" id="mail-cancel">Cancelar</button>`
    });
    $('#mail-cancel').onclick = Modal.close;
    $('#mail-save').onclick = () => {
        DataStore.addEmail({
            para: $('#mail-para').value, assunto: $('#mail-assunto').value,
            status: $('#mail-status').value, data: $('#mail-data').value
        });
        Modal.close();
        apply(range);
    };
  };

  const init = (range) => {
    apply(range);
    search.addEventListener("input", () => apply(range));
    btnNew.onclick = () => openNovo(range);
  };
  
  return { init };
})();

const Contatos = (() => {
    const tbody = $("#tabela-contatos tbody");
    const pag = $("#pag-contatos");
    const search = $("#search-contatos");
    const btnNew = $("#btnNovoContato");
    const PAGE_SIZE = 10;
    const state = { page: 1, rows: [] };

    const renderTable = (rows) => {
        const start = (state.page - 1) * PAGE_SIZE;
        const pageRows = rows.slice(start, start + PAGE_SIZE);
        tbody.innerHTML = pageRows.map(c => `
        <tr>
            <td>${c.nome}</td><td>${c.email}</td><td>${c.telefone}</td>
            <td><span class="${c.status === 'Ativo' ? 'ok-text' : ''}">${c.status}</span></td>
        </tr>`).join('');
        state.total = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
        pag.innerHTML = `<button class="action-button btn-ghost" ${state.page===1?"disabled":""} id="ct-prev">Anterior</button> <span class="muted">Página ${state.page} de ${state.total}</span> <button class="action-button btn-ghost" ${state.page===state.total?"disabled":""} id="ct-next">Próxima</button>`;
        $("#ct-prev")?.addEventListener("click", () => { state.page--; renderTable(state.rows); });
        $("#ct-next")?.addEventListener("click", () => { state.page++; renderTable(state.rows); });
    };

    const apply = () => {
        const all = DataStore.getContatos();
        const term = search.value.trim().toLowerCase();
        state.rows = all.filter(c => !term || c.nome.toLowerCase().includes(term) || c.email.toLowerCase().includes(term));
        state.page = 1;
        renderTable(state.rows);
    };
    
    const openNovo = () => {
        Modal.open({
            title: "Novo Contato",
            html: `
            <div class="form-grid">
                <label>Nome<input id="ct-nome"/></label>
                <label>Email<input id="ct-email" type="email"/></label>
                <label>Telefone<input id="ct-tel"/></label>
                <label>Status<select id="ct-status"><option>Ativo</option><option>Inativo</option></select></label>
            </div>
            `,
            footerHtml: `<button class="action-button" id="ct-save">Salvar</button><button class="action-button btn-ghost" id="ct-cancel">Cancelar</button>`
        });
        $('#ct-cancel').onclick = Modal.close;
        $('#ct-save').onclick = () => {
            DataStore.addContato({
                nome: $('#ct-nome').value, email: $('#ct-email').value,
                telefone: $('#ct-tel').value, status: $('#ct-status').value
            });
            Modal.close();
            apply();
        };
    };

    const init = () => {
        apply();
        search.addEventListener("input", apply);
        btnNew.onclick = openNovo;
    };

    return { init };
})();


// ---------- ORQUESTRADOR GERAL ----------
const Orchestrator = (() => {
  const sections = {
    dash: { init: Dash.init, filter: new DateFilter($("#dash-section"), { startInput: "#dash-start-date", endInput: "#dash-end-date" }) },
    pedidos: { init: Pedidos.init, filter: new DateFilter($("#pedidos-section"), { startInput: "#ped-start-date", endInput: "#ped-end-date" }) },
    financas: { init: Financas.init, filter: new DateFilter($("#financas-section"), { startInput: "#fin-start-date", endInput: "#fin-end-date" }) },
    rastreio: { init: Rastreio.init, filter: new DateFilter($("#rastreio-section"), { startInput: "#ras-start-date", endInput: "#ras-end-date" }) },
    influencers: { init: Influencers.init, filter: new DateFilter($("#influencers-section"), { startInput: "#inf-start-date", endInput: "#inf-end-date" }) },
    estoque: { init: Estoque.init, filter: null }, // Estoque não usa filtro de data
    trocas: { init: Trocas.init, filter: new DateFilter($("#trocas-section"), { startInput: "#trc-start-date", endInput: "#trc-end-date" }) },
    emails: { init: Emails.init, filter: new DateFilter($("#emails-section"), { startInput: "#mail-start-date", endInput: "#mail-end-date" }) },
    contatos: { init: Contatos.init, filter: null}, // Contatos não usam filtro
    marketing: { init: () => {}, filter: null }, // Sem lógica inicial
  };

  Object.values(sections).forEach(({ filter, init }) => {
    if (filter) filter.onChange((range) => init(range));
  });

  const initSection = (key) => {
      const s = sections[key];
      if (s) {
          if (s.filter) s.init(s.filter.getRange());
          else s.init();
      }
  };

  // Inicializa a primeira seção
  initSection('dash');
  
  // Ao trocar de menu, inicializa a seção
  $$(".menu-item").forEach((mi) =>
    mi.addEventListener("click", () => initSection(mi.dataset.target))
  );

  return { initSection, sections };
})();

// Tecla de atalho para recarregar
document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "r" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    const active = $(".menu-item.active")?.dataset.target;
    if (active) Orchestrator.initSection(active);
  }
});

