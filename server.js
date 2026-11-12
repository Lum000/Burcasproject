const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const path = require("path")
const fs = require("fs")
require('dotenv').config()

const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const SECRET = process.env.JWT_SECRET

const argon2hash = require('argon2')
const multer = require("multer")

const { Bonjour } = require('bonjour-service')
const bonjour = new Bonjour()

const ThermalPrinter = require("node-thermal-printer").printer
const Types = require("node-thermal-printer").types

const { fazerBackup } = require('./backup')

const app = express()
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))
app.use("/uploads", express.static("uploads"))

const db = new sqlite3.Database("lanchonete.db")

/* ───────────── HELPERS DE BANCO (Promise) ───────────── */

const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) { err ? reject(err) : resolve(this) }))

const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row)))

const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows)))

/* Recalcula o total da mesa a partir dos pedidos ABERTOS */
async function atualizarTotalMesa(mesa_id) {
  const itens = await dbAll(
    "SELECT preco, quantidade FROM pedidos WHERE mesa_id = ? AND status = 'aberto'",
    [mesa_id]
  )
  const total = itens.reduce(
    (acc, i) => acc + Number(i.preco || 0) * Number(i.quantidade || 1), 0
  )
  await dbRun("UPDATE mesas SET total = ? WHERE id = ?", [total, mesa_id])
  return total
}

async function criarLog({
  usuario = 'Sistema',
  acao = '',
  detalhes = '',
  mesa_id = null,
  valor = 0
}) {
  try {
    await dbRun(
      `INSERT INTO logs (usuario, acao, detalhes, mesa_id, valor, data)
       VALUES (?,?,?,?,?,?)`,
      [usuario, acao, detalhes, mesa_id, valor, new Date().toISOString()]
    )
  } catch (err) {
    console.error("Erro ao gravar log:", err.message)
  }
}

function normalizarExtras(extras) {
  if (!extras) return []
  if (Array.isArray(extras)) return extras
  try {
    const parsed = JSON.parse(extras)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/* ───────────── TABELAS ───────────── */

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS lojasInfo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nomeLoja TEXT UNIQUE,
      idLoja TEXT UNIQUE,
      logo TEXT,
      user TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS mesas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'livre',
      idLoja TEXT NOT NULL,
      total REAL DEFAULT 0,
      parcial REAL DEFAULT 0,
      nomeParcial TEXT DEFAULT '',
      fechada_em TEXT
    )
  `)

  // só pode existir UMA mesa ativa por número em cada loja (várias fechadas podem coexistir)
  db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_mesa_ativa
    ON mesas(idLoja, numero) WHERE status <> 'fechada'
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      img TEXT,
      nome TEXT,
      extras TEXT,
      descricao TEXT NOT NULL,
      categoria TEXT,
      idLoja TEXT NOT NULL,
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

  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      email TEXT,
      idLoja TEXT,
      passLoja TEXT
    )
  `)

  db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_pedido_unico
    ON pedidos (mesa_id, produto_id, status, IFNULL(extras, ''))
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT,
      acao TEXT,
      detalhes TEXT,
      mesa_id INTEGER,
      valor REAL,
      data TEXT
    )
  `)

  // aviso se o banco ainda for o antigo (sem a migração da tabela mesas)
  db.all("PRAGMA table_info(mesas)", (err, cols) => {
    if (!err && cols && !cols.some(c => c.name === 'fechada_em')) {
      console.warn("⚠️  A tabela 'mesas' está desatualizada. Pare o servidor e rode: node migrar-mesas.js")
    }
  })
})

/* ───────────── UPLOADS ───────────── */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const idLoja = req.user?.idLoja || 'geral'
    const pasta = path.join('uploads', String(idLoja))
    fs.mkdirSync(pasta, { recursive: true })
    cb(null, pasta)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + path.basename(file.originalname))
  }
})

const upload = multer({ storage })

/* ───────────── AUTENTICAÇÃO ───────────── */

function verifyToken(req, res, next) {
  const token = req.cookies.token
    || req.headers.authorization?.split(' ')[1]

  if (!token) return res.status(401).json({ error: 'Não autenticado' })

  try {
    req.user = jwt.verify(token, SECRET)
    next()
  } catch {
    res.clearCookie('token')
    return res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

function checkRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Sem permissão' })
    }
    next()
  }
}

/* ───────────── BACKUP ───────────── */

app.post('/admin/backup', verifyToken, checkRole('admin'), (req, res) => {
  try {
    fazerBackup()
    res.json({ success: true, message: 'Backup realizado com sucesso!' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/admin/backups', verifyToken, checkRole('admin'), (req, res) => {
  const BACKUP_DIR = path.join(__dirname, 'backups')
  const arquivos = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.db'))
    .map(f => ({
      nome: f,
      tamanho: (fs.statSync(path.join(BACKUP_DIR, f)).size / 1024).toFixed(1) + ' KB',
      data: fs.statSync(path.join(BACKUP_DIR, f)).mtime
    }))
    .sort((a, b) => new Date(b.data) - new Date(a.data))

  res.json(arquivos)
})

/* ───────────── LOJA / LOGIN / REGISTRO ───────────── */

// dados da loja (sem devolver o hash da senha)
app.get('/lojasInfo', verifyToken, (req, res) => {
  db.all(
    "SELECT id, nomeLoja, idLoja, logo FROM lojasInfo WHERE idLoja = ?",
    [req.user.idLoja],
    (err, result) => {
      if (err) return res.json({ error: "Erro ao retornar ! " })
      return res.json(result)
    }
  )
})

app.get('/dashboard', verifyToken, (req, res) => {
  db.get(
    "SELECT nomeLoja, logo FROM lojasInfo WHERE idLoja = ?",
    [req.user.idLoja],
    (err, loja) => {
      return res.status(200).json({
        msg: `Olá, ${req.user.nome}`,
        role: `${req.user.role}`,
        idLoja: `${req.user.idLoja}`,
        nomeLoja: loja?.nomeLoja || req.user.idLoja,
        logo: loja?.logo || null
      })
    }
  )
})

app.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Campos obrigatórios' })
  }

  const campo = email.includes('@') ? 'email' : 'user'   // valores fixos, seguro
  const valor = email.trim().toLowerCase()

  try {
    const row = await dbGet(`SELECT * FROM usuarios WHERE ${campo} = ?`, [valor])
    if (!row) return res.status(401).json({ message: 'Verifique os campos' })

    const valid = await argon2hash.verify(row.password, password)
    if (!valid) return res.status(401).json({ message: 'Verifique os campos' })

    const token = jwt.sign(
      { id: row.id, nome: row.user, role: row.role, idLoja: row.idLoja },
      SECRET,
      { expiresIn: '9h' }
    )

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 9 * 60 * 60 * 1000
    })

    return res.json({ ok: true, role: row.role })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Erro no servidor.' })
  }
})

app.post('/criar-loja', async (req, res) => {
  try {
    const { nomeLoja, senhaLoja, senhaAdmin } = req.body
    const idLoja = String(req.body.idLoja || '').trim().toLowerCase()

    // se SENHA_ADMIN estiver no .env, só quem souber a senha cria lojas
    if (process.env.SENHA_ADMIN && senhaAdmin !== process.env.SENHA_ADMIN) {
      return res.status(403).json({ message: 'Senha do admin incorreta.' })
    }

    if (!nomeLoja || !idLoja || !senhaLoja) {
      return res.status(400).json({ message: 'Preencha todos os campos.' })
    }
    if (!/^[a-z0-9_-]+$/.test(idLoja)) {
      return res.status(400).json({ message: 'Identificador inválido.' })
    }

    const existe = await dbGet('SELECT 1 FROM lojasInfo WHERE idLoja = ?', [idLoja])
    if (existe) {
      return res.status(409).json({ message: 'Já existe uma loja com esse ID.' })
    }

    const senhaHash = await argon2hash.hash(senhaLoja)
    await dbRun(
      'INSERT INTO lojasInfo (idLoja, nomeLoja, password, user) VALUES (?, ?, ?, ?)',
      [idLoja, nomeLoja, senhaHash, nomeLoja]
    )
    return res.status(200).json({ message: 'Êxito ao criar nova loja!' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Erro ao criar nova loja.' })
  }
})

app.post('/register', async (req, res) => {
  try {
    const { nome, email, senha, idLoja, passLoja } = req.body
    if (!nome || !email || !senha || !idLoja || !passLoja) {
      return res.status(400).json({ message: 'Preencha todos os campos.' })
    }

    const nomeNorm = nome.trim().toLowerCase()
    const emailNorm = email.trim().toLowerCase()
    const idLojaNorm = idLoja.trim().toLowerCase()

    const loja = await dbGet("SELECT password FROM lojasInfo WHERE idLoja = ?", [idLojaNorm])
    if (!loja) {
      return res.status(404).json({
        code: "loja_nao_encontrada",
        message: "Loja não encontrada. Que tal criar a sua?"
      })
    }

    const ok = await argon2hash.verify(loja.password, passLoja)
    if (!ok) return res.status(401).json({ message: "Senha da loja incorreta!" })

    const existe = await dbGet(
      "SELECT id FROM usuarios WHERE user = ? AND idLoja = ?",
      [nomeNorm, idLojaNorm]
    )
    if (existe) return res.status(409).json({ message: "Usuário já existe nessa loja!" })

    const hashedpassword = await argon2hash.hash(senha)
    await dbRun(
      "INSERT INTO usuarios (user,password,email,idLoja,passLoja) VALUES (?,?,?,?,?)",
      [nomeNorm, hashedpassword, emailNorm, idLojaNorm, loja.password]
    )
    return res.status(200).json({ message: "Êxito ao criar usuário na loja " + idLojaNorm })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erro ao registrar usuário." })
  }
})

/* ───────────── MESAS ───────────── */

// só a mesa ATIVA (não fechada) da loja do usuário
async function getMesaIdByNumber(req, numero) {
  const result = await dbGet(
    "SELECT id FROM mesas WHERE numero = ? AND idLoja = ? AND status <> 'fechada'",
    [numero, req.user.idLoja]
  )
  if (!result) throw new Error('Mesa não encontrada')
  return result.id
}

app.get("/mesas", verifyToken, async (req, res) => {
  try {
    const rows = await dbAll(
      "SELECT * FROM mesas WHERE idLoja = ? AND status <> 'fechada' ORDER BY numero",
      [req.user.idLoja]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get("/mesa/:id", verifyToken, async (req, res) => {
  try {
    const rows = await dbAll(
      "SELECT * FROM mesas WHERE numero = ? AND idLoja = ? AND status <> 'fechada'",
      [req.params.id, req.user.idLoja]
    )
    res.json(rows)
  } catch (err) {
    console.log("Erro ao recuperar dados da mesa " + err)
    res.status(500).json({ error: err.message })
  }
})

/* Pedidos abertos da mesa */
app.get("/mesa/:id/products/:mesa_id", verifyToken, async (req, res) => {
  try {
    const idLoja = req.user.idLoja
    const mesa_id = Number(req.params.mesa_id)

    const mesa = await dbGet(
      "SELECT id FROM mesas WHERE id = ? AND idLoja = ? AND status <> 'fechada'",
      [mesa_id, idLoja]
    )
    if (!mesa) {
      return res.status(404).json({ message: "Mesa não encontrada ou já fechada." })
    }

    const pedidos = await dbAll(
      "SELECT * FROM pedidos WHERE mesa_id = ? AND idLoja = ? AND status = 'aberto'",
      [mesa_id, idLoja]
    )

    if (pedidos.length > 0) {
      await dbRun("UPDATE mesas SET status = 'ocupada' WHERE id = ?", [mesa_id])
      return res.json(pedidos)
    }

    await dbRun("UPDATE mesas SET status = 'livre' WHERE id = ?", [mesa_id])
    return res.status(200).json({ message: "Mesa Livre !" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erro ao recuperar os produtos da mesa." })
  }
})

/* FECHAR MESA: fecha a atual (id antigo) e cria uma nova, vazia, com id novo */
app.post('/fecharMesa', verifyToken, checkRole('admin'), async (req, res) => {
  const idLoja = req.user.idLoja
  const numero = Number(req.body.mesaNumero)
  if (!numero) return res.status(400).json({ message: 'Número da mesa inválido.' })

  try {
    const mesa = await dbGet(
      `SELECT id, total FROM mesas
        WHERE numero = ? AND idLoja = ? AND status <> 'fechada'`,
      [numero, idLoja]
    )
    if (!mesa) return res.status(404).json({ message: 'Mesa não encontrada.' })

    // evita fechar mesa vazia (e duplo clique criando mesas à toa)
    const abertos = await dbGet(
      "SELECT COUNT(*) AS n FROM pedidos WHERE mesa_id = ? AND idLoja = ? AND status = 'aberto'",
      [mesa.id, idLoja]
    )
    if (!abertos || abertos.n === 0) {
      return res.status(409).json({ message: 'Essa mesa não tem pedidos abertos.' })
    }

    await dbRun('BEGIN IMMEDIATE')
    try {
      // 1. fecha os pedidos da comanda
      await dbRun(
        `UPDATE pedidos SET status = 'fechado'
          WHERE mesa_id = ? AND idLoja = ? AND status = 'aberto'`,
        [mesa.id, idLoja]
      )
      // 2. fecha a mesa atual (mantém total e parcial como registro)
      await dbRun(
        `UPDATE mesas SET status = 'fechada', fechada_em = datetime('now','localtime')
          WHERE id = ?`,
        [mesa.id]
      )
      // 3. cria a nova mesa, vazia, com id novo
      const nova = await dbRun(
        `INSERT INTO mesas (numero, status, idLoja, total, parcial, nomeParcial)
         VALUES (?, 'livre', ?, 0, 0, '')`,
        [numero, idLoja]
      )
      await dbRun('COMMIT')

      await criarLog({
        usuario: req.user.nome,
        acao: 'FECHOU COMANDA',
        detalhes: `Mesa ${numero}`,
        mesa_id: mesa.id,
        valor: mesa.total
      })

      return res.json({
        message: 'Mesa fechada com sucesso!',
        mesaFechadaId: mesa.id,
        novaMesaId: nova.lastID
      })
    } catch (e) {
      await dbRun('ROLLBACK').catch(() => {})
      throw e
    }
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Erro ao fechar a mesa.' })
  }
})

app.post("/pagaparcial", verifyToken, async (req, res) => {
  try {
    const { mesaNumero, nomeParcial } = req.body
    const valor = Number(req.body.valor)
    if (!mesaNumero || !valor || valor <= 0) {
      return res.status(400).json({ error: 'Dados inválidos' })
    }

    const mesa = await dbGet(
      "SELECT id, parcial FROM mesas WHERE numero = ? AND idLoja = ? AND status <> 'fechada'",
      [mesaNumero, req.user.idLoja]
    )
    const abertos = await dbGet(
  "SELECT COUNT(*) AS n FROM pedidos WHERE mesa_id = ? AND idLoja = ? AND status = 'aberto'",
  [mesa.id, req.user.idLoja]
    )
    if (!abertos || abertos.n === 0) {
      return res.status(409).json({ error: 'Mesa sem pedidos abertos.' })
    }
    if (!mesa) return res.status(404).json({ error: 'Mesa não encontrada' })
    const nome = typeof nomeParcial === 'string' ? nomeParcial.trim() : ''
    const novoParcial = Number(mesa.parcial || 0) + valor
    await dbRun(
      "UPDATE mesas SET parcial = ?, nomeParcial = ? WHERE id = ?",
      [novoParcial, nome || '', mesa.id]
    )
    return res.json({ success: true, parcial: novoParcial })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// parcial via número da mesa
app.get('/getParcial/:mesa', verifyToken, async (req, res) => {
  try {
    const row = await dbGet(
      `SELECT parcial AS total FROM mesas
        WHERE numero = ? AND idLoja = ? AND status <> 'fechada'`,
      [req.params.mesa, req.user.idLoja]
    )
    res.json({ total: row?.total || 0 })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// parcial via id da mesa
app.get('/getParcialId/:mesa_id', verifyToken, async (req, res) => {
  try {
    const row = await dbGet(
      "SELECT parcial AS total FROM mesas WHERE id = ? AND idLoja = ?",
      [req.params.mesa_id, req.user.idLoja]
    )
    res.json({ total: row?.total || 0 })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* Trocar mesa de lugar */
app.post("/mesa/alterar/:mesa_id", verifyToken, async (req, res) => {
  try {
    const idLoja = req.user.idLoja
    const mesa_id = Number(req.params.mesa_id)
    const { novoNumero } = req.body

    const destino = await dbGet(
      "SELECT id, numero FROM mesas WHERE numero = ? AND idLoja = ? AND status <> 'fechada'",
      [novoNumero, idLoja]
    )
    if (!destino) return res.json({ error: "A nova mesa não existe!" })

    const pedidosDestino = await dbAll(
      "SELECT id FROM pedidos WHERE mesa_id = ? AND idLoja = ? AND status = 'aberto'",
      [destino.id, idLoja]
    )
    if (pedidosDestino.length > 0) {
      return res.json({ error: "Mesa ja existe e tem produtos ! " })
    }

    await dbRun(
      `UPDATE pedidos SET mesa_id = ?, mesa_numero = ?
        WHERE idLoja = ? AND mesa_id = ? AND status = 'aberto'`,
      [destino.id, novoNumero, idLoja, mesa_id]
    )
    await dbRun("UPDATE mesas SET status = 'livre' WHERE id = ? AND idLoja = ?", [mesa_id, idLoja])
    await dbRun("UPDATE mesas SET status = 'ocupada' WHERE id = ?", [destino.id])

    await atualizarTotalMesa(destino.id)
    await atualizarTotalMesa(mesa_id)

    return res.json({ success: true, message: 'Mesa alterada com sucesso!' })
  } catch (err) {
    console.error(err)
    return res.json({ error: "Não foi possível alterar a mesa: " + err.message })
  }
})

/* Criar mesas via painel admin */
app.post("/admin/mesas", verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const idLoja = req.user.idLoja
    const mesas = parseInt(req.body.mesas)

    if (!mesas || mesas < 1 || mesas > 200) {
      return res.status(400).json({ message: "Quantidade inválida" })
    }

    let criadas = 0
    for (let i = 1; i <= mesas; i++) {
      const existe = await dbGet(
        "SELECT id FROM mesas WHERE numero = ? AND idLoja = ? AND status <> 'fechada'",
        [i, idLoja]
      )
      if (!existe) {
        await dbRun(
          "INSERT INTO mesas (numero, status, idLoja) VALUES (?, 'livre', ?)",
          [i, idLoja]
        )
        criadas++
      }
    }

    res.json({ message: "Processo concluído", criadas })
  } catch (err) {
    console.log("ERRO:", err)
    res.status(500).json({ message: "Erro no servidor" })
  }
})

/* ───────────── IMPRESSORA ───────────── */

function criarPrinter() {
  // para testar sem impressora: interface: './simulacao_cupom.txt'
  return new ThermalPrinter({
    type: Types.EPSON,                       // Bematech MP-4200 aceita ESC/POS
    interface: '\\\\localhost\\BEMATECH',    // nome exato do compartilhamento
    characterSet: 'PC860_PORTUGUESE',
    removeSpecialCharacters: false,
    width: 42
  })
}

async function dispararImpressao(mesa_numero, itens, func) {
  try {
    const printer = criarPrinter()
    const linha = "=".repeat(21)
    const linhafina = "-".repeat(21)

    printer.alignCenter()
    printer.bold(true)
    printer.setTextSize(1, 1)
    printer.println("NOVO PEDIDO")
    printer.println(linha)
    printer.bold(false)

    printer.alignLeft()
    printer.bold(true)
    printer.println(`MESA: ${mesa_numero}`)
    printer.bold(false)
    printer.println(`HORA: ${new Date().toLocaleTimeString('pt-BR')}`)
    printer.println(`OPER: ${func || '—'}`)
    printer.println(linhafina)

    itens.forEach(item => {
      printer.alignLeft()
      printer.bold(true)
      printer.setTextSize(1, 1)

      const nome = (item.nome || 'PRODUTO').substring(0, 16).toUpperCase()
      const qtd = `x${item.quantidade || 1}`
      printer.println(qtd)
      printer.println(nome)

      printer.bold(false)

      const lista = normalizarExtras(item.extras)
      if (lista.length > 0) {
        printer.bold(true)
        printer.println("ADICIONAIS:")
        printer.bold(false)

        lista.forEach(e => {
          const nomeExtra = typeof e === 'object' ? e.nome : e
          printer.println(`+ ${String(nomeExtra).toUpperCase()}`)
        })
      }

      const obs = (item.obs || item.desc || '').trim()
      if (obs) {
        printer.bold(true)
        printer.println("OBS:")
        printer.bold(false)
        printer.println(obs.toUpperCase())
      }

      printer.println(linhafina)
    })

    printer.newLine()
    printer.cut()

    await printer.execute()
  } catch (error) {
    console.error("Erro na impressora:", error)
  }
}

/* Itens abertos da mesa, com nome e preço base do produto (para a comanda) */
app.get("/impressao/:mesa_id", verifyToken, async (req, res) => {
  try {
    const itens = await dbAll(
      `SELECT pe.id, pe.mesa_numero, pe.mesa_id, pe.produto_id, pe.quantidade,
              pe.desc, pe.extras, pe.idLoja, pe.status, pe.func, pe.parcial, pe.hora,
              pr.nome AS nome, pr.preco AS preco
         FROM pedidos pe
         JOIN produtos pr ON pr.id = pe.produto_id
        WHERE pe.mesa_id = ? AND pe.idLoja = ? AND pe.status = 'aberto'`,
      [req.params.mesa_id, req.user.idLoja]
    )

    if (!itens.length) {
      return res.status(404).json({ message: "Nenhum pedido aberto para esta mesa." })
    }
    res.json(itens)
  } catch (error) {
    console.error("Erro na rota de impressão:", error)
    res.status(500).json({ error: "Erro interno ao processar dados da mesa. " + error.message })
  }
})

app.post("/imprimir-comando", verifyToken, async (req, res) => {
  const { mesa_id, itens, parcial } = req.body

  try {
    const printer = criarPrinter()
    const linha = "=".repeat(21)
    const linhafina = "-".repeat(21)

    // ── CABEÇALHO ──
    printer.alignCenter()
    printer.println(linha)
    printer.println("BURCA'S")
    printer.println("LANCHONETE")
    printer.println("CNPJ: 38.352.394-0001/10")
    printer.println(linha)

    // ── INFO DA MESA ──
    printer.alignLeft()
    printer.println(`MESA  : ${mesa_id}`)
    printer.println(linhafina)

    // ── CABEÇALHO DAS COLUNAS ──
    const colNome = "ITEM".padEnd(20)
    const colQtd = "QTD".padEnd(5)
    const colUnit = "UNIT".padStart(7)
    const colTotal = "TOTAL".padStart(8)
    printer.println(`${colNome}${colQtd}${colUnit}${colTotal}`)
    printer.println(linhafina)

    // ── ITENS ──
    let total = 0
    let totalComParcial = 0

    itens.forEach((item, index) => {
      printer.bold(true)

      const extras = normalizarExtras(item.extras)

      const totalExtras = extras.reduce((acc, e) => {
        const preco = Number(String(e.preco).replace(",", ".")) || 0
        return acc + preco
      }, 0)

      const precoBase = Number(
        String(item.preco ?? item.precoBase ?? 0).replace(",", ".")
      )

      const precoFinal = precoBase + totalExtras
      const subtotal = precoFinal * item.quantidade

      total += subtotal

      if (parcial > 0) {
        totalComParcial = total - parcial
      }

      const nome = (item.nome || 'PRODUTO')
        .substring(0, 20)
        .toUpperCase()
        .padEnd(20)

      const qtd = `x${item.quantidade}`.padEnd(5)
      const unit = `R$${precoFinal.toFixed(2)}`.padStart(7)
      const totalStr = `R$${subtotal.toFixed(2)}`.padStart(8)

      printer.println(`${nome}${qtd}${unit}${totalStr}`)

      if (extras.length > 0) {
        const extrasTexto = extras.map(e => e.nome).join(", ")
        printer.println(` + ${extrasTexto}`)
      }

      const obs = (item.desc || item.obs || '').trim()
      if (obs) {
        printer.println(` >> ${obs.toUpperCase()}`)
      }

      if (index !== itens.length - 1) {
        printer.println("-")
      }
    })

    // ── TOTAIS ──
    printer.println(linha)
    printer.alignRight()
    if (parcial > 0) {
      printer.println(`TOTAL: R$ ${total.toFixed(2)}`)
      printer.println(`Pago Parcial: R$ ${parcial.toFixed(2)}`)
      printer.println(`Resto: R$ ${totalComParcial.toFixed(2)}`)
      printer.println(`Dividido 2x: R$ ${(totalComParcial / 2).toFixed(2)} p/ pessoa`)
    } else {
      printer.println(`TOTAL: R$ ${total.toFixed(2)}`)
      printer.bold(false)
      printer.println(`Dividido 2x: R$ ${(total / 2).toFixed(2)} p/ pessoa`)
    }
    printer.println(linha)

    // ── RODAPÉ ──
    printer.alignCenter()
    printer.println(" ")
    printer.println("Obrigado pela preferencia!")
    printer.println("Volte sempre :)")
    printer.println(" ")
    printer.cut()

    const success = await printer.execute()
    if (success) {
      console.log("Impresso com sucesso via Spooler!")
      res.json({ success: true })
    } else {
      throw new Error("O Spooler aceitou o comando, mas a impressora não respondeu.")
    }
  } catch (error) {
    console.error("Erro na impressão:", error)
    res.status(500).json({ error: error.message })
  }
})

/* ───────────── PEDIDOS ───────────── */

app.post("/add-multi-products", verifyToken, async (req, res) => {
  const idLoja = req.user.idLoja
  const funcionario = req.user.nome
  const { mesa_id, itens } = req.body

  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ error: "Carrinho vazio" })
  }

  try {
    // garante que a mesa é da loja e ainda está ativa (não fechada)
    const mesa = await dbGet(
      "SELECT id, numero FROM mesas WHERE id = ? AND idLoja = ? AND status <> 'fechada'",
      [mesa_id, idLoja]
    )
    if (!mesa) {
      return res.status(409).json({
        error: "Essa mesa foi fechada. Recarregue a lista de mesas.",
        message: "Essa mesa foi fechada. Recarregue a lista de mesas."
      })
    }

    for (const item of itens) {
      // extras chega como array (ou string JSON); guarda sempre como string ou NULL
      const extras = normalizarExtras(item.extras)
      const extrasStr = extras.length ? JSON.stringify(extras) : null
      const quantidade = Number(item.quantidade) || 1

      const filtroExtras = extrasStr
        ? "extras = ?"
        : "(extras IS NULL OR extras = '[]')"
      const params = [mesa.id, item.id, idLoja]
      if (extrasStr) params.push(extrasStr)

      const row = await dbGet(
        `SELECT id, quantidade FROM pedidos
          WHERE mesa_id = ? AND produto_id = ? AND idLoja = ?
            AND status = 'aberto' AND ${filtroExtras}`,
        params
      )

      if (row) {
        await dbRun(
          "UPDATE pedidos SET quantidade = ? WHERE id = ? AND idLoja = ?",
          [row.quantidade + quantidade, row.id, idLoja]
        )
      } else {
        await dbRun(
          `INSERT INTO pedidos
             (mesa_id, mesa_numero, func, produto_id, idLoja, quantidade, status, extras, desc, hora, preco)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          [mesa.id, mesa.numero, funcionario, item.id, idLoja, quantidade,
           'aberto', extrasStr, item.obs, new Date().toISOString(), item.preco]
        )
      }

      await criarLog({
        usuario: funcionario,
        acao: 'ADICIONOU ITEM',
        detalhes: `${item.nome} x ${quantidade}`,
        mesa_id: mesa.id,
        valor: item.preco
      })
    }

    await atualizarTotalMesa(mesa.id)

    dispararImpressao(mesa.numero, itens, funcionario)   // sem await: não atrasa a resposta

    return res.json({ success: true, message: "Pedido processado com sucesso!" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Erro ao processar o pedido: " + err.message })
  }
})

app.get("/getExtras/:pedido_id", verifyToken, async (req, res) => {
  try {
    const row = await dbGet(
      "SELECT id, extras, desc, preco, parcial FROM pedidos WHERE id = ? AND idLoja = ?",
      [req.params.pedido_id, req.user.idLoja]
    )
    res.json(row || {})
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* +1 na quantidade do pedido */
app.get('/addMore/:productid/:mesaid', verifyToken, async (req, res) => {
  const { productid, mesaid } = req.params
  const idLoja = req.user.idLoja

  try {
    const alterou = await dbRun(
      `UPDATE pedidos SET quantidade = quantidade + 1
        WHERE mesa_id = ? AND id = ? AND idLoja = ? AND status = 'aberto'`,
      [mesaid, productid, idLoja]
    )
    if (alterou.changes === 0) {
      return res.status(404).json({ error: "Pedido não encontrado." })
    }

    await atualizarTotalMesa(mesaid)

    const result = await dbAll(
      `SELECT pedidos.id, pedidos.mesa_id, pedidos.produto_id, pedidos.quantidade, pedidos.preco,
              produtos.nome AS nome, mesas.total AS total_mesa
         FROM pedidos
         JOIN produtos ON pedidos.produto_id = produtos.id
         JOIN mesas ON pedidos.mesa_id = mesas.id
        WHERE pedidos.mesa_id = ? AND pedidos.id = ?`,
      [mesaid, productid]
    )

    const oldQty = result[0].quantidade - 1
    await criarLog({
      usuario: req.user.nome,
      acao: 'ALTEROU QUANTIDADE',
      detalhes: `${oldQty} -> ${result[0].nome} -> ${result[0].quantidade}`,
      mesa_id: mesaid
    })
    return res.json(result)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erro ao alterar a quantidade !" + err.message })
  }
})

/* -1 na quantidade do pedido */
app.get('/menosUm/:productid/:mesaid', verifyToken, async (req, res) => {
  const { productid, mesaid } = req.params
  const idLoja = req.user.idLoja

  try {
    const row = await dbGet(
      "SELECT quantidade FROM pedidos WHERE mesa_id = ? AND id = ? AND idLoja = ? AND status = 'aberto'",
      [mesaid, productid, idLoja]
    )
    if (!row) return res.status(404).json({ error: "Pedido não encontrado." })
    if (row.quantidade <= 1) {
      return res.status(400).json({ error: "A quantidade mínima é 1. Para remover, apague o item." })
    }

    await dbRun(
      `UPDATE pedidos SET quantidade = quantidade - 1
        WHERE mesa_id = ? AND id = ? AND idLoja = ? AND status = 'aberto'`,
      [mesaid, productid, idLoja]
    )
    await atualizarTotalMesa(mesaid)

    const result = await dbGet(
      `SELECT pedidos.id, pedidos.mesa_id, pedidos.produto_id, pedidos.quantidade, pedidos.preco,
              produtos.nome AS nome, mesas.total AS total_mesa
         FROM pedidos
         JOIN produtos ON pedidos.produto_id = produtos.id
         JOIN mesas ON pedidos.mesa_id = mesas.id
        WHERE pedidos.mesa_id = ? AND pedidos.id = ?`,
      [mesaid, productid]
    )

    await criarLog({
      usuario: req.user.nome,
      acao: 'ALTEROU QUANTIDADE',
      detalhes: `${result.quantidade + 1} -> ${result.nome} -> ${result.quantidade}`,
      mesa_id: mesaid
    })
    return res.json(result)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erro ao alterar a quantidade !" + err.message })
  }
})

/* Remove um item (pedido) da mesa */
app.get("/deletarProduto/:productid/:mesaid", verifyToken, checkRole('admin'), async (req, res) => {
  const { productid, mesaid } = req.params
  const idLoja = req.user.idLoja

  try {
    const info = await dbGet(
      `SELECT pr.nome FROM pedidos pe
         JOIN produtos pr ON pr.id = pe.produto_id
        WHERE pe.id = ? AND pe.idLoja = ?`,
      [productid, idLoja]
    )

    const r = await dbRun(
      "DELETE FROM pedidos WHERE id = ? AND mesa_id = ? AND status = 'aberto' AND idLoja = ?",
      [productid, mesaid, idLoja]
    )
    if (r.changes === 0) {
      return res.status(400).json({ message: "Nenhum Produto Encontrado" })
    }

    await atualizarTotalMesa(mesaid)
    await criarLog({
      usuario: req.user.nome,
      acao: 'Deletou Item',
      detalhes: info?.nome || `pedido ${productid}`,
      mesa_id: mesaid
    })
    return res.status(200).json({ message: "Produto de ID " + productid + " Apagado com Sucesso !!!!" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erro ao apagar o produto de ID " + productid + " Erro : " + err.message })
  }
})

/* Histórico de pedidos (inclui os fechados) */
app.get("/historico-filtrado/:dias", verifyToken, async (req, res) => {
  try {
    const dias = Number(req.params.dias) || 1
    const rows = await dbAll(
      `SELECT * FROM pedidos
        WHERE idLoja = ?
          AND datetime(hora, 'localtime') >= datetime('now', 'localtime', '-' || ? || ' days')
        ORDER BY hora DESC`,
      [req.user.idLoja, dias]
    )
    res.json(rows)
  } catch (err) {
    console.error("Erro no SQL:", err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ───────────── PRODUTOS ───────────── */

app.post("/addProduct", verifyToken, upload.single('imagem'), (req, res) => {
  const { nome, preco, descricao, categoria, extras } = req.body
  const idLoja = req.user.idLoja

  if (!nome || !preco || !categoria) {
    return res.status(400).json({ message: 'Campos obrigatórios faltando' })
  }

  let extrasJSON = '[]'
  try {
    extrasJSON = JSON.stringify(JSON.parse(extras))
  } catch {
    extrasJSON = '[]'
  }

  const imagemPath = req.file ? `${idLoja}/${req.file.filename}` : null

  const sql = "INSERT INTO produtos (nome, preco, descricao, categoria, img, extras, idLoja) VALUES (?, ?, ?, ?, ?, ?, ?)"

  db.run(sql, [nome, preco, descricao, categoria, imagemPath, extrasJSON, idLoja], function (err) {
    if (err) return res.status(500).json({ message: 'Erro ao salvar: ' + err.message })
    res.status(200).json({ message: 'Produto cadastrado!', id: this.lastID })
  })
})

app.put('/produto/:id', verifyToken, checkRole('admin'), upload.single('imagem'), (req, res) => {
  const { nome, preco, descricao, categoria, extras } = req.body
  const idLoja = req.user.idLoja

  const campos = ['nome = ?', 'preco = ?', 'descricao = ?', 'categoria = ?', 'extras = ?']
  const valores = [nome, preco, descricao, categoria, extras]

  if (req.file) {
    campos.push('img = ?')
    valores.push(`${idLoja}/${req.file.filename}`)
  }

  valores.push(req.params.id, idLoja)

  db.run(
    `UPDATE produtos SET ${campos.join(', ')} WHERE id = ? AND idLoja = ?`,
    valores,
    function (err) {
      if (err) return res.status(500).json({ message: err.message })
      if (this.changes === 0) return res.status(404).json({ message: 'Produto não encontrado' })
      return res.json({ ok: true })
    }
  )
})

app.delete('/produto/:id', verifyToken, checkRole('admin'), async (req, res) => {
  const idLoja = req.user.idLoja

  try {
    const produto = await dbGet(
      "SELECT nome FROM produtos WHERE id = ? AND idLoja = ?",
      [req.params.id, idLoja]
    )
    if (!produto) return res.status(404).json({ message: 'Produto não encontrado' })

    await dbRun("DELETE FROM produtos WHERE id = ? AND idLoja = ?", [req.params.id, idLoja])

    await criarLog({
      usuario: req.user.nome,
      acao: 'REMOVEU PRODUTO',
      detalhes: produto.nome
    })
    return res.json({ ok: true })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

app.get("/getprodutobody/:productid", (req, res) => {
  db.get("SELECT * FROM produtos WHERE id = ?", [req.params.productid], (err, row) => {
    if (err) {
      console.log("Impossivel adicionar o produto a mesa " + err)
      return res.status(500).json({ error: err.message })
    }
    res.json(row || {})
  })
})

app.get("/products/:category", (req, res) => {
  db.all("SELECT * FROM produtos WHERE categoria = ?", [req.params.category], (err, produto) => {
    if (err) {
      console.log("Impossivel recuperar os produtos erro  " + err)
      return res.status(500).json({ error: err.message })
    }
    res.json(produto || [])
  })
})

/* ───────────── LOJA (nome / logo) ───────────── */

app.post("/alterLoja", verifyToken, (req, res) => {
  const { nomeLoja, logoLoja } = req.body
  const idLoja = req.user.idLoja

  if (!nomeLoja && !logoLoja) {
    return res.json({ error: "Nenhuma informação transferida " })
  }

  const campos = []
  const valores = []
  if (nomeLoja) { campos.push('nomeLoja = ?'); valores.push(nomeLoja) }
  if (logoLoja) { campos.push('logo = ?'); valores.push(logoLoja) }
  valores.push(idLoja)

  db.run(`UPDATE lojasInfo SET ${campos.join(', ')} WHERE idLoja = ?`, valores, (err) => {
    if (err) return res.json({ error: "Não foi possivel atualizar os dados" + err.message })
    return res.json({ success: "Informações Salvas com Sucesso !!!" })
  })
})

/* ───────────── ADMIN: USUÁRIOS (só da própria loja) ───────────── */

app.get('/admin/usuarios', verifyToken, checkRole('admin'), (req, res) => {
  db.all(
    'SELECT id, user, email, role, idLoja FROM usuarios WHERE idLoja = ?',
    [req.user.idLoja],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message })
      res.json(rows)
    }
  )
})

app.post('/admin/usuarios', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { user, email, role, senha } = req.body
    if (!user || !email || !senha) {
      return res.status(400).json({ message: 'Campos obrigatórios' })
    }

    const idLoja = req.user.idLoja
    const nome = user.trim().toLowerCase()

    const existe = await dbGet(
      'SELECT id FROM usuarios WHERE user = ? AND idLoja = ?', [nome, idLoja]
    )
    if (existe) return res.status(409).json({ message: 'Usuário já existe nessa loja.' })

    const hash = await argon2hash.hash(senha)   // mesmo algoritmo do login
    const r = await dbRun(
      'INSERT INTO usuarios (user, email, password, role, idLoja) VALUES (?,?,?,?,?)',
      [nome, email.trim().toLowerCase(), hash, role || 'user', idLoja]
    )
    res.json({ ok: true, id: r.lastID })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

app.put('/admin/usuarios/:id', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { user, email, role, senha } = req.body
    const idLoja = req.user.idLoja

    if (senha) {
      const hash = await argon2hash.hash(senha)
      await dbRun(
        'UPDATE usuarios SET user=?, email=?, role=?, password=? WHERE id=? AND idLoja=?',
        [user.toLowerCase(), email.toLowerCase(), role, hash, req.params.id, idLoja]
      )
    } else {
      await dbRun(
        'UPDATE usuarios SET user=?, email=?, role=? WHERE id=? AND idLoja=?',
        [user.toLowerCase(), email.toLowerCase(), role, req.params.id, idLoja]
      )
    }
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

app.delete('/admin/usuarios/:id', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const r = await dbRun(
      'DELETE FROM usuarios WHERE id=? AND idLoja=?',
      [req.params.id, req.user.idLoja]
    )
    if (r.changes === 0) return res.status(404).json({ message: 'Usuário não encontrado' })

    await criarLog({
      usuario: req.user.nome,
      acao: 'DELETOU UM USUARIO',
      detalhes: `${req.params.id}`
    })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/* ───────────── LOGS ───────────── */

app.get('/logs/:dias', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const dias = Number(req.params.dias || 7)
    const result = await dbAll(
      `SELECT * FROM logs
        WHERE datetime(data) >= datetime('now', ?)
        ORDER BY id DESC`,
      [`-${dias} day`]
    )
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ───────────── PÁGINA INICIAL E SERVIDOR ───────────── */

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
  })
})