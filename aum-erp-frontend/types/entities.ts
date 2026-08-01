export interface Enquiry {
  id: string;
  enquiryNo: string;
  customer: string;
  date: string;
  receivedBy: string;
  parts: number;
  status: "Draft" | "Open" | "Under Feasibility" | "Quoted" | "Won" | "Lost" | "On Hold";
  quotation: "Generated" | "Generate";
}

export interface Quotation {
  id: string;
  quotationNo: string;
  enquiryRef: string;
  customer: string;
  date: string;
  validUntil: string;
  monthlyValue: string;
  parts: number;
  status: "Draft" | "Sent" | "Accepted" | "Rejected" | "Revised";
}

export interface FeasibilityStudy {
  id: string;
  enquiryId: string;
  studyCode: string;
  enquiryNo: string;
  customer: string;
  status: "Draft" | "Submitted for Review" | "Reviewed" | "Quoted";
  parts: number;
  assessmentDate: string;
}
