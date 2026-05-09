import { state } from '../state/state.js'

import { getParcial } from './mesa.js'
import { normalizarExtras } from '../cart/cartHelper.js'

import {
    maisUm,
    menosUm,
    deletarItem
} from './mesaActions.js'

import { openAdd } from '../products/products.js'

import { openCheckout } from '../checkout/checkout.js'

import { prepararImpressao } from '../checkout/impressao.js'

export async function getProducts(id, mesa){

    const res = await fetch(`mesa/${mesa}/products/${id}`)

    const mesa_products = await res.json()

    const divPedidos = document.querySelector('.pedidos')

    divPedidos.innerHTML = '<h2>Pedidos</h2>'

    state.totalGeral = 0

    if (!Array.isArray(mesa_products) || mesa_products.length === 0) {

        divPedidos.innerHTML = `
            <div class="sem-produtos">
                <p>MESA LIVRE</p>
                <button class="btn-adicionar" id="btnMesaLivre">
                    + Adicionar Produto
                </button>
            </div>
        `

        document
            .getElementById('btnMesaLivre')
            .addEventListener('click', openAdd)

        return
    }

    const listaItens = document.createElement('div')

    listaItens.className = 'lista-itens-scroll'

    divPedidos.appendChild(listaItens)

    for(const item of mesa_products){

        const dadosreq = await fetch('/getprodutobody/' + item.produto_id)

        const dados = await dadosreq.json()

        const descObs = await fetch('/getExtras/' + item.id)

        const dadosObs = await descObs.json()

        const extrasNorm = normalizarExtras(dadosObs.extras)

        const extrasTexto = extrasNorm.length > 0

        ? extrasNorm.map(extra =>

            ` ${extra.nome} (+R$ ${Number(extra.preco).toFixed(2)})`

        ).join(', ')

        : ''

        const precoExtra = Number(dadosObs.preco || 0)

        state.totalGeral += precoExtra * item.quantidade

        const div = document.createElement('div')

        div.innerHTML = `
            <div class="pedido-item">

                <div class="item-img">
                    <img src='/uploads/${dados.img}' style="width:50px;border-radius:10px;">
                </div>

                <div class="item-detalhes">
                    <span class="item-nome">${dados.nome}</span>
                    <span class="item-nome" style="font-size: 10px">${extrasTexto}</span>
                    <span class="item-preco">R$ ${precoExtra.toFixed(2)}</span>
                    
                </div>

                <div class="item-controles">

                    <button class="menos btn-qtd">
                        -
                    </button>

                    <span class="qtd-numero">
                        ${item.quantidade}
                    </span>

                    <button class="mais btn-qtd">
                        +
                    </button>
                </div>

                <button class="remover btn_remover">
                    🗑️
                </button>

            </div>
        `

        listaItens.appendChild(div)

        div.querySelector('.menos')
            .addEventListener('click', ()=>{
                menosUm(dadosObs.id, item.mesa_id)
            })

        div.querySelector('.mais')
            .addEventListener('click', ()=>{
                maisUm(dadosObs.id, item.mesa_id)
            })

        div.querySelector('.remover')
            .addEventListener('click', ()=>{
                deletarItem(dadosObs.id, item.mesa_id)
            })
    }

    const footer = document.createElement('div')

    const parcialReq = await fetch('/getParcial/' + mesa)

    const parcialRes = await parcialReq.json()

    const valorParcial = Number(parcialRes.total || 0)

    const valorRestante = state.totalGeral - valorParcial
    state.parcialValor = valorParcial

    footer.className = 'pedido-footer'

    footer.innerHTML = `

        <div class="total">

            Total da Mesa:
            <span>
                R$ ${state.totalGeral.toFixed(2)}
            </span>

            ${
                valorParcial > 0
                ?
                `
                    <div class="parcial-box">

                        <div class="parcial-item">

                            Pago:
                            
                            <span style="color:#ff4d4d">
                                - R$ ${valorParcial.toFixed(2)}
                            </span>

                        </div>

                        <div class="parcial-item restante">

                            Restante:
                            
                            <span style="color:#00d26a">
                                R$ ${valorRestante.toFixed(2)}
                            </span>

                        </div>

                    </div>
                `
                :
                ''
            }

        </div>

        <div class="footer-buttons">

            <button class="btn-adicionar" id="btnAdd">
                + Adicionar
            </button>

            <button class="btn-fechar" id="btnCheckout">
                ✅ Fechar Comanda
            </button>

            <button class="btn-imprimir" id="btnPrint">
                🖨️ Imprimir
            </button>

        </div>
    `

    divPedidos.appendChild(footer)

    document
        .getElementById('btnAdd')
        .addEventListener('click', openAdd)

    document
        .getElementById('btnCheckout')
        .addEventListener('click', ()=>{
            openCheckout(id, mesa)
        })

    document
        .getElementById('btnPrint')
        .addEventListener('click', ()=>{
            prepararImpressao(id)
        })
}