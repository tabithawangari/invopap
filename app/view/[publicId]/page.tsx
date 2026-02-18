// app/view/[publicId]/page.tsx — Public invoice view page
import { getInvoiceByPublicId } from "@/lib/db";
import { notFound } from "next/navigation";
import { PublicInvoiceView } from "./PublicInvoiceView";
import type { Metadata } from "next";

interface Props {
  params: { publicId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const invoice = await getInvoiceByPublicId(params.publicId);
  if (!invoice) return { title: "Invoice Not Found" };

  return {
    title: `${invoice.invoiceNumber} — Invopap`,
    description: `View ${invoice.documentTitle} ${invoice.invoiceNumber} from ${invoice.fromName || "Invopap"}`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicInvoicePage({ params }: Props) {
  const invoice = await getInvoiceByPublicId(params.publicId);

  if (!invoice) {
    notFound();
  }

  return <PublicInvoiceView invoice={invoice} />;
}
