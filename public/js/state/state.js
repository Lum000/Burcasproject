export const state = {

    isAdmin: false,

    totalGeral: 0,

    parcialValor: 0,

    valorTotalAtual: 0,

    carrinhoTemporario: [],

    listaExtras: [],

    precoFinalComExtras: 0,

    valorTotalComExtras: 0
}

export function setAdmin(value){
    isAdmin = value;
}

export function setTotal(value){
    totalGeral = value;
}

export function setParcial(value){
    parcialValor = value;
}

export function setValorTotalAtual(value){
    valorTotalAtual = value;
}