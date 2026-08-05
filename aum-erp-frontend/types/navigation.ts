import type { SvgIconComponent } from "@mui/icons-material";

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: SvgIconComponent;
  badge: number | null;
  adminOnly?: boolean;
}
