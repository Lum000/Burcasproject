import { state } from '../state/state.js'
import { renderizarCarrinhoTemporario } from './cartRender.js'
import { showToast } from '../ui/toast.js'

// Garante que extras seja sempre um array (aceita string JSON, array ou vazio)
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

// Chave usada para comparar se dois itens têm os mesmos adicionais
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
    extras = []
) {
    quantidade = Number(quantidade)
    precoBase = Number(precoBase)
    extras = lerExtras(extras)

    // soma dos extras
    const totalExtras = extras.reduce((acc, extra) => {
        return acc + Number(extra.preco || 0)
    }, 0)

    // preço final
    const precoFinal = precoBase + totalExtras

    // procura item igual (mesmo produto, mesma observação e mesmos extras)
    const extrasKey = chaveExtras(extras)

    const itemExistente = state.carrinhoTemporario.find(item => {
        return (
            item.id == id &&
            item.obs == obs &&
            chaveExtras(item.extras) == extrasKey
        )
    })

    if (itemExistente) {
        // soma a quantidade se já existir
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
            extras // array: só use JSON.stringify na hora de enviar ao servidor
        })
    }

    showToast('Produto adicionado')

    renderizarCarrinhoTemporario()
}

export function removerDoCarrinhoTemp(index) {
    state.carrinhoTemporario.splice(index, 1)

    renderizarCarrinhoTemporario()
}