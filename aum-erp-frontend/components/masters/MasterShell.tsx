"use client";

import Box from "@mui/joy/Box";
import Table from "@mui/joy/Table";
import Input from "@mui/joy/Input";
import Button from "@mui/joy/Button";
import Typography from "@mui/joy/Typography";
import IconButton from "@mui/joy/IconButton";
import Avatar from "@mui/joy/Avatar";
import CircularProgress from "@mui/joy/CircularProgress";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

export const PANEL_WIDTH = 340;

/** Two-letter initials for the avatar in the first column. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function NameCell({
  label,
  avatar,
  icon,
}: {
  label: string;
  avatar?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      {icon ? (
        <Box sx={{ color: "primary.500", display: "flex" }}>{icon}</Box>
      ) : (
        <Avatar size="sm" variant="soft" color="primary" sx={{ "--Avatar-size": "26px", fontSize: 11 }}>
          {avatar}
        </Avatar>
      )}
      <Typography level="body-sm" fontWeight="lg" noWrap>
        {label}
      </Typography>
    </Box>
  );
}

/** Monospaced numeric cell, optionally with a muted trailing unit. */
export function NumCell({ value, unit }: { value: React.ReactNode; unit?: string }) {
  return (
    <Typography level="body-xs" sx={{ fontFamily: "monospace" }}>
      {value}
      {unit ? <Typography component="span" sx={{ color: "neutral.400" }}>{` ${unit}`}</Typography> : null}
    </Typography>
  );
}

export function EditCell({ onClick }: { onClick: () => void }) {
  return (
    <IconButton size="sm" variant="plain" color="neutral" onClick={onClick} aria-label="Edit">
      <EditOutlinedIcon style={{ fontSize: 16 }} />
    </IconButton>
  );
}

/** Label + control pair used throughout the edit panel. */
export function PanelField({
  label,
  required,
  auto,
  children,
}: {
  label: string;
  required?: boolean;
  auto?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography level="body-xs" sx={{ mb: 0.5, color: "neutral.600", fontWeight: 500 }}>
        {label}
        {required && <Typography component="span" sx={{ color: "danger.500" }}> *</Typography>}
        {auto && <Typography component="span" sx={{ color: "neutral.400" }}> (auto)</Typography>}
      </Typography>
      {children}
    </Box>
  );
}

interface MasterShellProps {
  searchPlaceholder: string;
  searchTerm: string;
  onSearchChange: (v: string) => void;
  addLabel: string;
  onAdd: () => void;
  isLoading: boolean;
  /** Table head row. */
  head: React.ReactNode;
  /** Table body rows. */
  children: React.ReactNode;
  emptyLabel: string;
  isEmpty: boolean;
  /** Edit/add form; when null the panel shows its empty state instead. */
  panelTitle?: string;
  panel?: React.ReactNode;
  onClosePanel: () => void;
  onSave: () => void;
  saving?: boolean;
  error?: string | null;
  /** Shown in the panel while nothing is selected. */
  emptyPanelIcon: React.ReactNode;
  emptyPanelTitle: string;
  emptyPanelSubtitle: string;
}

export default function MasterShell({
  searchPlaceholder,
  searchTerm,
  onSearchChange,
  addLabel,
  onAdd,
  isLoading,
  head,
  children,
  emptyLabel,
  isEmpty,
  panelTitle,
  panel,
  onClosePanel,
  onSave,
  saving,
  error,
  emptyPanelIcon,
  emptyPanelTitle,
  emptyPanelSubtitle,
}: MasterShellProps) {
  return (
    <Box sx={{ flex: 1, display: "flex", minHeight: 0 }}>
      {/* ── Table side ── */}
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", gap: 1.5, px: 3, py: 2 }}>
          <Input
            size="sm"
            placeholder={searchPlaceholder}
            startDecorator={<SearchIcon />}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Button size="sm" startDecorator={<AddIcon />} onClick={onAdd}>
            {addLabel}
          </Button>
        </Box>

        <Box sx={{ flex: 1, overflow: "auto" }}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size="sm" />
            </Box>
          ) : isEmpty ? (
            <Typography level="body-sm" sx={{ color: "neutral.400", textAlign: "center", py: 6 }}>
              {emptyLabel}
            </Typography>
          ) : (
            <Table
              hoverRow
              stickyHeader
              sx={{
                "--TableCell-paddingY": "10px",
                "--TableCell-paddingX": "16px",
                "& thead th": {
                  backgroundColor: "background.surface",
                  fontWeight: 500,
                  color: "neutral.500",
                  fontSize: "0.8rem",
                },
                "& tbody tr[data-selected='true']": { backgroundColor: "primary.50" },
              }}
            >
              {head}
              <tbody>{children}</tbody>
            </Table>
          )}
        </Box>
      </Box>

      {/* ── Edit panel — always present; shows an empty state until a row is picked ── */}
      <Box
        sx={{
          width: PANEL_WIDTH,
          flexShrink: 0,
          borderLeft: "1px solid",
          borderColor: "neutral.200",
          backgroundColor: "background.surface",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {panel ? (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                px: 2.5,
                py: 1.75,
                borderBottom: "1px solid",
                borderColor: "neutral.100",
              }}
            >
              <Typography level="title-sm" sx={{ flex: 1 }}>
                {panelTitle}
              </Typography>
              <IconButton size="sm" variant="plain" color="neutral" onClick={onClosePanel} aria-label="Close">
                <CloseIcon style={{ fontSize: 18 }} />
              </IconButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2, display: "flex", flexDirection: "column", gap: 2 }}>
              {panel}

              {error && (
                <Typography level="body-xs" sx={{ color: "danger.500" }}>
                  {error}
                </Typography>
              )}

              <Button
                onClick={onSave}
                loading={saving}
                startDecorator={<SaveOutlinedIcon style={{ fontSize: 16 }} />}
                sx={{ mt: 0.5 }}
              >
                Save Changes
              </Button>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              px: 3,
              textAlign: "center",
            }}
          >
            <Box sx={{ color: "neutral.300", display: "flex", mb: 1.25 }}>{emptyPanelIcon}</Box>
            <Typography level="body-sm" fontWeight="lg" sx={{ color: "primary.400" }}>
              {emptyPanelTitle}
            </Typography>
            <Typography level="body-xs" sx={{ color: "neutral.400", mt: 0.5 }}>
              {emptyPanelSubtitle}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
