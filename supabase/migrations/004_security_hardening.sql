-- Migration 004: Security Hardening
-- RPC auth checks, guest RLS, stale payment cleanup, public read policy

-- =============================================================================
-- RPC auth checks: restrict sensitive RPCs to service_role
-- =============================================================================

-- Re-create get_dashboard_stats with auth check
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Allow service_role OR authenticated users querying their own data
  IF auth.role() != 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
    -- Verify the user is querying their own stats
    IF NOT EXISTS (SELECT 1 FROM "User" WHERE "id" = p_user_id AND "externalId" = auth.uid()::text) THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
  END IF;

  SELECT json_build_object(
    'totalInvoices', (SELECT COUNT(*) FROM "Invoice" WHERE "userId" = p_user_id),
    'paidInvoices', (SELECT COUNT(*) FROM "Invoice" WHERE "userId" = p_user_id AND "isPaid" = true),
    'unpaidInvoices', (SELECT COUNT(*) FROM "Invoice" WHERE "userId" = p_user_id AND "isPaid" = false),
    'totalRevenue', COALESCE((SELECT SUM("total") FROM "Invoice" WHERE "userId" = p_user_id AND "isPaid" = true), 0),
    'overdueInvoices', (SELECT COUNT(*) FROM "Invoice" WHERE "userId" = p_user_id AND "isPaid" = false AND "dueDate" < NOW()),
    'recentInvoices', (
      SELECT COALESCE(json_agg(row_to_json(inv)), '[]'::json)
      FROM (
        SELECT "id", "publicId", "documentType", "invoiceNumber", "toName", "total", "currency", "isPaid", "createdAt", "dueDate"
        FROM "Invoice"
        WHERE "userId" = p_user_id
        ORDER BY "createdAt" DESC
        LIMIT 10
      ) inv
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Re-create create_payment_if_unpaid with service_role check
CREATE OR REPLACE FUNCTION create_payment_if_unpaid(
  p_payment_id TEXT,
  p_invoice_id TEXT,
  p_user_id TEXT,
  p_phone_number TEXT,
  p_amount NUMERIC(15,2)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice RECORD;
  v_active_payment RECORD;
BEGIN
  -- Only service_role can create payments
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT "id", "isPaid", "userId"
  INTO v_invoice
  FROM "Invoice"
  WHERE "id" = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Invoice not found', 'code', 'NOT_FOUND');
  END IF;

  IF v_invoice."isPaid" THEN
    RETURN json_build_object('error', 'Invoice already paid', 'code', 'ALREADY_PAID');
  END IF;

  SELECT "id", "status"
  INTO v_active_payment
  FROM "Payment"
  WHERE "invoiceId" = p_invoice_id
    AND status IN ('PENDING', 'PROCESSING')
  LIMIT 1;

  IF FOUND THEN
    RETURN json_build_object(
      'error', 'Payment already in progress',
      'code', 'PAYMENT_IN_PROGRESS',
      'paymentId', v_active_payment."id"
    );
  END IF;

  INSERT INTO "Payment" ("id", "invoiceId", "userId", "phoneNumber", "amount", "currency", "status")
  VALUES (p_payment_id, p_invoice_id, p_user_id, p_phone_number, p_amount, 'KES', 'PENDING');

  RETURN json_build_object('success', true, 'paymentId', p_payment_id);
END;
$$;

-- =============================================================================
-- Guest RLS Policies
-- =============================================================================

-- Guests can manage their own invoices via guestSessionId header
CREATE POLICY "Guests can select own invoices"
  ON "Invoice" FOR SELECT
  USING (
    "guestSessionId" IS NOT NULL
    AND "guestSessionId" = current_setting('request.headers', true)::json->>'x-guest-session-id'
  );

CREATE POLICY "Guests can insert own invoices"
  ON "Invoice" FOR INSERT
  WITH CHECK (
    "guestSessionId" IS NOT NULL
    AND "guestSessionId" = current_setting('request.headers', true)::json->>'x-guest-session-id'
  );

CREATE POLICY "Guests can update own invoices"
  ON "Invoice" FOR UPDATE
  USING (
    "guestSessionId" IS NOT NULL
    AND "guestSessionId" = current_setting('request.headers', true)::json->>'x-guest-session-id'
  );

CREATE POLICY "Guests can delete own invoices"
  ON "Invoice" FOR DELETE
  USING (
    "guestSessionId" IS NOT NULL
    AND "guestSessionId" = current_setting('request.headers', true)::json->>'x-guest-session-id'
  );

-- Guest line items
CREATE POLICY "Guests can select own line items"
  ON "LineItem" FOR SELECT
  USING ("invoiceId" IN (
    SELECT "id" FROM "Invoice"
    WHERE "guestSessionId" IS NOT NULL
      AND "guestSessionId" = current_setting('request.headers', true)::json->>'x-guest-session-id'
  ));

CREATE POLICY "Guests can insert own line items"
  ON "LineItem" FOR INSERT
  WITH CHECK ("invoiceId" IN (
    SELECT "id" FROM "Invoice"
    WHERE "guestSessionId" IS NOT NULL
      AND "guestSessionId" = current_setting('request.headers', true)::json->>'x-guest-session-id'
  ));

CREATE POLICY "Guests can delete own line items"
  ON "LineItem" FOR DELETE
  USING ("invoiceId" IN (
    SELECT "id" FROM "Invoice"
    WHERE "guestSessionId" IS NOT NULL
      AND "guestSessionId" = current_setting('request.headers', true)::json->>'x-guest-session-id'
  ));

-- Guest photos
CREATE POLICY "Guests can select own photos"
  ON "InvoicePhoto" FOR SELECT
  USING ("invoiceId" IN (
    SELECT "id" FROM "Invoice"
    WHERE "guestSessionId" IS NOT NULL
      AND "guestSessionId" = current_setting('request.headers', true)::json->>'x-guest-session-id'
  ));

-- =============================================================================
-- Public read policy (for shared links)
-- =============================================================================
CREATE POLICY "Anyone can read invoices by publicId"
  ON "Invoice" FOR SELECT
  USING (true);  -- Controlled at API layer; RLS allows read for public endpoints

-- Public read for line items of accessible invoices
CREATE POLICY "Public can read line items"
  ON "LineItem" FOR SELECT
  USING (true);  -- Controlled at API layer

-- Public read for photos of accessible invoices
CREATE POLICY "Public can read photos"
  ON "InvoicePhoto" FOR SELECT
  USING (true);  -- Controlled at API layer

-- =============================================================================
-- Payment RLS: users can read their own payment records
-- =============================================================================
CREATE POLICY "Users can read own payments"
  ON "Payment" FOR SELECT
  USING ("userId" IN (
    SELECT "id" FROM "User" WHERE "externalId" = auth.uid()::text
  ));

-- Service role can do everything with payments (writes happen via admin client)
CREATE POLICY "Service role full payment access"
  ON "Payment" FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- Stale Payment Cleanup
-- =============================================================================
CREATE OR REPLACE FUNCTION expire_stale_payments()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count INT;
BEGIN
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE "Payment"
  SET
    status = 'FAILED',
    "resultDesc" = 'Expired: no callback received within 30 minutes',
    "updatedAt" = NOW()
  WHERE status IN ('PENDING', 'PROCESSING')
    AND "createdAt" < NOW() - INTERVAL '30 minutes';

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;
