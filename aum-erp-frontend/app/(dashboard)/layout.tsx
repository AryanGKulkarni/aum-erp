import Box from "@mui/joy/Box";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      {/* Sections own their inner panes and padding — this shell stays flush so a
          list pane can sit directly against the sidebar. */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: "flex",
          backgroundColor: "background.level1",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
