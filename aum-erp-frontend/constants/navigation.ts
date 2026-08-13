import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import RequestQuoteRoundedIcon from "@mui/icons-material/RequestQuoteRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import type { NavItem } from "@/types/navigation";

export const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: DashboardRoundedIcon,
    badge: null,
  },
  {
    key: "enquiries",
    label: "Enquiries",
    href: "/enquiries",
    icon: DescriptionRoundedIcon,
    badge: 3,
  },
  {
    key: "feasibility-study",
    label: "Feasibility Study",
    href: "/feasibility-study",
    icon: ScienceRoundedIcon,
    badge: 1,
  },
  {
    key: "quotations",
    label: "Quotations",
    href: "/quotations",
    icon: RequestQuoteRoundedIcon,
    badge: 2,
  },
  {
    key: "masters",
    label: "Masters",
    href: "/masters",
    icon: StorageRoundedIcon,
    badge: null,
    adminOnly: true,
  },
];
