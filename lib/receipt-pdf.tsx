// lib/receipt-pdf.tsx — PDF template for Official Receipts
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
import type { ReceiptWithPhotos } from "@/lib/db/types";
import { formatDate, formatNumber, getCurrency } from "@/lib/utils/format";

// =============================================================================
// Font Registration
// =============================================================================

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
    { src: "Helvetica-Oblique", fontStyle: "italic" },
    { src: "Helvetica-BoldOblique", fontWeight: "bold", fontStyle: "italic" },
  ],
});

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#1a1a1a",
  },
  // Header banner
  titleBanner: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 4,
    alignSelf: "center",
    marginBottom: 2,
  },
  titleBannerText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  // Company header
  companyHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 4,
    marginBottom: 24,
    alignItems: "center",
  },
  companyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  companyLogo: {
    width: 50,
    height: 50,
    objectFit: "contain",
  },
  companyName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  companyDetail: {
    fontSize: 9,
    color: "rgba(255,255,255,0.85)",
    marginTop: 3,
    textAlign: "center",
  },
  // Number / Date row
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  metaLabel: {
    fontSize: 10,
    color: "#888",
  },
  metaValue: {
    fontSize: 12,
    fontWeight: "bold",
  },
  // Receipt lines (italicized label + underlined value)
  receiptLine: {
    flexDirection: "row",
    marginBottom: 14,
    alignItems: "flex-end",
  },
  receiptLineLabel: {
    fontSize: 10,
    fontStyle: "italic",
    fontWeight: "bold",
    marginRight: 8,
    flexShrink: 0,
  },
  receiptLineValue: {
    flex: 1,
    fontSize: 10,
    borderBottomWidth: 1.5,
    paddingBottom: 2,
  },
  // Amount box
  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  amountBoxLabel: {
    fontSize: 10,
    fontStyle: "italic",
    fontWeight: "bold",
    marginRight: 8,
  },
  amountBoxValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  // Payment method section
  paymentMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  paymentMethodLabel: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#888",
    letterSpacing: 0.5,
  },
  paymentMethodOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  paymentMethodCheckbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentMethodChecked: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  paymentMethodText: {
    fontSize: 9,
  },
  transactionCode: {
    fontSize: 8,
    color: "#666",
    marginTop: 4,
  },
  // Bottom row
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 20,
    marginBottom: 24,
  },
  // Signature
  signatureSection: {
    alignItems: "center",
  },
  signatureImage: {
    width: 120,
    height: 50,
    objectFit: "contain",
  },
  signatureLabel: {
    fontSize: 8,
    color: "#888",
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingTop: 4,
    width: 120,
    textAlign: "center",
  },
  // Notes
  notesSection: {
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#888",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: "#444",
    lineHeight: 1.5,
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

interface ReceiptPdfProps {
  receipt: ReceiptWithPhotos;
  showWatermark?: boolean;
}

function ReceiptPdf({ receipt, showWatermark = false }: ReceiptPdfProps) {
  const accentColor = receipt.accentColor || "#4c1d95";
  const currencyInfo = getCurrency(receipt.currency);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        {showWatermark && (
          <Text style={styles.watermark}>INVOPAP — PREVIEW</Text>
        )}

        {/* Title banner */}
        <View
          style={[styles.titleBanner, { backgroundColor: accentColor }]}
        >
          <Text style={styles.titleBannerText}>
            {receipt.documentTitle || "Official Receipt"}
          </Text>
        </View>

        {/* Company header */}
        <View
          style={[
            styles.companyHeader,
            { backgroundColor: `${accentColor}ee` },
          ]}
        >
          <View style={styles.companyHeaderRow}>
            {receipt.logoDataUrl && (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={receipt.logoDataUrl} style={styles.companyLogo} />
            )}
            <Text style={styles.companyName}>
              {receipt.fromName || "Business Name"}
            </Text>
          </View>
          {(receipt.fromPhone || receipt.fromEmail) && (
            <Text style={styles.companyDetail}>
              {[
                receipt.fromPhone && `Tel: ${receipt.fromPhone}`,
                receipt.fromEmail && `Email: ${receipt.fromEmail}`,
              ]
                .filter(Boolean)
                .join("  ")}
            </Text>
          )}
          {receipt.fromAddress && (
            <Text style={styles.companyDetail}>
              {receipt.fromAddress}
              {receipt.fromCity && `, ${receipt.fromCity}`}
            </Text>
          )}
        </View>

        {/* Number + Date */}
        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>No.</Text>
            <Text style={styles.metaValue}>
              {receipt.receiptNumber || "—"}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>
              {formatDate(receipt.issueDate)}
            </Text>
          </View>
        </View>

        {/* Received with thanks from */}
        <View style={styles.receiptLine}>
          <Text
            style={[styles.receiptLineLabel, { color: accentColor }]}
          >
            Received with thanks from
          </Text>
          <Text
            style={[styles.receiptLineValue, { borderBottomColor: accentColor }]}
          >
            {receipt.toName || ""}
          </Text>
        </View>

        {/* The sum of */}
        <View style={styles.receiptLine}>
          <Text
            style={[styles.receiptLineLabel, { color: accentColor }]}
          >
            The sum of
          </Text>
          <Text
            style={[
              styles.receiptLineValue,
              { borderBottomColor: accentColor, fontStyle: "italic" },
            ]}
          >
            {receipt.amountInWords || "—"}
          </Text>
        </View>

        {/* Being payment of */}
        <View style={styles.receiptLine}>
          <Text
            style={[styles.receiptLineLabel, { color: accentColor }]}
          >
            Being payment of
          </Text>
          <Text
            style={[styles.receiptLineValue, { borderBottomColor: accentColor }]}
          >
            {receipt.beingPaymentOf || "—"}
          </Text>
        </View>

        {/* Outstanding balance */}
        <View style={styles.receiptLine}>
          <Text
            style={[styles.receiptLineLabel, { color: accentColor }]}
          >
            Outstanding balance
          </Text>
          <Text
            style={[
              styles.receiptLineValue,
              {
                borderBottomColor: accentColor,
                color:
                  (receipt.outstandingBalance ?? 0) > 0
                    ? "#b45309"
                    : "#15803d",
                fontWeight: "bold",
              },
            ]}
          >
            {(receipt.outstandingBalance ?? 0) > 0
              ? `${currencyInfo.symbol} ${formatNumber(receipt.outstandingBalance)}`
              : "Nil"}
          </Text>
        </View>

        {/* Payment method checkboxes */}
        <View style={styles.paymentMethodRow}>
          <Text style={styles.paymentMethodLabel}>Payment Method:</Text>
          {(["cash", "mpesa", "bank"] as const).map((method) => (
            <View key={method} style={styles.paymentMethodOption}>
              <View
                style={[
                  styles.paymentMethodCheckbox,
                  receipt.paymentMethod === method
                    ? { borderColor: accentColor }
                    : {},
                ]}
              >
                {receipt.paymentMethod === method && (
                  <View
                    style={[
                      styles.paymentMethodChecked,
                      { backgroundColor: accentColor },
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.paymentMethodText,
                  receipt.paymentMethod === method
                    ? { fontWeight: "bold", color: accentColor }
                    : { color: "#888" },
                ]}
              >
                {method === "mpesa"
                  ? "M-Pesa"
                  : method.charAt(0).toUpperCase() + method.slice(1)}
              </Text>
            </View>
          ))}
        </View>

        {/* Transaction code */}
        {receipt.transactionCode &&
          (receipt.paymentMethod === "mpesa" ||
            receipt.paymentMethod === "bank") && (
            <Text style={styles.transactionCode}>
              Transaction Ref: {receipt.transactionCode}
            </Text>
          )}

        {/* Bottom: Amount box + Signature */}
        <View style={styles.bottomRow}>
          {/* Amount box */}
          <View style={[styles.amountBox, { borderColor: accentColor }]}>
            <Text style={[styles.amountBoxLabel, { color: accentColor }]}>
              {currencyInfo.symbol}
            </Text>
            <Text style={styles.amountBoxValue}>
              {formatNumber(receipt.amountReceived)}
            </Text>
          </View>

          {/* Signature */}
          <View style={styles.signatureSection}>
            {receipt.signatureDataUrl && (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image
                src={receipt.signatureDataUrl}
                style={styles.signatureImage}
              />
            )}
            <Text style={styles.signatureLabel}>Authorized Signature</Text>
          </View>
        </View>

        {/* Notes */}
        {receipt.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{receipt.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View
            style={[styles.footerBar, { backgroundColor: accentColor }]}
          />
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

export async function renderReceiptPdf(
  receipt: ReceiptWithPhotos,
  options: { showWatermark?: boolean } = {}
): Promise<Buffer> {
  if (activePdfRenders >= MAX_CONCURRENT_PDF) {
    throw new Error("PDF_BUSY");
  }

  activePdfRenders++;
  try {
    const buffer = await renderToBuffer(
      <ReceiptPdf
        receipt={receipt}
        showWatermark={options.showWatermark ?? false}
      />
    );
    return Buffer.from(buffer);
  } finally {
    activePdfRenders--;
  }
}

export { ReceiptPdf };
