# Jewelry ERP System - Gestão Industrial 💍

Este é um sistema **Full-Stack** robusto desenvolvido para automatizar e gerenciar os processos de uma fábrica de alianças. O projeto foi concebido para resolver desafios reais de logística, controle de produção e gestão financeira.

## 🚀 Status do Projeto
O sistema está sendo construído com foco inicial em uma **arquitetura de Back-end sólida e escalável**, garantindo a integridade das regras de negócio antes da implementação da interface em React.

## 🛠 Tecnologias Utilizadas
- **Runtime:** Node.js
- **Framework:** Express
- **Banco de Dados:** PostgreSQL (Relacional)
- **Linguagem:** JavaScript (ES6+)
- **Arquitetura:** Controller-Service-Repository (Separação de responsabilidades)

## 📋 Funcionalidades (Back-end Core)
- **Gestão de Pedidos:** Controle de status em tempo real (Em produção, Pronto, Enviado).
- **Módulo Financeiro:** Gerenciamento de pagamentos, carteira de clientes e fluxo de caixa.
- **Controle de Estoque:** Abatimento automático de matéria-prima e insumos.
- **Sistema de Permissões:** Diferenciação de acessos para ADM, Vendas e Produção.

## 🏗 Estrutura da Arquitetura
O projeto segue padrões de **Clean Code** e separação de camadas para facilitar a manutenção e a integração com o Front-end:



- **Controllers:** Responsáveis por receber as requisições e enviar as respostas.
- **Services:** Onde reside toda a lógica de negócio (cálculos, validações, regras da fábrica).
- **Repositories:** Camada de comunicação direta com o banco de dados PostgreSQL.

## 🔧 Como Executar o Projeto
1. Clone o repositório:
   `git clone https://github.com/LeandroAcipreste/jewelry-erp-system.git`
2. Instale as dependências:
   `npm install`
3. Configure as variáveis de ambiente no arquivo `.env` (Ex: Banco de Dados).
4. Execute as Migrations/Seeds para preparar o banco:
   `npx knex migrate:latest` (ou o comando de migrations que você estiver usando).
5. Inicie o servidor:
   `npm run dev`

## 📂 Próximos Passos
- [ ] Implementação do Front-end em **React.js**.
- [ ] Integração com APIs de frete e logística.
- [ ] Dashboard de indicadores (BI) para a gestão da fábrica.

---
**Desenvolvido por [Leandro Acipreste](https://www.linkedin.com/in/leandroacipreste/)**