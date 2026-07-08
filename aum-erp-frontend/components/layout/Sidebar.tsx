import List from "@mui/joy/List";
import Typography from "@mui/joy/Typography";
import Box from "@mui/joy/Box";
import { NAV_ITEMS } from "@/constants/navigation";
import SidebarItem from "./SidebarItem";
import UserFooter from "./UserFooter";
import { SidebarContainer, BrandSection, NavSection } from "./Sidebar.styles";

export default function Sidebar() {
  return (
    <SidebarContainer variant="plain">
      <Box>
        <BrandSection>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "sm",
              backgroundColor: "primary.500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "common.white",
              fontWeight: "lg",
              fontSize: "sm",
            }}
          >
            ERP
          </Box>
          <Box>
            <Typography level="title-sm" sx={{ color: "neutral.100" }}>
              NexusERP
            </Typography>
            <Typography level="body-xs" sx={{ color: "neutral.500" }}>
              v1.0.0
            </Typography>
          </Box>
        </BrandSection>

        <NavSection>
          <List size="sm" sx={{ "--ListItem-paddingY": "8px" }}>
            {NAV_ITEMS.map((item) => (
              <SidebarItem key={item.key} item={item} />
            ))}
          </List>
        </NavSection>
      </Box>
      <UserFooter />
    </SidebarContainer>
  );
}
