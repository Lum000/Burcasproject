import { openProdModal } from './productsModal.js'

export function renderProducts(lista){

    const divProducts = document.getElementById('productsList')

    let htmlGerado = ''

    lista.forEach(produto => {

        const extrasStr = produto.extras || '[]'

        const descricaoStr = produto.descricao || ''

        const precoFormatado = Number(produto.preco)
            .toFixed(2)
            .replace('.', ',')

        htmlGerado += `
            <div class="product-item">

                <img src="/uploads/${produto.img}">

                <div class="product-name">
                    ${produto.nome}
                </div>

                <div class="preco">
                    R$ ${precoFormatado}
                </div>

                <button
                    class="add"
                    data-id="${produto.id}"
                    data-nome="${produto.nome}"
                    data-preco="${produto.preco}"
                    data-img="${produto.img}"
                    data-desc="${descricaoStr}"
                    data-extras='${extrasStr}'
                >
                    Adicionar
                </button>

            </div>
        `
    })

    divProducts.innerHTML = htmlGerado

    document.querySelectorAll('.add').forEach(button => {

        button.addEventListener('click', function(){
            openProdModal(this)
        })
    })
}

export async function showCategory(category){

    const res = await fetch(`/products/${category}`)

    document.querySelectorAll('.categories div').forEach(cat=>{
        cat.classList.remove('active')
    })

    const activeCategory = document.getElementById(category)

    activeCategory.classList.add('active')

    const res_body = await res.json()

    renderProducts(res_body)
}