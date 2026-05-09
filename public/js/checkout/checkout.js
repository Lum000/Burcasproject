import {
    state
} from '../state/state.js'

import { mesa } from '../utils/helpers.js'
import { showToast } from '../ui/toast.js';


export function openCheckout(product_id,mesa_id) {
    state.valorTotalAtual = Number(state.totalGeral) || 0;

    if(state.parcialValor > 0 && state.parcialValor < state.valorTotalAtual){
        const newValue = Number(state.totalGeral) - Number(state.parcialValor)
        console.log(newValue)
        document.getElementById("valorTotalCheckout").innerText =
            `R$ ${newValue.toFixed(2).replace(".", ",")}`;
        document.getElementById("modalFecharConta").style.display = "flex";
        toggleCheckoutOptions();
    }

    else {
        document.getElementById("valorTotalCheckout").innerText =
            `R$ ${state.valorTotalAtual.toFixed(2).replace(".", ",")}`;
        document.getElementById("modalFecharConta").style.display = "flex";
        toggleCheckoutOptions();
    }
}

export function closeCheckout() {
    document.getElementById("modalFecharConta").style.display = "none";
}

export function toggleCheckoutOptions() {
    const tipo = document.getElementById("tipoPagamento").value;
    document.getElementById("groupDividir").style.display = (tipo === "dividir") ? "block" : "none";
    document.getElementById("groupParcial").style.display = (tipo === "parcial") ? "block" : "none";
    
    if(tipo === "dividir") calcularDivisao();
}


export function calcularDivisao() {
    const pessoas = document.getElementById("numPessoas").value || 1;
    const divisao = state.valorTotalAtual / pessoas;
    document.getElementById("resultadoDivisao").innerHTML = `Cada um paga: <b>R$ ${divisao.toFixed(2).replace(".", ",")}</b>`;
}

export async function processarPagamento() {
    const tipo = document.getElementById("tipoPagamento").value;
    let valorPago = state.valorTotalAtual;

    if (tipo === "parcial") {
        valorPago = parseFloat(document.getElementById("valorParcial").value);
                const parcialNome = document.getElementById('parcialNome').value

        try{
            if(parcialNome){
                parcialValor.push({
                    nome: parcialNome,
                    valor: valorPago
                })
            }
        }
        catch(err){
            console.log("erro na parcial " + err.message)
        }
        if (!valorPago || valorPago <= 0 || valorPago > state.valorTotalAtual) {
            return alert("Insira um valor parcial válido.");
        }
    }

    try{
        const req = await fetch('/pagaparcial',{
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                mesaNumero: mesa,
                valor: valorPago 
            })
        })
        const res =  await req.json()
    }
    catch(err){
        console.log("Erro de pagamento parcial " + err.message)
    }

    showToast("Pagamento processado com sucesso!",'green');
    closeCheckout();
    location.reload();
}