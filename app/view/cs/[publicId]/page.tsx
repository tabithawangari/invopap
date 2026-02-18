// app/view/cs/[publicId]/page.tsx — Public cash sale view page
import { getCashSaleByPublicId } from "@/lib/db";
import { notFound } from "next/navigation";
import { PublicCashSaleView } from "./PublicCashSaleView";
import type { Metadata } from "next";

interface Props {
  params: { publicId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const sale = await getCashSaleByPublicId(params.publicId);
  if (!sale) return { title: "Cash Sale Not Found" };

  return {
    title: `${sale.cashSaleNumber} — Invopap`,
    description: `View ${sale.documentTitle} ${sale.cashSaleNumber} from ${sale.fromName || "Invopap"}`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicCashSalePage({ params }: Props) {
  const sale = await getCashSaleByPublicId(params.publicId);

  if (!sale) {
    notFound();
  }

  return <PublicCashSaleView cashSale={sale} />;
}
