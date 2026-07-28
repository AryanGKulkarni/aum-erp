import type { Enquiry, Quotation, FeasibilityStudy } from "@/types/entities";

export interface CustomerOption {
  id: string;
  name: string;
  contactPerson: string | null;
}

export interface PartOption {
  id: string;
  name: string;
  drawingNumber: string | null;
  customerId: number | null;
}

export interface FeasibilityOption {
  id: string;
  label: string;
  machine: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// --- Raw backend shapes ---

interface RawEnquiry {
  enquiryId: number;
  enquiryNumber: string;
  customer: string;
  enquiryDate: string;
  receivedBy: string | null;
  status: string;
  parts: number;
  dieSets: number;
  quotation: "Generated" | "Generate";
}

interface RawQuotation {
  quotationId: number;
  quotationNumber: string;
  quotationDate: string | null;
  validUntil: string | null;
  preparedBy: string | null;
  totalQuotedValue: string | null;
  paymentTerms: string | null;
  quotationStatus: string | null;
  enquiry: {
    enquiryNumber: string;
    customer: {
      companyName: string;
      contactPerson: string | null;
    };
  };
}

interface RawFeasibilityStudy {
  feasibilityId: number;
  part: { name: string; drawingNumber: string | null };
  customer: string | null;
  machine: string | null;
  materialUtilisationPct: string | null;
  quotedPrice: string | null;
  capacityFeasible: boolean | null;
  overallVerdict: string | null;
}

// --- Mappers ---

function mapEnquiryStatus(s: string): Enquiry["status"] {
  const map: Record<string, Enquiry["status"]> = {
    Open: "Open",
    Feasibility: "Feasibility",
    Quoted: "Quoted",
    Won: "Won",
    Lost: "Lost",
    "On Hold": "On Hold",
    On_Hold: "On Hold",
  };
  return map[s] ?? "Open";
}

function mapVerdict(v: string | null): FeasibilityStudy["verdict"] {
  if (v === "Feasible") return "Approved";
  if (v === "Not_Feasible") return "Rejected";
  return "Conditional";
}

function mapCapacity(feasible: boolean | null): FeasibilityStudy["capacity"] {
  if (feasible === true) return "OK";
  if (feasible === false) return "Exceeds";
  return "Tight";
}

// --- API functions ---

export async function getEnquiries(): Promise<Enquiry[]> {
  const res = await fetch(`${API_URL}/enquiry`);
  if (!res.ok) throw new Error("Failed to fetch enquiries");
  const data: RawEnquiry[] = await res.json();
  return data.map((e) => ({
    id: String(e.enquiryId),
    enquiryNo: e.enquiryNumber,
    customer: e.customer,
    date: e.enquiryDate.split("T")[0],
    receivedBy: e.receivedBy ?? "",
    parts: e.parts,
    dieSets: e.dieSets,
    status: mapEnquiryStatus(e.status),
    quotation: e.quotation,
  }));
}

export async function getFeasibilityStudies(): Promise<FeasibilityStudy[]> {
  const res = await fetch(`${API_URL}/feasibility-study`);
  if (!res.ok) throw new Error("Failed to fetch feasibility studies");
  const data: RawFeasibilityStudy[] = await res.json();
  return data.map((s) => ({
    id: String(s.feasibilityId),
    studyId: `FS-${s.feasibilityId}`,
    partName: s.part.name,
    partCode: s.part.drawingNumber ?? "",
    customer: s.customer ?? "",
    machine: s.machine ?? "",
    materialUtilPercent: s.materialUtilisationPct
      ? parseFloat(s.materialUtilisationPct)
      : 0,
    quotedPrice: s.quotedPrice ? parseFloat(s.quotedPrice) : 0,
    capacity: mapCapacity(s.capacityFeasible),
    verdict: mapVerdict(s.overallVerdict),
  }));
}

export async function createFeasibilityStudy(
  dto: Record<string, unknown>,
  uploadedBy: string,
  files?: File[],
): Promise<void> {
  const formData = new FormData();
  formData.append("data", JSON.stringify(dto));
  formData.append("uploadedBy", uploadedBy);
  files?.forEach((file) => formData.append("attachments", file));
  const res = await fetch(`${API_URL}/feasibility-study`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to create feasibility study");
}

export async function getFeasibilityStudy(id: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_URL}/feasibility-study/${id}`);
  if (!res.ok) throw new Error("Failed to fetch feasibility study");
  return res.json();
}

export async function updateFeasibilityStudy(
  id: string,
  dto: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(`${API_URL}/feasibility-study/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error("Failed to update feasibility study");
}

export async function openAttachment(feasibilityId: string, attachmentId: number): Promise<string> {
  const res = await fetch(
    `${API_URL}/feasibility-study/${feasibilityId}/attachments/${attachmentId}/view`,
  );
  if (!res.ok) throw new Error("Failed to load attachment");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function uploadAttachments(
  feasibilityId: string,
  files: File[],
  uploadedBy?: string,
): Promise<AttachmentRaw[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append("attachments", f));
  if (uploadedBy) formData.append("uploadedBy", uploadedBy);
  const res = await fetch(`${API_URL}/feasibility-study/${feasibilityId}/attachments`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload attachments");
  return res.json();
}

export async function deleteAttachment(
  feasibilityId: string,
  attachmentId: number,
): Promise<void> {
  const res = await fetch(
    `${API_URL}/feasibility-study/${feasibilityId}/attachments/${attachmentId}`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error("Failed to delete attachment");
}

interface AttachmentRaw {
  attachmentId: number;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string | null;
}

export async function generateQuotation(enquiryId: string): Promise<void> {
  const res = await fetch(`${API_URL}/quotation/generate/${enquiryId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to generate quotation");
}

export async function getCustomers(): Promise<CustomerOption[]> {
  const res = await fetch(`${API_URL}/customer`);
  if (!res.ok) throw new Error("Failed to fetch customers");
  const data: Array<{ customerId: number; companyName: string; contactPerson: string | null }> =
    await res.json();
  return data.map((c) => ({ id: String(c.customerId), name: c.companyName, contactPerson: c.contactPerson }));
}

export async function getParts(customerId?: string): Promise<PartOption[]> {
  const url = customerId
    ? `${API_URL}/part?customerId=${customerId}`
    : `${API_URL}/part`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch parts");
  const data: Array<{ partId: number; partName: string; partDrawingNumber: string | null; customerId: number | null }> =
    await res.json();
  return data.map((p) => ({
    id: String(p.partId),
    name: p.partName,
    drawingNumber: p.partDrawingNumber,
    customerId: p.customerId,
  }));
}

export async function getPartFeasibilityStudies(partId: string): Promise<FeasibilityOption[]> {
  const res = await fetch(`${API_URL}/feasibility-study?partId=${partId}`);
  if (!res.ok) throw new Error("Failed to fetch feasibility studies");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any[] = await res.json();
  return data.map((s) => ({
    id: String(s.feasibilityId),
    label: `FS-${s.feasibilityId}${s.overallVerdict ? ` · ${s.overallVerdict}` : ""}`,
    machine: s.machine ?? null,
  }));
}

export async function createEnquiry(dto: Record<string, unknown>): Promise<{ enquiryId: number }> {
  const res = await fetch(`${API_URL}/enquiry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error("Failed to create enquiry");
  return res.json();
}

export async function getEnquiry(id: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_URL}/enquiry/${id}`);
  if (!res.ok) throw new Error("Failed to fetch enquiry");
  return res.json();
}

export async function updateEnquiry(id: string, dto: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${API_URL}/enquiry/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error("Failed to update enquiry");
}

export async function getQuotationDetail(id: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_URL}/quotation/${id}`);
  if (!res.ok) throw new Error("Failed to fetch quotation");
  return res.json();
}

export async function updateQuotation(id: string, dto: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${API_URL}/quotation/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error("Failed to update quotation");
}

export async function getQuotations(): Promise<Quotation[]> {
  const res = await fetch(`${API_URL}/quotation`);
  if (!res.ok) throw new Error("Failed to fetch quotations");
  const data: RawQuotation[] = await res.json();
  return data.map((q) => ({
    id: String(q.quotationId),
    quotationId: q.quotationNumber,
    enquiryRef: q.enquiry.enquiryNumber,
    client: q.enquiry.customer.companyName,
    contactPerson: q.enquiry.customer.contactPerson ?? "",
    grandTotal: q.totalQuotedValue ? parseFloat(q.totalQuotedValue) : 0,
    validUntil: q.validUntil ? q.validUntil.split("T")[0] : "",
    paymentTerms: q.paymentTerms ?? "",
    status: (q.quotationStatus ?? "Draft") as Quotation["status"],
  }));
}
