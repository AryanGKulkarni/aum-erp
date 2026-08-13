"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import ListItemContent from "@mui/joy/ListItemContent";
import Chip from "@mui/joy/Chip";
import Tooltip from "@mui/joy/Tooltip";
import Box from "@mui/joy/Box";
import type { NavItem } from "@/types/navigation";

interface SidebarItemProps {
  item: NavItem;
  collapsed?: boolean;
}

export default function SidebarItem({ item, collapsed }: SidebarItemProps) {
  const pathname = usePathname();
  // Sub-routes (/enquiries/12, /enquiries/new) keep their section highlighted.
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  const button = (
    <ListItemButton
      component={Link}
      href={item.href}
      selected={isActive}
      color={isActive ? "primary" : "neutral"}
      variant={isActive ? "soft" : "plain"}
      sx={{
        borderRadius: "sm",
        color: isActive ? undefined : "neutral.300",
        "&:hover": { backgroundColor: "neutral.800" },
        marginBottom: "0.3rem",
        ...(collapsed && { justifyContent: "center", px: 0 }),
      }}
    >
      <ListItemDecorator
        sx={{ color: "inherit", ...(collapsed && { minInlineSize: "auto", position: "relative" }) }}
      >
        <Icon fontSize="small" />
        {collapsed && item.badge ? (
          <Box
            sx={{
              position: "absolute",
              top: -2,
              right: -4,
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: "primary.400",
            }}
          />
        ) : null}
      </ListItemDecorator>
      {!collapsed && (
        <>
          <ListItemContent>{item.label}</ListItemContent>
          {item.badge ? (
            <Chip size="sm" variant="solid" color="primary">
              {item.badge}
            </Chip>
          ) : null}
        </>
      )}
    </ListItemButton>
  );

  return (
    <ListItem>
      {collapsed ? (
        <Tooltip title={item.label} placement="right" size="sm">
          {button}
        </Tooltip>
      ) : (
        button
      )}
    </ListItem>
  );
}
