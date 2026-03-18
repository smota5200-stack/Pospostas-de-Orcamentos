# 🧾 Proposify – Gerador de Propostas Comerciais

Aplicação web para criação e gerenciamento de propostas comerciais com banco de dados PostgreSQL hospedado no Render.

---

## 🚀 Deploy no Render (passo a passo)

### 1. Subir o código no GitHub

```bash
# No terminal, dentro da pasta do projeto:
git init
git add .
git commit -m "primeiro commit – proposify"

# Crie um repositório no github.com e conecte:
git remote add origin https://github.com/SEU_USUARIO/proposify.git
git push -u origin main
```

---

### 2. Criar o banco de dados PostgreSQL no Render

1. Acesse [render.com](https://render.com) e faça login
2. Clique em **New +** → **PostgreSQL**
3. Preencha:
   - **Name:** `proposify-db`
   - **Region:** `Oregon (US West)` ou mais próximo do Brasil
   - **Plan:** Free (suficiente para testes) ou Starter ($7/mês para produção)
4. Clique em **Create Database**
5. Aguarde o banco ficar `Available`
6. **Copie a "Internal Database URL"** – você precisará dela no próximo passo

---

### 3. Criar o Web Service no Render

1. Clique em **New +** → **Web Service**
2. Conecte sua conta do GitHub
3. Selecione o repositório `proposify`
4. Preencha:
   - **Name:** `proposify`
   - **Region:** mesma do banco
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free ou Starter

---

### 4. Configurar as variáveis de ambiente

No painel do Web Service, vá em **Environment** e adicione:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Cole a Internal Database URL copiada no passo 2 |
| `NODE_ENV` | `production` |

> ⚠️ **Importante:** Use a **Internal** URL (não a External) para que a comunicação entre o serviço e o banco seja interna e gratuita no Render.

---

### 5. Fazer o deploy

1. Clique em **Create Web Service**
2. O Render vai:
   - Clonar o repositório
   - Rodar `npm install`
   - Rodar `npm start`
   - Criar as tabelas automaticamente (o código faz isso no startup)
3. Aguarde a mensagem `Your service is live 🎉`
4. Acesse a URL fornecida: `https://proposify.onrender.com`

---

## 🔄 Atualizações automáticas

Após o setup inicial, qualquer `git push` para a branch `main` dispara um novo deploy automaticamente.

```bash
git add .
git commit -m "nova feature"
git push
# Render detecta e faz deploy em ~2 minutos
```

---

## 📁 Estrutura do projeto

```
proposify/
├── server.js              ← Servidor Express principal
├── package.json           ← Dependências Node.js
├── .env.example           ← Exemplo de variáveis de ambiente
├── .gitignore             ← Ignora node_modules e .env
├── db/
│   └── index.js           ← Conexão PostgreSQL + criação de tabelas
├── routes/
│   └── orcamentos.js      ← API REST (CRUD completo)
└── public/
    └── index.html         ← Frontend (HTML/CSS/JS completo)
```

---

## 🛠️ Rodar localmente

```bash
# Instalar dependências
npm install

# Criar arquivo .env baseado no exemplo
cp .env.example .env
# Edite o .env com sua DATABASE_URL local

# Iniciar em modo desenvolvimento
npm run dev

# Acesse: http://localhost:3000
```

---

## 📡 API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/orcamentos` | Listar todos os orçamentos |
| GET | `/api/orcamentos/:id` | Buscar um orçamento com itens |
| POST | `/api/orcamentos` | Criar novo orçamento |
| PUT | `/api/orcamentos/:id` | Atualizar orçamento existente |
| DELETE | `/api/orcamentos/:id` | Deletar orçamento |
| GET | `/health` | Health check do servidor |

---

## 💡 Dicas importantes

- **Free tier do Render:** O banco PostgreSQL gratuito expira após 90 dias. Para produção, use o plano Starter ($7/mês).
- **Cold start:** No plano Free, o serviço "dorme" após 15 min sem tráfego. A primeira requisição pode demorar ~30s para acordar.
- **Logs:** Acesse os logs em tempo real no painel do Render em **Logs**.
- **SSL:** O Render fornece HTTPS automaticamente. Não precisa configurar nada.
