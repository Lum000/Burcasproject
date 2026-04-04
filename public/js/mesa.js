


function toggleMenu(){

const sidebar = document.getElementById("sidebar")

sidebar.classList.toggle("active")

}

const urlParams = new URLSearchParams(window.location.search);
const mesa = urlParams.get('mesa');
function showToast(){

    const toast = document.getElementById("toastAdd")

    toast.classList.add("show")

    setTimeout(()=>{
        toast.classList.remove("show")
    },1500)

}
function showAdminModal(product_id,mesa_id) {
    document.getElementById("adminModal").style.display = "flex";
    document.getElementById("adminPassword").value = ""; // Limpa a senha
    document.getElementById("adminError").style.display = "none"; // Limpa erro
    const button = document.getElementById('confirmarSenha')
    button.addEventListener('click', async function(){
        const senhaInput = document.getElementById("adminPassword").value;
        const erro = document.getElementById("adminError");
        
        const SENHA_MESTRA = "1234"; // Defina sua senha aqui

        if (senhaInput === SENHA_MESTRA) {
            closeAdminModal();
            deletarItem(product_id,mesa_id)
            
        } else {
            erro.style.display = "block";
            // Efeito de balançar o input (opcional)
            document.getElementById("adminPassword").style.borderColor = "#e74c3c";
        }
    })
}

// Fecha o modal
function closeAdminModal() {
    document.getElementById("adminModal").style.display = "none";
}


// Fecha se clicar fora do box
window.onclick = function(event) {
    const modal = document.getElementById("adminModal");
    if (event.target == modal) {
        closeAdminModal();
    }
}

async function getProducts(id,mesa) {
    const res = await fetch(`mesa/${mesa}/products/${id}`)
    const mesa_products = await res.json()
    let totalGeral = 0
    if(!mesa_products[0]){
        const divPedidos = document.querySelector(".pedidos")
        divPedidos.innerHTML = ""

        const div = document.createElement("div")

        div.innerHTML = `SEM PRODUTOS <br>
        <button class="btn" onclick="openAdd()">
        + Adicionar Produto
        </button>`

        divPedidos.appendChild(div)
    }
    else {
        const divPedidos = document.querySelector(".pedidos");
        
        // 1. Limpamos a div ANTES do loop para começar do zero
        divPedidos.innerHTML = "<h2>Pedidos</h2>"; 
        
        let totalGeral = 0;

        // 2. Criamos um container para os itens (estética e organização)
        const listaItens = document.createElement("div");
        listaItens.className = "lista-itens-scroll"; 
        divPedidos.appendChild(listaItens);

        for (const item of mesa_products) {
            // Buscamos os dados do produto específico deste item do loop
            const dadosreq = await fetch("/getprodutobody/" + item.produto_id);
            const dados = await dadosreq.json();

            // Cálculo do total
            totalGeral += dados.preco * item.quantidade;

            // Criamos a div do item individual
            const div = document.createElement("div");
            div.innerHTML = ` 
                <div class="pedido-item">
                    <div class="item-img"><img src='/uploads/${dados.img}' style="border-radius:10px;"></div>
                    <div class="item-detalhes">
                        <span class="item-nome">${dados.nome}</span>
                        <span class="item-preco">R$ ${dados.preco.toFixed(2)}</span>
                    </div>
                    <div class="item-controles">
                        <button class="btn-qtd" onclick='menosUm(${dados.id}, ${item.mesa_id})'>-</button>
                        <span class="qtd-numero">${item.quantidade}</span>
                        <button class="btn-qtd" onclick='maisUm(${dados.id}, ${item.mesa_id})'>+</button>
                    </div>
                    <button class="btn-remover" onclick='showAdminModal(${dados.id},${item.mesa_id})'>🗑️</button>
                </div>
            `;

            listaItens.appendChild(div);
        }

        // 3. Após o loop, adicionamos o Total e o Botão de Adicionar (apenas uma vez)
        const footer = document.createElement("div");
        footer.innerHTML = `
            <div class="total" style="margin-top: 20px; font-weight: bold; font-size: 1.2rem;">
                Total: <span> R$ ${totalGeral.toFixed(2)} </span> 
            </div>
            <br>
            <div class="footer">
                <button class="btn-adicionar" onclick="openAdd()">
                    <span class="icon">+</span> Adicionar Produto
                </button>
                <button class="btn-fechar" onclick="fecharComanda()">
                    <span>✅</span> Fechar Comanda
                </button>
            </div>
        `;
        divPedidos.appendChild(footer);
    }

}
async function deletarItem(productid,mesaid) {
    try{
        const req  = await fetch('/deletarProduto/' + productid + '/' + mesaid)
        const res = await req.json()
        console.log(res)
        verifyMesa()
    }
    catch(err){
        console.log("Erro ao apagar item  " + err)
    }
}

async function menosUm(productid,mesaid) {
    try{
        await fetch('/menosUm/' + productid + '/' + mesaid)
        verifyMesa()
    }
    catch(err){
        console.log("Erro ao alterar a qauntidade " + err)
    }
}
async function maisUm(productid,mesaid) {
    try{
        const res = await fetch('/addMore/' + productid + '/' + mesaid)
        const row = await res.json()
        verifyMesa()
    }
    catch(err){
        console.log("Erro ao alterar a qauntidade " + err)
    }
}

async function verifyMesa(){
    const res = await fetch ("mesa/" + mesa)
    const mesasinfo = await res.json()
    document.getElementById("mesaStatus").innerHTML = "Status: " + mesasinfo[0].status.toUpperCase()
    document.getElementById("mesaNumero").innerHTML = "Mesa " + mesa
    getProducts(mesasinfo[0].id,mesa)
}

async function openAdd() {
    document.getElementById("productAlert").style.display = "flex"
    showCategory("lanches")
}
function closeAlert(){
    document.getElementById("productAlert").style.display = "none"
}

async function showCategory(category){
    const res = await fetch("/products/" + category)


    document.querySelectorAll(".categories div").forEach(cat=>{
    cat.classList.remove("active")
    })

    /* adiciona na clicada */
    const activeCategory = document.getElementById(category)
    activeCategory.classList.add("active")


    const res_body = await res.json()
    renderProducts(res_body)
}
async function addProdutoMesa(product_id,mesa_id) {
    try{
        await fetch('/addproduct/' + mesa_id + '/' + product_id)
        showToast()
        closeAlert()
        getProducts(mesa_id,mesa)
    }
    catch(err){
        console.log("Erro ao adicionar produto " + err)
    }
}
async function pegarProduto(id){
    const mesa_res = await fetch ("mesa/" + mesa)
    const mesa_result = await mesa_res.json()
    addProdutoMesa(id,mesa_result[0].id)

}

function renderProducts(lista){
    
    const divProducts = document.getElementById("productsList")
    divProducts.innerHTML = ""
    lista.forEach(produto =>{
            divProducts.innerHTML += `
        <div class="product-item" data-id="${produto.id}">
            <img src="/uploads/${produto.img}">

            <div class="product-name">
                ${produto.nome}
            </div>
            <div class="preco">
                R$ ${produto.preco}
            </div>
            <button class="add" onclick="pegarProduto(${produto.id})">Adicionar</button>

        </div>
    `
    })
}




function renderPedidos(lista){

    const divPedidos = document.querySelector(".pedidos")

    divPedidos.innerHTML = ""

    lista.forEach(pedido => {

        divPedidos.innerHTML += `
        <div class="pedido">
        <span>${pedido.nome}</span>
        <span>R$${pedido.preco}</span>
        </div>
        `

    })
}
verifyMesa()