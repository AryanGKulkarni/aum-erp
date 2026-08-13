"use client";

import { useCallback, useEffect, useState } from "react";
import Box from "@mui/joy/Box";
import Chip from "@mui/joy/Chip";
import Typography from "@mui/joy/Typography";
import CircularProgress from "@mui/joy/CircularProgress";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import UsersMaster from "@/components/masters/UsersMaster";
import CustomersMaster from "@/components/masters/CustomersMaster";
import MachinesMaster from "@/components/masters/MachinesMaster";
import {
  getCurrentUser,
  getMasterUsers,
  getMasterCustomers,
  getMasterMachines,
  type CurrentUser,
  type MasterUser,
  type MasterCustomer,
  type MasterMachine,
} from "@/services/api_service";

type TabKey = "users" | "customers" | "machines";

const TABS: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
  { key: "users", label: "Users", icon: <PersonOutlineIcon style={{ fontSize: 17 }} /> },
  { key: "customers", label: "Customers", icon: <BusinessOutlinedIcon style={{ fontSize: 17 }} /> },
  { key: "machines", label: "Machines", icon: <SettingsOutlinedIcon style={{ fontSize: 17 }} /> },
];

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0, height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "background.surface" }}>
      {children}
    </Box>
  );
}

export default function MastersPage() {
  const [tab, setTab] = useState<TabKey>("users");

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [users, setUsers] = useState<MasterUser[]>([]);
  const [customers, setCustomers] = useState<MasterCustomer[]>([]);
  const [machines, setMachines] = useState<MasterMachine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .finally(() => setCheckingAccess(false));
  }, []);

  const isAdmin = currentUser?.role === "Admin";

  const load = useCallback(async () => {
    const [u, c, m] = await Promise.all([
      getMasterUsers(),
      getMasterCustomers(),
      getMasterMachines(),
    ]);
    setUsers(u);
    setCustomers(c);
    setMachines(m);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    void (async () => {
      try {
        await load();
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load master data");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAdmin, load]);

  if (checkingAccess) {
    return (
      <Shell>
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size="md" />
        </Box>
      </Shell>
    );
  }

  if (!isAdmin) {
    return (
      <Shell>
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography level="title-md">Access restricted</Typography>
          <Typography level="body-sm" sx={{ color: "neutral.500", mt: 0.5 }}>
            Only admins can manage master data.
          </Typography>
        </Box>
      </Shell>
    );
  }

  const counts: Record<TabKey, number> = {
    users: users.length,
    customers: customers.length,
    machines: machines.length,
  };

  return (
    <Shell>
      <Box sx={{ px: 3, pt: 3 }}>
        <Typography level="h4" sx={{ color: "primary.700" }}>Masters</Typography>
        <Typography level="body-sm" sx={{ color: "neutral.500", mt: 0.25 }}>
          Manage reference data used across the system
        </Typography>

        <Box sx={{ display: "flex", gap: 3, mt: 2.5, borderBottom: "1px solid", borderColor: "neutral.200" }}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <Box
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  pb: 1.25,
                  cursor: "pointer",
                  userSelect: "none",
                  borderBottom: "2px solid",
                  borderColor: active ? "primary.500" : "transparent",
                  color: active ? "primary.600" : "neutral.500",
                  "&:hover": { color: active ? "primary.600" : "neutral.700" },
                }}
              >
                {t.icon}
                <Typography level="body-sm" fontWeight={active ? "lg" : "md"} sx={{ color: "inherit" }}>
                  {t.label}
                </Typography>
                <Chip size="sm" variant="soft" color={active ? "primary" : "neutral"}>
                  {counts[t.key]}
                </Chip>
              </Box>
            );
          })}
        </Box>
      </Box>

      {loadError ? (
        <Typography level="body-sm" sx={{ color: "danger.500", px: 3, py: 4 }}>
          {loadError}
        </Typography>
      ) : tab === "users" ? (
        <UsersMaster users={users} isLoading={isLoading} onChanged={load} />
      ) : tab === "customers" ? (
        <CustomersMaster customers={customers} isLoading={isLoading} onChanged={load} />
      ) : (
        <MachinesMaster machines={machines} isLoading={isLoading} onChanged={load} />
      )}
    </Shell>
  );
}
