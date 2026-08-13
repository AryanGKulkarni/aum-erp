"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Input from "@mui/joy/Input";
import CircularProgress from "@mui/joy/CircularProgress";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import StatusBadge from "@/components/ui/StatusBadge";

export const LIST_PANE_WIDTH = 280;

export interface ListPaneItem {
  id: string;
  href: string;
  /** Primary identifier, e.g. "ENQ-2026-047". */
  primary: string;
  /** Secondary line, e.g. the customer name. */
  secondary?: string;
  /** Muted third line, e.g. "2026-06-13 · 2 parts". */
  meta?: string;
  /** Rendered as a status chip in the top-right of the row. */
  status?: string;
}

interface ListPaneProps {
  title: string;
  items: ListPaneItem[];
  isLoading: boolean;
  searchPlaceholder?: string;
  /** Omit to hide the "New" button (e.g. quotations are generated, not created). */
  newHref?: string;
  emptyLabel?: string;
}

export default function ListPane({
  title,
  items,
  isLoading,
  searchPlaceholder = "Search...",
  newHref,
  emptyLabel = "No records",
}: ListPaneProps) {
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState("");

  const term = searchTerm.trim().toLowerCase();
  const filtered = term
    ? items.filter((item) =>
        [item.primary, item.secondary, item.meta, item.status]
          .some((field) => field?.toLowerCase().includes(term)),
      )
    : items;

  return (
    <Box
      sx={{
        width: LIST_PANE_WIDTH,
        flexShrink: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.surface",
        borderRight: "1px solid",
        borderColor: "neutral.200",
      }}
    >
      <Box sx={{ px: 1.5, pt: 1.5, pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <Typography
            level="body-xs"
            fontWeight="lg"
            sx={{ letterSpacing: "0.08em", color: "neutral.600", flex: 1 }}
          >
            {title.toUpperCase()}
          </Typography>
          <Typography level="body-xs" sx={{ color: "neutral.400" }}>
            {items.length}
          </Typography>
          {newHref && (
            <Button component={Link} href={newHref} size="sm" startDecorator={<AddIcon />}>
              New
            </Button>
          )}
        </Box>

        <Input
          size="sm"
          placeholder={searchPlaceholder}
          startDecorator={<SearchIcon />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size="sm" />
          </Box>
        ) : filtered.length === 0 ? (
          <Typography level="body-sm" sx={{ color: "neutral.400", textAlign: "center", py: 4 }}>
            {term ? "No matches" : emptyLabel}
          </Typography>
        ) : (
          filtered.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Box
                key={item.id}
                component={Link}
                href={item.href}
                sx={{
                  display: "block",
                  px: 1.5,
                  py: 1.25,
                  textDecoration: "none",
                  borderBottom: "1px solid",
                  borderColor: "neutral.100",
                  borderLeft: "3px solid",
                  borderLeftColor: isActive ? "primary.500" : "transparent",
                  backgroundColor: isActive ? "primary.50" : "transparent",
                  "&:hover": { backgroundColor: isActive ? "primary.50" : "neutral.50" },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <Typography
                    level="body-xs"
                    fontWeight="lg"
                    sx={{ color: "primary.700", flex: 1, fontFamily: "monospace" }}
                    noWrap
                  >
                    {item.primary}
                  </Typography>
                  {item.status && <StatusBadge status={item.status} />}
                </Box>
                {item.secondary && (
                  <Typography level="body-sm" fontWeight="lg" noWrap sx={{ mt: 0.25 }}>
                    {item.secondary}
                  </Typography>
                )}
                {item.meta && (
                  <Typography level="body-xs" sx={{ color: "neutral.500" }} noWrap>
                    {item.meta}
                  </Typography>
                )}
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
