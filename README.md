# Kits Ajuizamento - Dashboard Operacional

Este projeto é uma ferramenta de acompanhamento e monitoramento visual dos kits de ajuizamento de contratos operacionais, criada com o objetivo de centralizar dados, automatizar a leitura de planilhas de controle e facilitar a visualização e o gerenciamento individual de cada caso para tomada de decisão estratégica.

---

## 🚀 Funcionalidades Principais

*   **Upload Dinâmico de Excel:** Permite fazer upload de arquivos de controle Excel (`.xlsx` ou `.xls`). A ferramenta processa automaticamente a aba `Unificado` gerando as métricas instantaneamente.
*   **KPIs Estratégicos e Operacionais:**
    *   **Métricas Gerais:** Volume total ativo, kits completos (KIT OK), documentos pendentes (DOCS PARCIAL) e processos a iniciar.
    *   **Métricas Secundárias:** Casos não localizados, pendências âncora e taxas percentuais de progresso operacional.
*   **Gráficos Interativos (Chart.js):**
    *   *Status X Situação de Cobrança:* Cruzamento de status operacionais agrupados pelas carteiras de cobrança (CC3, M08, PJ4) em um gráfico de barras empilhadas com rótulos numéricos internos.
    *   *Distribuição de Cobrança:* Gráfico de rosca exibindo a proporção percentual de volume de cada carteira de cobrança.
*   **Gerenciamento Individual (Lista de Contratos):** Tabela completa com paginação dinâmica, ordenação por cabeçalhos e filtros avançados (pesquisa textual global, filtros por carteira e por status operacional).
*   **Exportação Premium para Imagem (Diretoria):**
    *   Exporta o dashboard de forma otimizada no formato horizontal (paisagem) com proporção 16:9.
    *   Gera imagens em altíssima definição (HD) prontas para slides e relatórios executivos.
    *   Garante consistência absoluta de fontes e posicionamento entre sistemas macOS e Windows.

---

## 🛠️ Tecnologias Utilizadas

### Backend
*   **Node.js** (Ambiente de execução)
*   **Express** (Servidor web e roteamento de APIs)
*   **Multer** (Gerenciamento de upload de arquivos)
*   **xlsx (SheetJS)** (Processamento e leitura dos dados de planilhas Excel)

### Frontend
*   **HTML5 & CSS3 Vanilla** (Estruturação e estilização com variáveis nativas e micro-animações)
*   **JavaScript ES6** (Lógica do cliente e manipulação assíncrona do DOM)
*   **Chart.js & ChartDataLabels** (Visualização dinâmica de dados)
*   **html2canvas** (Mecanismo de renderização para exportação de imagem de alta resolução)
*   **FontAwesome v6** (Conjunto de ícones premium)

---

## 📁 Estrutura de Diretórios Recomendada para a Planilha

Para que a leitura da planilha ocorra de forma correta, o arquivo Excel deve conter:
1. Uma aba nomeada exatamente como **`Unificado`**.
2. As seguintes colunas estruturais em seu cabeçalho:
   *   `CONTRATO`: Número do contrato de acompanhamento.
   *   `GRUPO` e `COTA`: Códigos do consórcio/grupo e cota.
   *   `NOME`: Nome do cliente.
   *   `CPF_CNPJ`: CPF ou CNPJ do titular do contrato.
   *   `SIT COB`: Código da carteira de cobrança (ex: CC3, M08, PJ4).
   *   `SITUAÇÃO`: Status do kit (ex: `A INICIAR`, `DOCS PARCIAL`, `KIT OK`, `NENHUM DOCUMENTO`, `PENDÊNCIA ÂNCORA`, `PAGO`).
   *   `DOCS PENDENTES/OBSERVAÇÕES`: Notas internas e descritivos sobre pendências documentais.

---

## ⚙️ Instalação e Execução

### Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina (versão >= 18.0.0 recomendada).

### Passos para Rodar Localmente

1.  **Clonar o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/kits-ajuizamento.git
    cd kits-ajuizamento
    ```

2.  **Instalar as dependências do projeto:**
    ```bash
    npm install
    ```

3.  **Iniciar o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    *Ou inicie no modo de produção:*
    ```bash
    npm start
    ```

4.  **Acessar a aplicação:**
    Abra o navegador e acesse: [http://localhost:3000](http://localhost:3000)

*Nota: Ao carregar pela primeira vez, o servidor buscará automaticamente por um arquivo local chamado `Formacao_kit.xlsx` na raiz do projeto (se disponível) para preencher a tela inicial.*

---

## 💻 Compatibilidade Multiplataforma

A ferramenta foi revisada e otimizada para navegadores baseados em Chromium rodando tanto em **macOS** quanto em **Windows**, contornando bugs comuns de herança tipográfica de fontes web e garantindo o reset de deslocamento de rolagem de páginas ao realizar a exportação da imagem.
