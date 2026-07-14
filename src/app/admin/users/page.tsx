"use client";

import { Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { AdminPagination } from "@/components/admin/pagination";
import {
  CountValue,
  DeleteAction,
  EditAction,
  EntityCell,
  RowActions,
} from "@/components/admin/table-cells";
import {
  AdminAlert,
  AdminClearFilters,
  AdminPageHeader,
  AdminSearch,
  AdminTableShell,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/page-kit";
import { useAdminListQuery } from "@/hooks/use-admin-list-query";
import type { PageMeta } from "@/lib/admin-query";
import {
  adminKeys,
  fetchAdminJson,
  useInvalidateAdmin,
} from "@/lib/admin-cache";
import { apiJson } from "@/components/admin/types";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  createdAt: string;
  _count: {
    enrollments: number;
    payments: number;
    lessonProgress: number;
    courses: number;
  };
};

const defaultMeta: PageMeta = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1,
};

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      }
    >
      <AdminUsersPageInner />
    </Suspense>
  );
}

function AdminUsersPageInner() {
  const invalidate = useInvalidateAdmin();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT" as "STUDENT" | "INSTRUCTOR" | "ADMIN",
  });
  const {
    page,
    pageSize,
    query,
    setQuery,
    q,
    getFilter,
    setPage,
    setPageSize,
    setFilter,
    hasActiveFilters,
    clearFilters,
    clearSearch,
  } = useAdminListQuery({
    filterKeys: ["role"],
  });
  const role = getFilter("role");

  const listParams = { page, pageSize, q, role };
  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
  } = useQuery({
    queryKey: adminKeys.users(listParams),
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (q) params.set("q", q);
      if (role !== "all") params.set("role", role);
      return fetchAdminJson<{ users: UserRow[]; meta: PageMeta }>(
        `/api/admin/users?${params}`,
        { signal },
      );
    },
  });

  const users = data?.users ?? [];
  const meta = data?.meta ?? defaultMeta;
  const loading = isLoading;
  const alertError = error || (queryError ? queryError.message : "");

  function openCreate() {
    setEditing(null);
    setForm({ name: "", email: "", password: "", role: "STUDENT" });
    setModal("create");
  }

  function openEdit(u: UserRow) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role });
    setModal("edit");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    if (modal === "create") {
      const res = await apiJson("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSaving(false);
      if (!res.ok) return setError(res.error);
      setMessage("User created");
    } else if (editing) {
      const body: Record<string, string> = {
        id: editing.id,
        name: form.name,
        email: form.email,
        role: form.role,
      };
      if (form.password) body.password = form.password;
      const res = await apiJson("/api/admin/users", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      setSaving(false);
      if (!res.ok) return setError(res.error);
      setMessage("User updated");
    }
    setModal(null);
    invalidate("users");
  }

  async function remove(u: UserRow) {
    if (!confirm(`Delete user “${u.name}” (${u.email})?`)) return;
    const res = await apiJson(`/api/admin/users?id=${u.id}`, {
      method: "DELETE",
    });
    if (!res.ok) return setError(res.error);
    setMessage("User deleted");
    invalidate("users");
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <AdminPageHeader
        title="Users"
        description="Create, update, or delete students and admins."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New user
          </Button>
        }
      />
      <AdminAlert error={alertError} message={message} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearch
          value={query}
          onChange={setQuery}
          onClear={clearSearch}
          placeholder="Search users…"
        />
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <AdminClearFilters show={hasActiveFilters} onClear={clearFilters} />
          <Select
            className="h-10 w-full sm:w-40"
            value={role}
            onChange={(e) => setFilter("role", e.target.value)}
          >
            <option value="all">All roles</option>
            <option value="STUDENT">Student</option>
            <option value="INSTRUCTOR">Instructor</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </div>
      </div>

      <AdminTableShell
        refreshing={isFetching && !isLoading}
        footer={
          <AdminPagination
            meta={meta}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Enrollments</TableHead>
              <TableHead>Payments</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  No users match your filters
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <EntityCell
                      initials={u.name}
                      title={u.name}
                      subtitle={u.email}
                    />
                  </TableCell>
                  <TableCell className="align-middle">
                    <Badge
                      variant={
                        u.role === "ADMIN"
                          ? "admin"
                          : u.role === "INSTRUCTOR"
                            ? "instructor"
                            : "student"
                      }
                    >
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <CountValue value={u._count.enrollments} />
                  </TableCell>
                  <TableCell>
                    <CountValue value={u._count.payments} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <RowActions>
                      <EditAction onClick={() => openEdit(u)} />
                      <DeleteAction onClick={() => remove(u)} />
                    </RowActions>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminTableShell>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === "edit" ? "Edit user" : "Create user"}
      >
        <form onSubmit={save} className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>
              {modal === "edit" ? "New password (optional)" : "Password"}
            </Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={modal === "create"}
              minLength={modal === "create" ? 8 : undefined}
            />
          </div>
          <div>
            <Label>Role</Label>
            <Select
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value as "STUDENT" | "INSTRUCTOR" | "ADMIN",
                })
              }
            >
              <option value="STUDENT">STUDENT</option>
              <option value="INSTRUCTOR">INSTRUCTOR</option>
              <option value="ADMIN">ADMIN</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModal(null)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
