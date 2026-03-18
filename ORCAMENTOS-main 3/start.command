#!/bin/bash

cd "$(dirname "$0")"

echo "=============================="
echo "Iniciando ORCAMENTOS"
echo "=============================="

echo ""
echo "Instalando dependencias..."
npm install

echo ""
echo "Abrindo navegador..."
open http://localhost:5000

echo ""
echo "Rodando servidor..."
npm run dev
