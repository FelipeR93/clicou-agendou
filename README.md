# Clicou Agendou

Sistema de agendamento de horários para clínica de atendimento especializado em TEA (Transtorno do Espectro Autista).

## Funcionalidades

- **3 tipos de acesso**: Admin, Profissional, Responsável (do aprendiz)
- **Gestão completa** de profissionais, aprendizes e salas de atendimento
- **Agendamento inteligente** com detecção de conflitos de horário
- **Controle de presença**: profissional inicia e encerra o atendimento
- **Segurança**: senhas com bcrypt, JWT, role-based access control

## Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Banco de dados**: PostgreSQL + Prisma ORM 7
- **Autenticação**: NextAuth.js v5
- **UI**: Tailwind CSS v4 + Radix UI
- **Deploy**: Render

## Como Rodar Localmente

1. **Clone e instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   # Edite .env com suas credenciais do PostgreSQL
   ```

3. **Execute as migrations e o seed:**
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. **Acesse**: http://localhost:3000

## Credenciais Padrão (após seed)

| Campo | Valor |
|-------|-------|
| Email | admin@clicouagendou.com.br |
| Senha | Admin@123456 |

## Deploy no Render

1. Faça fork/push para o GitHub
2. Crie um novo **Web Service** no [Render](https://render.com)
3. Conecte o repositório — o `render.yaml` configura tudo automaticamente
4. As variáveis `DATABASE_URL` e `NEXTAUTH_SECRET` são geradas automaticamente
5. Após o deploy, rode o seed via **Render Shell**:
   ```bash
   npx prisma db push && npx prisma db seed
   ```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string do PostgreSQL |
| `NEXTAUTH_SECRET` | Segredo para tokens JWT (min. 32 chars) |
| `NEXTAUTH_URL` | URL pública da aplicação |

## Estrutura de Perfis

| Perfil | Acesso |
|--------|--------|
| **Admin** | Cadastro de profissionais, aprendizes, salas; criação de agendamentos; visão global |
| **Profissional** | Visualiza sua própria agenda; configura disponibilidade; inicia/encerra atendimentos |
| **Responsável** | Visualiza os agendamentos do seu aprendiz |

## Especialidades dos Profissionais

- AT — Acompanhante Terapêutico
- TO — Terapeuta Ocupacional
- FONO — Fonoaudiologia
- PSICO — Psicologia
- FISIO — Fisioterapia
- Outro

## Segurança

- Senhas hasheadas com bcrypt (12 salt rounds)
- Tokens JWT com expiração
- Middleware de autorização por role em todas as rotas
- Senhas nunca retornadas nas respostas de API
- Validação de entradas com Zod
- Configuração split de auth (edge-compatible middleware)
