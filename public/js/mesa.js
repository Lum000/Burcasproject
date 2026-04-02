
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

async function getProducts(id,mesa) {
    console.log("ID DA MESA É " + id)
    const res = await fetch(`mesa/${mesa}/products/${id}`)
    const mesa_products = await res.json()
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
    const res_body = await res.json()
    console.log(res_body)
    renderProducts(res_body)
}

function renderProducts(lista){
    
    const divProducts = document.getElementById("productsList")
    divProducts.innerHTML = ""
    lista.forEach(produto =>{
            divProducts.innerHTML += `
        <div class="product-item" data-id="${produto.id}" onclick="addProduct(${produto.id})">

        <div class="product-name">
            ${produto.nome}
        </div>

        <div class="product-price">
            R$ ${produto.preco}
        </div>

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