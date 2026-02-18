// app/cash-sale/page.tsx — Cash Sale editor page
import dynamic from "next/dynamic";

const CashSaleEditor = dynamic(
  () => import("@/components/CashSaleEditor").then((mod) => mod.CashSaleEditor),
  { ssr: false }
);

export default function CashSalePage() {
  return <CashSaleEditor />;
}
