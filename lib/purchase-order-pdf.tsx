// lib/purchase-order-pdf.tsx — PDF template for Purchase Orders (separate from all other PDFs)
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { PurchaseOrderWithItems } from "@/lib/db/types";
import { formatCurrency, formatDate } from "@/lib/utils/format";

// =============================================================================
// Font Registration
// =============================================================================

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
});

// =============================================================================
// Styles — Purchase Order specific layout
// =============================================================================

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#1a1a1a",
  },
  // Title bar
  titleBar: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderRadius: 4,
  },
  titleBarText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  // Company header section
  companyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  companyLeft: {
    width: "55%",
  },
  companyRight: {
    width: "40%",
    alignItems: "flex-end",
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  companyDetail: {
    fontSize: 9,
    color: "#444",
    marginBottom: 2,
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: "contain",
    marginBottom: 10,
  },
  dateLabel: {
    fontSize: 9,
    color: "#666",
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 8,
  },
  // Divider
  divider: {
    borderBottomWidth: 2,
    borderBottomColor: "#333",
    marginBottom: 16,
  },
  // Section titles
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
  },
  // About Vendor & Ship To sections
  addressSection: {
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  addressLabel: {
    fontSize: 9,
    fontWeight: "bold",
    width: 90,
    color: "#333",
  },
  addressValue: {
    fontSize: 9,
    color: "#444",
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    paddingBottom: 1,
  },
  addressPhoneRow: {
    flexDirection: "row",
    marginBottom: 2,
    justifyContent: "space-between",
  },
  addressPhoneLeft: {
    flexDirection: "row",
    width: "55%",
  },
  addressPhoneRight: {
    flexDirection: "row",
    width: "40%",
  },
  // Table — 4 columns: Details, Quantity, Unit Price, Total
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  colDetails: { width: "45%" },
  colQty: { width: "15%", textAlign: "center" },
  colUnitPrice: { width: "20%", textAlign: "right" },
  colTotal: { width: "20%", textAlign: "right" },
  headerText: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#fff",
    letterSpacing: 0.5,
  },
  cellText: {
    fontSize: 9,
  },
  cellDetail: {
    fontSize: 7,
    color: "#888",
    marginTop: 2,
  },
  // Totals
  totalsContainer: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  totalsTable: {
    width: "40%",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 4,
  },
  totalsLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#666",
    textAlign: "right",
    width: "50%",
  },
  totalsValue: {
    fontSize: 9,
    textAlign: "right",
    width: "50%",
  },
  totalsFinalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 6,
    borderTopWidth: 2,
    marginTop: 4,
  },
  totalsFinalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
    width: "50%",
  },
  totalsFinalValue: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
    width: "50%",
  },
  // Authorized by / Signature
  signatureSection: {
    marginTop: 24,
    alignItems: "center",
  },
  signatureImage: {
    width: 150,
    height: 60,
    objectFit: "contain",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    width: 250,
    marginTop: 6,
    paddingTop: 4,
  },
  signatureText: {
    fontSize: 9,
    textAlign: "center",
    color: "#444",
  },
  signatureDesignation: {
    fontSize: 8,
    textAlign: "center",
    color: "#666",
    marginTop: 2,
  },
  // Notes
  notesSection: {
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#888",
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: "#444",
    lineHeight: 1.5,
  },
  // Reference row
  referenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 4,
  },
  referenceItem: {
    flexDirection: "column",
  },
  referenceLabel: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#888",
    marginBottom: 4,
  },
  referenceValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
  },
  footerBar: {
    height: 3,
    marginBottom: 8,
    borderRadius: 2,
  },
  footerText: {
    fontSize: 8,
    color: "#999",
    textAlign: "center",
  },
  // Watermark
  watermark: {
    position: "absolute",
    top: "35%",
    left: "10%",
    transform: "rotate(-30deg)",
    fontSize: 60,
    color: "rgba(200, 200, 200, 0.3)",
    fontWeight: "bold",
    letterSpacing: 8,
  },
});

// =============================================================================
// PDF Document Component
// =============================================================================

interface PurchaseOrderPdfProps {
  purchaseOrder: PurchaseOrderWithItems;
  showWatermark?: boolean;
}

function PurchaseOrderPdf({ purchaseOrder: po, showWatermark = false }: PurchaseOrderPdfProps) {
  const accentColor = po.accentColor || "#d97706";
  const currency = po.currency || "KES";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        {showWatermark && (
          <Text style={styles.watermark}>INVOPAP — PREVIEW</Text>
        )}

        {/* Title Bar */}
        <View style={[styles.titleBar, { backgroundColor: accentColor }]}>
          <Text style={styles.titleBarText}>
            {po.documentTitle || "PURCHASE ORDER"}
          </Text>
        </View>

        {/* Company Header */}
        <View style={styles.companyHeader}>
          <View style={styles.companyLeft}>
            {po.logoDataUrl && (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={po.logoDataUrl} style={styles.logo} />
            )}
            <Text style={styles.companyName}>{po.fromName}</Text>
            {po.fromPhone && (
              <Text style={styles.companyDetail}>
                Company Phone: {po.fromPhone}
              </Text>
            )}
            {po.fromWebsite && (
              <Text style={styles.companyDetail}>
                Website: {po.fromWebsite}
              </Text>
            )}
            {po.fromEmail && (
              <Text style={styles.companyDetail}>
                Email: {po.fromEmail}
              </Text>
            )}
            {po.fromAddress && (
              <Text style={styles.companyDetail}>{po.fromAddress}</Text>
            )}
            {(po.fromCity || po.fromZipCode) && (
              <Text style={styles.companyDetail}>
                {[po.fromCity, po.fromZipCode].filter(Boolean).join(", ")}
              </Text>
            )}
          </View>
          <View style={styles.companyRight}>
            <Text style={styles.dateLabel}>Dated As:</Text>
            <Text style={styles.dateValue}>{formatDate(po.issueDate)}</Text>
            <Text style={styles.dateLabel}>Purchase Order #:</Text>
            <Text style={styles.dateValue}>{po.purchaseOrderNumber}</Text>
            {po.expectedDeliveryDate && (
              <>
                <Text style={styles.dateLabel}>Expected Delivery:</Text>
                <Text style={styles.dateValue}>{formatDate(po.expectedDeliveryDate)}</Text>
              </>
            )}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Reference Row — Payment Terms & Order No. */}
        {(po.paymentTerms || po.orderNumber) && (
          <View style={styles.referenceRow}>
            {po.paymentTerms && (
              <View style={styles.referenceItem}>
                <Text style={styles.referenceLabel}>Payment Terms</Text>
                <Text style={styles.referenceValue}>{po.paymentTerms}</Text>
              </View>
            )}
            {po.orderNumber && (
              <View style={styles.referenceItem}>
                <Text style={styles.referenceLabel}>Order / Ref No.</Text>
                <Text style={styles.referenceValue}>{po.orderNumber}</Text>
              </View>
            )}
          </View>
        )}

        {/* About Vendor */}
        <View style={styles.addressSection}>
          <Text style={styles.sectionTitle}>About Vendor:</Text>
          <View style={styles.addressRow}>
            <Text style={styles.addressLabel}>Vendor Name:</Text>
            <Text style={styles.addressValue}>{po.toName}</Text>
          </View>
          {po.toEmail && (
            <View style={styles.addressRow}>
              <Text style={styles.addressLabel}>Email:</Text>
              <Text style={styles.addressValue}>{po.toEmail}</Text>
            </View>
          )}
          {po.toAddress && (
            <View style={styles.addressRow}>
              <Text style={styles.addressLabel}>Address:</Text>
              <Text style={styles.addressValue}>{po.toAddress}</Text>
            </View>
          )}
          {(po.toCity || po.toZipCode) && (
            <View style={styles.addressPhoneRow}>
              <View style={styles.addressPhoneLeft}>
                <Text style={styles.addressLabel}>
                  {po.toCity ? "City, Zip Code:" : "Zip Code:"}
                </Text>
                <Text style={styles.addressValue}>
                  {[po.toCity, po.toZipCode].filter(Boolean).join(", ")}
                </Text>
              </View>
              {po.toPhone && (
                <View style={styles.addressPhoneRight}>
                  <Text style={styles.addressLabel}>Phone:</Text>
                  <Text style={styles.addressValue}>{po.toPhone}</Text>
                </View>
              )}
            </View>
          )}
          {!po.toCity && !po.toZipCode && po.toPhone && (
            <View style={styles.addressRow}>
              <Text style={styles.addressLabel}>Phone:</Text>
              <Text style={styles.addressValue}>{po.toPhone}</Text>
            </View>
          )}
        </View>

        {/* Ship To (optional) */}
        {po.shipToEnabled && (
          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>Ship To:</Text>
            {po.shipToName && (
              <View style={styles.addressRow}>
                <Text style={styles.addressLabel}>Name:</Text>
                <Text style={styles.addressValue}>{po.shipToName}</Text>
              </View>
            )}
            {po.shipToCompanyName && (
              <View style={styles.addressRow}>
                <Text style={styles.addressLabel}>Company Name:</Text>
                <Text style={styles.addressValue}>{po.shipToCompanyName}</Text>
              </View>
            )}
            {po.shipToAddress && (
              <View style={styles.addressRow}>
                <Text style={styles.addressLabel}>Address:</Text>
                <Text style={styles.addressValue}>{po.shipToAddress}</Text>
              </View>
            )}
            {(po.shipToCity || po.shipToZipCode) && (
              <View style={styles.addressPhoneRow}>
                <View style={styles.addressPhoneLeft}>
                  <Text style={styles.addressLabel}>City, Zip Code:</Text>
                  <Text style={styles.addressValue}>
                    {[po.shipToCity, po.shipToZipCode].filter(Boolean).join(", ")}
                  </Text>
                </View>
                {po.shipToPhone && (
                  <View style={styles.addressPhoneRight}>
                    <Text style={styles.addressLabel}>Phone:</Text>
                    <Text style={styles.addressValue}>{po.shipToPhone}</Text>
                  </View>
                )}
              </View>
            )}
            {!po.shipToCity && !po.shipToZipCode && po.shipToPhone && (
              <View style={styles.addressRow}>
                <Text style={styles.addressLabel}>Phone:</Text>
                <Text style={styles.addressValue}>{po.shipToPhone}</Text>
              </View>
            )}
          </View>
        )}

        {/* Line Items Table — 4 columns: Details, Quantity, Unit Price, Total */}
        <View style={styles.table}>
          <View style={[styles.tableHeader, { backgroundColor: accentColor, borderBottomColor: accentColor }]}>
            <Text style={[styles.headerText, styles.colDetails]}>Details</Text>
            <Text style={[styles.headerText, styles.colQty]}>Quantity</Text>
            <Text style={[styles.headerText, styles.colUnitPrice]}>Unit Price</Text>
            <Text style={[styles.headerText, styles.colTotal]}>Total</Text>
          </View>

          {po.lineItems.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.tableRow,
                index % 2 === 1 ? styles.tableRowAlt : {},
              ]}
            >
              <View style={styles.colDetails}>
                <Text style={styles.cellText}>{item.description}</Text>
                {item.additionalDetails && (
                  <Text style={styles.cellDetail}>
                    {item.additionalDetails}
                  </Text>
                )}
              </View>
              <Text style={[styles.cellText, styles.colQty]}>
                {item.quantity}
              </Text>
              <Text style={[styles.cellText, styles.colUnitPrice]}>
                {formatCurrency(item.unitPrice, currency)}
              </Text>
              <Text style={[styles.cellText, styles.colTotal]}>
                {formatCurrency(item.amount, currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals — NO discount row */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>SUBTOTAL</Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(po.subtotal, currency)}
              </Text>
            </View>
            {po.taxAmount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>
                  TAX ({po.taxRate}%)
                </Text>
                <Text style={styles.totalsValue}>
                  {formatCurrency(po.taxAmount, currency)}
                </Text>
              </View>
            )}
            {po.taxAmount === 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>TAX</Text>
                <Text style={styles.totalsValue}>—</Text>
              </View>
            )}
            <View style={[styles.totalsFinalRow, { borderTopColor: accentColor }]}>
              <Text style={[styles.totalsFinalLabel, { color: accentColor }]}>
                TOTAL
              </Text>
              <Text style={[styles.totalsFinalValue, { color: accentColor }]}>
                {formatCurrency(po.total, currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {po.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{po.notes}</Text>
          </View>
        )}

        {/* Signature / Authorized By */}
        <View style={styles.signatureSection}>
          {po.signatureDataUrl && (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={po.signatureDataUrl} style={styles.signatureImage} />
          )}
          <View style={styles.signatureLine}>
            <Text style={styles.signatureText}>
              {po.authorizedByName
                ? `[${po.authorizedByName}]`
                : "[Signatures of Authorized Person]"}
            </Text>
            <Text style={styles.signatureDesignation}>
              {po.authorizedByDesignation
                ? `[${po.authorizedByDesignation}]`
                : "[Write Designation Here]"}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.footerBar, { backgroundColor: accentColor }]} />
          <Text style={styles.footerText}>Generated by Invopap</Text>
        </View>
      </Page>
    </Document>
  );
}

// =============================================================================
// PDF Render Function
// =============================================================================

let activePdfRenders = 0;
const MAX_CONCURRENT_PDF = 5;

export async function renderPurchaseOrderPdf(
  purchaseOrder: PurchaseOrderWithItems,
  options: { showWatermark?: boolean } = {}
): Promise<Buffer> {
  if (activePdfRenders >= MAX_CONCURRENT_PDF) {
    throw new Error("PDF_BUSY");
  }

  activePdfRenders++;
  try {
    const buffer = await renderToBuffer(
      <PurchaseOrderPdf
        purchaseOrder={purchaseOrder}
        showWatermark={options.showWatermark ?? false}
      />
    );
    return Buffer.from(buffer);
  } finally {
    activePdfRenders--;
  }
}

export { PurchaseOrderPdf };
