@echo off
:: Navega até o diretório onde o script está localizado
cd /d "%~dp0"

echo =================================================
echo Iniciando Dashboard de Kits de Ajuizamento
echo =================================================

:: Verifica se o node está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Erro: Node.js nao esta instalado. Por favor, instale o Node.js antes de continuar.
    pause
    exit /b 1
)

:: Verifica se a pasta node_modules existe, se nao, instala as dependências
if not exist node_modules (
    echo Instalando dependencias necessarias ^(primeira execucao^)...
    call npm install
)

echo Iniciando o servidor backend...
:: Abre o navegador padrão na URL da aplicação
start http://localhost:3000

:: Inicia o servidor Node.js
node server.js

pause
