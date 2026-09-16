# FinancePro — Roadmap

## Etapa A — Auditoria e correção da base financeira (EM ANDAMENTO)
- [x] Auditoria da lógica de saldo/resultado/patrimônio/fluxo de caixa
- [x] Diagnóstico: bug de fuso horário nas datas (dia 1º caía no mês anterior)
- [x] Diagnóstico: "Saldo" = receitas − despesas do mês, sem saldo acumulado
- [x] `src/utils/periodUtils.ts` — datas timezone-safe
- [x] `src/utils/balanceEngine.ts` — fonte única: saldo inicial + entradas − saídas = saldo final; patrimônio = ativos − obrigações
- [x] Testes automáticos dos cenários 1 a 6
- [ ] Substituir fórmulas duplicadas em todas as telas pela fonte única
- [ ] Relatórios: cards Receitas / Despesas / Resultado / Saldo final
- [ ] Fluxo de caixa acumulado contínuo entre meses
- [ ] Patrimônio: ativos − obrigações (contas + investimentos − dívidas − faturas abertas)
- [ ] Validar com os dados reais de janeiro/fevereiro
- [ ] Explicar a origem da diferença de 140,24 nas receitas de janeiro

## Etapa B — Camada de classificação financeira (migração já aplicada)
- [x] Banco: natureza, pessoa, transação relacionada, transação pai, regras
- [x] `src/utils/natureEngine.ts` — receita/despesa própria vs repasse/empréstimo/reembolso/reserva
- [ ] Serviços e contexto: pessoas, regras, campos de natureza
- [ ] Modal de transação com classificação dinâmica
- [ ] Dividir transação
- [ ] Importação: sugestão vs confirmado, regras com prioridade, ações em massa
- [ ] Filtros e pendências de classificação
- [ ] Relatórios de repasses, empréstimos e reembolsos
- [ ] Testes de regressão
