import { mesa } from '../utils/helpers.js'

import { mostrarSkeleton } from '../ui/skeleton.js'

import { getProducts } from './mesaRender.js'

export async function verifyMesa(){

    const res = await fetch('mesa/' + mesa)

    const mesasinfo = await res.json()

    document.getElementById("mesaStatus").innerHTML =
        'Status: ' + mesasinfo[0].status.toUpperCase()

    document.getElementById("mesaNumero").innerHTML =
        'Mesa ' + mesa

    await mostrarSkeleton(4)

    await getProducts(mesasinfo[0].id, mesa)
}

export async function getMesaId(){

    const res = await fetch('mesa/' + mesa)

    const mesasinfo = await res.json()

    return mesasinfo[0].id
}

export async function getParcial(mesaNumero, mesa_id){

    try{

        if(mesaNumero){

            const req = await fetch(`/getParcial/${mesaNumero}`)

            const res = await req.json()

            return res?.total || 0
        }

        const req = await fetch(`/getParcialId/${mesa_id}`)

        const res = await req.json()

        return res?.total || 0

    }catch{

        return 0
    }
}