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
  { key: "studyId", header: "Study ID" },
  { key: "partName", header: "Part" },
  { key: "customer", header: "Customer" },
  { key: "machine", header: "Machine" },
  { key: "materialUtilPercent", header: "Mat. Util.", align: "right" },
  { key: "quotedPrice", header: "Quoted Price", align: "right" },
  { key: "capacity", header: "Capacity", type: "badge" },
  { key: "verdict", header: "Verdict", type: "badge" },
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
      s.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studyId.toLowerCase().includes(searchTerm.toLowerCase()),
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
        placeholder="Search by part, customer, or study ID..."
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
