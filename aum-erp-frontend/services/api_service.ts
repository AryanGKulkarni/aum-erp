import type { Enquiry, Quotation, FeasibilityStudy } from "@/types/entities";

// DUMMY DATA FOR NOW - I WILL REMOVE THIS LATER ONCE API'S ARE READY TO INTEGRATE.
const DUMMY_ENQUIRIES: Enquiry[] = [
  {
    id: "1",
    enquiryNo: "ENQ-2026-047",
    customer: "Tata Steel Ltd.",
    date: "2026-06-13",
    receivedBy: "Arjun Kumar",
    parts: 2,
    dieSets: 2,
    status: "Feasibility",
  },
];

const DUMMY_QUOTATIONS: Quotation[] = [
  {
    id: "1",
    quotationId: "QUO-2024-047",
    enquiryRef: "ENQ-2024-088",
    client: "Mahindra & Mahindra",
    contactPerson: "Priya Sharma",
    grandTotal: 10384000,
    validUntil: "2026-07-13",
    paymentTerms: "30 Days Net",
    status: "Approved",
  },
  {
    id: "2",
    quotationId: "QUO-2024-046",
    enquiryRef: "ENQ-2024-087",
    client: "Bharat Electronics",
    contactPerson: "Kiran Mehta",
    grandTotal: 4838000,
    validUntil: "2026-07-08",
    paymentTerms: "45 Days Net",
    status: "Pending",
  },
];

const DUMMY_FEASIBILITY_STUDIES: FeasibilityStudy[] = [
  {
    id: "1",
    studyId: "FS-1",
    partName: "CNC Milled Enclosure",
    partCode: "BEL-ENC-7721",
    customer: "Bharat Electronics",
    machine: "1000T Press",
    materialUtilPercent: 84.71,
    quotedPrice: 825.46,
    capacity: "OK",
    verdict: "Conditional",
  },
];

function simulateDelay<T>(data: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

//DUMMY API'S FOR NOW - I will replace this once the backend is ready

export async function getEnquiries(): Promise<Enquiry[]> {
  return simulateDelay(DUMMY_ENQUIRIES);
}

export async function getQuotations(): Promise<Quotation[]> {
  return simulateDelay(DUMMY_QUOTATIONS);
}

export async function getFeasibilityStudies(): Promise<FeasibilityStudy[]> {
  return simulateDelay(DUMMY_FEASIBILITY_STUDIES);
}
