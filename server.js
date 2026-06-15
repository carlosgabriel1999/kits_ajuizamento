const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Garantir que a pasta de uploads temporários exista (opcional se salvarmos na raiz)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname); // Salva diretamente na raiz do projeto
  },
  filename: function (req, file, cb) {
    cb(null, 'dados_processados.xlsx');
  }
});

const upload = multer({ storage: storage });

// Servir arquivos estáticos do frontend (pasta public)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Função para processar o arquivo Excel
function processarExcel(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const workbook = xlsx.readFile(filePath);
  
  // Verificar se a aba Unificado existe
  if (!workbook.SheetNames.includes('Unificado')) {
    throw new Error('A aba "Unificado" não foi encontrada no arquivo Excel.');
  }

  const sheet = workbook.Sheets['Unificado'];
  // Converte para JSON
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

  // Filtrar apenas linhas úteis (onde o número do CONTRATO não é nulo/vazio)
  const contracts = rows.filter(row => {
    return row['CONTRATO'] !== null && 
           row['CONTRATO'] !== undefined && 
           String(row['CONTRATO']).trim() !== '' &&
           String(row['CONTRATO']).trim() !== 'CONTRATO'; // ignora repetições de cabeçalho
  });

  // Métricas do Dashboard
  // Total Geral: Contratos ativos (SITUAÇÃO diferente de "PAGO")
  const activeContracts = contracts.filter(c => {
    const sit = String(c['SITUAÇÃO'] || '').toUpperCase().trim();
    return sit !== 'PAGO' && sit !== '';
  });
  const total = activeContracts.length;

  // Kits Completos: SITUAÇÃO === "KIT OK"
  const kitsCompletos = activeContracts.filter(c => String(c['SITUAÇÃO'] || '').toUpperCase().trim() === 'KIT OK').length;
  
  // Doc. Pendente: SITUAÇÃO === "DOCS PARCIAL"
  const docPendente = activeContracts.filter(c => String(c['SITUAÇÃO'] || '').toUpperCase().trim() === 'DOCS PARCIAL').length;
  
  // A iniciar: SITUAÇÃO === "A INICIAR"
  const aIniciar = activeContracts.filter(c => String(c['SITUAÇÃO'] || '').toUpperCase().trim() === 'A INICIAR').length;
  
  // Não Localizado: SITUAÇÃO === "NENHUM DOCUMENTO"
  const naoLocalizado = activeContracts.filter(c => String(c['SITUAÇÃO'] || '').toUpperCase().trim() === 'NENHUM DOCUMENTO').length;
  
  // Pendência Âncora: SITUAÇÃO === "PENDÊNCIA ÂNCORA"
  const pendenciaAncora = activeContracts.filter(c => String(c['SITUAÇÃO'] || '').toUpperCase().trim() === 'PENDÊNCIA ÂNCORA').length;

  // % Realizados e % A iniciar
  // Realizados são os que saíram do status "A INICIAR" e "PAGO" (ou seja, kits_completos + doc_pendente + nao_localizado + pendencia_ancora)
  const totalRealizados = kitsCompletos + docPendente + naoLocalizado + pendenciaAncora;
  const percentRealizados = total > 0 ? (totalRealizados / total) * 100 : 0;
  const percentAIniciar = total > 0 ? (aIniciar / total) * 100 : 0;

  // 1. Tabela Dinâmica: Status X Situação de Cobrança (pivot_status_sit_cob)
  const sitCobs = ['CC3', 'M08', 'PJ4'];
  const statusList = ['A INICIAR', 'DOCS PARCIAL', 'KIT OK', 'NENHUM DOCUMENTO', 'PENDÊNCIA ÂNCORA'];
  
  const pivotStatusSitCob = {};
  sitCobs.forEach(sc => {
    pivotStatusSitCob[sc] = {};
    let scTotal = 0;
    statusList.forEach(st => {
      const count = activeContracts.filter(c => {
        const cSitCob = String(c['SIT COB'] || '').toUpperCase().trim();
        const cSit = String(c['SITUAÇÃO'] || '').toUpperCase().trim();
        return cSitCob === sc && cSit === st;
      }).length;
      pivotStatusSitCob[sc][st] = count;
      scTotal += count;
    });
    pivotStatusSitCob[sc]['Total'] = scTotal;
  });

  // 2. Tabela Dinâmica: Quantidade X Situação de Cobrança (qty_by_sit_cob)
  const qtyBySitCob = {};
  sitCobs.forEach(sc => {
    qtyBySitCob[sc] = activeContracts.filter(c => String(c['SIT COB'] || '').toUpperCase().trim() === sc).length;
  });

  // Mapear contratos para formato amigável para enviar ao frontend
  const formattedContracts = contracts.map(c => ({
    contrato: c['CONTRATO'],
    grupo: c['GRUPO'],
    cota: c['COTA'],
    cpf_cnpj: c['CPF_CNPJ'],
    nome: c['NOME'],
    situacao: c['SITUAÇÃO'] || 'A INICIAR',
    obs: c['DOCS PENDENTES/OBSERVAÇÕES'] || '',
    sit_cob: c['SIT COB'] || 'N/A'
  }));

  return {
    summary: {
      total,
      kits_completos: kitsCompletos,
      doc_pendente: docPendente,
      a_iniciar: aIniciar,
      nao_localizado: naoLocalizado,
      pendencia_ancora: pendenciaAncora,
      percent_realizados: parseFloat(percentRealizados.toFixed(2)),
      percent_a_iniciar: parseFloat(percentAIniciar.toFixed(2))
    },
    pivot_status_sit_cob: pivotStatusSitCob,
    qty_by_sit_cob: qtyBySitCob,
    contracts: formattedContracts
  };
}

// Rota para buscar os dados atuais se existirem
app.get('/api/dados-atuais', (req, res) => {
  const filePath = path.join(__dirname, 'dados_processados.xlsx');
  
  // Tentar carregar primeiro os dados processados e depois o arquivo original
  let activePath = filePath;
  if (!fs.existsSync(filePath)) {
    const originalPath = path.join(__dirname, 'Formacao_kit.xlsx');
    if (fs.existsSync(originalPath)) {
      activePath = originalPath;
    } else {
      return res.json({ hasData: false });
    }
  }

  try {
    const data = processarExcel(activePath);
    res.json({ hasData: true, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para upload do arquivo Excel
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  const filePath = path.join(__dirname, 'dados_processados.xlsx');

  try {
    const data = processarExcel(filePath);
    res.json({ success: true, ...data });
  } catch (error) {
    // Se falhar o processamento, apaga o arquivo corrompido ou incompatível
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
