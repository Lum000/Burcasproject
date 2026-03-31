const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const path = require("path")

const app = express()
app.use(express.json())

// cria ou abre o banco
const db = new sqlite3.Database("lanchonete.db")

// cria tabelas
db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS mesas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero INTEGER,
      status TEXT,
      qty INTEGER
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
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
app.use(express.static("public"))

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000")
})

app.post("/admin/mesas",(req,res)=>{

try{

console.log("Body recebido:", req.body)

const {mesas} = req.body

for(let i=1;i<=mesas;i++){

db.run(
"INSERT INTO mesas(numero,status) VALUES (?,?)",
[i,"livre"],
function(err){

if(err){
console.log("Erro ao inserir:", err)
}else{
console.log("Mesa inserida ID:", this.lastID)
}

})

}

res.send("Mesas criadas")

}catch(err){

console.log("ERRO:", err)

res.status(500).send("Erro no servidor")

}

})