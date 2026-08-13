import Box from "@mui/joy/Box";
import PageHeading from "@/components/ui/PageHeading";

export default function DashboardPage() {
  return (
    <Box sx={{ flex: 1, minWidth: 0, height: "100vh", overflowY: "auto", p: 4 }}>
      <PageHeading title="Dashboard" subtitle="June 2026 · All business units" />
    </Box>
  );
}
