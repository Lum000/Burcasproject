let userData          = {};
let produtosCache     = [];
let usuariosCache     = [];
let usuarioEditandoId = null;
let modoNovoUsuario   = false;

/* ────────────────────────────────────────────
   HELPERS
   ──────────────────────────────────────────── */

// escapa texto antes de colocar em innerHTML (evita XSS)
function esc(t) {
  return String(t ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const IMAGENS_PADRAO = {
  lanches:    '/img/padrao/lanche.svg',
  porcoes:    '/img/padrao/porcao.svg',
  bebidas:    '/img/padrao/bebida.svg',
  sobremesas: '/img/padrao/sobremesa.svg',
  default:    '/img/padrao/produto.svg'
};

function imagemPadrao(categoria) {
  const k = String(categoria || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().toLowerCase();
  return IMAGENS_PADRAO[k] || IMAGENS_PADRAO.default;
}

function urlUpload(caminho) {
  if (!caminho) return '';
  return /^(\/|https?:)/.test(caminho) ? caminho : `/uploads/${caminho}`;
}

function showToast(msg, tipo = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${tipo} show`;
  setTimeout(() => (t.className = 'toast'), 3000);
}

/* ────────────────────────────────────────────
   INIT
   ──────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', async () => {
  ligarFormularios();
  await init();
});

async function init() {
  try {
    const res  = await fetch('/dashboard', { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) return (window.location.href = '/login.html');

    userData = data;

    const nome = data.nomeLoja || data.idLoja || 'Admin';
    document.getElementById('topbar-loja').textContent = nome;
    document.getElementById('stat-loja').textContent   = nome;
    document.getElementById('idLojaDisplay').value     = data.idLoja || '';
    document.getElementById('nomeLoja').value          = data.nomeLoja || '';

    if (data.logo) {
      const img = document.getElementById('previewLogo');
      img.src = urlUpload(data.logo);
      img.style.display = 'block';
      document.getElementById('logo-placeholder').style.display = 'none';
    }

    await Promise.all([carregarMesas(), carregarProdutos(), carregarUsuarios()]);
  } catch {
    window.location.href = '/login.html';
  }
}

/* ────────────────────────────────────────────
   NAVEGAÇÃO / MODAIS
   ──────────────────────────────────────────── */

function showPanel(id, btn) {
  const painel = document.getElementById('panel-' + id);
  if (!painel) return console.error('Painel não encontrado: panel-' + id);

  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  painel.classList.add('active');

  const nomes = {
    'visao-geral': 'Visão Geral',
    lanchonete: 'Lanchonete',
    mesas: 'Mesas',
    produtos: 'Produtos',
    usuarios: 'Usuários'
  };
  document.getElementById('topbar-title').textContent = nomes[id] || id;

  // btn é null nos botões de "Acesso rápido": acha o item da sidebar pelo nome
  const item = btn || [...document.querySelectorAll('.nav-item')]
    .find(n => (n.getAttribute('onclick') || '').includes(`'${id}'`));
  if (item) item.classList.add('active');
}

function fecharModal(id) {
  const m = document.getElementById(id);
  m.classList.remove('open', 'show', 'active');
}

function abrirModal(id) {
  document.getElementById(id).classList.add('open');
}

/* ────────────────────────────────────────────
   FORMULÁRIOS (lanchonete e mesas)
   ──────────────────────────────────────────── */

function ligarFormularios() {

  // ── Informações da loja (nome + logo) ──
  document.getElementById('formInfo').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = new FormData();
    form.append('nomeLoja', document.getElementById('nomeLoja').value.trim());

    // o ARQUIVO (files[0]), e não .value, que devolve "C:\fakepath\..."
    const logo = document.getElementById('logoInput').files[0];
    if (logo) form.append('logo', logo);

    try {
      const req = await fetch('/alterLoja', {
        method: 'POST',
        credentials: 'include',
        body: form                 
      });
      const res = await req.json();

      if (req.ok) {
        showToast(res.success || 'Informações salvas!');
        const nome = document.getElementById('nomeLoja').value.trim();
        if (nome) {
          document.getElementById('topbar-loja').textContent = nome;
          document.getElementById('stat-loja').textContent   = nome;
        }
        document.getElementById('logoInput').value = '';
      } else {
        showToast(res.error || 'Erro ao salvar.', 'error');
      }
    } catch {
      showToast('Erro de conexão.', 'error');
    }
  });

  // ── Quantidade de mesas ──
  document.getElementById('formMesas').addEventListener('submit', async (e) => {
    e.preventDefault();
    const qtyMesas = document.getElementById('qtdMesas').value;
    if (!qtyMesas) return showToast('Informe a quantidade.', 'error');

    try {
      const req = await fetch('/admin/mesas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mesas: qtyMesas })
      });
      const res = await req.json().catch(() => ({}));

      if (!req.ok) return showToast(res.message || 'Erro ao salvar mesas.', 'error');

      showToast('Mesas salvas com sucesso!');
      carregarMesas();
    } catch {
      showToast('Erro ao salvar mesas.', 'error');
    }
  });
}

/* ────────────────────────────────────────────
   MESAS
   ──────────────────────────────────────────── */

async function carregarMesas() {
  try {
    const res   = await fetch('/mesas', { credentials: 'include' });
    const mesas = await res.json();
    const qtd   = Array.isArray(mesas) ? mesas.length : 0;

    document.getElementById('stat-mesas').textContent = Array.isArray(mesas) ? qtd : '—';

    const campo = document.getElementById('qtdMesas');
    if (Array.isArray(mesas) && !campo.value) {
      campo.value = qtd || '';
      previewMesas();
    }
  } catch {
    document.getElementById('stat-mesas').textContent = '—';
  }
}

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

/* ────────────────────────────────────────────
   LOGO / BACKUP
   ──────────────────────────────────────────── */

function previewLogo() {
  const file = document.getElementById('logoInput').files[0];
  if (!file) return;
  const img  = document.getElementById('previewLogo');
  const icon = document.getElementById('logo-placeholder');
  img.src = URL.createObjectURL(file);
  img.style.display  = 'block';
  icon.style.display = 'none';
}

async function fazerBackupManual() {
  try {
    const res  = await fetch('/admin/backup', { method: 'POST', credentials: 'include' });
    const data = await res.json();
    showToast(data.message || data.error, res.ok ? 'success' : 'error');
  } catch {
    showToast('Erro ao fazer backup.', 'error');
  }
}

/* ────────────────────────────────────────────
   PRODUTOS
   ──────────────────────────────────────────── */

async function carregarProdutos() {
  try {
    const categorias = ['lanches', 'porcoes', 'bebidas', 'sobremesas'];
    const resultados = await Promise.all(
      categorias.map(c =>
        fetch(`/products/${c}`, { credentials: 'include' })
          .then(r => r.json())
          .catch(() => [])
      )
    );

    produtosCache = resultados.flat().filter(p => p && p.id !== undefined);
    renderProdutos(produtosCache);
    document.getElementById('stat-produtos').textContent = produtosCache.length;
  } catch {
    console.error('Erro ao carregar produtos');
  }
}

function renderProdutos(lista) {
  const tbody = document.getElementById('produtos-tbody');

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--texto-muted);padding:32px">Nenhum produto encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(p => {
    const src    = p.img ? urlUpload(p.img) : imagemPadrao(p.categoria);
    const padrao = imagemPadrao(p.categoria);
    const desc   = p.descricao || '';

    return `
    <tr>
      <td>
        <img style="width:44px;height:44px;object-fit:cover;border-radius:8px;border:1.5px solid var(--card-border)"
             src="${esc(src)}" alt="" loading="lazy"
             onerror="this.onerror=null;this.src='${esc(padrao)}'">
      </td>
      <td>
        <div style="font-weight:600">${esc(p.nome) || '—'}</div>
        <div style="font-size:12px;color:var(--texto-muted)">${esc(desc.substring(0, 50))}${desc.length > 50 ? '...' : ''}</div>
      </td>
      <td><span class="badge badge-${esc(p.categoria)}">${esc(p.categoria) || '—'}</span></td>
      <td style="color:var(--verde);font-weight:600">R$ ${parseFloat(p.preco || 0).toFixed(2)}</td>
      <td>
        <button class="btn-table" onclick="abrirEdicaoProduto(${Number(p.id)})">✏️ Editar</button>
        <button class="btn-table" style="color:var(--vermelho)" onclick="deletarProduto(${Number(p.id)})">🗑</button>
      </td>
    </tr>`;
  }).join('');
}

function abrirEdicaoProduto(id) {
  const p = produtosCache.find(x => Number(x.id) === Number(id));
  if (!p) return;

  document.getElementById('edit-id').value        = p.id;
  document.getElementById('edit-nome').value      = p.nome || '';
  document.getElementById('edit-preco').value     = p.preco || '';
  document.getElementById('edit-descricao').value = p.descricao || '';
  document.getElementById('edit-categoria').value = p.categoria || 'lanches';

  const lista = document.getElementById('edit-extras-lista');
  lista.innerHTML = '';

  const imgAtual       = document.getElementById('edit-img-atual');
  const imgPlaceholder = document.getElementById('edit-img-placeholder');
  document.getElementById('edit-img-input').value = '';

  if (p.img) {
    imgAtual.src = urlUpload(p.img);
    imgAtual.style.display = 'block';
    imgPlaceholder.style.display = 'none';
  } else {
    imgAtual.removeAttribute('src');
    imgAtual.style.display = 'none';
    imgPlaceholder.style.display = 'block';
  }

  try {
    const extras = JSON.parse(p.extras || '[]');
    extras.forEach(ex => adicionarExtraModal(ex.nome, ex.preco));
  } catch { /* extras inválido: ignora */ }

  abrirModal('modal-produto');
}

function previewEditImg() {
  const file = document.getElementById('edit-img-input').files[0];
  if (!file) return;
  const img         = document.getElementById('edit-img-atual');
  const placeholder = document.getElementById('edit-img-placeholder');
  img.src = URL.createObjectURL(file);
  img.style.display = 'block';
  placeholder.style.display = 'none';
}

function adicionarExtraModal(nome = '', preco = '') {
  const lista = document.getElementById('edit-extras-lista');
  const div = document.createElement('div');
  div.className = 'linha-extra';
  div.innerHTML = `
    <input type="text"   class="extra-nome"  placeholder="Ex: Ovo" value="${esc(nome)}">
    <input type="number" class="extra-preco" step="0.01" placeholder="R$" value="${esc(preco)}">
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
  const imgFile   = document.getElementById('edit-img-input').files[0];

  if (!nome || !preco) return showToast('Nome e preço são obrigatórios.', 'error');

  const extras = [];
  document.querySelectorAll('#edit-extras-lista .linha-extra').forEach(linha => {
    const n = linha.querySelector('.extra-nome').value.trim();
    const p = parseFloat(linha.querySelector('.extra-preco').value);
    if (n) extras.push({ nome: n, preco: isNaN(p) ? 0 : p });
  });

  const formData = new FormData();
  formData.append('nome',      nome);
  formData.append('preco',     preco);
  formData.append('descricao', descricao);
  formData.append('categoria', categoria);
  formData.append('extras',    JSON.stringify(extras));
  if (imgFile) formData.append('imagem', imgFile);

  try {
    const res = await fetch(`/produto/${encodeURIComponent(id)}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData              // sem Content-Type: o navegador define sozinho
    });

    if (res.ok) {
      showToast('Produto atualizado!');
      fecharModal('modal-produto');
      carregarProdutos();
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.message || data.error || 'Erro ao salvar.', 'error');
    }
  } catch {
    showToast('Erro de conexão.', 'error');
  }
}

async function deletarProduto(id) {
  if (!confirm('Tem certeza que deseja deletar este produto?')) return;

  try {
    const res = await fetch(`/produto/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (res.ok) {
      showToast('Produto deletado.');
      carregarProdutos();
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.message || 'Erro ao deletar.', 'error');
    }
  } catch {
    showToast('Erro de conexão.', 'error');
  }
}

/* ────────────────────────────────────────────
   USUÁRIOS
   ──────────────────────────────────────────── */

async function carregarUsuarios() {
  try {
    const res  = await fetch('/admin/usuarios', { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) return;

    usuariosCache = data;
    atualizarStatsUsuarios(data);
    renderUsuarios(data);
    document.getElementById('stat-usuarios').textContent = data.length;
  } catch { /* sem permissão ou erro de rede */ }
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
            ${esc((u.user || '?').charAt(0).toUpperCase())}
          </div>
          <div>
            <div style="font-weight:600;font-size:14px">${esc(u.user) || '—'}</div>
            <div style="font-size:11px;color:var(--texto-muted)">#${Number(u.id)}</div>
          </div>
        </div>
      </td>
      <td style="color:var(--texto-muted)">${esc(u.email) || '—'}</td>
      <td style="color:var(--texto-muted)">${esc(u.idLoja) || '—'}</td>
      <td>${roleBadge(u.role)}</td>
      <td>
        <button class="btn-table" onclick="abrirEdicaoUsuario(${Number(u.id)})">✏️ Editar</button>
      </td>
    </tr>
  `).join('');
}

function roleBadge(role) {
  const mapa = {
    admin:   { label: '🛡️ Admin',   cls: 'role-admin'   },
    user:    { label: '👤 User',     cls: 'role-user'    },
    cozinha: { label: '👨‍🍳 Cozinha', cls: 'role-cozinha' },
    caixa:   { label: '💰 Caixa',    cls: 'role-caixa'   }
  };
  const r = mapa[role] || { label: esc(role) || '—', cls: 'role-user' };
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
  const u = usuariosCache.find(x => Number(x.id) === Number(id));
  if (!u) return;

  modoNovoUsuario   = false;
  usuarioEditandoId = u.id;

  document.getElementById('modal-usuario-titulo').textContent  = 'Editar Usuário';
  document.getElementById('edit-usuario-id').value             = u.id;
  document.getElementById('edit-user').value                   = u.user   || '';
  document.getElementById('edit-email').value                  = u.email  || '';
  document.getElementById('edit-role').value                   = u.role   || 'user';
  document.getElementById('edit-usuario-idLoja').value         = u.idLoja || '';
  document.getElementById('edit-senha').value                  = '';
  document.getElementById('btn-deletar-usuario').style.display = 'inline-flex';
  abrirModal('modal-usuario');
}

function abrirModalNovoUsuario() {
  modoNovoUsuario   = true;
  usuarioEditandoId = null;

  document.getElementById('modal-usuario-titulo').textContent  = 'Novo Usuário';
  document.getElementById('edit-usuario-id').value             = '';
  document.getElementById('edit-user').value                   = '';
  document.getElementById('edit-email').value                  = '';
  document.getElementById('edit-role').value                   = 'user';
  document.getElementById('edit-usuario-idLoja').value         = userData.idLoja || '';
  document.getElementById('edit-senha').value                  = '';
  document.getElementById('btn-deletar-usuario').style.display = 'none';
  abrirModal('modal-usuario');
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

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      showToast(modoNovoUsuario ? 'Usuário criado!' : 'Usuário atualizado!');
      fecharModal('modal-usuario');
      await carregarUsuarios();
    } else {
      showToast(data.message || 'Erro ao salvar.', 'error');
    }
  } catch {
    showToast('Erro de conexão.', 'error');
  }
}

function confirmarDeleteUsuario() {
  const u = usuariosCache.find(x => Number(x.id) === Number(usuarioEditandoId));
  document.getElementById('confirm-usuario-nome').textContent = u ? `"${u.user}"` : 'este usuário';
  abrirModal('modal-confirm-usuario');
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
      const data = await res.json().catch(() => ({}));
      showToast(data.message || 'Erro ao deletar.', 'error');
    }
  } catch {
    showToast('Erro de conexão.', 'error');
  }
}