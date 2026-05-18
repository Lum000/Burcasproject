
let diasFiltro    = 7;
let dadosCache    = [];
let dadosFiltrado = [];

const CORES_CATEGORIA = {
  lanches:    { cor: '#FFD400', label: '🍔 Lanches'    },
  porcoes:    { cor: '#00c97a', label: '🍟 Porções'    },
  bebidas:    { cor: '#378ADD', label: '🥤 Bebidas'    },
  sobremesas: { cor: '#a855f7', label: '🍰 Sobremesas' },
};

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
  await verificarAuth();
  await carregarRelatorio();
  await carregarLogs()
});
async function carregarLogs(){

    try{

        const req = await fetch(`/logs/${diasFiltro}`)

        const logs = await req.json()

        renderLogs(logs)

    }
    catch(err){

        console.log(err)

    }

}
function renderLogs(logs){

    const tbody = document.getElementById('logsBody')

    if(!logs.length){

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-row">
                    Nenhum log encontrado
                </td>
            </tr>
        `

        return
    }

    tbody.innerHTML = logs.map(log=>{

        const data = new Date(log.data)

        return `
            <tr>

                <td>
                    ${log.usuario || 'Sistema'}
                </td>

                <td>
                    <span class="log-badge">
                        ${log.acao}
                    </span>
                </td>

                <td>
                    ${log.detalhes || '-'}
                </td>

                <td>
                    ${log.mesa_id || '-'}
                </td>

                <td class="log-valor">
                    ${
                        Number(log.valor) > 0
                        ?
                        `R$ ${Number(log.valor).toFixed(2)}`
                        :
                        '-'
                    }
                </td>

                <td class="log-data">
                    ${data.toLocaleString('pt-BR')}
                </td>

            </tr>
        `

    }).join('')
}

async function verificarAuth() {
  try {
    const res  = await fetch('/dashboard', { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) return window.location.href = '/login.html';
    document.getElementById('topbar-loja').textContent = data.idLoja || '—';
    if(data.role != 'admin'){
        return window.location.href = '/index.html'
    }
  } catch {
    window.location.href = '/login.html';
  }
}

// ── CARREGAR DADOS ──
async function carregarRelatorio() {
  try {
    const res  = await fetch(`/historico-filtrado/${diasFiltro}`, { credentials: 'include' });
    const data = await res.json();

    if (!Array.isArray(data)) return;

    // busca nome/categoria de cada produto
    const produtosMap = await buscarProdutos(data);

    // monta os dados enriquecidos
    dadosCache = data.map(p => ({
      ...p,
      nomeProduto: produtosMap[p.produto_id]?.nome      || 'Produto #' + p.produto_id,
      categoria:   produtosMap[p.produto_id]?.categoria || 'outros',
      precoProduto:produtosMap[p.produto_id]?.preco     || p.preco || 0,
    }));

    dadosFiltrado = [...dadosCache];

    renderTudo();
  } catch (err) {
    console.error('Erro ao carregar relatório:', err);
  }
}

async function buscarProdutos(pedidos) {
  const ids = [...new Set(pedidos.map(p => p.produto_id))];
  const map = {};

  await Promise.all(ids.map(async id => {
    try {
      const res  = await fetch(`/getprodutobody/${id}`);
      const data = await res.json();
      if (data) map[id] = data;
    } catch {}
  }));

  return map;
}

// ── RENDER TUDO ──
function renderTudo() {
  const resumo = calcularResumo(dadosFiltrado);
  renderStats(resumo);
  renderRanking(resumo.ranking);
  renderCategorias(resumo.categorias, resumo.totalReceita);
  renderHistorico(dadosFiltrado);
  renderTabela(resumo.ranking, resumo.totalReceita);
}

// ── CALCULAR RESUMO ──
function calcularResumo(lista) {
  const prodMap  = {};
  const catMap   = {};
  let totalReceita = 0;
  let totalItens   = 0;

  lista.forEach(p => {
    const preco    = parseFloat(p.preco || p.precoProduto || 0);
    const qtd      = parseInt(p.quantidade || 1);
    const receita  = preco * qtd;
    const nome     = p.nomeProduto || 'Produto';
    const cat      = p.categoria || 'outros';

    totalReceita += receita;
    totalItens   += qtd;

    // por produto
    if (!prodMap[p.produto_id]) {
      prodMap[p.produto_id] = { id: p.produto_id, nome, categoria: cat, qtd: 0, receita: 0 };
    }
    prodMap[p.produto_id].qtd     += qtd;
    prodMap[p.produto_id].receita += receita;

    // por categoria
    if (!catMap[cat]) catMap[cat] = { qtd: 0, receita: 0 };
    catMap[cat].qtd     += qtd;
    catMap[cat].receita += receita;
  });

  const ranking = Object.values(prodMap).sort((a, b) => b.qtd - a.qtd);

  return {
    totalReceita,
    totalItens,
    totalPedidos: lista.length,
    ticketMedio: lista.length > 0 ? totalReceita / lista.length : 0,
    ranking,
    categorias: catMap,
  };
}

// ── STATS ──
function renderStats(resumo) {
  document.getElementById('stat-faturamento').textContent     = `R$ ${resumo.totalReceita.toFixed(2)}`;
  document.getElementById('stat-pedidos').textContent         = resumo.totalPedidos;
  document.getElementById('stat-itens').textContent           = resumo.totalItens;
  document.getElementById('stat-ticket').textContent          = `R$ ${resumo.ticketMedio.toFixed(2)}`;
  document.getElementById('stat-faturamento-sub').textContent = `últimos ${diasFiltro} dias`;
  document.getElementById('stat-pedidos-sub').textContent     = `últimos ${diasFiltro} dias`;
  document.getElementById('stat-itens-sub').textContent       = `${resumo.ranking.length} produtos`;
  document.getElementById('stat-ticket-sub').textContent      = `por pedido`;
}

// ── RANKING ──
function renderRanking(ranking) {
  const container = document.getElementById('rankingLista');
  const catFiltro = document.getElementById('filtro-categoria').value;
  const lista     = catFiltro ? ranking.filter(p => p.categoria === catFiltro) : ranking;
  const maxQtd    = lista[0]?.qtd || 1;

  if (!lista.length) {
    container.innerHTML = `<div style="text-align:center;color:var(--texto-muted);padding:32px;font-style:italic">Nenhum dado encontrado.</div>`;
    return;
  }

  container.innerHTML = lista.slice(0, 10).map((p, i) => {
    const pct     = Math.round((p.qtd / maxQtd) * 100);
    const posClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
    return `
      <div class="ranking-item">
        <span class="ranking-pos ${posClass}">${i + 1}</span>
        <div class="ranking-info">
          <div class="ranking-nome">${p.nome}</div>
          <div class="ranking-cat">${CORES_CATEGORIA[p.categoria]?.label || p.categoria}</div>
        </div>
        <div class="ranking-bar-wrap">
          <div class="ranking-bar" style="width:${pct}%"></div>
        </div>
        <span class="ranking-qtd">${p.qtd}x</span>
        <span class="ranking-receita">R$ ${p.receita.toFixed(2)}</span>
      </div>
    `;
  }).join('');
}

// ── CATEGORIAS ── 
function renderCategorias(catMap, totalReceita) {
  const container = document.getElementById('categoriasLista');
  const lista     = Object.entries(catMap).sort((a, b) => b[1].receita - a[1].receita);

  if (!lista.length) {
    container.innerHTML = `<div style="text-align:center;color:var(--texto-muted);padding:32px;font-style:italic">Sem dados.</div>`;
    return;
  }

  container.innerHTML = lista.map(([cat, dados]) => {
    const pct  = totalReceita > 0 ? ((dados.receita / totalReceita) * 100).toFixed(1) : 0;
    const info = CORES_CATEGORIA[cat] || { cor: '#888', label: cat };
    return `
      <div class="categoria-item">
        <div class="categoria-header">
          <div class="categoria-nome">
            <div class="categoria-dot" style="background:${info.cor}"></div>
            ${info.label}
          </div>
          <span class="categoria-valor">R$ ${dados.receita.toFixed(2)}</span>
        </div>
        <div class="categoria-bar-wrap">
          <div class="categoria-bar" style="width:${pct}%;background:${info.cor}"></div>
        </div>
        <div class="categoria-pct">${pct}% · ${dados.qtd} itens</div>
      </div>
    `;
  }).join('');
}

// ── HISTORICO CHART ──
function renderHistorico(lista) {
  const container = document.getElementById('historicoChart');

  // agrupa por dia
  const porDia = {};
  lista.forEach(p => {
    const dia    = (p.hora || '').substring(0, 10);
    const preco  = parseFloat(p.preco || 0);
    const qtd    = parseInt(p.quantidade || 1);
    if (!dia) return;
    if (!porDia[dia]) porDia[dia] = 0;
    porDia[dia] += preco * qtd;
  });

  const dias    = Object.keys(porDia).sort();
  const valores = dias.map(d => porDia[d]);
  const maxVal  = Math.max(...valores, 1);

  if (!dias.length) {
    container.innerHTML = `<div style="text-align:center;color:var(--texto-muted);padding:32px;font-style:italic">Sem dados para o período.</div>`;
    return;
  }

  const barras = dias.map((dia, i) => {
    const val    = valores[i];
    const altura = Math.max((val / maxVal) * 100, 2);
    const label  = dia.substring(5); // MM-DD
    return `
      <div class="chart-bar-wrap">
        <div class="chart-bar" style="height:${altura}%">
          <div class="chart-bar-tooltip">R$ ${val.toFixed(2)}</div>
        </div>
        <span class="chart-label">${label}</span>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="chart-bars">${barras}</div>`;
}

// ── TABELA ──
function renderTabela(ranking, totalReceita) {
  const tbody = document.getElementById('tabelaBody');
  document.getElementById('tabela-sub').textContent = `${ranking.length} produtos · últimos ${diasFiltro} dias`;

  if (!ranking.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">Nenhum dado encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = ranking.map((p, i) => {
    const pct = totalReceita > 0 ? ((p.receita / totalReceita) * 100).toFixed(1) : 0;
    return `
      <tr>
        <td style="color:var(--texto-muted);font-size:12px">${i + 1}</td>
        <td style="font-weight:600">${p.nome}</td>
        <td><span class="badge badge-${p.categoria}">${p.categoria}</span></td>
        <td style="font-weight:700;color:var(--amarelo)">${p.qtd}</td>
        <td style="font-weight:700;color:var(--verde)">R$ ${p.receita.toFixed(2)}</td>
        <td>
          <div class="pct-bar-wrap">
            <div class="pct-bar-bg">
              <div class="pct-bar" style="width:${pct}%"></div>
            </div>
            <span class="pct-text">${pct}%</span>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ── FILTROS ──
function setFiltro(dias, btn) {
  diasFiltro = dias;
  document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  carregarRelatorio();
}

function filtrarPorCategoria() {
  const resumo = calcularResumo(dadosFiltrado);
  renderRanking(resumo.ranking);
}

function filtrarTabela(busca) {
  const resumo  = calcularResumo(dadosFiltrado);
  const filtrado = resumo.ranking.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );
  renderTabelaDireta(filtrado, resumo.totalReceita);
}

function renderTabelaDireta(ranking, totalReceita) {
  const tbody = document.getElementById('tabelaBody');
  if (!ranking.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">Nenhum produto encontrado.</td></tr>`;
    return;
  }
  tbody.innerHTML = ranking.map((p, i) => {
    const pct = totalReceita > 0 ? ((p.receita / totalReceita) * 100).toFixed(1) : 0;
    return `
      <tr>
        <td style="color:var(--texto-muted);font-size:12px">${i + 1}</td>
        <td style="font-weight:600">${p.nome}</td>
        <td><span class="badge badge-${p.categoria}">${p.categoria}</span></td>
        <td style="font-weight:700;color:var(--amarelo)">${p.qtd}</td>
        <td style="font-weight:700;color:var(--verde)">R$ ${p.receita.toFixed(2)}</td>
        <td>
          <div class="pct-bar-wrap">
            <div class="pct-bar-bg">
              <div class="pct-bar" style="width:${pct}%"></div>
            </div>
            <span class="pct-text">${pct}%</span>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ── EXPORTAR CSV ──
function exportarCSV() {
  const resumo = calcularResumo(dadosFiltrado);
  const linhas = [
    ['#', 'Produto', 'Categoria', 'Quantidade', 'Receita (R$)', '% do Total'],
    ...resumo.ranking.map((p, i) => {
      const pct = resumo.totalReceita > 0
        ? ((p.receita / resumo.totalReceita) * 100).toFixed(1)
        : 0;
      return [i + 1, p.nome, p.categoria, p.qtd, p.receita.toFixed(2), `${pct}%`];
    })
  ];

  const csv     = linhas.map(l => l.join(',')).join('\n');
  const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url     = URL.createObjectURL(blob);
  const link    = document.createElement('a');
  link.href     = url;
  link.download = `relatorio_${diasFiltro}dias_${new Date().toISOString().substring(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ── SIDEBAR MOBILE ──
function toggleMenu() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}

// ── LOGOUT ──
async function logout() {
  await fetch('/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/login.html';
}