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
import Textarea from "@mui/joy/Textarea";
import CircularProgress from "@mui/joy/CircularProgress";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import TagRoundedIcon from "@mui/icons-material/TagRounded";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { createCustomer, type CustomerOption } from "@/services/api_service";

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
  onCreated: (customer: CustomerOption) => void;
}

export default function AddCustomerModal({ open, onClose, onCreated }: Props) {
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setCompanyName(""); setContactPerson(""); setPhone(""); setEmail("");
    setGstNumber(""); setAddress(""); setCity("");
  }

  function handleClose() {
    if (saving) return;
    reset();
    onClose();
  }

  async function handleSave() {
    if (!companyName.trim()) return alert("Please enter a company name");
    setSaving(true);
    try {
      const customer = await createCustomer({
        companyName,
        contactPerson: contactPerson || undefined,
        phone: phone || undefined,
        email: email || undefined,
        gstNumber: gstNumber || undefined,
        address: address || undefined,
        city: city || undefined,
      });
      onCreated(customer);
      reset();
    } catch (err) {
      console.error(err);
      alert("Failed to save customer");
    } finally {
      setSaving(false);
    }
  }

  const inputSx = { backgroundColor: "background.surface" };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog sx={{ maxWidth: 560, width: "100%" }}>
        <ModalClose disabled={saving} />
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1 }}>
          <Box sx={{ p: 1, borderRadius: "md", backgroundColor: "primary.softBg", display: "flex" }}>
            <ApartmentRoundedIcon style={{ color: "var(--joy-palette-primary-500)" }} />
          </Box>
          <Box>
            <DialogTitle sx={{ mb: 0 }}>Add New Customer</DialogTitle>
            <Typography level="body-sm" sx={{ color: "neutral.500" }}>
              Fill in the customer details below
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box>
            <FieldLabel icon={<ApartmentRoundedIcon style={{ fontSize: 16, color: "var(--joy-palette-neutral-500)" }} />} label="Company Name" required />
            <Input
              placeholder="e.g. Acme Industries Pvt. Ltd."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              sx={inputSx}
              autoFocus
            />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <FieldLabel icon={<PersonOutlineRoundedIcon style={{ fontSize: 16, color: "var(--joy-palette-neutral-500)" }} />} label="Contact Person" />
              <Input placeholder="Full name" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} sx={inputSx} />
            </Box>
            <Box>
              <FieldLabel icon={<CallOutlinedIcon style={{ fontSize: 16, color: "var(--joy-palette-neutral-500)" }} />} label="Phone" />
              <Input placeholder="+91 XXXXX XXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} sx={inputSx} />
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <FieldLabel icon={<MailOutlineRoundedIcon style={{ fontSize: 16, color: "var(--joy-palette-neutral-500)" }} />} label="Email" />
              <Input type="email" placeholder="contact@company.com" value={email} onChange={(e) => setEmail(e.target.value)} sx={inputSx} />
            </Box>
            <Box>
              <FieldLabel icon={<TagRoundedIcon style={{ fontSize: 16, color: "var(--joy-palette-neutral-500)" }} />} label="GST Number" />
              <Input placeholder="e.g. 27AABCT1234F1Z5" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} sx={inputSx} />
            </Box>
          </Box>

          <Box>
            <FieldLabel icon={<PlaceOutlinedIcon style={{ fontSize: 16, color: "var(--joy-palette-neutral-500)" }} />} label="Address" />
            <Textarea minRows={3} placeholder="Street, area, landmark..." value={address} onChange={(e) => setAddress(e.target.value)} sx={inputSx} />
          </Box>

          <Box>
            <FieldLabel label="City" />
            <Input placeholder="e.g. Pune" value={city} onChange={(e) => setCity(e.target.value)} sx={inputSx} />
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
            Save Customer
          </Button>
        </Box>
      </ModalDialog>
    </Modal>
  );
}
