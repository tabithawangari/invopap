-- Migration 001: Core Schema
-- Creates all tables with proper types, foreign keys, CASCADE deletes, and RLS

-- =============================================================================
-- Table: "User"
-- =============================================================================
CREATE TABLE IF NOT EXISTS "User" (
  "id"               TEXT        NOT NULL,
  "email"            TEXT        NOT NULL,
  "name"             TEXT,
  "avatarUrl"        TEXT,
  "externalId"       TEXT,
  "provider"         TEXT,
  "businessName"     TEXT,
  "businessEmail"    TEXT,
  "businessPhone"    TEXT,
  "businessAddress"  TEXT,
  "businessCity"     TEXT,
  "businessZipCode"  TEXT,
  "businessNumber"   TEXT,
  "defaultCurrency"  TEXT        NOT NULL DEFAULT 'KES',
  "defaultTaxRate"   NUMERIC(5,2) NOT NULL DEFAULT 16,
  "logoUrl"          TEXT,
  "signatureUrl"     TEXT,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "User_email_key" UNIQUE ("email"),
  CONSTRAINT "User_externalId_key" UNIQUE ("externalId")
);

-- =============================================================================
-- Table: "Invoice"
-- =============================================================================
CREATE TABLE IF NOT EXISTS "Invoice" (
  "id"                TEXT           NOT NULL,
  "userId"            TEXT,
  "guestSessionId"    TEXT,
  "publicId"          TEXT           NOT NULL,
  "documentType"      TEXT           NOT NULL DEFAULT 'INVOICE',
  "documentTitle"     TEXT           NOT NULL DEFAULT 'Invoice',
  "invoiceNumber"     TEXT           NOT NULL,
  "issueDate"         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "dueDate"           TIMESTAMPTZ,
  "paymentTerms"      TEXT           NOT NULL DEFAULT 'NET_7',
  "fromName"          TEXT           NOT NULL,
  "fromEmail"         TEXT,
  "fromPhone"         TEXT,
  "fromMobile"        TEXT,
  "fromFax"           TEXT,
  "fromAddress"       TEXT,
  "fromCity"          TEXT,
  "fromZipCode"       TEXT,
  "fromBusinessNumber" TEXT,
  "toName"            TEXT           NOT NULL,
  "toEmail"           TEXT,
  "toPhone"           TEXT,
  "toMobile"          TEXT,
  "toFax"             TEXT,
  "toAddress"         TEXT,
  "toCity"            TEXT,
  "toZipCode"         TEXT,
  "toBusinessNumber"  TEXT,
  "currency"          TEXT           NOT NULL DEFAULT 'KES',
  "taxRate"           NUMERIC(5,2)   NOT NULL DEFAULT 16,
  "discountType"      TEXT           NOT NULL DEFAULT 'PERCENTAGE',
  "discountValue"     NUMERIC(15,2)  NOT NULL DEFAULT 0,
  "subtotal"          NUMERIC(15,2)  NOT NULL DEFAULT 0,
  "taxAmount"         NUMERIC(15,2)  NOT NULL DEFAULT 0,
  "discountAmount"    NUMERIC(15,2)  NOT NULL DEFAULT 0,
  "total"             NUMERIC(15,2)  NOT NULL DEFAULT 0,
  "accentColor"       TEXT           NOT NULL DEFAULT '#1f8ea3',
  "logoDataUrl"       TEXT,
  "signatureDataUrl"  TEXT,
  "notes"             TEXT,
  "isPaid"            BOOLEAN        NOT NULL DEFAULT false,
  "paidAt"            TIMESTAMPTZ,
  "pdfUrl"            TEXT,
  "createdAt"         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Invoice_publicId_key" UNIQUE ("publicId"),
  CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL,
  CONSTRAINT "Invoice_tenant_required" CHECK ("userId" IS NOT NULL OR "guestSessionId" IS NOT NULL)
);

-- =============================================================================
-- Table: "LineItem"
-- =============================================================================
CREATE TABLE IF NOT EXISTS "LineItem" (
  "id"                TEXT           NOT NULL,
  "invoiceId"         TEXT           NOT NULL,
  "description"       TEXT           NOT NULL,
  "additionalDetails" TEXT,
  "quantity"          NUMERIC(12,4)  NOT NULL,
  "rate"              NUMERIC(15,2)  NOT NULL,
  "amount"            NUMERIC(15,2)  NOT NULL,
  "sortOrder"         INTEGER        NOT NULL DEFAULT 0,
  "createdAt"         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT "LineItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE
);

-- =============================================================================
-- Table: "InvoicePhoto"
-- =============================================================================
CREATE TABLE IF NOT EXISTS "InvoicePhoto" (
  "id"          TEXT        NOT NULL,
  "invoiceId"   TEXT        NOT NULL,
  "url"         TEXT        NOT NULL,
  "filename"    TEXT,
  "sortOrder"   INTEGER     NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "InvoicePhoto_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InvoicePhoto_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE
);

-- =============================================================================
-- Table: "Payment"
-- =============================================================================
CREATE TABLE IF NOT EXISTS "Payment" (
  "id"                  TEXT           NOT NULL,
  "invoiceId"           TEXT           NOT NULL,
  "userId"              TEXT,
  "phoneNumber"         TEXT           NOT NULL,
  "amount"              NUMERIC(15,2)  NOT NULL,
  "currency"            TEXT           NOT NULL DEFAULT 'KES',
  "merchantRequestId"   TEXT,
  "checkoutRequestId"   TEXT,
  "mpesaReceiptNumber"  TEXT,
  "transactionDate"     TIMESTAMPTZ,
  "status"              TEXT           NOT NULL DEFAULT 'PENDING',
  "resultCode"          TEXT,
  "resultDesc"          TEXT,
  "createdAt"           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "completedAt"         TIMESTAMPTZ,

  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id"),
  CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);

-- =============================================================================
-- Enable RLS on all tables
-- =============================================================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LineItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InvoicePhoto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
