import { mesa } from '../utils/helpers.js'

import { confirmarPedido } from '../cart/cartHelper.js'

export async function pegaridMesa(){

    const mesa_res = await fetch("mesa/" + mesa)

    const mesa_result = await mesa_res.json()

    confirmarPedido(mesa_result[0].id)
}