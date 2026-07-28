import Chip from "@mui/joy/Chip";
import type { ColorPaletteProp } from "@mui/joy/styles";

interface StatusBadgeProps {
  status: string;
}

const STATUS_COLOR_MAP: Record<string, ColorPaletteProp> = {
  Feasibility: "primary",
  Quoted: "primary",
  Won: "success",
  Approved: "success",
  Generated: "success",
  Accepted: "success",
  Pending: "warning",
  Conditional: "warning",
  Draft: "warning",
  Revised: "warning",
  Sent: "primary",
  Lost: "danger",
  Rejected: "danger",
  OK: "success",
  Tight: "warning",
  Exceeds: "danger",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const color = STATUS_COLOR_MAP[status] ?? "neutral";

  return (
    <Chip size="sm" variant="soft" color={color}>
      {status}
    </Chip>
  );
}
