import { showCategory } from './productsRender.js'

export async function pegaridMesa(){
    const mesa_res = await fetch ("mesa/" + mesa)
    const mesa_result = await mesa_res.json()
    confirmarPedido(mesa_result[0].id)

}

export function openAdd(){

    document.getElementById("productAlert").style.display = 'flex'

    document.body.style.overflow = 'hidden'

    showCategory('lanches')
}

export function closeAlert(){

    document.getElementById("productAlert").style.display = 'none'

    document.body.style.overflow = 'auto'
}