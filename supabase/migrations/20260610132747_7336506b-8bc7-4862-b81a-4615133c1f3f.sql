
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['accounts','categories','credit_cards','transactions','debts','investments','forecast','credit_card_expenses','paid_invoices','system_logs','plans','plan_limits','plan_features','plan_settings','subscriptions']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role;', t);
  END LOOP;
END $$;
