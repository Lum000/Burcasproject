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
    const nome = document.getElementById("user").value
    const senha = document.getElementById("password").value
    const email = document.getElementById("email").value
    const passloja = document.getElementById("passwordLoja").value
    const idLoja = document.getElementById("idLoja").value
    if(!isRegister){
        Register(nome,email,senha,idLoja,passloja)
    }
    else{
        Login(nome,senha)
    }
})


function abrirModalLoja(mensagem) {
    document.getElementById('modalLojaMensagem').textContent =
        mensagem || 'Não encontramos uma loja cadastrada. Que tal criar sua própria loja?';
    document.getElementById('modalLoja').classList.add('show');
}

function fecharModalLoja() {
    document.getElementById('modalLoja').classList.remove('show');
}

async function criarNovaLoja() {
    try{
        const req = await fetch("/criarNovaLoja", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({nomeLoja, PasswordLoja})
        });
    }
    catch(err){
        console.log("Algo deu errado ! " + err)
    }
}

async function Register(nome,email,senha,idLoja,passLoja) {
    console.log("args recebidos:", { nome, email, senha, idLoja, passLoja })
    try{
        const req = await fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({nome, email, senha, idLoja, passLoja})
        });
        const res = await req.json()
        if(req.status == 404) {
            abrirModalLoja(req.message)
        }
        if(req.status == 200){
            isRegister = false;
        }
    }
    catch(err){
        console.log("Erro na requisição de registro " + err.message)
    }
}


function criarNovaLoja() {
    fecharModalLoja();

    document.getElementById('modalCadastroLoja')
        .classList.add('show');
}

function fecharCadastroLoja() {
    document.getElementById('modalCadastroLoja')
        .classList.remove('show');
}

document.getElementById('formCadastroLoja')
.addEventListener('submit', async (e) => {
    e.preventDefault();
    CadastraLoja();
});

document.getElementById('formCadastroLoja')
.addEventListener('input', async function (e) {

    e.preventDefault();

    const nomeLoja = document.getElementById('nomeLoja');
    const idLoja = document.getElementById('idLojaCadastro');
    const senhaLoja = document.getElementById('senhaLoja').value;
    const senhaAdmin = document.getElementById('senhaAdmin').value;

    nomeLoja.addEventListener('input', function () {
        idLoja.value = nomeLoja.value
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')   // remove acentos
            .replace(/\s+/g, '-');             // espaços viram hífen
    });
});

async function CadastraLoja(){
    const nomeLoja = document.getElementById('nomeLoja').value.trim();
    const idLoja = document.getElementById('idLojaCadastro').value.trim().toLowerCase();
    const senhaLoja = document.getElementById('senhaLoja').value;
    const senhaAdmin = document.getElementById('senhaAdmin').value;
    const senhaAdminDB = 12345678;

    const feedback = document.getElementById('cadastroFeedback');
    const botao = document.getElementById('btnFinalizarLoja');

    feedback.className = 'cadastro-feedback';
    feedback.textContent = '';

    if( senhaAdmin != senhaAdminDB){
        console.log("SENHA INCORRETA")
        feedback.textContent = 'Senha do admin incoreta ! ';
        feedback.className = 'cadastro-feedback error';
        return;
    }

    if (!/^[a-z0-9_-]+$/.test(idLoja)) {
        feedback.textContent = 'Use apenas letras, números, _ ou - no identificador.';
        feedback.className = 'cadastro-feedback error';
        return;
    }

    botao.disabled = true;
    botao.textContent = 'CRIANDO LOJA...';

    try {

        const resposta = await fetch('/criar-loja', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nomeLoja,
                idLoja,
                senhaLoja
            })
        });

        const dados = await resposta.json();

        if (!resposta.status(200)) {
            throw new Error(dados.message || 'Não foi possível criar a loja.');
        }

        feedback.textContent = 'Loja criada com sucesso!';
        feedback.className = 'cadastro-feedback success';

        // Limpa os campos
        document.getElementById('formCadastroLoja').reset();

        setTimeout(() => {
            fecharCadastroLoja();
            isRegister = false;
            // Aqui você pode redirecionar para o login.
        }, 1500);

    } catch (erro) {

        feedback.textContent = erro.message;
        feedback.className = 'cadastro-feedback error';

    } finally {
        botao.disabled = false;
        botao.innerHTML = 'CRIAR MINHA LOJA <span>→</span>';
    }

};

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
        errormsg.style.display = "flex"
        errormsg.innerHTML = res.message
    }
    catch(err){
        console.log("Erro na requisição de login " + err.message)
    }
}

