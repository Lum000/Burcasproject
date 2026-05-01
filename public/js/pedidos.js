
let isAdmin = false;


async function aplicarNomeeLogo(){
    try{
        const req = await fetch('/lojasInfo')
        const res = await req.json()
        if(res[0].nomeLoja && !res[0].logo){
            const nome = document.getElementById("nomeLoja")
            nome.innerHTML =  '🍔 ' + res[0].nomeLoja
        }
        //Falta finalizar essa parte da logo !!!!!!!!
        else if(res[0].nomeLoja && res[0].logo){
            const nome = document.getElementById("nomeLoja")
            nome.innerHTML =  '🍔 ' + res[0].nomeLoja
        }
    }
    catch(error){
        console.log(error)
    }
}

async function isadmin(){
    const req = await fetch('/dashboard')
    const res = await req.json()
    if(res.error){
        window.location.href = "login.html"
        console.log('rodando')
    }
    console.log(res)

    if(res.role === 'admin'){
        isAdmin = true
        carregarHistorico(1)
        aplicarNomeeLogo()
    }
}


window.onload = isadmin;

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
            const extras = pedido.extras
            const dataFormatada = new Date(pedido.hora).toLocaleString('pt-BR');

            container.innerHTML += `
                <div class="item-pedido historico-grid">
                    <span class="data-hora">${dataFormatada}</span>
                    <span class="num-mesa">Mesa ${pedido.mesa_id}</span>
                    <span class="nome-prod">${product_body.nome}</span>
                    <span class="extras-prod">${extras} </span>
                    <span class="item-qtd">${pedido.quantidade}</span>
                    <span class="func">${pedido.func}</span>
                </div>
            `;
        });
    } catch (err) {
        console.error("Erro ao carregar histórico:", err);
    }
}