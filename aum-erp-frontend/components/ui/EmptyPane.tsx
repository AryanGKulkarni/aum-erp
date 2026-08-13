import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

interface EmptyPaneProps {
  title: string;
  subtitle?: string;
}

/** Placeholder for the detail pane when nothing is selected in the list pane. */
export default function EmptyPane({ title, subtitle }: EmptyPaneProps) {
  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 320,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "neutral.400",
      }}
    >
      <Inventory2OutlinedIcon style={{ fontSize: 44, marginBottom: 12 }} />
      <Typography level="title-md" sx={{ color: "neutral.600" }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography level="body-sm" sx={{ color: "neutral.400", mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
