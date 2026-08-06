import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LedgerDay, CashFlowTotals } from '@/utils/cashFlowEngine';

export interface ExportMeta {
  periodLabel: string;
  filtersLabel: string;
  getCategoryName: (id: string) => string;
  getAccountName: (id: string) => string;
}

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const dateBR = (iso: string) => iso.split('-').reverse().join('/');

const HEADERS = ['Data', 'Tipo', 'Categoria', 'Conta', 'Descrição', 'Entrada', 'Saída', 'Saldo'];

interface FlatRow {
  cells: (string | number)[];
  kind: 'day' | 'tx' | 'daytotal' | 'blank' | 'total';
}

function flatten(days: LedgerDay[], totals: CashFlowTotals, meta: ExportMeta): FlatRow[] {
  const out: FlatRow[] = [];
  out.push({ kind: 'total', cells: ['Saldo inicial', '', '', '', '', '', '', totals.openingBalance] });
  for (const day of days) {
    out.push({ kind: 'day', cells: [dateBR(day.date), '', '', '', '', '', '', ''] });
    for (const r of day.rows) {
      out.push({
        kind: 'tx',
        cells: [
          dateBR(r.tx.date),
          r.tx.type === 'income' ? 'Receita' : 'Despesa',
          meta.getCategoryName(r.tx.categoryId),
          meta.getAccountName(r.tx.accountId),
          r.tx.description,
          r.amountIn || '',
          r.amountOut || '',
          r.runningBalance,
        ],
      });
    }
    out.push({
      kind: 'daytotal',
      cells: ['Resumo do dia', '', '', '', '', day.income, day.expense, day.endingBalance],
    });
  }
  out.push({ kind: 'blank', cells: ['', '', '', '', '', '', '', ''] });
  out.push({ kind: 'total', cells: ['Total de receitas', '', '', '', '', totals.income, '', ''] });
  out.push({ kind: 'total', cells: ['Total de despesas', '', '', '', '', '', totals.expense, ''] });
  out.push({ kind: 'total', cells: ['Lucro líquido', '', '', '', '', '', '', totals.profit] });
  out.push({ kind: 'total', cells: ['Saldo final', '', '', '', '', '', '', totals.finalBalance] });
  return out;
}

export function exportCashFlowCSV(days: LedgerDay[], totals: CashFlowTotals, meta: ExportMeta) {
  const rows = flatten(days, totals, meta);
  const esc = (v: string | number) => {
    const s = String(v ?? '');
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    [`Fluxo de Caixa - ${meta.periodLabel}`],
    [meta.filtersLabel],
    [],
    HEADERS,
    ...rows.map((r) => r.cells),
  ];
  const csv = lines.map((l) => l.map(esc).join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  download(blob, `fluxo-de-caixa-${meta.periodLabel}.csv`);
}

export function exportCashFlowXLSX(days: LedgerDay[], totals: CashFlowTotals, meta: ExportMeta) {
  const rows = flatten(days, totals, meta);
  const aoa: (string | number)[][] = [
    [`Fluxo de Caixa - ${meta.periodLabel}`],
    [meta.filtersLabel],
    [],
    HEADERS,
    ...rows.map((r) => r.cells),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 34 }, { wch: 14 }, { wch: 14 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Fluxo de Caixa');
  XLSX.writeFile(wb, `fluxo-de-caixa-${meta.periodLabel}.xlsx`);
}

export function exportCashFlowPDF(days: LedgerDay[], totals: CashFlowTotals, meta: ExportMeta) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(16);
  doc.text('Fluxo de Caixa', 40, 40);
  doc.setFontSize(10);
  doc.text(meta.periodLabel, 40, 58);
  doc.text(meta.filtersLabel, 40, 72);

  const rows = flatten(days, totals, meta);
  autoTable(doc, {
    startY: 88,
    head: [HEADERS],
    body: rows.map((r) =>
      r.cells.map((c, i) => (typeof c === 'number' ? brl(c) : String(c ?? ''))),
    ),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    columnStyles: {
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      const kind = rows[data.row.index]?.kind;
      if (kind === 'day') {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.fontStyle = 'bold';
      } else if (kind === 'daytotal') {
        data.cell.styles.textColor = [100, 116, 139];
        data.cell.styles.fontSize = 7;
      } else if (kind === 'total') {
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });
  doc.save(`fluxo-de-caixa-${meta.periodLabel}.pdf`);
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
