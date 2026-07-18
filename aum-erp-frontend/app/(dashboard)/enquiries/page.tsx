"use client";

import { useEffect, useState } from "react";
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
  { key: "dieSets", header: "Die Sets", align: "center" },
  { key: "status", header: "Status", type: "badge" },
];

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getEnquiries()
      .then(setEnquiries)
      .finally(() => setIsLoading(false));
  }, []);

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
        onRowAction={(row) => console.log("Open enquiry:", row.enquiryNo)}
      />
    </>
  );
}
