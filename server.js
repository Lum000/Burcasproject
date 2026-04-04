const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const path = require("path")
const multer = require("multer")

const app = express()
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
      nome TEXT UNIQUE,
      logo TEXT
    )
  `)

  /*Tabela das Mesas */
  db.run(`
    CREATE TABLE IF NOT EXISTS mesas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero INTEGER UNIQUE,
      status TEXT,
      qty INTEGER
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      img TEXT,
      nome TEXT,
      categoria TEXT,
      preco REAL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mesa_id INTEGER,
      produto_id INTEGER,
      quantidade INTEGER,
      status TEXT,
      hora TEXT
    )
  `)

})

/* Armazenar as logos e imagens */
const storage = multer.diskStorage({

destination: function(req,file,cb){
cb(null,"uploads/")
},

filename: function(req,file,cb){
cb(null, Date.now() + "-" + file.originalname)
}

})

const upload = multer({storage:storage})

app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use("/uploads",express.static("uploads"))

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


/* Pega os produtos existentes na mesa */

app.get ("/mesa/:id/products/:mesa_id", (req,res) =>{
  const mesa_id = req.params.mesa_id
    db.all("SELECT * FROM pedidos WHERE mesa_id = ?",[mesa_id],async (err,result) =>{
        if(err){
            console.log("Erro ao recuperar os produtos da mesa " + err)
        }
        if(result){
            await db.run("UPDATE mesas SET status = 'ocupada' WHERE id = ?", [mesa_id])
            res.json(result)
        }
    })
})

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
app.post("/addProduct", upload.single("imagem"), (req,res)=>{

const {nome, preco, categoria} = req.body
const imagem = req.file.filename


db.run(
"INSERT INTO produtos (nome,preco,categoria,img) VALUES (?,?,?,?)",
[nome,preco,categoria,imagem]
)

res.send("ok")

})


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
app.get("/products/:category",(req,res) =>{
    db.all("SELECT * FROM produtos WHERE categoria = ?",[req.params.category],(err,produto) =>{
        if(err){
            console.log("Impossivel recuperar os produtos erro  " + err)
        }
        if(produto) {
            res.json(produto)
        }
    })
})

/*Adicionar pdoruto a Mesa */
app.get("/addproduct/:mesaid/:productid", async (req,res) =>{
    try{
      const id = req.params.productid
      const mesa_id = req.params.mesaid
      const query = await db.get("SELECT * FROM pedidos WHERE mesa_id = ? AND status = 'aberto'", [mesa_id])
      if (!query || Object.keys(query).length === 0){
        db.run("INSERT INTO pedidos(mesa_id,produto_id,quantidade,status,hora) VALUES(?,?,?,?,?)", [mesa_id,id,1,'aberto',new Date().toISOString()])
      }
      else{
        db.run("UPDATE pedidos SET quantidade = quantidade + 1 WHERE mesa_id = ? AND produto_id = ? ",[mesa_id,id])
      }

      res.status(200).json({message: "Produto Adicionado com Sucesso !"})
      
    }
    catch (err){
      console.log("ERRO 500 NO SERVIDOR " + err)
    }
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
    );
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
"INSERT INTO mesas(numero,status) VALUES (?,?)",
[i,"livre"],
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