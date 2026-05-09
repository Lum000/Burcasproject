import { verifyMesa } from './mesa.js'

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

        await fetch('/menosUm/' + productid + '/' + mesaid)

        verifyMesa()

    }catch(err){

        console.log(err)
    }
}

export async function maisUm(productid, mesaid){

    try{

        await fetch('/addMore/' + productid + '/' + mesaid)

        verifyMesa()

    }catch(err){

        console.log(err)
    }
}