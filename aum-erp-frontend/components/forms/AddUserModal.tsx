"use client";

import { useState } from "react";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import ModalClose from "@mui/joy/ModalClose";
import DialogTitle from "@mui/joy/DialogTitle";
import Divider from "@mui/joy/Divider";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Input from "@mui/joy/Input";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import CircularProgress from "@mui/joy/CircularProgress";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import { createUser, type UserOption } from "@/services/api_service";

const ROLES = ["Sales", "Engineering", "Costing", "Admin"] as const;

function FieldLabel({ icon, label, required }: {
  icon?: React.ReactNode; label: string; required?: boolean;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
      {icon}
      <Typography level="body-sm" sx={{ color: "neutral.700", fontWeight: 500 }}>
        {label}
        {required && <Typography component="span" sx={{ color: "danger.500" }}> *</Typography>}
      </Typography>
    </Box>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (user: UserOption) => void;
}

export default function AddUserModal({ open, onClose, onCreated }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setFullName("");
    setEmail("");
    setRole("");
  }

  function handleClose() {
    if (saving) return;
    reset();
    onClose();
  }

  async function handleSave() {
    if (!fullName.trim()) return alert("Please enter a full name");
    if (!email.trim()) return alert("Please enter an email address");
    if (!role) return alert("Please select a role");
    setSaving(true);
    try {
      const user = await createUser({ fullName: fullName.trim(), email: email.trim(), role });
      onCreated(user);
      reset();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  }

  const inputSx = { backgroundColor: "background.surface" };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog sx={{ maxWidth: 480, width: "100%" }}>
        <ModalClose disabled={saving} />
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1 }}>
          <Box sx={{ p: 1, borderRadius: "md", backgroundColor: "primary.softBg", display: "flex" }}>
            <PersonAddAlt1RoundedIcon style={{ color: "var(--joy-palette-primary-500)" }} />
          </Box>
          <Box>
            <DialogTitle sx={{ mb: 0 }}>Add New User</DialogTitle>
            <Typography level="body-sm" sx={{ color: "neutral.500" }}>
              Create an account and assign their role
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box>
            <FieldLabel icon={<PersonOutlineRoundedIcon style={{ fontSize: 16, color: "var(--joy-palette-neutral-500)" }} />} label="Full Name" required />
            <Input
              placeholder="e.g. Priya Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              sx={inputSx}
              autoFocus
            />
          </Box>

          <Box>
            <FieldLabel icon={<MailOutlineRoundedIcon style={{ fontSize: 16, color: "var(--joy-palette-neutral-500)" }} />} label="Email" required />
            <Input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={inputSx}
            />
          </Box>

          <Box>
            <FieldLabel icon={<BadgeOutlinedIcon style={{ fontSize: 16, color: "var(--joy-palette-neutral-500)" }} />} label="Role" required />
            <Select
              placeholder="— Select role —"
              value={role || null}
              onChange={(_, v) => setRole(v ?? "")}
              sx={inputSx}
            >
              {ROLES.map((r) => (
                <Option key={r} value={r}>{r}</Option>
              ))}
            </Select>
          </Box>
        </Box>

        <Divider sx={{ mt: 3, mb: 2 }} />
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button variant="outlined" color="neutral" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            startDecorator={saving ? <CircularProgress size="sm" /> : undefined}
          >
            Save User
          </Button>
        </Box>
      </ModalDialog>
    </Modal>
  );
}
