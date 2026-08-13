"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Input from "@mui/joy/Input";
import Textarea from "@mui/joy/Textarea";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import Chip from "@mui/joy/Chip";
import ToggleButtonGroup from "@mui/joy/ToggleButtonGroup";
import CircularProgress from "@mui/joy/CircularProgress";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import {
  getEnquiries,
  getEnquiry,
  getMachines,
  getUsers,
  getProcesses,
  createFeasibilityStudy,
  updateFeasibilityStudy,
  generateQuotation,
  type MachineOption,
  type UserOption,
  type ProcessOption,
} from "@/services/api_service";
import type { Enquiry } from "@/types/entities";

// Between Joy's neutral.50 and neutral.100 steps — no native token sits here.
const MUTED_GREY = "#F1F1F4";

// ── number helpers ────────────────────────────────────────────────────────────

function n(v: string): number {
  const p = parseFloat(v);
  return isNaN(p) ? 0 : p;
}

function hasVal(v: string): boolean {
  return v.trim() !== "" && !isNaN(parseFloat(v));
}

function num(v: string): number | undefined {
  return hasVal(v) ? parseFloat(v) : undefined;
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

function money(v: number | null): string {
  if (v === null) return "—";
  return v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── sub-components ────────────────────────────────────────────────────────────

function SectionBox({ children, sx, muted }: { children: React.ReactNode; sx?: object; muted?: boolean }) {
  return (
    <Box sx={{ border: "1px solid", borderColor: "neutral.200", borderRadius: "md", backgroundColor: muted ? MUTED_GREY : "background.surface", ...sx }}>
      {children}
    </Box>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <Typography level="body-xs" fontWeight="lg" sx={{ letterSpacing: "0.08em", color: "neutral.500", mb: 2 }}>
      {label}
    </Typography>
  );
}

function Field({ label, required, auto, children, span }: {
  label: string; required?: boolean; auto?: boolean; children: React.ReactNode; span?: number;
}) {
  return (
    // minWidth: 0 lets the field shrink inside its grid track instead of
    // forcing the track wider and overflowing the section.
    <Box sx={{ minWidth: 0, ...(span ? { gridColumn: `span ${span}` } : {}) }}>
      <Typography level="body-xs" sx={{ mb: 0.5, color: "neutral.600", fontWeight: 500 }}>
        {label}
        {required && <Typography component="span" sx={{ color: "danger.500" }}> *</Typography>}
        {auto && <Typography component="span" sx={{ color: "primary.600", fontWeight: 600 }}> (auto)</Typography>}
      </Typography>
      {children}
    </Box>
  );
}

function ReadOnlyValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Typography level="body-xs" sx={{ mb: 0.5, color: "neutral.600", fontWeight: 500 }}>{label}</Typography>
      <Typography level="body-sm" fontWeight="lg" component="div">{value}</Typography>
    </Box>
  );
}

const inputSx = {
  backgroundColor: MUTED_GREY,
  "&:focus-within": {
    "--Input-focusedHighlight": "var(--joy-palette-primary-200)",
    "--Select-focusedHighlight": "var(--joy-palette-primary-200)",
    borderColor: "var(--joy-palette-primary-300) !important",
  },
};

const autoInputSx = { backgroundColor: "primary.50", color: "primary.600", fontStyle: "italic" as const, border: "1.5px solid", borderColor: "#84c0e9" };

function ProcessChips({ options, selected, onToggle }: {
  options: ProcessOption[]; selected: string[]; onToggle: (id: string) => void;
}) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
      {options.map((p) => {
        const active = selected.includes(p.id);
        return (
          <Box
            key={p.id}
            onClick={() => onToggle(p.id)}
            sx={{
              px: 2, py: 0.75, borderRadius: "xl", cursor: "pointer", userSelect: "none",
              fontSize: "0.8125rem", fontWeight: active ? 600 : 400,
              border: "1px solid", borderColor: active ? "primary.500" : "neutral.300",
              backgroundColor: active ? "primary.100" : "background.surface",
              color: active ? "primary.700" : "neutral.700",
            }}
          >
            {p.name}
          </Box>
        );
      })}
    </Box>
  );
}

// ── types ─────────────────────────────────────────────────────────────────────

interface ToolingSetForm {
  _key: string;
  toolingId?: number;
  setNumber: number;
  dieDrawingStatus: "" | "Customer_Provides" | "To_Be_Developed" | "Existing_Die";
  estimatedDieCost: string;
  dieAmortisationQty: string;
  dieRemarks: string;
}

interface CostEstimationForm {
  rmDiameterMm: string;
  forgingYieldPct: string;
  forgingWeightKg: string;
  cutPcWeightKg: string;
  grossWeightKg: string;
  rmRatePerKg: string;
  dieFactorPerPc: string;
  cuttingCostFactorPerCm2: string;
  forgingConversionPerKg: string;
  htFactorPerKg: string;
  visualInspectionPerPc: string;
  rejectionFactorPct: string;
  iccFactorPct: string;
  transportationFactorPct: string;
  profitOnVaFactorPct: string;
  scrapFactorPerKg: string;
}

function emptyCostEstimation(): CostEstimationForm {
  return {
    rmDiameterMm: "", forgingYieldPct: "", forgingWeightKg: "", cutPcWeightKg: "", grossWeightKg: "",
    rmRatePerKg: "", dieFactorPerPc: "", cuttingCostFactorPerCm2: "", forgingConversionPerKg: "",
    htFactorPerKg: "", visualInspectionPerPc: "", rejectionFactorPct: "", iccFactorPct: "",
    transportationFactorPct: "", profitOnVaFactorPct: "", scrapFactorPerKg: "",
  };
}

interface LineForm {
  _key: string;
  feasibilityLineId?: number;
  enquiryLineId: number;
  expanded: boolean;
  // read-only, from enquiry
  partName: string;
  partDrawingNumber: string;
  materialGrade: string;
  supplyType: string;
  // technical assessment — weights and billet dimensions live on costEstimation
  processIds: string[];
  recommendedMachineId: string;
  billetWeightEstKg: string;
  flashAllowancePct: string;
  flagsRisks: string;
  verdictRemarks: string;
  overallVerdict: "" | "Feasible" | "Conditional" | "Not_Feasible";
  toolingSets: ToolingSetForm[];
  costEstimation: CostEstimationForm;
}

function newKey() {
  return Math.random().toString(36).slice(2);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lineFromEnquiryLine(el: any): LineForm {
  return {
    _key: newKey(),
    enquiryLineId: el.lineId,
    expanded: true,
    partName: el.part?.partName ?? "",
    partDrawingNumber: el.part?.partDrawingNumber ?? "",
    materialGrade: el.part?.materialGrade ?? "",
    supplyType: el.supplyType ?? "",
    processIds: [], recommendedMachineId: "", billetWeightEstKg: "", flashAllowancePct: "",
    flagsRisks: "", verdictRemarks: "", overallVerdict: "",
    toolingSets: [],
    costEstimation: emptyCostEstimation(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lineFromFeasibilityLine(fl: any): LineForm {
  const el = fl.enquiryLine;
  const cost = fl.costEstimation;
  return {
    _key: newKey(),
    feasibilityLineId: fl.feasibilityLineId,
    enquiryLineId: fl.enquiryLineId,
    expanded: true,
    partName: el?.part?.partName ?? "",
    partDrawingNumber: el?.part?.partDrawingNumber ?? "",
    materialGrade: el?.part?.materialGrade ?? "",
    supplyType: el?.supplyType ?? "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    processIds: (fl.processes ?? []).map((p: any) => String(p.processId)),
    recommendedMachineId: fl.recommendedMachineId ? String(fl.recommendedMachineId) : "",
    billetWeightEstKg: str(fl.billetWeightEstKg),
    flashAllowancePct: str(fl.flashAllowancePct),
    flagsRisks: fl.flagsRisks ?? "",
    verdictRemarks: fl.verdictRemarks ?? "",
    overallVerdict: (fl.overallVerdict ?? "") as LineForm["overallVerdict"],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toolingSets: (fl.toolingSets ?? []).map((ts: any) => ({
      _key: newKey(),
      toolingId: ts.toolingId,
      setNumber: ts.setNumber,
      dieDrawingStatus: (ts.dieDrawingStatus ?? "") as ToolingSetForm["dieDrawingStatus"],
      estimatedDieCost: str(ts.estimatedDieCost),
      dieAmortisationQty: str(ts.dieAmortisationQty),
      dieRemarks: ts.dieRemarks ?? "",
    })),
    costEstimation: cost
      ? {
          rmDiameterMm: str(cost.rmDiameterMm),
          forgingYieldPct: str(cost.forgingYieldPct),
          forgingWeightKg: str(cost.forgingWeightKg),
          cutPcWeightKg: str(cost.cutPcWeightKg),
          grossWeightKg: str(cost.grossWeightKg),
          rmRatePerKg: str(cost.rmRatePerKg),
          dieFactorPerPc: str(cost.dieFactorPerPc),
          cuttingCostFactorPerCm2: str(cost.cuttingCostFactorPerCm2),
          forgingConversionPerKg: str(cost.forgingConversionPerKg),
          htFactorPerKg: str(cost.htFactorPerKg),
          visualInspectionPerPc: str(cost.visualInspectionPerPc),
          rejectionFactorPct: str(cost.rejectionFactorPct),
          iccFactorPct: str(cost.iccFactorPct),
          transportationFactorPct: str(cost.transportationFactorPct),
          profitOnVaFactorPct: str(cost.profitOnVaFactorPct),
          scrapFactorPerKg: str(cost.scrapFactorPerKg),
        }
      : emptyCostEstimation(),
  };
}

// ── computed values for a line ───────────────────────────────────────────────

// Share of the (gross − net) offcut recovered as sellable scrap.
const SCRAP_RECOVERY_PCT = 0.8;

function computeLine(line: LineForm) {
  const c = line.costEstimation;
  const grossWeightKg = n(c.grossWeightKg);
  // forgingWeightKg is labelled "Net Weight (kg)" in the UI.
  const netWeightKg = n(c.forgingWeightKg);

  const rmCost = hasVal(c.rmRatePerKg) && hasVal(c.grossWeightKg) ? n(c.rmRatePerKg) * grossWeightKg : null;

  // ── Value Addition components ──
  // Cutting and die factor are entered directly as per-piece amounts.
  const cuttingCost = hasVal(c.cuttingCostFactorPerCm2) ? n(c.cuttingCostFactorPerCm2) : null;
  const dieCost = hasVal(c.dieFactorPerPc) ? n(c.dieFactorPerPc) : null;
  const forgingConversionCost = hasVal(c.forgingConversionPerKg) && hasVal(c.grossWeightKg)
    ? n(c.forgingConversionPerKg) * grossWeightKg
    : null;
  const htShotblastCost = hasVal(c.htFactorPerKg) && hasVal(c.forgingWeightKg)
    ? n(c.htFactorPerKg) * netWeightKg
    : null;
  const visualInspectionCost = hasVal(c.visualInspectionPerPc) ? n(c.visualInspectionPerPc) : null;

  const vaParts = [cuttingCost, dieCost, forgingConversionCost, htShotblastCost, visualInspectionCost];
  const valueAddition = vaParts.some((p) => p !== null)
    ? vaParts.reduce<number>((sum, p) => sum + (p ?? 0), 0)
    : null;

  const subTotal = rmCost !== null || valueAddition !== null ? (rmCost ?? 0) + (valueAddition ?? 0) : null;

  const rejectionCost = subTotal !== null && hasVal(c.rejectionFactorPct) ? subTotal * (n(c.rejectionFactorPct) / 100) : null;
  const iccCost = subTotal !== null && hasVal(c.iccFactorPct) ? subTotal * (n(c.iccFactorPct) / 100) : null;
  // Despite the column name, this is a ₹/kg rate applied to net weight — not a percentage.
  const transportationCost = hasVal(c.transportationFactorPct) && hasVal(c.forgingWeightKg)
    ? n(c.transportationFactorPct) * netWeightKg
    : null;
  const profitOnVa = valueAddition !== null && hasVal(c.profitOnVaFactorPct) ? valueAddition * (n(c.profitOnVaFactorPct) / 100) : null;
  const scrapAmount = hasVal(c.scrapFactorPerKg) && hasVal(c.grossWeightKg) && hasVal(c.forgingWeightKg)
    ? n(c.scrapFactorPerKg) * SCRAP_RECOVERY_PCT * (grossWeightKg - netWeightKg)
    : null;

  const quotedPricePerPc =
    subTotal !== null
      ? subTotal + (rejectionCost ?? 0) + (iccCost ?? 0) + (transportationCost ?? 0) + (profitOnVa ?? 0) - (scrapAmount ?? 0)
      : null;

  return {
    rmCost, cuttingCost, dieCost, forgingConversionCost, htShotblastCost, visualInspectionCost,
    valueAddition, subTotal, rejectionCost, iccCost, transportationCost, profitOnVa, scrapAmount,
    quotedPricePerPc,
  };
}

// ── props ─────────────────────────────────────────────────────────────────────

export interface FeasibilityStudyInitialData {
  studyId: number;
  enquiryId: number;
  assessedBy: number | null;
  assessmentDate: string | null;
  studyStatus: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enquiry: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feasibilityLines: any[];
}

interface Props {
  mode: "new" | "edit";
  studyId?: string;
  initialData?: FeasibilityStudyInitialData;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function FeasibilityStudyForm({ mode, studyId, initialData }: Props) {
  const router = useRouter();

  const [enquiryId, setEnquiryId] = useState(initialData ? String(initialData.enquiryId) : "");
  const [assessedBy, setAssessedBy] = useState(initialData?.assessedBy ? String(initialData.assessedBy) : "");
  const [assessmentDate, setAssessmentDate] = useState(
    initialData?.assessmentDate
      ? new Date(initialData.assessmentDate).toLocaleDateString("en-CA")
      : new Date().toLocaleDateString("en-CA"),
  );
  const [studyStatus, setStudyStatus] = useState(initialData?.studyStatus ?? "Draft");

  const [lines, setLines] = useState<LineForm[]>(
    () => initialData?.feasibilityLines?.map(lineFromFeasibilityLine) ?? [],
  );

  const [selectedEnquirySummary, setSelectedEnquirySummary] = useState<Enquiry | null>(null);
  const [loadingLines, setLoadingLines] = useState(false);

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [machines, setMachines] = useState<MachineOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [processes, setProcesses] = useState<ProcessOption[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    Promise.all([getEnquiries(), getMachines(), getUsers(), getProcesses()])
      .then(([e, m, u, p]) => {
        setEnquiries(e);
        setMachines(m);
        setUsers(u);
        setProcesses(p);
        if (initialData) {
          setSelectedEnquirySummary(e.find((x) => x.id === String(initialData.enquiryId)) ?? null);
        }
      })
      .finally(() => setLoadingInit(false));
  }, [initialData]);

  const handleEnquiryChange = useCallback(async (id: string) => {
    setEnquiryId(id);
    setSelectedEnquirySummary(enquiries.find((e) => e.id === id) ?? null);
    if (!id) {
      setLines([]);
      return;
    }
    setLoadingLines(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail: any = await getEnquiry(id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setLines((detail.enquiryLines ?? []).map((el: any) => lineFromEnquiryLine(el)));
    } finally {
      setLoadingLines(false);
    }
  }, [enquiries]);

  function setLine(key: string, patch: Partial<LineForm>) {
    setLines((prev) => prev.map((l) => (l._key === key ? { ...l, ...patch } : l)));
  }

  function setCost(key: string, patch: Partial<CostEstimationForm>) {
    setLines((prev) => prev.map((l) => (l._key !== key ? l : { ...l, costEstimation: { ...l.costEstimation, ...patch } })));
  }

  function toggleProcess(key: string, processId: string) {
    setLines((prev) => prev.map((l) => {
      if (l._key !== key) return l;
      const has = l.processIds.includes(processId);
      return { ...l, processIds: has ? l.processIds.filter((p) => p !== processId) : [...l.processIds, processId] };
    }));
  }

  function addToolingSet(key: string) {
    setLines((prev) => prev.map((l) => l._key !== key ? l : {
      ...l,
      toolingSets: [...l.toolingSets, {
        _key: newKey(), setNumber: l.toolingSets.length + 1, dieDrawingStatus: "",
        estimatedDieCost: "", dieAmortisationQty: "", dieRemarks: "",
      }],
    }));
  }

  function removeToolingSet(key: string, tsKey: string) {
    setLines((prev) => prev.map((l) => l._key !== key ? l : { ...l, toolingSets: l.toolingSets.filter((t) => t._key !== tsKey) }));
  }

  function setToolingSet(key: string, tsKey: string, patch: Partial<ToolingSetForm>) {
    setLines((prev) => prev.map((l) => {
      if (l._key !== key) return l;
      return { ...l, toolingSets: l.toolingSets.map((t) => t._key === tsKey ? { ...t, ...patch } : t) };
    }));
  }

  // ── submit ─────────────────────────────────────────────────────────────────

  async function submit(nextStatus?: string) {
    if (!enquiryId) return alert("Please select an enquiry");
    if (lines.some((l) => !l.recommendedMachineId)) return alert("Please select a recommended machine for each part");
    if (lines.some((l) => !l.overallVerdict)) return alert("Please select an overall verdict for each part");

    setSubmitting(true);
    try {
      const linesPayload = lines.map((l) => {
        const c = computeLine(l);
        return {
          feasibilityLineId: l.feasibilityLineId,
          enquiryLineId: l.enquiryLineId,
          recommendedMachineId: parseInt(l.recommendedMachineId),
          billetWeightEstKg: num(l.billetWeightEstKg),
          flashAllowancePct: num(l.flashAllowancePct),
          flagsRisks: l.flagsRisks || undefined,
          overallVerdict: l.overallVerdict || undefined,
          verdictRemarks: l.verdictRemarks || undefined,
          processIds: l.processIds.map((p) => parseInt(p)),
          toolingSets: l.toolingSets.map((ts) => ({
            setNumber: ts.setNumber,
            dieDrawingStatus: ts.dieDrawingStatus || undefined,
            estimatedDieCost: num(ts.estimatedDieCost),
            dieAmortisationQty: num(ts.dieAmortisationQty),
            dieRemarks: ts.dieRemarks || undefined,
          })),
          costEstimation: {
            rmDiameterMm: num(l.costEstimation.rmDiameterMm),
            forgingYieldPct: num(l.costEstimation.forgingYieldPct),
            forgingWeightKg: num(l.costEstimation.forgingWeightKg),
            cutPcWeightKg: num(l.costEstimation.cutPcWeightKg),
            grossWeightKg: num(l.costEstimation.grossWeightKg),
            rmRatePerKg: num(l.costEstimation.rmRatePerKg),
            dieFactorPerPc: num(l.costEstimation.dieFactorPerPc),
            cuttingCostFactorPerCm2: num(l.costEstimation.cuttingCostFactorPerCm2),
            forgingConversionPerKg: num(l.costEstimation.forgingConversionPerKg),
            htFactorPerKg: num(l.costEstimation.htFactorPerKg),
            visualInspectionPerPc: num(l.costEstimation.visualInspectionPerPc),
            rejectionFactorPct: num(l.costEstimation.rejectionFactorPct),
            iccFactorPct: num(l.costEstimation.iccFactorPct),
            transportationFactorPct: num(l.costEstimation.transportationFactorPct),
            profitOnVaFactorPct: num(l.costEstimation.profitOnVaFactorPct),
            scrapFactorPerKg: num(l.costEstimation.scrapFactorPerKg),
            rmCost: c.rmCost ?? undefined,
            cuttingCost: c.cuttingCost ?? undefined,
            forgingConversionCost: c.forgingConversionCost ?? undefined,
            htShotblastCost: c.htShotblastCost ?? undefined,
            visualInspectionCost: c.visualInspectionCost ?? undefined,
            valueAddition: c.valueAddition ?? undefined,
            subTotal: c.subTotal ?? undefined,
            rejectionCost: c.rejectionCost ?? undefined,
            iccCost: c.iccCost ?? undefined,
            transportationCost: c.transportationCost ?? undefined,
            profitOnVa: c.profitOnVa ?? undefined,
            scrapAmount: c.scrapAmount ?? undefined,
            quotedPricePerPc: c.quotedPricePerPc ?? undefined,
          },
        };
      });

      const status = nextStatus ?? studyStatus;

      if (mode === "new") {
        const created = await createFeasibilityStudy({
          enquiryId: parseInt(enquiryId),
          assessedBy: assessedBy ? parseInt(assessedBy) : undefined,
          assessmentDate,
          studyStatus: status,
          lines: linesPayload,
        });
        router.push(`/feasibility-study/${(created as { studyId: number }).studyId}`);
      } else {
        await updateFeasibilityStudy(studyId!, {
          assessedBy: assessedBy ? parseInt(assessedBy) : undefined,
          assessmentDate,
          studyStatus: status,
          lines: linesPayload,
        });
        router.push("/feasibility-study");
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to save feasibility study");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGenerateQuotation() {
    if (!studyId) return;
    setGenerating(true);
    try {
      await generateQuotation(studyId);
      router.push("/quotations");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to generate quotation");
    } finally {
      setGenerating(false);
    }
  }

  // ── render ─────────────────────────────────────────────────────────────────

  if (loadingInit) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  const heading = mode === "new" ? "New Feasibility Study" : `${selectedEnquirySummary?.enquiryNo ?? ""} — Feasibility`;
  const title = mode === "new" ? "New Feasibility Study" : `Feasibility Study — ${selectedEnquirySummary?.enquiryNo ?? ""}`;

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", pb: 8 }}>
      {/* ── Page Header ── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Button variant="plain" color="neutral" size="sm" startDecorator={<ArrowBackIcon />} onClick={() => router.push("/feasibility-study")}>
              Feasibility Studies
            </Button>
            <Typography level="body-sm" sx={{ color: "neutral.400" }}>/</Typography>
            <Typography level="body-sm">{heading}</Typography>
          </Box>
          <Typography level="h3">{title}</Typography>
          <Typography level="body-sm" sx={{ color: "neutral.500" }}>{lines.length} parts to assess</Typography>
        </Box>
        <Button variant="outlined" color="neutral" onClick={() => router.push("/feasibility-study")} disabled={submitting}>
          Cancel
        </Button>
      </Box>

      {/* ── Study Details ── */}
      <SectionBox sx={{ mb: 3, p: 3 }}>
        <SectionHeader label="STUDY DETAILS" />
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 2 }}>
          <Field label="Enquiry" required>
            <Select
              placeholder="— Select enquiry —"
              value={enquiryId || null}
              onChange={(_, v) => handleEnquiryChange(v ?? "")}
              disabled={mode === "edit"}
              sx={inputSx}
            >
              {enquiries.map((e) => (
                <Option key={e.id} value={e.id}>{e.enquiryNo} — {e.customer} · {e.parts} parts</Option>
              ))}
            </Select>
          </Field>
          <Field label="Assessed By">
            <Select placeholder="— Select user —" value={assessedBy || null} onChange={(_, v) => setAssessedBy(v ?? "")} sx={inputSx}>
              {users.map((u) => (
                <Option key={u.id} value={u.id}>{u.name}</Option>
              ))}
            </Select>
          </Field>
          <Field label="Assessment Date">
            <Input type="date" value={assessmentDate} onChange={(e) => setAssessmentDate(e.target.value)} sx={inputSx} />
          </Field>
        </Box>

        {selectedEnquirySummary && (
          <Box sx={{ mt: 2, p: 1.5, borderRadius: "sm", backgroundColor: "primary.50", display: "flex", gap: 4 }}>
            <Typography level="body-sm"><strong>Customer:</strong> {selectedEnquirySummary.customer}</Typography>
            <Typography level="body-sm"><strong>Date:</strong> {selectedEnquirySummary.date}</Typography>
            <Typography level="body-sm"><strong>Received By:</strong> {selectedEnquirySummary.receivedBy || "—"}</Typography>
            <Typography level="body-sm"><strong>Parts:</strong> {selectedEnquirySummary.parts}</Typography>
          </Box>
        )}
      </SectionBox>

      {/* ── Empty state ── */}
      {!enquiryId && (
        <Box sx={{
          border: "2px dashed", borderColor: "neutral.300", borderRadius: "md",
          py: 6, textAlign: "center", color: "neutral.400",
        }}>
          <AddIcon style={{ fontSize: 32, marginBottom: 4 }} />
          <Typography level="title-md" sx={{ color: "neutral.600", mb: 0.5 }}>
            Select an enquiry above to load its parts
          </Typography>
          <Typography level="body-sm" sx={{ color: "neutral.400" }}>
            Each part will appear as a card for individual assessment
          </Typography>
        </Box>
      )}

      {loadingLines && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* ── Parts Assessment ── */}
      {enquiryId && !loadingLines && lines.length > 0 && (
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography level="title-lg">Parts Assessment</Typography>
            <Typography level="body-xs" sx={{ color: "neutral.500" }}>
              Fill weight, dimensions, drawings and assessment for each part.
            </Typography>
          </Box>

          {lines.map((line, idx) => {
            const computed = computeLine(line);
            return (
              <SectionBox key={line._key} sx={{ mb: 2, overflow: "hidden" }}>
                {/* Part header */}
                <Box
                  onClick={() => setLine(line._key, { expanded: !line.expanded })}
                  sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5, cursor: "pointer", backgroundColor: "primary.50", userSelect: "none" }}
                >
                  {line.expanded
                    ? <ExpandLessIcon fontSize="small" style={{ color: "var(--joy-palette-primary-700)" }} />
                    : <ExpandMoreIcon fontSize="small" style={{ color: "var(--joy-palette-primary-700)" }} />}
                  <Chip size="sm" variant="soft" sx={{ backgroundColor: "primary.100", color: "primary.700", fontWeight: 700 }}>
                    PART {idx + 1}
                  </Chip>
                  <Typography level="body-sm" fontWeight="lg" sx={{ color: "primary.800" }}>{line.partName}</Typography>
                  {line.partDrawingNumber && (
                    <Typography level="body-xs" sx={{ color: "neutral.500" }}>{line.partDrawingNumber}</Typography>
                  )}
                  {line.supplyType && (
                    <Chip size="sm" variant="soft" color="neutral">{line.supplyType.replace("_", " ")}</Chip>
                  )}
                </Box>

                {line.expanded && (
                  <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>

                    {/* Part information (read-only) */}
                    <SectionBox muted sx={{ p: 2 }}>
                      <SectionHeader label="PART INFORMATION — FROM ENQUIRY" />
                      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 2 }}>
                        <ReadOnlyValue label="Part Name" value={line.partName} />
                        <ReadOnlyValue label="Drawing Number" value={line.partDrawingNumber || "—"} />
                        <ReadOnlyValue label="Material Grade" value={line.materialGrade || "—"} />
                        <ReadOnlyValue
                          label="Supply"
                          value={<Chip size="sm" variant="soft" color="primary">{line.supplyType.replace("_", " ") || "—"}</Chip>}
                        />
                      </Box>
                    </SectionBox>

                    {/* Cost & Pricing */}
                    <SectionBox muted sx={{ p: 2 }}>
                      <SectionHeader label="COST & PRICING" />

                      <Typography level="body-xs" fontWeight="lg" sx={{ color: "neutral.500", mb: 1 }}>Dimensions & Weights</Typography>
                      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 2, mb: 2 }}>
                        <Field label="RM Diameter (mm)">
                          <Input type="number" placeholder="e.g. 50" value={line.costEstimation.rmDiameterMm} onChange={(e) => setCost(line._key, { rmDiameterMm: e.target.value })} sx={inputSx} />
                        </Field>
                        <Field label="Forging Yield (%)">
                          <Input type="number" placeholder="e.g. 85" value={line.costEstimation.forgingYieldPct} onChange={(e) => setCost(line._key, { forgingYieldPct: e.target.value })} sx={inputSx} />
                        </Field>
                        <Field label="Net Weight (kg)">
                          <Input type="number" placeholder="0.000" value={line.costEstimation.forgingWeightKg} onChange={(e) => setCost(line._key, { forgingWeightKg: e.target.value })} sx={inputSx} />
                        </Field>
                        <Field label="Cut Weight (kg)">
                          <Input type="number" placeholder="0.000" value={line.costEstimation.cutPcWeightKg} onChange={(e) => setCost(line._key, { cutPcWeightKg: e.target.value })} sx={inputSx} />
                        </Field>
                        <Field label="Gross Weight (kg)">
                          <Input type="number" placeholder="0.000" value={line.costEstimation.grossWeightKg} onChange={(e) => setCost(line._key, { grossWeightKg: e.target.value })} sx={inputSx} />
                        </Field>
                      </Box>

                      <Typography level="body-xs" fontWeight="lg" sx={{ color: "neutral.500", mb: 1 }}>Rate Factors</Typography>
                      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 2, mb: 2 }}>
                        <Field label="RM Rate (₹/kg)">
                          <Input type="number" placeholder="e.g. 87.50" value={line.costEstimation.rmRatePerKg} onChange={(e) => setCost(line._key, { rmRatePerKg: e.target.value })} sx={inputSx} />
                        </Field>
                        <Field label="Die Factor (₹/pc)">
                          <Input type="number" placeholder="0.00" value={line.costEstimation.dieFactorPerPc} onChange={(e) => setCost(line._key, { dieFactorPerPc: e.target.value })} sx={inputSx} />
                        </Field>
                        <Field label="Cutting Cost per pc">
                          <Input type="number" placeholder="0.00" value={line.costEstimation.cuttingCostFactorPerCm2} onChange={(e) => setCost(line._key, { cuttingCostFactorPerCm2: e.target.value })} sx={inputSx} />
                        </Field>
                        <Field label="Forging Conversion (₹/kg)">
                          <Input type="number" placeholder="0.00" value={line.costEstimation.forgingConversionPerKg} onChange={(e) => setCost(line._key, { forgingConversionPerKg: e.target.value })} sx={inputSx} />
                        </Field>
                        <Field label="Heat Treatment (₹/kg)">
                          <Input type="number" placeholder="0.00" value={line.costEstimation.htFactorPerKg} onChange={(e) => setCost(line._key, { htFactorPerKg: e.target.value })} sx={inputSx} />
                        </Field>
                        <Field label="Visual Inspection (₹/pc)">
                          <Input type="number" placeholder="0.00" value={line.costEstimation.visualInspectionPerPc} onChange={(e) => setCost(line._key, { visualInspectionPerPc: e.target.value })} sx={inputSx} />
                        </Field>
                        <Field label="Rejection Factor (%)">
                          <Input type="number" placeholder="e.g. 2" value={line.costEstimation.rejectionFactorPct} onChange={(e) => setCost(line._key, { rejectionFactorPct: e.target.value })} sx={inputSx} />
                        </Field>
                        <Field label="ICC Factor (%)">
                          <Input type="number" placeholder="e.g. 1.5" value={line.costEstimation.iccFactorPct} onChange={(e) => setCost(line._key, { iccFactorPct: e.target.value })} sx={inputSx} />
                        </Field>
                        <Field label="Transportation Cost (₹/kg)">
                          <Input type="number" placeholder="e.g. 1" value={line.costEstimation.transportationFactorPct} onChange={(e) => setCost(line._key, { transportationFactorPct: e.target.value })} sx={inputSx} />
                        </Field>
                        <Field label="Profit on VA Factor (%)">
                          <Input type="number" placeholder="e.g. 15" value={line.costEstimation.profitOnVaFactorPct} onChange={(e) => setCost(line._key, { profitOnVaFactorPct: e.target.value })} sx={inputSx} />
                        </Field>
                        <Field label="Scrap Factor (₹/kg)">
                          <Input type="number" placeholder="0.00" value={line.costEstimation.scrapFactorPerKg} onChange={(e) => setCost(line._key, { scrapFactorPerKg: e.target.value })} sx={inputSx} />
                        </Field>
                      </Box>

                      <Typography level="body-xs" fontWeight="lg" sx={{ color: "neutral.500", mb: 1 }}>Computed Breakdown</Typography>
                      <Box sx={{ border: "1px solid", borderColor: "neutral.200", borderRadius: "sm", overflow: "hidden" }}>
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", px: 2, py: 1, backgroundColor: "primary.100" }}>
                          <Typography level="body-xs" fontWeight="lg">Cost Item</Typography>
                          <Typography level="body-xs" fontWeight="lg">Amount (₹)</Typography>
                        </Box>
                        {([
                          ["RM Cost", computed.rmCost, 0],
                          ["Cutting Cost per pc", computed.cuttingCost, 1],
                          ["Die Factor", computed.dieCost, 1],
                          ["Finish Forging / Conversion Cost", computed.forgingConversionCost, 1],
                          ["Heat Treatment", computed.htShotblastCost, 1],
                          ["Visual Inspection", computed.visualInspectionCost, 1],
                          ["Value Addition", computed.valueAddition, 0],
                        ] as Array<[string, number | null, number]>).map(([label, val, indent]) => (
                          <Box key={label} sx={{ display: "grid", gridTemplateColumns: "1fr auto", px: 2, py: 0.75, pl: indent ? 4 : 2, borderTop: "1px solid", borderColor: "neutral.100" }}>
                            <Typography level="body-sm" sx={{ color: indent ? "neutral.500" : "text.primary" }}>
                              {indent ? "└ " : ""}{label}
                            </Typography>
                            <Typography level="body-sm">{money(val)}</Typography>
                          </Box>
                        ))}
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", px: 2, py: 1, backgroundColor: "success.softBg", borderTop: "1px solid", borderColor: "neutral.200" }}>
                          <Typography level="body-sm" fontWeight="lg">SUB TOTAL</Typography>
                          <Typography level="body-sm" fontWeight="lg">{money(computed.subTotal)}</Typography>
                        </Box>
                        {([
                          [`Rejection Cost (${line.costEstimation.rejectionFactorPct || 0}%)`, computed.rejectionCost],
                          [`ICC (${line.costEstimation.iccFactorPct || 0}%)`, computed.iccCost],
                          ["Transportation", computed.transportationCost],
                          [`Profit on VA (${line.costEstimation.profitOnVaFactorPct || 0}%)`, computed.profitOnVa],
                          ["Scrap", computed.scrapAmount !== null ? -computed.scrapAmount : null],
                        ] as Array<[string, number | null]>).map(([label, val]) => (
                          <Box key={label} sx={{ display: "grid", gridTemplateColumns: "1fr auto", px: 2, py: 0.75, borderTop: "1px solid", borderColor: "neutral.100" }}>
                            <Typography level="body-sm" sx={{ color: "neutral.600" }}>+ {label}</Typography>
                            <Typography level="body-sm">{money(val)}</Typography>
                          </Box>
                        ))}
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", px: 2, py: 1.25, backgroundColor: "primary.700", borderTop: "1px solid", borderColor: "neutral.200" }}>
                          <Typography level="body-sm" fontWeight="lg" sx={{ color: "white" }}>Quoted Price / pc</Typography>
                          <Typography level="body-sm" fontWeight="lg" sx={{ color: "white" }}>{money(computed.quotedPricePerPc)}</Typography>
                        </Box>
                      </Box>
                    </SectionBox>

                    {/* Feasibility Assessment */}
                    <SectionBox muted sx={{ p: 2 }}>
                      <SectionHeader label="FEASIBILITY ASSESSMENT" />

                      <Box sx={{ mb: 2 }}>
                        <Typography level="body-xs" sx={{ mb: 0.5, color: "neutral.600", fontWeight: 500 }}>Process Required</Typography>
                        <ProcessChips options={processes} selected={line.processIds} onToggle={(id) => toggleProcess(line._key, id)} />
                      </Box>

                      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 2, mb: 2 }}>
                        <Field label="Recommended Machine" required>
                          <Select placeholder="Select..." value={line.recommendedMachineId || null} onChange={(_, v) => setLine(line._key, { recommendedMachineId: v ?? "" })} sx={inputSx}>
                            {machines.map((m) => (
                              <Option key={m.id} value={m.id}>{m.name}</Option>
                            ))}
                          </Select>
                        </Field>
                        <Field label="Billet Weight Est. (kg)">
                          <Input type="number" placeholder="0.000" value={line.billetWeightEstKg} onChange={(e) => setLine(line._key, { billetWeightEstKg: e.target.value })} sx={inputSx} />
                        </Field>
                        <Field label="Flash Allowance (%)">
                          <Input type="number" placeholder="e.g. 12.00" value={line.flashAllowancePct} onChange={(e) => setLine(line._key, { flashAllowancePct: e.target.value })} sx={inputSx} />
                        </Field>
                      </Box>

                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                        <Field label="Flags / Risks">
                          <Textarea minRows={2} placeholder="Capacity conflicts, material issues, tooling lead time..." value={line.flagsRisks} onChange={(e) => setLine(line._key, { flagsRisks: e.target.value })} sx={inputSx} />
                        </Field>
                        <Field label="Verdict Remarks">
                          <Textarea minRows={2} placeholder="Rationale for the verdict..." value={line.verdictRemarks} onChange={(e) => setLine(line._key, { verdictRemarks: e.target.value })} sx={inputSx} />
                        </Field>
                      </Box>

                      <Box>
                        <Typography level="body-xs" sx={{ mb: 1, color: "neutral.600", fontWeight: 500 }}>
                          Overall Verdict <Typography component="span" sx={{ color: "danger.500" }}>*</Typography>
                        </Typography>
                        <ToggleButtonGroup
                          value={line.overallVerdict || null}
                          onChange={(_, v) => setLine(line._key, { overallVerdict: (v ?? "") as LineForm["overallVerdict"] })}
                          sx={{ width: "100%" }}
                        >
                          <Button value="Feasible" sx={{ flex: 1 }}>Feasible</Button>
                          <Button value="Conditional" sx={{ flex: 1 }}>Conditional</Button>
                          <Button value="Not_Feasible" sx={{ flex: 1 }}>Not Feasible</Button>
                        </ToggleButtonGroup>
                      </Box>
                    </SectionBox>

                    {/* Tooling / Die Details */}
                    <SectionBox sx={{ overflow: "hidden" }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, backgroundColor: "primary.50" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <BuildOutlinedIcon style={{ fontSize: 16, color: "var(--joy-palette-primary-700)" }} />
                          <Typography level="body-sm" fontWeight="lg" sx={{ color: "primary.800" }}>
                            TOOLING / DIE DETAILS
                          </Typography>
                          <Typography level="body-xs" sx={{ color: "primary.600" }}>— {line.toolingSets.length} set{line.toolingSets.length !== 1 ? "s" : ""}</Typography>
                        </Box>
                        <Button size="sm" startDecorator={<AddIcon />} onClick={() => addToolingSet(line._key)}>
                          Add Die / Tool
                        </Button>
                      </Box>

                      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                        {line.toolingSets.length === 0 && (
                          <Typography level="body-sm" sx={{ color: "neutral.400", textAlign: "center", py: 2 }}>
                            No tooling sets added yet.
                          </Typography>
                        )}
                        {line.toolingSets.map((ts, tsIdx) => {
                          const amortPerPc = hasVal(ts.estimatedDieCost) && hasVal(ts.dieAmortisationQty) && n(ts.dieAmortisationQty) > 0
                            ? n(ts.estimatedDieCost) / n(ts.dieAmortisationQty)
                            : null;
                          return (
                            <SectionBox key={ts._key} muted sx={{ p: 2 }}>
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                                <Typography level="body-xs" fontWeight="lg" sx={{ color: "primary.700" }}>
                                  Die / Tooling Set #{tsIdx + 1}
                                </Typography>
                                <Button size="sm" variant="plain" color="danger" sx={{ minWidth: 0 }} onClick={() => removeToolingSet(line._key, ts._key)}>
                                  <DeleteOutlinedIcon style={{ fontSize: 16 }} />
                                </Button>
                              </Box>
                              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 2, mb: 1.5 }}>
                                <Field label="Die Drawing">
                                  <Select placeholder="Select..." value={ts.dieDrawingStatus || null} onChange={(_, v) => setToolingSet(line._key, ts._key, { dieDrawingStatus: (v ?? "") as ToolingSetForm["dieDrawingStatus"] })} sx={inputSx}>
                                    <Option value="Customer_Provides">Customer Provides</Option>
                                    <Option value="To_Be_Developed">To Be Developed</Option>
                                    <Option value="Existing_Die">Existing Die</Option>
                                  </Select>
                                </Field>
                                <Field label="Est. Die Cost (₹)">
                                  <Input type="number" placeholder="0" value={ts.estimatedDieCost} onChange={(e) => setToolingSet(line._key, ts._key, { estimatedDieCost: e.target.value })} sx={inputSx} />
                                </Field>
                                <Field label="Amortisation Qty">
                                  <Input type="number" placeholder="e.g. 10000" value={ts.dieAmortisationQty} onChange={(e) => setToolingSet(line._key, ts._key, { dieAmortisationQty: e.target.value })} sx={inputSx} />
                                </Field>
                                <Field label="Amort. per pc (₹)" auto>
                                  <Input readOnly value={amortPerPc !== null ? amortPerPc.toFixed(2) : "—"} sx={autoInputSx} />
                                </Field>
                              </Box>
                              <Field label="Die Remarks">
                                <Textarea minRows={2} placeholder="Condition, supplier, lead time..." value={ts.dieRemarks} onChange={(e) => setToolingSet(line._key, ts._key, { dieRemarks: e.target.value })} sx={inputSx} />
                              </Field>
                            </SectionBox>
                          );
                        })}
                      </Box>
                    </SectionBox>
                  </Box>
                )}
              </SectionBox>
            );
          })}
        </Box>
      )}

      {/* ── Actions ── */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", justifyContent: "flex-end", mt: 3, flexWrap: "wrap" }}>
        <Button variant="outlined" color="neutral" onClick={() => router.push("/feasibility-study")} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="solid" color="success"
          startDecorator={submitting ? <CircularProgress size="sm" /> : <SendOutlinedIcon />}
          onClick={() => submit("Submitted_for_Review")}
          disabled={submitting}
        >
          Submit for Review
        </Button>
        <Button
          variant="solid"
          sx={{ backgroundColor: "#b39ddb", "&:hover": { backgroundColor: "#a48cd0" } }}
          startDecorator={generating ? <CircularProgress size="sm" /> : <DescriptionOutlinedIcon />}
          onClick={handleGenerateQuotation}
          disabled={mode === "new" || generating}
        >
          Generate Quotation
        </Button>
      </Box>
    </Box>
  );
}
