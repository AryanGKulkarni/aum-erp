"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Box from "@mui/joy/Box";
import ListPane, { type ListPaneItem } from "@/components/layout/ListPane";
import { getQuotations } from "@/services/api_service";
import type { Quotation } from "@/types/entities";

export default function QuotationsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // This layout persists across navigation within /quotations, so the list is
  // reloaded on each route change to pick up status changes made in the detail pane.
  useEffect(() => {
    let cancelled = false;
    getQuotations()
      .then((data) => { if (!cancelled) setQuotations(data); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [pathname]);

  const items: ListPaneItem[] = quotations.map((q) => ({
    id: q.id,
    href: `/quotations/${q.id}`,
    primary: q.quotationNo,
    secondary: q.customer,
    meta: `${q.date} · ${q.parts} part${q.parts !== 1 ? "s" : ""}`,
    status: q.status,
  }));

  return (
    <>
      {/* Quotations are generated from a feasibility study, so there is no "New" action. */}
      <ListPane
        title="Quotations"
        items={items}
        isLoading={isLoading}
        searchPlaceholder="Search quotations..."
        emptyLabel="No quotations yet"
      />
      <Box sx={{ flex: 1, minWidth: 0, height: "100vh", overflowY: "auto", p: 4 }}>
        {children}
      </Box>
    </>
  );
}
