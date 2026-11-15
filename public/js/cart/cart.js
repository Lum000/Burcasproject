
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

// Compara os adicionais considerando nome e preço
function chaveExtras(extras) {
    return lerExtras(extras)
        .map(e => `${e.nome}:${Number(e.preco || 0)}`)
        .sort()
        .join('|')
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
    quantidade = Math.max(1, Number(quantidade) || 1)
    precoBase = Number(precoBase) || 0
    extras = lerExtras(extras)
    pao = pao || ''

    // Soma dos adicionais por unidade
    const totalExtras = extras.reduce((acc, extra) => {
        return acc + (Number(extra.preco) || 0)
    }, 0)

    // Preço unitário final
    const precoFinal = precoBase + totalExtras

    const extrasKey = chaveExtras(extras)

    // Verifica se já existe um item exatamente igual
    const itemExistente = state.carrinhoTemporario.find(item => {
        return (
            String(item.id) === String(id) &&
            item.obs === obs &&
            (item.pao || '') === pao &&
            chaveExtras(item.extras) === extrasKey
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
