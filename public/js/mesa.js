let isAdmin = false;


async function isadmin(){
    const req = await fetch('/dashboard')
    const res = await req.json()
    if(res.error){
        window.location.href = "login.html"
        console.log('rodando')
    }
    console.log(res)

    if(res.role === 'admin'){isAdmin = true}
    togleAdmin()
}

function togleAdmin(){
    const btn_remover = document.querySelectorAll('.btn_remover')
    if(isAdmin){
        adminpanel.forEach((item) =>{
            item.style.display = 'block';
        })
    }
    adminpanel.forEach((item) =>{
        item.style.display = 'none';
    })
}

window.onload = isadmin;


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


async function getProducts(id, mesa) {
    const res = await fetch(`mesa/${mesa}/products/${id}`);
    const mesa_products = await res.json();
    const divPedidos = document.querySelector(".pedidos");
    
    // Limpamos a div logo no início
    divPedidos.innerHTML = "";

    // Caso a mesa esteja vazia
    if (!Array.isArray(mesa_products) || mesa_products.length === 0) {
        divPedidos.innerHTML = `
            <div class="sem-produtos">
                <p>MESA LIVRE</p>
                <button class="btn-adicionar" onclick="openAdd()">
                    + Adicionar Produto
                </button>
            </div>`;
        return; 
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
                <button class="btn_remover" onclick='deletarItem(${dados.id}, ${item.mesa_id})'>🗑️</button>
            </div>
        `;
        listaItens.appendChild(div);
    }
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
async function addProdutoMesa(product_id,mesa_id,idLoja) {
    try{
        await fetch('/add-multi-products' )
        showToast()
        closeAlert()
        verifyMesa()
    }
    catch(err){
        console.log("Erro ao adicionar produto " + err)
    }
}
async function pegaridMesa(){
    const mesa_res = await fetch ("mesa/" + mesa)
    const mesa_result = await mesa_res.json()
    confirmarPedido(mesa_result[0].id)

}

function renderProducts(lista) {
    const divProducts = document.getElementById("productsList");
    
    divProducts.innerHTML = "";

    let htmlGerado = "";

    lista.forEach(produto => {
        // Garantimos que extras e descrição nunca sejam null
        const extrasStr = produto.extras || "[]"; 
        const descricaoStr = produto.descricao || "";
        const precoFormatado = Number(produto.preco).toFixed(2).replace('.', ',');

        htmlGerado += `
            <div class="product-item">
                <img src="/uploads/${produto.img}" alt="${produto.nome}">

                <div class="product-name">
                    ${produto.nome}
                </div>
                <div class="preco">
                    R$ ${precoFormatado}
                </div>
                
                <button class="add" 
                    data-id="${produto.id}"
                    data-nome="${produto.nome}"
                    data-preco="${produto.preco}"
                    data-img="${produto.img}"
                    data-desc="${descricaoStr}"
                    data-extras='${extrasStr}'
                    onclick="openProdModal(this)">
                    Adicionar
                </button>
            </div>
        `;
    });
    // adicionarAoCarrinho(${produto.id},'${produto.nome}',${produto.preco})

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

let carrinhoTemporario = [];
let listaExtras = [];

/*Multiplo envio de produtos */

async function confirmarPedido(mesa_id) {
    if (carrinhoTemporario.length === 0) return alert("Adicione itens primeiro!");

    const res = await fetch("/add-multi-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            mesa_id: mesa_id,
            itens: carrinhoTemporario
        })
    });
    console.log(res)
    if (res.ok) {
        alert("Pedido enviado!");
        carrinhoTemporario = []; // Limpa o carrinho após o sucesso
        verifyMesa(); // Atualiza a tela da mesa
        closeAlert()
    }
}

function adicionarAoCarrinho(produtoId, nome, preco, obs, extrasSelecionados) {
    // Criamos a string de extras para exibição e comparação
    const extrasString = extrasSelecionados.length > 0 ? extrasSelecionados.sort().join(", ") : "Sem adicionais";
    
    // Chave única: ID + Extras + Obs
    const itemKey = `${produtoId}-${extrasString}-${obs}`;

    const indexExistente = carrinhoTemporario.findIndex(item => {
        return `${item.id}-${item.extras}-${item.obs}` === itemKey;
    });

    if (indexExistente !== -1) {
        // Se for exatamente igual, aumenta a quantidade
        carrinhoTemporario[indexExistente].quantidade += 1;
    } else {
        // Se for diferente (outro extra ou outra obs), cria nova linha
        carrinhoTemporario.push({ 
            id: produtoId, 
            nome: nome, 
            preco: preco, 
            quantidade: 1, 
            extras: extrasString, 
            obs: obs 
        });
    }

    showToast();
    renderizarCarrinhoTemporario();
}
function renderizarCarrinhoTemporario() {
    const listaLateral = document.getElementById("carrinhoTemporarioList");
    const totalTexto = document.getElementById("totalCarrinhoTemp");
    
    
    // Limpa a lista antes de redesenhar
    listaLateral.innerHTML = "";
    
    if (carrinhoTemporario.length === 0) {
        listaLateral.innerHTML = '<p class="empty-cart-msg">Nenhum item selecionado</p>';
        totalTexto.innerText = "R$ 0,00";
        return;
    }

    let somaTotal = 0;

    carrinhoTemporario.forEach((item, index) => {
        const displayExtras = item.extras;
        const displayObs = item.obs ? ` / Obs: ${item.obs}` : "";
        const subtotal = item.preco * item.quantidade;
        console.log("Produto com os extras " + item.extras)
        somaTotal += subtotal;

        const divItem = document.createElement("div");
        divItem.className = "temp-item";
        divItem.innerHTML = `
            <div class="temp-item-content">
                <div class="temp-item-header">
                    <div class="temp-item-info">
                        <span class="temp-item-name">${item.nome}</span>
                        <span class="temp-item-qty">${item.quantidade}x R$ ${item.preco.toFixed(2)}</span>
                    </div>
                    <div class="temp-item-actions">
                        <span class="temp-item-price">R$ ${subtotal.toFixed(2)}</span>
                        <button class="btn-del-temp" onclick="removerDoCarrinhoTemp(${index},${item.quantidade})">✕</button>
                    </div>
                </div>
                
                <div class="prod_desc">
                    <i class="icon-obs">✎</i>
                    <span class="temp-item-details">${displayExtras}${displayObs}</span>
                </div>
            </div>
        `;
        listaLateral.appendChild(divItem);
    });


    totalTexto.innerText = `R$ ${somaTotal.toFixed(2)}`;
}
function removerDoCarrinhoTemp(index,qty){
    carrinhoTemporario.splice(index,qty)
    renderizarCarrinhoTemporario()
}

/*Salvar obs no carrinho */
function desmarcarTudo() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

/**Open Modal de produto */

function openProdModal(botao) {
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
    listaExtras = []; // Limpa a lista global de nomes de extras
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
                listaExtras.push(nomeExtra);
                valorExtrasAcumulado += precoExtra;
            } else {
                listaExtras = listaExtras.filter(n => n !== nomeExtra);
                valorExtrasAcumulado -= precoExtra;
            }

            // Atualiza o preço exibido no modal em tempo real
            const totalModal = precoBase + valorExtrasAcumulado;
            document.getElementById("modalPreco").innerText = totalModal.toFixed(2);
        });

        extradiv.appendChild(label);
    });

    // CONFIGURAÇÃO DO BOTÃO SALVAR (IMPORTANTE: .onclick substitui o evento anterior)
    const button = document.getElementById("addprod");
    button.onclick = function() {
        const obs = document.getElementById('modalObs').value.trim();
        const precoFinalComExtras = precoBase + valorExtrasAcumulado;
        
        // Passamos a lista de extras atual
        adicionarAoCarrinho(id, nome, precoFinalComExtras, obs, [...listaExtras]);
        
        closeProdModal();
    };
}

function closeProdModal(){
    document.getElementById("productModal").style.display="none"
}




/*Open Modal de pagamento  */


let valorTotalAtual = 0;

function openCheckout(product_id,mesa_id) {
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