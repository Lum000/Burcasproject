const sqlite3 = require('sqlite3')
const db = new sqlite3.Database('lanchonete.db')

const ERRADO = 'burcaslanchonete'
const CERTO = 'burcas-lanchonete'

// tabelas que têm a coluna idLoja
const tabelas = ['produtos', 'pedidos', 'mesas', 'usuarios']

db.serialize(() => {
  tabelas.forEach((t) => {
    db.run(`UPDATE ${t} SET idLoja = ? WHERE idLoja = ?`, [CERTO, ERRADO], function (err) {
      console.log(t.padEnd(10), err ? 'ERRO: ' + err.message : 'linhas alteradas: ' + this.changes)
    })
  })

  db.all('SELECT idLoja, COUNT(*) AS n FROM produtos GROUP BY idLoja', (e, r) => {
    console.log('\nprodutos por loja agora:', e || r)
  })
})