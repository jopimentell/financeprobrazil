# FinancePro — Roadmap

## Etapa A — Auditoria e correção da base financeira (CONCLUÍDA)
- [x] Auditoria da lógica de saldo/resultado/patrimônio/fluxo de caixa
- [x] Diagnóstico: bug de fuso horário nas datas (dia 1º caía no mês anterior)
- [x] Diagnóstico: "Saldo" = receitas − despesas do mês, sem saldo acumulado
- [x] `src/utils/periodUtils.ts` — datas timezone-safe
- [x] `src/utils/balanceEngine.ts` — fonte única: saldo inicial + entradas − saídas = saldo final; patrimônio = ativos − obrigações
- [x] Testes automáticos dos cenários 1 a 6
- [x] Substituir fórmulas duplicadas nas telas centrais pela fonte única (Dashboard, Relatórios, Fluxo de Caixa, Contas, Projeção, Transações)
- [x] Relatórios: cards Receitas / Despesas / Resultado / Saldo final
- [x] Fluxo de caixa acumulado contínuo entre meses (datas timezone-safe também no motor e no serviço)
- [x] Patrimônio: ativos − obrigações (contas + investimentos − dívidas − faturas abertas)
- [x] Validar com os dados reais de janeiro/fevereiro (cenário 7 nos testes)
- [x] Diferença de 140,24: não reproduzível na base atual — os valores da tela vinham do cálculo antigo (mês isolado + erro de fuso). Nenhum dado foi alterado.
- [ ] Opcional: aplicar a fonte única também em Planejamento, Investimentos, Dívidas, Cartões, Calendário e telas de administração

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
