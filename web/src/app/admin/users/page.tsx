"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Ban,
  Trash2,
  X,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  banned: boolean;
  createdAt: string;
}

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Shield; color: string; bg: string }> = {
  ADMIN: { label: "Admin", icon: ShieldCheck, color: "text-red-700 dark:text-red-300", bg: "bg-red-100 dark:bg-red-900" },
  TEACHER: { label: "Teacher", icon: BookOpen, color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-900" },
  STUDENT: { label: "Student", icon: GraduationCap, color: "text-green-700 dark:text-green-300", bg: "bg-green-100 dark:bg-green-900" },
};

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editBanned, setEditBanned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditBanned(user.banned);
  };

  const closeEdit = () => {
    setEditingUser(null);
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    setSaving(true);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: editingUser.id, role: editRole, banned: editBanned }),
    });
    setSaving(false);
    if (res.ok) {
      fetchUsers();
      closeEdit();
    }
  };

  const quickToggleBan = async (userId: string, banned: boolean) => {
    setActionLoading(userId);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, banned }),
    });
    setActionLoading(null);
    if (res.ok) fetchUsers();
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    setActionLoading(userId);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    setActionLoading(null);
    if (res.ok) fetchUsers();
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage users, roles, and access</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {["ALL", "STUDENT", "TEACHER", "ADMIN"].map((role) => (
            <Button
              key={role}
              variant={roleFilter === role ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setRoleFilter(role);
                setPage(0);
              }}
            >
              {role === "ALL" ? "All" : ROLE_CONFIG[role]?.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Name</th>
                  <th className="text-left py-2 px-3 font-medium">Email</th>
                  <th className="text-left py-2 px-3 font-medium">Role</th>
                  <th className="text-left py-2 px-3 font-medium">Status</th>
                  <th className="text-left py-2 px-3 font-medium">Created</th>
                  <th className="text-left py-2 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  paginated.map((user) => {
                    const roleCfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.STUDENT;
                    const RoleIcon = roleCfg.icon;
                    return (
                      <tr key={user.id} className="border-b hover:bg-muted/50">
                        <td className="py-2.5 px-3">{user.name || "—"}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{user.email || "—"}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${roleCfg.bg} ${roleCfg.color}`}>
                            <RoleIcon className="h-3 w-3" />
                            {roleCfg.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {user.banned ? (
                            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium text-xs">
                              <Ban className="h-3 w-3" />
                              Banned
                            </span>
                          ) : (
                            <span className="text-green-600 dark:text-green-400 text-xs font-medium">Active</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => openEdit(user)}
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant={user.banned ? "outline" : "destructive"}
                              className="h-7 px-2 text-xs"
                              disabled={actionLoading === user.id}
                              onClick={() => quickToggleBan(user.id, !user.banned)}
                            >
                              {actionLoading === user.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : user.banned ? (
                                "Unban"
                              ) : (
                                <><Ban className="h-3 w-3 mr-1" /> Ban</>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                              disabled={actionLoading === user.id}
                              onClick={() => deleteUser(user.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
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
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeEdit}>
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Edit User Permissions</h2>
              <Button variant="ghost" size="icon" onClick={closeEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">{editingUser.name || "Unnamed"}</p>
                  <p className="text-sm text-muted-foreground">{editingUser.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["STUDENT", "TEACHER", "ADMIN"] as const).map((role) => {
                    const cfg = ROLE_CONFIG[role];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={role}
                        type="button"
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          editRole === role
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground"
                        }`}
                        onClick={() => setEditRole(role)}
                      >
                        <Icon className="h-4 w-4" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Access</Label>
                <button
                  type="button"
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    editBanned
                      ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950"
                      : "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950"
                  }`}
                  onClick={() => setEditBanned(!editBanned)}
                >
                  <span className={`text-sm font-medium ${editBanned ? "text-red-700 dark:text-red-300" : "text-green-700 dark:text-green-300"}`}>
                    {editBanned ? "Account Banned" : "Account Active"}
                  </span>
                  <Ban className={`h-4 w-4 ${editBanned ? "text-red-600" : "text-green-600"}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={saveEdit} disabled={saving} className="flex-1">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={closeEdit}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
