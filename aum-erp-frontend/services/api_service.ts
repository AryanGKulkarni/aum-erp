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

export interface MachineOption {
  id: string;
  name: string;
  type: string;
}

export interface UserOption {
  id: string;
  name: string;
  email: string | null;
  role: string;
}

export interface ProcessOption {
  id: string;
  name: string;
  code: string;
  displayOrder: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// All API endpoints require an authenticated session (except /auth/*'s public
// routes) — credentials must always be sent so the auth_token cookie reaches
// the backend, including cross-port in dev (localhost:3000 -> localhost:5000).
function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, credentials: "include" });
}

// --- Raw backend shapes ---

interface RawEnquiry {
  enquiryId: number;
  enquiryNumber: string;
  customer: string;
  enquiryDate: string;
  receivedBy: string | null;
  status: string;
  parts: number;
  quotation: "Generated" | "Generate";
}

interface RawQuotation {
  quotationId: number;
  quotationNumber: string;
  quotationDate: string | null;
  validUntil: string | null;
  totalMonthlyValue: string | null;
  quotationStatus: string | null;
  customer: {
    companyName: string;
  };
  enquiry: {
    enquiryNumber: string;
  };
  _count: {
    quotationLines: number;
  };
}

export interface QuotationLineDetail {
  quotationLineId: number;
  lineNumber: number;
  partName: string;
  partDrawingNumber: string | null;
  materialGrade: string | null;
  processesText: string | null;
  rmDiameterMm: string | null;
  forgingYieldPct: string | null;
  forgingWeightKg: string | null;
  cutPcWeightKg: string | null;
  grossWeightKg: string | null;
  rmRatePerKg: string | null;
  dieFactorPerPc: string | null;
  cuttingCostFactorPerCm2: string | null;
  forgingConversionPerKg: string | null;
  htFactorPerKg: string | null;
  visualInspectionPerPc: string | null;
  rejectionFactorPct: string | null;
  iccFactorPct: string | null;
  transportationFactorPct: string | null;
  profitOnVaFactorPct: string | null;
  scrapFactorPerKg: string | null;
  rmCost: string | null;
  cuttingCost: string | null;
  forgingConversionCost: string | null;
  htShotblastCost: string | null;
  visualInspectionCost: string | null;
  valueAddition: string | null;
  subTotal: string | null;
  rejectionCost: string | null;
  iccCost: string | null;
  transportationCost: string | null;
  profitOnVa: string | null;
  scrapAmount: string | null;
  costPerPc: string | null;
  qtyPerMonth: number | null;
  monthlyValue: string | null;
  developmentCost: string | null;
}

export interface QuotationDetail {
  quotationId: number;
  quotationNumber: string;
  revisionNo: number;
  quotationDate: string | null;
  validUntil: string | null;
  quotationStatus: string;
  sentOn: string | null;
  acceptedOn: string | null;
  rejectedOn: string | null;
  paymentTerms: string | null;
  deliveryTerms: string | null;
  totalMonthlyValue: string | null;
  annualEstimate: string | null;
  customerFeedback: string | null;
  customer: { companyName: string; contactPerson: string | null; gstNumber: string | null } | null;
  enquiry: { enquiryId: number; enquiryNumber: string } | null;
  preparedByUser: { fullName: string } | null;
  quotationLines: QuotationLineDetail[];
}

interface RawFeasibilityStudyListItem {
  studyId: number;
  enquiryId: number;
  enquiryNumber: string;
  customer: string;
  studyStatus: string;
  lines: number;
  assessmentDate: string | null;
}

// --- Mappers ---

function mapEnquiryStatus(s: string): Enquiry["status"] {
  const map: Record<string, Enquiry["status"]> = {
    Draft: "Draft",
    Open: "Open",
    Under_Feasibility: "Under Feasibility",
    "Under Feasibility": "Under Feasibility",
    Quoted: "Quoted",
    Won: "Won",
    Lost: "Lost",
    "On Hold": "On Hold",
    On_Hold: "On Hold",
  };
  return map[s] ?? "Draft";
}

function mapStudyStatus(s: string): FeasibilityStudy["status"] {
  const map: Record<string, FeasibilityStudy["status"]> = {
    Draft: "Draft",
    Submitted_for_Review: "Submitted for Review",
    "Submitted for Review": "Submitted for Review",
    Reviewed: "Reviewed",
    Quoted: "Quoted",
  };
  return map[s] ?? "Draft";
}

// --- API functions ---

export async function getEnquiries(): Promise<Enquiry[]> {
  const res = await apiFetch(`${API_URL}/enquiry`);
  if (!res.ok) throw new Error("Failed to fetch enquiries");
  const data: RawEnquiry[] = await res.json();
  return data.map((e) => ({
    id: String(e.enquiryId),
    enquiryNo: e.enquiryNumber,
    customer: e.customer,
    date: e.enquiryDate.split("T")[0],
    receivedBy: e.receivedBy ?? "",
    parts: e.parts,
    status: mapEnquiryStatus(e.status),
    quotation: e.quotation,
  }));
}

export async function getFeasibilityStudies(): Promise<FeasibilityStudy[]> {
  const res = await apiFetch(`${API_URL}/feasibility-study`);
  if (!res.ok) throw new Error("Failed to fetch feasibility studies");
  const data: RawFeasibilityStudyListItem[] = await res.json();
  return data.map((s) => ({
    id: String(s.studyId),
    enquiryId: String(s.enquiryId),
    studyCode: `FS-${s.studyId}`,
    enquiryNo: s.enquiryNumber,
    customer: s.customer,
    status: mapStudyStatus(s.studyStatus),
    parts: s.lines,
    assessmentDate: s.assessmentDate ? s.assessmentDate.split("T")[0] : "—",
  }));
}

export async function createFeasibilityStudy(dto: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await apiFetch(`${API_URL}/feasibility-study`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || "Failed to create feasibility study");
  }
  return res.json();
}

export async function getFeasibilityStudy(id: string): Promise<Record<string, unknown>> {
  const res = await apiFetch(`${API_URL}/feasibility-study/${id}`);
  if (!res.ok) throw new Error("Failed to fetch feasibility study");
  return res.json();
}

export async function getFeasibilityStudyByEnquiry(enquiryId: string): Promise<Record<string, unknown> | null> {
  const res = await apiFetch(`${API_URL}/feasibility-study?enquiryId=${enquiryId}`);
  if (!res.ok) throw new Error("Failed to fetch feasibility study");
  const data: Array<{ studyId: number }> = await res.json();
  return data[0] ? getFeasibilityStudy(String(data[0].studyId)) : null;
}

export async function updateFeasibilityStudy(
  id: string,
  dto: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await apiFetch(`${API_URL}/feasibility-study/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || "Failed to update feasibility study");
  }
  return res.json();
}

export async function getProcesses(): Promise<ProcessOption[]> {
  const res = await apiFetch(`${API_URL}/process`);
  if (!res.ok) throw new Error("Failed to fetch processes");
  const data: Array<{ processId: number; processCode: string; processName: string; displayOrder: number }> =
    await res.json();
  return data.map((p) => ({
    id: String(p.processId),
    name: p.processName,
    code: p.processCode,
    displayOrder: p.displayOrder,
  }));
}

interface AttachmentRaw {
  attachmentId: number;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string | null;
}

export async function generateQuotation(enquiryId: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/quotation/generate/${enquiryId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to generate quotation");
}

export async function getCustomers(): Promise<CustomerOption[]> {
  const res = await apiFetch(`${API_URL}/customer`);
  if (!res.ok) throw new Error("Failed to fetch customers");
  const data: Array<{ customerId: number; companyName: string; contactPerson: string | null }> =
    await res.json();
  return data.map((c) => ({ id: String(c.customerId), name: c.companyName, contactPerson: c.contactPerson }));
}

export async function createCustomer(dto: Record<string, unknown>): Promise<CustomerOption> {
  const res = await apiFetch(`${API_URL}/customer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error("Failed to create customer");
  const c: { customerId: number; companyName: string; contactPerson: string | null } = await res.json();
  return { id: String(c.customerId), name: c.companyName, contactPerson: c.contactPerson };
}

export async function getParts(customerId?: string): Promise<PartOption[]> {
  const url = customerId
    ? `${API_URL}/part?customerId=${customerId}`
    : `${API_URL}/part`;
  const res = await apiFetch(url);
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

export async function getMachines(): Promise<MachineOption[]> {
  const res = await apiFetch(`${API_URL}/machine`);
  if (!res.ok) throw new Error("Failed to fetch machines");
  const data: Array<{ machineId: number; machineName: string; machineType: string }> =
    await res.json();
  return data.map((m) => ({ id: String(m.machineId), name: m.machineName, type: m.machineType }));
}

export async function getUsers(): Promise<UserOption[]> {
  const res = await apiFetch(`${API_URL}/user`);
  if (!res.ok) throw new Error("Failed to fetch users");
  const data: Array<{ userId: number; fullName: string; email: string | null; role: string }> = await res.json();
  return data.map((u) => ({ id: String(u.userId), name: u.fullName, email: u.email, role: u.role }));
}

export async function createUser(dto: { fullName: string; email: string; role: string }): Promise<UserOption> {
  const res = await apiFetch(`${API_URL}/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? "Failed to create user");
  }
  const u: { userId: number; fullName: string; email: string | null; role: string } = await res.json();
  return { id: String(u.userId), name: u.fullName, email: u.email, role: u.role };
}

// ── Masters ───────────────────────────────────────────────────────────────────
// Full records for the Masters screen. Prisma serialises Decimal columns as
// strings, so numeric fields arrive as strings and are coerced at the edges.

export interface MasterUser {
  userId: number;
  fullName: string;
  email: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface MasterCustomer {
  customerId: number;
  companyName: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  gstNumber: string | null;
}

export interface MasterMachine {
  machineId: number;
  machineName: string;
  machineType: string;
  capacityTons: string | null;
  availableHrsPerDay: string | null;
  workingDaysPerMonth: number | null;
  /** Generated STORED column — read-only. */
  availableHrsPerMonth: string | null;
  status: string;
}

async function fail(res: Response, fallback: string): Promise<never> {
  const body = await res.json().catch(() => null);
  const message = body?.message;
  throw new Error(Array.isArray(message) ? message.join(", ") : (message ?? fallback));
}

export async function getMasterUsers(): Promise<MasterUser[]> {
  const res = await apiFetch(`${API_URL}/user/all`);
  if (!res.ok) return fail(res, "Failed to fetch users");
  return res.json();
}

export async function updateUser(
  id: number,
  dto: { fullName?: string; email?: string; role?: string; isActive?: boolean },
): Promise<MasterUser> {
  const res = await apiFetch(`${API_URL}/user/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) return fail(res, "Failed to update user");
  return res.json();
}

export async function getMasterCustomers(): Promise<MasterCustomer[]> {
  const res = await apiFetch(`${API_URL}/customer`);
  if (!res.ok) return fail(res, "Failed to fetch customers");
  return res.json();
}

export async function updateCustomer(
  id: number,
  dto: Record<string, unknown>,
): Promise<MasterCustomer> {
  const res = await apiFetch(`${API_URL}/customer/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) return fail(res, "Failed to update customer");
  return res.json();
}

export async function getMasterMachines(): Promise<MasterMachine[]> {
  const res = await apiFetch(`${API_URL}/machine`);
  if (!res.ok) return fail(res, "Failed to fetch machines");
  return res.json();
}

export async function createMachine(dto: Record<string, unknown>): Promise<MasterMachine> {
  const res = await apiFetch(`${API_URL}/machine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) return fail(res, "Failed to create machine");
  return res.json();
}

export async function updateMachine(
  id: number,
  dto: Record<string, unknown>,
): Promise<MasterMachine> {
  const res = await apiFetch(`${API_URL}/machine/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) return fail(res, "Failed to update machine");
  return res.json();
}

interface RawCreatedEnquiryLine {
  lineId: number;
}

interface RawCreatedEnquiry {
  enquiryId: number;
  enquiryLines: RawCreatedEnquiryLine[];
}

export async function createEnquiry(dto: Record<string, unknown>): Promise<RawCreatedEnquiry> {
  const res = await apiFetch(`${API_URL}/enquiry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error("Failed to create enquiry");
  return res.json();
}

export async function uploadEnquiryLineAttachments(
  lineId: number,
  files: File[],
  uploadedBy?: string,
): Promise<AttachmentRaw[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append("attachments", f));
  if (uploadedBy) formData.append("uploadedBy", uploadedBy);
  const res = await apiFetch(`${API_URL}/enquiry/lines/${lineId}/attachments`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload attachments");
  return res.json();
}

export async function viewEnquiryAttachment(attachmentId: number): Promise<string> {
  const res = await apiFetch(`${API_URL}/enquiry/attachments/${attachmentId}/view`);
  if (!res.ok) throw new Error("Failed to load attachment");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function deleteEnquiryAttachment(attachmentId: number): Promise<void> {
  const res = await apiFetch(`${API_URL}/enquiry/attachments/${attachmentId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete attachment");
}

export async function getEnquiry(id: string): Promise<Record<string, unknown>> {
  const res = await apiFetch(`${API_URL}/enquiry/${id}`);
  if (!res.ok) throw new Error("Failed to fetch enquiry");
  return res.json();
}

export async function updateEnquiry(id: string, dto: Record<string, unknown>): Promise<RawCreatedEnquiry> {
  const res = await apiFetch(`${API_URL}/enquiry/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error("Failed to update enquiry");
  return res.json();
}

export async function getQuotationDetail(id: string): Promise<QuotationDetail> {
  const res = await apiFetch(`${API_URL}/quotation/${id}`);
  if (!res.ok) throw new Error("Failed to fetch quotation");
  return res.json();
}

export async function updateQuotation(id: string, dto: Record<string, unknown>): Promise<void> {
  const res = await apiFetch(`${API_URL}/quotation/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error("Failed to update quotation");
}

export async function getQuotations(): Promise<Quotation[]> {
  const res = await apiFetch(`${API_URL}/quotation`);
  if (!res.ok) throw new Error("Failed to fetch quotations");
  const data: RawQuotation[] = await res.json();
  return data.map((q) => ({
    id: String(q.quotationId),
    quotationNo: q.quotationNumber,
    enquiryRef: q.enquiry.enquiryNumber,
    customer: q.customer.companyName,
    date: q.quotationDate ? q.quotationDate.split("T")[0] : "",
    validUntil: q.validUntil ? q.validUntil.split("T")[0] : "",
    monthlyValue: `₹${(q.totalMonthlyValue ? parseFloat(q.totalMonthlyValue) : 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    parts: q._count.quotationLines,
    status: (q.quotationStatus ?? "Draft") as Quotation["status"],
  }));
}

export function getGoogleAuthUrl(): string {
  return `${API_URL}/auth/google`;
}

export async function sendEmailLoginLink(email: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/auth/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? "Failed to send login link");
  }
}

export interface CurrentUser {
  userId: number;
  fullName: string;
  email: string | null;
  role: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const res = await apiFetch(`${API_URL}/auth/me`);
  if (!res.ok) return null;
  return res.json();
}

export async function logout(): Promise<void> {
  await apiFetch(`${API_URL}/auth/logout`, { method: "POST" });
}
