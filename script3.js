/* ---------- Produtos ---------- */
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
      .map(
        (p) => `
      <tr>
        <td>${p.sku}</td>
        <td>${p.nome}</td>
        <td>${p.categoria}</td>
        <td>${fmtBRL(p.preco)}</td>
        <td>${p.status}</td>
      </tr>`
      )
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

/* ---------- Estoque ---------- */
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
    kpisWrap.innerHTML = `
      <div class="metric-card"><div class="label">Itens em Estoque</div><div class="value">${totalItens}</div></div>
      <div class="metric-card"><div class="label">SKUs Abaixo do Mín.</div><div class="value">${abaixoMin}</div></div>
      <div class="metric-card"><div class="label">SKUs Distintos</div><div class="value">${distintos}</div></div>
    `;
  };

  const renderTable = (rows) => {
    const start = (state.page - 1) * PAGE_SIZE;
    const pageRows = rows.slice(start, start + PAGE_SIZE);
    tbody.innerHTML = pageRows
      .map(
        (r) => `
      <tr>
        <td>${r.sku}</td>
        <td>${r.produto}</td>
        <td>${r.local}</td>
        <td>${r.estoque}</td>
        <td>${r.minimo}</td>
      </tr>`
      )
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
