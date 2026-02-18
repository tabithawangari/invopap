// app/quotation/page.tsx — Quotation editor page
import dynamic from "next/dynamic";

const QuotationEditor = dynamic(
  () => import("@/components/QuotationEditor").then((mod) => mod.QuotationEditor),
  { ssr: false }
);

export default function QuotationPage() {
  return <QuotationEditor />;
}
