"use client";

import { useState } from "react";
import Box from "@mui/joy/Box";
import Chip from "@mui/joy/Chip";
import Input from "@mui/joy/Input";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import Typography from "@mui/joy/Typography";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import MasterShell, { EditCell, NameCell, NumCell, PanelField } from "./MasterShell";
import { createMachine, updateMachine, type MasterMachine } from "@/services/api_service";

const TYPES = [
  { value: "Press", label: "Press" },
  { value: "Drop_Hammer", label: "Drop Hammer" },
] as const;

const STATUSES = [
  { value: "Active", label: "Active" },
  { value: "Under_Maintenance", label: "Under Maintenance" },
  { value: "Idle", label: "Idle" },
] as const;

const TYPE_COLOR: Record<string, "primary" | "warning" | "neutral"> = {
  Press: "primary",
  Drop_Hammer: "warning",
};

const STATUS_COLOR: Record<string, "success" | "warning" | "neutral"> = {
  Active: "success",
  Under_Maintenance: "warning",
  Idle: "neutral",
};

/** Backend enums use underscores; screens show them spaced. */
function pretty(v: string): string {
  return v.replace(/_/g, " ");
}

function trimNum(v: string | null): string {
  if (v === null || v === "") return "—";
  const n = Number(v);
  return Number.isNaN(n) ? v : String(n);
}

interface Draft {
  machineId: number | null;
  machineName: string;
  machineType: string;
  capacityTons: string;
  availableHrsPerDay: string;
  workingDaysPerMonth: string;
  status: string;
}

function draftFrom(m: MasterMachine): Draft {
  return {
    machineId: m.machineId,
    machineName: m.machineName,
    machineType: m.machineType,
    capacityTons: m.capacityTons === null ? "" : String(Number(m.capacityTons)),
    availableHrsPerDay: m.availableHrsPerDay === null ? "" : String(Number(m.availableHrsPerDay)),
    workingDaysPerMonth: m.workingDaysPerMonth === null ? "" : String(m.workingDaysPerMonth),
    status: m.status,
  };
}

function emptyDraft(): Draft {
  return {
    machineId: null, machineName: "", machineType: "Press", capacityTons: "",
    availableHrsPerDay: "", workingDaysPerMonth: "", status: "Active",
  };
}

function numOrUndefined(v: string): number | undefined {
  const t = v.trim();
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isNaN(n) ? undefined : n;
}

export default function MachinesMaster({
  machines,
  isLoading,
  onChanged,
}: {
  machines: MasterMachine[];
  isLoading: boolean;
  onChanged: () => Promise<void>;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const term = searchTerm.trim().toLowerCase();
  const filtered = term
    ? machines.filter((m) =>
        [m.machineName, pretty(m.machineType), pretty(m.status)]
          .some((f) => f?.toLowerCase().includes(term)),
      )
    : machines;

  function open(next: Draft) {
    setError(null);
    setDraft(next);
  }

  // Mirrors the generated column so the panel can preview it before saving.
  const previewHrsPerMonth = (() => {
    if (!draft) return null;
    const perDay = numOrUndefined(draft.availableHrsPerDay);
    const days = numOrUndefined(draft.workingDaysPerMonth);
    if (perDay === undefined || days === undefined) return null;
    return (perDay * days).toFixed(2);
  })();

  async function handleSave() {
    if (!draft) return;
    if (!draft.machineName.trim()) return setError("Machine name is required");

    const dto = {
      machineName: draft.machineName,
      machineType: draft.machineType,
      capacityTons: numOrUndefined(draft.capacityTons),
      availableHrsPerDay: numOrUndefined(draft.availableHrsPerDay),
      workingDaysPerMonth: numOrUndefined(draft.workingDaysPerMonth),
      status: draft.status,
    };

    setSaving(true);
    setError(null);
    try {
      if (draft.machineId === null) {
        await createMachine(dto);
      } else {
        await updateMachine(draft.machineId, dto);
      }
      await onChanged();
      setDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save machine");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MasterShell
      searchPlaceholder="Search machines..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      addLabel="Add Machine"
      onAdd={() => open(emptyDraft())}
      isLoading={isLoading}
      isEmpty={filtered.length === 0}
      emptyLabel={term ? "No matching machines" : "No machines yet"}
      panelTitle={draft?.machineId === null ? "Add Machine" : "Edit Machine"}
      onClosePanel={() => setDraft(null)}
      onSave={handleSave}
      saving={saving}
      error={error}
      emptyPanelIcon={<PrecisionManufacturingOutlinedIcon style={{ fontSize: 34 }} />}
      emptyPanelTitle="No machine selected"
      emptyPanelSubtitle="Select a row or add a new machine."
      head={
        <thead>
          <tr>
            <th style={{ width: "24%" }}>Machine</th>
            <th style={{ width: "16%" }}>Type</th>
            <th style={{ width: "12%" }}>Capacity</th>
            <th style={{ width: "10%" }}>Hrs / Day</th>
            <th style={{ width: "11%" }}>Days / Mo.</th>
            <th style={{ width: "11%" }}>Hrs / Mo.</th>
            <th style={{ width: "16%" }}>Status</th>
            <th style={{ width: 52 }} aria-label="Actions" />
          </tr>
        </thead>
      }
      panel={
        draft && (
          <>
            <PanelField label="Machine Name" required>
              <Input
                size="sm"
                value={draft.machineName}
                onChange={(e) => setDraft({ ...draft, machineName: e.target.value })}
              />
            </PanelField>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <PanelField label="Type" required>
                <Select
                  size="sm"
                  value={draft.machineType}
                  onChange={(_, v) => v && setDraft({ ...draft, machineType: v })}
                >
                  {TYPES.map((t) => (
                    <Option key={t.value} value={t.value}>{t.label}</Option>
                  ))}
                </Select>
              </PanelField>
              <PanelField label="Capacity (Tons)">
                <Input
                  size="sm"
                  type="number"
                  value={draft.capacityTons}
                  onChange={(e) => setDraft({ ...draft, capacityTons: e.target.value })}
                />
              </PanelField>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <PanelField label="Hrs / Day">
                <Input
                  size="sm"
                  type="number"
                  value={draft.availableHrsPerDay}
                  onChange={(e) => setDraft({ ...draft, availableHrsPerDay: e.target.value })}
                />
              </PanelField>
              <PanelField label="Days / Month">
                <Input
                  size="sm"
                  type="number"
                  value={draft.workingDaysPerMonth}
                  onChange={(e) => setDraft({ ...draft, workingDaysPerMonth: e.target.value })}
                />
              </PanelField>
            </Box>
            {/* Computed by Postgres on save; shown here as a preview only. */}
            <PanelField label="Hrs / Month" auto>
              <Input
                size="sm"
                readOnly
                value={previewHrsPerMonth ?? "—"}
                sx={{ backgroundColor: "primary.50", color: "primary.600" }}
              />
            </PanelField>
            <PanelField label="Status">
              <Select
                size="sm"
                value={draft.status}
                onChange={(_, v) => v && setDraft({ ...draft, status: v })}
              >
                {STATUSES.map((s) => (
                  <Option key={s.value} value={s.value}>{s.label}</Option>
                ))}
              </Select>
            </PanelField>
          </>
        )
      }
    >
      {filtered.map((m) => (
        <tr key={m.machineId} data-selected={draft?.machineId === m.machineId}>
          <td>
            <NameCell
              label={m.machineName}
              icon={<PrecisionManufacturingOutlinedIcon style={{ fontSize: 18 }} />}
            />
          </td>
          <td>
            <Chip size="sm" variant="soft" color={TYPE_COLOR[m.machineType] ?? "neutral"}>
              {pretty(m.machineType)}
            </Chip>
          </td>
          <td><NumCell value={trimNum(m.capacityTons)} unit="T" /></td>
          <td><NumCell value={trimNum(m.availableHrsPerDay)} /></td>
          <td><NumCell value={m.workingDaysPerMonth ?? "—"} /></td>
          <td>
            <Typography level="body-xs" sx={{ fontFamily: "monospace", color: "primary.600" }}>
              {m.availableHrsPerMonth === null ? "—" : Number(m.availableHrsPerMonth).toFixed(2)}
            </Typography>
          </td>
          <td>
            <Chip size="sm" variant="soft" color={STATUS_COLOR[m.status] ?? "neutral"}>
              {pretty(m.status)}
            </Chip>
          </td>
          <td>
            <EditCell onClick={() => open(draftFrom(m))} />
          </td>
        </tr>
      ))}
    </MasterShell>
  );
}
