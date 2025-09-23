# Tatione Telecom bot — Assistente Virtual (MikroTik + Telecom)

Assistente omnicanal (Web + Telegram) que responde com IA (Gemini), fala e entende voz (Web Speech API), guarda histórico (PostgreSQL/Prisma) e tem **modo especialista MikroTik** para configurações RouterOS v7.

> **Demo local**: Web (Next.js + MUI) e API (Fastify + TypeScript).  
> **Telegram**: suporte a comandos `/start`, `/end`, `/status`, `/mode`, `/mikrotik`, `/generic`.  
> **Grupo Telegram**: https://t.me/+g2B5UXLXiaU0MGFh

---

## ✨ Principais recursos
- Chat Web com **voz** (fala e escuta) e **intents rápidas**.
- Integração **Telegram Bot** (polling) com comandos e suporte a grupos.
- **Gemini 2.5 (flash por padrão)** com orçamento de raciocínio reduzido (respostas rápidas).
- **Modo “MikroTik”**: gera passos e **comandos RouterOS v7** seguros, com explicações.
- Histórico e personalização via **PostgreSQL + Prisma**.
- UI moderna com **Next.js + Material UI**.

---

## 🧱 Stack
- **API**: Fastify, TypeScript, Prisma, node-telegram-bot-api
- **NLP/IA**: Google Generative AI (Gemini 2.5 — `flash` por padrão)
- **Web**: Next.js (App Router), Material UI, Web Speech API (STT/TTS)
- **DB**: PostgreSQL
- **Dev**: ESLint, Prettier
- **Deploy**: Vercel (web) + Render/Railway/Koyeb (api) ou Docker

---

## 📂 Estrutura (monorepo)
```
telecom-assistente/
├─ apps/
│  ├─ api/                # Fastify + Prisma + Telegram bot
│  │  ├─ src/
│  │  │  ├─ plugins/     # env, telegram, prisma, etc.
│  │  │  ├─ routes/      # /health, /users, /chat
│  │  │  ├─ services/    # gemini.ts (modo mikrotik/generic)
│  │  └─ prisma/         # schema.prisma, migrations
│  └─ web/                # Next.js (MUI) — página única com o chat
│     └─ src/app/        # layout.tsx, page.tsx, theme
├─ infra/                 # docker, sql (opcional)
├─ packages/              # shared libs (opcional)
└─ .github/workflows/     # CI/CD (opcional)
```

---

## ⚙️ Pré‑requisitos
- Node.js 18+ (LTS)
- NPM (ou PNPM/Yarn)
- PostgreSQL (local ou em container)
- Token do **BotFather** (Telegram)
- **Gemini API key** (estudante/grátis disponível pelo Google)

---

## 🚀 Setup rápido (local)

### 1) API
```powershell
cd apps/api
npm install
Copy-Item .env.example .env
```

Edite `apps/api/.env` (exemplo seguro e rápido):
```ini
PORT=4000

GEMINI_API_KEY=coloque_sua_chave_aqui
GEMINI_MODEL=gemini-2.5-flash
GEMINI_THINKING_BUDGET=512

TELEGRAM_BOT_TOKEN=coloque_seu_token_aqui

# Ajuste a porta do Postgres se necessário
DATABASE_URL=postgresql://user:password@localhost:5432/telecom_assistente?schema=public
```

Prisma:
```powershell
npx prisma generate
npx prisma migrate dev --name init
```

Rodar API:
```powershell
npm run dev
# Health: http://localhost:4000/health
```

### 2) Web
```powershell
cd ../../web
npm install
```

Crie `apps/web/.env.local`:
```ini
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Rodar Web:
```powershell
npm run dev
# Abra: http://localhost:3000  (se 3000 estiver em uso, Next usará 3001)
```

---

## 🤖 Telegram — comandos e grupo

- Crie um bot no **@BotFather** e recupere o token → coloque em `TELEGRAM_BOT_TOKEN`.
- Registre comandos no BotFather (aparecem no menu de sugestões):
```
start - Ativar o assistente
end - Pausar o assistente
status - Ver estado do assistente
mode - Trocar modo (generic ou mikrotik)
mikrotik - Ativar modo especialista MikroTik
generic - Voltar ao modo genérico
help - Ver ajuda e exemplos
```
- Em **grupos**, o Telegram envia comandos como `/comando@SeuBot`. O código já aceita esse formato.
- Grupo público do projeto: **https://t.me/+g2B5UXLXiaU0MGFh**

---

## 🧪 Testes rápidos (API)
Health:
```bash
curl http://localhost:4000/health
```

Criar usuário (PowerShell):
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/users" -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"name":"Thalysson Carvalho","username":"thalysson","email":"thaly@example.com"}'
```

Listar usuários:
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/users" -Method GET
```

Chat (modo opcional `domainMode`):
```bash
curl -X POST http://localhost:4000/chat \
  -H "Content-Type: application/json" \
  -d '{"conversationId":"SUA_CONVERSA","text":"Minha internet está lenta","domainMode":"mikrotik"}'
```

Abrir **Prisma Studio**:
```bash
npx prisma studio
```

---

## 🧩 Frontend (destaques)
- Página única (`/`) com **hero**, cards de features e **chat embutido**.
- Botões “Abrir chat”/“Testar voz” rolam a página até a seção do chat.
- **Cartão Telegram** abre o grupo em nova aba.
- Toggle **“Modo especialista MikroTik”** define contexto para respostas RouterOS v7.
- **TTS limpo**: remove markdown, links e símbolos para não “soletrar” caracteres.

---

## 🧠 IA (Gemini)
- Padrão de velocidade: `gemini-2.5-flash` + `GEMINI_THINKING_BUDGET=512`.
- Para qualidade máxima, troque para `gemini-2.5-pro` em `apps/api/.env`.
- O serviço lê somente **poucas mensagens recentes** para manter latência baixa.
- No modo **MikroTik**, o prompt força comandos coerentes e explicações curtas.

---

## 🔐 Segurança
- **Nunca** exponha `GEMINI_API_KEY` no frontend. Só na API.
- Revogue tokens vazados no BotFather e gere novos.
- Avalie limites de taxa e abuse-guard no Telegram (mensagens longas são fatiadas).

---

## 🛠 Scripts úteis
API (`apps/api/package.json`):
- `dev` — Fastify em modo dev
- `lint`, `format` — ESLint/Prettier
- `prisma:generate`, `prisma:migrate`, `prisma:studio`

Web (`apps/web/package.json`):
- `dev` — Next.js dev
- `build`, `start`
- `lint`

---

## 🐞 Troubleshooting
- **Next “/chat 404”**: não existe rota `/chat`. Os botões rolam para `#chat` na home.
- **Link Telegram sublinhado**: cartão usa `component="a"` sem decoração.
- **Bot não responde em grupo**: verifique se foi citado `@SeuBot` e se `/start@SeuBot` foi enviado.
- **Comandos com @**: regex aceita `/comando@SeuBot`. Use `/mode@SeuBot mikrotik` ou `/mikrotik@SeuBot`.
- **Grid MUI/TS**: UI usa **CSS Grid via `<Box>`** (sem dependência do Grid v2).
- **TTS lê asteriscos**: já sanitizado via `cleanForTTS`.
- **Portas ocupadas**: Next troca para 3001; altere `PORT` da API se precisar.
- **Windows PowerShell**: para `curl` use `Invoke-RestMethod`.

---

## 🧭 Roadmap
- Docker Compose (API + Postgres + Web)
- CI/CD (GitHub Actions)
- Snippets de MikroTik prontos (NAT, VLAN, PPPoE, CAPsMAN, firewall)
- Autenticação de operador/admin e painel de tickets

---

## 📄 Licença
MIT — use livremente, com atribuição.

---

## 🙌 Créditos
Projeto criado por Thalysson com apoio do Tatione Telecom bot.
