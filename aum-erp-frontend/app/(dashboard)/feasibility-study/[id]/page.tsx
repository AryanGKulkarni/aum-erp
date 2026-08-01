"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Box from "@mui/joy/Box";
import CircularProgress from "@mui/joy/CircularProgress";
import FeasibilityStudyForm, {
  type FeasibilityStudyInitialData,
} from "@/components/forms/FeasibilityStudyForm";
import { getFeasibilityStudy } from "@/services/api_service";

export default function EditFeasibilityStudyPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<FeasibilityStudyInitialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeasibilityStudy(id)
      .then((raw) => setData(raw as unknown as FeasibilityStudyInitialData))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) return null;

  return <FeasibilityStudyForm mode="edit" studyId={id} initialData={data} />;
}
