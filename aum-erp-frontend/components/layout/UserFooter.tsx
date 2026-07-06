import Box from "@mui/joy/Box";
import Avatar from "@mui/joy/Avatar";
import Typography from "@mui/joy/Typography";
import { FooterSection } from "./Sidebar.styles";

export default function UserFooter() {
  return (
    <FooterSection>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar size="sm" color="primary" variant="solid">
          AK
        </Avatar>
        <Box>
          <Typography level="title-sm" sx={{ color: "neutral.100" }}>
            Arjun Kumar
          </Typography>
          <Typography level="body-xs" sx={{ color: "neutral.400" }}>
            Sales Manager
          </Typography>
        </Box>
      </Box>
    </FooterSection>
  );
}
