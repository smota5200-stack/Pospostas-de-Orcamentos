# 🔥 Proposify – Deploy no Firebase

Sem servidor, sem backend. O HTML fala diretamente com o Firestore.

---

## Estrutura do projeto

```
proposify-firebase/
├── firebase.json        ← config do Firebase Hosting
├── .firebaserc          ← ID do seu projeto
├── .gitignore
└── public/
    └── index.html       ← app completo (HTML + Firestore SDK)
```

---

## Passo a passo completo

### 1. Criar projeto no Firebase Console

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **Adicionar projeto**
3. Nome: `proposify` → Continuar
4. Google Analytics: pode desativar → **Criar projeto**

---

### 2. Ativar o Firestore

1. No menu lateral: **Criação → Firestore Database**
2. Clique em **Criar banco de dados**
3. Modo: escolha **Modo de produção** (mais seguro) ou **Modo de teste** (mais fácil para começar)
4. Localização: `southamerica-east1` (São Paulo) → **Ativar**

> **Modo de teste** permite leitura/escrita livre por 30 dias. Depois configure as regras abaixo.

**Regras de segurança recomendadas** (Firestore → Regras):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orcamentos/{id} {
      allow read, write: if true; // Troque por autenticação em produção
    }
  }
}
```

---

### 3. Pegar as credenciais do seu app

1. **Configurações do projeto** (ícone de engrenagem) → **Seus apps**
2. Clique no ícone `</>` (Web)
3. Nome do app: `proposify-web` → **Registrar app**
4. Copie o objeto `firebaseConfig` que aparecer:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "proposify-xxxxx.firebaseapp.com",
  projectId: "proposify-xxxxx",
  storageBucket: "proposify-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

5. **Abra o arquivo `public/index.html`** e localize o bloco:
```javascript
const firebaseConfig = {
  apiKey: "COLE_SUA_API_KEY_AQUI",
  ...
```
6. **Substitua** pelos valores copiados do Console.

---

### 4. Instalar o Firebase CLI

```bash
# Instalar globalmente (uma vez só)
npm install -g firebase-tools

# Fazer login com sua conta Google
firebase login
```

---

### 5. Conectar o projeto

```bash
# Dentro da pasta proposify-firebase/
firebase use --add

# Selecione seu projeto na lista
# Alias: default
```

Isso atualiza o `.firebaserc` com o ID correto do seu projeto.

---

### 6. Fazer o deploy

```bash
firebase deploy --only hosting
```

Em ~30 segundos você verá:
```
✔ Deploy complete!
Hosting URL: https://proposify-xxxxx.web.app
```

Acesse a URL e está no ar! 🎉

---

## Atualizações futuras

Qualquer alteração no `index.html`:

```bash
firebase deploy --only hosting
# Deploy em ~10 segundos
```

Ou conecte ao GitHub para deploy automático:

```bash
firebase init hosting:github
# Segue o wizard interativo
```

---

## Testar localmente antes de subir

```bash
firebase serve --only hosting
# Acesse: http://localhost:5000
```

---

## Plano gratuito do Firebase (Spark)

| Recurso | Limite gratuito |
|---------|----------------|
| Hosting | 10 GB/mês transferência |
| Firestore leituras | 50.000/dia |
| Firestore escritas | 20.000/dia |
| Firestore armazenamento | 1 GB |
| Domínio `.web.app` | Grátis + SSL automático |

Para uma ferramenta interna de orçamentos esses limites são mais que suficientes.

---

## Diferença vs Render

| | Render | Firebase |
|---|---|---|
| Backend necessário | ✅ Node.js + Express | ❌ Não precisa |
| Banco de dados | PostgreSQL (SQL) | Firestore (NoSQL) |
| Deploy | `git push` | `firebase deploy` |
| Cold start (free) | ~30s | Não tem |
| Domínio grátis | `onrender.com` | `web.app` + `firebaseapp.com` |
| SSL | Automático | Automático |
