#!/bin/bash

# Script para deploy no Render via API
# Uso: ./deploy-render.sh <RENDER_API_KEY> <RENDER_SERVICE_ID>

if [ $# -ne 2 ]; then
    echo "Uso: $0 <RENDER_API_KEY> <RENDER_SERVICE_ID>"
    echo ""
    echo "Como obter:"
    echo "1. RENDER_API_KEY: https://dashboard.render.com/account/api-keys"
    echo "2. RENDER_SERVICE_ID: https://dashboard.render.com/services/<svc-...>"
    exit 1
fi

RENDER_API_KEY="$1"
RENDER_SERVICE_ID="$2"

echo "🚀 Iniciando deploy no Render..."
echo "Serviço: $RENDER_SERVICE_ID"

# Fazer deploy via API (API key) ou hook de deploy (chave rnd_*)
if [[ "$RENDER_API_KEY" == rnd_* ]]; then
  echo "Usando deploy hook (deploy key)"
  # Render deploy hook URL
  response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"clearCache":false,"group":"main"}' \
    "https://api.render.com/deploy/$RENDER_SERVICE_ID?key=$RENDER_API_KEY")
else
  echo "Usando API key"
  response=$(curl -s -X POST \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"clearCache":false,"group":"main"}' \
    "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys")
fi

echo "Resposta do Render:"
echo "$response"

# Verificar se foi sucesso
if echo "$response" | grep -q '"id"'; then
    echo "✅ Deploy iniciado com sucesso!"
    echo "Aguarde alguns minutos e verifique o status no painel do Render."
else
    echo "❌ Erro no deploy. Verifique as credenciais e tente novamente."
    exit 1
fi