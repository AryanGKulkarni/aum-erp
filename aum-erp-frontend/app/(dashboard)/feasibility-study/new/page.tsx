"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/joy/Box";
import Chip from "@mui/joy/Chip";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Input from "@mui/joy/Input";
import Textarea from "@mui/joy/Textarea";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import ToggleButtonGroup from "@mui/joy/ToggleButtonGroup";
import Divider from "@mui/joy/Divider";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { createFeasibilityStudy } from "@/services/api_service";

// ── helpers ───────────────────────────────────────────────────────────────────

function n(v: string): number | undefined {
  const p = parseFloat(v);
  return isNaN(p) ? undefined : p;
}

function fmt(v: number | null): string {
  if (v === null || v === 0) return "—";
  return v.toFixed(2);
}

// ── SectionCard ───────────────────────────────────────────────────────────────

function SectionCard({
  index,
  title,
  badge,
  open,
  onToggle,
  children,
}: {
  index: number;
  title: string;
  badge?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        mb: 2,
        border: "1px solid",
        borderColor: "neutral.200",
        borderRadius: "lg",
        overflow: "hidden",
        backgroundColor: "background.surface",
      }}
    >
      <Box
        onClick={onToggle}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2.5,
          py: 1.5,
          cursor: "pointer",
          backgroundColor: "primary.softBg",
          userSelect: "none",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {open ? (
            <ExpandLessIcon fontSize="small" />
          ) : (
            <ExpandMoreIcon fontSize="small" />
          )}
          <Typography level="title-md">
            {index} — {title}
          </Typography>
        </Box>
        {badge}
      </Box>

      {open && <Box sx={{ p: 3 }}>{children}</Box>}
    </Box>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function SubSectionCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "neutral.200",
        borderRadius: "md",
        backgroundColor: "neutral.50",
        p: 2,
        mb: 2,
      }}
    >
      <Typography
        level="body-xs"
        fontWeight="lg"
        sx={{ letterSpacing: "0.08em", color: "neutral.500", mb: 2 }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function SubSectionLabel({ label }: { label: string }) {
  return (
    <Typography
      level="body-xs"
      fontWeight="lg"
      sx={{ letterSpacing: "0.08em", color: "neutral.500", mb: 2, mt: 1 }}
    >
      {label}
    </Typography>
  );
}


function Field({
  label,
  auto,
  required,
  children,
  span,
}: {
  label: string;
  auto?: boolean;
  required?: boolean;
  children: React.ReactNode;
  span?: number;
}) {
  return (
    <Box sx={span ? { gridColumn: `span ${span}` } : {}}>
      <Typography level="body-xs" sx={{ mb: 0.5, color: "neutral.600", fontWeight: 500 }}>
        {label}
        {required && (
          <Typography component="span" sx={{ color: "danger.500" }}> *</Typography>
        )}
        {auto && (
          <Typography component="span" sx={{ color: "primary.500", fontWeight: 600 }}> (auto)</Typography>
        )}
      </Typography>
      {children}
    </Box>
  );
}

// ── FileDropZone ──────────────────────────────────────────────────────────────

function FileDropZone({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function addFiles(list: FileList | null) {
    if (!list) return;
    onChange([...files, ...Array.from(list)]);
  }

  function remove(idx: number) {
    onChange(files.filter((_, i) => i !== idx));
  }

  return (
    <Box>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.dxf,.dwg,.png,.jpg,.jpeg"
        style={{ display: "none" }}
        onChange={(e) => addFiles(e.target.files)}
      />

      <Box
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        sx={{
          border: "2px dashed",
          borderColor: dragging ? "primary.400" : "neutral.300",
          borderRadius: "md",
          py: 4,
          px: 2,
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: dragging ? "primary.softBg" : "background.surface",
          transition: "border-color 0.15s, background-color 0.15s",
          "&:hover": { borderColor: "primary.400" },
        }}
      >
        <FileUploadOutlinedIcon style={{ fontSize: 32, color: "var(--joy-palette-neutral-400)", marginBottom: 4 }} />
        <Typography level="body-sm">
          Drop files here or{" "}
          <Typography component="span" sx={{ color: "primary.500", fontWeight: 600 }}>
            browse
          </Typography>
        </Typography>
        <Typography level="body-xs" sx={{ color: "neutral.400", mt: 0.5 }}>
          PDF, DXF, DWG, PNG, JPG — max 50 MB each
        </Typography>
      </Box>

      {files.length > 0 && (
        <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
          {files.map((f, i) => (
            <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 1 }}>
              <Typography level="body-xs" sx={{ color: "neutral.600" }}>
                {f.name}
              </Typography>
              <Button
                size="sm"
                variant="plain"
                color="danger"
                onClick={(e) => { e.stopPropagation(); remove(i); }}
                sx={{ minHeight: 0, py: 0 }}
              >
                ✕
              </Button>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ── form state ────────────────────────────────────────────────────────────────

interface FormState {
  partName: string;
  partDrawingNumber: string;
  customerName: string;
  materialGrade: string;
  partStatus: string;
  forgingWeightKg: string;
  finishWeightKg: string;
  billetDiameterMm: string;
  billetLengthMm: string;
  noOfOperations: string;
  assessedBy: string;
  assessmentDate: string;
  recommendedMachine: "" | "Press_1000T" | "Belt_Hammer_075T";
  billetWeightEstKg: string;
  flashAllowancePct: string;
  cycleTimeMin: string;
  availableCapacityHrs: string;
  capacityFeasible: "true" | "false" | "null";
  flagsRisks: string;
  verdictRemarks: string;
  overallVerdict: "" | "Feasible" | "Not_Feasible" | "Conditional";
  rmRatePerKg: string;
  dieCostPerPc: string;
  machineCostPerPc: string;
  labourCostPerPc: string;
  overheadPct: string;
  marginPct: string;
}

const INITIAL: FormState = {
  partName: "",
  partDrawingNumber: "",
  customerName: "",
  materialGrade: "",
  partStatus: "Submitted",
  forgingWeightKg: "",
  finishWeightKg: "",
  billetDiameterMm: "",
  billetLengthMm: "",
  noOfOperations: "",
  assessedBy: "",
  assessmentDate: new Date().toLocaleDateString("en-CA"),
  recommendedMachine: "",
  billetWeightEstKg: "",
  flashAllowancePct: "",
  cycleTimeMin: "",
  availableCapacityHrs: "",
  capacityFeasible: "null",
  flagsRisks: "",
  verdictRemarks: "",
  overallVerdict: "",
  rmRatePerKg: "",
  dieCostPerPc: "",
  machineCostPerPc: "",
  labourCostPerPc: "",
  overheadPct: "15",
  marginPct: "20",
};

// ── page ──────────────────────────────────────────────────────────────────────

export default function NewFeasibilityStudyPage() {
  const router = useRouter();
  const [open, setOpen] = useState({ s1: true, s2: true, s3: true });
  const [form, setForm] = useState<FormState>(INITIAL);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // ── auto-computed values ───────────────────────────────────────────────────

  const computed = useMemo(() => {
    const billetWt = n(form.billetWeightEstKg) ?? 0;
    const finishWt = n(form.finishWeightKg) ?? 0;
    const rmRate = n(form.rmRatePerKg) ?? 0;
    const dieCost = n(form.dieCostPerPc) ?? 0;
    const machineCost = n(form.machineCostPerPc) ?? 0;
    const labourCost = n(form.labourCostPerPc) ?? 0;
    const overheadPct = n(form.overheadPct) ?? 0;
    const marginPct = n(form.marginPct) ?? 0;

    const materialUtilPct =
      billetWt > 0 && finishWt > 0 ? (finishWt / billetWt) * 100 : null;

    const rmCostPerPc = rmRate > 0 && billetWt > 0 ? rmRate * billetWt : null;
    const baseCost = (rmCostPerPc ?? 0) + dieCost + machineCost + labourCost;
    const overheadPerPc = baseCost > 0 ? baseCost * (overheadPct / 100) : null;
    const totalCostPerPc = baseCost > 0 ? baseCost + (overheadPerPc ?? 0) : null;
    const quotedPricePerPc =
      totalCostPerPc != null ? totalCostPerPc * (1 + marginPct / 100) : null;

    return { materialUtilPct, rmCostPerPc, overheadPerPc, totalCostPerPc, quotedPricePerPc };
  }, [form]);

  // ── submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!form.partName) return alert("Part name is required");
    if (!form.overallVerdict) return alert("Overall verdict is required");

    setSaving(true);
    try {
      const dto: Record<string, unknown> = {
        part: {
          partName: form.partName,
          partDrawingNumber: form.partDrawingNumber || undefined,
          materialGrade: form.materialGrade || undefined,
          forgingWeightKg: n(form.forgingWeightKg),
          finishWeightKg: n(form.finishWeightKg),
          billetDiameterMm: n(form.billetDiameterMm),
          billetLengthMm: n(form.billetLengthMm),
          noOfOperations: n(form.noOfOperations),
        },
        assessedBy: form.assessedBy || undefined,
        assessmentDate: form.assessmentDate || undefined,
        recommendedMachine: form.recommendedMachine || undefined,
        billetWeightEstKg: n(form.billetWeightEstKg),
        flashAllowancePct: n(form.flashAllowancePct),
        materialUtilisationPct: computed.materialUtilPct ?? undefined,
        cycleTimeMin: n(form.cycleTimeMin),
        availableCapacityHrs: n(form.availableCapacityHrs),
        capacityFeasible:
          form.capacityFeasible === "true"
            ? true
            : form.capacityFeasible === "false"
              ? false
              : undefined,
        flagsRisks: form.flagsRisks || undefined,
        overallVerdict: form.overallVerdict || undefined,
        verdictRemarks: form.verdictRemarks || undefined,
        costEstimation: {
          rmRatePerKg: n(form.rmRatePerKg),
          rmCostPerPc: computed.rmCostPerPc ?? undefined,
          dieCostPerPc: n(form.dieCostPerPc),
          machineCostPerPc: n(form.machineCostPerPc),
          labourCostPerPc: n(form.labourCostPerPc),
          overheadPct: n(form.overheadPct),
          overheadPerPc: computed.overheadPerPc ?? undefined,
          totalCostPerPc: computed.totalCostPerPc ?? undefined,
          marginPct: n(form.marginPct),
          quotedPricePerPc: computed.quotedPricePerPc ?? undefined,
        },
      };

      await createFeasibilityStudy(dto, form.assessedBy, files);
      router.push("/feasibility-study");
    } catch (err) {
      console.error(err);
      alert("Failed to save feasibility study");
    } finally {
      setSaving(false);
    }
  }

  // ── render ─────────────────────────────────────────────────────────────────

  const inputSx = { backgroundColor: "background.surface" };
  const autoInputSx = { backgroundColor: "neutral.100", color: "neutral.500", fontStyle: "italic" };

  return (
    <Box sx={{ maxWidth: 920, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button
            variant="plain"
            color="neutral"
            startDecorator={<ArrowBackIcon />}
            onClick={() => router.back()}
            size="sm"
          >
            Back
          </Button>
          <Divider orientation="vertical" />
          <Typography level="h3">New Feasibility Study</Typography>
        </Box>
        <Button startDecorator={<SaveOutlinedIcon />} onClick={handleSubmit} loading={saving}>
          Save Study
        </Button>
      </Box>

      {/* ── Section 1: Part Details ── */}
      <SectionCard
        index={1}
        title="Part Details"
        open={open.s1}
        onToggle={() => setOpen((p) => ({ ...p, s1: !p.s1 }))}
        badge={
          <Chip size="sm" variant="soft" color="primary">
            {form.partStatus}
          </Chip>
        }
      >
        {/* Row 1: Part Name + Drawing Number */}
        <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 2, mb: 2 }}>
          <Field label="Part Name" required>
            <Input
              placeholder="e.g. Connecting Rod"
              value={form.partName}
              onChange={(e) => set("partName", e.target.value)}
              sx={inputSx}
            />
          </Field>
          <Field label="Drawing Number">
            <Input
              placeholder="e.g. CR-4521-A"
              value={form.partDrawingNumber}
              onChange={(e) => set("partDrawingNumber", e.target.value)}
              sx={inputSx}
            />
          </Field>
        </Box>

        {/* Row 2: Customer + Material Grade + Part Status */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, mb: 2 }}>
          <Field label="Customer" required>
            <Input
              placeholder="Customer name"
              value={form.customerName}
              onChange={(e) => set("customerName", e.target.value)}
              sx={inputSx}
            />
          </Field>
          <Field label="Material Grade">
            <Input
              placeholder="e.g. EN8, 42CrMo4, C45"
              value={form.materialGrade}
              onChange={(e) => set("materialGrade", e.target.value)}
              sx={inputSx}
            />
          </Field>
          <Field label="Part Status">
            <Select
              value={form.partStatus}
              onChange={(_, v) => v && set("partStatus", v)}
              sx={inputSx}
            >
              <Option value="Submitted">Submitted</Option>
              <Option value="Under_Feasibility">Under Feasibility</Option>
              <Option value="Feasible">Feasible</Option>
              <Option value="Not_Feasible">Not Feasible</Option>
              <Option value="Enquiry_Raised">Enquiry Raised</Option>
            </Select>
          </Field>
        </Box>

        {/* Weight & Billet Dimensions sub-card */}
        <SubSectionCard label="WEIGHT & BILLET DIMENSIONS">
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2 }}>
            <Field label="Forging Weight (kg)">
              <Input
                type="number"
                placeholder="0.000"
                value={form.forgingWeightKg}
                onChange={(e) => set("forgingWeightKg", e.target.value)}
                sx={inputSx}
              />
            </Field>
            <Field label="Finish Weight (kg)">
              <Input
                type="number"
                placeholder="0.000"
                value={form.finishWeightKg}
                onChange={(e) => set("finishWeightKg", e.target.value)}
                sx={inputSx}
              />
            </Field>
            <Field label="Billet Ø (mm)">
              <Input
                type="number"
                placeholder="0.00"
                value={form.billetDiameterMm}
                onChange={(e) => set("billetDiameterMm", e.target.value)}
                sx={inputSx}
              />
            </Field>
            <Field label="Billet Length (mm)">
              <Input
                type="number"
                placeholder="0.00"
                value={form.billetLengthMm}
                onChange={(e) => set("billetLengthMm", e.target.value)}
                sx={inputSx}
              />
            </Field>
          </Box>
        </SubSectionCard>

        {/* Attach Drawings */}
        <Box>
          <Typography level="body-xs" sx={{ mb: 1, color: "neutral.600", fontWeight: 500 }}>
            Attach Drawings{" "}
            <Typography component="span" sx={{ color: "neutral.400", fontWeight: 400 }}>
              (PDF, DXF, DWG, images — multiple allowed)
            </Typography>
          </Typography>
          <FileDropZone files={files} onChange={setFiles} />
        </Box>
      </SectionCard>

      {/* ── Section 2: Feasibility Assessment ── */}
      <SectionCard
        index={2}
        title="Feasibility Assessment"
        open={open.s2}
        onToggle={() => setOpen((p) => ({ ...p, s2: !p.s2 }))}
      >
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 2 }}>
          <Field label="Assessed By">
            <Input
              placeholder="Arjun Kumar"
              value={form.assessedBy}
              onChange={(e) => set("assessedBy", e.target.value)}
              sx={inputSx}
            />
          </Field>
          <Field label="Assessment Date">
            <Input
              type="date"
              value={form.assessmentDate}
              onChange={(e) => set("assessmentDate", e.target.value)}
              sx={inputSx}
            />
          </Field>
          <Field label="Recommended Machine" required span={2}>
            <Select
              placeholder="Select machine..."
              value={form.recommendedMachine || null}
              onChange={(_, v) => set("recommendedMachine", (v as string) ?? "")}
              sx={inputSx}
            >
              <Option value="Press_1000T">1000T Press</Option>
              <Option value="Belt_Hammer_075T">0.75T Belt Hammer</Option>
            </Select>
          </Field>
        </Box>

        <Divider sx={{ my: 2 }} />
        <SubSectionLabel label="WEIGHT & MATERIAL UTILISATION" />

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 2 }}>
          <Field label="Billet Weight Est. (kg)">
            <Input type="number" placeholder="0.000" value={form.billetWeightEstKg} onChange={(e) => set("billetWeightEstKg", e.target.value)} sx={inputSx} />
          </Field>
          <Field label="Flash Allowance (%)">
            <Input type="number" placeholder="e.g. 12.00" value={form.flashAllowancePct} onChange={(e) => set("flashAllowancePct", e.target.value)} sx={inputSx} />
          </Field>
          <Field label="Material Utilisation (%)" auto>
            <Input placeholder="Auto-computed" value={computed.materialUtilPct != null ? computed.materialUtilPct.toFixed(2) : ""} disabled sx={autoInputSx} />
          </Field>
          <Field label="No. of Operations">
            <Input type="number" placeholder="e.g. 5" value={form.noOfOperations} onChange={(e) => set("noOfOperations", e.target.value)} sx={inputSx} />
          </Field>
        </Box>

        <Divider sx={{ my: 2 }} />
        <SubSectionLabel label="MACHINE CAPACITY CHECK" />

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 2 }}>
          <Field label="Cycle Time (min/pc)">
            <Input type="number" placeholder="e.g. 3.50" value={form.cycleTimeMin} onChange={(e) => set("cycleTimeMin", e.target.value)} sx={inputSx} />
          </Field>
          <Field label="Machine Load (hrs/month)" auto>
            <Input placeholder="—" disabled endDecorator={<Typography level="body-xs" sx={{ color: "neutral.400" }}>hrs</Typography>} sx={autoInputSx} />
          </Field>
          <Field label="Available Capacity (hrs)">
            <Input type="number" placeholder="From machine master" value={form.availableCapacityHrs} onChange={(e) => set("availableCapacityHrs", e.target.value)} sx={inputSx} />
          </Field>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography level="body-xs" sx={{ mb: 1, color: "neutral.600", fontWeight: 500 }}>
            Capacity Feasible?
          </Typography>
          <ToggleButtonGroup value={form.capacityFeasible} onChange={(_, v) => v && set("capacityFeasible", v)}>
            <Button value="true" startDecorator={<CheckCircleOutlineIcon />}>Yes — Feasible</Button>
            <Button value="false" startDecorator={<CancelOutlinedIcon />}>No — Over Capacity</Button>
            <Button value="null" startDecorator={<WarningAmberIcon />}>Not Assessed</Button>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}>
          <Field label="Flags / Risks">
            <Textarea minRows={3} placeholder="Material availability issues, tooling lead time, capacity conflicts, quality risks..." value={form.flagsRisks} onChange={(e) => set("flagsRisks", e.target.value)} sx={inputSx} />
          </Field>
          <Field label="Verdict Remarks">
            <Textarea minRows={3} placeholder="Rationale and conditions for the overall verdict..." value={form.verdictRemarks} onChange={(e) => set("verdictRemarks", e.target.value)} sx={inputSx} />
          </Field>
        </Box>

        <Box>
          <Typography level="body-xs" sx={{ mb: 1, color: "neutral.600", fontWeight: 500 }}>
            Overall Verdict <Typography component="span" sx={{ color: "danger.500" }}>*</Typography>
          </Typography>
          <ToggleButtonGroup value={form.overallVerdict} onChange={(_, v) => v && set("overallVerdict", v)} sx={{ width: "100%" }}>
            <Button value="Feasible" sx={{ flex: 1 }}>Feasible</Button>
            <Button value="Conditional" sx={{ flex: 1 }}>Conditional</Button>
            <Button value="Not_Feasible" sx={{ flex: 1 }}>Not Feasible</Button>
          </ToggleButtonGroup>
        </Box>
      </SectionCard>

      {/* ── Section 3: Cost Estimation ── */}
      <SectionCard
        index={3}
        title="Cost Estimation"
        open={open.s3}
        onToggle={() => setOpen((p) => ({ ...p, s3: !p.s3 }))}
      >
        <SubSectionLabel label="COST INPUTS" />

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 2 }}>
          <Field label="RM Rate per kg (₹)" span={2}>
            <Input type="number" placeholder="e.g. 87.50" value={form.rmRatePerKg} onChange={(e) => set("rmRatePerKg", e.target.value)} sx={inputSx} />
          </Field>
          <Field label="RM Cost per pc (₹)" auto span={2}>
            <Input placeholder="—" value={fmt(computed.rmCostPerPc)} disabled sx={autoInputSx} />
          </Field>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 2 }}>
          <Field label="Die Cost per pc (₹)">
            <Input type="number" placeholder="From tooling amortisation" value={form.dieCostPerPc} onChange={(e) => set("dieCostPerPc", e.target.value)} sx={inputSx} />
          </Field>
          <Field label="Machine Cost per pc (₹)">
            <Input type="number" placeholder="0.00" value={form.machineCostPerPc} onChange={(e) => set("machineCostPerPc", e.target.value)} sx={inputSx} />
          </Field>
          <Field label="Labour Cost per pc (₹)">
            <Input type="number" placeholder="0.00" value={form.labourCostPerPc} onChange={(e) => set("labourCostPerPc", e.target.value)} sx={inputSx} />
          </Field>
        </Box>

        <Divider sx={{ my: 2 }} />
        <SubSectionLabel label="OVERHEAD & MARGIN" />

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2 }}>
          <Field label="Overhead (%)">
            <Input type="number" value={form.overheadPct} onChange={(e) => set("overheadPct", e.target.value)} sx={inputSx} />
          </Field>
          <Field label="Overhead per pc (₹)" auto>
            <Input placeholder="—" value={fmt(computed.overheadPerPc)} disabled sx={autoInputSx} />
          </Field>
          <Field label="Desired Margin (%)">
            <Input type="number" value={form.marginPct} onChange={(e) => set("marginPct", e.target.value)} sx={inputSx} />
          </Field>
          <Field label="Quoted Price per pc (₹)" auto>
            <Input placeholder="—" value={fmt(computed.quotedPricePerPc)} disabled sx={autoInputSx} />
          </Field>
        </Box>
      </SectionCard>

      {/* Bottom actions */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, pb: 4, gap: 1.5 }}>
        <Button variant="outlined" color="neutral" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button startDecorator={<SaveOutlinedIcon />} onClick={handleSubmit} loading={saving}>
          Save Study
        </Button>
      </Box>
    </Box>
  );
}
