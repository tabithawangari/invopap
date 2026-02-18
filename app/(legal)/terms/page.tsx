// app/(legal)/terms/page.tsx — Terms of Service
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Invopap",
  description: "Invopap Terms of Service",
};

export default function TermsPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Terms of Service</h1>
      <p className="text-sm text-ink/50">Last updated: {new Date().toLocaleDateString("en-KE")}</p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using Invopap (&quot;the Service&quot;), you agree to be bound by
        these Terms of Service. If you do not agree, do not use the Service.
      </p>

      <h2>2. Service Description</h2>
      <p>
        Invopap is a document generation platform that allows users to create
        invoices, receipts, estimates, and quotes. Users can create documents
        without an account (as guests) or sign up for a persistent account.
      </p>

      <h2>3. Pricing</h2>
      <p>
        Creating and previewing documents is free. Downloading a clean PDF
        (without watermark) requires a one-time payment of <strong>KSh 10</strong>{" "}
        per document via M-Pesa. This fee is charged to the document creator,
        not the invoice recipient.
      </p>

      <h2>4. Payments</h2>
      <p>
        All payments are processed via Safaricom M-Pesa. By completing a
        payment, you agree to Safaricom&apos;s terms of service. Payment is
        non-refundable once a PDF has been downloaded (see our Refund Policy).
      </p>

      <h2>5. User Content</h2>
      <p>
        You retain ownership of all content you enter into documents (business
        names, amounts, images, etc.). By using the Service, you grant Invopap a
        limited license to store and process this content solely for the purpose
        of generating your documents.
      </p>

      <h2>6. Prohibited Use</h2>
      <ul>
        <li>Creating fraudulent or misleading documents</li>
        <li>Automated/bot access without prior written consent</li>
        <li>Attempting to circumvent payment requirements</li>
        <li>Uploading illegal or harmful content</li>
        <li>Interfering with the Service&apos;s infrastructure</li>
      </ul>

      <h2>7. Account Termination</h2>
      <p>
        We reserve the right to suspend or terminate accounts that violate these
        terms. Guest session data may be deleted after 90 days of inactivity.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        Invopap is provided &quot;as is&quot; without warranty. We are not liable for any
        business decisions made based on documents generated using the Service.
        Our maximum liability is limited to the amount paid by you in the
        preceding 12 months.
      </p>

      <h2>9. Governing Law</h2>
      <p>
        These terms are governed by the laws of the Republic of Kenya. Any
        disputes shall be resolved in the courts of Nairobi, Kenya.
      </p>

      <h2>10. Changes to Terms</h2>
      <p>
        We may update these terms from time to time. Continued use of the
        Service constitutes acceptance of the updated terms.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about these terms, contact us at{" "}
        <a href="mailto:legal@invopap.com">legal@invopap.com</a>.
      </p>
    </article>
  );
}
