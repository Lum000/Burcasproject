
import { state } from '../state/state.js'
import { renderizarCarrinhoTemporario } from './cartRender.js'
import { showToast } from '../ui/toast.js'

// Garante que extras seja sempre um array
function lerExtras(extras) {
    if (Array.isArray(extras)) return extras

    if (typeof extras === 'string') {
        try {
            const lista = JSON.parse(extras || '[]')
            return Array.isArray(lista) ? lista : []
        } catch {
            return []
        }
    }

    return []
}

// Compara os adicionais
function chaveExtras(extras) {
    return lerExtras(extras)
        .map(e => e.nome)
        .sort()
        .join(',')
}

export function adicionarAoCarrinho(
    id,
    nome,
    precoBase,
    quantidade,
    obs,
    extras = [],
    pao = ''
) {
    quantidade = Number(quantidade)
    precoBase = Number(precoBase)
    extras = lerExtras(extras)

    const totalExtras = extras.reduce((acc, extra) => {
        return acc + Number(extra.preco || 0)
    }, 0)

    const precoFinal = precoBase + totalExtras

    const extrasKey = chaveExtras(extras)

    const itemExistente = state.carrinhoTemporario.find(item => {
        return (
            item.id == id &&
            item.obs == obs &&
            item.pao == pao &&
            chaveExtras(item.extras) == extrasKey
        )
    })

    if (itemExistente) {
        itemExistente.quantidade += quantidade
    } else {
        state.carrinhoTemporario.push({
            id,
            nome,
            preco: precoFinal,
            precoBase,
            precoFinal,
            quantidade,
            obs,
            extras,
            pao
        })
    }

    showToast('Produto adicionado')

    renderizarCarrinhoTemporario()
}

export function removerDoCarrinhoTemp(index) {
    state.carrinhoTemporario.splice(index, 1)

    renderizarCarrinhoTemporario()
}
