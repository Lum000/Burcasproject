const cron    = require('node-cron');
const fs      = require('fs');
const path    = require('path');

const DB_PATH     = path.join(__dirname, 'lanchonete.db');
const BACKUP_DIR  = path.join(__dirname, 'backups');

// cria a pasta de backups se não existir
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function fazerBackup() {
  const agora     = new Date();
  const timestamp = agora.toISOString().replace(/[:.]/g, '-');
  const destino   = path.join(BACKUP_DIR, `lanchonete_${timestamp}.db`);

  try {
    fs.copyFileSync(DB_PATH, destino);
    console.log(`✅ Backup realizado: ${destino}`);
    limparBackupsAntigos();
  } catch (err) {
    console.error('❌ Erro ao fazer backup:', err.message);
  }
}

// mantém só os últimos 7 backups
function limparBackupsAntigos() {
  const arquivos = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.db'))
    .map(f => ({
      nome: f,
      caminho: path.join(BACKUP_DIR, f),
      data: fs.statSync(path.join(BACKUP_DIR, f)).mtime
    }))
    .sort((a, b) => b.data - a.data); // mais recente primeiro

  // apaga os que passarem de 7
  arquivos.slice(7).forEach(f => {
    fs.unlinkSync(f.caminho);
    console.log(`🗑️  Backup antigo removido: ${f.nome}`);
  });
}

// ── AGENDAMENTOS ──
// a cada hora
cron.schedule('0 * * * *', () => {
  console.log('⏰ Backup horário...');
  fazerBackup();
});

// todo dia à meia-noite
cron.schedule('0 0 * * *', () => {
  console.log('⏰ Backup diário...');
  fazerBackup();
});

// faz um backup imediato ao iniciar
fazerBackup();

console.log('🔄 Sistema de backup iniciado!');

module.exports = { fazerBackup };