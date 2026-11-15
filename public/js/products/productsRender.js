import { openProdModal } from './productsModal.js'
import { imagemProduto, imagemPadrao } from '../utils/productIMG.js'

// escapa texto para colocar em atributos HTML sem quebrar
function esc(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

export function renderProducts(lista, categoriaAtual = '') {

    const divProducts = document.getElementById('productsList')

    let htmlGerado = ''


    lista.forEach(produto => {

        const categoria = produto.categoria || categoriaAtual;

        // Foto do produto ou imagem padrão da categoria
        const src = imagemProduto({ ...produto, categoria });
        const padrao = imagemPadrao(categoria);

        const extrasStr = produto.extras || '[]';
        const descricaoStr = produto.descricao || '';

        // Pão padrão cadastrado no produto
        const paoPadrao = produto.paoPadrao || 'tradicional';

        const precoFormatado = Number(produto.preco || 0)
            .toFixed(2)
            .replace('.', ',');

        htmlGerado += `
            <div class="product-item">

                <img
                    src="${esc(src)}"
                    alt="${esc(produto.nome)}"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='${esc(padrao)}'"
                >

                <div class="product-name">
                    ${esc(produto.nome)}
                </div>

                <div class="preco">
                    R$ ${precoFormatado}
                </div>

                <button
                    class="add"
                    data-id="${esc(produto.id)}"
                    data-nome="${esc(produto.nome)}"
                    data-preco="${esc(produto.preco)}"
                    data-img="${esc(src)}"
                    data-categoria="${esc(categoria)}"
                    data-desc="${esc(descricaoStr)}"
                    data-extras="${esc(extrasStr)}"
                    data-pao-padrao="${esc(paoPadrao)}"
                >
                    Adicionar
                </button>

            </div>
        `;
    });


    divProducts.innerHTML = htmlGerado

    document.querySelectorAll('.add').forEach(button => {

        button.addEventListener('click', function () {
            openProdModal(this)
        })
    })
}

export async function showCategory(category) {

    const res = await fetch(`/products/${category}`)

    document.querySelectorAll('.categories div').forEach(cat => {
        cat.classList.remove('active')
    })

    const activeCategory = document.getElementById(category)
    if (activeCategory) activeCategory.classList.add('active')

    if (!res.ok) {
        console.error('Erro ao carregar produtos:', res.status)
        return renderProducts([], category)
    }

    const res_body = await res.json()

    renderProducts(res_body, category)
}