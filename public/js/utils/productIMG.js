const IMAGENS_PADRAO = {
  lanches:    '/img/padrao/lanche.png',
  porcoes:    '/img/padrao/porcao.png',
  bebidas:    '/img/padrao/bebida.png',
  sobremesas: '/img/padrao/sobremesa.png',
  default:    '/img/padrao/produto.png'
};

// "Porções" -> "porcoes", "Lanches " -> "lanches"
function normalizarCategoria(cat) {
  return String(cat || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function imagemPadrao(categoria) {
  return IMAGENS_PADRAO[normalizarCategoria(categoria)] || IMAGENS_PADRAO.default;
}

export function imagemProduto(produto) {
  if (produto.img) return `/uploads/${produto.img}`;
  return imagemPadrao(produto.categoria);
}

// HTML do <img> já com o fallback caso o arquivo tenha sido apagado
export function imgProdutoHTML(produto, classe = '') {
  const padrao = imagemPadrao(produto.categoria);
  return `<img class="${classe}" src="${imagemProduto(produto)}" alt="${produto.nome || ''}"
               loading="lazy" onerror="this.onerror=null;this.src='${padrao}'">`;
}