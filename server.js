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

app.get ("/mesa/:id/products/:mesa_id",(req,res) =>{
    db.all("SELECT * FROM pedidos WHERE mesa_id = ?",[req.params.mesa_id],(err,result) =>{
        if(err){
            console.log("Erro ao recuperar os produtos da mesa " + err)
        }
        if(result){
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

console.log(nome,preco,categoria,imagem)

db.run(
"INSERT INTO produtos (nome,preco,categoria,img) VALUES (?,?,?,?)",
[nome,preco,categoria,imagem]
)

res.send("ok")

})

/*Procurar produto por categoria */
app.get("/products/:category",(req,res) =>{
    db.all("SELECT * FROM produtos WHERE categoria = ?",[req.params.category],(err,produto) =>{
        if(err){
            console.log("Impossivel recuperar os produtos erro  " + err)
        }
        if(produto) {
            res.json(produto)
            console.log(produto)
        }
    })
})

/*Adicionar pdoruto a Mesa */
app.post("/addproduct/:mesaid/:productid",(req,res) =>{
    console.log("Adicionando produto a mesa")
})



/* Atualiza quantidade de mesas via admin console */


app.post("/admin/mesas",(req,res)=>{

try{

console.log("Body recebido:", req.body)

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