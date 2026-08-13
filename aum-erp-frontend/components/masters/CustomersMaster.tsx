"use client";

import { useState } from "react";
import Box from "@mui/joy/Box";
import Input from "@mui/joy/Input";
import Textarea from "@mui/joy/Textarea";
import Typography from "@mui/joy/Typography";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import MasterShell, { EditCell, NameCell, PanelField } from "./MasterShell";
import { createCustomer, updateCustomer, type MasterCustomer } from "@/services/api_service";

interface Draft {
  customerId: number | null;
  companyName: string;
  contactPerson: string;
  phone: string;
  city: string;
  email: string;
  address: string;
  gstNumber: string;
}

function draftFrom(c: MasterCustomer): Draft {
  return {
    customerId: c.customerId,
    companyName: c.companyName,
    contactPerson: c.contactPerson ?? "",
    phone: c.phone ?? "",
    city: c.city ?? "",
    email: c.email ?? "",
    address: c.address ?? "",
    gstNumber: c.gstNumber ?? "",
  };
}

function emptyDraft(): Draft {
  return {
    customerId: null, companyName: "", contactPerson: "", phone: "",
    city: "", email: "", address: "", gstNumber: "",
  };
}

export default function CustomersMaster({
  customers,
  isLoading,
  onChanged,
}: {
  customers: MasterCustomer[];
  isLoading: boolean;
  onChanged: () => Promise<void>;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const term = searchTerm.trim().toLowerCase();
  const filtered = term
    ? customers.filter((c) =>
        [c.companyName, c.contactPerson, c.phone, c.city, c.gstNumber]
          .some((f) => f?.toLowerCase().includes(term)),
      )
    : customers;

  function open(next: Draft) {
    setError(null);
    setDraft(next);
  }

  async function handleSave() {
    if (!draft) return;
    if (!draft.companyName.trim()) return setError("Company name is required");

    // Optional text fields are sent as undefined rather than "" so they clear to NULL.
    const dto = {
      companyName: draft.companyName,
      contactPerson: draft.contactPerson || undefined,
      phone: draft.phone || undefined,
      city: draft.city || undefined,
      email: draft.email || undefined,
      address: draft.address || undefined,
      gstNumber: draft.gstNumber || undefined,
    };

    setSaving(true);
    setError(null);
    try {
      if (draft.customerId === null) {
        await createCustomer(dto);
      } else {
        await updateCustomer(draft.customerId, dto);
      }
      await onChanged();
      setDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save customer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MasterShell
      searchPlaceholder="Search customers..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      addLabel="Add Customer"
      onAdd={() => open(emptyDraft())}
      isLoading={isLoading}
      isEmpty={filtered.length === 0}
      emptyLabel={term ? "No matching customers" : "No customers yet"}
      panelTitle={draft?.customerId === null ? "Add Customer" : "Edit Customer"}
      onClosePanel={() => setDraft(null)}
      onSave={handleSave}
      saving={saving}
      error={error}
      emptyPanelIcon={<BusinessOutlinedIcon style={{ fontSize: 34 }} />}
      emptyPanelTitle="No customer selected"
      emptyPanelSubtitle="Select a row or add a new customer."
      head={
        <thead>
          <tr>
            <th style={{ width: "26%" }}>Company</th>
            <th style={{ width: "18%" }}>Contact</th>
            <th style={{ width: "20%" }}>Phone</th>
            <th style={{ width: "15%" }}>City</th>
            <th style={{ width: "21%" }}>GST No.</th>
            <th style={{ width: 52 }} aria-label="Actions" />
          </tr>
        </thead>
      }
      panel={
        draft && (
          <>
            <PanelField label="Company Name" required>
              <Input
                size="sm"
                value={draft.companyName}
                onChange={(e) => setDraft({ ...draft, companyName: e.target.value })}
              />
            </PanelField>
            <PanelField label="Contact Person">
              <Input
                size="sm"
                value={draft.contactPerson}
                onChange={(e) => setDraft({ ...draft, contactPerson: e.target.value })}
              />
            </PanelField>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <PanelField label="Phone">
                <Input
                  size="sm"
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                />
              </PanelField>
              <PanelField label="City">
                <Input
                  size="sm"
                  value={draft.city}
                  onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                />
              </PanelField>
            </Box>
            <PanelField label="Email">
              <Input
                size="sm"
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </PanelField>
            <PanelField label="Address">
              <Textarea
                size="sm"
                minRows={2}
                value={draft.address}
                onChange={(e) => setDraft({ ...draft, address: e.target.value })}
              />
            </PanelField>
            <PanelField label="GST Number">
              <Input
                size="sm"
                value={draft.gstNumber}
                onChange={(e) => setDraft({ ...draft, gstNumber: e.target.value })}
              />
            </PanelField>
          </>
        )
      }
    >
      {filtered.map((c) => (
        <tr key={c.customerId} data-selected={draft?.customerId === c.customerId}>
          <td>
            <NameCell label={c.companyName} avatar={c.companyName.trim().charAt(0).toUpperCase() || "?"} />
          </td>
          <td>
            <Typography level="body-xs" sx={{ color: "neutral.600" }} noWrap>
              {c.contactPerson ?? "—"}
            </Typography>
          </td>
          <td>
            <Typography level="body-xs" sx={{ color: "neutral.500", fontFamily: "monospace" }} noWrap>
              {c.phone ?? "—"}
            </Typography>
          </td>
          <td>
            <Typography level="body-xs" sx={{ color: "neutral.600" }} noWrap>
              {c.city ?? "—"}
            </Typography>
          </td>
          <td>
            <Typography level="body-xs" sx={{ color: "neutral.500", fontFamily: "monospace" }} noWrap>
              {c.gstNumber ?? "—"}
            </Typography>
          </td>
          <td>
            <EditCell onClick={() => open(draftFrom(c))} />
          </td>
        </tr>
      ))}
    </MasterShell>
  );
}
