"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Input from "@mui/joy/Input";
import SearchIcon from "@mui/icons-material/Search";
import PageHeading from "@/components/ui/PageHeading";
import DataTable from "@/components/ui/DataTable";
import { getEnquiries } from "@/services/api_service";
import type { Enquiry } from "@/types/entities";
import type { Column } from "@/types/table";

const COLUMNS: Column<Enquiry>[] = [
  { key: "enquiryNo", header: "Enquiry No." },
  { key: "customer", header: "Customer" },
  { key: "date", header: "Date" },
  { key: "receivedBy", header: "Received By" },
  { key: "parts", header: "Parts", align: "center" },
  { key: "status", header: "Status", type: "badge" },
  { key: "quotation", header: "Quotation", type: "badge" },
];

export default function EnquiriesPage() {
  const router = useRouter();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadEnquiries = useCallback(() => {
    return getEnquiries().then(setEnquiries);
  }, []);

  useEffect(() => {
    loadEnquiries().finally(() => setIsLoading(false));
  }, [loadEnquiries]);

  const filteredEnquiries = enquiries.filter(
    (enquiry) =>
      enquiry.enquiryNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.customer.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <PageHeading
        title="Enquiries"
        subtitle={`${enquiries.length} total records`}
        actionLabel="New Enquiry"
        onActionClick={() => router.push("/enquiries/new")}
      />

      <Input
        placeholder="Search by enquiry number or customer..."
        startDecorator={<SearchIcon />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />

      <DataTable
        columns={COLUMNS}
        data={filteredEnquiries}
        isLoading={isLoading}
        getRowKey={(row) => row.id}
        onRowAction={(row) => router.push(`/enquiries/${row.id}`)}
      />
    </>
  );
}
