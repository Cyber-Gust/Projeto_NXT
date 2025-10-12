document.addEventListener('DOMContentLoaded', () => {
    // ==========================
    // Utils
    // ==========================
    const brl = (n) => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const pct = (n) => `${Number(n).toFixed(1)}%`;
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
    const toISODateString = (date) => new Date(date).toISOString().split('T')[0];

    function toast(msg) {
        openModal('Aviso', `<p style="font-weight:bold">${msg}</p>`, [{ label: 'Ok' }]);
    }

    // ==========================
    // Modal Core
    // ==========================
    const overlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalFooter = document.getElementById('modal-footer');
    document.getElementById('modal-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    function openModal(title, html, actions = [{ label: 'Fechar', variant: 'ghost' }]) {
        modalTitle.textContent = title;
        modalContent.innerHTML = html;
        modalFooter.innerHTML = '';
        actions.forEach(a => {
            const btn = document.createElement('button');
            btn.className = `action-button ${a.variant || ''}`;
            btn.textContent = a.label;
            btn.addEventListener('click', () => {
                if (typeof a.onClick === 'function') a.onClick();
                if (!a.keepOpen) closeModal();
            });
            modalFooter.appendChild(btn);
        });
        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');
    }
    function closeModal() {
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
    }

    // ==========================
    // Estado (Dados)
    // ==========================
    const baseKPIs = { faturamento: 150450.22, custoProduto: 45135.00, frete: 12890.55, ads: 30500.00 };
    const PRODUTOS = ['Camisa NEXT', 'Tênis Running X', 'Meia Esportiva', 'Jaqueta Tech', 'Short Dry', 'Boné Logo', 'Garrafa Térmica', 'Mochila Training', 'Calça Jogger', 'Caneleira Pro'];
    const STATUS = ['Processando', 'Pago', 'Separando', 'Enviado', 'Em Trânsito', 'Entregue', 'Cancelado'];
    let pedidosMock = Array.from({ length: 300 }, (_, i) => ({ id: (1001 + i).toString(), produto: pick(PRODUTOS), status: pick(STATUS), rastreio: `NEXT${rand(10000, 99999)}${pick(['BR', 'EX', 'PR'])}`, valor: rand(80, 500), data: addDays(new Date(), rand(-60, 0)) }));
    const CATEGORIAS_CUSTO = ['Marketing', 'RH', 'Tecnologia', 'Financeiro', 'Admin', 'Logística', 'Fiscal', 'Utilidades'];
    let custosMock = [{id:1,nome:'Salários',categoria:'RH',valor:15000,data:new Date('2025-10-05')},{id:2,nome:'Plataformas',categoria:'Tecnologia',valor:1500,data:new Date('2025-10-10')},{id:3,nome:'Aluguel',categoria:'Admin',valor:9000,data:new Date('2025-10-05')},{id:4,nome:'Contabilidade',categoria:'Financeiro',valor:1800,data:new Date('2025-09-15')},{id:5,nome:'Marketing',categoria:'Marketing',valor:5000,data:new Date('2025-09-20')},{id:6,nome:'Embalagens',categoria:'Logística',valor:1800,data:new Date('2025-09-25')},{id:7,nome:'Impostos',categoria:'Fiscal',valor:12500,data:new Date('2025-09-28')},{id:8,nome:'Publicidade ADS',categoria:'Marketing',valor:30500,data:new Date('2025-10-01')}];
    let nextCustoId = 9;
    const TRANSP = ['Correios','Jadlog','Loggi','Sequoia','Azul Cargo'];
    const NAMES = ['João','Maria','Pedro','Ana','Lucas','Carla','Rafa','Beatriz','Paulo','Júlia'];
    let rastreioMock = Array.from({length:200}, ()=>({nome: `${pick(NAMES)} ${pick(['S.','A.','D.','M.'])}`, rastreio: `NEXT${rand(10000,99999)}BR`, transportadora: pick(TRANSP), data_chegada: addDays(new Date(), rand(-2,7)).toLocaleDateString('pt-BR'), status: pick(['Postado','Em Trânsito','Saiu para Entrega','Entregue'])}));
    let influencersMock = Array.from({length:50}, (_,i)=>({nome: `${pick(['Esporte Total','Fit Life','Run Club','Gym Lovers'])} ${i+1}`, tel: `(${rand(11,99)}) 9${rand(1000,9999)}-${rand(1000,9999)}`, cupom: pick(['ESPORTE','FIT','RUN'])+rand(5,25), vendas: rand(10,350), comissao: rand(500, 8000) }));
    
    // Estados para tabelas
    const influState = { all: [...influencersMock], filtered: [...influencersMock], page: 1, perPage: 10 };
    const rastreioState = { all: [...rastreioMock], filtered: [...rastreioMock], page: 1, perPage: 10 };

    // ==========================
    // Sidebar / Navegação
    // ==========================
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function () {
            document.querySelectorAll('.menu-item, .section-container').forEach(el => el.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(`${this.dataset.target}-section`).classList.add('active');
            document.getElementById('page-title').textContent = this.textContent;
            document.getElementById('sidebar').classList.remove('open');
        });
    });
    document.getElementById('burger').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));

    // ==========================
    // DASHBOARD
    // ==========================
    function renderKPIsDashboard() {
        const { faturamento, custoProduto, frete, ads } = baseKPIs;
        const totalCustosOperacionais = custosMock.reduce((total, custo) => total + custo.valor, 0);
        const margemLucro = faturamento - (custoProduto + frete + ads + totalCustosOperacionais);
        document.getElementById('kpi-grid').innerHTML = `
          <div class="metric-card"><h3>Faturamento</h3><p>${brl(faturamento)}</p><div class="kpi-sub">Total (Mês Fixo)</div></div>
          <div class="metric-card"><h3>Custo Produto</h3><p>${brl(custoProduto)}</p></div>
          <div class="metric-card"><h3>Custo Frete</h3><p>${brl(frete)}</p></div>
          <div class="metric-card"><h3>Custo Anúncio</h3><p>${brl(ads)}</p></div>
          <div class="metric-card"><h3>Custos Operacionais</h3><p>${brl(totalCustosOperacionais)}</p><div class="kpi-sub">Total Geral</div></div>
          <div class="metric-card"><h3>Margem de Lucro</h3><p class="${margemLucro >= 0 ? 'lucro-pos' : 'lucro-neg'}">${brl(margemLucro)}</p></div>`;
    }

    let chartInstance = null;
    function renderChart() {
        const ctx = document.getElementById('chartFatAds').getContext('2d');
        if (chartInstance) chartInstance.destroy();
        const labels = Array.from({ length: 30 }, (_, i) => addDays(new Date(), -29 + i).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
        chartInstance = new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: 'Faturamento', data: labels.map(() => rand(2500, 9000)), borderColor: '#000', tension: .4, fill: true }, { label: 'ADS', data: labels.map(() => rand(800, 3800)), borderColor: '#007bff', tension: .4, fill: true }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } } });
    }
    
    // ==========================
    // PEDIDOS (KANBAN)
    // ==========================
    function renderKanban() {
        const board = document.getElementById('kanban-board');
        board.innerHTML = STATUS.map(status => {
            const pedidosDaColuna = pedidosMock.filter(p => p.status === status);
            return `<div class="kanban-column" data-status="${status}">
                        <header><h3>${status}</h3><span class="badge warn">${pedidosDaColuna.length}</span></header>
                        <div class="kanban-cards">${pedidosDaColuna.map(p => `<div class="kanban-card" draggable="true" data-id="${p.id}"><strong>Pedido #${p.id}</strong><small>${p.produto}</small></div>`).join('')}</div>
                    </div>`;
        }).join('');
    }
    
    // ==========================
    // FINANÇAS
    // ==========================
    function renderFinancas() {
        const start = new Date(document.getElementById('fin-start-date').value + 'T00:00:00');
        const end = new Date(document.getElementById('fin-end-date').value + 'T23:59:59');
        const pedidosPeriodo = pedidosMock.filter(p => p.data >= start && p.data <= end);
        const custosPeriodo = custosMock.filter(c => c.data >= start && c.data <= end);
        const faturamento = pedidosPeriodo.reduce((sum, p) => sum + p.valor, 0);
        const custos = custosPeriodo.reduce((sum, c) => sum + c.valor, 0);
        const resultado = faturamento - custos;

        document.getElementById('financas-kpis').innerHTML = `<div class="metric-card"><h3>Faturamento</h3><p>${brl(faturamento)}</p></div> <div class="metric-card"><h3>Custos</h3><p>${brl(custos)}</p></div> <div class="metric-card"><h3>Resultado</h3><p class="${resultado >= 0 ? 'lucro-pos' : 'lucro-neg'}">${brl(resultado)}</p></div>`;
        document.getElementById('tbody-custos').innerHTML = custosPeriodo.sort((a,b) => b.data - a.data).map(c => `<tr><td>${c.nome}</td><td><span class="badge warn">${c.categoria}</span></td><td>${c.data.toLocaleDateString('pt-BR')}</td><td>${brl(c.valor)}</td><td><button class="action-button btn-err" onclick="window.app.deleteCusto(${c.id})">Excluir</button></td></tr>`).join('');
    }
    function openCustoModal() {
        openModal('Adicionar Custo', `
            <div class="form-group"><label for="c-nome">Nome</label><input id="c-nome"></div>
            <div class="form-group"><label for="c-cat">Categoria</label><select id="c-cat">${CATEGORIAS_CUSTO.map(c => `<option>${c}</option>`)}</select></div>
            <div class="form-group"><label for="c-data">Data</label><input type="date" id="c-data" value="${toISODateString(new Date())}"></div>
            <div class="form-group"><label for="c-valor">Valor (R$)</label><input type="number" id="c-valor"></div>`, 
            [{ label: 'Salvar', variant: 'btn-secondary', onClick: saveCusto }, { label: 'Cancelar' }]
        );
    }
    function saveCusto() {
        const nome = document.getElementById('c-nome').value, data = document.getElementById('c-data').value, valor = parseFloat(document.getElementById('c-valor').value);
        if (!nome || !data || isNaN(valor) || valor <= 0) return toast('Preencha todos os campos.');
        custosMock.push({ id: nextCustoId++, nome, categoria: document.getElementById('c-cat').value, valor, data: new Date(data + 'T00:00:00') });
        renderFinancas();
        renderKPIsDashboard();
        closeModal();
        toast('Custo adicionado!');
    }
    function deleteCusto(id) {
        custosMock = custosMock.filter(c => c.id !== id);
        renderFinancas();
        renderKPIsDashboard();
    }

    // ==========================
    // RASTREIO & INFLUENCERS (Tabelas com Paginação)
    // ==========================
    function renderPagination(containerId, state, renderFn) {
        const container = document.getElementById(containerId);
        const totalPages = Math.ceil(state.filtered.length / state.perPage);
        if (totalPages <= 1) { container.innerHTML = ''; return; }
        let buttons = '';
        for (let i = 1; i <= totalPages; i++) {
            buttons += `<button class="${i === state.page ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        container.innerHTML = buttons;
        container.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                state.page = parseInt(btn.dataset.page);
                renderFn();
            });
        });
    }

    function renderRastreio() {
        const tbody = document.querySelector('#tabela-rastreio-interno tbody');
        const start = (rastreioState.page - 1) * rastreioState.perPage;
        tbody.innerHTML = rastreioState.filtered.slice(start, start + rastreioState.perPage).map(item => `
            <tr><td>${item.nome}</td><td>${item.rastreio}</td><td>${item.transportadora}</td><td>${item.data_chegada}</td><td><span class="badge ok">${item.status}</span></td></tr>
        `).join('');
        renderPagination('pag-rastreio', rastreioState, renderRastreio);
    }

    function renderInfluencersSummary() {
        const top5 = [...influencersMock].sort((a,b) => b.vendas - a.vendas).slice(0,5);
        const total = influencersMock.reduce((s, i) => s + i.vendas, 0);
        document.getElementById('influencers-summary').innerHTML = top5.map((inf, i) => `
            <div class="metric-card"><h3>#${i+1} ${inf.nome}</h3><p>${inf.vendas} vendas</p><div class="kpi-sub">Cupom: <b>${inf.cupom}</b></div></div>`).join('') + 
            `<div class="metric-card"><h3>Total Vendas</h3><p>${total}</p><div class="kpi-sub">Todos os influencers</div></div>`;
    }
    function renderInflu() {
        const tbody = document.querySelector('#tabela-influencers tbody');
        const start = (influState.page - 1) * influState.perPage;
        tbody.innerHTML = influState.filtered.slice(start, start + influState.perPage).map(i => `
            <tr><td>${i.nome}</td><td>${i.tel}</td><td>${i.cupom}</td><td>${i.vendas}</td><td>${brl(i.comissao)}</td></tr>
        `).join('');
        renderPagination('pag-influencers', influState, renderInflu);
    }
    function openInfluencerModal() {
        openModal('Adicionar Lançamento de Influencer',`
            <div class="form-group"><label for="i-nome">Nome do Influencer</label><input id="i-nome" placeholder="Ex: Esporte Total 51"></div>
            <div class="form-group"><label for="i-cupom">Cupom</label><input id="i-cupom" placeholder="Ex: ESPORTE25"></div>
            <div class="form-group"><label for="i-vendas">Quantidade Vendida</label><input type="number" id="i-vendas" placeholder="Ex: 150"></div>
            <div class="form-group"><label for="i-valor">Valor Total da Comissão (R$)</label><input type="number" id="i-valor" step="0.01" placeholder="Ex: 2500.00"></div>`,
            [{ label: 'Salvar', variant: 'btn-secondary', onClick: saveInfluencer }, { label: 'Cancelar' }]
        );
    }
    function saveInfluencer() {
        const nome = document.getElementById('i-nome').value.trim();
        const cupom = document.getElementById('i-cupom').value.trim();
        const vendas = parseInt(document.getElementById('i-vendas').value, 10);
        const comissao = parseFloat(document.getElementById('i-valor').value);
        if (!nome || !cupom || isNaN(vendas) || vendas < 0 || isNaN(comissao) || comissao < 0) return toast('Preencha todos os campos corretamente.');
        
        const newInfluencer = { nome, cupom, vendas, comissao, tel: `(${rand(11,99)}) 9${rand(1000,9999)}-${rand(1000,9999)}` };
        influencersMock.push(newInfluencer);
        influState.all.push(newInfluencer);
        document.getElementById('search-influ').dispatchEvent(new Event('input')); // Re-aplica filtro
        renderInflu();
        renderInfluencersSummary();
        closeModal();
        toast('Lançamento de influencer adicionado!');
    }
    
    // ==========================
    // Inicialização (Boot)
    // ==========================
    function init() {
        // Finanças
        document.getElementById('fin-end-date').value = toISODateString(new Date());
        document.getElementById('fin-start-date').value = toISODateString(addDays(new Date(), -30));
        document.querySelectorAll('#fin-start-date, #fin-end-date').forEach(el => el.addEventListener('change', renderFinancas));
        document.getElementById('btnAdicionarCusto').addEventListener('click', openCustoModal);

        // Influencers
        document.getElementById('btnAdicionarInfluencer').addEventListener('click', openInfluencerModal);
        document.getElementById('search-influ').addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            influState.filtered = influState.all.filter(i => i.nome.toLowerCase().includes(term) || i.cupom.toLowerCase().includes(term));
            influState.page = 1;
            renderInflu();
        });
        
        // Rastreio
        document.getElementById('search-rastreio').addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            rastreioState.filtered = rastreioState.all.filter(i => i.nome.toLowerCase().includes(term) || i.rastreio.toLowerCase().includes(term) || i.transportadora.toLowerCase().includes(term));
            rastreioState.page = 1;
            renderRastreio();
        });

        // Renderizações iniciais
        renderKPIsDashboard();
        renderChart();
        renderKanban();
        renderFinancas();
        renderInfluencersSummary();
        renderInflu();
        renderRastreio();

        // Anexar funções globais
        window.app = { deleteCusto };
    }

    init();
});

