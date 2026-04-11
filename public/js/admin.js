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






document.getElementById("formMesas").addEventListener("submit", async (e)=>{

    e.preventDefault()

    const res = await fetch('/dashboard', {
        credentials: 'include' 
    });
    const data = await res.json()
    const idLoja = data.idLoja

    const qtyMesas = document.getElementById("qtdMesas").value

    await fetch("/admin/mesas",{
        method: "POST",
        headers:{
        "Content-Type":"application/json"
        },
        body:JSON.stringify({
        mesas:qtyMesas,
        idLoja: idLoja
        })
    })
    console.log("Enviado")


});

