let userData      = {};
let produtosCache = [];
let usuariosCache = [];
let usuarioEditandoId = null;
let modoNovoUsuario   = false;

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
  await init();
});

async function init() {
  try {
    const res  = await fetch('/dashboard', { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) return window.location.href = '/login.html';
    userData = data;
    document.getElementById('topbar-loja').textContent    = data.idLoja || 'Admin';
    document.getElementById('idLojaDisplay').value        = data.idLoja || '';
    document.getElementById('stat-loja').textContent      = data.idLoja || '—';
    await Promise.all([carregarStats(), carregarProdutos(), carregarUsuarios()]);
  } catch {
    window.location.href = '/login.html';
  }
}

// ── NAVEGAÇÃO ──
function showPanel(id, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  const nomes = {
    'visao-geral': 'Visão Geral',
    lanchonete: 'Lanchonete',
    mesas: 'Mesas',
    produtos: 'Produtos',
    usuarios: 'Usuários'
  };
  document.getElementById('topbar-title').textContent = nomes[id] || id;
  if (btn) btn.classList.add('active');
}

// ── MODAL GENÉRICO ──
function fecharModal(id) {
  document.getElementById(id).classList.remove('open');
}

// ── STATS ──
async function carregarStats() {
  try {
    const [mesas, produtos] = await Promise.all([
      fetch('/mesas', { credentials: 'include' }).then(r => r.json()).catch(() => []),
      fetch('/products/lanches', { credentials: 'include' }).then(r => r.json()).catch(() => [])
    ]);
    document.getElementById('stat-mesas').textContent    = Array.isArray(mesas)    ? mesas.length    : '—';
    document.getElementById('stat-produtos').textContent = Array.isArray(produtos) ? produtos.length : '—';
  } catch {}
}

// ── LOGO ──
function previewLogo() {
  const file = document.getElementById('logoInput').files[0];
  if (!file) return;
  const img  = document.getElementById('previewLogo');
  const icon = document.getElementById('logo-placeholder');
  img.src = URL.createObjectURL(file);
  img.style.display  = 'block';
  icon.style.display = 'none';
}

// ── FORM INFO ──
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('formInfo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nomeLoja = document.getElementById('nomeLoja').value
    showToast('Informações salvas!');
  });

  // ── FORM MESAS ──
  document.getElementById('formMesas').addEventListener('submit', async (e) => {
    e.preventDefault();
    const qtyMesas = document.getElementById('qtdMesas').value;
    if (!qtyMesas) return showToast('Informe a quantidade.', 'error');
    try {
      await fetch('/admin/mesas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mesas: qtyMesas, idLoja: userData.idLoja })
      });
      showToast('Mesas salvas com sucesso!');
      carregarStats();
    } catch { showToast('Erro ao salvar mesas.', 'error'); }
  });
});

// ── PREVIEW MESAS ──
function previewMesas() {
  const qtd = parseInt(document.getElementById('qtdMesas').value) || 0;
  const container = document.getElementById('mesasContainer');
  container.innerHTML = '';
  for (let i = 1; i <= Math.min(qtd, 50); i++) {
    const el = document.createElement('div');
    el.className = 'mesa-mini';
    el.innerHTML = `<span>${i}</span><small>mesa</small>`;
    container.appendChild(el);
  }
  if (qtd > 50) {
    const el = document.createElement('div');
    el.className = 'mesa-mini';
    el.innerHTML = `<span style="font-size:14px">+${qtd - 50}</span>`;
    container.appendChild(el);
  }
}

// ────────────────────────────────────────────
// ── PRODUTOS
// ────────────────────────────────────────────

async function carregarProdutos() {
  try {
    const categorias = ['lanches', 'porcoes', 'bebidas', 'sobremesas'];
    const resultados = await Promise.all(
      categorias.map(c =>
        fetch(`/products/${c}`, { credentials: 'include' }).then(r => r.json()).catch(() => [])
      )
    );
    produtosCache = resultados.flat();
    renderProdutos(produtosCache);
  } catch { console.error('Erro ao carregar produtos'); }
}

function renderProdutos(lista) {
  const tbody = document.getElementById('produtos-tbody');
  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--texto-muted);padding:32px">Nenhum produto encontrado.</td></tr>`;
    return;
  }
  tbody.innerHTML = lista.map(p => `
    <tr>
      <td>
        ${p.img
          ? `<img style="width:44px;height:44px;object-fit:cover;border-radius:8px;border:1.5px solid var(--card-border)" src="/uploads/${p.img}" onerror="this.style.display='none'">`
          : `<div style="width:44px;height:44px;background:var(--card-bg2);border-radius:8px;border:1.5px solid var(--card-border);display:flex;align-items:center;justify-content:center;font-size:18px">🍔</div>`}
      </td>
      <td>
        <div style="font-weight:600">${p.nome || '—'}</div>
        <div style="font-size:12px;color:var(--texto-muted)">${(p.descricao || '').substring(0,50)}${(p.descricao || '').length > 50 ? '...' : ''}</div>
      </td>
      <td><span class="badge badge-${p.categoria}">${p.categoria || '—'}</span></td>
      <td style="color:var(--verde);font-weight:600">R$ ${parseFloat(p.preco || 0).toFixed(2)}</td>
      <td>
        <button class="btn-table" onclick="abrirEdicaoProduto(${p.id})">✏️ Editar</button>
        <button class="btn-table" style="color:var(--vermelho)" onclick="deletarProduto(${p.id})">🗑</button>
      </td>
    </tr>
  `).join('');
}

function abrirEdicaoProduto(id) {
  const p = produtosCache.find(x => x.id === id);
  if (!p) return;
  document.getElementById('edit-id').value         = p.id;
  document.getElementById('edit-nome').value       = p.nome || '';
  document.getElementById('edit-preco').value      = p.preco || '';
  document.getElementById('edit-descricao').value  = p.descricao || '';
  document.getElementById('edit-categoria').value  = p.categoria || 'lanches';
  const lista = document.getElementById('edit-extras-lista');
  lista.innerHTML = '';
  try {
    const extras = JSON.parse(p.extras || '[]');
    extras.forEach(ex => adicionarExtraModal(ex.nome, ex.preco));
  } catch {}
  document.getElementById('modal-produto').classList.add('open');
}

function adicionarExtraModal(nome = '', preco = '') {
  const lista = document.getElementById('edit-extras-lista');
  const div = document.createElement('div');
  div.className = 'linha-extra';
  div.innerHTML = `
    <input type="text"   class="extra-nome"  placeholder="Ex: Ovo" value="${nome}">
    <input type="number" class="extra-preco" step="0.01" placeholder="R$" value="${preco}">
    <button type="button" class="btn-remove-extra" onclick="this.parentElement.remove()">✕</button>
  `;
  lista.appendChild(div);
}

async function salvarEdicao() {
  const id        = document.getElementById('edit-id').value;
  const nome      = document.getElementById('edit-nome').value.trim();
  const preco     = document.getElementById('edit-preco').value;
  const descricao = document.getElementById('edit-descricao').value.trim();
  const categoria = document.getElementById('edit-categoria').value;

  const extras = [];
  document.querySelectorAll('#edit-extras-lista .extra-nome').forEach((input, i) => {
    const n = input.value.trim();
    const p = parseFloat(document.querySelectorAll('#edit-extras-lista .extra-preco')[i].value);
    if (n) extras.push({ nome: n, preco: isNaN(p) ? 0 : p });
  });

  try {
    const res = await fetch(`/produto/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ nome, preco, descricao, categoria, extras: JSON.stringify(extras) })
    });
    if (res.ok) { showToast('Produto atualizado!'); fecharModal('modal-produto'); carregarProdutos(); }
    else showToast('Erro ao salvar.', 'error');
  } catch { showToast('Erro de conexão.', 'error'); }
}

async function deletarProduto(id) {
  if (!confirm('Tem certeza que deseja deletar este produto?')) return;
  try {
    const res = await fetch(`/produto/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) { showToast('Produto deletado.'); carregarProdutos(); }
    else showToast('Erro ao deletar.', 'error');
  } catch { showToast('Erro de conexão.', 'error'); }
}

// ────────────────────────────────────────────
// ── USUÁRIOS
// ────────────────────────────────────────────

async function carregarUsuarios() {
  try {
    const res  = await fetch('/admin/usuarios', { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) return;
    usuariosCache = data;
    atualizarStatsUsuarios(data);
    renderUsuarios(data);
    document.getElementById('stat-usuarios').textContent = data.length;
  } catch {}
}

function atualizarStatsUsuarios(lista) {
  const admins = lista.filter(u => u.role === 'admin').length;
  const comuns = lista.filter(u => u.role !== 'admin').length;
  document.getElementById('stat-total-usuarios').textContent = lista.length;
  document.getElementById('stat-admins').textContent         = admins;
  document.getElementById('stat-users-comuns').textContent   = comuns;
}

function renderUsuarios(lista) {
  const tbody = document.getElementById('usuarios-tbody');
  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--texto-muted);padding:32px;font-style:italic">Nenhum usuário encontrado.</td></tr>`;
    return;
  }
  tbody.innerHTML = lista.map(u => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:38px;height:38px;border-radius:10px;background:var(--card-bg2);border:1.5px solid var(--card-border);display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--amarelo);flex-shrink:0">
            ${(u.user || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-weight:600;font-size:14px">${u.user || '—'}</div>
            <div style="font-size:11px;color:var(--texto-muted)">#${u.id}</div>
          </div>
        </div>
      </td>
      <td style="color:var(--texto-muted)">${u.email || '—'}</td>
      <td style="color:var(--texto-muted)">${u.idLoja || '—'}</td>
      <td>${roleBadge(u.role)}</td>
      <td>
        <button class="btn-table" onclick="abrirEdicaoUsuario(${u.id})">✏️ Editar</button>
      </td>
    </tr>
  `).join('');
}

function roleBadge(role) {
  const mapa = {
    admin:   { label: '🛡️ Admin',    cls: 'role-admin'   },
    user:    { label: '👤 User',      cls: 'role-user'    },
    cozinha: { label: '👨‍🍳 Cozinha',  cls: 'role-cozinha' },
    caixa:   { label: '💰 Caixa',     cls: 'role-caixa'   },
  };
  const r = mapa[role] || { label: role || '—', cls: 'role-user' };
  return `<span class="role-badge ${r.cls}">${r.label}</span>`;
}

function filtrarUsuarios() {
  const busca = (document.getElementById('search-usuarios').value || '').toLowerCase();
  const role  = document.getElementById('filtro-role').value;
  const filtrados = usuariosCache.filter(u => {
    const bateTexto = !busca ||
      (u.user  || '').toLowerCase().includes(busca) ||
      (u.email || '').toLowerCase().includes(busca);
    const bateRole = !role || u.role === role;
    return bateTexto && bateRole;
  });
  renderUsuarios(filtrados);
}

function abrirEdicaoUsuario(id) {
  const u = usuariosCache.find(x => x.id === id);
  if (!u) return;
  modoNovoUsuario   = false;
  usuarioEditandoId = id;
  document.getElementById('modal-usuario-titulo').textContent    = 'Editar Usuário';
  document.getElementById('edit-usuario-id').value               = u.id;
  document.getElementById('edit-user').value                     = u.user    || '';
  document.getElementById('edit-email').value                    = u.email   || '';
  document.getElementById('edit-role').value                     = u.role    || 'user';
  document.getElementById('edit-usuario-idLoja').value           = u.idLoja  || '';
  document.getElementById('edit-senha').value                    = '';
  document.getElementById('btn-deletar-usuario').style.display   = 'inline-flex';
  document.getElementById('modal-usuario').classList.add('open');
}

function abrirModalNovoUsuario() {
  modoNovoUsuario   = true;
  usuarioEditandoId = null;
  document.getElementById('modal-usuario-titulo').textContent    = 'Novo Usuário';
  document.getElementById('edit-usuario-id').value               = '';
  document.getElementById('edit-user').value                     = '';
  document.getElementById('edit-email').value                    = '';
  document.getElementById('edit-role').value                     = 'user';
  document.getElementById('edit-usuario-idLoja').value           = '';
  document.getElementById('edit-senha').value                    = '';
  document.getElementById('btn-deletar-usuario').style.display   = 'none';
  document.getElementById('modal-usuario').classList.add('open');
}

async function salvarUsuario() {
  const user   = document.getElementById('edit-user').value.trim().toLowerCase();
  const email  = document.getElementById('edit-email').value.trim().toLowerCase();
  const role   = document.getElementById('edit-role').value;
  const idLoja = document.getElementById('edit-usuario-idLoja').value.trim().toLowerCase();
  const senha  = document.getElementById('edit-senha').value;

  if (!user || !email) return showToast('Nome e email são obrigatórios.', 'error');
  if (modoNovoUsuario && !senha) return showToast('Informe uma senha para o novo usuário.', 'error');

  const payload = { user, email, role, idLoja };
  if (senha) payload.senha = senha;

  try {
    const url    = modoNovoUsuario ? '/admin/usuarios' : `/admin/usuarios/${usuarioEditandoId}`;
    const method = modoNovoUsuario ? 'POST' : 'PUT';
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      showToast(modoNovoUsuario ? 'Usuário criado!' : 'Usuário atualizado!');
      fecharModal('modal-usuario');
      await carregarUsuarios();
    } else {
      showToast(data.message || 'Erro ao salvar.', 'error');
    }
  } catch { showToast('Erro de conexão.', 'error'); }
}

function confirmarDeleteUsuario() {
  const u = usuariosCache.find(x => x.id === usuarioEditandoId);
  document.getElementById('confirm-usuario-nome').textContent = u ? `"${u.user}"` : 'este usuário';
  document.getElementById('modal-confirm-usuario').classList.add('open');
}

async function executarDeleteUsuario() {
  try {
    const res = await fetch(`/admin/usuarios/${usuarioEditandoId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (res.ok) {
      showToast('Usuário deletado.');
      fecharModal('modal-confirm-usuario');
      fecharModal('modal-usuario');
      await carregarUsuarios();
    } else {
      showToast('Erro ao deletar.', 'error');
    }
  } catch { showToast('Erro de conexão.', 'error'); }
}

// ── TOAST ──
function showToast(msg, tipo = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${tipo} show`;
  setTimeout(() => t.className = 'toast', 3000);
}