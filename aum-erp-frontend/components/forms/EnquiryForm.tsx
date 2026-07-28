"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Input from "@mui/joy/Input";
import Textarea from "@mui/joy/Textarea";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import Divider from "@mui/joy/Divider";
import Chip from "@mui/joy/Chip";
import Checkbox from "@mui/joy/Checkbox";
import CircularProgress from "@mui/joy/CircularProgress";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import {
  getCustomers,
  getParts,
  getPartFeasibilityStudies,
  createEnquiry,
  updateEnquiry,
  type CustomerOption,
  type PartOption,
  type FeasibilityOption,
} from "@/services/api_service";

// ── types ─────────────────────────────────────────────────────────────────────

interface DieSet {
  _key: string;
  dieDrawingAvailable: "" | "Customer_Provides" | "To_Be_Developed" | "Existing_Die";
  estimatedDieCost: string;
  dieAmortisationQty: string;
  dieRemarks: string;
}

interface LineForm {
  _key: string;
  expanded: boolean;
  partId: string;
  feasibilityId: string;
  loadingFS: boolean;
  feasibilityStudies: FeasibilityOption[];
  qtyPerMonth: string;
  suggestedMachine: "" | "Press_1000T" | "Belt_Hammer_075T" | "TBD";
  heatTreatmentRequired: boolean;
  heatTreatmentSpec: string;
  specialRequirements: string;
  lineRemarks: string;
  dieSets: DieSet[];
}

function newKey() {
  return Math.random().toString(36).slice(2);
}

function emptyDieSet(): DieSet {
  return { _key: newKey(), dieDrawingAvailable: "", estimatedDieCost: "", dieAmortisationQty: "", dieRemarks: "" };
}

function emptyLine(): LineForm {
  return {
    _key: newKey(), expanded: true, partId: "", feasibilityId: "",
    loadingFS: false, feasibilityStudies: [], qtyPerMonth: "",
    suggestedMachine: "", heatTreatmentRequired: false,
    heatTreatmentSpec: "", specialRequirements: "", lineRemarks: "",
    dieSets: [emptyDieSet()],
  };
}

// ── sub-components ────────────────────────────────────────────────────────────

function SectionBox({ children, sx }: { children: React.ReactNode; sx?: object }) {
  return (
    <Box sx={{ border: "1px solid", borderColor: "neutral.200", borderRadius: "md", backgroundColor: "background.surface", ...sx }}>
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

function Field({ label, required, children, span }: {
  label: string; required?: boolean; children: React.ReactNode; span?: number;
}) {
  return (
    <Box sx={span ? { gridColumn: `span ${span}` } : {}}>
      <Typography level="body-xs" sx={{ mb: 0.5, color: "neutral.600", fontWeight: 500 }}>
        {label}
        {required && <Typography component="span" sx={{ color: "danger.500" }}> *</Typography>}
      </Typography>
      {children}
    </Box>
  );
}

// ── props ─────────────────────────────────────────────────────────────────────

export interface EnquiryInitialData {
  enquiryId: number;
  enquiryNumber: string;
  customerId: number;
  enquiryDate: string;
  receivedBy: string | null;
  status: string;
  remarks: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enquiryLines: any[];
}

interface Props {
  mode: "new" | "edit";
  enquiryId?: string;
  initialData?: EnquiryInitialData;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function EnquiryForm({ mode, enquiryId, initialData }: Props) {
  const router = useRouter();

  // header
  const [enquiryNumber] = useState(initialData?.enquiryNumber ?? "");
  const [customerId, setCustomerId] = useState(initialData ? String(initialData.customerId) : "");
  const [enquiryDate, setEnquiryDate] = useState(
    initialData?.enquiryDate
      ? new Date(initialData.enquiryDate).toLocaleDateString("en-CA")
      : new Date().toLocaleDateString("en-CA"),
  );
  const [receivedBy, setReceivedBy] = useState(initialData?.receivedBy ?? "");
  const [status, setStatus] = useState(initialData?.status ?? "Open");
  const [remarks, setRemarks] = useState(initialData?.remarks ?? "");

  // lines
  const [lines, setLines] = useState<LineForm[]>(() => {
    if (!initialData?.enquiryLines?.length) return [emptyLine()];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return initialData.enquiryLines.map((l: any) => ({
      _key: newKey(),
      expanded: true,
      partId: String(l.partId),
      feasibilityId: l.feasibilityId ? String(l.feasibilityId) : "",
      loadingFS: false,
      feasibilityStudies: l.feasibilityId && l.feasibilityStudy
        ? [{ id: String(l.feasibilityStudy.feasibilityId), label: `FS-${l.feasibilityStudy.feasibilityId}${l.feasibilityStudy.overallVerdict ? ` · ${l.feasibilityStudy.overallVerdict}` : ""}`, machine: l.feasibilityStudy.recommendedMachine ?? null }]
        : [],
      qtyPerMonth: l.qtyPerMonth ? String(l.qtyPerMonth) : "",
      suggestedMachine: (l.suggestedMachine ?? "") as LineForm["suggestedMachine"],
      heatTreatmentRequired: l.heatTreatmentRequired ?? false,
      heatTreatmentSpec: l.heatTreatmentSpec ?? "",
      specialRequirements: l.specialRequirements ?? "",
      lineRemarks: l.lineRemarks ?? "",
      dieSets: l.part?.toolingDetails?.length
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? l.part.toolingDetails.map((td: any) => ({
            _key: newKey(),
            dieDrawingAvailable: td.dieDrawingAvailable ?? "",
            estimatedDieCost: td.estimatedDieCost ? String(td.estimatedDieCost) : "",
            dieAmortisationQty: td.dieAmortisationQty ? String(td.dieAmortisationQty) : "",
            dieRemarks: td.dieRemarks ?? "",
          }))
        : [emptyDieSet()],
    }));
  });

  // lookups
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [parts, setParts] = useState<PartOption[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getCustomers(), getParts()])
      .then(([c, p]) => { setCustomers(c); setParts(p); })
      .finally(() => setLoadingInit(false));
  }, []);

  // when part is selected in a line, fetch its FS
  const handlePartChange = useCallback(async (lineKey: string, partId: string) => {
    setLines((prev) => prev.map((l) =>
      l._key !== lineKey ? l
        : { ...l, partId, feasibilityId: "", feasibilityStudies: [], loadingFS: !!partId, suggestedMachine: "" },
    ));
    if (!partId) return;
    const options = await getPartFeasibilityStudies(partId);
    setLines((prev) => prev.map((l) => {
      if (l._key !== lineKey) return l;
      const auto = options.length === 1 ? options[0] : null;
      return {
        ...l,
        loadingFS: false,
        feasibilityStudies: options,
        feasibilityId: auto ? auto.id : "",
        suggestedMachine: auto?.machine
          ? (auto.machine as LineForm["suggestedMachine"])
          : l.suggestedMachine,
      };
    }));
  }, []);

  // when FS is selected, populate machine
  const handleFSChange = useCallback((lineKey: string, fsId: string) => {
    setLines((prev) => prev.map((l) => {
      if (l._key !== lineKey) return l;
      const fs = l.feasibilityStudies.find((s) => s.id === fsId);
      return {
        ...l,
        feasibilityId: fsId,
        suggestedMachine: fs?.machine
          ? (fs.machine as LineForm["suggestedMachine"])
          : l.suggestedMachine,
      };
    }));
  }, []);

  function setLine(key: string, patch: Partial<LineForm>) {
    setLines((prev) => prev.map((l) => l._key === key ? { ...l, ...patch } : l));
  }

  function setDie(lineKey: string, dieKey: string, patch: Partial<DieSet>) {
    setLines((prev) => prev.map((l) => {
      if (l._key !== lineKey) return l;
      return { ...l, dieSets: l.dieSets.map((d) => d._key === dieKey ? { ...d, ...patch } : d) };
    }));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l._key !== key));
  }

  function addDie(lineKey: string) {
    setLines((prev) => prev.map((l) => l._key !== lineKey ? l : { ...l, dieSets: [...l.dieSets, emptyDieSet()] }));
  }

  function removeDie(lineKey: string, dieKey: string) {
    setLines((prev) => prev.map((l) => l._key !== lineKey ? l : { ...l, dieSets: l.dieSets.filter((d) => d._key !== dieKey) }));
  }

  // ── summary ────────────────────────────────────────────────────────────────

  const totalDieSets = lines.reduce((a, l) => a + l.dieSets.length, 0);
  const totalQtyMonth = lines.reduce((a, l) => a + (parseInt(l.qtyPerMonth) || 0), 0);
  const totalQtyYear = totalQtyMonth * 12;
  const totalDieCost = lines.reduce((a, l) =>
    a + l.dieSets.reduce((s, d) => s + (parseFloat(d.estimatedDieCost) || 0), 0), 0);

  // ── submit ─────────────────────────────────────────────────────────────────

  async function submit(submitStatus?: string) {
    if (!customerId) return alert("Please select a customer");
    if (lines.some((l) => !l.partId)) return alert("Please select a part for each line");
    setSubmitting(true);
    try {
      const dto: Record<string, unknown> = {
        customerId: parseInt(customerId),
        enquiryDate,
        receivedBy: receivedBy || undefined,
        status: submitStatus ?? status,
        remarks: remarks || undefined,
        lines: lines.map((l) => ({
          partId: parseInt(l.partId),
          feasibilityId: l.feasibilityId ? parseInt(l.feasibilityId) : undefined,
          qtyPerMonth: l.qtyPerMonth ? parseInt(l.qtyPerMonth) : undefined,
          qtyPerYear: l.qtyPerMonth ? parseInt(l.qtyPerMonth) * 12 : undefined,
          suggestedMachine: l.suggestedMachine || undefined,
          heatTreatmentRequired: l.heatTreatmentRequired,
          heatTreatmentSpec: l.heatTreatmentSpec || undefined,
          specialRequirements: l.specialRequirements || undefined,
          lineRemarks: l.lineRemarks || undefined,
          toolingDetails: l.dieSets
            .filter((d) => d.estimatedDieCost || d.dieRemarks || d.dieDrawingAvailable)
            .map((d) => ({
              dieDrawingAvailable: d.dieDrawingAvailable || undefined,
              estimatedDieCost: d.estimatedDieCost ? parseFloat(d.estimatedDieCost) : undefined,
              dieAmortisationQty: d.dieAmortisationQty ? parseInt(d.dieAmortisationQty) : undefined,
              dieAmortisationPerPc:
                d.estimatedDieCost && d.dieAmortisationQty
                  ? parseFloat(d.estimatedDieCost) / parseInt(d.dieAmortisationQty)
                  : undefined,
              dieRemarks: d.dieRemarks || undefined,
            })),
        })),
      };

      if (mode === "new") {
        await createEnquiry(dto);
      } else {
        await updateEnquiry(enquiryId!, dto);
      }
      router.push("/enquiries");
    } catch (err) {
      console.error(err);
      alert("Failed to save enquiry");
    } finally {
      setSubmitting(false);
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

  const inputSx = { backgroundColor: "background.surface" };
  const filteredParts = customerId
    ? parts.filter((p) => String(p.customerId) === customerId)
    : parts;

  const titleLine = `${lines.length} part${lines.length !== 1 ? "s" : ""} · ${totalDieSets} die${totalDieSets !== 1 ? "s" : ""}`;

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", pb: 8 }}>
      {/* ── Page Header ── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Button variant="plain" color="neutral" size="sm" startDecorator={<ArrowBackIcon />} onClick={() => router.push("/enquiries")}>
              Enquiries
            </Button>
            <Typography level="body-sm" sx={{ color: "neutral.400" }}>/</Typography>
            <Typography level="body-sm">{mode === "new" ? "New Enquiry" : enquiryNumber}</Typography>
          </Box>
          <Typography level="h3">{mode === "new" ? "New Enquiry" : enquiryNumber}</Typography>
          <Typography level="body-sm" sx={{ color: "neutral.500" }}>{titleLine}</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button variant="outlined" color="neutral" onClick={() => router.push("/enquiries")} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startDecorator={submitting ? <CircularProgress size="sm" /> : undefined}
            onClick={() => submit("Open")}
            disabled={submitting}
          >
            Save Draft
          </Button>
          <Button
            color="success"
            startDecorator={submitting ? <CircularProgress size="sm" /> : undefined}
            onClick={() => submit()}
            disabled={submitting}
          >
            Submit
          </Button>
        </Box>
      </Box>

      {/* ── Enquiry Header ── */}
      <SectionBox sx={{ mb: 3, p: 3 }}>
        <SectionHeader label="ENQUIRY HEADER" />
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, mb: 2 }}>
          <Field label="Enquiry Number">
            <Input value={enquiryNumber || (mode === "new" ? "Auto-generated" : "")} disabled sx={{ backgroundColor: "neutral.100", color: "neutral.500" }} />
          </Field>
          <Field label="Customer" required>
            <Select
              placeholder="— Select customer —"
              value={customerId || null}
              onChange={(_, v) => { setCustomerId(v ?? ""); }}
              sx={inputSx}
            >
              {customers.map((c) => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Field>
          <Field label="Enquiry Date" required>
            <Input type="date" value={enquiryDate} onChange={(e) => setEnquiryDate(e.target.value)} sx={inputSx} />
          </Field>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
          <Field label="Received By">
            <Input placeholder="Arjun Kumar" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} sx={inputSx} />
          </Field>
          <Field label="Status" required>
            <Select value={status} onChange={(_, v) => v && setStatus(v)} sx={inputSx}>
              <Option value="Open">Open</Option>
              <Option value="Feasibility">Feasibility</Option>
              <Option value="Quoted">Quoted</Option>
              <Option value="Won">Won</Option>
              <Option value="Lost">Lost</Option>
              <Option value="On_Hold">On Hold</Option>
            </Select>
          </Field>
          <Field label="Remarks">
            <Input placeholder="General notes..." value={remarks} onChange={(e) => setRemarks(e.target.value)} sx={inputSx} />
          </Field>
        </Box>
      </SectionBox>

      {/* ── Enquiry Lines ── */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 1 }}>
          <Box>
            <Typography level="title-lg">Enquiry Lines</Typography>
            <Typography level="body-xs" sx={{ color: "neutral.500" }}>
              Select one or more parts. Each line links a part to a feasibility study and captures tooling requirements.
            </Typography>
          </Box>
          <Button size="sm" onClick={addLine}>
            + Add Part
          </Button>
        </Box>

        {lines.map((line, lineIdx) => {
          const partName = filteredParts.find((p) => p.id === line.partId)?.name;
          const dieCount = line.dieSets.length;

          return (
            <SectionBox key={line._key} sx={{ mb: 2 }}>
              {/* Line header */}
              <Box
                onClick={() => setLine(line._key, { expanded: !line.expanded })}
                sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5, cursor: "pointer", borderBottom: line.expanded ? "1px solid" : "none", borderColor: "neutral.200", userSelect: "none" }}
              >
                {line.expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                <Chip size="sm" color="primary" variant="soft">LINE {lineIdx + 1}</Chip>
                <Typography level="body-sm" sx={{ color: partName ? "text.primary" : "neutral.400", flex: 1 }}>
                  {partName ?? "Select a part..."}
                </Typography>
                <Typography level="body-xs" sx={{ color: "neutral.500" }}>{dieCount} die{dieCount !== 1 ? "s" : ""}</Typography>
                {lines.length > 1 && (
                  <Button
                    size="sm" variant="plain" color="danger"
                    onClick={(e) => { e.stopPropagation(); removeLine(line._key); }}
                    sx={{ minWidth: 0, px: 0.5 }}
                  >
                    <DeleteOutlinedIcon style={{ fontSize: 16 }} />
                  </Button>
                )}
              </Box>

              {line.expanded && (
                <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>

                  {/* Part & Feasibility Study */}
                  <SectionBox sx={{ p: 2 }}>
                    <SectionHeader label="PART & FEASIBILITY STUDY" />
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                      <Field label="Part" required>
                        <Select
                          placeholder="— Select part —"
                          value={line.partId || null}
                          onChange={(_, v) => handlePartChange(line._key, v ?? "")}
                          sx={inputSx}
                        >
                          {filteredParts.map((p) => (
                            <Option key={p.id} value={p.id}>{p.name}{p.drawingNumber ? ` (${p.drawingNumber})` : ""}</Option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Feasibility Study" required>
                        {line.loadingFS ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, height: 36 }}>
                            <CircularProgress size="sm" />
                            <Typography level="body-sm" sx={{ color: "neutral.400" }}>Loading...</Typography>
                          </Box>
                        ) : (
                          <Select
                            placeholder={line.partId ? (line.feasibilityStudies.length ? "Select study..." : "No studies found") : "Select a part first"}
                            value={line.feasibilityId || null}
                            onChange={(_, v) => handleFSChange(line._key, v ?? "")}
                            disabled={!line.partId || line.feasibilityStudies.length === 0}
                            sx={inputSx}
                          >
                            {line.feasibilityStudies.map((s) => (
                              <Option key={s.id} value={s.id}>{s.label}</Option>
                            ))}
                          </Select>
                        )}
                      </Field>
                    </Box>
                  </SectionBox>

                  {/* Production Requirements */}
                  <SectionBox sx={{ p: 2 }}>
                    <SectionHeader label="PRODUCTION REQUIREMENTS" />
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 2, mb: 2 }}>
                      <Field label="Qty per Month">
                        <Input type="number" placeholder="e.g. 500" value={line.qtyPerMonth} onChange={(e) => setLine(line._key, { qtyPerMonth: e.target.value })} sx={inputSx} />
                      </Field>
                      <Field label="Qty per Year (auto)">
                        <Input
                          value={line.qtyPerMonth ? String(parseInt(line.qtyPerMonth) * 12) : "—"}
                          disabled
                          sx={{ backgroundColor: "neutral.100", color: "neutral.500", fontStyle: "italic" }}
                        />
                      </Field>
                      <Field label="Suggested Machine">
                        <Select
                          placeholder="Select or inherit from FS..."
                          value={line.suggestedMachine || null}
                          onChange={(_, v) => setLine(line._key, { suggestedMachine: (v ?? "") as LineForm["suggestedMachine"] })}
                          sx={inputSx}
                        >
                          <Option value="Press_1000T">1000T Press</Option>
                          <Option value="Belt_Hammer_075T">0.75T Belt Hammer</Option>
                          <Option value="TBD">TBD</Option>
                        </Select>
                      </Field>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Checkbox
                        label="Heat Treatment Required"
                        checked={line.heatTreatmentRequired}
                        onChange={(e) => setLine(line._key, { heatTreatmentRequired: e.target.checked })}
                      />
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                      <Field label="Special Requirements">
                        <Textarea minRows={2} placeholder="NDT, surface treatment, certifications, inspection clauses..." value={line.specialRequirements} onChange={(e) => setLine(line._key, { specialRequirements: e.target.value })} sx={inputSx} />
                      </Field>
                      <Field label="Line Remarks">
                        <Textarea minRows={2} placeholder="Any notes specific to this line item..." value={line.lineRemarks} onChange={(e) => setLine(line._key, { lineRemarks: e.target.value })} sx={inputSx} />
                      </Field>
                    </Box>
                  </SectionBox>

                  {/* Tooling / Die Details */}
                  <SectionBox sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <BuildOutlinedIcon style={{ fontSize: 14, color: "var(--joy-palette-primary-500)" }} />
                        <Typography level="body-xs" fontWeight="lg" sx={{ letterSpacing: "0.08em", color: "neutral.500" }}>
                          TOOLING / DIE DETAILS
                        </Typography>
                        <Typography level="body-xs" sx={{ color: "neutral.500" }}>— {line.dieSets.length} set{line.dieSets.length !== 1 ? "s" : ""}</Typography>
                      </Box>
                      <Button size="sm" variant="outlined" onClick={() => addDie(line._key)}>
                        + Add Die / Tool
                      </Button>
                    </Box>

                    {line.dieSets.map((die, dieIdx) => {
                      const amortPerPc =
                        die.estimatedDieCost && die.dieAmortisationQty
                          ? (parseFloat(die.estimatedDieCost) / parseInt(die.dieAmortisationQty)).toFixed(2)
                          : "—";
                      return (
                        <Box key={die._key} sx={{ mb: dieIdx < line.dieSets.length - 1 ? 2 : 0 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                            <Typography level="body-xs" fontWeight="lg" sx={{ color: "primary.600" }}>
                              Die / Tooling Set #{dieIdx + 1}
                            </Typography>
                            {line.dieSets.length > 1 && (
                              <Button size="sm" variant="plain" color="danger" sx={{ minWidth: 0 }} onClick={() => removeDie(line._key, die._key)}>
                                <DeleteOutlinedIcon style={{ fontSize: 14 }} />
                              </Button>
                            )}
                          </Box>
                          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 2, mb: 1.5 }}>
                            <Field label="Die Drawing">
                              <Select
                                placeholder="Select..."
                                value={die.dieDrawingAvailable || null}
                                onChange={(_, v) => setDie(line._key, die._key, { dieDrawingAvailable: (v ?? "") as DieSet["dieDrawingAvailable"] })}
                                sx={inputSx}
                              >
                                <Option value="Customer_Provides">Customer Provides</Option>
                                <Option value="To_Be_Developed">To Be Developed</Option>
                                <Option value="Existing_Die">Existing Die</Option>
                              </Select>
                            </Field>
                            <Field label="Est. Die Cost (₹)">
                              <Input type="number" placeholder="0" value={die.estimatedDieCost} onChange={(e) => setDie(line._key, die._key, { estimatedDieCost: e.target.value })} sx={inputSx} />
                            </Field>
                            <Field label="Amortisation Qty">
                              <Input type="number" placeholder="e.g. 10000" value={die.dieAmortisationQty} onChange={(e) => setDie(line._key, die._key, { dieAmortisationQty: e.target.value })} sx={inputSx} />
                            </Field>
                            <Field label="Amort. per pc (₹) (auto)">
                              <Input value={amortPerPc} disabled sx={{ backgroundColor: "neutral.100", color: "neutral.500", fontStyle: "italic" }} />
                            </Field>
                          </Box>
                          <Field label="Die Remarks">
                            <Textarea minRows={2} placeholder="Condition, supplier, lead time..." value={die.dieRemarks} onChange={(e) => setDie(line._key, die._key, { dieRemarks: e.target.value })} sx={inputSx} />
                          </Field>
                          {dieIdx < line.dieSets.length - 1 && <Divider sx={{ mt: 2 }} />}
                        </Box>
                      );
                    })}
                  </SectionBox>
                </Box>
              )}
            </SectionBox>
          );
        })}
      </Box>

      {/* ── Summary Bar ── */}
      <Box sx={{ position: "sticky", bottom: 0, mx: -3, px: 3, py: 1.5, backgroundColor: "background.surface", borderTop: "1px solid", borderColor: "neutral.200", display: "flex", gap: 3, alignItems: "center" }}>
        <Typography level="body-sm"><strong>Parts:</strong> {lines.length}</Typography>
        <Typography level="body-sm"><strong>Total Die Sets:</strong> {totalDieSets}</Typography>
        <Typography level="body-sm"><strong>Total Qty/Month:</strong> {totalQtyMonth || 0}</Typography>
        <Typography level="body-sm"><strong>Total Qty/Year:</strong> {totalQtyYear || 0}</Typography>
        <Typography level="body-sm"><strong>Est. Total Die Cost:</strong> ₹{totalDieCost.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Typography>
      </Box>
    </Box>
  );
}
