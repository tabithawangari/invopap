import dynamic from "next/dynamic";

const ReceiptEditor = dynamic(
  () => import("@/components/ReceiptEditor").then((mod) => mod.ReceiptEditor),
  { ssr: false }
);

export const metadata = {
  title: "Create Receipt – Invopap",
  description: "Create and send professional receipts instantly",
};

export default function ReceiptPage() {
  return <ReceiptEditor />;
}
