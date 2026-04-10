async function aplicarPermissoes() {
    try{
        const req = await fetch('/dashboard')
        const res = await req.json()
        if(res.role != 'admin'){

        }
    }
    catch(err){
        console.log(err)
    }
}

window.onload = aplicarPermissoes;



async function carregarMesas(){

    const res = await fetch("/mesas")

    const mesas = await res.json()

    const container = document.getElementById("mesasContainer")

    container.innerHTML=""

    mesas.forEach(mesa=>{
        if(mesas.status === 300){
            div.classList.add('livre')
        }
    const div = document.createElement("div")

    div.classList.add("mesa")

    if(mesa.status==="ocupada"){
    div.classList.add("ocupada")
    }
    else if(mesa.status==="fechando"){
    div.classList.add("fechando")
    }
    else{
    div.classList.add("livre")
    }

    div.innerText="Mesa "+mesa.numero

    div.onclick = ()=>{

    window.location.href = "/mesa.html?mesa="+mesa.numero

    }

    container.appendChild(div)

    })

}

function toggleMenu(){

    const sidebar = document.getElementById("sidebar")

    sidebar.classList.toggle("active")

}

function toggleMenu(){

const sidebar = document.getElementById("sidebar")

sidebar.classList.toggle("active")

}

carregarMesas()
