import { state } from '../state/state.js'

import { renderizarCarrinhoTemporario }
from './cartRender.js'

import { showToast }
from '../ui/toast.js'

import { mesa}
from '../utils/helpers.js'

import { verifyMesa }
from '../mesa/mesa.js'

export function desmarcarTudo() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}


export function normalizarExtras(extras) {
    if (!extras) return [];

    if (Array.isArray(extras)) return extras;

    try {
        return JSON.parse(extras);
    } catch {
        return [];
    }
}

export async function confirmarPedido(mesa_id){

    if(state.carrinhoTemporario.length === 0){

        alert('Adicione itens primeiro!')

        return
    }

    try{

        const res = await fetch('/add-multi-products',{

            method:'POST',

            headers:{
                'Content-Type':'application/json'
            },

            body: JSON.stringify({

                mesa_id,

                mesa_numero: mesa,

                itens: state.carrinhoTemporario

            })

        })

        if(res.ok){

            showToast('Pedido enviado!')

            // limpa carrinho
            state.carrinhoTemporario = []

            renderizarCarrinhoTemporario()

            verifyMesa()

            document.getElementById('productAlert')
                .style.display = 'none'

            document.body.style.overflow = 'auto'

        }

    }catch(err){

        console.log(
            'Erro ao enviar pedido',
            err
        )
    }
}