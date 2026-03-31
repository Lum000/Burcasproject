function salvarInfo(){

const nome = document.getElementById("nomeLoja").value

localStorage.setItem("nomeLoja", nome)

alert("Informações salvas")

}


document.getElementById("logoInput").addEventListener("change", function(){

const file = this.files[0]

const reader = new FileReader()

reader.onload = function(e){

document.getElementById("previewLogo").src = e.target.result
localStorage.setItem("logoLoja", e.target.result)

}

reader.readAsDataURL(file)

})


function gerarMesas(){

const qtd = document.getElementById("qtdMesas").value

localStorage.setItem("qtdMesas", qtd)

const container = document.getElementById("mesasContainer")

container.innerHTML = ""

for(let i=1;i<=qtd;i++){

const mesa = document.createElement("div")

mesa.classList.add("mesa")

mesa.innerText = "Mesa "+i

container.appendChild(mesa)

}

}


window.onload = function(){

const nome = localStorage.getItem("nomeLoja")

const logo = localStorage.getItem("logoLoja")

const qtd = localStorage.getItem("qtdMesas")

if(nome) document.getElementById("nomeLoja").value = nome

if(logo) document.getElementById("previewLogo").src = logo

if(qtd){

document.getElementById("qtdMesas").value = qtd

gerarMesas()

}

document.getElementById("formMesas").addEventListener("submit", async (e)=>{

    e.preventDefault()

    const qtyMesas = document.getElementById("qtdMesas").value

    await fetch("/admin/mesas",{
        method: "POST",
        headers:{
        "Content-Type":"application/json"
        },
        body:JSON.stringify({
        mesas:qtyMesas
        })
    })
    console.log("Enviado")


});

}