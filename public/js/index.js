let isAdmin = false;



async function aplicarNomeeLogo(){
    const logoLoja = document.getElementById("logoLoja")
    try{
        const req = await fetch('/lojasInfo')
        const res = await req.json()
        if(res[0].nomeLoja && !res[0].logo){
            const nome = document.getElementById("nomeLoja")
            nome.innerHTML =  '🍔 ' + res[0].nomeLoja
            carregarMesas()
        }
        //Falta finalizar essa parte da logo !!!!!!!!
        else if(res[0].nomeLoja && res[0].logo){
            const caminhoLogo = String(res[0].logo);
            const nome = document.getElementById("nomeLoja")
            nome.innerHTML =res[0].nomeLoja
            logoLoja.src = /^(\/|https?:\/\/)/i.test(caminhoLogo)
            ? caminhoLogo
            : `/uploads/${res[0].idLoja}/${caminhoLogo}`;
            logoLoja.onerror = () => {
            logoLoja.hidden = true;
            };
            carregarMesas()
        }
    }
    catch(error){
        console.log(error)
    }
}
async function aplicarPermissoes() {
    try{
        const req = await fetch('/dashboard')
        const res = await req.json()
        if(res.error){
            window.location.href = 'login.html'
        }
        isAdmin = res.role
        console.log(res)
        togleAdmin()
        aplicarNomeeLogo()
    }
    catch(err){
        console.log(err)
    }
}

window.onload = aplicarPermissoes;

function togleAdmin(){
    console.log(isAdmin)
    const adminpanel = document.querySelectorAll('.adminpanel')
    if(isAdmin === 'admin'){
        adminpanel.forEach((item) =>{
            item.style.display = 'block';
        })
    }
    else{
        adminpanel.forEach((item) =>{
        item.style.display = 'none';
    })
    }

}



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

