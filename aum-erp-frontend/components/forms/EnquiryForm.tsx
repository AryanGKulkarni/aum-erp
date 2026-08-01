"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import IconButton from "@mui/joy/IconButton";
import Input from "@mui/joy/Input";
import Textarea from "@mui/joy/Textarea";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import Chip from "@mui/joy/Chip";
import CircularProgress from "@mui/joy/CircularProgress";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AddCustomerModal from "./AddCustomerModal";
import {
  getCustomers,
  getMachines,
  getUsers,
  createEnquiry,
  updateEnquiry,
  uploadEnquiryLineAttachments,
  viewEnquiryAttachment,
  deleteEnquiryAttachment,
  type CustomerOption,
  type MachineOption,
  type UserOption,
} from "@/services/api_service";

// ── types ─────────────────────────────────────────────────────────────────────

interface ExistingAttachment {
  attachmentId: number;
  fileName: string;
  uploadedAt: string;
}

interface LineForm {
  _key: string;
  expanded: boolean;
  lineId?: number;
  partName: string;
  partDrawingNumber: string;
  materialGrade: string;
  supplyType: "" | "With_Material" | "Labour";
  qtyPerMonth: string;
  suggestedMachineId: string;
  deliveryState: "" | "As_Forged" | "Machined";
  specialRequirements: string;
  lineRemarks: string;
  files: File[];
  existingAttachments: ExistingAttachment[];
}

function newKey() {
  return Math.random().toString(36).slice(2);
}

function emptyLine(): LineForm {
  return {
    _key: newKey(), expanded: true, partName: "", partDrawingNumber: "", materialGrade: "",
    supplyType: "", qtyPerMonth: "", suggestedMachineId: "", deliveryState: "",
    specialRequirements: "", lineRemarks: "", files: [], existingAttachments: [],
  };
}

// ── sub-components ────────────────────────────────────────────────────────────

// Between Joy's neutral.50 and neutral.100 steps — no native token sits here.
const MUTED_GREY = "#F1F1F4";

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
    <Box sx={span ? { gridColumn: `span ${span}` } : {}}>
      <Typography level="body-xs" sx={{ mb: 0.5, color: "neutral.600", fontWeight: 500 }}>
        {label}
        {required && <Typography component="span" sx={{ color: "danger.500" }}> *</Typography>}
        {auto && <Typography component="span" sx={{ color: "primary.600", fontWeight: 600 }}> (auto)</Typography>}
      </Typography>
      {children}
    </Box>
  );
}

function SupplyTypeToggle({ value, onChange }: {
  value: LineForm["supplyType"];
  onChange: (v: "With_Material" | "Labour") => void;
}) {
  const options: Array<{ v: "With_Material" | "Labour"; label: string }> = [
    { v: "With_Material", label: "With Material" },
    { v: "Labour", label: "Labour" },
  ];
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, border: "1px solid", borderColor: "neutral.300", borderRadius: "sm", overflow: "hidden" }}>
      {options.map((opt, i) => (
        <Box
          key={opt.v}
          onClick={() => onChange(opt.v)}
          sx={{
            textAlign: "center", py: 1, cursor: "pointer", userSelect: "none",
            borderLeft: i > 0 ? "1px solid" : "none", borderColor: "neutral.300",
            backgroundColor: value === opt.v ? "primary.100" : MUTED_GREY,
            color: value === opt.v ? "primary.700" : "neutral.600",
            fontWeight: value === opt.v ? 600 : 400,
            fontSize: "0.875rem",
          }}
        >
          {opt.label}
        </Box>
      ))}
    </Box>
  );
}

function LineAttachments({ line, onFilesAdded, onRemoveStaged, onDeleteExisting, onOpenExisting }: {
  line: LineForm;
  onFilesAdded: (files: File[]) => void;
  onRemoveStaged: (index: number) => void;
  onDeleteExisting: (attachmentId: number) => void;
  onOpenExisting: (attachmentId: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    onFilesAdded(Array.from(fileList));
  }

  return (
    <Box>
      <Typography level="body-xs" sx={{ mb: 0.5, color: "neutral.600", fontWeight: 500 }}>
        Attach Drawings <Typography component="span" sx={{ color: "neutral.400" }}>(PDF, DXF, DWG, images)</Typography>
      </Typography>
      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={(e) => { handleFiles(e.target.files); if (inputRef.current) inputRef.current.value = ""; }}
      />
      <Box
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        sx={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          py: 2.5, borderRadius: "sm", border: "1px dashed", cursor: "pointer",
          borderColor: dragOver ? "primary.400" : "neutral.300",
          color: dragOver ? "primary.500" : "neutral.500",
          backgroundColor: dragOver ? "primary.50" : "transparent",
        }}
      >
        <FileUploadOutlinedIcon style={{ fontSize: 22, marginBottom: 4 }} />
        <Typography level="body-sm">
          Drop files or <Typography component="span" sx={{ color: "primary.500", fontWeight: 600 }}>browse</Typography>
        </Typography>
      </Box>

      {(line.existingAttachments.length > 0 || line.files.length > 0) && (
        <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
          {line.existingAttachments.map((att) => (
            <Box key={att.attachmentId} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, borderRadius: "sm", border: "1px solid", borderColor: "neutral.200" }}>
              <AttachFileIcon style={{ fontSize: 14, color: "var(--joy-palette-neutral-500)" }} />
              <Typography level="body-xs" sx={{ flex: 1 }} noWrap>{att.fileName}</Typography>
              <IconButton size="sm" variant="plain" onClick={() => onOpenExisting(att.attachmentId)}>
                <OpenInNewIcon style={{ fontSize: 14 }} />
              </IconButton>
              <IconButton size="sm" variant="plain" color="danger" onClick={() => onDeleteExisting(att.attachmentId)}>
                <DeleteOutlinedIcon style={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          ))}
          {line.files.map((file, i) => (
            <Box key={`${file.name}-${i}`} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, borderRadius: "sm", border: "1px solid", borderColor: "neutral.200", backgroundColor: "neutral.50" }}>
              <AttachFileIcon style={{ fontSize: 14, color: "var(--joy-palette-neutral-500)" }} />
              <Typography level="body-xs" sx={{ flex: 1 }} noWrap>{file.name}</Typography>
              <Chip size="sm" variant="soft" color="neutral">Pending upload</Chip>
              <IconButton size="sm" variant="plain" color="danger" onClick={() => onRemoveStaged(i)}>
                <DeleteOutlinedIcon style={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ── props ─────────────────────────────────────────────────────────────────────

export interface EnquiryInitialData {
  enquiryId: number;
  enquiryNumber: string;
  customerId: number;
  enquiryDate: string;
  receivedBy: number | null;
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
  const [receivedBy, setReceivedBy] = useState(initialData?.receivedBy ? String(initialData.receivedBy) : "");
  const [status, setStatus] = useState(initialData?.status ?? "Draft");
  const [remarks, setRemarks] = useState(initialData?.remarks ?? "");

  // lines
  const [lines, setLines] = useState<LineForm[]>(() => {
    if (!initialData?.enquiryLines?.length) return [emptyLine()];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return initialData.enquiryLines.map((l: any) => ({
      _key: newKey(),
      expanded: true,
      lineId: l.lineId,
      partName: l.part?.partName ?? "",
      partDrawingNumber: l.part?.partDrawingNumber ?? "",
      materialGrade: l.part?.materialGrade ?? "",
      supplyType: (l.supplyType ?? "") as LineForm["supplyType"],
      qtyPerMonth: l.qtyPerMonth ? String(l.qtyPerMonth) : "",
      suggestedMachineId: l.suggestedMachineId ? String(l.suggestedMachineId) : "",
      deliveryState: (l.deliveryState ?? "") as LineForm["deliveryState"],
      specialRequirements: l.specialRequirements ?? "",
      lineRemarks: l.lineRemarks ?? "",
      files: [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      existingAttachments: (l.attachments ?? []).map((a: any) => ({
        attachmentId: a.attachmentId,
        fileName: a.fileName,
        uploadedAt: a.uploadedAt,
      })),
    }));
  });

  // lookups
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [machines, setMachines] = useState<MachineOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([getCustomers(), getMachines(), getUsers()])
      .then(([c, m, u]) => { setCustomers(c); setMachines(m); setUsers(u); })
      .finally(() => setLoadingInit(false));
  }, []);

  function setLine(key: string, patch: Partial<LineForm>) {
    setLines((prev) => prev.map((l) => l._key === key ? { ...l, ...patch } : l));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l._key !== key));
  }

  function addFilesToLine(key: string, newFiles: File[]) {
    setLines((prev) => prev.map((l) => l._key !== key ? l : { ...l, files: [...l.files, ...newFiles] }));
  }

  function removeStagedFile(key: string, index: number) {
    setLines((prev) => prev.map((l) => l._key !== key ? l : { ...l, files: l.files.filter((_, i) => i !== index) }));
  }

  async function handleOpenAttachment(attachmentId: number) {
    try {
      const url = await viewEnquiryAttachment(attachmentId);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      alert("Could not open attachment");
    }
  }

  async function handleDeleteAttachment(key: string, attachmentId: number) {
    try {
      await deleteEnquiryAttachment(attachmentId);
      setLines((prev) => prev.map((l) => l._key !== key
        ? l
        : { ...l, existingAttachments: l.existingAttachments.filter((a) => a.attachmentId !== attachmentId) }));
    } catch {
      alert("Could not delete attachment");
    }
  }

  // ── summary ────────────────────────────────────────────────────────────────

  const totalQtyMonth = lines.reduce((a, l) => a + (parseInt(l.qtyPerMonth) || 0), 0);
  const totalQtyYear = totalQtyMonth * 12;

  // ── submit ─────────────────────────────────────────────────────────────────

  async function submit(submitStatus?: string) {
    if (!customerId) return alert("Please select a customer");
    if (lines.some((l) => !l.partName.trim())) return alert("Please enter a part name for each line");
    if (lines.some((l) => !l.supplyType)) return alert("Please select a supply type for each line");

    setSubmitting(true);
    try {
      const dto: Record<string, unknown> = {
        customerId: parseInt(customerId),
        enquiryDate,
        receivedBy: receivedBy ? parseInt(receivedBy) : undefined,
        status: submitStatus ?? status,
        remarks: remarks || undefined,
        lines: lines.map((l) => ({
          lineId: l.lineId,
          part: l.lineId ? undefined : {
            partName: l.partName,
            partDrawingNumber: l.partDrawingNumber || undefined,
            materialGrade: l.materialGrade || undefined,
          },
          supplyType: l.supplyType,
          qtyPerMonth: l.qtyPerMonth ? parseInt(l.qtyPerMonth) : undefined,
          suggestedMachineId: l.suggestedMachineId ? parseInt(l.suggestedMachineId) : undefined,
          deliveryState: l.deliveryState || undefined,
          specialRequirements: l.specialRequirements || undefined,
          lineRemarks: l.lineRemarks || undefined,
        })),
      };

      if (mode === "new") {
        const created = await createEnquiry(dto);
        await Promise.all(
          created.enquiryLines.map((createdLine, i) => {
            const files = lines[i]?.files;
            return files?.length ? uploadEnquiryLineAttachments(createdLine.lineId, files) : Promise.resolve([]);
          }),
        );
      } else {
        const updated = await updateEnquiry(enquiryId!, dto);
        await Promise.all(
          lines.map((l, i) => {
            if (!l.files.length) return Promise.resolve([]);
            const lineId = l.lineId ?? updated.enquiryLines[i]?.lineId;
            return lineId ? uploadEnquiryLineAttachments(lineId, l.files) : Promise.resolve([]);
          }),
        );
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

  const inputSx = {
    backgroundColor: MUTED_GREY,
    "&:focus-within": {
      "--Input-focusedHighlight": "var(--joy-palette-primary-200)",
      "--Select-focusedHighlight": "var(--joy-palette-primary-200)",
      borderColor: "var(--joy-palette-primary-300) !important",
    },
  };
  const titleLine = `${lines.length} part${lines.length !== 1 ? "s" : ""}`;

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
            onClick={() => submit("Draft")}
            disabled={submitting}
          >
            Save Draft
          </Button>
          <Button
            color="success"
            startDecorator={submitting ? <CircularProgress size="sm" /> : undefined}
            onClick={() => submit("Open")}
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
            <Input
              value={enquiryNumber || (mode === "new" ? "Auto-generated" : "")}
              readOnly
              sx={{
                backgroundColor: "primary.50",
                color: "primary.600",
                border: "1.5px solid",
                borderColor: "#84c0e9",
              }}
            />
          </Field>
          <Field label="Customer" required>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Select
                placeholder="— Select customer —"
                value={customerId || null}
                onChange={(_, v) => { setCustomerId(v ?? ""); }}
                sx={{ ...inputSx, flex: 1 }}
              >
                {customers.map((c) => (
                  <Option key={c.id} value={c.id}>{c.name}</Option>
                ))}
              </Select>
              <IconButton variant="outlined" color="neutral" onClick={() => setCustomerModalOpen(true)}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          </Field>
          <Field label="Enquiry Date" required>
            <Input type="date" value={enquiryDate} onChange={(e) => setEnquiryDate(e.target.value)} sx={inputSx} />
          </Field>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
          <Field label="Received By">
            <Select
              placeholder="— Select user —"
              value={receivedBy || null}
              onChange={(_, v) => setReceivedBy(v ?? "")}
              sx={inputSx}
            >
              {users.map((u) => (
                <Option key={u.id} value={u.id}>{u.name}</Option>
              ))}
            </Select>
          </Field>
          <Field label="Status" required>
            <Select value={status} onChange={(_, v) => v && setStatus(v)} sx={inputSx}>
              <Option value="Draft">Draft</Option>
              <Option value="Open">Open</Option>
              <Option value="Under_Feasibility">Under Feasibility</Option>
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
              Add one or more parts. Each line captures part details and quantities. Tooling details are filled in during Feasibility Study.
            </Typography>
          </Box>
          <Button size="sm" onClick={addLine}>
            + Add Part
          </Button>
        </Box>

        {lines.map((line, lineIdx) => (
          <SectionBox key={line._key} sx={{ mb: 2, overflow: "hidden" }}>
            {/* Line header */}
            <Box
              onClick={() => setLine(line._key, { expanded: !line.expanded })}
              sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5, cursor: "pointer", backgroundColor: "primary.50", userSelect: "none" }}
            >
              {line.expanded
                ? <ExpandLessIcon fontSize="small" style={{ color: "var(--joy-palette-primary-700)" }} />
                : <ExpandMoreIcon fontSize="small" style={{ color: "var(--joy-palette-primary-700)" }} />}
              <Chip size="sm" variant="soft" sx={{ backgroundColor: "primary.100", color: "primary.700", fontWeight: 700 }}>LINE {lineIdx + 1}</Chip>
              <Typography level="body-sm" sx={{ color: line.partName ? "primary.800" : "primary.400", flex: 1, fontStyle: line.partName ? "normal" : "italic" }}>
                {line.partName || "Enter part details..."}
              </Typography>
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

                {/* Part Details */}
                <SectionBox muted sx={{ p: 2 }}>
                  <SectionHeader label="PART DETAILS" />
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, mb: 2 }}>
                    <Field label="Part Name" required>
                      <Input placeholder="e.g. Connecting Rod" value={line.partName} onChange={(e) => setLine(line._key, { partName: e.target.value })} sx={inputSx} disabled={!!line.lineId} />
                    </Field>
                    <Field label="Drawing Number">
                      <Input placeholder="e.g. CR-4521-A" value={line.partDrawingNumber} onChange={(e) => setLine(line._key, { partDrawingNumber: e.target.value })} sx={inputSx} disabled={!!line.lineId} />
                    </Field>
                    <Field label="Material Grade">
                      <Input placeholder="e.g. EN8, 42CrMo4" value={line.materialGrade} onChange={(e) => setLine(line._key, { materialGrade: e.target.value })} sx={inputSx} disabled={!!line.lineId} />
                    </Field>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Field label="Supply" required>
                      <SupplyTypeToggle value={line.supplyType} onChange={(v) => setLine(line._key, { supplyType: v })} />
                    </Field>
                  </Box>
                  <LineAttachments
                    line={line}
                    onFilesAdded={(files) => addFilesToLine(line._key, files)}
                    onRemoveStaged={(i) => removeStagedFile(line._key, i)}
                    onDeleteExisting={(attachmentId) => handleDeleteAttachment(line._key, attachmentId)}
                    onOpenExisting={handleOpenAttachment}
                  />
                </SectionBox>

                {/* Production Requirements */}
                <SectionBox muted sx={{ p: 2 }}>
                  <SectionHeader label="PRODUCTION REQUIREMENTS" />
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, mb: 2 }}>
                    <Field label="Qty per Month">
                      <Input type="number" placeholder="e.g. 500" value={line.qtyPerMonth} onChange={(e) => setLine(line._key, { qtyPerMonth: e.target.value })} sx={inputSx} />
                    </Field>
                    <Field label="Qty per Year" auto>
                      <Input
                        value={line.qtyPerMonth ? String(parseInt(line.qtyPerMonth) * 12) : "—"}
                        readOnly
                        sx={{
                          backgroundColor: "primary.50",
                          color: "primary.600",
                          fontStyle: "italic",
                          border: "1.5px solid",
                          borderColor: "#84c0e9",
                        }}
                      />
                    </Field>
                    <Field label="Suggested Machine">
                      <Select
                        placeholder="Select..."
                        value={line.suggestedMachineId || null}
                        onChange={(_, v) => setLine(line._key, { suggestedMachineId: v ?? "" })}
                        sx={inputSx}
                      >
                        {machines.map((m) => (
                          <Option key={m.id} value={m.id}>{m.name}</Option>
                        ))}
                      </Select>
                    </Field>
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 2, mb: 2 }}>
                    <Field label="Delivery State">
                      <Select
                        placeholder="Select..."
                        value={line.deliveryState || null}
                        onChange={(_, v) => setLine(line._key, { deliveryState: (v ?? "") as LineForm["deliveryState"] })}
                        sx={inputSx}
                      >
                        <Option value="As_Forged">As Forged</Option>
                        <Option value="Machined">Machined</Option>
                      </Select>
                    </Field>
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
              </Box>
            )}
          </SectionBox>
        ))}
      </Box>

      {/* ── Summary Bar ── */}
      <Box sx={{ position: "sticky", bottom: 0, mx: -3, px: 3, py: 1.5, backgroundColor: "background.surface", borderTop: "1px solid", borderColor: "neutral.200", display: "flex", gap: 3, alignItems: "center" }}>
        <Typography level="body-sm"><strong>Parts:</strong> {lines.length}</Typography>
        <Typography level="body-sm"><strong>Qty/Month:</strong> {totalQtyMonth || 0}</Typography>
        <Typography level="body-sm"><strong>Qty/Year:</strong> {totalQtyYear || 0}</Typography>
      </Box>

      <AddCustomerModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onCreated={(c) => {
          setCustomers((prev) => [...prev, c]);
          setCustomerId(c.id);
          setCustomerModalOpen(false);
        }}
      />
    </Box>
  );
}
