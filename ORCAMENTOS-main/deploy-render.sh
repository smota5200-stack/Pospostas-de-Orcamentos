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

payload='{"clearCache":false,"group":"main"}'

# Variables populated by the attempted deploy request
RENDER_HTTP=""
RENDER_RESPONSE=""

function try_hook() {
  echo "Tentando deploy via hook (https://api.render.com/deploy/...)"
  http=$(curl -s -o /tmp/render_deploy.out -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "https://api.render.com/deploy/$RENDER_SERVICE_ID?key=$RENDER_API_KEY")
  RENDER_RESPONSE=$(cat /tmp/render_deploy.out)
  RENDER_HTTP=$http
  echo "$RENDER_RESPONSE"
  echo "\nHTTP status: $http"
  # Consider any 2xx response a success
  [[ "$http" =~ ^2 ]]
}

function try_api() {
  echo "Tentando deploy via API key (Bearer)"
  http=$(curl -s -o /tmp/render_deploy.out -w "%{http_code}" -X POST \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys")
  RENDER_RESPONSE=$(cat /tmp/render_deploy.out)
  RENDER_HTTP=$http
  echo "$RENDER_RESPONSE"
  echo "\nHTTP status: $http"
  # Consider any 2xx response a success
  [[ "$http" =~ ^2 ]]
}

if try_hook; then
  echo "✅ Deploy iniciado com sucesso via hook (ou chave compatível)"
  exit 0
fi

if try_api; then
  echo "✅ Deploy iniciado com sucesso via API key"
  exit 0
fi

echo "Resposta do Render:"
echo "$RENDER_RESPONSE"
echo "HTTP status: $RENDER_HTTP"

# Verificar se foi sucesso
if echo "$RENDER_RESPONSE" | grep -q '"id"'; then
    echo "✅ Deploy iniciado com sucesso!"
    echo "Aguarde alguns minutos e verifique o status no painel do Render."
else
    echo "❌ Erro no deploy. Verifique as credenciais e tente novamente."
    exit 1
fi