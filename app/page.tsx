// app/page.tsx — Home page: invoice editor (guest-first)
import dynamic from "next/dynamic";

const InvoiceEditor = dynamic(
  () => import("@/components/InvoiceEditor").then((mod) => mod.InvoiceEditor),
  { ssr: false }
);

export default function HomePage() {
  return <InvoiceEditor />;
}
