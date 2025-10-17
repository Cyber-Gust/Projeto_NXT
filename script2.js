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

/* ---------- Finanças (KPIs + Tabela de Custos + Modal) ---------- */
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
        // Remove custo
        // (para manter simples no mock, filtramos pela tabela atual)
        // Em real, teríamos método remove no DataStore
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
      // Recalcular visão
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

    // Paginação
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

/* ---------- Emails ---------- */
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
