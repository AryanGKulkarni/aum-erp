"use client";
import { styled } from "@mui/joy/styles";
import Sheet from "@mui/joy/Sheet";
import Box from "@mui/joy/Box";

export const SidebarContainer = styled(Sheet)(({ theme }) => ({
  width: 260,
  height: "100vh",
  position: "sticky",
  top: 0,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  backgroundColor: theme.palette.neutral[900] ?? "#0f172a",
  borderRight: `1px solid ${theme.palette.neutral.outlinedBorder}`,
  flexShrink: 0,
}));

export const BrandSection = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  padding: theme.spacing(2.5),
}));

export const NavSection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
  padding: theme.spacing(1.5),
}));

export const FooterSection = styled(Box)(({ theme }) => ({
  borderTop: `1px solid ${theme.palette.neutral.outlinedBorder}`,
  padding: theme.spacing(1.5),
}));
