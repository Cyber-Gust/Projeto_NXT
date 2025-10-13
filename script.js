/* ============================================
   NEXT Sports BR - Turbo | script.js
   – Filtros de data globais por seção
   – KPIs: Lucro Líquido, ROI, Margem%, CPA
   – Kanban arrastável (Pedidos)
   – Scanner bipador (Rastreio)
   – Tabelas com busca + paginação
   – Modais reutilizáveis
   – Chart.js (Faturamento x Ads)
   – NOVO: Miniaturas e custo em Produtos
   – NOVO: Miniaturas e custo total no Estoque
   – NOVO: Métricas e corpo no Emails
   – NOVO: Trocas/Devoluções (seção completa)
   ============================================ */

/* ---------- Utils de Data e Formatação ---------- */
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const $ = (sel, root = document) => root.querySelector(sel);

const fmtBRL = (v) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtPct = (v) => `${(v * 100).toFixed(1)}%`;

const toISODate = (d) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
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

const PLACEHOLDER_IMG =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' fill='#2b2b2b'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-size='10' fill='#bbb'>sem imagem</text></svg>`
  );

/* ---------- Modal Global ---------- */
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
  };

  const close = () => {
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.display = "none";
    content.innerHTML = "";
    footer.innerHTML = "";
  };

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  closeBtn.addEventListener("click", close);

  return { open, close };
})();

/* ---------- Dataset (Mock robusto para testes) ---------- */
const DataStore = (() => {
  // Gera datas aleatórias dentro dos últimos N dias
  const rndDateWithin = (days = 120) => {
    const d = new Date();
    const delta = Math.floor(Math.random() * days);
    d.setDate(d.getDate() - delta);
    return toISODate(d);
  };

  // Pedidos (Kanban)
  const STATUS = ["Pedidos Novos", "Em Separacao", "Em Transito", "Entruegues", "Atrasados"];
  const pedidos = Array.from({ length: 42 }).map((_, i) => ({
    id: 1000 + i,
    cliente: ["Ana", "Bruno", "Carla", "Diego", "Eva", "Felipe", "Gabi"][
      Math.floor(Math.random() * 7)
    ],
    total: +(60 + Math.random() * 640).toFixed(2),
    created_at: rndDateWithin(120),
    status: STATUS[Math.floor(Math.random() * STATUS.length)],
    items: [
      { sku: "SKU-" + (1000 + (i % 26)), nome: "Produto " + ((i % 26) + 1), qtd: 1 },
    ],
  }));

  // Custos Financeiros
  const categoriasCusto = ["MKT", "Logística", "Operacional", "Taxas", "Outros"];
  const custos = Array.from({ length: 28 }).map((_, i) => ({
    id: uid(),
    nome: ["Meta Ads", "Correios", "Embalagens", "Taxa Gateway", "Serviços"][
      Math.floor(Math.random() * 5)
    ],
    categoria: categoriasCusto[Math.floor(Math.random() * categoriasCusto.length)],
    data: rndDateWithin(120),
    valor: +(50 + Math.random() * 1500).toFixed(2),
  }));

  // Gastos de Ads (para ROI/CPA)
  const adsDaily = Array.from({ length: 120 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return {
      data: toISODate(d),
      meta: +(20 + Math.random() * 180).toFixed(2),
      google: +(10 + Math.random() * 90).toFixed(2),
    };
  });

  // Influencers
  const influencers = Array.from({ length: 14 }).map((_, i) => ({
    id: uid(),
    nome: ["Lia Fit", "João Runner", "Cris Move", "Vivi Health", "Gui Pro"][
      Math.floor(Math.random() * 5)
    ] + " #" + (i + 1),
    tel: "55 32 9" + Math.floor(80000000 + Math.random() * 9999999),
    cupom: ["LIA10", "JOAO5", "CRIS7", "VIVI8", "GUI12"][
      Math.floor(Math.random() * 5)
    ],
    vendas: Math.floor(Math.random() * 90),
    comissao: +(30 + Math.random() * 900).toFixed(2),
    data: rndDateWithin(120),
  }));

  // Emails
  const emails = Array.from({ length: 24 }).map((_, i) => ({
    id: uid(),
    para: ["cliente" + i + "@mail.com", "vip" + i + "@mail.com"][
      Math.floor(Math.random() * 2)
    ],
    assunto: ["Lançamento Manto", "Cupom VIP", "Rastreio Atualizado"][
      Math.floor(Math.random() * 3)
    ],
    status: ["Enviado", "Agendado", "Erro"][Math.floor(Math.random() * 3)],
    data: rndDateWithin(60),
    corpo: "Olá! Este é um disparo de teste #" + (i + 1),
  }));

  // Produtos (NOVO: imagem + custo)
  const sampleImgs = [
    "https://picsum.photos/seed/1/80/80",
    "https://picsum.photos/seed/2/80/80",
    "https://picsum.photos/seed/3/80/80",
    "https://picsum.photos/seed/4/80/80",
    "https://picsum.photos/seed/5/80/80",
  ];
  const categorias = ["Masculino", "Feminino", "Infantil", "Acessórios", "Patchs"];
  const produtos = Array.from({ length: 26 }).map((_, i) => ({
    sku: "SKU-" + (1000 + i),
    nome: "Produto " + (i + 1),
    categoria: categorias[Math.floor(Math.random() * categorias.length)],
    preco: +(79 + Math.random() * 420).toFixed(2),
    custo: +(30 + Math.random() * 200).toFixed(2),
    imagem: sampleImgs[i % sampleImgs.length],
    status: ["Ativo", "Inativo"][Math.floor(Math.random() * 2)],
    data: rndDateWithin(180),
  }));

  // Estoque (usaremos custo e imagem mapeando por SKU de produtos se existir)
  const locais = ["CD-Matriz", "Loja-Estádio", "CD-2", "Quiosque-Centro"];
  const estoque = Array.from({ length: 30 }).map((_, i) => {
    const sku = i < 18 ? "SKU-" + (1000 + i) : "SKU-" + (1200 + i); // parte casando com produtos
    return {
      sku,
      produto: "Item Estoque " + (i + 1),
      local: locais[Math.floor(Math.random() * locais.length)],
      estoque: Math.floor(Math.random() * 120),
      minimo: Math.floor(Math.random() * 20),
      data: rndDateWithin(120),
      // opcional: imagem local (se não houver produto correspondente, usa placeholder)
      imagem: undefined,
    };
  });

  // Trocas / Devoluções (novo)
  const trocas = Array.from({ length: 12 }).map((_, i) => ({
    id: 5000 + i,
    tipo: Math.random() > 0.5 ? "Troca" : "Devolução",
    pedido: 1000 + (i % 20),
    cliente: ["Ana", "Bruno", "Carla", "Diego", "Eva", "Felipe", "Gabi"][
      Math.floor(Math.random() * 7)
    ],
    sku: "SKU-" + (1000 + (i % 10)),
    produto: "Produto " + ((i % 10) + 1),
    imagem: sampleImgs[i % sampleImgs.length],
    motivo: ["Tamanho", "Defeito", "Insatisfação", "Outro"][
      Math.floor(Math.random() * 4)
    ],
    status: ["Solicitado", "Em Análise", "Aprovado", "Concluído"][
      Math.floor(Math.random() * 4)
    ],
    data: rndDateWithin(90),
  }));

  /* Helpers de filtro por range */
  const filterByRange = (arr, getDate, start, end) =>
    arr.filter((r) => inRange(getDate(r), start, end));

  /* Map helpers */
  const produtoBySku = (sku) => produtos.find((p) => p.sku === sku) || null;

  return {
    // Pedidos
    getPedidos: (start, end) =>
      filterByRange(pedidos, (r) => r.created_at, start, end),
    upPedidoStatus: (id, status) => {
      const p = pedidos.find((x) => x.id === id);
      if (p) p.status = status;
    },

    // Custos
    getCustos: (start, end) => filterByRange(custos, (r) => r.data, start, end),
    addCusto: (c) => custos.push({ id: uid(), ...c }),

    // Ads
    getAdsDaily: (start, end) =>
      filterByRange(adsDaily, (r) => r.data, start, end),

    // Influencers
    getInfluencers: (start, end) =>
      filterByRange(influencers, (r) => r.data, start, end),
    addInflu: (it) => influencers.push({ id: uid(), ...it }),

    // Emails
    getEmails: (start, end) => filterByRange(emails, (r) => r.data, start, end),
    addEmail: (e) => emails.push({ id: uid(), ...e }),

    // Produtos
    getProdutos: (start, end) =>
      filterByRange(produtos, (r) => r.data, start, end),
    addProduto: (p) => produtos.push(p),
    getProdutoBySku: produtoBySku,

    // Estoque
    getEstoque: (start, end) => filterByRange(estoque, (r) => r.data, start, end),
    addMovEstoque: (sku, delta, local) => {
      const e = estoque.find((x) => x.sku === sku && x.local === local);
      const prod = produtoBySku(sku);
      if (e) {
        e.estoque += delta;
        e.data = toISODate(new Date());
        if (!e.imagem && prod?.imagem) e.imagem = prod.imagem;
      } else {
        estoque.push({
          sku,
          produto: prod?.nome || "Novo SKU " + sku,
          local,
          estoque: Math.max(0, delta),
          minimo: 0,
          data: toISODate(new Date()),
          imagem: prod?.imagem,
        });
      }
    },

    // Trocas / Devoluções
    getTrocas: (start, end) => filterByRange(trocas, (r) => r.data, start, end),
    addTroca: (t) => trocas.push({ id: 5000 + trocas.length, ...t }),

    STATUS,
  };
})();

/* ---------- Componente de Filtro de Data (por seção) ---------- */
class DateFilter {
  constructor(rootEl, { startInput, endInput, quickButtons = [] }) {
    this.root = rootEl;
    this.startEl = $(startInput, rootEl);
    this.endEl = $(endInput, rootEl);
    this.quickButtons = quickButtons.length
      ? quickButtons.map((sel) => $(sel, rootEl))
      : $$(".quick-range .action-button", rootEl);

    // default: últimos 30 dias
    const end = new Date();
    const start = daysAgo(30);
    this.setRange(start, end);

    this.quickButtons.forEach((btn) =>
      btn.addEventListener("click", () => {
        const n = parseInt(btn.dataset.range, 10) || 30;
        const end = new Date();
        const start = daysAgo(n);
        this.setRange(start, end, true);
        this._emit();
      })
    );

    [this.startEl, this.endEl].forEach((el) =>
      el.addEventListener("change", () => this._emit())
    );
  }

  getRange() {
    const s = this.startEl.value ? new Date(this.startEl.value) : null;
    const e = this.endEl.value ? new Date(this.endEl.value) : null;
    if (s) s.setHours(0, 0, 0, 0);
    if (e) e.setHours(0, 0, 0, 0);
    return { start: s, end: e };
  }

  setRange(start, end, writeInputs = true) {
    if (writeInputs) {
      this.startEl.value = toISODate(start);
      this.endEl.value = toISODate(end);
    } else {
      // primeira carga
      this.startEl.value = toISODate(start);
      this.endEl.value = toISODate(end);
    }
  }

  onChange(handler) {
    this._handler = handler;
  }

  _emit() {
    if (typeof this._handler === "function") this._handler(this.getRange());
  }
}

/* ---------- Navegação de Seções ---------- */
const Nav = (() => {
  const items = $$(".menu-item");
  const sections = $$(".section-container");
  const title = $("#page-title");

  const activate = (key) => {
    items.forEach((i) => i.classList.toggle("active", i.dataset.target === key));
    sections.forEach((s) =>
      s.classList.toggle("active", s.id === `${key}-section`)
    );
    title.textContent = key[0].toUpperCase() + key.slice(1);
  };

  items.forEach((i) =>
    i.addEventListener("click", () => activate(i.dataset.target))
  );

  // Burger
  $("#burger").addEventListener("click", () => {
    $("#sidebar").classList.toggle("open");
  });

  return { activate };
})();

/* ---------- Dash (KPIs + Chart) ---------- */
const Dash = (() => {
  let chart;
  const grid = $("#kpi-grid");

  const calcKPIs = (start, end) => {
    const pedidos = DataStore.getPedidos(start, end);
    const receita = pedidos.reduce((s, p) => s + p.total, 0);

    const custos = DataStore.getCustos(start, end).reduce(
      (s, c) => s + c.valor,
      0
    );

    const ads = DataStore.getAdsDaily(start, end).reduce(
      (s, d) => s + d.meta + d.google,
      0
    );

    const custosTotais = custos + ads;
    const lucroLiquido = receita - custosTotais;
    const margem = receita > 0 ? lucroLiquido / receita : 0;

    // CPA = ads / número de pedidos (aproximação)
    const cpa = pedidos.length > 0 ? ads / pedidos.length : 0;

    // ROI = lucro líquido / investimento (ads + custos operacionais)
    const investimento = custosTotais;
    const roi = investimento > 0 ? lucroLiquido / investimento : 0;

    return {
      receita,
      custos,
      ads,
      lucroLiquido,
      margem,
      cpa,
      roi,
      pedidosCount: pedidos.length,
    };
  };

  const renderKPIs = (k) => {
    grid.innerHTML = `
      <div class="metric-card"><div class="label">Receita</div><div class="value">${fmtBRL(
        k.receita
      )}</div></div>
      <div class="metric-card"><div class="label">Custos Operacionais</div><div class="value">${fmtBRL(
        k.custos
      )}</div></div>
      <div class="metric-card"><div class="label">Ads (Meta+Google)</div><div class="value">${fmtBRL(
        k.ads
      )}</div></div>
      <div class="metric-card"><div class="label">Lucro Líquido</div><div class="value">${fmtBRL(
        k.lucroLiquido
      )}</div></div>
      <div class="metric-card"><div class="label">Margem</div><div class="value">${fmtPct(
        k.margem
      )}</div></div>
      <div class="metric-card"><div class="label">CPA</div><div class="value">${fmtBRL(
        k.cpa
      )}</div></div>
      <div class="metric-card"><div class="label">ROI</div><div class="value">${fmtPct(
        k.roi
      )}</div></div>
      <div class="metric-card"><div class="label"># Pedidos</div><div class="value">${
        k.pedidosCount
      }</div></div>
    `;
  };

  const renderChart = (start, end) => {
    const ctx = $("#chartFatAds").getContext("2d");
    const daily = DataStore.getAdsDaily(start, end).sort((a, b) =>
      a.data.localeCompare(b.data)
    );
    const labels = daily.map((d) => d.data);

    // Receita diária aproximada a partir de pedidos
    const pedidos = DataStore.getPedidos(start, end);
    const receitaByDate = {};
    pedidos.forEach((p) => {
      receitaByDate[p.created_at] = (receitaByDate[p.created_at] || 0) + p.total;
    });
    const receitaArr = labels.map((d) => +(receitaByDate[d] || 0).toFixed(2));
    const adsArr = labels.map((d) =>
      +(
        daily.find((x) => x.data === d).meta +
        daily.find((x) => x.data === d).google
      ).toFixed(2)
    );

    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Receita (R$)", data: receitaArr },
          { label: "Investimento em Ads (R$)", data: adsArr },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  };

  const init = (range) => {
    const k = calcKPIs(range.start, range.end);
    renderKPIs(k);
    renderChart(range.start, range.end);
  };

  return { init };
})();

/* ---------- Pedidos (Kanban + Filtro + Busca) ---------- */
const Pedidos = (() => {
  const board = $("#kanban-board");
  const search = $("#search-pedidos");

  const render = (start, end, term = "") => {
    const pedidos = DataStore.getPedidos(start, end).filter((p) => {
      const t = term.trim().toLowerCase();
      if (!t) return true;
      return (
        p.id.toString().includes(t) ||
        p.cliente.toLowerCase().includes(t) ||
        p.items.some((it) => it.sku.toLowerCase().includes(t))
      );
    });

    const groups = {};
    DataStore.STATUS.forEach((s) => (groups[s] = []));
    pedidos.forEach((p) => groups[p.status]?.push(p));

    board.innerHTML = DataStore.STATUS.map(
      (st) => `
      <div class="kanban-col" data-status="${st}">
        <div class="kanban-col-header">
          <span>${st}</span><span class="count">${groups[st].length}</span>
        </div>
        <div class="kanban-col-body" data-dropzone="true">
          ${groups[st]
            .map(
              (p) => `
            <div class="kanban-card" draggable="true" data-id="${p.id}">
              <div class="line"><strong>#${p.id}</strong> — ${p.cliente}</div>
              <div class="line">${fmtBRL(p.total)} • ${p.created_at}</div>
              <div class="line small">${p.items[0].sku} × ${p.items[0].qtd}</div>
            </div>`
            )
            .join("")}
        </div>
      </div>`
    ).join("");

    // Drag'n'drop
    $$(".kanban-card", board).forEach((card) => {
      card.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", card.dataset.id);
      });
    });

    $$("[data-dropzone]", board).forEach((zone) => {
      zone.addEventListener("dragover", (e) => e.preventDefault());
      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        const id = parseInt(e.dataTransfer.getData("text/plain"), 10);
        const newStatus = zone.closest(".kanban-col").dataset.status;
        DataStore.upPedidoStatus(id, newStatus);
        // re-render mantendo filtro
        render(start, end, search.value);
      });
    });
  };

  const init = (range) => {
    render(range.start, range.end);
    search.addEventListener("input", () =>
      render(range.start, range.end, search.value)
    );
  };

  return { init, render };
})();

/* ---------- Financas (KPIs + Tabela de Custos + Modal) ---------- */
const Financas = (() => {
  const kpisWrap = $("#financas-kpis");
  const tbody = $("#tbody-custos");
  const btnAdd = $("#btnAdicionarCusto");

  const calc = (start, end) => {
    const pedidos = DataStore.getPedidos(start, end);
    const receita = pedidos.reduce((s, p) => s + p.total, 0);

    const custos = DataStore.getCustos(start, end);
    const somaCustos = custos.reduce((s, c) => s + c.valor, 0);

    const ads = DataStore.getAdsDaily(start, end).reduce(
      (s, a) => s + a.meta + a.google,
      0
    );

    const custoTotal = somaCustos + ads;
    const lucro = receita - custoTotal;
    const margem = receita > 0 ? lucro / receita : 0;
    const cpa = pedidos.length > 0 ? ads / pedidos.length : 0;
    const roi = custoTotal > 0 ? lucro / custoTotal : 0;

    return { receita, somaCustos, ads, custoTotal, lucro, margem, cpa, roi, pedidos: pedidos.length, custos };
  };

  const renderKPIs = (k) => {
    kpisWrap.innerHTML = `
      <div class="metric-card"><div class="label">Receita</div><div class="value">${fmtBRL(k.receita)}</div></div>
      <div class="metric-card"><div class="label">Custos</div><div class="value">${fmtBRL(k.somaCustos)}</div></div>
      <div class="metric-card"><div class="label">Ads</div><div class="value">${fmtBRL(k.ads)}</div></div>
      <div class="metric-card"><div class="label">Custo Total</div><div class="value">${fmtBRL(k.custoTotal)}</div></div>
      <div class="metric-card"><div class="label">Lucro Líquido</div><div class="value">${fmtBRL(k.lucro)}</div></div>
      <div class="metric-card"><div class="label">Margem</div><div class="value">${fmtPct(k.margem)}</div></div>
      <div class="metric-card"><div class="label">CPA</div><div class="value">${fmtBRL(k.cpa)}</div></div>
      <div class="metric-card"><div class="label">ROI</div><div class="value">${fmtPct(k.roi)}</div></div>
    `;
  };

  const renderTable = (custos) => {
    tbody.innerHTML = custos
      .sort((a, b) => b.data.localeCompare(a.data))
      .map(
        (c) => `
      <tr>
        <td>${c.nome}</td>
        <td>${c.categoria}</td>
        <td>${c.data}</td>
        <td>${fmtBRL(c.valor)}</td>
        <td><button class="link danger" data-del="${c.id}">Excluir</button></td>
      </tr>`
      )
      .join("");

    $$('button[data-del]').forEach((btn) =>
      btn.addEventListener("click", () => {
        alert("Remoção lógica não implementada no mock. Adicione novamente se necessário 😉");
      })
    );
  };

  const openModalNovo = (range) => {
    Modal.open({
      title: "Adicionar Custo",
      html: `
        <div class="form-grid">
          <label>Nome<input id="custo-nome" /></label>
          <label>Categoria
            <select id="custo-cat">
              <option>MKT</option><option>Logística</option>
              <option>Operacional</option><option>Taxas</option><option>Outros</option>
            </select>
          </label>
          <label>Data<input type="date" id="custo-data" value="${toISODate(new Date())}"/></label>
          <label>Valor (R$)<input id="custo-valor" type="number" min="0" step="0.01"/></label>
        </div>
      `,
      footerHtml: `
        <button class="action-button" id="save-custo">Salvar</button>
        <button class="action-button btn-ghost" id="cancel-custo">Cancelar</button>
      `,
    });
    $("#cancel-custo").onclick = Modal.close;
    $("#save-custo").onclick = () => {
      const nome = $("#custo-nome").value.trim() || "Custo";
      const categoria = $("#custo-cat").value;
      const data = $("#custo-data").value || toISODate(new Date());
      const valor = parseFloat($("#custo-valor").value || "0");
      DataStore.addCusto({ nome, categoria, data, valor });
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

/* ---------- Rastreio (Scanner + Tabela + Busca + Paginação) ---------- */
const Rastreio = (() => {
  const search = $("#search-rastreio");
  const tbody = $("#tabela-rastreio-interno tbody");
  const pag = $("#pag-rastreio");
  const scanner = $("#scanner-input");
  const scanResult = $("#scan-result");
  const PAGE_SIZE = 8;

  const state = { page: 1, total: 1, rows: [] };

  const renderTable = (rows) => {
    const start = (state.page - 1) * PAGE_SIZE;
    const pageRows = rows.slice(start, start + PAGE_SIZE);
    tbody.innerHTML = pageRows
      .map(
        (r) => `
      <tr>
        <td>${r.nome}</td>
        <td>${r.rastreio}</td>
        <td>${r.transportadora}</td>
        <td>${r.data_chegada}</td>
        <td>${r.status}</td>
      </tr>`
      )
      .join("");

    state.total = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    pag.innerHTML = `
      <button class="action-button btn-ghost" ${state.page === 1 ? "disabled" : ""} id="pg-prev">Anterior</button>
      <span class="muted">Página ${state.page} de ${state.total}</span>
      <button class="action-button btn-ghost" ${
        state.page === state.total ? "disabled" : ""
      } id="pg-next">Próxima</button>
    `;
    $("#pg-prev")?.addEventListener("click", () => {
      state.page = Math.max(1, state.page - 1);
      renderTable(state.rows);
    });
    $("#pg-next")?.addEventListener("click", () => {
      state.page = Math.min(state.total, state.page + 1);
      renderTable(state.rows);
    });
  };

  const apply = (range) => {
    const all = DataStore.getRastreio(range.start, range.end);
    const term = search.value.trim().toLowerCase();
    const rows = all.filter(
      (r) =>
        !term ||
        r.nome.toLowerCase().includes(term) ||
        r.rastreio.toLowerCase().includes(term) ||
        r.transportadora.toLowerCase().includes(term)
    );
    state.page = 1;
    state.rows = rows;
    renderTable(rows);
  };

  const init = (range) => {
    apply(range);
    search.addEventListener("input", () => apply(range));
    // Scanner com Enter
    scanner.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const code = scanner.value.trim();
        if (!code) return;
        const match =
          state.rows.find((r) => r.rastreio === code) ||
          DataStore.getRastreio(daysAgo(180), new Date()).find(
            (r) => r.rastreio === code
          );
        if (match) {
          scanResult.innerHTML = `<strong>Encontrado:</strong> ${match.nome} • ${match.transportadora} • ${match.status} • Previsto: ${match.data_chegada}`;
        } else {
          scanResult.textContent = "Código não encontrado no período atual.";
        }
        scanner.value = "";
      }
    });
  };

  return { init, apply };
})();

/* ---------- Influencers ---------- */
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
    const comissao = rows.reduce((s, r) => s + r.comissao, 0);
    summary.innerHTML = `
      <div class="metric-card"><div class="label">Vendas (somatório)</div><div class="value">${vendas}</div></div>
      <div class="metric-card"><div class="label">Comissão Total</div><div class="value">${fmtBRL(comissao)}</div></div>
      <div class="metric-card"><div class="label"># Influencers</div><div class="value">${rows.length}</div></div>
    `;
  };

  const renderTable = (rows) => {
    const start = (state.page - 1) * PAGE_SIZE;
    const pageRows = rows.slice(start, start + PAGE_SIZE);
    tbody.innerHTML = pageRows
      .map(
        (r) => `
      <tr>
        <td>${r.nome}</td>
        <td>${r.tel}</td>
        <td>${r.cupom}</td>
        <td>${r.vendas}</td>
        <td>${fmtBRL(r.comissao)}</td>
      </tr>`
      )
      .join("");

    state.total = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    pag.innerHTML = `
      <button class="action-button btn-ghost" ${state.page === 1 ? "disabled" : ""} id="inf-prev">Anterior</button>
      <span class="muted">Página ${state.page} de ${state.total}</span>
      <button class="action-button btn-ghost" ${
        state.page === state.total ? "disabled" : ""
      } id="inf-next">Próxima</button>
    `;
    $("#inf-prev")?.addEventListener("click", () => {
      state.page = Math.max(1, state.page - 1);
      renderTable(state.rows);
    });
    $("#inf-next")?.addEventListener("click", () => {
      state.page = Math.min(state.total, state.page + 1);
      renderTable(state.rows);
    });
  };

  const apply = (range) => {
    const all = DataStore.getInfluencers(range.start, range.end);
    const term = search.value.trim().toLowerCase();
    const rows = all.filter(
      (r) =>
        !term ||
        r.nome.toLowerCase().includes(term) ||
        r.cupom.toLowerCase().includes(term)
    );
    state.page = 1;
    state.rows = rows;
    renderSummary(rows);
    renderTable(rows);
  };

  const openNovo = (range) => {
    Modal.open({
      title: "Lançar Influencer",
      html: `
        <div class="form-grid">
          <label>Nome<input id="inf-nome"/></label>
          <label>Telefone<input id="inf-tel"/></label>
          <label>Cupom<input id="inf-cupom"/></label>
          <label>Vendas<input id="inf-vendas" type="number" min="0"/></label>
          <label>Comissão (R$)<input id="inf-comissao" type="number" min="0" step="0.01"/></label>
          <label>Data<input id="inf-data" type="date" value="${toISODate(
            new Date()
          )}"/></label>
        </div>
      `,
      footerHtml: `
        <button class="action-button" id="inf-save">Salvar</button>
        <button class="action-button btn-ghost" id="inf-cancel">Cancelar</button>
      `,
    });
    $("#inf-cancel").onclick = Modal.close;
    $("#inf-save").onclick = () => {
      const it = {
        nome: $("#inf-nome").value || "Influencer",
        tel: $("#inf-tel").value || "",
        cupom: $("#inf-cupom").value || "",
        vendas: parseInt($("#inf-vendas").value || "0", 10),
        comissao: parseFloat($("#inf-comissao").value || "0"),
        data: $("#inf-data").value || toISODate(new Date()),
      };
      DataStore.addInflu(it);
      Modal.close();
      apply(range);
    };
  };

  const init = (range) => {
    apply(range);
    search.addEventListener("input", () => apply(range));
    btnAdd.onclick = () => openNovo(range);
  };

  return { init, apply };
})();

/* ---------- Emails (métricas + modal com corpo) ---------- */
const Emails = (() => {
  const tbody = $("#tabela-emails tbody");
  const pag = $("#pag-emails");
  const search = $("#search-emails");
  const btnNew = $("#btnNovoEmail");
  const summary = $("#emails-summary");
  const PAGE_SIZE = 8;
  const state = { page: 1, rows: [] };

  const renderSummary = (rows) => {
    const enviados = rows.filter((r) => r.status === "Enviado").length;
    const agendados = rows.filter((r) => r.status === "Agendado").length; // pendentes
    const erros = rows.filter((r) => r.status === "Erro").length;
    summary.innerHTML = `
      <div class="metric-card"><div class="label">Pendentes</div><div class="value">${agendados}</div></div>
      <div class="metric-card"><div class="label">Erros</div><div class="value">${erros}</div></div>
      <div class="metric-card"><div class="label">Enviados</div><div class="value">${enviados}</div></div>
    `;
  };

  const renderTable = (rows) => {
    const start = (state.page - 1) * PAGE_SIZE;
    const pageRows = rows.slice(start, start + PAGE_SIZE);
    tbody.innerHTML = pageRows
      .map(
        (r) => `
      <tr>
        <td>${r.para}</td>
        <td>${r.assunto}</td>
        <td>${r.status}</td>
        <td>${r.data}</td>
      </tr>`
      )
      .join("");

    state.total = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    pag.innerHTML = `
      <button class="action-button btn-ghost" ${state.page === 1 ? "disabled" : ""} id="em-prev">Anterior</button>
      <span class="muted">Página ${state.page} de ${state.total}</span>
      <button class="action-button btn-ghost" ${
        state.page === state.total ? "disabled" : ""
      } id="em-next">Próxima</button>
    `;
    $("#em-prev")?.addEventListener("click", () => {
      state.page = Math.max(1, state.page - 1);
      renderTable(state.rows);
    });
    $("#em-next")?.addEventListener("click", () => {
      state.page = Math.min(state.total, state.page + 1);
      renderTable(state.rows);
    });
  };

  const apply = (range) => {
    const all = DataStore.getEmails(range.start, range.end);
    const term = search.value.trim().toLowerCase();
    const rows = all.filter(
      (r) =>
        !term ||
        r.para.toLowerCase().includes(term) ||
        r.assunto.toLowerCase().includes(term)
    );
    state.page = 1;
    state.rows = rows;
    renderSummary(rows);
    renderTable(rows);
  };

  const openNovo = (range) => {
    Modal.open({
      title: "Novo Disparo",
      html: `
        <div class="form-grid">
          <label>Para<input id="mail-para"/></label>
          <label>Assunto<input id="mail-assunto"/></label>
          <label>Status
            <select id="mail-status">
              <option>Enviado</option><option>Agendado</option><option>Erro</option>
            </select>
          </label>
          <label>Data<input type="date" id="mail-data" value="${toISODate(
            new Date()
          )}"/></label>
          <label style="grid-column: 1 / -1;">Corpo da mensagem
            <textarea id="mail-corpo" rows="5" style="width:100%;resize:vertical"></textarea>
          </label>
        </div>`,
      footerHtml: `
        <button class="action-button" id="mail-save">Salvar</button>
        <button class="action-button btn-ghost" id="mail-cancel">Cancelar</button>
      `,
    });
    $("#mail-cancel").onclick = Modal.close;
    $("#mail-save").onclick = () => {
      const rec = {
        para: $("#mail-para").value || "cliente@mail.com",
        assunto: $("#mail-assunto").value || "Assunto",
        status: $("#mail-status").value || "Enviado",
        data: $("#mail-data").value || toISODate(new Date()),
        corpo: $("#mail-corpo").value || "",
      };
      DataStore.addEmail(rec);
      Modal.close();
      apply(range);
    };
  };

  const init = (range) => {
    apply(range);
    search.addEventListener("input", () => apply(range));
    btnNew.onclick = () => openNovo(range);
  };

  return { init, apply };
})();

/* ---------- Produtos (miniatura + custo + modal estendido) ---------- */
const Produtos = (() => {
  const tbody = $("#tabela-produtos tbody");
  const pag = $("#pag-produtos");
  const search = $("#search-produtos");
  const btnNew = $("#btnNovoProduto");
  const PAGE_SIZE = 10;
  const state = { page: 1, rows: [] };

  const renderTable = (rows) => {
    const start = (state.page - 1) * PAGE_SIZE;
    const pageRows = rows.slice(start, start + PAGE_SIZE);
    tbody.innerHTML = pageRows
      .map((p) => {
        const img = p.imagem || PLACEHOLDER_IMG;
        return `
      <tr>
        <td><img src="${img}" alt="img ${p.sku}" class="thumb" width="40" height="40" loading="lazy"/></td>
        <td>${p.sku}</td>
        <td>${p.nome}</td>
        <td>${p.categoria}</td>
        <td>${fmtBRL(p.custo ?? 0)}</td>
        <td>${fmtBRL(p.preco)}</td>
        <td>${p.status}</td>
      </tr>`;
      })
      .join("");

    state.total = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    pag.innerHTML = `
      <button class="action-button btn-ghost" ${state.page === 1 ? "disabled" : ""} id="pr-prev">Anterior</button>
      <span class="muted">Página ${state.page} de ${state.total}</span>
      <button class="action-button btn-ghost" ${
        state.page === state.total ? "disabled" : ""
      } id="pr-next">Próxima</button>
    `;
    $("#pr-prev")?.addEventListener("click", () => {
      state.page = Math.max(1, state.page - 1);
      renderTable(state.rows);
    });
    $("#pr-next")?.addEventListener("click", () => {
      state.page = Math.min(state.total, state.page + 1);
      renderTable(state.rows);
    });
  };

  const apply = (range) => {
    const all = DataStore.getProdutos(range.start, range.end);
    const term = search.value.trim().toLowerCase();
    const rows = all.filter(
      (r) =>
        !term ||
        r.nome.toLowerCase().includes(term) ||
        r.sku.toLowerCase().includes(term) ||
        r.categoria.toLowerCase().includes(term)
    );
    state.page = 1;
    state.rows = rows;
    renderTable(rows);
  };

  const openNovo = (range) => {
    Modal.open({
      title: "Novo Produto",
      html: `
        <div class="form-grid">
          <label>SKU<input id="prod-sku"/></label>
          <label>Nome<input id="prod-nome"/></label>
          <label>Categoria<input id="prod-cat"/></label>
          <label>Preço (R$)<input id="prod-preco" type="number" step="0.01"/></label>
          <label>Custo (R$)<input id="prod-custo" type="number" step="0.01"/></label>
          <label>Imagem (URL)<input id="prod-img" placeholder="https://..."/></label>
          <label>Status
            <select id="prod-status"><option>Ativo</option><option>Inativo</option></select>
          </label>
          <label>Data<input id="prod-data" type="date" value="${toISODate(new Date())}"/></label>
        </div>
      `,
      footerHtml: `
        <button class="action-button" id="prod-save">Salvar</button>
        <button class="action-button btn-ghost" id="prod-cancel">Cancelar</button>
      `,
    });
    $("#prod-cancel").onclick = Modal.close;
    $("#prod-save").onclick = () => {
      const p = {
        sku: $("#prod-sku").value || "SKU-" + uid().toUpperCase(),
        nome: $("#prod-nome").value || "Produto",
        categoria: $("#prod-cat").value || "Geral",
        preco: parseFloat($("#prod-preco").value || "0"),
        custo: parseFloat($("#prod-custo").value || "0"),
        imagem: $("#prod-img").value || "",
        status: $("#prod-status").value || "Ativo",
        data: $("#prod-data").value || toISODate(new Date()),
      };
      DataStore.addProduto(p);
      Modal.close();
      apply(range);
    };
  };

  const init = (range) => {
    apply(range);
    search.addEventListener("input", () => apply(range));
    btnNew.onclick = () => openNovo(range);
  };

  return { init, apply };
})();

/* ---------- Estoque (miniatura + custo total) ---------- */
const Estoque = (() => {
  const tbody = $("#tabela-estoque tbody");
  const pag = $("#pag-estoque");
  const search = $("#search-estoque");
  const btnIn = $("#btnEntradaEstoque");
  const btnOut = $("#btnSaidaEstoque");
  const btnAdj = $("#btnAjusteEstoque");
  const kpisWrap = $("#estoque-kpis");
  const PAGE_SIZE = 10;
  const state = { page: 1, rows: [] };

  const renderKPIs = (rows) => {
    const totalItens = rows.reduce((s, r) => s + r.estoque, 0);
    const abaixoMin = rows.filter((r) => r.estoque < r.minimo).length;
    const distintos = new Set(rows.map((r) => r.sku)).size;

    // custo total do estoque = sum(qtd * custoUnit)
    const custoTotal = rows.reduce((s, r) => {
      const prod = DataStore.getProdutoBySku(r.sku);
      const custoUnit = prod?.custo ? Number(prod.custo) : 0;
      return s + r.estoque * custoUnit;
    }, 0);

    kpisWrap.innerHTML = `
      <div class="metric-card"><div class="label">Itens em Estoque</div><div class="value">${totalItens}</div></div>
      <div class="metric-card"><div class="label">SKUs Abaixo do Mín.</div><div class="value">${abaixoMin}</div></div>
      <div class="metric-card"><div class="label">SKUs Distintos</div><div class="value">${distintos}</div></div>
      <div class="metric-card"><div class="label">Custo Total do Estoque</div><div class="value">${fmtBRL(custoTotal)}</div></div>
    `;
  };

  const renderTable = (rows) => {
    const start = (state.page - 1) * PAGE_SIZE;
    const pageRows = rows.slice(start, start + PAGE_SIZE);
    tbody.innerHTML = pageRows
      .map((r) => {
        const prod = DataStore.getProdutoBySku(r.sku);
        const img = r.imagem || prod?.imagem || PLACEHOLDER_IMG;
        return `
      <tr>
        <td><img src="${img}" alt="img ${r.sku}" class="thumb" width="40" height="40" loading="lazy"/></td>
        <td>${r.sku}</td>
        <td>${r.produto}</td>
        <td>${r.local}</td>
        <td>${r.estoque}</td>
        <td>${r.minimo}</td>
      </tr>`;
      })
      .join("");

    state.total = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    pag.innerHTML = `
      <button class="action-button btn-ghost" ${state.page === 1 ? "disabled" : ""} id="es-prev">Anterior</button>
      <span class="muted">Página ${state.page} de ${state.total}</span>
      <button class="action-button btn-ghost" ${
        state.page === state.total ? "disabled" : ""
      } id="es-next">Próxima</button>
    `;
    $("#es-prev")?.addEventListener("click", () => {
      state.page = Math.max(1, state.page - 1);
      renderTable(state.rows);
    });
    $("#es-next")?.addEventListener("click", () => {
      state.page = Math.min(state.total, state.page + 1);
      renderTable(state.rows);
    });
  };

  const apply = (range) => {
    const all = DataStore.getEstoque(range.start, range.end);
    const term = search.value.trim().toLowerCase();
    const rows = all.filter(
      (r) =>
        !term ||
        r.sku.toLowerCase().includes(term) ||
        r.produto.toLowerCase().includes(term) ||
        r.local.toLowerCase().includes(term)
    );
    state.page = 1;
    state.rows = rows;
    renderKPIs(rows);
    renderTable(rows);
  };

  const promptMov = (type, range) => {
    Modal.open({
      title:
        type === "entrada"
          ? "Entrada de Estoque"
          : type === "saida"
          ? "Saída de Estoque"
          : "Ajuste de Estoque",
      html: `
        <div class="form-grid">
          <label>SKU<input id="mv-sku"/></label>
          <label>Local<input id="mv-local"/></label>
          <label>Quantidade<input id="mv-qtd" type="number"/></label>
        </div>
      `,
      footerHtml: `
        <button class="action-button" id="mv-save">Salvar</button>
        <button class="action-button btn-ghost" id="mv-cancel">Cancelar</button>
      `,
    });
    $("#mv-cancel").onclick = Modal.close;
    $("#mv-save").onclick = () => {
      const sku = $("#mv-sku").value || "SKU-" + uid().toUpperCase();
      const local = $("#mv-local").value || "CD-Matriz";
      let qtd = parseInt($("#mv-qtd").value || "0", 10);
      if (type === "saida") qtd = -Math.abs(qtd);
      DataStore.addMovEstoque(sku, qtd, local);
      Modal.close();
      apply(range);
    };
  };

  const init = (range) => {
    apply(range);
    search.addEventListener("input", () => apply(range));
    btnIn.onclick = () => promptMov("entrada", range);
    btnOut.onclick = () => promptMov("saida", range);
    btnAdj.onclick = () => promptMov("ajuste", range);
  };

  return { init, apply };
})();

/* ---------- Trocas / Devoluções (nova seção) ---------- */
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
    tbody.innerHTML = pageRows
      .map((r) => `
      <tr>
        <td>#${r.id}</td>
        <td>${r.tipo}</td>
        <td>#${r.pedido}</td>
        <td>${r.cliente}</td>
        <td>${r.produto} (${r.sku})</td>
        <td><img src="${r.imagem || PLACEHOLDER_IMG}" alt="img ${r.sku}" class="thumb" width="40" height="40" loading="lazy"/></td>
        <td>${r.motivo}</td>
        <td>${r.status}</td>
        <td>${r.data}</td>
        <td><button class="link" data-view="${r.id}">Detalhes</button></td>
      </tr>
    `).join("");

    // ações
    $$('button[data-view]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.view, 10);
        const reg = state.rows.find((x) => x.id === id);
        if (!reg) return;
        Modal.open({
          title: `Troca/Devolução #${reg.id}`,
          html: `
            <div class="form-grid">
              <label>Tipo<input value="${reg.tipo}" disabled/></label>
              <label>Pedido<input value="#${reg.pedido}" disabled/></label>
              <label>Cliente<input value="${reg.cliente}" disabled/></label>
              <label>SKU<input value="${reg.sku}" disabled/></label>
              <label style="grid-column:1/-1;">Produto<input value="${reg.produto}" disabled/></label>
              <label style="grid-column:1/-1;">Motivo<input value="${reg.motivo}" disabled/></label>
              <label>Status
                <select id="td-status">
                  ${["Solicitado","Em Análise","Aprovado","Concluído"].map(s=>`<option ${s===reg.status?'selected':''}>${s}</option>`).join("")}
                </select>
              </label>
              <label>Data<input value="${reg.data}" disabled/></label>
            </div>
          `,
          footerHtml: `
            <button class="action-button" id="td-save">Salvar</button>
            <button class="action-button btn-ghost" id="td-close">Fechar</button>
          `,
        });
        $("#td-close").onclick = Modal.close;
        $("#td-save").onclick = () => {
          reg.status = $("#td-status").value;
          Modal.close();
          renderTable(state.rows);
        };
      });
    });

    state.total = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    pag.innerHTML = `
      <button class="action-button btn-ghost" ${state.page === 1 ? "disabled" : ""} id="tr-prev">Anterior</button>
      <span class="muted">Página ${state.page} de ${state.total}</span>
      <button class="action-button btn-ghost" ${
        state.page === state.total ? "disabled" : ""
      } id="tr-next">Próxima</button>
    `;
    $("#tr-prev")?.addEventListener("click", () => {
      state.page = Math.max(1, state.page - 1);
      renderTable(state.rows);
    });
    $("#tr-next")?.addEventListener("click", () => {
      state.page = Math.min(state.total, state.page + 1);
      renderTable(state.rows);
    });
  };

  const apply = (range) => {
    const all = DataStore.getTrocas(range.start, range.end);
    const term = search.value.trim().toLowerCase();
    const rows = all.filter((r) => {
      if (!term) return true;
      return (
        String(r.pedido).includes(term) ||
        r.cliente.toLowerCase().includes(term) ||
        r.produto.toLowerCase().includes(term) ||
        r.sku.toLowerCase().includes(term) ||
        r.tipo.toLowerCase().includes(term) ||
        r.motivo.toLowerCase().includes(term) ||
        r.status.toLowerCase().includes(term)
      );
    });
    state.page = 1;
    state.rows = rows;
    renderTable(rows);
  };

  const openNovo = (range) => {
    Modal.open({
      title: "Novo Registro de Troca/Devolução",
      html: `
        <div class="form-grid">
          <label>Tipo
            <select id="td-tipo">
              <option>Troca</option><option>Devolução</option>
            </select>
          </label>
          <label>Pedido #<input id="td-pedido" type="number"/></label>
          <label>Cliente<input id="td-cliente"/></label>
          <label>SKU<input id="td-sku"/></label>
          <label>Produto<input id="td-prod"/></label>
          <label>Imagem (URL)<input id="td-img" placeholder="https://..."/></label>
          <label>Motivo<input id="td-motivo"/></label>
          <label>Status
            <select id="td-status-new">
              <option>Solicitado</option><option>Em Análise</option><option>Aprovado</option><option>Concluído</option>
            </select>
          </label>
          <label>Data<input id="td-data" type="date" value="${toISODate(new Date())}"/></label>
        </div>
      `,
      footerHtml: `
        <button class="action-button" id="td-save-new">Salvar</button>
        <button class="action-button btn-ghost" id="td-cancel">Cancelar</button>
      `,
    });
    $("#td-cancel").onclick = Modal.close;
    $("#td-save-new").onclick = () => {
      const rec = {
        tipo: $("#td-tipo").value,
        pedido: parseInt($("#td-pedido").value || "0", 10),
        cliente: $("#td-cliente").value || "Cliente",
        sku: $("#td-sku").value || "SKU-" + uid().toUpperCase(),
        produto: $("#td-prod").value || "Produto",
        imagem: $("#td-img").value || "",
        motivo: $("#td-motivo").value || "Outro",
        status: $("#td-status-new").value,
        data: $("#td-data").value || toISODate(new Date()),
      };
      DataStore.addTroca(rec);
      Modal.close();
      apply(range);
    };
  };

  const init = (range) => {
    apply(range);
    search.addEventListener("input", () => apply(range));
    btnNew.onclick = () => openNovo(range);
  };

  return { init, apply };
})();

/* ---------- Orquestrador de Filtros por Seção ---------- */
const Orchestrator = (() => {
  const sections = {
    dash: {
      filter: new DateFilter($("#dash-section"), {
        startInput: "#dash-start-date",
        endInput: "#dash-end-date",
      }),
      init: Dash.init,
    },
    pedidos: {
      filter: new DateFilter($("#pedidos-section"), {
        startInput: "#ped-start-date",
        endInput: "#ped-end-date",
      }),
      init: Pedidos.init,
    },
    financas: {
      filter: new DateFilter($("#financas-section"), {
        startInput: "#fin-start-date",
        endInput: "#fin-end-date",
      }),
      init: Financas.init,
    },
    rastreio: {
      filter: new DateFilter($("#rastreio-section"), {
        startInput: "#ras-start-date",
        endInput: "#ras-end-date",
      }),
      init: Rastreio.init,
    },
    influencers: {
      filter: new DateFilter($("#influencers-section"), {
        startInput: "#inf-start-date",
        endInput: "#inf-end-date",
      }),
      init: Influencers.init,
    },
    emails: {
      filter: new DateFilter($("#emails-section"), {
        startInput: "#mail-start-date",
        endInput: "#mail-end-date",
      }),
      init: Emails.init,
    },
    produtos: {
      filter: new DateFilter($("#produtos-section"), {
        startInput: "#prod-start-date",
        endInput: "#prod-end-date",
      }),
      init: Produtos.init,
    },
    estoque: {
      filter: new DateFilter($("#estoque-section"), {
        startInput: "#est-start-date",
        endInput: "#est-end-date",
      }),
      init: Estoque.init,
    },
    trocas: {
      filter: new DateFilter($("#trocas-section"), {
        startInput: "#trc-start-date",
        endInput: "#trc-end-date",
      }),
      init: Trocas.init,
    },
  };

  // Wire onChange -> re-render da respectiva seção
  Object.entries(sections).forEach(([key, { filter, init }]) => {
    filter.onChange((range) => init(range));
  });

  // Inicializa seção ativa (Dash)
  const startSection = "dash";
  const { filter, init } = sections[startSection];
  init(filter.getRange());

  // Ao trocar de menu, inicializa a seção com o range atual dela
  $$(".menu-item").forEach((mi) =>
    mi.addEventListener("click", () => {
      const key = mi.dataset.target;
      const s = sections[key];
      if (s) s.init(s.filter.getRange());
    })
  );

  return { sections };
})();

/* ---------- QoL: Teclas rápidas ---------- */
// r = refresh seção atual (recalcula com o mesmo range)
document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "r" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    const active = $(".section-container.active")?.id.replace("-section", "");
    const s = Orchestrator.sections[active];
    if (s) s.init(s.filter.getRange());
  }
});
