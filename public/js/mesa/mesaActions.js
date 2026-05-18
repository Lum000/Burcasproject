import { verifyMesa } from './mesa.js'
import { state } from '../state/state.js'



export async function atualizarTotalTela(preco,operador) {
    const totalMesa = state.totalGeral
    let novoTotal = 0

    if(operador === 'mais'){ novoTotal = preco + totalMesa}
    if(operador === 'menos'){novoTotal = totalMesa - preco}
    state.totalGeral = novoTotal
    const parcial = novoTotal - state.parcialValor
    document.getElementById("totalMesa").innerText = `R$ ${novoTotal.toFixed(2)}`
    document.getElementById("restante").innerHTML = `R$ ${parcial.toFixed(2)}`
}

export async function deletarItem(productid, mesaid){

    try{

        await fetch('/deletarProduto/' + productid + '/' + mesaid)

        verifyMesa()

    }catch(err){

        console.log(err)
    }
}

export async function menosUm(productid, mesaid){

    try{

        const req = await fetch('/menosUm/' + productid + '/' + mesaid)
        const res = await req.json()
        console.log(res)

        document.getElementById(
            `qtd-${productid}`
        ).innerText = res.quantidade

        atualizarTotalTela(
            res.preco,'menos'
        )

    }catch(err){

        console.log(err)
    }
}

export async function maisUm(productid, mesaid){

    try{

        const req =  await fetch('/addMore/' + productid + '/' + mesaid)

        const res = await req.json()

        document.getElementById(
            `qtd-${productid}`
        ).innerText = res[0].quantidade
        atualizarTotalTela(
            res[0].preco,'mais'
        )

    }catch(err){

        console.log(err)
    }
}