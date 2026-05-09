import { state } from '../state/state.js'

import { renderizarCarrinhoTemporario } from './cartRender.js'

import { showToast } from '../ui/toast.js'


export function adicionarAoCarrinho(
    id,
    nome,
    precoBase,
    quantidade,
    obs,
    extras = []
){

    quantidade = Number(quantidade)

    // soma extras
    const totalExtras = extras.reduce((acc, extra)=>{

        return acc + Number(extra.preco || 0)

    },0)

    // preco final
    const precoFinal = precoBase + totalExtras

    // verifica item igual
    const extrasKey = extras
        .map(e=>e.nome)
        .sort()
        .join(',')

    const itemExistente = state.carrinhoTemporario.find(item=>{

        const itemExtrasKey = item.extras
            .map(e=>e.nome)
            .sort()
            .join(',')

        return (
            item.id == id &&
            item.obs == obs &&
            itemExtrasKey == extrasKey
        )

    })

    // soma quantidade se existir
    if(itemExistente){

        itemExistente.quantidade += quantidade

    }else{

        state.carrinhoTemporario.push({
            id,

            nome,

            preco: precoFinal,

            precoBase,

            precoFinal,

            quantidade,

            obs,

            extras: JSON.stringify(extras)

        })

    }

    showToast('Produto adicionado')

    renderizarCarrinhoTemporario()
}

export function removerDoCarrinhoTemp(index){

    state.carrinhoTemporario.splice(index,1)

    renderizarCarrinhoTemporario()
}