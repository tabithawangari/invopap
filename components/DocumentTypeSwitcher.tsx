// components/DocumentTypeSwitcher.tsx — Shared doc-type switcher (header pills or sidebar select)
"use client";

import { useEffect, useRef, memo } from "react";
import { useRouter, usePathname } from "next/navigation";

interface DocTypeLink {
  label: string;
  shortLabel: string;
  href: string;
}

const DOC_TYPE_LINKS: DocTypeLink[] = [
  { label: "Invoice", shortLabel: "Invoice", href: "/" },
  { label: "Quotation", shortLabel: "Quote", href: "/quotation" },
  { label: "Cash Sale", shortLabel: "Cash", href: "/cash-sale" },
  { label: "Delivery Note", shortLabel: "D.Note", href: "/delivery-note" },
  { label: "Purchase Order", shortLabel: "PO", href: "/purchase-order" },
  { label: "Receipt", shortLabel: "Receipt", href: "/receipt" },
];

// Track prefetched paths globally to avoid duplicate prefetches across instances
const prefetchedPaths = new Set<string>();

interface DocumentTypeSwitcherProps {
  /** Fallback label when pathname doesn't match any doc type */
  fallbackLabel?: string;
  /** "header" = horizontal pill bar, "sidebar" = dropdown select (default) */
  variant?: "header" | "sidebar";
}

export const DocumentTypeSwitcher = memo(function DocumentTypeSwitcher({
  fallbackLabel = "Invoice",
  variant = "sidebar",
}: DocumentTypeSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hasPrefetched = useRef(false);

  const currentType =
    DOC_TYPE_LINKS.find((dt) => dt.href === pathname)?.label || fallbackLabel;

  // Prefetch document routes once per session (not per mount)
  useEffect(() => {
    if (hasPrefetched.current) return;
    hasPrefetched.current = true;
    
    DOC_TYPE_LINKS.forEach((dt) => {
      if (dt.href !== pathname && !prefetchedPaths.has(dt.href)) {
        prefetchedPaths.add(dt.href);
        router.prefetch(dt.href);
      }
    });
  }, [pathname, router]);

  if (variant === "header") {
    return (
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1 py-0.5">
        {DOC_TYPE_LINKS.map((dt) => {
          const isActive = dt.label === currentType;
          return (
            <button
              key={dt.label}
              onClick={() => {
                if (dt.href !== pathname) router.push(dt.href);
              }}
              className={`
                whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all shrink-0
                sm:px-4 sm:py-2 sm:text-sm
                ${
                  isActive
                    ? "bg-lagoon text-white shadow-sm"
                    : "bg-mist/60 text-ink/50 hover:text-ink/70 hover:bg-mist active:bg-mist"
                }
              `}
            >
              <span className="sm:hidden">{dt.shortLabel}</span>
              <span className="hidden sm:inline">{dt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Sidebar variant: dropdown select
  return (
    <select
      value={currentType}
      onChange={(e) => {
        const selected = DOC_TYPE_LINKS.find((dt) => dt.label === e.target.value);
        if (selected?.href && selected.href !== pathname) {
          router.push(selected.href);
        }
      }}
      className="sidebar-select w-full"
    >
      {DOC_TYPE_LINKS.map((dt) => (
        <option key={dt.label} value={dt.label}>
          {dt.label}
        </option>
      ))}
    </select>
  );
});
