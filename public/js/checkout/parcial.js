async function processarPagamento() {
    const tipo = document.getElementById("tipoPagamento").value;
    let valorPago = valorTotalAtual;

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
        if (!valorPago || valorPago <= 0 || valorPago > valorTotalAtual) {
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

    alert("Pagamento processado com sucesso!");
    closeCheckout();
    location.reload();
}