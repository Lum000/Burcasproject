import {getParcial} from '../mesa/mesa.js'

export async function prepararImpressao(mesa_id) {
    // 1. Busca os dados da mesa (o que você já fez)
    const req = await fetch(`/impressao/${mesa_id}`);
    const dadosMesa = await req.json();
    const valorParcial = await getParcial(null, mesa_id)

    if (!dadosMesa || dadosMesa.length === 0) {
        return alert("Mesa vazia!");
    }

    // 2. Envia para o SERVIDOR imprimir (porque o servidor tem acesso à USB)
    try {
        const paimprimia = await fetch("/imprimir-comando", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                mesa_id: mesa_id,
                itens: dadosMesa,
                parcial: valorParcial
            })
        });

        if (paimprimia.ok) {
            alert("Imprimindo na Bematech...");
        } else {
            alert("Erro ao imprimir. Verifique a impressora no servidor.");
        }
    } catch (e) {
        console.error("Erro de rede:", e);
    }
}