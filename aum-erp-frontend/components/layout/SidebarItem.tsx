"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import ListItemContent from "@mui/joy/ListItemContent";
import Chip from "@mui/joy/Chip";
import type { NavItem } from "@/types/navigation";

interface SidebarItemProps {
  item: NavItem;
}

export default function SidebarItem({ item }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const Icon = item.icon;

  return (
    <ListItem>
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
        }}
      >
        <ListItemDecorator sx={{ color: "inherit" }}>
          <Icon fontSize="small" />
        </ListItemDecorator>
        <ListItemContent>{item.label}</ListItemContent>
        {item.badge ? (
          <Chip size="sm" variant="solid" color="primary">
            {item.badge}
          </Chip>
        ) : null}
      </ListItemButton>
    </ListItem>
  );
}
