"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Box from "@mui/joy/Box";
import ListPane, { type ListPaneItem } from "@/components/layout/ListPane";
import { getEnquiries } from "@/services/api_service";
import type { Enquiry } from "@/types/entities";

export default function EnquiriesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // This layout persists across navigation within /enquiries, so the list is
  // reloaded on each route change to pick up records the detail pane just saved.
  useEffect(() => {
    let cancelled = false;
    getEnquiries()
      .then((data) => { if (!cancelled) setEnquiries(data); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [pathname]);

  const items: ListPaneItem[] = enquiries.map((e) => ({
    id: e.id,
    href: `/enquiries/${e.id}`,
    primary: e.enquiryNo,
    secondary: e.customer,
    meta: `${e.date} · ${e.parts} part${e.parts !== 1 ? "s" : ""}`,
    status: e.status,
  }));

  return (
    <>
      <ListPane
        title="Enquiries"
        items={items}
        isLoading={isLoading}
        searchPlaceholder="Search enquiries..."
        newHref="/enquiries/new"
        emptyLabel="No enquiries yet"
      />
      <Box sx={{ flex: 1, minWidth: 0, height: "100vh", overflowY: "auto", p: 4 }}>
        {children}
      </Box>
    </>
  );
}
