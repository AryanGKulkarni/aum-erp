"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Box from "@mui/joy/Box";
import CircularProgress from "@mui/joy/CircularProgress";
import EnquiryForm, { type EnquiryInitialData } from "@/components/forms/EnquiryForm";
import { getEnquiry } from "@/services/api_service";

export default function EditEnquiryPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<EnquiryInitialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEnquiry(id)
      .then((raw) => setData(raw as unknown as EnquiryInitialData))
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

  return <EnquiryForm mode="edit" enquiryId={id} initialData={data} />;
}
