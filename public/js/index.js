async function aplicarPermissoes() {
    try {
        const response = await fetch('/api/user-info');
        const user = await response.json();

        if (user.logado) {
            console.log("Usuário logado como:", user.role);
            
            if (user.role !== 'admin') {
                const botoesRemover = document.querySelectorAll('.btn-remover');
                botoesRemover.forEach(btn => btn.style.display = 'none');
                
                if (document.querySelector('.btn-fechar')) {
                    document.querySelector('.btn-fechar').style.disabled = true;
                }
            }
        } else {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error("Erro ao verificar permissões:", error);
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
