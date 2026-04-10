var isRegister = true;
const button = document.getElementById('auth-btn')

function toggleAuth(event) {
    if (event) event.preventDefault();
    const authBox = document.getElementById("auth-box");
    const emailGroup = document.querySelectorAll(".email-group");
    console.log(isRegister)

    isRegister = !isRegister;

    authBox.style.pointerEvents = "none";
    authBox.style.opacity = "0.5";

    setTimeout(() => {
        if (!isRegister) {
            
            document.getElementById("auth-title").innerText = "Criar Conta";
            document.getElementById("auth-btn").innerText = "Cadastrar";
            document.getElementById("toggle-link").innerText = "Já tem conta? Faça Login";
            
            emailGroup.forEach((linha) =>{
                linha.style.display = "block";
                setTimeout(() => {
                    linha.style.opacity = "1";
                    linha.style.maxHeight = "100px";
                    linha.style.marginBottom = "25px";
                }, 10);
            })
        } else {
            document.getElementById("auth-title").innerText = "Bem-vindo";
            document.getElementById("auth-btn").innerText = "Entrar";
            document.getElementById("toggle-link").innerText = "Não tem conta? Cadastre-se";
            
            emailGroup.forEach((linha) =>{
                linha.style.opacity = "0";
                linha.style.maxHeight = "0";
                linha.style.marginBottom = "0";
                setTimeout(() => {
                    linha.style.display = "none";
                }, 300); 
            })
        }
        
        authBox.style.opacity = "1";
        authBox.style.pointerEvents = "auto";
    }, 200);
}

button.addEventListener('click', function(){
    console.log("Cliquei")
    const nome = document.getElementById("user").value
    const senha = document.getElementById("password").value
    const email = document.getElementById("email").value
    const passloja = document.getElementById("passwordLoja").value
    const idLoja = document.getElementById("idLoja").value
    if(!isRegister){
        Register(nome,email,senha,idLoja,passloja)
    }
    Login(nome,senha)
})

async function Register(nome,email,senha,idLoja,passLoja) {
    console.log("Rodando o register")
    console.log("args recebidos:", { nome, email, senha, idLoja, passLoja })
    try{
        const req = await fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({nome, email, senha, idLoja, passLoja})
        });
        const res = await req.json()
        console.log(res)
    }
    catch(err){
        console.log("Erro na requisição de registro " + err.message)
    }
}
async function Login(email,password) {
    try{
        const req = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({email,password})
        });
        const res = await req.json()
        if(res.ok){
            window.location.href = 'index.html'
        }
        const errormsg = document.getElementById("errormsg")
        errormsg.innerHTML = res.message
    }
    catch(err){
        console.log("Erro na requisição de login " + err.message)
    }
}

