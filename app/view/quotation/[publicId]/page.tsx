// app/view/quotation/[publicId]/page.tsx — Public quotation view page
import { getQuotationByPublicId } from "@/lib/db";
import { notFound } from "next/navigation";
import { PublicQuotationView } from "./PublicQuotationView";
import type { Metadata } from "next";

interface Props {
  params: { publicId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const quotation = await getQuotationByPublicId(params.publicId);
  if (!quotation) return { title: "Quotation Not Found" };

  return {
    title: `${quotation.quotationNumber} — Invopap`,
    description: `View ${quotation.documentTitle} ${quotation.quotationNumber} from ${quotation.fromName || "Invopap"}`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicQuotationPage({ params }: Props) {
  const quotation = await getQuotationByPublicId(params.publicId);

  if (!quotation) {
    notFound();
  }

  return <PublicQuotationView quotation={quotation} />;
}
