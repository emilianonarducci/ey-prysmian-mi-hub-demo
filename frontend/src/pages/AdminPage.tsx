import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Shield, UserPlus, Trash2, Briefcase, Users as UsersIcon, Mail, Lock, KeyRound,
  CheckCircle2, AlertCircle, Search, X, Filter, MoreHorizontal, Pencil, Activity,
  Building2, ShieldCheck, UserCircle2, Clock, ArrowRight, Download, RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BUSINESS_UNITS, findBu } from "@/lib/bus";
import { addUser, currentSession, DemoUser, loadUsers, removeUser, Role, updateUserBu, saveUsers } from "@/lib/users";

type AdminTab = "users" | "bus" | "activity";

export default function AdminPage() {
  const session = currentSession();
  if (session.role !== "admin") return <Navigate to="/" replace />;

  const [users, setUsers] = useState<DemoUser[]>(() => loadUsers());
  const [tab, setTab] = useState<AdminTab>("users");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [buFilter, setBuFilter] = useState<string>("all");
  const [drawer, setDrawer] = useState<{ mode: "create" | "edit"; user?: DemoUser } | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  function refresh() { setUsers(loadUsers()); }
  function flash(tone: "ok" | "err", msg: string) {
    setFeedback({ tone, msg });
    setTimeout(() => setFeedback(null), 3500);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (buFilter !== "all" && (u.buId ?? "_none") !== buFilter) return false;
      if (q && ![u.email, u.displayName ?? "", u.buId ?? ""].some((v) => v.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [users, search, roleFilter, buFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    activeBus: new Set(users.map((u) => u.buId).filter(Boolean)).size,
    perBu: BUSINESS_UNITS.map((b) => ({ ...b, count: users.filter((u) => u.buId === b.id).length })),
  }), [users]);

  function onDelete(email: string) {
    if (email === session.email) { flash("err", "You cannot remove your own admin account."); return; }
    if (!confirm(`Remove ${email}?`)) return;
    removeUser(email);
    flash("ok", `${email} removed.`);
    refresh();
  }

  function onChangeBu(email: string, buId: string | null) {
    updateUserBu(email, buId);
    refresh();
  }

  function onToggleRole(email: string) {
    const u = users.find((x) => x.email === email);
    if (!u) return;
    if (u.email === session.email && u.role === "admin") { flash("err", "You can't demote your own admin account."); return; }
    const updated = users.map((x) => x.email === email ? { ...x, role: x.role === "admin" ? "user" as Role : "admin" as Role } : x);
    saveUsers(updated);
    refresh();
  }

  function exportCsv() {
    const rows = [["email", "displayName", "role", "buId"]];
    users.forEach((u) => rows.push([u.email, u.displayName ?? "", u.role, u.buId ?? ""]));
    const csv = rows.map((r) => r.map((c) => `"${(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "mi-hub-users.csv"; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 max-w-[1500px]">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-ey-navy to-ey-navy-dark text-white flex items-center justify-center shadow-card">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">User Management</h1>
            <p className="text-sm text-ink-subtle mt-0.5 flex items-center gap-2">
              <span>Signed in as</span>
              <span className="font-medium text-ink">{session.email}</span>
              <Badge tone="navy" dot>Administrator</Badge>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="btn-outline text-sm" title="Reload"><RefreshCw size={13} /></button>
          <button onClick={exportCsv} className="btn-outline text-sm"><Download size={13} /> Export</button>
          <button onClick={() => setDrawer({ mode: "create" })} className="btn-primary"><UserPlus size={14} /> Add user</button>
        </div>
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm shadow-card animate-fade-in ${
          feedback.tone === "ok" ? "bg-accent-green-light text-accent-green border border-accent-green/30" : "bg-accent-red-light text-accent-red border border-accent-red/30"
        }`}>
          {feedback.tone === "ok" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span className="font-medium">{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="ml-auto opacity-60 hover:opacity-100"><X size={13} /></button>
        </div>
      )}

      {/* Stats hero */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={<UsersIcon size={16} />} tone="navy"  label="Total users"      value={stats.total}     hint="across all BUs" />
        <KpiCard icon={<Shield size={16} />}    tone="amber" label="Administrators"   value={stats.admins}    hint="cross-functional access" />
        <KpiCard icon={<Briefcase size={16} />} tone="green" label="Active BUs"       value={stats.activeBus} hint={`of ${BUSINESS_UNITS.length} catalog units`} />
        <KpiCard icon={<KeyRound size={16} />}  tone="blue"  label="Auth provider"    value="Demo · local"    hint="Phase 1 → Azure Entra ID" stringValue />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-line">
        <TabBtn active={tab === "users"}    onClick={() => setTab("users")}    icon={<UsersIcon size={13} />}   label="Users"            count={stats.total} />
        <TabBtn active={tab === "bus"}      onClick={() => setTab("bus")}      icon={<Briefcase size={13} />}   label="Business Units"   count={BUSINESS_UNITS.length} />
        <TabBtn active={tab === "activity"} onClick={() => setTab("activity")} icon={<Activity size={13} />}    label="Activity log" />
      </div>

      {/* USERS TAB */}
      {tab === "users" && (
        <>
          {/* Filters */}
          <Card padding="sm">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-line bg-surface-muted flex-1 min-w-[220px] max-w-md">
                <Search size={14} className="text-ink-subtle" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by email, name or BU..." className="flex-1 bg-transparent outline-none text-sm" />
                {search && <button onClick={() => setSearch("")} className="text-ink-faint hover:text-ink"><X size={13} /></button>}
              </div>
              <div className="relative">
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as any)}
                  className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg border text-sm transition-colors ${roleFilter !== "all" ? "bg-prysmian-green/8 border-prysmian-green/30 text-prysmian-green font-medium" : "border-line text-ink-muted hover:bg-surface-subtle"}`}>
                  <option value="all">Role: any</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
                <Filter size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
              </div>
              <div className="relative">
                <select value={buFilter} onChange={(e) => setBuFilter(e.target.value)}
                  className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg border text-sm transition-colors ${buFilter !== "all" ? "bg-prysmian-green/8 border-prysmian-green/30 text-prysmian-green font-medium" : "border-line text-ink-muted hover:bg-surface-subtle"}`}>
                  <option value="all">BU: any</option>
                  <option value="_none">No BU assigned</option>
                  {BUSINESS_UNITS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <Filter size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
              </div>
              <span className="text-xs text-ink-subtle ml-auto">{filtered.length} of {users.length}</span>
            </div>
          </Card>

          {/* Users table */}
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-ink-subtle border-b border-line bg-surface-muted/40">
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-3 py-3 font-medium">Role</th>
                    <th className="px-3 py-3 font-medium">Business Unit</th>
                    <th className="px-3 py-3 font-medium">Last activity</th>
                    <th className="px-3 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-14 text-center">
                        <UsersIcon size={28} className="mx-auto text-ink-faint mb-2" />
                        <div className="text-sm text-ink">No users match your filters</div>
                        <button onClick={() => { setSearch(""); setRoleFilter("all"); setBuFilter("all"); }} className="btn-ghost text-xs mt-2">Clear filters</button>
                      </td>
                    </tr>
                  )}
                  {filtered.map((u) => {
                    const bu = u.buId ? findBu(u.buId) : null;
                    const isSelf = u.email === session.email;
                    return (
                      <tr key={u.email} className="border-b border-line-subtle hover:bg-surface-muted transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar email={u.email} name={u.displayName} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold text-ink truncate">{u.displayName ?? u.email.split("@")[0]}</span>
                                {isSelf && <Badge tone="blue">you</Badge>}
                              </div>
                              <div className="text-[11px] text-ink-subtle font-mono truncate">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="px-3 py-3">
                          {u.role === "admin" ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-ink-faint italic"><Building2 size={12} /> All BUs</span>
                          ) : bu ? (
                            <select value={u.buId ?? ""} onChange={(e) => onChangeBu(u.email, e.target.value || null)}
                              className="appearance-none pl-2.5 pr-7 py-1 rounded-md border border-line bg-white text-xs text-ink font-medium hover:bg-surface-subtle">
                              {BUSINESS_UNITS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                          ) : <span className="text-xs text-ink-faint italic">unassigned</span>}
                        </td>
                        <td className="px-3 py-3 text-xs text-ink-muted">
                          <span className="inline-flex items-center gap-1"><Clock size={11} /> {fakeActivity(u.email)}</span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <IconBtn onClick={() => setDrawer({ mode: "edit", user: u })} title="Edit"><Pencil size={13} /></IconBtn>
                            <IconBtn onClick={() => onToggleRole(u.email)} title={u.role === "admin" ? "Demote to user" : "Promote to admin"}><Shield size={13} /></IconBtn>
                            <IconBtn onClick={() => onDelete(u.email)} title="Remove" danger><Trash2 size={13} /></IconBtn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* BU TAB */}
      {tab === "bus" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.perBu.map((b) => (
            <Card key={b.id} padding="md" className="hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-ink-faint">{b.id}</span>
                    <Badge tone={b.hasData ? "green" : "neutral"}>{b.hasData ? "Active" : "Phase 2"}</Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-ink mt-1">{b.name}</h3>
                  <p className="text-xs text-ink-muted mt-1 line-clamp-2">{b.description}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-line-subtle flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <UsersIcon size={12} />
                  <span><b className="text-ink tabular-nums">{b.count}</b> user{b.count === 1 ? "" : "s"}</span>
                </div>
                <button onClick={() => { setTab("users"); setBuFilter(b.id); }} className="btn-ghost text-xs">
                  View users <ArrowRight size={11} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ACTIVITY TAB */}
      {tab === "activity" && (
        <Card padding="none">
          <div className="px-5 py-3.5 border-b border-line">
            <h3 className="text-sm font-semibold text-ink">Recent activity</h3>
            <p className="text-[11px] text-ink-subtle">Last 10 administrative events · demo data, wired to audit log in Phase 1</p>
          </div>
          <ul className="divide-y divide-line">
            {ACTIVITY_LOG.map((a, i) => (
              <li key={i} className="px-5 py-3 flex items-center gap-3 hover:bg-surface-muted">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.tone === "green" ? "bg-accent-green-light text-accent-green" : a.tone === "red" ? "bg-accent-red-light text-accent-red" : "bg-accent-blue-light text-accent-blue"}`}>
                  <a.icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink"><b>{a.actor}</b> {a.action} <span className="font-mono text-xs text-ink-muted">{a.target}</span></div>
                  <div className="text-[11px] text-ink-subtle">{a.when}</div>
                </div>
                <Badge tone={a.tone === "green" ? "green" : a.tone === "red" ? "red" : "blue"}>{a.type}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Drawer */}
      {drawer && (
        <UserDrawer
          mode={drawer.mode}
          user={drawer.user}
          onClose={() => setDrawer(null)}
          onSaved={(msg) => { flash("ok", msg); refresh(); setDrawer(null); }}
          onError={(msg) => flash("err", msg)}
        />
      )}
    </div>
  );
}

// ============ Drawer ============
function UserDrawer({ mode, user, onClose, onSaved, onError }: { mode: "create" | "edit"; user?: DemoUser; onClose: () => void; onSaved: (msg: string) => void; onError: (msg: string) => void }) {
  const [email, setEmail] = useState(user?.email ?? "");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [password, setPassword] = useState(user?.password ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "user");
  const [buId, setBuId] = useState<string>(user?.buId ?? "ic");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { onError("Email and password are required"); return; }
    if (!email.includes("@")) { onError("Enter a valid email"); return; }
    const finalBu = role === "admin" ? null : buId;
    if (mode === "create") {
      const r = addUser({ email: email.trim(), password, displayName: displayName.trim() || undefined, buId: finalBu, role });
      if (!r.ok) { onError(r.error || "Failed to add user"); return; }
      onSaved(`User ${email} created.`);
    } else if (user) {
      // edit: replace by email
      const all = loadUsers().map((u) => u.email === user.email ? { ...u, displayName: displayName || undefined, password, role, buId: finalBu } : u);
      saveUsers(all);
      onSaved(`User ${email} updated.`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-ey-navy/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white h-full shadow-elevated overflow-y-auto animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-line px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-prysmian-green/10 text-prysmian-green flex items-center justify-center">
              {mode === "create" ? <UserPlus size={16} /> : <Pencil size={16} />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-ink">{mode === "create" ? "Add user" : "Edit user"}</h3>
              <p className="text-[11px] text-ink-subtle">{mode === "create" ? "Grant access to MI Hub" : user?.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-subtle hover:text-ink"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <DrawerField icon={<Mail size={13} />} label="Email">
            <input type="email" disabled={mode === "edit"} required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@prysmian.com" className="input disabled:opacity-60" />
          </DrawerField>
          <DrawerField icon={<UserCircle2 size={13} />} label="Display name">
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Sales Manager — Italy" className="input" />
          </DrawerField>
          <DrawerField icon={<Lock size={13} />} label="Password">
            <input type="text" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="set a temporary password" className="input font-mono" />
            <p className="text-[10px] text-ink-faint mt-1">Demo only — Phase 1 delegates auth to Azure Entra ID.</p>
          </DrawerField>
          <DrawerField icon={<Shield size={13} />} label="Role">
            <div className="grid grid-cols-2 gap-2">
              <RoleOption active={role === "user"}  onClick={() => setRole("user")}  title="User"  desc="BU-scoped dashboard & data" />
              <RoleOption active={role === "admin"} onClick={() => setRole("admin")} title="Admin" desc="Cross-functional, manage users" />
            </div>
          </DrawerField>
          {role === "user" && (
            <DrawerField icon={<Briefcase size={13} />} label="Business Unit">
              <select value={buId} onChange={(e) => setBuId(e.target.value)} className="input">
                {BUSINESS_UNITS.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}{b.hasData ? "" : " · Phase 2"}</option>
                ))}
              </select>
              <p className="text-[10px] text-ink-faint mt-1">Determines the personalized dashboard content shown after login.</p>
            </DrawerField>
          )}
          <div className="pt-4 flex gap-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">
              <CheckCircle2 size={14} /> {mode === "create" ? "Create user" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============ Small components ============
function KpiCard({ icon, label, value, hint, tone, stringValue }: { icon: React.ReactNode; label: string; value: number | string; hint?: string; tone: "navy" | "amber" | "green" | "blue"; stringValue?: boolean }) {
  const colors: Record<typeof tone, string> = {
    navy: "bg-ey-navy text-white",
    amber: "bg-accent-amber-light text-accent-amber",
    green: "bg-accent-green-light text-accent-green",
    blue: "bg-accent-blue-light text-accent-blue",
  } as any;
  return (
    <Card padding="md" className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-ink-subtle font-medium">{label}</div>
          <div className={`${stringValue ? "text-base" : "text-3xl"} font-bold tabular-nums text-ink mt-1.5`}>{value}</div>
          {hint && <div className="text-[11px] text-ink-subtle mt-1">{hint}</div>}
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[tone]}`}>{icon}</div>
      </div>
    </Card>
  );
}

function TabBtn({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count?: number }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
      active ? "border-prysmian-green text-prysmian-green" : "border-transparent text-ink-subtle hover:text-ink"
    }`}>
      {icon}
      {label}
      {count != null && <span className={`chip text-[10px] ${active ? "bg-prysmian-green text-white" : "bg-surface-subtle text-ink-muted"}`}>{count}</span>}
    </button>
  );
}

function Avatar({ email, name }: { email: string; name?: string }) {
  const initials = (name ?? email.split("@")[0]).split(/[\s.]+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const palette = ["#0F1B3D", "#00875A", "#2563EB", "#F5A623", "#7B61FF", "#D14343"];
  let h = 0; for (const c of email) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const color = palette[h % palette.length];
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-card" style={{ backgroundColor: color }}>
      {initials}
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  if (role === "admin") return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-ey-navy text-white">
      <ShieldCheck size={11} /> Admin
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-surface-subtle text-ink-muted">
      <UserCircle2 size={11} /> User
    </span>
  );
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title?: string; danger?: boolean }) {
  return (
    <button onClick={onClick} title={title} className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
      danger ? "text-ink-faint hover:text-accent-red hover:bg-accent-red-light" : "text-ink-faint hover:text-ink hover:bg-surface-subtle"
    }`}>
      {children}
    </button>
  );
}

function DrawerField({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-ink-subtle mb-1.5">{icon}<span>{label}</span></div>
      {children}
    </div>
  );
}

function RoleOption({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button type="button" onClick={onClick} className={`text-left px-3 py-2.5 rounded-lg border-2 transition-colors ${
      active ? "border-prysmian-green bg-prysmian-green/5" : "border-line hover:border-line-strong"
    }`}>
      <div className={`text-sm font-semibold ${active ? "text-prysmian-green" : "text-ink"}`}>{title}</div>
      <div className="text-[11px] text-ink-subtle mt-0.5">{desc}</div>
    </button>
  );
}

// Deterministic "last activity" string per user
function fakeActivity(email: string): string {
  let h = 0; for (const c of email) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const mins = h % 4320; // up to 3 days
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

const ACTIVITY_LOG = [
  { icon: UserPlus,   tone: "green", type: "create",  actor: "EY Demo Admin", action: "created user",            target: "ic.user@prysmian.com",   when: "Today · 09:14" },
  { icon: Pencil,     tone: "blue",  type: "update",  actor: "EY Demo Admin", action: "reassigned BU for",       target: "automotive.user@prysmian.com → Automotive", when: "Today · 09:18" },
  { icon: Shield,     tone: "blue",  type: "role",    actor: "EY Demo Admin", action: "promoted",                target: "mining.user@prysmian.com to Admin", when: "Yesterday · 17:42" },
  { icon: Trash2,     tone: "red",   type: "delete",  actor: "EY Demo Admin", action: "removed",                 target: "legacy@prysmian.com",    when: "Yesterday · 16:05" },
  { icon: Download,   tone: "blue",  type: "export",  actor: "EY Demo Admin", action: "exported user CSV",       target: "mi-hub-users.csv",       when: "2 days ago" },
  { icon: KeyRound,   tone: "blue",  type: "auth",    actor: "System",        action: "rotated demo password for", target: "automotive.user@prysmian.com", when: "3 days ago" },
] as const;
