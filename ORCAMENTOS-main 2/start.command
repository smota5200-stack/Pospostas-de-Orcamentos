#!/bin/bash
cd "$(dirname "$0")"
echo "Iniciando ORCAMENTOS..."
npm install
open http://localhost:5000
npm run dev
