#!/bin/bash
# Navega até o diretório onde o script está localizado
cd "$(dirname "$0")"

echo "================================================="
echo "Iniciando Dashboard de Kits de Ajuizamento"
echo "================================================="

# Verifica se o node está instalado
if ! command -v node &> /dev/null
then
    echo "Erro: Node.js não está instalado. Por favor, instale o Node.js antes de continuar."
    read -p "Pressione qualquer tecla para sair..."
    exit 1
fi

# Verifica se a pasta node_modules existe, se não, instala as dependências
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências necessárias (primeira execução)..."
    npm install
fi

echo "Iniciando o servidor backend..."
# Abre o navegador padrão na URL da aplicação
open "http://localhost:3000"

# Inicia o servidor Node.js
node server.js
