export interface Enquiry {
  id: string;
  enquiryNo: string;
  customer: string;
  date: string;
  receivedBy: string;
  parts: number;
  dieSets: number;
  status: "Feasibility" | "Quoted" | "Won" | "Lost" | "Pending";
}

export interface Quotation {
  id: string;
  quotationId: string;
  enquiryRef: string;
  client: string;
  contactPerson: string;
  grandTotal: number;
  validUntil: string;
  paymentTerms: string;
  status: "Approved" | "Pending" | "Rejected";
}

export interface FeasibilityStudy {
  id: string;
  studyId: string;
  partName: string;
  partCode: string;
  customer: string;
  machine: string;
  materialUtilPercent: number;
  quotedPrice: number;
  capacity: "OK" | "Tight" | "Exceeds";
  verdict: "Approved" | "Conditional" | "Rejected";
}
