
import { state } from '../state/state.js'

import {
    adicionarAoCarrinho
} from '../cart/cart.js'

let precoFinalComExtras = 0

export function openProdModal(botao) {

    document.body.style.overflow = "hidden"

    const id = botao.dataset.id
    const nome = botao.dataset.nome
    const precoBase = parseFloat(botao.dataset.preco) || 0
    const img = botao.dataset.img
    const descricao = botao.dataset.desc
    const categoria = botao.dataset.categoria

    const paoPadrao = botao.dataset.paoPadrao || 'tradicional'

    let extras = []

    try {
        extras = JSON.parse(botao.dataset.extras || '[]')
    } catch {
        extras = []
    }

    // RESETAR ESTADO
    state.listaExtras = []

    let valorExtrasAcumulado = 0

    document.getElementById("modalObs").value = ""
    document.getElementById("qty_input").value = 1

    // ABRIR MODAL
    document.getElementById("productModal").style.display = "flex"

    document.getElementById("modalImg").src = img.startsWith('/uploads/')
        ? img
        : "/uploads/" + img

    document.getElementById("modalNome").innerText = nome
    document.getElementById("modalDescricao").innerText = descricao

    // CONFIGURAR PÃO
    const paoContainer = document.getElementById("paoContainer")
    const selectPao = document.getElementById("modalPao")

    const categoriaNormalizada = (categoria || '')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()

    const ehLanche = categoriaNormalizada === "lanches"

    if (paoContainer && selectPao) {

        paoContainer.style.display = ehLanche ? "block" : "none"

        // Seleciona automaticamente o pão padrão do produto
        if (ehLanche) {
            selectPao.value = paoPadrao
        }
    }

    // RENDERIZAR EXTRAS
    const extradiv = document.querySelector(".extras")

    extradiv.innerHTML = ""

    extras.sort((a, b) =>
        parseFloat(b.preco) - parseFloat(a.preco)
    )

    extras.forEach(item => {

        const label = document.createElement("label")

        label.className = "extra-item"

        label.innerHTML = `
            <input
                type="checkbox"
                value="${Number(item.preco) || 0}"
                data-name="${item.nome}"
            >

            ${item.nome} + R$ ${Number(item.preco || 0).toFixed(2)}
        `

        const input = label.querySelector("input")

        input.addEventListener("change", (e) => {

            const precoExtra = Number(e.target.value) || 0
            const nomeExtra = e.target.dataset.name

            if (e.target.checked) {

                state.listaExtras.push({
                    nome: nomeExtra,
                    preco: precoExtra
                })

                valorExtrasAcumulado += precoExtra

            } else {

                state.listaExtras = state.listaExtras.filter(
                    extra => extra.nome !== nomeExtra
                )

                valorExtrasAcumulado -= precoExtra
            }

            atualizarPrecoModal()
        })

        extradiv.appendChild(label)
    })

    // ATUALIZAR PREÇO
    function atualizarPrecoModal() {

        const paoAtual = ehLanche && selectPao
            ? selectPao.value
            : paoPadrao

        const adicionalPao = (
            ehLanche && paoAtual !== paoPadrao
        ) ? 1 : 0

        const totalModal =
            precoBase +
            valorExtrasAcumulado +
            adicionalPao

        state.valorTotalComExtras = totalModal

        document.getElementById("modalPreco").innerText =
            totalModal.toFixed(2).replace('.', ',')
    }

    // ATUALIZA PREÇO AO TROCAR PÃO
    if (selectPao) {
        selectPao.onchange = atualizarPrecoModal
    }

    // MOSTRAR PREÇO INICIAL CORRETO
    atualizarPrecoModal()

    // BOTÃO ADICIONAR AO CARRINHO
    const button = document.getElementById("addprod")

    button.onclick = function() {

        const obs =
            document.getElementById("modalObs").value.trim()

        const qty =
            document.getElementById("qty_input")

        const quantidade = Math.max(
            1,
            parseInt(qty.value) || 1
        )

        const paoEscolhido = ehLanche && selectPao
            ? selectPao.value
            : ""

        const adicionalPao = (
            ehLanche && paoEscolhido !== paoPadrao
        ) ? 1 : 0

        const extrasSelecionados = [
            ...state.listaExtras
        ]

        // REGISTRAR TROCA DE PÃO COMO EXTRA
        if (adicionalPao > 0) {

            const nomePao = selectPao.options[
                selectPao.selectedIndex
            ].text

            extrasSelecionados.push({
                nome: `Troca de pão para ${nomePao}`,
                preco: adicionalPao
            })
        }

        precoFinalComExtras =
            precoBase +
            valorExtrasAcumulado +
            adicionalPao

        adicionarAoCarrinho(
            id,
            nome,
            precoBase,
            quantidade,
            obs,
            extrasSelecionados,
            paoEscolhido
        )

        closeProdModal()

        qty.value = 1
    }
}

export function closeProdModal() {

    document.getElementById("productModal").style.display = "none"

    const modalPrincipal =
        document.getElementById("productAlert")

    if (modalPrincipal.style.display !== "flex") {
        document.body.style.overflow = "auto"
    }
}
