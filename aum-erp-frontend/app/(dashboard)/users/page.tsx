"use client";

import { useCallback, useEffect, useState } from "react";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Input from "@mui/joy/Input";
import CircularProgress from "@mui/joy/CircularProgress";
import SearchIcon from "@mui/icons-material/Search";
import PageHeading from "@/components/ui/PageHeading";
import DataTable from "@/components/ui/DataTable";
import AddUserModal from "@/components/forms/AddUserModal";
import { getCurrentUser, getUsers, type CurrentUser, type UserOption } from "@/services/api_service";
import type { Column } from "@/types/table";

const COLUMNS: Column<UserOption>[] = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "role", header: "Role", type: "badge" },
];

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const loadUsers = useCallback(() => {
    return getUsers().then(setUsers);
  }, []);

  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .finally(() => setCheckingAccess(false));
  }, []);

  useEffect(() => {
    loadUsers().finally(() => setIsLoading(false));
  }, [loadUsers]);

  if (checkingAccess) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size="md" />
      </Box>
    );
  }

  if (currentUser?.role !== "Admin") {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography level="title-md">Access restricted</Typography>
        <Typography level="body-sm" sx={{ color: "neutral.500", mt: 0.5 }}>
          Only admins can view and manage users.
        </Typography>
      </Box>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <PageHeading
        title="Users"
        subtitle={`${users.length} total`}
        actionLabel="Add User"
        onActionClick={() => setModalOpen(true)}
      />

      <Input
        placeholder="Search by name or email..."
        startDecorator={<SearchIcon />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />

      <DataTable
        columns={COLUMNS}
        data={filteredUsers}
        isLoading={isLoading}
        getRowKey={(row) => row.id}
      />

      <AddUserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          loadUsers();
        }}
      />
    </>
  );
}
