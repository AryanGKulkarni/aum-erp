"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@mui/joy/Input";
import SearchIcon from "@mui/icons-material/Search";
import PageHeading from "@/components/ui/PageHeading";
import DataTable from "@/components/ui/DataTable";
import { getQuotations } from "@/services/api_service";
import type { Quotation } from "@/types/entities";
import type { Column } from "@/types/table";

const COLUMNS: Column<Quotation>[] = [
  { key: "quotationNo", header: "Quotation No." },
  { key: "enquiryRef", header: "Enquiry Ref." },
  { key: "customer", header: "Customer" },
  { key: "date", header: "Date" },
  { key: "validUntil", header: "Valid Until" },
  { key: "monthlyValue", header: "Monthly Value", align: "right" },
  { key: "parts", header: "Parts", align: "center" },
  { key: "status", header: "Status", type: "badge" },
];

export default function QuotationsPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getQuotations()
      .then(setQuotations)
      .finally(() => setIsLoading(false));
  }, []);

  const filteredQuotations = quotations.filter(
    (q) =>
      q.quotationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.enquiryRef.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <PageHeading
        title="Quotations"
        subtitle={`${quotations.length} total · auto-generated from feasibility study`}
      />

      <Input
        placeholder="Search by quotation number, customer, or enquiry..."
        startDecorator={<SearchIcon />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />

      <DataTable
        columns={COLUMNS}
        data={filteredQuotations}
        isLoading={isLoading}
        getRowKey={(row) => row.id}
        onRowAction={(row) => router.push(`/quotations/${row.id}`)}
        rowActionLabel="View →"
      />
    </>
  );
}
