// app/view/receipt/[publicId]/page.tsx — Public receipt view page
import { getReceiptByPublicId } from "@/lib/db";
import { notFound } from "next/navigation";
import { PublicReceiptView } from "./PublicReceiptView";
import type { Metadata } from "next";

interface Props {
  params: { publicId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const receipt = await getReceiptByPublicId(params.publicId);
  if (!receipt) return { title: "Receipt Not Found" };

  return {
    title: `${receipt.receiptNumber} — Invopap`,
    description: `View ${receipt.documentTitle} ${receipt.receiptNumber} from ${receipt.fromName || "Invopap"}`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicReceiptPage({ params }: Props) {
  const receipt = await getReceiptByPublicId(params.publicId);

  if (!receipt) {
    notFound();
  }

  return <PublicReceiptView receipt={receipt} />;
}
