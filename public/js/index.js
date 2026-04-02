async function carregarMesas(){

const res = await fetch("/mesas")

const mesas = await res.json()

const container = document.getElementById("mesasContainer")

container.innerHTML=""


mesas.forEach(mesa=>{

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

carregarMesas()
