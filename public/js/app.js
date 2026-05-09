import { isadmin } from './admin/admin.js'

import { verifyMesa } from './mesa/mesa.js'

import { toggleMenu } from './ui/sidebar.js'

import {
    openAdd,
    closeAlert
} from './products/products.js'

import {
    closeCheckout,
    toggleCheckoutOptions,
    calcularDivisao,
    processarPagamento
} from './checkout/checkout.js'

import {
    closeProdModal
} from './products/productsModal.js'

import {
    fecharModalMesa,
    confirmarAlterarMesa,
    abrirModalMesa
} from './mesa/mesaModal.js'

import {
    pegaridMesa
} from './products/productActions.js'

import {
    showCategory
} from './products/productsRender.js'

window.onload = async ()=>{

    await isadmin()

    await verifyMesa()

    iniciarEventos()
}

function iniciarEventos(){

    // MENU
    document
        .getElementById('menuBtn')
        ?.addEventListener('click', toggleMenu)

    // FECHAR ALERT
    document
        .getElementById('closeAlertBtn')
        ?.addEventListener('click', closeAlert)

    // CATEGORIAS
    document.querySelectorAll('[data-category]')
        .forEach(item=>{

            item.addEventListener('click', ()=>{

                showCategory(
                    item.dataset.category
                )

            })

        })

    // ENVIAR PEDIDO
    document
        .getElementById('btnEnviarPedido')
        ?.addEventListener('click', pegaridMesa)

    // CHECKOUT
    document
        .getElementById('closeCheckoutBtn')
        ?.addEventListener('click', closeCheckout)

    document
        .getElementById('tipoPagamento')
        ?.addEventListener('change', toggleCheckoutOptions)

    document
        .getElementById('numPessoas')
        ?.addEventListener('input', calcularDivisao)

    document
        .getElementById('btnProcessarPagamento')
        ?.addEventListener('click', processarPagamento)

    // MODAL PRODUTO
    document
        .getElementById('closeProdModalBtn')
        ?.addEventListener('click', closeProdModal)

    // ALTERAR MESA
    document
        .getElementById('alterTable')
        ?.addEventListener('click', abrirModalMesa)

    document
        .getElementById('closeAlterMesaBtn')
        ?.addEventListener('click', fecharModalMesa)

    document
        .getElementById('cancelarAlterMesa')
        ?.addEventListener('click', fecharModalMesa)

    document
        .getElementById('confirmarAlterMesa')
        ?.addEventListener('click', confirmarAlterarMesa)
}