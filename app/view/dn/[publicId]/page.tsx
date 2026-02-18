// app/view/dn/[publicId]/page.tsx — Public delivery note view page
import { getDeliveryNoteByPublicId } from "@/lib/db";
import { notFound } from "next/navigation";
import { PublicDeliveryNoteView } from "./PublicDeliveryNoteView";
import type { Metadata } from "next";

interface Props {
  params: { publicId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dn = await getDeliveryNoteByPublicId(params.publicId);
  if (!dn) return { title: "Delivery Note Not Found" };

  return {
    title: `${dn.deliveryNoteNumber} — Invopap`,
    description: `View ${dn.documentTitle} ${dn.deliveryNoteNumber} from ${dn.fromName || "Invopap"}`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicDeliveryNotePage({ params }: Props) {
  const dn = await getDeliveryNoteByPublicId(params.publicId);

  if (!dn) {
    notFound();
  }

  return <PublicDeliveryNoteView deliveryNote={dn} />;
}
