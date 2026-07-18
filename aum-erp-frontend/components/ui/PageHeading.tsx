import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";

interface PageHeadingProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionClick?: () => void;
}

export default function PageHeading({
  title,
  subtitle,
  actionLabel,
  onActionClick,
}: PageHeadingProps) {
  return (
    <Box
      sx={{
        mb: 3,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <div>
        <Typography level="h3">{title}</Typography>
        {subtitle ? (
          <Typography level="body-sm" sx={{ color: "neutral.500", mt: 0.5 }}>
            {subtitle}
          </Typography>
        ) : null}
      </div>

      {actionLabel ? (
        <Button startDecorator={<AddOutlinedIcon />} onClick={onActionClick}>
          {actionLabel}
        </Button>
      ) : null}
    </Box>
  );
}
