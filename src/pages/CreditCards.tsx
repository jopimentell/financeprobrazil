import { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { CreditCard, CreditCardExpense, CreditCardInvoice } from '@/types/finance';
import { computeInvoices } from '@/services/financeService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CreditCard as CreditCardIcon, Plus, Trash2, ArrowLeft, Receipt,
  CalendarClock, ChevronRight, Pencil, AlertTriangle, CheckCircle2, Clock, Ban
} from 'lucide-react';

const EXPENSE_CATEGORIES = [
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'lazer', label: 'Lazer' },
  { value: 'assinatura', label: 'Assinatura' },
  { value: 'compras', label: 'Compras' },
  { value: 'saude', label: 'Saúde' },
  { value: 'outros', label: 'Outros' },
];

const statusLabels: Record<string, string> = {
  open: 'Aberta',
  closed: 'Fechada',
  overdue: 'Vencida',
  paid: 'Paga',
  future: 'Futura',
};

const statusColors: Record<string, string> = {
  open: 'bg-chart-4 text-primary-foreground',
  closed: 'bg-accent text-accent-foreground',
  overdue: 'bg-destructive text-destructive-foreground',
  paid: 'bg-primary text-primary-foreground',
  future: 'bg-muted text-muted-foreground',
};

const statusIcons: Record<string, typeof Clock> = {
  open: Clock,
  closed: Ban,
  overdue: AlertTriangle,
  paid: CheckCircle2,
  future: CalendarClock,
};

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function getDueDateAlert(dueDate: string, status: string): { text: string; variant: 'warning' | 'danger' | 'info' } | null {
  if (status === 'paid' || status === 'future') return null;
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (status === 'overdue') return { text: `Vencida há ${Math.abs(diffDays)} dias`, variant: 'danger' };
  if (diffDays <= 1 && diffDays >= 0) return { text: 'Vence amanhã!', variant: 'warning' };
  if (diffDays <= 5 && diffDays > 1) return { text: `Vence em ${diffDays} dias`, variant: 'warning' };
  return null;
}

export default function CreditCards() {
  const {
    creditCards, creditCardExpenses, paidInvoices,
    addCreditCard, updateCreditCard, deleteCreditCard,
    addCreditCardExpense, updateCreditCardExpense, deleteCreditCardExpense,
    payInvoice,
  } = useFinance();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<CreditCardExpense | null>(null);
  const [showEditCardModal, setShowEditCardModal] = useState(false);

  // Card form
  const [cardName, setCardName] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardClosingDay, setCardClosingDay] = useState('10');
  const [cardDueDay, setCardDueDay] = useState('15');

  // Expense form
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('outros');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expInstallments, setExpInstallments] = useState('1');

  const selectedCard = creditCards.find(c => c.id === selectedCardId);

  const cardExpenses = useMemo(() =>
    creditCardExpenses.filter(e => e.cardId === selectedCardId),
    [creditCardExpenses, selectedCardId]
  );

  const invoices = useMemo(() => {
    if (!selectedCard) return [];
    return computeInvoices(selectedCard, cardExpenses, paidInvoices);
  }, [selectedCard, cardExpenses, paidInvoices]);

  const handleAddCard = () => {
    if (!cardName || !cardLimit) return;
    addCreditCard({
      name: cardName,
      limit: parseFloat(cardLimit),
      closingDay: parseInt(cardClosingDay),
      dueDay: parseInt(cardDueDay),
    });
    setCardName(''); setCardLimit(''); setCardClosingDay('10'); setCardDueDay('15');
    setShowCardModal(false);
  };

  const handleAddExpense = () => {
    if (!expDesc || !expAmount || !selectedCardId) return;
    addCreditCardExpense({
      cardId: selectedCardId,
      description: expDesc,
      amount: parseFloat(expAmount),
      category: expCategory,
      purchaseDate: expDate,
      installments: parseInt(expInstallments) || 1,
    });
    resetExpenseForm();
    setShowExpenseModal(false);
  };

  const handleEditExpense = () => {
    if (!editingExpense || !expDesc || !expAmount) return;
    updateCreditCardExpense(editingExpense.id, {
      description: expDesc,
      amount: parseFloat(expAmount),
      category: expCategory,
      purchaseDate: expDate,
    });
    resetExpenseForm();
    setEditingExpense(null);
  };

  const openEditExpense = (exp: CreditCardExpense) => {
    setExpDesc(exp.description);
    setExpAmount(String(exp.amount));
    setExpCategory(exp.category);
    setExpDate(exp.purchaseDate);
    setExpInstallments('1');
    setEditingExpense(exp);
  };

  const openEditCard = () => {
    if (!selectedCard) return;
    setCardName(selectedCard.name);
    setCardLimit(String(selectedCard.limit));
    setCardClosingDay(String(selectedCard.closingDay));
    setCardDueDay(String(selectedCard.dueDay));
    setShowEditCardModal(true);
  };

  const handleUpdateCard = () => {
    if (!selectedCard || !cardName || !cardLimit) return;
    updateCreditCard({
      ...selectedCard,
      name: cardName,
      limit: parseFloat(cardLimit),
      closingDay: parseInt(cardClosingDay),
      dueDay: parseInt(cardDueDay),
    });
    setShowEditCardModal(false);
    resetCardForm();
  };

  const resetExpenseForm = () => {
    setExpDesc(''); setExpAmount(''); setExpCategory('outros');
    setExpDate(new Date().toISOString().split('T')[0]); setExpInstallments('1');
  };

  const resetCardForm = () => {
    setCardName(''); setCardLimit(''); setCardClosingDay('10'); setCardDueDay('15');
  };

  const handlePayInvoice = (invoice: CreditCardInvoice) => {
    if (!selectedCardId) return;
    payInvoice(selectedCardId, invoice.month, invoice.total);
  };

  // ── Card List View ─────────────────────
  if (!selectedCard) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Cartões de Crédito</h1>
          <Button onClick={() => setShowCardModal(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Novo Cartão
          </Button>
        </div>

        {creditCards.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <CreditCardIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum cartão cadastrado</h3>
              <p className="text-sm text-muted-foreground mb-4">Adicione seu primeiro cartão de crédito</p>
              <Button onClick={() => setShowCardModal(true)}><Plus className="h-4 w-4 mr-1" /> Novo Cartão</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditCards.map(card => {
              const exps = creditCardExpenses.filter(e => e.cardId === card.id);
              const cardInvoices = computeInvoices(card, exps, paidInvoices);
              const openInv = cardInvoices.find(i => i.status === 'open');
              const overdueInv = cardInvoices.filter(i => i.status === 'overdue');
              const used = openInv?.total || 0;
              const available = card.limit - used;
              const usedPct = Math.min((used / card.limit) * 100, 100);

              return (
                <Card
                  key={card.id}
                  className="cursor-pointer hover:shadow-md transition-all group"
                  onClick={() => setSelectedCardId(card.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CreditCardIcon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-base">{card.name}</CardTitle>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {overdueInv.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-destructive font-medium">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {overdueInv.length} fatura(s) vencida(s)
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Limite</span>
                      <span className="font-medium">{fmt(card.limit)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fatura atual</span>
                      <span className="font-semibold text-destructive">{fmt(used)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Disponível</span>
                      <span className="font-medium finance-income">{fmt(available)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${usedPct}%`, backgroundColor: usedPct > 80 ? 'hsl(var(--destructive))' : undefined }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Fecha dia {card.closingDay}</span>
                      <span>Vence dia {card.dueDay}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add Card Modal */}
        <Dialog open={showCardModal} onOpenChange={setShowCardModal}>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Cartão de Crédito</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Ex: Nubank" /></div>
              <div><Label>Limite</Label><Input type="number" value={cardLimit} onChange={e => setCardLimit(e.target.value)} placeholder="5000" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Dia Fechamento</Label><Input type="number" min="1" max="31" value={cardClosingDay} onChange={e => setCardClosingDay(e.target.value)} /></div>
                <div><Label>Dia Vencimento</Label><Input type="number" min="1" max="31" value={cardDueDay} onChange={e => setCardDueDay(e.target.value)} /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={handleAddCard}>Criar Cartão</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── Card Detail View ───────────────────
  const openInvoice = invoices.find(i => i.status === 'open');
  const closedInvoices = invoices.filter(i => i.status === 'closed' || i.status === 'overdue');
  const futureInvoices = invoices.filter(i => i.status === 'future');
  const paidInvoicesList = invoices.filter(i => i.status === 'paid');

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCardId(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">{selectedCard.name}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowExpenseModal(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Compra
          </Button>
          <Button variant="outline" size="sm" onClick={openEditCard}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => { deleteCreditCard(selectedCard.id); setSelectedCardId(null); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">Limite</p>
          <p className="text-lg font-bold">{fmt(selectedCard.limit)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">Fatura Atual</p>
          <p className="text-lg font-bold text-destructive">{fmt(openInvoice?.total || 0)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">Disponível</p>
          <p className="text-lg font-bold finance-income">{fmt(selectedCard.limit - (openInvoice?.total || 0))}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">Despesas Futuras</p>
          <p className="text-lg font-bold text-muted-foreground">{fmt(futureInvoices.reduce((s, i) => s + i.total, 0))}</p>
        </CardContent></Card>
      </div>

      {/* Invoice Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Linha do Tempo das Faturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {invoices.map(inv => {
              const [y, m] = inv.month.split('-');
              const Icon = statusIcons[inv.status] || Clock;
              const alert = getDueDateAlert(inv.dueDate, inv.status);
              return (
                <div key={inv.month} className="flex-shrink-0 w-32 border border-border rounded-lg p-2.5 text-center space-y-1">
                  <p className="text-xs font-medium">{monthNames[parseInt(m) - 1]} {y}</p>
                  <div className="flex justify-center">
                    <Badge className={`${statusColors[inv.status]} text-[10px] gap-1`}>
                      <Icon className="h-3 w-3" />
                      {statusLabels[inv.status]}
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold">{fmt(inv.total)}</p>
                  {alert && (
                    <p className={`text-[10px] font-medium ${alert.variant === 'danger' ? 'text-destructive' : 'text-chart-4'}`}>
                      {alert.text}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="current">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current"><Receipt className="h-4 w-4 mr-1" /> Atual</TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes
            {closedInvoices.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 text-[10px] px-1">{closedInvoices.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="future"><CalendarClock className="h-4 w-4 mr-1" /> Futuras</TabsTrigger>
          <TabsTrigger value="history"><CheckCircle2 className="h-4 w-4 mr-1" /> Pagas</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-4">
          {openInvoice ? (
            <InvoiceDetail
              invoice={openInvoice}
              onDelete={deleteCreditCardExpense}
              onEdit={openEditExpense}
              onPay={handlePayInvoice}
            />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma despesa na fatura atual</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4 space-y-4">
          {closedInvoices.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma fatura pendente</CardContent></Card>
          ) : closedInvoices.reverse().map(inv => (
            <InvoiceDetail
              key={inv.month}
              invoice={inv}
              onDelete={deleteCreditCardExpense}
              onEdit={openEditExpense}
              onPay={handlePayInvoice}
            />
          ))}
        </TabsContent>

        <TabsContent value="future" className="mt-4 space-y-4">
          {futureInvoices.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma fatura futura</CardContent></Card>
          ) : futureInvoices.map(inv => (
            <InvoiceDetail key={inv.month} invoice={inv} onDelete={deleteCreditCardExpense} onEdit={openEditExpense} />
          ))}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          {paidInvoicesList.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma fatura paga</CardContent></Card>
          ) : paidInvoicesList.reverse().map(inv => (
            <InvoiceDetail key={inv.month} invoice={inv} onDelete={deleteCreditCardExpense} onEdit={openEditExpense} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Add Expense Modal */}
      <Dialog open={showExpenseModal} onOpenChange={v => { if (!v) resetExpenseForm(); setShowExpenseModal(v); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Compra no Cartão</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Descrição</Label><Input value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="Ex: Supermercado" /></div>
            <div><Label>Valor Total</Label><Input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="250.00" /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={expCategory} onValueChange={setExpCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Data da Compra</Label><Input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} /></div>
            <div><Label>Parcelas</Label><Input type="number" min="1" max="48" value={expInstallments} onChange={e => setExpInstallments(e.target.value)} placeholder="1" /></div>
          </div>
          <DialogFooter><Button onClick={handleAddExpense}>Adicionar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Modal */}
      <Dialog open={!!editingExpense} onOpenChange={v => { if (!v) { setEditingExpense(null); resetExpenseForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Compra</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Descrição</Label><Input value={expDesc} onChange={e => setExpDesc(e.target.value)} /></div>
            <div><Label>Valor</Label><Input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={expCategory} onValueChange={setExpCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Data da Compra</Label><Input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={handleEditExpense}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Card Modal */}
      <Dialog open={showEditCardModal} onOpenChange={v => { if (!v) resetCardForm(); setShowEditCardModal(v); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Cartão</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={cardName} onChange={e => setCardName(e.target.value)} /></div>
            <div><Label>Limite</Label><Input type="number" value={cardLimit} onChange={e => setCardLimit(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Dia Fechamento</Label><Input type="number" min="1" max="31" value={cardClosingDay} onChange={e => setCardClosingDay(e.target.value)} /></div>
              <div><Label>Dia Vencimento</Label><Input type="number" min="1" max="31" value={cardDueDay} onChange={e => setCardDueDay(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleUpdateCard}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvoiceDetail({
  invoice,
  onDelete,
  onEdit,
  onPay,
}: {
  invoice: CreditCardInvoice;
  onDelete: (id: string) => void;
  onEdit?: (exp: CreditCardExpense) => void;
  onPay?: (invoice: CreditCardInvoice) => void;
}) {
  const [y, m] = invoice.month.split('-');
  const label = `${monthNames[parseInt(m) - 1]} ${y}`;
  const alert = getDueDateAlert(invoice.dueDate, invoice.status);
  const canEdit = invoice.status === 'open' || invoice.status === 'future';
  const canPay = invoice.status === 'closed' || invoice.status === 'overdue' || invoice.status === 'open';

  return (
    <Card className={invoice.status === 'overdue' ? 'border-destructive/50' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{label}</CardTitle>
            {alert && (
              <span className={`text-xs font-medium ${alert.variant === 'danger' ? 'text-destructive' : 'text-chart-4'}`}>
                {alert.text}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[invoice.status]}>{statusLabels[invoice.status]}</Badge>
            <span className="font-bold">{fmt(invoice.total)}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Vencimento: {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {invoice.expenses.map(exp => (
            <div key={exp.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <span className="text-sm font-medium">{exp.description}</span>
                <div className="flex gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{new Date(exp.purchaseDate).toLocaleDateString('pt-BR')}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {EXPENSE_CATEGORIES.find(c => c.value === exp.category)?.label || exp.category}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold">{fmt(exp.amount)}</span>
                {canEdit && onEdit && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(exp)}>
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </Button>
                )}
                {canEdit && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(exp.id)}>
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        {canPay && onPay && invoice.total > 0 && (
          <div className="mt-4 pt-3 border-t border-border">
            <Button
              onClick={() => onPay(invoice)}
              className="w-full"
              variant={invoice.status === 'overdue' ? 'destructive' : 'default'}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Marcar como Paga — {fmt(invoice.total)}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}