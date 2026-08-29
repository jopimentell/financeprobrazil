# Camada de Classificação Financeira (Natureza + Pessoas + Regras)

Objetivo: separar "onde o dinheiro foi" (categoria) de "o que a movimentação representa" (natureza financeira), sem quebrar nada do que já existe. Implementação incremental, dados atuais preservados.

## Análise do estado atual

- `transactions` já tem: `type` (income/expense/transfer), `category_id`, `account_id`, `transfer_account_id`, `merchant_id`, status, recorrência, parcelamento.
- Cálculos já centralizados em `src/utils/balanceEngine.ts` e `src/utils/cashFlowEngine.ts`; transferências já são neutras.
- Importação já é um wizard de 6 etapas (`ImportStatementModal.tsx`) com revisão e ações em massa (`BulkActionsBar.tsx`).
- `categorizationService.ts` já grava regras, mas a tabela `categorization_rules` **não existe** no banco atual — precisa ser criada nesta etapa.
- Estabelecimentos (`merchants`) já existem e serão reaproveitados como critério de regra.

## Banco de dados (migração incremental, nada é apagado)

1. `financial_nature` como texto validado (extensível): `own_income`, `own_expense`, `transfer_in`, `transfer_out`, `loan_received`, `loan_repaid`, `refund`, `reserve`, `internal_transfer`, `unclassified`.
2. `transactions`: novas colunas opcionais — `nature` (default `unclassified`), `person_id`, `related_transaction_id`, `parent_transaction_id`, `related_debt_id`, `nature_confirmed` (bool), `nature_source` (`manual` | `rule` | `suggestion`).
3. Nova tabela `people` (pessoas relacionadas): nome, notas. RLS por `user_id`, GRANTs para `authenticated`/`service_role`.
4. Nova tabela `categorization_rules` (a que o código já espera) + colunas de ação: `category_id`, `nature`, `person_id`, `priority`, `criteria` (descrição contém / igual / estabelecimento).
5. Backfill seguro: todas as transações existentes recebem `nature = 'unclassified'` e `nature_confirmed = false`. Transferências existentes viram `internal_transfer` confirmado. Nada é reclassificado automaticamente como receita/despesa própria.

## Motor de cálculo (fonte única da verdade)

Novo `src/utils/natureEngine.ts` com helpers usados por todas as telas:

- `isRealIncome` → só `own_income`.
- `isRealExpense` → só `own_expense`.
- `isCashMovement` → tudo (para fluxo de caixa bancário).
- `netCostOf(expense)` → despesa menos reembolsos/participações vinculadas.
- Agregadores: repasses por pessoa, empréstimos por pessoa, reservas.

`balanceEngine` e `cashFlowEngine` passam a usar esses helpers. Regra de compatibilidade: `unclassified` continua contando como hoje (income/expense) para não alterar números históricos, e a tela de pendências permite revisar.

## Telas

- **TransactionModal**: seção "Classificação financeira" recolhida por padrão (default `Despesa própria` / `Receita própria`). Campos dinâmicos por natureza: pessoa, transação relacionada, dívida relacionada, objetivo da reserva. Ao mudar categoria/natureza manualmente, oferecer criar/atualizar regra (reaproveita `CategorizationPromptModal`).
- **Dividir transação**: novo modal — transação pai + participações; minha parte fica `own_expense`, partes de terceiros ficam `transfer_out` (repasse) com pessoa vinculada, tudo rastreável pelo pai.
- **Importação**: coluna Natureza na revisão, com badge "Sugestão" vs "Confirmado", aplicação de regras por prioridade, aviso de conflito, e ações em massa de Natureza e Pessoa.
- **Transactions**: filtros de Natureza e Pessoa; ação em massa de natureza/pessoa.
- **Pendências de classificação**: aviso "X transações aguardando classificação" com lista filtrada.
- **Categorias**: reorganizada em abas — Receitas, Despesas, Classificações financeiras (referência), Pessoas (CRUD), Regras (CRUD com prioridade).
- **Dashboard**: cards passam a "Receita própria", "Despesa própria", "Saldo disponível", com linhas secundárias de repasses/empréstimos claramente não-receita.
- **Fluxo de Caixa**: mantém o movimento bancário e ganha filtro de natureza (todos / próprios / repasses / financeiros) e quebra de entradas/saídas por natureza.
- **Relatórios**: consumo real (só despesa própria), repasses por pessoa com saldo, empréstimos integrados a Dívidas, e reembolsos com custo líquido.

## Etapas de entrega

1. Migração (tabelas, colunas, RLS, GRANTs, backfill) + tipos/serviços.
2. `natureEngine` + integração em balance/cashflow.
3. TransactionModal com classificação dinâmica + pessoas/regras CRUD.
4. Dividir transação + vínculos (reembolso, empréstimo, dívida).
5. Importação: sugestão vs confirmado, regras com prioridade, massa.
6. Relatórios/Dashboard/Fluxo de Caixa + pendências.
7. Validação dos 7 cenários de teste do pedido.

## Garantias

- Nenhuma funcionalidade removida; todos os campos novos são opcionais.
- Transferências continuam neutras; reservas e repasses nunca entram em consumo.
- Nenhuma classificação confirmada pelo usuário é alterada por regra automática.
