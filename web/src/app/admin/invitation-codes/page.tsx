"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Copy, Plus, Trash2, Loader2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface InvitationCode {
  id: string;
  code: string;
  label: string | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
}

export default function InvitationCodesPage() {
  const { data: codes, isLoading } = useSWR<InvitationCode[]>("/api/admin/invitation-codes", fetcher);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/invitation-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label || undefined,
          maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
          expiresAt: expiresAt || undefined,
        }),
      });
      if (res.ok) {
        setLabel("");
        setMaxUses("");
        setExpiresAt("");
        setShowForm(false);
        mutate("/api/admin/invitation-codes");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    await fetch(`/api/admin/invitation-codes?id=${id}`, { method: "DELETE" });
    mutate("/api/admin/invitation-codes");
  };

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ru-RU");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invitation Codes</h1>
          <p className="text-sm text-muted-foreground">
            Manage teacher registration invitation codes
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Generate Code
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg border p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label (optional)</Label>
              <Input
                id="label"
                placeholder="e.g. Math Dept 2025"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUses">Max Uses (optional)</Label>
              <Input
                id="maxUses"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expires (optional)</Label>
              <Input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create Code"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2 text-sm font-medium">Code</th>
              <th className="text-left px-4 py-2 text-sm font-medium">Label</th>
              <th className="text-left px-4 py-2 text-sm font-medium">Uses</th>
              <th className="text-left px-4 py-2 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-2 text-sm font-medium">Created</th>
              <th className="text-left px-4 py-2 text-sm font-medium">Expires</th>
              <th className="text-left px-4 py-2 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {codes?.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  No invitation codes yet. Generate one to get started.
                </td>
              </tr>
            ) : (
              codes?.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-2 font-mono text-sm">
                    <div className="flex items-center gap-2">
                      {c.code}
                      <button
                        onClick={() => copyToClipboard(c.code, c.id)}
                        className="text-muted-foreground hover:text-foreground"
                        title="Copy code"
                      >
                        {copiedId === c.id ? (
                          <span className="text-green-600 text-xs">Copied!</span>
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm">{c.label || "—"}</td>
                  <td className="px-4 py-2 text-sm">
                    {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : " / ∞"}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                      c.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                    }`}>
                      {c.isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-muted-foreground">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="px-4 py-2 text-sm text-muted-foreground">
                    {c.expiresAt ? formatDate(c.expiresAt) : "Never"}
                  </td>
                  <td className="px-4 py-2">
                    {c.isActive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeactivate(c.id)}
                        title="Deactivate code"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
