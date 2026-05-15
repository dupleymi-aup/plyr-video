"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Ban, Trash2, Key, X, UserPlus, ArrowUpDown, Loader2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ACTION_CONFIG: Record<string, { label: string; icon: typeof ShieldCheck; color: string }> = {
  ROLE_CHANGED: { label: "Role Changed", icon: ArrowUpDown, color: "text-blue-600" },
  USER_BANNED: { label: "User Banned", icon: Ban, color: "text-red-600" },
  USER_UNBANNED: { label: "User Unbanned", icon: X, color: "text-green-600" },
  USER_DELETED: { label: "User Deleted", icon: Trash2, color: "text-red-700" },
  INVITATION_CODE_CREATED: { label: "Code Created", icon: Key, color: "text-amber-600" },
  INVITATION_CODE_DEACTIVATED: { label: "Code Deactivated", icon: X, color: "text-orange-600" },
  ADMIN_CREATED: { label: "Admin Created", icon: UserPlus, color: "text-purple-600" },
};

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");

  const { data, isLoading } = useSWR(
    `/api/admin/audit?page=${page}&limit=20${actionFilter ? `&action=${actionFilter}` : ""}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">Track all administrative actions</p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={actionFilter === "" ? "default" : "outline"}
          size="sm"
          onClick={() => { setActionFilter(""); setPage(1); }}
        >
          All
        </Button>
        {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
          <Button
            key={key}
            variant={actionFilter === key ? "default" : "outline"}
            size="sm"
            onClick={() => { setActionFilter(key); setPage(1); }}
          >
            {cfg.label}
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2 text-sm font-medium">Time</th>
              <th className="text-left px-4 py-2 text-sm font-medium">Action</th>
              <th className="text-left px-4 py-2 text-sm font-medium">Admin</th>
              <th className="text-left px-4 py-2 text-sm font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-muted-foreground">
                  No audit log entries yet
                </td>
              </tr>
            ) : (
              logs.map((log: any) => {
                const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.ROLE_CHANGED;
                const Icon = cfg.icon;
                return (
                  <tr key={log.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("ru-RU")}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm">
                      {log.admin?.name || log.admin?.email || "System"}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">
                      {log.details}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            {total} entries, page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
