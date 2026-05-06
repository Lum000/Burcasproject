const express = require("express")
const sqlite3 = require("sqlite3").verbose()
require('./backup')
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
const { Bonjour } = require('bonjour-service');
const bonjour = new Bonjour();

const db = new sqlite3.Database("lanchonete.db")

// cria tabelas
db.serialize(() => {
  
  /* CRIAÇÃO TABELA INFO DAS LOJAS */
  db.run(`
    CREATE TABLE IF NOT EXISTS lojasInfo
    (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nomeLoja TEXT UNIQUE,
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
      qty INTEGER,
      parcial NUMBER DEFAULT 0
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      img TEXT,
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
      mesa_numero INTEGER,
      mesa_id INTEGER,
      produto_id INTEGER,
      quantidade INTEGER NOT NULL CHECK (quantidade >= 0),
      desc TEXT,
      preco REAL,
      extras TEXT,
      idLoja TEXT NOT NULL,
      status TEXT,
      func TEXT,
      parcial NUMBER,
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
    ON pedidos (mesa_id, produto_id, status, IFNULL(extras, ''))
  `);
})

/* Armazenar as logos e imagens */
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const idLoja = req.user?.idLoja || 'geral';
    const pasta  = path.join('uploads', String(idLoja));

    const fs = require('fs');
    fs.mkdirSync(pasta, { recursive: true }); // cria a pasta se não existir

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


// sistema de backup 

const { fazerBackup } = require('./backup');

app.post('/admin/backup', verifyToken, checkRole('admin'), (req, res) => {
  try {
    fazerBackup();
    res.json({ success: true, message: 'Backup realizado com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/admin/backups', verifyToken, checkRole('admin'), (req, res) => {
  const BACKUP_DIR = path.join(__dirname, 'backups');
  const arquivos = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.db'))
    .map(f => ({
      nome: f,
      tamanho: (fs.statSync(path.join(BACKUP_DIR, f)).size / 1024).toFixed(1) + ' KB',
      data: fs.statSync(path.join(BACKUP_DIR, f)).mtime
    }))
    .sort((a, b) => new Date(b.data) - new Date(a.data));

  res.json(arquivos);
});


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



///get loja info
app.get('/lojasInfo', verifyToken, (req,res) =>{
  const idLoja = req.user.idLoja

  db.all("SELECT * FROM lojasInfo WHERE idLoja = ?",[idLoja], (err,result) =>{
    if(err){
      return res.json({error: "Erro ao retornar ! "})
    }
    return res.json(result)
  })
})


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

app.post("/pagaparcial", async (req, res) => {
  const { mesaNumero, valor } = req.body;

  if (!mesaNumero || !valor || valor <= 0) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  db.get("SELECT id FROM mesas WHERE numero = ?", [mesaNumero], (err, mesa) => {
    if (err || !mesa) return res.status(404).json({ error: 'Mesa não encontrada' });

    db.get(
      "SELECT SUM(parcial) as totalParcial FROM pedidos WHERE mesa_id = ? AND status = 'aberto'",
      [mesa.id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        const parcialAtual = Number(result?.totalParcial || 0);
        const novoParcial  = parcialAtual + Number(valor);

        db.run(
          "UPDATE mesas SET parcial = ? WHERE id = ?",
          [novoParcial, mesa.id],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            return res.json({ success: true, parcial: novoParcial });
          }
        );
      }
    );
  });
});

/*Imprimi Produto0 */
async function dispararImpressao(mesa_numero, itens, func) {
  // let printer = new ThermalPrinter({
  //   type: Types.EPSON,
  //   interface: './simulacao_cupom.txt',
  //   width: 42,
  //   characterSet: 'PC860_PORTUGUESE'
  // });
  let printer = new ThermalPrinter({
    type: Types.EPSON, // A Bematech MP-4200 aceita comandos EPSON (ESC/POS) perfeitamente
      interface: '\\\\localhost\\BEMATECH', // Verifique se o nome no compartilhamento é EXATAMENTE esse
      characterSet: 'PC860_PORTUGUESE', // Conjunto de caracteres para PT-BR
      removeSpecialCharacters: false,
      width: 42
  });
  

try {
  const linha     = "=".repeat(21);
  const linhafina = "-".repeat(21);

  printer.alignCenter();
  printer.bold(true);
  printer.setTextSize(1, 1);
  printer.println("NOVO PEDIDO");
  printer.println(linha);
  printer.bold(false);

  printer.alignLeft();
  printer.bold(true);
  printer.println(`MESA: ${mesa_numero}`);
  printer.bold(false);
  printer.println(`HORA: ${new Date().toLocaleTimeString('pt-BR')}`);
  printer.println(`OPER: ${func || '—'}`);
  printer.println(linhafina);

  itens.forEach(item => {
    printer.alignLeft();
    printer.bold(true);
    printer.setTextSize(1, 1);

    const nome = (item.nome || 'PRODUTO').substring(0, 16).toUpperCase();
    const qtd  = `x${item.quantidade || 1}`;
    printer.println(qtd);
    printer.println(nome);

    printer.bold(false);

    try {
      const extrasRaw = item.extras;
      if (extrasRaw) {
        let lista = [];

        try {
          const parsed = typeof extrasRaw === 'string' ? JSON.parse(extrasRaw) : extrasRaw;
          lista = Array.isArray(parsed) ? parsed : [];
        } catch {
          lista = String(extrasRaw)
            .split(',')
            .map(e => e.trim())
            .filter(e => e && e !== 'Sem adicionais');
        }

        if (lista.length > 0) {
          printer.bold(true);
          printer.println("ADICIONAIS:");
          printer.bold(false);

          lista.forEach(e => {
            const nomeExtra = typeof e === 'object' ? e.nome : e;
            printer.println(`+ ${nomeExtra.toUpperCase()}`);
          });
        }
      }
    } catch {}

    const obs = (item.obs || item.desc || '').trim();
    if (obs) {
      printer.bold(true);
      printer.println("OBS:");
      printer.bold(false);
      printer.println(obs.toUpperCase());
    }

    printer.println(linhafina);
  });

  printer.newLine();
  printer.cut();

  await printer.execute();
} catch (error) {
  console.error("Erro na impressora:", error);
}
}

/*Alterar Dados da Loja */


/* Imprimir dados */

app.post("/add-multi-products", verifyToken ,  (req, res) => {
    const idLoja = req.user.idLoja;
    const funcionario = req.user.nome;
    const { mesa_id,mesa_numero,itens} = req.body;

    if (!itens || itens.length === 0) {
        return res.status(400).json({ error: "Carrinho vazio" });
    }
    

    db.serialize(() => {
        itens.forEach((item) => {
            const sqlBusca = item.extras
              ? "SELECT id, quantidade FROM pedidos WHERE mesa_id = ? AND produto_id = ? AND idLoja = ? AND status = 'aberto' AND extras = ?"
              : "SELECT id, quantidade FROM pedidos WHERE mesa_id = ? AND produto_id = ? AND idLoja = ? AND status = 'aberto' AND extras IS NULL";
            const paramsBusca = item.extras
              ? [mesa_id, item.id, idLoja, item.extras]
              : [mesa_id, item.id, idLoja];
            
            db.get(sqlBusca, paramsBusca , (err, row) => {
                if (err) {
                    console.error("Erro na busca:", err);
                    return;
                }

                if (row) {
                    const novaQtd = row.quantidade + item.quantidade;
                    db.run("UPDATE pedidos SET quantidade = ? WHERE id = ? AND idLoja = ?", [novaQtd, row.id, idLoja]);
                } else {
                    const sqlInsert = "INSERT INTO pedidos (mesa_id,mesa_numero,func,produto_id,idLoja, quantidade,status,extras,desc, hora,preco) VALUES (?,?,?, ?, ?, ?, ?, ?, ? , ?,?)";
                    db.run(sqlInsert, [mesa_id,mesa_numero,funcionario, item.id,idLoja , item.quantidade,'aberto',item.extras,item.obs, new Date().toISOString(),item.preco]);
                }
            });
        });
    });
    dispararImpressao(mesa_numero,itens,req.user.nome)

    res.json({ success: true, message: "Pedido processado com sucesso!" });
});


async function getMesaIdByNumber(req, numero) {
  const idLoja = req.user.idLoja; 

  return new Promise((resolve, reject) => {
    db.get(
      "SELECT id FROM mesas WHERE numero = ? AND idLoja = ?",
      [numero, idLoja],
      (err, result) => {
        if (err)     return reject(new Error('Erro ao buscar mesa: ' + err.message));
        if (!result) return reject(new Error('Mesa não encontrada'));
        resolve(result.id);
      }
    );
  });
}
/* Alterar Mesa */
app.post("/mesa/alterar/:mesa_id", verifyToken, async (req,res) => {
  const idLoja = req.user.idLoja;
  const mesa_id = req.params.mesa_id;
  const {antigoNumero, novoNumero} = req.body;
  db.get(`SELECT * FROM mesas WHERE numero = ? AND idLoja = ? `,[novoNumero,idLoja], async (err,result) =>{
    if(err){
      return res.json({error: "Erro ao encontrar a nova mesa !! " + err.message})
    }
    const mesa_newId = await getMesaIdByNumber(req,result.numero)
    db.all("SELECT * FROM pedidos WHERE mesa_id = ? AND idLoja = ?",[result.id,idLoja],(error,resultado) =>{
      if(error){
        return res.json({error: "Erro al verificar produtos da mesa " + error.message})
      }
      if(resultado.length > 0){
        return res.json({error: "Mesa ja existe e tem produtos ! "})
      }
      console.log
      db.run("UPDATE pedidos SET mesa_id = ?,mesa_numero = ? WHERE idLoja = ? AND mesa_id = ? ",[mesa_newId,novoNumero,idLoja,mesa_id],(err,result) => {
        if(err){
          res.json({error: "Não Foi Possivel Alterar a Mesa " + err.message})
        }
        try{
          db.run("UPDATE mesas SET status = 'livre' WHERE id = ?", [mesa_id], (err) => {
            if (err) return res.status(500).json({ error: 'Erro ao liberar mesa antiga: ' + err.message });

            db.run("UPDATE mesas SET status = 'ocupada' WHERE id = ?", [mesa_newId], (err) => {
              if (err) return res.status(500).json({ error: 'Erro ao ocupar mesa nova: ' + err.message });

              return res.json({ success: true, message: 'Mesa alterada com sucesso!' });
            });
          });
        }
        catch(err){
          return res.json({error: "Erro ao alterar status das mesas !!" + err.message})
        }
      })
    })
  })
})

// ── Atualiza Produto  ──
app.put('/produto/:id', verifyToken, upload.single('imagem'), (req, res) => {
  const { nome, preco, descricao, categoria, extras } = req.body;
  const idLoja = req.user.idLoja;

  const campos  = ['nome = ?', 'preco = ?', 'descricao = ?', 'categoria = ?', 'extras = ?'];
  const valores = [nome, preco, descricao, categoria, extras];

  // só atualiza img se enviou uma nova
  if (req.file) {
    campos.push('img = ?');
    valores.push(`${idLoja}/${req.file.filename}`);
  }

  valores.push(req.params.id);

  db.run(
    `UPDATE produtos SET ${campos.join(', ')} WHERE id = ?`,
    valores,
    function(err) {
      if (err) return res.status(500).json({ message: err.message });
      if (this.changes === 0) return res.status(404).json({ message: 'Produto não encontrado' });
      return res.json({ ok: true });
    }
  );
});

app.delete('/produto/:id', verifyToken, (req, res) => {
  const idLoja = req.user.idLoja;

  db.run(
    'DELETE FROM produtos WHERE id = ? AND idLoja = ?',
    [req.params.id, idLoja],
    function(err) {
      if (err) return res.status(500).json({ message: err.message });
      if (this.changes === 0) return res.status(404).json({ message: 'Produto não encontrado' });
      return res.json({ ok: true });
    }
  );
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

function normalizarExtras(extras) {
    if (!extras) return [];

    if (Array.isArray(extras)) return extras;

    try {
        return JSON.parse(extras);
    } catch {
        return [];
    }
}



const ThermalPrinter = require("node-thermal-printer").printer;
const Types = require("node-thermal-printer").types;

app.post("/imprimir-comando", async (req, res) => {
    const { mesa_id, itens, parcial } = req.body;

    // Inicialização segura
    // let printer = new ThermalPrinter({
    //     type: Types.EPSON, // A Bematech MP-4200 aceita comandos EPSON (ESC/POS) perfeitamente
    //     interface: '\\\\localhost\\BEMATECH', // Verifique se o nome no compartilhamento é EXATAMENTE esse
    //     characterSet: 'PC860_PORTUGUESE', // Conjunto de caracteres para PT-BR
    //     removeSpecialCharacters: false,
    //     width: 42
    // });
  let printer = new ThermalPrinter({
    type: Types.EPSON, // A Bematech MP-4200 aceita comandos EPSON (ESC/POS) perfeitamente
      interface: '\\\\localhost\\BEMATECH', // Verifique se o nome no compartilhamento é EXATAMENTE esse
      characterSet: 'PC860_PORTUGUESE', // Conjunto de caracteres para PT-BR
      removeSpecialCharacters: false,
      width: 42
  });

    // Teste rápido para validar se o tipo foi reconhecido
    if (!printer) {
        return res.status(500).json({ error: "Falha ao instanciar a impressora." });
    }
    try {
  const linha    = "=".repeat(21);
  const linhafina = "-".repeat(21);

  // ── CABEÇALHO ──
  printer.alignCenter();
  printer.println(linha);
  printer.println("BURCA'S");
  printer.println("LANCHONETE");
  printer.println("CNPJ: 38.352.394-0001/10")
  printer.println(linha);

  // ── INFO DA MESA ──
  printer.alignLeft();
  printer.println(`MESA  : ${mesa_id}`);
  printer.println(linhafina);

  // ── CABEÇALHO DAS COLUNAS ──
  const colNome  = "ITEM".padEnd(20);
  const colQtd   = "QTD".padEnd(5);
  const colUnit  = "UNIT".padStart(7);
  const colTotal = "TOTAL".padStart(8);
  printer.println(`${colNome}${colQtd}${colUnit}${colTotal}`);
  printer.println(linhafina);

  // ── ITENS ──
  let total = 0;
  let totalComParcial = 0;


    itens.forEach((item, index) => {
      printer.bold(true)

      const extras = normalizarExtras(item.extras);

      // 💰 Soma extras corretamente
      const totalExtras = extras.reduce((acc, e) => {
        const preco = Number(String(e.preco).replace(",", ".")) || 0;
        return acc + preco;
      }, 0);

      // 💰 Preço base seguro (caso venha null/string)
      const precoBase = Number(
        String(item.preco ?? item.precoBase ?? 0).replace(",", ".")
      );

      // 💰 Preço final correto (AGORA SIM)
      const precoFinal = precoBase + totalExtras;

      // 💰 Subtotal correto
      const subtotal = precoFinal * item.quantidade;

      total += subtotal;

      // 💳 parcial
      if (parcial > 0) {
        totalComParcial = total - parcial;
      }

      // 🧾 Linha principal (compacta)
      const nome = (item.nome || 'PRODUTO')
        .substring(0, 20)
        .toUpperCase()
        .padEnd(20);

      const qtd = `x${item.quantidade}`.padEnd(5);
      const unit = `R$${precoFinal.toFixed(2)}`.padStart(7); // 👈 agora correto
      const totalStr = `R$${subtotal.toFixed(2)}`.padStart(8);

      printer.println(`${nome}${qtd}${unit}${totalStr}`);

      // ➕ Extras (compactado em 1 linha)
      if (extras.length > 0) {
        const extrasTexto = extras.map(e => e.nome).join(", ");
        printer.println(` + ${extrasTexto}`);
      }

      const obs = (item.desc || item.obs || '').trim();
      if (obs) {
        printer.println(` >> ${obs.toUpperCase()}`);
      }

      // 🔻 separador só entre itens
      if (index !== itens.length - 1) {
        printer.println("-");
      }

    });

    // ── TOTAIS ──
    printer.println(linha);
    printer.alignRight();
    if(parcial > 0){
      printer.println(`TOTAL: R$ ${total.toFixed(2)}`);
      printer.println(`Pago Parcial: R$ ${parcial.toFixed(2)}`)
      printer.println(`Resto: R$ ${totalComParcial.toFixed(2)}`);
      printer.println(`Dividido 2x: R$ ${(totalComParcial / 2).toFixed(2)} p/ pessoa`);
    }
    else{
      printer.println(`TOTAL: R$ ${total.toFixed(2)}`);
      printer.bold(false);
      printer.println(`Dividido 2x: R$ ${(total / 2).toFixed(2)} p/ pessoa`);
    }
    printer.println(linha);

    // ── RODAPÉ ──
    printer.alignCenter();
    printer.println(" ");
    printer.println("Obrigado pela preferencia!");
    printer.println("Volte sempre :)");
    printer.println(" ");
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
  
  bonjour.publish({
    name: 'Burcas Lanchonete',
    type: 'http',
    port: 3000,
    host: 'burcas.local'
  });

})


/* Adicionar Produto ao Banco de Dados */
app.post("/addProduct", verifyToken, upload.single('imagem'), (req, res) => {
  const { nome, preco, descricao, categoria, extras } = req.body;
  const idLoja = req.user.idLoja;

  if (!nome || !preco || !categoria) {
    return res.status(400).json({ message: 'Campos obrigatórios faltando' });
  }

  let extrasJSON = '[]';
  try {
    const parsed = JSON.parse(extras);
    extrasJSON = JSON.stringify(parsed); 
  } catch {
    extrasJSON = '[]';
  }

  const imagemPath = req.file ? `${idLoja}/${req.file.filename}` : null;

  const sql = "INSERT INTO produtos (nome, preco, descricao, categoria, img, extras, idLoja) VALUES (?, ?, ?, ?, ?, ?, ?)";

  db.run(sql, [nome, preco, descricao, categoria, imagemPath, extrasJSON, idLoja], function(err) {
    if (err) return res.status(500).json({ message: 'Erro ao salvar: ' + err.message });
    res.status(200).json({ message: 'Produto cadastrado!', id: this.lastID });
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
// via número da mesa
app.get('/getParcial/:mesa', (req, res) => {
  db.get(
    `SELECT parcial as total 
     FROM mesas 
     WHERE id = (SELECT id FROM mesas WHERE numero = ?)`,
    [req.params.mesa],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ total: row?.total || 0 });
    }
  );
});

// via id da mesa
app.get('/getParcialId/:mesa_id', (req, res) => {
  db.get(
    `SELECT parcial as total 
     FROM mesas 
     WHERE id = ? `,
    [req.params.mesa_id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ total: row?.total || 0 });
    }
  );
});

app.get("/getExtras/:pedido_id", (req, res) => {
  db.get(
    "SELECT id,extras, desc,preco,parcial FROM pedidos WHERE id = ?",
    [req.params.pedido_id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row || {});
    }
  );
});

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


// Listar todos os usuários (só admin)
app.get('/admin/usuarios', verifyToken, checkRole('admin'), (req, res) => {
  db.all('SELECT id, user, email, role, idLoja FROM usuarios', [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

// Criar usuário
app.post('/admin/usuarios', verifyToken, checkRole('admin'), async (req, res) => {
  const { user, email, role, idLoja, senha } = req.body;
  if (!user || !email || !senha) return res.status(400).json({ message: 'Campos obrigatórios' });
  const hash = await bcrypt.hash(senha, saltRounds);
  db.run('INSERT INTO usuarios (user, email, password, role, idLoja) VALUES (?,?,?,?,?)',
    [user.toLowerCase(), email.toLowerCase(), hash, role || 'user', idLoja],
    function(err) {
      if (err) return res.status(400).json({ message: err.message });
      res.json({ ok: true, id: this.lastID });
    }
  );
});

// Editar usuário
app.put('/admin/usuarios/:id', verifyToken, checkRole('admin'), async (req, res) => {
  const { user, email, role, idLoja, senha } = req.body;
  if (senha) {
    const hash = await bcrypt.hash(senha, saltRounds);
    db.run('UPDATE usuarios SET user=?, email=?, role=?, idLoja=?, password=? WHERE id=?',
      [user, email, role, idLoja, hash, req.params.id],
      (err) => err ? res.status(500).json({ message: err.message }) : res.json({ ok: true })
    );
  } else {
    db.run('UPDATE usuarios SET user=?, email=?, role=?, idLoja=? WHERE id=?',
      [user, email, role, idLoja, req.params.id],
      (err) => err ? res.status(500).json({ message: err.message }) : res.json({ ok: true })
    );
  }
});

// Deletar usuário
app.delete('/admin/usuarios/:id', verifyToken, checkRole('admin'), (req, res) => {
  db.run('DELETE FROM usuarios WHERE id=?', [req.params.id],
    (err) => err ? res.status(500).json({ message: err.message }) : res.json({ ok: true })
  );
});

/*  Atualiza a quantidade do produto especifico daquela mesa */

app.get('/addMore/:productid/:mesaid',  async (req,res) =>{
  const product_id = req.params.productid
  const mesa_id = req.params.mesaid

  try{
    db.run(
    "UPDATE pedidos SET quantidade = quantidade + 1 WHERE mesa_id = ? AND id = ? AND status = 'aberto' ",
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
    db.get("SELECT quantidade FROM pedidos WHERE mesa_id = ? AND id = ?",[mesa_id,product_id] ,(err,row) => {
      if(row && row.quantidade > 1){
        const novaquantidade = row.quantidade - 1;
          db.run(
          "UPDATE pedidos SET quantidade = quantidade - 1 WHERE mesa_id = ? AND id = ? AND status = 'aberto' ",
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

app.post("/alterLoja", verifyToken, (req,res) =>{
  const {nomeLoja,logoLoja} = req.body;
  const idLoja = req.user.idLoja;
  console.log(`nome Loja = ${nomeLoja} e logoLoja = ${logoLoja} e idLoja = ${idLoja}`)

  if(nomeLoja && logoLoja){
    db.run("UPDATE lojasInfo SET nomeLoja = ?, logo = ? WHERE idLoja = ?",[nomeLoja,logoLoja,idLoja], (err,result) =>{
      if(err){
        return res.json({error: "Não foi possivel atualizar os dados" + err.message})
      }
      return res.json({success: "Informações Salvas com Sucesso !!!"})
    })
  }
  else if(!nomeLoja && logoLoja){
    db.run("UPDATE lojasInfo SET logo = ? WHERE idLoja = ?",[logoLoja,idLoja], (err,result) =>{
    if(err){
      return res.json({error: "Não foi possivel atualizar os dados" + err.message})
    }
      return res.json({success: "Logo Salva com Sucesso !!!"})
    })
  }
  else if(nomeLoja && !logoLoja){
    db.run("UPDATE lojasInfo SET nomeLoja = ? WHERE idLoja = ?",[nomeLoja,idLoja], (err,result) =>{
    if(err){
      return res.json({error: "Não foi possivel atualizar os dados" + err.message})
    }
      return res.json({success: "Nome Atualizado com Sucesso !!!"})
    })
  }
  else if(!nomeLoja && !logoLoja){
    return res.json({error: "Nenhuma informação transferida "})
  }
})

app.get("/deletarProduto/:productid/:mesaid", verifyToken, (req,res) =>{
  const {productid, mesaid} = req.params;
  const idLoja = req.user.idLoja;
  db.run("DELETE FROM pedidos WHERE id = ? AND mesa_id = ? AND status = 'aberto' AND idLoja = ? ", [productid,mesaid,idLoja],
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