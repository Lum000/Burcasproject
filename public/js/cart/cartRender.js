import { state } from '../state/state.js'

import { removerDoCarrinhoTemp } from './cart.js'

export function renderizarCarrinhoTemporario(){

    const listaLateral =
        document.getElementById('carrinhoTemporarioList')

    const totalTexto =
        document.getElementById('totalCarrinhoTemp')

    listaLateral.innerHTML = ''

    if(state.carrinhoTemporario.length === 0){

        listaLateral.innerHTML = `
            <p class="empty-cart-msg">
                Nenhum item selecionado
            </p>
        `

        totalTexto.innerText = 'R$ 0,00'

        return
    }

    let total = 0

    state.carrinhoTemporario.forEach((item,index)=>{

        const subtotal =
            item.precoFinal * item.quantidade

        total += subtotal
        const extrasArray = JSON.parse(item.extras || '[]')

        const extrasTexto = extrasArray.length > 0

        ? extrasArray.map(extra =>

            `${extra.nome} (+R$ ${Number(extra.preco).toFixed(2)})`

        ).join(', ')

        : 'Sem extras'

        listaLateral.innerHTML += `

            <div class="temp-item">

                <div class="temp-item-content">

                    <div class="temp-item-header">

                        <div>

                            <strong>
                                ${item.nome}
                            </strong>

                            <p>
                                ${item.quantidade}x
                                R$ ${item.precoFinal.toFixed(2)}
                            </p>

                        </div>

                        <button
                            class="remove-cart"
                            data-index="${index}"
                        >
                            ✕
                        </button>

                    </div>

                    <div class="temp-item-details">

                        <small>

                            ${extrasTexto}

                            ${
                                item.obs
                                ?
                                `<br>Obs: ${item.obs}`
                                :
                                ''
                            }

                        </small>

                    </div>

                    <div class="temp-item-total">

                        R$ ${subtotal.toFixed(2)}

                    </div>

                </div>

            </div>
        `
    })

    totalTexto.innerText =
        `R$ ${total.toFixed(2)}`

    document.querySelectorAll('.remove-cart')
        .forEach(btn=>{

            btn.addEventListener('click', ()=>{

                removerDoCarrinhoTemp(
                    btn.dataset.index
                )

            })

        })
}