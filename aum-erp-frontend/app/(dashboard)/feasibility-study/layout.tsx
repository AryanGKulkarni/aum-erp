"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Box from "@mui/joy/Box";
import ListPane, { type ListPaneItem } from "@/components/layout/ListPane";
import { getFeasibilityStudies } from "@/services/api_service";
import type { FeasibilityStudy } from "@/types/entities";

export default function FeasibilityStudyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [studies, setStudies] = useState<FeasibilityStudy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // This layout persists across navigation within /feasibility-study, so the list
  // is reloaded on each route change to pick up records the detail pane just saved.
  useEffect(() => {
    let cancelled = false;
    getFeasibilityStudies()
      .then((data) => { if (!cancelled) setStudies(data); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [pathname]);

  const items: ListPaneItem[] = studies.map((s) => ({
    id: s.id,
    href: `/feasibility-study/${s.id}`,
    primary: s.studyCode,
    secondary: s.enquiryNo,
    meta: `${s.assessmentDate} · ${s.parts} part${s.parts !== 1 ? "s" : ""}`,
    status: s.status,
  }));

  return (
    <>
      <ListPane
        title="Studies"
        items={items}
        isLoading={isLoading}
        searchPlaceholder="Search studies..."
        newHref="/feasibility-study/new"
        emptyLabel="No studies yet"
      />
      <Box sx={{ flex: 1, minWidth: 0, height: "100vh", overflowY: "auto", p: 4 }}>
        {children}
      </Box>
    </>
  );
}
