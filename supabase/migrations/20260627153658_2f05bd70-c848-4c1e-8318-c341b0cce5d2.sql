ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS transfer_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_transfer_account_id
  ON public.transactions(transfer_account_id);