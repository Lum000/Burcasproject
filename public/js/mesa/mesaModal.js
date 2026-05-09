import { mesa } from '../utils/helpers.js'

import { getMesaId } from './mesa.js'

import { showToast } from '../ui/toast.js'

export function abrirModalMesa(){

    const mesaAtual =
        document.getElementById('mesaNumero').textContent

    document.getElementById('mesaAtualLabel')
        .textContent = mesaAtual

    document.getElementById('modalAlterarMesa')
        .style.display = 'flex'
}

export function fecharModalMesa(){

    document.getElementById('modalAlterarMesa')
        .style.display = 'none'
}

export async function confirmarAlterarMesa(){

    const novoNumero =
        document.getElementById('inputNovoNumeroMesa').value

    const mesaId = await getMesaId()

    if(!novoNumero){

        return
    }

    try{

        const res = await fetch(`/mesa/alterar/${mesaId}`,{

            method:'POST',

            headers:{
                'Content-Type':'application/json'
            },

            body: JSON.stringify({

                antigoNumero: parseInt(mesa),

                novoNumero: parseInt(novoNumero)

            })
        })

        const data = await res.json()

        if(data.success){

            showToast(data.message)

            setTimeout(()=>{

                window.location.href =
                    '/mesa.html?mesa=' + novoNumero

            },1500)

        }else{

            showToast(data.message,'red')
        }

    }catch(err){

        console.log(err)
    }
}