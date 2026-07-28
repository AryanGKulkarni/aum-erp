"use client";

import Table from "@mui/joy/Table";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Link from "@mui/joy/Link";
import Button from "@mui/joy/Button";
import CircularProgress from "@mui/joy/CircularProgress";
import StatusBadge from "./StatusBadge";
import type { DataTableProps } from "@/types/table";

export default function DataTable<T extends object>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No records found.",
  getRowKey,
  onRowAction,
  rowActionLabel = "Open →",
  onCellAction,
  isCellLoading,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size="md" />
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography level="body-md" sx={{ color: "neutral.500" }}>
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Table
      stickyHeader
      hoverRow
      sx={{
        "--TableCell-paddingY": "12px",
        "--TableCell-paddingX": "16px",
        backgroundColor: "background.surface",
      }}
    >
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={String(col.key)}
              style={{ textAlign: col.align ?? "center" }}
            >
              {col.header}
            </th>
          ))}
          {onRowAction ? <th style={{ textAlign: "right" }} /> : null}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={getRowKey(row)}>
            {columns.map((col) => {
              const value = (row as Record<keyof T, unknown>)[col.key];
              const strValue = String(value);

              let cell: React.ReactNode;
              if (col.type === "button") {
                if (strValue !== "Generate") {
                  cell = <StatusBadge status={strValue} />;
                } else if (isCellLoading?.(row, col.key)) {
                  cell = <CircularProgress size="sm" />;
                } else {
                  cell = (
                    <Button
                      size="sm"
                      variant="solid"
                      color="primary"
                      onClick={() => onCellAction?.(row, col.key)}
                    >
                      Generate
                    </Button>
                  );
                }
              } else if (col.type === "badge") {
                cell = <StatusBadge status={strValue} />;
              } else {
                cell = strValue;
              }

              return (
                <td
                  key={String(col.key)}
                  style={{ textAlign: col.align ?? "center" }}
                >
                  {cell}
                </td>
              );
            })}
            {onRowAction ? (
              <td>
                <Link
                  component="button"
                  onClick={() => onRowAction(row)}
                  level="body-sm"
                  fontWeight="md"
                >
                  {rowActionLabel}
                </Link>
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
