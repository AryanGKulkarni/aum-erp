"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Input from "@mui/joy/Input";
import Textarea from "@mui/joy/Textarea";
import Chip from "@mui/joy/Chip";
import Divider from "@mui/joy/Divider";
import CircularProgress from "@mui/joy/CircularProgress";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { getQuotationDetail, updateQuotation } from "@/services/api_service";

// ── helpers ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

function inr(v: number) {
  return `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function machineName(m: string | null) {
  if (!m) return "—";
  if (m === "Press_1000T") return "1000T Press";
  if (m === "Belt_Hammer_075T") return "0.75T Belt Hammer";
  return m;
}

const STATUS_ORDER = ["Draft", "Sent", "Accepted"];
const NEXT_ACTION: Record<string, { label: string; nextStatus: string }> = {
  Draft: { label: "Mark as Sent", nextStatus: "Sent" },
  Sent:  { label: "Mark as Accepted", nextStatus: "Accepted" },
};

// ── page ──────────────────────────────────────────────────────────────────────

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<Raw>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  // editable fields
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

  // ── derived ──────────────────────────────────────────────────────────────────
  const status: string = data.quotationStatus ?? "Draft";
  const statusIdx = STATUS_ORDER.indexOf(status);
  const nextAction = NEXT_ACTION[status];
  const enquiry = data.enquiry;

  const rows = (enquiry?.enquiryLines ?? []).map((line: Raw) => {
    const unitPrice = parseFloat(line.feasibilityStudy?.costEstimations?.[0]?.quotedPricePerPc ?? "0") || 0;
    const qty = line.qtyPerMonth ?? 0;
    return {
      partName: line.part?.partName ?? "—",
      drawingNo: line.part?.partDrawingNumber ?? "—",
      material: line.part?.materialGrade ?? "—",
      machine: machineName(line.suggestedMachine ?? line.feasibilityStudy?.recommendedMachine ?? null),
      qty,
      unitPrice,
      monthly: unitPrice * qty,
    };
  });

  const totalMonthly = rows.reduce((s: number, r: Raw) => s + r.monthly, 0);
  const totalAnnual = totalMonthly * 12;

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

      {/* ── Quotation Document ── */}
      <Box sx={{ border: "1px solid", borderColor: "neutral.200", borderRadius: "lg", backgroundColor: "background.surface", mb: 3, overflow: "hidden" }}>
        <Box sx={{ p: 3 }}>
          {/* Company header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
              <Box sx={{ width: 40, height: 40, borderRadius: "sm", backgroundColor: "primary.500", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Typography sx={{ color: "white", fontWeight: "xl", fontSize: 12 }}>ERP</Typography>
              </Box>
              <Box>
                <Typography level="title-md" fontWeight="xl">NexusERP Pvt. Ltd.</Typography>
                <Typography level="body-xs" sx={{ color: "neutral.500" }}>Plot 14, MIDC Industrial Area, Pune – 411 019</Typography>
                <Typography level="body-xs" sx={{ color: "neutral.500" }}>GST: 27AABCN1234F1Z5 · sales@nexuserp.in</Typography>
              </Box>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography level="h2" sx={{ color: "primary.600", letterSpacing: "0.05em", fontWeight: "xl" }}>QUOTATION</Typography>
              <Typography level="title-sm" fontWeight="lg">{data.quotationNumber}</Typography>
              <Chip size="sm" variant="soft" color={status === "Draft" ? "warning" : status === "Sent" ? "primary" : status === "Accepted" ? "success" : "danger"} sx={{ mt: 0.5 }}>
                {status}
              </Chip>
            </Box>
          </Box>

          {/* Info bar */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 2, py: 2, borderTop: "1px solid", borderBottom: "1px solid", borderColor: "neutral.100", mb: 3 }}>
            <Box>
              <Typography level="body-xs" sx={{ color: "neutral.400", mb: 0.5 }}>TO</Typography>
              <Typography level="body-sm" fontWeight="lg">{enquiry?.customer?.companyName ?? "—"}</Typography>
            </Box>
            <Box>
              <Typography level="body-xs" sx={{ color: "neutral.400", mb: 0.5 }}>REF. ENQUIRY</Typography>
              <Typography
                level="body-sm" fontWeight="lg"
                sx={{ color: "primary.500", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                onClick={() => enquiry?.enquiryId && router.push(`/enquiries/${enquiry.enquiryId}`)}
              >
                {enquiry?.enquiryNumber ?? "—"}
              </Typography>
            </Box>
            <Box>
              <Typography level="body-xs" sx={{ color: "neutral.400", mb: 0.5 }}>DATE</Typography>
              <Typography level="body-sm" fontWeight="lg">{fmtDate(data.quotationDate)}</Typography>
            </Box>
            <Box>
              <Typography level="body-xs" sx={{ color: "neutral.400", mb: 0.5 }}>VALID UNTIL</Typography>
              <Typography level="body-sm" fontWeight="lg">{fmtDate(data.validUntil)}</Typography>
            </Box>
          </Box>

          {/* Price Schedule */}
          <Typography level="title-sm" fontWeight="lg" sx={{ mb: 2, letterSpacing: "0.04em" }}>
            PRICE SCHEDULE — MONTHLY
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
              <Box component="thead">
                <Box component="tr" sx={{ backgroundColor: "neutral.50" }}>
                  {["#", "Part Name", "Drawing No.", "Material", "Machine", "Qty/Month", "Unit Price (₹)", "Monthly Value (₹)"].map((h, i) => (
                    <Box component="th" key={h} sx={{ px: 1.5, py: 1, textAlign: i >= 5 ? "right" : i === 0 ? "center" : "left", borderBottom: "1px solid", borderColor: "neutral.200" }}>
                      <Typography level="body-xs" fontWeight="lg" sx={{ color: "neutral.600", letterSpacing: "0.04em" }}>{h}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {rows.map((row: Raw, i: number) => (
                  <Box component="tr" key={i} sx={{ "&:hover": { backgroundColor: "neutral.50" } }}>
                    <Box component="td" sx={{ px: 1.5, py: 1.5, textAlign: "center", borderBottom: "1px solid", borderColor: "neutral.100" }}>
                      <Typography level="body-sm" sx={{ color: "neutral.400" }}>{i + 1}</Typography>
                    </Box>
                    <Box component="td" sx={{ px: 1.5, py: 1.5, borderBottom: "1px solid", borderColor: "neutral.100" }}>
                      <Typography level="body-sm" fontWeight="lg">{row.partName}</Typography>
                    </Box>
                    <Box component="td" sx={{ px: 1.5, py: 1.5, borderBottom: "1px solid", borderColor: "neutral.100" }}>
                      <Typography level="body-sm" sx={{ color: "neutral.600" }}>{row.drawingNo}</Typography>
                    </Box>
                    <Box component="td" sx={{ px: 1.5, py: 1.5, borderBottom: "1px solid", borderColor: "neutral.100" }}>
                      <Typography level="body-sm">{row.material}</Typography>
                    </Box>
                    <Box component="td" sx={{ px: 1.5, py: 1.5, borderBottom: "1px solid", borderColor: "neutral.100" }}>
                      <Typography level="body-sm">{row.machine}</Typography>
                    </Box>
                    <Box component="td" sx={{ px: 1.5, py: 1.5, textAlign: "right", borderBottom: "1px solid", borderColor: "neutral.100" }}>
                      <Typography level="body-sm">{row.qty.toLocaleString("en-IN")}</Typography>
                    </Box>
                    <Box component="td" sx={{ px: 1.5, py: 1.5, textAlign: "right", borderBottom: "1px solid", borderColor: "neutral.100" }}>
                      <Typography level="body-sm">{inr(row.unitPrice)}</Typography>
                    </Box>
                    <Box component="td" sx={{ px: 1.5, py: 1.5, textAlign: "right", borderBottom: "1px solid", borderColor: "neutral.100" }}>
                      <Typography level="body-sm" fontWeight="lg" sx={{ color: "primary.600" }}>{inr(row.monthly)}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          {/* Totals */}
          <Box sx={{ mt: 0.5, px: 1.5, py: 1.5, backgroundColor: "primary.softBg", borderRadius: "0 0 sm sm" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography level="title-sm" sx={{ color: "primary.700" }}>Total Monthly Value</Typography>
              <Typography level="title-md" fontWeight="xl" sx={{ color: "primary.600" }}>{inr(totalMonthly)}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
              <Typography level="body-xs" sx={{ color: "neutral.500" }}>Annual Value (estimated)</Typography>
              <Typography level="body-sm" sx={{ color: "neutral.600" }}>{inr(totalAnnual)} / year</Typography>
            </Box>
          </Box>

          {/* Terms & Conditions */}
          <Divider sx={{ my: 3 }} />
          <Typography level="title-sm" fontWeight="lg" sx={{ mb: 2, letterSpacing: "0.04em" }}>TERMS & CONDITIONS</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, mb: 2.5 }}>
            <Box>
              <Typography level="body-xs" sx={{ mb: 0.5, color: "neutral.600", fontWeight: 500 }}>Payment Terms</Typography>
              <Input placeholder="e.g. 30 Days Credit" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} sx={inputSx} />
            </Box>
            <Box>
              <Typography level="body-xs" sx={{ mb: 0.5, color: "neutral.600", fontWeight: 500 }}>Delivery Terms</Typography>
              <Input placeholder="e.g. Ex-Works Pune" value={deliveryTerms} onChange={(e) => setDeliveryTerms(e.target.value)} sx={inputSx} />
            </Box>
            <Box>
              <Typography level="body-xs" sx={{ mb: 0.5, color: "neutral.600", fontWeight: 500 }}>Valid Until</Typography>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} sx={inputSx} />
            </Box>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mb: 3 }}>
            {[
              "Prices are exclusive of GST. Applicable taxes as per government norms will be charged extra.",
              "Tooling / die costs, if any, are billed separately as per the agreed amortisation schedule.",
              "Delivery timeline to be confirmed at the time of order placement based on current machine load.",
              "This quotation is subject to availability of raw material at the time of order.",
            ].map((t) => (
              <Typography key={t} level="body-xs" sx={{ color: "neutral.600" }}>• {t}</Typography>
            ))}
          </Box>

          {/* Document footer */}
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <Box>
              <Typography level="body-sm">Prepared by: {data.preparedBy ?? "—"}</Typography>
              {data.sentOn && (
                <Typography level="body-xs" sx={{ color: "neutral.500" }}>Sent on: {fmtDate(data.sentOn)}</Typography>
              )}
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography level="body-xs" sx={{ color: "neutral.400", mb: 3 }}>Authorised Signatory</Typography>
              <Divider />
              <Typography level="body-xs" sx={{ mt: 0.5 }}>NexusERP Pvt. Ltd.</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── Customer Feedback ── */}
      <Box sx={{ border: "1px solid", borderColor: "neutral.200", borderRadius: "lg", backgroundColor: "background.surface", p: 3, mb: 3 }}>
        <Typography level="title-sm" fontWeight="lg" sx={{ mb: 2, letterSpacing: "0.04em" }}>CUSTOMER FEEDBACK</Typography>
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
