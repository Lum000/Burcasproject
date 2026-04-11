const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const path = require("path")
require('dotenv').config();

const cookieParser = require('cookie-parser');


const bcrypt = require('bcrypt')
const saltRounds = 10


const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET

const multer = require("multer")
const res = require("express/lib/response")

const app = express()
app.use(cookieParser());
app.use(express.json())
app.use(express.static("public"))

const db = new sqlite3.Database("lanchonete.db")

// cria tabelas
db.serialize(() => {
  
  /* CRIAÇÃO TABELA INFO DAS LOJAS */
  db.run(`
    CREATE TABLE IF NOT EXISTS lojasInfo
    (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idLoja TEXT UNIQUE,
      logo TEXT,
      user TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    )
  `)
  
  /*Tabela das Mesas */
  db.run(`
    CREATE TABLE IF NOT EXISTS mesas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero INTEGER UNIQUE,
      status TEXT,
      idLoja TEXT NOT NULL,
      qty INTEGER
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      img TEXT NOT NULL,
      nome TEXT,
      extras TEXT,
      descricao TEXT NOT NULL,
      categoria TEXT,
      idLoja  TEXT NOT NULL,
      preco REAL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mesa_id INTEGER,
      produto_id INTEGER,
      quantidade INTEGER NOT NULL CHECK (quantidade >= 0),
      desc TEXT,
      idLoja TEXT NOT NULL,
      status TEXT,
      hora TEXT
    )
  `)
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    email TEXT,
    idLoja TEXT,
    passLoja TEXT
  )`)
  db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_pedido_unico 
    ON pedidos (mesa_id, produto_id, status);`)
})

/* Armazenar as logos e imagens */
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const idLoja = req.body.idLoja || 'geral';
    const pasta = `uploads/${idLoja}`;

    // Cria a pasta se não existir
    const fs = require('fs');
    fs.mkdirSync(pasta, { recursive: true });

    cb(null, pasta);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({storage:storage})

app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use("/uploads",express.static("uploads"))


//Verificar role

function verifyToken(req, res, next) {
  const token = req.cookies.token
    || req.headers.authorization?.split(' ')[1]; 

  if (!token) return res.status(401).json({ error: 'Não autenticado' });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

function checkRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Sem permissão' });
    }
    next();
  };
}

// Verificar usuario
app.get('/dashboard', verifyToken, (req, res) => {
  return res.status(200).json({ msg: `Olá, ${req.user.nome}`, role: `${req.user.role}`, idLoja: `${req.user.idLoja}` });
});

//Registro

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Campos obrigatórios' });
  }

  const isEmail = email.includes('@');
  const campo   = isEmail ? 'email' : 'user';
  const valor   = email.trim().toLowerCase();

  try {
    db.get(`SELECT * FROM usuarios WHERE ${campo} = ?`, [valor], async (err, row) => {
      if (err)  return res.status(500).json({ message: 'Erro no banco: ' + err.message });
      if (!row) return res.status(401).json({ message: 'Verifique os campos' });

      const valid = await bcrypt.compare(password, row.password);
      if (!valid) return res.status(401).json({ message: 'Verifique os campos' });

      const token = jwt.sign(
        { id: row.id, nome: row.user , role: row.role, idLoja: row.idLoja},
        process.env.JWT_SECRET,
        { expiresIn: '9h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 8 * 60 * 60 * 1000
      });

      return res.json({ ok: true, role: row.role });
    });

  } catch (err) {
    return res.status(500).json({ message: 'Erro: ' + err.message });
  }
});


app.post('/register', async (req,res) =>{
  const {nome,email,senha,idLoja,passLoja} = req.body
  const nomeNorm = nome.trim().toLowerCase();
  const emailNorm = email.trim().toLowerCase();
  const idLojaNorm = idLoja.trim().toLowerCase();

  console.log(nome,email,idLoja,passLoja,senha)
  db.get("SELECT password FROM lojasInfo WHERE idLoja = ?",[idLojaNorm], async (err,result) =>{
    if(err){
      res.status(402).json({message:  "Senha ou IDLoja Não Conferem !! "})
    }
    const isValid = await bcrypt.compare(passLoja, result.password)
    if(isValid){
        try{
          const hashedpassword = await bcrypt.hash(senha,saltRounds)
          const query = "INSERT INTO usuarios (user,password,email,idLoja,passLoja) VALUES (?,?,?,?,?)"
          db.run(query,[nomeNorm,hashedpassword,emailNorm,idLojaNorm,result.password], (err,result) =>{
            if(err){
              return res.status(400).json({message:"Erro ao registrar usuario" + err.message})
            }
            return res.status(200).json({message: "Exito ao criar usuario na loja " + idLoja})
          })
        }
        catch(err){
          return res.status(400).json({message:"Erro ao registrar usuario " + err.message} )
        }
    }
  })
}) 






/* Recupera o id da mesa selecionada */

app.get ("/mesa/:id",(req,res)=>{
    db.all("SELECT * FROM mesas WHERE numero = ?",[req.params.id],(err,row) =>{
        if(err){
            console.log("Erro ao recuperar dados da mesa " + err)
        }
        if(row){
            res.json(row)
        }
    })
})



/*Imprimi Produto0 */
async function dispararImpressao(mesa_id, itens) {
  console.log("Rodando impressão ! " , itens)
    // let printer = new ThermalPrinter({
    //     type: Types.EPSON,
    //     interface: '\\\\localhost\\BEMATECH',
    //     characterSet: 'PC860_PORTUGUESE',
    //     width: 42
    // });

    let printer = new ThermalPrinter({
        type: Types.EPSON, // Ou BEMATECH
        interface: './simulacao_cupom.txt', // Cria um arquivo na raiz do projeto
        width: 42, // Largura padrão da Bematech de 80mm
        characterSet: 'PC860_PORTUGUESE'
    });



    try {
        printer.alignCenter();
        printer.bold(true);
        printer.println("NOVO PEDIDO - COZINHA");
        printer.println(`MESA: ${mesa_id}`);
        printer.bold(false);
        printer.println("--------------------------------");

        itens.forEach(item => {
          const nomeSeguro = (item.nome && typeof item.nome === 'string') ? item.nome : "PRODUTO";
          
          const nomeBase = nomeSeguro.substring(0, 30).toUpperCase().padEnd(32);
          const qtdBase = `x${item.quantidade || 1}`.padStart(6);
          
          printer.println(nomeBase + qtdBase);

          if (item.desc && typeof item.desc === 'string') {
              const obs = item.desc.trim().toUpperCase();
              if (obs !== "") {
                  printer.println(`  >> OBS: ${obs}`);
              }
          }

          printer.println("-".repeat(42)); 
      });

        printer.println("--------------------------------");
        printer.println(`HORA: ${new Date().toLocaleTimeString('pt-BR')}`);
        printer.newLine();
        printer.newLine();
        printer.newLine();
        printer.newLine();
        printer.cut();

        await printer.execute();
        console.log("Pedido enviado para a cozinha!");
    } catch (error) {
        console.error("Erro na impressora física:", error);
    }
}
/* Imprimir dados */

app.post("/add-multi-products", (req, res) => {
    const { mesa_id, itens,idLoja} = req.body;
    console.log("Body: " , req.body)

    if (!itens || itens.length === 0) {
        return res.status(400).json({ error: "Carrinho vazio" });
    }

    db.serialize(() => {
        itens.forEach((item) => {
            const sqlBusca = "SELECT id, quantidade FROM pedidos WHERE mesa_id = ? AND produto_id = ? AND status = 'aberto'";
            
            db.get(sqlBusca, [mesa_id, item.id], (err, row) => {
                if (err) {
                    console.error("Erro na busca:", err);
                    return;
                }

                if (row) {
                    const novaQtd = row.quantidade + item.quantidade;
                    db.run("UPDATE pedidos SET quantidade = ? WHERE id = ?", [novaQtd, row.id]);
                } else {
                    const sqlInsert = "INSERT INTO pedidos (mesa_id, produto_id, quantidade,status, hora) VALUES (?, ?, ?, ? , ?)";
                    console.log("item id = " + item.id + "item.quantidade = " + item.quantidade)
                    db.run(sqlInsert, [mesa_id, item.id, item.quantidade,'aberto', new Date().toISOString()]);
                }
            });
        });
    });
    dispararImpressao(mesa_id,itens)

    res.json({ success: true, message: "Pedido processado com sucesso!" });
});
/* Pega os produtos existentes na mesa */

app.get ("/mesa/:id/products/:mesa_id", (req,res) =>{
  const mesa_id = req.params.mesa_id
    db.all("SELECT * FROM pedidos WHERE mesa_id = ?",[mesa_id],async (err,result) =>{
        if(err){
            console.log("Erro ao recuperar os produtos da mesa " + err)
        }
        if(result && result.length > 0){
            await db.run("UPDATE mesas SET status = 'ocupada' WHERE id = ?", [mesa_id])
            res.json(result)
        }
        else{
          await db.run("UPDATE mesas SET status = 'livre' WHERE id = ?", [mesa_id])
          res.status(200).json({message: "Mesa Livre !"})
        }

    })
})

/*Pega os produtos e dados dele para impressao baseado na mesa */

app.get("/impressao/:mesa_id", async (req, res) => {
    const mesa_id = req.params.mesa_id;

    try {
        db.all("SELECT * FROM pedidos WHERE mesa_id = ? AND status = 'aberto'", [mesa_id],async (err,itensMesa) =>{
          if (!itensMesa || itensMesa.length === 0) {
              return res.status(404).json({ message: "Nenhum pedido aberto para esta mesa." });
          }
          let processados = 0;
          let itenFinal = [];
          itensMesa.forEach((item) => {
            db.get("SELECT * FROM produtos WHERE id = ?",[item.produto_id], (err,detalhesProduto) =>{
              processados++;

              if(detalhesProduto){
                itenFinal.push({
                  ...item,
                  nome: detalhesProduto.nome,
                  preco: detalhesProduto.preco,
                  quantidade: item.quantidade
                });
              }
              if(processados === itensMesa.length){
                res.json(itenFinal)
              }
            })
          })
        });

    } catch (error) {
        console.error("Erro na rota de impressão:", error);
        res.status(500).json({ error: "Erro interno ao processar dados da mesa. " + error.message });
    }
});





const ThermalPrinter = require("node-thermal-printer").printer;
const Types = require("node-thermal-printer").types;

app.post("/imprimir-comando", async (req, res) => {
    const { mesa_id, itens } = req.body;

    // Inicialização segura
    // let printer = new ThermalPrinter({
    //     type: Types.EPSON, // A Bematech MP-4200 aceita comandos EPSON (ESC/POS) perfeitamente
    //     interface: '\\\\localhost\\BEMATECH', // Verifique se o nome no compartilhamento é EXATAMENTE esse
    //     characterSet: 'PC860_PORTUGUESE', // Conjunto de caracteres para PT-BR
    //     removeSpecialCharacters: false,
    //     width: 42
    // });
    let printer = new ThermalPrinter({
      type: Types.EPSON, // Ou BEMATECH
      interface: 'printer:default', // Nome exato da impressora no Windows
      characterSet: 'PC860_PORTUGUESE',
      width: 42 // Isso é fundamental para ver se o texto quebra
    });

    // Teste rápido para validar se o tipo foi reconhecido
    if (!printer) {
        return res.status(500).json({ error: "Falha ao instanciar a impressora." });
    }
    try {
        printer.alignCenter();
        printer.println("BURCAS LANCHONETE");
        printer.println("------------------------------------------");
        
        printer.alignLeft();
        printer.println(`MESA: ${mesa_id}`);
        printer.println(`DATA: ${new Date().toLocaleString('pt-BR')}`);
        printer.println("------------------------------------------");
        

        let total = 0;
        itens.forEach(item => {
            valortotalprod = item.preco * item.quantidade;
            total += item.preco * item.quantidade;
            // Formatando a linha manualmente para garantir alinhamento
            const nome = item.nome.substring(0, 18).padEnd(19);
            const qtd = `x${item.quantidade}`.padEnd(5);
            const preco = `R$${item.preco.toFixed(2)}`.padStart(8);
            const precofinal = `R${valortotalprod.toFixed(2)}`.padStart(10)
            printer.println(`${nome}${qtd}${preco}${precofinal}`);
        });
        const valorTotal = total.toFixed(2);
        const valorDividido = (total / 2).toFixed(2);

        printer.println("--------------------------------");
        printer.alignRight();
        printer.bold(true);
        printer.println(`TOTAL: R$ ${valorTotal}`);
        printer.println(`Total dividido em 2 pessoas : 2x R$ ${valorDividido}`);
        printer.bold(false);

        // No node-thermal-printer, usamos newLine() repetidamente ou um comando bruto
        printer.newLine();
        printer.newLine();
        printer.newLine();
        printer.newLine();

        printer.cut();

        const success = await printer.execute();
        if (success) {
            console.log("Impresso com sucesso via Spooler!");
            res.json({ success: true });
        } else {
            throw new Error("O Spooler aceitou o comando, mas a impressora não respondeu.");
        }

    } catch (error) {
        console.error("Erro na impressão:", error);
        res.status(500).json({ error: error.message });
    }
});


/*Imprimir */


/* Pega as mesas existentes */


app.get("/mesas",(req,res)=>{

db.all("SELECT * FROM mesas ORDER BY numero",(err,rows)=>{

if(err){
return res.status(500).send(err)
}

res.json(rows)

})

})


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000")
})


/* Adicionar Produto ao Banco de Dados */
app.post("/addProduct", upload.single('imagem'), (req, res) => {
    const { nome, preco,descricao, categoria, extras, idLoja} = req.body;
    const imagemPath = req.file ? `${idLoja}/${req.file.filename}` : null;

    const listaExtras = JSON.parse(extras); 

    const sql = "INSERT INTO produtos (nome, preco,descricao, categoria, img, extras,idLoja) VALUES (?, ?, ? , ?, ?, ?,?)";
    db.run(sql, [nome, preco,descricao, categoria, imagemPath, extras, idLoja], (err) => {
        if (err) return res.status(500).send(err.message);
        res.send("Sucesso!");
    });
});


/* Pega tudo do produto clickado */

app.get("/getprodutobody/:productid",(req,res)=>{
  const id = req.params.productid
  db.get("SELECT * FROM produtos WHERE id = ?",[id],(err,row) => {
    if(err){
      console.log("Impossivel adicionar o produto a mesa " + err)
    }
    if(row){
      res.json(row)
    }
  })
})

/*Procurar produto por categoria */
app.get("/products/:category", async (req,res) =>{
    db.all("SELECT * FROM produtos WHERE categoria = ?",[req.params.category],(err,produto) =>{
        if(err){
          console.log("Impossivel recuperar os produtos erro  " + err)
        }
        if(produto) {
          res.json(produto)
        }
    })
})

/*  Atualiza a quantidade do produto especifico daquela mesa */

app.get('/addMore/:productid/:mesaid',  async (req,res) =>{
  const product_id = req.params.productid
  const mesa_id = req.params.mesaid

  try{
    db.run(
    "UPDATE pedidos SET quantidade = quantidade + 1 WHERE mesa_id = ? AND produto_id = ? AND status = 'aberto' ",
    [mesa_id, product_id],
    function(err) {
      if (err) {
        console.error(err.message);
        return;
      }
      console.log(`Linhas alteradas: ${this.changes}`); 
      console.log(`Último ID inserido: ${this.lastID}`);
    }
    );
    res.status(200).json({message: "Produto alterado a quantidade com sucesso ! "})
  }
  catch(err){
    res.status(500).json({message: "Erro ao alterar a quantidade !" + err})
  }
})


/*Diminui a quantidade do produto  */
app.get('/menosUm/:productid/:mesaid',  async (req,res) =>{
  const product_id = req.params.productid
  const mesa_id = req.params.mesaid

  try{
    db.get("SELECT quantidade FROM pedidos WHERE mesa_id = ? AND produto_id = ?",[mesa_id,product_id] ,(err,row) => {
      if(row && row.quantidade > 1){
        const novaquantidade = row.quantidade - 1;
          db.run(
          "UPDATE pedidos SET quantidade = quantidade - 1 WHERE mesa_id = ? AND produto_id = ? AND status = 'aberto' ",
          [mesa_id, product_id],
          function(err) {
            if (err) {
              console.error(err.message);
              return;
            }
            console.log(`Linhas alteradas: ${this.changes}`); 
            console.log(`Último ID inserido: ${this.lastID}`);
          }
          )
      }
    })
    res.status(200).json({message: "Produto alterado a quantidade com sucesso ! "})
  }
  catch(err){
    res.status(500).json({message: "Erro ao alterar a quantidade !" + err})
  }
})

/*Apaga o produto da mesa */

app.get("/deletarProduto/:productid/:mesaid", (req,res) =>{
  const {productid, mesaid} = req.params;

  db.run("DELETE FROM pedidos WHERE produto_id = ? AND mesa_id = ? AND status = 'aberto' ", [productid,mesaid],
    function(err){
      if(err){
        return res.status(500).json({message: "Erro ao apagar o produto de ID " + productid + " Erro : " + err.message})
      }

      if(this.changes === 0 ){
        return res.status(400).json({message: "Nenhum Produto Encontrado"})
      }
      return res.status(200).json({message: "Produto de ID " + productid + " Apagado com Sucesso !!!!"})
    }
  )
}) 


/*Historico de Pedidos */
app.get("/historico-filtrado/:dias", (req, res) => {
    const { dias } = req.params;
    console.log("Filtrando pedidos dos últimos dias:", dias);

    const query = `
        SELECT * FROM pedidos 
        WHERE datetime(hora, 'localtime') >= datetime('now', 'localtime', '-' || ? || ' days')
        ORDER BY hora DESC`;

    db.all(query, [dias], (err, rows) => {
        if (err) {
            console.error("Erro no SQL:", err.message);
            return res.status(500).json({ error: err.message });
        }
        console.log(`Encontrados ${rows.length} pedidos.`);
        res.json(rows);
    });
});

/* Atualiza quantidade de mesas via admin console */


app.post("/admin/mesas",(req,res)=>{

try{


const mesas = parseInt(req.body.mesas)

if(!mesas){
return res.status(400).send("Quantidade inválida")
}

for(let i=1;i<=mesas;i++){

db.get(
"SELECT id FROM mesas WHERE numero = ?",
[i],
(err,row)=>{

if(err){
console.log("Erro na consulta:",err)
return
}

if(row){
console.log("Mesa já existe:", i)
}else{



db.run(
"INSERT INTO mesas(numero,status,idLoja) VALUES (?,?,?)",
[i,"livre",req.body.idLoja],
function(err){

if(err){
console.log("Erro ao inserir:", err)
}else{
console.log("Mesa criada:", i)
}

})

}

})

}

res.send("Processo concluído")



}catch(err){

console.log("ERRO:", err)
res.status(500).send("Erro no servidor")

}

})