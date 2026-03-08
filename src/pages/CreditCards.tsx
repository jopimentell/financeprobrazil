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
import { CreditCard as CreditCardIcon, Plus, Trash2, ArrowLeft, Receipt, CalendarClock, ChevronRight } from 'lucide-react';

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
  paid: 'Paga',
  future: 'Futura',
};

const statusColors: Record<string, string> = {
  open: 'bg-chart-4 text-primary-foreground',
  closed: 'bg-destructive text-destructive-foreground',
  paid: 'bg-primary text-primary-foreground',
  future: 'bg-muted text-muted-foreground',
};

export default function CreditCards() {
  const {
    creditCards, creditCardExpenses,
    addCreditCard, deleteCreditCard,
    addCreditCardExpense, deleteCreditCardExpense,
  } = useFinance();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

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
    return computeInvoices(selectedCard, cardExpenses);
  }, [selectedCard, cardExpenses]);

  const cardUsed = useMemo(() =>
    cardExpenses.reduce((s, e) => s + e.amount, 0),
    [cardExpenses]
  );

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
    setExpDesc(''); setExpAmount(''); setExpCategory('outros');
    setExpDate(new Date().toISOString().split('T')[0]); setExpInstallments('1');
    setShowExpenseModal(false);
  };

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

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
              const currentInvoice = computeInvoices(card, exps).find(i => i.status === 'open');
              const used = currentInvoice?.total || 0;
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
  const futureInvoices = invoices.filter(i => i.status === 'future');
  const pastInvoices = invoices.filter(i => i.status === 'closed' || i.status === 'paid');

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

      {/* Tabs */}
      <Tabs defaultValue="current">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current"><Receipt className="h-4 w-4 mr-1" /> Fatura Atual</TabsTrigger>
          <TabsTrigger value="future"><CalendarClock className="h-4 w-4 mr-1" /> Futuras</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-4">
          {openInvoice ? (
            <InvoiceDetail invoice={openInvoice} onDelete={deleteCreditCardExpense} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma despesa na fatura atual</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="future" className="mt-4 space-y-4">
          {futureInvoices.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma fatura futura</CardContent></Card>
          ) : futureInvoices.map(inv => (
            <InvoiceDetail key={inv.month} invoice={inv} onDelete={deleteCreditCardExpense} />
          ))}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          {pastInvoices.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma fatura passada</CardContent></Card>
          ) : pastInvoices.reverse().map(inv => (
            <InvoiceDetail key={inv.month} invoice={inv} onDelete={deleteCreditCardExpense} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Add Expense Modal */}
      <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
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
    </div>
  );
}

function InvoiceDetail({ invoice, onDelete }: { invoice: CreditCardInvoice; onDelete: (e: Omit<CreditCardExpense, 'id' | 'userId'>) => void }) {
  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const [y, m] = invoice.month.split('-');
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const label = `${monthNames[parseInt(m) - 1]} ${y}`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{label}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[invoice.status]}>{statusLabels[invoice.status]}</Badge>
            <span className="font-bold">{fmt(invoice.total)}</span>
          </div>
        </div>
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
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{fmt(exp.amount)}</span>
                {invoice.status !== 'closed' && invoice.status !== 'paid' && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(exp as any)}>
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
