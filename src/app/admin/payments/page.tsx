"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { AdminPagination } from "@/components/admin/pagination";
import {
  DeleteAction,
  EditAction,
  EmptyValue,
  EntityCell,
  RowActions,
} from "@/components/admin/table-cells";
import {
  AdminAlert,
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
import { apiJson, formatPrice } from "@/components/admin/types";

type PaymentRow = {
  id: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amountInPaise: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: string;
  user: { id: string; name: string; email: string };
  course: { id: string; title: string };
};

const defaultMeta: PageMeta = { page: 1, pageSize: 10, total: 0, totalPages: 1 };

export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <AdminPaymentsPageInner />
    </Suspense>
  );
}

function AdminPaymentsPageInner() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [meta, setMeta] = useState<PageMeta>(defaultMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<PaymentRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    status: "PENDING" as PaymentRow["status"],
    amountInPaise: 0,
    razorpayPaymentId: "",
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
  } = useAdminListQuery({
    filterKeys: ["status"],
  });
  const status = getFilter("status");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (q) params.set("q", q);
    if (status !== "all") params.set("status", status);

    const res = await apiJson<{ payments: PaymentRow[]; meta: PageMeta }>(
      `/api/admin/payments?${params}`
    );
    if (res.ok) {
      setRows(res.data.payments);
      setMeta(res.data.meta);
    } else {
      setError(res.error);
    }
    setLoading(false);
  }, [page, pageSize, q, status]);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(p: PaymentRow) {
    setEditing(p);
    setForm({
      status: p.status,
      amountInPaise: p.amountInPaise,
      razorpayPaymentId: p.razorpayPaymentId ?? "",
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");
    const res = await apiJson("/api/admin/payments", {
      method: "PUT",
      body: JSON.stringify({
        id: editing.id,
        status: form.status,
        amountInPaise: Number(form.amountInPaise),
        razorpayPaymentId: form.razorpayPaymentId || null,
      }),
    });
    setSaving(false);
    if (!res.ok) return setError(res.error);
    setMessage("Payment updated");
    setEditing(null);
    await load();
  }

  async function remove(p: PaymentRow) {
    if (!confirm(`Delete payment ${p.razorpayOrderId}?`)) return;
    const res = await apiJson(`/api/admin/payments?id=${p.id}`, { method: "DELETE" });
    if (!res.ok) return setError(res.error);
    setMessage("Payment deleted");
    await load();
  }

  function statusVariant(s: PaymentRow["status"]) {
    if (s === "COMPLETED") return "success" as const;
    if (s === "FAILED") return "destructive" as const;
    return "warning" as const;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <AdminPageHeader
        title="Payments"
        description="View and update Razorpay payment records."
      />
      <AdminAlert error={error} message={message} />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="min-w-[200px] flex-1">
          <AdminSearch
            value={query}
            onChange={setQuery}
            placeholder="Search user, course, order ID…"
          />
        </div>
        <Select
          className="h-10 w-full sm:w-40"
          value={status}
          onChange={(e) => setFilter("status", e.target.value)}
        >
          <option value="all">All status</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
        </Select>
      </div>

      <AdminTableShell
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
              <TableHead>Course</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No payments match your filters
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <EntityCell
                      initials={p.user.name}
                      title={p.user.name}
                      subtitle={p.user.email}
                    />
                  </TableCell>
                  <TableCell>
                    <EntityCell icon={BookOpen} title={p.course.title} />
                  </TableCell>
                  <TableCell className="text-sm font-medium tabular-nums">
                    {p.amountInPaise === 0 ? (
                      <EmptyValue />
                    ) : (
                      formatPrice(p.amountInPaise)
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate font-mono text-xs text-muted-foreground">
                    {p.razorpayOrderId || <EmptyValue />}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(p.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <RowActions>
                      <EditAction onClick={() => openEdit(p)} />
                      <DeleteAction onClick={() => remove(p)} />
                    </RowActions>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminTableShell>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit payment">
        <form onSubmit={save} className="space-y-3">
          <div>
            <Label>Status</Label>
            <Select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as PaymentRow["status"] })
              }
            >
              <option value="PENDING">PENDING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="FAILED">FAILED</option>
            </Select>
          </div>
          <div>
            <Label>Amount (paise)</Label>
            <Input
              type="number"
              min={0}
              value={form.amountInPaise}
              onChange={(e) => setForm({ ...form, amountInPaise: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Razorpay payment ID</Label>
            <Input
              value={form.razorpayPaymentId}
              onChange={(e) => setForm({ ...form, razorpayPaymentId: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
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
