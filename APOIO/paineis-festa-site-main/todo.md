# Painéis Express - TODO

## Fase 1: Upgrade e Configuração
- [x] Fazer upgrade para web-db-user com Stripe
- [x] Criar schemas de banco de dados (produtos, carrinho, pedidos, customizados)
- [x] Executar migrações de banco de dados
- [x] Instalar dependência Stripe

## Fase 2: Carrinho de Compras e Checkout
- [x] Criar schema de carrinho no banco de dados
- [x] Implementar API de carrinho (add, remove, update quantity)
- [x] Criar página de carrinho
- [x] Integrar Stripe para pagamento
- [x] Implementar checkout flow
- [x] Adicionar validação de pedidos

## Fase 3: Catálogo Expandido
- [x] Criar schema de produtos no banco de dados
- [x] Expandir catálogo com 6 temas (infantil, corporativo, casamentos, etc)
- [x] Implementar sistema de filtros (categoria, preço, tamanho)
- [x] Criar página de busca e filtros
- [x] Implementar busca por texto
- [x] Seed de produtos no banco de dados

## Fase 4: Sistema de Pedidos Personalizados
- [x] Criar schema de pedidos personalizados
- [x] Implementar formulário de customização
- [x] Criar página de pedidos personalizados
- [x] Adicionar sistema de aprovação de design
- [x] Implementar upload de imagens com S3
- [x] Criar componente de upload com validação

## Fase 5: Testes e Refinamento
- [x] Testar fluxo completo de compra
- [x] Testar filtros e busca
- [x] Testar pedidos personalizados
- [x] Testes unitários (16 testes passando)
- [x] Verificar responsividade mobile

## Fase 6: Tamanhos de Cilindros
- [x] Adicionar schema de tamanhos de cilindros (P, M, G)
- [x] Seed de tamanhos com medidas reais (30cm, 45cm, 60cm)
- [x] Integrar tamanhos no catálogo

## Fase 7: Webhook Stripe
- [x] Implementar webhook handler para Stripe
- [x] Processar payment_intent.succeeded
- [x] Processar payment_intent.payment_failed
- [x] Processar charge.refunded
- [x] Atualizar status de pedidos automaticamente

## Fase 8: Painel de Admin
- [x] Criar router de admin com middleware de verificação
- [x] Implementar listagem de todos os pedidos personalizados
- [x] Adicionar filtros por status (draft, submitted, approved, rejected, completed)
- [x] Implementar busca por título/descrição
- [x] Criar página AdminDashboard com interface completa
- [x] Adicionar estatísticas de pedidos
- [x] Implementar edição de preço estimado e notas do admin

## Fase 9: Notificações por Email
- [x] Instalar Resend para envio de emails
- [x] Criar serviço de email com templates
- [x] Implementar email de confirmação de pedido
- [x] Implementar email de confirmação de pagamento
- [x] Implementar email de atualização de pedido personalizado
- [x] Implementar notificações para admin
- [x] Integrar emails com webhook Stripe

## Recursos Implementados

### Backend (tRPC APIs)
- `shop.products.list` - Listar todos os produtos
- `shop.products.getById` - Obter produto por ID
- `shop.cart.getItems` - Obter itens do carrinho
- `shop.cart.addItem` - Adicionar item ao carrinho
- `shop.cart.removeItem` - Remover item do carrinho
- `shop.cart.clear` - Limpar carrinho
- `shop.orders.list` - Listar pedidos do usuário
- `shop.orders.getById` - Obter pedido por ID
- `shop.orders.createCheckoutSession` - Criar sessão de checkout com Stripe
- `shop.customOrders.list` - Listar pedidos personalizados
- `shop.customOrders.create` - Criar pedido personalizado
- `shop.customOrders.updateStatus` - Atualizar status do pedido
- `upload.customOrderImage` - Upload de imagem para S3
- `upload.multipleImages` - Upload de múltiplas imagens para S3

### Frontend (Páginas)
- `/` - Home com hero section e depoimentos
- `/catalogo` - Catálogo com filtros (categoria, preço, tamanho)
- `/carrinho` - Carrinho de compras com checkout
- `/pedidos-personalizados` - Página de pedidos personalizados com upload

### Componentes
- `ImageUpload` - Componente de upload com drag-and-drop
- `DashboardLayout` - Layout para admin (pré-existente)
- `AIChatBox` - Chat com IA (pré-existente)

### Banco de Dados
- `products` - Catálogo de produtos (6 produtos seeded)
- `cart_items` - Itens do carrinho
- `orders` - Pedidos dos clientes
- `order_items` - Itens de cada pedido
- `custom_orders` - Pedidos personalizados
- `cylinder_sizes` - Tamanhos de cilindros P/M/G com medidas (30cm, 45cm, 60cm)

### APIs de Admin (tRPC)
- `admin.customOrders.listAll` - Listar todos os pedidos personalizados
- `admin.customOrders.getById` - Obter pedido por ID
- `admin.customOrders.updateStatus` - Atualizar status e adicionar notas
- `admin.customOrders.getStats` - Obter estatísticas de pedidos
- `admin.customOrders.filterByStatus` - Filtrar por status
- `admin.customOrders.search` - Buscar por título/descrição
- `admin.dashboard.getSummary` - Obter resumo do dashboard

### Webhooks
- `/api/stripe/webhook` - Webhook do Stripe para processar pagamentos

### Serviços
- `server/services/email.ts` - Serviço de email com Resend
- `server/webhooks/stripe.ts` - Handler de webhook do Stripe

### Testes
- 9 testes para shop router
- 6 testes para upload router
- 1 teste para auth logout
- Total: 16 testes (todos passando ✓)

## Configurações Necessárias

### Variáveis de Ambiente
- `STRIPE_SECRET_KEY` - Chave secreta do Stripe (já configurada)
- `STRIPE_WEBHOOK_SECRET` - Webhook secret do Stripe (já configurada)
- `VITE_STRIPE_PUBLISHABLE_KEY` - Chave pública do Stripe (já configurada)
- `RESEND_API_KEY` - Chave da API Resend (necessária para ativar emails)

### Próximos Passos
1. Reclame seu sandbox Stripe em https://dashboard.stripe.com/claim_sandbox
2. Configure a chave RESEND_API_KEY para ativar notificações por email
3. Teste o fluxo completo com cartão 4242 4242 4242 4242
4. Configure o webhook do Stripe no dashboard


## Fase 10: Configuração Stripe Sandbox
- [ ] Reclamar sandbox Stripe em https://dashboard.stripe.com/claim_sandbox
- [ ] Configurar webhook no dashboard Stripe
- [ ] Testar pagamento com cartão 4242 4242 4242 4242

## Fase 11: Integração Resend
- [ ] Obter chave API Resend
- [ ] Configurar variável RESEND_API_KEY
- [ ] Testar envio de emails

## Fase 12: Exibir Medidas de Cilindros
- [x] Atualizar página Catalog para exibir medidas de cilindros
- [x] Adicionar informações de altura, diâmetro e peso
- [x] Criar card informativo com especificações técnicas
- [x] Adicionar ícones/badges para tamanhos P/M/G
