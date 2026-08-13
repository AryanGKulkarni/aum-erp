"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Input from "@mui/joy/Input";
import Textarea from "@mui/joy/Textarea";
import Chip from "@mui/joy/Chip";
import CircularProgress from "@mui/joy/CircularProgress";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import { getQuotationDetail, updateQuotation, type QuotationDetail, type QuotationLineDetail } from "@/services/api_service";

// ── company letterhead (own company profile — not customer data) ──────────────

const COMPANY = {
  name: "Austenite Metalworx Pvt. Ltd.",
  addressLine1: "Gat No-262 Kharabwadi, Somanshi Estate,",
  addressLine2: "Chakan, Khed, Pune – 410501, Maharashtra",
  cin: "U25910PN2023PTC225784",
  gst: "27AAZCA7158H1ZY",
  pan: "AAZCA7158H",
  udyam: "MH-26-0684184",
  web: "www.aumworx.in",
  bankName: "ICICI Bank, Chakan Branch",
  accountNo: "050805007781",
  ifsc: "ICIC0000508",
};

const TERMS = [
  "Prices quoted are exclusive of GST. Applicable taxes will be charged extra as per government norms.",
  "Tooling / die development costs, if any, are billed separately per the agreed amortisation schedule.",
  "Delivery timeline subject to confirmation at order placement based on prevailing machine load.",
  "This quotation is valid subject to raw material availability at the time of order placement.",
];

const HEADER_GRADIENT = "linear-gradient(90deg, #1E3A6E 0%, #3A5C93 100%)";

// ── helpers ───────────────────────────────────────────────────────────────────

function n(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === "number" ? v : parseFloat(v) || 0;
}

function inr(v: string | number | null | undefined) {
  return `₹${n(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function num(v: string | number | null | undefined, decimals = 2) {
  return n(v).toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

// Slices a tall canvas into PDF pages using the real section boundaries (header,
// each part card, price summary, terms) so a card that doesn't fully fit on the
// current page is pushed whole onto the next one instead of being cut in half.
// Falls back to a hard cut only if a single section is taller than one page.
function findPdfPageBreaks(totalHeight: number, pageHeightPx: number, sectionBoundaries: number[]): number[] {
  if (totalHeight <= pageHeightPx) return [totalHeight];

  const boundaries = Array.from(new Set([...sectionBoundaries, totalHeight])).sort((a, b) => a - b);
  const breaks: number[] = [];
  let cursor = 0;

  while (cursor < totalHeight) {
    const naiveEnd = cursor + pageHeightPx;
    if (naiveEnd >= totalHeight) {
      breaks.push(totalHeight);
      break;
    }

    let snap = -1;
    for (const b of boundaries) {
      if (b > cursor && b <= naiveEnd) snap = b;
    }

    if (snap > cursor) {
      // Only defer to the section boundary if the section starting right
      // after it actually fits on a fresh page — otherwise it's going to
      // need splitting anyway, so snapping early just wastes page space.
      const nextBoundary = boundaries.find((b) => b > snap) ?? totalHeight;
      const nextSectionHeight = nextBoundary - snap;
      breaks.push(nextSectionHeight <= pageHeightPx ? snap : naiveEnd);
    } else {
      breaks.push(naiveEnd);
    }
    cursor = breaks[breaks.length - 1];
  }

  return breaks;
}

const STATUS_ORDER = ["Draft", "Sent", "Accepted"];
const NEXT_ACTION: Record<string, { label: string; nextStatus: string }> = {
  Draft: { label: "Mark as Sent", nextStatus: "Sent" },
  Sent: { label: "Mark as Accepted", nextStatus: "Accepted" },
};

// ── small building blocks ───────────────────────────────────────────────────────

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.75, borderBottom: "1px solid", borderColor: "neutral.100" }}>
      <Typography level="body-sm" sx={{ color: "neutral.500" }}>{label}</Typography>
      <Typography level="body-sm" fontWeight="lg">{value}</Typography>
    </Box>
  );
}

function BreakdownRow({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5, pl: muted ? 1.5 : 0 }}>
      <Typography level="body-sm" sx={{ color: "neutral.500" }}>{label}</Typography>
      <Typography level="body-sm" sx={{ color: muted ? "primary.600" : "neutral.700" }}>{value}</Typography>
    </Box>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ px: 2.5, py: 0.75, backgroundColor: "neutral.100" }}>
      <Typography level="body-xs" fontWeight="lg" sx={{ color: "neutral.600", letterSpacing: "0.06em" }}>
        {children}
      </Typography>
    </Box>
  );
}

// ── part card ─────────────────────────────────────────────────────────────────

function PartCard({ line, index }: { line: QuotationLineDetail; index: number }) {
  const processes = (line.processesText ?? "").split(",").map((p) => p.trim()).filter(Boolean);

  return (
    <Box data-pdf-section sx={{ border: "1px solid", borderColor: "neutral.200", borderRadius: "lg", overflow: "hidden", mb: 2.5, backgroundColor: "background.surface" }}>
      {/* header */}
      <Box sx={{ background: HEADER_GRADIENT, color: "white", p: 2.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box sx={{ display: "flex", gap: 1.25, alignItems: "baseline" }}>
            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontWeight: 800, fontSize: 20 }}>
              {String(index + 1).padStart(2, "0")}
            </Typography>
            <Box>
              <Typography level="title-md" sx={{ color: "white", fontWeight: "xl" }}>{line.partName}</Typography>
              <Typography level="body-xs" sx={{ color: "rgba(255,255,255,0.7)", mt: 0.25 }}>
                {line.partDrawingNumber ?? "—"} · {line.materialGrade ?? "—"}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: "right", flexShrink: 0 }}>
            <Typography level="body-xs" sx={{ color: "rgba(255,255,255,0.6)", letterSpacing: "0.06em" }}>COST / PC</Typography>
            <Typography level="h4" sx={{ color: "white", fontWeight: "xl" }}>{inr(line.costPerPc)}</Typography>
            <Typography level="body-xs" sx={{ color: "rgba(255,255,255,0.6)" }}>
              {(line.qtyPerMonth ?? 0).toLocaleString("en-IN")} pcs/mo · {inr(line.monthlyValue)}/mo
            </Typography>
          </Box>
        </Box>
        {processes.length > 0 && (
          <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
            {processes.map((p) => (
              <Chip
                key={p}
                size="sm"
                variant="soft"
                sx={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white" }}
              >
                {p}
              </Chip>
            ))}
          </Box>
        )}
      </Box>

      {/* body */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        {/* left: specifications + rate factors */}
        <Box sx={{ py: 2.5, borderRight: { md: "1px solid" }, borderColor: { md: "neutral.100" }, borderBottom: { xs: "1px solid", md: "none" } }}>
          <SectionLabel>SPECIFICATIONS</SectionLabel>
          <Box sx={{ px: 2.5, pt: 0.75 }}>
            <SpecRow label="RM Diameter" value={`${num(line.rmDiameterMm, 0)} mm`} />
            <SpecRow label="Forging Yield" value={`${num(line.forgingYieldPct, 0)}%`} />
            <SpecRow label="Net Weight" value={`${num(line.forgingWeightKg, 3)} kg`} />
            <SpecRow label="Cut Weight" value={`${num(line.cutPcWeightKg, 3)} kg`} />
            <SpecRow label="Gross Weight" value={`${num(line.grossWeightKg, 3)} kg`} />
          </Box>

          <Box sx={{ mt: 1.25 }}>
            <SectionLabel>RATE FACTORS</SectionLabel>
            <Box sx={{ px: 2.5, pt: 0.75 }}>
              <SpecRow label="RM Base Rate" value={`${inr(line.rmRatePerKg)}/kg`} />
              <SpecRow label="Die Factor" value={`${inr(line.dieFactorPerPc)}/pc`} />
              <SpecRow label="Cutting Cost per pc" value={`${inr(line.cuttingCostFactorPerCm2)}/pc`} />
              <SpecRow label="Finish Forging" value={`${inr(line.forgingConversionPerKg)}/kg`} />
              <SpecRow label="Heat Treatment" value={`${inr(line.htFactorPerKg)}/kg`} />
              <SpecRow label="Rejection" value={`${num(line.rejectionFactorPct, 0)}%`} />
              <SpecRow label="ICC" value={`${num(line.iccFactorPct, 0)}%`} />
              <SpecRow label="Transportation Cost" value={`${inr(line.transportationFactorPct)}/kg`} />
              <SpecRow label="Profit on VA" value={`${num(line.profitOnVaFactorPct, 0)}%`} />
              <SpecRow label="Scrap" value={`${inr(line.scrapFactorPerKg)}/kg`} />
            </Box>
          </Box>
        </Box>

        {/* right: cost breakdown */}
        <Box sx={{ py: 2.5 }}>
          <SectionLabel>COST BREAKDOWN</SectionLabel>

          <Box sx={{ mt: 1, px: 2.5, py: 0.6, backgroundColor: "primary.50" }}>
            <Typography level="body-xs" fontWeight="lg" sx={{ color: "primary.700", letterSpacing: "0.05em" }}>
              RAW MATERIAL
            </Typography>
          </Box>
          <Box sx={{ px: 2.5, pt: 0.75 }}>
            <BreakdownRow label="RM Cost" value={inr(line.rmCost)} />
          </Box>

          <Box sx={{ mt: 1.25, px: 2.5, py: 0.6, backgroundColor: "primary.50" }}>
            <Typography level="body-xs" fontWeight="lg" sx={{ color: "primary.700", letterSpacing: "0.05em" }}>
              VALUE ADDITION
            </Typography>
          </Box>
          <Box sx={{ px: 2.5, pt: 0.75 }}>
            <BreakdownRow label="Cutting Cost per pc" value={inr(line.cuttingCost)} muted />
            <BreakdownRow label="Finish Forging Conv." value={inr(line.forgingConversionCost)} muted />
            <BreakdownRow label="Heat Treatment" value={inr(line.htShotblastCost)} muted />
            <BreakdownRow label="Visual Inspection" value={inr(line.visualInspectionCost)} muted />
            <BreakdownRow label="Die Factor" value={inr(line.dieFactorPerPc)} muted />
            <Box sx={{ display: "flex", justifyContent: "space-between", pt: 0.75, mt: 0.5, pb: 0.75, borderTop: "1px solid", borderColor: "neutral.300" }}>
              <Typography level="body-sm" fontWeight="lg">Value Addition</Typography>
              <Typography level="body-sm" fontWeight="lg" sx={{ color: "primary.600" }}>{inr(line.valueAddition)}</Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 1.25, px: 2.5, py: 0.6, backgroundColor: "primary.50" }}>
            <Typography level="body-xs" fontWeight="lg" sx={{ color: "primary.700", letterSpacing: "0.05em" }}>
              SUB TOTAL
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", px: 2.5, py: 1, backgroundColor: "#FDF6E3" }}>
            <Typography level="body-sm" fontWeight="lg">SUB TOTAL</Typography>
            <Typography level="body-sm" fontWeight="lg">{inr(line.subTotal)}</Typography>
          </Box>

          <Box sx={{ mt: 1.25, px: 2.5, py: 0.6, backgroundColor: "primary.50" }}>
            <Typography level="body-xs" fontWeight="lg" sx={{ color: "primary.700", letterSpacing: "0.05em" }}>
              ADDITIONS
            </Typography>
          </Box>
          <Box sx={{ px: 2.5, pt: 0.75, pb: 1 }}>
            <BreakdownRow label={`Rejection (${num(line.rejectionFactorPct, 0)}%)`} value={inr(line.rejectionCost)} />
            <BreakdownRow label={`ICC (${num(line.iccFactorPct, 0)}%)`} value={inr(line.iccCost)} />
            <BreakdownRow label="Transportation" value={inr(line.transportationCost)} />
            <BreakdownRow label={`Profit on VA (${num(line.profitOnVaFactorPct, 0)}%)`} value={inr(line.profitOnVa)} />
            <BreakdownRow label="Scrap" value={`-${inr(line.scrapAmount)}`} />
          </Box>

          <Box sx={{ height: 2, backgroundColor: "#1E3A6E" }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2.5, py: 1.25, backgroundColor: "primary.100" }}>
            <Typography level="title-sm" sx={{ color: "primary.700" }}>COST / PC</Typography>
            <Typography level="title-md" fontWeight="xl" sx={{ color: "primary.700" }}>{inr(line.costPerPc)}</Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", px: 2.5, pt: 1 }}>
            <Typography level="body-sm" sx={{ color: "neutral.500" }}>DEVELOPMENT COST</Typography>
            <Typography level="body-sm" fontWeight="lg">{inr(line.developmentCost)}</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<QuotationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfMode, setPdfMode] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [customerFeedback, setCustomerFeedback] = useState("");

  const load = useCallback(() => {
    return getQuotationDetail(id).then((raw) => {
      setData(raw);
      setPaymentTerms(raw.paymentTerms ?? "");
      setDeliveryTerms(raw.deliveryTerms ?? "");
      setValidUntil(raw.validUntil ? new Date(raw.validUntil).toLocaleDateString("en-CA") : "");
      setCustomerFeedback(raw.customerFeedback ?? "");
    });
  }, [id]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateQuotation(id, { paymentTerms, deliveryTerms, validUntil, customerFeedback });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadPdf() {
    if (!documentRef.current || !data) return;
    setDownloadingPdf(true);
    try {
      // Swap the live Payment/Delivery/Valid-Until inputs for flat text before
      // capturing — flushSync forces the DOM to update synchronously so
      // html2canvas never sees the real <input> elements.
      flushSync(() => setPdfMode(true));

      const container = documentRef.current;
      const containerRect = container.getBoundingClientRect();
      const sectionBoundaries = Array.from(
        container.querySelectorAll<HTMLElement>("[data-pdf-section]"),
      ).map((el) => el.getBoundingClientRect().bottom - containerRect.top);

      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      flushSync(() => setPdfMode(false));

      const pdf = new jsPDF("p", "pt", "a4");
      const marginPt = 24;
      const pageWidthPt = pdf.internal.pageSize.getWidth();
      const pageHeightPt = pdf.internal.pageSize.getHeight();
      const contentWidthPt = pageWidthPt - marginPt * 2;
      const contentHeightPt = pageHeightPt - marginPt * 2;

      // Two different ratios are needed here: html2canvas rasterizes the DOM
      // (CSS px) into a higher-resolution canvas (canvas px), and jsPDF then
      // places that canvas into a page measured in points (pt) — CSS px and pt
      // are not the same unit, so these must not be conflated.
      const domPxToCanvasPx = canvas.width / containerRect.width;
      const canvasPxToPt = contentWidthPt / canvas.width;

      const pageHeightPx = contentHeightPt / canvasPxToPt;
      const canvasBoundaries = sectionBoundaries.map((b) => Math.round(b * domPxToCanvasPx));
      const breaks = findPdfPageBreaks(canvas.height, pageHeightPx, canvasBoundaries);

      let sliceStartPx = 0;
      breaks.forEach((sliceEndPx, i) => {
        const sliceHeightPx = sliceEndPx - sliceStartPx;
        if (sliceHeightPx <= 0) return;

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeightPx;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, sliceStartPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

        const sliceHeightPt = sliceHeightPx * canvasPxToPt;
        if (i > 0) pdf.addPage();
        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", marginPt, marginPt, contentWidthPt, sliceHeightPt);

        sliceStartPx = sliceEndPx;
      });

      pdf.save(`${data.quotationNumber}.pdf`);
    } finally {
      setPdfMode(false);
      setDownloadingPdf(false);
    }
  }

  async function handleAdvanceStatus() {
    if (!data) return;
    const action = NEXT_ACTION[data.quotationStatus ?? "Draft"];
    if (!action) return;
    setAdvancing(true);
    try {
      const dto: Record<string, unknown> = {
        quotationStatus: action.nextStatus,
        paymentTerms, deliveryTerms, validUntil, customerFeedback,
      };
      if (action.nextStatus === "Sent") {
        dto.sentOn = new Date().toLocaleDateString("en-CA");
      }
      await updateQuotation(id, dto);
      await load();
    } finally {
      setAdvancing(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!data) return null;

  const status = data.quotationStatus ?? "Draft";
  const statusIdx = STATUS_ORDER.indexOf(status);
  const nextAction = NEXT_ACTION[status];

  const totalMonthly = data.quotationLines.reduce((s, l) => s + n(l.monthlyValue), 0);
  const totalAnnual = n(data.annualEstimate) || totalMonthly * 12;

  const inputSx = { backgroundColor: "background.surface", minWidth: 0 };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", pb: 6 }}>
      {/* ── Breadcrumb ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <Button variant="plain" color="neutral" size="sm" startDecorator={<ArrowBackIcon />} onClick={() => router.push("/quotations")}>
          Quotations
        </Button>
        <Typography level="body-sm" sx={{ color: "neutral.400" }}>/</Typography>
        <Typography level="body-sm" fontWeight="lg">{data.quotationNumber}</Typography>
      </Box>

      {/* ── Status Stepper ── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2.5, mb: 3, border: "1px solid", borderColor: "neutral.200", borderRadius: "lg", backgroundColor: "background.surface" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          {STATUS_ORDER.map((s, i) => {
            const done = i < statusIdx;
            const active = i === statusIdx;
            return (
              <Box key={s} sx={{ display: "flex", alignItems: "center", gap: i < STATUS_ORDER.length - 1 ? 3 : 0 }}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    border: "2px solid",
                    borderColor: done || active ? "primary.500" : "neutral.300",
                    backgroundColor: done ? "primary.500" : active ? "primary.softBg" : "background.surface",
                    color: done ? "white" : active ? "primary.600" : "neutral.400",
                    fontWeight: "bold", fontSize: 13,
                  }}>
                    {done ? <CheckIcon style={{ fontSize: 16 }} /> : i + 1}
                  </Box>
                  <Typography level="body-xs" sx={{ color: active ? "primary.600" : done ? "primary.500" : "neutral.400", fontWeight: active ? "lg" : "md" }}>
                    {s}
                  </Typography>
                </Box>
                {i < STATUS_ORDER.length - 1 && (
                  <Box sx={{ width: 40, height: 2, backgroundColor: done ? "primary.400" : "neutral.200", mb: 2 }} />
                )}
              </Box>
            );
          })}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button
            variant="outlined"
            color="neutral"
            loading={downloadingPdf}
            startDecorator={<PrintOutlinedIcon style={{ fontSize: 16 }} />}
            onClick={handleDownloadPdf}
          >
            Print / PDF
          </Button>
          {nextAction && (
            <Button
              color="primary"
              loading={advancing}
              startDecorator={<SendOutlinedIcon style={{ fontSize: 16 }} />}
              onClick={handleAdvanceStatus}
            >
              {nextAction.label}
            </Button>
          )}
          {status === "Accepted" && (
            <Chip color="success" variant="soft" size="lg">Accepted</Chip>
          )}
        </Box>
      </Box>

      {/* ── Quotation document: outer panel grouping the header, part cards, price summary & terms ── */}
      <Box ref={documentRef} sx={{ border: "1px solid", borderColor: "neutral.200", borderRadius: "lg", backgroundColor: "neutral.50", overflow: "hidden", mb: 3 }}>
        <Box data-pdf-section sx={{ background: HEADER_GRADIENT, color: "white", p: 3, position: "relative" }}>
          <Typography
            sx={{
              position: "absolute", top: 10, right: 28, fontSize: 26, fontWeight: 800,
              letterSpacing: "0.08em", color: "rgba(255,255,255,0.08)", whiteSpace: "nowrap", lineHeight: 1,
            }}
          >
            QUOTATION
          </Typography>

          <Box sx={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
              <Box
                sx={{
                  width: 42, height: 42, borderRadius: "sm", flexShrink: 0,
                  backgroundColor: "white", border: "1px solid rgba(255,255,255,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", p: "3px",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logo.jpg"
                  alt="Company logo"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </Box>
              <Box>
                <Typography level="title-md" sx={{ color: "white", fontWeight: "xl" }}>{COMPANY.name}</Typography>
                <Typography level="body-xs" sx={{ color: "rgba(255,255,255,0.75)" }}>{COMPANY.addressLine1}</Typography>
                <Typography level="body-xs" sx={{ color: "rgba(255,255,255,0.75)" }}>{COMPANY.addressLine2}</Typography>
              </Box>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography level="title-md" fontWeight="lg" sx={{ color: "white" }}>{data.quotationNumber}</Typography>
            </Box>
          </Box>

          <Box sx={{ position: "relative", display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
            <Typography level="body-xs" sx={{ color: "rgba(255,255,255,0.65)" }}>CIN: {COMPANY.cin}</Typography>
            <Typography level="body-xs" sx={{ color: "rgba(255,255,255,0.65)" }}>GST: {COMPANY.gst}</Typography>
            <Typography level="body-xs" sx={{ color: "rgba(255,255,255,0.65)" }}>PAN: {COMPANY.pan}</Typography>
            <Typography level="body-xs" sx={{ color: "rgba(255,255,255,0.65)" }}>Udyam: {COMPANY.udyam}</Typography>
          </Box>
          <Typography level="body-xs" sx={{ position: "relative", color: "rgba(255,255,255,0.65)", mt: 0.5 }}>
            Web: {COMPANY.web}
          </Typography>

          <Box sx={{ position: "relative", display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr 1fr" }, gap: 2, mt: 2.5, pt: 2, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
            <Box>
              <Typography level="body-xs" sx={{ color: "rgba(255,255,255,0.55)", letterSpacing: "0.05em" }}>BILL TO</Typography>
              <Typography level="body-sm" fontWeight="lg" sx={{ color: "white", mt: 0.5 }}>{data.customer?.companyName ?? "—"}</Typography>
            </Box>
            <Box>
              <Typography level="body-xs" sx={{ color: "rgba(255,255,255,0.55)", letterSpacing: "0.05em" }}>REF. ENQUIRY</Typography>
              <Typography
                level="body-sm" fontWeight="lg"
                sx={{ color: "white", mt: 0.5, cursor: data.enquiry ? "pointer" : "default", "&:hover": data.enquiry ? { textDecoration: "underline" } : undefined }}
                onClick={() => data.enquiry && router.push(`/enquiries/${data.enquiry.enquiryId}`)}
              >
                {data.enquiry?.enquiryNumber ?? "—"}
              </Typography>
            </Box>
            <Box>
              <Typography level="body-xs" sx={{ color: "rgba(255,255,255,0.55)", letterSpacing: "0.05em" }}>DATE</Typography>
              <Typography level="body-sm" fontWeight="lg" sx={{ color: "white", mt: 0.5 }}>{fmtDate(data.quotationDate)}</Typography>
            </Box>
            <Box>
              <Typography level="body-xs" sx={{ color: "rgba(255,255,255,0.55)", letterSpacing: "0.05em" }}>VALID UNTIL</Typography>
              <Typography level="body-sm" fontWeight="lg" sx={{ color: "white", mt: 0.5 }}>{fmtDate(data.validUntil)}</Typography>
            </Box>
          </Box>

          <Box sx={{ position: "relative", mt: 2 }}>
            <Typography level="body-xs" sx={{ color: "rgba(255,255,255,0.55)", letterSpacing: "0.05em" }}>PREPARED BY</Typography>
            <Typography level="body-sm" fontWeight="lg" sx={{ color: "white", mt: 0.5 }}>{data.preparedByUser?.fullName ?? "—"}</Typography>
          </Box>
        </Box>

        {/* ── Part cards + Price Summary: inset within the outer panel's padding ── */}
        <Box sx={{ p: 2 }}>
        {data.quotationLines.map((line, i) => (
          <PartCard key={line.quotationLineId} line={line} index={i} />
        ))}

        <Box data-pdf-section sx={{ border: "1px solid", borderColor: "neutral.200", borderRadius: "lg", overflow: "hidden", backgroundColor: "neutral.100" }}>
          <Box sx={{ px: 2.5, py: 1.75, borderBottom: "1px solid", borderColor: "neutral.300" }}>
            <Typography level="body-xs" fontWeight="lg" sx={{ color: "neutral.500", letterSpacing: "0.06em" }}>PRICE SUMMARY</Typography>
          </Box>
          <Box sx={{ overflowX: "auto", backgroundColor: "background.surface" }}>
            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
              <Box component="thead">
                <Box component="tr">
                  {["#", "Part Name", "Drawing", "Material", "Qty / Month", "Cost / PC", "Monthly Value"].map((h, i) => (
                    <Box component="th" key={h} sx={{ px: 2, py: 1, textAlign: i >= 4 ? "right" : i === 0 ? "center" : "left", backgroundColor: "primary.50", borderBottom: "1px solid", borderColor: "neutral.200" }}>
                      <Typography level="body-xs" fontWeight="lg" sx={{ color: "primary.700", letterSpacing: "0.03em" }}>{h}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {data.quotationLines.map((line, i) => (
                  <Box component="tr" key={line.quotationLineId} sx={{ "&:hover": { backgroundColor: "neutral.50" } }}>
                    <Box component="td" sx={{ px: 2, py: 1.5, textAlign: "center", borderBottom: "1px solid", borderColor: "neutral.100" }}>
                      <Typography level="body-sm" sx={{ color: "neutral.400" }}>{i + 1}</Typography>
                    </Box>
                    <Box component="td" sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "neutral.100" }}>
                      <Typography level="body-sm" fontWeight="lg">{line.partName}</Typography>
                    </Box>
                    <Box component="td" sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "neutral.100" }}>
                      <Typography level="body-sm" sx={{ color: "primary.600" }}>{line.partDrawingNumber ?? "—"}</Typography>
                    </Box>
                    <Box component="td" sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "neutral.100" }}>
                      <Typography level="body-sm">{line.materialGrade ?? "—"}</Typography>
                    </Box>
                    <Box component="td" sx={{ px: 2, py: 1.5, textAlign: "right", borderBottom: "1px solid", borderColor: "neutral.100" }}>
                      <Typography level="body-sm">{(line.qtyPerMonth ?? 0).toLocaleString("en-IN")}</Typography>
                    </Box>
                    <Box component="td" sx={{ px: 2, py: 1.5, textAlign: "right", borderBottom: "1px solid", borderColor: "neutral.100" }}>
                      <Typography level="body-sm">{inr(line.costPerPc)}</Typography>
                    </Box>
                    <Box component="td" sx={{ px: 2, py: 1.5, textAlign: "right", borderBottom: "1px solid", borderColor: "neutral.100" }}>
                      <Typography level="body-sm" fontWeight="lg">{inr(line.monthlyValue)}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2.5, py: 1.5, background: HEADER_GRADIENT }}>
            <Typography level="title-sm" sx={{ color: "white" }}>Total Monthly Value</Typography>
            <Typography level="title-md" fontWeight="xl" sx={{ color: "white" }}>{inr(totalMonthly)}</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2.5, py: 1, backgroundColor: "primary.50" }}>
            <Typography level="body-xs" sx={{ color: "primary.700" }}>Annual Estimate</Typography>
            <Typography level="body-sm" sx={{ color: "primary.700" }}>{inr(totalAnnual)} / yr</Typography>
          </Box>
        </Box>
        </Box>

        {/* ── Terms & Conditions: flush with the bottom of the outer panel ── */}
        <Box data-pdf-section sx={{ backgroundColor: "background.surface", p: 3 }}>
          <Typography level="body-xs" fontWeight="lg" sx={{ color: "neutral.500", letterSpacing: "0.06em", mb: 2 }}>TERMS & CONDITIONS</Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 2, mb: 2.5 }}>
            <Box>
              <Typography level="body-xs" sx={{ mb: 0.5, color: "neutral.500" }}>Payment Terms</Typography>
              {pdfMode ? (
                <Typography level="body-sm" fontWeight="lg">{paymentTerms || "-"}</Typography>
              ) : (
                <Input placeholder="e.g. 30 Days Credit" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} sx={inputSx} />
              )}
            </Box>
            <Box>
              <Typography level="body-xs" sx={{ mb: 0.5, color: "neutral.500" }}>Delivery Terms</Typography>
              {pdfMode ? (
                <Typography level="body-sm" fontWeight="lg">{deliveryTerms || "-"}</Typography>
              ) : (
                <Input placeholder="e.g. Ex-Works Pune" value={deliveryTerms} onChange={(e) => setDeliveryTerms(e.target.value)} sx={inputSx} />
              )}
            </Box>
            <Box>
              <Typography level="body-xs" sx={{ mb: 0.5, color: "neutral.500" }}>Valid Until</Typography>
              {pdfMode ? (
                <Typography level="body-sm" fontWeight="lg">{validUntil || "-"}</Typography>
              ) : (
                <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} sx={inputSx} />
              )}
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr 1fr" }, gap: 2, p: 2, borderRadius: "sm", backgroundColor: "primary.50", mb: 2 }}>
            <Box>
              <Typography level="body-xs" sx={{ color: "primary.700", fontWeight: 600 }}>BANK</Typography>
              <Typography level="body-sm">{COMPANY.bankName}</Typography>
            </Box>
            <Box>
              <Typography level="body-xs" sx={{ color: "primary.700", fontWeight: 600 }}>ACCOUNT NO.</Typography>
              <Typography level="body-sm">{COMPANY.accountNo}</Typography>
            </Box>
            <Box>
              <Typography level="body-xs" sx={{ color: "primary.700", fontWeight: 600 }}>IFSC</Typography>
              <Typography level="body-sm">{COMPANY.ifsc}</Typography>
            </Box>
            <Box>
              <Typography level="body-xs" sx={{ color: "primary.700", fontWeight: 600 }}>GST NO.</Typography>
              <Typography level="body-sm">{COMPANY.gst}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mb: 3 }}>
            {TERMS.map((t) => (
              <Typography key={t} level="body-xs" sx={{ color: "neutral.600" }}>• {t}</Typography>
            ))}
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", pt: 2.5, borderTop: "1px solid", borderColor: "neutral.200" }}>
            <Typography level="body-sm">Prepared by: {data.preparedByUser?.fullName ?? "—"}</Typography>
            <Box sx={{ textAlign: "right" }}>
              <Typography level="body-xs" sx={{ color: "neutral.400", mb: 3 }}>Authorised Signatory</Typography>
              <Typography level="body-xs" sx={{ borderTop: "1px solid", borderColor: "neutral.300", pt: 0.5 }}>{COMPANY.name}</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── Customer Feedback ── */}
      <Box sx={{ border: "1px solid", borderColor: "neutral.200", borderRadius: "lg", backgroundColor: "background.surface", p: 3, mb: 3 }}>
        <Typography level="body-xs" fontWeight="lg" sx={{ color: "neutral.500", letterSpacing: "0.06em", mb: 2 }}>CUSTOMER FEEDBACK</Typography>
        <Textarea
          minRows={3}
          placeholder="Record any feedback, negotiation notes, or reasons for acceptance / rejection from the customer..."
          value={customerFeedback}
          onChange={(e) => setCustomerFeedback(e.target.value)}
          sx={{ backgroundColor: "background.surface" }}
        />
      </Box>

      {/* ── Save button ── */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
        <Button variant="outlined" color="neutral" onClick={() => router.push("/quotations")}>Cancel</Button>
        <Button loading={saving} onClick={handleSave}>Save Changes</Button>
      </Box>
    </Box>
  );
}
