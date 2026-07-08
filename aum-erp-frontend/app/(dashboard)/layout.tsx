import Box from "@mui/joy/Box";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 4, backgroundColor: "background.level1" }}
      >
        {children}
      </Box>
    </Box>
  );
}
