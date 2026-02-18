-- Migration 005: Production Hardening
-- PDF caching, guest cleanup, payment reconciliation, additional indexes

-- =============================================================================
-- 1. Index for guest cleanup queries
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_invoice_guest_cleanup
  ON "Invoice"("guestSessionId", "isPaid", "createdAt")
  WHERE "guestSessionId" IS NOT NULL AND "isPaid" = false;

-- =============================================================================
-- 2. Partial index for payment reconciliation
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_payment_processing_stale
  ON "Payment"("createdAt")
  WHERE status = 'PROCESSING' AND "checkoutRequestId" IS NOT NULL;

-- =============================================================================
-- 3. Reconciliation helper function
-- =============================================================================
CREATE OR REPLACE FUNCTION get_stale_processing_payments()
RETURNS TABLE(id TEXT, "checkoutRequestId" TEXT, "invoiceId" TEXT, amount NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT p.id, p."checkoutRequestId", p."invoiceId", p.amount
  FROM "Payment" p
  WHERE p.status = 'PROCESSING'
    AND p."checkoutRequestId" IS NOT NULL
    AND p."createdAt" < NOW() - INTERVAL '5 minutes'
    AND p."createdAt" > NOW() - INTERVAL '30 minutes'
  LIMIT 50;
END;
$$;

-- =============================================================================
-- 4. Guest cleanup function (run via pg_cron weekly)
-- =============================================================================
CREATE OR REPLACE FUNCTION cleanup_stale_guest_invoices()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INT;
BEGIN
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM "Invoice"
  WHERE "guestSessionId" IS NOT NULL
    AND "userId" IS NULL
    AND "isPaid" = false
    AND "createdAt" < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- =============================================================================
-- 5. Platform stats RPC (admin dashboard)
-- =============================================================================
CREATE OR REPLACE FUNCTION get_platform_stats(p_admin_secret TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN json_build_object(
    'totalInvoices', (SELECT COUNT(*) FROM "Invoice"),
    'paidInvoices', (SELECT COUNT(*) FROM "Invoice" WHERE "isPaid" = true),
    'unpaidInvoices', (SELECT COUNT(*) FROM "Invoice" WHERE "isPaid" = false),
    'totalRevenue', (SELECT COUNT(*) * 10 FROM "Payment" WHERE status = 'COMPLETED'),
    'failedPayments', (SELECT COUNT(*) FROM "Payment" WHERE status = 'FAILED'),
    'cancelledPayments', (SELECT COUNT(*) FROM "Payment" WHERE status = 'CANCELLED'),
    'activeUsers', (SELECT COUNT(*) FROM "User"),
    'guestInvoices', (SELECT COUNT(*) FROM "Invoice" WHERE "guestSessionId" IS NOT NULL AND "userId" IS NULL),
    'invoicesToday', (SELECT COUNT(*) FROM "Invoice" WHERE "createdAt" >= CURRENT_DATE),
    'paymentsToday', (SELECT COUNT(*) FROM "Payment" WHERE status = 'COMPLETED' AND "createdAt" >= CURRENT_DATE),
    'revenueToday', (SELECT COUNT(*) * 10 FROM "Payment" WHERE status = 'COMPLETED' AND "createdAt" >= CURRENT_DATE),
    'invoicesThisMonth', (SELECT COUNT(*) FROM "Invoice" WHERE "createdAt" >= date_trunc('month', CURRENT_DATE)),
    'paymentsThisMonth', (SELECT COUNT(*) FROM "Payment" WHERE status = 'COMPLETED' AND "createdAt" >= date_trunc('month', CURRENT_DATE))
  );
END;
$$;
