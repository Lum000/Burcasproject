(function () {
  'use strict';

  // ELEMENTOS DA PÁGINA
  const $ = (id) => document.getElementById(id);

  const modalProduto = $('modalProduto');
  const modalNome = $('modalNome');
  const modalDescricao = $('modalDescricao');
  const modalPrecoBase = $('modalPrecoBase');
  const listaExtras = $('listaExtras');
  const observacaoProduto = $('observacaoProduto');
  const quantidadeModal = $('quantidadeModal');
  const confirmarProduto = $('confirmarProduto');

  const elMain = $('cardapio');
  const elTabs = $('categorias');
  const elBusca = $('busca');

  const btnCarrinho = $('abrirCarrinho');
  const painelCarrinho = $('painelCarrinho');
  const fundoCarrinho = $('fundoCarrinho');
  const elItensCarrinho = $('itensCarrinho');
  const elQuantidadeCarrinho = $('quantidadeCarrinho');
  const elTotalCarrinho = $('totalCarrinho');
  const elTotalFinal = $('totalFinal');

  const elementosObrigatorios = {
    modalProduto, modalNome, modalDescricao, modalPrecoBase,
    listaExtras, observacaoProduto, quantidadeModal,
    confirmarProduto, elMain, elTabs, elBusca,
    btnCarrinho, painelCarrinho, fundoCarrinho,
    elItensCarrinho, elQuantidadeCarrinho,
    elTotalCarrinho, elTotalFinal
  };

  const faltando = Object.entries(elementosObrigatorios)
    .filter(([, elemento]) => !elemento)
    .map(([nome]) => nome);

  if (faltando.length) {
    console.error('Elementos HTML não encontrados:', faltando.join(', '));
    return;
  }

  // ESTADO
  let produtos = [];
  let produtoSelecionado = null;
  let quantidadeSelecionada = 1;
  let observer = null;
  let temporizadorBusca = null;

  const carrinho = [];

  // CONFIGURAÇÕES
  const IMAGENS_PADRAO = {
    lanches: '../imgs/padrao/lanche.png',
    porcoes: '../imgs/padrao/porcao.png',
    bebidas: '../imgs/padrao/bebida.png',
    sobremesas: '../imgs/padrao/sobremesa.png',
    default: '../imgs/padrao/produto.png'
  };

  const ROTULOS = {
    lanches: '🍔 Lanches',
    porcoes: '🍟 Porções',
    bebidas: '🥤 Bebidas',
    sobremesas: '🍰 Sobremesas'
  };

  const ORDEM = ['lanches', 'porcoes', 'bebidas', 'sobremesas'];

  const norm = (valor) => String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  const esc = (valor) => String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const brl = (valor) => Number(valor || 0)
    .toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

  function lerExtras(extras) {
    if (Array.isArray(extras)) return extras;

    if (typeof extras === 'string') {
      try {
        const lista = JSON.parse(extras || '[]');
        return Array.isArray(lista) ? lista : [];
      } catch (erro) {
        console.warn('Erro ao interpretar extras:', erro);
      }
    }

    return [];
  }

  function imagemPadrao(categoria) {
    return IMAGENS_PADRAO[norm(categoria)] || IMAGENS_PADRAO.default;
  }

  function imagemProduto(produto) {
    if (!produto.img) {
      return imagemPadrao(produto.categoria);
    }

    const imagem = String(produto.img);

    return /^(\/|https?:\/\/)/i.test(imagem)
      ? imagem
      : `/uploads/${imagem}`;
  }

  function rotulo(categoria) {
    const chave = norm(categoria);

    if (ROTULOS[chave]) return ROTULOS[chave];

    const texto = String(categoria || 'Outros');

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  function mostrarVazio(mensagem) {
    elTabs.innerHTML = '';
    elMain.innerHTML = `<div class="vazio">${esc(mensagem)}</div>`;
  }

  // IDENTIFICAÇÃO DA LOJA E MESA
  const partes = window.location.pathname
    .split('/')
    .filter(Boolean);

  const idLoja = decodeURIComponent(partes[1] || '');

  const mesa = new URLSearchParams(window.location.search)
    .get('mesa');

  if (mesa && /^\d{1,3}$/.test(mesa)) {
    const elementoMesa = $('mesaInfo');

    if (elementoMesa) {
      elementoMesa.textContent = `Mesa ${mesa}`;
      elementoMesa.hidden = false;
    }
  }

  // PERSONALIZAÇÃO DO PRODUTO
  function abrirPersonalizacao(id) {
    const produto = produtos.find(
      (item) => String(item.id) === String(id)
    );

    if (!produto || Number(produto.disponivel) === 0) return;

    produtoSelecionado = produto;
    quantidadeSelecionada = 1;

    modalNome.textContent = produto.nome || '';
    modalDescricao.textContent = produto.descricao || '';
    modalPrecoBase.textContent = brl(produto.preco);

    observacaoProduto.value = '';
    quantidadeModal.textContent = '1';

    const extras = lerExtras(produto.extras)
      .filter((extra) => extra && extra.nome);

    listaExtras.innerHTML = extras.map((extra, index) => `
      <label class="extra-opcao">
        <input
          type="checkbox"
          class="checkbox-extra"
          data-index="${index}"
        >

        <span>${esc(extra.nome)}</span>

        <small>
          ${
            Number(extra.preco) > 0
              ? `+ ${brl(extra.preco)}`
              : 'Grátis'
          }
        </small>
      </label>
    `).join('');

    modalProduto.hidden = false;

    atualizarPrecoModal();
  }

  function obterExtrasSelecionados() {
    if (!produtoSelecionado) return [];

    const extras = lerExtras(produtoSelecionado.extras)
      .filter((extra) => extra && extra.nome);

    return [...listaExtras.querySelectorAll('.checkbox-extra:checked')]
      .map((input) => extras[Number(input.dataset.index)])
      .filter(Boolean);
  }

  function atualizarPrecoModal() {
    if (!produtoSelecionado) return;

    const totalExtras = obterExtrasSelecionados()
      .reduce(
        (total, extra) => total + Number(extra.preco || 0),
        0
      );

    const precoUnitario =
      Number(produtoSelecionado.preco || 0) + totalExtras;

    const total = precoUnitario * quantidadeSelecionada;

    confirmarProduto.textContent =
      `Adicionar ao carrinho · ${brl(total)}`;
  }

  function fecharModalProduto() {
    modalProduto.hidden = true;
    produtoSelecionado = null;
    quantidadeSelecionada = 1;
  }

  const diminuirModal = $('diminuirModal');
  const aumentarModal = $('aumentarModal');
  const fecharModal = $('fecharModal');

  if (diminuirModal) {
    diminuirModal.addEventListener('click', () => {
      if (quantidadeSelecionada > 1) {
        quantidadeSelecionada--;

        quantidadeModal.textContent =
          String(quantidadeSelecionada);

        atualizarPrecoModal();
      }
    });
  }

  if (aumentarModal) {
    aumentarModal.addEventListener('click', () => {
      quantidadeSelecionada++;

      quantidadeModal.textContent =
        String(quantidadeSelecionada);

      atualizarPrecoModal();
    });
  }

  listaExtras.addEventListener('change', atualizarPrecoModal);

  confirmarProduto.addEventListener('click', () => {
    if (!produtoSelecionado) return;

    const extras = obterExtrasSelecionados();

    const totalExtras = extras.reduce(
      (total, extra) => total + Number(extra.preco || 0),
      0
    );

    const precoBase = Number(produtoSelecionado.preco || 0);
    const precoFinal = precoBase + totalExtras;

    const observacao = observacaoProduto.value.trim();

    const extrasKey = extras
      .map((extra) =>
        `${extra.nome}:${Number(extra.preco || 0)}`
      )
      .sort()
      .join('|');

    const existente = carrinho.find((item) =>
      String(item.id) === String(produtoSelecionado.id) &&
      item.obs === observacao &&
      item.extrasKey === extrasKey
    );

    if (existente) {
      existente.quantidade += quantidadeSelecionada;
    } else {
      carrinho.push({
        id: produtoSelecionado.id,
        nome: produtoSelecionado.nome,
        preco: precoFinal,
        precoBase,
        precoFinal,
        quantidade: quantidadeSelecionada,
        obs: observacao,
        extras: [...extras],
        extrasKey
      });
    }

    desenharCarrinho();

    fecharModalProduto();
  });

  if (fecharModal) {
    fecharModal.addEventListener('click', fecharModalProduto);
  }

  modalProduto.addEventListener('click', (evento) => {
    if (evento.target === modalProduto) {
      fecharModalProduto();
    }
  });

  // CARRINHO
  function desenharCarrinho() {
    const quantidade = carrinho.reduce(
      (total, item) => total + item.quantidade,
      0
    );

    const total = carrinho.reduce(
      (soma, item) => soma + item.preco * item.quantidade,
      0
    );

    btnCarrinho.hidden = quantidade === 0;

    elQuantidadeCarrinho.textContent = String(quantidade);
    elTotalCarrinho.textContent = brl(total);
    elTotalFinal.textContent = brl(total);

    elItensCarrinho.innerHTML = carrinho.map((item, index) => `
      <div class="produto-carrinho">

        <div class="produto-carrinho-info">

          <strong>${esc(item.nome)}</strong>

          <span>${brl(item.preco)} cada</span>

          ${item.extras.length ? `
            <small>
              Extras: ${item.extras
                .map((extra) => esc(extra.nome))
                .join(', ')}
            </small>
          ` : ''}

          ${item.obs ? `
            <small>Obs: ${esc(item.obs)}</small>
          ` : ''}

        </div>

        <div class="controles-quantidade">

          <button
            type="button"
            data-acao="menos"
            data-index="${index}"
          >−</button>

          <strong>${item.quantidade}</strong>

          <button
            type="button"
            data-acao="mais"
            data-index="${index}"
          >+</button>

          <button
            type="button"
            data-acao="remover"
            data-index="${index}"
            class="remover-item"
          >🗑</button>

        </div>
      </div>
    `).join('');
  }

  elMain.addEventListener('click', (evento) => {
    const botao = evento.target.closest('.adicionar-carrinho');

    if (!botao) return;

    abrirPersonalizacao(botao.dataset.id);
  });

  elItensCarrinho.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button[data-acao]');

    if (!botao) return;

    const index = Number(botao.dataset.index);
    const item = carrinho[index];

    if (!item) return;

    switch (botao.dataset.acao) {

      case 'mais':
        item.quantidade++;
        break;

      case 'menos':
        item.quantidade--;

        if (item.quantidade <= 0) {
          carrinho.splice(index, 1);
        }
        break;

      case 'remover':
        carrinho.splice(index, 1);
        break;

      default:
        return;
    }

    desenharCarrinho();
  });

  // FINALIZAÇÃO DO PEDIDO
  const botaoFinalizar = $('finalizarPedido');

  if (botaoFinalizar) {
    botaoFinalizar.addEventListener('click', () => {

      if (!carrinho.length) return;

      const pedido = {
        idLoja,

        mesa: mesa && /^\d{1,3}$/.test(mesa)
          ? mesa
          : null,

        itens: carrinho.map((item) => ({
          id: item.id,
          quantidade: item.quantidade,
          obs: item.obs,

          extras: item.extras.map((extra) => ({
            nome: extra.nome
          }))
        }))
      };

      console.log('Pedido pronto para envio:', pedido);

      window.dispatchEvent(
        new CustomEvent('pedido:finalizar', {
          detail: pedido
        })
      );

    });
  }

  // PAINEL DO CARRINHO
  function abrirPainelCarrinho() {
    fundoCarrinho.hidden = false;

    painelCarrinho.classList.add('aberto');

    painelCarrinho.setAttribute('aria-hidden', 'false');
  }

  function fecharPainelCarrinho() {
    painelCarrinho.classList.remove('aberto');

    painelCarrinho.setAttribute('aria-hidden', 'true');

    window.setTimeout(() => {

      if (!painelCarrinho.classList.contains('aberto')) {
        fundoCarrinho.hidden = true;
      }

    }, 300);
  }

  btnCarrinho.addEventListener(
    'click',
    abrirPainelCarrinho
  );

  const fecharCarrinho = $('fecharCarrinho');

  if (fecharCarrinho) {
    fecharCarrinho.addEventListener(
      'click',
      fecharPainelCarrinho
    );
  }

  fundoCarrinho.addEventListener(
    'click',
    fecharPainelCarrinho
  );

  // AGRUPAMENTO DE CATEGORIAS
  function agrupar(lista) {
    const grupos = new Map();

    lista.forEach((produto) => {

      const chave = norm(produto.categoria) || 'outros';

      if (!grupos.has(chave)) {
        grupos.set(chave, {
          nome: produto.categoria,
          itens: []
        });
      }

      grupos.get(chave).itens.push(produto);

    });

    return [...grupos.entries()].sort((a, b) => {

      const indiceA = ORDEM.indexOf(a[0]);
      const indiceB = ORDEM.indexOf(b[0]);

      return (indiceA === -1 ? 99 : indiceA) -
        (indiceB === -1 ? 99 : indiceB);

    });
  }

  // CARD DO PRODUTO
  function cardHTML(produto) {

    const indisponivel =
      Number(produto.disponivel) === 0;

    const padrao = imagemPadrao(produto.categoria);

    const extras = lerExtras(produto.extras)
      .filter((extra) => extra && extra.nome)
      .map((extra) =>
        Number(extra.preco) > 0
          ? `${esc(extra.nome)} (+${brl(extra.preco)})`
          : esc(extra.nome)
      );

    return `
      <article class="item ${indisponivel ? 'indisponivel' : ''}">

        <img
          src="${esc(imagemProduto(produto))}"
          alt="${esc(produto.nome)}"
          loading="lazy"
          onerror="this.onerror=null;this.src='${esc(padrao)}'"
        >

        <div class="info">

          <h3>${esc(produto.nome)}</h3>

          ${
            produto.descricao
              ? `<p class="desc">${esc(produto.descricao)}</p>`
              : ''
          }

          ${
            extras.length
              ? `<small class="extras-resumo">${extras.join(', ')}</small>`
              : ''
          }

          <div class="rodape-item">

            <span class="preco">
              ${brl(produto.preco)}
            </span>

            ${
              indisponivel
                ? '<span class="tag">Indisponível</span>'
                : `
                  <button
                    type="button"
                    class="adicionar-carrinho"
                    data-id="${esc(produto.id)}"
                  >
                    + Adicionar
                  </button>
                `
            }

          </div>
        </div>
      </article>
    `;
  }

  // ABAS DAS CATEGORIAS
  function ativarTabs() {

    const tabs = [
      ...elTabs.querySelectorAll('.tab')
    ];

    tabs.forEach((tab) => {

      tab.addEventListener('click', () => {

        document.getElementById(tab.dataset.alvo)
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });

      });

    });

    if (observer) observer.disconnect();

    if ('IntersectionObserver' in window) {

      observer = new IntersectionObserver((entradas) => {

        entradas.forEach((entrada) => {

          if (!entrada.isIntersecting) return;

          tabs.forEach((tab) => {

            const ativa =
              tab.dataset.alvo === entrada.target.id;

            tab.classList.toggle('ativa', ativa);

            if (ativa) {
              tab.scrollIntoView({
                inline: 'center',
                block: 'nearest'
              });
            }

          });

        });

      }, {
        rootMargin: '-35% 0px -60% 0px'
      });

      elMain.querySelectorAll('.categoria')
        .forEach((secao) => observer.observe(secao));

    }

    tabs[0]?.classList.add('ativa');
  }

  // DESENHAR CARDÁPIO
  function desenhar() {

    const termo = norm(elBusca.value);

    const filtrados = termo
      ? produtos.filter((produto) =>
          norm(
            `${produto.nome || ''} ${produto.descricao || ''}`
          ).includes(termo)
        )
      : produtos;

    if (!filtrados.length) {

      elTabs.innerHTML = '';

      mostrarVazio(
        termo
          ? 'Nada encontrado para essa busca.'
          : 'Nenhum produto disponível no momento.'
      );

      return;
    }

    const grupos = agrupar(filtrados);

    elTabs.innerHTML = grupos
      .map(([chave, grupo]) => `
        <button
          type="button"
          class="tab"
          data-alvo="cat-${esc(chave)}"
        >
          ${esc(rotulo(grupo.nome))}
        </button>
      `)
      .join('');

    elMain.innerHTML = grupos
      .map(([chave, grupo]) => `
        <section
          class="categoria"
          id="cat-${esc(chave)}"
        >

          <h2>${esc(rotulo(grupo.nome))}</h2>

          ${grupo.itens.map(cardHTML).join('')}

        </section>
      `)
      .join('');

    ativarTabs();
  }

  // CARREGAR CARDÁPIO
  async function carregar() {

    if (!idLoja) {
      mostrarVazio('Endereço do cardápio inválido.');
      return;
    }

    try {

      const resposta = await fetch(
        `/api/publico/${encodeURIComponent(idLoja)}/cardapio`
      );

      if (resposta.status === 404) {
        mostrarVazio('Cardápio não encontrado.');
        return;
      }

      if (!resposta.ok) {
        throw new Error(`HTTP ${resposta.status}`);
      }

      const dados = await resposta.json();

      produtos = Array.isArray(dados.produtos)
        ? dados.produtos
        : [];

      const nomeLoja = $('nomeLoja');

      if (nomeLoja) {
        nomeLoja.textContent =
          dados.loja?.nomeLoja || 'Cardápio';
      }

      document.title =
        `${dados.loja?.nomeLoja || 'Cardápio'} · Cardápio`;

      if (dados.loja?.logo) {

        const logo = $('logo');

        if (logo) {

          const caminhoLogo = String(dados.loja.logo);

          logo.src = /^(\/|https?:\/\/)/i.test(caminhoLogo)
            ? caminhoLogo
            : `/uploads/${caminhoLogo}`;

          logo.onerror = () => {
            logo.hidden = true;
          };

          logo.hidden = false;
        }
      }

      desenhar();
      desenharCarrinho();

    } catch (erro) {

      console.error('Erro ao carregar o cardápio:', erro);

      mostrarVazio(
        'Não foi possível carregar o cardápio. Verifique a conexão com a internet.'
      );

    }
  }

  // BUSCA
  elBusca.addEventListener('input', () => {

    window.clearTimeout(temporizadorBusca);

    temporizadorBusca = window.setTimeout(
      desenhar,
      180
    );

  });

  // INICIAR
  carregar();

})();