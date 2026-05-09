import {
    state
} from '../state/state.js'

import {
    adicionarAoCarrinho
} from '../cart/cart.js'

let precoFinalComExtras = 0

export function openProdModal(botao) {
    document.body.style.overflow = "hidden"
    const id = botao.dataset.id;
    const nome = botao.dataset.nome;
    const precoBase = parseFloat(botao.dataset.preco); // Preço original do produto
    const img = botao.dataset.img;
    const descricao = botao.dataset.desc;
    
    let extras = [];
    try {
        extras = JSON.parse(botao.dataset.extras);
    } catch (e) {
        extras = [];
    }

    // RESET DE ESTADO DO MODAL
    state.listaExtras = []; 
    let valorExtrasAcumulado = 0;
    document.getElementById("modalObs").value = ""; // Limpa observação anterior

    // Interface
    document.getElementById("productModal").style.display = "flex";
    document.getElementById("modalImg").src = "/uploads/" + img;
    document.getElementById("modalNome").innerText = nome;
    document.getElementById("modalDescricao").innerText = descricao;
    document.getElementById("modalPreco").innerText = precoBase.toFixed(2);

    const extradiv = document.querySelector(".extras");
    extradiv.innerHTML = ""; 
    extras.sort((a, b) => parseFloat(b.preco) - parseFloat(a.preco));

    // Renderiza Extras
    extras.forEach(item => {
        const label = document.createElement("label");
        label.className = "extra-item";
        label.innerHTML = `
            <input type="checkbox" value="${item.preco}" data-name="${item.nome}">
            ${item.nome} + R$ ${parseFloat(item.preco).toFixed(2)}
        `;
        
        // Evento de mudança no checkbox
        const input = label.querySelector('input');
        input.addEventListener('change', (e) => {
            const precoExtra = parseFloat(e.target.value);
            const nomeExtra = e.target.getAttribute('data-name');

            if (e.target.checked) {
                state.listaExtras.push({
                    nome: nomeExtra,
                    preco: precoExtra
                })
                valorExtrasAcumulado += precoExtra;
            } else {
                state.listaExtras = state.listaExtras.filter(e => e.nome !== nomeExtra)
                valorExtrasAcumulado -= precoExtra;
            }

            // Atualiza o preço exibido no modal em tempo real
            const totalModal = precoBase + valorExtrasAcumulado;
            state.valorTotalComExtras = totalModal;

            document.getElementById("modalPreco").innerText = totalModal.toFixed(2);
        });

        extradiv.appendChild(label);
    });

    const button = document.getElementById("addprod");


    button.onclick = function() {
        const obs = document.getElementById('modalObs').value.trim();
        const qty = document.getElementById('qty_input');

        precoFinalComExtras = precoBase + valorExtrasAcumulado;
        

        adicionarAoCarrinho(
            id,
            nome,
            precoBase,
            qty.value,
            obs,
            [...state.listaExtras]
        );
        
        closeProdModal();
        qty.value = 1;
    };
}

export function closeProdModal(){
    document.getElementById("productModal").style.display="none"

    const modalPrincipal = document.getElementById("productAlert")

    if(modalPrincipal.style.display !== "flex"){
        document.body.style.overflow = "auto"
    }
}