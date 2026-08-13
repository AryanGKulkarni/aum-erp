"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import List from "@mui/joy/List";
import Typography from "@mui/joy/Typography";
import Box from "@mui/joy/Box";
import Tooltip from "@mui/joy/Tooltip";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { NAV_ITEMS } from "@/constants/navigation";
import SidebarItem from "./SidebarItem";
import UserFooter from "./UserFooter";
import { SidebarContainer, BrandSection, NavSection } from "./Sidebar.styles";
import { getCurrentUser } from "@/services/api_service";

const COLLAPSED_KEY = "aum-erp:sidebar-collapsed";

// The collapse preference lives in localStorage rather than React state so it
// survives reloads. Reading it through useSyncExternalStore keeps the server
// render (always expanded) consistent with hydration.
const listeners = new Set<() => void>();

function subscribeCollapsed(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getCollapsed() {
  return localStorage.getItem(COLLAPSED_KEY) === "1";
}

function getCollapsedOnServer() {
  return false;
}

function storeCollapsed(value: boolean) {
  localStorage.setItem(COLLAPSED_KEY, value ? "1" : "0");
  listeners.forEach((listener) => listener());
}

export default function Sidebar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const collapsed = useSyncExternalStore(subscribeCollapsed, getCollapsed, getCollapsedOnServer);

  useEffect(() => {
    getCurrentUser().then((user) => setIsAdmin(user?.role === "Admin"));
  }, []);

  const navItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <SidebarContainer variant="plain" collapsed={collapsed}>
      <Box>
        <BrandSection collapsed={collapsed}>
          <Box
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: "sm",
              backgroundColor: "primary.500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "common.white",
              fontWeight: "lg",
              fontSize: "sm",
            }}
          >
            {collapsed ? "A" : "ERP"}
          </Box>
          {!collapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography level="title-sm" sx={{ color: "neutral.100" }} noWrap>
                AUM ERP
              </Typography>
              <Typography level="body-xs" sx={{ color: "neutral.500" }}>
                v1.0.0
              </Typography>
            </Box>
          )}
        </BrandSection>

        <NavSection collapsed={collapsed}>
          {!collapsed && (
            <Typography
              level="body-xs"
              sx={{ color: "neutral.500", letterSpacing: "0.08em", px: 1, mb: 0.5 }}
            >
              MAIN MENU
            </Typography>
          )}
          <List size="sm" sx={{ "--ListItem-paddingY": "8px" }}>
            {navItems.map((item) => (
              <SidebarItem key={item.key} item={item} collapsed={collapsed} />
            ))}
          </List>
        </NavSection>
      </Box>

      <Box>
        <UserFooter collapsed={collapsed} />
        <Box
          onClick={() => storeCollapsed(!collapsed)}
          role="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
            py: 1.25,
            cursor: "pointer",
            userSelect: "none",
            color: "neutral.500",
            borderTop: "1px solid",
            borderColor: "neutral.outlinedBorder",
            "&:hover": { color: "neutral.100", backgroundColor: "neutral.800" },
          }}
        >
          <Tooltip title={collapsed ? "Expand" : ""} placement="right" size="sm">
            {collapsed ? (
              <ChevronRightIcon style={{ fontSize: 18 }} />
            ) : (
              <ChevronLeftIcon style={{ fontSize: 18 }} />
            )}
          </Tooltip>
          {!collapsed && <Typography level="body-xs" sx={{ color: "inherit" }}>Collapse</Typography>}
        </Box>
      </Box>
    </SidebarContainer>
  );
}
