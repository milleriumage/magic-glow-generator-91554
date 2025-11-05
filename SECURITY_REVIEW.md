# 🔒 Revisão de Segurança e Escalabilidade - FunFans

## ✅ Segurança Implementada

### 1. **Autenticação Supabase**
- ✅ JWT tokens gerenciados pelo Supabase
- ✅ Refresh automático de tokens
- ✅ Session persistence em localStorage
- ✅ Redirect automático para login quando não autenticado

### 2. **Row Level Security (RLS)**
Todas as tabelas possuem RLS habilitado:

#### Tabela `profiles`
- ✅ Leitura pública (perfis)
- ✅ Atualização apenas do próprio perfil
- ⚠️ Sem INSERT público (criado via trigger)

#### Tabela `content_items`
- ✅ Criadores gerenciam apenas seu próprio conteúdo
- ✅ Conteúdo não oculto visível para autenticados
- ✅ Prevenção de modificação por terceiros

#### Tabela `transactions`
- ✅ Usuários veem apenas suas próprias transações
- ✅ Sem INSERT/UPDATE/DELETE direto (apenas via RPC)

#### Tabela `unlocked_content`
- ✅ Usuários veem apenas seu próprio conteúdo desbloqueado
- ✅ Desbloqueio apenas via função `purchase_content()`

### 3. **Edge Functions (Backend Seguro)**

#### `create-pix-payment`
- ✅ Valida dados de entrada
- ✅ Usa secret `MERCADOPAGO_ACCESS_TOKEN`
- ✅ Retorna apenas dados necessários (QR Code)
- ⚠️ **ATENÇÃO**: Atualmente retornando erro 403 - verificar permissões MercadoPago

#### `mercadopago-webhook`
- ✅ Valida webhooks do MercadoPago
- ✅ Usa SUPABASE_SERVICE_ROLE_KEY (server-side only)
- ✅ Registra transações e pagamentos
- ✅ Atualiza créditos apenas após confirmação

#### `stripe-webhook`
- ✅ Valida assinatura do webhook
- ✅ Usa STRIPE_WEBHOOK_SECRET
- ✅ Processa pagamentos de forma atômica
- ✅ Registra todas as operações

### 4. **Função RPC Segura**

```sql
CREATE FUNCTION purchase_content(item_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
```

- ✅ `SECURITY DEFINER` - executa com privilégios do owner
- ✅ Valida saldo antes de deduzir
- ✅ Transação atômica (tudo ou nada)
- ✅ Aplica comissão de 50% para plataforma
- ✅ Registra histórico completo

---

## 📊 Escalabilidade

### ✅ Pontos Fortes

1. **Banco de Dados Supabase (PostgreSQL)**
   - Suporta milhões de registros
   - Índices automáticos em chaves primárias
   - Conexão pooling integrado

2. **Edge Functions (Deno Deploy)**
   - Serverless - escala automaticamente
   - Sem gerenciamento de servidor
   - Deploy global

3. **Storage Supabase**
   - CDN integrado para mídia
   - Buckets separados (público/privado)
   - RLS aplicado em storage

### ⚠️ Pontos de Atenção

1. **Créditos em Memória (Mock)**
   - Atualmente usando Context API mock
   - ⚠️ **PRECISA MIGRAR** para usar dados reais do Supabase
   - Implementar hooks que buscam de `profiles.credits_balance`

2. **Falta de Índices Customizados**
   - Adicionar índice em `content_items.creator_id`
   - Adicionar índice em `transactions.user_id`
   - Adicionar índice em `unlocked_content (user_id, content_item_id)`

3. **Paginação**
   - Implementar paginação em listas grandes
   - Usar `.range(start, end)` nas queries

---

## 🔐 URLs de Redirecionamento

### ❌ NÃO USAR: `http://localhost:3000`

### ✅ USAR:

1. **Para Desenvolvimento (Preview Lovable)**:
   ```
   https://seu-preview-id.lovable.app
   ```

2. **Para Produção (quando publicar)**:
   ```
   https://seu-dominio.com
   ```

### Configurar no Supabase:
1. Ir em: https://supabase.com/dashboard/project/cpggicxvmgyljvoxlpnu/auth/url-configuration
2. **Site URL**: `https://seu-preview-id.lovable.app`
3. **Redirect URLs**: Adicionar:
   - `https://seu-preview-id.lovable.app/**`
   - `https://seu-dominio.com/**` (quando tiver)

---

## 🚨 Problemas Críticos Encontrados

### 1. **MercadoPago - Erro 403 (URGENTE)**
```
"status":403,
"message":"At least one policy returned UNAUTHORIZED.",
"code":"PA_UNAUTHORIZED_RESULT_FROM_POLICIES",
"blocked_by":"PolicyAgent"
```

**Solução:**
- Verificar se o token `MERCADOPAGO_ACCESS_TOKEN` está correto
- Pode ser token de teste em produção ou vice-versa
- Verificar permissões da conta MercadoPago
- Confirmar se a conta está ativa para criar pagamentos

### 2. **IDs de Produtos Stripe**

Conforme `supabase_schema.md`:

#### Pacotes de Créditos:
```
100 créditos   - $1    - prod_SyYehlUkfzq9Qn
200 créditos   - $2    - prod_SyYasByos1peGR
500 créditos   - $5    - prod_SyYeStqRDuWGFF
1000 créditos  - $10   - prod_SyYfzJ1fjz9zb9
2500 créditos  - $25   - prod_SyYmVrUetdiIBY
5000 créditos  - $50   - prod_SyYg54VfiOr7LQ
10000 créditos - $100  - prod_SyYhva8A2beAw6
```

#### Planos de Assinatura:
```
Free Plan  - $0   - prod_SyYChoQJbIb1ye
Basic Plan - $9   - prod_SyYK31lYwaraZW
Pro Plan   - $15  - prod_SyYMs3lMIhORSP
VIP Plan   - $25  - (ID não documentado)
```

**⚠️ IMPORTANTE**: Verificar se esses IDs correspondem aos criados no Stripe Dashboard

---

## ✅ Checklist de Deploy

### Antes de Publicar:

- [ ] Atualizar `STRIPE_WEBHOOK_SECRET` com o correto
- [ ] Atualizar `MERCADOPAGO_ACCESS_TOKEN` (resolver erro 403)
- [ ] Configurar URLs de redirect no Supabase Auth
- [ ] Adicionar `build:dev` no package.json: `"vite build --mode development"`
- [ ] Migrar Context API mock para dados reais do Supabase
- [ ] Testar fluxo completo de pagamento PIX
- [ ] Testar fluxo completo de pagamento Stripe
- [ ] Verificar IDs dos produtos no Stripe Dashboard
- [ ] Configurar webhooks no Stripe com URL: 
  `https://cpggicxvmgyljvoxlpnu.supabase.co/functions/v1/stripe-webhook`
- [ ] Configurar webhooks no MercadoPago com URL:
  `https://cpggicxvmgyljvoxlpnu.supabase.co/functions/v1/mercadopago-webhook`

---

## 📝 Melhorias Recomendadas

1. **Rate Limiting**
   - Implementar limite de requisições por usuário
   - Prevenir abuse de criação de QR Codes

2. **Logging Melhorado**
   - Adicionar mais logs nas edge functions
   - Implementar monitoramento de erros (Sentry)

3. **Testes**
   - Testes unitários para funções críticas
   - Testes de integração para fluxo de pagamento

4. **Backup**
   - Configurar backups automáticos no Supabase
   - Testar processo de restore

---

## 🎯 Conclusão

O sistema está **bem arquitetado** com:
- ✅ Segurança via RLS
- ✅ Autenticação robusta
- ✅ Edge functions serverless
- ✅ Transações atômicas

**Pendências críticas:**
1. Resolver erro 403 do MercadoPago
2. Migrar de mock para dados reais
3. Configurar URLs de redirect
4. Verificar IDs de produtos Stripe
