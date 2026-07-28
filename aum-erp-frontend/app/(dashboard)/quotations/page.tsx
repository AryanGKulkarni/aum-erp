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
  { key: "quotationId", header: "Quotation ID" },
  { key: "enquiryRef", header: "Enquiry Ref" },
  { key: "client", header: "Client" },
  { key: "grandTotal", header: "Grand Total", align: "right" },
  { key: "validUntil", header: "Valid Until" },
  { key: "paymentTerms", header: "Payment Terms" },
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
      q.quotationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.client.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <PageHeading
        title="Quotations"
        subtitle={`${quotations.length} total records`}
      />

      <Input
        placeholder="Search by client or ID..."
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
      />
    </>
  );
}
