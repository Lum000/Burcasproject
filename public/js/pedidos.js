
function toggleMenu(){

const sidebar = document.getElementById("sidebar")

sidebar.classList.toggle("active")

}

async function carregarHistorico(dias, elemento) {
    if (elemento) {
        const botoes = document.querySelectorAll('.filtros-container button');
        
        botoes.forEach(btn => btn.classList.remove('btn-destaque'));
        
        elemento.classList.add('btn-destaque');
    }
    try {
        const response = await fetch(`/historico-filtrado/${dias}`);
        const pedidos = await response.json();
        const container = document.getElementById('listaHistorico');
        container.innerHTML = '';

        pedidos.forEach(async pedido => {
            const req = await fetch(`getprodutobody/${pedido.produto_id}`)
            const product_body = await req.json()
            const dataFormatada = new Date(pedido.hora).toLocaleString('pt-BR');

            container.innerHTML += `
                <div class="item-pedido historico-grid">
                    <span class="data-hora">${dataFormatada}</span>
                    <span class="num-mesa">Mesa ${pedido.mesa_id}</span>
                    <span class="nome-prod">${product_body.nome}</span>
                    <span class="item-qtd">${pedido.quantidade}</span>
                    <span class="status-badge ${product_body.status}">${pedido.status}</span>
                </div>
            `;
        });
    } catch (err) {
        console.error("Erro ao carregar histórico:", err);
    }
}

// Chama a função ao carregar a página
window.onload = carregarHistorico(1);