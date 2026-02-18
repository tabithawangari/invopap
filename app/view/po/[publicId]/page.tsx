// app/view/po/[publicId]/page.tsx — Public purchase order view page
import { getPurchaseOrderByPublicId } from "@/lib/db";
import { notFound } from "next/navigation";
import { PublicPurchaseOrderView } from "./PublicPurchaseOrderView";
import type { Metadata } from "next";

interface Props {
  params: { publicId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const po = await getPurchaseOrderByPublicId(params.publicId);
  if (!po) return { title: "Purchase Order Not Found" };

  return {
    title: `${po.purchaseOrderNumber} — Invopap`,
    description: `View ${po.documentTitle} ${po.purchaseOrderNumber} from ${po.fromName || "Invopap"}`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicPurchaseOrderPage({ params }: Props) {
  const po = await getPurchaseOrderByPublicId(params.publicId);

  if (!po) {
    notFound();
  }

  return <PublicPurchaseOrderView purchaseOrder={po} />;
}
