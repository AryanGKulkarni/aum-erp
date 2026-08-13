"use client";
import { styled } from "@mui/joy/styles";
import Sheet from "@mui/joy/Sheet";
import Box from "@mui/joy/Box";

export const SIDEBAR_WIDTH = 260;
export const SIDEBAR_COLLAPSED_WIDTH = 64;

export const SidebarContainer = styled(Sheet, {
  shouldForwardProp: (prop) => prop !== "collapsed",
})<{ collapsed?: boolean }>(({ theme, collapsed }) => ({
  width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  overflow: "hidden",
  backgroundColor: theme.palette.neutral[900] ?? "#0f172a",
  borderRight: `1px solid ${theme.palette.neutral.outlinedBorder}`,
  flexShrink: 0,
  transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
}));

export const BrandSection = styled(Box, {
  shouldForwardProp: (prop) => prop !== "collapsed",
})<{ collapsed?: boolean }>(({ theme, collapsed }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  padding: collapsed ? theme.spacing(2, 1.5) : theme.spacing(2.5),
}));

export const NavSection = styled(Box, {
  shouldForwardProp: (prop) => prop !== "collapsed",
})<{ collapsed?: boolean }>(({ theme, collapsed }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
  padding: collapsed ? theme.spacing(1, 0.5) : theme.spacing(1.5),
}));

export const FooterSection = styled(Box, {
  shouldForwardProp: (prop) => prop !== "collapsed",
})<{ collapsed?: boolean }>(({ theme, collapsed }) => ({
  borderTop: `1px solid ${theme.palette.neutral.outlinedBorder}`,
  padding: collapsed ? theme.spacing(1.5, 0.5) : theme.spacing(1.5),
}));
