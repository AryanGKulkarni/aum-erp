"use client";

import { useState } from "react";
import Box from "@mui/joy/Box";
import Chip from "@mui/joy/Chip";
import Input from "@mui/joy/Input";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import Switch from "@mui/joy/Switch";
import Typography from "@mui/joy/Typography";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import MasterShell, { EditCell, NameCell, PanelField, initials } from "./MasterShell";
import { createUser, updateUser, type MasterUser } from "@/services/api_service";

const ROLES = ["Sales", "Engineering", "Costing", "Admin"] as const;

const ROLE_COLOR: Record<string, "primary" | "success" | "warning" | "neutral"> = {
  Sales: "primary",
  Engineering: "success",
  Costing: "warning",
  Admin: "neutral",
};

interface Draft {
  userId: number | null;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
}

function draftFrom(u: MasterUser): Draft {
  return {
    userId: u.userId,
    fullName: u.fullName,
    email: u.email ?? "",
    role: u.role,
    isActive: u.isActive,
  };
}

function emptyDraft(): Draft {
  return { userId: null, fullName: "", email: "", role: "Sales", isActive: true };
}

export default function UsersMaster({
  users,
  isLoading,
  onChanged,
}: {
  users: MasterUser[];
  isLoading: boolean;
  onChanged: () => Promise<void>;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const term = searchTerm.trim().toLowerCase();
  const filtered = term
    ? users.filter((u) =>
        [u.fullName, u.email, u.role].some((f) => f?.toLowerCase().includes(term)),
      )
    : users;

  function open(next: Draft) {
    setError(null);
    setDraft(next);
  }

  async function handleSave() {
    if (!draft) return;
    if (!draft.fullName.trim()) return setError("Full name is required");
    if (!draft.email.trim()) return setError("Email is required");

    setSaving(true);
    setError(null);
    try {
      if (draft.userId === null) {
        await createUser({ fullName: draft.fullName, email: draft.email, role: draft.role });
      } else {
        await updateUser(draft.userId, {
          fullName: draft.fullName,
          email: draft.email,
          role: draft.role,
          isActive: draft.isActive,
        });
      }
      await onChanged();
      setDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MasterShell
      searchPlaceholder="Search users..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      addLabel="Add User"
      onAdd={() => open(emptyDraft())}
      isLoading={isLoading}
      isEmpty={filtered.length === 0}
      emptyLabel={term ? "No matching users" : "No users yet"}
      panelTitle={draft?.userId === null ? "Add User" : "Edit User"}
      onClosePanel={() => setDraft(null)}
      onSave={handleSave}
      saving={saving}
      error={error}
      emptyPanelIcon={<PersonOutlineIcon style={{ fontSize: 34 }} />}
      emptyPanelTitle="No user selected"
      emptyPanelSubtitle="Select a row or add a new user."
      head={
        <thead>
          <tr>
            <th style={{ width: "26%" }}>Name</th>
            <th style={{ width: "27%" }}>Email</th>
            <th style={{ width: "16%" }}>Role</th>
            <th style={{ width: "14%" }}>Status</th>
            <th style={{ width: "13%" }}>Since</th>
            <th style={{ width: 52 }} aria-label="Actions" />
          </tr>
        </thead>
      }
      panel={
        draft && (
          <>
            <PanelField label="Full Name" required>
              <Input
                size="sm"
                value={draft.fullName}
                onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
              />
            </PanelField>
            <PanelField label="Email" required>
              <Input
                size="sm"
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </PanelField>
            <PanelField label="Role" required>
              <Select
                size="sm"
                value={draft.role}
                onChange={(_, v) => v && setDraft({ ...draft, role: v })}
              >
                {ROLES.map((r) => (
                  <Option key={r} value={r}>{r}</Option>
                ))}
              </Select>
            </PanelField>
            {/* New users are always created active; the backend has no isActive on create. */}
            {draft.userId !== null && (
              <PanelField label="Status">
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 1,
                    borderRadius: "sm",
                    border: "1px solid",
                    borderColor: draft.isActive ? "success.300" : "neutral.300",
                    backgroundColor: draft.isActive ? "success.50" : "neutral.50",
                  }}
                >
                  <Switch
                    size="sm"
                    color={draft.isActive ? "success" : "neutral"}
                    checked={draft.isActive}
                    onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                  />
                  <Typography level="body-sm" sx={{ color: draft.isActive ? "success.700" : "neutral.600" }}>
                    {draft.isActive ? "Active" : "Inactive"}
                  </Typography>
                </Box>
              </PanelField>
            )}
          </>
        )
      }
    >
      {filtered.map((u) => (
        <tr key={u.userId} data-selected={draft?.userId === u.userId}>
          <td>
            <NameCell label={u.fullName} avatar={initials(u.fullName)} />
          </td>
          <td>
            <Typography level="body-xs" sx={{ color: "neutral.500" }} noWrap>
              {u.email ?? "—"}
            </Typography>
          </td>
          <td>
            <Chip size="sm" variant="soft" color={ROLE_COLOR[u.role] ?? "neutral"}>
              {u.role}
            </Chip>
          </td>
          <td>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: u.isActive ? "success.400" : "neutral.300",
                }}
              />
              <Typography level="body-xs" sx={{ color: u.isActive ? "success.600" : "neutral.400" }}>
                {u.isActive ? "Active" : "Inactive"}
              </Typography>
            </Box>
          </td>
          <td>
            <Typography level="body-xs" sx={{ color: "neutral.400", fontFamily: "monospace" }}>
              {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-CA") : "—"}
            </Typography>
          </td>
          <td>
            <EditCell onClick={() => open(draftFrom(u))} />
          </td>
        </tr>
      ))}
    </MasterShell>
  );
}
