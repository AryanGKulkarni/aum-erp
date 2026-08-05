"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/joy/Box";
import Avatar from "@mui/joy/Avatar";
import Typography from "@mui/joy/Typography";
import IconButton from "@mui/joy/IconButton";
import Tooltip from "@mui/joy/Tooltip";
import LogoutIcon from "@mui/icons-material/Logout";
import { FooterSection } from "./Sidebar.styles";
import { getCurrentUser, logout, type CurrentUser } from "@/services/api_service";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UserFooter() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      router.push("/login");
    }
  }

  const displayName = loading ? "…" : (user?.fullName ?? "Guest");
  const displayRole = loading ? "" : (user?.role ?? "Not signed in");

  return (
    <FooterSection>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar size="sm" color="primary" variant="solid">
          {!loading && user ? initials(user.fullName) : "?"}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            level="title-sm"
            sx={{ color: "neutral.100", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {displayName}
          </Typography>
          <Typography level="body-xs" sx={{ color: "neutral.400" }}>
            {displayRole}
          </Typography>
        </Box>
        {user && (
          <Tooltip title="Log out" size="sm">
            <IconButton
              size="sm"
              variant="plain"
              color="neutral"
              loading={loggingOut}
              onClick={handleLogout}
              sx={{ color: "neutral.400", "&:hover": { color: "neutral.100", backgroundColor: "neutral.800" } }}
            >
              <LogoutIcon style={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </FooterSection>
  );
}
