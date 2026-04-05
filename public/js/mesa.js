


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

async function getProducts(id, mesa) {
    const res = await fetch(`mesa/${mesa}/products/${id}`);
    const mesa_products = await res.json();
    const divPedidos = document.querySelector(".pedidos");
    
    // Limpamos a div logo no início
    divPedidos.innerHTML = "";

    // Caso a mesa esteja vazia
    if (!mesa_products || mesa_products.length === 0) {
        divPedidos.innerHTML = `
            <div class="sem-produtos">
                <p>SEM PRODUTOS</p>
                <button class="btn-adicionar" onclick="openAdd()">
                    + Adicionar Produto
                </button>
            </div>`;
        return; // Para a execução aqui
    }

    // Caso tenha produtos
    divPedidos.innerHTML = "<h2>Pedidos</h2>";
    let totalGeral = 0;

    const listaItens = document.createElement("div");
    listaItens.className = "lista-itens-scroll";
    divPedidos.appendChild(listaItens);

    // Loop pelos itens
    for (const item of mesa_products) {
        const dadosreq = await fetch("/getprodutobody/" + item.produto_id);
        const dados = await dadosreq.json();

        totalGeral += dados.preco * item.quantidade;

        const div = document.createElement("div");
        div.innerHTML = ` 
            <div class="pedido-item">
                <div class="item-img"><img src='/uploads/${dados.img}' style="width:50px; border-radius:10px;"></div>
                <div class="item-detalhes">
                    <span class="item-nome">${dados.nome}</span>
                    <span class="item-preco">R$ ${dados.preco.toFixed(2)}</span>
                </div>
                <div class="item-controles">
                    <button class="btn-qtd" onclick='menosUm(${dados.id}, ${item.mesa_id})'>-</button>
                    <span class="qtd-numero">${item.quantidade}</span>
                    <button class="btn-qtd" onclick='maisUm(${dados.id}, ${item.mesa_id})'>+</button>
                </div>
                <button class="btn-remover" onclick='showAdminModal(${dados.id}, ${item.mesa_id})'>🗑️</button>
            </div>
        `;
        listaItens.appendChild(div);
    }

    // FOOTER (Fora do loop)
    // Aqui usamos o 'id' e 'mesa' que vieram dos PARÂMETROS da função getProducts
    const footer = document.createElement("div");
    footer.className = "pedido-footer";
    footer.innerHTML = `
        <div class="total" style="margin-top: 20px; font-weight: bold; font-size: 1.2rem;">
            Total: <span> R$ ${totalGeral.toFixed(2)} </span> 
        </div>
        <br>
        <div class="footer-buttons" style="display: flex; gap: 10px;">
            <button class="btn-adicionar" onclick="openAdd()">
                <span class="icon">+</span> Adicionar
            </button>
            <button class="btn-fechar" onclick="openCheckout(${id}, ${mesa})">
                <span>✅</span> Fechar Comanda
            </button>
            <button class="btn-imprimir" onclick="prepararImpressao(${id})">
                <span>🖨️</span> Imprimir
            </button>
        </div>
    `;
    divPedidos.appendChild(footer);
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
    const res = await fetch(`/products/${category}`)


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

function renderProducts(lista) {
    const divProducts = document.getElementById("productsList");
    
    divProducts.innerHTML = "";

    let htmlGerado = "";

    lista.forEach(produto => {
        const precoFormatado = Number(produto.preco).toFixed(2).replace('.', ',');

        htmlGerado += `
            <div class="product-item" data-id="${produto.id}">
                <img src="/uploads/${produto.img}" alt="${produto.nome}">

                <div class="product-name">
                    ${produto.nome}
                </div>
                <div class="preco">
                    R$ ${precoFormatado}
                </div>
                <button class="add" onclick="pegarProduto(${produto.id})">
                    Adicionar
                </button>
            </div>
        `;
    });

    divProducts.innerHTML = htmlGerado;
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




/*Open Modal de pagamento  */


let valorTotalAtual = 0;

function openCheckout(product_id,mesa_id) {
    imprimirPedido(product_id,mesa_id)
    const totalTexto = document.querySelector(".total").innerText;
    valorTotalAtual = parseFloat(totalTexto.replace("Total: R$ ", "").replace(",", "."));

    document.getElementById("valorTotalCheckout").innerText = `R$ ${valorTotalAtual.toFixed(2).replace(".", ",")}`;
    document.getElementById("modalFecharConta").style.display = "flex";
    toggleCheckoutOptions();
}

function closeCheckout() {
    document.getElementById("modalFecharConta").style.display = "none";
}

function toggleCheckoutOptions() {
    const tipo = document.getElementById("tipoPagamento").value;
    document.getElementById("groupDividir").style.display = (tipo === "dividir") ? "block" : "none";
    document.getElementById("groupParcial").style.display = (tipo === "parcial") ? "block" : "none";
    
    if(tipo === "dividir") calcularDivisao();
}

function calcularDivisao() {
    const pessoas = document.getElementById("numPessoas").value || 1;
    const divisao = valorTotalAtual / pessoas;
    document.getElementById("resultadoDivisao").innerHTML = `Cada um paga: <b>R$ ${divisao.toFixed(2).replace(".", ",")}</b>`;
}

async function processarPagamento() {
    const tipo = document.getElementById("tipoPagamento").value;
    let valorPago = valorTotalAtual;

    if (tipo === "parcial") {
        valorPago = parseFloat(document.getElementById("valorParcial").value);
        if (!valorPago || valorPago <= 0 || valorPago > valorTotalAtual) {
            return alert("Insira um valor parcial válido.");
        }
    }

    // Aqui você enviaria para o seu backend
    console.log(`Processando pagamento de R$ ${valorPago} via ${tipo}`);

    alert("Pagamento processado com sucesso!");
    closeCheckout();
    location.reload(); // Recarrega para limpar a mesa
}

/*Imrpessao do pagamento  */
async function prepararImpressao(mesa_id) {
    // 1. Busca os dados da mesa (o que você já fez)
    const req = await fetch(`/impressao/${mesa_id}`);
    const dadosMesa = await req.json();
    console.log(mesa_id)

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
                itens: dadosMesa
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
verifyMesa()