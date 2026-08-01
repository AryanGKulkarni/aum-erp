"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@mui/joy/Input";
import SearchIcon from "@mui/icons-material/Search";
import PageHeading from "@/components/ui/PageHeading";
import DataTable from "@/components/ui/DataTable";
import { getFeasibilityStudies } from "@/services/api_service";
import type { FeasibilityStudy } from "@/types/entities";
import type { Column } from "@/types/table";

const COLUMNS: Column<FeasibilityStudy>[] = [
  { key: "studyCode", header: "Study ID" },
  { key: "enquiryNo", header: "Enquiry No." },
  { key: "customer", header: "Customer" },
  { key: "parts", header: "Parts", align: "center" },
  { key: "assessmentDate", header: "Assessment Date" },
  { key: "status", header: "Status", type: "badge" },
];

export default function FeasibilityStudyPage() {
  const router = useRouter();
  const [studies, setStudies] = useState<FeasibilityStudy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getFeasibilityStudies()
      .then(setStudies)
      .finally(() => setIsLoading(false));
  }, []);

  const filteredStudies = studies.filter(
    (s) =>
      s.enquiryNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studyCode.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <PageHeading
        title="Feasibility Studies"
        subtitle={`${studies.length} total records`}
        actionLabel="New Study"
        onActionClick={() => router.push("/feasibility-study/new")}
      />

      <Input
        placeholder="Search by enquiry number, customer, or study ID..."
        startDecorator={<SearchIcon />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />

      <DataTable
        columns={COLUMNS}
        data={filteredStudies}
        isLoading={isLoading}
        getRowKey={(row) => row.id}
        onRowAction={(row) => router.push(`/feasibility-study/${row.id}`)}
      />
    </>
  );
}
